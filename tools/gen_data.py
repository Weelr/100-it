"""Builds web/data.json from the MIT-licensed guide data of
dlr-developer/the-legend-of-zelda-ocarina-of-time-switch-2-save-editor
(guides/*.json + collectible_flags.json). Usage: gen_data.py <editor repo dir>"""
import json, os, re, sys
sys.path.insert(0, os.path.dirname(__file__))
from mm3 import mm3

SRC = sys.argv[1]
OUT = os.path.join(os.path.dirname(__file__), "..", "web", "data.json")
G = lambda n: json.load(open(os.path.join(SRC, "guides", n + ".json"), encoding="utf-8"))
CF = json.load(open(os.path.join(SRC, "collectible_flags.json"), encoding="utf-8"))

def h(name): return f"{mm3(name):08x}"
# An item counts once its IsGet flag is set. That flag stays on for good; the pouch
# count does not (masks go back to the shop, shields burn, bombchus run out).
def pouch(name): return [{"t": "h", "v": h(f"IsGet.{name}")}, {"t": "h", "v": h(f"PouchData.{name}.StockNum")}]

REGIONS = [  # id, english, arabic, kind, visit-flag
 ("KokiriForest","Kokiri Forest","غابة كوكيري","field","KokiriForest"),
 ("LostWoods","Lost Woods","الغابات الضائعة","field",None),
 ("SacredForestMeadow","Sacred Forest Meadow","المرج المقدس","field","SacredForestMeadow"),
 ("HyruleField","Hyrule Field","سهل هايرول","field","HyruleField"),
 ("LonLonRanch","Lon Lon Ranch","مزرعة لون لون","field","LonLonRanch"),
 ("Market","Hyrule Castle Town","سوق القلعة","field","Market"),
 ("HyruleCastle","Hyrule Castle","قلعة هايرول","field","HyruleCastle"),
 ("KakarikoVillage","Kakariko Village","قرية كاكاريكو","field","KakarikoVillage"),
 ("Graveyard","Graveyard","المقبرة","field","Graveyard"),
 ("DeathMountainTrail","Death Mountain Trail","طريق جبل الموت","field","DeathMountainTrail"),
 ("GoronCity","Goron City","مدينة الغورون","field","GoronCity"),
 ("DeathMountainCrater","Death Mountain Crater","فوهة جبل الموت","field","DeathMountainCrater"),
 ("ZoraRiver","Zora's River","نهر زورا","field","ZoraRiver"),
 ("ZoraDomain","Zora's Domain","مملكة زورا","field","ZoraDomain"),
 ("ZoraFountain","Zora's Fountain","نافورة زورا","field","ZoraFountain"),
 ("LakeHylia","Lake Hylia","بحيرة هايليا","field","LakeHylia"),
 ("GerudoValley","Gerudo Valley","وادي الجيرودو","field","GerudoValley"),
 ("GerudoFortress","Gerudo's Fortress","قلعة الجيرودو","field","GerudoFortress"),
 ("HauntedWasteland","Haunted Wasteland","الصحراء المسكونة","field",None),
 ("DesertColossus","Desert Colossus","تمثال الصحراء","field","DesertColossus"),
 ("DekuTree","Inside the Deku Tree","شجرة ديكو","dungeon","InsideTheDekuTree"),
 ("DodongosCavern","Dodongo's Cavern","كهف دودونغو","dungeon","DodongoCavern"),
 ("JabuJabu","Jabu-Jabu's Belly","بطن جابو جابو","dungeon","InsideJabuJabuBelly"),
 ("ForestTemple","Forest Temple","معبد الغابة","dungeon","ForestTemple"),
 ("FireTemple","Fire Temple","معبد النار","dungeon","FireTemple"),
 ("IceCavern","Ice Cavern","كهف الجليد","dungeon","IceCavern"),
 ("WaterTemple","Water Temple","معبد الماء","dungeon","WaterTemple"),
 ("BottomOfTheWell","Bottom of the Well","قاع البئر","dungeon","BottomOfTheWell"),
 ("ShadowTemple","Shadow Temple","معبد الظل","dungeon","ShadowTemple"),
 ("SpiritTemple","Spirit Temple","معبد الروح","dungeon","SpiritTemple"),
]
ALIAS = {
 "great deku tree":"DekuTree","hyrule field":"HyruleField","hyrule castle town":"Market","hyrule castle":"HyruleCastle",
 "ganon's castle":"HyruleCastle","lon lon ranch":"LonLonRanch","kakariko village graveyard":"Graveyard","kakariko graveyard":"Graveyard",
 "graveyard":"Graveyard","kakariko village":"KakarikoVillage","kokiri forest":"KokiriForest","lost woods":"LostWoods","sacred grove":"SacredForestMeadow",
 "death mountain trail":"DeathMountainTrail","death mountain crater":"DeathMountainCrater","death mountain":"DeathMountainTrail",
 "dodongo's cavern":"DodongosCavern","goron city":"GoronCity","zora river":"ZoraRiver","zora's river":"ZoraRiver","zora's domain":"ZoraDomain",
 "zora fountain":"ZoraFountain","zora's fountain":"ZoraFountain","lake hylia":"LakeHylia","jabu-jabu's belly":"JabuJabu","gerudo valley":"GerudoValley",
 "gerudo fortress":"GerudoFortress","gerudo's fortress":"GerudoFortress","haunted wasteland":"HauntedWasteland","desert colossus":"DesertColossus",
 "forest temple":"ForestTemple","fire temple":"FireTemple","ice cavern":"IceCavern","water temple":"WaterTemple","bottom of the well":"BottomOfTheWell",
 "shadow temple":"ShadowTemple","spirit temple":"SpiritTemple",
}
def region_for(*names):
    for n in names:
        if not n: continue
        low = n.lower().split(" (")[0].strip()
        if low in ALIAS: return ALIAS[low]
    raise SystemExit(f"no region for {names}")

