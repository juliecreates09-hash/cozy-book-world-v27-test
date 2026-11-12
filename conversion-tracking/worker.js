// Cloudflare Worker + D1. Aggregated counts only: no visitor identifiers, IPs or cookies.
const EVENTS = new Set(["book_preview_click", "free_sample_click", "amazon_click"]);
const LANGUAGES = new Set(["DE", "EN", "ES"]);
const MAX_BODY = 512;
function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers } });
}
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "";
    const allowed = new Set((env.ALLOWED_ORIGINS || "").split(",").map(x => x.trim()).filter(Boolean));
    const cors = allowed.has(origin) ? { "access-control-allow-origin": origin, "vary": "Origin" } : {};
    if (request.method === "OPTIONS") {
      return allowed.has(origin)
        ? new Response(null, { status: 204, headers: { ...cors, "access-control-allow-methods": "POST", "access-control-allow-headers": "content-type", "access-control-max-age": "600" } })
        : new Response(null, { status: 403 });
    }
    if (url.pathname === "/event" && request.method === "POST") {
      if (!allowed.has(origin)) return json({ error: "origin_not_allowed" }, 403);
      if (Number(request.headers.get("content-length") || 0) > MAX_BODY) return json({ error: "too_large" }, 413, cors);
      let payload;
      try {
        const body = await request.text();
        if (body.length > MAX_BODY) return json({ error: "too_large" }, 413, cors);
        payload = JSON.parse(body);
      } catch { return json({ error: "invalid_json" }, 400, cors); }
      const { event_type, book_id, language } = payload || {};
      if (!EVENTS.has(event_type) || !LANGUAGES.has(language) || typeof book_id !== "string" || !/^[A-Za-z0-9_-]{1,32}$/.test(book_id)) {
        return json({ error: "invalid_event" }, 400, cors);
      }
      const day = new Date().toISOString().slice(0, 10);
      await env.DB.prepare(`INSERT INTO conversion_counts (event_date, event_type, book_id, language, count)
        VALUES (?, ?, ?, ?, 1)
        ON CONFLICT(event_date, event_type, book_id, language)
        DO UPDATE SET count = count + 1`).bind(day, event_type, book_id, language).run();
      return new Response(null, { status: 204, headers: cors });
    }
    if (url.pathname === "/report" && request.method === "GET") {
      const auth = request.headers.get("authorization");
      if (!env.REPORT_TOKEN || auth !== `Bearer ${env.REPORT_TOKEN}`) return json({ error: "unauthorized" }, 401);
      const rows = await env.DB.prepare("SELECT event_date, event_type, book_id, language, count FROM conversion_counts ORDER BY event_date DESC, event_type, book_id, language LIMIT 1000").all();
      return json({ rows: rows.results });
    }
    return json({ error: "not_found" }, 404);
  }
};
