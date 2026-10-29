/* ---- 6w_extras.js ---- */
/* Stage 11: the Music app, Save & quit, the island's name, cheat mode and the spoiler guide, fresh food, cooking from
   the house storage, leaving minigames early, names and notes for paintings and pottery, the museum pedestals, the
   club's Dance / Karaoke / Just watch lists, favors by text, neighbors who text first, and the sea around the map. */

/* ---------------------------------------------------------------- fresh food and the kitchen */
/* Food Sarah cooks, and food from Mac's (or Basil's cart), is "fresh": eating it always gives a boost. Fresh counts live
   apart from the pocket, so a stack can be part fresh; selling or giving food away uses up the store-bought ones first. */
function ownedCount(id) { return pocketCount(id) + ((S && S.storage && S.storage[id]) || 0); }
function freshCount(id) { return Math.min((S && S.fresh && S.fresh[id]) || 0, ownedCount(id)); }
function markFresh(id, n) {
    if (!S.fresh) S.fresh = {};
    S.fresh[id] = Math.min(ownedCount(id), (S.fresh[id] || 0) + (n || 1));
    Save.touch();
}
function useFresh(id) {
    const n = freshCount(id);
    if (!S.fresh) return false;
    if (n <= 0) { delete S.fresh[id]; return false; }
    S.fresh[id] = n - 1;
    if (!S.fresh[id]) delete S.fresh[id];
    return true;
}
/* the stove counts what's in the pocket and in the house storage, and uses the pocket first */
function kitchenCount(id) { return ownedCount(id); }
function useIngredient(id, n) {
    const fromPocket = Math.min(n, pocketCount(id));
    if (fromPocket) removeItem(id, fromPocket);
    const rest = n - fromPocket;
    if (rest > 0 && S.storage[id]) { S.storage[id] = Math.max(0, S.storage[id] - rest); if (!S.storage[id]) delete S.storage[id]; }
    Save.touch();
}

/* ---------------------------------------------------------------- the Leave button, and what's playing */
const Extras = {
    leaveEl: null,
    tick() {
        if (G.frame % 10 === 0) this.leave();
        if (G.frame % 10 === 5) {
            const game = Fishing.st ? 'fishing' : Rope.on ? 'rope' : Studio.on && Studio.kind ? Studio.kind : null;
            if (game !== Music.game) { Music.game = game; Music.update(false); }
        }
        if (G.frame % 300 === 150) Invites.tick();
        if (G.frame % 120 === 60) Invites.nudge();
    },
    /* the minigame that's running now, and how to leave it */
    active() {
        if (Dance.on && Dance.ready) return ['Leave', () => Dance.quit()];
        if (Karaoke.on && Karaoke.ready) return ['Leave', () => Karaoke.quit()];
        if (Rope.on && Rope.state !== 'done') return ['Leave', () => Rope.quit()];
        if (IslandGames.on && (IslandGames.on.phase === 'play' || (IslandGames.on.phase === 'count' && !G.busy))) return ['Stop playing', () => IslandGames.quit()];
        if (FriendTag.on) return ['Stop playing', () => FriendTag.quit()];
        if (Fishing.st) return ['Stop fishing', () => Fishing.stop()];
        return null;
    },
    leave() {
        const a = G.mode === 'play' ? this.active() : null;
        let b = this.leaveEl;
        if (!a) { if (b && !b.hidden) b.hidden = true; return; }
        if (!b) {
            b = this.leaveEl = el('button', 'mbtn', '');
            b.id = 'leaveBtn'; b.type = 'button';
            b.addEventListener('pointerdown', ev => ev.stopPropagation());
            b.addEventListener('click', ev => { ev.stopPropagation(); const x = this.active(); if (x) { Sfx.ui('close'); x[1](); } b.blur(); this.leave(); });
            $('#ui').appendChild(b);
        }
        const txt = '\u2715 ' + a[0];
        if (b.textContent !== txt) b.textContent = txt;
        b.hidden = false;
    },
};

/* ---------------------------------------------------------------- the Music app */
const TRACK_NAMES = {
    morning: 'Island morning', midday: 'Island midday', afternoon: 'Island afternoon', evening: 'Island evening', night: 'Island night',
    late: 'Late, late night', sunrise: 'Sunrise at sea', home: 'Home sweet home', house: "A neighbor's house", shop: "Fortune's shop",
    boutique: "Clementine's boutique", restaurant: "Mac's", studio: 'The pottery studio', museum: 'The museum', workshop: "Ginger's workshop",
    arcade: 'The arcade', clubday: 'Club Wasabi (daytime)', cooking: 'Cooking', blocks: 'Bento Blocks', capsules: 'Spice Capsules',
    fruit: 'Fruit Catch', stack: 'Snack Stack',
};
const MUSIC_PLACES = [['island', 'Outside on the island'], ['home', 'Your house'], ['shop', "Fortune's shop"], ['boutique', "Clementine's boutique"],
    ['restaurant', "Mac's"], ['studio', "Sully's Pottery"], ['arcade', 'The Arcade'], ['museum', 'The Museum'], ['club', 'Club Wasabi'],
    ['salon', 'Floss & Gloss'], ['builder', "Ginger's Workshop"], ['displays', "Waffle's Island Displays"], ['houses', "Neighbors' houses"],
    ['barn', 'The barn'], ['windmill', 'The windmill'], ['lighthouse', 'The lighthouse']];
const MUSIC_GAMES = [['fishing', 'Fishing'], ['rope', 'Jump rope'], ['cook', 'Cooking'], ['pottery', 'Pottery'], ['painting', 'Painting'],
    ['blocks', 'Bento Blocks'], ['capsules', 'Spice Capsules'], ['fruit', 'Fruit Catch'], ['stack', 'Snack Stack'], ['claw', 'Claw machine']];
function musicState() {
    if (!S.music) S.music = { now: null, hours: {}, places: {}, games: {} };
    const M = S.music;
    M.hours = M.hours || {}; M.places = M.places || {}; M.games = M.games || {};
    return M;
}
function trackOk(id) {
    if (id && /^(lib|own|mysong):/.test(id)) return fileTrackOk(id);
    return id === 'silence' || !!TUNES[id] || (!!DANCE_TUNES[id] && !!SONGS[id] && songUnlocked(id));
}
function trackName(id) {
    if (!id) return 'Nothing';
    if (id === 'silence') return 'Silence';
    if (id === 'hourly') return "The hour's music (your music)";
    if (id.startsWith('lib:')) return MusicLib.name(id.slice(4));
    if (id.startsWith('own:')) return `${OwnMusic.name(id.slice(4))} (yours)`;
    if (id.startsWith('mysong:')) { const m = MySongs.find(id.slice(7)); return `${m ? m.name : 'Your song'} (your song)`; }
    if (id.startsWith('hgame:')) return `${id.slice(6)}, the hour's track`;
    return TRACK_NAMES[id] || (SONGS[id] ? `${SONGS[id].name} (club)` : cap(id));
}
function jukeboxTracks() {
    return Object.keys(TRACK_NAMES).filter(id => TUNES[id] && (!BACK_CABS.includes(id) || backRoomOpen())).concat(Object.keys(SONGS).filter(id => DANCE_TUNES[id] && songUnlocked(id)));
}
function musicPlaceKey(id) { return !id ? 'island' : id.startsWith('h_') ? 'houses' : id === 'lamproom' ? 'lighthouse' : id; }
/* Sarah's music choices: "play now" beats everything, then a minigame's rule, then the place, then the hour (outside) */
function musicRule(base) {
    if (!S || !S.started || !S.music || G.mode !== 'play' || G.introScene) return base;
    const M = S.music, h = Math.floor(Clock.hourF()), res = id => musicResolve(id, h), ok = id => !!id && trackOk(res(id));
    if (ok(M.now)) return res(M.now);
    const game = Arcade.on ? Arcade.id : Music.game;
    if (game && M.games && ok(M.games[game])) return res(M.games[game]);
    if (Arcade.on) return base;
    const place = musicPlaceKey(G.area && G.area.id);
    if (M.places && ok(M.places[place])) return res(M.places[place]);
    if (place === 'island' && M.hours && ok(M.hours[h])) return res(M.hours[h]);
    return base;
}
/* a choice that depends on the hour: 'hourly' (the hour's track from the library, a game at random), 'hgame:<game>'
   (that game's track for the hour) */
