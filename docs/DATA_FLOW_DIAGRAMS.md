# Sơ Đồ Luồng Dữ Liệu (Data Flow Diagrams)

Tài liệu này mô tả các luồng dữ liệu chính trong hệ thống quản lý tàu biển.

---

## 1. Luồng Tracking Vị Trí Real-time

```mermaid
sequenceDiagram
    participant Device as Thiết bị GPS
    participant API as API Gateway
    participant DevSvc as Device Service
    participant DB as Database
    participant WS as WebSocket Server
    participant Client as Web Client
    
    Device->>API: POST /api/update-location<br/>{shipId, lat, lon, timestamp}
    API->>API: Validate token & data
    API->>DevSvc: Forward location data
    DevSvc->>DB: INSERT INTO Locations
    DB-->>DevSvc: Success
    DevSvc->>WS: Broadcast location update
    WS-->>Client: Push real-time update
    DevSvc-->>API: 200 OK
    API-->>Device: Location saved
    
    Note over Client: Bản đồ tự động<br/>cập nhật vị trí tàu
```

---

## 2. Luồng Đăng Nhập & Xác Thực

```mermaid
sequenceDiagram
    participant User as Người dùng
    participant Browser as Web Browser
    participant API as API Gateway
    participant Auth as Auth Service
    participant DB as Database
    
    User->>Browser: Nhập username/password
    Browser->>API: POST /api/login<br/>{username, password}
    API->>Auth: Validate credentials
    Auth->>DB: SELECT FROM Users<br/>WHERE username = ?
    DB-->>Auth: User data
    Auth->>Auth: Verify password hash
    
    alt Authentication successful
        Auth->>Auth: Generate JWT token
        Auth-->>API: {token, userInfo}
        API-->>Browser: 200 OK + token
        Browser->>Browser: Store token in localStorage
        Browser-->>User: Redirect to dashboard
    else Authentication failed
        Auth-->>API: 401 Unauthorized
        API-->>Browser: Error message
        Browser-->>User: Show error
    end
```

---

## 3. Luồng Tạo Báo Cáo Chuyến Biển

```mermaid
sequenceDiagram
    participant User as Người dùng
    participant Client as Web Client
    participant API as API Gateway
    participant ReportSvc as Report Service
    participant DB as Database
    participant FS as File Storage
    participant Puppeteer as Puppeteer Engine
    
    User->>Client: Click "Tải báo cáo"<br/>Chọn chuyến biển
    Client->>API: GET /api/download?tripId=123
    API->>API: Validate token
    API->>ReportSvc: Request report generation
    
    ReportSvc->>DB: Query voyage data
    DB-->>ReportSvc: Voyage details, locations
    
    ReportSvc->>DB: Query ship info
    DB-->>ReportSvc: Ship details
    
    ReportSvc->>ReportSvc: Load HTML template
    ReportSvc->>ReportSvc: Inject data into template
    
    ReportSvc->>Puppeteer: Render HTML to PDF
    Puppeteer-->>ReportSvc: PDF buffer
    
    ReportSvc->>FS: Save PDF file
    FS-->>ReportSvc: File path
    
    ReportSvc-->>API: File ready + download URL
    API-->>Client: Send PDF file
    Client-->>User: Browser downloads file
    
    Note over User: File: ChuyenBien_123.pdf
```

---

## 4. Luồng Hiển Thị Bản Đồ & Lịch Sử Hành Trình

```mermaid
sequenceDiagram
    participant User as Người dùng
    participant Map as Map Component (OpenLayers)
    participant API as API Gateway
    participant MapSvc as Map Service
    participant DB as Database
    participant Static as Static Files
    
    User->>Map: Mở trang bản đồ
    Map->>Static: Load vn_geo.json
    Static-->>Map: Vietnam boundaries
    Map->>Map: Render base map
    
    User->>Map: Click "Hiển thị tàu"
    Map->>API: GET /api/ship
    API->>MapSvc: Get active ships
    MapSvc->>DB: SELECT * FROM Ships<br/>WHERE status = 'active'
    DB-->>MapSvc: Ship list
    MapSvc-->>API: Ship data
    API-->>Map: JSON response
    Map->>Map: Render ship markers
    
    User->>Map: Click on ship marker
    Map->>API: GET /api/ship-info?id=456
    API->>MapSvc: Get ship details
    MapSvc->>DB: SELECT ship + latest location
    DB-->>MapSvc: Ship info
    MapSvc-->>API: Ship details
    API-->>Map: JSON response
    Map-->>User: Show info modal
    
    User->>Map: Click "Xem hành trình"
    Map->>API: GET /api/locations?shipId=456&<br/>from=date1&to=date2
    API->>MapSvc: Get route history
    MapSvc->>DB: SELECT * FROM Locations<br/>WHERE shipId = 456<br/>AND timestamp BETWEEN ...
    DB-->>MapSvc: Location history
    MapSvc-->>API: Route data
    API-->>Map: GPS points array
    Map->>Map: Draw route line
    Map-->>User: Display route on map
```

