/* ================= Export Data (Manager only) ================= */
const EXPORT_COLUMN_GROUPS = [
  { title: "Informasi Dasar", cols: [
    {key:'name', label:'Nama Customer'},
    {key:'kategori', label:'Kategori'},
    {key:'type', label:'Tipe Unit'},
    {key:'vin', label:'VIN'},
    {key:'kecamatan', label:'Kecamatan'},
    {key:'alamat', label:'Alamat'},
    {key:'tanggal', label:'Tanggal Retail'},
    {key:'umur', label:'Umur (thn)'},
    {key:'status_umur', label:'Status Umur'},
    {key:'revenue', label:'Est. Revenue'},
    {key:'sales_lama', label:'Sales Lama'},
  ]},
  { title: "Kontak", cols: [
    {key:'hp1', label:'No. HP 1'},
    {key:'hp2', label:'No. HP 2'},
    {key:'hp3', label:'No. HP 3'},
  ]},
  { title: "Follow-up & Assignment", cols: [
    {key:'pic', label:'PIC / Sales Assigned'},
    {key:'status_followup', label:'Status Follow-up'},
    {key:'catatan_terakhir', label:'Catatan Terakhir'},
  ]},
];
const EXPORT_ALL_KEYS = EXPORT_COLUMN_GROUPS.flatMap(g=>g.cols.map(c=>c.key));
const EXPORT_TEMPLATE_PRESETS = {
  internal: EXPORT_ALL_KEYS.slice(),
  eksternal: EXPORT_COLUMN_GROUPS[0].cols.map(c=>c.key),
};

let exportDataType = 'detail';
let exportFormat = 'xlsx';
let exportActiveTemplate = 'custom';
let exportSelectedCols = new Set(EXPORT_ALL_KEYS);

function renderExportView(){
  const view = document.getElementById('view-export');
  if(CURRENT_USER.role !== 'manager'){
    view.innerHTML = '<div class="empty-state">Fitur Export Data hanya tersedia untuk Manager.</div>';
    return;
  }
  updateExportInfoBanner();
  document.getElementById('exportColumnStep').style.display = exportDataType==='detail' ? 'block' : 'none';
  renderExportColumns();
}

function updateExportInfoBanner(){
  const banner = document.getElementById('exportInfoBanner');
  if(exportDataType==='detail'){
    const rows = getFilteredSorted();
    const kec = document.getElementById('kecFilter').value;
    const salesF = document.getElementById('salesFilterDb').value;
    const statusF = document.getElementById('statusFollowupFilter').value;
    const catLabel = currentCatFilter ? (CAT_LABEL[currentCatFilter]||currentCatFilter) : 'Semua';
    banner.innerHTML = `Filter aktif: Kategori: ${catLabel} · Kecamatan: ${kec||'Semua'} · Sales: ${salesF||'Semua'} · Status Follow-up: ${statusF||'Semua'} · <b>${rows.length} target akan diekspor</b>`;
  }else if(exportDataType==='sales'){
    banner.innerHTML = `Ringkasan akan dibuat untuk <b>${activeSalesNames().length} sales aktif</b>.`;
  }else if(exportDataType==='kategori'){
    banner.innerHTML = `Ringkasan akan dibuat per kategori (Target Replacement, Fleet/GSO Replacement, Next Target).`;
  }else{
    banner.innerHTML = `Seluruh riwayat kontak/catatan follow-up akan diekspor — <b>${LOG_CACHE.length} entri log</b>.`;
  }
}

function renderExportColumns(){
  const wrap = document.getElementById('exportColumnList');
  wrap.innerHTML = EXPORT_COLUMN_GROUPS.map(g=>`
    <div class="export-col-group-title">${g.title}</div>
    <div class="export-col-grid">
      ${g.cols.map(c=>`<div class="export-col-item ${exportSelectedCols.has(c.key)?'checked':''}" data-key="${c.key}">
        <input type="checkbox" ${exportSelectedCols.has(c.key)?'checked':''}>${c.label}
      </div>`).join('')}
    </div>`).join('');
  wrap.querySelectorAll('.export-col-item').forEach(el=>{
    el.addEventListener('click', ()=> toggleExportColumn(el.dataset.key));
  });
  document.getElementById('exportColCount').textContent = `${exportSelectedCols.size} kolom dipilih`;
  updateExportTemplateCardActive();
}

