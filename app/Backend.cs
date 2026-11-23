using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Text;
using System.Text.Json;

namespace HundredIt
{
    sealed class Reply
    {
        public int Status = 200;
        public string Type = "application/json; charset=utf-8";
        public byte[] Body;

        public static Reply Json(object o)
        {
            return new Reply { Body = JsonSerializer.SerializeToUtf8Bytes(o) };
        }
        public static Reply Error(int status, string msg)
        {
            return new Reply { Status = status, Type = "text/plain; charset=utf-8", Body = Encoding.UTF8.GetBytes(msg) };
        }
    }

    sealed class Backend
    {
        public static readonly string DataDir = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "100it");
        static readonly string SettingsPath = Path.Combine(DataDir, "settings.json");
        public static string OverrideSaveDir;

        struct Src { public bool IsKey; public ulong Key; public uint Hash; }
        sealed class Item { public string Id; public Src[] Src; }

        readonly List<Item> items = new List<Item>();
        readonly Dictionary<string, uint> visitFlags = new Dictionary<string, uint>();
        uint hLife, hMaxLife, hRupees, hGsCount, hHeldPieces, hKeyList;
        const uint hIsChildhood = 0xCEA220D3; // murmur3("Sequence_IsChildhood"): 1 = Young Link, 0 = Adult Link

        string saveDir = "";
        readonly Dictionary<string, Tuple<long, object>> cache = new Dictionary<string, Tuple<long, object>>();

        public Backend()
        {
            Directory.CreateDirectory(DataDir);
            LoadData();
            try
            {
                using (var doc = JsonDocument.Parse(File.ReadAllBytes(SettingsPath)))
                {
                    JsonElement e;
                    if (doc.RootElement.TryGetProperty("saveDir", out e)) saveDir = e.GetString() ?? "";
                    if (doc.RootElement.TryGetProperty("background", out e) && (e.ValueKind == JsonValueKind.True || e.ValueKind == JsonValueKind.False))
                        background = e.GetBoolean();
                }
            }
            catch { }
            if (OverrideSaveDir != null) { saveDir = OverrideSaveDir; return; }
            if (saveDir.Length == 0 || !IsSaveRoot(saveDir))
            {
                var found = Detect();
                if (found.Count > 0) SetSaveDirInternal(found[0]);
            }
        }

        public static byte[] Resource(string name)
        {
            using (var s = Assembly.GetExecutingAssembly().GetManifestResourceStream(name))
            {
                if (s == null) return null;
                using (var ms = new MemoryStream()) { s.CopyTo(ms); return ms.ToArray(); }
            }
        }

        static uint Hex(string s) { return uint.Parse(s, NumberStyles.HexNumber, CultureInfo.InvariantCulture); }

        void LoadData()
        {
            using (var doc = JsonDocument.Parse(Resource("web/data.json")))
            {
                var root = doc.RootElement;
                foreach (var r in root.GetProperty("regions").EnumerateArray())
                {
                    var v = r.GetProperty("visit");
                    if (v.ValueKind == JsonValueKind.String) visitFlags[r.GetProperty("id").GetString()] = Hex(v.GetString());
                    foreach (var i in r.GetProperty("items").EnumerateArray()) items.Add(ParseItem(i));
                }
                foreach (var c in root.GetProperty("collections").EnumerateArray())
                    foreach (var i in c.GetProperty("items").EnumerateArray()) items.Add(ParseItem(i));
                var k = root.GetProperty("known");
                hLife = Hex(k.GetProperty("life").GetString());
                hMaxLife = Hex(k.GetProperty("maxLife").GetString());
                hRupees = Hex(k.GetProperty("rupees").GetString());
                hGsCount = Hex(k.GetProperty("gsCount").GetString());
                hHeldPieces = Hex(k.GetProperty("heldPieces").GetString());
                hKeyList = Hex(k.GetProperty("key64List").GetString());
            }
        }

        static Item ParseItem(JsonElement i)
        {
            var srcs = new List<Src>();
            foreach (var s in i.GetProperty("src").EnumerateArray())
            {
                string t = s.GetProperty("t").GetString(), v = s.GetProperty("v").GetString();
                if (t == "k") srcs.Add(new Src { IsKey = true, Key = ulong.Parse(v, CultureInfo.InvariantCulture) });
                else srcs.Add(new Src { Hash = Hex(v) });
            }
            return new Item { Id = i.GetProperty("id").GetString(), Src = srcs.ToArray() };
        }

        // ---------- API ----------

