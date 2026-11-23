import WidgetKit
import SwiftUI

// Home-screen and lock-screen widget: your overall % and where you are.

// Three widgets in the gallery (swipe between them when adding):
// everything, Young Link only, Adult Link only. ("Edit Widget" options don't
// show up for apps installed with AltStore, so each choice is its own widget.)
enum AgeChoice: String {
    case both, child, adult
}

struct Entry: TimelineEntry {
    let date: Date
    let summary: Summary?
    let noLink: Bool
    var age: AgeChoice = .both
}

struct Provider: TimelineProvider {
    let age: AgeChoice

    func placeholder(in context: Context) -> Entry { Entry(date: .now, summary: .sample, noLink: false, age: age) }

    func getSnapshot(in context: Context, completion: @escaping (Entry) -> Void) {
        completion(Entry(date: .now, summary: ProgressAPI.cached ?? .sample, noLink: false, age: age))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> Void) {
        let id = Shared.gistID
        let next = Date().addingTimeInterval(20 * 60)
        let age = self.age
        guard !id.isEmpty else {
            return completion(Timeline(entries: [Entry(date: .now, summary: nil, noLink: true, age: age)], policy: .after(next)))
        }
        Task {
            var s = ProgressAPI.cached
            if let fresh = try? await ProgressAPI.fetch(id) {
                s = fresh
                ProgressAPI.cached = fresh
            }
            completion(Timeline(entries: [Entry(date: .now, summary: s, noLink: false, age: age)], policy: .after(next)))
        }
    }
}

private let bg = Color(red: 13 / 255, green: 24 / 255, blue: 19 / 255)
private let gold = Color(red: 242 / 255, green: 197 / 255, blue: 92 / 255)
private let green = Color(red: 95 / 255, green: 211 / 255, blue: 141 / 255)
private let muted = Color(red: 157 / 255, green: 179 / 255, blue: 165 / 255)

struct Ring: View {
    var p: Double
    var width: CGFloat
    var body: some View {
        ZStack {
            Circle().stroke(Color.white.opacity(0.1), lineWidth: width)
            Circle().trim(from: 0, to: max(0.001, min(1, p)))
                .stroke(p >= 1 ? green : gold, style: StrokeStyle(lineWidth: width, lineCap: .round))
                .rotationEffect(.degrees(-90))
        }
    }
}

struct WidgetView: View {
    @Environment(\.widgetFamily) var family
    var entry: Entry

    var body: some View {
        content
            .environment(\.layoutDirection, .rightToLeft)
            .containerBackground(for: .widget) { family.isAccessory ? Color.clear : bg }
            .widgetURL(URL(string: "hundredit://home"))
    }

    private var ageKey: String { entry.age.rawValue }
    private var ageLabel: String? {
        switch entry.age { case .child: return "لينك الصغير"; case .adult: return "لينك الكبير"; case .both: return nil }
    }

    @ViewBuilder var content: some View {
        if let s = entry.summary, s.stats(ageKey) == nil {
            VStack(spacing: 6) {
                Image(systemName: "arrow.down.circle").font(.title2).foregroundStyle(gold)
                Text("حدّث برنامج 100% it على الكمبيوتر عشان تطلع أرقام \(ageLabel ?? "")")
                    .font(.caption).multilineTextAlignment(.center).foregroundStyle(muted)
            }
        } else if let s = entry.summary {
            switch family {
            case .accessoryCircular: circular(s)
            case .accessoryRectangular: rectangular(s)
            case .accessoryInline: Text("100% it · \(pct(s.stats(ageKey)!.pct))%")
            case .systemMedium: medium(s)
            default: small(s)
            }
        } else {
            VStack(spacing: 6) {
                Image(systemName: "link").font(.title2).foregroundStyle(gold)
                Text(entry.noLink ? "افتح التطبيق واربطه" : "ما فيه بيانات للحين")
                    .font(.caption).multilineTextAlignment(.center).foregroundStyle(muted)
            }
        }
    }

    private func pct(_ p: Double) -> Int { Int((p * 100).rounded(.down)) }

    private func ringWithText(_ s: Summary, size: CGFloat, width: CGFloat, font: CGFloat) -> some View {
        let p = s.stats(ageKey)!.pct
        return ZStack {
            Ring(p: p, width: width)
            HStack(alignment: .firstTextBaseline, spacing: 1) {
                Text("\(pct(p))").font(.system(size: font, weight: .heavy, design: .rounded))
                Text("%").font(.system(size: font * 0.45, weight: .bold)).foregroundStyle(muted)
            }
            .environment(\.layoutDirection, .leftToRight)
            .foregroundStyle(.white)
        }
        .frame(width: size, height: size)
    }

    private func small(_ s: Summary) -> some View {
        let st = s.stats(ageKey)!
        return VStack(alignment: .leading, spacing: 6) {
            ringWithText(s, size: ageLabel == nil ? 82 : 74, width: 9, font: 26)
                .frame(maxWidth: .infinity)
            if let l = ageLabel {
                Text(l).font(.system(size: 11, weight: .semibold)).foregroundStyle(gold).frame(maxWidth: .infinity)
            }
            if let a = s.area, let ap = st.ap {
                VStack(alignment: .leading, spacing: 3) {
                    Text(a.ar).font(.system(size: 13, weight: .bold)).foregroundStyle(.white).lineLimit(1)
                    bar(ap)
                }
            }
        }
    }

