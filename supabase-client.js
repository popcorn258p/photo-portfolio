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
    client = window.supabase.createClient(c.supabaseUrl, c.supabaseAnonKey);
    return client;
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
    if (error) throw error;
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
