// The real world, for an island with a zip code (docs/ROADMAP.md, "The real world, by zip code"): where the zip code
// is, its time zone, that day's forecast and some headlines (local and from the world), from free services that need
// no key (zippopotam.us, open-meteo.com, news feeds), kept for the day so each zip code is looked up once a day at most.
// And the market: a few real companies' daily prices (Yahoo Finance's public chart data, the same with Yahoo's cookie,
// Nasdaq's price history or stooq.com, whichever answers), kept for the day too. Nothing is stored on disk.
// WORLD_FAKE=1 answers with made-up data and never touches the network (the tests, and working without internet).

const TIMEOUT = 8000;
const cache = new Map(); // key -> { day, data }

export class WorldError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

const today = () => new Date().toISOString().slice(0, 10);

async function get(url, as = 'json', agent = 'SarahCrossing/1 (a private game for one island)', more = {}) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), TIMEOUT);
  try {
    const res = await fetch(url, { signal: ctl.signal, headers: { 'user-agent': agent, accept: as === 'json' ? 'application/json' : 'text/csv,text/plain,*/*', ...more } });
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

// The world's headlines don't need a zip code (David, 29 October: the paper had none without one): the first of these
// feeds that answers, kept an hour, or ten minutes when none did so a bad moment doesn't leave the paper empty all day.
const NEWS_FEEDS = ['https://feeds.npr.org/1001/rss.xml', 'https://feeds.bbci.co.uk/news/world/rss.xml', 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml'];
let newsCache = null; // { at, list }
export async function headlines() {
  if (process.env.WORLD_FAKE) return ['Scientists name a new kind of very small frog', 'A long-lost painting turns up in an attic'];
  if (newsCache && Date.now() - newsCache.at < (newsCache.list.length ? 3600e3 : 600e3)) return newsCache.list;
  let list = [];
  for (const u of NEWS_FEEDS) {
    list = await get(u, 'text').then((x) => feedTitles(x, 5), () => []);
    if (list.length) break;
  }
  newsCache = { at: Date.now(), list };
  return list;
}

/** Everything the island needs about a zip code today. */
export async function world(zip) {
  zip = String(zip || '');
  if (!/^\d{5}$/.test(zip)) throw new WorldError(400, 'A zip code is five digits');
  const key = 'w:' + zip, hit = cache.get(key);
  if (hit && hit.day === today()) {
    // (headlines that didn't come in this morning are tried again)
    if (!hit.data.fake && !hit.data.news.world.length) hit.data.news.world = await headlines();
    return hit.data;
  }
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
  const worldNews = await headlines();
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

/** Yahoo Finance's chart data (JSON) as { closes, dates }: the trading days with a close, oldest first. */
export function yahooCloses(json, n = 60) {
  const r = json && json.chart && json.chart.result && json.chart.result[0];
  const ts = (r && r.timestamp) || [], c = (r && r.indicators && r.indicators.quote && r.indicators.quote[0] && r.indicators.quote[0].close) || [];
  const rows = [];
  for (let i = 0; i < ts.length; i++) if (typeof c[i] === 'number' && c[i] > 0) rows.push([new Date(ts[i] * 1000).toISOString().slice(0, 10), Math.round(c[i] * 100) / 100]);
  const keep = rows.slice(-n);
  return { closes: keep.map((x) => x[1]), dates: keep.map((x) => x[0]) };
}
/** stooq's daily CSV (Date,Open,High,Low,Close,Volume) as { closes, dates }; anything else (a "no data" page, a limit notice) gives none. */
export function stooqCloses(csv, n = 60) {
  const lines = String(csv || '').trim().split('\n');
  if (!/^date,/i.test(lines[0] || '')) return { closes: [], dates: [] };
  const rows = lines.slice(1).map((l) => l.trim().split(',')).filter((r) => r.length >= 5 && /^\d{4}-\d\d-\d\d$/.test(r[0]) && Number(r[4]) > 0).slice(-n);
  return { closes: rows.map((r) => Number(r[4])), dates: rows.map((r) => r[0]) };
}
/** Nasdaq's price history (JSON, newest first, "$227.48" and "10/28/2026") as { closes, dates }, oldest first. */
export function nasdaqCloses(json, n = 60) {
  const rows = (json && json.data && json.data.tradesTable && json.data.tradesTable.rows) || [];
  const out = [];
  for (const r of rows) {
    const m = /^(\d\d)\/(\d\d)\/(\d{4})$/.exec(String(r && r.date || '')), c = Number(String(r && r.close || '').replace(/[$,\s]/g, ''));
    if (m && c > 0) out.push([`${m[3]}-${m[1]}-${m[2]}`, Math.round(c * 100) / 100]);
  }
  const keep = out.sort((a, b) => (a[0] < b[0] ? -1 : 1)).slice(-n);
  return { closes: keep.map((x) => x[1]), dates: keep.map((x) => x[0]) };
}
const BROWSER = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
/* Yahoo answers servers more readily with its own cookie and the crumb that goes with it (what a browser gets on its
   first visit): asked for once an hour at most */
let crumb = null;
async function yahooCrumb() {
  if (crumb && Date.now() - crumb.at < 3600e3) return crumb;
  const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), TIMEOUT);
  try {
    const first = await fetch('https://fc.yahoo.com/', { signal: ctl.signal, redirect: 'manual', headers: { 'user-agent': BROWSER } });
    const set = first.headers.getSetCookie ? first.headers.getSetCookie() : [first.headers.get('set-cookie') || ''];
    const cookie = set.map((c) => c.split(';')[0]).filter(Boolean).join('; ');
    if (!cookie) throw new WorldError(502, 'No cookie');
    const res = await fetch('https://query2.finance.yahoo.com/v1/test/getcrumb', { signal: ctl.signal, headers: { 'user-agent': BROWSER, cookie } });
    const c = (await res.text()).trim();
    if (!res.ok || !c || c.length > 40 || /[<{]/.test(c)) throw new WorldError(502, `The service answered ${res.status}`);
    crumb = { cookie, crumb: c, at: Date.now() };
    return crumb;
  } catch (err) {
    throw err instanceof WorldError ? err : new WorldError(502, "The service isn't answering");
  } finally {
    clearTimeout(t);
  }
}
const ymd = (ms) => new Date(ms).toISOString().slice(0, 10);
/* where the prices come from, each tried in turn for a company; a service that answers goes first for the rest of the day */
const SOURCES = {
  yahoo: async (sym) => yahooCloses(await get(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?range=6mo&interval=1d`, 'json', BROWSER)),
  yahooCrumb: async (sym) => {
    const c = await yahooCrumb();
    return yahooCloses(await get(`https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?range=6mo&interval=1d&crumb=${encodeURIComponent(c.crumb)}`, 'json', BROWSER, { cookie: c.cookie }));
  },
  nasdaq: async (sym) => nasdaqCloses(await get(`https://api.nasdaq.com/api/quote/${encodeURIComponent(sym)}/historical?assetclass=stocks&fromdate=${ymd(Date.now() - 120 * 864e5)}&todate=${ymd(Date.now())}&limit=90`,
    'json', BROWSER, { origin: 'https://www.nasdaq.com', referer: 'https://www.nasdaq.com/', 'accept-language': 'en-US,en;q=0.9' })),
  stooq: async (sym, code) => stooqCloses(await get(`https://stooq.com/q/d/l/?s=${code}&i=d`, 'text')),
};
let best = { day: '', src: '' };
async function closesOf(sym, code, why, used) {
  const order = Object.keys(SOURCES).sort((a, b) => (b === best.src && best.day === today()) - (a === best.src && best.day === today()));
  for (const src of order) {
    try {
      const r = await SOURCES[src](sym, code);
      if (r.closes.length >= 2) { best = { day: today(), src }; used[src] = (used[src] || 0) + 1; return r; }
      why[src] = 'no prices';
    } catch (err) {
      why[src] = err.message || String(err);
    }
  }
  throw new WorldError(502, 'No prices');
}

/** The last 60 trading days of each company's closing price: every company asked for at once. When nothing answers,
    that's remembered for ten minutes (the Bank asks again once a minute), and the log says what each service said. */
let failed = null;
export async function market() {
  const hit = cache.get('market');
  if (hit && hit.day === today()) return hit.data;
  if (process.env.WORLD_FAKE) return fakeMarket();
  if (failed && Date.now() - failed.at < 10 * 60e3) {
    if (hit) return { ...hit.data, old: true };
    throw new WorldError(502, "The market data service isn't answering");
  }
  const why = {}, used = {};
  const got = await Promise.all(STOCKS.map(async ([sym, name, code, yld]) => {
    try { const { closes, dates } = await closesOf(sym, code, why, used); return { sym, name, yield: yld, closes, dates }; }
    catch { return null; }   // (one company missing is fine)
  }));
  const stocks = got.filter(Boolean);
  const said = Object.entries(why).map(([k, v]) => `${k}: ${v}`).join('; ');
  if (stocks.length) console.log(`market: prices for ${stocks.length} of ${STOCKS.length} companies (${Object.entries(used).map(([k, v]) => `${k} ${v}`).join(', ')})${said ? ' · ' + said : ''}`);
  else console.warn(`market: no prices from any service (${said})`);
  if (!stocks.length) {
    failed = { at: Date.now(), why };
    if (hit) return { ...hit.data, old: true };
    throw new WorldError(502, "The market data service isn't answering");
  }
  failed = null;
  const data = { stocks, at: Date.now() };
  cache.set('market', { day: today(), data });
  return data;
}
