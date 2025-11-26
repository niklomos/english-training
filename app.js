/* app.js — generated from provided inline scripts
   Place this file in your project and include it after loading dependencies
   (Bootstrap JS bundle, PapaParse, and any HTML elements referenced).
*/

// ------------------------------
// Theme toggle
// ------------------------------
const THEME_KEY = 'vt_theme';
const themeToggle = document.getElementById('themeToggle');
const navEl = document.querySelector('.navbar');
function applyTheme(theme){
  if(theme === 'dark'){
    document.documentElement.classList.add('dark');
    navEl && navEl.classList.add('navbar-dark');
    navEl && navEl.classList.remove('navbar-light');
  } else {
    document.documentElement.classList.remove('dark');
    navEl && navEl.classList.remove('navbar-dark');
    navEl && navEl.classList.add('navbar-light');
  }
  // update button icon / aria
  if(theme === 'dark'){
    themeToggle && (themeToggle.textContent = '☀️');
    themeToggle && themeToggle.setAttribute('aria-pressed','true');
  } else {
    themeToggle && (themeToggle.textContent = '🌙');
    themeToggle && themeToggle.setAttribute('aria-pressed','false');
  }
  try{ localStorage.setItem(THEME_KEY, theme); }catch(e){}
}
function toggleTheme(){
  const cur = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  applyTheme(cur === 'dark' ? 'light' : 'dark');
}
// init on load
(function(){
  const saved = localStorage.getItem(THEME_KEY);
  if(saved) applyTheme(saved);
  else {
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(prefersDark ? 'dark' : 'light');
  }
})();
themeToggle && themeToggle.addEventListener('click', toggleTheme);


// ------------------------------
// Original app script (vocabulary trainer)
// ------------------------------

/* ------------------------------
  Data model & storage
-------------------------------*/
const STORAGE_KEY = 'vocab_responsive_v1';
let vocab = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
function saveAll(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(vocab)); updateStatsUI(); }
function loadAll(){ vocab = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }

/* ------------------------------
  Tab handling (uses data-tab attributes)
-------------------------------*/
document.querySelectorAll('.nav-link').forEach(t => {
  t.addEventListener('click', ()=>{
    document.querySelectorAll('.nav-link').forEach(x=>x.classList.remove('active'));
    t.classList.add('active');
    const tab = t.dataset.tab;
    document.querySelectorAll('[id^="panel-"]').forEach(p=>p.style.display='none');
    document.getElementById('panel-' + tab).style.display = 'block';
    refreshUI();
  });
});

/* ------------------------------
  Library functions
-------------------------------*/
function renderLibrary(){
  const list = document.getElementById('list'); list.innerHTML = '';
  const q = (document.getElementById('search').value || '').toLowerCase();
  const filter = document.getElementById('filter').value;
  let items = vocab.map((it,i)=>({...it, idx:i}));
  if(filter === 'weak') items = items.filter(i=> (i.wrong||0) >= 2);
  if(filter === 'mastered') items = items.filter(i=> (i.correct||0) >= 3);
  if(q) items = items.filter(i => (i.word + ' ' + i.translation).toLowerCase().includes(q));
  if(!items.length){ list.innerHTML = '<div class="small small-muted">ไม่มีคำศัพท์</div>'; return; }
  items.forEach(it=>{
    const el = document.createElement('div'); el.className = 'list-group-item d-flex justify-content-between align-items-center';
    el.innerHTML = `<div class="d-flex gap-3 align-items-center"><div class="badge bg-light text-muted" style="min-width:44px;text-align:center">${it.idx+1}</div><div><div class="fw-bold">${escapeHtml(it.word)}</div><div class="small text-muted">${escapeHtml(it.translation)}</div><div class="small">✅ ${it.correct||0} ❌ ${it.wrong||0}</div></div></div>
      <div class="d-flex gap-2 align-items-center">
        <button class="btn btn-outline-secondary btn-sm" onclick="playENIndex(${it.idx})">🔊</button>
        <button class="btn btn-outline-primary btn-sm" onclick="editItem(${it.idx})">✏️</button>
        <button class="btn btn-danger btn-sm" onclick="deleteItem(${it.idx})">🗑</button>
      </div>`;
    list.appendChild(el);
  });
}
function addWord(){
  const w = document.getElementById('inputWord').value.trim();
  const t = document.getElementById('inputTrans').value.trim();
  if(!w || !t) return alert('กรุณากรอก Word และ Translation');
  vocab.push({word:w, translation:t, correct:0, wrong:0, lastSeen: Date.now()});
  document.getElementById('inputWord').value=''; document.getElementById('inputTrans').value='';
  saveAll(); renderLibrary();
}
function editItem(i){
  const it = vocab[i];
  const nw = prompt('แก้คำศัพท์', it.word); if(nw===null) return;
  const nt = prompt('แก้คำแปล', it.translation); if(nt===null) return;
  it.word = nw.trim(); it.translation = nt.trim(); it.lastSeen = Date.now(); saveAll(); renderLibrary();
}
function deleteItem(i){ if(!confirm('ลบคำศัพท์?')) return; vocab.splice(i,1); saveAll(); renderLibrary(); }
function clearAll(){ if(!confirm('ล้างทั้งหมด?')) return; vocab = []; saveAll(); renderLibrary(); }

