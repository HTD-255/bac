# Tài Liệu Hệ Thống - Index

Chào mừng đến với tài liệu hệ thống quản lý tàu biển (BAC). Trang này giúp bạn tìm thông tin cần thiết.

## 📖 Bắt Đầu Nhanh

### Tôi muốn...

#### ...hiểu tổng quan hệ thống
👉 Đọc [Tổng Quan Kiến Trúc](./ARCHITECTURE_OVERVIEW.md)
- Sơ đồ khối đơn giản
- Danh sách các thành phần chính
- Công nghệ sử dụng
- Trạng thái triển khai

#### ...hiểu chi tiết từng thành phần
👉 Đọc [Kiến Trúc Chi Tiết](./SYSTEM_ARCHITECTURE.md)
- Mô tả đầy đủ 8 thành phần chính
- API endpoints
- Cấu trúc database
- Roadmap phát triển
- Khuyến nghị về bảo mật và scalability

#### ...hiểu luồng dữ liệu và quy trình
👉 Đọc [Sơ Đồ Luồng Dữ Liệu](./DATA_FLOW_DIAGRAMS.md)
- Sequence diagrams cho 10+ quy trình
- Real-time GPS tracking
- Authentication flow
- Report generation
- WebSocket communication

#### ...triển khai hệ thống
👉 Đọc [Hướng Dẫn Triển Khai](../map-sever/DEPLOYMENT_GUIDE.md)
- Deploy lên Windows Server 2019 + IIS
- Cài đặt Node.js và IISNode
- Cấu hình database
- Production checklist

#### ...hiểu thiết kế giao diện
👉 Đọc [Báo Cáo Thiết Kế UI](../my-app/docs/UI-Design-Report.md)
- Thiết kế bản đồ
- Components UI
- OpenLayers integration
- Bootstrap styling

---

## 📚 Tài Liệu Theo Chủ Đề

### Kiến Trúc & Thiết Kế

| Tài liệu | Mô tả | Độ chi tiết |
|----------|-------|-------------|
| [ARCHITECTURE_OVERVIEW.md](./ARCHITECTURE_OVERVIEW.md) | Tổng quan kiến trúc hệ thống | ⭐ Cơ bản |
| [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md) | Kiến trúc chi tiết toàn bộ hệ thống | ⭐⭐⭐ Chi tiết |
| [DATA_FLOW_DIAGRAMS.md](./DATA_FLOW_DIAGRAMS.md) | Sơ đồ luồng dữ liệu | ⭐⭐ Trung bình |

### Triển Khai & Vận Hành

| Tài liệu | Mô tả | Người dùng |
|----------|-------|-----------|
| [DEPLOYMENT_GUIDE.md](../map-sever/DEPLOYMENT_GUIDE.md) | Hướng dẫn deploy production | DevOps, Admin |

### Phát Triển

| Tài liệu | Mô tả | Người dùng |
|----------|-------|-----------|
| [UI-Design-Report.md](../my-app/docs/UI-Design-Report.md) | Thiết kế UI/UX | Frontend Dev |

---

## 🏗️ Sơ Đồ Kiến Trúc Tổng Quan

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENTS                               │
│  Web Browser    Mobile App    External APIs                 │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                     API GATEWAY                              │
│  Express.js Server (Port 3000)                               │
│  • Authentication    • CORS    • Rate Limiting               │
└────────────────────┬────────────────────────────────────────┘
                     │
          ┌──────────┴──────────┬──────────┬──────────┐
          ▼                     ▼          ▼          ▼
┌─────────────────┐  ┌──────────────┐  ┌─────────┐  ┌──────────┐
│ Device Service  │  │ User Service │  │   Map   │  │  Report  │
│ GPS Tracking    │  │ RBAC System  │  │ Service │  │  Service │
└────────┬────────┘  └──────┬───────┘  └────┬────┘  └─────┬────┘
         │                  │               │             │
         └──────────┬───────┴───────────────┴─────────────┘
                    │
         ┌──────────┴──────────┬──────────────────┐
         ▼                     ▼                  ▼
