/**
 * 前台：雜誌式畫廊 + dataLayer 事件（後台追蹤，前台不顯示說明）
 */

let PHOTOS = [];
let currentFilter = "all";

const LAYOUTS = {
  square: "layout-square",
  portrait: "layout-portrait",
  landscape: "layout-landscape",
  feature: "layout-feature",
};

function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function resolveSrc(photo) {
  return window.PortfolioDB.publicImageUrl(photo) || photo.image_url || "";
}

function normalizeLayout(style) {
  const s = (style || "portrait").toLowerCase();
  if (LAYOUTS[s]) return s;
  return "portrait";
}

function renderFilters() {
  const wrap = document.getElementById("filters");
  if (!wrap) return;

  const cats = window.CATEGORIES || [];
  let html =
    '<button type="button" class="filter-btn is-active" data-filter="all" data-track="filter_click" data-track-label="all">全部</button>';

  cats.forEach(function (c) {
    html +=
      '<button type="button" class="filter-btn" data-filter="' +
      c.id +
      '" data-track="filter_click" data-track-label="' +
      c.id +
      '">' +
      escapeHtml(c.label) +
      "</button>";
  });

  wrap.innerHTML = html;

  wrap.querySelectorAll(".filter-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      currentFilter = btn.getAttribute("data-filter") || "all";
      wrap.querySelectorAll(".filter-btn").forEach(function (b) {
        b.classList.toggle("is-active", b === btn);
      });
      renderGallery();
      window.pushEvent("filter_click", {
        filter_value: currentFilter,
        click_label: currentFilter,
      });
    });
  });
}

function renderGallery() {
  const grid = document.getElementById("galleryGrid");
  if (!grid) return;

  const list =
    currentFilter === "all"
      ? PHOTOS
      : PHOTOS.filter(function (p) {
          return p.category_id === currentFilter;
        });

  if (!list.length) {
    grid.innerHTML =
      '<p class="gallery-status">這個分類尚無作品。</p>';
    return;
  }

  grid.innerHTML = list
    .map(function (p) {
      const label = window.PortfolioDB.categoryLabel(p.category_id);
      const src = resolveSrc(p);
      const layout = normalizeLayout(p.layout_style);
      return (
        '<article class="card ' +
        LAYOUTS[layout] +
        '" role="button" tabindex="0" data-id="' +
        escapeHtml(p.id) +
        '" data-layout="' +
        layout +
        '">' +
        '<img src="' +
        escapeHtml(src) +
        '" alt="' +
        escapeHtml(p.title) +
        '" loading="lazy" />' +
        '<div class="card-meta"><span>' +
        escapeHtml(label) +
        "</span>" +
        escapeHtml(p.title) +
        "</div></article>"
      );
    })
    .join("");
}

function bindGallery() {
  const grid = document.getElementById("galleryGrid");
  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightboxImg");
  const lightboxCaption = document.getElementById("lightboxCaption");
  const lightboxFlickr = document.getElementById("lightboxFlickr");
  const closeBtn = document.querySelector(".lightbox-close");

  if (!grid || !lightbox) return;

  function openLightbox(id) {
    const work = PHOTOS.find(function (w) {
      return String(w.id) === String(id);
    });
    if (!work) return;

    const src = resolveSrc(work);
    const label = window.PortfolioDB.categoryLabel(work.category_id);

    lightboxImg.src = src;
    lightboxImg.alt = work.title;
    lightboxCaption.textContent =
      label +
      " · " +
      work.title +
      (work.album ? " · " + work.album : "");

    if (lightboxFlickr) {
      if (work.flickr_url) {
        lightboxFlickr.href = work.flickr_url;
        lightboxFlickr.hidden = false;
      } else {
        lightboxFlickr.hidden = true;
      }
    }

    lightbox.hidden = false;

    window.pushEvent("select_content", {
      content_type: "photo",
      item_id: work.id,
      item_name: work.title,
      item_category: work.category_id,
      item_album: work.album || "",
      layout_style: normalizeLayout(work.layout_style),
      flickr_url: work.flickr_url || "",
    });
  }

  function closeLightbox() {
    lightbox.hidden = true;
    lightboxImg.removeAttribute("src");
    if (lightboxFlickr) lightboxFlickr.hidden = true;
  }

  grid.addEventListener("click", function (e) {
    const card = e.target.closest(".card");
    if (card) openLightbox(card.getAttribute("data-id"));
  });

  grid.addEventListener("keydown", function (e) {
    if (e.key !== "Enter" && e.key !== " ") return;
    const card = e.target.closest(".card");
    if (!card) return;
    e.preventDefault();
    openLightbox(card.getAttribute("data-id"));
  });

  if (closeBtn) closeBtn.addEventListener("click", closeLightbox);
  lightbox.addEventListener("click", function (e) {
    if (e.target === lightbox) closeLightbox();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !lightbox.hidden) closeLightbox();
  });

  if (lightboxFlickr) {
    lightboxFlickr.addEventListener("click", function () {
      window.pushEvent("outbound_click", {
        click_label: "flickr_photo",
        link_url: lightboxFlickr.href,
        link_domain: "flickr.com",
      });
    });
  }
}

