/* ============================================================
   ⚠️ GANTI URL INI dengan Web App URL dari Apps Script lo,
   supaya tools ini otomatis connect begitu dibuka (auto-connect).
   ============================================================ */
const SHEET_URL_DEFAULT = "PASTE_WEB_APP_URL_ANDA_DI_SINI"; // JANGAN commit URL asli ke repo public — isi lewat ikon gear di app, tersimpan otomatis di browser (localStorage).

let RAW = [];
let SHEET_URL = "";
let ASSIGN_CACHE = {};
let LOG_CACHE = [];
let CURRENT_USER = null; // {role:'manager'} | {role:'sales', name:'...'}
let currentCatFilter = "";
let dashCatFilter = "all";
let currentSort = "age_desc";
let currentPage = 1;
let PAGE_SIZE = 25;
let selectedSalesForProgress = null; // nama sales yg lagi dilihat manager, atau CURRENT_USER.name kalau role sales
let puView = 'grid'; // 'grid' | 'list' | 'detail'
let selectedTargetId = null;

const STATUS_META = {
  "Belum Dihubungi":{cls:"st-belum"},
  "Sudah Dihubungi":{cls:"st-sudah"},
  "Prospek":{cls:"st-prospek"},
  "Hot Prospek":{cls:"st-hotprospek"},
  "Deal":{cls:"st-deal"},
  "Tidak Tertarik":{cls:"st-tidak"},
};
const STATUS_OPTIONS = Object.keys(STATUS_META);
let USERS_CACHE = []; // {nik, nama, username, no_hp, role}
function activeSalesNames(){
  const names = USERS_CACHE.filter(u=>u.role==='sales').map(u=>u.nama);
  return names.length>0 ? names : ["MUHAMMAD ROIS","WITA MARLIANA","GIGIH JOKO ADHI PAMUNGKAS","FRENKY WINASIS","AHMAD IRWAN","YULIA SABATINI","MUHAMMAD ABDUL KARIM","ADITYA DWI CAHYONO","ALI MASKURI","DENI ABRORI MUSTAK"];
}

