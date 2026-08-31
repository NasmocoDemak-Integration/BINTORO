/* ================= Progress Updates ================= */
function updateBreadcrumb(){
  const bc = document.getElementById('puBreadcrumb');
  if(puView==='detail'){
    bc.style.display = 'block';
    bc.textContent = selectedSalesForProgress ? `← Kembali ke target ${selectedSalesForProgress}` : '← Kembali';
    bc.onclick = ()=>{ puView = selectedSalesForProgress ? 'list' : (CURRENT_USER.role==='manager' ? 'grid' : 'list'); renderProgressUpdatesView(); };
  }else if(puView==='list' && CURRENT_USER.role==='manager'){
    bc.style.display = 'block';
    bc.textContent = '← Semua Sales';
    bc.onclick = ()=>{ puView='grid'; renderProgressUpdatesView(); };
  }else{
    bc.style.display = 'none';
  }
}

function renderSalesGrid(){
  document.getElementById('puTitle').textContent = 'Progress Updates';
  document.getElementById('puSub').textContent = 'Pilih sales untuk melihat target & progress follow-up.';
  const wrap = document.getElementById('puSalesGrid');
  wrap.style.display = 'grid';
  document.getElementById('puTargetListWrap').style.display = 'none';
  document.getElementById('puContent').style.display = 'none';

  wrap.innerHTML = activeSalesNames().map(s=>{
    const n = RAW.filter(r=>getAssignment(r.id).sales===s).length;
    const deal = RAW.filter(r=>getAssignment(r.id).sales===s && getAssignment(r.id).status==='Deal').length;
    return `<div class="sales-card" data-sales="${s}">
      <div class="sales-card-top">
        <div class="sales-card-avatar">${initials(s)}</div>
        <div><div class="sales-card-name">${s}</div><div class="sales-card-sub">Sales Aktif</div></div>
      </div>
      <div class="sales-card-stats">
        <div><b>${n}</b>Target</div>
        <div><b>${deal}</b>Deal</div>
      </div>
    </div>`;
  }).join('');
  wrap.querySelectorAll('.sales-card').forEach(c=>{
    c.addEventListener('click', ()=>{ selectedSalesForProgress = c.dataset.sales; puView='list'; renderProgressUpdatesView(); });
  });
}

function renderTargetListForSales(){
  document.getElementById('puTitle').textContent = selectedSalesForProgress || 'Target Saya';
  document.getElementById('puSub').textContent = 'Klik salah satu target untuk lihat & catat progress.';
  document.getElementById('puSalesGrid').style.display = 'none';
  document.getElementById('puTargetListWrap').style.display = 'block';
  document.getElementById('puContent').style.display = 'none';

  const search = (document.getElementById('puListSearch').value||'').toLowerCase();
  let rows = RAW.filter(r=>getAssignment(r.id).sales===selectedSalesForProgress).map(r=>({...r,_bucket:bucketOf(r)})).filter(r=>r._bucket);
  if(search) rows = rows.filter(r=>(r.name||'').toLowerCase().includes(search) || (r.vin||'').toLowerCase().includes(search));
  rows.sort((a,b)=> ageYears(b.date)-ageYears(a.date));

  const tbody = document.getElementById('puListTableBody');
  tbody.innerHTML = rows.length===0 ? `<tr><td colspan="4"><div class="empty-state">Belum ada target untuk sales ini.</div></td></tr>` :
    rows.map(r=>{
      const age = ageYears(r.date); const st = statusFromAge(age);
      const assign = getAssignment(r.id);
      const statusMeta = STATUS_META[assign.status] || STATUS_META["Belum Dihubungi"];
      return `<tr data-id="${r.id}">
        <td><div class="target-name">${r.name||'-'}</div><div class="target-sub">${r.type||'-'}</div></td>
        <td><span class="cat-badge">${CAT_LABEL[r._bucket]}</span></td>
        <td>${age!=null?age.toFixed(1)+' thn':'-'} <span class="age-badge ${st.cls}">${st.label}</span></td>
        <td><span class="status-pill ${statusMeta.cls}">${assign.status}</span></td>
      </tr>`;
    }).join('');
  tbody.querySelectorAll('tr[data-id]').forEach(tr=>{
    tr.addEventListener('click', ()=>{ selectedTargetId = tr.dataset.id; puView='detail'; renderProgressUpdatesView(); });
  });
}

