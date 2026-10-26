// The real world, for an island with a zip code (docs/ROADMAP.md, "The real world, by zip code"): where the zip code
// is, its time zone, that day's forecast and some headlines (local and from the world), from free services that need
// no key (zippopotam.us, open-meteo.com, news feeds), kept for the day so each zip code is looked up once a day at most.
// And the market: a few real companies' daily prices (stooq.com), kept for the day too. Nothing is stored on disk.
// WORLD_FAKE=1 answers with made-up data and never touches the network (the tests, and working without internet).

const TIMEOUT = 8000;
const cache = new Map(); // key -> { day, data }

export class WorldError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

const today = () => new Date().toISOString().slice(0, 10);

async function get(url, as = 'json') {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), TIMEOUT);
  try {
    const res = await fetch(url, { signal: ctl.signal, headers: { 'user-agent': 'SarahCrossing/1 (a private game for one island)' } });
    if (res.status === 404) throw new WorldError(404, 'Not found');
    if (!res.ok) throw new WorldError(502, `The service answered ${res.status}`);
    return as === 'json' ? await res.json() : await res.text();
  } catch (err) {
    if (err instanceof WorldError) throw err;
    throw new WorldError(502, "The service isn't answering");
  } finally {
    clearTimeout(t);
  }
}

/** The weather codes open-meteo uses (WMO), as the game's four kinds of day. */
export function skyOf(code) {
  if ([71, 73, 75, 77, 85, 86].includes(code)) return 'snow';
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82) || code >= 95) return 'rain';
  if (code >= 2) return 'cloudy';
  return 'sunny';
}

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", '#39': "'", nbsp: ' ' };
/** The titles of a news feed's items (RSS), tidied: no markup, no " - Source" tail. */
export function feedTitles(xml, n = 6) {
  const out = [];
  for (const m of String(xml).matchAll(/<item\b[\s\S]*?<title>([\s\S]*?)<\/title>/g)) {
    let t = m[1].replace(/^<!\[CDATA\[|\]\]>$/g, '').replace(/<[^>]+>/g, '');
    t = t.replace(/&(#\d+|\w+);/g, (x, k) => ENTITIES[k] ?? (k[0] === '#' ? String.fromCharCode(+k.slice(1)) : x)).trim();
    t = t.replace(/\s+-\s+[^-]{2,40}$/, '');
    if (t && !out.includes(t)) out.push(t);
    if (out.length >= n) break;
  }
  return out;
}

function hash(s) { let h = 2166136261; for (const c of String(s)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; }

function fakeWorld(zip) {
  const h = hash(zip), skies = ['sunny', 'cloudy', 'rain', 'sunny', 'snow'];
  if (zip === '00000') throw new WorldError(404, 'Not found');
  const d0 = new Date(), days = [0, 1].map((i) => {
    const d = new Date(d0.getTime() + i * 864e5);
    return { date: d.toISOString().slice(0, 10), sky: skies[(h + i) % skies.length], hi: 50 + (h % 30), lo: 35 + (h % 20) };
  });
  return {
    zip, place: zip === '02134' ? 'Allston' : 'Springfield', state: zip === '02134' ? 'MA' : 'IL', tz: 'America/New_York', offset: -240,
    days, news: { local: ['A city park plants 500 new trees', 'The library stays open late on Fridays now'], world: ['Scientists name a new kind of very small frog', 'A long-lost painting turns up in an attic'] }, at: Date.now(), fake: true,
  };
}

/** Everything the island needs about a zip code today. */
export async function world(zip) {
  zip = String(zip || '');
  if (!/^\d{5}$/.test(zip)) throw new WorldError(400, 'A zip code is five digits');
  const key = 'w:' + zip, hit = cache.get(key);
  if (hit && hit.day === today()) return hit.data;
  if (process.env.WORLD_FAKE) return fakeWorld(zip);
  const z = await get(`https://api.zippopotam.us/us/${zip}`);
  const pl = z && z.places && z.places[0];
  if (!pl) throw new WorldError(404, 'Not found');
  const lat = Number(pl.latitude), lon = Number(pl.longitude), place = pl['place name'], state = pl['state abbreviation'];
  const w = await get(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=2&temperature_unit=fahrenheit`);
  const D = w.daily || {};
  const days = (D.time || []).map((date, i) => ({ date, sky: skyOf(D.weathercode[i]), code: D.weathercode[i], hi: Math.round(D.temperature_2m_max[i]), lo: Math.round(D.temperature_2m_min[i]) }));
  // the headlines are a bonus: no news is still a world
  const local = await get(`https://news.google.com/rss/search?q=${encodeURIComponent(`"${place}" ${state}`)}&hl=en-US&gl=US&ceid=US:en`, 'text').then((x) => feedTitles(x, 5), () => []);
  const worldNews = await get('https://feeds.npr.org/1001/rss.xml', 'text').then((x) => feedTitles(x, 5), () => []);
  const data = { zip, place, state, tz: w.timezone, offset: Math.round((w.utc_offset_seconds || 0) / 60), days, news: { local, world: worldNews }, at: Date.now() };
  cache.set(key, { day: today(), data });
  return data;
}

/** The companies on the island's market: ticker, name, stooq's symbol, about how much they pay out a year. */
export const STOCKS = [['AAPL', 'Apple', 'aapl.us', 0.005], ['KO', 'Coca-Cola', 'ko.us', 0.03], ['MAT', 'Mattel', 'mat.us', 0], ['NKE', 'Nike', 'nke.us', 0.018],
  ['SBUX', 'Starbucks', 'sbux.us', 0.025], ['TM', 'Toyota', 'tm.us', 0.025], ['NTDOY', 'Nintendo', 'ntdoy.us', 0.015], ['NFLX', 'Netflix', 'nflx.us', 0]];

function fakeMarket() {
  return { stocks: STOCKS.map(([sym, name, , yld]) => {
    let p = 20 + (hash(sym) % 300);
    const closes = [], dates = [];
    for (let i = 59; i >= 0; i--) { p = Math.max(1, p * (1 + ((hash(sym + i) % 1000) / 1000 - 0.48) * 0.04)); closes.push(Math.round(p * 100) / 100); dates.push(new Date(Date.now() - i * 864e5).toISOString().slice(0, 10)); }
    return { sym, name, yield: yld, closes, dates };
  }), at: Date.now(), fake: true };
}

/** The last 60 trading days of each company's closing price. */
export async function market() {
  const hit = cache.get('market');
  if (hit && hit.day === today()) return hit.data;
  if (process.env.WORLD_FAKE) return fakeMarket();
  const stocks = [];
  for (const [sym, name, code, yld] of STOCKS) {
    try {
      const csv = await get(`https://stooq.com/q/d/l/?s=${code}&i=d`, 'text');
      const rows = csv.trim().split('\n').slice(1).map((l) => l.split(',')).filter((r) => r.length >= 5 && !Number.isNaN(Number(r[4]))).slice(-60);
      if (rows.length) stocks.push({ sym, name, yield: yld, closes: rows.map((r) => Number(r[4])), dates: rows.map((r) => r[0]) });
    } catch { /* one company missing is fine */ }
  }
  if (!stocks.length) {
    if (hit) return { ...hit.data, old: true };
    throw new WorldError(502, "The market data service isn't answering");
  }
  const data = { stocks, at: Date.now() };
  cache.set('market', { day: today(), data });
  return data;
}
