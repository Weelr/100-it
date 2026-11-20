"""Writes the AltStore source (altstore.json) for the build.
Usage: altstore_source.py <n> <release tag> <ipa path> [build number]"""
import datetime, json, os, sys

n, tag, ipa = sys.argv[1], sys.argv[2], sys.argv[3]
build = sys.argv[4] if len(sys.argv) > 4 else n
repo = "https://github.com/Weelr/100-it"
icon = "https://weelr.github.io/100-it/apple-touch-icon.png"
gold = "#F2C55C"
print(json.dumps({
    "name": "100% it",
    "identifier": "com.weelr.hundredit.source",
    "subtitle": "Ocarina of Time completion tracker",
    "description": "Your 100% progress in Zelda: Ocarina of Time, from the 100% it app on your PC.",
    "iconURL": icon,
    "website": repo,
    "tintColor": gold,
    "apps": [{
        "name": "100% it",
        "bundleIdentifier": "com.weelr.hundredit",
        "developerName": "Weelr",
        "subtitle": "تتبع إكمالك في Ocarina of Time",
        "localizedDescription": "نسبة إكمالك، والمناطق، والأغراض، وساعات لعبك، من برنامج 100% it على الكمبيوتر. وفيه ويدجت للشاشة الرئيسية وشاشة القفل.",
        "iconURL": icon,
        "tintColor": gold,
        "category": "utilities",
        "screenshotURLs": [],
        "versions": [{
            "version": f"1.{n}",
            "buildVersion": build,
            "date": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "localizedDescription": "تحديث جديد لتطبيق 100% it.",  # shown in AltStore
            # Only the latest release is kept, so point at it rather than at a tag.
            "downloadURL": f"{repo}/releases/latest/download/100it.ipa",
            "size": os.path.getsize(ipa),
            "minOSVersion": "17.0",
        }],
        "appPermissions": {
            "entitlements": ["com.apple.security.application-groups"],
            "privacy": {"NSCameraUsageDescription": "To scan the QR code from 100% it on your computer."},
        },
    }],
    "news": [],
}, ensure_ascii=False, indent=2))
