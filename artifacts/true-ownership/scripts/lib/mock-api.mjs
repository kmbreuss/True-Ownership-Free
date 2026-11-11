// Local-only API stand-in so the free course can be walked on a Mac with no database.
// It never talks to a server: Playwright answers /api/** from memory, for one synthetic account.
export const MOCK_USER = { id: "mock-account-1", email: "mock-reader@example.invalid", role: "client", firstName: "Test Reader" };
export async function installMockApi(context, seed = {}) {
  const data = { ...(seed.userdata ?? {}) };
  const account = { firstName: "Test Reader", consent: false, waitlistedAt: null, ...(seed.account ?? {}) };
  const log = [];
  const json = (route, body, status = 200) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
  await context.route("**/api/**", async route => {
    const request = route.request(), url = new URL(request.url()), p = url.pathname.replace(/^.*\/api/, ""), m = request.method();
    log.push(`${m} ${p}`);
    if (p === "/auth/me") return json(route, { user: MOCK_USER });
    if (p === "/auth/logout") return json(route, { ok: true });
    if (p === "/userdata" && m === "GET") return json(route, data);
    if (p.startsWith("/userdata/") && m === "PUT") {
      const key = p.split("/")[2], body = request.postDataJSON();
      data[key] = body.value; return json(route, { ok: true });
    }
    if (p === "/free/account" && m === "GET") return json(route, account);
    if (p === "/free/account" && m === "PATCH") { Object.assign(account, request.postDataJSON()); return json(route, account); }
    if (p === "/free/waitlist" && m === "POST") {
      if (!data.rcstate?.v?.complete) return json(route, { error: "Finish the Reality Check first." }, 409);
      account.waitlistedAt ??= new Date().toISOString(); return json(route, account);
    }
    return json(route, { error: `Not mocked: ${m} ${p}` }, 404);
  });
  return { data, account, log };
}
