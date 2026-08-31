/* ================= Target Database ================= */
function getFilteredSorted(){
  let rows = scopedRows();
  const search = document.getElementById('dbSearch').value.toLowerCase();
  const kec = document.getElementById('kecFilter').value;
  const ageF = document.getElementById('ageFilter').value;
  const salesF = document.getElementById('salesFilterDb').value;

  rows = rows.map(r=>({...r, _age: ageYears(r.date), _bucket: bucketOf(r)})).filter(r=>r._bucket);
  if(currentCatFilter && currentCatFilter!=='LHC') rows = rows.filter(r=>r._bucket===currentCatFilter);
  if(kec) rows = rows.filter(r=>r.kecamatan_norm===kec);
  if(ageF) rows = rows.filter(r=>statusFromAge(r._age).cls===ageF);
  if(salesF){
    if(salesF==='__unassigned') rows = rows.filter(r=>!getAssignment(r.id).sales);
    else rows = rows.filter(r=>getAssignment(r.id).sales===salesF);
  }
  if(search) rows = rows.filter(r=> (r.name||'').toLowerCase().includes(search) || (r.vin||'').toLowerCase().includes(search));

  if(currentSort==="age_desc") rows.sort((a,b)=>(b._age||0)-(a._age||0));
  if(currentSort==="age_asc") rows.sort((a,b)=>(a._age||0)-(b._age||0));
  if(currentSort==="revenue_desc") rows.sort((a,b)=>(b.revenue_estimator||0)-(a.revenue_estimator||0));
  if(currentSort==="name_asc") rows.sort((a,b)=>(a.name||'').localeCompare(b.name||''));
  return rows;
}

function buildPageButtons(totalPages){
  if(totalPages<=1) return '';
  const pages = new Set([1, totalPages, currentPage, currentPage-1, currentPage-2, currentPage+1, currentPage+2]);
  const sorted = [...pages].filter(p=>p>=1 && p<=totalPages).sort((a,b)=>a-b);
  let html='', prev=0;
  for(const p of sorted){
    if(prev && p-prev>1) html += `<div class="page-btn" style="border:none;cursor:default;">…</div>`;
    html += `<div class="page-btn ${p===currentPage?'active':''}" data-page="${p}">${p}</div>`;
    prev = p;
  }
  return html;
}
function renderPaginationControls(totalItems, startIdx, endIdx, label){
  const totalPages = Math.max(1, Math.ceil(totalItems/PAGE_SIZE));
  document.getElementById('pagination').innerHTML = `
    <div>Menampilkan ${totalItems===0?0:startIdx+1} - ${endIdx} dari ${totalItems} ${label}</div>
    <div class="page-nums">
      <div class="page-btn" data-page="${Math.max(1,currentPage-1)}">‹</div>
      ${buildPageButtons(totalPages)}
      <div class="page-btn" data-page="${Math.min(totalPages,currentPage+1)}">›</div>
    </div>`;
  document.querySelectorAll('.page-btn[data-page]').forEach(b=>b.addEventListener('click', ()=>{
    currentPage=Number(b.dataset.page);
    if(currentCatFilter==='LHC') renderLHCView(); else renderDatabaseView();
  }));
}

function renderDatabaseView(){
  document.getElementById('dbMainTable').style.display = '';
  document.getElementById('lhcTable').style.display = 'none';
  if(currentCatFilter==='LHC'){ renderLHCView(); return; }

  const rows = getFilteredSorted();

  const totalRevenue = rows.reduce((s,r)=>s+(r.revenue_estimator||0),0);
  const dealRevenue = rows.filter(r=>getAssignment(r.id).status==='Deal').reduce((s,r)=>s+(r.revenue_estimator||0),0);
  document.getElementById('revenueStrip').innerHTML = `
    <div class="rs-item"><div class="rs-label">Target Ditampilkan</div><div class="rs-value">${rows.length}</div></div>
    <div class="rs-item"><div class="rs-label">Revenue Potensi</div><div class="rs-value">${formatRupiah(totalRevenue)}</div></div>
    <div class="rs-item"><div class="rs-label">Realized (Deal)</div><div class="rs-value" style="color:var(--green);">${formatRupiah(dealRevenue)}</div></div>
  `;

  const totalPages = Math.max(1, Math.ceil(rows.length/PAGE_SIZE));
  if(currentPage>totalPages) currentPage=totalPages;
  const startIdx = (currentPage-1)*PAGE_SIZE;
  const pageRows = rows.slice(startIdx, startIdx+PAGE_SIZE);

  const tbody = document.getElementById('dbTableBody');
  tbody.innerHTML = pageRows.length===0 ? `<tr><td colspan="6"><div class="empty-state">Tidak ada data cocok.</div></td></tr>` :
    pageRows.map(r=>{
      const st = statusFromAge(r._age);
      const assign = getAssignment(r.id);
      const statusMeta = STATUS_META[assign.status] || STATUS_META["Belum Dihubungi"];
      const isManager = CURRENT_USER.role==='manager';
      return `
      <tr data-id="${r.id}">
        <td>
          <div class="target-name">${r.name||'-'}</div>
          <div class="target-sub">${r.type||'-'}</div>
          <div class="target-vin">${r.vin||''}</div>
          ${r.source_sales ? `<div class="target-vin" style="color:var(--text-muted);margin-top:1px;">Sales lama: ${r.source_sales}</div>` : ''}
        </td>
        <td><span class="cat-badge">${CAT_LABEL[r._bucket]}</span></td>
        <td style="font-size:11.5px;">${r.kecamatan_norm||'-'}</td>
        <td>
          <div style="font-size:11.5px;font-weight:600;">${r._age!=null ? r._age.toFixed(1)+' thn':'-'}</div>
          <span class="age-badge ${st.cls}">${st.label}</span>
        </td>
        <td>
          <div class="pic-cell">
            <div class="pic-avatar">${assign.sales?initials(assign.sales):'?'}</div>
            ${isManager ? `
            <select class="pic-select sales-select" data-id="${r.id}">
              <option value="">— Assign —</option>
              ${activeSalesNames().map(s=>`<option value="${s}" ${assign.sales===s?'selected':''}>${s}</option>`).join('')}
            </select>` : `<span style="font-size:11.5px;font-weight:600;">${assign.sales||'—'}</span>`}
          </div>
        </td>
        <td><span class="status-pill ${statusMeta.cls}">${assign.status}</span></td>
      </tr>`;
    }).join('');

  tbody.querySelectorAll('tr[data-id]').forEach(tr=>{
    tr.addEventListener('click', (e)=>{
      if(e.target.closest('select')) return;
      goToTargetDetail(tr.dataset.id);
    });
  });
  tbody.querySelectorAll('.sales-select').forEach(sel=>{
    sel.addEventListener('click', e=>e.stopPropagation());
    sel.addEventListener('change', async (e)=>{
      await setAssignment(e.target.dataset.id, 'sales', e.target.value);
      renderDatabaseView(); renderDashboard();
    });
  });

  renderPaginationControls(rows.length, startIdx, Math.min(startIdx+PAGE_SIZE, rows.length), 'target');
}

