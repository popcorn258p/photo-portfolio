/**
 * GTM dataLayer helpers
 */
window.dataLayer = window.dataLayer || [];

function pushEvent(eventName, params) {
  const payload = Object.assign({ event: eventName }, params || {});
  window.dataLayer.push(payload);
  if (window.DEBUG_TRACKING !== false) {
    console.log("[dataLayer]", payload);
  }
}

window.pushEvent = pushEvent;

function bindGenericClicks() {
  document.addEventListener("click", function (e) {
    const el = e.target.closest("[data-track]");
    if (!el) return;

    const eventName = el.getAttribute("data-track");
    const label = el.getAttribute("data-track-label") || "";

    if (eventName === "filter_click") return;
    if (eventName === "lightbox_close") {
      pushEvent("lightbox_close", { click_label: label });
      return;
    }

    pushEvent(eventName, {
      click_label: label,
      click_text: (el.textContent || "").trim().slice(0, 80),
      link_url: el.getAttribute("href") || undefined,
    });
  });
}

function bindScrollDepth() {
  const marks = [25, 50, 75, 90];
  const fired = {};

  function onScroll() {
    const doc = document.documentElement;
    const scrollTop = window.scrollY || doc.scrollTop;
    const height = doc.scrollHeight - window.innerHeight;
    if (height <= 0) return;
    const pct = Math.round((scrollTop / height) * 100);
    marks.forEach(function (m) {
      if (pct >= m && !fired[m]) {
        fired[m] = true;
        pushEvent("scroll_depth", { percent_scrolled: m });
      }
    });
  }

  window.addEventListener("scroll", onScroll, { passive: true });
}

function pushPageView() {
  pushEvent("page_view_custom", {
    page_title: document.title,
    page_location: location.href,
    page_path: location.pathname + location.hash,
  });
}

window.Tracking = {
  pushEvent: pushEvent,
  bindGenericClicks: bindGenericClicks,
  bindScrollDepth: bindScrollDepth,
  pushPageView: pushPageView,
};
