using System;
using System.Diagnostics;
using System.IO;
using System.Net.Http;
using System.Reflection;
using System.Text.Json;
using System.Threading.Tasks;

namespace HundredIt
{
    // Checks the GitHub releases of Weelr/100-it, downloads a newer 100it.exe in
    // the background, and swaps it in when the app closes (or right away if the
    // user asks). Windows lets a running exe be renamed, so the swap is:
    // current -> 100it.exe.old, new -> current path.
    static class Updater
    {
        // Normal builds update from the public repo. A personal build can be pointed
        // at another (private) repo at build time with -p:UpdateRepo=owner/name and
        // -p:UpdateToken=<read-only token>; it then updates only from there.
        static readonly string Repo = Meta("UpdateRepo") ?? "Weelr/100-it";
        static readonly string Token = Meta("UpdateToken");
        static readonly string LatestApi = "https://api.github.com/repos/" + Repo + "/releases/latest";

        static string Meta(string key)
        {
            foreach (var a in Assembly.GetExecutingAssembly().GetCustomAttributes<AssemblyMetadataAttribute>())
                if (a.Key == key && !string.IsNullOrWhiteSpace(a.Value)) return a.Value.Trim();
            return null;
        }
        static readonly string Dir = Path.Combine(Backend.DataDir, "update");
        static readonly string Staged = Path.Combine(Dir, "100it.exe");

        public static string Status = "idle"; // idle | checking | downloading | ready | latest | error
        public static string NewVersion;
        public static long Downloaded, Total;   // download progress (bytes), shown in the update card

        public static Version Current
        {
            get
            {
                var v = Assembly.GetExecutingAssembly().GetName().Version ?? new Version(0, 0, 0);
                return new Version(v.Major, v.Minor, Math.Max(0, v.Build));
            }
        }

        static string ExePath { get { return Environment.ProcessPath; } }

        // Leftover from the previous update.
        public static void CleanUp()
        {
            try { if (ExePath != null && File.Exists(ExePath + ".old")) File.Delete(ExePath + ".old"); } catch { }
        }

        public static async Task CheckAsync()
        {
            if (Status == "checking" || Status == "downloading" || Status == "ready") return;
            Status = "checking";
            try
            {
                using (var http = new HttpClient { Timeout = TimeSpan.FromMinutes(10) })
                {
                    http.DefaultRequestHeaders.UserAgent.ParseAdd("100it/" + Current);
                    if (Token != null) http.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", Token);
                    var req = new HttpRequestMessage(HttpMethod.Get, LatestApi);
                    req.Headers.Accept.ParseAdd("application/vnd.github+json");
                    var resp = await http.SendAsync(req);
                    if (!resp.IsSuccessStatusCode) { Status = "error"; return; }
                    string url = null; long size = 0; Version latest;
                    using (var doc = JsonDocument.Parse(await resp.Content.ReadAsStringAsync()))
                    {
                        string tag = doc.RootElement.GetProperty("tag_name").GetString() ?? "";
                        if (!Version.TryParse(tag.TrimStart('v', 'V'), out latest)) { Status = "error"; return; }
                        foreach (var a in doc.RootElement.GetProperty("assets").EnumerateArray())
                        {
                            if (string.Equals(a.GetProperty("name").GetString(), "100it.exe", StringComparison.OrdinalIgnoreCase))
                            {
                                // A private repo's files are only reachable through the API.
                                url = a.GetProperty(Token != null ? "url" : "browser_download_url").GetString();
                                size = a.GetProperty("size").GetInt64();
                            }
                        }
                    }
                    latest = new Version(latest.Major, latest.Minor, Math.Max(0, latest.Build));
                    if (latest <= Current || url == null) { Status = "latest"; return; }

                    Downloaded = 0;
                    Total = size;
                    NewVersion = latest.ToString();
                    Status = "downloading";
                    Directory.CreateDirectory(Dir);
                    string part = Staged + ".part";
                    var dl = new HttpRequestMessage(HttpMethod.Get, url);
                    dl.Headers.Accept.ParseAdd("application/octet-stream");
                    using (var r = await http.SendAsync(dl, HttpCompletionOption.ResponseHeadersRead))
                    using (var s = await r.EnsureSuccessStatusCode().Content.ReadAsStreamAsync())
                    using (var f = File.Create(part))
                    {
                        var buf = new byte[81920];
                        int n;
                        while ((n = await s.ReadAsync(buf, 0, buf.Length)) > 0)
                        {
                            await f.WriteAsync(buf, 0, n);
                            Downloaded += n;
                        }
                    }
                    var info = new FileInfo(part);
                    if (info.Length != size || !LooksLikeExe(part)) { File.Delete(part); Status = "error"; return; }
                    if (File.Exists(Staged)) File.Delete(Staged);
                    File.Move(part, Staged);
                    Status = "ready";
                }
            }
            catch (Exception ex)
            {
                Debug.WriteLine(ex);
                Status = "error";
            }
        }

        static bool LooksLikeExe(string path)
        {
            using (var f = File.OpenRead(path))
                return f.ReadByte() == 'M' && f.ReadByte() == 'Z';
        }

        // Puts the downloaded exe in place of the running one. Returns false if
        // nothing was swapped (no update, or the folder isn't writable).
        public static bool Swap()
        {
            if (Status != "ready" || !File.Exists(Staged) || ExePath == null) return false;
            string old = ExePath + ".old";
            try
            {
                if (File.Exists(old)) File.Delete(old);
                File.Move(ExePath, old);
                try { File.Move(Staged, ExePath); }
                catch { File.Move(old, ExePath); throw; }
                Status = "applied";
                return true;
            }
            catch (Exception ex)
            {
                Debug.WriteLine(ex);
                Status = "error";
                return false;
            }
        }

        public static void Restart(bool minimized = false)
        {
            string args = "--after-update" + (minimized ? " --minimized" : "");
            try { Process.Start(new ProcessStartInfo(ExePath, args) { UseShellExecute = false }); } catch { }
        }
    }
}
