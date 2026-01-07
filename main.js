/***********************
 * Firebase 初期化
 ***********************/
const firebaseConfig = {
  apiKey: "ここを自分のに",
  authDomain: "ここを自分のに",
  projectId: "ここを自分のに",
  storageBucket: "ここを自分のに",
  messagingSenderId: "ここを自分のに",
  appId: "ここを自分のに"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

/***********************
 * 共通：URLキー取得
 ***********************/
function getKey() {
  const p = new URLSearchParams(location.search);
  return p.get("key");
}

/***********************
 * 家族用：一覧表示
 ***********************/
async function initViewer() {
  const key = getKey();
  if (!key) {
    document.body.innerHTML = "アクセスキーがありません";
    return;
  }

  const snap = await db
    .collection("videos")
    .where("key", "==", key)
    .orderBy("createdAt", "desc")
    .get();

  const root = document.getElementById("videos");
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
      <iframe src="https://www.youtube.com/embed/${v.videoId}"
        allowfullscreen></iframe>
      <div class="title">${v.title}</div>
      <div class="date">${new Date(v.createdAt.seconds * 1000).toLocaleDateString()}</div>
    `;
    root.appendChild(div);
  });
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

  const title = document.getElementById("title").value.trim();
  const url = document.getElementById("url").value.trim();
  const msg = document.getElementById("msg");

  if (!title || !url) {
    msg.textContent = "未入力があります";
    return;
  }

  const m = url.match(/v=([^&]+)/);
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

  msg.textContent = "登録しました 🎉";
  document.getElementById("title").value = "";
  document.getElementById("url").value = "";
}
