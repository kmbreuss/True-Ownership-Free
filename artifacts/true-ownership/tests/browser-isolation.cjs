const http = require("node:http");
const assert = require("node:assert/strict");
const isData = pathname => /\/api\/userdata(?:\/|$)/.test(pathname);
const mutates = method => !["GET", "HEAD", "OPTIONS"].includes(method);
async function installIsolation(context, writes, unexpected) {
  await context.route("**/*", async route => {
    const request = route.request(), pathname = new URL(request.url()).pathname;
    if (isData(pathname)) {
      if (mutates(request.method())) {
        writes.push({ method: request.method(), path: pathname,
          preview: new URL(request.frame().url()).searchParams.has("preview") });
        return route.fulfill({ json: { ok: true } });
      }
      return route.fulfill({ json: { intake: { name: "Synthetic preview" }, phase: "a1" } });
    }
    if (pathname === "/api/auth/me") return route.fulfill({ json: { user: {
      id: "00000000-0000-4000-8000-000000000001", email: "fixture@example.invalid",
      firstName: "Synthetic", lastName: "Preview", role: "member",
    } } });
    if (mutates(request.method())) {
      unexpected.push(`${request.method()} ${pathname}`);
      return route.abort("blockedbyclient");
    }
    return route.continue();
  });
}
async function proveIsolation(browser) {
  let escaped = 0;
  const server = http.createServer((req, res) => {
    if (mutates(req.method)) escaped++;
    res.setHeader("Content-Type", "text/html"); res.end("<title>Disposable isolation proof</title>");
  });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const context = await browser.newContext({ serviceWorkers: "block" });
  const writes = [], unexpected = [];
  try {
    await installIsolation(context, writes, unexpected);
    const page = await context.newPage();
    await page.goto(`http://127.0.0.1:${server.address().port}`);
    const keys = ["", "/rcstate", "/setaside", "/a1progress", "/a2state", "/a3state", "/a4state", "/a5state", "/m4state", "/map", "/intake"];
    await page.evaluate(async keys => {
      for (const suffix of keys) for (const method of ["POST", "PUT", "PATCH", "DELETE"]) {
        const res = await fetch(`/api/userdata${suffix}`, { method, body: "{}" });
        if (!res.ok) throw new Error("Isolation probe was not fulfilled");
      }
    }, keys);
    assert.equal(writes.length, 44);
    assert.equal(escaped, 0);
    assert.deepEqual(unexpected, []);
    console.log("ISOLATION PROVED: 44/44 userdata mutations intercepted; 0 reached disposable server; no real account used.");
  } finally {
    await context.close();
    await new Promise(resolve => server.close(resolve));
  }
}
module.exports = { installIsolation, proveIsolation };