/* ------------------------------
  Import / Export CSV
-------------------------------*/
function handleImportFile(e){
  const f = e.target.files[0]; if(!f) return;
  Papa.parse(f, { header:true, skipEmptyLines:true, complete(results){
    const rows = results.data; const items=[];
    for(const r of rows){
      const W = r.Word ?? r.word ?? Object.values(r)[0];
      const T = r.Translation ?? r.translation ?? Object.values(r)[1];
      if(!W || !T) continue;
      items.push({word:String(W).trim(), translation:String(T).trim(), correct:0, wrong:0, lastSeen: Date.now()});
    }
    if(!items.length) return alert('ไม่พบคำในไฟล์');
    vocab = items; saveAll(); alert('นำเข้าเรียบร้อย: ' + items.length + ' คำ'); renderLibrary();
  }, error(err){ alert('Import failed: '+err.message); }});
}
function importFromPaste(){
  const txt = document.getElementById('pasteCsv').value.trim(); if(!txt) return alert('วาง CSV ก่อน');
  const parsed = Papa.parse(txt, { header:true, skipEmptyLines:true }); const rows = parsed.data; const items=[];
  for(const r of rows){
    const W = r.Word ?? r.word ?? Object.values(r)[0];
    const T = r.Translation ?? r.translation ?? Object.values(r)[1];
    if(!W || !T) continue;
    items.push({word:String(W).trim(), translation:String(T).trim(), correct:0, wrong:0, lastSeen: Date.now()});
  }
  if(!items.length) return alert('ไม่พบคำในข้อมูลที่วาง');
  vocab = items; saveAll(); alert('นำเข้าเรียบร้อย: ' + items.length + ' คำ'); renderLibrary();
}
function autoFixPaste(){
  const txt = document.getElementById('pasteCsv').value;
  if(!txt) return alert('วางข้อความก่อน');
  try{
    if(/%[0-9A-F]{2}/i.test(txt)){ document.getElementById('pasteCsv').value = decodeURIComponent(txt); alert('decodeURIComponent applied'); return; }
    document.getElementById('pasteCsv').value = decodeURIComponent(escape(txt)); alert('attempted latin1->utf8 conversion');
  }catch(e){ alert('ไม่สามารถแปลงอัตโนมัติได้'); }
}
function exportCSV(){
  if(!vocab.length) return alert('ไม่มีคำศัพท์');
  const rows = vocab.map(i=>({Word:i.word, Translation:i.translation}));
  const csv = Papa.unparse(rows);
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'vocabulary.csv'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}
async function copyCSV(){
  if(!vocab.length) return alert('ไม่มีคำศัพท์');
  const rows = vocab.map(i=>({Word:i.word, Translation:i.translation}));
  const csv = Papa.unparse(rows);
  try{ await navigator.clipboard.writeText(csv); alert('คัดลอกเรียบร้อย'); } catch(e){ alert('คัดลอกล้มเหลว'); }
}

/* ------------------------------
  Practice (flashcards) — updated with shuffle toggle & pID hide + auto EN play
-------------------------------*/
let practiceQueue = [], practiceIndex = 0;
let shuffleMode = false; // false = ordered, true = shuffle

