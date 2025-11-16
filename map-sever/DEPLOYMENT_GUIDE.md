# Hướng dẫn triển khai ứng dụng Node.js lên Windows Server 2019 với IIS (sử dụng IISNode)

## Bước 1: Chuẩn bị Windows Server 2019

### 1.1 Cài đặt IIS
1. Mở **Server Manager**.
2. Chọn **Add roles and features**.
3. Chọn **Web Server (IIS)** và các components cần thiết:
   - Web Server
   - Common HTTP Features
   - Application Development > CGI
   - Management Tools

### 1.2 Cài đặt Node.js
1. Tải Node.js LTS từ https://nodejs.org
2. Cài đặt với quyền Administrator
3. Kiểm tra: `node --version` và `npm --version`

### 1.3 Cài đặt IISNode
1. Tải IISNode từ https://github.com/Azure/iisnode/releases (chọn phiên bản mới nhất)
2. Cài đặt MSI với quyền Administrator
3. IISNode sẽ tự động đăng ký với IIS

## Bước 2: Sao chép và cài đặt ứng dụng

### 2.1 Sao chép code
1. Upload toàn bộ thư mục project lên server (ví dụ: `C:\inetpub\wwwroot\map-server`)
2. Đảm bảo quyền truy cập cho IIS_IUSRS

### 2.2 Cài đặt dependencies
```powershell
cd C:\inetpub\wwwroot\map-server
npm install --production
```

### 2.3 Cấu hình môi trường
- Sao chép `config.env` và chỉnh sửa nếu cần (DB_HOST, DB_USER, etc.)
- Đảm bảo kết nối đến database từ server

## Bước 3: Tạo web.config cho IISNode

Tạo file `web.config` trong thư mục gốc của ứng dụng với nội dung sau:

```xml
<configuration>
  <system.webServer>
    <handlers>
      <add name="iisnode" path="app.js" verb="*" modules="iisnode" />
    </handlers>
    <rewrite>
      <rules>
        <rule name="NodeJS" stopProcessing="true">
          <match url="/*" />
          <conditions logicalGrouping="MatchAll" />
          <action type="Rewrite" url="app.js" />
        </rule>
      </rules>
    </rewrite>
    <iisnode
      nodeProcessCommandLine="C:\Program Files\nodejs\node.exe"
      interceptor="C:\Program Files\iisnode\interceptor.js"
      watchedFiles="*.js;*.json;*.env"
      recycleSignalEnabled="true"
      loggingEnabled="true"
      logDirectory="C:\inetpub\wwwroot\map-server\logs"
      debugHeaderEnabled="false"
      maxNamedPipeConnectionRetry="100"
      namedPipeConnectionRetryDelay="250"
      maxNamedPipeConnectionPoolSize="512"
      maxNamedPipePooledConnectionAge="30000"
      asyncCompletionThreadCount="0"
      initialRequestBufferSize="4096"
      maxRequestBufferSize="65536"
      uncFileChangesPollingInterval="5000"
      gracefulShutdownTimeout="60000"
      loggingEnabled="true"
      logDirectory="C:\inetpub\wwwroot\map-server\logs"
      appendToExistingLog="false"
      logFile="iisnode.log"
      devErrorsEnabled="true"
      flushResponse="false"
      enableXFF="false"
      promoteServerVars=""
      configOverrides="iisnode.yml"
    />
  </system.webServer>
</configuration>
```

### 3.1 Tạo thư mục logs
```powershell
mkdir C:\inetpub\wwwroot\map-server\logs
```

## Bước 4: Cấu hình IIS Site

### 4.1 Tạo Site mới
1. Mở **IIS Manager**
2. Right-click **Sites** > **Add Website**
3. Site name: map-server
4. Application pool: DefaultAppPool (hoặc tạo mới với .NET CLR Version: No Managed Code)
5. Physical path: C:\inetpub\wwwroot\map-server
6. Port: 80 (hoặc 443 với SSL)

### 4.2 Cấu hình Application Pool
1. Chọn **Application Pools**
2. Chọn pool của site (DefaultAppPool)
3. Right-click > **Advanced Settings**
4. Process Model > Identity: ApplicationPoolIdentity (hoặc tài khoản có quyền)
5. Recycling: Tăng Regular Time Interval lên 0 để tránh restart tự động

## Bước 5: Cấu hình Firewall và Permissions

### 5.1 Quyền truy cập
- Đảm bảo IIS_IUSRS có quyền Full Control cho thư mục `C:\inetpub\wwwroot\map-server`
- Đảm bảo quyền đọc file config.env

### 5.2 Firewall
```powershell
New-NetFirewallRule -DisplayName "HTTP" -Direction Inbound -LocalPort 80 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "HTTPS" -Direction Inbound -LocalPort 443 -Protocol TCP -Action Allow
```

## Bước 6: Khởi động và kiểm tra

### 6.1 Khởi động site
1. Trong IIS Manager, chọn site > click **Start**
2. Kiểm tra trạng thái site

### 6.2 Truy cập ứng dụng
- Mở browser: http://your-server-ip
- Kiểm tra logs: `C:\inetpub\wwwroot\map-server\logs\iisnode.log`

### 6.3 Kiểm tra API endpoints
- /api/ship
- /api/download
- etc.

## Lưu ý quan trọng

1. **Database Connection**: Đảm bảo server kết nối được đến SQL Server tại 161.248.147.115
2. **WebSocket**: IISNode hỗ trợ WebSocket tự động
3. **SSL**: Cấu hình SSL certificate nếu cần HTTPS
4. **Monitoring**: Sử dụng IIS logs và iisnode logs
5. **Restart**: `iisreset` sau khi thay đổi config

## Troubleshooting

- **Lỗi 500**: Kiểm tra iisnode.log
- **Không kết nối DB**: Kiểm tra config.env và network
- **App không start**: Đảm bảo path node.exe đúng trong web.config
- **Permissions**: IIS_IUSRS cần quyền đầy đủ cho thư mục

## Alternative: Reverse Proxy (nếu IISNode gặp vấn đề)

Nếu IISNode không hoạt động, chạy Node.js riêng và dùng IIS làm reverse proxy:

1. Chạy `node app.js` (hoặc tạo Windows Service)
2. Cài đặt URL Rewrite và ARR
3. Thêm rule rewrite đến `http://localhost:3000`