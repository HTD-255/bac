import { API_BASE_URL,WS} from './config.js';
// JS for /add-ship
(function () {
  const form = document.getElementById('add-ship-form');
  const alertPlaceholder = document.getElementById('alert-placeholder');
  const resultEl = document.getElementById('result');
  const submitBtn = document.getElementById('submit-btn');
  const fillSampleBtn = document.getElementById('fill-sample-btn');

  // Sample data
  const sampleData = {
    id: 'QN12345',
    ship_name: 'Tàu Cá Minh Phát',
    id_chu_tau: 1,
    ten_chu_tau: 'Nguyễn Văn A',
    ten_thuyen_truong: 'Trần Văn B',
    so_dang_ki_tau: 'QN-12345-BC',
    chieu_dai_tau: '18.5',
    tong_cong_suat: '45.6',
    so_giay_phep: 'GP-2024-001',
    thoi_han: '2025-12-31T23:59',
    nghe_phu_1: 'Khai thác hải sản',
    nghe_phu_2: 'Chuyên chở hàng hóa',
    chieu_dai_vang_cau: '25.3',
    so_luoi_cau: '3',
    chieu_dai_luoi_vay: '120.5',
    chieu_cao_luoi_vay: '8.2',
    chu_vi_luoi_chup: '180.0',
    chieu_cao_luoi_chup: '12.5',
    chieu_dai_gieng_phao: '15.8',
    chieu_dai_luoi_keo: '95.6',
    new_latidue: '16.669116',
    new_longtidue: '112.717049',
    time_update: '2025-11-16T10:30',
    ghi_chu: 'Tàu cá có đầy đủ giấy phép khai thác'
  };

  // Fill sample data button
  if (fillSampleBtn) {
    fillSampleBtn.addEventListener('click', function() {
      let count = 0;
      for (const [key, value] of Object.entries(sampleData)) {
        const field = document.getElementById(key);
        if (field) {
          field.value = value;
          count++;
        }
      }
      showAlert(`✓ Đã điền ${count} trường dữ liệu mẫu`, 'success');
      console.log('Filled sample data:', sampleData);
    });
  }

  // Fetch ship data button
  const fetchShipBtn = document.getElementById('fetch-ship-btn');
  const updateBtn = document.getElementById('update-btn');
  const deleteBtn = document.getElementById('delete-btn');
  const clearBtn = document.getElementById('clear-btn');
  let currentShipId = null;
  if (fetchShipBtn) {
    fetchShipBtn.addEventListener('click', async function() {
      const shipId = document.getElementById('id').value.trim();
      if (!shipId) {
        showAlert('Vui lòng nhập ID tàu trước.', 'warning');
        return;
      }

      fetchShipBtn.disabled = true;
      try {
        const res = await fetch(`${API_BASE_URL}/api/ship-info?id=${encodeURIComponent(shipId)}`);
        if (!res.ok) {
          throw new Error(`Không tìm thấy tàu với ID: ${shipId}`);
        }
        const data = await res.json();
        if (!Array.isArray(data) || data.length === 0) {
          throw new Error(`Không có dữ liệu cho tàu ID: ${shipId}`);
        }

        const ship = data[0];
        
        // Map API fields to form fields
        const fieldMap = {
          'id': 'id',
          'ship_name': 'ship_name',
          'id_chu_tau': 'id_chu_tau',
          'ten_chu_tau': 'ten_chu_tau',
          'ten_thuyen_truong': 'ten_thuyen_truong',
          'so_dang_ki_tau': 'so_dang_ki_tau',
          'chieu_dai_tau': 'chieu_dai_tau',
          'tong_cong_suat': 'tong_cong_suat',
          'so_giay_phep': 'so_giay_phep',
          'thoi_han': 'thoi_han',
          'nghe_phu_1': 'nghe_phu_1',
          'nghe_phu_2': 'nghe_phu_2',
          'chieu_dai_vang_cau': 'chieu_dai_vang_cau',
          'so_luoi_cau': 'so_luoi_cau',
          'chieu_dai_luoi_vay': 'chieu_dai_luoi_vay',
          'chieu_cao_luoi_vay': 'chieu_cao_luoi_vay',
          'chu_vi_luoi_chup': 'chu_vi_luoi_chup',
          'chieu_cao_luoi_chup': 'chieu_cao_luoi_chup',
          'chieu_dai_gieng_phao': 'chieu_dai_gieng_phao',
          'chieu_dai_luoi_keo': 'chieu_dai_luoi_keo',
          'new_latidue': 'new_latidue',
          'new_longtidue': 'new_longtidue',
          'time_update': 'time_update',
          'ghi_chu': 'ghi_chu'
        };

        // Update form fields
        for (const [apiField, formField] of Object.entries(fieldMap)) {
          const field = document.getElementById(formField);
          if (field && ship[apiField] !== undefined && ship[apiField] !== null) {
            let value = ship[apiField];
            
            // Convert ISO datetime to datetime-local format
            if ((formField === 'thoi_han' || formField === 'time_update') && value) {
              try {
                const date = new Date(value);
                if (!isNaN(date)) {
                  value = date.toISOString().slice(0, 16);
                }
              } catch (e) {}
            }
            
            field.value = value;
          }
        }

        // Show update and delete buttons, hide submit button
        currentShipId = shipId;
        submitBtn.style.display = 'none';
        updateBtn.style.display = 'block';
        deleteBtn.style.display = 'block';

        showAlert(`✓ Đã tải dữ liệu tàu ${shipId}`, 'success');
      } catch (err) {
        console.error(err);
        showAlert('Lỗi: ' + (err.message || err), 'danger');
      } finally {
        fetchShipBtn.disabled = false;
      }
    });
  }

  // Update ship data
  if (updateBtn) {
    updateBtn.addEventListener('click', async function() {
      if (!currentShipId) {
        showAlert('Không tìm thấy ID tàu để cập nhật.', 'warning');
        return;
      }

      updateBtn.disabled = true;
      try {
        const payload = toJson(form);
        const asNumber = (v) => (v === undefined || v === null || v === '') ? undefined : Number(v);
        const asInt = (v) => (v === undefined || v === null || v === '') ? undefined : parseInt(v, 10);

        payload.id_chu_tau = asInt(payload.id_chu_tau);
        payload.tong_cong_suat = asNumber(payload.tong_cong_suat);
        payload.chieu_dai_vang_cau = asNumber(payload.chieu_dai_vang_cau);
        payload.so_luoi_cau = asInt(payload.so_luoi_cau);
        payload.chieu_dai_luoi_vay = asNumber(payload.chieu_dai_luoi_vay);
        payload.chieu_cao_luoi_vay = asNumber(payload.chieu_cao_luoi_vay);
        payload.chu_vi_luoi_chup = asNumber(payload.chu_vi_luoi_chup);
        payload.chieu_cao_luoi_chup = asNumber(payload.chieu_cao_luoi_chup);
        payload.chieu_dai_gieng_phao = asNumber(payload.chieu_dai_gieng_phao);
        payload.chieu_dai_luoi_keo = asNumber(payload.chieu_dai_luoi_keo);
        payload.new_latidue = asNumber(payload.new_latidue);
        payload.new_longtidue = asNumber(payload.new_longtidue);
        payload.chieu_dai_tau = (payload.chieu_dai_tau !== undefined && payload.chieu_dai_tau !== '') ? String(payload.chieu_dai_tau) : undefined;

        if (payload.thoi_han) {
          const d = new Date(payload.thoi_han);
          if (!isNaN(d)) payload.thoi_han = d.toISOString();
        }
        if (payload.time_update) {
          const d2 = new Date(payload.time_update);
          if (!isNaN(d2)) payload.time_update = d2.toISOString();
        }

        const res = await fetch(`${API_BASE_URL}/api/ship/${currentShipId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const t = await res.text();
          throw new Error(`Server error: ${res.status} ${t}`);
        }

        const json = await res.json();
        showAlert('✓ Đã cập nhật thông tin tàu thành công.', 'success');
        resultEl.innerHTML = `<pre style="white-space:pre-wrap;">${JSON.stringify(json, null, 2)}</pre>`;
        setTimeout(() => { window.location.href = '/'; }, 1500);
      } catch (err) {
        console.error(err);
        showAlert('Lỗi cập nhật: ' + (err.message || err), 'danger');
      } finally {
        updateBtn.disabled = false;
      }
    });
  }

  // Delete ship
  if (deleteBtn) {
    deleteBtn.addEventListener('click', async function() {
      if (!currentShipId) {
        showAlert('Không tìm thấy ID tàu để xóa.', 'warning');
        return;
      }

      if (!confirm(`Bạn chắc chắn muốn xóa tàu ${currentShipId}? Hành động này không thể hoàn tác!`)) {
        return;
      }

      deleteBtn.disabled = true;
      try {
        const res = await fetch(`${API_BASE_URL}/api/ship/${currentShipId}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!res.ok) {
          const t = await res.text();
          throw new Error(`Server error: ${res.status} ${t}`);
        }

        showAlert('✓ Đã xóa thông tin tàu thành công.', 'success');
        resultEl.innerHTML = '<p>Tàu đã được xóa khỏi hệ thống.</p>';
        setTimeout(() => { window.location.href = '/'; }, 1500);
      } catch (err) {
        console.error(err);
        showAlert('Lỗi xóa: ' + (err.message || err), 'danger');
      } finally {
        deleteBtn.disabled = false;
      }
    });
  }

  // Clear form
  if (clearBtn) {
    clearBtn.addEventListener('click', function() {
      form.reset();
      form.classList.remove('was-validated');
      currentShipId = null;
      updateBtn.style.display = 'none';
      deleteBtn.style.display = 'none';
      submitBtn.style.display = 'block';
      resultEl.textContent = '';
      showAlert('✓ Đã xóa dữ liệu form.', 'info');
    });
  }

  function showAlert(message, type = 'success') {
    alertPlaceholder.innerHTML = `
      <div class="alert alert-${type} alert-dismissible" role="alert">
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      </div>`;
  }

  function toJson(formEl) {
    const fd = new FormData(formEl);
    const obj = {};
    for (const [k, v] of fd.entries()) {
      // convert empty strings to undefined to reduce payload noise
      obj[k] = v === '' ? undefined : v;
    }
    return obj;
  }

  async function postShip(payload) {
    // POST JSON to /api/add-ship
    try {
      submitBtn.disabled = true;
      const res = await fetch(`${API_BASE_URL}/api/add-ship`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(`Server error: ${res.status} ${t}`);
      }
      const json = await res.json();
      return json;
    } finally {
      submitBtn.disabled = false;
    }
  }

  form.addEventListener('submit', async function (ev) {
    ev.preventDefault();
    form.classList.add('was-validated');

    if (!form.checkValidity()) {
      showAlert('Vui lòng hoàn tất các trường bắt buộc.', 'warning');
      return;
    }

    const payload = toJson(form);
    // Normalize fields to match dbo.ship types
    const asNumber = (v) => (v === undefined || v === null || v === '') ? undefined : Number(v);
    const asInt = (v) => (v === undefined || v === null || v === '') ? undefined : parseInt(v, 10);

    // numeric conversions
    payload.id_chu_tau = asInt(payload.id_chu_tau);
    payload.tong_cong_suat = asNumber(payload.tong_cong_suat);
    payload.chieu_dai_vang_cau = asNumber(payload.chieu_dai_vang_cau);
    payload.so_luoi_cau = asInt(payload.so_luoi_cau);
    payload.chieu_dai_luoi_vay = asNumber(payload.chieu_dai_luoi_vay);
    payload.chieu_cao_luoi_vay = asNumber(payload.chieu_cao_luoi_vay);
    payload.chu_vi_luoi_chup = asNumber(payload.chu_vi_luoi_chup);
    payload.chieu_cao_luoi_chup = asNumber(payload.chieu_cao_luoi_chup);
    payload.chieu_dai_gieng_phao = asNumber(payload.chieu_dai_gieng_phao);
    payload.chieu_dai_luoi_keo = asNumber(payload.chieu_dai_luoi_keo);
    payload.new_latidue = asNumber(payload.new_latidue);
    payload.new_longtidue = asNumber(payload.new_longtidue);
    payload.chieu_dai_tau = (payload.chieu_dai_tau !== undefined && payload.chieu_dai_tau !== '') ? String(payload.chieu_dai_tau) : undefined;

    // datetime-local -> ISO
    if (payload.thoi_han) {
      const d = new Date(payload.thoi_han);
      if (!isNaN(d)) payload.thoi_han = d.toISOString();
    }
    if (payload.time_update) {
      const d2 = new Date(payload.time_update);
      if (!isNaN(d2)) payload.time_update = d2.toISOString();
    }

    resultEl.textContent = 'Đang gửi...';
    try {
  const r = await postShip(payload);
      showAlert('Đã lưu thông tin tàu thành công.', 'success');
      resultEl.innerHTML = `<pre style="white-space:pre-wrap;">${JSON.stringify(r, null, 2)}</pre>`;
      // Optionally redirect back to / after a short delay
      setTimeout(() => { window.location.href = '/'; }, 1000);
    } catch (err) {
      console.error(err);
      showAlert('Lưu thất bại: ' + (err.message || err), 'danger');
      resultEl.textContent = '';
    }
  });
})();
