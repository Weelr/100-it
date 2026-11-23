import Foundation

// Shared by the app and the widget: where the gist id is kept, and reading the
// progress the PC app uploads to the gist.
enum Shared {
    static let page = "https://weelr.github.io/100-it/"
    static let fallbackGroup = "group.com.weelr.hundredit"

    // AltStore/SideStore rename app groups (they add your team id) and write the
    // real names into Info.plist as ALTAppGroups. The widget also looks at the
    // app's Info.plist (two folders up from the widget).
    static var groupIDs: [String] {
        var ids: [String] = []
        if let g = Bundle.main.object(forInfoDictionaryKey: "ALTAppGroups") as? [String] { ids += g }
        let appPlist = Bundle.main.bundleURL.deletingLastPathComponent().deletingLastPathComponent().appendingPathComponent("Info.plist")
        if let d = NSDictionary(contentsOf: appPlist), let g = d["ALTAppGroups"] as? [String] { ids += g }
        ids.append(fallbackGroup)
        var seen = Set<String>()
        return ids.filter { seen.insert($0).inserted }
    }

    static var defaults: UserDefaults {
        for id in groupIDs {
            if FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: id) != nil,
               let d = UserDefaults(suiteName: id) { return d }
        }
        return .standard
    }

    static var gistID: String {
        get { defaults.string(forKey: "gist") ?? UserDefaults.standard.string(forKey: "gist") ?? "" }
        set {
            defaults.set(newValue, forKey: "gist")
            UserDefaults.standard.set(newValue, forKey: "gist")
        }
    }

    // Finds the gist id in a link, a QR code's text, or the bare id.
    static func gistID(from text: String) -> String? {
        let t = text.trimmingCharacters(in: .whitespacesAndNewlines)
        if let comps = URLComponents(string: t), let g = comps.queryItems?.first(where: { $0.name == "g" })?.value, isID(g) { return g }
        if isID(t) { return t }
        if let r = t.range(of: "[0-9a-fA-F]{20,40}", options: .regularExpression) { return String(t[r]) }
        return nil
    }

    static func isID(_ s: String) -> Bool {
        s.count >= 20 && s.count <= 40 && s.allSatisfy { $0.isHexDigit }
    }
}

// What the widget shows (sent by the PC app as extra.summary).
struct Summary: Codable {
    struct Area: Codable { var ar: String; var en: String; var p: Double }
    struct AgeStats: Codable { var pct: Double; var gs: [Int]; var poh: [Int]; var ft: [Int]?; var ap: Double? }
    var t: Double
    var pct: Double
    var gs: [Int]
    var poh: [Int]
    var hearts: Int
    var area: Area?
    var play: Double
    var updated: Double?
    var ft: [Int]?
    var ages: [String: AgeStats]?   // "child" / "adult" (older PC versions don't send it)

    // Numbers for everything, or only what Young / Adult Link can get.
    // nil = the PC app is too old to send them (never show the totals instead).
    func stats(_ age: String) -> AgeStats? {
        if age == "both" { return AgeStats(pct: pct, gs: gs, poh: poh, ft: ft, ap: area?.p) }
        return ages?[age]
    }

    static let sample = Summary(t: 0, pct: 0.42, gs: [41, 100], poh: [15, 36], hearts: 9,
                                area: Area(ar: "قرية كاكاريكو", en: "Kakariko Village", p: 0.6), play: 90000, updated: nil)

    var savedDate: Date { Date(timeIntervalSince1970: t / 1000) }
}

enum ProgressAPI {
    private struct Gist: Decodable {
        struct File: Decodable { var content: String?; var truncated: Bool? }
        var files: [String: File]
    }
    private struct Progress: Decodable {
        struct Extra: Decodable { var summary: Summary? }
        var updated: Double?
        var extra: Extra?
    }

    static func fetch(_ id: String) async throws -> Summary? {
        var req = URLRequest(url: URL(string: "https://api.github.com/gists/\(id)")!)
        req.setValue("application/vnd.github+json", forHTTPHeaderField: "Accept")
        req.cachePolicy = .reloadRevalidatingCacheData
        req.timeoutInterval = 20
        let (data, resp) = try await URLSession.shared.data(for: req)
        guard (resp as? HTTPURLResponse)?.statusCode == 200 else { throw URLError(.badServerResponse) }
        let gist = try JSONDecoder().decode(Gist.self, from: data)
        guard let content = gist.files["progress.json"]?.content, let raw = content.data(using: .utf8) else { return nil }
        let p = try JSONDecoder().decode(Progress.self, from: raw)
        guard var s = p.extra?.summary else { return nil }
        s.updated = p.updated
        return s
    }

    // The last summary we got, so the widget has something when offline.
    static var cached: Summary? {
        get {
            guard let d = Shared.defaults.data(forKey: "summary") else { return nil }
            return try? JSONDecoder().decode(Summary.self, from: d)
        }
        set {
            if let v = newValue, let d = try? JSONEncoder().encode(v) { Shared.defaults.set(d, forKey: "summary") }
        }
    }
}

extension Summary {
    var playText: String {
        let h = Int(play) / 3600, m = (Int(play) % 3600) / 60
        return h > 0 ? "\(h) س \(m) د" : "\(m) د"
    }
}
