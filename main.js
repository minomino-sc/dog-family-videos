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
 * 家族用：一覧 + 検索 + 日付件数
 ***********************/
async function initViewer() {
  const key = getKey();
  const root = document.getElementById("videos");
  const searchInput = document.getElementById("search");

  if (!key) {
    root.textContent = "アクセスキーがありません";
    return;
  }

  try {
    const snap = await db
      .collection("videos")
      .where("key", "==", key)
      .get();

    const all = [];
    snap.forEach(d => all.push(d.data()));

    function render(list) {
      root.innerHTML = "";

      // 📅 日付ごとにグループ化
      const groups = {};
      list.forEach(v => {
        if (!v.createdAt) return;
        const d = new Date(v.createdAt.seconds * 1000).toLocaleDateString();
        if (!groups[d]) groups[d] = [];
        groups[d].push(v);
      });

      Object.keys(groups)
        .sort((a,b)=>new Date(b)-new Date(a))
        .forEach(date => {
          const videos = groups[date];

          // 日付ヘッダ
          const header = document.createElement("div");
          header.className = "date-header";
          header.innerHTML = `
            <span>📅 ${date}</span>
            <span class="count">${videos.length}件</span>
          `;

          const container = document.createElement("div");

          header.onclick = () => {
            container.style.display =
              container.style.display === "none" ? "" : "none";
          };

          videos.forEach(v => {
            const card = document.createElement("div");
            card.className = "card";
            card.innerHTML = `
              <iframe src="https://www.youtube.com/embed/${v.videoId}" allowfullscreen></iframe>
              <div class="title">${v.title}</div>
            `;
            container.appendChild(card);
          });

          root.appendChild(header);
          root.appendChild(container);
        });
    }

    render(all);

    // 🔍 検索
    searchInput.addEventListener("input", () => {
      const q = searchInput.value.trim().toLowerCase();
      const filtered = all.filter(v =>
        v.title.toLowerCase().includes(q)
      );
      render(filtered);
    });

  } catch (e) {
    console.error(e);
    root.textContent = "動画の読み込みに失敗しました";
  }
}
