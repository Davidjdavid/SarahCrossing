// Live presence on an island: who's there right now, where they're standing,
// what they say. A small WebSocket server (RFC 6455, text frames only) on the
// same HTTP server, at /api/live/<island id>?who=<person>.
//
// Messages are JSON. From a player:
//   { t: 'state', area, x, y, dir, moving, run, pose, look }   where they are (sent when it changes)
//   { t: 'say', text }                                         a chat line (bubble over their head)
//   { t: 'emote', e }                                          a dance move or emote
// To players:
//   { t: 'here', people: [{ who, ...state }] }    on connecting: everyone else on the island
//   { t: 'join', who, ...state } / { t: 'leave', who }
//   { t: 'state' | 'say' | 'emote', who, ... }    what someone else did
//   { t: 'island', rev }                          Sarah's island was saved (visitors refresh it)
//   { t: 'mail' }                                 a letter is waiting for you
// One connection per person per island: connecting again (another tab, another
// device) replaces the old one, which is closed with code 4000.

import crypto from 'node:crypto';

const GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';
const MAX_FRAME = 64 * 1024;
const PING_EVERY_MS = 25_000;
const MSGS_PER_SECOND = 40;
const STATE_KEYS = ['area', 'x', 'y', 'dir', 'moving', 'run', 'pose', 'look', 'sit'];

/** A frame: FIN set, the opcode, the payload unmasked (servers never mask). */
function frame(opcode, payload = Buffer.alloc(0)) {
  const n = payload.length;
  const head = n < 126 ? Buffer.from([0x80 | opcode, n]) : n < 65536 ? Buffer.from([0x80 | opcode, 126, n >> 8, n & 255]) : Buffer.alloc(10);
  if (n >= 65536) {
    head[0] = 0x80 | opcode;
    head[1] = 127;
    head.writeBigUInt64BE(BigInt(n), 2);
  }
  return Buffer.concat([head, payload]);
}

class Conn {
  constructor(socket, island, who, log) {
    this.socket = socket;
    this.island = island;
    this.who = who;
    this.log = log;
    this.buf = Buffer.alloc(0);
    this.parts = [];
    this.state = {};
    this.alive = true;
    this.closed = false;
    this.count = 0;
    this.countAt = Date.now();
    this.onMessage = () => {};
    this.onClose = () => {};
    socket.on('data', (d) => this.data(d));
    socket.on('close', () => this.gone());
    socket.on('error', () => this.gone());
  }

  send(obj) {
    if (this.closed) return;
    this.socket.write(frame(0x1, Buffer.from(JSON.stringify(obj))));
  }

  close(code = 1000, reason = '') {
    if (this.closed) return;
    const r = Buffer.from(reason);
    const p = Buffer.alloc(2 + r.length);
    p.writeUInt16BE(code, 0);
    r.copy(p, 2);
    this.socket.write(frame(0x8, p));
    this.socket.end();
    this.gone();
  }

  gone() {
    if (this.closed) return;
    this.closed = true;
    this.socket.destroy();
    this.onClose();
  }

  data(d) {
    this.buf = this.buf.length ? Buffer.concat([this.buf, d]) : d;
    while (this.buf.length >= 2) {
      const b0 = this.buf[0];
      const b1 = this.buf[1];
      const fin = (b0 & 0x80) !== 0;
      const opcode = b0 & 0x0f;
      const masked = (b1 & 0x80) !== 0;
      let len = b1 & 0x7f;
      let off = 2;
      if (len === 126) {
        if (this.buf.length < 4) return;
        len = this.buf.readUInt16BE(2);
        off = 4;
      } else if (len === 127) {
        if (this.buf.length < 10) return;
        const big = this.buf.readBigUInt64BE(2);
        if (big > BigInt(MAX_FRAME)) return this.close(1009, 'too big');
        len = Number(big);
        off = 10;
      }
      if (!masked) return this.close(1002, 'clients must mask');
      if (len > MAX_FRAME) return this.close(1009, 'too big');
      if (this.buf.length < off + 4 + len) return;
      const mask = this.buf.subarray(off, off + 4);
      const payload = Buffer.from(this.buf.subarray(off + 4, off + 4 + len));
      for (let i = 0; i < payload.length; i++) payload[i] ^= mask[i & 3];
      this.buf = this.buf.subarray(off + 4 + len);

      if (opcode === 0x8) return this.close(1000);
      if (opcode === 0x9) {
        this.socket.write(frame(0xa, payload));
        continue;
      }
      if (opcode === 0xa) {
        this.alive = true;
        continue;
      }
      if (opcode === 0x1 || opcode === 0x0) {
        this.parts.push(payload);
        if (this.parts.reduce((n, p) => n + p.length, 0) > MAX_FRAME) return this.close(1009, 'too big');
        if (!fin) continue;
        const text = Buffer.concat(this.parts).toString('utf8');
        this.parts = [];
        this.alive = true;
        const now = Date.now();
        if (now - this.countAt > 1000) {
          this.count = 0;
          this.countAt = now;
        }
        if (++this.count > MSGS_PER_SECOND) continue;
        let msg;
        try {
          msg = JSON.parse(text);
        } catch {
          continue;
        }
        if (msg && typeof msg === 'object') this.onMessage(msg);
        continue;
      }
      if (opcode === 0x2) continue; // binary: not used
      return this.close(1002, 'bad frame');
    }
  }
}

