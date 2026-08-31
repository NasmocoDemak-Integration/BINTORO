/* ================= Dashboard ================= */
function scopedRows(){
  let rows = RAW.filter(isVisibleToCurrentUser);
  if(dashCatFilter !== 'all') rows = rows.filter(r=>r.category===dashCatFilter);
  return rows;
}

function renderPerSalesPanel(){
  const panel = document.getElementById('perSalesPanel');
  if(CURRENT_USER.role !== 'manager'){ panel.style.display = 'none'; return; }
  panel.style.display = '';
  const rows = scopedRows();
  const agg = {};
  activeSalesNames().forEach(s=> agg[s] = {n:0, deal:0, revenue:0});
  rows.forEach(r=>{
    const a = getAssignment(r.id);
    if(!a.sales || !agg[a.sales]) return;
    agg[a.sales].n++;
    if(a.status === 'Deal'){ agg[a.sales].deal++; agg[a.sales].revenue += (r.revenue_estimator||0); }
  });
  document.getElementById('perSalesTableBody').innerHTML = activeSalesNames().map(s=>{
    const d = agg[s];
    const conv = d.n>0 ? (d.deal/d.n*100).toFixed(1)+'%' : '-';
    return `<tr><td>${s}</td><td>${d.n}</td><td>${d.deal}</td><td>${conv}</td><td class="mono" style="color:var(--green);">${formatRupiah(d.revenue)}</td></tr>`;
  }).join('');
}

function renderDashboard(){
  const rows = scopedRows();
  if(rows.length===0){
    ['kpiTotal','kpiHot','kpiRevPotensi','kpiRevRealized'].forEach(id=>document.getElementById(id).textContent="–");
    document.getElementById('catBars').innerHTML = '<div class="empty-state" style="width:100%;">Belum ada data — sambungkan Google Sheets (ikon gear), atau coba kategori lain.</div>';
    document.getElementById('recentUpdates').innerHTML = '';
    document.getElementById('bellDot').style.display='none';
    renderPerSalesPanel();
    return;
  }
  document.getElementById('kpiTotal').textContent = rows.length.toLocaleString('id-ID');
  let hotCount=0, revPotensi=0, revRealized=0;
  const catCounts = {TR:0, FR:0, NT:0};
  rows.forEach(r=>{
    const age = ageYears(r.date);
    const st = statusFromAge(age);
    if(st.cls==='hot') hotCount++;
    revPotensi += (r.revenue_estimator||0);
    const assign = getAssignment(r.id);
    if(assign.status==='Deal') revRealized += (r.revenue_estimator||0);
    const b = bucketOf(r);
    if(b) catCounts[b]++;
  });
  document.getElementById('kpiHot').textContent = hotCount;
  document.getElementById('kpiRevPotensi').textContent = formatRupiah(revPotensi);
  document.getElementById('kpiRevRealized').textContent = formatRupiah(revRealized);
  document.getElementById('bellDot').style.display = hotCount>0 ? 'block':'none';

  const maxCat = Math.max(1, ...Object.values(catCounts));
  document.getElementById('catBars').innerHTML = Object.entries(catCounts).map(([k,v])=>`
    <div class="bar-col">
      <div class="bar-val">${v}</div>
      <div class="bar" style="height:${(v/maxCat*110)}px;background:${CAT_COLOR[k]};"></div>
      <div class="bar-name">${CAT_LABEL[k]}</div>
    </div>`).join('');

  const nameById = {}; RAW.forEach(r=>nameById[r.id]=r.name);
  let logs = [...LOG_CACHE];
  if(CURRENT_USER.role==='sales') logs = logs.filter(l=>l.sales===CURRENT_USER.name);
  logs = logs.sort((a,b)=>new Date(b.timestamp)-new Date(a.timestamp)).slice(0,6);
  document.getElementById('recentUpdates').innerHTML = logs.length===0
    ? '<div class="timeline-empty">Belum ada aktivitas follow-up.</div>'
    : logs.map(l=>{
      const meta = STATUS_META[l.status] || {cls:"st-belum"};
      return `<div class="update-item">
        <div class="update-dot"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--red)" stroke-width="3"><path d="M9 11l3 3L22 4"/></svg></div>
        <div>
          <div class="update-title">${nameById[l.targetId] || 'Target #'+l.targetId}</div>
          <div class="update-sub">${l.sales||'Sales'} · <span class="status-pill ${meta.cls}" style="padding:1px 7px;">${l.status||''}</span></div>
          <div class="update-time">${timeAgo(l.timestamp)}</div>
        </div></div>`;
    }).join('');
  renderPerSalesPanel();
}