function musicResolve(id, h) {
    if (id === 'hourly') { const p = MusicLib.hourly(h); return p ? 'lib:' + p : null; }
    if (id && id.startsWith('hgame:')) { const p = MusicLib.gameHour(id.slice(6), h); return p ? 'lib:' + p : null; }
    return id;
}
function appMusic(tab) {
    tab = tab || 'now';
    const M = musicState();
    const P = UI.open({ title: 'Music', phone: true, back: backToPhone });
    const cur = Music.song ? null : Music.cur ? (Music.key || '').replace(/:\d+$/, '') : 'silence';
    P.body.appendChild(el('p', 'muted', !Audio2.musicOn ? 'Music is switched off in Settings, so nothing plays right now.'
        : Music.song ? 'Now playing: a club song.' : `Now playing: ${trackName(cur)}${M.now ? ' (on repeat)' : ''}.`));
    const tabs = el('div', 'st-row');
    tabs.style.marginBottom = '10px';
    for (const [k, label] of [['now', 'Play now'], ['library', 'Your music'], ['hours', 'By hour'], ['places', 'By place'], ['games', 'Minigames']]) {
        const c = chip(label, () => { Sfx.ui('tick'); appMusic(k); });
        if (k === tab) c.classList.add('on');
        tabs.appendChild(c);
    }
    P.body.appendChild(tabs);
    const apply = () => { Save.touch(); Music.update(true); };
    const L = el('div', 'list');
    if (tab === 'library') appMusicLibrary(P, M, apply);
    else if (tab === 'now') {
        P.body.appendChild(el('p', 'muted', 'Pick a song to play it now, everywhere, on repeat. (Club songs still play at the club.)'));
        if (M.now) {
            const r = el('div', 'row');
            r.appendChild(uiIcon('app_music', 40));
            const t = el('div', 't');
            t.appendChild(el('b', null, `On repeat: ${trackName(M.now)}`));
            t.appendChild(el('span', null, 'Back to normal plays the usual music for the time and place.'));
            r.appendChild(t);
            r.appendChild(btn('Back to normal', 'green', () => { M.now = null; apply(); appMusic('now'); }));
            L.appendChild(r);
        }
        for (const id of ['silence'].concat(jukeboxTracks())) {
            const r = el('button', 'row' + (M.now === id ? ' sel' : ''));
            r.type = 'button';
            r.appendChild(uiIcon(id === 'silence' ? 'emote_zzz' : SONGS[id] && DANCE_TUNES[id] ? 'ui_moves' : 'app_music', 40));
            const t = el('div', 't');
            t.appendChild(el('b', null, trackName(id)));
            t.appendChild(el('span', null, M.now === id ? '\u266a Playing now' : id === 'silence' ? 'A little peace and quiet' : 'Tap to play'));
            r.appendChild(t);
            r.addEventListener('click', () => { M.now = id; Sfx.ui('ok'); apply(); appMusic('now'); });
            L.appendChild(r);
        }
        // the player's own music (and their songs from the club), then every soundtrack, a game at a time (a group's
        // list is made when it's opened)
        const own = OwnMusic.list().map(t => ['own:' + t.id, t.name]).concat(MySongs.list().map(m => ['mysong:' + m.id, m.name]));
        if (own.length) {
            const det = el('details', 'mlib');
            det.appendChild(el('summary', null, `Your own music (${own.length})`));
            for (const [id, name] of own) {
                const r = el('button', 'row' + (M.now === id ? ' sel' : ''));
                r.type = 'button';
                const tx = el('div', 't');
                tx.appendChild(el('b', null, name));
                tx.appendChild(el('span', null, M.now === id ? '\u266a Playing now' : id.startsWith('mysong:') ? 'Your song from the club' : 'Kept on this device'));
                r.appendChild(tx);
                r.addEventListener('click', () => { M.now = id; Sfx.ui('ok'); apply(); appMusic('now'); });
                det.appendChild(r);
            }
            L.appendChild(det);
        }
        for (const g of MusicLib.games()) {
            const det = el('details', 'mlib');
            det.appendChild(el('summary', null, `${g} (${MusicLib.byGame[g].length})`));
            det.addEventListener('toggle', () => {
                if (!det.open || det.childNodes.length > 1) return;
                for (const t of MusicLib.byGame[g]) {
                    const id = 'lib:' + t.path, r = el('button', 'row' + (M.now === id ? ' sel' : ''));
                    r.type = 'button';
                    const tx = el('div', 't');
                    tx.appendChild(el('b', null, t.name));
                    tx.appendChild(el('span', null, M.now === id ? '\u266a Playing now' : t.hour != null ? `${fmtHour(t.hour)}${t.weather !== 'clear' ? `, ${t.weather === 'rain' ? 'rainy' : 'snowy'}` : ''}` : 'Tap to play'));
                    r.appendChild(tx);
                    r.addEventListener('click', () => { M.now = id; Sfx.ui('ok'); apply(); appMusic('now'); });
                    det.appendChild(r);
                }
            });
            L.appendChild(det);
        }
    } else {
        const slots = tab === 'hours' ? Array.from({ length: 24 }, (_, h) => [h, fmtClock(h)]) : tab === 'places' ? MUSIC_PLACES : MUSIC_GAMES;
        const map = tab === 'hours' ? M.hours : tab === 'places' ? M.places : M.games;
        P.body.appendChild(el('p', 'muted', tab === 'hours' ? 'Change the music outside on the island at any hour.'
            : tab === 'places' ? 'Choose music for each place. A place setting overrides an hourly setting.' : 'Change the music during a minigame. Dance and karaoke songs always play their own track.'));
        const tracks = jukeboxTracks();
        const lib = MusicLib.games().length > 0;
        for (const [key, label] of slots) {
            const r = el('div', 'row');
            const t = el('div', 't');
            t.appendChild(el('b', null, label));
            t.appendChild(el('span', null, map[key] ? trackName(map[key]) : 'Usual music'));
            r.appendChild(t);
            const s = el('select', 'msel');
            s.setAttribute('aria-label', `Music for ${label}`);
            // (with David's music: the hour's track for a place, or a given game's track for an hour)
            const extra = (!lib ? [] : tab === 'places' && key !== 'island' ? [['hourly', "The hour's music"]] : tab === 'hours' ? MusicLib.hourlyGames(key).map(g => ['hgame:' + g, g]) : [])
                .concat(OwnMusic.list().map(t => ['own:' + t.id, `${t.name} (yours)`]));
            for (const [v, name] of [['', 'Usual music'], ['silence', 'Silence']].concat(extra, tracks.map(id => [id, trackName(id)]))) {
                const o = el('option', null, name);
                o.value = v;
                if ((map[key] || '') === v) o.selected = true;
                s.appendChild(o);
            }
            s.addEventListener('change', () => {
                if (s.value) map[key] = s.value; else delete map[key];
                t.lastChild.textContent = s.value ? trackName(s.value) : 'Usual music';
                Sfx.ui('tick'); apply();
            });
            r.appendChild(s);
            L.appendChild(r);
        }
    }
    P.body.appendChild(L);
}

/* "Your music": the player's own music, kept on this device (OwnMusic), then the soundtracks from the games on the
   island's server (MusicLib): how the hour's music is picked, which games are in the mix; uploading them (once, by
   David) and taking a game out only on the beta site, where the server takes uploads */
