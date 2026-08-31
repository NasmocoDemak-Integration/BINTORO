/* ================= Google Sheets backend ================= */
async function loadFromSheets(){
  if(!SHEET_URL) return false;
  try{
    const res = await fetch(SHEET_URL);
    const json = await res.json();
    RAW = (json.data || []).map(r => ({...r, id:String(r.id), revenue_estimator:Number(r.revenue_estimator)}));
    ASSIGN_CACHE = json.assignments || {};
    LOG_CACHE = (json.logs || []).map(l => ({...l, targetId:String(l.targetId)}));
    USERS_CACHE = (json.users || []).map(u => ({...u, nik:String(u.nik)}));
    return true;
  }catch(err){ console.error("Gagal ambil data:", err); return false; }
}
function getAssignment(id){ return ASSIGN_CACHE[id] || {sales:"", status:"Belum Dihubungi"}; }
async function setAssignment(id, field, value){
  const current = getAssignment(id);
  current[field] = value;
  ASSIGN_CACHE[id] = current;
  if(!SHEET_URL) return;
  try{ await fetch(SHEET_URL, { method:"POST", body: JSON.stringify({ id, field, value }) }); }
  catch(err){ console.error("Gagal simpan:", err); }
}
function fileToBase64(file){
  return new Promise((resolve,reject)=>{
    const reader = new FileReader();
    reader.onload = ()=> resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
async function submitLog(targetId, sales, status, notes, file){
  let fileData=null, fileName=null, mimeType=null;
  if(file){ fileData = await fileToBase64(file); fileName = file.name; mimeType = file.type; }
  const entry = { id:"local_"+Date.now(), targetId:String(targetId), timestamp:new Date().toISOString(), sales, status, notes, docUrl: file ? "(mengunggah...)" : "" };
  LOG_CACHE.push(entry);
  if(SHEET_URL){
    try{
      const res = await fetch(SHEET_URL, { method:"POST", body: JSON.stringify({ action:"log", targetId, sales, status, notes, fileData, fileName, mimeType }) });
      const json = await res.json();
      entry.docUrl = json.docUrl || "";
    }catch(err){ console.error("Gagal simpan log:", err); }
  }
}

async function updatePhoneNumbers(targetId, hp1, hp2, hp3){
  const row = RAW.find(r=>r.id===targetId);
  if(row){ row.hp1 = hp1||null; row.hp2 = hp2||null; row.hp3 = hp3||null; }
  if(!SHEET_URL) return;
  try{
    await fetch(SHEET_URL, { method:"POST", body: JSON.stringify({ action:"updatePhone", id:targetId, hp1, hp2, hp3 }) });
  }catch(err){ console.error("Gagal update HP:", err); }
}

/* ================= Filter options ================= */
function populateFilterOptions(){
  const kecSet = new Set();
  RAW.forEach(r=>{ if(r.kecamatan_norm) kecSet.add(r.kecamatan_norm); });
  const kecSel = document.getElementById('kecFilter');
  kecSel.innerHTML = '<option value="">Semua Kecamatan</option>' + [...kecSet].sort().map(k=>`<option value="${k}">${k}</option>`).join('');

  const salesSel = document.getElementById('salesFilterDb');
  if(CURRENT_USER && CURRENT_USER.role==='manager'){
    salesSel.style.display='';
    salesSel.innerHTML = '<option value="">Semua Sales</option><option value="__unassigned">Belum di-assign</option>' + activeSalesNames().map(s=>`<option value="${s}">${s}</option>`).join('');
  }else{
    salesSel.style.display='none';
  }
}

