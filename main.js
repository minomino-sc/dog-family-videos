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
 * 日付ラベル生成
 ***********************/
function formatDate(ts) {
  if (!ts || !ts.seconds) return "日付不明";
  const d = new Date(ts.seconds * 1000);
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}

/***********************
 * 家族用：動画一覧（検索＋日付折りたたみ＋件数）
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

    const allVideos = [];
    snap.forEach(doc => allVideos.push(doc.data()));

    function render(videos) {
      root.innerHTML = "";

      // 📅 日付ごとにグループ化
      const groups = {};
      videos.forEach(v => {
        const date = formatDate(v.createdAt);
        if (!groups[date]) groups[date] = [];
        groups[date].push(v);
      });

      Object.keys(groups)
        .sort((a, b) => b.localeCompare(a))
        .forEach(date => {
          const list = groups[date];

          // 日付ヘッダ
          const header = document.createElement("div");
          header.className = "date-header";
          header.innerHTML = `
            <div class="date-left">🐾 ${date}</div>
            <div class="count">${list.length}件</div>
          `;

          const listDiv = document.createElement("div");

          list.forEach(v => {
            const card = document.createElement("div");
            card.className = "card video";
            card.innerHTML = `
              <iframe
                src="https://www.youtube.com/embed/${v.videoId}"
                allowfullscreen
              ></iframe>
              <div class="title">${v.title}</div>
            `;
            listDiv.appendChild(card);
          });

          // 📅 クリックで開閉 + 🐶 ワン！
          header.addEventListener("click", () => {
            listDiv.style.display =
              listDiv.style.display === "none" ? "" : "none";

            if (window.playDogSound) {
              window.playDogSound();
            }
          });

          root.appendChild(header);
          root.appendChild(listDiv);
        });
    }

    // 初期描画
    render(allVideos);

    // 🔍 検索
    if (searchInput) {
      searchInput.addEventListener("input", () => {
        const q = searchInput.value.trim().toLowerCase();
        const filtered = allVideos.filter(v =>
          v.title.toLowerCase().includes(q)
        );
        render(filtered);
      });
    }

  } catch (e) {
    console.error("Firestore error:", e);
    root.textContent = "動画の読み込みに失敗しました";
  }
}

/***********************
 * 管理用：動画登録（ショート対応）
 ***********************/
async function addVideo() {
  const titleInput = document.getElementById("title");
  const urlInput = document.getElementById("url");
  const msg = document.getElementById("msg");

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
