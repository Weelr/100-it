"use strict";
// Tiny QR code maker (byte mode, error correction M, versions 1–10), for the
// "open on your phone" code in Settings. qrSvg(text) returns an <svg> string.
(() => {
  const DATA = [0, 16, 28, 44, 64, 86, 108, 124, 154, 182, 216];   // data codewords (M)
  const ECC = [0, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26];         // ecc codewords per block (M)
  const BLOCKS = [0, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5];                // number of blocks (M)
  const ALIGN = [[], [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34], [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50]];

  // GF(256) for Reed–Solomon.
  const EXP = new Array(512), LOG = new Array(256);
  for (let i = 0, x = 1; i < 255; i++) { EXP[i] = x; LOG[x] = i; x <<= 1; if (x & 256) x ^= 0x11d; }
  for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
  const mul = (a, b) => (a && b ? EXP[LOG[a] + LOG[b]] : 0);
  function rsGen(n) {
    let g = [1];
    for (let i = 0; i < n; i++) {
      const next = new Array(g.length + 1).fill(0);
      for (let j = 0; j < g.length; j++) { next[j] ^= g[j]; next[j + 1] ^= mul(g[j], EXP[i]); }
      g = next;
    }
    return g;
  }
  function rsRem(data, n) {
    const g = rsGen(n), r = new Array(n).fill(0);
    for (const d of data) {
      const f = d ^ r.shift();
      r.push(0);
      for (let i = 0; i < n; i++) r[i] ^= mul(g[i + 1], f);
    }
    return r;
  }

  function encode(text) {
    const bytes = [...new TextEncoder().encode(text)];
    let v = 1;
    while (v <= 10 && 4 + (v < 10 ? 8 : 16) + bytes.length * 8 > DATA[v] * 8) v++;
    if (v > 10) throw new Error("text too long for QR");
    // Bit stream.
    const bits = [];
    const put = (val, n) => { for (let i = n - 1; i >= 0; i--) bits.push((val >>> i) & 1); };
    put(4, 4);
    put(bytes.length, v < 10 ? 8 : 16);
    for (const b of bytes) put(b, 8);
    const cap = DATA[v] * 8;
    put(0, Math.min(4, cap - bits.length));
    while (bits.length % 8) bits.push(0);
    for (let pad = 0xec; bits.length < cap; pad ^= 0xec ^ 0x11) put(pad, 8);
    const words = [];
    for (let i = 0; i < bits.length; i += 8) words.push(bits.slice(i, i + 8).reduce((a, b) => (a << 1) | b, 0));
    // Blocks + error correction, then interleave.
    const nb = BLOCKS[v], ec = ECC[v], short = Math.floor(DATA[v] / nb), longCount = DATA[v] % nb;
    const blocks = [];
    for (let i = 0, k = 0; i < nb; i++) {
      const len = short + (i >= nb - longCount ? 1 : 0);
      const d = words.slice(k, k + len); k += len;
      blocks.push({ d, e: rsRem(d, ec) });
    }
    const out = [];
    for (let i = 0; i <= short; i++) for (const b of blocks) if (i < b.d.length) out.push(b.d[i]);
    for (let i = 0; i < ec; i++) for (const b of blocks) out.push(b.e[i]);
    return { v, words: out };
  }

  function build(text) {
    const { v, words } = encode(text);
    const n = v * 4 + 17;
    const m = Array.from({ length: n }, () => new Array(n).fill(0));
    const fn = Array.from({ length: n }, () => new Array(n).fill(false));
    const set = (x, y, on) => { m[y][x] = on ? 1 : 0; fn[y][x] = true; };
    // Finders + separators.
    for (const [cx, cy] of [[3, 3], [n - 4, 3], [3, n - 4]])
      for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
        const x = cx + dx, y = cy + dy;
        if (x < 0 || y < 0 || x >= n || y >= n) continue;
        const d = Math.max(Math.abs(dx), Math.abs(dy));
        set(x, y, d !== 2 && d !== 4);
      }
    // Timing.
    for (let i = 8; i < n - 8; i++) { set(6, i, i % 2 === 0); set(i, 6, i % 2 === 0); }
    // Alignment.
    const al = ALIGN[v];
    for (const ay of al) for (const ax of al) {
      if ((ax === 6 && ay === 6) || (ax === 6 && ay === al[al.length - 1]) || (ay === 6 && ax === al[al.length - 1])) continue;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) set(ax + dx, ay + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
    }
    // Reserve format areas + dark module.
    const format = (mask) => {
      const data = (0 << 3) | mask; // M = 00
      let r = data;
      for (let i = 0; i < 10; i++) r = (r << 1) ^ ((r >>> 9) * 0x537);
      const b = ((data << 10) | r) ^ 0x5412;
      const bit = (i) => ((b >>> i) & 1) === 1;
      for (let i = 0; i <= 5; i++) set(8, i, bit(i));
      set(8, 7, bit(6)); set(8, 8, bit(7)); set(7, 8, bit(8));
      for (let i = 9; i < 15; i++) set(14 - i, 8, bit(i));
      for (let i = 0; i < 8; i++) set(n - 1 - i, 8, bit(i));
      for (let i = 8; i < 15; i++) set(8, n - 15 + i, bit(i));
      set(8, n - 8, true);
    };
    format(0);
    // Version info.
    if (v >= 7) {
      let r = v;
      for (let i = 0; i < 12; i++) r = (r << 1) ^ ((r >>> 11) * 0x1f25);
      const b = (v << 12) | r;
      for (let i = 0; i < 18; i++) {
        const on = ((b >>> i) & 1) === 1, a = n - 11 + (i % 3), c = Math.floor(i / 3);
        set(a, c, on); set(c, a, on);
      }
    }
    // Data in the zigzag.
    let i = 0;
    for (let right = n - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;
      for (let vert = 0; vert < n; vert++) for (let j = 0; j < 2; j++) {
        const x = right - j, up = ((right + 1) & 2) === 0, y = up ? n - 1 - vert : vert;
        if (fn[y][x]) continue;
        if (i < words.length * 8) m[y][x] = (words[i >>> 3] >>> (7 - (i & 7))) & 1;
        i++;
      }
    }
    // Pick the mask with the lowest penalty.
    const MASKS = [
      (x, y) => (x + y) % 2 === 0, (x, y) => y % 2 === 0, (x) => x % 3 === 0, (x, y) => (x + y) % 3 === 0,
      (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0, (x, y) => ((x * y) % 2) + ((x * y) % 3) === 0,
      (x, y) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0, (x, y) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0,
    ];
    const apply = (k) => { for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (!fn[y][x] && MASKS[k](x, y)) m[y][x] ^= 1; };
    let best = 0, bestScore = Infinity;
    for (let k = 0; k < 8; k++) {
      apply(k); format(k);
      const s = penalty(m, n);
      if (s < bestScore) { bestScore = s; best = k; }
      apply(k);
    }
    apply(best); format(best);
    return m;
  }

  function penalty(m, n) {
    let p = 0, dark = 0;
    const line = (get) => {
      let run = 1;
      for (let i = 1; i <= n; i++) {
        if (i < n && get(i) === get(i - 1)) run++;
        else { if (run >= 5) p += run - 2; run = 1; }
      }
      for (let i = 0; i + 10 < n + 1; i++) {
        const s = Array.from({ length: 11 }, (_, k) => (i + k < n ? get(i + k) : 0)).join("");
        if (s === "10111010000" || s === "00001011101") p += 40;
      }
    };
    for (let y = 0; y < n; y++) line((x) => m[y][x]);
    for (let x = 0; x < n; x++) line((y) => m[y][x]);
    for (let y = 0; y < n - 1; y++) for (let x = 0; x < n - 1; x++) {
      const c = m[y][x];
      if (c === m[y][x + 1] && c === m[y + 1][x] && c === m[y + 1][x + 1]) p += 3;
    }
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) dark += m[y][x];
    p += Math.floor(Math.abs(dark * 20 - n * n * 10) / (n * n)) * 10;
    return p;
  }

  window.qrMatrix = build;
  window.qrSvg = (text, fg = "#0d1813", bg = "#ffffff") => {
    const m = build(text), n = m.length, q = 3;
    let d = "";
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (m[y][x]) d += `M${x + q} ${y + q}h1v1h-1z`;
    return `<svg viewBox="0 0 ${n + q * 2} ${n + q * 2}" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="${bg}"/><path d="${d}" fill="${fg}"/></svg>`;
  };
})();
