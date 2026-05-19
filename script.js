import { WORKER_ENDPOINT, FIREBASE_SETTINGS } from './firebase-config.js';

const DEFAULT_DATA = {theme:'',scenarioProblem:'',scenarioAction:'',scenarioWish:'',step1_1:'',step1_2:'',step2_1:'',step2_2:'',step2_3:'',step2_4:'',step3_1:'',step3_2:''};
const STORAGE_KEY = 'sanlun242.form.v1';
const USAGE_KEY = 'sanlun242.usage.v1';
let formData = {...DEFAULT_DATA};
let generatedImage = '';
let db = null;

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const fields = Object.keys(DEFAULT_DATA);

function setStatus(){
  $('#cloud-status').textContent = WORKER_ENDPOINT ? 'AI 後端：已連線' : 'AI 後端：待設定';
  if(!WORKER_ENDPOINT) $('#setup-warning').classList.remove('hidden');
}

async function initFirebase(){
  if(!FIREBASE_SETTINGS.enabled) return;
  try{
    const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js');
    const { getFirestore, collection, addDoc, serverTimestamp, getCountFromServer } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
    const app = initializeApp(FIREBASE_SETTINGS.config);
    db = { firestore:getFirestore(app), collection, addDoc, serverTimestamp, getCountFromServer };
    await addUsage('visit');
    await refreshUserCount();
  }catch(err){ console.warn('Firebase 尚未設定或初始化失敗：', err); }
}

async function addUsage(type, extra={}){
  const local = JSON.parse(localStorage.getItem(USAGE_KEY)||'{}');
  local[type] = (local[type]||0)+1;
  localStorage.setItem(USAGE_KEY, JSON.stringify(local));
  if(db){
    try{ await db.addDoc(db.collection(db.firestore,'usageLogs'), { type, extra, createdAt: db.serverTimestamp(), ua:navigator.userAgent }); }catch(e){ console.warn(e); }
  }
}

async function refreshUserCount(){
  const local = JSON.parse(localStorage.getItem(USAGE_KEY)||'{}');
  $('#user-count').textContent = `本機使用：${Object.values(local).reduce((a,b)=>a+b,0)} 次`;
  if(db){
    try{
      const snap = await db.getCountFromServer(db.collection(db.firestore,'usageLogs'));
      $('#user-count').textContent = `全站使用紀錄：${snap.data().count} 筆`;
    }catch(e){}
  }
}

function loadDraft(){
  try{ formData = {...DEFAULT_DATA, ...(JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}'))}; }catch{ formData={...DEFAULT_DATA}; }
  fields.forEach(k=>{ const el = `[name="${k}"]`; const node=$(el); if(node) node.value=formData[k]||''; });
}
function saveDraft(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(formData)); }
function bindInputs(){
  fields.forEach(k=>{ const node=$(`[name="${k}"]`); if(node) node.addEventListener('input', e=>{ formData[k]=e.target.value; saveDraft(); }); });
}
function switchView(view){
  $('#form-view').classList.toggle('active',view==='form');
  $('#summary-view').classList.toggle('active',view==='summary');
  window.scrollTo({top:0,behavior:'smooth'});
}

function fillSummary(){
  const d = new Date();
  $('#today').textContent = `${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日 實踐紀錄`;
  $('#summary-theme').textContent = formData.theme || '主題';
  $$('[data-out]').forEach(el=>{ el.textContent = formData[el.dataset.out] || '（尚未填寫）'; });
}

function example(){
  formData={theme:'大包衛生紙',scenarioProblem:'爬山遇到公廁沒有衛生紙，感到不便與匱乏。',scenarioAction:'轉念買了大包衛生紙，留給後面需要的人。',scenarioWish:'希望這能幫助到您！願所有困境都有人拉一把。',step1_1:'揉碎「孤立無援」的感受，丟進宇宙黑洞。覺察我是無限可能，好種子能顯化一切。',step1_2:'今天不只為我。為世上所有「遇到問題時，渴望有人拉一把」的人，一起種下這顆種子。',step2_1:'買衛生紙的錢來自我的薪水與善意；幫人解決問題的心，來自日常累積的善意。',step2_2:'感恩空蕩蕩的公廁與即將來使用的長輩、路人們，謝謝你們成為完美的土壤。',step2_3:'我代表世界上「想幫忙卻不知如何行動」的人，匯聚大家的力量一起付出。',step2_4:'這份解方不留在這裡。願全球任何需要協助的人，都能在此刻獲得資源、完美解決！',step3_1:'將「解決問題」的好種子貼上標籤，發射到我的夢想畫面：我正開心享受做著充滿熱情與使命感的事業！',step3_2:'想像自己化為光影，從心中向全世界發射光芒。看見大家的目標都達成，共享輕鬆愉快的感恩時刻。'};
  fields.forEach(k=>{ const n=$(`[name="${k}"]`); if(n)n.value=formData[k]; }); saveDraft();
}

async function callWorker(kind, payload){
  if(!WORKER_ENDPOINT) throw new Error('尚未設定 Cloudflare Worker 網址');
  const res = await fetch(WORKER_ENDPOINT, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({kind, payload}) });
  if(!res.ok) throw new Error(await res.text());
  return await res.json();
}