// toggle shuffle mode (connect with shuffle button)
function toggleShuffle(btn){
  shuffleMode = !shuffleMode;
  // Update button UI
  if(btn){
    btn.classList.toggle('btn-primary', shuffleMode);
    btn.classList.toggle('btn-outline-secondary', !shuffleMode);
    btn.setAttribute('aria-pressed', String(shuffleMode));
    btn.textContent = shuffleMode ? 'Shuffle: ON' : 'Shuffle';
  } else {
    const b = document.getElementById('shuffleBtn');
    if(b) toggleShuffle(b);
  }

  // If practice is active, adjust current queue immediately
  if(practiceQueue.length){
    if(shuffleMode){
      shuffleArray(practiceQueue);
      practiceIndex = 0;
      showPracticeCard();
    } else {
      // rebuild ordered queue from current start/end and try to keep current item
      const s = parseInt(document.getElementById('pStart').value) || 1;
      const e = parseInt(document.getElementById('pEnd').value) || vocab.length;
      const start = Math.max(1, s) - 1, end = Math.min(vocab.length, e);
      const curIdx = parseInt(document.getElementById('practiceCard').dataset.idx || -1);
      practiceQueue = [];
      for(let i = start; i < end; i++) practiceQueue.push(i);
      practiceIndex = practiceQueue.indexOf(curIdx);
      if(practiceIndex === -1) practiceIndex = 0;
      showPracticeCard();
    }
  } else {
    // no active queue: still update UI (hide/show pID)
    showPracticeCard();
  }
}

function startPractice(){
  if(!vocab.length) return alert('ไม่มีคำศัพท์');
  const s = parseInt(document.getElementById('pStart').value) || 1;
  const e = parseInt(document.getElementById('pEnd').value) || vocab.length;
  const start = Math.max(1, s) - 1, end = Math.min(vocab.length, e);
  if(start >= end) return alert('ช่วงคำไม่ถูกต้อง');
  practiceQueue = [];
  for(let i = start; i < end; i++) practiceQueue.push(i);

  // If shuffle mode is on, shuffle before start
  if(shuffleMode) shuffleArray(practiceQueue);

  practiceIndex = 0;
  document.getElementById('practiceCard').style.display = 'block';
  showPracticeCard();
}

// showPracticeCard: hides pID when shuffleMode === true and auto-plays EN once
function showPracticeCard(){
  const pIDEl = document.getElementById('pID');
  if(!practiceQueue.length){
    // no queue: clear card
    if(pIDEl) pIDEl.style.display = '';
    document.getElementById('pWord').textContent = '';
    document.getElementById('pTrans').textContent = '';
    document.getElementById('pTrans').style.display = 'none';
    document.getElementById('practiceCard').dataset.idx = -1;
    document.getElementById('pCount').textContent = '0';
    document.getElementById('pIndex').textContent = '0';
    document.getElementById('pProgress').style.width = '0%';
    return;
  }

  if(practiceIndex >= practiceQueue.length) practiceIndex = 0;
  const idx = practiceQueue[practiceIndex];
  const it = vocab[idx];

  // hide or show pID based on shuffleMode
  if(shuffleMode){
    if(pIDEl) pIDEl.style.display = 'none';
  } else {
    if(pIDEl){
      pIDEl.style.display = '';
      pIDEl.textContent = (typeof idx === 'number' && idx >= 0) ? (idx + 1) : '—';
    }
  }

  // Word / translation / dataset etc.
  document.getElementById('pWord').textContent = it ? it.word : '(no word)';
  document.getElementById('pTrans').textContent = it ? it.translation : '';
  document.getElementById('pTrans').style.display = 'none';
  document.getElementById('practiceCard').dataset.idx = idx;
  document.getElementById('pCount').textContent = practiceQueue.length;
  document.getElementById('pIndex').textContent = (practiceIndex + 1) + ' / ' + practiceQueue.length;
  const pct = Math.round(((practiceIndex + 1) / practiceQueue.length) * 100);
  document.getElementById('pProgress').style.width = pct + '%';

  // AUTO play English pronunciation once for this shown card
  // Use a tiny timeout so UI updates before TTS starts (helps in some browsers)
  setTimeout(()=> {
    try{
      playEN('practice');
    }catch(e){
      // silently ignore speech errors
      console.warn('TTS play failed', e);
    }
  }, 60);
}

