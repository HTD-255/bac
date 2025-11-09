

ws.onopen = () => {
    console.log('Đã kết nối với server WebSocket.');
};

ws.onmessage = event => {
    // Nhận dữ liệu vị trí từ server
    const locationData = JSON.parse(event.data);
    
    // Cập nhật giao diện người dùng
    updateUI(locationData);
    
    console.log('Đã nhận vị trí mới từ server.');
};

// Hàm cập nhật giao diện (giống ví dụ trên)
function updateUI(locationData) {
    const locationDiv = document.getElementById('location-display');
    if (locationDiv) {
        locationDiv.textContent = `Vị trí hiện tại: ${locationData.newlat}, ${locationData.newlong}`;
    }
}

 async function updateLocation() {
    while (true) {
        await new Promise(resolve => setTimeout(resolve, 5000));
         const response = await fetch('http://localhost:3000/api/locations');
    response.json().then(data => {
        // Update the UI with the new location data
    });
    }
   
}