function appMusicLibrary(P, M, apply) {
    const B = P.body, h = Math.floor(Clock.hourF());
    // the player's own
    B.appendChild(el('h3', null, 'Your own music'));
    const own = OwnMusic.list(), mine = MySongs.list();
    B.appendChild(el('p', 'muted', own.length ? `${own.length} song${own.length === 1 ? '' : 's'} of your own, kept on this device. Tap one to play it, on repeat; By hour and By place can pick them too.`
        : 'Add music from this device (MP3, M4A, OGG, WAV...) to play on the island. It stays on this device.'));
    const OL = el('div', 'list');
    for (const t of own) {
        const id = 'own:' + t.id, r = el('div', 'row' + (M.now === id ? ' sel' : '')), tx = el('div', 't');
        tx.appendChild(el('b', null, t.name));
        tx.appendChild(el('span', null, M.now === id ? '\u266a Playing now, on repeat' : fmtBytes(t.size)));
        r.appendChild(tx);
        r.appendChild(btn(M.now === id ? 'Stop' : 'Play', 'green', () => { M.now = M.now === id ? null : id; Sfx.ui('ok'); apply(); appMusic('library'); }));
        r.appendChild(btn('Remove', 'alt', async () => { if (M.now === id) M.now = null; await OwnMusic.remove(t.id); apply(); appMusic('library'); }));
        OL.appendChild(r);
    }
    if (mine.length) OL.appendChild(el('p', 'muted', `Your ${mine.length} song${mine.length === 1 ? '' : 's'} from the club are in Play now too.`));
    B.appendChild(OL);
    const addRow = el('div', 'st-row'), inp = document.createElement('input');
    inp.type = 'file'; inp.multiple = true; inp.hidden = true; inp.accept = 'audio/*,.mp3,.m4a,.aac,.ogg,.oga,.opus,.flac,.wav,.webm';
    inp.addEventListener('change', async () => {
        const n = await OwnMusic.add(inp.files);
        UI.toast(n ? `Added ${n} song${n === 1 ? '' : 's'}!` : 'No music files there.');
        if (P.body.isConnected) appMusic('library');
    });
    addRow.appendChild(inp);
    addRow.appendChild(btn('Add music from this device', 'green', () => inp.click()));
    B.appendChild(addRow);

    // the soundtracks from the games, on the server
    const games = MusicLib.games(), tracks = MusicLib.tracks || [], up = MusicLib.uploads;
    if (!tracks.length && !up) return;
    B.appendChild(el('h3', null, "The games' soundtracks"));
    const hourly = tracks.filter(t => t.hour != null).length;
    B.appendChild(el('p', 'muted', tracks.length ? `${fmtNum(tracks.length)} track${tracks.length === 1 ? '' : 's'} from ${games.length} game${games.length === 1 ? '' : 's'}, ${fmtNum(hourly)} of them for an hour of the day: outside and at home, each hour plays that hour's track from a game picked at random.${up && MusicLib.free != null ? ` The server has ${fmtBytes(MusicLib.free)} free.` : ''}`
        : "None yet. Upload the games' music (a folder of games, each in its own folder) and the island plays each hour's track, from a game picked at random every hour."));
    const L = el('div', 'list');
    const hourGames = games.filter(g => MusicLib.byGame[g].some(t => t.hour != null));
    if (hourGames.length) {
        const r = el('div', 'row'), t = el('div', 't');
        t.appendChild(el('b', null, 'Hourly music'));
        const now = MusicLib.hourGame(h);
        t.appendChild(el('span', null, now ? `This hour: ${now}` : "This hour: the island's own tune"));
        r.appendChild(t);
        const sel = el('select', 'msel');
        sel.setAttribute('aria-label', 'Hourly music');
        for (const [v, name] of [['', 'A game at random each hour']].concat(hourGames.map(g => [g, `Always ${g}`]), [['tunes', "The island's own tunes"]])) {
            const o = el('option', null, name);
            o.value = v;
            if ((M.lib || '') === v) o.selected = true;
            sel.appendChild(o);
        }
        sel.addEventListener('change', () => { if (sel.value) M.lib = sel.value; else delete M.lib; Sfx.ui('tick'); apply(); appMusic('library'); });
        r.appendChild(sel);
        L.appendChild(r);
    }
    for (const g of games) {
        const ts = MusicLib.byGame[g], hrs = new Set(ts.filter(t => t.hour != null).map(t => t.hour)).size;
        const wx = [...new Set(ts.filter(t => t.hour != null && t.weather !== 'clear').map(t => t.weather))];
        const r = el('div', 'row'), t = el('div', 't');
        t.appendChild(el('b', null, g));
        t.appendChild(el('span', null, `${ts.length} track${ts.length === 1 ? '' : 's'}${hrs ? `, ${hrs} hour${hrs === 1 ? '' : 's'} of the day` : ''}${wx.length ? ` (with ${wx.join(' and ')})` : ''}`));
        r.appendChild(t);
        if (hrs) {
            M.libSkip = M.libSkip || [];
            const inMix = !M.libSkip.includes(g);
            const c = chip(inMix ? 'In the mix' : 'Left out', () => {
                if (inMix) M.libSkip.push(g); else M.libSkip = M.libSkip.filter(x => x !== g);
                Sfx.ui('tick'); apply(); appMusic('library');
            });
            if (inMix) c.classList.add('on');
            r.appendChild(c);
        }
        if (up) r.appendChild(btn('Remove', 'alt', () => {
            r.replaceChildren(el('div', 't', `Take ${g} off the server? Its ${ts.length} track${ts.length === 1 ? '' : 's'} go for good (upload them again to have them back).`));
            r.appendChild(btn('Remove it', 'alt', async () => {
                MusicLib.forget(g);
                try { await Cloud.api('DELETE', '/api/music/game?name=' + encodeURIComponent(g)); UI.toast(`${g} is off the island's music.`); } catch (e) { UI.toast("Couldn't remove it just now."); }
                await MusicLib.load(true);
                appMusic('library');
            }));
            r.appendChild(btn('Keep it', 'green', () => appMusic('library')));
        }));
        L.appendChild(r);
    }
    B.appendChild(L);
    if (!up) return;
    // uploading (the beta site): a folder (a game's, or one with a folder for each game) or some files
    B.appendChild(el('p', 'muted', "Upload (beta only, once for both sites): MP3 or M4A files are best (FLAC works but takes four times the room). Each game's music in a folder named after the game; the hour is read from each file's name (\"5 PM\", \"5 PM (Rainy)\", \"17:00\"). It's kept on the island's server, never in GitHub."));
    const status = el('p', 'muted');
    const show = (job, last) => {
        if (!job) { status.textContent = ''; return; }
        status.textContent = job.done ? `Done: ${fmtNum(job.n - job.failed)} uploaded${job.skipped ? `, ${fmtNum(job.skipped)} already there` : ''}${job.failed ? `, ${job.failed} didn't go` : ''}.${job.err ? ' ' + job.err : ''}`
            : `Uploading ${fmtNum(job.n + 1)} of ${fmtNum(job.of)} (${fmtBytes(job.bytes)} of ${fmtBytes(job.total)})${job.skipped ? `, ${fmtNum(job.skipped)} already there` : ''}: ${job.now}`;
        if (last && status.isConnected) appMusic('library');
    };
    const pickers = el('div', 'st-row');
    const pick = (label, folder) => {
        const i2 = document.createElement('input');
        i2.type = 'file'; i2.multiple = true; i2.hidden = true;
        i2.accept = 'audio/*,.mp3,.m4a,.aac,.ogg,.oga,.opus,.flac,.wav,.webm';
        if (folder) { i2.webkitdirectory = true; i2.setAttribute('webkitdirectory', ''); }
        i2.addEventListener('change', () => { const f = i2.files; if (f && f.length) MusicUpload.start(f, show); });
        pickers.appendChild(i2);
        pickers.appendChild(btn(label, 'green', () => i2.click()));
    };
    pick('Upload a folder', true);
    pick('Upload files', false);
    const job = MusicUpload.job;
    if (job && !job.done) pickers.appendChild(btn('Stop uploading', 'alt', () => { job.stop = true; Sfx.ui('close'); }));
    // (the list of every track, to send to Claude so the game's tunes can be swapped for the soundtracks)
    if (tracks.length) pickers.appendChild(btn('Copy the track list', 'alt', () => {
        const text = musicTrackList();
        const shown = () => { const ta = el('textarea', 'mlist'); ta.value = text; ta.readOnly = true; ta.rows = 8; B.appendChild(ta); ta.select(); };
        try { navigator.clipboard.writeText(text).then(() => UI.toast('Track list copied!'), shown); } catch (e) { shown(); }
    }));
    B.appendChild(pickers);
    B.appendChild(status);
    if (job) { show(job); job.watch = show; }
}
/* every track as a line: game, hour and weather, file */
function musicTrackList() {
    return (MusicLib.tracks || []).map(t => `${t.game}\t${t.hour == null ? '-' : fmtHour(t.hour)}${t.weather !== 'clear' ? ' ' + t.weather : ''}\t${t.path}`).join('\n');
}

/* ---------------------------------------------------------------- Save & quit */
async function saveGameFile() {
    let code;
    try { code = await Save.exportCode(); } catch (e) { UI.toast('Could not make a save file.'); return false; }
    const safe = (S.islandName || 'island').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'island';
    const name = `sarah-crossing-${safe}-${Clock.dayDate().toISOString().slice(0, 10)}.txt`;
    const d = await Caps.downloads();
    if (d) {
        try { await d.save({ filename: name, data: code }); UI.toast('Save file saved!'); return true; } catch (e) { if (e && e.code === 'declined') { UI.toast('No file was saved.'); return false; } }
    }
    try {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([code], { type: 'text/plain' }));
        a.download = name;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
        UI.toast('Save file downloaded!');
        return true;
    } catch (e) { UI.toast("This browser couldn't save a file. Settings has a save code you can copy instead."); return false; }
}
function quitToTitle() {
    Save.write(true);
    UI.close(true); UI.hideDialog();
    Chats.endAll();
    G.keys = {};
    if (G.player) G.player.path = null;
    showTitle();
}
function appSaveQuit() {
    const P = UI.open({ title: 'Save & quit', phone: true, back: backToPhone });
    P.body.appendChild(el('p', null, 'Save your island as a file, then head back to the title screen.'));
    P.body.appendChild(el('p', 'muted', 'Your island also saves itself online as you play. A save file is an extra backup you can keep, and bring back in from the title screen (Import a save).'));
    const msg = el('p', 'muted', '');
    const row = el('div');
    row.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;margin-top:10px';
    row.appendChild(btn('Save a file & quit', 'green', async () => {
        const ok = await saveGameFile();
        if (ok) quitToTitle(); else msg.textContent = "The file wasn't saved. Try again, or quit without one (the island is still saved online).";
    }));
    row.appendChild(btn('Just save a file', 'alt', () => saveGameFile()));
    row.appendChild(btn('Quit without a file', 'alt', () => quitToTitle()));
    P.body.appendChild(row);
    P.body.appendChild(msg);
}
/* "Load a save file": the file comes in as an island of its own, or replaces the same island (6x_islands.js) */
function loadSaveFile() { IslandList.chooseFile(); }

