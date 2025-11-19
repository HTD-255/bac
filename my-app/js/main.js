import Map from 'ol/Map.js';
import View from 'ol/View.js';
import TileLayer from 'ol/layer/Tile.js';
import Point from 'ol/geom/Point.js';
import { useGeographic } from 'ol/proj.js';
import Icon from 'ol/style/Icon.js';
import { API_BASE_URL,WS } from './config.js';

import ImageTile from 'ol/source/ImageTile.js';
import VectorSource from 'ol/source/Vector.js';
import VectorLayer from 'ol/layer/Vector.js';
import Feature from 'ol/Feature.js';
import LineString from 'ol/geom/LineString.js';
// import {fromLonLat} from 'ol/proj.js';
import Style from 'ol/style/Style.js';
import Stroke from 'ol/style/Stroke.js';
import Circle from 'ol/style/Circle';
import Fill from 'ol/style/Fill';
import Overlay from 'ol/Overlay.js';
import GeoJSON from 'ol/format/GeoJSON.js';
import { headers, data, datachuyenBien, headersChuyenBien, Table } from './Table';
import { download, DanhSachTau, DanhSachChuyenBien, Locations, TimTauTheoId } from './Controll.js';
import { LoadingOverlay } from './loading';
// tạo loading và thêm vào body
const loadingMain = new LoadingOverlay
document.body.prepend(loadingMain.getElement())

//taoj loading cho dialog
const loadingShip = new LoadingOverlay("loading-ship")
// ánh xạ modal - lazy initialization to avoid bootstrap timing issues
var modalDetailEL = document.getElementById('modal-detail');
var modalDetail = null;

var modalControllEL = document.getElementById('modal-controll');
var modalControll = null;

var modalInforEL = document.getElementById('modal-info');
var modalInfor = null;

// Helper function to get or create bootstrap modal instances
function getModalDetail() {
  if (!modalDetail && typeof bootstrap !== 'undefined' && bootstrap.Modal) {
    modalDetail = new bootstrap.Modal(modalDetailEL);
  }
  return modalDetail;
}

function getModalControll() {
  if (!modalControll && typeof bootstrap !== 'undefined' && bootstrap.Modal) {
    modalControll = new bootstrap.Modal(modalControllEL);
  }
  return modalControll;
}

function getModalInfor() {
  if (!modalInfor && typeof bootstrap !== 'undefined' && bootstrap.Modal) {
    modalInfor = new bootstrap.Modal(modalInforEL);
  }
  return modalInfor;
}

const content = modalControllEL.querySelector(".modal-dialog .modal-content .modal-body #ship-info-display #table-container");

const tableShip = new Table("table-ship")
tableShip.createTHead(headers)
tableShip.create()

// Helper: render an array of ship objects into `tableShip` tbody
function renderShipArray(data) {
  if (!tableShip.tbody) return;
  tableShip.tbody.innerHTML = '';
  if (!Array.isArray(data) || data.length === 0) {
    const r = tableShip.createRow();
    const td = document.createElement('div');
    td.className = 'col';
    td.textContent = 'Không có dữ liệu';
    r.appendChild(td);
    tableShip.tbody.appendChild(r);
    return;
  }
  console.log(data);
  data.forEach(item => {
    const row = tableShip.createRow()
    const div1 = document.createElement("div")
    div1.className = "col-4";
    div1.textContent = item.id;
    row.appendChild(div1)

    const div2 = document.createElement("div")
    div2.className = "col";
    div2.textContent = item.chuyen_bien_so || item.chuyenBienSo || '';
    div2.dataset.id = item.Id || item.id || '';
    row.appendChild(div2)

    const div3 = document.createElement("div")
    div3.className = "col";
    if(Number(item.sos)===1){
  div3.textContent = "SOS"
  div3.style.color="red"
    }else{
      div3.textContent = (Number(item.statuss)===1)?"Hoạt động":"Cập Bến";
    }
    row.appendChild(div3)

    // Add 4th column with "Xem" button to view sea trips
    const div4 = document.createElement("div")
    div4.className = "col";
    const viewButton = document.createElement("button")
    viewButton.className = "btn btn-primary btn-sm";
    viewButton.textContent = "Xem";
    viewButton.addEventListener("click", () => {
      showChuyenBienOnclick(item.id);
    });
    div4.appendChild(viewButton);
    row.appendChild(div4)

    tableShip.tbody.appendChild(row)
  })
}

const tableChuyenBien = new Table("table-chuyen-bien")
tableChuyenBien.createTHead(headersChuyenBien);

const showChuyenBienOnclick = (idShip) => {
  console.log(idShip);


  // Ensure loadingShip element is present in the content (only once)
  if (!content.contains(loadingShip.getElement())) {
    content.appendChild(loadingShip.getElement());
  }

  // Ensure title exists
  const titleId = 'chuyen-bien-title';
  if (!content.querySelector(`#${titleId}`)) {
    content.insertAdjacentHTML("beforeend", `<h6 class="border-bottom pb-2 mb-3" id="${titleId}">Thông tin Chuyến biển</h6>`);
  }

  // Ensure table structure exists and is appended only once
  tableChuyenBien.create(); // ensure table/tbody
  if (!content.contains(tableChuyenBien.table)) {
    content.appendChild(tableChuyenBien.table);
  }
  // show loading overlay for this fetch
  loadingShip.show();
  // 6. GỌI API VÀ ĐIỀN DỮ LIỆU
  DanhSachChuyenBien(idShip, (data) => {
    console.log(data);

    // 7. ✅ LÀM SẠCH DỮ LIỆU CŨ TRONG TBODY (Chỉ xóa hàng, giữ lại khung bảng)
    if (tableChuyenBien.tbody) {
      tableChuyenBien.tbody.innerHTML = '';
    }

  data.forEach(item => {
      // Giả định tableChuyenBien.createRow() đã được sửa để tạo <tr> và thêm vào tbody
      const row = tableChuyenBien.createRow();
      // ... (Phần còn lại của logic tạo <div>/button và thêm vào row)

      const div1 = document.createElement("div");
      div1.className = "col";
      div1.textContent = item.chuyen_bien_so;
      row.appendChild(div1);

      const div2 = document.createElement("div");
      div2.className = "col";
      div2.textContent = item.statuss=1?"Hoạt động":"Hoàn thành";
      row.appendChild(div2);

      // Button 1: Xem chi tiết
      const div3 = document.createElement("div");
      div3.className = "col";
      const button = document.createElement("button");
      button.className = "btn btn-primary";
      button.dataset.id = item.Id;
      // use an icon instead of text for the "xem" action
  const img = document.createElement('img');
  img.src = '/documnet.svg';
  img.alt = 'xem-chi-tiet';
  img.style.width = '20px';
  img.style.height = '20px';
  img.style.objectFit = 'contain';
  button.appendChild(img);
      
      button.addEventListener("click",()=>{
        showDetail(item.Id)
      })
      // Bổ sung sự kiện (nếu cần)
      div3.appendChild(button);
      row.appendChild(div3);

      // Button 2: Xem đường đi
      const div4 = document.createElement("div");
      div4.className = "col";
      const button1 = document.createElement("button");
      button1.className = "btn btn-primary";
      button1.dataset.id = item.Id;
     // use an icon instead of text for the "xem" action
  const img1 = document.createElement('img');
  img1.src = '/map_maker.svg';
  img1.alt = 'xem';
  img1.style.width = '20px';
  img1.style.height = '20px';
  img1.style.objectFit = 'contain';
  button1.appendChild(img1);
      button1.addEventListener("click",()=>{
        duongDiChuyenBien(item.Id);
        
      })
      // Bổ sung sự kiện (nếu cần)
      div4.appendChild(button1);
      row.appendChild(div4);

      // Nếu createRow() không tự thêm row vào tbody, bạn cần dòng này:
      if (tableChuyenBien.tbody) {
        tableChuyenBien.tbody.appendChild(row);
      }

    });
    // hide loading after populating all rows
    loadingShip.hide();
  },
    () => {
      // on error, hide loading
      loadingShip.hide();

    }
  )
}