function promptForDiary(){
  return `你是一個深諳「金剛商法、種子法則」與「三輪體空」的智慧助手。請以繁體中文，根據主題「${formData.theme}」，撰寫一篇溫暖、正向、具體的三輪體空242實踐日記。請只輸出JSON，欄位包含 scenarioProblem, scenarioAction, scenarioWish, step1_1, step1_2, step2_1, step2_2, step2_3, step2_4, step3_1, step3_2。`;
}

async function aiWrite(){
  if(!formData.theme.trim()) return alert('請先輸入今天的主題喔！');
  const btn=$('#ai-write-btn'); btn.disabled=true; btn.textContent='AI 靈感湧現中...';
  try{
    const result = await callWorker('text', { prompt: promptForDiary() });
    const text = result.text || result.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const clean = text.replace(/^```json\s*/,'').replace(/```$/,'').trim();
    const data = JSON.parse(clean);
    formData = {...formData, ...data}; fields.forEach(k=>{ const n=$(`[name="${k}"]`); if(n)n.value=formData[k]||''; }); saveDraft(); await addUsage('ai_text');
  }catch(e){ alert('AI 產生失敗：' + e.message); }
  finally{ btn.disabled=false; btn.textContent='✨ AI 幫我寫'; refreshUserCount(); }
}

async function aiImage(){
  const box=$('#ai-image-result'); box.innerHTML='<p>圖片生成中...</p>';
  try{
    const result = await callWorker('image', { prompt:`溫暖、療癒、柔和光感插畫，主題是「${formData.theme}」的三輪體空善意實踐，乾淨高質感，可作為祝福圖卡，不要文字。` });
    const img = result.imageBase64 ? `data:image/png;base64,${result.imageBase64}` : result.imageUrl;
    if(!img) throw new Error('Worker 未回傳圖片資料');
    box.innerHTML = `<img src="${img}" alt="AI 生成圖片"><p><a download="AI實踐圖片.png" href="${img}">下載 AI 圖片</a></p>`;
    await addUsage('ai_image'); refreshUserCount();
  }catch(e){ box.innerHTML=`<p class="notice">AI 圖片生成失敗：${e.message}</p>`; }
}

async function captureCard(){
  if(!window.html2canvas) return alert('圖片套件載入中，請稍候再試。');
  const canvas = await html2canvas($('#practice-card'), { scale:2, backgroundColor:'#FAF7F2', useCORS:true });
  generatedImage = canvas.toDataURL('image/png');
  $('#generated-image').src = generatedImage;
  $('#image-dialog').showModal();
  await addUsage('capture'); refreshUserCount();
}
function downloadImage(){ const a=document.createElement('a'); a.download=`三輪體空實踐_${formData.theme||'日記'}.png`; a.href=generatedImage; a.click(); }
async function shareImage(){
  try{
    const blob=await (await fetch(generatedImage)).blob(); const file=new File([blob],`三輪體空_${formData.theme||'日記'}.png`,{type:'image/png'});
    if(navigator.canShare?.({files:[file]})) await navigator.share({title:'我的三輪體空實踐',text:`與你分享：${formData.theme}`,files:[file]}); else downloadImage();
    await addUsage('share_image'); refreshUserCount();
  }catch(e){}
}
async function shareText(){
  const text = `我的三輪體空242實踐｜${formData.theme}\n\n問題：${formData.scenarioProblem}\n行動：${formData.scenarioAction}\n期許：${formData.scenarioWish}`;
  if(navigator.share) await navigator.share({title:'三輪體空242實踐',text}); else { await navigator.clipboard.writeText(text); alert('已複製文字，可貼到 LINE 或社群。'); }
  await addUsage('share_text'); refreshUserCount();
}

let deferredPrompt=null;
window.addEventListener('beforeinstallprompt', e=>{ e.preventDefault(); deferredPrompt=e; $('#install-status').textContent='可加入手機桌面'; });
if('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(console.warn);

function init(){
  setStatus(); loadDraft(); bindInputs(); initFirebase().then(refreshUserCount);
  $('#example-btn').onclick=example; $('#ai-write-btn').onclick=aiWrite; $('#submit-btn').onclick=()=>{ if(!formData.theme.trim()) return alert('請輸入今天的主題物品喔！'); fillSummary(); switchView('summary'); addUsage('complete'); refreshUserCount(); };
  $('#back-btn').onclick=()=>switchView('form'); $('#new-btn').onclick=()=>{ if(confirm('要清空並新增一筆嗎？')){ formData={...DEFAULT_DATA}; saveDraft(); loadDraft(); switchView('form'); }};
  $('#clear-btn').onclick=()=>{ if(confirm('確定清除草稿？')){ formData={...DEFAULT_DATA}; localStorage.removeItem(STORAGE_KEY); loadDraft(); }};
  $('#capture-btn').onclick=captureCard; $('#close-dialog').onclick=()=>$('#image-dialog').close(); $('#download-image').onclick=downloadImage; $('#share-image').onclick=shareImage; $('#share-text-btn').onclick=shareText; $('#ai-image-btn').onclick=aiImage;
  if(WORKER_ENDPOINT) $('#ai-image-panel').classList.remove('hidden');
}
init();