# Corrections to the editor's collectible_flags.json, checked against real saves.
# Observatory dive (Lake Hylia): the editor guessed ..._TouchtheBottom_Adult, which is
# never set. ..._IsOncedTouchtheBottom_Adult is set once you win; in the user's saves
# (2026-11-18) the heart-piece total only adds up with it.
FIX = {("heart_pieces", 31): [{"t": "h", "v": h("Npc_Hylia_045_DivingChallenge_IsOncedTouchtheBottom_Adult")}]}

def sources(cat_key, n):
    if (cat_key, n) in FIX: return FIX[(cat_key, n)]
    out = []
    for s in CF[cat_key][str(n)]["sources"]:
        if s["type"] == "key64": out.append({"t": "k", "v": s["id"]})
        else: out.append({"t": "h", "v": s["hash"][2:].lower().zfill(8)})
    return out

def short(title):
    return title.split(" - ", 1)[1] if " - " in title else title

regions = {r[0]: {"id": r[0], "name": r[1], "ar": r[2], "kind": r[3],
                  "visit": h("IsVisitLocation." + r[4]) if r[4] else None,
                  "locs": sorted({r[0], r[4] or r[0]}), "items": []} for r in REGIONS}
for guide, cat in (("gold_skulltulas", "gs"), ("heart_pieces", "poh"), ("fairy_thoughts", "ft")):
    for e in G(guide)["entries"]:
        rid = region_for(e.get("area"), e.get("group"))
        if cat == "gs": rid = region_for(e.get("group"), e.get("area"))
        regions[rid]["items"].append({"id": f"{cat}{e['n']}", "cat": cat, "name": short(e["title"]),
            "era": e.get("era"), "steps": e.get("steps", ""), "src": sources(guide, e["n"])})

