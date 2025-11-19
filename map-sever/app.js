const express = require('express');
const app = express();
const { sql, connectToDb } = require('./src/db');
const cors = require('cors');
const port = process.env.PORT || 3000;
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');
// const docxtemplater = require('docxtemplater');
const libre = require('libreoffice-convert');
const { randomUUID } = require('crypto');

// Đọc template.html và output.css
const html = fs.readFileSync(path.join(__dirname, 'src/template.html'), 'utf8');
const cssPath = path.join(__dirname, 'src/output.css');
let css = '';
if (fs.existsSync(cssPath)) {
  css = fs.readFileSync(cssPath, 'utf8');
}

// Load species list to map id -> name
const speciesDataPath = path.join(__dirname, 'species.json');
let speciesMap = {};
if (fs.existsSync(speciesDataPath)) {
  try {
    const speciesList = JSON.parse(fs.readFileSync(speciesDataPath, 'utf8'));
    speciesMap = (speciesList || []).reduce((m, s) => { m[s.id] = s.name; return m; }, {});
  } catch (e) {
    console.error('Failed to load species.json:', e);
  }
}

// Load ports list to map id -> name
const cangDataPath = path.join(__dirname, 'cang.json');
let cangMap = {};
if (fs.existsSync(cangDataPath)) {
  try {
    const cangList = JSON.parse(fs.readFileSync(cangDataPath, 'utf8'));
    cangMap = (cangList || []).reduce((m, c) => { m[c.id] = c.name; return m; }, {});
  } catch (e) {
    console.error('Failed to load cang.json:', e);
  }
}

const getPortName = (val) => {
  if (val == null) return '';
  // If numeric id or numeric string, try map lookup
  const asNum = Number(val);
  if (!Number.isNaN(asNum) && (asNum in cangMap)) return cangMap[asNum];
  // Try direct key (in case ids are strings in the file)
  if (val in cangMap) return cangMap[val];
  // fallback to the value itself
  return String(val);
};

// Format coordinate to fixed 5 decimal places when possible
const formatCoord = (v) => {
  if (v == null || v === '') return '';
  const n = Number(v);
  if (Number.isNaN(n)) return String(v);
  return n.toFixed(5);
};

const wsPort = process.env.WS_PORT ? parseInt(process.env.WS_PORT, 10) : 8080;
const wss = new WebSocket.Server({ port: wsPort });

// Track database connection status
let dbConnected = false;

connectToDb().then(() => {
  dbConnected = true;
}).catch(() => {
  dbConnected = false;
});

wss.on('connection', ws => {
  console.log('Client đã kết nối.');
  const request = new sql.Request();
  // request.input('statuss', sql.Int, 1);
  // Gửi vị trí mới tới client mỗi 5 giây
  setInterval(async () => {

    try {

      const result = await request.execute('Locations');
      ws.send(JSON.stringify(result.recordset));
    } catch (error) {
      console.error('Error executing query:', error);

    }

  }, 5000);
});



app.use(cors({ origin: ['http://161.248.147.115', 'http://171.244.40.86', 'http://127.0.0.1:5173', 'http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'] }));
// Parse JSON bodies
app.use(express.json());
app.get('/api/ship',async(req,res)=>{
  try {
   
      const request = new sql.Request();

    if( req.query.statuss){
       const statuss = req.query.statuss;
      request.input('statuss', sql.Int, statuss);
     const result = await request.execute('ShipByStatuss');
    res.json(result.recordset);
    }else{
    const result = await request.execute('ShipAll');
    res.json(result.recordset);
    }
  } catch (error) {
    console.error('Error executing query:', error);
    res.status(500).send('Internal Server Error');
  }
})
app.get('/api/chuyen-bien',async(req,res)=>{
  try {
    const idShip = req.query.id ? req.query.id : "";
      const request = new sql.Request();

    
      request.input('idShip', sql.NChar, idShip);
     const result = await request.execute('ChuyenBiensByIdShip');
    res.json(result.recordset);

  } catch (error) {
    console.error('Error executing query:', error);
    res.status(500).send('Internal Server Error');
  }
})

// app.get('/api/locations', async (req, res) => {
//   const statuss = req.query.statuss ? req.query.statuss : 1;
//   const request = new sql.Request();
//   try {
//     request.input('statuss', sql.Int, statuss);
//     const result = await request.execute('LocationShipByStatus');
//     res.json(result.recordset);
//   } catch (error) {
//     console.error('Error executing query:', error);
//     res.status(500).send('Internal Server Error');
//   }
// });


app.get('/api/ship-info', async (req, res) => {
  const id_chuyen_bien = req.query.id;

  const request = new sql.Request();
  try {
    request.input('id_ship', sql.NVarChar, id_chuyen_bien);
    const result = await request.execute('ShipInfo');
    res.json(result.recordset);
  } catch (error) {
    console.error('Error executing query:', error);
    res.status(500).send('Internal Server Error');
  }
});