const showDetail = (idChuyenBien) => {
  
  const modal = getModalDetail();
  if (modal) modal.show();
  // tab containers (created in index.html)
  const containerThuTha = modalDetailEL.querySelector('#container-thu-tha');
  const containerLoaiQuy = modalDetailEL.querySelector('#container-loai-quy');
  const containerTruyenTai = modalDetailEL.querySelector('#container-truyen-tai');
  const tableThuTha=new Table("table-thu-tha")
  // Use the global page-level loading overlay (already prepended to body)
  // đảm bảo vùng hiển thị rỗng trước khi thêm
  if (containerThuTha) containerThuTha.innerHTML = '';
  if (containerLoaiQuy) containerLoaiQuy.innerHTML = '';
  if (containerTruyenTai) containerTruyenTai.innerHTML = '';
  // show global loading overlay while fetching detail
  loadingMain.show();
  tableThuTha.thead.innerHTML=` <tr class="table-header">
            <td rowspan="2" class="align-middle text-center" style="width:3%">Stt</td>
            <td rowspan="2" class="align-middle" style="width:5%">Mẻ thứ</td>
            <td colspan="2" class="align-middle" style="width:18%">Thời điểm bắt đầu thả (giờ, phút, ngày, tháng)</td>
            <td colspan="2" class="align-middle" style="width:12%">Vị trí thả</td>
            <td colspan="2" class="align-middle" style="width:18%">Thời điểm kết thúc thu (giờ, phút, ngày, tháng)</td>
            <td colspan="2" class="align-middle" style="width:12%">Vị trí thu</td>
            <td colspan="6" class="align-middle">Sản lượng các loài thủy sản chủ yếu**(kg)</td>
            <td rowspan="2" class="align-middle text-end" style="width:7%">Tổng sản lượng (kg)</td>
          </tr>
          <tr class="table-header">
            <td class="align-middle">Ngày/Tháng</td>
            <td class="align-middle">Giờ/Phút</td>
            <td class="align-middle">Vĩ độ</td>
            <td class="align-middle">Kinh độ</td>
            <td class="align-middle">Ngày/Tháng</td>
            <td class="align-middle">Giờ/Phút</td>
            <td class="align-middle">Vĩ độ</td>
            <td class="align-middle">Kinh độ</td>
            <td class="align-middle" style="width:7%">Loài 1</td>
            <td class="align-middle" style="width:7%">Loài 2</td>
            <td class="align-middle" style="width:7%">Loài 3</td>
            <td class="align-middle" style="width:7%">Loài 4</td>
            <td class="align-middle" style="width:7%">Loài 5</td>
            <td class="align-middle" style="width:7%">Loài khác</td>
          </tr>`
  tableThuTha.create();
  if (containerThuTha) containerThuTha.appendChild(tableThuTha.table);

    const tableloaiQuy=new Table("table-loai-quy")
  tableloaiQuy.thead.innerHTML=`  <tr class="table-header">
            <td rowspan="2" class="align-middle text-center" style="width:4%">Stt</td>
            <td rowspan="2" class="align-middle" style="width:6%">Mẻ</td>
            <td rowspan="2" class="align-middle">Loài</td>
            <td rowspan="2" class="align-middle" style="width:18%">Thời điểm bắt gặp (giờ, phút, ngày, tháng)</td>
            <td rowspan="2" class="align-middle text-end" style="width:12%">Khối lượng/con (ước tính kg)</td>
            <td rowspan="2" class="align-middle text-end" style="width:12%">Số lượng ước tính (con)</td>
            <td rowspan="2" class="align-middle" style="width:12%">Kích thước ước tính (cm)</td>
            <td colspan="3" class="align-middle">Bắt gặp trong quá trình khai thác (chọn 1)</td>
            <td colspan="3" class="align-middle">Tình trạng bắt gặp (chọn 1)</td>
          </tr>
          <tr class="table-header">
            <td class="align-middle">Thả lưới/câu</td>
            <td class="align-middle">Kéo lưới</td>
            <td class="align-middle">Khác</td>
            <td class="align-middle">Sống</td>
            <td class="align-middle">Chết</td>
            <td class="align-middle">Bị thương</td>
          </tr>
        </thead>
          </tr>`

            tableloaiQuy.thead.innerHTML=`  <tr class="table-header">
            <td rowspan="2" class="align-middle text-center" style="width:4%">Stt</td>
            <td rowspan="2" class="align-middle" style="width:6%">Mẻ</td>
            <td rowspan="2" class="align-middle">Loài</td>
            <td rowspan="2" class="align-middle" style="width:18%">Thời điểm bắt gặp (giờ, phút, ngày, tháng)</td>
            <td rowspan="2" class="align-middle text-end" style="width:12%">Khối lượng/con (ước tính kg)</td>
            <td rowspan="2" class="align-middle text-end" style="width:12%">Số lượng ước tính (con)</td>
            <td rowspan="2" class="align-middle" style="width:12%">Kích thước ước tính (cm)</td>
            <td colspan="3" class="align-middle">Bắt gặp trong quá trình khai thác (chọn 1)</td>
            <td colspan="3" class="align-middle">Tình trạng bắt gặp (chọn 1)</td>
            <td rowspan="2" class="align-middle">Ghi chú</td>
          </tr>
          <tr class="table-header">
            <td class="align-middle">Thả lưới/câu</td>
            <td class="align-middle">Kéo lưới</td>
            <td class="align-middle">Khác</td>
            <td class="align-middle">Sống</td>
            <td class="align-middle">Chết</td>
            <td class="align-middle">Bị thương</td>
          </tr>
        </thead>
          </tr>`
  // tableloaiQuy.createRow().appendChild(loading.element)
  // tableloaiQuy.tbody.appendChild(loading.element);
  // loading.show()
  tableloaiQuy.create();

  if (containerLoaiQuy) containerLoaiQuy.appendChild(tableloaiQuy.table);

  // Loading already shown (loadingMain)

  // Helper: render array of objects into table rows using a schema mapping.
  // The schema is an array where each column is either { type: 'index' }
  // or { keys: ['candidateKey', ...], format: 'text'|'date'|'number'|'boolean' }.
  function getByPath(obj, path) {
    if (!obj || !path) return undefined;
    const parts = path.split('.');
    let cur = obj;
    for (let p of parts) {
      if (cur == null) return undefined;
      // support bracket index like coords[1]
      const m = p.match(/^([^\[]+)(?:\[(\d+)\])?$/);
      if (!m) {
        cur = cur[p];
        continue;
      }
      const name = m[1];
      const idx = m[2];
      if (name) cur = cur[name];
      if (idx !== undefined) {
        if (!Array.isArray(cur)) return undefined;
        cur = cur[Number(idx)];
      }
    }
    return cur;
  }

  function firstAvailable(item, keys) {
    if (!keys || !Array.isArray(keys)) return '';
    for (const k of keys) {
      const v = getByPath(item, k);
      if (v !== undefined && v !== null && v !== '') return v;
    }
    return '';
  }

  function formatValue(val, type) {
    if (val === null || val === undefined) return '';
    if (type === 'date') {
      const d = new Date(val);
      if (!isNaN(d)) return d.toLocaleDateString();
      return String(val);
    }
    if (type === 'number') {
      const n = Number(val);
      return isNaN(n) ? String(val) : n.toLocaleString();
    }
    if (type === 'boolean') {
      // accept booleans, numbers, or string matches
      if (typeof val === 'boolean') return val ? '✓' : '';
      if (typeof val === 'number') return val !== 0 ? '✓' : '';
      if (typeof val === 'string') {
        const v = val.trim().toLowerCase();
        const trueStrings = ['sống','song','alive','true','yes','1','có','co'];
        // simple substring match for some tool names like 'thả lưới'
        const toolTrueStrings = ['thả lưới','tha luoi','thả','tha','keo lưới','keo luoi','keo'];
        if (trueStrings.includes(v)) return '✓';
        if (toolTrueStrings.includes(v)) return '✓';
        // also treat common affirmative words
        if (v === 'x' || v === '✓') return '✓';
        return '';
      }
      return '';
    }
    return String(val);
  }

  // Try to extract lon/lat pair from various shapes inside the item object
  function extractLonLat(item) {
    if (!item || typeof item !== 'object') return null;

    const tryArray = (arr) => {
      if (!Array.isArray(arr) || arr.length < 2) return null;
      const a = Number(arr[0]);
      const b = Number(arr[1]);
      if (Number.isFinite(a) && Number.isFinite(b)) {
        if (a >= -180 && a <= 180 && b >= -90 && b <= 90) return { lon: a, lat: b };
        if (b >= -180 && b <= 180 && a >= -90 && a <= 90) return { lon: b, lat: a };
      }
      return null;
    };

    try {
      if (item.geometry && item.geometry.coordinates) {
        const found = tryArray(item.geometry.coordinates);
        if (found) return found;
      }
      if (item.coordinates) {
        const found = tryArray(item.coordinates);
        if (found) return found;
      }
      if (item.location && item.location.coordinates) {
        const found = tryArray(item.location.coordinates);
        if (found) return found;
      }
      if (item.position && item.position.coordinates) {
        const found = tryArray(item.position.coordinates);
        if (found) return found;
      }
      if (Array.isArray(item.coords)) {
        const found = tryArray(item.coords);
        if (found) return found;
      }

      const lonCandidates = ['longitude','lon','long','kinh_do','kinhdo','kinh_do_tha','kinh_do_thu'];
      const latCandidates = ['latitude','lat','vi_do','vi_do_tha','vi_do_thu','vido'];
      let lonVal = null, latVal = null;
      for (const k of lonCandidates) if (item[k] !== undefined) { const v = Number(item[k]); if (Number.isFinite(v)) { lonVal = v; break; } }
      for (const k of latCandidates) if (item[k] !== undefined) { const v = Number(item[k]); if (Number.isFinite(v)) { latVal = v; break; } }
      if (lonVal !== null && latVal !== null) return { lon: lonVal, lat: latVal };

      const parseCoordString = (str) => {
        if (typeof str !== 'string') return null;
        const parts = str.split(/[;,\s]+/).map(s => s.trim()).filter(s => s.length);
        if (parts.length < 2) return null;
        const a = Number(parts[0]);
        const b = Number(parts[1]);
        if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
        if (a >= -180 && a <= 180 && b >= -90 && b <= 90) return { lon: a, lat: b };
        if (b >= -180 && b <= 180 && a >= -90 && a <= 90) return { lon: b, lat: a };
        return null;
      };

      for (const k of Object.keys(item)) {
        const v = item[k];
        if (typeof v === 'string') {
          const p = parseCoordString(v);
          if (p) return p;
        }
      }

      for (const k of Object.keys(item)) {
        const v = item[k];
        if (v && typeof v === 'object') {
          if (Array.isArray(v) && v.length >= 2) {
            const found = tryArray(v);
            if (found) return found;
          }
          for (const kk of Object.keys(v)) {
            if (typeof v[kk] === 'string') {
              const p = parseCoordString(v[kk]);
              if (p) return p;
            }
          }
        }
      }
    } catch (e) {
      // ignore
    }
    return null;
  }

  // Normalize thu-tha data: each entry may already be a "mẻ" or may contain an array of mẻ under keys like 'me', 'methu', 'meThu'.
  // This function returns a flat array where each element corresponds to one mẻ (row).
  function normalizeThuThaEntries(arr) {
    if (!Array.isArray(arr)) return [];
    const out = [];
    // If entries are simple point events (each row has me and statuss), group them by `me` value
    const byMe = Object.create(null);
    arr.forEach(entry => {
      if (!entry || typeof entry !== 'object') return;
      // prefer explicit 'me' key if present
      const meKey = entry.me != null ? String(entry.me) : '__no_me__';
      if (!byMe[meKey]) byMe[meKey] = [];
      byMe[meKey].push(entry);
    });

    const fmtTime = (iso) => {
      if (!iso) return '';
      try {
        const d = new Date(iso);
        if (isNaN(d)) return String(iso);
        // return localized time hh:mm
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } catch (e) { return String(iso); }
    };

    for (const meKey in byMe) {
      const items = byMe[meKey];
      // find drop (statuss==0) and haul (statuss==1)
      const drop = items.find(i => Number(i.statuss) === 0) || items[0];
      const haul = items.find(i => Number(i.statuss) === 1) || null;

      const row = {};
      // keep original me identifier
      row.me = drop && drop.me != null ? drop.me : (haul && haul.me != null ? haul.me : null);

      // start (thả)
      row.thoi_diem_bat_dau = drop && drop.time_create ? drop.time_create : '';
      row.thoi_diem_bat_dau_hour = drop && drop.time_create ? fmtTime(drop.time_create) : '';
      row.vi_do_tha = drop && (drop.lat ?? drop.latitude) != null ? (drop.lat ?? drop.latitude) : '';
      row.kinh_do_tha = drop && (drop.long ?? drop.lon ?? drop.longitude) != null ? (drop.long ?? drop.lon ?? drop.longitude) : '';

      // end (thu)
      row.thoi_diem_ket_thuc = haul && haul.time_create ? haul.time_create : '';
      row.thoi_diem_ket_thuc_hour = haul && haul.time_create ? fmtTime(haul.time_create) : '';
      row.vi_do_thu = haul && (haul.lat ?? haul.latitude) != null ? (haul.lat ?? haul.latitude) : '';
      row.kinh_do_thu = haul && (haul.long ?? haul.lon ?? haul.longitude) != null ? (haul.long ?? haul.lon ?? haul.longitude) : '';

      // include original raw items for debugging or other fields
      row._drop = drop;
      row._haul = haul;

      out.push(row);
    }

    return out;
  }

  // Aggregate species (`loai_khai_thac`) by mẻ (me). This is flexible and will try
  // to detect common field names for me, species name and quantity/weight.
  // Returns an object mapping meKey -> array of species strings (up to 5), where
  // each string is either 'NAME (qty)' if qty available or 'NAME'.
  function aggregateSpeciesByMe(loaiArray) {
    const result = Object.create(null);
    if (!Array.isArray(loaiArray) || loaiArray.length === 0) return result;

    const byMe = Object.create(null);

    // helper to resolve a species code/id to a human-readable name using the preloaded map
    const resolveSpeciesName = (codeOrName) => {
      try {
        if (typeof window !== 'undefined' && window.__SPECIES_MAP) {
          const key = codeOrName != null ? String(codeOrName) : '';
          if (key && window.__SPECIES_MAP[key]) return window.__SPECIES_MAP[key];
        }
      } catch (e) { /* ignore */ }
      // fallback: return original value (prefer a string)
      return codeOrName != null ? String(codeOrName) : '';
    };

    loaiArray.forEach(entry => {
      if (!entry || typeof entry !== 'object') return;

      // Case A: entry is a khaiThac object that contains loai_danh_bat (array of species)
      if (Array.isArray(entry.loai_danh_bat) && entry.loai_danh_bat.length > 0) {
        const meVal = entry.me_so ?? entry.me ?? entry.meSo ?? entry.me_so ?? entry.ID ?? null;
        const meKey = meVal != null ? String(meVal) : '__no_me__';
        if (!byMe[meKey]) byMe[meKey] = Object.create(null);
        entry.loai_danh_bat.forEach(sp => {
          if (!sp || typeof sp !== 'object') return;
          const code = sp.ma_loai ?? sp.loai ?? sp.ma ?? sp.id ?? null;
          const qty = (sp.so_luong !== undefined && !isNaN(Number(sp.so_luong))) ? Number(sp.so_luong) : ((sp.quantity !== undefined && !isNaN(Number(sp.quantity))) ? Number(sp.quantity) : 0);
          const nameKey = code != null ? String(code) : `__unk_${Object.keys(byMe[meKey]).length + 1}`;
          if (!byMe[meKey][nameKey]) byMe[meKey][nameKey] = { name: resolveSpeciesName(nameKey), code: nameKey, qty: 0 };
          byMe[meKey][nameKey].qty += qty;
          byMe[meKey][nameKey].present = true;
        });
        return;
      }

      // Case B: entry is already a flat species record (may contain me and ma_loai/loai)
      const meVal = firstAvailable(entry, ['me', 'me_so', 'mer_so', 'methu', 'me_id', 'id_khai_thac']) ?? entry.me ?? entry.me_so ?? null;
      const meKey = meVal != null ? String(meVal) : '__no_me__';
      const code = firstAvailable(entry, ['ma_loai', 'loai', 'species', 'ten_loai']) || entry.ma_loai || entry.loai || entry.species || null;
      const qtyRaw = firstAvailable(entry, ['so_luong', 'quantity', 'khoi_luong', 'weight', 'khoi_luong_kg']);
      const qty = (qtyRaw !== undefined && qtyRaw !== null && !isNaN(Number(qtyRaw))) ? Number(qtyRaw) : 0;
      if (!byMe[meKey]) byMe[meKey] = Object.create(null);
      const nameKey = code != null ? String(code) : `__unk_${Object.keys(byMe[meKey]).length + 1}`;
      if (!byMe[meKey][nameKey]) byMe[meKey][nameKey] = { name: resolveSpeciesName(nameKey), code: nameKey, qty: 0 };
      byMe[meKey][nameKey].qty += qty;
      byMe[meKey][nameKey].present = true;
    });

    // Convert map to sorted arrays per me and compute totals + loai_khac
    Object.keys(byMe).forEach(meKey => {
      const speciesMap = byMe[meKey];
      const arr = Object.keys(speciesMap).map(k => speciesMap[k]);
      const hasQty = arr.some(a => a.qty && a.qty > 0);
      if (hasQty) arr.sort((a,b) => (b.qty || 0) - (a.qty || 0));

      // compute total quantity
      const total = arr.reduce((s, a) => s + (a.qty || 0), 0);

      // formatted species strings for top-5
      const formatted = arr.slice(0,5).map(a => (a.qty && a.qty > 0) ? `${a.name} (${a.qty})` : `${a.name}`);

      // loai_khac = sum of quantities outside top-5 (if any)
      const rest = arr.slice(5);
      const loaiKhacSum = rest.reduce((s, a) => s + (a.qty || 0), 0);

      result[meKey] = {
        species: formatted,
        loai_khac: loaiKhacSum,
        tong: total,
      };
    });

    return result;
  }

  function populateTableWithJsonRows(tableObj, dataArray, schema) {
    if (!tableObj || !tableObj.tbody) return;
    tableObj.tbody.innerHTML = '';

    if (!Array.isArray(dataArray) || dataArray.length === 0) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      const colCount = (schema && schema.length) || (tableObj.thead ? tableObj.thead.querySelectorAll('td,th').length : 1);
      td.colSpan = Math.max(1, colCount);
      td.textContent = 'Không có dữ liệu';
      tr.appendChild(td);
      tableObj.tbody.appendChild(tr);
      return;
    }

    dataArray.forEach((item, idx) => {
      const tr = document.createElement('tr');

      if (Array.isArray(schema) && schema.length) {
        schema.forEach((colDef) => {
          const td = document.createElement('td');
          td.className = 'align-middle';
          if (colDef && colDef.type === 'index') {
            td.textContent = idx + 1;
          } else {
            // allow a custom getter per-column when table structures differ
            let raw = '';
            if (colDef && typeof colDef.get === 'function') {
              try { raw = colDef.get(item, idx); } catch (e) { raw = ''; }
            } else {
              raw = firstAvailable(item, colDef.keys || []);
            }
            // If longitude/latitude candidate columns are empty, try to extract from coordinates in the object
            const keyHints = (colDef.keys || []).join('|').toLowerCase();
            if ((raw === '' || raw === undefined) && /lon|long|kinh/.test(keyHints)) {
              const coords = extractLonLat(item);
              if (coords && coords.lon !== undefined) raw = coords.lon;
            }
            if ((raw === '' || raw === undefined) && /lat|vi_do|vido/.test(keyHints)) {
              const coords = extractLonLat(item);
              if (coords && coords.lat !== undefined) raw = coords.lat;
            }

            // If this column is a boolean and a specific match value is provided, compute boolean by matching
            if (colDef && colDef.format === 'boolean' && colDef.match !== undefined) {
              const expected = colDef.match;
              const matches = (function (val, exp) {
                if (val === undefined || val === null) return false;
                // allow exp to be array or single
                const exps = Array.isArray(exp) ? exp : [exp];
                for (let e of exps) {
                  if (typeof val === 'string') {
                    if (val.trim().toLowerCase() === String(e).trim().toLowerCase()) return true;
                    if (val.trim().toLowerCase().includes(String(e).trim().toLowerCase())) return true;
                  } else if (typeof val === 'number') {
                    if (String(val) === String(e)) return true;
                  } else if (typeof val === 'boolean') {
                    if ((val && (String(e).toLowerCase() === 'true' || String(e) === '1')) || (!val && (String(e).toLowerCase() === 'false' || String(e) === '0'))) return true;
                  }
                }
                return false;
              })(raw, colDef.match);
              td.textContent = matches ? '✓' : '';
            } else {
              td.textContent = formatValue(raw, colDef.format || 'text');
            }
          }
          tr.appendChild(td);
        });
      } else {
        // Fallback: pretty JSON in single cell
        const td = document.createElement('td');
        td.colSpan = 999;
        const pre = document.createElement('pre');
        pre.style.whiteSpace = 'pre-wrap';
        pre.style.margin = '0';
        pre.textContent = JSON.stringify(item, null, 2);
        td.appendChild(pre);
        tr.appendChild(td);
      }

      tableObj.tbody.appendChild(tr);
    });
  }

  // Define lightweight schemas (try a set of candidate keys for common field names).
  const thuThaSchema = [
    { type: 'index' },
    // Mẻ thứ (may be a code or nested object)
    { keys: ['me_thu', 'me', 'mer_so', 'methu', 'meThu', 'me.id', 'me.so'] },
    // Thời điểm bắt đầu (date) - prefer nested 'me' fields (mẻ lưới)
    { keys: [
        'me.thoi_diem_bat_dau','me.start_time','me.start.date','me.start','me.tha.thoi_diem_bat_dau',
        'thoi_diem_bat_dau','start_time','time_start','thoi_gian_bat_dau'
      ], format: 'date' },
    // Giờ/Phút (may be stored separately or as part of the datetime)
    { keys: [
        'me.thoi_diem_bat_dau_gio','me.start_time_hour','me.start.time','me.tha.gio','thoi_diem_bat_dau_hour',
        'start_time_hour','thoi_gian_bat_dau_hour','me.start_hour'
      ], format: 'text' },
    // Vị trí thả - vĩ độ (try nested me.* first)
    { keys: [
        'me.vi_do_tha','me.lat','me.location.lat','me.position.lat','me.coords[1]',
        'vi_do_tha','lat_tha','latitude_start','start_lat','lat'
      ], format: 'text' },
    // Vị trí thả - kinh độ
    { keys: [
        'me.kinh_do_tha','me.lon','me.location.lon','me.position.lon','me.coords[0]',
        'kinh_do_tha','lon_tha','longitude_start','start_lon','lon'
      ], format: 'text' },
    // Thời điểm kết thúc (date)
    { keys: [
        'me.thoi_diem_ket_thuc','me.end_time','me.end.date','me.ket_thuc.thoi_diem',
        'thoi_diem_ket_thuc','end_time','time_end','thoi_gian_ket_thuc'
      ], format: 'date' },
    // Giờ/Phút kết thúc
    { keys: [
        'me.thoi_diem_ket_thuc_gio','me.end_time_hour','me.end.time','thoi_diem_ket_thuc_hour',
        'end_time_hour','thoi_gian_ket_thuc_hour','me.end_hour'
      ], format: 'text' },
    // Vị trí thu - vĩ độ
    { keys: [
        'me.vi_do_thu','me.lat_end','me.location.lat_end','me.position.lat_end','me.end_coords[1]',
        'vi_do_thu','lat_thu','latitude_end','end_lat'
      ], format: 'text' },
    // Vị trí thu - kinh độ
    { keys: [
        'me.kinh_do_thu','me.lon_end','me.location.lon_end','me.position.lon_end','me.end_coords[0]',
        'kinh_do_thu','lon_thu','longitude_end','end_lon'
      ], format: 'text' },
  // Loài 1..5 (text labels like "21 (235)") và loài khác (tổng số lượng)
  { keys: ['loai1', 'species1', 'loai_1','me.loai1','me.species1'], format: 'text' },
  { keys: ['loai2', 'species2', 'loai_2','me.loai2','me.species2'], format: 'text' },
  { keys: ['loai3', 'species3', 'loai_3','me.loai3','me.species3'], format: 'text' },
  { keys: ['loai4', 'species4', 'loai_4','me.loai4','me.species4'], format: 'text' },
  { keys: ['loai5', 'species5', 'loai_5','me.loai5','me.species5'], format: 'text' },
  { keys: ['loai_khac', 'other_species', 'loai_khac','me.loai_khac'], format: 'number' },
  { keys: ['tong_san_luong', 'total', 'total_yield', 'tong_sp','me.tong_san_luong'], format: 'number' },
  ];

  const loaiQuySchema = [
    { type: 'index' },
    // Mẻ số
    { keys: ['me_so', 'me', 'mer_so', 'methu'], format: 'text' },
    // Tên loài
    { keys: ['ten_loai', 'loai', 'species', 'ten'], format: 'text' },
    // Thời điểm bắt gặp (date) — placed as 4th column to match table header
    { keys: ['thoi_diem_bat_gap','time_found','thoi_gian_bat_gap','time_create'], format: 'date' },
    // Khối lượng (kg)
    { keys: ['khoi_luong', 'weight', 'khoi_luong_kg'], format: 'number' },
    // Số lượng (số con)
    { keys: ['so_luong', 'quantity', 'so_luong_uoc_tinh'], format: 'number' },
    // Kích thước
    { keys: ['kich_thuoc', 'size', 'kich_thuoc_uoc_tinh'], format: 'number' },
    // Bắt gặp: Thả lưới/câu
    { keys: ['cong_Cu', 'cong_cu', 'congCu', 'cong_cu_su_dung'], format: 'boolean', match: 'thả lưới' },
    // Bắt gặp: Kéo lưới
    { keys: ['cong_Cu', 'cong_cu', 'congCu', 'cong_cu_su_dung'], format: 'boolean', match: 'kéo lưới' },
    // Bắt gặp: Khác
    { keys: ['cong_Cu', 'cong_cu', 'congCu', 'cong_cu_su_dung'], format: 'boolean', match: ['khác','khac'] },
    // Tình trạng: Sống
    { keys: ['tinh_trang', 'tinh_trang_song', 'status', 'song'], format: 'boolean', match: 'sống' },
    // Tình trạng: Chết
    { keys: ['tinh_trang', 'tinh_trang_song', 'status', 'song'], format: 'boolean', match: 'chết' },
    // Tình trạng: Bị thương
    { keys: ['tinh_trang', 'tinh_trang_song', 'status', 'song'], format: 'boolean', match: ['bị thương','bi thuong','bị_thương'] },
    // Thông tin thêm / ghi chú
    { keys: ['thong_tin_them', 'thong_tin', 'info', 'ghi_chu'], format: 'text' },
  ];

  // Gọi API chung `/api/thong-tin-chuyen-bien` để lấy tất cả dữ liệu chi tiết
  const urlInfo = `${API_BASE_URL}/api/thong-tin-chuyen-bien?id=${idChuyenBien}`;

  fetch(urlInfo)
    .then(res => {
      if (!res.ok) throw new Error('Network response not ok');
      return res.json();
    })
    .then(json => {

      // API trả về { success: true, data: chuyenBien }
      const chuyenBien = json && json.data ? json.data : {};
  const thuThaData = Array.isArray(chuyenBien.thuThaLuoi) ? chuyenBien.thuThaLuoi : [];
      // normalize to one-row-per-mẻ (mẻ lưới inside entry)
      const normalizedThuTha = normalizeThuThaEntries(thuThaData);
      // try to extract species (loài) info from khaiThac.loai_danh_bat / loai_khai_thac
      let loaiKhaiThac = [];
      try {
        if (chuyenBien && chuyenBien.khaiThac) {
          // khaiThac may be an array of khaiThac objects or a single object
          if (Array.isArray(chuyenBien.khaiThac)) {
            loaiKhaiThac = chuyenBien.khaiThac; // array of khaiThac objects
          } else if (typeof chuyenBien.khaiThac === 'object' && chuyenBien.khaiThac !== null) {
            // single khaiThac object — wrap it
            loaiKhaiThac = [chuyenBien.khaiThac];
          }
          // If khaiThac contains a nested loai_khai_thac or loai_danh_bat array directly, we will handle it inside aggregateSpeciesByMe
        } else if (Array.isArray(chuyenBien.loai_khai_thac)) {
          // older shape: top-level array
          loaiKhaiThac = chuyenBien.loai_khai_thac;
        }
      } catch (e) { loaiKhaiThac = []; }

      const speciesByMe = aggregateSpeciesByMe(loaiKhaiThac);
      // attach loai1..loai5 to normalized rows
      normalizedThuTha.forEach(r => {
        const key = r.me != null ? String(r.me) : '__no_me__';
        const info = speciesByMe[key] || { species: [], loai_khac: 0, tong: 0 };
        const arr = info.species || [];
        for (let i = 0; i < 5; i++) {
          r[`loai${i+1}`] = arr[i] || '';
        }
        r.loai_khac = info.loai_khac || 0;
        r.tong_san_luong = info.tong || 0;
      });
  const loaiQuyData = Array.isArray(chuyenBien.loaiQuy) ? chuyenBien.loaiQuy : [];
            console.log(chuyenBien.khaiThac);
            console.log(chuyenBien.loaiQuy)
            console.log(chuyenBien.thuThaLuoi)
            console.log(chuyenBien.truyenTai)



  // Helper: find time_create in thuThaLuoi entries where statuss==1 for a given me value
  function findThuThaTimeForMe(thuThaArr, meVal) {
    if (!Array.isArray(thuThaArr) || thuThaArr.length === 0) return '';
    for (const e of thuThaArr) {
      if (!e || typeof e !== 'object') continue;
      // match statuss === 1 (thu)
      if (Number(e.statuss) !== 1) continue;
      // possible mẻ fields on thu/tha entries
      const candidateMe = firstAvailable(e, ['me', 'me_so', 'meSo', 'methu', 'me_thu', 'mer_so']);
      if (candidateMe !== '' && String(candidateMe) === String(meVal)) {
        return e.time_create || e.time || e.timestamp || '';
      }
    }
    return '';
  }

  // Ensure loaiQuy time column uses thu-tha time_create (status==1) when possible.
  const loaiQuyDataWithTime = (loaiQuyData || []).map(lq => {
    try {
      const out = Object.assign({}, lq);
      const meVal = firstAvailable(out, ['me_so', 'me', 'mer_so', 'methu', 'me']);
      const existingTime = firstAvailable(out, ['thoi_diem_bat_gap','time_found','time_create','thoi_gian_bat_gap']);
      if ((!existingTime || existingTime === '') && meVal !== '') {
        const found = findThuThaTimeForMe(thuThaData, meVal);
        if (found) out.thoi_diem_bat_gap = found;
      }
      return out;
    } catch (e) { return lq; }
  });

  populateTableWithJsonRows(tableThuTha, normalizedThuTha, thuThaSchema);
  populateTableWithJsonRows(tableloaiQuy, loaiQuyDataWithTime, loaiQuySchema);

  // Render "Bản truyền tải" table from chuyenBien.truyenTai (if present)
  function renderTruyenTaiTable(arr) {
    const data = Array.isArray(arr) ? arr : [];

    const hdr = `
  <table class="table table-bordered table-sm">
        <thead>
          <tr class="table-header">
            <td rowspan="2" class="align-middle text-center" style="width:3%">TT</td>
            <td rowspan="2" class="align-middle" style="width:10%">Ngày, tháng</td>
            <td colspan="2" class="align-middle" style="width:25%">Thông tin tàu thu mua/chuyển tải</td>
            <td colspan="2" class="align-middle" style="width:15%">Vị trí thu mua, chuyển tải</td>
            <td colspan="2" class="align-middle" style="width:25%">Đã bán/chuyển tải</td>
            <td rowspan="2" class="align-middle" style="width:22%">Thuyền trưởng tàu thu mua/chuyển tải (ký, ghi rõ họ, tên)</td>
          </tr>
          <tr class="table-header">
            <td class="align-middle">Số đăng ký tàu</td>
            <td class="align-middle">Số Giấy phép khai thác</td>
            <td class="align-middle">Vĩ độ</td>
            <td class="align-middle">Kinh độ</td>
            <td class="align-middle">Tên loài thủy sản</td>
            <td class="align-middle">Khối lượng (kg)</td>
          </tr>
        </thead>
        <tbody>
        </tbody>
      </table>
    `;

    const wrapper = document.createElement('div');
    wrapper.className = 'mt-3 overflow-auto';
    wrapper.innerHTML = hdr;
    const tbody = wrapper.querySelector('tbody');

    // helper keys mapping
    const pick = (item, keys) => {
      return firstAvailable(item, keys) || '';
    };

    const dateKeys = ['ngay_thang','ngay','date','thoi_gian','time','time_create','created_at'];
    const regKeys = ['so_dang_ki','so_dang_ky_tau','so_dang_ky','so_dk','registration','ship_reg','so_dang_ky'];
    const licenseKeys = ['so_giay_phep','giay_phep','license','so_giay_phep_khai_thac'];
    const latKeys = ['lat','vi_do','latitude','vido','vi_do_thu'];
    const lonKeys = ['long','lon','kinh_do','longitude','kinhdo','kinh_do_thu'];
    const speciesKeys = ['ten_loai','loai','species','ten','ten_thuy_san'];
    const weightKeys = ['so_luong','khoi_luong','khoi_luong_kg','khoi_luong_tinh','weight'];
    const captainKeys = ['thuyen_truong','ten_thuyen_truong','captain','chu_tau','thuyen_truong_ten'];
    // flatten rows: each loai_danh_bat element becomes a row; if none, create a single empty-species row
    const rows = [];
    for (const entry of data) {
      const base = {
        __src: entry,
        date: pick(entry, dateKeys),
        reg: pick(entry, regKeys),
        license: pick(entry, licenseKeys),
        lat: pick(entry, latKeys),
        lon: pick(entry, lonKeys),
        captain: pick(entry, captainKeys),
      };
      if (Array.isArray(entry.loai_danh_bat) && entry.loai_danh_bat.length) {
        for (const sp of entry.loai_danh_bat) {
          const rawCode = (sp.ma_loai != null) ? String(sp.ma_loai) : (sp.ten_loai || pick(sp, speciesKeys) || '');
          const speciesName = (typeof window !== 'undefined' && window.__SPECIES_MAP && window.__SPECIES_MAP[rawCode]) ? window.__SPECIES_MAP[rawCode] : rawCode;
          rows.push(Object.assign({}, base, { species: speciesName, weight: (sp.so_luong!=null?sp.so_luong: (sp.khoi_luong||'')) }));
        }
      } else {
        // single aggregated row
        const raw = pick(entry, speciesKeys) || '';
        const speciesName = (typeof window !== 'undefined' && window.__SPECIES_MAP && window.__SPECIES_MAP[String(raw)]) ? window.__SPECIES_MAP[String(raw)] : raw;
        rows.push(Object.assign({}, base, { species: speciesName, weight: pick(entry, weightKeys) }));
      }
    }

    const minRows = Math.max(3, rows.length);
    for (let i = 0; i < minRows; i++) {
      const tr = document.createElement('tr');
      const d = rows[i] || {};
      const tdIndex = document.createElement('td'); tdIndex.className = 'align-middle text-center'; tdIndex.textContent = String(i+1);
      const tdDate = document.createElement('td'); tdDate.className = 'align-middle'; tdDate.textContent = formatValue(d.date || '', 'date');

      const tdReg = document.createElement('td'); tdReg.className = 'align-middle'; tdReg.textContent = d.reg || '';
      const tdLicense = document.createElement('td'); tdLicense.className = 'align-middle'; tdLicense.textContent = d.license || '';

      const tdLat = document.createElement('td'); tdLat.className = 'align-middle'; tdLat.textContent = (d.lat!==undefined?d.lat:'');
      const tdLon = document.createElement('td'); tdLon.className = 'align-middle'; tdLon.textContent = (d.lon!==undefined?d.lon:'');

      const tdSpecies = document.createElement('td'); tdSpecies.className = 'align-middle'; tdSpecies.textContent = d.species || '';
      const tdWeight = document.createElement('td'); tdWeight.className = 'align-middle text-end'; tdWeight.textContent = formatValue(d.weight || '', 'number');

      const tdCaptain = document.createElement('td'); tdCaptain.className = 'align-middle'; tdCaptain.textContent = d.captain || '';

      tr.appendChild(tdIndex);
      tr.appendChild(tdDate);
      tr.appendChild(tdReg);
      tr.appendChild(tdLicense);
      tr.appendChild(tdLat);
      tr.appendChild(tdLon);
      tr.appendChild(tdSpecies);
      tr.appendChild(tdWeight);
      tr.appendChild(tdCaptain);

      tbody.appendChild(tr);
    }

    return wrapper;
  }

  // insert truyen tai table immediately after the loaiQuy table
    try {
      const truyenData = chuyenBien.truyenTai || chuyenBien.truyen_tai || [];
      console.log('chuyenBien.truyenTai (raw):', truyenData);
      const wrapperEl = renderTruyenTaiTable(truyenData);
      console.log('rendered truyenTai wrapper:', !!wrapperEl);
      if (wrapperEl) {
        if (containerTruyenTai) {
          containerTruyenTai.appendChild(wrapperEl);
        } else {
          // fallback: append after loaiQuy table
          const ref = tableloaiQuy && tableloaiQuy.table ? tableloaiQuy.table : null;
          if (ref && ref.parentNode) {
            ref.parentNode.insertBefore(wrapperEl, ref.nextSibling);
          }
        }
      }
    } catch (e) { /* ignore rendering errors */ }
    })
    .catch(err => {
      console.error('Error loading /api/thong-tin-chuyen-bien', err);
      populateTableWithJsonRows(tableThuTha, [], thuThaSchema);
      populateTableWithJsonRows(tableloaiQuy, [], loaiQuySchema);
    })
    .finally(() => {
      // hide the global loading overlay
      loadingMain.hide();
    });

}