BOSSES = {"DekuTree": ("Gohma", "Item_Stone_Forest"), "DodongosCavern": ("King Dodongo", "Item_Stone_Fire"),
          "JabuJabu": ("Barinade", "Item_Stone_Water"), "ForestTemple": ("Phantom Ganon", "Item_Medal_Forest"),
          "FireTemple": ("Volvagia", "Item_Medal_Fire"), "WaterTemple": ("Morpha", "Item_Medal_Water"),
          "ShadowTemple": ("Bongo Bongo", "Item_Medal_Shadow"), "SpiritTemple": ("Twinrova", "Item_Medal_Spirit")}
for rid, (boss, reward) in BOSSES.items():
    era = "Child" if rid in ("DekuTree", "DodongosCavern", "JabuJabu") else "Adult"
    regions[rid]["items"].append({"id": f"hc.{rid}", "cat": "hc", "name": f"{boss} (Heart Container)", "era": era,
        "steps": f"Defeat {boss}, the boss of {regions[rid]['name']}, and take the Heart Container.", "src": pouch(reward)})

def flag(name): return [{"t": "h", "v": h(name)}]
def raw(hexv): return [{"t": "h", "v": f"{hexv:08x}"}]
P = pouch
collections = [
 {"id": "items", "ar": "الأدوات", "en": "Items", "items": [
  ("Fairy Ocarina", P("Item_Ocarina_Fairy")), ("Ocarina of Time", P("Item_Ocarina_Time")), ("Deku Sticks", P("Item_StickBag_Small")),
  ("Deku Nuts", P("Item_NutBag_Small")), ("Fairy Slingshot", P("Weapon_Range_SlingShot")), ("Bombs", P("Item_BombBag_Small")),
  ("Bombchus", flag("IsGet.Item_Bombchu") + P("Item_Bombchu")), ("Boomerang", P("Item_Boomerang")), ("Lens of Truth", P("Armor_GlassTruth")),
  ("Magic Beans", flag("ActionGuide_IsNew.MagicBean") + flag("ActionGuide_IsEnd.MagicBean") + P("Item_MagicBean")),
  ("Fairy Bow", P("Weapon_Range_Bow")), ("Hookshot", P("Item_Hookshot")), ("Longshot", P("Item_Longshot")), ("Megaton Hammer", P("Item_Hammer")),
  ("Fire Arrows", P("Item_Arrow_Fire")), ("Ice Arrows", P("Item_Arrow_Ice")), ("Light Arrows", P("Item_Arrow_Light")),
  ("Bottle 1", P("BottleA")), ("Bottle 2", P("BottleB")), ("Bottle 3", P("BottleC")), ("Bottle 4", P("BottleD")), ("Bottle 5", P("BottleE"))]},
 {"id": "equip", "ar": "الأسلحة والملابس", "en": "Weapons & clothes", "items": [
  ("Kokiri Sword", P("Weapon_Sword_Kokiri")), ("Master Sword", P("Weapon_Sword_Master")), ("Biggoron's Sword", P("Weapon_Sword_Biggoron") + P("Weapon_Sword_Giant")),
  ("Deku Shield", P("Weapon_Shield_Deku")), ("Hylian Shield", P("Weapon_Shield_Hylian")), ("Mirror Shield", P("Weapon_Shield_Mirror")),
  ("Goron Tunic", P("Armor_Adult_Goron")), ("Zora Tunic", P("Armor_Adult_Zora")), ("Iron Boots", P("Armor_Adult_HeavyBoot")), ("Hover Boots", P("Armor_Adult_HoverBoot"))]},
 {"id": "upgrades", "ar": "الترقيات", "en": "Upgrades", "items": [
  ("Goron's Bracelet", P("Armor_Child_Gauntlet_Goron")), ("Silver Gauntlets", P("Armor_Adult_Gauntlet_Silver")), ("Golden Gauntlets", P("Armor_Adult_Gauntlet_Gold")),
  ("Silver Scale", P("Item_Scale_Silver")), ("Golden Scale", P("Item_Scale_Gold")), ("Adult's Wallet", P("Item_Wallet_Medium")), ("Giant's Wallet", P("Item_Wallet_Large")),
  ("Big Quiver", P("Item_Quiver_Medium")), ("Biggest Quiver", P("Item_Quiver_Large")), ("Big Bomb Bag", P("Item_BombBag_Medium")), ("Biggest Bomb Bag", P("Item_BombBag_Large")),
  ("Big Bullet Bag", P("Item_BulletBag_Medium")), ("Biggest Bullet Bag", P("Item_BulletBag_Large")), ("Deku Nut upgrade 1", P("Item_NutBag_Medium")), ("Deku Nut upgrade 2", P("Item_NutBag_Large")),
  ("Deku Stick upgrade 1", P("Item_StickBag_Medium")), ("Deku Stick upgrade 2", P("Item_StickBag_Large")), ("Echo Gem", P("Item_AgonyStone")), ("Gerudo's Card", P("Item_Token_Gerudo"))]},
 {"id": "fairies", "ar": "الجنيات العظيمة", "en": "Great Fairies", "items": [
  ("Din's Fire", P("Item_DinFire")), ("Farore's Wind", P("Item_FaroreWind")), ("Nayru's Love", P("Item_NayruLove")),
  ("Magic", P("Item_FairyBless_MP")), ("Double Magic", P("Item_FairyBless_MPDouble")), ("Double Defense", P("Item_FairyBless_DefenseDouble"))]},
 {"id": "masks", "ar": "الأقنعة", "en": "Masks", "items": [
  ("Keaton Mask", P("Armor_Child_Mask_Keaton")), ("Skull Mask", P("Armor_Child_Mask_Skull")), ("Spooky Mask", P("Armor_Child_Mask_Spooky")),
  ("Bunny Hood", P("Armor_Child_Mask_Bunny")), ("Mask of Truth", P("Armor_Child_Mask_Truth")), ("Goron Mask", P("Armor_Child_Mask_Goron")),
  ("Zora Mask", P("Armor_Child_Mask_Zora")), ("Gerudo Mask", P("Armor_Child_Mask_Gerudo"))]},
 {"id": "songs", "ar": "الأغاني", "en": "Songs", "items": [
  ("Zelda's Lullaby", raw(0x01C20002)), ("Epona's Song", raw(0xB492AC33)), ("Saria's Song", raw(0xD3F8BFCC)), ("Song of Time", raw(0x03B3450E)),
  ("Sun's Song", raw(0x165DD1AD)), ("Song of Storms", raw(0x2B39DD4F)), ("Minuet of Forest", raw(0xDC0A0B54)), ("Bolero of Fire", raw(0x49041AB9)),
  ("Serenade of Water", raw(0x3FA63986)), ("Requiem of Spirit", raw(0x802A36A8)), ("Nocturne of Shadow", raw(0xC2FB95F4)), ("Prelude of Light", raw(0xD6320BA4)),
  ("Scarecrow's Song", flag("IsGet.Item_Melody_ScarecrowSong"))]},
 {"id": "quest", "ar": "الأحجار والميداليات", "en": "Stones & medallions", "items": [
  ("Kokiri's Emerald", P("Item_Stone_Forest")), ("Goron's Ruby", P("Item_Stone_Fire")), ("Zora's Sapphire", P("Item_Stone_Water")),
  ("Light Medallion", P("Item_Medal_Light")), ("Forest Medallion", P("Item_Medal_Forest")), ("Fire Medallion", P("Item_Medal_Fire")),
  ("Water Medallion", P("Item_Medal_Water")), ("Shadow Medallion", P("Item_Medal_Shadow")), ("Spirit Medallion", P("Item_Medal_Spirit"))]},
]
CHILD = {"Magic Beans", "Fairy Ocarina", "Deku Sticks", "Fairy Slingshot", "Boomerang", "Kokiri Sword", "Deku Shield", "Goron's Bracelet",
         "Big Bullet Bag", "Biggest Bullet Bag", "Deku Stick upgrade 1", "Deku Stick upgrade 2", "Keaton Mask", "Skull Mask",
         "Spooky Mask", "Bunny Hood", "Mask of Truth", "Goron Mask", "Zora Mask", "Gerudo Mask", "Kokiri's Emerald", "Goron's Ruby", "Zora's Sapphire"}
