"use strict";
// Phone layout: a calmer, simpler design with a tab bar at the bottom.
// Home shows the essentials; the lists reuse the same views as the PC app.
if (window.REMOTE) {
  document.documentElement.classList.add("phone");
  tab = store.get("phTab", "home");
  Object.assign(STR.ar, {
    phHome: "الرئيسية", phAreas: "المناطق", phItems: "الأغراض", phMore: "تقدمي", phOverallOf: (a, b) => `${a} من ${b}`,
    phHere: "أنت الحين في", phNext: "وش أسوي بعدين؟", phSaved: (t) => `آخر تخزين ${t}`, phAll: "الكل",
  });
  Object.assign(STR.en, {
    phHome: "Home", phAreas: "Areas", phItems: "Items", phMore: "Progress", phOverallOf: (a, b) => `${a} of ${b}`,
    phHere: "You're in", phNext: "What's next?", phSaved: (t) => `Saved ${t}`, phAll: "All",
  });
}

const PH_GROUPS = { home: ["home"], areas: ["field", "dungeon"], items: ["gear", "songs"], more: ["history", "hours"] };
const PH_TAB_ICON = {
  home: '<svg viewBox="0 0 24 24"><path d="M4 11 12 4l8 7v8a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1Z"/></svg>',
  areas: '<svg viewBox="0 0 24 24"><path d="m3 6 6-2 6 2 6-2v14l-6 2-6-2-6 2Z" fill="none" stroke-width="2" stroke-linejoin="round"/><path d="M9 4v14M15 6v14" fill="none" stroke-width="2"/></svg>',
  items: '<svg viewBox="0 0 24 24"><path d="M4 20 15 9l2 2L6 22Z"/><path d="m14 4 6 6-3 1-4-4Z"/></svg>',
  more: '<svg viewBox="0 0 24 24"><path d="M4 19h16M6 16l4-5 4 3 5-7" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
};
const PH_SEG = { field: "tabField", dungeon: "tabDungeon", gear: "tabGear", songs: "tabSongs", history: "tabHistory", hours: "tabHours" };
const phGroup = () => Object.keys(PH_GROUPS).find((g) => PH_GROUPS[g].includes(tab)) || "home";

function phRing(p, size, stroke) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r;
  return `<svg viewBox="0 0 ${size} ${size}" class="ph-ring"><circle cx="${size / 2}" cy="${size / 2}" r="${r}" class="bg" stroke-width="${stroke}"/>
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" class="fg" stroke-width="${stroke}" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - p)}"/></svg>`;
}

function phHome(s) {
  const r = regionOf(s.location);
  const t = totals(s); // for the Link chosen above: everything, Young or Adult
  const done = t.gs + t.by.poh[0] + t.by.hc[0] + Object.values(t.coll).reduce((x, c) => x + c[0], 0);
  const all = t.by.gs[1] + t.by.poh[1] + t.by.hc[1] + Object.values(t.coll).reduce((x, c) => x + c[1], 0);
  const g = zeldaGame();
  const play = g ? g.total : s.play;
  const hs = r && regionStats(s, r);
  const stat = (icon, val, max, label, kind) => `<div class="ph-stat">${icon}<b dir="ltr">${val}<small>/${max}</small></b><span>${label}</span>
    ${val < max ? `<button class="miss-btn" data-missing="${kind}">${T("missingBtn", max - val)}</button>` : ""}</div>`;
  return `${phAges()}
    <div class="ph-hero ${hasShot(s) ? "" : "noshot"}" style="--art:${r ? art(r) : ART.field}">
      ${hasShot(s) ? `<img src="${thumb(s)}" alt="">` : ""}
      <div class="ph-hero-txt">
        <small>${T("phSaved", ago(s.modified))}</small>
        <h2>${esc(locName(s.location))}</h2>
        <span>${s.age ? T(s.age === "Adult" ? "adultLink" : "youngLink") : ""}${play ? ` · ${fmtHM(play)}` : ""}</span>
      </div>
    </div>
    <div class="ph-overall">
      <div class="ph-big">${phRing(t.pct, 132, 12)}<div><b>${pct(t.pct)}<small>%</small></b></div></div>
      <div class="ph-overall-txt"><b>${T(age === "both" ? "overall" : age === "child" ? "overallChild" : "overallAdult")}</b><span>${T("phOverallOf", done, all)}</span></div>
    </div>
    <div class="ph-stats">
      ${stat(ICON.gs, t.gs, t.by.gs[1], T("tGs"), "gs")}
      ${stat(ICON.poh, t.by.poh[0], t.by.poh[1], T("tPoh"), "poh")}
      ${stat(ICON.heart, (s.maxLife / 4) | 0, 20, T("tHearts"), "hearts")}
      ${showFt() ? stat(ICON.ft, t.by.ft[0], t.by.ft[1], T("tFt"), "ft") : (() => { const g = GEAR.reduce((x, k) => [x[0] + t.coll[k][0], x[1] + t.coll[k][1]], [0, 0]); return stat(ICON.item, g[0], g[1], T("tGear"), "gear"); })()}
    </div>
    ${hs && hs.total ? `<button class="ph-row ph-here" data-region="${r.id}" style="--art:${art(r)}">
      <span class="ph-dot"></span>
      <span class="ph-row-txt"><small>${T("phHere")}</small><b>${esc(regionName(r))}</b><span class="ph-bar"><i style="width:${hs.p * 100}%"></i></span></span>
      <span class="ph-pct">${pct(hs.p)}%</span></button>` : ""}
    <div id="phNext" class="ph-next"></div>`;
}