const duongDiChuyenBien = (idChuyenBien) => {
  const routes = [];
  Locations(idChuyenBien, (data) => {
    loadingMain.show();
    // Xóa dữ liệu hải trình cũ (đường + điểm)
    vectorSourceHaiTrinh.clear();
    console.log(data);

    // Chuẩn hoá trường tọa độ và lưu cả dữ liệu gốc để gắn vào feature
    data.forEach(item => {
      // Hỗ trợ nhiều tên trường khác nhau từ API
      const lon = item.longetude ?? item.longetude ?? item.lon ?? item.long;
      const lat = item.latetude ?? item.latitude ?? item.lat ?? item.latetude;
      if (typeof lon === 'number' && typeof lat === 'number') {
        routes.push({ coord: [lon, lat], raw: item });
      }
    });

    if (routes.length === 0) {
      loadingMain.hide();
      alert('Tàu đã cập cảng, không có dữ liệu hải trình để hiển thị.');
      return;
    }

    // 3. Tạo Style và Feature cho đường đi
    const lineStyle1 = new Style({
      stroke: new Stroke({
        color: 'blue', // Đổi sang màu xanh dương cho dễ nhìn trên nền bản đồ
        width: 3,
        lineDash: [10, 10],
      }),
    });

    // Tạo LineString từ mảng coord
    const routeLine = new LineString(routes.map(r => r.coord));
    const routeFeature1 = new Feature({
      geometry: routeLine,
    });
    routeFeature1.setStyle(lineStyle1);

    // 4. Thêm Feature đường vào Source
    vectorSourceHaiTrinh.addFeature(routeFeature1);

    // 5. Tạo và thêm các điểm chấm tròn kèm dữ liệu
    const markerStyle = new Style({
      image: new Circle({
        radius: 6,
        fill: new Fill({ color: 'white' }),
        stroke: new Stroke({ color: 'black', width: 2 }),
      }),
    });

    routes.forEach((r, index) => {
      const coord = r.coord;
      const raw = r.raw;
      const pointFeature = new Feature({
        geometry: new Point(coord),
      });
      // Gắn dữ liệu gốc để popup có thể hiển thị
      pointFeature.set('data', raw);
      pointFeature.set('seq', index + 1);

      // Nếu đây là điểm cuối cùng của hành trình, gắn các thuộc tính giống feature tàu
      if (index === routes.length - 1) {
        // Thử lấy các trường id_ship / id từ raw (nhiều tên khác nhau có thể xuất hiện)
        const idShip = raw.id_ship ?? raw.ship_id ?? raw.idShip ?? raw.Id ?? raw.id ?? null;
        const idCb = raw.Id ?? raw.id ?? idChuyenBien ?? null;
        if (idShip != null) pointFeature.set('id_ship', idShip);
        if (idCb != null) pointFeature.set('id', idCb);

        // Tạo style riêng cho điểm cuối để dễ nhận biết
        const lastPointStyle = new Style({
          image: new Icon({
            src: 'https://cdn-icons-png.flaticon.com/512/3688/3688373.png',
            scale: 0.06,
            anchor: [0.5, 0.5],
          }),
        });
        pointFeature.setStyle(lastPointStyle);
      } else {
        pointFeature.setStyle(markerStyle);
      }

      vectorSourceHaiTrinh.addFeature(pointFeature);
    });

    // Tùy chọn: Zoom đến khu vực của hải trình
    map.getView().fit(routeLine.getExtent(), {
      padding: [100, 100, 100, 100],
      duration: 1000,
    });
    loadingMain.hide();
  },
    () => {
      // callback lỗi (nếu có)
      loadingMain.hide();
    })
}
const container = document.getElementById('table-container');