const clean = (v, max) => (typeof v === 'string' ? v.replace(/[\u0000-\u001f\u007f]+/g, ' ').trim().slice(0, max) : '');

/** Only the state fields we know, with sane values. */
function cleanState(msg) {
  const out = {};
  for (const k of STATE_KEYS) {
    const v = msg[k];
    if (v === undefined) continue;
    if (k === 'x' || k === 'y') {
      if (typeof v === 'number' && Number.isFinite(v)) out[k] = Math.round(v * 10) / 10;
    } else if (k === 'moving' || k === 'run' || k === 'sit') out[k] = !!v;
    else if (k === 'look') {
      if (v && typeof v === 'object' && JSON.stringify(v).length < 800) out[k] = v;
    } else if (typeof v === 'string' || v === null) out[k] = v === null ? null : clean(v, 40);
  }
  return out;
}

export class Live {
  /**
   * `hasAccess(req)`: may this request in (the login cookie)?
   * `islandExists(id)`: resolves true for a real island.
   */
  constructor({ hasAccess, islandExists, log = (m) => console.error(m) }) {
    this.hasAccess = hasAccess;
    this.islandExists = islandExists;
    this.log = log;
    this.rooms = new Map(); // island id -> Map(who -> Conn)
    this.timer = setInterval(() => this.heartbeat(), PING_EVERY_MS);
    this.timer.unref();
  }

  attach(server) {
    server.on('upgrade', (req, socket) => {
      this.upgrade(req, socket).catch((err) => {
        this.log(`live: ${err.message}`);
        socket.destroy();
      });
    });
  }

  async upgrade(req, socket) {
    const refuse = (status, text) => {
      socket.write(`HTTP/1.1 ${status} ${text}\r\nConnection: close\r\nContent-Length: 0\r\n\r\n`);
      socket.destroy();
    };
    const url = new URL(req.url, 'http://site.invalid');
    const m = /^\/api\/live\/([A-Za-z0-9_-]{6,40})$/.exec(url.pathname);
    const who = url.searchParams.get('who') || '';
    if (!m || !/^[a-z]{2,20}$/.test(who)) return refuse(404, 'Not Found');
    if (String(req.headers.upgrade || '').toLowerCase() !== 'websocket' || !req.headers['sec-websocket-key']) return refuse(400, 'Bad Request');
    if (!this.hasAccess(req)) return refuse(401, 'Unauthorized');
    const island = m[1];
    if (!(await this.islandExists(island))) return refuse(404, 'Not Found');
    const accept = crypto.createHash('sha1').update(req.headers['sec-websocket-key'] + GUID).digest('base64');
    socket.write(`HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ${accept}\r\n\r\n`);
    socket.setNoDelay(true);
    this.join(new Conn(socket, island, who, this.log));
  }

  room(island) {
    let r = this.rooms.get(island);
    if (!r) this.rooms.set(island, (r = new Map()));
    return r;
  }

  join(conn) {
    const room = this.room(conn.island);
    const old = room.get(conn.who);
    if (old) {
      old.onClose = () => {};
      old.close(4000, 'opened somewhere else');
    }
    room.set(conn.who, conn);
    conn.send({ t: 'here', people: [...room.values()].filter((c) => c !== conn).map((c) => ({ who: c.who, ...c.state })) });
    this.broadcast(conn.island, { t: 'join', who: conn.who, ...conn.state }, conn);
    conn.onMessage = (msg) => this.message(conn, msg);
    conn.onClose = () => {
      if (room.get(conn.who) === conn) room.delete(conn.who);
      if (!room.size) this.rooms.delete(conn.island);
      this.broadcast(conn.island, { t: 'leave', who: conn.who });
    };
  }

  message(conn, msg) {
    if (msg.t === 'state') {
      const st = cleanState(msg);
      Object.assign(conn.state, st);
      this.broadcast(conn.island, { t: 'state', who: conn.who, ...st }, conn);
    } else if (msg.t === 'say') {
      const text = clean(msg.text, 200);
      if (text) this.broadcast(conn.island, { t: 'say', who: conn.who, text }, conn);
    } else if (msg.t === 'emote') {
      const e = clean(msg.e, 30);
      if (e) this.broadcast(conn.island, { t: 'emote', who: conn.who, e }, conn);
    }
  }

  /** To everyone on the island (but `except`). */
  broadcast(island, msg, except) {
    const room = this.rooms.get(island);
    if (!room) return;
    for (const c of room.values()) if (c !== except) c.send(msg);
  }

  /** To one person on the island, if they're there. */
  sendTo(island, who, msg) {
    const c = this.rooms.get(island)?.get(who);
    if (c) c.send(msg);
  }

  /** Who's on an island right now. */
  here(island) {
    return [...(this.rooms.get(island)?.keys() ?? [])];
  }

  heartbeat() {
    for (const room of this.rooms.values()) {
      for (const c of room.values()) {
        if (!c.alive) {
          c.gone();
          continue;
        }
        c.alive = false;
        c.socket.write(frame(0x9));
      }
    }
  }
}
