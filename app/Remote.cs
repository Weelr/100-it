using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Threading;
using System.Threading.Tasks;

namespace HundredIt
{
    // "Phone": keeps a copy of your progress in a secret GitHub Gist, so the
    // phone page (GitHub Pages of this repo) can show it from anywhere, even
    // when the computer is off. Needs a GitHub token with the "gist" scope only.
    //
    // Gist files:
    //   progress.json        { v, updated, state, hours, extra }
    //   thumb_<slot>.txt     data: URL of the save's picture (made smaller)
    //   logo_<game>.txt      data: URL of a game's logo
    static class Remote
    {
        public const string PhonePage = "https://weelr.github.io/100-it/";
        const string Api = "https://api.github.com";
        static readonly string ConfigPath = Path.Combine(Backend.DataDir, "phone.json");
        static readonly string ExtraPath = Path.Combine(Backend.DataDir, "phone-extra.json");
        static readonly HttpClient http = MakeClient();
        static readonly SemaphoreSlim busy = new SemaphoreSlim(1, 1);

        static string token = "", gistId = "", user = "";
        static string extra = "{}";               // progress history + sessions, sent by the page
        static string lastMainSig, lastHoursSig;
        static DateTime lastUpload = DateTime.MinValue;
        static readonly Dictionary<string, string> sent = new Dictionary<string, string>(); // gist file -> what we sent

        public static string LastError;           // null | token | gone | net
        public static long LastOk;                // unix ms of the last successful upload
        static volatile bool dirty = true;

        static HttpClient MakeClient()
        {
            var h = new HttpClient { Timeout = TimeSpan.FromSeconds(40) };
            h.DefaultRequestHeaders.UserAgent.ParseAdd("100it");
            h.DefaultRequestHeaders.Accept.ParseAdd("application/vnd.github+json");
            h.DefaultRequestHeaders.Add("X-GitHub-Api-Version", "2022-11-28");
            return h;
        }

        public static bool On { get { return token.Length > 0 && gistId.Length > 0; } }
        public static string Url { get { return On ? PhonePage + "?g=" + gistId : null; } }

        public static object View()
        {
            return new { on = On, url = Url, user, lastOk = LastOk, error = LastError };
        }

        public static void Start()
        {
            Load();
            var t = new Thread(Loop) { IsBackground = true, Name = "phone-sync" };
            t.Start();
        }

        static void Load()
        {
            try
            {
                using (var doc = JsonDocument.Parse(File.ReadAllBytes(ConfigPath)))
                {
                    var r = doc.RootElement;
                    JsonElement e;
                    if (r.TryGetProperty("token", out e)) token = e.GetString() ?? "";
                    if (r.TryGetProperty("gistId", out e)) gistId = e.GetString() ?? "";
                    if (r.TryGetProperty("user", out e)) user = e.GetString() ?? "";
                }
            }
            catch { }
            try { extra = File.ReadAllText(ExtraPath); JsonDocument.Parse(extra).Dispose(); } catch { extra = "{}"; }
        }

        static void WriteConfig()
        {
            try { File.WriteAllText(ConfigPath, JsonSerializer.Serialize(new { token, gistId, user })); } catch { }
        }

        // The page sends its progress history and sessions (they live in the page's storage).
        public static void SetExtra(string json)
        {
            try { JsonDocument.Parse(json ?? "").Dispose(); } catch { return; }
            if (json == extra) return;
            extra = json;
            try { File.WriteAllText(ExtraPath, json); } catch { }
            dirty = true;
        }

        static void Loop()
        {
            Thread.Sleep(6000);
            int n = 0;
            while (true)
            {
                try { SyncAsync().GetAwaiter().GetResult(); }
                catch (Exception ex) { LastError = "net"; System.Diagnostics.Debug.WriteLine(ex); }
                // Check every 15 s; the sync itself skips when nothing changed.
                for (int i = 0; i < 15 && !(dirty && n > 0); i++) Thread.Sleep(1000);
                n++;
            }
        }

        // ---------- turning it on / off ----------