modalControllEL.addEventListener("show.bs.modal", function () {
  loadingMain.show();
  // Fetch ALL ships and cache them, but render only active ships (status 1) in the UI
  DanhSachTau(undefined, (all) => {
    loadingMain.hide();
    const active = Array.isArray(all) ? all.filter(s => Number(s.statuss) === 1) : [];
    renderShipArray(active);
    tableShip.create();
    if (!content.contains(tableShip.table)) content.appendChild(tableShip.table);
  }, () => {
    loadingMain.hide();
  });

})

let map; // Khai báo biến map ở đây, không cần mhởi tạo
// === TẠO STYLE VỚI HÀM RENDER TÙY CHỈNH ===
const simpleCircleStyle = new Style({
  image: new Circle({
    // 1. Fill (Màu bên trong hình tròn)
    fill: new Fill({
      color: 'rgba(255, 0, 0, 0.6)', // Màu đỏ với độ trong suốt 60%
    }),

    // 2. Stroke (Đường viền hình tròn)
    stroke: new Stroke({
      color: '#333333', // Màu xám đậm/đen
      width: 1,         // Độ dày đường viền 1 pixel
    }),

    // 3. Radius (Bán kính)
    radius: 6, // Bán kính 6 pixel
  }),
});
// Biến toàn cục để theo dõi thời gian và trạng thái nhấp nháy
var radius = 5;
var maxRadius = 15;
var growthRate = 0.5;
// pulseValue controls SOS blinking (0..1). animatePulse updates this value each frame.
// pulseValue removed: blinking disabled per user request
const iconStyle = new Style({
  image: new Icon({
    // Đặt kích thước để OpenLayers biết khu vực vẽ
    imgSize: [30, 30],
    size: [30, 30],
    anchor: [15, 15],  // Neo vào trung tâm
    src: '/public/point.svg',
    // HÀM VẼ TÙY CHỈNH
    render: function (event) {
      const ctx = event.context;
      const radius = 5;
      const canvasSize = 30;

      ctx.save();

      // VẼ MỘT VÒNG TRÒN TĨNH
      ctx.fillStyle = 'rgba(255, 204, 0, 0.5)'; // Màu cố định
      ctx.beginPath();
      ctx.arc(canvasSize / 2, canvasSize / 2, 15, 0, 2 * Math.PI, true); // Bán kính cố định 15
      ctx.fill();

      // VẼ ĐIỂM TRUNG TÂM TĨNH
      ctx.fillStyle = '#ffcc00';
      ctx.beginPath();
      ctx.arc(canvasSize / 2, canvasSize / 2, radius, 0, 2 * Math.PI, true);
      ctx.fill();

      ctx.restore();
    }
  }),
});