        public Reply Handle(string path, string method, string body)
        {
            if (path == "/api/state") return Reply.Json(State());
            if (path.StartsWith("/api/thumb/", StringComparison.Ordinal)) return Thumb(path.Substring(11));
            if (path == "/api/detect") return Reply.Json(new { dirs = Detect() });
            if (path == "/api/savedir" && method == "POST")
            {
                string p = "";
                try
                {
                    using (var doc = JsonDocument.Parse(body ?? "{}"))
                    {
                        JsonElement e;
                        if (doc.RootElement.TryGetProperty("path", out e)) p = e.GetString() ?? "";
                    }
                }
                catch { }
                string resolved = SetSaveDir(p);
                return resolved == null ? Reply.Error(404, "notfound") : Reply.Json(new { path = resolved });
            }
            return Reply.Error(404, "not found");
        }

        // Returns the folder that was set, or null if no saves were found there.
        public string SetSaveDir(string picked)
        {
            string resolved = Resolve(picked);
            if (resolved == null) return null;
            SetSaveDirInternal(resolved);
            return resolved;
        }

        void SetSaveDirInternal(string dir)
        {
            saveDir = dir;
            cache.Clear();
            WriteSettings();
        }

        // Closing the window keeps the app running in the tray (so play time keeps counting).
        bool background = true;
        public bool Background
        {
            get { return background; }
            set { background = value; WriteSettings(); }
        }

        void WriteSettings()
        {
            try { File.WriteAllText(SettingsPath, JsonSerializer.Serialize(new { saveDir, background })); } catch { }
        }

        // In-game play time (seconds, menus included) of the newest save.
        const uint TotalTimeKey = 0x3F8D9D86, PlayTimeKey = 0xE573F564;
        static int PlaySeconds(SaveFile s)
        {
            uint t = s.Get(TotalTimeKey);
            return (int)(t != 0 ? t : s.Get(PlayTimeKey));
        }

        public object SavePlayTime()
        {
            int best = -1; string slot = "";
            foreach (var dir in SlotDirs(saveDir))
            {
                try
                {
                    int t = PlaySeconds(SaveFile.Read(Path.Combine(dir, "progress.sav")));
                    if (t > best) { best = t; slot = Path.GetFileName(dir); }
                }
                catch { }
            }
            return best < 0 ? (object)new { seconds = (int?)null, slot } : new { seconds = (int?)best, slot };
        }

        object State()
        {
            if (saveDir.Length == 0 || !Directory.Exists(saveDir))
                return new { saveDir, error = "nodir", slots = new object[0] };
            var slots = new List<object>();
            foreach (var dir in SlotDirs(saveDir))
            {
                try { slots.Add(Slot(dir)); }
                catch (Exception ex) { Debug.WriteLine(ex); }
            }
            if (slots.Count == 0) return new { saveDir, error = "noslots", slots };
            return new { saveDir, error = (string)null, slots };
        }

        static IEnumerable<string> SlotDirs(string root)
        {
            try
            {
                return Directory.GetDirectories(root, "slot_*")
                    .Where(d => File.Exists(Path.Combine(d, "progress.sav")))
                    .OrderBy(d => d, StringComparer.OrdinalIgnoreCase).ToList();
            }
            catch { return new string[0]; }
        }

        object Slot(string dir)
        {
            string key = Path.GetFileName(dir);
            string prog = Path.Combine(dir, "progress.sav"), cap = Path.Combine(dir, "caption.sav");
            long mod = new DateTimeOffset(File.GetLastWriteTimeUtc(prog)).ToUnixTimeMilliseconds();
            long capMod = File.Exists(cap) ? File.GetLastWriteTimeUtc(cap).Ticks : 0;
            Tuple<long, object> hit;
            if (cache.TryGetValue(key, out hit) && hit.Item1 == mod + capMod) return hit.Item2;

            var s = SaveFile.Read(prog);
            var keys = s.Keys64(hKeyList);
            var done = new List<string>();
            foreach (var it in items)
            {
                foreach (var src in it.Src)
                {
                    if (src.IsKey ? keys.Contains(src.Key) : s.Get(src.Hash) != 0) { done.Add(it.Id); break; }
                }
            }
            var visited = new Dictionary<string, bool>();
            foreach (var kv in visitFlags)
                if (s.Has(kv.Value)) visited[kv.Key] = s.Get(kv.Value) != 0;

