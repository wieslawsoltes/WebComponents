# Security

This is a static, public component showcase, not an authentication or collaboration service.

## Editable code

User-authored JavaScript/HTML/CSS is only inserted into an iframe carrying `sandbox="allow-scripts allow-downloads"`. The iframe deliberately does **not** have same-origin access, popup access, top-navigation access, or form submission access. The host verifies the sending frame, opaque origin and a per-run random identifier before accepting bounded log/status messages. Messages cannot write to application state or execute host code.

The frame's CSP permits self-hosted package scripts, blob modules, inline source and native WASM compilation. It permits local data/blob resources but denies arbitrary remote network endpoints. HTML is not advertised as sanitized: it runs in the restricted frame. Arbitrary source can still consume CPU/memory or navigate its own frame. Source that a recipient explicitly exports and opens becomes a standalone document; review it before running.

Shared source is limited in compressed and decompressed size, parsed as data, and never auto-executed. Local drafts are saved and restored only through explicit controls. Restoring a draft stops the current frame and requires Run again.

Do not put secrets, tokens, credentials or confidential documents into a shared playground. Share links include source in their URL fragment. GitHub Pages and the user's browser have their own hosting/history policies.

## Dependency updates

Dependencies and native asset hashes are pinned through the npm lockfile and Skia's copy/verification tool. Review upstream release notes and run static plus browser tests before updating. Retain licenses and notices. The sandbox is not a substitute for dependency review.

Report security problems through the repository's private vulnerability reporting mechanism when available; otherwise contact the maintainer through GitHub without publicly disclosing exploit details first.