ADULT = {"Fairy Bow", "Hookshot", "Longshot", "Megaton Hammer", "Fire Arrows", "Ice Arrows", "Light Arrows", "Master Sword",
         "Biggoron's Sword", "Mirror Shield", "Goron Tunic", "Zora Tunic", "Iron Boots", "Hover Boots", "Silver Gauntlets",
         "Golden Gauntlets", "Big Quiver", "Biggest Quiver", "Forest Medallion", "Fire Medallion", "Water Medallion",
         "Shadow Medallion", "Spirit Medallion", "Gerudo's Card", "Nayru's Love", "Double Defense", "Scarecrow's Song",
         "Bolero of Fire", "Serenade of Water", "Requiem of Spirit", "Nocturne of Shadow",
         "Minuet of Forest", "Prelude of Light", "Song of Storms"}
# Where each item / song / upgrade is obtained (from the editor's items, songs and
# great_fairies guides). Bottles are left out on purpose: the save numbers them in
# the order you find them, not by place. Stones and medallions are left out too:
# the dungeon's heart container already counts that clear.
PLACE = {
 "Fairy Ocarina": "KokiriForest", "Ocarina of Time": "HyruleField", "Deku Sticks": "KokiriForest", "Deku Nuts": "KokiriForest",
 "Fairy Slingshot": "DekuTree", "Bombs": "DodongosCavern", "Bombchus": "Market", "Boomerang": "JabuJabu",
 "Lens of Truth": "BottomOfTheWell", "Magic Beans": "ZoraRiver", "Fairy Bow": "ForestTemple", "Hookshot": "Graveyard",
 "Longshot": "WaterTemple", "Megaton Hammer": "FireTemple", "Fire Arrows": "LakeHylia", "Ice Arrows": "GerudoFortress",
 "Light Arrows": "Market",
 "Kokiri Sword": "KokiriForest", "Master Sword": "Market", "Biggoron's Sword": "DeathMountainTrail", "Deku Shield": "KokiriForest",
 "Hylian Shield": "Graveyard", "Mirror Shield": "SpiritTemple", "Goron Tunic": "GoronCity", "Zora Tunic": "ZoraDomain",
 "Iron Boots": "IceCavern", "Hover Boots": "ShadowTemple",
 "Goron's Bracelet": "GoronCity", "Silver Gauntlets": "SpiritTemple", "Golden Gauntlets": "HyruleCastle", "Silver Scale": "ZoraDomain",
 "Golden Scale": "LakeHylia", "Adult's Wallet": "KakarikoVillage", "Giant's Wallet": "KakarikoVillage", "Big Quiver": "KakarikoVillage",
 "Biggest Quiver": "GerudoFortress", "Big Bomb Bag": "GoronCity", "Biggest Bomb Bag": "Market", "Big Bullet Bag": "Market",
 "Biggest Bullet Bag": "LostWoods", "Deku Nut upgrade 1": "LostWoods", "Deku Nut upgrade 2": "LostWoods",
 "Deku Stick upgrade 1": "LostWoods", "Deku Stick upgrade 2": "LostWoods", "Echo Gem": "KakarikoVillage", "Gerudo's Card": "GerudoFortress",
 "Din's Fire": "DeathMountainTrail", "Farore's Wind": "ZoraFountain", "Nayru's Love": "DesertColossus", "Magic": "HyruleCastle",
 "Double Magic": "DeathMountainCrater", "Double Defense": "HyruleCastle",
 "Keaton Mask": "Market", "Skull Mask": "Market", "Spooky Mask": "Market", "Bunny Hood": "Market", "Mask of Truth": "Market",
 "Goron Mask": "Market", "Zora Mask": "Market", "Gerudo Mask": "Market",
 "Zelda's Lullaby": "HyruleCastle", "Epona's Song": "LonLonRanch", "Saria's Song": "SacredForestMeadow", "Song of Time": "HyruleField",
 "Sun's Song": "Graveyard", "Song of Storms": "KakarikoVillage", "Minuet of Forest": "SacredForestMeadow", "Bolero of Fire": "DeathMountainCrater",
 "Serenade of Water": "IceCavern", "Requiem of Spirit": "DesertColossus", "Nocturne of Shadow": "KakarikoVillage", "Prelude of Light": "Market",
 "Scarecrow's Song": "LakeHylia",
}
def era_of(n): return "Child" if n in CHILD else "Adult" if n in ADULT else "Either"
for c in collections:
    c["items"] = [{"id": f"{c['id']}.{i}", "name": n, "era": era_of(n), **({"place": PLACE[n]} if n in PLACE else {}), "src": s}
                  for i, (n, s) in enumerate(c["items"])]
