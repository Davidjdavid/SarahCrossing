/* ---- 6zzp_hud.js ---- */
/* What's on screen, as each device likes it (1 November): the time card, the sand dollars, the buttons at the top, the
   key hints and the dock, each Always, When still (it fades away while Sarah walks and comes back after a second or two
   of standing still) or Hidden. Kept per device (localStorage sc-hud). On a touch screen the dock is never hidden: it's
   the way into the phone, and so into Settings, so there it's Always or When still. */
const HUD_PARTS = [
    ['time', 'Time, date and weather', '#hudL .hud-status'],
    ['money', 'Sand dollars', '#hudR .pill.money'],
    ['buttons', 'Run, map and zoom buttons', '#hudR .hud-mini'],
    ['keys', 'Key hints', '#hint'],
    ['dock', 'Tools, Moves, Pocket and Phone', '#hudB'],
];
const HUD_MODES = [['on', 'Always'], ['still', 'When still'], ['off', 'Hidden']];
const HUD_STILL_MS = 1500;           // how long standing still before what fades comes back
const HudPrefs = {
    away: false, movedAt: 0, applied: false,
    get() { try { const v = JSON.parse(lsGet('sc-hud') || '{}'); return v && typeof v === 'object' ? v : {}; } catch (e) { return {}; } },
    touch() { return !!(G.touchUsed || (window.matchMedia && matchMedia('(pointer: coarse)').matches)); },
    /* a part's mode on this device (the dock on a touch screen at most fades) */
    mode(id) {
        const m = this.get()[id];
        const ok = HUD_MODES.some(x => x[0] === m) ? m : 'on';
        return id === 'dock' && ok === 'off' && this.touch() ? 'still' : ok;
    },
    modes(id) { return id === 'dock' && this.touch() ? HUD_MODES.filter(x => x[0] !== 'off') : HUD_MODES; },
    set(id, m) { const P = this.get(); P[id] = m; lsSet('sc-hud', JSON.stringify(P)); this.apply(); },
    apply() {
        this.applied = true;
        for (const [id, , sel] of HUD_PARTS) {
            const e = $(sel);
            if (!e) continue;
            const m = this.mode(id);
            e.classList.toggle('hud-off', m === 'off');
            e.classList.toggle('hud-still', m === 'still');
        }
    },
    /* walking (or a tap's walk under way), or only just stopped: what fades is away */
    tick() {
        if (!this.applied) this.apply();
        const p = G.player, moving = !!(p && G.mode === 'play' && (p.moving || (p.path && p.path.length)));
        const now = performance.now();
        if (moving) this.movedAt = now;
        const away = moving || now - this.movedAt < HUD_STILL_MS;
        if (away !== this.away) { this.away = away; document.body.classList.toggle('hud-moving', away); }
    },
};
setInterval(() => { try { HudPrefs.tick(); } catch (e) { /* the page isn't ready yet */ } }, 100);

/* Settings: a row for each part, its mode picked from chips */
function hudSetting() {
    const box = el('div', 'field');
    box.style.marginTop = '14px';
    box.appendChild(el('span', null, 'On screen'));
    const list = el('div');
    const draw = () => {
        list.innerHTML = '';
        for (const [id, label] of HUD_PARTS) {
            // (the key hints only show with a keyboard)
            if (id === 'keys' && HudPrefs.touch()) continue;
            const r = el('div');
            r.style.cssText = 'margin:6px 0 2px';
            r.appendChild(el('b', null, label)).style.cssText = 'display:block;font-size:13px;margin-bottom:3px';
            const row = el('div', 'st-row');
            row.dataset.hud = id;
            for (const [m, name] of HudPrefs.modes(id)) row.appendChild(chip(name, () => { HudPrefs.set(id, m); Sfx.ui('tick'); draw(); }, HudPrefs.mode(id) === m ? 'on' : ''));
            r.appendChild(row);
            list.appendChild(r);
        }
    };
    draw();
    box.appendChild(list);
    box.appendChild(el('p', 'muted', 'When still: it fades away while you walk and comes back after a second or two of standing still.' + (HudPrefs.touch() ? ' The phone buttons can fade but never hide: they open Settings.' : ' Hidden things are still on their keys (P for the phone, I for the pocket, M for the map).')));
    return box;
}
