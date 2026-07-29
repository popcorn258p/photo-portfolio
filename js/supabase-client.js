/**
 * Supabase 瀏覽器 client（CDN umd 需先載入 @supabase/supabase-js）
 */
window.PortfolioDB = (function () {
  let client = null;

  function getConfig() {
    return window.APP_CONFIG || {};
  }

  function isConfigured() {
    const c = getConfig();
    if (c.useDemoData) return false;
    if (!c.supabaseUrl || !c.supabaseAnonKey) return false;
    if (c.supabaseUrl.indexOf("YOUR_PROJECT") !== -1) return false;
    if (c.supabaseAnonKey.indexOf("YOUR_ANON") !== -1) return false;
    return true;
  }

  function getClient() {
    if (!isConfigured()) return null;
    if (client) return client;
    if (!window.supabase || !window.supabase.createClient) {
      console.error("Supabase SDK 未載入");
      return null;
    }
    const c = getConfig();
    client = window.supabase.createClient(c.supabaseUrl, c.supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: window.localStorage,
      },
    });
    return client;
  }

  /** 把 Supabase 錯誤翻成較好懂的中文 */
  function friendlyAuthError(err) {
    const msg = (err && (err.message || err.error_description || err.msg)) || String(err || "");
    const lower = msg.toLowerCase();

    if (lower.indexOf("failed to fetch") !== -1 || lower.indexOf("network") !== -1) {
      return "無法連到 Supabase（網路或網址錯誤）。請確認 config.js 的 supabaseUrl，並用 F12→Console 看詳情。";
    }
    if (lower.indexOf("invalid login credentials") !== -1) {
      return "Email 或密碼不正確。請到 Supabase → Authentication → Users 確認帳號，或重設密碼。";
    }
    if (lower.indexOf("email not confirmed") !== -1) {
      return "此帳號尚未確認 Email。請在 Users 重新建立並勾選 Auto Confirm，或關閉「Confirm email」。";
    }
    if (lower.indexOf("user not found") !== -1) {
      return "找不到此使用者。請在 Supabase Authentication → Users 用「Add user」建立後台帳號。";
    }
    if (lower.indexOf("signup is disabled") !== -1) {
      return "目前不開放註冊。後台請用 Authentication → Users 手動新增的帳號登入。";
    }
    if (lower.indexOf("email logins are disabled") !== -1 || lower.indexOf("provider is not enabled") !== -1) {
      return "Email 登入未開啟。請到 Authentication → Providers → Email 啟用。";
    }
    return msg || "登入失敗";
  }

  function publicImageUrl(row) {
    if (row.image_url) return row.image_url;
    if (row.image_path) {
      const sb = getClient();
      if (!sb) return "";
      const { data } = sb.storage.from("photos").getPublicUrl(row.image_path);
      return (data && data.publicUrl) || "";
    }
    return "";
  }

  function categoryLabel(categoryId) {
    const list = window.CATEGORIES || [];
    const found = list.find(function (c) {
      return c.id === categoryId;
    });
    return found ? found.label : categoryId;
  }

  async function fetchPublishedPhotos() {
    const sb = getClient();
    if (!sb) {
      return (window.DEMO_PHOTOS || []).slice().sort(function (a, b) {
        return (a.sort_order || 0) - (b.sort_order || 0);
      });
    }

    const { data, error } = await sb
      .from("photos")
      .select("*")
      .eq("is_published", true)
      .order("sort_order", { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async function fetchAllPhotos() {
    const sb = getClient();
    if (!sb) throw new Error("尚未設定 Supabase");

    const { data, error } = await sb
      .from("photos")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async function upsertPhoto(payload) {
    const sb = getClient();
    if (!sb) throw new Error("尚未設定 Supabase");

    const row = Object.assign({}, payload);
    if (!row.id) delete row.id;

    const { data, error } = await sb
      .from("photos")
      .upsert(row)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async function deletePhoto(id) {
    const sb = getClient();
    if (!sb) throw new Error("尚未設定 Supabase");
    const { error } = await sb.from("photos").delete().eq("id", id);
    if (error) throw error;
  }

  async function uploadImage(file) {
    const sb = getClient();
    if (!sb) throw new Error("尚未設定 Supabase");

    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const path =
      "uploads/" +
      Date.now() +
      "-" +
      Math.random().toString(36).slice(2, 8) +
      "." +
      ext;

    const { error } = await sb.storage.from("photos").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });
    if (error) throw error;
    return path;
  }

  async function signIn(email, password) {
    const sb = getClient();
    if (!sb) throw new Error("尚未設定 Supabase（請改 config.js）");
    const { data, error } = await sb.auth.signInWithPassword({
      email: email,
      password: password,
    });
    if (error) {
      const e = new Error(friendlyAuthError(error));
      e.cause = error;
      throw e;
    }
    return data;
  }

  async function signOut() {
    const sb = getClient();
    if (!sb) return;
    await sb.auth.signOut();
  }

  async function getSession() {
    const sb = getClient();
    if (!sb) return null;
    const { data } = await sb.auth.getSession();
    return data.session || null;
  }

  return {
    isConfigured: isConfigured,
    getClient: getClient,
    publicImageUrl: publicImageUrl,
    categoryLabel: categoryLabel,
    fetchPublishedPhotos: fetchPublishedPhotos,
    fetchAllPhotos: fetchAllPhotos,
    upsertPhoto: upsertPhoto,
    deletePhoto: deletePhoto,
    uploadImage: uploadImage,
    signIn: signIn,
    signOut: signOut,
    getSession: getSession,
  };
})();