function animatePulse() {
  // Blinking disabled: animatePulse removed per user request
  return;
}


useGeographic();


// Kết nối đến server WebSocket
//const ws = new WebSocket('ws://161.248.147.115:8080');
const ws = new WebSocket(WS);

// Tham chiếu modal

const modalTitle = modalInforEL.querySelector('#modal-info-title');
const modalBody = modalInforEL.querySelector('#modal-info-body');

const baseUrl = 'https://atlas.microsoft.com/map/tile?zoom={z}&x={x}&y={y}&tileSize=256&language=EN&&api-version=2.0';

let subscriptionKey, currentLayer;
const someTilesetId = [
  'microsoft.imagery',
  'microsoft.base.road',
  'microsoft.base.darkgrey',
];

const routeCoords = [
  [103.8033, 10.54],
  [103.79, 10.5],
  [103.82, 10.4267],
  [103.8, 10.4017],
  [102.95, 9.9083],
  [102.92, 9.9033],
  [102.8917, 9.9167],
  [103.1711, 9.5834],
  [102.2017, 8.7817],
  [103.0417, 7.8167],
  [103.7083, 7.3667],
  [103.65, 7.3333],
  [103.5952, 7.3052],
  [103.8667, 7.05],
  [105.82, 6.0967],
  [106.2, 6.25],
  [106.3167, 6.25],
  [106.6617, 6.35],
  [109.2867, 6.8367],
  [109.5683, 6.415],
  [109.8414, 6.0527],
  [111.331917, 6.031434],
  [112.605945, 6.353418],
  [113.6883, 6.7392],
  [115, 7.6619],
  [116.9167, 9.0214],
  [117.9783, 10.345],
  [117.8283, 11.1183],
  [117.469893, 12.219954],
  [117.266333, 12.769167],
  [117.072782, 13.283779],
  [116.8235, 13.8471],
  [116.8083, 13.8618],
  [116.5207, 16.2592],
  [116.99, 17.8225],
  [117.4442, 18.6421],
  [117.6259, 19.743],
  [116.1876, 18.9288],
  [114.6131, 18.5129],
  [113.5533, 17.4329],
  [112.9815, 17.0822],
  [112.9843, 17.1517],
  [112.9486, 17.2212],
  [112.7453, 17.3524],
  [112.4322, 17.5017],
  [112.1438, 17.5515],
  [111.6192, 17.6274],
  [111.5286, 17.6274],
  [111.4434, 17.6065],
  [111.3583, 17.5515],
  [111.2896, 17.4598],
  [110.9795, 16.4481],
  [109.4958, 16.7817],
  [108.5572, 17.3317],
  [107.9667, 17.7833],
  [107.6517, 18.07],
  [107.6267, 18.1183],
  [107.5667, 18.23],
  [107.16, 18.715],
  [107.16, 19.215],
  [107.19, 19.2683],
  [107.2117, 19.4233],
  [107.35, 19.4233],
  [107.5283, 19.6583],
  [107.93, 19.9583],
  [108.3792, 20.4017],
  [108.2083, 21.21],
  [108.135, 21.275],
  [108.095, 21.4517],
  [108.0933, 21.4567],
  [108.095, 21.4583],
  [108.0967, 21.46],
  [108.0983, 21.4633],
  [108.1, 21.4667],
  [108.1, 21.47],
];


