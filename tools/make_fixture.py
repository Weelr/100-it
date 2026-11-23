"""Writes a small made-up save (tests/fixture) for the CI self-test, so the
repo doesn't need anyone's real save files. Usage: make_fixture.py"""
import io, json, os, struct, sys
sys.path.insert(0, os.path.dirname(__file__))
from mm3 import mm3
from PIL import Image, ImageDraw

ROOT = os.path.join(os.path.dirname(__file__), "..")
D = json.load(open(os.path.join(ROOT, "web", "data.json"), encoding="utf-8"))
OUT = os.path.join(ROOT, "tests", "fixture", "slot_00")
os.makedirs(OUT, exist_ok=True)
items = {i["id"]: i for r in D["regions"] for i in r["items"]}
coll = {i["name"]: i for c in D["collections"] for i in c["items"]}
K = {k: int(v, 16) for k, v in D["known"].items()}

def container(sections, data_parts):
    """sections: list of (type or None, [(hash, value)]). data_parts: list of (placeholder hash, bytes);
    an entry whose value is a placeholder name gets the offset of that data blob."""
    table = []
    for typ, entries in sections:
        if typ is not None: table.append((0, typ))
        table += entries
    data_off = 0x28 + 8 * len(table)
    blobs, offsets, pos = b"", {}, data_off
    for name, blob in data_parts:
        offsets[name] = pos; blobs += blob; pos += len(blob)
    head = struct.pack("<III", 0x01020304, 0x002D80EB, data_off) + b"\0" * (0x28 - 12)
    body = b"".join(struct.pack("<II", h, offsets[v] if isinstance(v, str) else v) for h, v in table)
    return head + body + blobs

def flag(src): return int(src["v"], 16)

# progress.sav: 3 Kakariko Skulltulas, a heart piece, a few items and songs.
gs = [i for i in D["regions"] if i["id"] == "KakarikoVillage"][0]["items"]
gs_keys = sorted(int(i["src"][0]["v"]) for i in gs if i["cat"] == "gs")[:3]
bools = [(flag(items["poh2"]["src"][0]), 1),
         (flag(coll["Boomerang"]["src"][0]), 1), (flag(coll["Fairy Ocarina"]["src"][0]), 1),
         (flag(coll["Zelda's Lullaby"]["src"][0]), 1), (flag(coll["Kokiri Sword"]["src"][0]), 1),
         (mm3("IsVisitLocation.KakarikoVillage"), 1), (mm3("IsVisitLocation.KokiriForest"), 1), (mm3("IsVisitLocation.LakeHylia"), 0)]
ints = [(K["life"], 20), (K["maxLife"], 20), (K["rupees"], 99), (K["gsCount"], 3), (K["heldPieces"], 1)]
keylist = b"".join(struct.pack("<Q", k) for k in gs_keys) + b"\0" * 8
prog = container([(None, bools), (2, ints), (32, [(K["key64List"], "keys")])], [("keys", keylist)])
open(os.path.join(OUT, "progress.sav"), "wb").write(prog)

# caption.sav: location, age, and a plain picture.
im = Image.new("RGB", (480, 270), (30, 70, 45)); d = ImageDraw.Draw(im)
d.rectangle([0, 200, 480, 270], fill=(20, 45, 30)); d.text((20, 20), "100% it test save", fill=(242, 197, 92))
buf = io.BytesIO(); im.save(buf, "JPEG", quality=70); jpg = buf.getvalue()
loc = b"KakarikoVillage".ljust(64, b"\0")
age = b"\0Child\0".ljust(32, b"\0")
cap = container([(16, [(mm3("Fixture.Location"), "loc")]), (18, [(mm3("Fixture.Image"), "img")])],
                [("loc", loc), ("age", age), ("img", struct.pack("<I", len(jpg)) + jpg)])
open(os.path.join(OUT, "caption.sav"), "wb").write(cap)
print("fixture written:", len(prog), len(cap), "bytes")
