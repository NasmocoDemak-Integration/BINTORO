/* ================= Validasi Nomor (Customer Validator) ================= */
function pendingValidationRows(){
  return RAW.filter(r=> getAssignment(r.id).needs_validation);
}

function renderValidationView(){
  if(CURRENT_USER.role !== 'validator' && CURRENT_USER.role !== 'manager'){
    document.getElementById('view-validasi').innerHTML = '<div class="empty-state">Fitur ini hanya untuk Customer Validator.</div>';
    return;
  }

  const pending = pendingValidationRows();
  const todayStr = new Date().toISOString().slice(0,10);
  const resolvedLogs = VALIDATION_LOG_CACHE.filter(l=>l.event==='Divalidasi');
  const resolvedToday = resolvedLogs.filter(l=> String(l.timestamp||'').slice(0,10)===todayStr).length;

  document.getElementById('valKpiPending').textContent = pending.length;
  document.getElementById('valKpiToday').textContent = resolvedToday;
  document.getElementById('valKpiTotal').textContent = resolvedLogs.length;

  renderValidasiList(pending);

  const searchEl = document.getElementById('validasiSearch');
  searchEl.oninput = ()=>{
    const q = searchEl.value.toLowerCase();
    const filtered = pending.filter(r=> (r.name||'').toLowerCase().includes(q) || (r.vin||'').toLowerCase().includes(q) || (r.type||'').toLowerCase().includes(q));
    renderValidasiList(filtered);
  };
}

function renderValidasiList(rows){
  const wrap = document.getElementById('validasiList');
  if(rows.length===0){
    wrap.innerHTML = '<div class="empty-state">🎉 Gak ada target yang nunggu validasi nomor saat ini.</div>';
    return;
  }

  wrap.innerHTML = rows.map(r=>{
    const assign = getAssignment(r.id);
    return `<div class="panel" style="margin-bottom:12px;" data-id="${r.id}">
      <div>
        <div class="target-name">${r.name||'-'}</div>
        <div class="target-sub">${r.type||'-'} — <span class="mono" style="font-size:10.5px;">${r.vin||''}</span></div>
        <div style="font-size:11.5px;color:var(--text-dim);margin-top:2px;">Sales saat ini: <b>${assign.sales||'Belum di-assign'}</b></div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:8px;margin-top:12px;">
        <input type="text" class="val-hp1" placeholder="No. HP 1" value="${r.hp1||''}" style="background:var(--gray-soft);border:1px solid var(--border);border-radius:9px;padding:9px 12px;font-size:12.5px;">
        <input type="text" class="val-hp2" placeholder="No. HP 2" value="${r.hp2||''}" style="background:var(--gray-soft);border:1px solid var(--border);border-radius:9px;padding:9px 12px;font-size:12.5px;">
        <input type="text" class="val-hp3" placeholder="No. HP 3" value="${r.hp3||''}" style="background:var(--gray-soft);border:1px solid var(--border);border-radius:9px;padding:9px 12px;font-size:12.5px;">
      </div>
      <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap;align-items:center;">
        <select class="val-assign" style="flex:1;min-width:160px;background:var(--gray-soft);border:1px solid var(--border);border-radius:9px;padding:9px 12px;font-size:12.5px;">
          <option value="">— Belum di-assign —</option>
          ${activeSalesNames().map(s=>`<option value="${s}" ${assign.sales===s?'selected':''}>${s}</option>`).join('')}
        </select>
        <button class="btn-submit val-submit" style="width:auto;padding:9px 18px;">Simpan &amp; Selesai</button>
      </div>
    </div>`;
  }).join('');

  wrap.querySelectorAll('[data-id]').forEach(card=>{
    const id = card.dataset.id;
    const btn = card.querySelector('.val-submit');
    btn.addEventListener('click', async ()=>{
      btn.disabled = true; btn.textContent = 'Menyimpan...';
      const hp1 = card.querySelector('.val-hp1').value.trim();
      const hp2 = card.querySelector('.val-hp2').value.trim();
      const hp3 = card.querySelector('.val-hp3').value.trim();
      const newSales = card.querySelector('.val-assign').value;
      await resolveValidation(id, hp1, hp2, hp3, newSales);
      renderValidationView();
      if(typeof renderDashboard==='function') renderDashboard();
    });
  });
}
