# WebComponents

**Small pieces. Extraordinary possibilities.**

An original, responsive showcase for eleven independent web libraries by Wiesław Šoltés.

**Website:** https://wieslawsoltes.github.io/WebComponents/

## Explore

The collection includes Dockyard, TreeDataGridWeb, DynamicDataWeb, RibbonWeb, SkiaSharpWeb, ReactiveWeb, RBushWeb, QuikGraphWeb, RichTextWeb, GridWeb and DrawingWeb. Each component has its own overview, installation page, usage guide and interactive playground, with a distinctive accent and original SVG artwork.

The site generates **57 static pages** and **24 executable presets**. The homepage is a small native-module shell; it does not load the component libraries or CodeMirror. Browser controls, source editing and native graphics load only on component playground pages, when their island enters the viewport.

## Develop

Use Node.js 22.16 or newer.

```sh
npm ci
npm run build
npm run preview
```

Open `http://localhost:4173/WebComponents/`.

```sh
# Build for a domain root instead of GitHub project Pages:
SITE_BASE=/ npm run build
SITE_BASE=/ npm run preview
```

The preview server supports the WASM MIME type and CORS required by unique-origin sandboxes. Serve over HTTP(S), not `file://`.

## Verify

```sh
npm run build
npm test
npx playwright install chromium --with-deps
npm run test:browser
```

The browser suite tests all presets and actual library interactions, navigation/search, responsive layout, no-JavaScript documentation, reactive bindings, formula recalculation, editor state retention, draft restoration, shared-source review and iframe isolation. Set `CHROMIUM_PATH` to test with an existing compatible browser. `TEST_BASE_URL` runs browser checks against a separately hosted build.

GitHub Actions runs the build and tests before uploading a Pages artifact. Deployment uses GitHub's official configure/upload/deploy actions. No CDN runtime dependencies, account backend, tracking pixels or analytics are required.

## Playground

- Editable JavaScript, HTML and CSS, using CodeMirror 6 with syntax highlighting, line numbers, history, language tabs and `Ctrl`/`Command` + `Enter` to run.
- Multiple presets per component, real published npm imports, explicit reset and bounded console output.
- Resizable source/preview split, source toggle, responsive/tablet/phone preview, independent preview theme and fullscreen mode.
- Compressed share links containing source in the URL fragment. Shared code is loaded **for review**, never automatically executed.
- Explicit local draft save/restore/delete, and downloadable HTML experiments that load the site's pinned runtime assets.
- Fresh sandboxed iframe for each run, without `allow-same-origin`; per-run message source/token validation and restricted CSP.

An iframe isolates origin privileges, not CPU or memory consumption. Review shared code before running it. Exported experiments still need network access to this site's package assets. Share fragments can be large; copy/export is preferable for very large experiments. Skia's default example uses the native raster backend, not a claim of hardware-WebGPU qualification.

## Architecture

```text
content/catalog.mjs      Component descriptions, compatibility boundaries, guide metadata
content/samples.mjs      Executable preset sources, also used by generated usage guides
src/templates.mjs        Static page templates and common guides
src/art.mjs              Original per-component SVG illustrations
src/icons.mjs            Shared original icon vocabulary
src/playground.mjs       Lazy CodeMirror island, sandbox, drafts, export and sharing
public/site.css          Responsive design system and playground layout
public/site.js           Theme, local search, catalog filtering, install-command builder
scripts/build.mjs        Deterministic static generation and esbuild runtime bundling
scripts/preview.mjs      Dependency-free local HTTP preview
scripts/check-live.mjs   Published Pages smoke checks and version evidence
tests/                   Static integrity and real-browser integration checks
```

The generator uses native Node ES modules and esbuild rather than requiring a full application framework. All documentation is emitted as HTML and remains readable with JavaScript disabled. Each public npm entry point is bundled into a self-hosted ESM import map; shared chunks preserve model identity across related entry points. The official Skia asset-copy CLI copies and verifies the native loader/WASM and notices. **No font binaries are copied.**

To add a component: add catalog metadata, two or more real-package presets, required npm entry points in `scripts/build.mjs`, a pinned dependency, then extend and run the tests. Do not replace a library with a visual mock. The artwork in the catalog is explicitly illustrative; interactive previews run actual packages.

## Versions and boundaries

`package-lock.json` records the exact published dependencies. Component pages and `build-info.json` identify the versions used by the site. Upstream main branches may contain newer unreleased functionality. In particular, the DrawingWeb demo uses the published `0.1.0-alpha.1` package; it does not imply that every feature on a newer source branch is released.

The libraries are independent adaptations with their own documented compatibility boundaries. This showcase does not claim full behavioral parity with Avalonia, WPF, Office, Visio, ReactiveUI or SkiaSharp. Static hosting does not provide collaboration backends or application databases.

## Licensing

The original site source is MIT licensed. Component packages keep their own licenses: **QuikGraphWeb is MS-PL**; the other listed projects have MIT project licenses, with upstream/native notices where applicable. The build preserves textual license and notice files under `dist/licenses/` and native notices under `dist/skia/`. CodeMirror is MIT; RxJS is Apache-2.0. See `/licenses/` on the built site.

No proprietary UI assets, third-party screenshots or bundled fonts are used in the site design.