            var c = SaveFile.ReadCaption(cap);
            object view = new
            {
                key,
                modified = mod,
                location = c.Location,
                age = s.Has(hIsChildhood) ? (s.Get(hIsChildhood) != 0 ? "Child" : "Adult") : c.Age,
                hasImage = c.Image != null,
                life = (int)s.Get(hLife),
                maxLife = (int)s.Get(hMaxLife),
                rupees = (int)s.Get(hRupees),
                gsCount = (int)s.Get(hGsCount),
                heldPieces = (int)s.Get(hHeldPieces),
                play = PlaySeconds(s),
                done,
                visited,
            };
            cache[key] = Tuple.Create(mod + capMod, view);
            return view;
        }

        Reply Thumb(string file)
        {
            string key = file.EndsWith(".jpg", StringComparison.OrdinalIgnoreCase) ? file.Substring(0, file.Length - 4) : file;
            if (!key.StartsWith("slot_", StringComparison.Ordinal) || key.IndexOfAny(new[] { '/', '\\', '.' }) >= 0)
                return Reply.Error(404, "not found");
            var c = SaveFile.ReadCaption(Path.Combine(saveDir, key, "caption.sav"));
            if (c.Image == null) return Reply.Error(404, "no image");
            return new Reply { Type = "image/jpeg", Body = c.Image };
        }

        // ---------- finding the save folder ----------

        static readonly string[] Emulators = { "eden", "lichii", "yuzu", "suyu", "sudachi", "citron", "torzu", "Ryujinx" };

        static bool IsSaveRoot(string dir)
        {
            try { return Directory.Exists(dir) && SlotDirs(dir).Any(); } catch { return false; }
        }

        static string Resolve(string picked)
        {
            if (string.IsNullOrWhiteSpace(picked)) return null;
            picked = picked.Trim().Trim('"');
            if (!Directory.Exists(picked)) return null;
            if (IsSaveRoot(picked)) return picked;
            var found = Search(picked, 7, TimeSpan.FromSeconds(4));
            return found.Count > 0 ? found[0] : null;
        }

        public static List<string> Detect()
        {
            var bases = new List<string>();
            foreach (var root in new[] {
                Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                Environment.GetFolderPath(Environment.SpecialFolder.UserProfile),
                Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments) })
            {
                if (string.IsNullOrEmpty(root)) continue;
                foreach (var e in Emulators)
                {
                    string p = Path.Combine(root, e);
                    if (Directory.Exists(p) && !bases.Contains(p, StringComparer.OrdinalIgnoreCase)) bases.Add(p);
                }
            }
            var all = new List<string>();
            foreach (var b in bases) all.AddRange(Search(b, 10, TimeSpan.FromSeconds(4)));
            return all.Distinct(StringComparer.OrdinalIgnoreCase)
                .OrderByDescending(LatestSave).ToList();
        }

        static DateTime LatestSave(string root)
        {
            try { return SlotDirs(root).Select(d => File.GetLastWriteTimeUtc(Path.Combine(d, "progress.sav"))).DefaultIfEmpty().Max(); }
            catch { return DateTime.MinValue; }
        }

        static List<string> Search(string start, int maxDepth, TimeSpan budget)
        {
            var found = new List<string>();
            var deadline = DateTime.UtcNow + budget;
            var queue = new Queue<Tuple<string, int>>();
            queue.Enqueue(Tuple.Create(start, 0));
            while (queue.Count > 0 && DateTime.UtcNow < deadline)
            {
                var cur = queue.Dequeue();
                string[] subs;
                try { subs = Directory.GetDirectories(cur.Item1); } catch { continue; }
                bool isRoot = false;
                foreach (var d in subs)
                {
                    if (Path.GetFileName(d).StartsWith("slot_", StringComparison.OrdinalIgnoreCase) && File.Exists(Path.Combine(d, "progress.sav")))
                    {
                        isRoot = true;
                        break;
                    }
                }
                if (isRoot) { found.Add(cur.Item1); continue; }
                if (cur.Item2 >= maxDepth) continue;
                foreach (var d in subs)
                {
                    string name = Path.GetFileName(d);
                    if (name.StartsWith(".", StringComparison.Ordinal) || name.Equals("cache", StringComparison.OrdinalIgnoreCase) ||
                        name.Equals("shader", StringComparison.OrdinalIgnoreCase) || name.Equals("logs", StringComparison.OrdinalIgnoreCase))
                        continue;
                    queue.Enqueue(Tuple.Create(d, cur.Item2 + 1));
                }
            }
            return found;
        }
    }
}
