/**
 * Supabase 設定（公開 anon key 可放前端；勿放 service_role）
 *
 * 1. https://supabase.com → New project
 * 2. SQL Editor 執行 supabase/schema.sql
 * 3. Authentication → Users → 新增你的後台 Email/密碼
 * 4. 下方兩行改成你的 Project URL 與 anon public key
 */
window.APP_CONFIG = {
  // 還沒填 Supabase 時：true = 用內建示範資料（仍可測 GTM）
  useDemoData: false,

  supabaseUrl: "https://sdmuyzqlocpcrqyqaqqu.supabase.co",
  supabaseAnonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkbXV5enFsb2NwY3JxeXFhcXF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUyODA1NDMsImV4cCI6MjEwMDg1NjU0M30.8zd_agVHPFN8L8_Fen1Ax_qdog1V7mt6KLBpxXCxAac",

  // GTM Container ID（兩處 HTML 也要改，或之後改成動態注入）
  gtmId: "GTM-XXXXXXX",

  site: {
    name: "Robert",
    nameEn: "Robert",
    flickr: "https://www.flickr.com/photos/robert_yen/",
  },
};
