# Báo cáo thiết kế UI — Ứng dụng bản đồ tàu biển

Ngày: 2025-11-08

Tác giả: (tự động sinh)

---

## 1. Mục tiêu tài liệu
Tài liệu này mô tả thiết kế giao diện người dùng (UI) cho dự án bản đồ tàu biển (my-app). Mục tiêu:
- Ghi lại cấu trúc giao diện, các thành phần chính, hành vi tương tác và các quy ước về style.
- Là tài liệu tham chiếu cho developer và QA khi phát triển, test và tinh chỉnh UI.
- Nêu ra các ràng buộc hiện có trong codebase và ghi chú về vị trí file để dễ sửa đổi.

## 2. Tổng quan ứng dụng
Ứng dụng là bản đồ biển dùng OpenLayers để hiển thị vị trí tàu, hải trình và các dữ liệu chuyến biển. Thành phần chính:
- Bản đồ chính (OpenLayers) với các layer tile và các vector layer cho tàu, đường đi, và biên giới Việt Nam.
- Modal hiển thị chi tiết tàu / chuyến biển (bootstrap modal).
- Bảng danh sách tàu / chuyến biển được hiển thị trong modal điều khiển.
- Một trang `login.html` đơn giản cho việc chứng thực (cơ bản).

### Công nghệ liên quan
- OpenLayers (map, VectorLayer, Style, Icon, Circle, Overlay)
- Bootstrap 5 (modal, button, layout)
- Vanilla JS modules (ES modules): `js/main.js`, `js/controll.js`, `js/login.js`
- Dữ liệu: `data/species.json`, `data/vn_geo.json`
- Tài nguyên tĩnh: `public/icon/*.svg`

## 3. Người dùng mục tiêu và kịch bản sử dụng
- Quản trị viên hải sản/giám sát: quan sát tàu, lọc theo trạng thái, mở chi tiết chuyến biển.
- Nhân viên vận hành: tìm kiếm theo id tàu (bao gồm cả tàu không hoạt động), tải nhật ký chuyến biển, xem đường đi.

## 4. Nguyên tắc thiết kế
- Tập trung vào readability: thông tin quan trọng (vị trí tàu, SOS) phải dễ nhận diện.
- Giữ giao diện trực quan, không chiếm nhiều diện tích bản đồ (icon không quá to).
- Layer hiển thị phải có thứ tự hợp lý: điểm tàu > đường đi > biên giới (để không che mất điểm).
- Tương thích với nhiều zoom: kích thước marker thay đổi theo zoom.

