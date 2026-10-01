// Renders the Instagram pages to PNGs with WebKit (no browser install needed).
//   swift docs/marketing/instagram/render.swift            # posts and stories
//   swift docs/marketing/instagram/render.swift stories    # only one set
// Each page exposes window.show(n); the frame is captured at 2× into out/.
import AppKit
import WebKit

struct Job { let page: String; let size: NSSize; let frames: [Int]; let name: (Int) -> String }

let jobs: [String: Job] = [
  "poster": Job(page: "poster.html", size: NSSize(width: 540, height: 675), frames: [1, 2], name: { "post-\($0)" }),
  "stories": Job(page: "stories.html", size: NSSize(width: 540, height: 960), frames: Array(0...10),
                 name: { $0 == 0 ? "story-kapak" : String(format: "story-%02d", $0) }),
]
let wanted = CommandLine.arguments.dropFirst()
let queueJobs = (wanted.isEmpty ? ["poster", "stories"] : Array(wanted)).compactMap { jobs[$0] }

let dir = URL(fileURLWithPath: #filePath).deletingLastPathComponent()
let outDir = dir.appendingPathComponent("out")
try? FileManager.default.createDirectory(at: outDir, withIntermediateDirectories: true)

final class Renderer: NSObject, WKNavigationDelegate {
  let web = WKWebView(frame: NSRect(x: 0, y: 0, width: 540, height: 960))
  let window = NSWindow(contentRect: NSRect(x: -3000, y: -3000, width: 540, height: 960), styleMask: [.borderless], backing: .buffered, defer: false)
  var tasks: [(Job, Int)] = []

  func start(_ jobs: [Job]) {
    tasks = jobs.flatMap { job in job.frames.map { (job, $0) } }
    window.contentView = web
    window.orderBack(nil)
    web.navigationDelegate = self
    next()
  }

  func next() {
    guard let (job, _) = tasks.first else { NSApp.terminate(nil); return }
    window.setContentSize(job.size)
    web.frame = NSRect(origin: .zero, size: job.size)
    web.loadFileURL(dir.appendingPathComponent(job.page), allowingReadAccessTo: dir)
  }

  func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
    let (job, n) = tasks.removeFirst()
    webView.evaluateJavaScript("show(\(n)); document.fonts.ready.then(() => true)") { _, _ in
      // Let fonts and images settle before the capture.
      DispatchQueue.main.asyncAfter(deadline: .now() + 1.2) {
        let config = WKSnapshotConfiguration()
        config.rect = NSRect(origin: .zero, size: job.size)
        config.snapshotWidth = NSNumber(value: Double(job.size.width))
        webView.takeSnapshot(with: config) { image, error in
          guard let image else { print("snapshot failed:", error ?? "?"); NSApp.terminate(nil); return }
          let rep = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: Int(job.size.width * 2), pixelsHigh: Int(job.size.height * 2),
                                     bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true, isPlanar: false,
                                     colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0)!
          rep.size = job.size
          NSGraphicsContext.saveGraphicsState()
          NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: rep)
          NSGraphicsContext.current?.imageInterpolation = .high
          image.draw(in: NSRect(origin: .zero, size: job.size))
          NSGraphicsContext.restoreGraphicsState()
          let url = outDir.appendingPathComponent("\(job.name(n)).png")
          try! rep.representation(using: .png, properties: [:])!.write(to: url)
          print("wrote", url.lastPathComponent)
          self.next()
        }
      }
    }
  }
}

let app = NSApplication.shared
app.setActivationPolicy(.prohibited)
let renderer = Renderer()
renderer.start(queueJobs)
app.run()
