# Mộcceutics Care

Bản mẫu ứng dụng chăm sóc tóc tiếng Việt, dùng Node.js 22 trở lên. Không cần cài dependency.

Chạy `npm run dev` tại thư mục này, cổng mặc định 3000 (có thể đổi bằng `PORT`). Kiểm tra cú pháp bằng `npm run check`.

Tính năng: nhật ký sử dụng sáng/tối theo ngày, lịch tùy chỉnh, tải và thu nhỏ ảnh, lọc vùng tóc, so sánh hai ảnh cùng vùng, check-in cảm nhận, xuất JSON, xóa dữ liệu và giới thiệu quyền truy cập tặng kèm/thuê bao riêng.

Bản mẫu chưa có tài khoản, đồng bộ máy chủ, thông báo nền, thanh toán, xác minh đơn hàng hay kết nối cửa hàng. Ảnh và nhật ký lưu bằng localStorage, không mã hóa và có thể mất khi xóa dữ liệu trình duyệt. Không dùng để chẩn đoán hoặc đo mật độ tóc. Nội dung cần chuyên gia duyệt trước phát hành. Chính sách thời hạn tặng kèm và lượng ml/nhát xịt chưa được xác định.

Sản phẩm được thể hiện bằng hình minh họa CSS, chưa phải ảnh chính thức. Font Google được dùng khi có kết nối; có font hệ thống dự phòng.

## Xuất bản demo

GitHub Pages phục vụ nhánh `master`, thư mục gốc, tại https://tiengiaphuoc.github.io/tgp/ với HTTPS. Không thêm `CNAME` trừ khi đã cấu hình và xác minh tên miền riêng. Xóa CNAME cũ đã khôi phục địa chỉ mặc định.

Workflow `.github/workflows/pages.yml` chỉ kiểm tra website sau khi cập nhật; việc xuất bản do workflow Pages mặc định của GitHub thực hiện, tránh hai quy trình triển khai cùng lúc. Kiểm tra gồm HTTP, nội dung HTML/JS/CSS và thao tác trên trình duyệt thật bằng `scripts/public-smoke.cjs`. Workflow không dùng ảnh hoặc thông tin khách hàng thực.

## Trang quản trị minh họa

Mở `admin.html` tại cùng website. Có 12 khách mẫu, tìm kiếm/lọc/sắp xếp/phân trang, phân công hàng loạt, ghi chú hồ sơ, đánh dấu hỗ trợ, trạng thái chia sẻ ảnh minh họa, xuất CSV và báo cáo mẫu. Thay đổi chỉ lưu tại `moc-admin-demo` trong localStorage, độc lập dữ liệu app khách hàng. Không có đăng nhập, truy cập dữ liệu thật, gửi tin nhắn hay thanh toán. Không nhập dữ liệu khách thật vào trang demo công khai.

Vận hành thật cần backend đăng nhập quản trị, phân quyền máy chủ, cơ sở dữ liệu và kho ảnh riêng tư; kiểm tra đồng ý chia sẻ ở máy chủ, nhật ký truy cập và quy trình xuất/xóa dữ liệu. Kiểm tra trình duyệt quản trị: `scripts/admin-smoke.cjs`.

## Quét & theo dõi tóc

Mở `/#progress` (hoặc `/tgp/#progress` trên Pages). Có 5 vùng chụp, ảnh tham chiếu, điều kiện chụp, cảm nhận tự khai, báo cáo từng ảnh và thanh kéo so sánh cùng vùng. `src/hair-scan.js` tính độ sáng trung bình, tỷ lệ pixel sáng và phương sai Laplacian trên ảnh thu nhỏ ngay trên thiết bị. Đây là kiểm tra chất lượng ảnh theo ngưỡng cơ bản, chưa kiểm định lâm sàng; không nhận diện tóc/da đầu, không đo mật độ, đếm nang tóc hoặc chẩn đoán. Báo cáo phân biệt rõ dữ liệu ảnh và tự khai; ảnh cũ giữ nguyên, không được tự điền kết quả.

Không có API AI hoặc máy chủ xử lý ảnh. Ngưỡng chất lượng không chứng minh ảnh đủ điều kiện đánh giá y khoa. Nội dung khuyến nghị cần bác sĩ duyệt trước dùng thương mại. Tham khảo do người dùng cung cấp: HairCode App Store ID 6745830661; phiên phát triển không truy cập được Apple vì HTTP CONNECT 403, không xác minh thuật toán hoặc tính năng hiện tại của HairCode.

Kiểm tra số đo bằng `node scripts/scan-math-test.mjs`; kiểm tra trình duyệt bằng `scripts/scan-smoke.cjs`.

## Kết nối AI (chưa kích hoạt)

Phần Tiến trình có mục Mộc AI riêng với trạng thái kết nối thật. Giao diện chưa tạo kết quả AI vì chưa có backend, dịch vụ và xác thực người dùng. Cầu nối API và kiểm tra phản hồi ở `src/ai-client.js`; xem `docs/AI-INTEGRATION.md` để triển khai dịch vụ có xác thực và chính sách xử lý ảnh trước khi bật. Không đặt API key trong website tĩnh. Kiểm thử dùng fixture không thay thế việc thử mô hình thật.

## Giao diện Botanical Studio v2

`src/theme.css` là lớp giao diện chung cho app và trang quản trị: xanh rừng, vàng champagne, nền kem, hình khối nổi nhẹ và kích thước chữ lớn hơn. `assets/mocceutics-3d.png` là hình minh họa 3D tạo riêng, không phải ảnh bao bì sản phẩm thực. Ảnh tĩnh được lưu cùng website, không phụ thuộc dịch vụ ảnh ngoài. Hỗ trợ giảm chuyển động theo hệ điều hành.

Kiểm tra responsive và tải ảnh bằng `scripts/design-smoke.cjs` ở 360/768/1440px.
