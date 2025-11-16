import { API_BASE_URL } from './config.js';

export async function download(idShip,idchuyenBien,action, error){
  try {
        const response = await fetch(`${API_BASE_URL}/api/download?id=${idShip}&&id_cb=${idchuyenBien}`);
        if (!response.ok) throw new Error('Lỗi khi tải nhật ký');
        const blob = await response.blob();
        // Tạo link tải file PDF
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `nhatky_${idShip}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } catch (err) {
        error()
        alert('Không thể tải nhật ký!');
        console.error(err);
      } finally {
        action()
        
      }

}

export async function DanhSachTau(statuss,action,err){
   try {
    // 1. Thực hiện Fetch tất cả tàu và cache kết quả
    // Previously we requested only active ships from the server. Now we
    // fetch all ships and filter on the client so search can return
    // matches regardless of activity status.
    const response = await fetch(`${API_BASE_URL}/api/ship`);

        // 2. KIỂM TRA PHẢN HỒI (response.ok)
        // Kiểm tra mã trạng thái HTTP (HTTP status code). 
        // response.ok là true nếu status nằm trong khoảng 200-299 (Thành công).
        if (!response.ok) {
            // Nếu không thành công (ví dụ: 404, 500), ném ra lỗi để bị bắt bởi catch
            const errorBody = await response.text(); // Đọc nội dung lỗi từ server
            err();
            throw new Error(`Lỗi HTTP: ${response.status} - ${errorBody || 'Không thể tải thông tin tàu.'}`);
        }

        // 3. Chuyển đổi Body thành JSON và chờ kết quả
        const data = await response.json(); 
        // cache in-module for potential search use
        if (typeof window !== 'undefined') window.__ALL_SHIPS_CACHE = data;

        // If caller asked for a status filter, apply it client-side and return filtered list
        if (statuss !== undefined && statuss !== null) {
            const filtered = Array.isArray(data) ? data.filter(s => Number(s.statuss) === Number(statuss)) : [];
            action(filtered);
            return filtered;
        }

        action(data);
        return data;

    } catch (error) {
        // Xử lý lỗi: Lỗi mạng, lỗi HTTP không thành công, hoặc lỗi JSON
        console.error('Lỗi khi lấy danh sách tàu:', error);
        // Có thể trả về một mảng rỗng hoặc null để gọi hàm biết rằng đã thất bại
        err()
        return null; 
    }
}

export async function DanhSachChuyenBien(idShip,action,err){
   try {
        // 1. Thực hiện Fetch và chờ Response
        const response = await fetch(`${API_BASE_URL}/api/chuyen-bien?id=${idShip}`);

        // 2. KIỂM TRA PHẢN HỒI (response.ok)
        // Kiểm tra mã trạng thái HTTP (HTTP status code). 
        // response.ok là true nếu status nằm trong khoảng 200-299 (Thành công).
        if (!response.ok) {
            // Nếu không thành công (ví dụ: 404, 500), ném ra lỗi để bị bắt bởi catch
            const errorBody = await response.text(); // Đọc nội dung lỗi từ server
            err();
            throw new Error(`Lỗi HTTP: ${response.status} - ${errorBody || 'Không thể tải thông tin tàu.'}`);
        }

        // 3. Chuyển đổi Body thành JSON và chờ kết quả
        const data = await response.json(); 
        
        // 4. Trả về dữ liệu (hoặc xử lý nó ở đây)
        action(data)
        return data; 

    } catch (error) {
        // Xử lý lỗi: Lỗi mạng, lỗi HTTP không thành công, hoặc lỗi JSON
        console.error('Lỗi khi lấy danh sách tàu:', error);
        // Có thể trả về một mảng rỗng hoặc null để gọi hàm biết rằng đã thất bại
        err()
        return null; 
    }
}

// Search ships by id (case-insensitive substring). Will use cached data if available,
// otherwise fetch all ships first.
export async function TimTauTheoId(query, action, err) {
    try {
        const q = String(query || '').trim().toLowerCase();
        let data = (typeof window !== 'undefined' && window.__ALL_SHIPS_CACHE) ? window.__ALL_SHIPS_CACHE : null;
        if (!Array.isArray(data)) {
            const resp = await fetch(`${API_BASE_URL}/api/ship`);
            if (!resp.ok) { err(); throw new Error('Không thể tải danh sách tàu cho tìm kiếm'); }
            data = await resp.json();
            if (typeof window !== 'undefined') window.__ALL_SHIPS_CACHE = data;
        }
        if (!q) {
            action([]);
            return [];
        }
        const matches = data.filter(s => {
            try {
                const idField = (s.id || s.id_ship || s.ship_id || s.so_dang_ky_tau || '').toString().toLowerCase();
                return idField.includes(q);
            } catch (e) { return false; }
        });
        // Remove duplicates based on id
        const uniqueMatches = matches.filter((ship, index, self) => self.findIndex(s => s.id === ship.id) === index);
        action(uniqueMatches);
        return uniqueMatches;
    } catch (error) {
        console.error('Lỗi khi tìm tàu theo id:', error);
        err();
        return null;
    }
}

export async function Locations(idChuyenBien,action,err){
   try {
        // 1. Thực hiện Fetch và chờ Response
        const response = await fetch(`${API_BASE_URL}/api/locations?id=${idChuyenBien}`);

        // 2. KIỂM TRA PHẢN HỒI (response.ok)
        // Kiểm tra mã trạng thái HTTP (HTTP status code). 
        // response.ok là true nếu status nằm trong khoảng 200-299 (Thành công).
        if (!response.ok) {
            // Nếu không thành công (ví dụ: 404, 500), ném ra lỗi để bị bắt bởi catch
            const errorBody = await response.text(); // Đọc nội dung lỗi từ server
            err();
            throw new Error(`Lỗi HTTP: ${response.status} - ${errorBody || 'Không thể tải thông tin tàu.'}`);
        }

        // 3. Chuyển đổi Body thành JSON và chờ kết quả
        const data = await response.json(); 
        
        // 4. Trả về dữ liệu (hoặc xử lý nó ở đây)
        action(data)
        return data; 

    } catch (error) {
        // Xử lý lỗi: Lỗi mạng, lỗi HTTP không thành công, hoặc lỗi JSON
        console.error('Lỗi khi lấy danh sách tàu:', error);
        // Có thể trả về một mảng rỗng hoặc null để gọi hàm biết rằng đã thất bại
        err()
        return null; 
    }
}
export async function meLuoi(idChuyenBien,action,err){
   try {
        // 1. Thực hiện Fetch và chờ Response
        const response = await fetch(`${API_BASE_URL}/api/locations?id=${idChuyenBien}`);

        // 2. KIỂM TRA PHẢN HỒI (response.ok)
        // Kiểm tra mã trạng thái HTTP (HTTP status code). 
        // response.ok là true nếu status nằm trong khoảng 200-299 (Thành công).
        if (!response.ok) {
            // Nếu không thành công (ví dụ: 404, 500), ném ra lỗi để bị bắt bởi catch
            const errorBody = await response.text(); // Đọc nội dung lỗi từ server
            err();
            throw new Error(`Lỗi HTTP: ${response.status} - ${errorBody || 'Không thể tải thông tin tàu.'}`);
        }

        // 3. Chuyển đổi Body thành JSON và chờ kết quả
        const data = await response.json(); 
        
        // 4. Trả về dữ liệu (hoặc xử lý nó ở đây)
        action(data)
        return data; 

    } catch (error) {
        // Xử lý lỗi: Lỗi mạng, lỗi HTTP không thành công, hoặc lỗi JSON
        console.error('Lỗi khi lấy danh sách tàu:', error);
        // Có thể trả về một mảng rỗng hoặc null để gọi hàm biết rằng đã thất bại
        err()
        return null; 
    }
}

