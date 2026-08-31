/* ================= User Management ================= */
let umEditingNik = null;

function renderUsersView(){
  document.getElementById('umForm').classList.remove('open');
  const tbody = document.getElementById('usersTableBody');
  tbody.innerHTML = USERS_CACHE.length===0 ? `<tr><td colspan="6"><div class="empty-state">Belum ada user.</div></td></tr>` :
    USERS_CACHE.map(u=>`
      <tr>
        <td class="mono" style="font-size:11px;">${u.nik}</td>
        <td class="target-name">${u.nama}</td>
        <td class="mono" style="font-size:11.5px;">${u.username}</td>
        <td style="font-size:11.5px;">${u.no_hp||'-'}</td>
        <td><span class="cat-badge" style="text-transform:capitalize;">${u.role}</span></td>
        <td>
          <button class="icon-btn-sm" data-edit="${u.nik}" title="Edit">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4z"/></svg>
          </button>
          <button class="icon-btn-sm" data-delete="${u.nik}" title="Hapus" style="margin-left:5px;">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z"/></svg>
          </button>
        </td>
      </tr>`).join('');

  tbody.querySelectorAll('[data-edit]').forEach(b=>b.addEventListener('click', ()=>openUserForm(b.dataset.edit)));
  tbody.querySelectorAll('[data-delete]').forEach(b=>b.addEventListener('click', ()=>deleteUser(b.dataset.delete)));
}

function openUserForm(nik){
  const form = document.getElementById('umForm');
  form.classList.add('open');
  if(nik){
    const u = USERS_CACHE.find(x=>x.nik===nik);
    umEditingNik = nik;
    document.getElementById('umFormTitle').textContent = 'Edit User: ' + u.nama;
    document.getElementById('umNik').value = u.nik; document.getElementById('umNik').disabled = true;
    document.getElementById('umNama').value = u.nama;
    document.getElementById('umUsername').value = u.username;
    document.getElementById('umPassword').value = '';
    document.getElementById('umPassHint').textContent = '(kosongkan jika tidak diubah)';
    document.getElementById('umNoHp').value = u.no_hp||'';
    document.getElementById('umRole').value = u.role;
  }else{
    umEditingNik = null;
    document.getElementById('umFormTitle').textContent = 'Tambah User Baru';
    ['umNik','umNama','umUsername','umPassword','umNoHp'].forEach(id=>document.getElementById(id).value='');
    document.getElementById('umNik').disabled = false;
    document.getElementById('umPassHint').textContent = '';
    document.getElementById('umRole').value = 'sales';
  }
}

document.getElementById('btnAddUser').addEventListener('click', ()=>openUserForm(null));
document.getElementById('umCancelBtn').addEventListener('click', ()=>document.getElementById('umForm').classList.remove('open'));
document.getElementById('umSaveBtn').addEventListener('click', async ()=>{
  const nik = document.getElementById('umNik').value.trim();
  const nama = document.getElementById('umNama').value.trim();
  const username = document.getElementById('umUsername').value.trim();
  const password = document.getElementById('umPassword').value;
  const no_hp = document.getElementById('umNoHp').value.trim();
  const role = document.getElementById('umRole').value;
  if(!nik || !nama || !username || (!umEditingNik && !password)){ alert('NIK, Nama, Username wajib diisi (Password wajib untuk user baru).'); return; }

  if(umEditingNik){
    await fetch(SHEET_URL, { method:"POST", body: JSON.stringify({ action:"updateUser", nik, nama, username, password, no_hp, role }) });
    const idx = USERS_CACHE.findIndex(u=>u.nik===nik);
    if(idx>-1) USERS_CACHE[idx] = {...USERS_CACHE[idx], nama, username, no_hp, role};
  }else{
    if(USERS_CACHE.some(u=>u.nik===nik)){ alert('NIK sudah dipakai user lain.'); return; }
    await fetch(SHEET_URL, { method:"POST", body: JSON.stringify({ action:"addUser", nik, nama, username, password, no_hp, role }) });
    USERS_CACHE.push({nik, nama, username, no_hp, role});
  }
  document.getElementById('umForm').classList.remove('open');
  renderUsersView();
  populateFilterOptions();
});

async function deleteUser(nik){
  const u = USERS_CACHE.find(x=>x.nik===nik);
  if(!confirm(`Hapus user ${u ? u.nama : nik}? Tindakan ini tidak bisa dibatalkan.`)) return;
  await fetch(SHEET_URL, { method:"POST", body: JSON.stringify({ action:"deleteUser", nik }) });
  USERS_CACHE = USERS_CACHE.filter(x=>x.nik!==nik);
  renderUsersView();
  populateFilterOptions();
}

