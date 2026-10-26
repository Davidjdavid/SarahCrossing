/* ---- 10_time.js ---- */
/* Island time: the real clock shifted by however much Sarah likes (three hours behind to start with; she can set it in
   Settings). It keeps ticking along with the real clock. The day rolls over at 5 AM island time. */
const HOUR = 3600e3;
const CLOCK_SHIFT_DEFAULT = -180;            // minutes
const Clock = {
    offsetMs: 0,                 // test hook only
    real() { return new Date(Date.now() + this.offsetMs); },
    shiftMin() { return S && S.settings && S.settings.clockShift != null ? S.settings.clockShift : CLOCK_SHIFT_DEFAULT; },
    island() { return new Date(Date.now() + this.offsetMs + this.shiftMin() * 60e3); },
    hourF() { const d = this.island(); return d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600; },
    dayDate() { return new Date(this.island().getTime() - 5 * HOUR); },
    dayNum() { const d = this.dayDate(); return Math.round(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400e3); },
    weekday() { return this.dayDate().getDay(); },
    month() { return this.dayDate().getMonth() + 1; },
    date() { return this.dayDate().getDate(); },
    fmt(d) {
        d = d || this.island();
        let h = d.getHours(); const m = d.getMinutes();
        const ap = h < 12 ? 'AM' : 'PM';
        h = h % 12 || 12;
        return { t: `${h}:${String(m).padStart(2, '0')}`, ap, s: `${h}:${String(m).padStart(2, '0')} ${ap}` };
    },
    season() {
        const m = this.month();
        return m >= 3 && m <= 5 ? 'spring' : m >= 6 && m <= 8 ? 'summer' : m >= 9 && m <= 11 ? 'fall' : 'winter';
    },
    dateLine() {
        const d = this.dayDate();
        const wd = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d.getDay()];
        const mo = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()];
        return `${wd}, ${mo} ${d.getDate()}`;
    },
};
/* set the island clock to a time of day (hours 0-23, minutes); it keeps running from there */
function setIslandTime(h, m) {
    const now = Clock.real();
    const cur = Clock.shiftMin();
    const want = h * 60 + m, have = now.getHours() * 60 + now.getMinutes();
    let shift = want - have;                                   // minutes, within a day
    // of the shifts that show this time (a day apart), take the one nearest the current setting
    while (shift - cur > 720) shift -= 1440;
    while (cur - shift > 720) shift += 1440;
    if (!S.settings) S.settings = {};
    S.settings.clockShift = shift;
    Save.touch();
    return shift;
}
/* a day number (Clock.dayNum) as a date: "July 14" */
function dayLabel(n) { const d = new Date(n * 86400e3); return MONTHS[d.getUTCMonth()] + ' ' + d.getUTCDate(); }
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const LUNAR_NEW_YEAR = { 2026: [2, 17], 2027: [2, 6], 2028: [1, 26], 2029: [2, 13], 2030: [2, 3], 2031: [1, 23], 2032: [2, 11],
    2033: [1, 31], 2034: [2, 19], 2035: [2, 8] };

/* what's special about today (island date) */
function todayEvents() {
    const d = Clock.dayDate();
    const ev = new Set(holidaysToday().map(h => h.id));
    if (d.getMonth() === 5 || d.getMonth() === 6) ev.add('fireflies');
    refreshHolidayChat();
    return ev;
}

/* weather is decided once per island day */
function todayWeather() {
    // a registered zip code: that town's forecast for the day (6zh_world.js)
    const zd = S && S.zip && S.zip.days && S.zip.days[Clock.dayNum()];
    if (zd && CIVIC_PREVIEW) return zd.sky;
    const r = mulberry(hash32((S.seed || 'x') + ':w:' + Clock.dayNum()));
    const season = Clock.season();
    const x = r();
    if (season === 'winter') return x < 0.28 ? 'snow' : x < 0.5 ? 'cloudy' : 'sunny';
    if (season === 'spring') return x < 0.2 ? 'rain' : x < 0.38 ? 'cloudy' : 'sunny';
    if (season === 'summer') return x < 0.12 ? 'rain' : x < 0.24 ? 'cloudy' : 'sunny';
    return x < 0.18 ? 'rain' : x < 0.4 ? 'cloudy' : 'sunny';
}

/* light over the island for a given island hour: tint colour + strength, and how lit the lamps are */
const LIGHT_KEYS = [
    [0, [20, 26, 64], 0.58], [5.0, [20, 26, 64], 0.56], [6.0, [92, 70, 140], 0.42], [6.8, [240, 130, 120], 0.28],
    [7.0, [255, 150, 110], 0.24], [7.8, [255, 200, 150], 0.11], [8.6, [255, 230, 200], 0.0], [16.6, [255, 230, 200], 0.0], [17.8, [255, 176, 90], 0.14], [19.0, [255, 120, 110], 0.24],
    [19.8, [90, 62, 140], 0.40], [21.0, [20, 26, 64], 0.56], [24, [20, 26, 64], 0.58],
];
function lightAt(h, weather) {
    let a = LIGHT_KEYS[0], b = LIGHT_KEYS[LIGHT_KEYS.length - 1];
    for (let i = 0; i < LIGHT_KEYS.length - 1; i++) {
        if (h >= LIGHT_KEYS[i][0] && h <= LIGHT_KEYS[i + 1][0]) { a = LIGHT_KEYS[i]; b = LIGHT_KEYS[i + 1]; break; }
    }
    const t = (h - a[0]) / Math.max(0.0001, b[0] - a[0]);
    const col = [0, 1, 2].map(i => Math.round(lerp(a[1][i], b[1][i], t)));
    let alpha = lerp(a[2], b[2], t);
    let gray = 0;
    if (weather === 'rain') gray = 0.22;
    else if (weather === 'cloudy') gray = 0.1;
    else if (weather === 'snow') gray = 0.08;
    const lamps = clamp((alpha - 0.18) / 0.22, 0, 1);
    const night = h >= 20.5 || h < 5.5;
    return { col, alpha, gray, lamps, night };
}