function revealPractice(){ document.getElementById('pTrans').style.display = 'block'; }
function nextPractice(){ practiceIndex++; if(practiceIndex >= practiceQueue.length) practiceIndex = 0; showPracticeCard(); }
function shufflePractice(){
  // If no active queue, interpret as toggle of shuffle mode (user wants to set active/inactive)
  if(!practiceQueue.length){
    toggleShuffle(document.getElementById('shuffleBtn'));
    return;
  }
  // If active queue exists, shuffle it immediately
  shuffleArray(practiceQueue);
  practiceIndex = 0;
  showPracticeCard();
}
function markKnown(){ const idx = parseInt(document.getElementById('practiceCard').dataset.idx || -1); if(idx < 0) return; vocab[idx].correct = (vocab[idx].correct || 0) + 1; vocab[idx].lastSeen = Date.now(); saveAll(); nextPractice(); }
function markWrong(){ const idx = parseInt(document.getElementById('practiceCard').dataset.idx || -1); if(idx < 0) return; vocab[idx].wrong = (vocab[idx].wrong || 0) + 1; vocab[idx].lastSeen = Date.now(); saveAll(); nextPractice(); }
function stopPractice(){ document.getElementById('practiceCard').style.display = 'none'; }
function practiceWeak(){ const weak = vocab.map((it,i)=>({it,i})).filter(x=> (x.it.wrong||0) >= 2).map(x=>x.i); if(!weak.length) return alert('ไม่มีคำที่ผิดบ่อย'); practiceQueue = weak; practiceIndex = 0; document.getElementById('practiceCard').style.display = 'block'; showPracticeCard(); }

/* ------------------------------
  Quiz (multiple choice + spelling + reverse + random per question)
-------------------------------*/
let quizQueue = [], quizScore = 0, quizTotal = 0, quizCurrent = null, sessionWrong = [], quizRandomize = false, quizFixedMode = null;

function startQuiz(){
  if(!vocab.length) return alert('ไม่มีคำศัพท์');
  const s = parseInt(document.getElementById('qStart').value) || 1;
  const e = parseInt(document.getElementById('qEnd').value) || vocab.length;
  const start = Math.max(1, s) - 1, end = Math.min(vocab.length, e);
  if(start >= end) return alert('ช่วงคำไม่ถูกต้อง');

  quizRandomize = document.getElementById('randomMode').checked;
  const fixedMode = document.getElementById('qMode').value;

  // store chosen fixed mode (null if per-question random)
  quizFixedMode = quizRandomize ? null : fixedMode;

  quizQueue = [];
  for(let i = start; i < end; i++) quizQueue.push(i);
  shuffleArray(quizQueue);
  quizTotal = quizQueue.length; quizScore = 0; sessionWrong = [];
  document.getElementById('qScore').textContent = `${quizScore} / ${quizTotal}`;
  document.getElementById('quizCard').style.display = 'block';
  document.getElementById('spellingArea').style.display = 'none';
  showNextQuiz(quizRandomize ? null : quizFixedMode);
}

function showNextQuiz(mode){
  if(!quizQueue.length){
    alert(`จบแบบทดสอบ! คะแนน: ${quizScore} / ${quizTotal}`);
    renderSessionWrong(); return;
  }
  const idx = quizQueue.pop();
  const it = vocab[idx];
  let chosenMode = mode;
  if(quizRandomize || !chosenMode){
    const modes = ['multiple','reverse','spelling','spelling-no-thai'];
    chosenMode = modes[Math.floor(Math.random()*modes.length)];
  }
  quizCurrent = { idx, item: it, mode: chosenMode };
  const modeLabel = chosenMode === 'multiple' ? 'EN → TH' : chosenMode === 'reverse' ? 'TH → EN' : chosenMode === 'spelling' ? 'Spelling EN' :'spelling-no-thai';
  document.getElementById('qCurrentMode').textContent = `Mode: ${modeLabel}`;

  // --- ADDED: auto-play English once per quiz question ---
  // small timeout so UI updates (qWord / qCurrentMode) before TTS fires
// Auto-play English for quiz questions — but skip when mode is 'reverse'
if (chosenMode !== 'reverse') {
  setTimeout(()=> {
    try { playEN('quiz'); }
    catch(e) { console.warn('TTS failed', e); }
  }, 80);
}

  // -------------------------------------------------------

  if(chosenMode === 'spelling'){
    renderSpelling(quizCurrent);
  } else if(chosenMode === 'spelling-no-thai'){
    renderSpellingNoTH(quizCurrent);
  } else if(chosenMode === 'reverse'){
    const options = [it.word];
    const pool = vocab.map(v=>v.word).filter(w=> w !== it.word);
    shuffleArray(pool);
    for(let i=0;i<pool.length && options.length<4;i++){ if(!options.includes(pool[i])) options.push(pool[i]); }
    while(options.length<4) options.push('(no option)'); shuffleArray(options);
    quizCurrent.options = options; renderReverse(quizCurrent);
  } else {
    const options = [it.translation];
    const pool = vocab.map(v=>v.translation).filter(t=> t !== it.translation);
    shuffleArray(pool);
    for(let i=0;i<pool.length && options.length<4;i++){ if(!options.includes(pool[i])) options.push(pool[i]); }
    while(options.length<4) options.push('(no option)'); shuffleArray(options);
    quizCurrent.options = options; renderQuiz(quizCurrent);
  }
}