┌─────────────────┐  ┌──────────────────┐  ┌─────────────┐
│  MS SQL Server  │  │  File Storage    │  │  WebSocket  │
│  Database       │  │  Templates/PDFs  │  │  Real-time  │
└─────────────────┘  └──────────────────┘  └─────────────┘
```

---

## 🔍 Tìm Kiếm Nhanh

### API Endpoints
- Xem trong [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md#1-api-gateway-layer)

### Database Schema
- Xem trong [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md#41-database-ms-sql-server)

### WebSocket Events
- Xem trong [DATA_FLOW_DIAGRAMS.md](./DATA_FLOW_DIAGRAMS.md#6-luồng-websocket-real-time-updates)

### Technology Stack
- Xem trong [ARCHITECTURE_OVERVIEW.md](./ARCHITECTURE_OVERVIEW.md#công-nghệ-sử-dụng)

### Security
- Xem trong [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md#bảo-mật)

### Future Roadmap
- Xem trong [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md#roadmap--phát-triển-tiếp-theo)

---

## 📊 Các Thành Phần Chính

### 1. API Gateway ✅
- **Trạng thái**: Đã triển khai
- **Công nghệ**: Express.js
- **Tài liệu**: [Chi tiết](./SYSTEM_ARCHITECTURE.md#1-api-gateway-layer)

### 2. Device Data Processing Service ✅
- **Trạng thái**: Đã triển khai
- **Chức năng**: GPS tracking, ship management
- **Tài liệu**: [Chi tiết](./SYSTEM_ARCHITECTURE.md#21-device-data-processing-service)

### 3. User Management Service 🔄
- **Trạng thái**: Đang phát triển
- **Chức năng**: Authentication, RBAC
- **Tài liệu**: [Chi tiết](./SYSTEM_ARCHITECTURE.md#22-user-management--authorization-service)

### 4. Map & Route History Service ✅🔄
- **Trạng thái**: Frontend hoàn thiện, Backend đang phát triển
- **Công nghệ**: OpenLayers
- **Tài liệu**: [Chi tiết](./SYSTEM_ARCHITECTURE.md#23-map--route-history-service)

### 5. Report & Statistics Service ✅
- **Trạng thái**: Đã triển khai cơ bản
- **Công nghệ**: Puppeteer, LibreOffice
- **Tài liệu**: [Chi tiết](./SYSTEM_ARCHITECTURE.md#24-report--statistics-service)

### 6. Database & Storage ✅
- **DBMS**: MS SQL Server
- **Tài liệu**: [Chi tiết](./SYSTEM_ARCHITECTURE.md#41-database-ms-sql-server)

### 7. Message Queue ✅🔮
- **Hiện tại**: WebSocket
- **Tương lai**: Redis Pub/Sub, RabbitMQ
- **Tài liệu**: [Chi tiết](./SYSTEM_ARCHITECTURE.md#3-message-queue-layer)

### 8. Monitoring & Logging 🔮
- **Trạng thái**: Kế hoạch tương lai
- **Tài liệu**: [Chi tiết](./SYSTEM_ARCHITECTURE.md#25-monitoring--logging-module)

**Chú thích:**
- ✅ Đã triển khai
- 🔄 Đang phát triển
- 🔮 Kế hoạch tương lai

---

## 🎯 Workflow Đọc Tài Liệu

### Cho Developer Mới
1. Đọc [README.md](../README.md) - Giới thiệu tổng quan
2. Đọc [ARCHITECTURE_OVERVIEW.md](./ARCHITECTURE_OVERVIEW.md) - Hiểu cấu trúc
3. Chọn component quan tâm trong [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md)
4. Xem data flow trong [DATA_FLOW_DIAGRAMS.md](./DATA_FLOW_DIAGRAMS.md)
5. Đọc code trong `/map-sever` hoặc `/my-app`

### Cho DevOps/Admin
1. Đọc [ARCHITECTURE_OVERVIEW.md](./ARCHITECTURE_OVERVIEW.md) - Hiểu tổng quan
2. Đọc [DEPLOYMENT_GUIDE.md](../map-sever/DEPLOYMENT_GUIDE.md) - Triển khai
3. Xem security trong [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md#bảo-mật)
4. Xem scalability recommendations

### Cho Product Manager/BA
1. Đọc [README.md](../README.md) - Features hiện tại
2. Đọc [ARCHITECTURE_OVERVIEW.md](./ARCHITECTURE_OVERVIEW.md) - Trạng thái
3. Xem roadmap trong [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md#roadmap--phát-triển-tiếp-theo)

---

## 📞 Liên Hệ & Đóng Góp

Nếu bạn tìm thấy lỗi trong tài liệu hoặc muốn đóng góp, vui lòng:
- Tạo issue trên GitHub
- Liên hệ team phát triển

---

**Cập nhật lần cuối**: 2025-11-19  
**Phiên bản**: 1.0
