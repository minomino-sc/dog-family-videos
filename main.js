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
 * 家族用：動画一覧（検索＋日付折りたたみ）
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

    function formatDate(ts) {
      return ts
        ? new Date(ts.seconds * 1000).toLocaleDateString()
        : "日付不明";
    }

    function render(list) {
      root.innerHTML = "";

      // 📅 日付でグループ化
      const groups = {};
      list.forEach(v => {
        const d = formatDate(v.createdAt);
        if (!groups[d]) groups[d] = [];
        groups[d].push(v);
      });

      Object.keys(groups).forEach(date => {
        // 日付ヘッダー
        const header = document.createElement("div");
        header.textContent = `📅 ${date}`;
        header.style.cssText = `
          font-weight:600;
          margin:14px 0 6px;
          cursor:pointer;
        `;

        // 折りたたみ領域
        const box = document.createElement("div");
        box.style.display = "none";

        header.onclick = () => {
          box.style.display =
            box.style.display === "none" ? "block" : "none";
        };

        groups[date].forEach(v => {
          const div = document.createElement("div");
          div.className = "video";
          div.innerHTML = `
            <iframe src="https://www.youtube.com/embed/${v.videoId}" allowfullscreen></iframe>
            <div class="title">${v.title}</div>
          `;
          box.appendChild(div);
        });

        root.appendChild(header);
        root.appendChild(box);
      });
    }

    render(videos);

    // 🔍 検索（折りたたみ維持）
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
 * 管理用：動画登録（安全）
 ***********************/
async function addVideo() {
  const titleInput = document.getElementById("title");
  const urlInput = document.getElementById("url");
  const msg = document.getElementById("msg");

  if (!titleInput || !urlInput || !msg) return;

  const key = getKey();
  if (!key) return alert("管理キーがありません");

  const title = titleInput.value.trim();
  const url = urlInput.value.trim();
  msg.textContent = "";

  if (!title || !url) {
    msg.textContent = "未入力があります";
    return;
  }

  let m =
    url.match(/v=([^&]+)/) ||
    url.match(/youtu\.be\/([^?]+)/) ||
    url.match(/shorts\/([^?]+)/);

  if (!m) {
    msg.textContent = "YouTube URL が正しくありません";
    return;
  }

  await db.collection("videos").add({
    key,
    title,
    videoId: m[1],
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });

  msg.textContent = "登録しました 🐾";
  titleInput.value = "";
  urlInput.value = "";
}