function renderQuiz(q){
  document.getElementById('qWord').textContent = q.item.word;
  document.getElementById('qHint').textContent = '';
  document.getElementById('spellingArea').style.display = 'none';
  const optsEl = document.getElementById('qOptions'); optsEl.innerHTML = '';
  q.options.forEach(opt=>{
    const d = document.createElement('button'); d.className = 'btn btn-outline-secondary d-block mb-2 option'; d.textContent = opt;
    d.onclick = ()=> evaluateQuiz(opt, q.item.translation, q.idx, d);
    optsEl.appendChild(d);
  });
  const done = quizTotal - quizQueue.length; const pct = Math.round((done/quizTotal)*100);
  document.getElementById('qProgress').style.width = pct + '%';
}

function renderReverse(q){
  document.getElementById('qWord').textContent = q.item.translation;
  document.getElementById('spellingArea').style.display = 'none';
  const optsEl = document.getElementById('qOptions'); optsEl.innerHTML = '';
  q.options.forEach(opt=>{
    const d = document.createElement('button'); d.className = 'btn btn-outline-secondary d-block mb-2 option'; d.textContent = opt;
    d.onclick = ()=> evaluateQuiz(opt, q.item.word, q.idx, d);
    optsEl.appendChild(d);
  });
  const done = quizTotal - quizQueue.length; const pct = Math.round((done/quizTotal)*100);
  document.getElementById('qProgress').style.width = pct + '%';
}

function renderSpelling(q){
  // แสดงคำไทยชัดเจน (restore display)
  const qHintEl = document.getElementById('qHint');
  qHintEl.textContent = q.item.translation;
  qHintEl.style.display = 'block';

  document.getElementById('qWord').textContent = '';
  document.getElementById('qBlanks').innerHTML = '';
  document.getElementById('spellingInput').value = '';
  document.getElementById('spellingFeedback').textContent = '';
  document.getElementById('spellingArea').style.display = 'block';
  document.getElementById('qOptions').innerHTML = '';
  const word = q.item.word;
  const revealCount = Math.min(2, Math.floor(word.length/4));
  const revealPositions = new Set();
  while(revealPositions.size < revealCount){ revealPositions.add(Math.floor(Math.random()*word.length)); }
  for(let i=0;i<word.length;i++){
    const ch = word[i];
    const span = document.createElement('div'); span.className='blank me-1';
    span.textContent = revealPositions.has(i) ? ch : '_';
    document.getElementById('qBlanks').appendChild(span);
  }
  const done = quizTotal - quizQueue.length; const pct = Math.round((done/quizTotal)*100);
  document.getElementById('qProgress').style.width = pct + '%';
  setTimeout(()=> document.getElementById('spellingInput').focus(), 60);
}

function renderSpellingNoTH(q){
  // ซ่อนคำไทยและล้างข้อความ
  const qHintEl = document.getElementById('qHint');
  qHintEl.textContent = '';
  qHintEl.style.display = 'none';

  document.getElementById('qWord').textContent = '';
  document.getElementById('qBlanks').innerHTML = '';
  document.getElementById('spellingInput').value = '';
  document.getElementById('spellingFeedback').textContent = '';
  document.getElementById('spellingArea').style.display = 'block';
  document.getElementById('qOptions').innerHTML = '';
  const word = q.item.word;
  const revealCount = Math.min(2, Math.floor(word.length/4));
  const revealPositions = new Set();
  while(revealPositions.size < revealCount){ revealPositions.add(Math.floor(Math.random()*word.length)); }
  for(let i=0;i<word.length;i++){
    const ch = word[i];
    const span = document.createElement('div'); span.className='blank me-1';
    span.textContent = revealPositions.has(i) ? ch : '_';
    document.getElementById('qBlanks').appendChild(span);
  }
  const done = quizTotal - quizQueue.length; const pct = Math.round((done/quizTotal)*100);
  document.getElementById('qProgress').style.width = pct + '%';
  setTimeout(()=> document.getElementById('spellingInput').focus(), 60);
}


