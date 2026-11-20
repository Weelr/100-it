"use strict";
// Extra features: next up, can-I-get-it, session summary, mini window, search,
// progress history, Windows notifications, and play hours (GameHours, built in).
// Each one can be switched off in Settings.

const MINI = new URLSearchParams(location.search).has("mini");
if (MINI) document.body.classList.add("mini");

Object.assign(STR.ar, {
  features: "الميزات", night: "ليل", sessionBtn: "الجلسة", miniBtn: "نافذة صغيرة", tabHistory: "تقدمي", tabHours: "ساعاتي",
  searchPh: "ابحث… مثلاً الخطّاف أو قناع", noResults: "ما لقيت شي",
  fNextUp: ["وش أسوي بعدين؟", "يقترح أقرب الأشياء الناقصة اللي تقدر تجيبها"],
  fAutoAge: ["النسبة تتبع عمر لينك", "إذا خزّنت وأنت لينك الصغير تتحول النسبة للصغير، وإذا خزّنت وأنت الكبير تتحول للكبير. وتقدر تغيرها بنفسك لين التخزين الجاي"],
  fFairy: ["أفكار الجنية", "تطلع في المناطق والاقتراحات والبحث. ما تنحسب في النسبة. واللي تحتاجها مهمة، شرحها مكتوب في المهمة نفسها"],
  fCanGet: ["تقدر تجيبها الحين؟", "جنب كل شي ناقص: تقدر تجيبه أو وش يحتاج"],
  fSession: ["ملخص الجلسة", "وش جبت في جلستك وكم زادت نسبتك"],
  fMini: ["نافذة صغيرة فوق اللعبة", "زر يفتح نافذة صغيرة دايماً فوق"],
  fSearch: ["البحث", "مربع بحث فوق القوائم"],
  fHistory: ["رسم تقدمي", "تبويب فيه نسبتك على مر الأيام"],
  fWinToast: ["إشعارات ويندوز", "إشعار في زاوية ويندوز إذا البرنامج مخفي أو مصغّر"],
  fNotes: ["الإشعارات داخل البرنامج", "الكروت اللي تطلع لما تجيب شي"],
  nextUpTitle: "وش أسوي بعدين؟", nextUpSub: "أقرب الأشياء الناقصة اللي تقدر تجيبها الحين",
  nextUpEmpty: "ما فيه شي تقدر تجيبه الحين بأدواتك. شوف القوائم وش يحتاج.",
  canGet: "تقدر تجيبها", needs: (x) => `تحتاج: ${x}`, gsN: (n) => `${n} سكولتولا`,
  sesTitle: "ملخص الجلسة", sesLast: "ملخص آخر جلسة", sesSince: (t) => `من ${t}`, sesNothing: "ما جبت شي جديد في هالجلسة للحين.",
  sesGot: (n) => `جبت ${n} أشياء`, sesProgress: "نسبتك", sesHours: "وقت اللعب",
  histTitle: "نسبتك على مر الوقت", histEmpty: "يبدأ الرسم يتعبى مع كل تخزين جديد.", histHours: "ساعات اللعب آخر 7 أيام", histSessions: "آخر الجلسات",
  hoursTitle: "ساعات اللعب", hoursTotal: (h) => `المجموع لكل الألعاب: ${h}`, hoursToday: (h) => `اليوم: ${h}`,
  playingNow: "تلعب الحين", addGame: "+ إضافة لعبة", editGame: "تعديل اللعبة", edit: "تعديل", del: "حذف",
  delConfirm: (n) => `تحذف "${n}" وكل ساعاتها؟`, lastPlayed: (t) => `آخر مرة: ${t}`, sessions: (n) => `الجلسات: ${n}`, never: "ولا مرة",
  noGames: "ما فيه ألعاب للحين. افتح لعبتك أو المحاكي، واضغط + إضافة لعبة واختره من القائمة.",
  bgRun: "يشتغل في الخلفية لما تقفله (عشان يكمل يحسب)", startWin: "يشتغل مع ويندوز", oldGH: "برنامج GameHours القديم لسا يشتغل مع ويندوز. وقّفه عشان ما يصير عندك برنامجين.",
  oldGHOff: "وقّفه", imported: "نقلت ساعاتك من GameHours.",
  gName: "اسم اللعبة", gExe: "البرنامج (exe)، مثل eden.exe", gTitle: "عنوان النافذة فيه (اختياري، للمحاكيات)",
  gTitleHelp: "تلعب أكثر من لعبة على نفس المحاكي؟ اكتب جزء من اسم اللعبة زي ما يطلع في عنوان نافذة المحاكي.",
  gHours: "مجموع الساعات (حط ساعاتك القديمة هنا)", gFromSave: "من ملف التخزين", gWindows: "النوافذ المفتوحة الحين، اضغط وحدة تعبّي الخانات:",
  gLogo: "شعار اللعبة", gPickLogo: "اختيار صورة…", gNoLogo: "إزالة", gSaveFirst: "احفظ اللعبة أول عشان تحط شعار", gSave: "حفظ", gCancel: "إلغاء",
  gNeedName: "اكتب اسم اللعبة.", gNeedExe: "اكتب البرنامج أو جزء من عنوان النافذة.", gFound: (h, s) => `لقيت ${h} في ${s}`,
  gNoSaveTime: "ما لقيت وقت لعب في ملفات التخزين.", refreshList: "تحديث القائمة",
  playTime: (h) => `${h} لعب`, hm: (h, m) => (h ? `${h} س ${m} د` : `${m} د`),
  miniHere: "منطقتك", miniOverall: "الكلي", miniToday: "اليوم",
  days: ["أحد", "إثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"],
});
Object.assign(STR.en, {
  features: "Features", night: "Night", sessionBtn: "Session", miniBtn: "Mini window", tabHistory: "Progress", tabHours: "Hours",
  searchPh: "Search… e.g. Hookshot or mask", noResults: "Nothing found",
  fNextUp: ["What's next?", "Suggests the nearest missing things you can get"],
  fAutoAge: ["% follows Link's age", "Save as Young Link and the % switches to Young Link; save as Adult Link and it switches to Adult. You can still change it yourself until your next save"],
  fFairy: ["Fairy Thoughts", "Show them in areas, suggestions and search. They don't count toward the %. When a task needs one, its hint says so"],
  fCanGet: ["Can I get it now?", "Next to every missing thing: gettable, or what it needs"],
  fSession: ["Session summary", "What you got this session and how much your % went up"],
  fMini: ["Mini window over the game", "A button that opens a small always-on-top window"],
  fSearch: ["Search", "A search box above the lists"],
  fHistory: ["Progress chart", "A tab with your % over the days"],
  fWinToast: ["Windows notifications", "A notification in the corner of Windows when the app is hidden or minimized"],
  fNotes: ["In-app notifications", "The cards that pop up when you get something"],
  nextUpTitle: "What's next?", nextUpSub: "The nearest missing things you can get right now",
  nextUpEmpty: "Nothing you can get with your current gear. Check the lists for what's needed.",
  canGet: "You can get it", needs: (x) => `Needs: ${x}`, gsN: (n) => `${n} Skulltulas`,
  sesTitle: "Session summary", sesLast: "Last session", sesSince: (t) => `Since ${t}`, sesNothing: "Nothing new this session yet.",
  sesGot: (n) => `You got ${n} things`, sesProgress: "Your %", sesHours: "Play time",
  histTitle: "Your % over time", histEmpty: "The chart fills in with every new save.", histHours: "Play hours, last 7 days", histSessions: "Recent sessions",
  hoursTitle: "Play hours", hoursTotal: (h) => `All games: ${h}`, hoursToday: (h) => `Today: ${h}`,
  playingNow: "Playing now", addGame: "+ Add game", editGame: "Edit game", edit: "Edit", del: "Delete",
  delConfirm: (n) => `Delete "${n}" and all its hours?`, lastPlayed: (t) => `Last played: ${t}`, sessions: (n) => `Sessions: ${n}`, never: "Never",
  noGames: "No games yet. Open your game or emulator, press + Add game and pick it from the list.",
  bgRun: "Keep running in the background when closed (keeps counting)", startWin: "Start with Windows", oldGH: "The old GameHours app still starts with Windows. Turn it off so you don't run both.",
  oldGHOff: "Turn off", imported: "Your hours were brought over from GameHours.",
  gName: "Game name", gExe: "Program (.exe), e.g. eden.exe", gTitle: "Window title contains (optional, for emulators)",
  gTitleHelp: "Several games on the same emulator? Type part of the game's name as it appears in the emulator's window title.",
  gHours: "Total hours (add your earlier hours here)", gFromSave: "From save file", gWindows: "Windows open right now — click one to fill the fields:",
  gLogo: "Game logo", gPickLogo: "Choose image…", gNoLogo: "Remove", gSaveFirst: "Save the game first to add a logo", gSave: "Save", gCancel: "Cancel",
  gNeedName: "Enter the game's name.", gNeedExe: "Enter the program or part of the window title.", gFound: (h, s) => `Found ${h} in ${s}`,
  gNoSaveTime: "No play time found in the save files.", refreshList: "Refresh list",
  playTime: (h) => `${h} played`, hm: (h, m) => (h ? `${h}h ${m}m` : `${m}m`),
  miniHere: "Area", miniOverall: "Overall", miniToday: "Today",
  days: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
});