        // Returns null when everything worked, otherwise: token | scope | net
        public static async Task<string> SetupAsync(string newToken)
        {
            newToken = (newToken ?? "").Trim();
            if (newToken.Length < 10) return "token";
            await busy.WaitAsync();
            try
            {
                string login;
                using (var r = await Send(HttpMethod.Get, "/user", null, newToken))
                {
                    if (r.StatusCode == HttpStatusCode.Unauthorized) return "token";
                    if (!r.IsSuccessStatusCode) return "net";
                    using (var doc = JsonDocument.Parse(await r.Content.ReadAsStringAsync()))
                        login = doc.RootElement.GetProperty("login").GetString() ?? "";
                }

                // Same account as before and the gist is still there: keep it (same link / QR).
                string id = null;
                if (gistId.Length > 0 && string.Equals(login, user, StringComparison.OrdinalIgnoreCase))
                {
                    using (var r = await Send(HttpMethod.Get, "/gists/" + gistId, null, newToken))
                        if (r.IsSuccessStatusCode) id = gistId;
                }
                if (id == null)
                {
                    var body = new JsonObject
                    {
                        ["description"] = "100% it — Ocarina of Time progress (for the phone page)",
                        ["public"] = false,
                        ["files"] = new JsonObject { ["progress.json"] = new JsonObject { ["content"] = "{}" } },
                    };
                    using (var r = await Send(HttpMethod.Post, "/gists", body.ToJsonString(), newToken))
                    {
                        if (r.StatusCode == HttpStatusCode.Unauthorized) return "token";
                        if (r.StatusCode == HttpStatusCode.Forbidden || r.StatusCode == HttpStatusCode.NotFound) return "scope";
                        if (!r.IsSuccessStatusCode) return "net";
                        using (var doc = JsonDocument.Parse(await r.Content.ReadAsStringAsync()))
                            id = doc.RootElement.GetProperty("id").GetString();
                    }
                }
                token = newToken;
                gistId = id;
                user = login;
                LastError = null;
                lock (sent) sent.Clear();
                lastMainSig = lastHoursSig = null;
                WriteConfig();
                dirty = true;
            }
            catch (HttpRequestException) { return "net"; }
            catch (TaskCanceledException) { return "net"; }
            finally { busy.Release(); }
            await SyncAsync(); // first upload right away so the phone has something to show
            return null;
        }

        // Stops uploading. The gist stays on GitHub (you can delete it there).
        public static void Off()
        {
            token = "";
            LastError = null;
            WriteConfig();
        }

        // ---------- uploading ----------

        sealed class Snapshot
        {
            public string State, Hours;
            public List<Tuple<string, string, Func<byte[]>>> Images = new List<Tuple<string, string, Func<byte[]>>>(); // file, version, bytes
        }

        static string Safe(string s)
        {
            var sb = new StringBuilder();
            foreach (char c in s ?? "") if (char.IsAsciiLetterOrDigit(c) || c == '_' || c == '-') sb.Append(c);
            return sb.ToString();
        }

        // Reads everything on the UI thread (the save reader isn't thread-safe).
        static Snapshot Take()
        {
            var form = MainForm.Instance;
            if (form == null || !form.IsHandleCreated) return null;
            return (Snapshot)form.Invoke(new Func<Snapshot>(() =>
            {
                var snap = new Snapshot();
                var stateBytes = Program.Backend.Handle("/api/state", "GET", null).Body;
                snap.State = Encoding.UTF8.GetString(stateBytes);
                snap.Hours = JsonSerializer.Serialize(form.HoursView());
                using (var doc = JsonDocument.Parse(stateBytes))
                {
                    JsonElement slots;
                    if (doc.RootElement.TryGetProperty("slots", out slots))
                        foreach (var s in slots.EnumerateArray())
                        {
                            if (!s.GetProperty("hasImage").GetBoolean()) continue;
                            string key = s.GetProperty("key").GetString();
                            snap.Images.Add(Tuple.Create("thumb_" + Safe(key) + ".txt", s.GetProperty("modified").GetInt64().ToString(),
                                new Func<byte[]>(() => Thumb(key))));
                        }
                }
                using (var doc = JsonDocument.Parse(snap.Hours))
                {
                    foreach (var g in doc.RootElement.GetProperty("hours").GetProperty("games").EnumerateArray())
                    {
                        if (!g.GetProperty("logo").GetBoolean()) continue;
                        string id = g.GetProperty("id").GetString();
                        snap.Images.Add(Tuple.Create("logo_" + Safe(id) + ".txt", g.GetProperty("logoV").GetInt64().ToString(),
                            new Func<byte[]>(() => Logo(id))));
                    }
                }
                return snap;
            }));
        }

        static byte[] Thumb(string key)
        {
            var r = Program.Backend.Handle("/api/thumb/" + key + ".jpg", "GET", null);
            return r.Status == 200 ? r.Body : null;
        }

        static byte[] Logo(string id) { return Program.Tracker.Logo(id); }

        static string Sig(string s)
        {
            return Convert.ToHexString(SHA1.HashData(Encoding.UTF8.GetBytes(s)));
        }

