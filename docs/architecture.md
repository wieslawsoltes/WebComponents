# Architecture and design notes

## Render the content, hydrate the experiment

Navigation, catalog cards, component explanations, installation snippets, compatibility notes and guides are pre-rendered. Native browser modules enhance search, filtering, copy actions and theme selection. Search uses a generated local JSON index; it has no service dependency. The page remains readable when scripts are disabled.

The only substantial island is `wc-playground`. An IntersectionObserver imports the CodeMirror island only near the viewport. On mount it fetches its component's preset JSON and the small shared runtime manifest. A fresh iframe imports only the modules named by that preset. The landing page never requests native WASM, editor bundles or component packages.

## A single executable source of truth

`content/samples.mjs` contains the actual JavaScript, HTML and CSS used by each preset. The same JavaScript is rendered into the usage guides. Build-time JavaScript parsing catches malformed example strings before deployment. Browser tests exercise public APIs from locked npm versions rather than source-tree mocks.

Every npm entry point is bundled in one esbuild graph with splitting enabled. This is important for APIs such as GridWeb core and controls, or ReactiveWeb core and HTML bindings: their model classes retain shared identity instead of being duplicated in separately bundled files.

## Origin and lifecycle boundaries

Each run replaces its frame rather than evaluating code in the site document. The opaque-origin frame cannot read parent DOM, local storage, cookies or sibling frames. A per-run random ID rejects stale messages. Logs are size/count limited and inserted with `textContent`.

The host keeps only the source editor, deliberate local drafts, theme choice and a generated import map. Production application examples document explicit disposal; replacing a whole iframe is not presented as the normal lifecycle pattern for a retained application view.

## Visual vocabulary

The layout uses charcoal surfaces, restrained borders, large editorial headings and a pale-lime primary accent. Each library introduces its own accent and custom SVG motif without replacing the shared navigation, documentation hierarchy or playground controls. The light theme uses darker text accents for readability. Illustrations are original abstractions, clearly distinct from actual rendered library controls.

Responsive breakpoints move catalogs from three to two to one column and the editor from a horizontal split to a stacked layout. Mobile navigation, language tabs, search, resize controls, inputs and preview controls are keyboard-operable. Reduced-motion preferences suppress decorative motion. No external fonts, image assets or analytics are required.

## Deployment

`SITE_BASE` validates and controls all static paths. GitHub project Pages use `/WebComponents/`; domain-root hosting uses `/`. `preview.mjs` matches these routes and serves native WASM as `application/wasm`, with CORS for sandboxed module imports. The build emits nested `index.html` files, canonical metadata, a sitemap, robots.txt, a custom 404 and package/source version evidence.

CI builds, checks static integrity and runs Chromium before deploying the official Pages artifact. The published smoke script validates routes, manifests and MIME/CORS behavior. Native hardware WebGPU is not part of this showcase's qualification claim.