const phAges = () => `<div class="ph-seg ph-age">${["child", "adult", "both"].map((k) => `<button data-age="${k}" class="${age === k ? "on" : ""}">${T(k === "child" ? "ageChild" : k === "adult" ? "ageAdult" : "phAll")}</button>`).join("")}</div>`;

function phSegments() {
  const g = phGroup();
  if (g === "home") return "";
  const seg = `<div class="ph-seg">${PH_GROUPS[g].map((k) => `<button data-tab="${k}" class="${tab === k ? "on" : ""}">${T(PH_SEG[k])}</button>`).join("")}</div>`;
  const sort = g === "areas" ? `<button class="ph-sort sort-btn ${sortPct ? "on" : ""}" data-action="sort">
    <svg viewBox="0 0 24 24"><path d="M7 4v14m0 0-3-3m3 3 3-3M14 6h7M14 11h5M14 16h3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
    <span>${T("sortPct")}</span><i class="switch"></i></button>` : "";
  const ages = g !== "more" ? phAges() : "";
  return seg + ages + sort;
}

// Areas as simple rows: colour, name, bar, %.
function phAreas(s) {
  const here = regionOf(s.location)?.id;
  let regs = DATA.regions.filter((r) => r.kind === tab);
  if (sortPct) {
    // Highest % (finished ones) first; areas with nothing for the chosen Link last.
    const key = (r) => { const st = regionStats(s, r); return st.total ? st.p : -1; };
    regs = regs.map((r, n) => ({ r, n, k: key(r) })).sort((a, b) => b.k - a.k || a.n - b.n).map((x) => x.r);
  }
  return `<div class="ph-list">${regs.map((r) => {
    const st = regionStats(s, r);
    const unvisited = r.id in s.visited && !s.visited[r.id] && st.done === 0;
    return `<button class="ph-row ${st.p === 1 ? "done" : ""} ${unvisited || !st.total ? "dim" : ""}" data-region="${r.id}" style="--art:${art(r)}">
      <span class="ph-dot">${st.p === 1 ? "✓" : ""}</span>
      <span class="ph-row-txt"><b>${esc(regionName(r))}${here === r.id ? ` <em>${T("here")}</em>` : ""}</b>
        ${st.total ? `<span class="ph-bar"><i style="width:${st.p * 100}%"></i></span>` : `<span class="muted small">${noneFor()}</span>`}</span>
      <span class="ph-pct">${st.total ? `${pct(st.p)}%` : ""}</span></button>`;
  }).join("")}</div>`;
}

function renderPhoneApp(s) {
  const app = $("#phoneApp");
  if (!app.dataset.ready) {
    app.dataset.ready = "1";
    app.innerHTML = `<div id="phTop"></div><div id="phBody"></div>`;
    $("#phBody").appendChild($("#view"));
    const nav = document.createElement("nav");
    nav.id = "phTabs";
    nav.className = "ph-tabs";
    document.body.appendChild(nav);
  }
  const g = phGroup();
  store.set("phTab", tab);
  $("#phTabs").innerHTML = Object.keys(PH_GROUPS).map((k) => `<button data-tab="${PH_GROUPS[k][0] === "home" ? "home" : g === k ? tab : PH_GROUPS[k][0]}" class="${g === k ? "on" : ""}">
    ${PH_TAB_ICON[k]}<span>${T({ home: "phHome", areas: "phAreas", items: "phItems", more: "phMore" }[k])}</span></button>`).join("");
  $("#phTop").innerHTML = g === "home" ? phHome(s) : phSegments();
  const v = $("#view");
  if (g === "home") {
    v.innerHTML = "";
    if (feat("nextUp")) renderNextUp(s, $("#phNext"));
  } else if (g === "areas") v.innerHTML = phAreas(s);
  else renderView(s);
  renderSyncInfo();
  if (openRegion) renderDrawer(s);
}

// Switching tabs starts at the top.
document.addEventListener("click", (e) => {
  if (window.REMOTE && e.target.closest("#phTabs [data-tab]")) window.scrollTo({ top: 0 });
});