// 3. Tạo một đối tượng LineString với các tọa độ gốc
const routeLine = new LineString(routeCoords);

// 4. Tạo một Feature từ đối tượng LineString
const routeFeature = new Feature({
  geometry: routeLine,
});

// 5. Tạo một Style cho đường
const lineStyle = new Style({
  stroke: new Stroke({
    color: 'red',
    width: 2,
    lineDash: [10, 10], // Đường nét đứt: 10px nét, 10px hở
  }),
});

routeFeature.setStyle(lineStyle);

// Tạo một Vector Source và thêm Feature vào đó
const vectorSource = new VectorSource({
  features: [routeFeature],
});

// Tạo một Vector Layer và liên kết với Vector Source
const vectorLayer = new VectorLayer({
  source: vectorSource,
});



// Layer Ship
const vectorSourceShip = new VectorSource({
  features: [], // Khởi tạo với mảng rỗng
});
// Tạo một lớp vector
const vectorLayerShip = new VectorLayer({
  source: vectorSourceShip,
});
// Ensure ship points render above other layers (z-index high)
vectorLayerShip.setZIndex(20000);

// Style cache for ship styling per status+zoom
const __shipStyleCache = Object.create(null);

// Layer style function: compute scale based on current zoom level so markers scale on zoom
const shipStyleFunction = function(feature, resolution) {
  // resolution available; prefer reading zoom from map view if possible
  let zoom = null;
  try {
    if (typeof map !== 'undefined' && map && map.getView) {
      zoom = Math.round(map.getView().getZoom());
    }
  } catch (e) { zoom = null; }
  // fallback if zoom is not available: approximate from resolution
  if (zoom === null || Number.isNaN(zoom)) {
    // safe fallback: derive an approximate zoom-like number
    const approx = resolution ? Math.max(1, Math.round(14 - Math.log2(resolution))) : 6;
    zoom = approx;
  }

  const status = Number(feature.get('statuss')) || 0;
  const sos = Number(feature.get('sos')) || 0;
  const key = status + '::' + sos + '::' + zoom;

  let fillColor;
  if (sos === 1) {
    fillColor = 'red';
  } else if (status === 1) {
    fillColor = 'green';
  } else if (status === 2) {
    fillColor = 'yellow';
  } else {
    fillColor = 'green';
  }

  // If this feature has SOS active, use higher zIndex
  const zIndex = sos === 1 ? 9999 : undefined;

  let radius = sos === 1 ? 12 : 8;

  if (__shipStyleCache[key]) return __shipStyleCache[key];

  const s = new Style({
    zIndex: zIndex,
    image: new Circle({
      radius: radius,
      fill: new Fill({ color: fillColor }),
      stroke: new Stroke({ color: 'white', width: 2 }),
    }),
  });
  __shipStyleCache[key] = s;
  return s;
};

// Attach style function to the ship layer so individual features don't need an explicit style
vectorLayerShip.setStyle(shipStyleFunction);

// Ship filter state: null = no filter (show all), 1 = show only status 1, 2 = show only status 2
let shipFilterState = null;

// Hidden style used to hide features when filter doesn't match
const hiddenShipStyle = new Style({
  image: new Circle({ radius: 0 })
});

const vectorSourceHaiTrinh = new VectorSource({
  features: [], // Khởi tạo với mảng rỗng
});
const vectorLayerHaiTrinh = new VectorLayer({
  source: vectorSourceHaiTrinh,
});

// Vietnam boundary layer (dashed white stroke)
const vectorSourceVn = new VectorSource({ features: [] });
const vnBorderStyle = new Style({
  stroke: new Stroke({ color: 'white', width: 3, lineDash: [8, 8] }),
  fill: new Fill({ color: 'rgba(255,255,255,0)' }),
});
const vectorLayerVn = new VectorLayer({
  source: vectorSourceVn,
  style: vnBorderStyle,
});
vectorLayerVn.setZIndex(999);

// Hàm vẽ các con tàu trên bản đồ
function drawShips(shipsData, statuss) {
  // Xóa tất cả các điểm cũ
  vectorSourceShip.clear();
  if (!Array.isArray(shipsData) || shipsData.length === 0) return;

  const features = [];
  shipsData.forEach(location => {
    // Hỗ trợ nhiều tên trường tọa độ khác nhau từ API
    const lonRaw = location.long ?? location.lon ?? location.longitude ?? location.longetude;
    const latRaw = location.lat ?? location.latitude ?? location.latetude ?? location.latetude;
    const lon = Number(lonRaw);
    const lat = Number(latRaw);
    if (!Number.isFinite(lon) || !Number.isFinite(lat)) return; // bỏ qua mục không hợp lệ

    const feature = new Feature({ geometry: new Point([lon, lat]) });

    feature.set('id_ship', location.id_ship ?? location.idShip ?? location.id ?? null);
    feature.set('id', location.Id ?? location.id ?? null);
    // Determine status: prefer per-location field, fallback to provided param
    const s = (location.statuss !== undefined && location.statuss !== null) ? Number(location.statuss) : (statuss !== undefined && statuss !== null ? Number(statuss) : null);
    feature.set('statuss', s);
  // SOS flag: treat any truthy/1 value as SOS (1), else 0
  const sosRaw = (location.sos !== undefined && location.sos !== null) ? location.sos : (location.SOS !== undefined ? location.SOS : 0);
  const sos = Number(sosRaw) === 1 ? 1 : 0;
  feature.set('sos', sos);

    features.push(feature);
  });

  if (features.length) vectorSourceShip.addFeatures(features);
}
//--- IGNORE ---


// Function to update ship statistics in the sub-navigation
function updateShipStatistics(shipsData) {
  if (!Array.isArray(shipsData) || shipsData.length === 0) {
    // If no data, set all counts to 0
    document.getElementById('active-ships-count').textContent = '0';
    document.getElementById('docked-ships-count').textContent = '0';
    document.getElementById('sos-ships-count').textContent = '0';
    return;
  }

  let activeCount = 0;
  let dockedCount = 0;
  let sosCount = 0;

  shipsData.forEach(ship => {
    // Check SOS status first (SOS ships should be counted in SOS category)
    const sosStatus = Number(ship.sos) || Number(ship.SOS) || 0;
    if (sosStatus === 1) {
      sosCount++;
    } else {
      // Check regular status: 1 = active, others = docked
      const status = Number(ship.statuss);
      if (status === 1) {
        activeCount++;
      } else {
        dockedCount++;
      }
    }
  });

  // Update the DOM elements
  document.getElementById('active-ships-count').textContent = activeCount;
  document.getElementById('docked-ships-count').textContent = dockedCount;
  document.getElementById('sos-ships-count').textContent = sosCount;
}


ws.onopen = () => {
  loadingMain.hide();
  console.log('Đã kết nối với server WebSocket.');
};

ws.onmessage = event => {
  // Nhận dữ liệu vị trí từ server
  // console.log(JSON.parse(event.data))
  const locationData = JSON.parse(event.data);

  // Cập nhật giao diện người dùng
  // updateUI(locationData);
  drawShips(locationData);
  // re-apply any active filter after updating features
  if (typeof applyShipFilter === 'function') applyShipFilter(shipFilterState);
  
  // Update ship statistics in sub-nav
  updateShipStatistics(locationData);

};








