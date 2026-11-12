// Optional client script: include only after configuring the Worker endpoint.
// Set window.COZY_CONVERSION_ENDPOINT to the full HTTPS URL ending in /event.
(() => {
  const endpoint = window.COZY_CONVERSION_ENDPOINT;
  if (!endpoint || !/^https:\/\//.test(endpoint)) return;
  const actions = { preview: "book_preview_click", sample: "free_sample_click", amazon: "amazon_click" };
  document.addEventListener("click", event => {
    const anchor = event.target.closest("a[data-conversion][data-book-id]");
    if (!anchor) return;
    const event_type = actions[anchor.dataset.conversion];
    const book_id = anchor.dataset.bookId;
    const language = (document.documentElement.lang || "de").toUpperCase();
    if (!event_type || !/^[A-Za-z0-9_-]{1,32}$/.test(book_id) || !["DE","EN","ES"].includes(language)) return;
    const body = JSON.stringify({ event_type, book_id, language });
    try {
      if (navigator.sendBeacon && navigator.sendBeacon(endpoint, new Blob([body], { type: "text/plain" }))) return;
      fetch(endpoint, { method: "POST", body, headers: { "content-type": "text/plain" }, keepalive: true, mode: "cors" }).catch(() => {});
    } catch (_) { /* tracking must never interrupt navigation */ }
  }, { capture: true });
})();
