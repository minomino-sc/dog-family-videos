/***********************
 * Firebase 初期化（Compat）
 ***********************/
const firebaseConfig = {
  apiKey: "AIzaSyA-u--fB_d8W6zRTJYj4PLyHc61pNQpKjQ",
  authDomain: "dog-family-videos.firebaseapp.com",
  projectId: "dog-family-videos",
  storageBucket: "dog-family-videos.firebasestorage.app",
  messagingSenderId: "727646533912",
  appId: "1:727646533912:web:2318a70106647f75d0466d"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

/***********************
 * URLキー取得
 ***********************/
function getKey() {
  return new URLSearchParams(location.search).get("key");
}

/***********************
 * 家族用：動画一覧表示 + 検索
 ***********************/
async function initViewer() {
  const key = getKey();
  const root = document.getElementById("videos");
  const searchInput = document.getElementById("search");

  if (!key) {
    root.textContent = "アクセスキーがありません";
    return;
  }

  root.textContent = "読み込み中...";

  try {
    const snap = await db
      .collection("videos")
      .where("key", "==", key)
      .get();

    if (snap.empty) {
      root.textContent = "まだ動画がありません";
      return;
    }

    const videos = [];
    snap.forEach(doc => videos.push(doc.data()));

    function render(list) {
      root.innerHTML = "";
      list.forEach(v => {
        const div = document.createElement("div");
        div.className = "video";
        div.innerHTML = `
          <iframe src="https://www.youtube.com/embed/${v.videoId}" allowfullscreen></iframe>
          <div class="title">${v.title}</div>
          <div class="date">
            ${v.createdAt ? new Date(v.createdAt.seconds * 1000).toLocaleDateString() : ""}
          </div>
        `;
        root.appendChild(div);
      });
    }

    render(videos);

    // 🔍 検索機能
    if (searchInput) {
      searchInput.addEventListener("input", () => {
        const q = searchInput.value.trim().toLowerCase();
        const filtered = videos.filter(v =>
          v.title.toLowerCase().includes(q)
        );
        render(filtered);
      });
    }

  } catch (e) {
    console.error(e);
    root.textContent = "動画の読み込みに失敗しました";
  }
}

/***********************
 * 管理用：動画登録（安全版）
 ***********************/
async function addVideo() {
  const titleInput = document.getElementById("title");
  const urlInput = document.getElementById("url");
  const msg = document.getElementById("msg");

  // 👇 管理画面以外では何もしない
  if (!titleInput || !urlInput || !msg) return;

  const key = getKey();
  if (!key) {
    alert("管理キーがありません");
    return;
  }

  const title = titleInput.value.trim();
  const url = urlInput.value.trim();
  msg.textContent = "";

  if (!title || !url) {
    msg.textContent = "未入力があります";
    return;
  }

  let videoId = null;

  let m = url.match(/v=([^&]+)/);
  if (m) videoId = m[1];

  if (!videoId) {
    m = url.match(/youtu\.be\/([^?]+)/);
    if (m) videoId = m[1];
  }

  if (!videoId) {
    m = url.match(/shorts\/([^?]+)/);
    if (m) videoId = m[1];
  }

  if (!videoId) {
    msg.textContent = "YouTube URL が正しくありません";
    return;
  }

  await db.collection("videos").add({
    key,
    title,
    videoId,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });

  msg.textContent = "登録しました 🐾";
  titleInput.value = "";
  urlInput.value = "";
}