function toggleExportColumn(key){
  if(exportSelectedCols.has(key)) exportSelectedCols.delete(key);
  else exportSelectedCols.add(key);
  exportActiveTemplate = 'custom';
  renderExportColumns();
}

function applyExportTemplate(name){
  exportActiveTemplate = name;
  if(name==='internal') exportSelectedCols = new Set(EXPORT_TEMPLATE_PRESETS.internal);
  else if(name==='eksternal') exportSelectedCols = new Set(EXPORT_TEMPLATE_PRESETS.eksternal);
  renderExportColumns();
}

function updateExportTemplateCardActive(){
  document.querySelectorAll('#exportTemplateCards .export-card').forEach(c=>{
    c.classList.toggle('active', c.dataset.template===exportActiveTemplate);
  });
}

/* ---------- Bangun dataset sesuai jenis yang dipilih ---------- */
function getLatestNote(targetId){
  const logs = LOG_CACHE.filter(l=>l.targetId===targetId).sort((a,b)=> new Date(b.timestamp)-new Date(a.timestamp));
  return logs.length>0 ? (logs[0].notes||'') : '';
}

function buildDetailExportData(){
  const rows = getFilteredSorted();
  const fieldLabel = {};
  EXPORT_COLUMN_GROUPS.flatMap(g=>g.cols).forEach(c=>fieldLabel[c.key]=c.label);
  return rows.map(r=>{
    const age = ageYears(r.date);
    const st = statusFromAge(age);
    const assign = getAssignment(r.id);
    const fieldMap = {
      name:r.name||'', kategori:CAT_LABEL[r._bucket]||CAT_LABEL[bucketOf(r)]||'-', type:r.type||'',
      vin:r.vin||'', kecamatan:r.kecamatan_norm||'', alamat:r.alamat||'',
      tanggal:r.date||'', umur:age!=null?age.toFixed(1):'', status_umur:st.label,
      revenue:r.revenue_estimator||0, sales_lama:r.source_sales||'',
      hp1:r.hp1||'', hp2:r.hp2||'', hp3:r.hp3||'',
      pic:assign.sales||'', status_followup:assign.status||'', catatan_terakhir:getLatestNote(r.id),
    };
    const rowObj = {};
    EXPORT_ALL_KEYS.forEach(key=>{
      if(exportSelectedCols.has(key)) rowObj[fieldLabel[key]] = fieldMap[key];
    });
    return rowObj;
  });
}

function buildSalesSummaryExportData(){
  return activeSalesNames().map(s=>{
    const rows = RAW.filter(r=>getAssignment(r.id).sales===s);
    const deal = rows.filter(r=>getAssignment(r.id).status==='Deal');
    const revenue = deal.reduce((sum,r)=>sum+(r.revenue_estimator||0),0);
    return {
      'Sales': s,
      'Target Assigned': rows.length,
      'Deal': deal.length,
      'Conversion (%)': rows.length ? (deal.length/rows.length*100).toFixed(1) : '0',
      'Revenue Realized': revenue,
    };
  });
}

function buildKategoriSummaryExportData(){
  const buckets = {TR:{n:0,rev:0,realized:0}, FR:{n:0,rev:0,realized:0}, NT:{n:0,rev:0,realized:0}};
  RAW.filter(isVisibleToCurrentUser).forEach(r=>{
    const b = bucketOf(r); if(!b) return;
    buckets[b].n++;
    buckets[b].rev += (r.revenue_estimator||0);
    if(getAssignment(r.id).status==='Deal') buckets[b].realized += (r.revenue_estimator||0);
  });
  return Object.entries(buckets).map(([k,v])=>({
    'Kategori': CAT_LABEL[k], 'Jumlah Target': v.n, 'Revenue Potensi': v.rev, 'Revenue Realized': v.realized
  }));
}

