/* ================= Login ================= */
document.getElementById('loginSubmitBtn').addEventListener('click', doLogin);
document.getElementById('loginPassword').addEventListener('keydown', e=>{ if(e.key==='Enter') doLogin(); });
document.getElementById('loginSettingsBtn').addEventListener('click', ()=>document.getElementById('settingsPop').classList.toggle('open'));

async function doLogin(){
  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value;
  const errEl = document.getElementById('loginError');
  errEl.classList.remove('show');
  if(!username || !password){ errEl.textContent = "Isi username & password."; errEl.classList.add('show'); return; }
  if(!SHEET_URL){ errEl.textContent = "Belum tersambung ke Google Sheets."; errEl.classList.add('show'); return; }
  const btn = document.getElementById('loginSubmitBtn');
  btn.textContent = "Signing in..."; btn.disabled = true;
  try{
    const res = await fetch(SHEET_URL, { method:"POST", body: JSON.stringify({ action:"login", username, password }) });
    const json = await res.json();
    if(json.ok){
      CURRENT_USER = { role: String(json.role||'sales').toLowerCase(), name: json.nama };
      if(document.getElementById('loginRemember').checked) localStorage.setItem('bintoro_username', username);
      else localStorage.removeItem('bintoro_username');
      playLoadingScreen();
    }else{
      errEl.textContent = json.message || "Username atau password salah.";
      errEl.classList.add('show');
    }
  }catch(err){
    errEl.textContent = "Gagal menghubungi server. Coba lagi.";
    errEl.classList.add('show');
  }
  btn.textContent = "Sign In"; btn.disabled = false;
}
(function prefillRemembered(){
  const remembered = localStorage.getItem('bintoro_username');
  if(remembered){ document.getElementById('loginUsername').value = remembered; document.getElementById('loginRemember').checked = true; }
})();

document.getElementById('switchUserBtn').addEventListener('click', ()=>{
  document.getElementById('app').classList.remove('ready');
  document.getElementById('loginOverlay').style.display = 'flex';
  document.getElementById('loginPassword').value = '';
});
function playLoadingScreen(){
  document.getElementById('loginOverlay').style.display = 'none';
  const screen = document.getElementById('loadingScreen');
  const video = document.getElementById('loadingVideo');
  screen.classList.add('show');
  video.currentTime = 0;
  video.play().catch(()=>{}); // fallback diam-diam kalau autoplay diblokir browser

  let done = false;
  const finish = ()=>{
    if(done) return;
    done = true;
    screen.classList.remove('show');
    enterApp();
  };
  video.onended = finish;
  setTimeout(finish, 4500); // jaga-jaga kalau video gagal load/play, tetap lanjut masuk
}

function enterApp(){
  document.getElementById('loginOverlay').style.display = 'none';
  document.getElementById('app').classList.add('ready');
  const isManager = CURRENT_USER.role === 'manager';
  document.getElementById('sbAvatar').textContent = initials(CURRENT_USER.name);
  document.getElementById('tbAvatar').textContent = initials(CURRENT_USER.name);
  document.getElementById('sbName').textContent = CURRENT_USER.name;
  document.getElementById('sbRole').textContent = isManager ? 'Full Access' : 'Sales — Data Sendiri';
  document.getElementById('dashSub').textContent = isManager ? 'Ringkasan seluruh target, umur unit, dan revenue.' : 'Ringkasan target yang di-assign ke Anda.';
  document.getElementById('dbSub').textContent = isManager ? 'Kelola & pantau seluruh target replacement.' : 'Target yang di-assign ke Anda.';
  document.getElementById('puSub').textContent = isManager ? 'Pilih target untuk melihat & mencatat riwayat follow-up.' : 'Target Anda — catat progress follow-up di sini.';
  document.getElementById('revSub').textContent = isManager ? 'Potensi & realized revenue dari seluruh target.' : 'Potensi & realized revenue dari target Anda.';
  document.querySelectorAll('.nav-item[data-view="users"]').forEach(el=> el.style.display = isManager ? '' : 'none');
  if(isManager){ puView='grid'; selectedSalesForProgress=null; }
  else{ puView='list'; selectedSalesForProgress=CURRENT_USER.name; }
  populateFilterOptions();
  renderAll();
}
