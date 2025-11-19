"# Hệ Thống Quản Lý Tàu Biển (BAC)

Hệ thống quản lý và giám sát tàu biển với tracking GPS real-time, quản lý chuyến biển, và báo cáo thống kê.

## 📚 Tài Liệu

- **[Tổng Quan Kiến Trúc](./docs/ARCHITECTURE_OVERVIEW.md)** - Sơ đồ tổng quan hệ thống
- **[Kiến Trúc Chi Tiết](./docs/SYSTEM_ARCHITECTURE.md)** - Tài liệu kiến trúc đầy đủ
- **[Hướng Dẫn Triển Khai](./map-sever/DEPLOYMENT_GUIDE.md)** - Deploy lên Windows Server 2019
- **[Thiết Kế UI](./my-app/docs/UI-Design-Report.md)** - Báo cáo thiết kế giao diện

## 🏗️ Kiến Trúc Hệ Thống

Hệ thống được thiết kế theo mô hình microservices với các thành phần chính:

1. **API Gateway** - Express.js server (Port 3000)
2. **Device Service** - Xử lý dữ liệu thiết bị và vị trí GPS
3. **User Service** - Quản lý người dùng và phân quyền
4. **Map Service** - Xử lý bản đồ và lịch sử hành trình
5. **Report Service** - Báo cáo và thống kê
6. **Database** - MS SQL Server
7. **Message Queue** - WebSocket cho real-time updates
8. **Monitoring** - Giám sát và logging (đang phát triển)

Xem [sơ đồ kiến trúc chi tiết](./docs/ARCHITECTURE_OVERVIEW.md).

## 🚀 Các Thành Phần

### Map Server (`/map-sever`)
Backend API server xử lý:
- Quản lý thông tin tàu và chuyến biển
- GPS tracking và lịch sử vị trí
- Tạo báo cáo DOCX/PDF
- WebSocket real-time updates

**Công nghệ:** Node.js, Express, MS SQL Server, WebSocket

### Web App (`/my-app`)
Frontend application với:
- Bản đồ tương tác (OpenLayers)
- Hiển thị vị trí tàu real-time
- Quản lý chuyến biển
- Xuất báo cáo

**Công nghệ:** Vanilla JS, OpenLayers, Bootstrap 5, Vite

## 🛠️ Cài Đặt

### Backend (Map Server)
```bash
cd map-sever
npm install
# Cấu hình config.env với thông tin database
node app.js
```

### Frontend (Web App)
```bash
cd my-app
npm install
npm start
```

## 📋 Tính Năng

### ✅ Đã Triển Khai
- Tracking GPS real-time
- Hiển thị bản đồ tương tác
- Quản lý tàu và chuyến biển
- Tạo báo cáo DOCX/PDF
- WebSocket updates
- Export dữ liệu

### 🔄 Đang Phát Triển
- Hệ thống phân quyền nâng cao (RBAC)
- Analytics và thống kê chi tiết
- Map service backend APIs
- Monitoring và logging

### 🔮 Kế Hoạch Tương Lai
- Message queue (Redis/RabbitMQ)
- Caching layer (Redis)
- Mobile app
- Predictive analytics
- Auto-scaling

## 🔒 Bảo Mật

- Token-based authentication
- CORS configuration
- Input validation
- SQL injection protection (parameterized queries)

## 📊 Database

MS SQL Server với các bảng chính:
- Ships: Thông tin tàu
- Voyages: Chuyến biển
- Locations: GPS tracking data
- Users: Người dùng (đang phát triển)

## 🤝 Đóng Góp

Xem [SYSTEM_ARCHITECTURE.md](./docs/SYSTEM_ARCHITECTURE.md) để hiểu rõ kiến trúc hệ thống trước khi đóng góp.

## 📄 License

(Thêm thông tin license nếu có)
" 