// Hiển thị map luôn khi load trang, không cần nhập key
window.addEventListener('DOMContentLoaded', () => {
  subscriptionKey = "A2lqjZiOtaL20Flu7gM4mzeftWWp84zFGAyQVixGQ247rdF3KKX9JQQJ99BIACYeBjFP0sF6AAAgAZMP39e8";

  map = new Map({
    target: 'map',
    view: new View({
      center: [112.7170491, 16.6691161],
      zoom: 6,
    }),
    layers: [vectorLayer],
  });
  const authInterface = document.getElementById('auth-interface');
  if (authInterface) authInterface.style.display = 'none';
  document.getElementById('map-container').style.display = 'block';
  
  // Show sub-navigation when map is displayed
  const subNav = document.getElementById('sub-nav');
  if (subNav) subNav.style.display = 'block';

  // Setup sub-navigation toggle functionality
  const subNavToggle = document.getElementById('sub-nav-toggle');
  const subNavContent = document.getElementById('sub-nav-content');
  
  if (subNavToggle && subNavContent) {
    // Load saved state from localStorage (default: expanded)
    const isCollapsed = localStorage.getItem('subNavCollapsed') === 'true';
    if (isCollapsed) {
      subNavContent.classList.add('collapsed');
      subNavToggle.classList.add('collapsed');
      // Set icon to down
      subNavToggle.querySelector('i').className = 'bi bi-chevron-down';
    } else {
      // Set icon to up
      subNavToggle.querySelector('i').className = 'bi bi-chevron-up';
    }
    
    subNavToggle.addEventListener('click', function() {
      const isCurrentlyCollapsed = subNavContent.classList.contains('collapsed');
      
      if (isCurrentlyCollapsed) {
        // Expand
        subNavContent.classList.remove('collapsed');
        subNavToggle.classList.remove('collapsed');
        // Change icon to up
        subNavToggle.querySelector('i').className = 'bi bi-chevron-up';
        localStorage.setItem('subNavCollapsed', 'false');
      } else {
        // Collapse
        subNavContent.classList.add('collapsed');
        subNavToggle.classList.add('collapsed');
        // Change icon to down
        subNavToggle.querySelector('i').className = 'bi bi-chevron-down';
        localStorage.setItem('subNavCollapsed', 'true');
      }
    });
  }

  // Add behavior to the tileset buttons
  document.querySelectorAll('.layer-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      updateLayer(Number(btn.value));
    });
  });

  updateLayer(0);
  // Ensure map size is recalculated after showing container and adding layers
  // Some browsers/layouts require a small delay to get correct container size
  setTimeout(() => {
    try { map.updateSize(); } catch (e) { /* ignore if map not ready */ }
  }, 100);

  // Update map size on window resize to avoid icon/canvas scaling issues
  window.addEventListener('resize', () => {
    try { map.updateSize(); } catch (e) { }
  });
  // SOS blinking disabled — no animation loop started

  // Load Vietnam geojson and render dashed white border
  (function loadVnGeo() {
    const url = 'data/vn_geo.json';
    fetch(url).then(r => {
      if (!r.ok) throw new Error('Failed to load ' + url);
      return r.json();
    }).then(geojson => {
      try {
        const fmt = new GeoJSON();
        const feats = fmt.readFeatures(geojson, { dataProjection: 'EPSG:4326', featureProjection: 'EPSG:4326' });
        if (feats && feats.length) {
          vectorSourceVn.addFeatures(feats);
        }
      } catch (e) {
        console.error('Error parsing vn_geo.json', e);
      }
    }).catch(err => {
      console.warn('Could not load vn_geo.json:', err);
    });
  })();

  // Load species lookup from data/species.json -> window.__SPECIES_MAP (id -> name)
  (function loadSpeciesLookup() {
    const url = 'data/species.json';
    fetch(url).then(r => {
      if (!r.ok) throw new Error('Failed to load ' + url);
      return r.json();
    }).then(list => {
      try {
        const map = Object.create(null);
        if (Array.isArray(list)) {
          list.forEach(item => {
            if (item && (item.id !== undefined) && item.name !== undefined) {
              map[String(item.id)] = String(item.name);
            }
          });
        }
        if (typeof window !== 'undefined') window.__SPECIES_MAP = map;
      } catch (e) {
        console.error('Error processing species.json', e);
      }
    }).catch(err => {
      console.warn('Could not load species.json:', err);
    });
  })();

  // Load initial ship positions from HTTP API (fallback if WebSocket is slow/fails)
  (function loadInitialShips() {
    fetch(`${API_BASE_URL}/api/ship`)
      .then(r => {
        if (!r.ok) throw new Error('Failed to load ships');
        return r.json();
      })
      .then(shipsData => {
        console.log('Initial ships loaded:', shipsData.length);
        // Draw all ships on initial load
        drawShips(shipsData);
        // Update statistics
        updateShipStatistics(shipsData);
        // Apply any active filter
        if (typeof applyShipFilter === 'function') applyShipFilter(shipFilterState);
      })
      .catch(err => {
        console.warn('Could not load initial ships (will wait for WebSocket):', err);
      });
  })();

  // add toggle button behavior: cycle through showing status 1, status 2, and all
  const toggleBtn = document.getElementById('toggle-ships-btn');
  if (toggleBtn) {
    const updateButtonAppearance = (state) => {
      // reset classes
      toggleBtn.classList.remove('btn-success','btn-danger','btn-primary','btn-outline-secondary');
      if (state === 1) {
        toggleBtn.classList.add('btn-success');
        toggleBtn.title = 'Hiện vị trí trạng thái 1 (xanh)';
      } else if (state === 2) {
        toggleBtn.classList.add('btn-danger');
        toggleBtn.title = 'Hiện vị trí trạng thái 2 (đỏ)';
      } else {
        toggleBtn.classList.add('btn-primary');
        toggleBtn.title = 'Hiện tất cả tàu';
      }
    };

    toggleBtn.addEventListener('click', (ev) => {
      // cycle: null -> 1 -> 2 -> null
      if (shipFilterState === null) shipFilterState = 1;
      else if (shipFilterState === 1) shipFilterState = 2;
      else shipFilterState = null;

      applyShipFilter(shipFilterState);
      updateButtonAppearance(shipFilterState);
    });
    // initialize appearance
    updateButtonAppearance(shipFilterState);
  }

  // Add event listener for clear route button
  const clearRouteBtn = document.getElementById('clear-route-btn');
  if (clearRouteBtn) {
    clearRouteBtn.addEventListener('click', () => {
      vectorSourceHaiTrinh.clear();
      console.log('Đã tắt đường đi.');
    });
  }

  // --- Popup overlay để hiển thị thông tin khi click vào điểm hải trình ---
  let popupElement = document.getElementById('ol-popup');
  if (!popupElement) {
    popupElement = document.createElement('div');
    popupElement.id = 'ol-popup';
    popupElement.className = 'ol-popup';
    popupElement.style.position = 'absolute';
    popupElement.style.background = 'white';
    popupElement.style.padding = '8px 10px';
    popupElement.style.borderRadius = '6px';
    popupElement.style.boxShadow = '0 1px 4px rgba(0,0,0,0.3)';
    popupElement.style.minWidth = '180px';
    popupElement.style.maxWidth = '320px';
    popupElement.innerHTML = '<a href="#" id="ol-popup-closer" style="position:absolute;top:4px;right:6px;color:#666;text-decoration:none;">✖</a><div class="ol-popup-content"></div>';
    document.body.appendChild(popupElement);
  }

  const popupCloser = popupElement.querySelector('#ol-popup-closer');
  const popupOverlay = new Overlay({
    element: popupElement,
    autoPan: true,
    autoPanAnimation: { duration: 250 },
  });
  map.addOverlay(popupOverlay);
  popupCloser.addEventListener('click', function (e) {
    e.preventDefault();
    popupOverlay.setPosition(undefined);
    popupCloser.blur();
  });

  // Đặt sự kiện click sau khi map đã khởi tạo
  map.on('click', function (event) {
    // Lấy đối tượng (feature) tại vị trí click
    // NOTE: ignore the VN border layer so it doesn't intercept clicks
    let clickedFeature = null;
    map.forEachFeatureAtPixel(event.pixel, function (feat, layer) {
      // skip VN polygon layer which can cover the map and block clicks
      if (layer === vectorLayerVn) return false;
      clickedFeature = feat;
      return true; // stop iteration when we found the top-most non-VN feature
    }, { hitTolerance: 6 });
    const feature = clickedFeature;
    console.log(feature);
    if (feature && feature.get('id_ship') != null) {
      // Nếu click vào một feature
      const shipId = feature.get('id_ship');
      const idChuyenBien = feature.get('id');
      // Hiển thị thông tin
      showShipInfo(shipId, idChuyenBien);
      // ẩn popup nếu đang mở
      try { popupOverlay.setPosition(undefined); } catch (e) { }
      // Tùy chọn: Đặt một style khác cho feature được click
      feature.setStyle(new Style({
        image: new Icon({
          src: 'https://cdn-icons-png.flaticon.com/512/3688/3688373.png',
          scale: 0.07, // Phóng to biểu tượng
          color: '#00ff375e' // Đổi màu
        })
      }));
    } else if (feature && feature.get('data')) {
      // Nếu click vào một điểm hải trình (point feature có gắn data)
      const data = feature.get('data');
      const seq = feature.get('seq') || '';
      const geom = feature.getGeometry();
      const coords = geom.getCoordinates();
      // Tạo HTML nội dung popup
      let contentHtml = `<div style="font-weight:600;margin-bottom:6px;">Điểm #${seq}</div>`;
      contentHtml += `<div><strong>Kinh độ:</strong> ${coords[0].toFixed(6)}</div>`;
      contentHtml += `<div><strong>Vĩ độ:</strong> ${coords[1].toFixed(6)}</div>`;
      // Thêm một số trường phổ biến nếu có
      if (data.time) contentHtml += `<div><strong>Thời gian:</strong> ${data.time}</div>`;
      if (data.timestamp) contentHtml += `<div><strong>Thời gian:</strong> ${data.timestamp}</div>`;
      if (data.speed !== undefined) contentHtml += `<div><strong>Tốc độ:</strong> ${data.speed}</div>`;
      if (data.course !== undefined) contentHtml += `<div><strong>Course:</strong> ${data.course}</div>`;
      // Nếu có các trường khác, liệt kê dạng key: value (giới hạn để tránh quá dài)
      const extraKeys = Object.keys(data).filter(k => !['longetude','latetude','longitude','latitude','lon','long','time','timestamp','speed','course'].includes(k));
      if (extraKeys.length) {
        contentHtml += '<hr style="margin:6px 0;">';
        extraKeys.slice(0,5).forEach(k => {
          contentHtml += `<div><strong>${k}:</strong> ${String(data[k])}</div>`;
        });
        if (extraKeys.length > 5) contentHtml += `<div style="color:#666;font-size:12px;">... và ${extraKeys.length-5} trường khác</div>`;
      }
      // Hiển thị popup
      try {
        const popupContent = document.querySelector('.ol-popup-content');
        if (popupContent) popupContent.innerHTML = contentHtml;
        popupOverlay.setPosition(coords);
      } catch (e) {
        console.warn('Popup show error', e);
      }
    } else {
      // Nếu click vào vùng bản đồ trống
      try { popupOverlay.setPosition(undefined); } catch (e) { }
      const modal = getModalInfor();
      if (modal) modal.hide();
    }
  });
});

function updateLayer(index) {
  currentLayer = new TileLayer({
    source: new ImageTile({
      url: `${baseUrl}&subscription-key=${subscriptionKey}&tilesetId=${someTilesetId[index]}`,
      crossOrigin: 'anonymous',
      attributions: `© ${new Date().getFullYear()} TomTom, Microsoft`,
    }),
  });
  map.getLayers().clear();
  map.addLayer(currentLayer);
  map.addLayer(vectorLayer);
  map.addLayer(vectorLayerShip);
  map.addLayer(vectorLayerHaiTrinh);
  // Add VN boundary layer on top
  map.addLayer(vectorLayerVn);

  console.log('Layers after updateLayer:', map.getLayers().getArray().map(l => l.constructor.name));
  console.log('vectorLayerShip features:', vectorSourceShip.getFeatures().length);

  // After switching layers, ensure OpenLayers recalculates size/render
  try { map.updateSize(); } catch (e) { }

  // Update state of the tileset buttons
  document.querySelectorAll('.layer-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.value == index);
  });
}
//set on click


//Hàm hiển thị thông tin tàu

function showShipInfo(idShip, idChuyenBien) {
  loadingMain.show();

  fetch(`${API_BASE_URL}/api/ship-info?id=${idShip}`)
    .then(response => response.json())
    .then(data => {
      console.log(data[0])
      if (data.length > 0) {
        const ship = data[0];
        document.getElementById('modal-info-idcb').value = idChuyenBien != null ? idChuyenBien : 0;
        document.getElementById('modal-info-id').textContent = ship.id != null ? ship.id : "Chưa rõ";
        document.getElementById('modal-info-name').textContent = ship.ship_name != null ? ship.ship_name : "Chưa rõ";
        document.getElementById('modal-info-ten-chu-tau').textContent = ship.ten_chu_tau != null ? ship.ten_chu_tau : "Chưa rõ";
        document.getElementById('modal-info-ten-thuyen-truong').textContent = ship.ten_thuyen_truong != null ? ship.ten_thuyen_truong : "Chưa rõ";
        document.getElementById('modal-info-so-dang-ky-tau').textContent = ship.so_dang_ky_tau != null ? ship.so_dang_ky_tau : "Chưa rõ";
        document.getElementById('modal-info-chieu-dai-tau').textContent = ship.chieu_dai_tau != null ? ship.chieu_dai_tau : "Chưa rõ";
        document.getElementById('modal-info-tong-cong-suat').textContent = ship.tong_cong_suat != null ? ship.tong_cong_suat : "Chưa rõ";
        document.getElementById('modal-info-so-giay-phep').textContent = ship.so_giay_phep != null ? ship.so_giay_phep : "Chưa rõ";
        document.getElementById('modal-info-thoi-han').textContent = ship.thoi_han != null ? ship.thoi_han : "Chưa rõ";
        document.getElementById('modal-info-nghe-phu1').textContent = ship.nghe_phu_1 != null ? ship.nghe_phu_1 : "Chưa rõ";
        document.getElementById('modal-info-nghe-phu2').textContent = ship.nghe_phu_2 != null ? ship.nghe_phu_2 : "Chưa rõ";
        document.getElementById('modal-info-chieu-dai-vang-cau').textContent = ship.chieu_dai_vang_cau != null ? ship.chieu_dai_vang_cau : "Chưa rõ";
        document.getElementById('modal-info-so-luoi-cau').textContent = ship.so_luoi_cau != null ? ship.so_luoi_cau : "Chưa rõ";
        document.getElementById('modal-info-chieu-dai-luoi-vay').textContent = ship.chieu_dai_luoi_vay != null ? ship.chieu_dai_luoi_vay : "Chưa rõ";
        document.getElementById('modal-info-chieu-cao-luoi-vay').textContent = ship.chieu_cao_luoi_vay != null ? ship.chieu_cao_luoi_vay : "Chưa rõ";
        document.getElementById('modal-info-chu-vi-luoi-chup').textContent = ship.chu_vi_luoi_chup != null ? ship.chu_vi_luoi_chup : "Chưa rõ";
        document.getElementById('modal-info-chieu-cao-luoi-chup').textContent = ship.chieu_cao_luoi_chup != null ? ship.chieu_cao_luoi_chup : "Chưa rõ";
        document.getElementById('modal-info-chieu-dai-gieng-phao').textContent = ship.chieu_dai_gieng_phao != null ? ship.chieu_dai_gieng_phao : "Chưa rõ";
        document.getElementById('modal-info-chieu-dai-luoi-keo').textContent = ship.chieu_dai_luoi_keo != null ? ship.chieu_dai_luoi_keo : "Chưa rõ";
      }
      const modal = getModalInfor();
      if (modal) modal.show();
      loadingMain.hide();
    });
}



