import SwiftUI
import WebKit
import WidgetKit
import VisionKit

@main
struct HundredItApp: App {
    @State private var gist = Shared.gistID
    @Environment(\.scenePhase) private var phase

    var body: some Scene {
        WindowGroup {
            Group {
                if gist.isEmpty {
                    SetupView { id in save(id) }
                } else {
                    PageView(gist: gist, onReset: { save("") })
                        .ignoresSafeArea()
                }
            }
            .background(Color(red: 13 / 255, green: 24 / 255, blue: 19 / 255).ignoresSafeArea())
            .preferredColorScheme(.dark)
            // hundredit://open?g=<id> (from the phone page in Safari) and hundredit://reset
            .onOpenURL { url in
                if url.host == "reset" { save("") }
                else if let id = Shared.gistID(from: url.absoluteString) { save(id) }
            }
        }
        .onChange(of: phase) { _, p in
            if p == .active || p == .background { WidgetCenter.shared.reloadAllTimelines() }
        }
    }

    private func save(_ id: String) {
        Shared.gistID = id
        gist = id
        WidgetCenter.shared.reloadAllTimelines()
    }
}

// ---------- first run: get the link ----------

struct SetupView: View {
    var done: (String) -> Void
    @State private var text = ""
    @State private var scanning = false
    @State private var error = false
    private let gold = Color(red: 242 / 255, green: 197 / 255, blue: 92 / 255)

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                Image(systemName: "checkmark.circle")
                    .font(.system(size: 64, weight: .semibold))
                    .foregroundStyle(gold)
                    .padding(.top, 40)
                Text("100% it").font(.largeTitle.bold())
                Text("افتح الإعدادات في البرنامج على الكمبيوتر، وروح لقسم «تقدمك في الجوال»، وصوّر الكود أو الصق الرابط هنا.")
                    .multilineTextAlignment(.center)
                    .foregroundStyle(.secondary)

                if DataScannerViewController.isSupported {
                    Button { scanning = true } label: {
                        Label("صوّر الكود", systemImage: "qrcode.viewfinder").frame(maxWidth: .infinity).padding(.vertical, 6)
                    }
                    .buttonStyle(.borderedProminent).tint(gold).foregroundStyle(.black)
                }
                Button {
                    if let s = UIPasteboard.general.string { use(s) }
                } label: {
                    Label("الصق الرابط", systemImage: "doc.on.clipboard").frame(maxWidth: .infinity).padding(.vertical, 6)
                }
                .buttonStyle(.bordered)

                HStack {
                    TextField("https://weelr.github.io/100-it/?g=…", text: $text)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                        .environment(\.layoutDirection, .leftToRight)
                        .textFieldStyle(.roundedBorder)
                    Button("تم") { use(text) }.buttonStyle(.bordered)
                }
                if error {
                    Text("ما لقيت رابط صحيح. تأكد إنك نسخت الرابط كامل.").foregroundStyle(.red).font(.footnote)
                }
            }
            .padding(24)
        }
        .environment(\.layoutDirection, .rightToLeft)
        .sheet(isPresented: $scanning) {
            QRScanner { s in
                scanning = false
                use(s)
            }
            .ignoresSafeArea()
        }
    }

    private func use(_ s: String) {
        if let id = Shared.gistID(from: s) { done(id) } else { error = true }
    }
}

struct QRScanner: UIViewControllerRepresentable {
    var found: (String) -> Void

    func makeUIViewController(context: Context) -> DataScannerViewController {
        let vc = DataScannerViewController(recognizedDataTypes: [.barcode(symbologies: [.qr])], isHighlightingEnabled: true)
        vc.delegate = context.coordinator
        try? vc.startScanning()
        return vc
    }
    func updateUIViewController(_ vc: DataScannerViewController, context: Context) {}
    func makeCoordinator() -> Coordinator { Coordinator(found: found) }

    final class Coordinator: NSObject, DataScannerViewControllerDelegate {
        let found: (String) -> Void
        var done = false
        init(found: @escaping (String) -> Void) { self.found = found }
        func dataScanner(_ s: DataScannerViewController, didAdd items: [RecognizedItem], allItems: [RecognizedItem]) {
            for item in items {
                if case .barcode(let b) = item, let v = b.payloadStringValue, Shared.gistID(from: v) != nil, !done {
                    done = true
                    s.stopScanning()
                    found(v)
                }
            }
        }
    }
}

