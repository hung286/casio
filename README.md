# CASIO fx-580VN X ClassWiz - Web App Độc Lập & Tương Thích Điện Thoại

Mô phỏng máy tính khoa học **CASIO fx-580VN X** phiên bản web độc lập (Standalone Single-File Web App), tối ưu hóa trải nghiệm trên điện thoại thông minh (smartphone) và máy tính bảng.

---

## 🚀 Các Tệp Dự Án

| Tệp tin | Mô tả |
| :--- | :--- |
| **`casio580_standalone.html`** | **Web độc lập 100% (Single File)**: Nhúng toàn bộ CSS, font TrueType `ES03.TTF` (dạng Base64), và toàn bộ 5 engine tính toán JS. Chỉ cần gửi 1 tệp này là mở được ngay trên điện thoại/máy tính offline mà không cần server hay tệp kèm theo. |
| **`index.html`** | Phiên bản chạy chính tại thư mục gốc (đã được đóng gói sẵn độc lập để click mở trực tiếp hoặc deploy lên hosting như GitHub Pages, Netlify, Vercel). |
| **`index_modular.html`** | Phiên bản mã nguồn dạng module (liên kết tới `css/calculator.css` và `js/*.js`) phục vụ cho việc lập trình, debug và phát triển tiếp. |
| **`build.js`** | Script tự động đóng gói (Node.js): Tự động đọc font, CSS, JS để biên dịch thành tệp web độc lập `casio580_standalone.html` và `index.html`. |
| **`fonts/ES03.TTF`** | Font chữ điện tử LCD chính thức của dòng máy Casio fx-580VN X. |
| **`css/` & `js/`** | Toàn bộ mã nguồn CSS và 5 khối xử lý toán học (Core Engine, Solvers, MathTree 2D Natural Display, ClassWiz OS Modes, UI Controller). |

---

## 📱 Các Tính Năng Tối Ưu Cho Điện Thoại Di Động

1. **Hiển Thị Vừa Vặn Màn Hình (`100dvh` & `clamp()`)**:
   - Sử dụng đơn vị `100dvh` (Dynamic Viewport Height) và các hàm co giãn `clamp()`.
   - **Màn hình LCD và toàn bộ 9 hàng phím bấm hiển thị đồng thời mà không bị cuộn trang lên xuống** trên mọi dòng điện thoại (từ màn hình nhỏ như iPhone SE/Galaxy A đến màn hình lớn như iPhone Pro Max).
   - Thanh công cụ phía trên tự động thu gọn thành 1 hàng biểu tượng tinh gọn (`🔊` `📐` `🎨` `📜` `💡`).

2. **Phản Hồi Chạm Không Độ Trễ (Instant Touch & Haptics)**:
   - Sử dụng sự kiện `pointerdown` loại bỏ hoàn toàn độ trễ 300ms của thao tác chạm cảm ứng trên di động.
   - Chống kích hoạt đúp (double-tap zoom) khi gõ phím nhanh.
   - **Rung phản hồi xúc giác (Haptic Feedback)**: Nhấn phím sẽ tạo độ rung cơ học nhẹ chân thực (`navigator.vibrate`) trên các thiết bị Android/hỗ trợ haptics.
   - Hiệu ứng thụt phím vật lý khi ngón tay chạm và nhả.

3. **Mở Khóa Âm Thanh Chuẩn iOS / Android (Web Audio API)**:
   - Tự động kích hoạt AudioContext ngay từ cú chạm đầu tiên, tương thích tuyệt đối với chính sách hạn chế phát âm thanh tự động của Apple Safari và Google Chrome.

4. **Tích Hợp Sẵn Font LCD Casio Độc Quyền (Base64 Data URI)**:
   - Font `ES03.TTF` được nhúng trực tiếp vào CSS dưới dạng Base64.
   - Mọi máy điện thoại (dù là iPhone hay Android vốn không có sẵn font Casio) đều hiển thị các chữ số, căn bậc hai, phân số 2 tầng Natural Display sắc nét 100% giống máy Casio thật.

5. **Chạm Vào Màn Hình Để Đặt Con Trỏ (Touch-to-Cursor)**:
   - Có thể chạm trực tiếp vào bất kỳ vị trí nào trên biểu thức toán học tại màn hình LCD để di chuyển con trỏ soạn thảo đến đó.

6. **Tương Thích Vùng An Toàn Màn Hình (Safe Area Insets)**:
   - Hỗ trợ Dynamic Island, tai thỏ và thanh gạt điều hướng đáy màn hình trên iPhone và Android (`viewport-fit=cover`, `env(safe-area-inset-*)`).

7. **Cài Đặt Dạng Ứng Dụng (PWA / Add to Home Screen)**:
   - Đầy đủ các thẻ meta `apple-mobile-web-app-capable`, `mobile-web-app-capable`, biểu tượng `apple-touch-icon`.
   - Người dùng có thể nhấn **"Thêm vào màn hình chính" (Add to Home Screen)** trên Safari/Chrome để sử dụng toàn màn hình như ứng dụng gốc không có thanh địa chỉ duyệt web.

---

## 🛠 Cách Biên Dịch Lại (Khi Có Chỉnh Sửa Mã Nguồn)

Nếu bạn chỉnh sửa mã nguồn trong thư mục `css/` hoặc `js/`:

```bash
node build.js
```

Script sẽ tự động đọc font `fonts/ES03.TTF`, nén Base64, gộp toàn bộ mã và cập nhật lại cả 2 tệp `casio580_standalone.html` và `index.html`.
