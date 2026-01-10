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
  const params = new URLSearchParams(location.search);
  return params.get("key");
}

/***********************
 * 家族用：動画一覧表示
 ***********************/
async function initViewer() {
  const key = getKey();
  if (!key) {
    document.getElementById("videos").textContent = "アクセスキーがありません";
    return;
  }

  const root = document.getElementById("videos");
  root.textContent = "読み込み中...";

  try {
    const snap = await db
      .collection("videos")
      .where("key", "==", key)
      .orderBy("createdAt", "desc")
      .get();

    root.innerHTML = "";

    if (snap.empty) {
      root.textContent = "まだ動画がありません";
      return;
    }

    snap.forEach(doc => {
      const v = doc.data();

      const div = document.createElement("div");
      div.className = "video";

      div.innerHTML = `
        <iframe
          src="https://www.youtube.com/embed/${v.videoId}"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
        ></iframe>
        <div class="title">${v.title}</div>
        <div class="date">
          ${v.createdAt ? new Date(v.createdAt.seconds * 1000).toLocaleDateString() : ""}
        </div>
      `;

      root.appendChild(div);
    });

  } catch (e) {
    console.error(e);
    root.textContent = "読み込みに失敗しました";
  }
}

/***********************
 * 管理用：動画登録
 ***********************/
async function addVideo() {
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

  // YouTube URL解析（通常・短縮・ショート対応）
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
    key: key,
    title: title,
    videoId: videoId,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });

  msg.textContent = "登録しました 🐶";
  titleInput.value = "";
  urlInput.value = "";
}
