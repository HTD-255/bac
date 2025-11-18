# Kiến trúc Hệ thống VMS (Vessel Monitoring System)

**Ngày tạo**: 2025-11-18  
**Phiên bản**: 1.0  
**Loại tài liệu**: System Architecture Documentation

---

## Mục lục

1. [Tổng quan](#tổng-quan)
2. [Sơ đồ Kiến trúc](#sơ-đồ-kiến-trúc)
3. [Các Thành phần Chính](#các-thành-phần-chính)
4. [Luồng Dữ liệu và Giao tiếp](#luồng-dữ-liệu-và-giao-tiếp)
5. [Công nghệ Sử dụng](#công-nghệ-sử-dụng)
6. [Mô hình Triển khai](#mô-hình-triển-khai)
7. [Kiến trúc Bảo mật](#kiến-trúc-bảo-mật)

---

## Tổng quan

Hệ thống VMS (Vessel Monitoring System) là giải pháp giám sát và quản lý tàu cá theo thời gian thực, được xây dựng để đáp ứng yêu cầu quản lý của các cơ quan quản lý nghề cá và kiểm ngư.

### Mục tiêu Hệ thống

- **Giám sát real-time**: Theo dõi vị trí tàu cá 24/7
- **Lưu trữ lịch sử**: Ghi nhận hành trình và hoạt động
- **Báo cáo khai thác**: Tạo báo cáo PDF về hoạt động đánh bắt
- **Quản lý chuyến biển**: Theo dõi vòng đời chuyến từ khởi hành đến kết thúc

### Đặc điểm Kỹ thuật

- **Hiệu suất cao**: Xử lý > 1000 gói tin/giây
- **Real-time**: Cập nhật vị trí mỗi 5 giây
- **Độ tin cậy**: Error recovery và duplicate detection
- **Khả năng mở rộng**: Kiến trúc microservices

---

## Sơ đồ Kiến trúc

![Sơ đồ Khối Kiến trúc VMS](images/architecture-block-diagram.png)

### Phân tầng Kiến trúc

Hệ thống VMS được tổ chức theo 5 tầng chính:

1. **Tầng Thiết bị** (Device Layer)
2. **Tầng Gateway** (Gateway Layer)
3. **Tầng Dịch vụ** (Service Layer)
4. **Tầng Dữ liệu** (Data Layer)
5. **Tầng Giao diện** (Presentation Layer)

---

## Các Thành phần Chính

### 1. Thiết bị Giám sát (Device Layer)

**Mô tả**: Thiết bị GPS tracker gắn trên tàu cá

**Thành phần**:
- GPS Tracker
- Thiết bị NKDT (Nghị định Khai thác Đánh bắt Thủy sản)
- Sensors (cảm biến)

**Chức năng**:
- Thu thập dữ liệu vị trí GPS (latitude, longitude)
- Ghi nhận trạng thái tàu (hoạt động, dừng, SOS)
- Gửi dữ liệu định kỳ về server

**Giao thức**:
- **TCP/UDP**: Gửi dữ liệu nhị phân
- **Format**: Binary packet với Header và CRC checksum
- **Tần suất**: Mỗi 30-60 giây hoặc theo cấu hình

---

### 2. API Gateway / Server

**Mô tả**: Điểm tiếp nhận dữ liệu từ thiết bị

**Thành phần**:
- **NKDT_Server** (.NET Core)
- TCP/UDP Listener
- Binary Parser

**Chức năng**:
- Lắng nghe kết nối từ thiết bị (TCP/UDP ports)
- Parse dữ liệu nhị phân
- Kiểm tra tính toàn vẹn (CRC validation)
- Phân phối dữ liệu đến các service

**Quy trình xử lý**:
1. Nhận binary packet từ thiết bị
2. Parse header và payload
3. Validate CRC checksum
4. Extract thông tin (device_id, lat, lon, timestamp, status)
5. Forward đến Service Xử lý DL

---

### 3. Service Xử lý Dữ liệu (Data Processing Service)

**Mô tả**: Xử lý và lưu trữ dữ liệu vị trí

**Chức năng**:
- **Parse & Validate**: Kiểm tra dữ liệu hợp lệ
- **Async Processing**: `nkdtProcessingAsync()` xử lý bất đồng bộ
- **Duplicate Check**: Kiểm tra trùng lặp bằng `AsNoTracking() + AnyAsync()`
- **Database Write**: Insert/Update vào bảng LocationShip

**Luồng xử lý**:
```
Raw Data → Parse → Validate → Check Duplicate → Save to DB
```

**Tối ưu hóa**:
- Sử dụng `AsNoTracking()` để giảm overhead của EF Core
- `AnyAsync()` chỉ kiểm tra tồn tại, không load toàn bộ entity
- Batch processing cho hiệu suất cao

---

### 4. Service Báo cáo (Report Service)

**Mô tả**: Tạo báo cáo PDF về hoạt động khai thác

**Công nghệ**: Node.js + Express + Puppeteer

**Chức năng**:
- Nhận yêu cầu báo cáo từ frontend
- Query Stored Procedures để lấy dữ liệu
- Gom nhóm dữ liệu (thu/thả lưới, loài khai thác)
- Map ID sang tên (species.json, cang.json)
- Render HTML template
- Convert HTML → PDF bằng Puppeteer

**API Endpoint**:
```
POST /api/generate-report
Body: { chuyenBienId, options }
Response: PDF file (application/pdf)
```

**Đặc điểm**:
- Template-based rendering
- Timezone conversion (UTC → GMT+7)
- Headless Chrome rendering
- Support bảng động và charts

---

### 5. Service Real-time (WebSocket Service)

**Mô tả**: Phát dữ liệu vị trí real-time đến frontend

**Công nghệ**: WebSocket (ws library)

**Chức năng**:
- Duy trì kết nối WebSocket với clients
- Query database mỗi 5 giây
- Push location updates đến tất cả connected clients
- Manage connection pool

**Quy trình**:
```
Loop (every 5s):
  Query DB → Get latest locations → Push to all clients
```

**Cấu hình**:
- **Port**: 8080
- **Interval**: 5 seconds
- **Protocol**: WebSocket (ws://)

---

### 6. Service Bản đồ (Map & History Service)

**Mô tả**: Quản lý lịch sử hành trình và tra cứu

**Chức năng**:
- **Route History**: Lưu track hành trình
- **Track Logging**: Ghi log vị trí theo timeline
- **Location Query**: Tra cứu vị trí trong khoảng thời gian
- **Trip Management**: Quản lý thông tin chuyến biển

**Dữ liệu quản lý**:
- Lịch sử vị trí (GPS logs)
- Thông tin chuyến biển
- Điểm thu/thả lưới
- Vùng khai thác

---

### 7. Database (SQL Server)

**Mô tả**: Cơ sở dữ liệu quan hệ chính

**Công nghệ**: Microsoft SQL Server

**Bảng chính**:

#### LocationShip
- Lưu trữ dữ liệu vị trí theo thời gian
- Tần suất ghi cao (high-write table)
- Index: (idChuyenBien, timeUpdate)
- Partition theo tháng/năm

#### Trip Data
- Thông tin chuyến biển
- Trạng thái: Not Started, Active, Paused, Completed, Cancelled
- Liên kết với vessel và device

#### Fishing Logs
- Nhật ký khai thác
- Loài đánh bắt
- Khối lượng, số lượng
- Điểm thu/thả lưới

#### User & Device Info
- Thông tin người dùng
- Phân quyền (RBAC)
- Cấu hình thiết bị

**Stored Procedures**:
- `Locations`: Lấy vị trí mới nhất
- `GetTripDetails`: Chi tiết chuyến biển
- `GetFishingLog`: Nhật ký khai thác

**Tối ưu hóa**:
- Indexing theo vessel + timestamp
- Partitioning theo thời gian
- Archive dữ liệu cũ sang cold storage
- Read replicas cho reporting

---

### 8. File Storage

**Mô tả**: Lưu trữ file tĩnh và templates

**Nội dung**:
- **PDF Reports**: Báo cáo đã tạo
- **Templates**: HTML templates cho báo cáo
- **Species/Port Data**: species.json, cang.json
- **Config Files**: Cấu hình hệ thống

**Cấu trúc thư mục**:
```
/storage
  /templates
    - report-template.html
  /reports
    - trip-123-report.pdf
  /data
    - species.json
    - cang.json
  /config
    - config.env
```

---

### 9. WebSocket Pool

**Mô tả**: Quản lý các kết nối WebSocket active

**Chức năng**:
- Maintain active connections
- Track client sessions
- Broadcast messages
- Handle connect/disconnect events

**Metrics**:
- Active connections count
- Message throughput
- Connection duration
- Error rate

---

### 10. Giao diện Quản trị (ShipMap Frontend)

**Mô tả**: Ứng dụng web quản lý và giám sát

**Công nghệ**: Vanilla JavaScript + OpenLayers

**Chức năng chính**:

#### Real-time Map Display
- Hiển thị bản đồ với OpenLayers
- Marker cho từng tàu
- Dynamic styling theo trạng thái
- SOS markers với z-index cao
- Tooltip thông tin tàu

#### Ship Tracking
- Theo dõi vị trí real-time
- Cập nhật tự động qua WebSocket
- Hiển thị hướng di chuyển
- Tốc độ và trạng thái

#### Report Generation
- Tạo yêu cầu báo cáo
- Download PDF
- Preview trong browser

#### Trip Management
- Quản lý chuyến biển
- Xem lịch sử hành trình
- Playback route

#### User Interface
- Dashboard tổng quan
- Bảng danh sách tàu
- Tra cứu và filter
- Notification alerts

**Files chính**:
- `main.js`: Core application logic
- `Map.js`: OpenLayers map handling
- `Table.js`: Data table display
- `Controll.js`: Control panel
- `config.js`: Configuration

---

## Luồng Dữ liệu và Giao tiếp

### 1. Luồng Dữ liệu từ Thiết bị

```
Thiết bị → (Binary/TCP) → API Gateway → 
Parse & Validate → Service Xử lý DL →
Check Duplicate → Database → Success
```

**Chi tiết**:
1. **Thiết bị**: Gửi binary packet qua TCP/UDP
2. **API Gateway**: Nhận và parse packet
3. **Service Xử lý**: Validate và kiểm tra trùng lặp
4. **Database**: Insert/Update LocationShip table

**Tần suất**: Continuous (1000s packets/second)

---

### 2. Luồng Real-time đến Frontend

```
Database → (Query every 5s) → Service Real-time →
WebSocket Pool → (Push) → Frontend → 
Update Map
```

**Chi tiết**:
1. **Service Real-time**: Query DB mỗi 5 giây
2. **WebSocket Pool**: Broadcast đến all clients
3. **Frontend**: Nhận update và render map

**Latency**: < 5 seconds

---

### 3. Luồng Tạo Báo cáo

```
Frontend → (POST /api) → Service Báo cáo →
Query SPs → Database → Process Data →
Render HTML → Puppeteer PDF →
Return PDF → Frontend Download
```

**Chi tiết**:
1. **Frontend**: Request báo cáo
2. **Service Báo cáo**: Query stored procedures
3. **Processing**: Gom nhóm, map data, timezone
4. **Rendering**: HTML template + Puppeteer
5. **Response**: PDF file

**Thời gian xử lý**: 5-15 seconds

---

### 4. Luồng Tra cứu Lịch sử

```
Frontend → (REST API) → Service Bản đồ →
Query History → Database → Return Data →
Frontend Display Route
```

---

## Công nghệ Sử dụng

### Backend

| Thành phần | Công nghệ | Mô tả |
|------------|-----------|-------|
| API Gateway | .NET Core | Xử lý binary protocol |
| Report Service | Node.js + Express | PDF generation |
| Real-time Service | Node.js + ws | WebSocket server |
| Database | SQL Server | Relational database |

### Frontend

| Thành phần | Công nghệ | Mô tả |
|------------|-----------|-------|
| UI Framework | Vanilla JavaScript | Lightweight |
| Map Library | OpenLayers | Bản đồ tương tác |
| Build Tool | Vite | Fast development |
| CSS | Tailwind CSS | Utility-first CSS |

### Infrastructure

| Thành phần | Công nghệ | Mô tả |
|------------|-----------|-------|
| PDF Engine | Puppeteer | Headless Chrome |
| WebSocket | ws library | Real-time communication |
| Database Driver | mssql (Node) | SQL Server client |
| Template Engine | Custom HTML | Template rendering |

### Deployment

| Aspect | Technology | Details |
|--------|-----------|---------|
| Platform | On-premises | Windows Server |
| Web Server | IIS / PM2 | Application hosting |
| Database | SQL Server | Local instance |
| Containerization | Future: Docker | Not yet implemented |

---

## Mô hình Triển khai

### Kiến trúc Triển khai Hiện tại

```
┌─────────────────────────────────────┐
│    Windows Server 2019              │
│  ┌──────────────────────────────┐   │
│  │  IIS / PM2                   │   │
│  │  - Node.js App (port 3000)   │   │
│  │  - WebSocket (port 8080)     │   │
│  └──────────────────────────────┘   │
│  ┌──────────────────────────────┐   │
│  │  .NET Core Service           │   │
│  │  - NKDT Server               │   │
│  │  - TCP/UDP Listener          │   │
│  └──────────────────────────────┘   │
│  ┌──────────────────────────────┐   │
│  │  SQL Server                  │   │
│  │  - Database Instance         │   │
│  └──────────────────────────────┘   │
└─────────────────────────────────────┘
```

### Network Topology

```
Internet
   │
   ├── Thiết bị (TCP/UDP) ──→ Port 5000-5010
   │
   ├── Admin Users (HTTPS) ─→ Port 443/3000
   │
   └── WebSocket Clients ───→ Port 8080
```

### Scaling Considerations

**Vertical Scaling** (hiện tại):
- Tăng RAM và CPU của server
- Optimize database queries
- Index optimization

**Horizontal Scaling** (tương lai):
- Load balancer cho Node.js services
- Database replication (Master-Slave)
- Redis cache cho session
- Message queue (RabbitMQ/Kafka)

---

## Kiến trúc Bảo mật

### 1. Mã hóa Đường truyền

**Thiết bị → Server**:
- TCP/UDP với binary protocol
- CRC checksum validation
- Device authentication (future: TLS)

**Frontend → Backend**:
- HTTPS/TLS cho REST API
- WSS (WebSocket Secure) cho real-time

**Database**:
- Encrypted connections
- SQL Server native encryption

### 2. Xác thực và Phân quyền

**Device Authentication** (future):
- API key per device
- HMAC signature validation
- Certificate-based auth

**User Authentication** (current):
- Session-based authentication
- Role-based access control (RBAC)

**Future Enhancements**:
- JWT tokens
- OAuth2 integration
- Multi-factor authentication

### 3. Bảo vệ API

**Rate Limiting** (planned):
- Giới hạn requests per IP
- Throttling cho expensive operations

**Input Validation**:
- CRC checksum verification
- Data type validation
- SQL injection prevention (parameterized queries)

**Anti-Spoofing** (future):
- Device fingerprinting
- Replay attack prevention
- Timestamp validation

### 4. Bảo mật Dữ liệu

**Database Security**:
- Encrypted at rest (SQL Server TDE)
- Parameterized queries (prevent SQL injection)
- Least privilege access
- Regular backups

**Sensitive Data**:
- Hash passwords (bcrypt/scrypt)
- Encrypt sensitive fields
- Audit logging

### 5. Logging và Monitoring

**Access Logs**:
- All API requests
- Failed authentication attempts
- Database access logs

**Security Monitoring** (planned):
- Intrusion detection
- Anomaly detection
- Real-time alerts

---

## Khả năng Mở rộng & Giám sát

### Load Balancing (Future)

```
         Load Balancer
              │
    ┌─────────┼─────────┐
    │         │         │
  Node1     Node2     Node3
    │         │         │
    └─────────┴─────────┘
              │
         Database
```

### Database Replication

```
Master (Write) ──replicate──→ Slave 1 (Read)
                          └──→ Slave 2 (Read)
```

### Health Monitoring

**Metrics to Monitor**:
- API response time
- Database query performance
- WebSocket connection count
- Memory and CPU usage
- Disk space
- Network bandwidth

**Tools** (planned):
- Prometheus for metrics collection
- Grafana for visualization
- ELK Stack for log aggregation
- Alerting via email/SMS

### Backup Strategy

**Database Backup**:
- Full backup: Weekly
- Incremental backup: Daily
- Transaction log backup: Every hour
- Off-site backup: Daily to cloud

**Application Backup**:
- Code repository: Git
- Configuration files: Version controlled
- Generated reports: Archived monthly

---

## Định hướng Phát triển

### Short-term (3-6 months)

1. **Security Enhancements**
   - Implement JWT authentication
   - Add rate limiting
   - Enable WSS (WebSocket Secure)

2. **Performance Optimization**
   - Redis caching layer
   - Database query optimization
   - CDN for static assets

3. **Monitoring**
   - Prometheus + Grafana setup
   - Error tracking (Sentry)
   - Performance monitoring (APM)

### Medium-term (6-12 months)

1. **Scalability**
   - Containerization (Docker)
   - Kubernetes orchestration
   - Horizontal scaling

2. **Features**
   - Mobile app (React Native)
   - Advanced analytics dashboard
   - Automated alerts and notifications

3. **Data Analytics**
   - Big data processing (Apache Spark)
   - Machine learning for predictions
   - Fishing pattern analysis

### Long-term (1-2 years)

1. **AI Integration**
   - Automatic violation detection
   - Catch estimation
   - Route optimization

2. **Cloud Migration**
   - Hybrid cloud deployment
   - Multi-region availability
   - Disaster recovery

3. **Advanced Features**
   - Blockchain for traceability
   - IoT sensor integration
   - Predictive maintenance

---

## Kết luận

Hệ thống VMS được thiết kế với kiến trúc phân tầng rõ ràng, đáp ứng yêu cầu:
- **Hiệu suất cao**: Xử lý hàng nghìn gói tin/giây
- **Real-time**: Cập nhật vị trí 5 giây
- **Tin cậy**: Error recovery và data validation
- **Mở rộng**: Sẵn sàng scale horizontal

Kiến trúc hiện tại phục vụ tốt nhu cầu hiện tại và có roadmap rõ ràng cho việc mở rộng trong tương lai.

---

**Tài liệu này bổ sung cho các sơ đồ UML đã có:**
- [Sơ đồ Tuần tự](VMS-Sequence-Diagrams.md)
- [Sơ đồ Tương tác](VMS-Collaboration-Diagrams.md)
- [Sơ đồ Trạng thái](VMS-State-Diagrams.md)
