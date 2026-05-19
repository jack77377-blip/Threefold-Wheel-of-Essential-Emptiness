const fields = ['theme','scenarioProblem','scenarioAction','scenarioWish','step1_1','step1_2','step2_1','step2_2','step2_3','step2_4','step3_1','step3_2'];
let generatedImage = null;

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

function getFormData(){
  const data = {};
  fields.forEach(name => {
    const el = document.querySelector(`[name="${name}"], #${name}`);
    data[name] = el ? el.value.trim() : '';
  });
  return data;
}

function setFormData(data){
  Object.entries(data).forEach(([name,value]) => {
    const el = document.querySelector(`[name="${name}"], #${name}`);
    if(el) el.value = value || '';
  });
}

function showView(view){
  $('#formView').classList.toggle('active', view === 'form');
  $('#summaryView').classList.toggle('active', view === 'summary');
  window.scrollTo({top:0, behavior:'smooth'});
}

function fillSummary(data){
  const d = new Date();
  $('#dateText').textContent = `${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日 實踐紀錄`;
  $('#cardTheme').textContent = data.theme || '主題';
  $$('[data-out]').forEach(el => {
    const key = el.getAttribute('data-out');
    el.textContent = data[key] || '—';
  });
}

function resetForm(){
  const blank = Object.fromEntries(fields.map(f => [f,'']));
  setFormData(blank);
  generatedImage = null;
  showView('form');
}

function fillExample(){
  setFormData({
    theme: '大包衛生紙',
    scenarioProblem: '爬山遇到公廁沒有衛生紙，感到不便與匱乏。',
    scenarioAction: '轉念買了大包衛生紙，留給後面需要的人。',
    scenarioWish: '希望這能幫助到您！願所有困境都有人拉一把。',
    step1_1: '揉碎「孤立無援」的感受，丟進宇宙黑洞。覺察我是無限可能，好種子能顯化一切。',
    step1_2: '今天不只為我。為世上所有「遇到問題時，渴望有人拉一把」的人，一起種下這顆種子。',
    step2_1: '買衛生紙的錢來自我的薪水與善意；幫人解決問題的心，來自日常累積的善意。',
    step2_2: '感恩空蕩蕩的公廁與即將來使用的長輩、路人們，謝謝你們成為完美的土壤。',
    step2_3: '我代表世界上「想幫忙卻不知如何行動」的人，匯聚大家的力量一起付出。',
    step2_4: '這份解方不留在這裡。願全球任何需要協助的人，都能在此刻獲得資源、完美解決！',
    step3_1: '將「解決問題」的好種子貼上標籤，發射到我的夢想畫面：我正開心享受做著充滿熱情與使命感的事業！',
    step3_2: '想像自己化為光影，從心中向全世界發射光芒。看見大家的目標都達成，共享輕鬆愉快的感恩時刻。'
  });
}

function saveApiKey(){
  const key = $('#apiKey').value.trim();
  if(!key){ alert('請先輸入 Gemini API Key。'); return; }
  localStorage.setItem('gemini_api_key', key);
  alert('已儲存在你的瀏覽器，不會上傳到 GitHub。');
}

async function handleAIGenerate(){
  const data = getFormData();
  const apiKey = $('#apiKey').value.trim() || localStorage.getItem('gemini_api_key') || '';
  if(!data.theme){ alert('請先輸入今天的主題喔！'); return; }
  if(!apiKey){ alert('請先輸入 Gemini API Key，或改用「載入範例」再自行修改。'); return; }

  const btn = $('#aiBtn');
  btn.disabled = true;
  btn.textContent = '靈感湧現中...';

  const promptText = `你是一個深諳「金剛商法（種子法則）」與「三輪體空」的智慧助手。請以繁體中文，根據主題「${data.theme}」，撰寫一篇溫暖、正向、具體的「三輪體空 242 實踐」日記。請只回傳 JSON，欄位包含 scenarioProblem, scenarioAction, scenarioWish, step1_1, step1_2, step2_1, step2_2, step2_3, step2_4, step3_1, step3_2。`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${encodeURIComponent(apiKey)}`;
  const payload = {
    contents: [{ parts: [{ text: promptText }] }],
    generationConfig: { responseMimeType: 'application/json' }
  };

  try{
    const res = await fetch(url, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
    if(!res.ok) throw new Error(`API 回應錯誤：${res.status}`);
    const result = await res.json();
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
    if(!text) throw new Error('沒有取得 AI 文字');
    const generated = JSON.parse(text);
    setFormData({ ...data, ...generated });
  }catch(err){
    console.error(err);
    alert('AI 產生失敗，請確認 API Key 是否正確，或先手動填寫。');
  }finally{
    btn.disabled = false;
    btn.textContent = '🪄 AI 幫我寫';
  }
}

async function generateImage(){
  const card = $('#practice-card');
  if(!window.html2canvas){ alert('圖片套件載入中，請稍後再試。'); return; }
  $('#imageBtn').disabled = true;
  $('#imageBtn').textContent = '正在產生圖片...';
  try{
    const canvas = await html2canvas(card, { scale:2, backgroundColor:'#FAF7F2', useCORS:true });
    generatedImage = canvas.toDataURL('image/png');
    $('#previewImg').src = generatedImage;
    $('#modal').classList.add('active');
    $('#modal').setAttribute('aria-hidden','false');
  }catch(err){
    console.error(err);
    alert('圖片生成發生錯誤，請稍後再試。');
  }finally{
    $('#imageBtn').disabled = false;
    $('#imageBtn').textContent = '產生圖片分享';
  }
}

function downloadImage(){
  if(!generatedImage) return;
  const data = getFormData();
  const a = document.createElement('a');
  a.download = `三輪體空實踐_${data.theme || '日記'}.png`;
  a.href = generatedImage;
  a.click();
}

async function shareImage(){
  if(!generatedImage) return;
  try{
    const blob = await (await fetch(generatedImage)).blob();
    const data = getFormData();
    const file = new File([blob], `三輪體空_${data.theme || '日記'}.png`, {type:'image/png'});
    if(navigator.canShare && navigator.canShare({files:[file]})){
      await navigator.share({ title:'我的三輪體空實踐', text:`與你分享我今天的實踐主題：${data.theme} 🌱`, files:[file] });
    }else{
      alert('目前瀏覽器不支援直接分享檔案，請使用下載圖片。');
    }
  }catch(err){ console.log(err); }
}

document.addEventListener('DOMContentLoaded', () => {
  const saved = localStorage.getItem('gemini_api_key');
  if(saved) $('#apiKey').value = saved;
  $('#saveApiBtn').addEventListener('click', saveApiKey);
  $('#aiBtn').addEventListener('click', handleAIGenerate);
  $('#exampleBtn').addEventListener('click', fillExample);
  $('#submitBtn').addEventListener('click', () => {
    const data = getFormData();
    if(!data.theme){ alert('請輸入今天的主題物品喔！'); return; }
    fillSummary(data);
    showView('summary');
  });
  $('#backBtn').addEventListener('click', () => showView('form'));
  $('#resetBtn').addEventListener('click', resetForm);
  $('#imageBtn').addEventListener('click', generateImage);
  $('#downloadBtn').addEventListener('click', downloadImage);
  $('#shareBtn').addEventListener('click', shareImage);
  $('#closeModal').addEventListener('click', () => { $('#modal').classList.remove('active'); $('#modal').setAttribute('aria-hidden','true'); });
});