function renderLHCView(){
  document.getElementById('dbMainTable').style.display = 'none';
  document.getElementById('lhcTable').style.display = '';

  const search = document.getElementById('dbSearch').value.toLowerCase();
  let rows = scopedRows().filter(r=>r.name && r.kecamatan_norm);
  if(search) rows = rows.filter(r=> (r.name||'').toLowerCase().includes(search));

  const groups = {};
  rows.forEach(r=>{
    const key = String(r.name).trim().toUpperCase() + '|' + String(r.kecamatan_norm).trim().toUpperCase();
    if(!groups[key]) groups[key] = {name:r.name, kecamatan_norm:r.kecamatan_norm, rows:[]};
    groups[key].rows.push(r);
  });
  let groupList = Object.values(groups).filter(g=>g.rows.length>1);
  groupList.forEach(g=>{
    g.rows.sort((a,b)=> new Date(b.date) - new Date(a.date));
    g.totalRevenue = g.rows.reduce((s,r)=>s+(r.revenue_estimator||0),0);
    g.last = g.rows[0];
  });
  groupList.sort((a,b)=> b.rows.length - a.rows.length);

  document.getElementById('revenueStrip').innerHTML = `
    <div class="rs-item"><div class="rs-label">Customer Repeat Ditemukan</div><div class="rs-value">${groupList.length}</div></div>
    <div class="rs-item"><div class="rs-label">Total Unit (dari customer repeat)</div><div class="rs-value">${groupList.reduce((s,g)=>s+g.rows.length,0)}</div></div>
  `;

  const totalPages = Math.max(1, Math.ceil(groupList.length/PAGE_SIZE));
  if(currentPage>totalPages) currentPage=totalPages;
  const startIdx = (currentPage-1)*PAGE_SIZE;
  const pageGroups = groupList.slice(startIdx, startIdx+PAGE_SIZE);

  const tbody = document.getElementById('lhcTableBody');
  tbody.innerHTML = pageGroups.length===0 ? `<tr><td colspan="5"><div class="empty-state">Belum ada customer dengan pembelian &gt;1 kali (di scope ini).</div></td></tr>` :
    pageGroups.map(g=>`
      <tr data-id="${g.last.id}">
        <td><div class="target-name">${g.name}</div></td>
        <td style="font-size:11.5px;">${g.kecamatan_norm}</td>
        <td><span class="cat-badge">${g.rows.length}x beli</span></td>
        <td class="mono">${formatRupiah(g.totalRevenue)}</td>
        <td style="font-size:11.5px;">
          <div>${g.last.type||'-'} <span style="color:var(--text-dim);">(${g.last.date||'-'})</span>${g.last.source_sales?` — <span style="color:var(--text-dim);">Sales lama: ${g.last.source_sales}</span>`:''}</div>
          ${g.rows.length>1 ? `<div style="margin-top:4px;color:var(--text-dim);font-size:10.5px;">+${g.rows.length-1} unit lain: ${g.rows.slice(1).map(r=>`${r.type||'-'} (${r.source_sales||'-'})`).join(', ')}</div>` : ''}
        </td>
      </tr>`).join('');

  tbody.querySelectorAll('tr[data-id]').forEach(tr=>{
    tr.addEventListener('click', ()=> goToTargetDetail(tr.dataset.id));
  });

  renderPaginationControls(groupList.length, startIdx, Math.min(startIdx+PAGE_SIZE, groupList.length), 'customer');
}

function goToTargetDetail(id){
  selectedTargetId = id;
  const assign = getAssignment(id);
  selectedSalesForProgress = assign.sales || null;
  puView = 'detail';
  switchView('progress');
}