function bindForm() {
  const form = document.getElementById("contactForm");
  const status = document.getElementById("formStatus");
  if (!form) return;

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    const name = (form.name.value || "").trim();
    const email = (form.email.value || "").trim();
    const message = (form.message.value || "").trim();

    if (!name || !email || !message) {
      if (status) status.textContent = "請填寫完整資訊";
      window.pushEvent("form_error", {
        form_name: "contact",
        error_type: "validation",
      });
      return;
    }

    window.pushEvent("generate_lead", {
      form_name: "contact",
      has_message: true,
      message_length: message.length,
    });

    if (status) {
      status.textContent = "已送出，感謝您的來信。";
    }
    form.reset();
  });
}

function applySiteConfig() {
  const site = (window.APP_CONFIG && window.APP_CONFIG.site) || {};
  const flickr = site.flickr || "https://www.flickr.com/photos/robert_yen/";

  document.querySelectorAll("[data-site-flickr]").forEach(function (a) {
    a.href = flickr;
  });

  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
}

/** 套用首頁 Banner 背景與文案 */
function applyHeroBanner(settings) {
  const hero = document.getElementById("home") || document.querySelector(".hero");
  if (!hero) return;

  const url = window.PortfolioDB.heroImageUrl(settings);
  const overlayPct = Math.min(
    80,
    Math.max(0, Number(settings && settings.hero_overlay != null ? settings.hero_overlay : 45))
  );
  const overlay = (overlayPct / 100).toFixed(2);

  if (url) {
    hero.classList.add("has-banner");
    hero.style.setProperty("--hero-overlay", overlay);
    // 圖本身用 background-image；遮罩由 .hero-overlay 負責
    hero.style.backgroundImage = "url(\"" + url.replace(/"/g, "%22") + "\")";
    hero.style.backgroundSize = "cover";
    hero.style.backgroundPosition = "center center";
  } else {
    hero.classList.remove("has-banner");
    hero.style.removeProperty("--hero-overlay");
    hero.style.backgroundImage = "";
    hero.style.backgroundSize = "";
    hero.style.backgroundPosition = "";
  }

  const titleEl = document.getElementById("heroTitle");
  const subEl = document.getElementById("heroSubtitle");
  if (titleEl && settings && settings.hero_title && String(settings.hero_title).trim()) {
    titleEl.textContent = String(settings.hero_title).trim();
  }
  if (subEl && settings && settings.hero_subtitle && String(settings.hero_subtitle).trim()) {
    subEl.textContent = String(settings.hero_subtitle).trim();
  }
}

async function loadSiteSettings() {
  try {
    if (!window.PortfolioDB.isConfigured()) return;
    const settings = await window.PortfolioDB.fetchSiteSettings();
    applyHeroBanner(settings);
  } catch (err) {
    // 尚未跑 migration 時不影響作品區
    console.warn("[hero settings]", err.message || err);
  }
}

async function loadPhotos() {
  const grid = document.getElementById("galleryGrid");
  if (grid) {
    grid.innerHTML = '<p class="gallery-status">載入作品中…</p>';
  }

  try {
    PHOTOS = await window.PortfolioDB.fetchPublishedPhotos();
  } catch (err) {
    console.error(err);
    PHOTOS = window.DEMO_PHOTOS || [];
    if (grid) {
      grid.innerHTML =
        '<p class="gallery-status">作品載入失敗，請稍後再試。</p>';
    }
  }

  renderGallery();
}

document.addEventListener("DOMContentLoaded", function () {
  applySiteConfig();
  renderFilters();
  bindGallery();
  bindForm();
  window.Tracking.bindGenericClicks();
  window.Tracking.bindScrollDepth();
  window.Tracking.pushPageView();
  loadSiteSettings();
  loadPhotos();
});
