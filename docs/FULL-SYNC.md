# Đồng bộ tài khoản và quản trị toàn bộ

## Trạng thái triển khai

Quản trị và khuyến mãi đang kết nối. Các phần đồng bộ chi tiết và bài viết chung được chuẩn bị trong mã nguồn, **chưa bật cho khách**: chủ dự án cần chạy `supabase/full-sync.sql` sau các SQL đã có, cấu hình SMTP, thử xác nhận email rồi mới bật `enabled`, `fullSyncEnabled`, `articlesEnabled` trong `src/cloud-config.js`. Không bật trước khi hoàn tất; dữ liệu hiện có trên thiết bị được giữ. Các kiểm tra tự động dùng tài khoản/Storage mô phỏng, không gửi thư thật hay tạo khách thử trên dự án.

## Phạm vi

- Hồ sơ liên hệ và thống kê: chia sẻ cơ bản đã có, yêu cầu email đã xác nhận.
- Khi khách chọn thêm đồng ý **đồng bộ chi tiết**: loại tóc/da đầu, tuổi/giới tính đã khai, lịch sử sáng/tối, lịch gội, giờ nhắc, cảm nhận và ghi chú, lượng sản phẩm còn lại, ảnh và dữ liệu báo cáo từ ảnh. Mỗi lần lưu tự đưa lên tài khoản khi có mạng; lỗi vẫn giữ bản trên máy và báo trạng thái. Đồng ý chia sẻ cơ bản cũ không tự chuyển thành đồng ý ảnh/sức khỏe.
- Ảnh vào bucket riêng tư `customer-hair`, không vào GitHub. Tối đa 100 ảnh/tài khoản, 5 MB/ảnh JPEG. Ảnh cũ không phải JPEG được báo để xuất bản sao/chụp lại, không tự bỏ qua hoặc chuyển đổi làm thay đổi ảnh. Snapshot JSON tối đa 1 MB, không cắt mất lịch sử âm thầm.
- Mã sản phẩm, quyền lợi, yêu cầu soi tóc và kết quả soi: giữ nguồn chuẩn trên bảng server riêng đã có, không tin trạng thái ưu đãi do snapshot của khách khai.
- Bài viết công khai: quản trị đăng nhập → **Bài viết chung**, soạn và chọn Sẵn sàng công bố, bấm **Công bố bộ bài lên app**. Không tải JSON lên GitHub nữa. Bản nháp biên tập vẫn lưu trên máy và có nút sao lưu, chưa đồng bộ nháp giữa quản trị viên. Bộ bài hiện tại 4 bài được giữ làm nguồn khởi tạo khi server chưa có publication; xuất bản lần đầu giữ các bài đang có cộng sửa đổi đã chọn sẵn sàng. Bài ẩn bị gỡ và bản nháp không công bố. Hai quản trị cùng sửa phải tải lại sau xung đột; không ghi đè tự động. Khách mở/làm mới app để thấy bộ bài mới.

## Đổi máy, xung đột và xóa

Khách xác nhận cùng email rồi chọn **Khôi phục dữ liệu tài khoản trên thiết bị này**. Có thể khôi phục ngay trong khai hồ sơ sau xác nhận email. App hỏi xác nhận trước khi thay dữ liệu máy. Chỉ thay khi tải đủ ảnh và lưu thành công; nếu máy thay đổi dữ liệu trong lúc tải thì dừng, tránh mất nội dung vừa ghi. Cần xuất nhật ký để giữ riêng bản máy cũ. Phiên đăng nhập không được đưa vào snapshot.

Mỗi bản có số phiên bản. Thiết bị mới/cũ không được tự đè bản mới; lỗi yêu cầu khôi phục để kiểm tra. Không có trộn từng dòng tự động hoặc cơ chế ghi đè cưỡng bức.

Quản trị mở hồ sơ → **Xem nhật ký & ảnh chia sẻ**. Chỉ dữ liệu khách đã đồng ý mới có. Quản trị đọc ảnh/nhật ký và ghi chú nội bộ riêng, không sửa lịch sử do khách ghi nhận.

Mỗi lần đồng ý chia sẻ có mã phiên bản đồng ý; rút quyền trên server làm mã cũ ở thiết bị khác mất hiệu lực, không được ghi tiếp từ dữ liệu cũ. Khách có thể ngừng chia sẻ chi tiết và xóa backup/ảnh server, vẫn giữ bản trên máy. Xóa chia sẻ cơ bản cũng xóa backup; lịch sử mã/quyền lợi và dịch vụ soi giữ riêng theo chính sách đã thông báo. Storage API xóa byte sau khi bỏ tham chiếu; nếu gián đoạn có thể còn tệp riêng tư mồ côi. Bản ảnh trên thiết bị vẫn chịu giới hạn bộ nhớ trình duyệt, nên có thể cần xuất sao lưu/bớt ảnh khi máy đầy. Quản trị cần quy trình đối soát/xóa tệp mồ côi và thời hạn giữ dữ liệu; xóa Auth/cascade bảng không tự xóa Storage. URL ảnh ký có hạn 5 phút, URL đã phát hành có thể còn xem đến khi hết hạn. Không mặc định ai có URL được xem lâu dài.

## Cấu hình email (SMTP)

1. Chủ thương hiệu chọn dịch vụ gửi email giao dịch, ví dụ Resend hoặc Brevo, và dùng địa chỉ gửi thuộc tên miền mình quản lý. Cần xác minh tên miền/DNS theo dịch vụ. Nếu chưa có tên miền, cần đăng ký hoặc chọn dịch vụ có thể cung cấp địa chỉ gửi phù hợp; không dùng địa chỉ thử nghiệm chỉ gửi cho chủ tài khoản để triển khai nhiều khách.
2. Trong Supabase của dự án → Authentication → Email/SMTP Settings (hoặc cấu hình Email provider), bật custom SMTP. Nhập host, port, username, password/API key SMTP và Sender email/name do dịch vụ cung cấp. Nhập trực tiếp trong Supabase; không gửi mật khẩu/SMTP key vào chat hay GitHub.
3. Bật Email và Confirm email. Dùng mẫu `supabase/email-templates/verify-email.html` cho Confirm Sign Up và Magic Link, mẫu change-email cho Change Email Address. Phải có `{{ .Token }}` để thư trả mã số theo giao diện app; không chỉ dựa vào đường dẫn magic link. Đặt Site URL là `https://tiengiaphuoc.github.io/tgp/` và cấu hình redirect phù hợp nếu dùng liên kết.
4. Kiểm tra hộp thư ít nhất một địa chỉ ngoài đội dự án: nhận mã, nhập mã sai không mở app, mã đúng xác nhận, tải lại vẫn đúng tài khoản; đổi thiết bị khôi phục được. Thử cấp mã sản phẩm hợp lệ, ghi nhật ký/ảnh, xem trong quản trị, ẩn/công bố bài và thu hồi chia sẻ. Kiểm tra giới hạn OTP, SMTP, dung lượng Storage và kế hoạch chống lạm dụng. Chưa tích hợp CAPTCHA.
5. Bật cấu hình toàn bộ sau khi các bước trên đạt. Không vô hiệu hóa xác nhận email hay dùng service_role trong frontend để bỏ qua giới hạn gửi thư.

Hướng dẫn thao tác bằng nút: `sync-setup.html`, có thêm lựa chọn Gmail SMTP để chạy thử nếu chủ thương hiệu chưa có dịch vụ gửi email giao dịch.