function buildLogHistoryExportData(){
  const infoById = {};
  RAW.forEach(r=>{ infoById[r.id] = {name:r.name, vin:r.vin}; });
  return [...LOG_CACHE].sort((a,b)=> new Date(b.timestamp)-new Date(a.timestamp)).map(l=>{
    const info = infoById[l.targetId] || {};
    const d = new Date(l.timestamp);
    return {
      'Nama Customer': info.name || `Target #${l.targetId}`,
      'VIN': info.vin || '',
      'Sales': l.sales || '',
      'Status': l.status || '',
      'Catatan': l.notes || '',
      'Tanggal Update': isNaN(d) ? (l.timestamp||'') : d.toLocaleString('id-ID'),
      'Link Dokumen': (l.docUrl && l.docUrl.startsWith('http')) ? l.docUrl : '',
    };
  });
}

function exportToPrintablePDF(data, title){
  const cols = Object.keys(data[0]);
  const win = window.open('', '_blank');
  win.document.write(`<html><head><title>${title}</title><style>
    body{font-family:Arial,sans-serif;padding:20px;color:#111;}
    h2{margin-bottom:2px;} .sub{color:#666;font-size:12px;margin-bottom:14px;}
    table{width:100%;border-collapse:collapse;font-size:11px;}
    th,td{border:1px solid #ccc;padding:6px 8px;text-align:left;}
    th{background:#f2f2f2;}
  </style></head><body>
    <h2>${title}</h2>
    <div class="sub">Diekspor dari BINTORO — ${new Date().toLocaleString('id-ID')}</div>
    <table><thead><tr>${cols.map(c=>`<th>${c}</th>`).join('')}</tr></thead>
    <tbody>${data.map(row=>`<tr>${cols.map(c=>`<td>${row[c]!=null?row[c]:''}</td>`).join('')}</tr>`).join('')}</tbody>
    </table>
    <script>window.onload=function(){ window.print(); };</script>
  </body></html>`);
  win.document.close();
}

function doExport(){
  let data, filenameBase, title;
  if(exportDataType==='detail'){ data=buildDetailExportData(); filenameBase='BINTORO_Detail_Target'; title='Detail Target'; }
  else if(exportDataType==='sales'){ data=buildSalesSummaryExportData(); filenameBase='BINTORO_Summary_Sales'; title='Summary per Sales'; }
  else if(exportDataType==='kategori'){ data=buildKategoriSummaryExportData(); filenameBase='BINTORO_Summary_Kategori'; title='Summary per Kategori'; }
  else { data=buildLogHistoryExportData(); filenameBase='BINTORO_Riwayat_Followup'; title='Riwayat Follow-up'; }

  if(data.length===0){ alert('Tidak ada data untuk diekspor.'); return; }
  if(exportDataType==='detail' && exportSelectedCols.size===0){ alert('Pilih minimal 1 kolom dulu.'); return; }

  const dateStr = new Date().toISOString().slice(0,10);
  const filename = `${filenameBase}_${dateStr}`;

  if(exportFormat==='xlsx'){
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Export');
    XLSX.writeFile(wb, filename+'.xlsx');
  }else{
    exportToPrintablePDF(data, title);
  }
}

/* ---------- Event wiring ---------- */
document.querySelectorAll('#exportDataCards .export-card').forEach(c=>{
  c.addEventListener('click', ()=>{
    document.querySelectorAll('#exportDataCards .export-card').forEach(x=>x.classList.remove('active'));
    c.classList.add('active');
    exportDataType = c.dataset.type;
    renderExportView();
  });
});
document.querySelectorAll('#exportTemplateCards .export-card').forEach(c=>{
  c.addEventListener('click', ()=> applyExportTemplate(c.dataset.template));
});
document.querySelectorAll('#exportFormatCards .export-card').forEach(c=>{
  c.addEventListener('click', ()=>{
    document.querySelectorAll('#exportFormatCards .export-card').forEach(x=>x.classList.remove('active'));
    c.classList.add('active');
    exportFormat = c.dataset.format;
  });
});
document.getElementById('btnSelectAllCols').addEventListener('click', ()=>{
  exportSelectedCols = new Set(EXPORT_ALL_KEYS);
  exportActiveTemplate = 'custom';
  renderExportColumns();
});
document.getElementById('btnExportCancel').addEventListener('click', ()=> switchView('dashboard'));
document.getElementById('btnExportGo').addEventListener('click', doExport);