/* ---------------------------------------------------------------- Settings: the island's name, and the secrets */
function islandNameSetting() {
    const box = el('div', 'field');
    box.style.marginTop = '14px';
    box.appendChild(el('span', null, 'Island name'));
    const row = el('div', 'clockrow');
    const inp = el('input');
    inp.type = 'text'; inp.id = 'islandname'; inp.maxLength = 20; inp.value = S.islandName || ''; inp.setAttribute('aria-label', 'Island name');
    row.appendChild(inp);
    row.appendChild(btn('Rename', 'green', () => {
        const v = inp.value.replace(/\s+/g, ' ').trim().slice(0, 20);
        if (!v) { Sfx.ui('nope'); UI.toast('The island needs a name!'); return; }
        S.islandName = v;
        Save.touch();
        Sfx.ui('ok');
        UI.toast(`Welcome to ${v}!`);
        HUD.update();
    }));
    box.appendChild(row);
    return box;
}
function secretsSection() {
    const box = el('div');
    box.style.cssText = 'margin-top:18px;padding-top:12px;border-top:2px dashed var(--line)';
    box.appendChild(el('p', null, 'Secrets'));
    box.firstChild.style.cssText = 'font-weight:700;margin:0 0 4px';
    box.appendChild(el('p', 'muted', 'A spoiler guide and an unlock-everything option. Each asks before showing or changing anything.'));
    const row = el('div');
    row.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap';
    row.appendChild(btn('Spoiler guide', 'alt', () => spoilerGate()));
    if (S.flags.cheat != null) box.appendChild(el('p', 'muted', `Cheat mode is on: everything was unlocked on ${dayLabel(S.flags.cheat)}. It can't be turned off.`));
    else row.appendChild(btn('Unlock everything', 'alt', () => cheatGate()));
    box.appendChild(row);
    return box;
}
async function cheatGate() {
    UI.close(true);
    G.busy++;
    let go = false;
    try {
        let k = await UI.ask('phone', 'Unlock everything? You get every item, outfit, recipe, poem, song and move, every hidden treasure, every mystery solved, best friends with everyone, and everyone in your contacts.', ['Go on...', 'Never mind'], { keep: true });
        if (k !== 0) return;
        k = await UI.ask('phone', 'Warning: this is PERMANENT. There is no undo and no way back. Every surprise on the island gets spoiled, and this island stays in cheat mode forever.', ['I understand', 'Never mind'], { keep: true });
        if (k !== 0) return;
        k = await UI.ask('phone', 'Last chance! Save a backup file of this island first? You could load it later to go back to how things are now.', ['Save a backup first', 'No backup, unlock it', 'Never mind'], { keep: true });
        if (k !== 0 && k !== 1) return;
        UI.hideDialog();
        if (k === 0) await saveGameFile();
        go = await holdToConfirm('Unlock everything', 'Hold the button down for three seconds to unlock everything. This can never be undone.');
    } finally { UI.hideDialog(); G.busy--; }
    if (!go) return;
    unlockEverything();
    Sfx.play('fanfare');
    G.busy++;
    try {
        await UI.say('phone', ['Cheat mode is on. Everything is unlocked!', 'New things are waiting in your house storage, your wardrobe and your contacts. The house is as big as it gets (step out and back in if you are home).']);
    } finally { G.busy--; }
}
function holdToConfirm(title, text) {
    return new Promise(res => {
        let done = false, t0 = 0, raf = 0;
        const P = UI.open({ title, onClose: () => { if (!done) { done = true; cancelAnimationFrame(raf); res(false); } } });
        P.body.appendChild(el('p', null, text));
        const b = btn('Hold to unlock', 'green holdbtn', () => {});
        const bar = el('div', 'holdbar');
        const fill = el('i');
        bar.appendChild(fill);
        const stop = () => { if (done) return; t0 = 0; fill.style.width = '0%'; b.textContent = 'Hold to unlock'; cancelAnimationFrame(raf); };
        const step = () => {
            if (!t0 || done) return;
            const k = Math.min(1, (performance.now() - t0) / 3000);
            fill.style.width = (k * 100).toFixed(1) + '%';
            if (k >= 1) { done = true; UI.close(true); res(true); return; }
            raf = requestAnimationFrame(step);
        };
        b.addEventListener('pointerdown', ev => { ev.preventDefault(); if (t0) return; t0 = performance.now(); b.textContent = 'Keep holding...'; step(); });
        ['pointerup', 'pointerleave', 'pointercancel'].forEach(e => b.addEventListener(e, stop));
        b.addEventListener('contextmenu', ev => ev.preventDefault());
        P.body.appendChild(b);
        P.body.appendChild(bar);
        P.body.appendChild(btn('Never mind', 'alt', () => UI.close()));
    });
}
/* cheat mode: everything, all at once */
function unlockEverything() {
    const day = Clock.dayNum(), top = HEARTS[HEARTS.length - 1];
    // everyone: met, in your contacts, best friends
    for (const id of Object.keys(NPC_DEFS)) { const r = rel(id); r.met = true; if ((r.pts || 0) < top) r.pts = top; }
    S.flags.metJoe = true;
    // recipes, poems, moves and songs
    S.recipes = [...new Set(S.recipes.concat(RECIPES.map(r => r.id)))];
    S.poems = [...new Set(S.poems.concat(JOE_POEMS.map(p => p[0]), [JOE_SUNSET_POEM[0]]))];
    S.dance.moves = [...new Set(S.dance.moves.concat(Object.keys(MOVES)))];
    // every special find (hairstyles, patterns, accessories, keepsakes, songs, moves, treasures)
    for (const id of Object.keys(SPECIALS)) if (!hasSpecial(id)) { specials()[id] = { day, how: 'Cheat mode' }; try { applySpecial(id); } catch (e) { console.error(e); } }
    for (const id of Object.keys(SONGS)) if (!S.dance.songs[id]) S.dance.songs[id] = { best: 0, rank: 'C', paid: -1, cleared: true };
    // the mysteries
    for (const q of QUEST_IDS) { const s = Quests.st(q); s.stage = Math.max(s.stage || 0, 3); s.done = true; s.doneDay = s.doneDay || day; }
    // clothes straight into the wardrobe; one of everything else into the house storage; the tools into the pocket
    for (const [id, it] of Object.entries(ITEMS)) {
        if (it.type === 'outfit' || it.type === 'acc') {
            const list = it.type === 'outfit' ? S.wardrobe.outfits : S.wardrobe.accs;
            if (it.wear && !list.includes(it.wear)) list.push(it.wear);
            S.seen[id] = S.seen[id] || day;
            continue;
        }
        if (it.type === 'tool') { if (!ownedCount(id)) receive(id, 1, true); continue; }
        if (['quest', 'bag', 'special', 'display'].includes(it.type) || it.pottery || it.type === 'art' || id.startsWith('photo_')) continue;
        if (['present', 'lost_invite', 'package'].includes(id)) continue;
        if (!ownedCount(id)) toStorage(id, 1);
    }
    // the biggest house, the biggest pocket, the path kit, and plenty to spend
    S.house.level = HOUSE_EXPAND.length;
    if (G.areas.home) G.areas.home.stale = true;
    try { applyExteriors(G.areas.island); } catch (e) { console.error(e); }
    S.bag = BAGS.length;
    while (S.pocket.length < pocketSize()) S.pocket.push(null);
    S.flags.pathKit = true;
    S.money = (S.money || 0) + 1000000;
    if (S.arcade) S.arcade.tickets = (S.arcade.tickets || 0) + 10000;
    S.flags.cheat = day;
    Save.touch();
    Save.write(true);
    HUD.update();
}

