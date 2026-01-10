/***********************
 * Firebase 初期化（Compat）
 ***********************/
firebase.initializeApp({
  apiKey: "AIzaSyA-u--fB_d8W6zRTJYj4PLyHc61pNQpKjQ",
  authDomain: "dog-family-videos.firebaseapp.com",
  projectId: "dog-family-videos"
});
const db = firebase.firestore();

/***********************
 * key 取得
 ***********************/
function getKey(){
  return new URLSearchParams(location.search).get("key");
}

/***********************
 * ワン！SE（消音可）
 ***********************/
let soundOn = true;
const dogSound = new Audio("dog.mp3");

/***********************
 * 家族用：一覧表示
 * ・検索
 * ・日付ごと折りたたみ（初期は閉じる）
 * ・日付クリックでワン！
 * ・最新日付が一番上
 ***********************/
async function initViewer(){
  const key = getKey();
  const root = document.getElementById("videos");
  const search = document.getElementById("search");

  // 管理画面では何もしない
  if(!root) return;

  if(!key){
    root.textContent = "アクセスキーがありません";
    return;
  }

  root.textContent = "読み込み中...";

  try{
    const snap = await db
      .collection("videos")
      .where("key","==",key)
      .get();

    if(snap.empty){
      root.textContent = "動画がありません";
      return;
    }

    const all = [];
    snap.forEach(d => all.push(d.data()));

    function render(list){
      root.innerHTML = "";

      // 日付ごとにまとめる（time を保持）
      const groups = {};

      list.forEach(v=>{
        const dateObj = v.createdAt
          ? new Date(v.createdAt.seconds * 1000)
          : new Date(0);

        const dateKey = dateObj.toLocaleDateString();

        if(!groups[dateKey]){
          groups[dateKey] = {
            time: dateObj.getTime(),
            items: []
          };
        }
        groups[dateKey].items.push(v);
      });

      // 最新日付が一番上
      Object.values(groups)
        .sort((a,b) => b.time - a.time)
        .forEach(group => {

          const date = new Date(group.time).toLocaleDateString();

          const header = document.createElement("div");
          header.className = "date-header";
          header.innerHTML = `🐾 ${date}<span>${group.items.length}件</span>`;

          const box = document.createElement("div");
          box.style.display = "none"; // 初期は折りたたみ

          header.onclick = () => {
            box.style.display = box.style.display === "none" ? "" : "none";
            if(soundOn){
              dogSound.currentTime = 0;
              dogSound.play().catch(()=>{});
            }
          };

          group.items.forEach(v=>{
            const div = document.createElement("div");
            div.className = "video";
            div.innerHTML = `
              <iframe
                src="https://www.youtube.com/embed/${v.videoId}"
                allowfullscreen>
              </iframe>
              <div class="title">${v.title}</div>
            `;
            box.appendChild(div);
          });

          root.appendChild(header);
          root.appendChild(box);
        });
    }

    render(all);

    // 🔍 検索
    if(search){
      search.oninput = () => {
        const q = search.value.toLowerCase();
        render(
          all.filter(v =>
            v.title.toLowerCase().includes(q)
          )
        );
      };
    }

  }catch(e){
    console.error(e);
    root.textContent = "動画の読み込みに失敗しました";
  }
}

/***********************
 * 管理用：動画登録
 * ・通常URL
 * ・短縮URL
 * ・Shorts 対応
 ***********************/
async function addVideo(){
  const titleInput = document.getElementById("title");
  const urlInput   = document.getElementById("url");
  const msg        = document.getElementById("msg");

  // 管理画面以外では実行しない
  if(!titleInput || !urlInput || !msg) return;

  const key = getKey();
  if(!key){
    alert("URLに key がありません");
    return;
  }

  const title = titleInput.value.trim();
  const url   = urlInput.value.trim();
  msg.textContent = "";

  if(!title || !url){
    msg.textContent = "未入力があります";
    return;
  }

  let videoId = null;

  // 通常URL
  let m = url.match(/v=([^&]+)/);
  if(m) videoId = m[1];

  // 短縮URL
  if(!videoId){
    m = url.match(/youtu\.be\/([^?]+)/);
    if(m) videoId = m[1];
  }

  // Shorts
  if(!videoId){
    m = url.match(/shorts\/([^?]+)/);
    if(m) videoId = m[1];
  }

  if(!videoId){
    msg.textContent = "YouTube URL が正しくありません";
    return;
  }

  try{
    await db.collection("videos").add({
      key,
      title,
      videoId,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    msg.textContent = "登録しました 🐾";
    titleInput.value = "";
    urlInput.value   = "";

  }catch(e){
    console.error(e);
    msg.textContent = "登録に失敗しました";
  }
}