// API: thêm một tàu mới
app.post('/api/add-ship', async (req, res) => {
  try {
    const payload = req.body || {};
    // Basic validation: require at least one identifier
    if (!payload.so_dang_ki_tau && !payload.so_dang_ky_tau && !payload.ten_chu_tau && !payload.ship_name) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc: so_dang_ki_tau hoặc ten_chu_tau hoặc ship_name' });
    }

    const soDangKi = payload.so_dang_ki_tau ?? payload.so_dang_ky_tau ?? null;
    if (soDangKi) {
      // Check if ship with this registration already exists
      const checkRequest = new sql.Request();
      checkRequest.input('so_dang_ki_tau', sql.NVarChar, soDangKi);
      const checkResult = await checkRequest.query('SELECT id FROM dbo.ship WHERE so_dang_ki_tau = @so_dang_ki_tau');
      if (checkResult.recordset.length > 0) {
        return res.status(409).json({ success: false, message: 'Tàu với số đăng ký này đã tồn tại' });
      }
    }

    // Generate an id if not provided (matches nvarchar(450) primary key)
    const id = (payload.id && String(payload.id).trim()) ? String(payload.id) : randomUUID();

    const request = new sql.Request();
    // Bind parameters according to ship table schema
    request.input('id', sql.NVarChar(450), id);
    request.input('id_chu_tau', sql.Int, payload.id_chu_tau ?? null);
    request.input('ten_chu_tau', sql.NVarChar, payload.ten_chu_tau ?? null);
    request.input('ten_thuyen_truong', sql.NVarChar, payload.ten_thuyen_truong ?? null);
    request.input('so_dang_ki_tau', sql.NVarChar, soDangKi);
    request.input('chieu_dai_tau', sql.NVarChar, payload.chieu_dai_tau ?? null);
    request.input('tong_cong_suat', sql.Real, payload.tong_cong_suat ?? null);
    request.input('so_giay_phep', sql.NVarChar, payload.so_giay_phep ?? null);
    request.input('thoi_han', sql.DateTime2, payload.thoi_han ? new Date(payload.thoi_han) : null);
    request.input('nghe_phu_1', sql.NVarChar, payload.nghe_phu_1 ?? null);
    request.input('nghe_phu_2', sql.NVarChar, payload.nghe_phu_2 ?? null);
    request.input('chieu_dai_vang_cau', sql.Real, payload.chieu_dai_vang_cau ?? null);
    request.input('so_luoi_cau', sql.Int, payload.so_luoi_cau ?? null);
    request.input('chieu_dai_luoi_vay', sql.Real, payload.chieu_dai_luoi_vay ?? null);
    request.input('chieu_cao_luoi_vay', sql.Real, payload.chieu_cao_luoi_vay ?? null);
    request.input('chu_vi_luoi_chup', sql.Real, payload.chu_vi_luoi_chup ?? null);
    request.input('chieu_cao_luoi_chup', sql.Real, payload.chieu_cao_luoi_chup ?? null);
    request.input('chieu_dai_gieng_phao', sql.Real, payload.chieu_dai_gieng_phao ?? null);
    request.input('chieu_dai_luoi_keo', sql.Real, payload.chieu_dai_luoi_keo ?? null);
    request.input('ship_name', sql.NVarChar, payload.ship_name ?? payload.ten_chu_tau ?? null);
    request.input('new_latidue', sql.Real, payload.new_latidue ?? null);
    request.input('new_longtidue', sql.Real, payload.new_longtidue ?? null);
    // time_update: default to current UTC if not provided
    request.input('time_update', sql.DateTime2, payload.time_update ? new Date(payload.time_update) : new Date());

    // Build parameterized INSERT
    const insertSql = `INSERT INTO dbo.ship (
      [id],[id_chu_tau],[ten_chu_tau],[ten_thuyen_truong],[so_dang_ki_tau],[chieu_dai_tau],[tong_cong_suat],[so_giay_phep],[thoi_han],[nghe_phu_1],[nghe_phu_2],[chieu_dai_vang_cau],[so_luoi_cau],[chieu_dai_luoi_vay],[chieu_cao_luoi_vay],[chu_vi_luoi_chup],[chieu_cao_luoi_chup],[chieu_dai_gieng_phao],[chieu_dai_luoi_keo],[ship_name],[new_latidue],[new_longtidue],[time_update]
    ) VALUES (
      @id,@id_chu_tau,@ten_chu_tau,@ten_thuyen_truong,@so_dang_ki_tau,@chieu_dai_tau,@tong_cong_suat,@so_giay_phep,@thoi_han,@nghe_phu_1,@nghe_phu_2,@chieu_dai_vang_cau,@so_luoi_cau,@chieu_dai_luoi_vay,@chieu_cao_luoi_vay,@chu_vi_luoi_chup,@chieu_cao_luoi_chup,@chieu_dai_gieng_phao,@chieu_dai_luoi_keo,@ship_name,@new_latidue,@new_longtidue,@time_update
    );`;

    await request.query(insertSql);

    return res.json({ success: true, message: 'Thêm tàu thành công', id });
  } catch (error) {
    console.error('Error in /api/add-ship:', error);
    // detect unique/PK violation
    if (error && error.number === 2627) {
      return res.status(409).json({ success: false, message: 'ID đã tồn tại' });
    }
    res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message || error });
  }
});

app.get('/api/locations', async (req, res) => {
  const id_chuyen_bien = req.query.id;

  const request = new sql.Request();
  try {
    request.input('id_chuyen_bien', sql.Int, id_chuyen_bien);
    const result = await request.execute('LocationsByIdChuyenBien');
    res.json(result.recordset);
  } catch (error) {
    console.error('Error executing query:', error);
    res.status(500).send('Internal Server Error');
  }
});


