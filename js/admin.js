/**
 * 簡易後台：登入、列表、新增/編輯、上傳、刪除
 */

let editingId = null;
let allPhotos = [];

function $(id) {
  return document.getElementById(id);
}

function show(el, on) {
  if (!el) return;
  el.hidden = !on;
}

function setError(msg) {
  const el = $("adminError");
  if (el) el.textContent = msg || "";
}

function setStatus(msg) {
  const el = $("formStatus");
  if (el) el.textContent = msg || "";
}

function categoryOptions(selected) {
  return (window.CATEGORIES || [])
    .map(function (c) {
      return (
        '<option value="' +
        c.id +
        '"' +
        (c.id === selected ? " selected" : "") +
        ">" +
        c.label +
        "</option>"
      );
    })
    .join("");
}

function layoutLabel(id) {
  const list = window.LAYOUT_OPTIONS || [];
  const found = list.find(function (x) {
    return x.id === id;
  });
  return found ? found.label : id || "直式";
}

function fillCategorySelects() {
  const sel = $("category_id");
  if (sel) sel.innerHTML = categoryOptions("travel");
}

function resetForm() {
  editingId = null;
  const form = $("photoForm");
  if (!form) return;
  form.reset();
  form.category_id.innerHTML = categoryOptions("travel");
  if (form.layout_style) form.layout_style.value = "portrait";
  form.is_published.checked = true;
  form.sort_order.value = "100";
  $("formTitle").textContent = "新增作品";
  setStatus("");
}