## 5. Kiến trúc thông tin (Pages / Views)
- Map view (index.html)
  - Thanh công cụ (layer chọn tileset, nút toggle lọc tàu)
  - Bản đồ (div#map) — hiển thị chính
  - Modal thông tin tàu (modal-info)
  - Modal điều khiển / danh sách tàu (modal-controll)
  - Modal chi tiết chuyến biển (modal-detail)
- Login (login.html)
  - Form username/password (lưu token vào localStorage)

## 6. Thành phần UI chính (Components)
1. Map và Layers
   - Tile layer: base map (microsoft tiles)
   - `vectorLayerShip` (VectorLayer): chứa Feature điểm tàu
     - Z-index: cao (đã đặt `vectorLayerShip.setZIndex(20000)`) để luôn hiển thị trên cùng
     - Style: layer-level `shipStyleFunction(feature, resolution)` để tính kích thước và màu theo `statuss` và zoom.
   - `vectorLayerHaiTrinh`: hải trình (LineString + điểm)
   - `vectorLayerVn`: biên giới VN (dashed stroke)

2. Markers / Styles
   - Non-SOS ships: circle marker
     - Radius = clamp(round(zoom * 1.2), 4..20)
     - Màu theo `statuss`: 1 -> green, 2 -> red, default -> red
   - SOS ships: hiện là icon static `public/icon/sos.svg`
     - Kích thước nằm trong cùng quy tắc với non-SOS bằng cách tính scale từ radius
     - Không còn nhấp nháy (theo yêu cầu hiện tại)

3. Modals và Bảng
   - `modal-controll`: chứa danh sách tàu (bảng) với chức năng tìm kiếm (đã ánh xạ lên API `DanhSachTau`, `TimTauTheoId`)
   - `modal-info`: hiển thị thông tin chi tiết tàu (các trường, nút tải nhật ký, xem đường đi)
   - `modal-detail`: tabbed content với 3 tab (Thu/Thả, Loài quý, Bản truyền tải)

4. Popup overlay
   - Khi click vào điểm hải trình hiển thị popup nhỏ với thông tin (kinh/vĩ, thời gian, một vài trường dữ liệu)

5. Buttons / Controls
   - Toggle ship filter button (`#toggle-ships-btn`) cycles qua filter null->1->2->null
   - Layer selector buttons (`.layer-btn`) thay đổi tileset

## 7. Hành vi & Luồng tương tác (UX flows)
- Tìm kiếm tàu bằng ID
  - Form gắn `TimTauTheoId` để tìm cả tàu không hoạt động (kết quả hiển thị trong modal-list)
- Click vào marker tàu
  - Mở `modal-info` (gọi API `/api/ship-info?id=...`) và hiển thị thông tin
  - Click nút Xem đường đi -> gọi `duongDiChuyenBien(idChuyenBien)` vẽ hải trình
- SOS handling
  - Tất cả feature có `sos===1` luôn hiển thị (bỏ qua filter)
  - Hiển thị icon SOS tĩnh
- Layer ordering
  - `vectorLayerShip` đặt z-index cao để không bị các layer khác che

## 8. Visual / Branding
- Màu chính cho markers:
  - Hoạt động (status 1): rgba(0,200,0,0.8) (xanh)
  - Cập bến / đỏ (status 2): rgba(255,60,60,0.9)
  - SOS: sử dụng `sos.svg` (màu đỏ biểu tượng)
- Stroke cho circle markers: white outline để nổi bật trên nền map
- Icons: lưu trong `public/icon/` (ví dụ `documnet.svg`, `map_maker.svg`, `sos.svg`)

## 9. Accessibility
- Modals: keyboard-focusable (Bootstrap modals) và có nút đóng rõ ràng
- Buttons: nên có `title` attributes (đã thêm cho `toggle-ships-btn`)
- Color: đảm bảo trạng thái không phụ hoàn toàn vào màu sắc (thêm các biểu tượng/nhãn khi cần thiết)

## 10. Data flow & API
- Danh sách tàu: `DanhSachTau` (fetch toàn bộ danh sách và cache vào `window.__ALL_SHIPS_CACHE`)
- Tìm kiếm theo ID: `TimTauTheoId` (server-side search, trả về cả inactive)
- Chi tiết chuyến biển: `/api/thong-tin-chuyen-bien?id=`
- Hải trình: `Locations(idChuyenBien)`
- Dữ liệu loài: `data/species.json` được load và lưu vào `window.__SPECIES_MAP` để hiển thị tên loài

## 11. Asset locations (quan trọng để thay đổi UI)
- `index.html` — entry page, chứa map container và modal templates
- `login.html` — login form
- `js/main.js` — phần lớn UI logic, map, styles, render bảng/modal
- `js/controll.js` — wrapper các API gọi server
- `data/species.json`, `data/vn_geo.json` — dữ liệu hỗ trợ
- `public/icon/sos.svg` — icon SOS (cần tồn tại)

## 12. Implementation notes & code pointers
- Map style logic: `shipStyleFunction` (được gắn vào `vectorLayerShip` via `vectorLayerShip.setStyle(shipStyleFunction)`). Đây là nơi chỉnh màu, kích thước và SOS icon.
- Hiện `vectorLayerShip.setZIndex(20000)` được đặt để đảm bảo điểm tàu nằm trên cùng.
- Nếu cần thay đổi kích thước SOS icon, chỉnh biến `imgPx` (bình thường 30) hoặc công thức scale trong `shipStyleFunction`.
- Để đổi behavior SOS (ví dụ bật nhấp nháy lại), sẽ cần thêm `pulseValue` và animation loop đã từng có trong lịch sử file `main.js`.

## 13. Testing checklist (UI)
- [ ] Mở trang chính, verify map loads và tile layer hiển thị
- [ ] Vẽ 1 feature tàu test (status 1) và verify marker màu xanh, kích thước thay đổi theo zoom
- [ ] Thêm feature có `sos:1` và verify icon SOS xuất hiện và có kích thước tương đương marker
- [ ] Kiểm tra toggle filter (null->1->2) hoạt động và SOS luôn visible
- [ ] Mở modal-info bằng cách click marker và xác nhận dữ liệu hiển thị tương ứng với API
- [ ] Kiểm tra các bảng trong `modal-detail` (Thu/Thả, Loài quý, Bản truyền tải) hiển thị đúng, không che overlay loading

## 14. Performance & tối ưu
- Không tạo style mới cho mỗi feature nếu không cần: dùng layer-level style function với cache (`__shipStyleCache`) như hiện tại để giảm overhead.
- Khi có nhiều features, consider clustering hoặc dynamic sampling nếu map chậm.
- Tải species.json một lần và tái sử dụng (đã làm qua `window.__SPECIES_MAP`).

## 15. Security & privacy
- Login hiện tại lưu token trong `localStorage.jwt` — chấp nhận được cho demo nhưng cân nhắc bảo mật (HttpOnly cookie) cho production.
- WebSocket kết nối `ws://localhost:8080` — dùng `wss://` trong môi trường production.

## 16. Next steps & đề xuất
- Thêm control UI để bật/tắt hiển thị SOS hoặc tinh chỉnh kích thước icon live (slider nhỏ) — hữu ích cho vận hành.
- Thêm unit/integration tests cho các hàm rendering table và style function.
- Thêm fallback (circle) nếu `sos.svg` không load.
- Xem xét clustering markers ở zoom thấp để tránh quá nhiều điểm chồng chéo.

---

### Appendix: Quick edit pointers
- Thay đổi màu marker: sửa `fillColor` trong `shipStyleFunction`.
- Đổi scale SOS: sửa `imgPx` hoặc công thức `iconScaleFromRadius` trong `shipStyleFunction`.
- Reorder layers: đảm bảo `vectorLayerShip.setZIndex(...)` có giá trị cao hơn các layer khác.

---

Tệp này được tạo tự động. Nếu bạn muốn bản báo cáo bằng PDF hoặc DOCX, tôi có thể tạo và thêm file đó vào repo.