# "How to get it" text for items, from the editor's guides.
GUIDE_STEPS = {}
for g in ("items", "songs", "great_fairies", "bottles"):
    for e in G(g)["entries"]:
        st = e.get("steps", "") + ((" " + e["note"]) if e.get("note") else "")
        st = re.sub(r"\s*(Check in remake:.*|See the How-To Guides entry[^.]*\.)", "", st).strip()
        GUIDE_STEPS[e["title"]] = st
ALIAS_STEPS = {
 "Deku Sticks": "Deku Stick", "Deku Nuts": "Deku Nut", "Bombchus": "Bombchu", "Fire Arrows": "Fire Arrow", "Ice Arrows": "Ice Arrow",
 "Light Arrows": "Light Arrow", "Biggoron's Sword": "Biggoron Sword", "Goron's Bracelet": "Goron Bracelet", "Big Quiver": "Bigger Quiver",
 "Big Bomb Bag": "Bigger Bomb Bag", "Big Bullet Bag": "Bigger Deku Seed Bag", "Biggest Bullet Bag": "Biggest Deku Seed Bag",
 "Deku Nut upgrade 1": "Bigger Deku Nut Bag", "Deku Nut upgrade 2": "Biggest Deku Nut Bag", "Deku Stick upgrade 1": "Bigger Deku Stick Bag",
 "Deku Stick upgrade 2": "Biggest Deku Stick Bag", "Gerudo's Card": "Gerudo Pass", "Magic": "Gift of Improved Spin",
 "Double Magic": "Gift of Doubled Magic", "Double Defense": "Gift of Halved Damage", "Kokiri's Emerald": "Kokiri Emerald",
 "Goron's Ruby": "Goron Ruby", "Zora's Sapphire": "Zora Sapphire", "Minuet of Forest": "Minuet of the Forest - Sacred Grove",
 "Bottle 1": "Empty Bottle #1", "Bottle 2": "Empty Bottle #2", "Bottle 3": "Empty Bottle #3", "Bottle 4": "Empty Bottle #4 (Ruto's Letter)",
 "Bottle 5": "Empty Bottle #5",
}
MASK_STEPS = "Masks come from the Happy Mask Shop in Castle Town (after you show Zelda's Letter to the Kakariko gate guard). Borrow a mask, sell it to the right customer, then pay the shop back to unlock the next one."
def steps_for(n):
    key = ALIAS_STEPS.get(n, n)
    if key in GUIDE_STEPS: return GUIDE_STEPS[key]
    for t, st in GUIDE_STEPS.items():
        if t.startswith(key + " - ") or t.startswith(key + " ("): return st
    if "Mask" in n or n == "Bunny Hood": return MASK_STEPS
    return ""
