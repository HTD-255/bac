const view=`<div class="loading-overlay">
    <div class="spinner-border text-success"></div>
  </div>`

  export class LoadingOverlay{
    element = null;

    constructor(id){
        this.element = this._createElement(id);
    }
    _createElement(id) {
// 1. Tạo một thẻ <div> tạm thời
        const tempDiv = document.createElement('div');
        
        // 2. Chèn chuỗi HTML vào thẻ tạm thời, biến nó thành phần tử DOM.
        tempDiv.innerHTML = view.trim();

        // 3. Lấy ra phần tử DOM con đầu tiên, đây là phần tử loading-overlay thực tế.
        const loadingElement = tempDiv.firstChild;

        // 4. Thiết lập ID
        if (loadingElement) {
            loadingElement.id = id;
        }
        
        // 5. Trả về phần tử DOM đã hoàn chỉnh
        return loadingElement;
  }
show() {
    if (this.element) {
      // Thêm class 'active' để hiển thị (Bạn cần CSS để xử lý hiệu ứng này)
      this.element.classList.add('active');
    }
  }

  /**
   * Ẩn lớp phủ tải
   */
  hide() {
    if (this.element) {
      // Xóa class 'active' để ẩn
      this.element.classList.remove('active');
    }
  }
  getElement(){
    return this.element;
  }
  }

 
