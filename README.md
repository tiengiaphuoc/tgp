# Mộcceutics Care

Bản mẫu ứng dụng chăm sóc tóc tiếng Việt, dùng Node.js 22 trở lên. Không cần cài dependency.

Chạy `npm run dev` tại thư mục này, cổng mặc định 3000 (có thể đổi bằng `PORT`). Kiểm tra cú pháp bằng `npm run check`.

Tính năng: nhật ký sử dụng sáng/tối theo ngày, lịch tùy chỉnh, tải và thu nhỏ ảnh, lọc vùng tóc, so sánh hai ảnh cùng vùng, check-in cảm nhận, xuất JSON, xóa dữ liệu và giới thiệu quyền truy cập tặng kèm/thuê bao riêng.

Bản mẫu chưa có tài khoản, đồng bộ máy chủ, thông báo nền, thanh toán, xác minh đơn hàng hay kết nối cửa hàng. Ảnh và nhật ký lưu bằng localStorage, không mã hóa và có thể mất khi xóa dữ liệu trình duyệt. Không dùng để chẩn đoán hoặc đo mật độ tóc. Nội dung cần chuyên gia duyệt trước phát hành. Chính sách thời hạn tặng kèm và lượng ml/nhát xịt chưa được xác định.

Sản phẩm được thể hiện bằng hình minh họa CSS, chưa phải ảnh chính thức. Font Google được dùng khi có kết nối; có font hệ thống dự phòng.

## Xuất bản demo

Đã chuẩn bị GitHub Pages workflow ở `.github/workflows/pages.yml`. Cần bật Pages với source GitHub Actions cho repository, rồi đẩy mã nguồn lên nhánh `master`. Workflow chỉ tải lên `index.html`, `src/app.js`, `src/style.css`; không đưa ảnh chụp màn hình, dữ liệu cá nhân hoặc máy chủ phát triển lên website. Đường dẫn asset tương đối hỗ trợ website nằm trong thư mục con.

Chưa xuất bản hoặc xác minh địa chỉ công khai. Trong phiên chuẩn bị, API GitHub bị chặn bởi chính sách mạng (HTTP 403 tại bước CONNECT).
