/* the story: flags, what happens when, who says what. (Filled in by the game's own files.) */
const Story = {
    hooks: { entered: [], got: [], tick: [], hour: [], restore: [] },
    on(ev, fn) { this.hooks[ev].push(fn); },
    entered(m, from) { for (const f of this.hooks.entered) f(m, from); },
    got(what, e) { for (const f of this.hooks.got) f(what, e); },
    tick(dt) { for (const f of this.hooks.tick) f(dt); },
    hourChanged(h) { for (const f of this.hooks.hour) f(h); },
    restore() { for (const f of this.hooks.restore) f(); },
};
