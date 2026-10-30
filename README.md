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

## Biên tập bài viết

Mở `admin.html#articles`: tạo/sửa bài, ảnh bìa, chuyên mục, nổi bật, tác giả, người/ngày duyệt và nguồn tham khảo. Bản nháp chỉ lưu trên thiết bị trong `moc-editor-v1`, chưa có đăng nhập hoặc CMS máy chủ. Chọn “Sẵn sàng xuất tệp” không tự xuất bản cho khách.

Bấm **Xuất tệp cập nhật app** để tải `posts.json`; đăng nhập GitHub có quyền repository và tải thay tệp `content/posts.json` trên nhánh `master` tại https://github.com/tiengiaphuoc/tgp/upload/master/content. Sau khi Pages xuất bản, app tải nội dung mới từ tệp JSON. Không đưa token vào frontend. Bản nháp không được xuất; chỉnh nháp bài cũ vẫn giữ phiên bản đã công khai trong tệp xuất; bài đánh dấu ẩn bị loại khỏi bản cập nhật. Cần kiểm tra danh sách trước khi tải lên vì đây là tệp thay toàn bộ bộ bài.

Liên kết “Xem app với nội dung chuẩn bị” dùng `?preview=articles` và chỉ xem bản chuẩn bị trên cùng trình duyệt. App thường không đọc bản nháp từ localStorage. Có sao lưu/khôi phục bản nháp riêng, không nhầm với tệp xuất bản. Nội dung là văn bản, không thực thi HTML. Ảnh được thu nhỏ JPEG và nhúng trong tệp JSON, phù hợp bộ bài nhỏ (tối đa 100 bài); thư viện lớn cần backend và kho ảnh.

Thông tin người duyệt là dữ liệu biên tập tự khai, không xác thực danh tính chuyên môn. Có thông báo rõ trong bài đọc. `scripts/articles-test.mjs` và `scripts/articles-smoke.cjs` kiểm tra bảo toàn bản công khai, không xuất nháp, đọc an toàn và thao tác editor.

## Ảnh mờ căn góc chụp

Trong Quét & ghi nhận, app dùng ảnh gần nhất đúng vùng đã chọn làm lớp mờ (độ trong suốt mặc định 75%, điều chỉnh 0–100%; 100% chỉ hiện ảnh mới, 0% ảnh cũ đậm; có nút ẩn/hiện và các mức Chỉ ảnh mới/Trộn 50-50/Chỉ ảnh cũ). Không có ảnh đúng vùng thì không lấy ảnh vùng khác thay thế. Camera chỉ mở sau thao tác người dùng, mặc định selfie (camera trước), có nút đổi trước/sau. Hiển thị selfie theo gương và lật đồng thời ảnh mờ để căn nhất quán; ảnh lưu giữ hướng gốc, không lật gương. Có hẹn giờ chụp ngay/3/5 giây, mặc định 3 giây; đổi camera hoặc đóng màn hình sẽ hủy lượt đếm. Khung theo tỷ lệ ảnh tham chiếu; ảnh camera được cắt giữa đúng tỷ lệ khung và không ghép lớp mờ, nhãn hoặc dấu căn vào ảnh lưu. Ảnh chọn từ thiết bị cũng được xem cùng lớp mờ để kiểm tra góc trước khi lưu.

Camera tắt khi chụp, tắt thủ công, đóng/thay modal, rời tab hoặc pagehide; yêu cầu cấp quyền trả về muộn cũng bị đóng. Không mở được camera vẫn có ô tải/chụp ảnh thường. Trình duyệt có thể cần HTTPS và quyền camera. Đây là hướng dẫn căn bằng mắt, chưa tự xác nhận hai góc trùng khớp. Kiểm tra camera trong `scripts/alignment-smoke.cjs` dùng luồng video giả lập và xác nhận lớp mờ không bị lưu vào ảnh; chưa thay thế kiểm tra camera vật lý trên từng thiết bị.

Kiểm thử `scripts/transparency-smoke.cjs` đọc pixel từ ảnh chụp khung hiển thị thực để xác nhận hai lớp trộn đúng tỷ lệ, cả với ảnh tải lên và camera giả lập; không chỉ kiểm tra thuộc tính CSS.

## Dữ liệu khách hàng chung (tích hợp Supabase)

`src/cloud-config.js` mặc định `enabled: false`: chưa có dự án, chưa truyền hồ sơ thật. Hướng dẫn có nút sao chép tại `database-setup.html`; chi tiết trong [DATABASE-SETUP.md](docs/DATABASE-SETUP.md). Chỉ publishable/anon key được đưa vào frontend, không dùng service_role. `supabase/setup.sql` tạo bảng, RLS và quyền quản trị.

Khi cấu hình xong: khách đăng nhập ẩn danh theo trình duyệt, chỉ đồng bộ sau khi tự chọn đồng ý; dữ liệu gồm hồ sơ liên hệ và thống kê ghi nhận, không có ảnh/triệu chứng/ghi chú sức khỏe. `admin.html#live` hoặc admin mặc định khi bật Supabase dùng đăng nhập quản trị và quyền máy chủ. `admin.html#demo` giữ bộ dữ liệu mẫu; `#articles` giữ editor xuất bản JSON. Các chức năng mẫu không được coi là dữ liệu thật.

Khách có thể ngừng chia sẻ và xóa hồ sơ chung trong Cá nhân. Đổi máy/xóa trình duyệt có thể tạo danh tính mới, chưa có khôi phục OTP. Ảnh vẫn ở thiết bị. Ghi chú quản trị thật được lưu ở bảng riêng chỉ quản trị viên được truy cập.

Kiểm thử `cloud-client-test.mjs` và `cloud-smoke.cjs` dùng API giả lập. `database-policy-test.mjs` chạy SQL thực bằng PostgreSQL/PGlite để kiểm tra quyền đọc/sửa/xóa, chống giả danh và chặn truy cập ghi chú. Đây chưa phải kiểm thử Supabase Auth/hosting thật; cần thử dự án thật theo tài liệu trước vận hành.
