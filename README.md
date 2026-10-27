# Mộcceutics Care

Bản mẫu ứng dụng chăm sóc tóc tiếng Việt, dùng Node.js 22 trở lên. Không cần cài dependency.

Chạy `npm run dev` tại thư mục này, cổng mặc định 3000 (có thể đổi bằng `PORT`). Kiểm tra cú pháp bằng `npm run check`.

Tính năng: nhật ký sử dụng sáng/tối theo ngày, lịch tùy chỉnh, tải và thu nhỏ ảnh, lọc vùng tóc, so sánh hai ảnh cùng vùng, check-in cảm nhận, xuất JSON, xóa dữ liệu và giới thiệu quyền truy cập tặng kèm/thuê bao riêng.

Bản mẫu chưa có tài khoản, đồng bộ máy chủ, thông báo nền, thanh toán, xác minh đơn hàng hay kết nối cửa hàng. Ảnh và nhật ký lưu bằng localStorage, không mã hóa và có thể mất khi xóa dữ liệu trình duyệt. Không dùng để chẩn đoán hoặc đo mật độ tóc. Nội dung cần chuyên gia duyệt trước phát hành. Chính sách thời hạn tặng kèm và lượng ml/nhát xịt chưa được xác định.

Sản phẩm được thể hiện bằng hình minh họa CSS, chưa phải ảnh chính thức. Font Google được dùng khi có kết nối; có font hệ thống dự phòng.

## Xuất bản demo

GitHub Pages phục vụ nhánh `master`, thư mục gốc, tại https://tiengiaphuoc.github.io/tgp/ với HTTPS. Không thêm `CNAME` trừ khi đã cấu hình và xác minh tên miền riêng. Xóa CNAME cũ đã khôi phục địa chỉ mặc định.

Workflow `.github/workflows/pages.yml` chỉ kiểm tra website sau khi cập nhật; việc xuất bản do workflow Pages mặc định của GitHub thực hiện, tránh hai quy trình triển khai cùng lúc. Kiểm tra gồm HTTP, nội dung HTML/JS/CSS và thao tác trên trình duyệt thật bằng `scripts/public-smoke.cjs`. Workflow không dùng ảnh hoặc thông tin khách hàng thực.
