"""Evaluate data.json against a progress.sav (reference for the C# reader)."""
import json, struct, sys, os
D = json.load(open(os.path.join(os.path.dirname(__file__), "..", "web", "data.json"), encoding="utf-8"))
def load(p):
    d = open(p, "rb").read(); off = struct.unpack_from("<I", d, 8)[0]; e = {}
    for o in range(0x28, off, 8):
        h, v = struct.unpack_from("<II", d, o)
        if h: e[h] = v
    ks = set(); o = e.get(0xa3db7114, 0)
    while o and o + 8 <= len(d):
        v = struct.unpack_from("<Q", d, o)[0]
        if not v: break
        ks.add(v); o += 8
    return e, ks
def on(src, e, ks):
    for s in src:
        if s["t"] == "k" and int(s["v"]) in ks: return True
        if s["t"] == "h" and e.get(int(s["v"], 16), 0) not in (0,): return True
    return False
e, ks = load(sys.argv[1]); K = D["known"]
print({k: e.get(int(v, 16)) for k, v in K.items() if k != "key64List"})
cnt = {}
for r in D["regions"]:
    got = [i for i in r["items"] if on(i["src"], e, ks)]
    for i in got: cnt[i["cat"]] = cnt.get(i["cat"], 0) + 1
    vis = e.get(int(r["visit"], 16)) if r["visit"] else None
    print(f"{r['id']:20} visit={vis} {len(got)}/{len(r['items'])}", " ".join(i["id"] for i in got))
print(cnt)
for c in D["collections"]:
    print(c["id"], [i["name"] for i in c["items"] if on(i["src"], e, ks)])
