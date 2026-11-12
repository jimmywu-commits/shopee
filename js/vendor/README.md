# Exposure browser dependencies

The exposure editor is independently deployable: keep these files inside this
repository. `browser-loader.js` resolves paths relative to its own script URL,
loads local files first, coalesces concurrent requests, and retries after failure.
Only a local failure invokes the exact-version CDN fallback; ordinary successful
loads do not request the CDN. Cropper waits for both its script and stylesheet.
SheetJS is requested when workorder/banword parsing needs it; Cropper is first-use.
The shared loader also knows Konva, but exposure never calls that entry and does
not redistribute Konva. Its local files are not needed by this editor.

| Asset | Version | Original source | SHA-256 |
| --- | --- | --- | --- |
| Shared loader | 20261111-vendor1 | BODA `JS/vendor/browser-loader.js` (project source) | `fc382bdbd92b7199ca4ecde1218bc39449ba9d816a21eefced6396d8a47f0d3b` |
| SheetJS | 0.18.5 | https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js | `c9506197caf809a075b6dee1da0d36fb19da7158ffe8a88e7b0c96c5d8623c99` |
| CropperJS script | 1.6.2 | https://cdn.jsdelivr.net/npm/cropperjs@1.6.2/dist/cropper.min.js | `6290a3fa581b17ccf4692cf3ec617a74ae65de88d9140c72d492ae9b47707efb` |
| CropperJS stylesheet | 1.6.2 | https://cdn.jsdelivr.net/npm/cropperjs@1.6.2/dist/cropper.min.css | `23679f552ce73499f817de22b5dcdd9e1e5a1e50cd9d77e34bbd31bf65a85186` |
| SheetJS license | 0.18.5 | https://cdn.jsdelivr.net/npm/xlsx@0.18.5/LICENSE | `4d2a38ac35cda06a555c84074a819d413339cd3691b822cae50f8f322fe01f64` |
| CropperJS license | 1.6.2 | https://cdn.jsdelivr.net/npm/cropperjs@1.6.2/LICENSE | `eb917650781dcf06a60b97cba9b05bf583931ec2d311d8a5548a8dca90a57e0f` |

Keep `xlsx-LICENSE.txt` (Apache-2.0) and `cropper-LICENSE.txt` (MIT) beside these
unmodified pinned files. They were copied from BODA's verified `JS/vendor/`
assets on 2026-11-11, including the license texts. Updating requires replacing
the exact artifacts and licenses together and refreshing versions and hashes.

Existing `jszip.min.js` / `JSZip-LICENSE.txt` and `html2canvas.min.js` /
`html2canvas-LICENSE.txt` remain unchanged and are loaded by their export paths.