app.get('/api/download', async (req, res) => {
  try {
    console.log('download');
    const shipId = req.query.id ? req.query.id : "";
    const id_chuyen_bien = req.query.id_cb ? req.query.id_cb : 0;





    const [shipResult, dataCb] = await Promise.all([
      (async () => {
        const request = new sql.Request();
        request.input('id_ship', sql.NVarChar, shipId);
        return request.execute('ShipInfo')
      })(),
      (async () => {
        const req = new sql.Request();
        req.input('id_chuyen_bien', sql.Int, id_chuyen_bien);
        return req.execute('ThongTinChuyenBienByID')
      })()
    ]);

    // Chuẩn hóa dữ liệu trả về từ thủ tục nhiều recordsets
    const shipObj = shipResult.recordset?.[0] || {};
    const cbSets = Array.isArray(dataCb.recordsets) ? dataCb.recordsets : [];
    const chuyenBien = (cbSets[0] && cbSets[0][0]) ? cbSets[0][0] : {};
    const thuThaLuoi = Array.isArray(cbSets[1]) ? cbSets[1] : [];
    const khaiThac = Array.isArray(cbSets[2]) ? cbSets[2] : [];
    const loaiQuy = Array.isArray(cbSets[3]) ? cbSets[3] : [];
    const truyenTai = Array.isArray(cbSets[4]) ? cbSets[4] : [];

    console.log('khaiThac', khaiThac);
    console.log('thuThaLuoi', thuThaLuoi);
    console.log('loaiQuy', loaiQuy);
    console.log('truyenTai', truyenTai);
    console.log('chuyenBien', chuyenBien);
    console.log('shipObj', shipObj);
    // Helper: lấy top N (mặc định 5) theo so_luong, trả về mảng gồm topN (có tên loài) và phần tử cuối cùng là tổng 'others' nếu còn dư
    const topNWithNames = (list, n = 5) => {
      if (!Array.isArray(list) || list.length === 0) return [];
      const cloned = list.map(x => ({ ...x }));
      cloned.sort((a, b) => (Number(b.so_luong) || 0) - (Number(a.so_luong) || 0));
      const top = cloned.slice(0, n).map(it => {
        const ma = it.ma_loai ?? it.MA_LOAI ?? it.maLoai ?? it.MALOAI ?? null;
        const so_luong = Number(it.so_luong ?? it.SO_LUONG ?? 0) || 0;
        const ten_loai = speciesMap[ma] || it.ten_loai || it.TEN_LOAI || '';
        return { ma_loai: ma, so_luong, ten_loai };
      });
      const rest = cloned.slice(n);
      const restTotal = rest.reduce((sum, x) => sum + (Number(x.so_luong ?? x.SO_LUONG ?? 0) || 0), 0);
      if (rest.length > 0) top.push({ ma_loai: null, so_luong: restTotal, ten_loai: 'Còn lại' });
      return top;
    };

    // Sử dụng TVP: gom tất cả id_khai_thac và id_truyen_tai, gọi proc 1 lần rồi phân nhóm
    if (Array.isArray(khaiThac) && khaiThac.length > 0) {
      const idsTable = new sql.Table();
      idsTable.columns.add('id', sql.Int);
      khaiThac.forEach(it => idsTable.rows.add(it.ID || 0));
      const req = new sql.Request();
      req.input('ids', idsTable);
      const resLoai = await req.execute('LoaiKhaiThac');
      const rows = resLoai.recordset || [];
      const grouped = rows.reduce((acc, r) => {
        const key = r.id_khai_thac ?? r.ID_KHAI_THAC ?? r.id_khaiThac;
        if (!acc[key]) acc[key] = [];
        acc[key].push(r);
        return acc;
      }, {});
      for (const item of khaiThac) {
        const parentId = item.ID ?? item.id ?? item.ID_KHAI_THAC ?? item.id_khai_thac ?? item.id_khaiThac;
        item.loai_danh_bat = topNWithNames(grouped[parentId] || [], 5);
      }
    }

    if (Array.isArray(truyenTai) && truyenTai.length > 0) {
      const idsTable2 = new sql.Table();
      idsTable2.columns.add('id', sql.Int);
      truyenTai.forEach(it => idsTable2.rows.add(it.ID || 0));
      const req2 = new sql.Request();
      req2.input('ids', idsTable2);
      const resLoai2 = await req2.execute('LoaiTruyenTai');
      const rows2 = resLoai2.recordset || [];
      const grouped2 = rows2.reduce((acc, r) => {
        const key = r.id_truyen_tai ?? r.ID_TRUYEN_TAI ?? r.id_truyenTai;
        if (!acc[key]) acc[key] = [];
        acc[key].push(r);
        return acc;
      }, {});
      for (const item of truyenTai) {
        const parentId = item.ID ?? item.id ?? item.ID_TRUYEN_TAI ?? item.id_truyen_tai ?? item.id_truyenTai;
        item.loai_danh_bat = topNWithNames(grouped2[parentId] || [], 5);
      }
    }

    // Gắn dữ liệu chuyến biển theo cấu trúc mới
    shipObj.chuyen_bien = chuyenBien;
    shipObj.chuyen_bien.khaiThac = khaiThac;
    shipObj.chuyen_bien.thuThaLuoi = thuThaLuoi;
    shipObj.chuyen_bien.loaiQuy = loaiQuy;
    shipObj.chuyen_bien.truyenTai = truyenTai;
    console.log('Final shipObj:', shipObj);
    // Nếu cần đổ dữ liệu vào form HTML: dùng bản sao của template đã nạp sẵn
    let pageHtml = html;

    // Map trường -> span id trong template
    const spanData = {
      ten_chu_tau: shipObj.ten_chu_tau || '',
      ten_thuyen_truong: shipObj.ten_thuyen_truong || '',
      so_dang_ky_tau: shipObj.so_dang_ki_tau || '',
      chieu_dai_tau: shipObj.chieu_dai_tau || '',
      tong_cong_suat: shipObj.tong_cong_suat || '',
      so_giay_phep: shipObj.so_giay_phep || '',
      thoi_han: shipObj.thoi_han || '',
      nghe_phu1: shipObj.nghe_phu_1 || '',
      nghe_phu2: shipObj.nghe_phu_2 || '',
      chieu_dai_vang_cau: shipObj.chieu_dai_vang_cau || '',
      so_luoi_cau: shipObj.so_luoi_cau || '',
      chieu_dai_luoi_vay: shipObj.chieu_dai_luoi_vay || '',
      chieu_cao_luoi_vay: shipObj.chieu_cao_luoi_vay || '',
      chu_vi_luoi_chup: shipObj.chu_vi_luoi_chup || '',
      chieu_cao_luoi_chup: shipObj.chieu_cao_luoi_chup || '',
      chieu_dai_gieng_phao: shipObj.chieu_dai_gieng_phao || '',
      chieu_dai_luoi_keo: shipObj.chieu_dai_luoi_keo || '',
  cang_di: getPortName(shipObj.chuyen_bien?.cang_di) || '',
  cang_ve: getPortName(shipObj.chuyen_bien?.cang_ve) || '',
      vao_so: shipObj.chuyen_bien?.vao_so || ''
    };

    for (const [key, value] of Object.entries(spanData)) {
      const regex = new RegExp(`<span id="${key}">.*?<\\/span>`, 'g');
      pageHtml = pageHtml.replace(regex, `<span id="${key}">${value ?? ''}</span>`);
    }

    // Đổ dữ liệu ngày/tháng/năm
    const ngayDi = shipObj.chuyen_bien?.thoi_gian_di ? new Date(shipObj.chuyen_bien.thoi_gian_di) : null;
    if (ngayDi) {
      // Render ngày/tháng/năm in Vietnam timezone
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', day: '2-digit', month: '2-digit', year: 'numeric' }).formatToParts(ngayDi);
      let dday = '', dmon = '', dyear = '';
      parts.forEach(p => { if (p.type === 'day') dday = p.value; if (p.type === 'month') dmon = p.value; if (p.type === 'year') dyear = p.value; });
      pageHtml = pageHtml.replace(/<span id="ngay_di".*?<\/span>/, `<span id="ngay_di">${dday}</span>`);
      pageHtml = pageHtml.replace(/<span id="thang_di".*?<\/span>/, `<span id="thang_di">${dmon}</span>`);
      pageHtml = pageHtml.replace(/<span id="nam_di".*?<\/span>/, `<span id="nam_di">${dyear}</span>`);
    }
    const ngayVe = shipObj.chuyen_bien?.thoi_gian_ve ? new Date(shipObj.chuyen_bien.thoi_gian_ve) : null;
    if (ngayVe) {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', day: '2-digit', month: '2-digit', year: 'numeric' }).formatToParts(ngayVe);
      let dday = '', dmon = '', dyear = '';
      parts.forEach(p => { if (p.type === 'day') dday = p.value; if (p.type === 'month') dmon = p.value; if (p.type === 'year') dyear = p.value; });
      pageHtml = pageHtml.replace(/<span id="ngay_ve".*?<\/span>/, `<span id="ngay_ve">${dday}</span>`);
      pageHtml = pageHtml.replace(/<span id="thang_ve".*?<\/span>/, `<span id="thang_ve">${dmon}</span>`);
      pageHtml = pageHtml.replace(/<span id="nam_ve".*?<\/span>/, `<span id="nam_ve">${dyear}</span>`);
    }
    const ngayNop = shipObj.chuyen_bien?.thoi_gian_nop ? new Date(shipObj.chuyen_bien.thoi_gian_nop) : null;
    if (ngayNop) {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', day: '2-digit', month: '2-digit', year: 'numeric' }).formatToParts(ngayNop);
      let dday = '', dmon = '', dyear = '';
      parts.forEach(p => { if (p.type === 'day') dday = p.value; if (p.type === 'month') dmon = p.value; if (p.type === 'year') dyear = p.value; });
      pageHtml = pageHtml.replace(/<span id="ngay_nop".*?<\/span>/, `<span id="ngay_nop">${dday}</span>`);
      pageHtml = pageHtml.replace(/<span id="thang_nop".*?<\/span>/, `<span id="thang_nop">${dmon}</span>`);
      pageHtml = pageHtml.replace(/<span id="nam_nop".*?<\/span>/, `<span id="nam_nop">${dyear}</span>`);
    }
    const ngayNK = shipObj.chuyen_bien?.ngay_nhatky ? new Date(shipObj.chuyen_bien.ngay_nhatky) : null;
    if (ngayNK) {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', day: '2-digit', month: '2-digit', year: 'numeric' }).formatToParts(ngayNK);
      let dday = '', dmon = '', dyear = '';
      parts.forEach(p => { if (p.type === 'day') dday = p.value; if (p.type === 'month') dmon = p.value; if (p.type === 'year') dyear = p.value; });
      pageHtml = pageHtml.replace(/<span id="ngay_nhatky".*?<\/span>/, `<span id="ngay_nhatky">${dday}</span>`);
      pageHtml = pageHtml.replace(/<span id="thang_nhatky".*?<\/span>/, `<span id="thang_nhatky">${dmon}</span>`);
      pageHtml = pageHtml.replace(/<span id="nam_nhatky".*?<\/span>/, `<span id="nam_nhatky">${dyear}</span>`);
    }

    // Bảng I: mẻ khai thác
    // Helper định dạng thời gian: use Vietnam timezone so all displays are consistent with bảng truyền tải
  const formatPartsInTZ = (iso, tz = 'UTC') => {
      if (!iso) return { dm: '', hm: '' };
      const d = new Date(iso);
      if (isNaN(d)) return { dm: '', hm: '' };
      const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: tz,
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }).formatToParts(d);
      let dd = '', mo = '', hh = '', mi = '';
      parts.forEach(p => {
        if (p.type === 'day') dd = p.value;
        if (p.type === 'month') mo = p.value;
        if (p.type === 'hour') hh = p.value;
        if (p.type === 'minute') mi = p.value;
      });
      return { dm: `${dd}/${mo}`, hm: `${hh}:${mi}` };
    };

  const toDateParts = (iso) => formatPartsInTZ(iso, 'UTC');

    // Gom dữ liệu thả/thu theo mẻ (field 'me'), statuss=0: thả, statuss=1: thu
    const thuThaByMe = new Map();
    for (const item of (shipObj.chuyen_bien?.thuThaLuoi || [])) {
      const key = (item.me ?? item.me_so ?? item.meSo ?? item.me_thu ?? '');
      if (!key) continue;
      const pair = thuThaByMe.get(key) || {};
      if (item.statuss === 0) pair.tha = item;
      if (item.statuss === 1) pair.thu = item;
      thuThaByMe.set(key, pair);
    }
    // Helper: format ISO -> "HH:MM DD/MM" using Vietnam timezone (consistent with bảng truyền tải)
    const toDateTimeStr = (iso) => {
      if (!iso) return '';
  const p = formatPartsInTZ(iso, 'UTC');
      return p.hm && p.dm ? `${p.hm} ${p.dm}` : '';
    };

    const rowsKhaiThac = (shipObj.chuyen_bien?.khaiThac || []).map((row, idx) => {
      const meKey = (row.me_so ?? row.meSo ?? row.me ?? row.me_thu ?? '');
      const pair = thuThaByMe.get(meKey);
      const thaParts = pair?.tha ? toDateParts(pair.tha.time_create) : { dm: (row.ngay_thang ?? ''), hm: (row.gio_tha ?? '') };
      const thuParts = pair?.thu ? toDateParts(pair.thu.time_create) : { dm: (row.ngay_thu ?? ''), hm: (row.gio_thu ?? '') };
      const speciesCols = Array.isArray(row.loai_danh_bat)
        ? row.loai_danh_bat.map(x => ({
            so_luong: Number(x.so_luong ?? x.SO_LUONG ?? 0) || 0,
            ten_loai: (x.ten_loai ?? x.TEN_LOAI ?? (x.ma_loai != null ? speciesMap[x.ma_loai] : '')) || ''
          }))
        : [];
      // ensure at least 6 slots: top5 + others slot
      while (speciesCols.length < 6) speciesCols.push({ so_luong: 0, ten_loai: '' });
      const [c1, c2, c3, c4, c5, cOthers] = speciesCols.slice(0, 6);
      const formatCell = (c) => (c && (c.so_luong || c.ten_loai) ? `${c.so_luong}${c.ten_loai ? ' (' + c.ten_loai + ')' : ''}` : '');
      const l1 = formatCell(c1);
      const l2 = formatCell(c2);
      const l3 = formatCell(c3);
      const l4 = formatCell(c4);
      const l5 = formatCell(c5);
      const others = cOthers ? cOthers.so_luong : 0;
      const tong = (Number(row.tong_san_luong) || 0) || ( (c1.so_luong||0) + (c2.so_luong||0) + (c3.so_luong||0) + (c4.so_luong||0) + (c5.so_luong||0) + (cOthers.so_luong||0) );
      return (
        `<tr>` +
        `<td class=\"table-cell text-center\">${idx + 1}</td>` +
        `<td class=\"table-cell text-center\">${row.me_so ?? row.meSo ?? ''}</td>` +
  `<td class=\"table-cell text-center\">${thaParts.dm}</td>` +
  `<td class=\"table-cell text-center\">${thaParts.hm}</td>` +
  `<td class=\"table-cell text-center\">${formatCoord(pair?.tha?.lat ?? row.vi_do_tha ?? '')}</td>` +
  `<td class=\"table-cell text-center\">${formatCoord(pair?.tha?.long ?? row.kinh_do_tha ?? '')}</td>` +
  `<td class=\"table-cell text-center\">${thuParts.dm}</td>` +
  `<td class=\"table-cell text-center\">${thuParts.hm}</td>` +
  `<td class=\"table-cell text-center\">${formatCoord(pair?.thu?.lat ?? row.vi_do_thu ?? '')}</td>` +
  `<td class=\"table-cell text-center\">${formatCoord(pair?.thu?.long ?? row.kinh_do_thu ?? '')}</td>` +
  `<td class="table-cell text-center">${l1}</td>` +
  `<td class="table-cell text-center">${l2}</td>` +
  `<td class="table-cell text-center">${l3}</td>` +
  `<td class="table-cell text-center">${l4}</td>` +
  `<td class="table-cell text-center">${l5}</td>` +
  `<td class="table-cell text-center">${others}</td>` +
  `<td class="table-cell text-center font-bold">${row.tong_san_luong ?? tong}</td>` +
        `</tr>`
      );
    }).join('');

    // Bảng II: chuyển tải
    // Helper định dạng ngày từ ISO (VN timezone)
    const toDateStr = (iso) => {
      if (!iso) return '';
      const d = new Date(iso);
      if (isNaN(d)) return '';
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', day: '2-digit', month: '2-digit' }).formatToParts(d);
      let dd = '', mm = '';
      parts.forEach(p => { if (p.type === 'day') dd = p.value; if (p.type === 'month') mm = p.value; });
      return dd && mm ? `${dd}/${mm}` : '';
    };

    // For each truyenTai entry, if there are multiple species in loai_danh_bat, render each species on its own table row.
    const rowsTruyenTai = (shipObj.chuyen_bien?.truyenTai || []).map((row, idx) => {
      const speciesList = Array.isArray(row.loai_danh_bat) ? row.loai_danh_bat.filter(Boolean) : [];
      // If no species array, keep a single row using row.ten_loai / row.so_luong
      if (speciesList.length === 0) {
        return (`<tr>` +
          `<td class="table-cell text-center">${idx + 1}</td>` +
          `<td class="table-cell"><input type="text" class="form-input text-center w-full" style="border-bottom:none;" value="${toDateStr(row.ngay_thang)}"/></td>` +
          `<td class="table-cell"><input type="text" class="form-input text-center w-full" style="border-bottom:none;" value="${row.so_dang_ki ?? row.so_dang_ky_tau ?? ''}"/></td>` +
          `<td class="table-cell"><input type="text" class="form-input text-center w-full" style="border-bottom:none;" value="${row.so_giay_phep ?? ''}"/></td>` +
          `<td class="table-cell"><input type="text" class="form-input text-center w-full" style="border-bottom:none;" value="${formatCoord(row.lat ?? row.vi_do ?? '')}"/></td>` +
          `<td class="table-cell"><input type="text" class="form-input text-center w-full" style="border-bottom:none;" value="${formatCoord(row.long ?? row.kinh_do ?? '')}"/></td>` +
          `<td class="table-cell"><input type="text" class="form-input text-center w-full" style="border-bottom:none;" value="${row.ten_loai ?? ''}"/></td>` +
          `<td class="table-cell"><input type="text" class="form-input text-center w-full" style="border-bottom:none;" value="${row.khoi_luong ?? row.so_luong ?? ''}"/></td>` +
          `<td class="table-cell"><input type="text" class="form-input text-center w-full" style="border-bottom:none;" value="${row.thuyen_truong ?? ''}"/></td>` +
          `</tr>`);
      }

      // If speciesList exists, build multiple rows: first species row includes the date/registration/etc, subsequent species rows only show species name/count.
      const built = [];
      for (let sIndex = 0; sIndex < speciesList.length; sIndex++) {
        const s = speciesList[sIndex];
        const sName = (s.ten_loai ?? s.TEN_LOAI ?? s.ma_loai ?? s.MA_LOAI ?? '') || '';
        const sCount = (s.so_luong ?? s.SO_LUONG ?? s?.so_luong ?? 0) || 0;

        if (sIndex === 0) {
          built.push(`<tr>` +
            `<td class="table-cell text-center">${idx + 1}</td>` +
            `<td class="table-cell"><input type="text" class="form-input text-center w-full" style="border-bottom:none;" value="${toDateStr(row.ngay_thang)}"/></td>` +
            `<td class="table-cell"><input type="text" class="form-input text-center w-full" style="border-bottom:none;" value="${row.so_dang_ki ?? row.so_dang_ky_tau ?? ''}"/></td>` +
            `<td class="table-cell"><input type="text" class="form-input text-center w-full" style="border-bottom:none;" value="${row.so_giay_phep ?? ''}"/></td>` +
            `<td class="table-cell"><input type="text" class="form-input text-center w-full" style="border-bottom:none;" value="${formatCoord(row.lat ?? row.vi_do ?? '')}"/></td>` +
              `<td class="table-cell"><input type="text" class="form-input text-center w-full" style="border-bottom:none;" value="${formatCoord(row.long ?? row.kinh_do ?? '')}"/></td>` +
              `<td class="table-cell"><input type="text" class="form-input text-center w-full" style="border-bottom:none;" value="${sName}"/></td>` +
              `<td class="table-cell"><input type="text" class="form-input text-center w-full" style="border-bottom:none;" value="${sCount}"/></td>` +
              `<td class="table-cell"><input type="text" class="form-input text-center w-full" style="border-bottom:none;" value="${row.thuyen_truong ?? ''}"/></td>` +
              `</tr>`);
        } else {
          // subsequent species rows: leave leading columns empty to visually group them
          built.push(`<tr>` +
            `<td class="table-cell text-center"></td>` +
            `<td class="table-cell"></td>` +
            `<td class="table-cell"></td>` +
            `<td class="table-cell"></td>` +
            `<td class="table-cell"></td>` +
            `<td class="table-cell"></td>` +
            `<td class="table-cell"><input type="text" class="form-input text-center w-full" style="border-bottom:none;" value="${sName}"/></td>` +
            `<td class="table-cell"><input type="text" class="form-input text-center w-full" style="border-bottom:none;" value="${sCount}"/></td>` +
            `<td class="table-cell"></td>` +
            `</tr>`);
        }
      }

      return built.join('');
    }).join('');

    // Bảng loài quý (endangered species)
    const rowsLoaiQuy = (shipObj.chuyen_bien?.loaiQuy || []).map((row, idx) => {
      // Map tình trạng bắt gặp / trạng thái
      const batGapTha = ((row.cong_Cu ?? '') + '').toLowerCase().includes('thả') ? 'checked' : '';
      const batGapKeo = ((row.cong_Cu ?? '') + '').toLowerCase().includes('kéo') ? 'checked' : '';
      const batGapKhac = ((row.cong_Cu ?? '') + '').toLowerCase().includes('khác') ? 'checked' : '';
      const tinhTrangSong = ((row.tinh_trang ?? '') + '').toLowerCase().includes('sống') ? 'checked' : '';
      const tinhTrangChet = ((row.tinh_trang ?? '') + '').toLowerCase().includes('chết') ? 'checked' : '';
      const tinhTrangThuong = ((row.tinh_trang ?? '') + '').toLowerCase().includes('thương') ? 'checked' : '';

      // For PDF/print we render disabled checkboxes showing the checked state
      const gapPrefix = `gap_${idx}`;
      const ttPrefix = `tt_${idx}`;

      {
        // Lấy thời điểm bắt gặp theo logic giống mẻ khai thác: ưu tiên 'thu' rồi 'tha', fallback về trường ngày/giờ của row
        const meKey = (row.me_so ?? row.meSo ?? row.me ?? '').toString().trim();
        // Map keys may be numbers or strings depending on source; try both lookups.
        let pair = thuThaByMe.get(meKey);
        let pairLookup = 'string';
        if (!pair && meKey !== '') {
          pair = thuThaByMe.get(Number(meKey));
          pairLookup = 'number';
        }
        const encounterParts = pair
          ? (pair.thu ? toDateParts(pair.thu.time_create)
            : (pair.tha ? toDateParts(pair.tha.time_create)
              : { dm: (row.ngay_thang ?? row.ngay_thu ?? ''), hm: (row.gio_thu ?? row.gio_tha ?? '') }))
          : { dm: (row.ngay_thang ?? row.ngay_thu ?? ''), hm: (row.gio_thu ?? row.gio_tha ?? '') };
        console.log(`Mekey: ${meKey} (lookup tried as ${pairLookup})`);
        // Convert the Map to a plain object for readable logging (keys become strings)
        try {
          const plainObject = Object.fromEntries(thuThaByMe);
          console.log(`thuThaByMe: ${JSON.stringify(plainObject, null, 2)}`);
        } catch (e) {
          console.log('thuThaByMe (raw)', thuThaByMe);
        }
        console.log('pair:', pair);
        console.log(`Encounter time: ${encounterParts.hm} ${encounterParts.dm}`);
        return (
          `<tr>` +
        `<td class="table-cell text-center">${idx + 1}</td>` +
        `<td class="table-cell"><div class="print-text text-center w-full" style="border-bottom:none;">${row.me_so ?? row.meSo ?? row.me ?? ''}</div></td>` +
        `<td class="table-cell"><div class="print-text text-center w-full" style="border-bottom:none;">${row.ten_loai ?? row.TEN_LOAI ?? ''}</div></td>` +
  // Hiển thị giờ:phút và ngày/tháng theo mẻ số
  `<td class="table-cell"><div class="print-text text-center w-full" style="border-bottom:none;">${encounterParts.hm} ${encounterParts.dm}</div></td>` +
        `<td class="table-cell"><div class="print-text text-center w-full" style="border-bottom:none;">${row.khoi_luong ?? row.khoi_luong_uoc ?? ''}</div></td>` +
        `<td class="table-cell"><div class="print-text text-center w-full" style="border-bottom:none;">${row.so_luong ?? row.so_luong_uoc ?? ''}</div></td>` +
        `<td class="table-cell"><div class="print-text text-center w-full" style="border-bottom:none;">${row.kich_thuoc ?? ''}</div></td>` +
        // Bắt gặp: Thả / Kéo / Khác
        `<td class="table-cell text-center"><input type="checkbox" ${batGapTha} disabled/></td>` +
        `<td class="table-cell text-center"><input type="checkbox" ${batGapKeo} disabled/></td>` +
        `<td class="table-cell text-center"><input type="checkbox" ${batGapKhac} disabled/></td>` +
        // Tình trạng: Sống / Chết / Bị thương (hiển thị checkbox disabled)
        `<td class="table-cell text-center"><input type="checkbox" ${tinhTrangSong} disabled/></td>` +
        `<td class="table-cell text-center"><input type="checkbox" ${tinhTrangChet} disabled/></td>` +
        `<td class="table-cell text-center"><input type="checkbox" ${tinhTrangThuong} disabled/></td>` +
          `</tr>`
        );
      }
    }).join('');

    // Thay thế tbody thứ 1, 2 và 3 (bảng I, II và loài quý)
    let tbodyIndex = 0;
    pageHtml = pageHtml.replace(/<tbody>[\s\S]*?<\/tbody>/g, (match) => {
      tbodyIndex += 1;
      if (tbodyIndex === 1) return `<tbody>${rowsKhaiThac}</tbody>`;
      if (tbodyIndex === 2) return `<tbody>${rowsLoaiQuy}</tbody>`;
      if (tbodyIndex === 3) return `<tbody>${rowsTruyenTai}</tbody>`;
      return match;
    });


    // Nhúng CSS vào <head> của HTML (kèm override cho in: cho phép xuống dòng và page-break rules)
    const printOverrides = `
      /* Allow long text to wrap in printable cells */
      .print-text { white-space: normal !important; overflow-wrap: break-word !important; word-break: break-word !important; display: block; }
      td .print-text { width: 100%; }
      /* Table print behaviour */
      table { page-break-inside: auto; }
      tr    { page-break-inside: avoid; page-break-after: auto; }
      thead { display: table-header-group; }
      tfoot { display: table-footer-group; }
      /* Reduce input visuals in PDF: hide input elements if any remain */
      input.form-input { border: none; background: transparent; }
    `;
    pageHtml = pageHtml.replace('</head>', `<style>${css}\n${printOverrides}</style></head>`);

    //   // Chuyển HTML sang PDF bằng Puppeteer
    const puppeteer = require('puppeteer');
    const browser = await puppeteer.launch({
    headless: true, // Giữ nguyên hoặc đảm bảo là true
    // 🌟 THÊM DÒNG NÀY ĐỂ GIẢI QUYẾT LỖI ROOT 🌟
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    // ... các tùy chọn khác
});
    const page = await browser.newPage();
    await page.setContent(pageHtml, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({ format: 'A4' });
    await browser.close();

    // Gửi PDF về client
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=output.pdf');
    res.end(pdfBuffer);

  } catch (error) {
    console.error('Error executing query:', error);
    res.status(500).send('Internal Server Error');



  }
});