function findCustomerHistory(target){
  if(!target.name || !target.kecamatan_norm) return [];
  const nameKey = String(target.name).trim().toUpperCase();
  const kecKey = String(target.kecamatan_norm).trim().toUpperCase();
  return RAW.filter(r=>
    r.id !== target.id &&
    r.name && r.kecamatan_norm &&
    String(r.name).trim().toUpperCase()===nameKey &&
    String(r.kecamatan_norm).trim().toUpperCase()===kecKey
  ).sort((a,b)=> new Date(a.date) - new Date(b.date));
}

function renderProgressContent(){
  document.getElementById('puSalesGrid').style.display = 'none';
  document.getElementById('puTargetListWrap').style.display = 'none';
  const container = document.getElementById('puContent');
  container.style.display = 'block';
  if(!selectedTargetId){ container.innerHTML = '<div class="empty-state">Belum ada target dipilih atau data belum tersambung.</div>'; return; }
  const target = RAW.find(r=>r.id===selectedTargetId);
  if(!target){ container.innerHTML = '<div class="empty-state">Target tidak ditemukan.</div>'; return; }

  const age = ageYears(target.date);
  const st = statusFromAge(age);
  document.getElementById('puTitle').textContent = target.name;
  document.getElementById('puSub').textContent = 'Detail target & catat progress follow-up.';

  const assign = getAssignment(target.id);
  const logs = LOG_CACHE.filter(l=>l.targetId===target.id).sort((a,b)=>new Date(b.timestamp)-new Date(a.timestamp));

  container.innerHTML = `
    <div class="pu-grid">
      <div>
        <div class="panel" style="margin-bottom:16px;">
          <h3>Person in Charge</h3>
          <div class="pic-card">
            <div class="pic-card-avatar">${assign.sales?initials(assign.sales):'?'}</div>
            <div><div class="pic-card-name">${assign.sales||'Belum di-assign'}</div><div class="pic-card-role">Sales Follow-up</div></div>
          </div>
        </div>
        <div class="panel" style="margin-bottom:16px;">
          <h3>Info Target</h3>
          <div class="info-line"><span>Unit</span><span>${target.type||'-'}</span></div>
          <div class="info-line"><span>VIN</span><span class="mono" style="font-size:11px;">${target.vin||'-'}</span></div>
          <div class="info-line"><span>Kecamatan</span><span>${target.kecamatan_norm||'-'}</span></div>
          <div class="info-line"><span>Tanggal Retail</span><span>${target.date||'-'}</span></div>
          <div class="info-line"><span>Umur</span><span>${age!=null?age.toFixed(1)+' thn':'-'} <span class="age-badge ${st.cls}">${st.label}</span></span></div>
          <div class="info-line"><span>Est. Revenue</span><span>${formatRupiah(target.revenue_estimator)}</span></div>
          <div class="info-line"><span>No. HP 1</span><span>${target.hp1||'-'}</span></div>
          <div class="info-line"><span>No. HP 2</span><span>${target.hp2||'-'}</span></div>
          <div class="info-line"><span>No. HP 3</span><span>${target.hp3||'-'}</span></div>
          <div class="info-line"><span>Sales Lama (saat beli)</span><span>${target.source_sales||'-'}</span></div>
        </div>
        ${(() => {
          const history = findCustomerHistory(target);
          if(history.length===0) return '';
          return `<div class="panel" style="margin-bottom:16px;">
            <h3>Riwayat Pembelian Customer Ini (${history.length + 1}x)</h3>
            ${history.map(h=>{
              return `<div class="info-line"><span>${h.date||'-'} — ${h.type||'-'}</span><span class="mono" style="font-size:10.5px;">${h.vin||''}</span></div>`;
            }).join('')}
            <div class="file-note">Dicocokkan berdasarkan Nama + Kecamatan yang sama persis.</div>
          </div>`;
        })()}
        <div class="panel log-form">
          <h3>Log Update Baru</h3>
          <label>Update Status</label>
          <select id="logStatusSelect">${STATUS_OPTIONS.map(s=>`<option value="${s}" ${assign.status===s?'selected':''}>${s}</option>`).join('')}</select>
          <label>Catatan</label>
          <textarea id="logNotes" placeholder="Tulis catatan hasil follow-up..."></textarea>
          <label>Dokumentasi (opsional)</label>
          <input type="file" id="logFile" accept="image/*,.pdf,.doc,.docx">
          <div class="file-note">Foto/dokumen akan diunggah ke Google Drive dan link-nya tersimpan otomatis.</div>

          <label>Update Nomor HP (opsional — replace atau tambah)</label>
          <input type="text" id="editHp1" placeholder="No. HP 1" value="${target.hp1||''}" style="margin-bottom:8px;background:var(--gray-soft);border:1px solid var(--border);border-radius:9px;padding:9px 12px;font-size:12.5px;width:100%;">
          <input type="text" id="editHp2" placeholder="No. HP 2" value="${target.hp2||''}" style="margin-bottom:8px;background:var(--gray-soft);border:1px solid var(--border);border-radius:9px;padding:9px 12px;font-size:12.5px;width:100%;">
          <input type="text" id="editHp3" placeholder="No. HP 3" value="${target.hp3||''}" style="background:var(--gray-soft);border:1px solid var(--border);border-radius:9px;padding:9px 12px;font-size:12.5px;width:100%;">
          <div class="file-note">Kosongkan field yang tidak ingin diubah — isi/replace nomor yang perlu diperbarui.</div>

          <button class="btn-submit" id="btnSubmitLog">Submit Update</button>
        </div>
      </div>
      <div class="panel">
        <h3>Progress Timeline</h3>
        <div id="timelineList">
          ${logs.length===0 ? '<div class="timeline-empty">Belum ada riwayat follow-up.</div>' :
            logs.map(l=>{
              const meta = STATUS_META[l.status] || {cls:"st-belum"};
              const d = new Date(l.timestamp);
              const dTxt = isNaN(d) ? l.timestamp : d.toLocaleString('id-ID',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});
              const docHtml = l.docUrl && l.docUrl.startsWith('http') ? `<div class="timeline-doc"><a href="${l.docUrl}" target="_blank">📎 Lihat Dokumen</a></div>` : (l.docUrl==='(mengunggah...)' ? `<div class="timeline-doc" style="color:var(--text-dim);">Mengunggah dokumen...</div>` : '');
              return `<div class="timeline-item">
                <div class="timeline-head">
                  <span class="timeline-title">${l.sales||'Sales'} <span class="status-pill ${meta.cls}" style="margin-left:6px;">${l.status||''}</span></span>
                  <span class="timeline-time">${dTxt}</span>
                </div>
                ${l.notes?`<div class="timeline-notes">${l.notes}</div>`:''}
                ${docHtml}
              </div>`;
            }).join('')}
        </div>
      </div>
    </div>`;

  document.getElementById('btnSubmitLog').addEventListener('click', async ()=>{
    const status = document.getElementById('logStatusSelect').value;
    const notes = document.getElementById('logNotes').value.trim();
    const file = document.getElementById('logFile').files[0];
    const sales = assign.sales || (CURRENT_USER.role==='sales' ? CURRENT_USER.name : 'Manager');
    const newHp1 = document.getElementById('editHp1').value.trim();
    const newHp2 = document.getElementById('editHp2').value.trim();
    const newHp3 = document.getElementById('editHp3').value.trim();

    await setAssignment(target.id, 'status', status);
    await submitLog(target.id, sales, status, notes, file);

    if(newHp1!==(target.hp1||'') || newHp2!==(target.hp2||'') || newHp3!==(target.hp3||'')){
      await updatePhoneNumbers(target.id, newHp1, newHp2, newHp3);
    }
    renderProgressContent();
    renderDatabaseView();
    renderDashboard();
  });
}

function renderProgressUpdatesView(){
  updateBreadcrumb();
  if(puView==='grid') renderSalesGrid();
  else if(puView==='list') renderTargetListForSales();
  else renderProgressContent();
}