/* ---------------------------------------------------------------- the spoiler guide */
async function spoilerGate() {
    UI.close(true);
    G.busy++;
    let ok = false;
    try {
        let k = await UI.ask('phone', 'The spoiler guide says exactly how to find every hidden thing on the island: the mysteries, secret songs and moves, special treasures, trophies and more.', ['Keep going', 'Never mind'], { keep: true });
        if (k === 0) k = await UI.ask('phone', 'Spoiler warning! Finding these on your own is half the fun. Are you sure you want to peek?', ['Show me the guide', 'Keep it a secret'], { keep: true });
        ok = k === 0;
    } finally { UI.hideDialog(); G.busy--; }
    if (ok) spoilerGuide('quests');
}
const QUEST_GUIDE = {
    treasure: ["The pirate's treasure", '1. Open the old trunk in the barn, up on the farm. There is a pirate\'s note inside.\n2. From the foot of the pier, walk west past three palm trees. At the third palm, face the sea, take four steps, and dig where the sand is dark (hold the shovel).\nReward: a pirate hat, a treasure chest and an old map.'],
    ghost: ['The keeper of the light', "1. Go up to the lighthouse's lamp room between 11 PM and 1 AM and talk to the old keeper's ghost.\n2. He misses his wife Martha's clam chowder. Ask Sully about the ghost: he teaches you his chowder.\n3. Cook clam chowder at home (dig clams on the beach with the shovel).\n4. Bring it to the ghost between 11 PM and 1 AM.\nReward: a halo, the Lighthouse Shanty for the club, and the lighthouse shines every night."],
    goat: ["The goat's golden bell", '1. Pet the goat on three different days.\n2. It gives you a tin can. Trade it around the island: the tin can to Chili (hot sauce), the hot sauce to Kai (a shell necklace), the necklace to Clementine (a silk scarf), the scarf to Brulee (a painting of the goat), and the painting to Coco (a golden bell).\n3. Give the golden bell to the goat.\nReward: goat horns and The Goat Waltz.'],
    windmill: ['The silent moonstone', '1. Look at the moonstone inside the windmill: three cogs are missing. (Ginger remembers where they went.)\n2. Cog one: a crate up on the farm.\n3. Cog two: the hollow of the oldest big tree in the forest.\n4. Cog three: the old sea chest inside the lighthouse.\n5. Bring all three back to the moonstone.\nReward: a mini windmill and the mooncake recipe.'],
    star: ['The blinking star', "1. First, solve the lighthouse ghost's mystery so the lamp shines again.\n2. At night, look through the telescope at the lookout: one star blinks short, short, long.\n3. At night, answer it from the lighthouse's great lamp: short, short, long.\n4. Climb to the mountain top. Something fell there.\nReward: a star telescope, a space suit pattern, the song Starlight and a star crystal."],
};
const POOL_ANSWER = 'Luck! It can turn up in a fishing crate, in a sparkling tree (shake it), sometimes after cooking, or as a thank-you for a favor. Keep doing those and it will show up.';
function specialAnswer(sp) {
    if (sp.src === 'pool') return POOL_ANSWER;
    if (sp.src.startsWith('quest:')) { const q = sp.src.slice(6); return `A reward for solving "${(QUEST_GUIDE[q] || [q])[0]}". See Mysteries.`; }
    return sp.hint || POOL_ANSWER;
}
function songHow(id) {
    const s = SONGS[id];
    if (!s) return '';
    if (s.special) { const sp = SPECIALS[s.special]; return sp ? (sp.src === 'pool' ? 'A hidden track. ' + POOL_HINT : 'A hidden track. Hint: ' + sp.hint) : 'A hidden track.'; }
    return { wiggle: 'Open from the start.', shuffle: 'Clear "Wasabi Wiggle" first.', owl: 'Clear "Spicy Tuna Shuffle" first.',
        disco: 'Clear "Night Owl Anthem" first.', sonnet: 'Clear "Roller Disco Forever" first, or get close to Joe (two hearts).' }[id] || '';
}
function moveHow(m) {
    const song = Object.keys(SONGS).find(id => SONGS[id].move === m);
    if (song) return `Clear "${SONGS[song].name}" at Club Wasabi.`;
    const sp = Object.values(SPECIALS).find(q => q.move === m);
    if (sp) return sp.src === 'pool' ? 'A hidden find. ' + POOL_HINT : sp.hint || POOL_HINT;
    return 'You know this one from the start.';
}
function spoilerEntries(sec) {
    const out = [];
    if (sec === 'quests') for (const q of QUEST_IDS) out.push([QUEST_GUIDE[q][0], QUEST_GUIDE[q][1], Quests.done(q)]);
    if (sec === 'specials') for (const [cat, label] of SPECIAL_CATS) for (const sp of Object.values(SPECIALS).filter(x => x.cat === cat)) out.push([`${sp.name} (${label.toLowerCase().replace(/s$/, '')})`, specialAnswer(sp), hasSpecial(sp.id)]);
    if (sec === 'club') {
        for (const id of Object.keys(SONGS)) {
            const s = SONGS[id];
            const how = s.special ? specialAnswer(SPECIALS[s.special]) : songHow(id);
            out.push([`Track: ${s.name}`, how + (s.move ? ` Clearing it teaches the move ${MOVES[s.move].name}.` : ''), !!(S.dance.songs[id] && S.dance.songs[id].cleared)]);
        }
        for (const m of Object.keys(MOVES)) {
            const sp = Object.values(SPECIALS).find(q => q.move === m);
            out.push([`Move: ${MOVES[m].name}`, sp ? specialAnswer(sp) : moveHow(m), S.dance.moves.includes(m)]);
        }
        const all = JOE_POEMS.length + 1, have = karaokePoems().length;
        out.push(["Joe's poems (karaoke)", `Talk to Joe and ask for a poem: every poem he reads you joins the karaoke list at the club. There are ${all} in all. You have ${have}.`, have >= all]);
    }
    if (sec === 'trophies') {
        out.push(['Arcade trophy', "Trade 500 tickets for it at Chili's prize counter in the arcade.", !!S.seen.trophy_arcade]);
        out.push(['Karaoke trophy', "Get an A or S rank singing one of Joe's poems at Club Wasabi.", !!(S.karaoke && S.karaoke.trophy)]);
        out.push(['Jump rope trophy', 'Make 30 jumps in a row at the jump rope in the plaza (dry afternoons, 2:30 to 5:30 PM).', !!(S.rope && S.rope.trophy)]);
        out.push(['The club at home', "Get an S rank on any dance at Club Wasabi: DJ Wasabi gives you the club's wallpaper and floor.", !!S.flags.clubDecor]);
        out.push(['The Cutest House on the Island', "The Cozy Council's top rating. They love lights, rugs, soft things and plants, furniture that matches a theme, and a new wallpaper and floor.", ((S.council && S.council.best) || 0) >= 27]);
    }
    if (sec === 'secrets') {
        const need = (id, lv) => SHOP_UP[id].need[lv];
        out.push(['Bigger shops', `Shop at Fortune's and Clementine's and they grow, twice each. Fortune's: after ${need('shop', 1).days} days and ${fmtNum(need('shop', 1).spent)} sand dollars spent there, then ${need('shop', 2).days} days and ${fmtNum(need('shop', 2).spent)}. Clementine's: ${need('boutique', 1).days} days and ${fmtNum(need('boutique', 1).spent)}, then ${need('boutique', 2).days} days and ${fmtNum(need('boutique', 2).spent)}. Each time: more stock, a daily sale, longer hours and a grand-opening gift.`, shopLevel('shop') >= 3 && shopLevel('boutique') >= 3]);
        out.push(['Gems', 'One to three gems sparkle on the mountain top every day. Fortune loves buying them.', false]);
        out.push(['Sparkling trees', 'A tree that sparkles has something hidden in it. Shake it!', false]);
        out.push(['The money tree', 'Dig at the glowing spot (it moves every day), bury some sand dollars in the hole, and a money tree grows. Shake it for three bags of sand dollars.', false]);
        out.push(['Shooting stars', 'On clear nights a shooting star sometimes crosses the sky. Press A (or tap it) to make a wish.', false]);
        out.push(['Crates and bottles', 'Fishing sometimes brings up a crate or a message in a bottle.', false]);
        out.push(['Clams', 'Dig on the beach with the shovel to find clams (for chowder).', false]);
        out.push(['Food boosts', "Homemade food, meals from Mac's, and bowls from Basil's cart always give a boost. Other food gives a boost 1 time in 10.", false]);
        out.push(['The ghost', "The old keeper's ghost is in the lighthouse lamp room from 11 PM to 1 AM, until his mystery is solved.", Quests.done('ghost')]);
    }
    return out;
}
function spoilerGuide(sec) {
    const P = UI.open({ title: 'Spoiler guide', phone: true, back: appSettings });
    const tabs = el('div', 'st-row');
    tabs.style.marginBottom = '10px';
    for (const [k, label] of [['quests', 'Mysteries'], ['specials', 'Special finds'], ['club', 'Club'], ['trophies', 'Trophies'], ['secrets', 'Little secrets']]) {
        const c = chip(label, () => { Sfx.ui('tick'); spoilerGuide(k); });
        if (k === sec) c.classList.add('on');
        tabs.appendChild(c);
    }
    P.body.appendChild(tabs);
    P.body.appendChild(el('p', 'muted', 'Tap anything to see how. \u2713 means you already have it.'));
    const L = el('div', 'list');
    for (const [name, how, done] of spoilerEntries(sec)) {
        const r = el('button', 'row spoil');
        r.type = 'button';
        const t = el('div', 't');
        t.appendChild(el('b', null, (done ? '\u2713 ' : '') + name));
        const ans = el('span', 'ans', 'Tap to reveal');
        t.appendChild(ans);
        r.appendChild(t);
        r.addEventListener('click', () => {
            const open = r.classList.toggle('open');
            ans.textContent = open ? how : 'Tap to reveal';
            Sfx.ui('tick');
        });
        L.appendChild(r);
    }
    P.body.appendChild(L);
}

/* ---------------------------------------------------------------- names and notes for paintings and pottery */
function labelOf(id) {
    if (!S || !id) return null;
    if (S.pottery && S.pottery.pieces && S.pottery.pieces[id] && S.pottery.pieces[id].state === 'done') return S.pottery.pieces[id];
    if (S.art && S.art.pieces && S.art.pieces[id]) return S.art.pieces[id];
    return null;
}
function canLabel(id) { return !!labelOf(id); }
function labelNote(id) { const p = labelOf(id); return p && p.desc ? `"${p.desc}" ` : ''; }
function editLabel(id, back) {
    const p = labelOf(id);
    if (!p) return;
    const isPot = !!(S.pottery && S.pottery.pieces[id]);
    const P = UI.open({ title: isPot ? 'Name this pottery' : 'Name this painting', phone: !!back, back: back || null, foot: true });
    const f1 = el('div', 'field');
    f1.appendChild(el('span', null, 'Name'));
    const name = el('input');
    name.type = 'text'; name.maxLength = 32; name.value = p.name || ''; name.id = 'labelname';
    f1.appendChild(name);
    P.body.appendChild(f1);
    const f2 = el('div', 'field');
    f2.appendChild(el('span', null, 'Description (shown in the museum, at home and in your pocket)'));
    const desc = el('textarea');
    desc.maxLength = 160; desc.value = p.desc || ''; desc.id = 'labeldesc';
    desc.placeholder = isPot ? 'A bowl for noodles. Made on a rainy Tuesday.' : 'The pier at sunset, the way Joe described it.';
    f2.appendChild(desc);
    P.body.appendChild(f2);
    P.foot.appendChild(btn('Save', 'green', () => {
        const nm = name.value.replace(/\s+/g, ' ').trim().slice(0, 32);
        if (nm) {
            p.name = nm;
            if (ITEMS[id]) ITEMS[id].name = nm;
            if (FURN[id]) FURN[id].name = nm;
        }
        const d = desc.value.replace(/\s+/g, ' ').trim().slice(0, 160);
        if (d) p.desc = d; else delete p.desc;
        Save.touch();
        Sfx.ui('ok');
        UI.toast('Saved!', itemIcon(id));
        if (G.area && G.area.id === 'museum') refreshMuseum();
        if (back) back(); else UI.close();
    }));
}

/* ---------------------------------------------------------------- the museum pedestals */
/* what stands on the pottery hall's pedestals: Sarah picks (A.peds), or else her newest pieces (a pedestal added since she
   last chose takes a piece that isn't out yet) */
function museumPeds() {
    const A = artState(), n = MUSEUM_PEDESTALS.length;
    if (Array.isArray(A.peds)) {
        const out = MUSEUM_PEDESTALS.map((_, i) => { const id = A.peds[i]; return id && FURN[id] ? id : null; });
        if (A.peds.length < n) { const rest = museumPedPool().filter(id => !out.includes(id)); for (let i = A.peds.length; i < n; i++) out[i] = rest.shift() || null; }
        return out;
    }
    const pots = A.pots.slice(-n).reverse().filter(id => FURN[id]);
    if (!pots.length) return MUSEUM_PEDESTALS.map((_, i) => ['orange_vase', 'rose_vase'][i] || null);
    return MUSEUM_PEDESTALS.map((_, i) => pots[i] || null);
}
const PED_SPOT_NAMES = ['Back row, left of the middle', 'Back row, right of the middle', 'Back row, third from the left', 'Back row, third from the right',
    'Back row, far left', 'Back row, far right', 'Front row, left of the middle', 'Front row, right of the middle', 'Front row, far left', 'Front row, far right'];