// API: lấy thông tin chuyến biển theo ID, kèm LoaiKhaiThac và LoaiTruyenTai
app.get('/api/thong-tin-chuyen-bien', async (req, res) => {
  try {
    const id = req.query.id ? parseInt(req.query.id, 10) : 0;
    const request = new sql.Request();
    request.input('id_chuyen_bien', sql.Int, id);
    const result = await request.execute('ThongTinChuyenBienByID');
    console.log('Result recordsets:', result.recordsets);
    const sets = Array.isArray(result.recordsets) ? result.recordsets : [];
    const chuyenBien = (sets[0] && sets[0][0]) ? sets[0][0] : {};
    const thuThaLuoi = sets[1] || [];
    const khaiThac = sets[2] || [];
    const loaiQuy = sets[3] || [];
    const truyenTai = sets[4] || [];

    // Nạp LoaiKhaiThac bằng TVP
    if (Array.isArray(khaiThac) && khaiThac.length > 0) {
      const idsTable = new sql.Table();
      idsTable.columns.add('id', sql.Int);
      khaiThac.forEach(it => idsTable.rows.add(it.ID || 0));
      const r = new sql.Request();
      r.input('ids', idsTable);
      const rr = await r.execute('LoaiKhaiThac');
      const rows = rr.recordset || [];
      const grouped = rows.reduce((acc, row) => {
        const key = row.id_khai_thac ?? row.ID_KHAI_THAC ?? row.id_khaiThac;
        if (!acc[key]) acc[key] = [];
        acc[key].push(row);
        return acc;
      }, {});
      khaiThac.forEach(it => {
        const parentId = it.ID ?? it.id ?? it.ID_KHAI_THAC ?? it.id_khai_thac ?? it.id_khaiThac;
        it.loai_danh_bat = grouped[parentId] || [];
      });
    }

    // Nạp LoaiTruyenTai bằng TVP
    if (Array.isArray(truyenTai) && truyenTai.length > 0) {
      const idsTable2 = new sql.Table();
      idsTable2.columns.add('id', sql.Int);
      truyenTai.forEach(it => idsTable2.rows.add(it.ID || 0));
      const r2 = new sql.Request();
      r2.input('ids', idsTable2);
      const rr2 = await r2.execute('LoaiTruyenTai');
      const rows2 = rr2.recordset || [];
      const grouped2 = rows2.reduce((acc, row) => {
        const key = row.id_truyen_tai ?? row.ID_TRUYEN_TAI ?? row.id_truyenTai;
        if (!acc[key]) acc[key] = [];
        acc[key].push(row);
        return acc;
      }, {});
      truyenTai.forEach(it => {
        const parentId = it.ID ?? it.id ?? it.ID_TRUYEN_TAI ?? it.id_truyen_tai ?? it.id_truyenTai;
        it.loai_danh_bat = grouped2[parentId] || [];
      });
    }

    chuyenBien.thuThaLuoi = thuThaLuoi;
    chuyenBien.khaiThac = khaiThac;
    chuyenBien.loaiQuy = loaiQuy;
    chuyenBien.truyenTai = truyenTai;

    // Log loaiQuy data for debugging (prints the array of endangered species rows)
    try {
      console.log('loaiQuy data:', JSON.stringify(loaiQuy || [], null, 2));
    } catch (e) {
      console.log('loaiQuy (raw):', loaiQuy);
    }

    res.json({ success: true, data: chuyenBien });
  } catch (error) {
    console.error('Error in /api/thong-tin-chuyen-bien:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});


// API: lấy danh sách chuyến biển theo năm và id tàu
app.get('/api/chuyen-bien-by-year-ship', async (req, res) => {
  try {
    const idShip = req.query.id_ship ? String(req.query.id_ship).trim() : '';
    const year = req.query.year ? parseInt(req.query.year, 10) : new Date().getFullYear();

    if (!idShip) {
      return res.status(400).json({ success: false, message: 'Thiếu id_ship' });
    }

    const request = new sql.Request();
    request.input('id_ship', sql.NVarChar, idShip);
    request.input('year', sql.Int, year);

    // Query để lấy chuyến biển của tàu trong năm đó
    const query = `
      SELECT 
        cb.id,
        cb.id_ship,
        cb.thoi_gian_di,
        cb.thoi_gian_ve,
        cb.thoi_gian_nop,
        cb.cang_di,
        cb.cang_ve,
        cb.vao_so,
        cb.ngay_nhatky,
        YEAR(cb.thoi_gian_di) as nam_di,
        YEAR(cb.thoi_gian_ve) as nam_ve
      FROM dbo.chuyen_bien cb
      WHERE cb.id_ship = @id_ship
        AND (YEAR(cb.thoi_gian_di) = @year OR YEAR(cb.thoi_gian_ve) = @year)
      ORDER BY cb.thoi_gian_di DESC
    `;

    const result = await request.query(query);
    res.json({ success: true, data: result.recordset || [] });
  } catch (error) {
    console.error('Error in /api/chuyen-bien-by-year-ship:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
  }
});

app.get('/api/login', (req, res) => {
  const { username, password } = req.query;
  const request = new sql.Request();
  request.input('username', sql.NVarChar, username);
  request.input('password', sql.NVarChar, password);
  // Giả sử có bảng Users với cột username, password
  request.query('SELECT * FROM accounts WHERE name_user = @username AND pass_word = @password', (err, result) => {
    if (err) {
      console.error('DB error:', err);
      return res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
    }
    if (result.recordset.length > 0) {
      res.json({ success: true, message: 'Đăng nhập thành công', user: result.recordset[0] });
    } else {
      res.json({ success: false, message: 'Tên đăng nhập hoặc mật khẩu không đúng' });
    }
  });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`App listening at http://0.0.0.0:${port}`);
});