        public static async Task SyncAsync()
        {
            if (!On) return;
            await busy.WaitAsync();
            try
            {
                if (!On) return;
                dirty = false;
                var snap = Take();
                if (snap == null) return;

                // Progress (and history) go up right away; play hours tick every
                // second while you play, so those go up at most every 2 minutes.
                string mainSig = Sig(snap.State + "\n" + extra), hoursSig = Sig(snap.Hours);
                bool imagesChanged;
                lock (sent) imagesChanged = snap.Images.Any(i => { string v; return !sent.TryGetValue(i.Item1, out v) || v != i.Item2; });
                bool due = mainSig != lastMainSig || imagesChanged || lastMainSig == null ||
                           (hoursSig != lastHoursSig && DateTime.UtcNow - lastUpload > TimeSpan.FromMinutes(2));
                if (!due) return;

                var files = new JsonObject();
                var progress = new JsonObject
                {
                    ["v"] = 1,
                    ["updated"] = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
                    ["state"] = JsonNode.Parse(snap.State),
                    ["hours"] = JsonNode.Parse(snap.Hours),
                    ["extra"] = JsonNode.Parse(extra),
                };
                files["progress.json"] = new JsonObject { ["content"] = progress.ToJsonString() };
                var newSent = new Dictionary<string, string>();
                foreach (var img in snap.Images)
                {
                    string had;
                    lock (sent) if (sent.TryGetValue(img.Item1, out had) && had == img.Item2) continue;
                    byte[] raw = null;
                    try { raw = img.Item3(); } catch { }
                    if (raw == null) continue;
                    bool isLogo = img.Item1.StartsWith("logo_", StringComparison.Ordinal);
                    string url = DataUrl(raw, isLogo ? 160 : 520, isLogo);
                    files[img.Item1] = new JsonObject { ["content"] = url };
                    newSent[img.Item1] = img.Item2;
                }

                using (var r = await Send(new HttpMethod("PATCH"), "/gists/" + gistId, new JsonObject { ["files"] = files }.ToJsonString(), token))
                {
                    if (r.StatusCode == HttpStatusCode.Unauthorized) { LastError = "token"; return; }
                    if (r.StatusCode == HttpStatusCode.NotFound) { LastError = "gone"; return; }
                    if (!r.IsSuccessStatusCode) { LastError = "net"; dirty = true; return; }
                }
                lastMainSig = mainSig;
                lastHoursSig = hoursSig;
                lastUpload = DateTime.UtcNow;
                lock (sent) foreach (var kv in newSent) sent[kv.Key] = kv.Value;
                LastOk = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
                LastError = null;
            }
            catch (HttpRequestException) { LastError = "net"; }
            catch (TaskCanceledException) { LastError = "net"; }
            finally { busy.Release(); }
        }

        static async Task<HttpResponseMessage> Send(HttpMethod method, string path, string json, string tok)
        {
            var req = new HttpRequestMessage(method, Api + path);
            req.Headers.TryAddWithoutValidation("Authorization", "Bearer " + tok);
            if (json != null) req.Content = new StringContent(json, Encoding.UTF8, "application/json");
            return await http.SendAsync(req);
        }

        // Smaller picture for the phone (keeps the gist light). Falls back to the original.
        static string DataUrl(byte[] raw, int maxW, bool png)
        {
            try
            {
                using (var ms = new MemoryStream(raw))
                using (var src = Image.FromStream(ms))
                {
                    double k = Math.Min(1.0, (double)maxW / src.Width);
                    int w = Math.Max(1, (int)Math.Round(src.Width * k)), h = Math.Max(1, (int)Math.Round(src.Height * k));
                    using (var bmp = new Bitmap(w, h, png ? PixelFormat.Format32bppArgb : PixelFormat.Format24bppRgb))
                    {
                        using (var g = Graphics.FromImage(bmp))
                        {
                            g.InterpolationMode = InterpolationMode.HighQualityBicubic;
                            g.PixelOffsetMode = PixelOffsetMode.HighQuality;
                            g.DrawImage(src, 0, 0, w, h);
                        }
                        using (var outMs = new MemoryStream())
                        {
                            if (png) bmp.Save(outMs, ImageFormat.Png);
                            else
                            {
                                var enc = ImageCodecInfo.GetImageEncoders().First(c => c.FormatID == ImageFormat.Jpeg.Guid);
                                using (var ps = new EncoderParameters(1))
                                {
                                    ps.Param[0] = new EncoderParameter(System.Drawing.Imaging.Encoder.Quality, 78L);
                                    bmp.Save(outMs, enc, ps);
                                }
                            }
                            return (png ? "data:image/png;base64," : "data:image/jpeg;base64,") + Convert.ToBase64String(outMs.ToArray());
                        }
                    }
                }
            }
            catch
            {
                return (png ? "data:image/png;base64," : "data:image/jpeg;base64,") + Convert.ToBase64String(raw);
            }
        }
    }
}