function museumPedPool() {
    const A = artState();
    return [...new Set(A.pots.filter(id => FURN[id]).reverse().concat(['orange_vase', 'rose_vase'].filter(id => FURN[id])))];
}
function museumPedestals() {
    return new Promise(res => {
        const A = artState();
        if (!Array.isArray(A.peds) || A.peds.length < MUSEUM_PEDESTALS.length) A.peds = museumPeds();
        const P = UI.open({ title: 'The pedestals', onClose: () => { refreshMuseum(); Save.touch(); res(); } });
        let pick = null;
        const draw = () => {
            P.body.innerHTML = '';
            if (pick == null) {
                P.body.appendChild(el('p', 'muted', 'Ten pedestals in the pottery hall. Pick one to choose what stands on it: any pottery you have donated, or one of Brulee\'s vases.'));
                const list = el('div', 'list');
                MUSEUM_PEDESTALS.forEach((x, i) => {
                    const id = A.peds[i];
                    const row = el('button', 'row');
                    row.type = 'button';
                    row.appendChild(iconCanvas(id ? itemIcon(id) : 'f_pedestal', 40));
                    const t = el('div', 't');
                    t.appendChild(el('b', null, PED_SPOT_NAMES[i]));
                    t.appendChild(el('span', null, id ? `"${itemName(id)}"` : 'An empty pedestal'));
                    row.appendChild(t);
                    row.addEventListener('click', () => { pick = i; Sfx.ui('tick'); draw(); });
                    list.appendChild(row);
                });
                P.body.appendChild(list);
                return;
            }
            P.body.appendChild(el('p', 'muted', `What should stand on the pedestal: ${PED_SPOT_NAMES[pick].toLowerCase()}?`));
            const grid = el('div', 'grid');
            const put = id => {
                const old = id ? A.peds.indexOf(id) : -1;
                if (old >= 0) A.peds[old] = A.peds[pick];        // swap places
                A.peds[pick] = id;
                Sfx.play('place');
                pick = null; draw();
            };
            for (const id of museumPedPool()) {
                const b = el('button', 'slot' + (A.peds.includes(id) ? ' hung' : ''));
                b.type = 'button'; b.title = itemName(id); b.setAttribute('aria-label', itemName(id));
                b.appendChild(iconCanvas(itemIcon(id), 40));
                b.addEventListener('click', () => put(id));
                grid.appendChild(b);
            }
            const empty = el('button', 'slot');
            empty.type = 'button'; empty.title = 'Leave it empty'; empty.setAttribute('aria-label', 'Leave it empty');
            empty.appendChild(iconCanvas('f_pedestal', 40));
            empty.addEventListener('click', () => put(null));
            grid.appendChild(empty);
            P.body.appendChild(grid);
            P.body.appendChild(btn('Back', 'alt', () => { pick = null; draw(); }));
        };
        draw();
    });
}

/* ---------------------------------------------------------------- Club Wasabi: Dance, Karaoke, Just watch */
async function clubMenu() {
    const k = await UI.ask('wasabi', 'What are we doing, superstar?', ['Dance', 'Your songs', 'Karaoke', 'Just watch', 'Just vibing']);
    if (k === 0) { UI.hideDialog(); const id = await clubList('dance'); if (id) await Dance.start(id); return; }
    if (k === 1) { await mySongsMenu(); return; }        // (a dance made for a song from her device: 6zo_mysongs.js)
    if (k === 2) { await karaokeNight(); return; }
    if (k === 3) {
        UI.hideDialog();
        const pick = await clubList('watch');
        if (!pick) return;
        if (pick.song) await Dance.start(pick.song, { watch: true });
        else await Karaoke.start(pick.poem, { watch: true });
        return;
    }
    await UI.say('wasabi', 'Enjoy the music. Give me a wave when you want a turn.');
}
function clubList(mode) {
    return new Promise(res => {
        let done = false;
        const finish = v => { if (done) return; done = true; UI.close(true); Sfx.ui('ok'); res(v); };
        const P = UI.open({ title: mode === 'watch' ? 'Just watch' : 'Dance', onClose: () => { if (!done) { done = true; res(null); } } });
        const row = (icon, name, sub, locked, fn) => {
            const r = el(locked ? 'div' : 'button', 'row' + (locked ? ' locked' : ''));
            if (!locked) { r.type = 'button'; r.addEventListener('click', fn); }
            r.appendChild(uiIcon(icon, 40));
            const t = el('div', 't');
            t.appendChild(el('b', null, name));
            t.appendChild(el('span', null, sub));
            r.appendChild(t);
            return r;
        };
        const L = el('div', 'list');
        if (mode === 'dance') {
            P.body.appendChild(el('p', 'muted', 'Every track at the club. Hit the arrows on the beat! Greyed-out tracks are still locked.'));
            for (const id of Object.keys(SONGS)) {
                const s = SONGS[id], sd = S.dance.songs[id], open = songUnlocked(id);
                L.appendChild(open ? row('ui_moves', s.name, `${s.level}${sd && sd.cleared ? ' \u00b7 best ' + sd.rank : ' \u00b7 new!'}`, false, () => finish(id))
                    : row('ui_lock', s.special ? '??? (a hidden track)' : s.name, `${s.level} \u00b7 Locked. ${songHow(id)}`, true));
            }
        } else {
            P.body.appendChild(el('p', 'muted', 'Sarah performs on her own: no arrows, no notes, no score. Leave any time.'));
            L.appendChild(el('p', null, 'Dances'));
            for (const id of Object.keys(SONGS).filter(songUnlocked)) L.appendChild(row('ui_moves', SONGS[id].name, 'Watch Sarah dance it', false, () => finish({ song: id })));
            L.appendChild(el('p', null, "Songs (Joe's poems)"));
            for (const poem of karaokePoems()) L.appendChild(row('app_poems', poem[0], 'Hear Sarah sing it', false, () => finish({ poem })));
        }
        P.body.appendChild(L);
    });
}

/* ---------------------------------------------------------------- neighbors who text first (and favors by text) */
const INV_LINES = {
    lunch: { _: ["Want to grab lunch at Mac's? I'm heading over now!", "Lunch at Mac's? I'm starving. My treat!", "Mac's has a special today. Lunch? I'll save you a seat!"],
        joe: ["Lunch at Mac's? I'll save you the good seat. The one next to me.", "I'm going to Mac's. Lunch is better with you. That's just a fact. (My treat.)"] },
    hang: { _: ['Want to hang out {place}? I\'ll be there for a while!', "I'm heading {place}. Come hang out?", 'Hang out {place}? I\'ll be the one waving!'],
        joe: ["I'm going {place}. It's nicer when you're there. Come? (Poems available.)", 'Want to hang out {place}? No reason. Okay, one reason. It\'s you.'] },
    chat: { _: ['Come find me when you get a sec! I have something to tell you!', 'Are you free? Come find me, I have news!', 'Come say hi when you can! I have a story for you.'],
        joe: ["Come find me? I have a thing to tell you. It's a good thing. It rhymes.", "Can you come find me? I have something to say. It's not a big deal. It's a medium deal."] },
    favor: { _: ['Could you help me with something? Nothing big!', 'I need a small favor! Can you help?', 'Are you busy? I could use a hand with something.'],
        joe: ["Could you help me with something? I'll write you a thank-you poem. It'll rhyme."] },
    play: { _: ['Want to play {game}? Come find me and we\'ll start!', "I'm SO bored. {game}? Come find me!", 'Play {game} with me? Find me first. That\'s not part of the game. Or is it.'],
        joe: ["Want to play {game}? Come find me. I'm practicing my sneaky face."] },
    gift: { _: ['I have something for you! Come find me!', 'I saw something that made me think of you. Come find me!', 'Surprise! I got you a little something. Come find me!'],
        joe: ["I got you something. Come find me. Don't look at my face, it'll give it away.", "I have a present for you. It's small. Well, medium. Come find me."] },
};
const INV_YES = { lunch: "Yay! See you at Mac's!", hang: 'Yay! See you {place}!', chat: "Great! I'll be around. Text me if you can't find me!", play: "Yay! Come find me! Text me if you can't!",
    gift: 'Yay! Come find me. Text me if you get lost!', joe: "Okay! I'm smiling at my phone. Don't tell anyone." };