// ---------- the phone page ----------

struct PageView: UIViewRepresentable {
    var gist: String
    var onReset: () -> Void

    func makeCoordinator() -> Coordinator { Coordinator(onReset: onReset) }

    func makeUIView(context: Context) -> WKWebView {
        let cfg = WKWebViewConfiguration()
        cfg.applicationNameForUserAgent = "HundredItApp"
        cfg.websiteDataStore = .default()
        let web = WKWebView(frame: .zero, configuration: cfg)
        web.isOpaque = false
        web.backgroundColor = UIColor(red: 13 / 255, green: 24 / 255, blue: 19 / 255, alpha: 1)
        web.scrollView.backgroundColor = web.backgroundColor
        web.scrollView.contentInsetAdjustmentBehavior = .never
        web.allowsBackForwardNavigationGestures = false
        web.navigationDelegate = context.coordinator
        web.uiDelegate = context.coordinator
        let refresh = UIRefreshControl()
        refresh.tintColor = .white
        refresh.addTarget(context.coordinator, action: #selector(Coordinator.pull(_:)), for: .valueChanged)
        web.scrollView.refreshControl = refresh
        context.coordinator.web = web
        load(web)
        // Back from the background: refresh the page.
        NotificationCenter.default.addObserver(context.coordinator, selector: #selector(Coordinator.foreground),
                                               name: UIApplication.willEnterForegroundNotification, object: nil)
        return web
    }

    func updateUIView(_ web: WKWebView, context: Context) {
        if context.coordinator.loaded != gist { load(web) }
    }

    private func load(_ web: WKWebView) {
        web.load(URLRequest(url: URL(string: "\(Shared.page)?g=\(gist)&app=1")!))
        (web.navigationDelegate as? Coordinator)?.loaded = gist
    }

    final class Coordinator: NSObject, WKNavigationDelegate, WKUIDelegate {
        let onReset: () -> Void
        weak var web: WKWebView?
        var loaded = ""
        init(onReset: @escaping () -> Void) { self.onReset = onReset }

        @objc func pull(_ c: UIRefreshControl) {
            web?.reload()
            DispatchQueue.main.asyncAfter(deadline: .now() + 1) { c.endRefreshing() }
        }
        @objc func foreground() {
            web?.evaluateJavaScript("window.REMOTE && window.REMOTE.refresh().then(() => { lastSig = ''; refresh(); })")
        }

        // Our page stays inside; YouTube and other links open outside.
        func webView(_ webView: WKWebView, decidePolicyFor action: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
            guard let url = action.request.url else { return decisionHandler(.allow) }
            if url.scheme == "hundredit" {
                if url.host == "reset" { onReset() }
                return decisionHandler(.cancel)
            }
            if url.host == "weelr.github.io" || url.scheme == "about" || url.scheme == "data" || url.scheme == "blob" {
                return decisionHandler(.allow)
            }
            if action.targetFrame?.isMainFrame ?? true {
                UIApplication.shared.open(url)
                return decisionHandler(.cancel)
            }
            decisionHandler(.allow)
        }

        func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration,
                     for action: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
            if let url = action.request.url { UIApplication.shared.open(url) }
            return nil
        }

        // confirm() in the page (e.g. "turn off?") as a native alert.
        func webView(_ webView: WKWebView, runJavaScriptConfirmPanelWithMessage message: String,
                     initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping (Bool) -> Void) {
            let a = UIAlertController(title: nil, message: message, preferredStyle: .alert)
            a.addAction(UIAlertAction(title: "إلغاء", style: .cancel) { _ in completionHandler(false) })
            a.addAction(UIAlertAction(title: "تم", style: .default) { _ in completionHandler(true) })
            top()?.present(a, animated: true) ?? completionHandler(false)
        }

        private func top() -> UIViewController? {
            let scene = UIApplication.shared.connectedScenes.first as? UIWindowScene
            var vc = scene?.windows.first?.rootViewController
            while let p = vc?.presentedViewController { vc = p }
            return vc
        }
    }
}