STEP_FIX = {  # corrections to the source guides
 "Biggest Bomb Bag": "Bombchu Bowling in Castle Town, as young Link. The prize changes between rounds: check the prize on display before paying and play when it's the Bomb Bag. It can only be won once; if you already have the Big Bomb Bag it becomes the Biggest.",
}
for c in collections:
    for i in c["items"]:
        st = STEP_FIX.get(i["name"]) or steps_for(i["name"])
        if st: i["steps"] = st
# What each entry needs, from the guides' "requires" lists. Each need becomes the
# collection items that satisfy it (any one of them), or a Skulltula token count.
# Needs we can't read from the save (rupees, Cucco, "met Zelda"...) are left out.
NEED = {
 "Bombs": ["Bombs", "Bombchus"], "Bombchu": ["Bombchus"], "Hookshot": ["Hookshot"], "Hookshot (adult)": ["Hookshot"], "Longshot": ["Longshot"],
 "Boomerang": ["Boomerang"], "Lens of Truth": ["Lens of Truth"], "Fairy Bow": ["Fairy Bow"], "Fire Arrows": ["Fire Arrows"],
 "Iron Boots": ["Iron Boots"], "Hover Boots": ["Hover Boots"], "Megaton Hammer": ["Megaton Hammer"], "Zora Tunic": ["Zora Tunic"],
 "Slingshot": ["Fairy Slingshot"], "Fairy Slingshot": ["Fairy Slingshot"], "Deku Stick": ["Deku Sticks"],
 "Silver Gauntlets": ["Silver Gauntlets"], "Golden Gauntlets": ["Golden Gauntlets"], "Goron Bracelet": ["Goron's Bracelet"],
 "Goron Bracelet or Bombs": ["Goron's Bracelet", "Bombs", "Bombchus"], "Silver Scale": ["Silver Scale"], "Golden Scale": ["Golden Scale"],
 "Magic Beans": ["Magic Beans"], "Magic Bean": ["Magic Beans"], "Magic Bean planted as a child": ["Magic Beans"],
 "Gerudo Pass": ["Gerudo's Card"], "Gerudo membership": ["Gerudo's Card"], "Skull Mask": ["Skull Mask"], "Mask of Truth": ["Mask of Truth"],
 "Fairy Ocarina": ["Fairy Ocarina", "Ocarina of Time"], "Ocarina": ["Fairy Ocarina", "Ocarina of Time"],
 "Song of Storms": ["Song of Storms"], "Scarecrow's Song": ["Scarecrow's Song"], "Zelda's Lullaby": ["Zelda's Lullaby"],
 "Sun's Song": ["Sun's Song"], "Saria's Song": ["Saria's Song"], "Song of Time": ["Song of Time"], "Bolero of Fire": ["Bolero of Fire"],
 "Epona's Song": ["Epona's Song"], "Epona": ["Epona's Song"], "Longshot or Epona": ["Longshot", "Epona's Song"], "Requiem of Spirit": ["Requiem of Spirit"],
 "Bugs in a Bottle": ["Bottle 1"], "Blue Fire": ["Bottle 1"],
 "Forest Temple cleared": ["Forest Medallion"], "Forest Temple completed": ["Forest Medallion"], "Water Temple cleared": ["Water Medallion"],
 "Water Temple completed": ["Water Medallion"], "Dodongo's Cavern cleared": ["Goron's Ruby"],
}
ALL_OF = {"3 Spiritual Stones": ["Kokiri's Emerald", "Goron's Ruby", "Zora's Sapphire"],
          "All three Spiritual Stones": ["Kokiri's Emerald", "Goron's Ruby", "Zora's Sapphire"],
          "All six medallions": ["Forest Medallion", "Fire Medallion", "Water Medallion", "Shadow Medallion", "Spirit Medallion", "Light Medallion"]}
