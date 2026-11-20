"use strict";

window.__errors = [];
window.addEventListener("error", (e) => window.__errors.push(String(e.message)));
window.addEventListener("unhandledrejection", (e) => window.__errors.push(String(e.reason)));

const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const store = {
  get: (k, d) => { try { return localStorage.getItem(k) || d; } catch { return d; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch {} },
};

// ---------- language ----------
const STR = {
  ar: {
    subtitle: "متتبع إكمال أوكارينا الزمن", settings: "الإعدادات", whereSaves: "وين ملفات التخزين؟",
    whereSavesHelp: "اختر مجلد <b>save</b> اللي فيه مجلدات <code>slot_00</code> و <code>slot_01</code>… وبعدها البرنامج يتابع تقدمك تلقائياً كل ما تحفظ.",
    pickFolder: "اختيار المجلد", autoFind: "بحث تلقائي", tabField: "المناطق", tabDungeon: "الزنزانات", tabGear: "الأدوات والمعدات",
    tabSongs: "الأغاني والأحجار", ageChild: "لينك الصغير", ageAdult: "لينك الكبير", ageBoth: "الاثنين", saveFolder: "مجلد ملفات التخزين",
    browse: "تصفح…", save: "حفظ", language: "اللغة", langBtn: "English", sortPct: "الأعلى نسبة أول",
    version: (v) => `الإصدار ${v}. البرنامج يتحدث تلقائياً.`, updReady: (v) => `تحديث جديد جاهز (${v})`,
    updWhen: "يتثبت لحاله لما تقفل البرنامج", updNow: "حدّث الحين",
    updNew: (v) => `تحديث جديد (${v})`, updGetting: "يحمّل التحديث…", updInstalling: "يثبّت التحديث، البرنامج بيقفل ويفتح…",
    updFailed: "ما قدرت أحمّل التحديث.", updRetry: "جرّب مرة ثانية", mb: (a, b) => `${a} من ${b} ميجا`,
    overall: "الإكمال الكلي", overallChild: "إكمال لينك الصغير", overallAdult: "إكمال لينك الكبير",
    youAreIn: "المنطقة اللي أنت فيها", latestSave: "آخر تخزين", saveN: (n) => `تخزين ${n}`, newest: "الأحدث",
    allSaves: (n) => `كل التخزينات (${n})`, hideSaves: "إخفاء التخزينات", backLatest: "رجوع لآخر تخزين",
    youngLink: "لينك الصغير", adultLink: "لينك الكبير", hearts: (n) => `${n} قلوب`, rupees: (n) => `${n} روبية`,
    now: "الحين", minAgo: (n) => `قبل ${n} دقيقة`, hourAgo: (n) => `قبل ${n} ساعة`,
    tGs: "السكولتولا الذهبية", tPoh: "قطع القلوب", tHearts: "القلوب", tFt: "أفكار الجنية", tGear: "الأدوات والمعدات", tSongs: "الأغاني",
    tVisited: "المناطق المزارة", gsLag: (n) => `${n} ما تحدّد مكانها للحين`, held: (n) => `معك ${n} من 4 للقلب الجاي`,
    here: "أنت هنا", notVisited: "ما زرتها", noneChild: "ما فيها شي للينك الصغير", noneAdult: "ما فيها شي للينك الكبير",
    of: (a, b) => `${a} من ${b}`, howTo: "كيف أجيبها؟", video: "فيديو على يوتيوب", showEn: "English", showAr: "عربي",
    eraChild: "صغير", eraAdult: "كبير", eraEither: "أي عمر",
    catGs: "السكولتولا الذهبية", catPoh: "قطع القلوب", catFt: "أفكار الجنية (ما تنحسب في النسبة)", notCounted: "ما تنحسب في النسبة", catHc: "حاوية القلب (الزعيم)", catGear: "الأدوات والترقيات", catSong: "الأغاني",
    linked: "تم ربط مجلد التخزين", noSaves: "ما لقيت ملفات تخزين في هذا المجلد.", searching: "أدوّر…",
    notFound: "ما لقيت شي تلقائياً. اختر المجلد بنفسك.", noSlotsIn: (p) => `ما لقيت تخزينات في: ${p}`, updated: "تحدّث التقدم من آخر تخزين ✔",
    got: {
      gs: ["سكولتولا ذهبية جديدة!", (n) => `${n} سكولتولا ذهبية جديدة!`], poh: ["قطعة قلب جديدة!", (n) => `${n} قطع قلوب جديدة!`],
      ft: ["فكرة جنية جديدة!", (n) => `${n} أفكار جنية جديدة!`], hc: ["حاوية قلب!", (n) => `${n} حاويات قلوب!`],
      gear: ["غرض جديد!", (n) => `${n} أغراض جديدة!`], song: ["أغنية جديدة!", (n) => `${n} أغاني جديدة!`],
      quest: ["حجر/ميدالية جديدة!", (n) => `${n} أحجار وميداليات جديدة!`],
    },
    newHeart: (n) => (n === 1 ? "قلب جديد!" : `${n} قلوب جديدة!`), nowHearts: (n) => `صار عندك ${n} قلوب`,
  },
  en: {
    subtitle: "Ocarina of Time completion tracker", settings: "Settings", whereSaves: "Where are your saves?",
    whereSavesHelp: "Pick the <b>save</b> folder that has <code>slot_00</code>, <code>slot_01</code>… in it. After that the app follows your progress every time you save.",
    pickFolder: "Choose folder", autoFind: "Find automatically", tabField: "Areas", tabDungeon: "Dungeons", tabGear: "Items & gear",
    tabSongs: "Songs & stones", ageChild: "Young Link", ageAdult: "Adult Link", ageBoth: "Both", saveFolder: "Save folder",
    browse: "Browse…", save: "Save", language: "Language", langBtn: "عربي", sortPct: "Highest % first",
    version: (v) => `Version ${v}. Updates install automatically.`, updReady: (v) => `Update ready (${v})`,
    updWhen: "Installs by itself when you close the app", updNow: "Update now",
    updNew: (v) => `New update (${v})`, updGetting: "Downloading the update…", updInstalling: "Installing, the app will close and reopen…",
    updFailed: "Couldn't download the update.", updRetry: "Try again", mb: (a, b) => `${a} of ${b} MB`,
    overall: "Overall", overallChild: "Young Link", overallAdult: "Adult Link",
    youAreIn: "You are in", latestSave: "Latest save", saveN: (n) => `Save ${n}`, newest: "Newest",
    allSaves: (n) => `All saves (${n})`, hideSaves: "Hide saves", backLatest: "Back to latest save",
    youngLink: "Young Link", adultLink: "Adult Link", hearts: (n) => `${n} hearts`, rupees: (n) => `${n} rupees`,
    now: "just now", minAgo: (n) => `${n} min ago`, hourAgo: (n) => `${n} h ago`,
    tGs: "Gold Skulltulas", tPoh: "Heart Pieces", tHearts: "Hearts", tFt: "Fairy Thoughts", tGear: "Items & gear", tSongs: "Songs",
    tVisited: "Areas visited", gsLag: (n) => `${n} not placed yet`, held: (n) => `${n} of 4 toward the next heart`,
    here: "You're here", notVisited: "Not visited", noneChild: "Nothing here for Young Link", noneAdult: "Nothing here for Adult Link",
    of: (a, b) => `${a} of ${b}`, howTo: "How do I get it?", video: "YouTube video", showEn: "English", showAr: "عربي",
    eraChild: "Young", eraAdult: "Adult", eraEither: "Any age",
    catGs: "Gold Skulltulas", catPoh: "Heart Pieces", catFt: "Fairy Thoughts (not counted in the %)", notCounted: "Not counted in the %", catHc: "Heart Container (boss)", catGear: "Items & upgrades", catSong: "Songs",
    linked: "Save folder linked", noSaves: "No saves found in that folder.", searching: "Searching…",
    notFound: "Couldn't find it automatically. Pick the folder yourself.", noSlotsIn: (p) => `No saves found in: ${p}`, updated: "Progress updated from your latest save ✔",
    got: {
      gs: ["New Gold Skulltula!", (n) => `${n} new Gold Skulltulas!`], poh: ["New Heart Piece!", (n) => `${n} new Heart Pieces!`],
      ft: ["New Fairy Thought!", (n) => `${n} new Fairy Thoughts!`], hc: ["Heart Container!", (n) => `${n} Heart Containers!`],
      gear: ["New item!", (n) => `${n} new items!`], song: ["New song!", (n) => `${n} new songs!`],
      quest: ["New stone / medallion!", (n) => `${n} new stones & medallions!`],
    },
    newHeart: (n) => (n === 1 ? "New heart!" : `${n} new hearts!`), nowHearts: (n) => `You now have ${n} hearts`,
  },
};
let lang = store.get("lang", "ar") === "en" ? "en" : "ar";
const T = (k, ...a) => { const v = STR[lang][k]; return typeof v === "function" ? v(...a) : v; };
const isAr = () => lang === "ar";

function applyLang() {
  document.documentElement.lang = lang;
  document.documentElement.dir = isAr() ? "rtl" : "ltr";
  document.querySelectorAll("[data-i]").forEach((el) => (el.textContent = T(el.dataset.i)));
  document.querySelectorAll("[data-i-html]").forEach((el) => (el.innerHTML = T(el.dataset.iHtml)));
  document.querySelectorAll("[data-i-title]").forEach((el) => (el.title = T(el.dataset.iTitle)));
  document.querySelectorAll("[data-i-ph]").forEach((el) => (el.placeholder = T(el.dataset.iPh)));
  $("#langBtn").textContent = T("langBtn");
  document.querySelectorAll("#langSwitch button").forEach((b) => b.classList.toggle("on", b.dataset.lang === lang));
}
const regionName = (r) => (isAr() ? r.ar : r.name);
const collName = (c) => (isAr() ? c.ar : c.en || c.ar);
const itemName = (i) => (isAr() && i.name_ar ? i.name_ar : i.name);

// ---------- look ----------
const ICON = {
  gs: '<svg viewBox="0 0 24 24"><circle cx="12" cy="11" r="7" fill="#f2c55c"/><circle cx="9.3" cy="10" r="1.8" fill="#3a2a0a"/><circle cx="14.7" cy="10" r="1.8" fill="#3a2a0a"/><path d="M9 15h6l-1 3h-4z" fill="#f2c55c"/></svg>',
  poh: '<svg viewBox="0 0 24 24"><path d="M12 21s-8-5-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 6-8 11-8 11Z" fill="#ff7a7a"/><path d="M12 7.2V21s-8-5-8-11a4.5 4.5 0 0 1 8-2.8Z" fill="#ffb0b0"/></svg>',
  hc: '<svg viewBox="0 0 24 24"><path d="M12 21s-8-5-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 6-8 11-8 11Z" fill="#ff5c6c" stroke="#ffd6db" stroke-width="1.4"/></svg>',
  ft: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="5" fill="#bfe8ff"/><circle cx="12" cy="12" r="9" fill="none" stroke="#6cc6ff" stroke-width="1.5" stroke-dasharray="2 3"/></svg>',
  heart: '<svg viewBox="0 0 24 24"><path d="M12 21s-8-5-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 6-8 11-8 11Z" fill="#ff7a7a"/></svg>',
  rupee: '<svg viewBox="0 0 24 24"><path d="M12 2 18 7v10l-6 5-6-5V7Z" fill="#5fd38d"/><path d="M12 2v20l-6-5V7Z" fill="#3aa86a"/></svg>',
  map: '<svg viewBox="0 0 24 24"><path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2Z" fill="#6cc6ff"/><path d="M9 4v14M15 6v14" stroke="#0d1813" stroke-width="1.5"/></svg>',
  item: '<svg viewBox="0 0 24 24"><path d="M4 20 15 9l2 2L6 22Z" fill="#c9d6cf"/><path d="M14 4l6 6-3 1-4-4Z" fill="#f2c55c"/></svg>',
  note: '<svg viewBox="0 0 24 24"><path d="M9 18V5l11-2v13" fill="none" stroke="#b9b0ff" stroke-width="2"/><circle cx="6.5" cy="18" r="2.5" fill="#b9b0ff"/><circle cx="17.5" cy="16" r="2.5" fill="#b9b0ff"/></svg>',
  clock: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="#9db3a5" stroke-width="2"/><path d="M12 7v5l3 2" stroke="#9db3a5" stroke-width="2" fill="none"/></svg>',
  quest: '<svg viewBox="0 0 24 24"><path d="M12 2 20 9l-8 13L4 9Z" fill="#6cc6ff"/><path d="M12 2v20L4 9Z" fill="#a8dcff"/></svg>',
  play: '<svg viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="4" fill="#ff4e45"/><path d="M10 9v6l5-3Z" fill="#fff"/></svg>',
};
ICON.gear = ICON.item;
ICON.song = ICON.note;
const ART = {
  forest: "linear-gradient(120deg,#2f7a43,#174227)", field: "linear-gradient(120deg,#6f9c3d,#2c4a22)",
  town: "linear-gradient(120deg,#b08a4a,#4a3a22)", mountain: "linear-gradient(120deg,#a0573a,#3b2219)",
  fire: "linear-gradient(120deg,#e0552b,#5a1a10)", water: "linear-gradient(120deg,#2f8fd0,#14385a)",
  desert: "linear-gradient(120deg,#d9a24a,#6a4214)", shadow: "linear-gradient(120deg,#6b4bb0,#21173d)",
  ice: "linear-gradient(120deg,#8fd6ff,#2a5a7a)", castle: "linear-gradient(120deg,#7d8aa6,#2c3346)",
};
const THEME = {
  KokiriForest: "forest", LostWoods: "forest", SacredForestMeadow: "forest", HyruleField: "field", LonLonRanch: "field",
  Market: "town", HyruleCastle: "castle", KakarikoVillage: "town", Graveyard: "shadow", DeathMountainTrail: "mountain",
  GoronCity: "mountain", DeathMountainCrater: "fire", ZoraRiver: "water", ZoraDomain: "water", ZoraFountain: "ice",
  LakeHylia: "water", GerudoValley: "desert", GerudoFortress: "desert", HauntedWasteland: "desert", DesertColossus: "desert",
  DekuTree: "forest", DodongosCavern: "mountain", JabuJabu: "water", ForestTemple: "forest", FireTemple: "fire",
  IceCavern: "ice", WaterTemple: "water", BottomOfTheWell: "shadow", ShadowTemple: "shadow", SpiritTemple: "desert",
};
const art = (r) => ART[THEME[r.id]] || ART.field;
const CAT_KEY = { gs: "catGs", poh: "catPoh", ft: "catFt", hc: "catHc", gear: "catGear", song: "catSong" };
const ERA_KEY = { Child: "eraChild", Adult: "eraAdult", Either: "eraEither" };
const GEAR = ["items", "equip", "upgrades", "fairies", "masks"];
const KIND_OF = { songs: "song", quest: "quest" }; // other collections are gear
const KINDS = ["gs", "poh", "ft", "hc", "gear", "song", "quest"];
const TOTAL = { gs: 100, poh: 36, ft: 23, hc: 8 };

let DATA = null, STATE = null;
let picked = null;   // slot chosen from "all saves"; null = follow the latest save
let showAll = false;
let tab = "field";
let openRegion = null;
let age = store.get("age", "both");
let sortPct = store.get("sortPct", "0") === "1"; // areas ordered by % (high to low) instead of the game's order
// Does an entry count for the chosen Link? "Either" entries count for both.
// Fairy Thoughts only show when that option is on in Settings (off by default).
const showFt = () => typeof feat !== "function" || feat("fairyThoughts");
const visible = (i) => (i.cat !== "ft" || showFt()) &&
  (age === "both" || !i.era || i.era === "Either" || i.era === (age === "child" ? "Child" : "Adult"));
const noneFor = () => T(age === "child" ? "noneChild" : "noneAdult");

async function api(path, body) {
  const r = await fetch(path, body === undefined ? {} : { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}
function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.remove("hidden");
  clearTimeout(toast.t);
  toast.t = setTimeout(() => t.classList.add("hidden"), 2600);
}

// ---------- numbers ----------
const latest = () => [...STATE.slots].sort((a, b) => b.modified - a.modified)[0];
const slot = () => (picked && STATE.slots.find((s) => s.key === picked)) || latest();
const isOn = (s, id) => s._done.has(id);
// The save names the place you saved in. Match it loosely (case, spaces, "Wood"
// vs "Woods", extra parts like "LostWoods_Bridge") so an area isn't missed.
// "Inside..." and the different spellings of Ganon's / Ganondorf's Castle all
// come down to the same name.
const normLoc = (x) => String(x || "").toLowerCase().replace(/[^a-z0-9]/g, "")
  .replace(/^inside(the)?(?=[a-z])/, "").replace(/ganondorfs?|ganons/g, "ganon");
const regionOf = (loc) => {
  if (!loc) return null;
  const n = normLoc(loc);
  return DATA.regions.find((r) => r.locs.some((l) => normLoc(l) === n)) ||
    DATA.regions.find((r) => r.locs.some((l) => n.startsWith(normLoc(l).replace(/s$/, "")))) ||
    DATA.regions.find((r) => r.id === placeOf(loc)?.in) || null;
};
// Places you can save in that aren't one of the areas: their own name, and the
// area they belong to (for "you're here" and the area card).
const PLACES = {
  TimeTemple: { ar: "معبد الزمن", en: "Temple of Time", in: "Market" },
  TempleOfTime: { ar: "معبد الزمن", en: "Temple of Time", in: "Market" },
  GanonsCastle: { ar: "قلعة غانون", en: "Ganon's Castle", in: "HyruleCastle" },
  GanonCastle: { ar: "قلعة غانون", en: "Ganon's Castle", in: "HyruleCastle" },
  GanonsTower: { ar: "برج غانون", en: "Ganon's Tower", in: "HyruleCastle" },
  GerudoTrainingGround: { ar: "ساحة تدريب الجيرودو", en: "Gerudo Training Ground", in: "GerudoFortress" },
  ThievesHideout: { ar: "مخبأ اللصوص", en: "Thieves' Hideout", in: "GerudoFortress" },
  LinksHouse: { ar: "بيت لينك", en: "Link's House", in: "KokiriForest" },
  ChamberOfSages: { ar: "حجرة الحكماء", en: "Chamber of the Sages" },
};
const placeOf = (loc) => {
  const n = normLoc(loc);
  if (!n) return null;
  const k = Object.keys(PLACES).find((x) => normLoc(x) === n) || Object.keys(PLACES).find((x) => n.startsWith(normLoc(x)));
  if (k) return PLACES[k];
  // Anywhere inside Ganon's Castle (its trials, tower, or a room name we haven't seen).
  if (n.includes("ganon") && !n.includes("phantom")) return n.includes("tower") ? PLACES.GanonsTower : PLACES.GanonsCastle;
  return null;
};
// Name of the place in a save, always in the chosen language when we know it.
// An unknown name is at least split into words ("TimeTemple" -> "Time Temple").
const locName = (loc) => {
  const p = placeOf(loc);
  if (p) return isAr() ? p.ar : p.en;
  const r = regionOf(loc);
  if (r) return regionName(r);
  return loc ? String(loc).replace(/_/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2") : "—";
};
const pct = (p) => Math.floor(p * 100);

function totals(s) {
  const by = { gs: [0, 0], poh: [0, 0], ft: [0, 0], hc: [0, 0] };
  for (const r of DATA.regions) for (const i of r.items) { if (!visible(i)) continue; by[i.cat][1]++; if (isOn(s, i.id)) by[i.cat][0]++; }
  const coll = {};
  for (const c of DATA.collections) { const v = c.items.filter(visible); coll[c.id] = [v.filter((i) => isOn(s, i.id)).length, v.length]; }
  // The game's token counter can be ahead of the placement list for a moment.
  const gs = age === "both" ? Math.max(by.gs[0], s.gsCount || 0) : by.gs[0];
  // Fairy Thoughts are shown but not counted: Nintendo doesn't count them toward 100%.
  let done = gs + by.poh[0] + by.hc[0], all = by.gs[1] + by.poh[1] + by.hc[1];
  for (const k in coll) { done += coll[k][0]; all += coll[k][1]; }
  return { by, coll, gs, pct: all ? done / all : 0 };
}
// Everything that counts for an area: its collectibles plus the items, songs
// and upgrades you get there.
const regionAll = (r) => r.items.concat(r.extra || []);
const counts = (i) => i.cat !== "ft"; // what goes into the % (not Fairy Thoughts)
function attachExtras() {
  for (const r of DATA.regions) r.extra = [];
  for (const c of DATA.collections) {
    const kind = KIND_OF[c.id] || "gear";
    for (const i of c.items) {
      const r = i.place && DATA.regions.find((x) => x.id === i.place);
      if (r) r.extra.push({ ...i, cat: kind });
    }
  }
}
function regionStats(s, r) {
  const its = regionAll(r).filter((i) => visible(i) && counts(i));
  const done = its.filter((i) => isOn(s, i.id)).length;
  return { done, total: its.length, p: its.length ? done / its.length : 0 };
}
function ago(ms) {
  const m = Math.round((Date.now() - ms) / 60000);
  if (m < 1) return T("now");
  if (m < 60) return T("minAgo", m);
  const h = Math.round(m / 60);
  if (h < 24) return T("hourAgo", h);
  return new Date(ms).toLocaleDateString(isAr() ? "ar-SA-u-nu-latn-ca-gregory" : "en-GB", { day: "numeric", month: "long" });
}
const thumb = (s) => (s.hasImage ? assetUrl(`/api/thumb/${s.key}.jpg?t=${s.modified}`) : "");
// On the phone a picture may not have arrived yet: show the empty frame instead.
const hasShot = (s) => s.hasImage && !!thumb(s);
const slotNo = (s) => Number(s.key.slice(5)) + 1;

// A YouTube search for this exact thing (opens in your browser).
function videoUrl(i, r) {
  const kind = { gs: "Gold Skulltula", poh: "Piece of Heart", ft: "Fairy Thought", hc: "Heart Container" }[i.cat] || "";
  const q = ["Zelda Ocarina of Time Switch 2", kind, i.name, r ? r.name : ""].filter(Boolean).join(" ");
  return "https://www.youtube.com/results?search_query=" + encodeURIComponent(q);
}

// A new save (or picking another save) switches the % to the Link you saved as.
// Changing it by hand sticks until the next save.
function followAge(s) {
  if (typeof feat === "function" && !feat("autoAge")) return;
  if (s.age !== "Child" && s.age !== "Adult") return;
  const sig = `${s.key}:${s.modified}`;
  if (store.get("ageFollow", "") === sig) return;
  store.set("ageFollow", sig);
  age = s.age === "Adult" ? "adult" : "child";
  store.set("age", age);
}

// ---------- render ----------
function render() {
  applyLang();
  if (typeof renderUpdate === "function" && UPD) renderUpdate();
  const empty = !STATE || STATE.error || !STATE.slots.length;
  $("#empty").classList.toggle("hidden", !empty);
  $("#main").classList.toggle("hidden", empty || MINI || !!window.REMOTE);
  $("#phoneApp").classList.toggle("hidden", empty || !window.REMOTE);
  $("#miniView").classList.toggle("hidden", empty || !MINI);
  $("#allBtn").classList.toggle("hidden", empty || STATE.slots.length < 2);
  if (empty) {
    if (window.REMOTE) { renderPhoneEmpty(); return; }
    $("#emptyMsg").textContent = STATE?.error === "noslots" ? T("noSlotsIn", STATE.saveDir) : "";
    return;
  }
  for (const s of STATE.slots) s._done = new Set(s.done);
  const s = slot();
  followAge(s);
  if (MINI) { renderMini(s); return; }
  if (window.REMOTE) { renderPhoneApp(s); return; }
  $("#allBtn").textContent = showAll ? T("hideSaves") : T("allSaves", STATE.slots.length);
  renderGrid(s);
  renderSave(s);
  renderTiles(s);
  renderView(s);
  renderExtras(s);
  if (openRegion) renderDrawer(s);
}

function renderGrid(sel) {
  const g = $("#slotsGrid");
  g.classList.toggle("hidden", !showAll);
  if (!showAll) return;
  const newest = latest().key;
  g.innerHTML = [...STATE.slots].sort((a, b) => b.modified - a.modified).map((s) => {
    const r = regionOf(s.location);
    return `<button class="slot ${s.key === sel.key ? "on" : ""}" data-slot="${s.key}">
      ${hasShot(s) ? `<img class="shot" src="${thumb(s)}" alt="">` : `<div class="shot"></div>`}
      <div class="shade"></div>
      <span class="num">${T("saveN", slotNo(s))}</span>
      ${s.key === newest ? `<span class="latest">${T("newest")}</span>` : ""}
      <div class="meta">
        <div class="loc">${esc(locName(s.location))}</div>
        <div class="sub"><span class="pct">${pct(totals(s).pct)}%</span><span>${ago(s.modified)}</span></div>
      </div>
    </button>`;
  }).join("");
}

function renderSave(s) {
  const r = regionOf(s.location);
  const isLatest = s.key === latest().key;
  $("#saveCard").innerHTML = `
    ${hasShot(s) ? `<img class="shot" src="${thumb(s)}" alt="">` : `<div class="shot"></div>`}
    <div>
      <div class="label">${isLatest ? T("latestSave") : T("saveN", slotNo(s))}</div>
      <h2>${esc(locName(s.location))}</h2>
      <div class="facts">
        <span class="fact">${ICON.clock}${ago(s.modified)}</span>
        ${s.age ? `<span class="fact">${T(s.age === "Adult" ? "adultLink" : "youngLink")}</span>` : ""}
        <span class="fact">${ICON.heart}${T("hearts", (s.maxLife / 4) | 0)}</span>
        <span class="fact">${ICON.rupee}${T("rupees", s.rupees)}</span>
        ${hoursFact(s)}
      </div>
      ${isLatest ? "" : `<div class="row" style="margin-top:12px"><button class="ghost" data-action="latest">${T("backLatest")}</button></div>`}
    </div>`;

  // Small card under the big ring: the area you saved in.
  const card = $("#hereCard");
  const hs = r && regionStats(s, r);
  card.classList.toggle("hidden", !hs || !hs.total);
  if (hs && hs.total) {
    card.dataset.region = r.id;
    card.style.setProperty("--art", art(r));
    card.classList.toggle("done", hs.p === 1);
    card.innerHTML = `${miniRing(hs.p)}<div><small>${T("youAreIn")}</small><b>${esc(regionName(r))}</b>
      <span>${T("of", hs.done, hs.total)}${hs.p === 1 ? " ✔" : ""}</span></div>`;
  }

  const t = totals(s);
  $("#overallPct").textContent = pct(t.pct);
  $("#ringLabel").textContent = T(age === "both" ? "overall" : age === "child" ? "overallChild" : "overallAdult");
  $("#ringFg").style.strokeDashoffset = 326.7 * (1 - t.pct);
}

function tile(icon, label, val, max, note, green, kind) {
  const p = max ? Math.min(1, val / max) : 0;
  return `<div class="tile"><div class="t-head">${icon}${label}</div>
    <div class="t-val">${val}<small> / ${max}</small></div>
    <div class="bar ${green ? "green" : ""}"><div style="width:${p * 100}%"></div></div>
    ${note ? `<div class="t-note">${note}</div>` : ""}
    ${kind && val < max ? `<button class="miss-btn" data-missing="${kind}">${T("missingBtn", max - val)}</button>` : ""}</div>`;
}

function renderTiles(s) {
  const t = totals(s);
  const visitable = DATA.regions.filter((r) => r.id in s.visited);
  const visited = visitable.filter((r) => s.visited[r.id]).length;
  const gear = GEAR.reduce((a, k) => [a[0] + t.coll[k][0], a[1] + t.coll[k][1]], [0, 0]);
  const lag = (s.gsCount || 0) - t.by.gs[0];
  $("#tiles").innerHTML = [
    tile(ICON.gs, T("tGs"), t.gs, t.by.gs[1], age === "both" && lag > 0 ? T("gsLag", lag) : "", false, "gs"),
    tile(ICON.poh, T("tPoh"), t.by.poh[0], t.by.poh[1], s.heldPieces ? T("held", s.heldPieces) : "", false, "poh"),
    tile(ICON.heart, T("tHearts"), (s.maxLife / 4) | 0, 20, "", true, "hearts"),
    showFt() ? tile(ICON.ft, T("tFt"), t.by.ft[0], t.by.ft[1], T("notCounted"), false, "ft") : "",
    tile(ICON.item, T("tGear"), gear[0], gear[1], "", false, "gear"),
    tile(ICON.note, T("tSongs"), t.coll.songs[0], t.coll.songs[1], "", false, "song"),
    tile(ICON.map, T("tVisited"), visited, visitable.length, "", true, "visited"),
  ].join("");
}

function miniRing(p) {
  const c = 2 * Math.PI * 21;
  return `<div class="mini-ring"><svg viewBox="0 0 52 52"><circle class="bg" cx="26" cy="26" r="21"/><circle class="fg" cx="26" cy="26" r="21" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - p)}"/></svg><b>${pct(p)}%</b></div>`;
}

function renderView(s) {
  document.querySelectorAll("#tabs button").forEach((b) => b.classList.toggle("on", b.dataset.tab === tab));
  document.querySelectorAll("#ageSwitch button").forEach((b) => b.classList.toggle("on", b.dataset.age === age));
  const sb = $("#sortBtn");
  sb.classList.toggle("on", sortPct);
  sb.setAttribute("aria-pressed", String(sortPct));
  sb.classList.toggle("hidden-tab", tab !== "field" && tab !== "dungeon");
  const here = regionOf(s.location)?.id;
  if (tab === "history") { renderHistory(s); return; }
  if (tab === "hours") { renderHours(); return; }
  if (tab === "field" || tab === "dungeon") {
    let regs = DATA.regions.filter((r) => r.kind === tab);
    if (sortPct) {
      // Highest % first; areas with nothing for the chosen Link go last. Ties keep the game's order.
      const key = (r) => { const st = regionStats(s, r); return st.total ? st.p : -1; };
      regs = regs.map((r, n) => ({ r, n, k: key(r) })).sort((a, b) => b.k - a.k || a.n - b.n).map((x) => x.r);
    }
    $("#view").innerHTML = `<div class="grid">${regs.map((r) => {
      const st = regionStats(s, r);
      const cnt = (cat) => {
        const all = regionAll(r).filter((i) => i.cat === cat && visible(i));
        if (!all.length) return "";
        return `<span class="ico">${ICON[cat]}${all.filter((i) => isOn(s, i.id)).length}/${all.length}</span>`;
      };
      const sub = ""; // one language at a time: no English name under the Arabic one
      const unvisited = r.id in s.visited && !s.visited[r.id] && st.done === 0;
      if (!st.total) {
        return `<button class="region empty-age" data-region="${r.id}" style="--art:${art(r)}">
          <div class="r-top"><div><h4>${esc(regionName(r))}</h4>${sub}</div></div>
          <div class="none">${noneFor()}</div></button>`;
      }
      return `<button class="region ${unvisited ? "unvisited" : ""} ${st.p === 1 ? "done" : ""}" data-region="${r.id}" style="--art:${art(r)}">
        ${here === r.id ? `<span class="badge">${T("here")}</span>` : unvisited ? `<span class="badge gray">${T("notVisited")}</span>` : ""}
        <div class="r-top"><div><h4>${esc(regionName(r))}</h4>${sub}</div>${miniRing(st.p)}</div>
        <div class="counts">${cnt("gs")}${cnt("poh")}${cnt("ft")}${cnt("hc")}${cnt("gear")}${cnt("song")}</div>
      </button>`;
    }).join("")}</div>`;
  } else {
    const ids = tab === "gear" ? GEAR : ["songs", "quest"];
    $("#view").innerHTML = ids.map((id) => {
      const c = DATA.collections.find((x) => x.id === id);
      const its = c.items.filter(visible);
      if (!its.length) return "";
      const n = its.filter((i) => isOn(s, i.id)).length;
      const reg = (i) => DATA.regions.find((x) => x.id === i.place);
      return `<div class="section-title"><b>${esc(collName(c))}</b><span dir="ltr">${n} / ${its.length}</span></div>
        <div class="list cols">${its.map((i) => `<div>${itemRow(s, i, reg(i))}</div>`).join("")}</div>`;
    }).join("");
  }
}

// One checklist row; anything still missing gets a "how do I get it?" panel
// with the hint in Arabic or English and a YouTube link.
function itemRow(s, i, region) {
  const on = isOn(s, i.id);
  const tags = i.era ? `<span class="tag">${T(ERA_KEY[i.era] || "eraEither")}</span>` : "";
  const extra = (i.night ? `<span class="tag night">${T("night")}</span>` : "") + (on ? "" : needBadge(s, i));
  const row = `<div class="item ${on ? "on" : ""}" data-id="${i.id}"><span class="box"></span><span class="name" dir="auto">${esc(itemName(i))}</span><span class="tags">${tags}${extra}</span></div>`;
  if (on || !(i.steps || i.steps_ar)) return row;
  const ar = i.steps_ar || i.steps, en = i.steps || i.steps_ar;
  const first = isAr() ? "ar" : "en";
  return row + `<details class="how" data-id="${i.id}" data-show="${first}">
    <summary>${T("howTo")}</summary>
    <p class="rtl" lang="ar">${esc(ar)}</p><p lang="en">${esc(en)}</p>
    <div class="how-actions">
      <a class="yt" href="${videoUrl(i, region)}" target="_blank" rel="noopener">${ICON.play}${T("video")}</a>
      <button class="flip" data-flip="${i.id}">${first === "ar" ? T("showEn") : T("showAr")}</button>
    </div>
  </details>`;
}

function renderDrawer(s) {
  const r = DATA.regions.find((x) => x.id === openRegion);
  if (!r) return;
  const st = regionStats(s, r);
  $("#drTitle").textContent = regionName(r);
  $("#drSub").innerHTML = st.total ? T("of", st.done, st.total) : noneFor();
  $("#drBar").style.width = `${st.p * 100}%`;
  // Keep open hints open (and in the language you flipped them to) across refreshes.
  const keep = {};
  document.querySelectorAll("#drBody details[open]").forEach((d) => (keep[d.dataset.id] = d.dataset.show));
  $("#drBody").innerHTML = ["gs", "poh", "ft", "hc", "gear", "song"].map((cat) => {
    const its = regionAll(r).filter((i) => i.cat === cat && visible(i));
    if (!its.length) return "";
    its.sort((a, b) => isOn(s, a.id) - isOn(s, b.id)); // missing ones first
    return `<div class="group-title">${ICON[cat]}${T(CAT_KEY[cat])} <span class="muted" dir="ltr">${its.filter((i) => isOn(s, i.id)).length}/${its.length}</span></div>
      <div class="list">${its.map((i) => itemRow(s, i, r)).join("")}</div>`;
  }).join("");
  for (const [id, show] of Object.entries(keep)) {
    const d = $(`#drBody details[data-id="${id}"]`);
    if (d) { d.open = true; setShow(d, show); }
  }
  $("#drawer").classList.remove("hidden");
}
function setShow(d, show) {
  d.dataset.show = show;
  d.querySelector(".flip").textContent = show === "ar" ? T("showEn") : T("showAr");
}

// ---------- events ----------
document.addEventListener("click", async (e) => {
  const t = e.target.closest("button, .drawer");
  if (!t) return;
  if (t.classList.contains("drawer")) { if (e.target === t) { t.classList.add("hidden"); openRegion = null; } return; }
  const d = t.dataset;
  if (d.flip) { const det = t.closest("details"); setShow(det, det.dataset.show === "ar" ? "en" : "ar"); }
  else if (d.slot) { picked = d.slot === latest().key ? null : d.slot; showAll = false; render(); window.scrollTo({ top: 0, behavior: "smooth" }); }
  else if (d.tab) { tab = d.tab; render(); }
  else if (d.age) { age = d.age; store.set("age", age); render(); }
  else if (d.lang) { lang = d.lang; store.set("lang", lang); render(); }
  else if (d.region) { openRegion = d.region; renderDrawer(slot()); }
  else if (d.action === "lang") { lang = isAr() ? "en" : "ar"; store.set("lang", lang); render(); }
  else if (d.action === "sort") { sortPct = !sortPct; store.set("sortPct", sortPct ? "1" : "0"); render(); }
  else if (d.action === "toggleAll") { showAll = !showAll; render(); }
  else if (d.action === "latest") { picked = null; render(); }
  else if (d.action === "close") { t.closest(".drawer").classList.add("hidden"); openRegion = null; }
  else if (d.action === "settings") {
    $("#dirInput").value = STATE?.saveDir || "";
    $("#settingsMsg").textContent = "";
    renderFeatureList();
    loadPhone();
    $("#settings").classList.remove("hidden");
  } else if (d.action === "browse") {
    const r = await api("/api/browse").catch(() => null);
    if (r?.path) linked(r.path);
    else if (r?.error) msg(T("noSaves"));
  } else if (d.action === "detect") {
    msg(T("searching"));
    const r = await api("/api/detect").catch(() => ({}));
    if (r.dirs?.length) await setDir(r.dirs[0]);
    else msg(T("notFound"));
  } else if (d.action === "saveDir") {
    await setDir($("#dirInput").value);
  }
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") { document.querySelectorAll(".drawer").forEach((x) => x.classList.add("hidden")); openRegion = null; }
});
function msg(m) { $("#settingsMsg").textContent = m; $("#emptyMsg").textContent = m; }
function linked(path) {
  toast(T("linked"));
  $("#dirInput").value = path;
  $("#settings").classList.add("hidden");
  lastSig = "";
  refresh();
}
async function setDir(path) {
  try { linked((await api("/api/savedir", { path })).path); }
  catch { msg(T("noSaves")); }
}

let lastSig = "";
async function refresh() {
  try {
    const st = await api("/api/state");
    const sig = JSON.stringify(st);
    if (sig === lastSig) return;
    const prev = STATE;
    const before = prev && prev.slots.length ? latest().modified : 0;
    STATE = st;
    lastSig = sig;
    if (prev && prev.saveDir === st.saveDir && !MINI) celebrate(prev, st);
    trackProgress(prev, st);
    if (before && STATE.slots.length && latest().modified > before) {
      picked = null; // a new save came in: jump to it
    }
    render();
  } catch (e) { console.error(e); }
}

// ---------- "you got something" notifications ----------
const ITEM_INDEX = {};
function indexItems() {
  for (const r of DATA.regions) for (const i of r.items) ITEM_INDEX[i.id] = { item: i, region: r };
  for (const c of DATA.collections) {
    const kind = KIND_OF[c.id] || "gear";
    for (const i of c.items) {
      const region = (i.place && DATA.regions.find((x) => x.id === i.place)) || null;
      ITEM_INDEX[i.id] = { item: { ...i, cat: kind }, region, coll: c };
    }
  }
}

// The game rotates its saves across slots, so a new save is compared with the
// newest save we already had, not with the older contents of the same slot
// (that's what made old finds pop up again). Each find is announced once.
const notified = new Set();
const newestOf = (st) => st.slots.reduce((a, b) => (!a || b.modified > a.modified ? b : a), null);
function celebrate(prev, next) {
  let shown = false;
  const old = newestOf(prev), s = newestOf(next);
  if (!old || !s || s.modified <= old.modified) return false;
  const had = new Set(old.done);
  const fresh = s.done.filter((id) => !had.has(id) && !notified.has(id) && ITEM_INDEX[id]);
  fresh.forEach((id) => notified.add(id));
  const finds = fresh.map((id) => ITEM_INDEX[id]).filter((f) => f.item.cat !== "ft" || showFt()).sort((x, y) => KINDS.indexOf(x.item.cat) - KINDS.indexOf(y.item.cat));
  const running = new Set(had);
  const count = (cat) => Object.values(ITEM_INDEX).filter((f) => f.item.cat === cat && running.has(f.item.id)).length;
  const of = (cat) => (TOTAL[cat] ? `${count(cat)} / ${TOTAL[cat]}` : "");
  const got = (cat) => STR[lang].got[cat];
  if (finds.length > 3) {
    // A big batch (e.g. first time after a long session): one card per kind.
    for (const cat of KINDS) {
      const list = finds.filter((f) => f.item.cat === cat);
      if (!list.length) continue;
      list.forEach((f) => running.add(f.item.id));
      notify({ icon: ICON[cat], title: list.length === 1 ? got(cat)[0] : got(cat)[1](list.length),
        place: [...new Set(list.map((f) => (f.region ? regionName(f.region) : collName(f.coll))))].join(isAr() ? "، " : ", "), total: of(cat) });
    }
  } else {
    for (const f of finds) {
      if (!f.region) {
        running.add(f.item.id);
        notify({ icon: ICON[f.item.cat], title: got(f.item.cat)[0], name: itemName(f.item), place: collName(f.coll), total: of(f.item.cat) });
        continue;
      }
      const before = regionPct(f.region, running);
      running.add(f.item.id);
      notify({ icon: ICON[f.item.cat], title: got(f.item.cat)[0], name: itemName(f.item), place: regionName(f.region), region: f.region.id,
        from: before, to: regionPct(f.region, running), total: of(f.item.cat) });
    }
  }
  if (finds.length) shown = true;
  const hb = (old.maxLife / 4) | 0, ha = (s.maxLife / 4) | 0;
  if (ha > hb) {
    notify({ icon: ICON.heart, title: T("newHeart", ha - hb), place: T("nowHearts", ha), total: `${ha} / 20` });
    shown = true;
  }
  return shown;
}
function regionPct(r, set) {
  const its = regionAll(r).filter(counts);
  return its.length ? its.filter((i) => set.has(i.id)).length / its.length : 0;
}

function notify(n) {
  if (feat("winToast")) api("/api/toast", { title: n.title, body: [n.name, n.place, n.total].filter(Boolean).join(" · ") }).catch(() => {});
  if (!feat("notes")) return;
  const box = $("#notes");
  const el = document.createElement("button");
  el.className = "note-card";
  if (n.region) el.dataset.region = n.region;
  el.innerHTML = `
    <div class="nc-icon">${n.icon}</div>
    <div class="nc-body">
      <div class="nc-title">${esc(n.title)}</div>
      ${n.name ? `<div class="nc-name" dir="auto">${esc(n.name)}</div>` : ""}
      ${n.region ? `<div class="nc-prog"><span class="nc-place">${esc(n.place)}</span><div class="bar"><div style="width:${n.from * 100}%"></div></div>
        <span dir="ltr">${pct(n.from)}% → <b>${pct(n.to)}%</b></span></div>` : `<div class="nc-sub">${esc(n.place || "")}</div>`}
    </div>
    <div class="nc-total" dir="ltr">${esc(n.total)}</div>`;
  box.prepend(el);
  while (box.children.length > 4) box.lastChild.remove();
  requestAnimationFrame(() => requestAnimationFrame(() => {
    el.classList.add("in");
    const bar = el.querySelector(".nc-prog .bar > div");
    if (bar) setTimeout(() => (bar.style.width = `${n.to * 100}%`), 350);
  }));
  const close = () => { el.classList.remove("in"); el.classList.add("out"); setTimeout(() => el.remove(), 400); };
  let timer = setTimeout(close, 7000);
  el.addEventListener("mouseenter", () => clearTimeout(timer));
  el.addEventListener("mouseleave", () => (timer = setTimeout(close, 2500)));
  el.addEventListener("click", () => setTimeout(close, 50));
}

// ---------- self-update ----------
let UPD = null;
async function checkUpdate() {
  try { UPD = await api("/api/update"); } catch { UPD = null; }
  renderUpdate();
}
// The card shows up as soon as a new version is found (it downloads in the
// background). "Update now" switches it to a live progress counter.
let updating = false, updPoll = null;
const UPD_ICON = `<div class="u-ico"><svg viewBox="0 0 24 24"><path d="M12 3v12m0 0-5-5m5 5 5-5M5 20h14" fill="none" stroke="#5fd38d" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></div>`;
function renderUpdate() {
  $("#versionInfo").textContent = UPD ? T("version", UPD.current) : "";
  const card = $("#updateCard");
  const st = UPD && UPD.status;
  const found = st === "downloading" || st === "ready";
  card.classList.toggle("hidden", !(found || (updating && UPD)));
  if (!UPD || !(found || updating)) return;
  if (!updating) {
    card.innerHTML = `${UPD_ICON}<div><b>${esc(st === "ready" ? T("updReady", UPD.version) : T("updNew", UPD.version))}</b><span>${T("updWhen")}</span></div>
      <button class="primary" data-action="updateNow">${T("updNow")}</button>`;
    return;
  }
  if (st === "error") {
    card.innerHTML = `${UPD_ICON}<div><b>${T("updFailed")}</b></div><button class="primary" data-action="updateRetry">${T("updRetry")}</button>`;
    return;
  }
  const p = st === "ready" || st === "applied" ? 1 : UPD.total ? Math.min(1, UPD.downloaded / UPD.total) : 0;
  const mb = (x) => (x / 1048576).toFixed(1);
  card.innerHTML = `${UPD_ICON}<div class="u-prog"><b>${p >= 1 ? T("updInstalling") : T("updGetting")}</b>
      <div class="u-bar"><i style="width:${(p * 100).toFixed(1)}%"></i></div>
      <span class="u-num"><bdi dir="ltr">${Math.floor(p * 100)}%</bdi>${UPD.total ? `<bdi>${T("mb", mb(UPD.downloaded), mb(UPD.total))}</bdi>` : ""}</span></div>`;
}
async function startUpdate() {
  updating = true;
  renderUpdate();
  await api("/api/update/apply", {}).catch(() => {});
  clearInterval(updPoll);
  updPoll = setInterval(checkUpdate, 400); // fast while you watch the counter
}
document.addEventListener("click", async (e) => {
  if (e.target.closest("[data-action=updateNow]")) startUpdate();
  if (e.target.closest("[data-action=updateRetry]")) {
    await api("/api/update/check", {}).catch(() => {});
    setTimeout(startUpdate, 1500);
  }
});

(async () => {
  applyLang();
  DATA = await (await fetch("data.json")).json();
  attachExtras();
  indexItems();
  await refresh();
  setInterval(refresh, 3000);
  checkUpdate();
  setInterval(() => { if (!updating) checkUpdate(); }, 15000);
})();