function editPhoto(id) {
  const p = allPhotos.find(function (x) {
    return String(x.id) === String(id);
  });
  if (!p) return;

  editingId = p.id;
  const form = $("photoForm");
  form.title.value = p.title || "";
  form.category_id.innerHTML = categoryOptions(p.category_id);
  form.album.value = p.album || "";
  form.description.value = p.description || "";
  form.image_url.value = p.image_url || "";
  form.flickr_url.value = p.flickr_url || "";
  form.sort_order.value = p.sort_order != null ? p.sort_order : 100;
  if (form.layout_style) {
    form.layout_style.value = p.layout_style || "portrait";
  }
  form.is_published.checked = p.is_published !== false;
  $("formTitle").textContent = "編輯作品";
  setStatus("正在編輯：" + p.title);
  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderTable() {
  const tbody = $("photoTableBody");
  if (!tbody) return;

  if (!allPhotos.length) {
    tbody.innerHTML =
      '<tr><td colspan="7">尚無作品。請用下方表單新增，或上傳圖片。</td></tr>';
    return;
  }

  tbody.innerHTML = allPhotos
    .map(function (p) {
      const src = window.PortfolioDB.publicImageUrl(p);
      const label = window.PortfolioDB.categoryLabel(p.category_id);
      const pub = p.is_published
        ? '<span class="badge on">上架</span>'
        : '<span class="badge off">下架</span>';

      return (
        "<tr>" +
        '<td><img class="thumb" src="' +
        (src || "") +
        '" alt="" /></td>' +
        "<td>" +
        escape(p.title) +
        "<br><small class=\"admin-hint\">" +
        escape(p.album || "") +
        "</small></td>" +
        "<td>" +
        escape(label) +
        "</td>" +
        '<td class="hide-sm">' +
        escape(layoutLabel(p.layout_style || "portrait")) +
        "</td>" +
        '<td class="hide-sm">' +
        (p.sort_order != null ? p.sort_order : "") +
        "</td>" +
        "<td>" +
        pub +
        "</td>" +
        '<td class="row-actions">' +
        '<button type="button" class="btn btn-ghost btn-sm" data-edit="' +
        p.id +
        '">編輯</button>' +
        '<button type="button" class="btn btn-danger btn-sm" data-del="' +
        p.id +
        '">刪除</button>' +
        "</td>" +
        "</tr>"
      );
    })
    .join("");
}

function escape(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function refreshList() {
  allPhotos = await window.PortfolioDB.fetchAllPhotos();
  renderTable();
}

function setBannerStatus(msg) {
  const el = $("bannerStatus");
  if (el) el.textContent = msg || "";
}

function updateBannerPreview(settings) {
  const box = $("bannerPreview");
  if (!box) return;
  const url = window.PortfolioDB.heroImageUrl(settings);
  if (url) {
    box.classList.add("has-image");
    box.style.backgroundImage =
      "linear-gradient(rgba(28,28,30,0.4), rgba(28,28,30,0.45)), url(\"" +
      url.replace(/"/g, "%22") +
      "\")";
    box.textContent =
      (settings.hero_title && settings.hero_title.trim()) || "Robert";
  } else {
    box.classList.remove("has-image");
    box.style.backgroundImage = "";
    box.textContent = "尚未設定（使用預設漸層）";
  }
}

async function loadBannerForm() {
  try {
    const s = await window.PortfolioDB.fetchSiteSettings();
    const form = $("bannerForm");
    if (!form) return;
    form.hero_image_url.value = s.hero_image_url || "";
    form.hero_title.value = s.hero_title || "";
    form.hero_subtitle.value = s.hero_subtitle || "";
    form.hero_overlay.value =
      s.hero_overlay != null ? s.hero_overlay : 45;
    // 記住 path，清除時用
    form.dataset.heroPath = s.hero_image_path || "";
    updateBannerPreview(s);
    setBannerStatus("");
  } catch (err) {
    setBannerStatus(
      "無法讀取 Banner 設定。請先在 Supabase 執行 migration_site_settings.sql。" +
        " 錯誤：" +
        (err.message || err)
    );
  }
}

async function onSaveBanner(e) {
  e.preventDefault();
  setBannerStatus("儲存中…");
  setError("");

  const form = $("bannerForm");
  const fileInput = $("hero_image_file");
  const file = fileInput && fileInput.files && fileInput.files[0];

  try {
    let hero_image_path = form.dataset.heroPath || null;
    let hero_image_url = (form.hero_image_url.value || "").trim() || null;

    if (file) {
      hero_image_path = await window.PortfolioDB.uploadHeroImage(file);
      hero_image_url = null;
    }

    // 若只填 URL、沒上傳，清 path 以免舊 path 搶優先
    if (!file && hero_image_url) {
      hero_image_path = null;
    }

    // 都沒換圖：沿用現有
    if (!file && !hero_image_url && form.dataset.heroPath) {
      hero_image_path = form.dataset.heroPath;
      hero_image_url = null;
    }

    const overlay = Number(form.hero_overlay.value);
    const payload = {
      id: 1,
      hero_image_url: hero_image_url,
      hero_image_path: hero_image_path,
      hero_title: (form.hero_title.value || "").trim(),
      hero_subtitle: (form.hero_subtitle.value || "").trim(),
      hero_overlay: isNaN(overlay) ? 45 : Math.min(80, Math.max(0, overlay)),
    };

    const saved = await window.PortfolioDB.saveSiteSettings(payload);
    form.dataset.heroPath = saved.hero_image_path || "";
    if (fileInput) fileInput.value = "";
    updateBannerPreview(saved);
    setBannerStatus("Banner 已儲存。請到前台重新整理查看。");
  } catch (err) {
    console.error(err);
    setBannerStatus("");
    setError(
      "Banner 儲存失敗：" +
        (err.message || err) +
        "（若提示找不到資料表，請執行 supabase/migration_site_settings.sql）"
    );
  }
}

async function onClearBanner() {
  if (!confirm("確定清除 Banner 背景圖，恢復預設漸層？")) return;
  setBannerStatus("清除中…");
  try {
    const form = $("bannerForm");
    const payload = {
      id: 1,
      hero_image_url: null,
      hero_image_path: null,
      hero_title: (form.hero_title.value || "").trim(),
      hero_subtitle: (form.hero_subtitle.value || "").trim(),
      hero_overlay: Number(form.hero_overlay.value) || 45,
    };
    const saved = await window.PortfolioDB.saveSiteSettings(payload);
    form.dataset.heroPath = "";
    form.hero_image_url.value = "";
    const fileInput = $("hero_image_file");
    if (fileInput) fileInput.value = "";
    updateBannerPreview(saved);
    setBannerStatus("已清除背景圖。");
  } catch (err) {
    setError("清除失敗：" + (err.message || err));
    setBannerStatus("");
  }
}

async function showDashboard() {
  show($("loginPanel"), false);
  show($("dashPanel"), true);
  fillCategorySelects();
  resetForm();
  try {
    await refreshList();
    await loadBannerForm();
    setError("");
  } catch (err) {
    setError("讀取列表失敗：" + (err.message || err));
  }
}

async function showLogin() {
  show($("loginPanel"), true);
  show($("dashPanel"), false);
}

async function onLogin(e) {
  e.preventDefault();
  setError("");
  setStatus("");
  const email = $("email").value.trim();
  const password = $("password").value;
  const btn = e.target && e.target.querySelector
    ? e.target.querySelector("[type=submit]")
    : null;

  try {
    if (!window.PortfolioDB.isConfigured()) {
      throw new Error(
        "請先在 config.js 填入 Supabase URL / anon key，並把 useDemoData 設為 false"
      );
    }
    if (!email || !password) {
      throw new Error("請輸入 Email 與密碼");
    }
    if (btn) {
      btn.disabled = true;
      btn.textContent = "登入中…";
    }
    await window.PortfolioDB.signIn(email, password);
    await showDashboard();
  } catch (err) {
    console.error("[admin login]", err);
    setError(err.message || String(err));
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = "登入";
    }
  }
}

async function onLogout() {
  await window.PortfolioDB.signOut();
  await showLogin();
}

async function onSubmitPhoto(e) {
  e.preventDefault();
  setStatus("儲存中…");
  setError("");

  const form = $("photoForm");
  const fileInput = $("image_file");
  const file = fileInput && fileInput.files && fileInput.files[0];

  try {
    let image_path = undefined;
    let image_url = (form.image_url.value || "").trim() || null;

    if (file) {
      image_path = await window.PortfolioDB.uploadImage(file);
      // 有上傳檔時優先用 Storage；可清空外連
      // 保留 image_url 也可，publicImageUrl 會優先 image_url
      // 這裡：有上傳就清 image_url，避免混淆
      image_url = null;
    }

    const payload = {
      title: form.title.value.trim(),
      category_id: form.category_id.value,
      album: form.album.value.trim(),
      description: form.description.value.trim(),
      image_url: image_url,
      flickr_url: form.flickr_url.value.trim(),
      layout_style: (form.layout_style && form.layout_style.value) || "portrait",
      sort_order: Number(form.sort_order.value) || 0,
      is_published: form.is_published.checked,
    };

    if (image_path) payload.image_path = image_path;
    if (editingId) payload.id = editingId;

    if (!payload.title) throw new Error("請填標題");
    if (!payload.image_url && !payload.image_path && !editingId) {
      // 編輯時可沿用舊圖
      throw new Error("請上傳圖片或填 image_url（Flickr 直連）");
    }

    // 編輯且沒換圖：不要覆蓋 image_path 為 undefined
    if (editingId && !file && !image_url) {
      delete payload.image_url;
      delete payload.image_path;
      const old = allPhotos.find(function (x) {
        return String(x.id) === String(editingId);
      });
      if (old) {
        payload.image_url = old.image_url;
        payload.image_path = old.image_path;
      }
    }

    await window.PortfolioDB.upsertPhoto(payload);
    if (fileInput) fileInput.value = "";
    resetForm();
    await refreshList();
    setStatus("已儲存");
  } catch (err) {
    setStatus("");
    setError(err.message || String(err));
  }
}

function bindTableActions() {
  const tbody = $("photoTableBody");
  if (!tbody) return;

  tbody.addEventListener("click", async function (e) {
    const editBtn = e.target.closest("[data-edit]");
    const delBtn = e.target.closest("[data-del]");

    if (editBtn) {
      editPhoto(editBtn.getAttribute("data-edit"));
      return;
    }

    if (delBtn) {
      const id = delBtn.getAttribute("data-del");
      if (!confirm("確定刪除此作品？")) return;
      try {
        await window.PortfolioDB.deletePhoto(id);
        if (editingId && String(editingId) === String(id)) resetForm();
        await refreshList();
      } catch (err) {
        setError(err.message || String(err));
      }
    }
  });
}

document.addEventListener("DOMContentLoaded", async function () {
  $("year") && ($("year").textContent = String(new Date().getFullYear()));

  $("loginForm") && $("loginForm").addEventListener("submit", onLogin);
  $("logoutBtn") && $("logoutBtn").addEventListener("click", onLogout);
  $("photoForm") && $("photoForm").addEventListener("submit", onSubmitPhoto);
  $("resetFormBtn") && $("resetFormBtn").addEventListener("click", resetForm);
  $("bannerForm") && $("bannerForm").addEventListener("submit", onSaveBanner);
  $("clearBannerBtn") &&
    $("clearBannerBtn").addEventListener("click", onClearBanner);
  bindTableActions();

  const mode = $("configHint");
  if (mode) {
    if (!window.PortfolioDB.isConfigured()) {
      mode.textContent =
        "⚠ config.js 尚未接上 Supabase（useDemoData 或仍是 YOUR_PROJECT）。後台登入前請先設定。";
    } else {
      mode.textContent = "Supabase 已設定，請用 Authentication 的帳密登入。";
    }
  }

  try {
    if (window.PortfolioDB.isConfigured()) {
      const session = await window.PortfolioDB.getSession();
      if (session) await showDashboard();
      else await showLogin();
    } else {
      await showLogin();
    }
  } catch (err) {
    setError(err.message || String(err));
    await showLogin();
  }
});
