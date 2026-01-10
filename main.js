/***********************
 * Firebase 初期化
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
 * 一覧表示（検索＋日付折りたたみ）
 ***********************/
async function initViewer(){
  const key = getKey();
  const root = document.getElementById("videos");
  const search = document.getElementById("search");

  if(!key){
    root.textContent = "アクセスキーがありません";
    return;
  }

  const snap = await db.collection("videos")
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
    const groups = {};

    list.forEach(v=>{
      const d = v.createdAt
        ? new Date(v.createdAt.seconds*1000).toLocaleDateString()
        : "不明";
      (groups[d] ||= []).push(v);
    });

    Object.keys(groups).sort().reverse().forEach(date=>{
      const header = document.createElement("div");
      header.className="date-header";
      header.innerHTML = `🐾 ${date}<span>${groups[date].length}件</span>`;

      const box = document.createElement("div");
      box.style.display = "none"; // ← ★これが無かった（初期は折りたたみ）

      header.onclick=()=>{
        box.style.display = box.style.display==="none" ? "" : "none";
        if(soundOn){
          dogSound.currentTime = 0;
          dogSound.play().catch(()=>{});
        }
      };

      groups[date].forEach(v=>{
        const div=document.createElement("div");
        div.className="video";
        div.innerHTML=`
          <iframe src="https://www.youtube.com/embed/${v.videoId}" allowfullscreen></iframe>
          <div class="title">${v.title}</div>
        `;
        box.appendChild(div);
      });

      root.appendChild(header);
      root.appendChild(box);
    });
  }

  render(all);

  /* 🔍 検索 */
  search.oninput=()=>{
    const q=search.value.toLowerCase();
    render(all.filter(v=>v.title.toLowerCase().includes(q)));
  };
}