// ---------- feature switches ----------
const FEATURES = ["autoAge", "nextUp", "canGet", "session", "mini", "search", "history", "winToast", "notes", "fairyThoughts"].filter((k) => !window.REMOTE || (k !== "mini" && k !== "winToast"));
const FEAT_KEY = { autoAge: "fAutoAge", fairyThoughts: "fFairy", nextUp: "fNextUp", canGet: "fCanGet", session: "fSession", mini: "fMini", search: "fSearch", history: "fHistory", winToast: "fWinToast", notes: "fNotes" };
let FEAT = (() => { try { return JSON.parse(store.get("features", "{}")) || {}; } catch { return {}; } })();
const FEAT_OFF_BY_DEFAULT = ["fairyThoughts"];
function feat(k) { return FEAT_OFF_BY_DEFAULT.includes(k) ? FEAT[k] === true : FEAT[k] !== false; } // the rest is on until you switch it off
function renderFeatureList() {
  $("#featureList").innerHTML = FEATURES.map((k) => {
    const [name, desc] = STR[lang][FEAT_KEY[k]];
    return `<button class="feature ${feat(k) ? "on" : ""}" data-feat="${k}"><div><b>${esc(name)}</b><span>${esc(desc)}</span></div><i class="switch"></i></button>`;
  }).join("");
}
document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-feat]");
  if (!b) return;
  FEAT[b.dataset.feat] = !feat(b.dataset.feat);
  store.set("features", JSON.stringify(FEAT));
  renderFeatureList();
  if (!feat("history") && tab === "history") tab = "field";
  render();
});

const fmtHM = (sec) => { sec = Math.max(0, Math.round(sec || 0)); return T("hm", Math.floor(sec / 3600), Math.floor((sec % 3600) / 60)); };

// Runs after every render of the main window.
function renderExtras(s) {
  $("#sessionBtn").classList.toggle("hidden", !feat("session"));
  $("#miniBtn").classList.toggle("hidden", !feat("mini"));
  $("#searchBox").classList.toggle("hidden", !feat("search"));
  $("#historyTab").classList.toggle("hidden", !feat("history"));
  renderNextUp(s);
  if (window.REMOTE) renderSyncInfo();
}

// ---------- 2. can I get it now? ----------
const ALL_ITEMS = () => DATA.regions.flatMap((r) => r.items.map((i) => ({ i, r }))).concat(
  DATA.collections.flatMap((c) => c.items.map((i) => ({ i, r: i.place ? DATA.regions.find((x) => x.id === i.place) : null, c }))));
const ITEM_BY_ID = {};
function itemById(id) {
  if (!ITEM_BY_ID._ready) { for (const x of ALL_ITEMS()) ITEM_BY_ID[x.i.id] = x.i; ITEM_BY_ID._ready = true; }
  return ITEM_BY_ID[id];
}
// What's still missing for an entry (empty = you can get it now).
function missingNeeds(s, i) {
  const out = [];
  for (const n of i.needs || []) {
    if (n.gs) { if ((s.gsCount || 0) < n.gs) out.push(T("gsN", n.gs)); }
    else if (!n.any.some((id) => isOn(s, id))) out.push(n.any.map((id) => itemName(itemById(id) || { name: id })).join(isAr() ? " أو " : " or "));
  }
  return out;
}
function needBadge(s, i) {
  if (!feat("canGet")) return "";
  const miss = missingNeeds(s, i);
  return miss.length ? `<span class="tag need" title="${esc(T("needs", miss.join("، ")))}">${esc(T("needs", miss.join(isAr() ? "، " : ", ")))}</span>`
    : `<span class="tag can">${T("canGet")}</span>`;
}

