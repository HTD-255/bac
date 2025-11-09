export const headers = ["Mã tàu",  "Chuyến biển trong năm","Trạng thái","Chuyen Biển"];
export const headersChuyenBien = ["Chuyến biển số", "Trạng thái",  "Chi tiết","Xem đường đi"];

export const data = [{ id_ship: "0000000", stauss: "1" }];
export const datachuyenBien = [{ id: "0000000", stauss: "1" }];


export class Table {
    thead = null
    tbody = null
    table = null;
    constructor(id) {
        this.table = this._createElement(id)
        this.thead = document.createElement('thead');

        this.tbody = document.createElement('tbody');
    }

    _createElement(id) {
        // 1. Tạo một thẻ <div> tạm thời
        const table = document.createElement('table');
        table.className = "table table-bordered"


        // 4. Thiết lập ID
        if (table) {
            table.id = id;
        }

        // 5. Trả về phần tử DOM đã hoàn chỉnh
        return table;
    }

    createTHead(header) {
        if (!Array.isArray(header) || header.length === 0) {
            console.error("Dữ liệu header không phải là mảng hoặc mảng rỗng.");
            return null;

        }
        // 2. Tạo phần tử <thead>
        // 3. Tạo một hàng tiêu đề (<tr>)
        const headerRow = document.createElement('tr');
        headerRow.classList.add("row")
        // 4. Lặp qua mảng header để tạo các ô tiêu đề (<th>)
        header.forEach(text => {
            // Tạo ô tiêu đề
            const th = document.createElement('th');
            th.classList.add("col")
            // Gán nội dung văn bản cho ô tiêu đề
            th.textContent = text;
            // Thêm các thuộc tính hoặc class cần thiết (ví dụ: scope="col" cho ngữ nghĩa tốt hơn)
            th.setAttribute('scope', 'col');

            // Thêm ô tiêu đề vào hàng
            headerRow.appendChild(th);
        });

        // 5. Thêm hàng tiêu đề vào thead
        this.thead.appendChild(headerRow);

        // 6. Trả về phần tử thead đã hoàn thành
        return this.thead;
    }

    createRow() {

         const row = document.createElement('tr');
        row.classList.add("row")
            this.tbody.appendChild(row);

        // 4. Trả về phần tử tbody đã hoàn thành
        return row;
    }

    createCell(value){
        const td = document.createElement('td');
                td.classList.add("col")
                // Đảm bảo giá trị hiển thị là chuỗi (có thể xử lý null/undefined)
                td = appendChild(value)
    }
    getRowsByIndex(rowIndex) {
        if (!this.tbody) return undefined; // Kiểm tra xem tbody có tồn tại không

        // Lấy tất cả các hàng (<tr>) con của <tbody>
        const rows = this.tbody.querySelectorAll('tr');

        // Kiểm tra và trả về hàng tại chỉ mục
        if (rowIndex >= 0 && rowIndex < rows.length) {
            return rows[rowIndex];
        }

        console.warn(`Chỉ mục hàng ${rowIndex} nằm ngoài phạm vi.`);
        return undefined;
    }
    getColsByIndex(colIndex) {
        if (!this.tbody) return []; // Kiểm tra xem tbody có tồn tại không

        const columnCells = [];

        // Lấy tất cả các hàng trong tbody
        const rows = this.tbody.querySelectorAll('tr');

        rows.forEach(row => {
            // Lấy tất cả các ô (td) trong hàng hiện tại
            const cells = row.querySelectorAll('td');

            // Kiểm tra xem ô tại chỉ mục cột có tồn tại không
            if (colIndex >= 0 && colIndex < cells.length) {
                columnCells.push(cells[colIndex]);
            }
        });

        if (columnCells.length === 0 && rows.length > 0) {
            console.warn(`Chỉ mục cột ${colIndex} nằm ngoài phạm vi.`);
        }

        return columnCells;
    }
    getCellByIndex(rowIndex, colIndex) {
        // 1. Lấy hàng trước
        const rowElement = this.getRowsByIndex(rowIndex);

        if (!rowElement) {
            // Hàng không tồn tại, trả về undefined
            return undefined;
        }

        // 2. Lấy tất cả các ô (<td>) trong hàng đó
        const cells = rowElement.querySelectorAll('td');

        // 3. Kiểm tra và trả về ô tại chỉ mục cột
        if (colIndex >= 0 && colIndex < cells.length) {
            return cells[colIndex];
        }

        console.warn(`Chỉ mục ô [${rowIndex}, ${colIndex}] nằm ngoài phạm vi.`);
        return undefined;
    }
    addColFirst(content = '') {
        if (!this.tbody) return;

        // 1. Lấy tất cả các hàng trong <tbody>
        const rows = this.tBody.querySelectorAll('tr');

        if (rows.length === 0) {
            console.warn("Không có hàng nào để thêm cột.");
            return;
        }

        // 2. Lặp qua từng hàng và thêm ô mới vào đầu
        rows.forEach(row => {
            const newCell = document.createElement('td');
            newCell.textContent = content; // Thiết lập nội dung

            // Thêm newCell làm node con ĐẦU TIÊN của hàng (<tr>)
            row.prepend(newCell);
        });
    }
    addColLast(content = '') {
        if (!this.tbody) return;

        // 1. Lấy tất cả các hàng trong <tbody>
        const rows = this.tbody.querySelectorAll('tr');

        // 2. Lặp qua từng hàng và thêm ô mới vào cuối
        rows.forEach(row => {
            const newCell = document.createElement('td');
            newCell.textContent = content; // Thiết lập nội dung

            // Thêm newCell làm node con CUỐI CÙNG của hàng (<tr>)
            row.appendChild(newCell);
        });
    }

    addColLast() {
    }

    

    clear() {
        this.table.innerHTML = '';
    }
    clearBody() {
        this.tbody.innerHTML = '';
    }
    create() {
        this.clear()
        this.table.appendChild(this.thead);
        this.table.appendChild(this.tbody);
    }





    _getValuesFromRowData(rowData) {
        if (Array.isArray(rowData)) {
            // Nếu là mảng 2 chiều (ví dụ: [1, "Laptop", 1200])
            return rowData;
        } else if (typeof rowData === 'object' && rowData !== null) {
            // Nếu là mảng các đối tượng (ví dụ: {id: 1, name: "Laptop", price: 1200})
            // NOTE: Phương pháp này sẽ lấy các giá trị theo thứ tự mà chúng xuất hiện trong đối tượng.
            // Để đảm bảo thứ tự khớp với header, bạn cần phải có một danh sách keys/columns đã xác định trước
            // và lặp qua danh sách đó thay vì chỉ sử dụng Object.values().
            return Object.values(rowData);
        }
        return []; // Trả về mảng rỗng nếu không hợp lệ
    }

}