---

## 5. Luồng Thêm Tàu Mới

```mermaid
sequenceDiagram
    participant Admin as Quản trị viên
    participant Form as Add Ship Form
    participant API as API Gateway
    participant DevSvc as Device Service
    participant DB as Database
    participant WS as WebSocket Server
    participant Clients as All Clients
    
    Admin->>Form: Điền thông tin tàu mới
    Form->>Form: Validate form data
    Form->>API: POST /api/add-ship<br/>{name, type, owner, ...}
    API->>API: Validate token & permissions
    
    API->>DevSvc: Process new ship data
    DevSvc->>DB: BEGIN TRANSACTION
    DevSvc->>DB: INSERT INTO Ships
    DB-->>DevSvc: shipId
    DevSvc->>DB: INSERT INTO Voyages (initial)
    DB-->>DevSvc: voyageId
    DevSvc->>DB: COMMIT
    
    DevSvc->>WS: Broadcast ship_added event
    WS-->>Clients: Notify all connected clients
    
    DevSvc-->>API: Success + shipId
    API-->>Form: 200 OK
    Form-->>Admin: Show success message
    
    Note over Clients: Danh sách tàu<br/>tự động cập nhật
```

---

## 6. Luồng WebSocket Real-time Updates

```mermaid
sequenceDiagram
    participant Client1 as Client 1
    participant Client2 as Client 2
    participant WS as WebSocket Server
    participant DevSvc as Device Service
    participant API as API Gateway
    participant Device as GPS Device
    
    Client1->>WS: Connect WebSocket
    WS-->>Client1: Connection established
    
    Client2->>WS: Connect WebSocket
    WS-->>Client2: Connection established
    
    Note over WS: Both clients connected
    
    Device->>API: POST /api/update-location
    API->>DevSvc: New location data
    DevSvc->>DevSvc: Process & save to DB
    DevSvc->>WS: Emit location_update event
    
    WS->>WS: Broadcast to all clients
    WS-->>Client1: {type: 'location_update', data: {...}}
    WS-->>Client2: {type: 'location_update', data: {...}}
    
    Client1->>Client1: Update ship position on map
    Client2->>Client2: Update ship position on map
    
    Note over Client1,Client2: Cả 2 clients đều<br/>thấy vị trí mới ngay lập tức
```

---

## 7. Luồng Tìm Kiếm & Lọc Tàu

```mermaid
sequenceDiagram
    participant User as Người dùng
    participant UI as User Interface
    participant API as API Gateway
    participant DevSvc as Device Service
    participant DB as Database
    
    User->>UI: Nhập ID tàu hoặc tên
    UI->>UI: Debounce input (300ms)
    
    UI->>API: GET /api/ship?search=ABC123
    API->>DevSvc: Search ships
    DevSvc->>DB: SELECT * FROM Ships<br/>WHERE id LIKE '%ABC123%'<br/>OR name LIKE '%ABC123%'
    DB-->>DevSvc: Matching ships
    DevSvc-->>API: Search results
    API-->>UI: JSON array
    UI-->>User: Display results list
    
    User->>UI: Apply filters<br/>(status, type, etc)
    UI->>API: GET /api/ship?status=active&type=cargo
    API->>DevSvc: Filter ships
    DevSvc->>DB: SELECT * FROM Ships<br/>WHERE status = 'active'<br/>AND type = 'cargo'
    DB-->>DevSvc: Filtered ships
    DevSvc-->>API: Filtered results
    API-->>UI: JSON array
    UI->>UI: Update map markers
    UI-->>User: Show filtered ships on map
```

---

## 8. Luồng Xử Lý Lỗi & Retry

```mermaid
sequenceDiagram
    participant Client as Client
    participant API as API Gateway
    participant Service as Any Service
    participant DB as Database
    participant Logger as Logging Service
    
    Client->>API: Request
    API->>Service: Process request
    Service->>DB: Query data
    
    alt Database connection error
        DB-->>Service: Connection timeout
        Service->>Logger: Log error
        Service->>Service: Retry (attempt 1/3)
        Service->>DB: Query data (retry)
        
        alt Retry successful
            DB-->>Service: Data
            Service-->>API: Success
            API-->>Client: 200 OK
        else Retry failed
            DB-->>Service: Still failing
            Service->>Logger: Log critical error
            Service-->>API: 503 Service Unavailable
            API-->>Client: Error message
            Note over Client: Show error modal<br/>with retry button
        end
    else Query successful
        DB-->>Service: Data
        Service-->>API: Success
        API-->>Client: 200 OK
    end
```

