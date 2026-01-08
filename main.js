/***********************
 * Firebase 初期化（Compat SDK）
 ***********************/
const firebaseConfig = {
  apiKey: "AIzaSyA-u--fB_d8W6zRTJYj4PLyHc61pNQpKjQ",
  authDomain: "dog-family-videos.firebaseapp.com",
  projectId: "dog-family-videos",
  storageBucket: "dog-family-videos.appspot.com",
  messagingSenderId: "727646533912",
  appId: "1:727646533912:web:2318a70106647f75d0466d"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

/***********************
 * URLキー取得
 ***********************/
function getKey() {
  const params = new URLSearchParams(location.search);
  return params.get("key");
}

/***********************
 * 家族用：動画一覧表示（折りたたみ＋サムネイル）
 ***********************/
async function initViewer() {
  const root = document.getElementById("videos");

  try {
    const key = getKey();
    if (!key) {
      root.textContent = "アクセスキーがありません";
      return;
    }

    root.textContent = "読み込み中...";

    const snap = await db.collection("videos").where("key", "==", key).get();
    root.innerHTML = "";

    if (snap.empty) {
      root.textContent = "まだ動画がありません";
      return;
    }

    const videos = snap.docs.map(doc => doc.data());

    // 日付ごとにグループ化
    const grouped = {};
    videos.forEach(v => {
      const dateStr = v.createdAt
        ? new Date(v.createdAt.seconds * 1000).toLocaleDateString()
        : "不明日付";
      if (!grouped[dateStr]) grouped[dateStr] = [];
      grouped[dateStr].push(v);
    });

    Object.keys(grouped)
      .sort((a,b)=>b.localeCompare(a))
      .forEach(date => {
        const details = document.createElement("details");
        details.open = false;

        const summary = document.createElement("summary");
        summary.textContent = date + " の動画";
        details.appendChild(summary);

        grouped[date].forEach(v => {
          if (!v.videoId) return;

          const div = document.createElement("div");
          div.className = "video";

          // サムネイル表示
          const thumb = document.createElement("img");
          thumb.src = `https://img.youtube.com/vi/${v.videoId}/hqdefault.jpg`;
          thumb.style.cursor = "pointer";

          // クリックで iframe に切り替え
          thumb.onclick = () => {
            div.innerHTML = `<iframe src="https://www.youtube.com/embed/${v.videoId}" allowfullscreen></iframe>
                             <div class="title">${v.title || ""}</div>`;
          };

          div.appendChild(thumb);

          const title = document.createElement("div");
          title.className = "title";
          title.textContent = v.title || "";
          div.appendChild(title);

          details.appendChild(div);
        });

        root.appendChild(details);
      });

  } catch (e) {
    root.textContent = "エラーが発生しました: " + e.message;
  }
}

/***********************
 * 管理用：動画登録（以前のまま）
 ***********************/
async function addVideo() {
  try {
    const key = getKey();
    if (!key) {
      alert("管理キーがありません");
      return;
    }

    const titleInput = document.getElementById("title");
    const urlInput = document.getElementById("url");
    const msg = document.getElementById("msg");

    const title = titleInput.value.trim();
    const url = urlInput.value.trim();

    msg.textContent = "";

    if (!title || !url) {
      msg.textContent = "未入力があります";
      return;
    }
    
    // YouTube URL 解析
    let videoId = null;

    let m = url.match(/v=([^&]+)/);
    if (m) videoId = m[1];

    if (!videoId) {
      m = url.match(/youtu\.be\/([^?]+)/);
      if (m) videoId = m[1];
    }

    if (!videoId) {
      m = url.match(/youtube\.com\/shorts\/([^?]+)/);
      if (m) videoId = m[1];
    }

    if (!videoId) {
      msg.textContent = "YouTube URL が正しくありません";
      return;
    }
    
    await db.collection("videos").add({
      key: key,
      title: title,
      videoId: videoId,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    msg.textContent = "登録しました 🎉";
    titleInput.value = "";
    urlInput.value = "";

  } catch (e) {
    alert("登録エラー: " + e.message);
  }
}
