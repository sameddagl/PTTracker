// Renders poster.html to 1080×1350 PNGs with WebKit (no browser install needed).
//   swift docs/marketing/instagram/render.swift
// Writes out/post-1.png and out/post-2.png next to this file.
import AppKit
import WebKit

let dir = URL(fileURLWithPath: #filePath).deletingLastPathComponent()
let page = dir.appendingPathComponent("poster.html")
let outDir = dir.appendingPathComponent("out")
try? FileManager.default.createDirectory(at: outDir, withIntermediateDirectories: true)

final class Renderer: NSObject, WKNavigationDelegate {
  let web = WKWebView(frame: NSRect(x: 0, y: 0, width: 540, height: 675))
  var queue = [1, 2]

  func start() {
    web.navigationDelegate = self
    next()
  }

  func next() {
    guard !queue.isEmpty else { NSApp.terminate(nil); return }
    web.loadFileURL(page, allowingReadAccessTo: dir)
  }

  func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
    let n = queue.removeFirst()
    let js = "document.body.classList.toggle('n2', \(n == 2)); document.fonts.ready.then(() => true)"
    webView.evaluateJavaScript(js) { _, _ in
      // Let fonts and images settle before the capture.
      DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
        let config = WKSnapshotConfiguration()
        config.rect = NSRect(x: 0, y: 0, width: 540, height: 675)
        config.snapshotWidth = 540
        webView.takeSnapshot(with: config) { image, error in
          guard let image else { print("snapshot failed:", error ?? "?"); NSApp.terminate(nil); return }
          let rep = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: 1080, pixelsHigh: 1350, bitsPerSample: 8,
                                     samplesPerPixel: 4, hasAlpha: true, isPlanar: false,
                                     colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0)!
          rep.size = NSSize(width: 540, height: 675)
          NSGraphicsContext.saveGraphicsState()
          NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: rep)
          NSGraphicsContext.current?.imageInterpolation = .high
          image.draw(in: NSRect(x: 0, y: 0, width: 540, height: 675))
          NSGraphicsContext.restoreGraphicsState()
          let url = outDir.appendingPathComponent("post-\(n).png")
          try! rep.representation(using: .png, properties: [:])!.write(to: url)
          print("wrote", url.path)
          self.next()
        }
      }
    }
  }
}

let app = NSApplication.shared
app.setActivationPolicy(.prohibited)
let renderer = Renderer()
// A window backs the web view so it lays out at 2× on Retina.
let window = NSWindow(contentRect: NSRect(x: -2000, y: -2000, width: 540, height: 675), styleMask: [.borderless], backing: .buffered, defer: false)
window.contentView = renderer.web
window.orderBack(nil)
renderer.start()
app.run()