const INV_NO = { _: ['No worries! Another time!', 'All good! Next time!'], joe: ["That's okay! I'll save it for later. The seat and the poem."] };
const INV_MISS = { _: ['Aw, I missed you! Another time!', 'I had to head out. Next time!'], joe: ["I waited a little. Then I wrote a short poem about waiting. It's called 'Next Time.'"] };
const INV_SCENE = {
    lunch: { _: ['You made it! Sit down, lunch is on me.', 'There you are! I ordered you the special. My treat!'], joe: ['You came! I got you the special. And I got me the special. We match.'] },
    hangStart: { _: ['You came! This spot is the best, right?', 'Hi! Sit, sit. Look at this view!'], joe: ["You came! I told the ducks you'd come. They didn't believe me."] },
    hangEnd: { _: ["This was so nice. Let's do it again!", 'Best part of my day. Thanks for coming!'], joe: ["Best part of my day. Don't tell the ducks. Actually, tell them."] },
    chat: { _: ['You came! Okay, so. Listen.', 'There you are! I have to tell you something.'], joe: ["You came! Okay. The thing. I just wanted to say you're my favorite person. That's the thing. Bye. Wait, don't go."] },
    gift: { _: ['Here! I saw it and thought of you.', "For you! I'd wrap it, but I'm bad at wrapping."], joe: ["For you. I picked it out myself. I stared at it for ten minutes. It's perfect. Okay, that was a lot."] },
};
const Invites = {
    st() { if (!S.invites) S.invites = { day: -1, n: 0, last: 0, seq: 1, list: [] }; return S.invites; },
    line(pool, id) {
        const L = pool[id] || pool._ || [];
        return Array.isArray(L) ? rpick(L) : L;
    },
    live(inv) { return inv && (inv.state === 'asked' || inv.state === 'yes') && Date.now() < inv.until; },
    pending() { return S && S.invites ? S.invites.list.filter(v => v.state === 'asked' && this.live(v)) : []; },
    pendingFor(id) { return this.pending().find(v => v.id === id) || null; },
    accepted(id) { return S && S.invites ? S.invites.list.find(v => v.id === id && v.state === 'yes' && this.live(v)) || null : null; },
    /* a spot this neighbor is heading to because Sarah said yes (lunch, or hanging out) */
    spotFor(id) { const v = this.accepted(id); return v && (v.kind === 'lunch' || v.kind === 'hang') ? v.spot : null; },
    text(id, t) {
        const log = textsOf(id);
        log.push({ me: false, t: fillText(voiced(id, t)), day: Clock.dayNum(), at: Date.now() });
        if (log.length > 40) log.splice(0, log.length - 40);
    },
    hangSpots(id) {
        const d = NPC_DEFS[id], ok = s => !s.startsWith('in_') && s !== 'home' && s !== 'spring' && PLACE_NAMES[s] && (W0.spots[s] || s.startsWith('bench_'));
        const out = Object.keys(d.fav || {}).filter(ok);
        // (their favorite spot, once they've told her: most often there, 6zm_friendship.js)
        const fav = S.npcs[id] && S.npcs[id].ms2 && FAV_SPOT[id] && FAV_SPOT[id][0];
        if (fav && ok(fav)) out.push(fav, fav, fav);
        return out;
    },
    kindsFor(id) {
        const d = NPC_DEFS[id], h = Clock.hourF(), out = [];
        if (d.shop || d.dj || d.goat) return [['chat', 2], ['gift', hearts(id) >= 2 ? 1.5 : 0]];
        if (id !== 'mac' && roomOpen('restaurant') && hourIn(h, 11, 14.5)) out.push(['lunch', 3]);
        if (!d.spring && this.hangSpots(id).length) out.push(['hang', 3]);
        out.push(['chat', 2]);
        if (!Requests.from(id) && Requests.open().length < REQ_MAX) out.push(['favor', 2]);
        if (hearts(id) >= 2) out.push(['gift', 1.5]);
        // (asking her to play: rare, David, 27 October evening)
        if (VS_SKILL[id] && h >= 9 && h < 19) out.push(['play', 0.7]);
        return out;
    },
    /* every few seconds of play: maybe a neighbor texts */
    tick() {
        if (!S || !S.started || !S.flags.introDone || G.mode !== 'play') return;
        const I = this.st(), now = Date.now();
        for (const v of I.list) {
            if ((v.state === 'asked' || v.state === 'yes') && now >= v.until) {
                if (v.state === 'yes') this.text(v.id, this.line(INV_MISS, v.id));
                v.state = 'gone';
            }
        }
        if (I.list.length > 12) I.list.splice(0, I.list.length - 12);
        if (S.settings && S.settings.npcTexts === false) return;
        if (G.busy || UI.modal || UI.dialogOpen) return;
        const day = Clock.dayNum();
        if (I.day !== day) { I.day = day; I.n = 0; }
        if (!G.inviteWarm) G.inviteWarm = now;
        if (I.n >= 2 || now - (I.last || 0) < 25 * 60e3 || now - G.inviteWarm < 4 * 60e3) return;
        const h = Clock.hourF();
        if (h < 9 || h >= 20.5 || R() > 1 / 60) return;
        this.send();
    },
    send(forceId, forceKind) {
        const I = this.st();
        const ids = forceId ? [forceId] : textContacts().filter(id => {
            const n = NPCs.get(id);
            return n && !n.sleeping && !n.talking && !n.script && !NPC_DEFS[id].dj && !I.list.some(v => v.id === id && this.live(v));
        });
        if (!ids.length) return null;
        const id = forceId || weighted(ids.map(x => [x, x === 'joe' ? 1.5 : 1]));
        const kinds = this.kindsFor(id).filter(k => k[1] > 0);
        const kind = forceKind || (kinds.length ? weighted(kinds) : 'chat');
        const inv = { n: I.seq++, id, kind, at: Date.now(), until: Date.now() + 60 * 60e3, state: 'asked' };
        if (kind === 'lunch') inv.spot = 'in_restaurant';
        if (kind === 'hang') { const sp = this.hangSpots(id); inv.spot = sp.length ? rpick(sp) : 'plaza'; }
        if (kind === 'play') inv.game = rpick(['tag', 'hide', 'volley', 'rope', 'vs']);
        const place = inv.spot ? placeName(id, inv.spot) : '';
        I.list.push(inv);
        I.n++; I.last = Date.now();
        this.text(id, this.line(INV_LINES[kind], id).replace('{place}', place).replace('{game}', { hide: 'hide-and-seek', volley: 'volleyball', rope: 'jump rope', vs: 'a two-player arcade game' }[inv.game] || 'tag'));
        Save.touch();
        Sfx.ui('ok');
        UI.toast(`${NPC_DEFS[id].name} texted you!`, 'app_texts');
        HUD.update();
        return inv;
    },
    /* Sarah answers from the Messages app */
    answer(inv, yes) {
        const id = inv.id, log = textsOf(id);
        log.push({ me: true, t: yes ? 'Sure!' : "Can't right now, sorry!", day: Clock.dayNum(), at: Date.now() });
        if (!yes) { inv.state = 'no'; this.text(id, this.line(INV_NO, id)); Save.touch(); HUD.update(); return; }
        if (inv.kind === 'favor') {
            inv.state = 'done';
            this.text(id, this.helpReply(id) || 'Oh! Never mind, I figured it out. Thank you though!');
        } else {
            inv.state = 'yes';
            const place = inv.spot ? placeName(id, inv.spot) : '';
            this.text(id, (id === 'joe' ? INV_YES.joe : this.line({ _: [INV_YES[inv.kind]] }, id)).replace('{place}', place));
            if (inv.kind === 'lunch' || inv.kind === 'hang') NPCs.place(false);
        }
        Save.touch();
        HUD.update();
    },
    /* "Need a hand?" by text: a favor goes straight onto the To-do list */
    helpReply(id) {
        const n = NPCs.get(id), d = NPC_DEFS[id];
        if (!n || (n.sleeping && !d.dj)) return null;
        if (d.dj) return 'A favor? Come dance! That IS the favor.';
        const mine = Requests.from(id);
        if (mine) return Requests.remind(mine);
        if (Requests.open().length >= REQ_MAX) return "You look busy! Finish your To-do list first. I'm not going anywhere.";
        let t = null;
        for (let k = 0; k < 4 && (!t || t.kind === 'deliver'); k++) { try { t = Requests.make(n); } catch (e) { t = null; } }
        if (!t || t.kind === 'deliver') return "Me? I'm all set today. Thanks for asking, though!";
        Requests.st().list.push(t);
        Save.touch();
        setTimeout(() => UI.toast('Added to your To-do list', 'app_tasks'), 900);
        return Requests.askLine(t);
    },
    giftFor() {
        const pool = Object.keys(ITEMS).filter(k => {
            const it = ITEMS[k];
            return it.type === 'furniture' && FURN[k] && !it.pottery && !FURN[k].pottery && (it.price || 0) > 0 && it.price <= 4000 && !S.seen[k] && !unsellable(k);
        });
        return pool.length ? rpick(pool) : null;
    },
    /* the neighbor Sarah said yes to: little thought bubbles so she can spot them */
    nudge() {
        if (!S || !S.invites || G.mode !== 'play') return;
        for (const v of S.invites.list) {
            if (v.state !== 'yes' || !this.live(v)) continue;
            const n = NPCs.get(v.id);
            if (n && !n.sleeping && n.area === G.area.id && !n.talking && !n.emote) { n.emote = v.kind === 'gift' ? 'sparkle' : v.kind === 'chat' ? 'idea' : 'heart'; n.emoteT = 50; }
        }
    },
    /* talking to someone whose invite Sarah said yes to */
    async talk(n) {
        const inv = this.accepted(n.id);
        if (!inv) return false;
        const id = n.id, d = NPC_DEFS[id];
        const say = (pool, extra) => UI.say(id, voiced(id, fillText(this.line(pool, id).replace('{place}', extra || ''))), { keep: true });
        if (inv.kind === 'lunch') {
            if (n.area !== 'restaurant') { await UI.say(id, voiced(id, this.line({ _: ["I'm heading to Mac's! Meet me there!"] }, id))); return true; }
            inv.state = 'done';
            await say(INV_SCENE.lunch);
            UI.hideDialog();
            await eatHere(todaysMenu().special, id);
            remember(id, 'lunch');
        } else if (inv.kind === 'hang') {
            const place = placeName(id, inv.spot);
            const there = n.want && n.want.key === 'inv:' + inv.spot && !n.path;
            if (!there) { await UI.say(id, voiced(id, this.line({ _: [`On my way! Meet me ${place}!`] }, id))); return true; }
            inv.state = 'done';
            await say(INV_SCENE.hangStart);
            n.emote = 'heart'; n.emoteT = 90;
            G.player.emote = 'heart'; G.player.emoteT = 90;
            await UI.say(null, `Sarah and ${d.name} hang out ${place} for a while. They watch the island go by, swap stories, and laugh at nothing in particular.`, { keep: true });
            await say(INV_SCENE.hangEnd);
            remember(id, 'hang', { place });
            if (id !== 'joe') { const up = addPts(id, 5, 'hangout'); if (up) await heartUp(n, up); }
        } else if (inv.kind === 'chat') {
            inv.state = 'done';
            await say(INV_SCENE.chat);
            if (id !== 'joe') {
                await UI.say(id, voiced(id, chatLine(n)), { keep: true });
                const up = addPts(id, 3, 'hangout');
                if (up) await heartUp(n, up);
            }
        } else if (inv.kind === 'play') {
            // (a game they asked for: the one they said if it fits here and now, or another that does)
            inv.state = 'done';
            const games = igAskGames(n), g = games.find(x => x[0] === inv.game || (inv.game === 'vs' && x[0].startsWith('vs:'))) || games[0];
            if (!g) { await UI.say(id, voiced(id, this.line({ _: ["You came! Let's play another time, though. Not the right spot for it.", 'Hi! Oh, not here. Next time, okay?'] }, id)), { keep: true }); Save.touch(); return true; }
            await UI.say(id, voiced(id, this.line({ _: ['You came! Okay, {game}. Ready?', "Yay! Let's play {game}!"] }, id).replace('{game}', g[0].startsWith('vs:') ? g[1] : g[1].toLowerCase())), { keep: true });
            Save.touch();
            UI.hideDialog();
            await igBegin(n, g[0]);
            return true;
        } else if (inv.kind === 'gift') {
            inv.state = 'done';
            await say(INV_SCENE.gift);
            const g = this.giftFor();
            if (g) receive(g, 1); else addMoney(1000, true, 'Found & gifts');
            n.emote = 'heart'; n.emoteT = 80;
            if (id !== 'joe') { const up = addPts(id, 2, 'hangout'); if (up) await heartUp(n, up); }
        } else return false;
        Save.touch();
        return true;
    },
};

