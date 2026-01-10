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

    const videos = [];
    snap.forEach(doc => videos.push(doc.data()));

    function dateLabel(ts) {
      return ts
        ? new Date(ts.seconds * 1000).toLocaleDateString()
        : "日付不明";
    }

    function render(list) {
      root.innerHTML = "";

      const groups = {};
      list.forEach(v => {
        const d = dateLabel(v.createdAt);
        if (!groups[d]) groups[d] = [];
        groups[d].push(v);
      });

      Object.keys(groups).forEach(date => {
        const count = groups[date].length;

        const header = document.createElement("div");
        header.className = "date-header";
        header.textContent = `📅 ${date}（${count}件）`;

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

    // 🔍 検索
    searchInput.addEventListener("input", () => {
      const q = searchInput.value.trim().toLowerCase();
      const filtered = videos.filter(v =>
        v.title.toLowerCase().includes(q)
      );
      render(filtered);
    });

  } catch (e) {
    console.error(e);
    root.textContent = "動画の読み込みに失敗しました";
  }
}
