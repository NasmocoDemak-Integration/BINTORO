/* ================= View switching ================= */
function switchView(name){
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.toggle('active', n.dataset.view===name));
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  document.getElementById('view-'+name).classList.add('active');
  if(name==='database') renderDatabaseView();
  if(name==='progress') renderProgressUpdatesView();
  if(name==='revenue') renderRevenueView();
  if(name==='users') renderUsersView();
  if(name==='dashboard') renderDashboard();
}
document.querySelectorAll('#dashCatToggle .pill').forEach(p=>{
  p.addEventListener('click', ()=>{
    document.querySelectorAll('#dashCatToggle .pill').forEach(x=>x.classList.remove('active'));
    p.classList.add('active');
    dashCatFilter = p.dataset.dashcat;
    const labels = {all:'Overview', target_replacement:'Overview — Target Retail/Perorangan', fleet_replacement:'Overview — Target Fleet/GSO'};
    document.getElementById('dashTitle').textContent = labels[dashCatFilter];
    renderDashboard();
  });
});

document.querySelectorAll('.nav-item').forEach(item=>item.addEventListener('click', ()=>switchView(item.dataset.view)));

document.getElementById('btnSettings').addEventListener('click', ()=>document.getElementById('settingsPop').classList.toggle('open'));
document.getElementById('btnConnect').addEventListener('click', async ()=>{
  const url = document.getElementById('sheetUrlInput').value.trim();
  const statusEl = document.getElementById('connStatus');
  if(!url){ statusEl.textContent="Isi dulu URL Web App-nya."; return; }
  SHEET_URL = url;
  statusEl.textContent = "Menyambungkan...";
  const ok = await loadFromSheets();
  if(ok){
    statusEl.textContent = `Tersambung — ${RAW.length} baris dimuat.`;
    localStorage.setItem('bintoro_sheet_url', url); // simpan di browser ini saja, TIDAK ikut ke-commit ke repo
    populateFilterOptions(); renderAll();
  }
  else statusEl.textContent = "Gagal — cek URL & pastikan akses 'Anyone'.";
});
document.getElementById('btnRefresh').addEventListener('click', async ()=>{
  if(!SHEET_URL){ document.getElementById('settingsPop').classList.add('open'); return; }
  await loadFromSheets(); populateFilterOptions(); renderAll();
});

document.getElementById('dbSearch').addEventListener('input', ()=>{ currentPage=1; renderDatabaseView(); });
document.getElementById('kecFilter').addEventListener('change', ()=>{ currentPage=1; renderDatabaseView(); });
document.getElementById('ageFilter').addEventListener('change', ()=>{ currentPage=1; renderDatabaseView(); });
document.getElementById('salesFilterDb').addEventListener('change', ()=>{ currentPage=1; renderDatabaseView(); });
document.getElementById('sortSelect').addEventListener('change', (e)=>{ currentSort=e.target.value; renderDatabaseView(); });
document.querySelectorAll('#catFilterGroup .pill').forEach(p=>{
  p.addEventListener('click', ()=>{
    document.querySelectorAll('#catFilterGroup .pill').forEach(x=>x.classList.remove('active'));
    p.classList.add('active'); currentCatFilter = p.dataset.cat; currentPage=1; renderDatabaseView();
  });
});
document.getElementById('pageSizeSelect').addEventListener('change', (e)=>{ PAGE_SIZE=Number(e.target.value); currentPage=1; renderDatabaseView(); });
document.getElementById('puListSearch').addEventListener('input', ()=> renderTargetListForSales());
document.getElementById('globalSearch').addEventListener('input', (e)=>{ document.getElementById('dbSearch').value=e.target.value; switchView('database'); });

function renderAll(){
  renderDashboard(); renderDatabaseView(); renderProgressUpdatesView(); renderRevenueView();
}

/* ================= Init ================= */
(async function init(){
  const savedUrl = localStorage.getItem('bintoro_sheet_url');
  if(savedUrl){
    SHEET_URL = savedUrl;
    document.getElementById('sheetUrlInput').value = savedUrl;
    await loadFromSheets();
  }else if(SHEET_URL_DEFAULT && SHEET_URL_DEFAULT !== "PASTE_WEB_APP_URL_ANDA_DI_SINI"){
    SHEET_URL = SHEET_URL_DEFAULT;
    await loadFromSheets();
  }
})();
