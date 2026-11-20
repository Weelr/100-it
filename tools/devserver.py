"""Preview the UI in a normal browser with the same API as the Windows app.
Usage: devserver.py <save folder> [port]"""
import http.server, json, os, struct, sys, glob
ROOT = os.path.join(os.path.dirname(__file__), "..", "web")
SAVE = sys.argv[1]
D = json.load(open(os.path.join(ROOT, "data.json"), encoding="utf-8"))
K = {k: int(v, 16) for k, v in D["known"].items()}
ITEMS = [i for r in D["regions"] for i in r["items"]] + [i for c in D["collections"] for i in c["items"]]

def parse(p):
    d = open(p, "rb").read(); off = min(struct.unpack_from("<I", d, 8)[0], len(d)); e = {}; sec = -1
    for o in range(0x28, off - 7, 8):
        h, v = struct.unpack_from("<II", d, o)
        if h == 0: sec = v; continue
        e[h] = (sec, v)
    return d, e

def caption(p):
    out = {"location": "", "age": "", "img": None}
    if not os.path.exists(p): return out
    d, e = parse(p)
    for t, v in e.values():
        if t == 16:
            s = d[v:d.index(b"\0", v)].decode()
            if s and "/" not in s: out["location"] = s
            elif s.endswith("_Adult"): out["age"] = "Adult"
            elif s.endswith("_Child"): out["age"] = "Child"
        if t == 18:
            n = struct.unpack_from("<I", d, v)[0]; out["img"] = d[v + 4:v + 4 + n]
    if not out["age"]: out["age"] = "Adult" if b"\0Adult\0" in d else "Child" if b"\0Child\0" in d else ""
    return out

def slot(dirp):
    d, e = parse(os.path.join(dirp, "progress.sav"))
    get = lambda h: e.get(h, (0, 0))[1]
    ks = set(); o = get(K["key64List"])
    while o and o + 8 <= len(d):
        v = struct.unpack_from("<Q", d, o)[0]
        if not v: break
        ks.add(v); o += 8
    done = [i["id"] for i in ITEMS if any((s["t"] == "k" and int(s["v"]) in ks) or (s["t"] == "h" and get(int(s["v"], 16))) for s in i["src"])]
    vis = {r["id"]: bool(get(int(r["visit"], 16))) for r in D["regions"] if r["visit"] and int(r["visit"], 16) in e}
    c = caption(os.path.join(dirp, "caption.sav"))
    sgn = lambda v: v - (1 << 32) if v >= 1 << 31 else v
    return {"key": os.path.basename(dirp), "modified": int(os.path.getmtime(os.path.join(dirp, "progress.sav")) * 1000),
            "location": c["location"], "age": ("Child" if get(0xCEA220D3) else "Adult") if 0xCEA220D3 in e else c["age"], "hasImage": c["img"] is not None,
            "life": sgn(get(K["life"])), "maxLife": sgn(get(K["maxLife"])), "rupees": sgn(get(K["rupees"])),
            "gsCount": sgn(get(K["gsCount"])), "heldPieces": sgn(get(K["heldPieces"])), "play": get(0x3F8D9D86) or get(0xE573F564),
            "done": done, "visited": vis}

# Sample data for the hours tab (the real app counts it from running programs).
HOURS = {"hours": {"games": [
    {"id": "g1", "name": "Zelda Ocarina of Time", "exe": "eden.exe", "title": "Ocarina", "total": 92340, "today": 5400,
     "week": [3600, 0, 7200, 1800, 0, 9000, 5400], "sessions": 23, "last": "2026-11-16T05:40", "logo": False, "logoV": 0, "playing": True},
    {"id": "g2", "name": "Mario Kart", "exe": "eden.exe", "title": "Mario Kart", "total": 15000, "today": 0,
     "week": [0, 1200, 0, 0, 0, 0, 0], "sessions": 6, "last": "2026-11-12T21:10", "logo": False, "logoV": 0, "playing": False}],
    "imported": True}, "background": True, "startup": False, "oldStartup": True}

# Phone settings (the real app keeps a gist up to date; here it's pretend).
PHONE = {"on": False, "url": None, "user": "", "lastOk": 0, "error": None}

class H(http.server.SimpleHTTPRequestHandler):
    def __init__(s, *a, **k): super().__init__(*a, directory=ROOT, **k)
    def log_message(s, *a): pass
    def send(s, body, typ="application/json"):
        s.send_response(200); s.send_header("Content-Type", typ); s.send_header("Cache-Control", "no-store"); s.end_headers(); s.wfile.write(body)
    def do_GET(s):
        p = s.path.split("?")[0]
        if p == "/api/state":
            dirs = sorted(x for x in glob.glob(os.path.join(SAVE, "slot_*")) if os.path.exists(os.path.join(x, "progress.sav")))
            return s.send(json.dumps({"saveDir": SAVE, "error": None, "slots": [slot(x) for x in dirs]}).encode())
        if p.startswith("/api/thumb/"):
            return s.send(caption(os.path.join(SAVE, p[11:-4], "caption.sav"))["img"], "image/jpeg")
        if p in ("/api/detect", "/api/browse"): return s.send(b"{}")
        if p == "/api/hours": return s.send(json.dumps(HOURS).encode())
        if p == "/api/windows": return s.send(json.dumps([{"exe": "eden.exe", "title": "Eden | The Legend of Zelda: Ocarina of Time"}, {"exe": "chrome.exe", "title": "YouTube"}]).encode())
        if p == "/api/update": return s.send(b'{"current":"2.1.30","status":"latest"}')
        if p == "/api/hours/fromsave": return s.send(b'{"seconds":90000,"slot":"slot_00"}')
        if p == "/api/remote": return s.send(json.dumps(PHONE).encode())
        return super().do_GET()
    def do_POST(s):
        p = s.path.split("?")[0]
        if p == "/api/prefs": return s.send(json.dumps(HOURS).encode())
        if p == "/api/hours/save": return s.send(b'{"id":"g1"}')
        if p == "/api/remote/setup":
            import time
            PHONE.update(on=True, url="https://weelr.github.io/100-it/?g=0123456789abcdef0123456789abcdef", user="Weelr", lastOk=int(time.time() * 1000) - 60000)
            return s.send(json.dumps({"error": None, "remote": PHONE}).encode())
        if p == "/api/remote/off": PHONE["on"] = False; return s.send(json.dumps(PHONE).encode())
        if p == "/api/remote/extra": return s.send(b'{"ok":true}')
        s.send(json.dumps({"path": SAVE, "ok": True}).encode())

http.server.ThreadingHTTPServer(("127.0.0.1", int(sys.argv[2]) if len(sys.argv) > 2 else 47110), H).serve_forever()