    private func bar(_ p: Double) -> some View {
        GeometryReader { g in
            ZStack(alignment: .leading) {
                Capsule().fill(Color.white.opacity(0.1))
                Capsule().fill(p >= 1 ? green : gold).frame(width: max(4, g.size.width * min(1, p)))
            }
        }
        .frame(height: 5)
        .environment(\.layoutDirection, .rightToLeft)
    }

    private func stat(_ icon: String, _ color: Color, _ v: String) -> some View {
        HStack(spacing: 5) {
            Image(systemName: icon).foregroundStyle(color).font(.system(size: 12, weight: .bold))
            Text(v).font(.system(size: 13, weight: .bold, design: .rounded)).foregroundStyle(.white)
                .environment(\.layoutDirection, .leftToRight)
        }
    }

    private func medium(_ s: Summary) -> some View {
        let st = s.stats(ageKey)!
        return HStack(spacing: 16) {
            VStack(spacing: 4) {
                ringWithText(s, size: ageLabel == nil ? 104 : 94, width: 11, font: 32)
                if let l = ageLabel { Text(l).font(.system(size: 11, weight: .semibold)).foregroundStyle(gold) }
            }
            VStack(alignment: .leading, spacing: 8) {
                if let a = s.area, let ap = st.ap {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("أنت في").font(.system(size: 11)).foregroundStyle(muted)
                        HStack {
                            Text(a.ar).font(.system(size: 15, weight: .bold)).foregroundStyle(.white).lineLimit(1)
                            Spacer(minLength: 4)
                            Text("\(pct(ap))%").font(.system(size: 12, weight: .bold)).foregroundStyle(ap >= 1 ? green : gold)
                        }
                        bar(ap)
                    }
                }
                // Only what the chosen Link can get (hearts are shared, so only on "all").
                Grid(alignment: .leading, horizontalSpacing: 12, verticalSpacing: 5) {
                    GridRow {
                        stat("ant.fill", gold, "\(st.gs[safe: 0] ?? 0)/\(st.gs[safe: 1] ?? 100)")
                        stat("heart.fill", Color(red: 1, green: 0.48, blue: 0.48), "\(st.poh[safe: 0] ?? 0)/\(st.poh[safe: 1] ?? 36)")
                    }
                    GridRow {
                        if let ft = st.ft { stat("sparkle", Color(red: 0.42, green: 0.78, blue: 1), "\(ft[safe: 0] ?? 0)/\(ft[safe: 1] ?? 0)") }
                        if entry.age == .both { stat("suit.heart.fill", Color(red: 1, green: 0.36, blue: 0.42), "\(s.hearts)/20") }
                    }
                }
                Text(s.savedDate, style: .relative).font(.system(size: 10)).foregroundStyle(muted).lineLimit(1)
            }
        }
    }

    private func circular(_ s: Summary) -> some View {
        let p = s.stats(ageKey)!.pct
        return Gauge(value: min(1, p)) {
            Text("100")
        } currentValueLabel: {
            Text("\(pct(p))%").font(.system(size: 13, weight: .bold))
        }
        .gaugeStyle(.accessoryCircularCapacity)
    }

    private func rectangular(_ s: Summary) -> some View {
        let st = s.stats(ageKey)!
        return VStack(alignment: .leading, spacing: 2) {
            Text("\(ageLabel ?? "100% it") · \(pct(st.pct))%").font(.headline).lineLimit(1)
            if let a = s.area, let ap = st.ap { Text("\(a.ar) \(pct(ap))%").font(.caption).lineLimit(1) }
            Gauge(value: min(1, st.pct)) { EmptyView() }.gaugeStyle(.accessoryLinearCapacity)
        }
    }
}

extension WidgetFamily {
    var isAccessory: Bool { self == .accessoryCircular || self == .accessoryRectangular || self == .accessoryInline }
}

extension Array {
    subscript(safe i: Int) -> Element? { indices.contains(i) ? self[i] : nil }
}

private let families: [WidgetFamily] = [.systemSmall, .systemMedium, .accessoryCircular, .accessoryRectangular, .accessoryInline]

struct AllWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "progress", provider: Provider(age: .both)) { WidgetView(entry: $0) }
            .configurationDisplayName("100% it · الكل")
            .description("نسبة إكمالك الكاملة والمنطقة اللي أنت فيها")
            .supportedFamilies(families)
    }
}

struct ChildWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "progress.child", provider: Provider(age: .child)) { WidgetView(entry: $0) }
            .configurationDisplayName("100% it · لينك الصغير")
            .description("نسبة إكمالك للينك الصغير بس")
            .supportedFamilies(families)
    }
}

struct AdultWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "progress.adult", provider: Provider(age: .adult)) { WidgetView(entry: $0) }
            .configurationDisplayName("100% it · لينك الكبير")
            .description("نسبة إكمالك للينك الكبير بس")
            .supportedFamilies(families)
    }
}

@main
struct HundredItWidgets: WidgetBundle {
    var body: some Widget {
        AllWidget()
        ChildWidget()
        AdultWidget()
    }
}
