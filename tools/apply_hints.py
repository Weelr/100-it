"""Arabic clean-up for web/data.json:
 - hints that point at landmarks instead of north/south/east/west (i18n/hints_landmarks.py)
 - Arabic names and Arabic game terms, so the Arabic view has no English words (i18n/ar_terms.py)
gen_data.py runs this at the end too, so regenerating keeps it."""
import json, os, re, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "i18n"))
from hints_landmarks import T
from ar_terms import NAMES, TERMS, PHRASES

_terms = sorted(TERMS, key=lambda t: -len(t[0]))
_rx = [(re.compile(r"(بالـ|للـ|والـ|فالـ|كالـ|الـ|بـ|لـ)?\s?(?<![A-Za-z])" + re.escape(en) + r"(?![A-Za-z])"), ar) for en, ar in _terms]

def arabize(s):
    if not s:
        return s
    for a, b in PHRASES:
        s = s.replace(a, b)
    for rx, ar in _rx:
        def rep(m, ar=ar):
            p = m.group(1) or ""
            lead = "" if p or m.group(0)[:1] != " " else " "
            if p == "الـ" or p == "":
                return lead + ar if p == "" else ar
            pre = {"بالـ": "ب", "بـ": "ب", "للـ": "ل", "لـ": "ل", "والـ": "و", "فالـ": "ف", "كالـ": "ك"}[p]
            if pre == "ل" and ar.startswith("ال"):
                return "لل" + ar[2:]   # ل + الخطّاف = للخطّاف
            return pre + ar
        s = rx.sub(rep, s)
    return s

# Save keys fixed after checking real saves. The source data marks some groups
# as "could be swapped"; these are confirmed by the player.
SRC_FIX = {
    # Kakariko: the key the source gave the watchtower ladder is really the
    # unfinished building's (player had the building, not the ladder).
    "gs11": [{"t": "k", "v": "14107117960174262321"}],
    "gs12": [{"t": "k", "v": "15118290503807073158"}],
}

# Bottles: the save only counts how many you have (numbered in the order you got
# them), not where each came from. So every bottle shows the same hint listing
# all five places, and none is tied to a place or needs a specific item.
BOTTLE_EN = ("The game only counts how many bottles you have, not which ones. Bottles come from: "
             "1) catching the loose Bug for the scared Potion Shop owner in Castle Town (new in the remake); "
             "2) winning Talon's Super Cucco game at Lon Lon Ranch; "
             "3) returning the Cuccos to their pen in Kakariko Village; "
             "4) Ruto's Letter on the floor of Lake Hylia (needed for the story); "
             "5) as an adult, 500 points at the Poe Shop in Castle Town (each Big Poe is 100; catch them in Hyrule Field riding Epona).")
BOTTLE_AR = ("اللعبة تحسب عدد القناني اللي معك بس، مو أي وحدة جبت. القناني الخمس من: "
             "١) تمسك الحشرة الهاربة لصاحب محل الدواء الخايف في السوق (جديدة في الريميك)؛ "
             "٢) تفوز في لعبة الدجاجة السوبر حقت تالون في مزرعة لون لون؛ "
             "٣) ترجّع الدجاج لحظيرته في قرية كاكاريكو؛ "
             "٤) رسالة روتو في قاع بحيرة هايليا (ضرورية للقصة)؛ "
             "٥) وأنت كبير، تجمع 500 نقطة في محل الأشباح في السوق (كل شبح بو كبير بـ 100، تصيدهم في سهل هايرول وأنت راكب إيبونا).")
BOTTLES = {"items.17": 1, "items.18": 2, "items.19": 3, "items.20": 4, "items.21": 5}

def apply(data):
    n = 0
    for group in (data["regions"], data["collections"]):
        for g in group:
            for i in g["items"]:
                if i["id"] in SRC_FIX:
                    i["src"] = SRC_FIX[i["id"]]
                if i["id"] in T:
                    i["steps"], i["steps_ar"] = T[i["id"]]
                    n += 1
                if i.get("steps_ar"):
                    i["steps_ar"] = arabize(i["steps_ar"])
                if i["id"] in BOTTLES:
                    k = BOTTLES[i["id"]]
                    i["name"], i["steps"], i["steps_ar"] = f"Bottle {k} of 5", BOTTLE_EN, BOTTLE_AR
                    i.pop("needs", None)
                    i.pop("place", None)
                    i["name_ar"] = f"القنينة {k} من 5"
                    if k == 5:
                        # Shown as the Poe Shop bottle, the one you can only get as an adult.
                        i["era"] = "Adult"
                        i["name"], i["name_ar"] = "Bottle 5 of 5 (Poe Shop)", "القنينة 5 من 5 (محل الأشباح)"
                        i["steps"] = ("As an adult, earn 500 points at the Poe Shop in Castle Town. Each Big Poe is worth 100: ride Epona "
                                      "over the purple glowing spots in Hyrule Field, shoot the Big Poe with an arrow and catch it in a bottle.")
                        i["steps_ar"] = ("وأنت كبير، جمّع 500 نقطة في محل الأشباح في السوق. كل شبح بو كبير بـ 100: اركب إيبونا فوق الأماكن "
                                         "اللي تلمع بنفسجي في سهل هايرول، اضرب شبح بو الكبير بسهم وامسكه في قنينة.")
                        i["needs"] = [{"any": ["songs.1"]}, {"any": ["items.10"]}]
                    continue
                if i["id"] in NAMES:
                    i["name_ar"] = NAMES[i["id"]]
                elif i.get("name_ar"):
                    i["name_ar"] = arabize(i["name_ar"])
    return n

if __name__ == "__main__":
    p = os.path.join(os.path.dirname(__file__), "..", "web", "data.json")
    d = json.load(open(p, encoding="utf-8"))
    print("updated", apply(d), "hints")
    left = {}
    for g in d["regions"] + d["collections"]:
        for i in g["items"]:
            for f in ("steps_ar", "name_ar"):
                for w in re.findall(r"[A-Za-z][A-Za-z'\-]*", i.get(f) or ""):
                    left[w] = left.get(w, 0) + 1
    print("English words left in Arabic:", left)
    with open(p, "w", encoding="utf-8") as f:
        json.dump(d, f, ensure_ascii=False, indent=1)
