"use strict";
// Phone page (GitHub Pages): the same UI as the Windows app, but the data comes
// from the secret gist the app on your computer keeps up to date.
// On the computer this file does nothing.
window.REMOTE = null;
(() => {
  const qs = new URLSearchParams(location.search);
  if (!(location.hostname.endsWith("github.io") || qs.has("g"))) return;
  document.documentElement.classList.add("remote");

  let id = (qs.get("g") || "").replace(/[^0-9a-f]/gi, "");
  try { if (id) localStorage.setItem("gist", id); else id = localStorage.getItem("gist") || ""; } catch {}

  const origFetch = window.fetch.bind(window);
  const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { "Content-Type": "application/json" } });
  const R = (window.REMOTE = { id, data: null, files: {}, error: id ? null : "nolink", fetchedAt: 0 });
  let inflight = null;

  async function pull() {
    if (!id) throw new Error("nolink");
    // GitHub answers "not modified" when nothing changed, and those don't count toward its limit.
    const r = await origFetch(`https://api.github.com/gists/${id}`, { cache: "no-cache" });
    if (r.status === 404) { R.error = "gone"; throw new Error("gone"); }
    if (!r.ok) { R.error = r.status === 403 || r.status === 429 ? "limit" : "net"; throw new Error(R.error); }
    const g = await r.json();
    const main = g.files?.["progress.json"];
    if (!main || main.truncated) { R.error = "empty"; throw new Error("empty"); }
    const d = JSON.parse(main.content || "{}");
    if (!d.state) { R.error = "empty"; throw new Error("empty"); }
    const files = {};
    for (const [name, f] of Object.entries(g.files)) if (name !== "progress.json" && !f.truncated) files[name] = f.content;
    R.files = files;
    R.data = d;
    R.error = null;
    R.fetchedAt = Date.now();
    // History and sessions come from the computer.
    const x = d.extra || {};
    try {
      for (const k of ["history", "sessions", "session"]) if (x[k] !== undefined) localStorage.setItem(k, JSON.stringify(x[k]));
    } catch {}
  }
  function load(force) {
    if (!force && R.data && Date.now() - R.fetchedAt < 20000) return Promise.resolve();
    if (!inflight) inflight = pull().catch((e) => { if (!R.data) throw e; }).finally(() => { inflight = null; });
    return inflight;
  }
  R.refresh = () => load(true);

  window.fetch = async (input, init) => {
    const url = typeof input === "string" ? input : input.url;
    if (!url.startsWith("/api/")) return origFetch(input, init);
    const path = url.split("?")[0];
    if (path === "/api/state" || path === "/api/hours") {
      try { await load(); } catch {}
      if (!R.data) return path === "/api/state" ? json({ saveDir: "", error: "phone", slots: [] }) : json({}, 503);
      return json(path === "/api/state" ? R.data.state : R.data.hours);
    }
    return json({ error: "phone" }, 404); // computer-only things (folders, updates, Windows notifications…)
  };

  // Pictures: the save's screenshot and game logos are stored in the gist as data: URLs.
  R.asset = (p) => {
    let m = /^\/api\/thumb\/([\w-]+)\.jpg/.exec(p);
    if (m) return R.files[`thumb_${m[1]}.txt`] || "";
    m = /^\/api\/logo\/([\w-]+)/.exec(p);
    if (m) return R.files[`logo_${m[1]}.txt`] || "";
    return p;
  };

  // Coming back to the page: fetch right away.
  document.addEventListener("visibilitychange", () => { if (!document.hidden) load(true).catch(() => {}); });
})();
const assetUrl = (p) => (window.REMOTE ? window.REMOTE.asset(p) : p);
