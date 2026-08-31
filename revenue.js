/* ================= Revenue Tracking ================= */
function renderRevenueView(){
  const rows = scopedRows().map(r=>({...r,_bucket:bucketOf(r)})).filter(r=>r._bucket);
  if(rows.length===0){
    ['kpiRevTotal','kpiRevRealized2','kpiConvRate'].forEach(id=>document.getElementById(id).textContent="–");
    document.getElementById('revBars').innerHTML = '<div class="empty-state" style="width:100%;">Belum ada data.</div>';
    document.getElementById('revTableBody').innerHTML = '';
    return;
  }
  let totalValue=0, dealValue=0, dealCount=0;
  const catAgg = {TR:{n:0,rev:0,realized:0}, FR:{n:0,rev:0,realized:0}, NT:{n:0,rev:0,realized:0}};
  rows.forEach(r=>{
    totalValue += (r.revenue_estimator||0);
    const assign = getAssignment(r.id);
    const isDeal = assign.status==='Deal';
    if(isDeal){ dealValue += (r.revenue_estimator||0); dealCount++; }
    catAgg[r._bucket].n++;
    catAgg[r._bucket].rev += (r.revenue_estimator||0);
    if(isDeal) catAgg[r._bucket].realized += (r.revenue_estimator||0);
  });
  document.getElementById('kpiRevTotal').textContent = formatRupiah(totalValue);
  document.getElementById('kpiRevRealized2').textContent = formatRupiah(dealValue);
  document.getElementById('dealCountNote').textContent = dealCount + " target sudah Deal";
  document.getElementById('kpiConvRate').textContent = (dealCount/rows.length*100).toFixed(1) + "%";

  const maxRev = Math.max(1, ...Object.values(catAgg).map(c=>c.rev));
  document.getElementById('revBars').innerHTML = Object.entries(catAgg).map(([k,c])=>`
    <div class="bar-col">
      <div class="bar-val">${formatRupiah(c.rev)}</div>
      <div class="bar" style="height:${(c.rev/maxRev*110)}px;background:${CAT_COLOR[k]};"></div>
      <div class="bar-name">${CAT_LABEL[k]}</div>
    </div>`).join('');

  document.getElementById('revTableBody').innerHTML = Object.entries(catAgg).map(([k,c])=>`
    <tr><td><span class="cat-badge">${CAT_LABEL[k]}</span></td><td>${c.n}</td>
    <td class="mono">${formatRupiah(c.rev)}</td><td class="mono" style="color:var(--green);">${formatRupiah(c.realized)}</td></tr>`).join('');
}