ID_OF = {i["name"]: i["id"] for c in collections for i in c["items"]}
def needs(reqs):
    out, night = [], False
    for r in reqs or []:
        r = str(r)
        if r == "Night time": night = True
        elif r in NEED: out.append({"any": [ID_OF[n] for n in NEED[r]]})
        elif r in ALL_OF: out += [{"any": [ID_OF[n]]} for n in ALL_OF[r]]
        elif re.fullmatch(r"(\d+) Gold Skulltula Tokens", r): out.append({"gs": int(r.split()[0])})
    return out, night
GUIDE_REQ = {}
for g in ("items", "songs", "great_fairies", "bottles"):
    for e in G(g)["entries"]: GUIDE_REQ[e["title"]] = e.get("requires") or []
def req_for(n):
    key = ALIAS_STEPS.get(n, n)
    if key in GUIDE_REQ: return GUIDE_REQ[key]
    for t, r in GUIDE_REQ.items():
        if t.startswith(key + " - ") or t.startswith(key + " ("): return r
    return []
for c in collections:
    for i in c["items"]:
        nd, nt = needs(req_for(i["name"]))
        nd = [x for x in nd if i["id"] not in x.get("any", [])]  # an item doesn't need itself
        if nd: i["needs"] = nd
        if nt: i["night"] = True