/* ---------------------------------------------------------------- the sea around the big map */
/* one small look at the island map (a single readback): the sea's color, and a patch of open water for the boat */
function mapSeaSample(M) {
    if (M.seaCol && M.seaKey === M.baseKey) return;
    M.seaKey = M.baseKey;
    const w = 64, h = Math.max(1, Math.round(64 * M.base.height / M.base.width));
    let data = null;
    try {
        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        const x = c.getContext('2d', { willReadFrequently: true });
        x.drawImage(M.base, 0, 0, w, h);
        data = x.getImageData(0, 0, w, h).data;
    } catch (e) { data = null; }
    const px = (fx, fy) => { if (!data) return null; const i = (Math.min(h - 1, Math.max(0, Math.floor(fy * h))) * w + Math.min(w - 1, Math.max(0, Math.floor(fx * w)))) * 4; return [data[i], data[i + 1], data[i + 2]]; };
    const c0 = px(0.005, 0.005) || [58, 143, 208];
    M.seaRGB = c0;
    M.seaCol = `rgb(${c0[0]},${c0[1]},${c0[2]})`;
    const sea = (fx, fy) => { const c = px(fx, fy); return !c || Math.abs(c[0] - c0[0]) + Math.abs(c[1] - c0[1]) + Math.abs(c[2] - c0[2]) < 70; };
    const cands = [[0.1, 0.94], [0.9, 0.94], [0.05, 0.55], [0.95, 0.55], [0.5, 0.04], [0.1, 0.06], [0.9, 0.06], [0.3, 0.97], [0.7, 0.97]];
    const bw = M.base.width, bh = M.base.height;
    const at = cands.find(([fx, fy]) => sea(fx, fy) && sea(fx - 0.03, fy) && sea(fx + 0.03, fy));
    M.boatAt = at ? [at[0] * bw, at[1] * bh] : [-60, bh * 0.6];
}
function mapSea(M, g, ox, oy, z, dpr) {
    mapSeaSample(M);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.fillStyle = M.seaCol;
    g.fillRect(0, 0, M.W, M.H);
    // little waves, anchored to the sea so they move when the map is dragged
    const bw = M.base.width, bh = M.base.height, step = 40, t = Date.now() / 1000;
    const x0 = Math.floor(-ox / z / step) - 1, x1 = Math.ceil((M.W - ox) / z / step) + 1;
    const y0 = Math.floor(-oy / z / step) - 1, y1 = Math.ceil((M.H - oy) / z / step) + 1;
    if ((x1 - x0) * (y1 - y0) > 6000) return;
    const w = Math.max(3, Math.min(7, 5 * z));
    for (const pass of [0, 1]) {
        g.beginPath();
        for (let j = y0; j <= y1; j++) for (let i = x0; i <= x1; i++) {
            if (((i + j) & 1) !== pass) continue;
            const mx = i * step + (j & 1 ? step / 2 : 0), my = j * step;
            if (mx > -8 && mx < bw + 8 && my > -8 && my < bh + 8) continue;           // the island map draws its own sea
            const x = ox + (mx + Math.sin(t * 0.7 + i * 1.3 + j) * 3) * z, y = oy + my * z;
            g.moveTo(x - w, y);
            g.quadraticCurveTo(x - w / 2, y - w * 0.6, x, y);
            g.quadraticCurveTo(x + w / 2, y - w * 0.6, x + w, y);
        }
        g.strokeStyle = `rgba(255,255,255,${(0.2 + 0.12 * Math.sin(t * 1.1 + pass * 3)).toFixed(3)})`;
        g.lineWidth = 1.4;
        g.stroke();
    }
}
function mapExtras(M, g, ox, oy, z) {
    const t = Date.now() / 1000, bw = M.base.width, bh = M.base.height;
    // a little sailboat somewhere out on the water
    mapSeaSample(M);
    const [bx0, by0] = M.boatAt;
    const bx = ox + (bx0 + Math.sin(t * 0.15) * 26) * z, by = oy + (by0 + Math.sin(t * 0.9) * 1.5) * z;
    const k = Math.max(0.8, Math.min(2.2, z * 1.6));
    const dir = Math.cos(t * 0.15) >= 0 ? 1 : -1;
    g.save();
    g.translate(bx, by); g.scale(k * dir, k);
    g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineWidth = 1;
    g.beginPath(); g.moveTo(-16, 5); g.lineTo(-24, 6); g.moveTo(-14, 7); g.lineTo(-22, 9); g.stroke();
    g.fillStyle = '#7a4a2a'; g.beginPath(); g.moveTo(-12, 0); g.lineTo(12, 0); g.lineTo(8, 6); g.lineTo(-9, 6); g.closePath(); g.fill();
    g.fillStyle = '#b3263a'; g.fillRect(-12, 0, 24, 1.6);
    g.fillStyle = '#5a3a24'; g.fillRect(-0.8, -20, 1.6, 20);
    g.fillStyle = '#fff7f1'; g.beginPath(); g.moveTo(1.5, -19); g.lineTo(11, -2); g.lineTo(1.5, -2); g.closePath(); g.fill();
    g.fillStyle = '#f2e6d8'; g.beginPath(); g.moveTo(-1.5, -15); g.lineTo(-8, -2); g.lineTo(-1.5, -2); g.closePath(); g.fill();
    g.fillStyle = '#e0559a'; g.beginPath(); g.moveTo(0.8, -21); g.lineTo(6, -19.5); g.lineTo(0.8, -18); g.closePath(); g.fill();
    g.restore();
    // gulls drifting across
    g.strokeStyle = 'rgba(255,255,255,0.9)'; g.lineWidth = 1.6;
    g.beginPath();
    for (let i = 0; i < 3; i++) {
        const span = M.W + 160, x = ((t * (14 + i * 4) + i * 420) % span) - 80, y = 86 + i * 46 + Math.sin(t * 0.8 + i * 2) * 10;
        const f = Math.sin(t * 5 + i) * 2.5;
        g.moveTo(x - 7, y - 2 + f); g.quadraticCurveTo(x - 3, y - 5, x, y); g.quadraticCurveTo(x + 3, y - 5, x + 7, y - 2 + f);
    }
    g.stroke();
    // the compass
    const r = 30, cx = 18 + r + 4, cy = M.H - 70 - r;
    g.save();
    g.translate(cx, cy);
    g.fillStyle = 'rgba(255,247,230,0.92)'; g.beginPath(); g.arc(0, 0, r, 0, 7); g.fill();
    g.strokeStyle = '#9a6b45'; g.lineWidth = 2; g.stroke();
    g.strokeStyle = 'rgba(154,107,69,0.35)'; g.lineWidth = 1; g.beginPath(); g.arc(0, 0, r - 7, 0, 7); g.stroke();
    const pt = (ang, len, wid, col) => {
        g.fillStyle = col; g.beginPath();
        g.moveTo(Math.cos(ang) * len, Math.sin(ang) * len);
        g.lineTo(Math.cos(ang + Math.PI / 2) * wid, Math.sin(ang + Math.PI / 2) * wid);
        g.lineTo(Math.cos(ang - Math.PI / 2) * wid, Math.sin(ang - Math.PI / 2) * wid);
        g.closePath(); g.fill();
    };
    for (let q = 0; q < 4; q++) pt(Math.PI / 4 + q * Math.PI / 2, r - 14, 3, '#c9a47a');
    pt(-Math.PI / 2, r - 9, 4.5, '#e0405a'); pt(Math.PI / 2, r - 9, 4.5, '#6b5a78'); pt(0, r - 9, 4.5, '#8a7a90'); pt(Math.PI, r - 9, 4.5, '#8a7a90');
    g.fillStyle = '#fff7f1'; g.beginPath(); g.arc(0, 0, 2.5, 0, 7); g.fill();
    g.font = '700 11px "Fredoka", system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    const lab = (s, x, y, col) => { g.fillStyle = col; g.fillText(s, x, y); };
    lab('N', 0, -r + 7, '#b3263a'); lab('S', 0, r - 6, '#3b2a45'); lab('E', r - 6, 0.5, '#3b2a45'); lab('W', -r + 6, 0.5, '#3b2a45');
    g.restore();
}

