using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.IO;
using System.Linq;
using System.Runtime.InteropServices;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Threading;

namespace HundredIt
{
    // GameHours, built in: watches running programs / window titles every 5 s
    // and adds the time to each game you set up. Data: %APPDATA%\100it\hours.json.
    sealed class PlayTracker
    {
        static readonly string FilePath = Path.Combine(Backend.DataDir, "hours.json");
        public static readonly string LogoDir = Path.Combine(Backend.DataDir, "logos");
        static readonly string OldGameHours = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "GameHours", "data.json");

        readonly object gate = new object();
        JsonObject data;
        readonly HashSet<string> active = new HashSet<string>();
        DateTime last = DateTime.UtcNow;
        int ticks;
        Timer timer;

        public event Action<string> Started; // game name, when a game starts being played

        public bool AnyActive { get { lock (gate) return active.Count > 0; } }

        public PlayTracker()
        {
            Directory.CreateDirectory(Backend.DataDir);
            data = Load(FilePath);
            if (data == null)
            {
                // First run: bring over everything from the old GameHours app.
                data = Load(OldGameHours) ?? new JsonObject();
                if (data["games"] is JsonArray old)
                    foreach (var g in old.OfType<JsonObject>()) CopyOldLogo(g);
                data["importedFromGameHours"] = File.Exists(OldGameHours);
            }
            if (!(data["games"] is JsonArray)) data["games"] = new JsonArray();
            foreach (var g in Games)
            {
                if (g["daily"] == null) g["daily"] = new JsonObject();
                if (g["sessions"] == null) g["sessions"] = 0;
                if (g["total"] == null) g["total"] = 0.0;
            }
            Save();
        }

        IEnumerable<JsonObject> Games { get { return ((JsonArray)data["games"]).OfType<JsonObject>(); } }

        static JsonObject Load(string path)
        {
            try { return JsonNode.Parse(File.ReadAllText(path)) as JsonObject; } catch { return null; }
        }

        static void CopyOldLogo(JsonObject g)
        {
            try
            {
                string p = (string)g["logo"];
                if (string.IsNullOrEmpty(p) || !File.Exists(p)) return;
                Directory.CreateDirectory(LogoDir);
                string dst = Path.Combine(LogoDir, Path.GetFileName(p));
                File.Copy(p, dst, true);
                g["logo"] = dst;
            }
            catch { }
        }

        public void Start()
        {
            timer = new Timer(_ => Tick(), null, 1000, 5000);
        }

        public void Save()
        {
            lock (gate)
            {
                try
                {
                    string tmp = FilePath + ".tmp";
                    File.WriteAllText(tmp, data.ToJsonString(new JsonSerializerOptions { WriteIndented = true }));
                    File.Move(tmp, FilePath, true);
                }
                catch { }
            }
        }

        // ---------- counting ----------

        void Tick()
        {
            List<string> startedNow = new List<string>();
            try
            {
                var procs = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
                foreach (var p in Process.GetProcesses())
                {
                    try { procs.Add(p.ProcessName + ".exe"); } catch { }
                    p.Dispose();
                }
                var wins = Windows();
                lock (gate)
                {
                    var now = DateTime.UtcNow;
                    double delta = Math.Min((now - last).TotalSeconds, 30); // don't count sleep
                    last = now;
                    string today = DateTime.Now.ToString("yyyy-MM-dd");
                    string stamp = DateTime.Now.ToString("yyyy-MM-ddTHH:mm");
                    bool changed = false;
                    foreach (var g in Games)
                    {
                        string id = (string)g["id"];
                        bool run = IsRunning(g, procs, wins);
                        if (run && active.Contains(id))
                        {
                            g["total"] = (double)g["total"] + delta;
                            var daily = (JsonObject)g["daily"];
                            daily[today] = (daily[today] != null ? (double)daily[today] : 0) + delta;
                            g["last_played"] = stamp;
                        }
                        else if (run)
                        {
                            active.Add(id);
                            g["sessions"] = (int)g["sessions"] + 1;
                            g["last_played"] = stamp;
                            startedNow.Add((string)g["name"]);
                            changed = true;
                        }
                        else if (active.Remove(id)) changed = true;
                    }
                    if (changed || ++ticks % 6 == 0) Save();
                }
            }
            catch (Exception ex) { Debug.WriteLine(ex); }
            foreach (var n in startedNow) Started?.Invoke(n);
        }

        static bool IsRunning(JsonObject g, HashSet<string> procs, List<Tuple<string, string>> wins)
        {
            string exe = ((string)g["exe"] ?? "").Trim().ToLowerInvariant();
            string kw = ((string)g["title"] ?? "").Trim().ToLowerInvariant();
            if (kw.Length == 0) return exe.Length > 0 && procs.Contains(exe);
            foreach (var w in wins)
                if ((exe.Length == 0 || w.Item1 == exe) && w.Item2.ToLowerInvariant().Contains(kw)) return true;
            return false;
        }

        // ---------- open windows ----------

        delegate bool EnumProc(IntPtr h, IntPtr l);
        [DllImport("user32.dll")] static extern bool EnumWindows(EnumProc cb, IntPtr l);
        [DllImport("user32.dll")] static extern bool IsWindowVisible(IntPtr h);
        [DllImport("user32.dll", CharSet = CharSet.Unicode)] static extern int GetWindowText(IntPtr h, StringBuilder s, int n);
        [DllImport("user32.dll")] static extern int GetWindowTextLength(IntPtr h);
        [DllImport("user32.dll")] static extern uint GetWindowThreadProcessId(IntPtr h, out uint pid);