REQ_OF = {}
for guide, cat in (("gold_skulltulas", "gs"), ("heart_pieces", "poh"), ("fairy_thoughts", "ft")):
    for e in G(guide)["entries"]: REQ_OF[f"{cat}{e['n']}"] = e.get("requires") or []
for r in regions.values():
    for i in r["items"]:
        nd, nt = needs(REQ_OF.get(i["id"]))
        if nd: i["needs"] = nd
        if nt: i["night"] = True
missing = [i["name"] for c in collections for i in c["items"] if not i.get("steps")]
print("no steps:", missing)
assert all(v in regions for v in PLACE.values())
named = {i["name"] for c in collections for i in c["items"]}
assert set(PLACE) <= named, set(PLACE) - named

out = {"regions": list(regions.values()), "collections": collections,
       "known": {"life": h("PlayerStatus.Life"), "maxLife": h("PlayerStatus.MaxLife"), "rupees": h("PlayerStatus.CurrentRupee"),
                 "gsCount": h("PouchData.Item_Token_Gold.StockNum"), "heldPieces": h("PouchData.Obj_Heart_Piece.StockNum"),
                 "key64List": "a3db7114"}}
# Arabic names and hints (tools/i18n/*.py), keyed by item id.
AR = {}
for f in sorted(os.listdir(os.path.join(os.path.dirname(__file__), "i18n"))):
    if f.startswith("ar_") and f.endswith(".py") and f != "ar_terms.py":  # hints_landmarks / ar_terms: apply_hints
        ns = {}
        exec(open(os.path.join(os.path.dirname(__file__), "i18n", f), encoding="utf-8").read(), ns)
        AR.update(ns["T"])
all_items = [i for r in out["regions"] for i in r["items"]] + [i for c in out["collections"] for i in c["items"]]
for i in all_items:
    name, steps = AR.get(i["id"], (None, None))
    if name: i["name_ar"] = name
    if steps: i["steps_ar"] = steps
missing = [i["id"] for i in all_items if i.get("steps") and not i.get("steps_ar")]
assert not missing, missing
counts = {}
for r in out["regions"]:
    for i in r["items"]: counts[i["cat"]] = counts.get(i["cat"], 0) + 1
assert counts == {"gs": 100, "poh": 36, "ft": 23, "hc": 8}, counts
# Hints that point at landmarks instead of north/south/east/west.
sys.path.insert(0, os.path.dirname(__file__))
from apply_hints import apply as apply_hints
apply_hints(out)
json.dump(out, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(counts, sum(len(c["items"]) for c in collections))
