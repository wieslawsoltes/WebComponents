/** Verify the deployed source revision, routes, and sandbox/native asset headers. */
const base = (process.argv[2] || 'https://wieslawsoltes.github.io/WebComponents/').replace(/\/?$/, '/');
const expectedCommit = process.env.GITHUB_SHA;
const paths = ['', 'components/', 'guides/', 'playgrounds/', 'components/dockyard/playground/', 'components/treedatagridweb/usage/', 'components/skiasharpweb/installation/', 'components/drawingweb/playground/', 'runtime-manifest.json', 'build-info.json', 'skia/canvaskit.wasm'];
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
async function verify(path, method = 'GET', validate = () => {}) {
  const url = new URL(path, base);
  let lastError;
  for (let attempt = 0; attempt < 12; attempt++) {
    try {
      const response = await fetch(url, { method, cache: 'no-cache', signal: AbortSignal.timeout(30000) });
      if (!response.ok) throw new Error(`${response.status} ${url.href}`);
      await validate(response.clone());
      console.log('OK', response.status, path || '/');
      return response;
    } catch (error) {
      lastError = error;
      if (attempt < 11) await pause(5000);
    }
  }
  throw lastError;
}
try {
  await verify('build-info.json', 'GET', async response => {
    const info = await response.json();
    if (expectedCommit && info.sourceCommit !== expectedCommit) throw new Error(`Stale deployment: ${info.sourceCommit}; expected ${expectedCommit}`);
    if (info.routes !== 57) throw new Error(`Unexpected route count: ${info.routes}`);
    console.log('Published source:', info.sourceCommit, 'Routes:', info.routes);
  });
  for (const path of paths.filter(p => p !== 'build-info.json')) {
    const wasm = path.endsWith('.wasm');
    const response = await verify(path, wasm ? 'HEAD' : 'GET', r => {
      if (wasm && !r.headers.get('content-type')?.includes('application/wasm')) throw new Error('Unexpected WASM MIME type');
    });
    if (path === 'runtime-manifest.json') {
      const manifest = await response.json();
      for (const specifier of ['@wieslawsoltes/rbushweb', '@wieslawsoltes/skiasharpweb/browser']) {
        if (!manifest.imports[specifier]) throw new Error(`Missing runtime: ${specifier}`);
        await verify(manifest.imports[specifier], 'HEAD', r => {
          if (r.headers.get('access-control-allow-origin') !== '*') throw new Error(`Sandbox CORS failure: ${specifier}`);
        });
      }
    }
  }
} catch (error) {
  console.error('Published-site verification failed:', error);
  process.exitCode = 1;
}