// ---------- 1. what's next ----------
function renderNextUp(s, box = $("#nextUp")) {
  if (!feat("nextUp")) { box.classList.add("hidden"); return; }
  const here = regionOf(s.location);
  const linkAge = s.age === "Adult" ? "Adult" : s.age === "Child" ? "Child" : null;
  const cands = [];
  for (const { i, r } of ALL_ITEMS()) {
    if (isOn(s, i.id) || !visible(i) || missingNeeds(s, i).length) continue;
    let score = 0;
    if (r && here && r.id === here.id) score += 3;
    if (!i.era || i.era === "Either" || i.era === linkAge) score += 2;
    if (r) score += regionStats(s, r).p; // finish areas you're close to
    if (["gs", "poh", "ft"].includes(i.cat)) score += 0.3;
    cands.push({ i, r, score });
  }
  cands.sort((a, b) => b.score - a.score);
  const top = cands.slice(0, 5);
  box.classList.remove("hidden");
  box.innerHTML = `<div class="nu-head"><b>${T("nextUpTitle")}</b><span>${T("nextUpSub")}</span></div>` +
    (top.length ? `<div class="nu-list">${top.map(({ i, r }) => {
      const cat = i.cat || (DATA.collections.find((c) => c.items.includes(i))?.id === "songs" ? "song" : "gear");
      const tags = (i.era && i.era !== "Either" ? `<span class="tag">${T(ERA_KEY[i.era])}</span>` : "") + (i.night ? `<span class="tag night">${T("night")}</span>` : "");
      return `<button class="nu-item" ${r ? `data-region="${r.id}" data-focus="${i.id}"` : `data-tab="${tabOf(i)}"`} style="--art:${r ? art(r) : "none"}">
        <span class="nu-ico">${ICON[cat] || ICON.item}</span>
        <span class="nu-txt"><b dir="auto">${esc(itemName(i))}</b><small>${esc(r ? regionName(r) : "")}</small></span>
        <span class="nu-tags">${tags}</span></button>`;
    }).join("")}</div>` : `<p class="muted small">${T("nextUpEmpty")}</p>`);
}
const tabOf = (i) => (DATA.collections.find((c) => c.items.some((x) => x.id === i.id))?.id === "songs" || i.id.startsWith("quest") ? "songs" : "gear");

// Opening a region from next-up or search scrolls to the item and flashes it.
document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-focus]");
  if (!b) return;
  const id = b.dataset.focus;
  setTimeout(() => {
    const row = $(`#drBody .item[data-id="${id}"]`);
    if (row) { row.scrollIntoView({ block: "center", behavior: "smooth" }); row.classList.add("flash"); setTimeout(() => row.classList.remove("flash"), 1800); }
  }, 60);
});

// ---------- 5. search ----------
const norm = (x) => String(x || "").toLowerCase().replace(/[\u064B-\u0652\u0640]/g, "").replace(/[’'`]/g, "").replace(/[أإآ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي");
$("#searchInput").addEventListener("input", () => renderSearch());
$("#searchInput").addEventListener("focus", () => renderSearch());
document.addEventListener("click", (e) => { if (!e.target.closest("#searchBox")) $("#searchResults").classList.add("hidden"); });
function renderSearch() {
  const q = norm($("#searchInput").value.trim());
  const box = $("#searchResults");
  if (!q || !STATE || !STATE.slots.length) { box.classList.add("hidden"); return; }
  const s = slot();
  const hits = ALL_ITEMS().filter(({ i }) => i.cat !== "ft" || showFt()).filter(({ i, r, c }) => [i.name, i.name_ar, r?.name, r?.ar, c?.ar, c?.en].some((t) => norm(t).includes(q))).slice(0, 14);
  box.classList.remove("hidden");
  box.innerHTML = hits.length ? hits.map(({ i, r, c }) => {
    const on = isOn(s, i.id);
    const cat = i.cat || (c?.id === "songs" ? "song" : "gear");
    return `<button class="sr ${on ? "on" : ""}" ${r ? `data-region="${r.id}" data-focus="${i.id}"` : `data-tab="${tabOf(i)}"`}>
      <span class="box"></span><span class="sr-ico">${ICON[cat] || ICON.item}</span>
      <span class="sr-txt"><b dir="auto">${esc(itemName(i))}</b><small>${esc(r ? regionName(r) : c ? collName(c) : "")}</small></span></button>`;
  }).join("") : `<div class="muted small sr-none">${T("noResults")}</div>`;
}
document.addEventListener("click", (e) => { if (e.target.closest(".sr")) { $("#searchResults").classList.add("hidden"); } });

// ---------- 3 + 6. session summary and history ----------
const SESSION_GAP = 2 * 60 * 60 * 1000; // two hours without a new save starts a new session
function loadJSON(k, d) { try { return JSON.parse(store.get(k, "")) ?? d; } catch { return d; } }
function overallBoth(s) { const a = age; age = "both"; const p = totals(s).pct; age = a; return p; }
function trackProgress(prev, st) {
  if (MINI || window.REMOTE || !st.slots.length) return; // the phone shows the computer's history
  try { trackProgressPC(prev, st); } finally { pushExtra(); }
}
function trackProgressPC(prev, st) {
  for (const s of st.slots) s._done = s._done || new Set(s.done);
  const L = st.slots.reduce((a, b) => (!a || b.modified > a.modified ? b : a), null);
  // History: one point per save we've seen (the existing slots seed it).
  let hist = loadJSON("history", []);
  const seen = new Set(hist.map((h) => h.t));
  for (const s of st.slots) if (!seen.has(s.modified)) hist.push({ t: s.modified, p: overallBoth(s) });
  hist.sort((a, b) => a.t - b.t);
  if (hist.length > 2000) hist = hist.slice(-2000);
  store.set("history", JSON.stringify(hist));
  // Session.
  const now = Date.now();
  let ses = loadJSON("session", null);
  if (!ses || now - ses.last > SESSION_GAP) {
    if (ses && ses.gained && ses.gained.length) {
      const list = loadJSON("sessions", []);
      list.push(ses);
      store.set("sessions", JSON.stringify(list.slice(-30)));
      if (!prev) store.set("showLastSession", "1"); // show it once when the app opens
    }
    ses = { start: now, last: now, t: L.modified, startDone: L.done, startPct: overallBoth(L), endPct: overallBoth(L), gained: [] };
  }
  if (L.modified > ses.t) {
    const had = new Set(ses.startDone);
    ses.gained = L.done.filter((id) => !had.has(id));
    ses.endPct = overallBoth(L);
    ses.t = L.modified;
    ses.last = now;
  }
  store.set("session", JSON.stringify(ses));
  if (!prev && store.get("showLastSession", "") === "1" && feat("session")) {
    store.set("showLastSession", "");
    const list = loadJSON("sessions", []);
    if (list.length) setTimeout(() => openSession(list[list.length - 1], true), 600);
  }
}
function sessionHtml(ses) {
  const items = ses.gained.map(itemById).filter(Boolean);
  const kinds = {};
  for (const i of items) { const k = i.cat || "gear"; (kinds[k] ||= []).push(i); }
  const list = Object.entries(kinds).map(([k, its]) => `<div class="group-title">${ICON[k] || ICON.item}${T(CAT_KEY[k] || "catGear")} <span class="muted" dir="ltr">+${its.length}</span></div>
    <div class="list">${its.map((i) => `<div class="item on"><span class="box"></span><span class="name" dir="auto">${esc(itemName(i))}</span></div>`).join("")}</div>`).join("");
  return `<div class="ses-stats">
      <div><small>${T("sesProgress")}</small><b dir="ltr">${pct(ses.startPct)}% → ${pct(ses.endPct)}%</b></div>
      <div><small>${T("sesGot", items.length)}</small><b dir="ltr">+${items.length}</b></div>
      <div><small>${T("sesHours")}</small><b>${fmtHM((ses.last - ses.start) / 1000)}</b></div>
    </div>${items.length ? list : `<p class="muted">${T("sesNothing")}</p>`}`;
}
function openSession(ses, last) {
  ses = ses || loadJSON("session", null);
  if (!ses) return;
  $("#sesTitle").textContent = last ? T("sesLast") : T("sesTitle");
  $("#sesSub").textContent = T("sesSince", new Date(ses.start).toLocaleString(isAr() ? "ar-SA-u-nu-latn-ca-gregory" : "en-GB", { weekday: "long", hour: "numeric", minute: "2-digit" }));
  $("#sesBody").innerHTML = sessionHtml(ses);
  $("#sessionModal").classList.remove("hidden");
}
document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-action]");
  if (!b) return;
  if (b.dataset.action === "session") openSession();
  if (b.dataset.action === "mini") api("/api/mini", { on: true }).catch(() => {});
});