document.addEventListener('DOMContentLoaded', function () {
  // container.appendChild(createTableShip(data, headers));


  // container.appendChild(createTableChuyenBien(datachuyenBien, headersChuyenBien,(item)=>{
  //   //showLoading()
  // //   const xmlDoc = xhttp.responseXML;
  // //     const xhr = new XMLHttpRequest();
  // //  xhr.onload=function(){
  // //   console.log(xmlDoc);
  // //  }

  // //  xhr.open("GET",`http://161.248.147.115:3000/api/locations?id=${item.id}`,flase)
  // modalDetail.show();
  // }));


  loadingMain.show()
  // Wire search form to use TimTauTheoId (search by ship id, include inactive ships)
  const searchForm = document.getElementById('search-ship-form');
  const shipInput = document.getElementById('ship-id-input');
  const searchMessage = document.getElementById('search-message');
  if (searchForm && shipInput) {
    searchForm.addEventListener('submit', function (ev) {
      ev.preventDefault();
      const q = shipInput.value && shipInput.value.trim();
      searchMessage.style.display = 'none';
      loadingMain.show();
      if (!q) {
        // empty -> show active ships. Prefer cached full-list if available to avoid extra network call.
        const cached = (typeof window !== 'undefined' && Array.isArray(window.__ALL_SHIPS_CACHE)) ? window.__ALL_SHIPS_CACHE : null;
        if (cached) {
          const active = cached.filter(s => Number(s.statuss) === 1);
          renderShipArray(active);
          if (!content.contains(tableShip.table)) content.appendChild(tableShip.table);
          loadingMain.hide();
        } else {
          // fetch all (cache) then render active
          DanhSachTau(undefined, (data) => {
            const active = Array.isArray(data) ? data.filter(s => Number(s.statuss) === 1) : [];
            renderShipArray(active);
            if (!content.contains(tableShip.table)) content.appendChild(tableShip.table);
            loadingMain.hide();
          }, (err) => {
            console.error('DanhSachTau error', err);
            searchMessage.textContent = 'Lỗi khi tải danh sách tàu.';
            searchMessage.style.display = 'block';
            loadingMain.hide();
          });
        }
        return;
      }

      // Use TimTauTheoId which returns matches including inactive ships
      TimTauTheoId(q, (results) => {
        loadingMain.hide();
        if (!results || results.length === 0) {
          searchMessage.textContent = 'Không tìm thấy tàu phù hợp.';
          searchMessage.style.display = 'block';
          // clear table
          renderShipArray([]);
          return;
        }
        searchMessage.style.display = 'none';
        renderShipArray(results);
        if (!content.contains(tableShip.table)) content.appendChild(tableShip.table);
      }, (err) => {
        loadingMain.hide();
        console.error('TimTauTheoId error', err);
        searchMessage.textContent = 'Lỗi khi tìm kiếm tàu.';
        searchMessage.style.display = 'block';
      });
    });
  }
  const btnTaiNhatKy = document.getElementById('btn-tai-nhat-ky');
  const btnDuongDi = document.getElementById('btn-tai-duong-di');

  const logLoading = document.getElementById('log-loading');
  if (btnTaiNhatKy) {
    btnTaiNhatKy.addEventListener('click', async function () {
      loadingMain.show()
      const shipId = document.getElementById('modal-info-id').textContent.trim();
      const idChuyenBien = document.getElementById('modal-info-idcb').value;
      // const idChuyenBien = id;
      if (!shipId) {
        alert('Không tìm thấy ID tàu!');
        return;
      }
      if (logLoading) logLoading.style.display = 'block';
      download(shipId, idChuyenBien, () => {
        loadingMain.hide()
      },
        () => {
          loadingMain.hide()
          if (logLoading) logLoading.style.display = 'none';
        }
      )

    });
  }

  if (btnDuongDi) {
    btnDuongDi.addEventListener(
      'click', function () { // Không cần async ở đây, vì nó chỉ gọi hàm async khác

        const shipId = document.getElementById('modal-info-id').textContent.trim();
        const idChuyenBien = document.getElementById('modal-info-idcb').value;

        if (!shipId || idChuyenBien === '0') {
          alert('Vui lòng chọn tàu hoặc chuyến biển hợp lệ.');
          return;
        }

        // Gọi hàm xử lý và vẽ đường đi
        duongDiChuyenBien(idChuyenBien);

        // Ẩn modal sau khi bấm nút
        const modal = getModalInfor();
        if (modal) modal.hide();
      }
    );
  }

});

// Hàm vẽ đường đi và các điểm đã đi qua
function drawRoute(routeCoords) {
  // Tạo một đối tượng LineString với các tọa độ
  const routeLine = new LineString(routeCoords);

  // Tạo một Feature từ đối tượng LineString
  const routeFeature = new Feature({
    geometry: routeLine,
  });

  // Tạo một Style cho đường
  const lineStyle = new Style({
    stroke: new Stroke({
      color: 'blue',
      width: 3,
    }),
  });
  routeFeature.setStyle(lineStyle);

  // Tạo một Vector Source và thêm Feature vào đó
  const vectorSource = new VectorSource({
    features: [routeFeature],
  });

  // Tạo một Vector Layer và liên kết với Vector Source
  const vectorLayer = new VectorLayer({
    source: vectorSource,
  });

  // Thêm layer vào bản đồ
  map.addLayer(vectorLayer);

  // Vẽ các điểm đã đi qua
  routeCoords.forEach((coord) => {
    const pointFeature = new Feature({
      geometry: new Point(coord),
    });

    const pointStyle = new Style({
      image: new Icon({
        src: 'public/icon/point.svg', // Biểu tượng cho điểm
        scale: 0.05,
      }),
    });
    pointFeature.setStyle(pointStyle);
    vectorSource.addFeature(pointFeature);
  });
}

// Apply ship visibility filter: state === 1 show only status 1; state === 2 show only status 2; state === null show all
function applyShipFilter(state) {
  const features = vectorSourceShip.getFeatures();
  if (!features || !features.length) return;
  features.forEach(f => {
    // If this feature is an active SOS, always keep it visible (ignore status filter)
    const sosFlag = Number(f.get('sos')) || 0;
    if (sosFlag === 1) {
      f.setStyle(undefined);
      return;
    }
    const s = f.get('statuss');
    if (state === 1) {
      if (Number(s) === 1) f.setStyle(undefined); else f.setStyle(hiddenShipStyle);
    } else if (state === 2) {
      if (Number(s) === 2) f.setStyle(undefined); else f.setStyle(hiddenShipStyle);
    } else {
      // null -> show all (use layer style function)
      f.setStyle(undefined);
    }
  });
}

// NOTE: example usage removed — do not auto-draw on load. Use drawRoute(...) when needed.

// Dữ liệu đường đi biển (đổi tên để tránh trùng lặp)
const duongDiChuyenBienData = [
  [103.8033, 10.54],
  [103.79, 10.5],
  [103.82, 10.4267],
  [103.8, 10.4017],
  [102.95, 9.9083],
  [102.92, 9.9033],
  [102.8917, 9.9167],
  [103.1711, 9.5834],
  [102.2017, 8.7817],
  [103.0417, 7.8167],
  [103.7083, 7.3667],
  [103.65, 7.3333],
  [103.5952, 7.3052],
  [103.8667, 7.05],
  [105.82, 6.0967],
  [106.2, 6.25],
  [106.3167, 6.25],
  [106.6617, 6.35],
  [109.2867, 6.8367],
  [109.5683, 6.415],
  [109.8414, 6.0527],
  [111.331917, 6.031434],
  [112.605945, 6.353418],
  [113.6883, 6.7392],
  [115, 7.6619],
  [116.9167, 9.0214],
  [117.9783, 10.345],
  [117.8283, 11.1183],
  [117.469893, 12.219954],
  [117.266333, 12.769167],
  [117.072782, 13.283779],
  [116.8235, 13.8471],
  [116.8083, 13.8618],
  [116.5207, 16.2592],
  [116.99, 17.8225],
  [117.4442, 18.6421],
  [117.6259, 19.743],
  [116.1876, 18.9288],
  [114.6131, 18.5129],
  [113.5533, 17.4329],
  [112.9815, 17.0822],
  [112.9843, 17.1517],
  [112.9486, 17.2212],
  [112.7453, 17.3524],
  [112.4322, 17.5017],
  [112.1438, 17.5515],
  [111.6192, 17.6274],
  [111.5286, 17.6274],
  [111.4434, 17.6065],
  [111.3583, 17.5515],
  [111.2896, 17.4598],
  [110.9795, 16.4481],
  [109.4958, 16.7817],
  [108.5572, 17.3317],
  [107.9667, 17.7833],
  [107.6517, 18.07],
  [107.6267, 18.1183],
  [107.5667, 18.23],
  [107.16, 18.715],
  [107.16, 19.215],
  [107.19, 19.2683],
  [107.2117, 19.4233],
  [107.35, 19.4233],
  [107.5283, 19.6583],
  [107.93, 19.9583],
  [108.3792, 20.4017],
  [108.2083, 21.21],
  [108.135, 21.275],
  [108.095, 21.4517],
  [108.0933, 21.4567],
  [108.095, 21.4583],
  [108.0967, 21.46],
  [108.0983, 21.4633],
  [108.1, 21.4667],
  [108.1, 21.47],
];

// Hàm vẽ các điểm đánh dấu trên đường đi biển
// Draw markers using module imports (Feature, Point, Style, Circle, Fill, Stroke)
function drawMarkers(route) {
  if (!Array.isArray(route)) return;

  const markerStyle = new Style({
    image: new Circle({
      radius: 5,
      fill: new Fill({ color: 'red' }),
      stroke: new Stroke({ color: 'white', width: 2 }),
    }),
  });

  route.forEach((coordinate) => {
    // coordinate assumed [lon, lat]
    const feature = new Feature({
      geometry: new Point(coordinate),
    });
    feature.setStyle(markerStyle);
    vectorSourceHaiTrinh.addFeature(feature);
  });
}

// Note: sample dataset `duongDiChuyenBienData` is present for testing but is not
// auto-drawn on load. To render it, call `drawRoute(duongDiChuyenBienData)` and
// `drawMarkers(duongDiChuyenBienData)` when appropriate (e.g. via UI action).