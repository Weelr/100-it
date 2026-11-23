using System;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Linq;
using System.Runtime.InteropServices;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using System.Windows.Forms;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;
using Microsoft.Win32;

namespace HundredIt
{
    static class Program
    {
        public static Backend Backend;
        public static PlayTracker Tracker;
        public static bool StartHidden;
        const string ShowEventName = "HundredIt.Show";

        [STAThread]
        static void Main(string[] args)
        {
            Application.SetHighDpiMode(HighDpiMode.PerMonitorV2);
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);

            // --selftest <save folder> <output folder>: used by CI to check the real
            // window renders a save, then exits.
            if (args.Length == 3 && args[0] == "--selftest")
            {
                Backend.OverrideSaveDir = args[1];
                MainForm.SelfTestOut = args[2];
                Backend = new Backend();
                Tracker = new PlayTracker();
                Application.Run(new MainForm());
                return;
            }
            bool afterUpdate = Array.IndexOf(args, "--after-update") >= 0;
            StartHidden = Array.IndexOf(args, "--minimized") >= 0;
            using (var mutex = new Mutex(false, "HundredIt.SingleInstance"))
            {
                bool owned;
                // Right after an update the old copy may still be closing: wait for it.
                try { owned = mutex.WaitOne(afterUpdate ? 15000 : 0); }
                catch (AbandonedMutexException) { owned = true; }
                if (!owned)
                {
                    // Already running (maybe hidden in the tray): ask it to show itself.
                    try { EventWaitHandle.OpenExisting(ShowEventName).Set(); } catch { }
                    return;
                }
                using (var show = new EventWaitHandle(false, EventResetMode.AutoReset, ShowEventName))
                {
                    Backend = new Backend();
                    Tracker = new PlayTracker();
                    Tracker.Start();
                    var form = new MainForm();
                    Remote.Start();
                    var listener = new Thread(() =>
                    {
                        while (show.WaitOne())
                        {
                            try { form.BeginInvoke(new Action(form.ShowFromTray)); } catch { return; }
                        }
                    }) { IsBackground = true };
                    listener.Start();
                    Application.Run(form);
                    Tracker.Save();
                }
            }
        }
    }

    static class Native
    {
        [DllImport("dwmapi.dll")] public static extern int DwmSetWindowAttribute(IntPtr h, int attr, ref int value, int size);
        public static void DarkTitleBar(IntPtr h)
        {
            int on = 1; // Windows 10 2004+ / 11
            try { DwmSetWindowAttribute(h, 20, ref on, 4); } catch { }
        }
    }

    // "Start with Windows" (HKCU Run key) and the old GameHours startup entry.
    static class Startup
    {
        const string RunKey = @"Software\Microsoft\Windows\CurrentVersion\Run";
        const string Name = "100it";
        public static readonly string OldGameHoursBat = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.Startup), "GameHours.bat");

        public static bool Enabled
        {
            get
            {
                using (var k = Registry.CurrentUser.OpenSubKey(RunKey))
                    return k?.GetValue(Name) != null;
            }
            set
            {
                using (var k = Registry.CurrentUser.CreateSubKey(RunKey))
                {
                    if (value) k.SetValue(Name, "\"" + Environment.ProcessPath + "\" --minimized");
                    else k.DeleteValue(Name, false);
                }
            }
        }
    }

    sealed class MainForm : Form
    {
        public const string Title = "100% it";
        public static string SelfTestOut;
        public static MainForm Instance;
        public const string Host = "https://app.local";
        public static readonly Color Bg = Color.FromArgb(13, 24, 19);
        public static Icon AppIcon;

        readonly WebView2 web;
        readonly NotifyIcon tray;
        MiniForm mini;
        bool quitting, trayHintShown;

        public MainForm()
        {
            Instance = this;
            Text = Title;
            BackColor = Bg;
            StartPosition = FormStartPosition.CenterScreen;
            Size = new Size(1320, 900);
            MinimumSize = new Size(760, 560);
            var ico = Backend.Resource("app.ico");
            if (ico != null) Icon = AppIcon = new Icon(new MemoryStream(ico));

            web = new WebView2 { Dock = DockStyle.Fill, DefaultBackgroundColor = Bg };
            Controls.Add(web);
            Load += async (s, e) => await InitWebAsync();

            // Tray icon next to the clock: the app keeps counting play time there.
            var menu = new ContextMenuStrip();
            menu.Items.Add("فتح 100% it  /  Open", null, (s, e) => ShowFromTray());
            menu.Items.Add("إنهاء  /  Quit", null, (s, e) => Quit());
            tray = new NotifyIcon { Icon = AppIcon ?? SystemIcons.Application, Text = Title, ContextMenuStrip = menu, Visible = SelfTestOut == null };
            tray.DoubleClick += (s, e) => ShowFromTray();

            // A downloaded update installs itself while the app sits in the tray and no game is running.
            var updTimer = new System.Windows.Forms.Timer { Interval = 60 * 1000 };
            updTimer.Tick += (s, e) =>
            {
                if (Updater.Status == "ready" && !Visible && !Program.Tracker.AnyActive && Updater.Swap())
                {
                    Updater.Restart(minimized: true);
                    Quit();
                }
            };
            updTimer.Start();
        }

        protected override void SetVisibleCore(bool value)
        {
            // Started with --minimized (Windows startup): stay in the tray.
            if (Program.StartHidden && !IsHandleCreated)
            {
                CreateHandle();
                value = false;
                Program.StartHidden = false;
                BeginInvoke(new Action(async () => await InitWebAsync()));
            }
            base.SetVisibleCore(value);
        }

        protected override void OnHandleCreated(EventArgs e)
        {
            base.OnHandleCreated(e);
            Native.DarkTitleBar(Handle);
        }

        public void ShowFromTray()
        {
            Show();
            if (WindowState == FormWindowState.Minimized) WindowState = FormWindowState.Normal;
            Activate();
        }

        public void Quit()
        {
            quitting = true;
            Close();
        }

        protected override void OnFormClosing(FormClosingEventArgs e)
        {
            if (!quitting && SelfTestOut == null && e.CloseReason == CloseReason.UserClosing && Program.Backend.Background)
            {
                e.Cancel = true; // ✕ hides to the tray and keeps counting
                Hide();
                if (!trayHintShown)
                {
                    trayHintShown = true;
                    tray.ShowBalloonTip(4000, Title, "البرنامج شغّال جنب الساعة ويحسب وقت لعبك.\nStill running next to the clock.", ToolTipIcon.Info);
                }
                return;
            }
            Program.Tracker.Save();
            Updater.Swap(); // a downloaded update takes effect next time you open the app
            tray.Visible = false;
            if (mini != null && !mini.IsDisposed) mini.Close();
            base.OnFormClosing(e);
        }

        void StartUpdateChecks()
        {
            Updater.CleanUp();
            // Every 10 minutes, so a new version shows up soon after it's published.
            var timer = new System.Windows.Forms.Timer { Interval = 10 * 60 * 1000 };
            timer.Tick += async (s, e) => await Updater.CheckAsync();
            timer.Start();
            Task.Delay(8000).ContinueWith(_ => Updater.CheckAsync());
        }

        static CoreWebView2Environment env;
        bool webStarted;

        async Task InitWebAsync()
        {
            if (webStarted) return;
            webStarted = true;
            try
            {
                env = await CoreWebView2Environment.CreateAsync(null, Path.Combine(Backend.DataDir, "WebView2"));
                await web.EnsureCoreWebView2Async(env);
            }
            catch (WebView2RuntimeNotFoundException)
            {
                MessageBox.Show(this,
                    "البرنامج يحتاج Microsoft Edge WebView2 Runtime.\nبفتح لك صفحة التحميل، ثبّته وشغّل البرنامج مرة ثانية.",
                    Title, MessageBoxButtons.OK, MessageBoxIcon.Information);
                try { Process.Start(new ProcessStartInfo("https://go.microsoft.com/fwlink/p/?LinkId=2124703") { UseShellExecute = true }); } catch { }
                Quit();
                return;
            }
            Setup(web.CoreWebView2);
            if (SelfTestOut != null) web.CoreWebView2.NavigationCompleted += async (s, e) => await SelfTestAsync();
            else StartUpdateChecks();
            web.CoreWebView2.Navigate(Host + "/index.html");
        }

        // Shared by the main window and the mini window.
        public static void Setup(CoreWebView2 core)
        {
            core.Settings.AreDefaultContextMenusEnabled = false;
            core.Settings.AreDevToolsEnabled = false;
            core.Settings.IsStatusBarEnabled = false;
            core.Settings.IsZoomControlEnabled = false;
            core.Settings.AreBrowserAcceleratorKeysEnabled = false;
            core.Settings.IsPasswordAutosaveEnabled = false;
            core.Settings.IsGeneralAutofillEnabled = false;
            // Links such as the YouTube videos open in the normal browser.
            core.NewWindowRequested += (s, e) => { e.Handled = true; OpenExternal(e.Uri); };
            core.NavigationStarting += (s, e) =>
            {
                if (!e.Uri.StartsWith(Host + "/", StringComparison.OrdinalIgnoreCase)) { e.Cancel = true; OpenExternal(e.Uri); }
            };
            core.AddWebResourceRequestedFilter(Host + "/*", CoreWebView2WebResourceContext.All);
            core.WebResourceRequested += (s, e) => Instance.OnRequest(e);
        }

        public static CoreWebView2Environment Env { get { return env; } }

        async Task SelfTestAsync()
        {
            Directory.CreateDirectory(SelfTestOut);
            try
            {
                await Task.Delay(3000);
                File.WriteAllBytes(Path.Combine(SelfTestOut, "state.json"), Program.Backend.Handle("/api/state", "GET", null).Body);
                string errors = await web.CoreWebView2.ExecuteScriptAsync("JSON.stringify(window.__errors || [])");
                File.WriteAllText(Path.Combine(SelfTestOut, "js-errors.txt"), errors);
                using (var fs = File.Create(Path.Combine(SelfTestOut, "shot.png")))
                    await web.CoreWebView2.CapturePreviewAsync(CoreWebView2CapturePreviewImageFormat.Png, fs);
                await web.CoreWebView2.ExecuteScriptAsync("document.querySelector('[data-tab=hours]').click()");
                await Task.Delay(800);
                using (var fs = File.Create(Path.Combine(SelfTestOut, "shot-region.png")))
                    await web.CoreWebView2.CapturePreviewAsync(CoreWebView2CapturePreviewImageFormat.Png, fs);
                errors = await web.CoreWebView2.ExecuteScriptAsync("JSON.stringify(window.__errors || [])");
                File.WriteAllText(Path.Combine(SelfTestOut, "js-errors.txt"), errors);
            }
            catch (Exception ex)
            {
                File.WriteAllText(Path.Combine(SelfTestOut, "error.txt"), ex.ToString());
            }
            Quit();
        }

        // ---------- requests from the page ----------

        static JsonElement Body(string body)
        {
            try { using (var d = JsonDocument.Parse(string.IsNullOrEmpty(body) ? "{}" : body)) return d.RootElement.Clone(); }
            catch { using (var d = JsonDocument.Parse("{}")) return d.RootElement.Clone(); }
        }
        static string Str(JsonElement b, string k)
        {
            JsonElement v;
            return b.ValueKind == JsonValueKind.Object && b.TryGetProperty(k, out v) && v.ValueKind == JsonValueKind.String ? v.GetString() : null;
        }
        static bool? Bool(JsonElement b, string k)
        {
            JsonElement v;
            if (b.ValueKind != JsonValueKind.Object || !b.TryGetProperty(k, out v)) return null;
            return v.ValueKind == JsonValueKind.True ? true : v.ValueKind == JsonValueKind.False ? false : (bool?)null;
        }
        static double Num(JsonElement b, string k)
        {
            JsonElement v;
            if (b.ValueKind == JsonValueKind.Object && b.TryGetProperty(k, out v))
            {
                double d;
                if (v.ValueKind == JsonValueKind.Number) return v.GetDouble();
                if (v.ValueKind == JsonValueKind.String && double.TryParse(v.GetString(), System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture, out d)) return d;
            }
            return 0;
        }

        // Runs fn on the UI thread (dialogs, windows) and answers the request when it's done.
        void OnUi(CoreWebView2WebResourceRequestedEventArgs e, Func<Reply> fn)
        {
            var deferral = e.GetDeferral();
            BeginInvoke(new Action(() =>
            {
                Reply r;
                try { r = fn(); } catch (Exception ex) { r = Reply.Error(500, ex.Message); }
                e.Response = ToResponse(env, r);
                deferral.Complete();
            }));
        }

        public object HoursView()
        {
            bool startup = false;
            try { startup = Startup.Enabled; } catch { }
            return new { hours = Program.Tracker.View(), background = Program.Backend.Background, startup, oldStartup = File.Exists(Startup.OldGameHoursBat) };
        }

        public void OnRequest(CoreWebView2WebResourceRequestedEventArgs e)
        {
            string path = new Uri(e.Request.Uri).AbsolutePath;
            string method = e.Request.Method;
            string body = null;
            try
            {
                if (e.Request.Content != null)
                    using (var sr = new StreamReader(e.Request.Content, Encoding.UTF8)) body = sr.ReadToEnd();
                var b = Body(body);
                switch (path)
                {
                    case "/api/browse":
                        OnUi(e, () =>
                        {
                            string picked = PickFolder();
                            if (picked == null) return Reply.Json(new { });
                            string set = Program.Backend.SetSaveDir(picked);
                            return set == null ? Reply.Json(new { error = "notfound", picked }) : Reply.Json(new { path = set });
                        });
                        return;
                    case "/api/update":
                        e.Response = ToResponse(env, Reply.Json(new { current = Updater.Current.ToString(), status = Updater.Status, version = Updater.NewVersion,
                            downloaded = Updater.Downloaded, total = Updater.Total }));
                        return;
                    case "/api/update/check":
                        e.Response = ToResponse(env, Reply.Json(new { ok = true }));
                        Task.Run(() => Updater.CheckAsync());
                        return;
                    case "/api/update/apply":
                        {
                            // Still downloading: wait for it (the page shows the progress), then install.
                            e.Response = ToResponse(env, Reply.Json(new { ok = Updater.Status == "ready" || Updater.Status == "downloading" }));
                            Task.Run(async () =>
                            {
                                while (Updater.Status == "downloading" || Updater.Status == "checking") await Task.Delay(300);
                                await Task.Delay(400); // let the page show 100%
                                BeginInvoke(new Action(() => { if (Updater.Swap()) { Updater.Restart(); Quit(); } }));
                            });
                            return;
                        }
                    case "/api/hours":
                        e.Response = ToResponse(env, Reply.Json(HoursView()));
                        return;
                    case "/api/hours/save":
                        {
                            string name = (Str(b, "name") ?? "").Trim();
                            if (name.Length == 0) { e.Response = ToResponse(env, Reply.Error(400, "name")); return; }
                            string id = Program.Tracker.Upsert(Str(b, "id"), name, (Str(b, "exe") ?? "").Trim(), (Str(b, "title") ?? "").Trim(), Num(b, "hours"));
                            e.Response = ToResponse(env, Reply.Json(new { id }));
                            return;
                        }
                    case "/api/hours/delete":
                        Program.Tracker.Delete(Str(b, "id") ?? "");
                        e.Response = ToResponse(env, Reply.Json(new { ok = true }));
                        return;
                    case "/api/hours/logo":
                        {
                            string id = Str(b, "id") ?? "";
                            OnUi(e, () =>
                            {
                                using (var dlg = new OpenFileDialog { Filter = "Images|*.png;*.jpg;*.jpeg;*.bmp;*.gif;*.ico;*.webp", Title = "Logo" })
                                {
                                    if (dlg.ShowDialog(this) != DialogResult.OK) return Reply.Json(new { ok = false });
                                    try { Program.Tracker.SetLogo(id, dlg.FileName); }
                                    catch { return Reply.Json(new { ok = false, error = "image" }); }
                                    return Reply.Json(new { ok = true });
                                }
                            });
                            return;
                        }
                    case "/api/hours/nologo":
                        Program.Tracker.RemoveLogo(Str(b, "id") ?? "");
                        e.Response = ToResponse(env, Reply.Json(new { ok = true }));
                        return;
                    case "/api/hours/fromsave":
                        e.Response = ToResponse(env, Reply.Json(Program.Backend.SavePlayTime()));
                        return;
                    case "/api/windows":
                        {
                            var skip = new[] { "explorer.exe", "textinputhost.exe", "applicationframehost.exe", "systemsettings.exe", "100it.exe", "msedgewebview2.exe", "" };
                            var list = PlayTracker.Windows().Where(w => !skip.Contains(w.Item1)).Distinct()
                                .OrderBy(w => w.Item1).Select(w => new { exe = w.Item1, title = w.Item2 }).ToList();
                            e.Response = ToResponse(env, Reply.Json(list));
                            return;
                        }
                    case "/api/prefs":
                        {
                            var bg = Bool(b, "background");
                            if (bg.HasValue) Program.Backend.Background = bg.Value;
                            var st = Bool(b, "startup");
                            if (st.HasValue) { try { Startup.Enabled = st.Value; } catch { } }
                            if (Bool(b, "oldStartupOff") == true) { try { File.Delete(Startup.OldGameHoursBat); } catch { } }
                            e.Response = ToResponse(env, Reply.Json(HoursView()));
                            return;
                        }
                    case "/api/toast":
                        {
                            // Windows notification, only when the app isn't in front of you.
                            string t = Str(b, "title") ?? Title, m = Str(b, "body") ?? "";
                            BeginInvoke(new Action(() =>
                            {
                                if (!Visible || WindowState == FormWindowState.Minimized || Form.ActiveForm == null)
                                    tray.ShowBalloonTip(5000, t, m.Length > 0 ? m : " ", ToolTipIcon.None);
                            }));
                            e.Response = ToResponse(env, Reply.Json(new { ok = true }));
                            return;
                        }
                    case "/api/remote":
                        e.Response = ToResponse(env, Reply.Json(Remote.View()));
                        return;
                    case "/api/remote/setup":
                        {
                            // Talks to GitHub: answer when it's done, without blocking the window.
                            string tok = Str(b, "token") ?? "";
                            var deferral = e.GetDeferral();
                            Task.Run(() => Remote.SetupAsync(tok)).ContinueWith(t =>
                            {
                                string err = t.IsFaulted ? "net" : t.Result;
                                BeginInvoke(new Action(() =>
                                {
                                    e.Response = ToResponse(env, Reply.Json(new { error = err, remote = Remote.View() }));
                                    deferral.Complete();
                                }));
                            });
                            return;
                        }
                    case "/api/remote/off":
                        Remote.Off();
                        e.Response = ToResponse(env, Reply.Json(Remote.View()));
                        return;
                    case "/api/remote/extra":
                        Remote.SetExtra(body);
                        e.Response = ToResponse(env, Reply.Json(new { ok = true }));
                        return;
                    case "/api/mini":
                        OnUi(e, () =>
                        {
                            if (Bool(b, "on") == false) { if (mini != null && !mini.IsDisposed) mini.Close(); }
                            else
                            {
                                if (mini == null || mini.IsDisposed) mini = new MiniForm();
                                mini.Show();
                                mini.Activate();
                            }
                            return Reply.Json(new { ok = true });
                        });
                        return;
                }
                if (path.StartsWith("/api/logo/", StringComparison.Ordinal))
                {
                    var png = Program.Tracker.Logo(path.Substring(10));
                    e.Response = ToResponse(env, png == null ? Reply.Error(404, "no logo") : new Reply { Type = "image/png", Body = png });
                    return;
                }
                if (path.StartsWith("/api/", StringComparison.Ordinal))
                {
                    e.Response = ToResponse(env, Program.Backend.Handle(path, method, body));
                    return;
                }
                e.Response = ToResponse(env, Static(path));
            }
            catch (Exception ex)
            {
                e.Response = ToResponse(env, Reply.Error(500, ex.Message));
            }
        }

        static void OpenExternal(string uri)
        {
            if (uri == null || !(uri.StartsWith("https://", StringComparison.OrdinalIgnoreCase) || uri.StartsWith("http://", StringComparison.OrdinalIgnoreCase))) return;
            try { Process.Start(new ProcessStartInfo(uri) { UseShellExecute = true }); } catch { }
        }

        static Reply Static(string path)
        {
            string name = path.TrimStart('/');
            if (name.Length == 0) name = "index.html";
            byte[] data = Backend.Resource("web/" + name);
            if (data == null) return Reply.Error(404, "not found");
            string type = "application/octet-stream";
            switch (Path.GetExtension(name).ToLowerInvariant())
            {
                case ".html": type = "text/html; charset=utf-8"; break;
                case ".js": type = "text/javascript; charset=utf-8"; break;
                case ".css": type = "text/css; charset=utf-8"; break;
                case ".json": type = "application/json; charset=utf-8"; break;
                case ".svg": type = "image/svg+xml"; break;
                case ".png": type = "image/png"; break;
            }
            return new Reply { Type = type, Body = data };
        }

        static CoreWebView2WebResourceResponse ToResponse(CoreWebView2Environment env, Reply r)
        {
            string reason = r.Status == 200 ? "OK" : "Error";
            string headers = "Content-Type: " + r.Type + "\r\nCache-Control: no-store";
            return env.CreateWebResourceResponse(new MemoryStream(r.Body ?? new byte[0]), r.Status, reason, headers);
        }

        string PickFolder()
        {
            using (var dlg = new FolderBrowserDialog())
            {
                dlg.Description = "اختر مجلد ملفات التخزين (save)";
                dlg.UseDescriptionForTitle = true;
                dlg.ShowNewFolderButton = false;
                return dlg.ShowDialog(this) == DialogResult.OK ? dlg.SelectedPath : null;
            }
        }
    }

    // Small always-on-top window with your % and current area, to keep next to the game.
    sealed class MiniForm : Form
    {
        readonly WebView2 web;

        public MiniForm()
        {
            Text = "100% it";
            BackColor = MainForm.Bg;
            TopMost = true;
            ShowInTaskbar = false;
            FormBorderStyle = FormBorderStyle.SizableToolWindow;
            StartPosition = FormStartPosition.Manual;
            Size = new Size(340, 190);
            MinimumSize = new Size(260, 150);
            var wa = Screen.PrimaryScreen.WorkingArea;
            Location = new Point(wa.Right - Width - 16, wa.Top + 16);
            if (MainForm.AppIcon != null) Icon = MainForm.AppIcon;
            web = new WebView2 { Dock = DockStyle.Fill, DefaultBackgroundColor = MainForm.Bg };
            Controls.Add(web);
            Load += async (s, e) =>
            {
                await web.EnsureCoreWebView2Async(MainForm.Env);
                MainForm.Setup(web.CoreWebView2);
                web.CoreWebView2.Navigate(MainForm.Host + "/index.html?mini=1");
            };
        }

        protected override void OnHandleCreated(EventArgs e)
        {
            base.OnHandleCreated(e);
            Native.DarkTitleBar(Handle);
        }
    }
}