function submitSpelling(){ if(!quizCurrent) return; const input = document.getElementById('spellingInput').value.trim(); const correct = quizCurrent.item.word; evaluateSpelling(input, correct, quizCurrent.idx); }
function revealSpelling(){ if(!quizCurrent) return; document.getElementById('spellingFeedback').textContent = `เฉลย: ${quizCurrent.item.word}`; vocab[quizCurrent.idx].wrong = (vocab[quizCurrent.idx].wrong||0) + 1; vocab[quizCurrent.idx].lastSeen = Date.now(); saveAll(); sessionWrong.push({ idx: quizCurrent.idx, word: vocab[quizCurrent.idx].word, correct: vocab[quizCurrent.idx].translation }); updateSessionWrong(); const auto = document.getElementById('autoNext').checked; if(auto) setTimeout(()=> showNextQuiz(quizRandomize ? null : quizFixedMode), 900); }

function evaluateSpelling(input, correct, idx){ 
  document.getElementById('spellingInput').disabled = true; 
  const auto = document.getElementById('autoNext').checked; 
  if(input.toLowerCase() === correct.toLowerCase()){ 
    document.getElementById('spellingFeedback').textContent = 'ถูกต้อง!'; 
    vocab[idx].correct = (vocab[idx].correct||0) + 1; quizScore++; 
  } else { 
    document.getElementById('spellingFeedback').textContent = `ผิด — เฉลย: ${correct}`; 
    vocab[idx].wrong = (vocab[idx].wrong||0) + 1; 
    sessionWrong.push({ idx, word: vocab[idx].word, correct: vocab[idx].translation }); 
  } 
  vocab[idx].lastSeen = Date.now(); saveAll(); document.getElementById('qScore').textContent = `${quizScore} / ${quizTotal}`; updateSessionWrong(); 
  if(auto){ 
    setTimeout(()=> { document.getElementById('spellingInput').disabled = false; showNextQuiz(quizRandomize ? null : quizFixedMode); }, 900); 
  } else { 
    setTimeout(()=> { document.getElementById('spellingInput').disabled = false; }, 250); 
  } 
}

function evaluateQuiz(selected, correct, idx, el){ 
  document.querySelectorAll('#qOptions .option').forEach(o=>o.onclick = null); 
  const auto = document.getElementById('autoNext').checked; 
  if(selected === correct){ 
    el.classList.add('correct'); quizScore++; vocab[idx].correct = (vocab[idx].correct || 0) + 1; 
  } else { 
    el.classList.add('wrong'); vocab[idx].wrong = (vocab[idx].wrong||0) + 1; 
    document.querySelectorAll('#qOptions .option').forEach(o=>{ if(o.textContent === correct) o.classList.add('correct'); }); 
    sessionWrong.push({ idx, word: vocab[idx].word, correct: vocab[idx].translation }); 
  } 
  vocab[idx].lastSeen = Date.now(); saveAll(); document.getElementById('qScore').textContent = `${quizScore} / ${quizTotal}`; updateSessionWrong(); 
  if(auto){ 
    setTimeout(()=> showNextQuiz(quizRandomize ? null : quizFixedMode), 700); 
  } else { 
    const nextBtn = document.createElement('button'); nextBtn.textContent = 'Next'; nextBtn.className = 'btn btn-outline-primary mt-2'; nextBtn.onclick = ()=> { nextBtn.remove(); showNextQuiz(quizRandomize ? null : quizFixedMode); }; document.getElementById('qOptions').appendChild(nextBtn); 
  } 
}

function updateSessionWrong(){
  const el = document.getElementById('sessionWrong');
  el.innerHTML = '';
  sessionWrong.forEach(w=>{
    const d = document.createElement('div');
    d.className = 'mb-1 d-flex align-items-center';
    const badge = document.createElement('span');
    badge.className = 'badge bg-danger rounded-pill me-2';
    badge.style.minWidth = '28px';
    badge.style.textAlign = 'center';
    badge.style.display = 'inline-block';
    badge.textContent = (typeof w.idx === 'number' && w.idx >= 0) ? (w.idx + 1) : '';
    const txt = document.createElement('span');
    txt.textContent = `${w.word} → ${w.correct}`;
    d.appendChild(badge);
    d.appendChild(txt);
    el.appendChild(d);
  });
}

