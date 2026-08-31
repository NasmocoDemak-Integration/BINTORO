/* ================= Helpers ================= */
function formatRupiah(v){
  if(v==null || isNaN(v)) return "–";
  if(Math.abs(v) >= 1e9) return "Rp " + (v/1e9).toLocaleString('id-ID',{maximumFractionDigits:1,minimumFractionDigits:1}) + " M";
  if(Math.abs(v) >= 1e6) return "Rp " + Math.round(v/1e6).toLocaleString('id-ID') + " jt";
  return "Rp " + Math.round(v).toLocaleString('id-ID');
}
function ageYears(dateStr){
  if(!dateStr) return null;
  const d = new Date(dateStr);
  if(isNaN(d)) return null;
  return (Date.now() - d.getTime()) / (1000*60*60*24*365.25);
}
function statusFromAge(age){
  if(age==null) return {label:"?", cls:"keep"};
  if(age < 3) return {label:"Keep", cls:"keep"};
  if(age < 5) return {label:"Cold", cls:"cold"};
  if(age < 8) return {label:"Warm", cls:"warm"};
  return {label:"Hot", cls:"hot"};
}
function bucketOf(row){
  const age = ageYears(row.date);
  if(age==null) return null;
  if(age < 3) return "NT";
  if(row.category === "target_replacement") return "TR";
  if(row.category === "fleet_replacement") return "FR";
  return null;
}
const CAT_LABEL = {TR:"Target Replacement", FR:"Fleet/GSO Replacement", NT:"Next Target"};
const CAT_COLOR = {TR:"var(--red)", FR:"var(--purple)", NT:"var(--blue)"};
function initials(name){
  if(!name) return "?";
  const parts = String(name).trim().split(/\s+/);
  return ((parts[0]||"")[0]+(parts[1]||"")[0]).toUpperCase();
}
function timeAgo(iso){
  if(!iso) return "";
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs/60000);
  if(mins < 1) return "baru saja";
  if(mins < 60) return mins + " menit lalu";
  const hrs = Math.floor(mins/60);
  if(hrs < 24) return hrs + " jam lalu";
  return Math.floor(hrs/24) + " hari lalu";
}
function isVisibleToCurrentUser(row){
  if(!CURRENT_USER || CURRENT_USER.role === 'manager') return true;
  const a = getAssignment(row.id);
  return a.sales === CURRENT_USER.name;
}