function renderHistory(s) {
  const hist = loadJSON("history", []);
  const W = 900, H = 260, P = 34;
  let chart = `<p class="muted">${T("histEmpty")}</p>`;
  if (hist.length >= 1) {
    const t0 = hist[0].t, t1 = Math.max(hist[hist.length - 1].t, t0 + 1);
    const x = (t) => P + ((t - t0) / (t1 - t0)) * (W - P * 2), y = (p) => H - P - p * (H - P * 2);
    const pts = hist.map((h) => `${x(h.t).toFixed(1)},${y(h.p).toFixed(1)}`).join(" ");
    const grid = [0, 0.25, 0.5, 0.75, 1].map((g) => `<line x1="${P}" x2="${W - P}" y1="${y(g)}" y2="${y(g)}" class="gl"/><text x="${P - 6}" y="${y(g) + 4}" class="gt" text-anchor="end">${g * 100}%</text>`).join("");
    const fmt = (t) => new Date(t).toLocaleDateString(isAr() ? "ar-SA-u-nu-latn-ca-gregory" : "en-GB", { day: "numeric", month: "short" });
    const last = hist[hist.length - 1];
    chart = `<svg class="hist" viewBox="0 0 ${W} ${H}" dir="ltr">${grid}
      <polygon points="${x(t0)},${y(0)} ${pts} ${x(last.t)},${y(0)}" class="area"/>
      <polyline points="${pts}" class="line"/>
      ${hist.length < 60 ? hist.map((h) => `<circle cx="${x(h.t)}" cy="${y(h.p)}" r="3.5" class="dot"/>`).join("") : ""}
      <text x="${P}" y="${H - 8}" class="gt">${fmt(t0)}</text><text x="${W - P}" y="${H - 8}" class="gt" text-anchor="end">${fmt(last.t)}</text>
    </svg>`;
  }
  // Play hours this week for this game (from the hours tracker).
  const g = zeldaGame();
  let week = "";
  if (g) {
    const max = Math.max(3600, ...g.week);
    const today = new Date();
    week = `<div class="section-title"><b>${T("histHours")}</b><span>${esc(g.name)}</span></div><div class="week">${g.week.map((sec, n) => {
      const d = new Date(today); d.setDate(today.getDate() - 6 + n);
      return `<div class="wk"><div class="wk-bar"><div style="height:${(sec / max) * 100}%"></div></div><b>${sec >= 60 ? fmtHM(sec) : "–"}</b><small>${T("days")[d.getDay()]}</small></div>`;
    }).join("")}</div>`;
  }
  const sessions = loadJSON("sessions", []).slice(-6).reverse();
  const cur = loadJSON("session", null);
  const rows = (cur ? [cur] : []).concat(sessions).filter((x) => x).map((x, n) => `<button class="ses-row" data-ses="${n}">
      <span>${new Date(x.start).toLocaleDateString(isAr() ? "ar-SA-u-nu-latn-ca-gregory" : "en-GB", { weekday: "short", day: "numeric", month: "short" })}</span>
      <b dir="ltr">${pct(x.startPct)}% → ${pct(x.endPct)}%</b><span class="muted">+${(x.gained || []).length}</span></button>`).join("");
  $("#view").innerHTML = `<div class="section-title"><b>${T("histTitle")}</b></div><div class="hist-card">${chart}</div>${week}
    ${feat("session") && rows ? `<div class="section-title"><b>${T("histSessions")}</b></div><div class="ses-list">${rows}</div>` : ""}`;
  $("#view").querySelectorAll("[data-ses]").forEach((b) => b.addEventListener("click", () => {
    const all = (cur ? [cur] : []).concat(sessions);
    openSession(all[Number(b.dataset.ses)], b.dataset.ses !== "0" || !cur);
  }));
}