function renderSessionWrong(){ updateSessionWrong(); }

function retryWrong(){ const wrongIdx = vocab.map((it,i)=>({it,i})).filter(x=> (x.it.wrong||0) >= 1).map(x=>x.i); if(!wrongIdx.length) return alert('ไม่มีคำที่ผิดบ่อย'); quizQueue = [...wrongIdx]; shuffleArray(quizQueue); quizTotal = quizQueue.length; quizScore = 0; sessionWrong = []; document.getElementById('qScore').textContent = `${quizScore} / ${quizTotal}`; document.getElementById('quizCard').style.display = 'block'; showNextQuiz(quizRandomize ? null : quizFixedMode); }

/* ------------------------------
  Audio (EN TTS only)
-------------------------------*/
let enVoice = null; function initVoices(){ const voices = speechSynthesis.getVoices(); enVoice = voices.find(v => v.lang && v.lang.startsWith('en')) || null; } speechSynthesis.onvoiceschanged = initVoices; initVoices();
function playEN(mode){ let text = null; if(mode === 'practice'){ const idx = parseInt(document.getElementById('practiceCard').dataset.idx || -1); if(idx >= 0) text = vocab[idx].word; } else if(mode === 'quiz'){ if(quizCurrent && quizCurrent.item) text = quizCurrent.item.word; } else if(typeof mode === 'number'){ text = vocab[mode].word; } if(!text) return; const u = new SpeechSynthesisUtterance(text); u.lang = 'en-US'; if(enVoice) u.voice = enVoice; speechSynthesis.speak(u); }
function playENIndex(i){ playEN(i); }

/* ------------------------------
  Stats & helpers
-------------------------------*/
function updateStatsUI(){ document.getElementById('statTotal').textContent = vocab.length; document.getElementById('statMaster').textContent = vocab.filter(i=> (i.correct||0) >= 3).length; document.getElementById('statWeak').textContent = vocab.filter(i=> (i.wrong||0) >= 2).length; document.getElementById('dTotal').textContent = vocab.length; document.getElementById('dMaster').textContent = vocab.filter(i=> (i.correct||0) >= 3).length; document.getElementById('dWeak').textContent = vocab.filter(i=> (i.wrong||0) >= 2).length; renderWeakList(); }
function renderWeakList(){ const el = document.getElementById('weakList'); el.innerHTML = ''; const weak = vocab.map((it,i)=>({...it,i})).filter(x=> (x.wrong||0) >= 2).sort((a,b)=> (b.wrong||0) - (a.wrong||0)); weak.forEach(w=>{ const div = document.createElement('div'); div.className = 'list-group-item d-flex justify-content-between align-items-center'; div.innerHTML = `<div class="d-flex gap-3 align-items-center"><div class="badge bg-light text-muted" style="min-width:44px;text-align:center">${w.i+1}</div><div><div class="fw-bold">${escapeHtml(w.word)}</div><div class="small text-muted">${escapeHtml(w.translation)}</div><div class="small">Wrong: ${w.wrong||0}</div></div></div>
        <div class="d-flex gap-2"><button class="btn btn-primary btn-sm" onclick="practiceSingle(${w.i})">Practice</button><button class="btn btn-outline-secondary btn-sm" onclick="editItem(${w.i})">Edit</button></div>`; el.appendChild(div); }); }
function practiceSingle(i){ practiceQueue = [i]; practiceIndex = 0; document.getElementById('practiceCard').style.display = 'block'; showPracticeCard(); }
function resetStats(){ if(!confirm('Reset stats?')) return; vocab.forEach(i=>{ i.correct=0; i.wrong=0; }); saveAll(); updateStatsUI(); alert('Reset done'); }
function shuffleArray(a){ for(let i=a.length-1;i>0;i--){ const j = Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } }
function escapeHtml(s){ return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'); }

/* ------------------------------
  Init / UI helpers
-------------------------------*/
function refreshUI(){ renderLibrary(); updateStatsUI(); updateSessionWrong(); }
window.addEventListener('beforeunload', ()=> saveAll());
renderLibrary(); updateStatsUI();
