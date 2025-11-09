// JS for /add-ship
(function () {
  const form = document.getElementById('add-ship-form');
  const alertPlaceholder = document.getElementById('alert-placeholder');
  const resultEl = document.getElementById('result');
  const submitBtn = document.getElementById('submit-btn');

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
      const res = await fetch('/api/add-ship', {
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