// ---------- play hours (GameHours) ----------
let HOURS = null;
async function loadHours() {
  try { HOURS = await api("/api/hours"); } catch { HOURS = null; }
  if (tab === "hours" && !MINI && !$("#gameModal:not(.hidden)")) renderHours();
}
const zeldaGame = () => HOURS?.hours?.games?.find((g) => /ocarina|zelda|اوكارينا|أوكارينا|زيلدا/i.test(g.name)) || null;
function hoursFact(s) {
  const g = zeldaGame();
  const sec = g ? g.total : s.play;
  if (!sec) return "";
  return `<span class="fact${g && g.playing ? " live" : ""}">${ICON.clock}${T("playTime", fmtHM(sec))}</span>`;
}
const TILE_COLORS = ["#7c5cff", "#0ea5e9", "#f59e0b", "#ef4444", "#10b981", "#ec4899", "#6366f1"];
function gameTile(g, size) {
  if (g.logo && assetUrl(`/api/logo/${g.id}`)) return `<img class="g-logo" style="width:${size}px;height:${size}px" src="${assetUrl(`/api/logo/${g.id}?v=${g.logoV}`)}" alt="">`;
  const color = TILE_COLORS[[...g.name].reduce((a, ch) => a + ch.charCodeAt(0), 0) % TILE_COLORS.length];
  const ini = g.name.split(/\s+/).filter((w) => /^[\p{L}\p{N}]/u.test(w)).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";
  return `<span class="g-logo g-ini" style="width:${size}px;height:${size}px;background:${color};font-size:${size / 3}px">${esc(ini)}</span>`;
}
function fmtLast(iso) {
  if (!iso) return T("never");
  const d = new Date(iso);
  if (isNaN(d)) return "—";
  return d.toLocaleString(isAr() ? "ar-SA-u-nu-latn-ca-gregory" : "en-GB", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", hour12: true });
}
function renderHours() {
  const v = $("#view");
  if (!HOURS) { v.innerHTML = `<p class="muted">…</p>`; loadHours(); return; }
  const games = [...HOURS.hours.games].sort((a, b) => (b.playing - a.playing) || b.total - a.total);
  const total = games.reduce((a, g) => a + g.total, 0), today = games.reduce((a, g) => a + g.today, 0);
  v.innerHTML = `
    <div class="hours-head">
      <div><b>${T("hoursTitle")}</b><span class="muted">${T("hoursTotal", fmtHM(total))} · ${T("hoursToday", fmtHM(today))}</span></div>
      <button class="primary" data-game="new">${T("addGame")}</button>
    </div>
    ${HOURS.oldStartup && !window.REMOTE ? `<div class="tip row"><span style="flex:1">${T("oldGH")}</span><button class="ghost" data-pref="oldStartupOff">${T("oldGHOff")}</button></div>` : ""}
    <div class="hours-prefs">
      <button class="feature ${HOURS.background ? "on" : ""}" data-pref="background"><div><b>${T("bgRun")}</b></div><i class="switch"></i></button>
      <button class="feature ${HOURS.startup ? "on" : ""}" data-pref="startup"><div><b>${T("startWin")}</b></div><i class="switch"></i></button>
    </div>
    ${games.length ? `<div class="games">${games.map((g) => {
      const max = Math.max(3600, ...g.week);
      return `<div class="game ${g.playing ? "playing" : ""}">
        ${gameTile(g, 64)}
        <div class="g-mid">
          <div class="g-top"><b dir="auto">${esc(g.name)}</b>${g.playing ? `<span class="g-live">● ${T("playingNow")}</span>` : ""}</div>
          <div class="muted small pc-only" dir="ltr" style="text-align:start">${esc(g.exe)}${g.title ? ` · “${esc(g.title)}”` : ""}</div>
          <div class="muted small">${T("hoursToday", fmtHM(g.today))} · ${T("lastPlayed", fmtLast(g.last))} · ${T("sessions", g.sessions)}</div>
        </div>
        <div class="g-week" title="7d">${g.week.map((s) => `<i style="height:${Math.max(4, (s / max) * 100)}%"></i>`).join("")}</div>
        <div class="g-right"><div class="g-total">${fmtHM(g.total)}</div>
          <div class="row"><button class="ghost sm" data-game="${g.id}">${T("edit")}</button><button class="ghost sm danger" data-gdel="${g.id}">${T("del")}</button></div></div>
      </div>`;
    }).join("")}</div>` : `<p class="muted empty-games">${T("noGames")}</p>`}`;
}
document.addEventListener("click", async (e) => {
  const p = e.target.closest("[data-pref]");
  if (p) {
    const k = p.dataset.pref;
    const body = k === "oldStartupOff" ? { oldStartupOff: true } : { [k]: !HOURS[k] };
    try { const r = await api("/api/prefs", body); HOURS = r; } catch {}
    renderHours();
    return;
  }
  const d = e.target.closest("[data-gdel]");
  if (d) {
    const g = HOURS.hours.games.find((x) => x.id === d.dataset.gdel);
    if (g && confirm(T("delConfirm", g.name))) { await api("/api/hours/delete", { id: g.id }); await loadHours(); renderHours(); }
    return;
  }
  const ge = e.target.closest("[data-game]");
  if (ge) openGameEditor(ge.dataset.game === "new" ? null : HOURS.hours.games.find((x) => x.id === ge.dataset.game));
});

let editing = null;
async function openGameEditor(g) {
  editing = g ? { ...g } : { id: null, name: "", exe: "", title: "", total: 0 };
  $("#gmTitle").textContent = g ? T("editGame") : T("addGame").replace("+ ", "");
  $("#gameModal").classList.remove("hidden");
  renderGameEditor();
  loadWindows();
}
function renderGameEditor(msg) {
  const g = editing;
  $("#gmBody").innerHTML = `
    <div class="gm-logo">${gameTile({ ...g, name: g.name || "?" }, 72)}
      <div><b>${T("gLogo")}</b>${g.id ? `<div class="row"><button class="ghost sm" data-gm="logo">${T("gPickLogo")}</button>${g.logo ? `<button class="ghost sm" data-gm="nologo">${T("gNoLogo")}</button>` : ""}</div>` : `<div class="muted small">${T("gSaveFirst")}</div>`}</div></div>
    <label class="field">${T("gName")}<input id="gmName" value="${esc(g.name)}" dir="auto"></label>
    <label class="field">${T("gExe")}<input id="gmExe" value="${esc(g.exe)}" dir="ltr"></label>
    <label class="field">${T("gTitle")}<input id="gmTitleIn" value="${esc(g.title)}" dir="auto"><small class="muted">${T("gTitleHelp")}</small></label>
    <label class="field">${T("gHours")}<div class="row"><input id="gmHours" value="${(g.total / 3600).toFixed(2)}" dir="ltr" inputmode="decimal"><button class="ghost sm" data-gm="fromsave">${T("gFromSave")}</button></div></label>
    <div class="field">${T("gWindows")}<div class="win-list" id="winList"></div><button class="ghost sm" data-gm="windows">${T("refreshList")}</button></div>
    <p class="muted small" id="gmMsg">${msg ? esc(msg) : ""}</p>
    <div class="row end"><button class="ghost" data-action="close">${T("gCancel")}</button><button class="primary" data-gm="save">${T("gSave")}</button></div>`;
}
function readEditor() {
  editing.name = $("#gmName").value; editing.exe = $("#gmExe").value; editing.title = $("#gmTitleIn").value;
  editing.total = (parseFloat($("#gmHours").value) || 0) * 3600;
}
async function loadWindows() {
  let list = [];
  try { list = await api("/api/windows"); } catch {}
  const box = $("#winList");
  if (!box) return;
  box.innerHTML = list.map((w, n) => `<button class="win" data-win="${n}"><b dir="ltr">${esc(w.exe)}</b><span dir="auto">${esc(w.title)}</span></button>`).join("") || "<span class='muted small'>—</span>";
  box.querySelectorAll("[data-win]").forEach((b) => b.addEventListener("click", () => {
    const w = list[Number(b.dataset.win)];
    readEditor();
    editing.exe = w.exe;
    if (!editing.name.trim()) editing.name = w.title.slice(0, 40);
    renderGameEditor();
    loadWindows();
  }));
}
document.addEventListener("click", async (e) => {
  const b = e.target.closest("[data-gm]");
  if (!b) return;
  const a = b.dataset.gm;
  if (a === "windows") return loadWindows();
  readEditor();
  if (a === "fromsave") {
    const r = await api("/api/hours/fromsave").catch(() => null);
    if (r && r.seconds != null) { editing.total = r.seconds; renderGameEditor(T("gFound", fmtHM(r.seconds), r.slot)); }
    else renderGameEditor(T("gNoSaveTime"));
    loadWindows();
  } else if (a === "save") {
    if (!editing.name.trim()) return ($("#gmMsg").textContent = T("gNeedName"));
    if (!editing.exe.trim() && !editing.title.trim()) return ($("#gmMsg").textContent = T("gNeedExe"));
    const r = await api("/api/hours/save", { id: editing.id, name: editing.name, exe: editing.exe, title: editing.title, hours: editing.total / 3600 });
    editing.id = r.id;
    $("#gameModal").classList.add("hidden");
    await loadHours();
    renderHours();
  } else if (a === "logo" || a === "nologo") {
    await api(a === "logo" ? "/api/hours/logo" : "/api/hours/nologo", { id: editing.id }).catch(() => {});
    await loadHours();
    const g = HOURS.hours.games.find((x) => x.id === editing.id);
    if (g) { editing.logo = g.logo; editing.logoV = g.logoV; }
    renderGameEditor();
    loadWindows();
  }
});

// ---------- 4. mini window ----------
function renderMini(s) {
  const r = regionOf(s.location);
  const hs = r && regionStats(s, r);
  const t = totals(s);
  const g = zeldaGame();
  const ring = (p, big) => {
    const R = big ? 30 : 22, c = 2 * Math.PI * R, w = big ? 7 : 5, sz = (R + w) * 2;
    return `<div class="mr ${big ? "big" : ""}" style="width:${sz}px;height:${sz}px"><svg viewBox="0 0 ${sz} ${sz}"><circle cx="${sz / 2}" cy="${sz / 2}" r="${R}" class="bg" stroke-width="${w}"/><circle cx="${sz / 2}" cy="${sz / 2}" r="${R}" class="fg" stroke-width="${w}" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - p)}"/></svg><b>${pct(p)}%</b></div>`;
  };
  $("#miniView").innerHTML = `
    <div class="mini-col">${ring(t.pct, true)}<small>${T("miniOverall")}</small></div>
    ${hs && hs.total ? `<div class="mini-col">${ring(hs.p)}<small>${esc(regionName(r))}</small></div>` : ""}
    <div class="mini-facts">
      <span>${ICON.gs}<b dir="ltr">${t.gs}/${t.by.gs[1]}</b></span>
      <span>${ICON.poh}<b dir="ltr">${t.by.poh[0]}/${t.by.poh[1]}</b></span>
      ${g ? `<span>${ICON.clock}<b>${fmtHM(g.today)}</b></span>` : ""}
    </div>`;
}

(async () => {
  await loadHours();
  setInterval(loadHours, MINI ? 15000 : 5000);
})();

// ---------- phone (see remote.js and app/Remote.cs) ----------
Object.assign(STR.ar, {
  phoneTitle: "تقدمك في الجوال",
  phoneIntro: "شوف تقدمك من جوالك من أي مكان، حتى لو الكمبيوتر مطفي. البرنامج يرفع تقدمك على حسابك في GitHub كل ما تحفظ، في ملف سري ما يشوفه إلا اللي معه الرابط.",
  phoneStep1: "١. سوّ مفتاح من GitHub", phoneStep1Btn: "افتح صفحة المفتاح",
  phoneStep1Help: "صلاحية <b>gist</b> مختارة لك، خلّها بس هي. في Expiration اختر <b>No expiration</b>، وبعدين اضغط <b>Generate token</b> وانسخ المفتاح.",
  phoneStep2: "٢. الصق المفتاح هنا", phoneLink: "ربط", phoneLinking: "أربط…",
  phoneScan: "صوّر الكود بكاميرا الجوال", phoneIos: "في الآيفون: افتحه في Safari، واضغط زر المشاركة، وبعدين <b>إضافة إلى الشاشة الرئيسية</b>. يصير له أيقونة زي التطبيق.",
  phoneCopy: "نسخ الرابط", phoneCopied: "تم نسخ الرابط", phoneOff: "إيقاف", phoneOffConfirm: "توقف رفع تقدمك للجوال؟",
  phoneLast: (t) => `آخر رفع: ${t}`, phoneWaiting: "يرفع أول مرة…", phoneAs: (u) => `حساب GitHub: ${u}`,
  phoneErr: { token: "المفتاح غلط أو انتهى. سوّ مفتاح جديد والصقه.", scope: "المفتاح ما فيه صلاحية gist. سوّ مفتاح جديد من الزر فوق.", net: "ما قدرت أوصل لـ GitHub. تأكد من النت.", gone: "الملف انحذف من GitHub. الصق المفتاح من جديد." },
  syncAgo: (t) => `من الكمبيوتر · ${t}`, syncLoading: "أجيب تقدمك…",
  phEmptyTitle: "ما قدرت أجيب تقدمك", phRetry: "حاول مرة ثانية",
  phErr: { nolink: "افتح الرابط من الكود اللي في إعدادات البرنامج على الكمبيوتر.", gone: "هذا الرابط ما عاد يشتغل. صوّر الكود من جديد من إعدادات البرنامج.",
    limit: "GitHub طلب نوقف شوي. جرّب بعد دقائق.", net: "تأكد من النت وجرّب مرة ثانية.", empty: "البرنامج على الكمبيوتر لسا ما رفع تقدمك. شغّله واحفظ في اللعبة.",
    nosaves: "البرنامج على الكمبيوتر ما لقى ملفات التخزين للحين." },
});
Object.assign(STR.en, {
  phoneTitle: "Your progress on your phone",
  phoneIntro: "See your progress on your phone from anywhere, even when the computer is off. Every time you save, the app uploads your progress to your GitHub account, in a secret file only the link can open.",
  phoneStep1: "1. Make a GitHub token", phoneStep1Btn: "Open the token page",
  phoneStep1Help: "The <b>gist</b> scope is already ticked; leave only that. Set Expiration to <b>No expiration</b>, press <b>Generate token</b> and copy it.",
  phoneStep2: "2. Paste the token here", phoneLink: "Connect", phoneLinking: "Connecting…",
  phoneScan: "Scan the code with your phone's camera", phoneIos: "On iPhone: open it in Safari, tap Share, then <b>Add to Home Screen</b>. It gets an icon like an app.",
  phoneCopy: "Copy link", phoneCopied: "Link copied", phoneOff: "Turn off", phoneOffConfirm: "Stop uploading your progress for the phone?",
  phoneLast: (t) => `Last upload: ${t}`, phoneWaiting: "Uploading for the first time…", phoneAs: (u) => `GitHub account: ${u}`,
  phoneErr: { token: "The token is wrong or expired. Make a new one and paste it.", scope: "The token doesn't have the gist scope. Make a new one with the button above.", net: "Couldn't reach GitHub. Check your internet.", gone: "The file was deleted on GitHub. Paste the token again." },
  syncAgo: (t) => `From your PC · ${t}`, syncLoading: "Getting your progress…",
  phEmptyTitle: "Couldn't get your progress", phRetry: "Try again",
  phErr: { nolink: "Open the link from the code in the app's Settings on your computer.", gone: "This link doesn't work anymore. Scan the code again from the app's Settings.",
    limit: "GitHub asked us to slow down. Try again in a few minutes.", net: "Check your internet and try again.", empty: "The app on your computer hasn't uploaded yet. Open it and save in the game.",
    nosaves: "The app on your computer hasn't found your saves yet." },
});

// The computer sends its history and sessions along, so the phone shows the same chart.
let lastExtra = "";
function pushExtra() {
  if (MINI || window.REMOTE) return;
  const L = STATE && STATE.slots.length ? newestOf(STATE) : null;
  const body = JSON.stringify({ history: loadJSON("history", []), sessions: loadJSON("sessions", []), session: loadJSON("session", null), summary: L ? phoneSummary(L) : null });
  if (body === lastExtra) return;
  lastExtra = body;
  api("/api/remote/extra", JSON.parse(body)).catch(() => { lastExtra = ""; });
}

// Short summary for the iPhone widget.
function phoneSummary(s) {
  s._done = s._done || new Set(s.done);
  const r = regionOf(s.location), a = age;
  // The widget can show everything, Young Link only or Adult Link only.
  const forAge = (k) => {
    age = k;
    const t = totals(s), hs = r && regionStats(s, r);
    return { pct: t.pct, gs: [t.gs, t.by.gs[1]], poh: [t.by.poh[0], t.by.poh[1]], ft: [t.by.ft[0], t.by.ft[1]], ap: hs && hs.total ? hs.p : null };
  };
  const both = forAge("both"), ages = { child: forAge("child"), adult: forAge("adult") };
  age = a;
  const g = zeldaGame();
  return { t: s.modified, pct: both.pct, gs: both.gs, poh: both.poh, ft: both.ft, hearts: (s.maxLife / 4) | 0, ages,
    area: r ? { ar: placeOf(s.location)?.ar || r.ar, en: placeOf(s.location)?.en || r.name, p: both.ap || 0 } : null, play: Math.round((g ? g.total : s.play) || 0) };
}

// Settings on the computer.
let PHONE = null, phoneMsg = "";
const TOKEN_URL = "https://github.com/settings/tokens/new?scopes=gist&description=100%25%20it%20(phone)";
async function loadPhone() {
  if (window.REMOTE) { renderPhoneAppBox(); return; }
  try { PHONE = await api("/api/remote"); } catch { PHONE = null; }
  renderPhone();
}
function renderPhone() {
  const box = $("#phoneBox");
  if (!box || !PHONE) { if (box) box.innerHTML = ""; return; }
  const err = PHONE.error && STR[lang].phoneErr[PHONE.error];
  if (!PHONE.on) {
    box.innerHTML = `<p class="muted small">${T("phoneIntro")}</p>
      <div class="ph-step"><b>${T("phoneStep1")}</b><a class="ghost sm" href="${TOKEN_URL}" target="_blank" rel="noopener">${T("phoneStep1Btn")} ↗</a>
        <span class="muted small">${T("phoneStep1Help")}</span></div>
      <div class="ph-step"><b>${T("phoneStep2")}</b><div class="row"><input id="phoneToken" dir="ltr" spellcheck="false" autocomplete="off" placeholder="ghp_…">
        <button class="primary" data-phone="link">${T("phoneLink")}</button></div></div>
      <p class="muted small ph-msg">${esc(phoneMsg)}</p>`;
    return;
  }
  box.innerHTML = `<div class="ph-on">
      <div class="ph-qr">${qrSvg(PHONE.url)}</div>
      <div class="ph-info">
        <b>${T("phoneScan")}</b>
        <span class="muted small">${T("phoneIos")}</span>
        <code class="ph-url">${esc(PHONE.url)}</code>
        <span class="small ${err ? "ph-err" : "muted"}">${err ? esc(err) : PHONE.lastOk ? T("phoneLast", ago(PHONE.lastOk)) : T("phoneWaiting")}</span>
        ${PHONE.user ? `<span class="muted small">${esc(T("phoneAs", PHONE.user))}</span>` : ""}
        <div class="row"><button class="ghost sm" data-phone="copy">${T("phoneCopy")}</button><button class="ghost sm danger" data-phone="off">${T("phoneOff")}</button></div>
      </div></div>
    ${PHONE.error === "token" || PHONE.error === "gone" ? `<div class="ph-step"><b>${T("phoneStep2")}</b><div class="row"><input id="phoneToken" dir="ltr" spellcheck="false" autocomplete="off" placeholder="ghp_…">
      <button class="primary" data-phone="link">${T("phoneLink")}</button><a class="ghost sm" href="${TOKEN_URL}" target="_blank" rel="noopener">${T("phoneStep1Btn")} ↗</a></div></div>` : ""}`;
}
document.addEventListener("click", async (e) => {
  const b = e.target.closest("[data-phone]");
  if (!b) return;
  const a = b.dataset.phone;
  if (a === "link") {
    const token = ($("#phoneToken")?.value || "").trim();
    if (!token) return;
    b.disabled = true; b.textContent = T("phoneLinking");
    try {
      const r = await api("/api/remote/setup", { token });
      PHONE = r.remote;
      phoneMsg = r.error ? STR[lang].phoneErr[r.error] || r.error : "";
      if (r.error && PHONE.on) PHONE.error = r.error;
    } catch { phoneMsg = STR[lang].phoneErr.net; }
    renderPhone();
  } else if (a === "copy") {
    try { await navigator.clipboard.writeText(PHONE.url); toast(T("phoneCopied")); }
    catch { const r = document.createRange(); r.selectNodeContents($(".ph-url")); getSelection().removeAllRanges(); getSelection().addRange(r); }
  } else if (a === "off") {
    if (!confirm(T("phoneOffConfirm"))) return;
    try { PHONE = await api("/api/remote/off", {}); } catch {}
    renderPhone();
  }
});
setInterval(() => { if (!$("#settings").classList.contains("hidden")) loadPhone(); }, 10000);

// On the phone: the iPhone app (installed with AltStore) or the web page in Safari.
const IN_APP = /HundredItApp/.test(navigator.userAgent);
const IPA_URL = "https://github.com/Weelr/100-it/releases/latest/download/100it.ipa";
const SOURCE_URL = "https://github.com/Weelr/100-it/releases/latest/download/altstore.json";
Object.assign(STR.ar, {
  appTitle: "تطبيق الآيفون", appInApp: "أنت فاتحه من التطبيق.", appChange: "تغيير الرابط",
  appIntro: "فيه نسخة تطبيق للآيفون فيها ويدجت للشاشة الرئيسية. تنزّله وتثبته بـ AltStore.",
  appDownload: "تحميل التطبيق (IPA)", appOpen: "افتح في التطبيق",
  appSource: "التحديثات في AltStore", appSourceHelp: "انسخ الرابط، وفي AltStore روح لتبويب Sources واضغط + والصقه. بعدها أي تحديث للتطبيق يطلع لك في AltStore.",
  appCopySource: "نسخ رابط المصدر", appCopied: "تم النسخ",
});
Object.assign(STR.en, {
  appTitle: "iPhone app", appInApp: "You're in the app.", appChange: "Change link",
  appIntro: "There's an iPhone app with a home-screen widget. Download it and install it with AltStore.",
  appDownload: "Download the app (IPA)", appOpen: "Open in the app",
  appSource: "Updates in AltStore", appSourceHelp: "Copy the link, then in AltStore go to Sources, tap + and paste it. App updates then show up in AltStore.",
  appCopySource: "Copy source link", appCopied: "Copied",
});
function renderPhoneAppBox() {
  const box = $("#phoneAppBox"), R = window.REMOTE;
  if (!box || !R) return;
  box.innerHTML = `<span>${T("appTitle")}</span>` + (IN_APP
    ? `<div class="ph-step"><span class="muted small">${T("appInApp")}</span><a class="ghost sm" href="hundredit://reset">${T("appChange")}</a></div>`
    : `<div class="ph-step"><span class="muted small">${T("appIntro")}</span>
        <div class="row"><a class="ghost sm" href="${IPA_URL}">${T("appDownload")}</a>${R.id ? `<a class="primary" href="hundredit://open?g=${R.id}">${T("appOpen")}</a>` : ""}</div></div>`)
    + `<div class="ph-step"><b>${T("appSource")}</b><span class="muted small">${T("appSourceHelp")}</span>
        <code class="ph-url">${SOURCE_URL}</code><button class="ghost sm" data-copy-source>${T("appCopySource")}</button></div>`;
}
document.addEventListener("click", async (e) => {
  if (!e.target.closest("[data-copy-source]")) return;
  try { await navigator.clipboard.writeText(SOURCE_URL); toast(T("appCopied")); } catch {}
});

function renderPhoneEmpty() {
  const R = window.REMOTE;
  const why = STATE?.error === "phone" ? R.error || "net" : STATE?.error ? "nosaves" : null;
  $("#empty").innerHTML = why ? `<img src="icon.svg" alt="" class="empty-logo"><h2>${T("phEmptyTitle")}</h2>
    <p>${STR[lang].phErr[why] || STR[lang].phErr.net}</p>
    ${why === "nolink" ? "" : `<div class="row center"><button class="primary" data-action="phoneRefresh">${T("phRetry")}</button></div>`}`
    : `<img src="icon.svg" alt="" class="empty-logo"><p class="muted">${T("syncLoading")}</p>`;
  renderSyncInfo();
}
function renderSyncInfo() {
  const R = window.REMOTE, el = $("#syncInfo");
  if (!R || !el) return;
  el.textContent = R.data?.updated ? T("syncAgo", ago(R.data.updated)) : T("syncLoading");
  el.classList.toggle("stale", !!R.error && !!R.data);
}
if (window.REMOTE) {
  setInterval(renderSyncInfo, 15000);
  document.addEventListener("click", async (e) => {
    const b = e.target.closest("[data-action=phoneRefresh]");
    if (!b) return;
    b.classList.add("spin");
    await window.REMOTE.refresh().catch(() => {});
    b.classList.remove("spin");
    lastSig = "";
    await refresh();
    renderSyncInfo();
  });
}

// ---------- "what am I missing?" under each count ----------
Object.assign(STR.ar, {
  missingBtn: (n) => `وش ناقصني؟ (${n})`, msTitle: (x) => `اللي ناقصك: ${x}`, msNone: "ما ناقصك شي هنا 🎉",
  msFor: { both: "لينك الصغير والكبير", child: "لينك الصغير بس", adult: "لينك الكبير بس" }, msOther: "أغراض بدون منطقة",
  msVisited: "المناطق اللي ما زرتها",
});
Object.assign(STR.en, {
  missingBtn: (n) => `What am I missing? (${n})`, msTitle: (x) => `Missing: ${x}`, msNone: "Nothing missing here 🎉",
  msFor: { both: "Young and Adult Link", child: "Young Link only", adult: "Adult Link only" }, msOther: "Not tied to an area",
  msVisited: "Areas you haven't visited",
});
const MISS_TITLE = { gs: "tGs", poh: "tPoh", hearts: "tHearts", ft: "tFt", gear: "tGear", song: "tSongs", visited: "tVisited" };
function missingList(s, kind) {
  // Everything still missing of this kind, for the Link chosen above (young / adult / both).
  const cats = kind === "hearts" ? ["poh", "hc"] : [kind];
  const out = [];
  for (const { i, r, c } of ALL_ITEMS()) {
    if (!visible(i) || isOn(s, i.id)) continue;
    const cat = i.cat || (c && (KIND_OF[c.id] || "gear"));
    if (cats.includes(cat)) out.push({ i, r, cat });
  }
  return out;
}
function openMissing(kind) {
  const s = slot();
  $("#msTitle").textContent = T("msTitle", T(MISS_TITLE[kind]));
  $("#msSub").textContent = STR[lang].msFor[age];
  let html = "";
  if (kind === "visited") {
    const regs = DATA.regions.filter((r) => r.id in s.visited && !s.visited[r.id]);
    html = regs.length ? `<div class="group-title">${ICON.map}${T("msVisited")} <span class="muted" dir="ltr">${regs.length}</span></div>
      <div class="list">${regs.map((r) => `<button class="ms-row" data-region="${r.id}" style="--art:${art(r)}"><span class="ph-dot"></span><b>${esc(regionName(r))}</b><span class="ms-go">›</span></button>`).join("")}</div>` : "";
  } else {
    const list = missingList(s, kind);
    // Grouped by area, in the game's order; items with no area at the end.
    const groups = new Map();
    for (const x of list) { const k = x.r ? x.r.id : ""; if (!groups.has(k)) groups.set(k, []); groups.get(k).push(x); }
    const order = DATA.regions.map((r) => r.id).filter((id) => groups.has(id)).concat(groups.has("") ? [""] : []);
    html = order.map((id) => {
      const r = id ? DATA.regions.find((x) => x.id === id) : null, its = groups.get(id);
      return `<div class="group-title">${r ? `<span class="ph-dot sm" style="--art:${art(r)}"></span>${esc(regionName(r))}` : `${ICON.item}${T("msOther")}`}
        <span class="muted" dir="ltr">${its.length}</span></div>
        <div class="list">${its.map(({ i, r, cat }) => `<button class="ms-row" ${r ? `data-region="${r.id}" data-focus="${i.id}"` : `data-tab="${tabOf(i)}"`}>
          <span class="ms-ico">${ICON[cat] || ICON.item}</span><span class="name" dir="auto">${esc(itemName(i))}</span>
          <span class="tags">${i.era && i.era !== "Either" ? `<span class="tag">${T(ERA_KEY[i.era])}</span>` : ""}${i.night ? `<span class="tag night">${T("night")}</span>` : ""}${needBadge(s, i)}</span>
          <span class="ms-go">›</span></button>`).join("")}</div>`;
    }).join("");
  }
  $("#msBody").innerHTML = html || `<p class="muted">${T("msNone")}</p>`;
  $("#missingModal").classList.remove("hidden");
}
document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-missing]");
  if (b) { e.stopPropagation(); openMissing(b.dataset.missing); return; }
  // Picking a row closes the list; the area (or the tab) opens as usual.
  if (e.target.closest("#missingModal .ms-row")) $("#missingModal").classList.add("hidden");
}, true);