---

## 9. Luồng Scheduled Tasks (Future)

```mermaid
sequenceDiagram
    participant Scheduler as Task Scheduler
    participant Queue as Task Queue
    participant Worker as Background Worker
    participant ReportSvc as Report Service
    participant DB as Database
    participant Email as Email Service
    
    Note over Scheduler: Every day at 00:00
    
    Scheduler->>Queue: Enqueue daily_report_job
    Queue->>Worker: Pick up job
    Worker->>ReportSvc: Generate daily report
    
    ReportSvc->>DB: Query yesterday's data
    DB-->>ReportSvc: Statistics data
    
    ReportSvc->>ReportSvc: Generate report
    ReportSvc->>DB: Save report to Reports table
    
    ReportSvc->>Email: Send report to admins
    Email-->>ReportSvc: Email sent
    
    ReportSvc-->>Worker: Job completed
    Worker->>Queue: Mark job as done
    
    Note over Scheduler: Wait for next day
```

---

## 10. Architecture Data Flow Summary

```mermaid
graph TD
    subgraph External[External Layer]
        GPS[GPS Devices]
        Users[End Users]
        ThirdParty[3rd Party APIs]
    end
    
    subgraph Gateway[Gateway Layer]
        APIGateway[API Gateway<br/>Authentication<br/>Rate Limiting]
    end
    
    subgraph Services[Service Layer]
        Device[Device Service]
        User[User Service]
        Map[Map Service]
        Report[Report Service]
        Monitor[Monitoring]
    end
    
    subgraph Queue[Queue Layer]
        WS[WebSocket]
        MQ[Message Queue]
    end
    
    subgraph Data[Data Layer]
        SQL[(SQL Database)]
        Files[File Storage]
        Cache[(Cache)]
    end
    
    GPS -->|Location Data| APIGateway
    Users -->|HTTP Requests| APIGateway
    ThirdParty -->|API Calls| APIGateway
    
    APIGateway -->|Route| Device
    APIGateway -->|Route| User
    APIGateway -->|Route| Map
    APIGateway -->|Route| Report
    
    Device -->|Events| WS
    Device -->|Write| SQL
    Device -->|Read| Files
    
    User -->|Write/Read| SQL
    
    Map -->|Read| SQL
    Map -->|Read| Files
    Map -->|Cache| Cache
    
    Report -->|Read| SQL
    Report -->|Write| Files
    
    WS -->|Push| Users
    MQ -->|Async Tasks| Services
    
    Monitor -->|Collect Metrics| Services
    Monitor -->|Logs| SQL
    
    style GPS fill:#4CAF50
    style Users fill:#2196F3
    style APIGateway fill:#FF9800
    style SQL fill:#E91E63
    style WS fill:#00BCD4
```

---

## Các Trường Hợp Đặc Biệt

### Emergency/SOS Handling
```mermaid
sequenceDiagram
    participant Ship as Tàu gặp nạn
    participant GPS as GPS Device
    participant API as API Gateway
    participant Alert as Alert System
    participant DB as Database
    participant WS as WebSocket
    participant Admin as Admin Dashboard
    participant SMS as SMS Service
    
    Ship->>GPS: Nút SOS được nhấn
    GPS->>API: POST /api/emergency<br/>{shipId, location, type: 'SOS'}
    API->>Alert: HIGH PRIORITY alert
    Alert->>DB: Log emergency event
    Alert->>WS: Broadcast emergency
    WS-->>Admin: Real-time SOS alert
    Alert->>SMS: Send SMS to authorities
    Admin-->>Admin: Show SOS notification<br/>Play alert sound
```

### System Health Check
```mermaid
sequenceDiagram
    participant Monitor as Monitoring Service
    participant API as API Gateway
    participant Services as All Services
    participant DB as Database
    participant WS as WebSocket Server
    
    loop Every 30 seconds
        Monitor->>API: GET /health
        API-->>Monitor: {status: 'ok'}
        
        Monitor->>Services: Check service health
        Services-->>Monitor: Health status
        
        Monitor->>DB: SELECT 1
        DB-->>Monitor: Connection OK
        
        Monitor->>WS: Check connections
        WS-->>Monitor: Active connections count
        
        alt All healthy
            Monitor->>Monitor: Update metrics
        else Service unhealthy
            Monitor->>Monitor: Trigger alert
            Monitor->>Admin: Send notification
        end
    end
```

---

**Tài liệu liên quan:**
- [Tổng quan kiến trúc](./ARCHITECTURE_OVERVIEW.md)
- [Chi tiết kiến trúc](./SYSTEM_ARCHITECTURE.md)