        // (exe name lowercase, window title) for every visible titled window.
        public static List<Tuple<string, string>> Windows()
        {
            var names = new Dictionary<uint, string>();
            foreach (var p in Process.GetProcesses())
            {
                try { names[(uint)p.Id] = (p.ProcessName + ".exe").ToLowerInvariant(); } catch { }
                p.Dispose();
            }
            var list = new List<Tuple<string, string>>();
            EnumWindows((h, l) =>
            {
                if (!IsWindowVisible(h)) return true;
                int n = GetWindowTextLength(h);
                if (n <= 0) return true;
                var sb = new StringBuilder(n + 1);
                GetWindowText(h, sb, n + 1);
                uint pid;
                GetWindowThreadProcessId(h, out pid);
                string exe;
                names.TryGetValue(pid, out exe);
                list.Add(Tuple.Create(exe ?? "", sb.ToString()));
                return true;
            }, IntPtr.Zero);
            return list;
        }

        // ---------- API ----------

        public object View()
        {
            lock (gate)
            {
                string today = DateTime.Now.ToString("yyyy-MM-dd");
                var games = Games.Select(g => new
                {
                    id = (string)g["id"],
                    name = (string)g["name"] ?? "",
                    exe = (string)g["exe"] ?? "",
                    title = (string)g["title"] ?? "",
                    total = (double)g["total"],
                    today = g["daily"]?[today] != null ? (double)g["daily"][today] : 0,
                    week = Week(g),
                    sessions = (int)g["sessions"],
                    last = (string)g["last_played"] ?? "",
                    logo = !string.IsNullOrEmpty((string)g["logo"]) && File.Exists((string)g["logo"]),
                    logoV = LogoVersion(g),
                    playing = active.Contains((string)g["id"]),
                }).ToList();
                return new { games, imported = data["importedFromGameHours"] != null && (bool)data["importedFromGameHours"] };
            }
        }

        static double[] Week(JsonObject g)
        {
            var d = new double[7];
            var daily = g["daily"] as JsonObject;
            for (int i = 0; i < 7; i++)
            {
                string k = DateTime.Now.Date.AddDays(i - 6).ToString("yyyy-MM-dd");
                if (daily?[k] != null) d[i] = (double)daily[k];
            }
            return d;
        }

        static long LogoVersion(JsonObject g)
        {
            try { return File.GetLastWriteTimeUtc((string)g["logo"]).Ticks; } catch { return 0; }
        }

        public byte[] Logo(string id)
        {
            lock (gate)
            {
                var g = Games.FirstOrDefault(x => (string)x["id"] == id);
                string p = g == null ? null : (string)g["logo"];
                return p != null && File.Exists(p) ? File.ReadAllBytes(p) : null;
            }
        }

        // Add or edit a game. hours = total hours (you can type your earlier hours).
        public string Upsert(string id, string name, string exe, string title, double hours)
        {
            lock (gate)
            {
                var g = id == null ? null : Games.FirstOrDefault(x => (string)x["id"] == id);
                if (g == null)
                {
                    g = new JsonObject { ["id"] = Guid.NewGuid().ToString("N"), ["sessions"] = 0, ["last_played"] = "", ["daily"] = new JsonObject(), ["logo"] = "" };
                    ((JsonArray)data["games"]).Add(g);
                }
                g["name"] = name;
                g["exe"] = exe;
                g["title"] = title;
                g["total"] = Math.Max(0, hours * 3600);
                active.Remove((string)g["id"]);
                string gid = (string)g["id"];
                Save();
                return gid;
            }
        }

        public void Delete(string id)
        {
            lock (gate)
            {
                var arr = (JsonArray)data["games"];
                var g = Games.FirstOrDefault(x => (string)x["id"] == id);
                if (g == null) return;
                try { string p = (string)g["logo"]; if (p != null && p.StartsWith(LogoDir, StringComparison.OrdinalIgnoreCase)) File.Delete(p); } catch { }
                arr.Remove(g);
                active.Remove(id);
                Save();
            }
        }

        // Square-crops and resizes a picked image to 256 px PNG.
        public void SetLogo(string id, string src)
        {
            Directory.CreateDirectory(LogoDir);
            string dst = Path.Combine(LogoDir, id + "_" + DateTime.UtcNow.Ticks + ".png");
            using (var im = Image.FromFile(src))
            using (var bmp = new Bitmap(256, 256))
            using (var gfx = Graphics.FromImage(bmp))
            {
                int s = Math.Min(im.Width, im.Height);
                gfx.InterpolationMode = InterpolationMode.HighQualityBicubic;
                gfx.DrawImage(im, new Rectangle(0, 0, 256, 256), new Rectangle((im.Width - s) / 2, (im.Height - s) / 2, s, s), GraphicsUnit.Pixel);
                bmp.Save(dst, ImageFormat.Png);
            }
            lock (gate)
            {
                var g = Games.FirstOrDefault(x => (string)x["id"] == id);
                if (g == null) { File.Delete(dst); return; }
                try { string old = (string)g["logo"]; if (old != null && old.StartsWith(LogoDir, StringComparison.OrdinalIgnoreCase)) File.Delete(old); } catch { }
                g["logo"] = dst;
                Save();
            }
        }

        public void RemoveLogo(string id)
        {
            lock (gate)
            {
                var g = Games.FirstOrDefault(x => (string)x["id"] == id);
                if (g == null) return;
                try { string old = (string)g["logo"]; if (old != null && old.StartsWith(LogoDir, StringComparison.OrdinalIgnoreCase)) File.Delete(old); } catch { }
                g["logo"] = "";
                Save();
            }
        }
    }
}
