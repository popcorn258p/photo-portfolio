/**
 * 分類常數 + 示範資料（useDemoData: true 時使用）
 */

window.CATEGORIES = [
  { id: "travel", label: "旅行", sort: 1 },
  { id: "lifestyle", label: "生活", sort: 2 },
  { id: "product", label: "產品", sort: 3 },
  { id: "event", label: "活動", sort: 4 },
];

/** 版型選項：後台下拉用 */
window.LAYOUT_OPTIONS = [
  { id: "square", label: "正方形" },
  { id: "portrait", label: "直式" },
  { id: "landscape", label: "橫式" },
  { id: "feature", label: "主視覺（大）" },
];

function flickrSrc(server, id, secret, size) {
  return (
    "https://live.staticflickr.com/" +
    server +
    "/" +
    id +
    "_" +
    secret +
    "_" +
    (size || "b") +
    ".jpg"
  );
}

function flickrPage(photoId) {
  return "https://www.flickr.com/photos/robert_yen/" + photoId + "/";
}

window.DEMO_PHOTOS = [
  {
    id: "demo-1",
    title: "上高地 · Portra 400",
    category_id: "travel",
    album: "2025 上高地 Kodak Portra 400",
    layout_style: "feature",
    image_url: flickrSrc("65535", "54954934734", "210ec9a8dc", "b"),
    flickr_url: flickrPage("54954934734"),
    sort_order: 10,
    is_published: true,
  },
  {
    id: "demo-2",
    title: "上高地 · 山徑",
    category_id: "travel",
    album: "2025 上高地 Kodak Portra 400",
    layout_style: "portrait",
    image_url: flickrSrc("65535", "54953803732", "543136e50d", "b"),
    flickr_url: flickrPage("54953803732"),
    sort_order: 20,
    is_published: true,
  },
  {
    id: "demo-3",
    title: "日本 · 鎌倉－東京",
    category_id: "travel",
    album: "2025 鎌倉-富士-山形-東京",
    layout_style: "landscape",
    image_url: flickrSrc("65535", "54509156836", "ecdae21a12", "h"),
    flickr_url: flickrPage("54509156836"),
    sort_order: 30,
    is_published: true,
  },
  {
    id: "demo-4",
    title: "鵲咖啡 · 空間",
    category_id: "lifestyle",
    album: "鵲咖啡",
    layout_style: "square",
    image_url: flickrSrc("65535", "51893220000", "932e9f9270", "h"),
    flickr_url: flickrPage("51893220000"),
    sort_order: 40,
    is_published: true,
  },
  {
    id: "demo-5",
    title: "鵲咖啡 · 細節",
    category_id: "lifestyle",
    album: "鵲咖啡",
    layout_style: "portrait",
    image_url: flickrSrc("65535", "51893219775", "44e92a0c88", "h"),
    flickr_url: flickrPage("51893219775"),
    sort_order: 50,
    is_published: true,
  },
  {
    id: "demo-6",
    title: "Urbanears BOO",
    category_id: "product",
    album: "Urbanears BOO & BOO TIP",
    layout_style: "square",
    image_url: flickrSrc("65535", "52221791670", "f90f1b301a", "h"),
    flickr_url: flickrPage("52221791670"),
    sort_order: 60,
    is_published: true,
  },
  {
    id: "demo-7",
    title: "Urbanears · 特寫",
    category_id: "product",
    album: "Urbanears BOO & BOO TIP",
    layout_style: "landscape",
    image_url: flickrSrc("65535", "52221300531", "cea3e22cb5", "h"),
    flickr_url: flickrPage("52221300531"),
    sort_order: 70,
    is_published: true,
  },
  {
    id: "demo-8",
    title: "活動現場",
    category_id: "event",
    album: "活動",
    layout_style: "feature",
    image_url: flickrSrc("65535", "54509420458", "d01c3cd019", "h"),
    flickr_url: flickrPage("54509420458"),
    sort_order: 80,
    is_published: true,
  },
];
