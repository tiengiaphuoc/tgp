# Kết nối hồ sơ khách hàng Mộcceutics

Trạng thái ban đầu: chưa có dự án Supabase hoặc khóa kết nối. Mã tích hợp sẵn, nhưng **chưa gửi hồ sơ thật lên cơ sở dữ liệu**. GitHub Pages chỉ phục vụ giao diện, Supabase lưu dữ liệu và kiểm tra quyền ở máy chủ.

Hướng dẫn có nút sao chép: https://tiengiaphuoc.github.io/tgp/database-setup.html

## 1. Tạo dự án

1. Vào https://supabase.com/dashboard và tạo tài khoản/dự án riêng của thương hiệu. Chọn khu vực Singapore nếu phù hợp; xem mức phí và giới hạn trước khi tạo.
2. Trong SQL Editor, mở một truy vấn, dán toàn bộ nội dung `supabase/setup.sql`, bấm Run. Tệp không chứa dữ liệu khách.
3. Authentication → Sign In / Providers → Anonymous Sign-Ins: bật đăng nhập ẩn danh. Đây là danh tính thiết bị, khách không nhập mật khẩu. Anonymous sign-in có giới hạn tốc độ; có thể cần thiết lập CAPTCHA và công suất trước khi chạy chiến dịch đông người. App hiện chưa tích hợp CAPTCHA.

## 2. Bật kết nối cho toàn bộ khách

Trong Settings / API hoặc Connect, lấy **Project URL** và **publishable key** (`sb_publishable_…`) hoặc khóa **anon** cũ. Đây là thông tin công khai dành cho trình duyệt.

Sửa `src/cloud-config.js`:

```js
export const cloudConfig = Object.freeze({
  enabled: true,
  url: 'https://PROJECT-ID.supabase.co',
  publishableKey: 'sb_publishable_...'
});
```

Commit thay đổi lên master. Không chỉ lưu cấu hình riêng trên trình duyệt quản trị, vì app khách cũng cần cấu hình này. Không đưa service_role, `sb_secret_…`, mật khẩu database, mật khẩu quản trị hoặc access token vào GitHub/chat.

Có thể gửi Project URL và publishable/anon key cho người triển khai để cấu hình giúp. Không cần gửi mật khẩu.

## 3. Tạo quản trị viên

1. Authentication → Users → Add user → Create new user: tạo email và mật khẩu mạnh cho quản trị viên, xác nhận email trong dashboard. Tạo mật khẩu trực tiếp tại Supabase; không gửi cho người triển khai.
2. Sao chép User UID của người đó. SQL Editor chạy:

```sql
insert into public.moc_admins (user_id)
values ('USER-UID-QUAN-TRI')
on conflict do nothing;
```

3. Mở https://tiengiaphuoc.github.io/tgp/admin.html#live và đăng nhập bằng tài khoản vừa tạo. Khách không có quyền này, dù có biết link admin hoặc publishable key.
4. `admin.html#demo` vẫn là bộ dữ liệu minh họa riêng, không phải hồ sơ thật. Trang bài viết vẫn ở `admin.html#articles` và dùng quy trình xuất bản JSON cũ.

## 4. Thử một hồ sơ trước khi mời khách

- Mở app trong trình duyệt mới; nhập tên, thông tin liên hệ tùy chọn và **đồng ý gửi hồ sơ về Mộcceutics**.
- Kiểm tra app báo “Đã gửi hồ sơ về Mộcceutics”, rồi làm mới trang quản trị thật. Kiểm tra tên/SĐT/email/mục tiêu khớp.
- Thử ghi nhận sáng/tối: tổng ghi nhận tự cập nhật; đây là dữ liệu khách tự xác nhận, không chứng minh dùng sản phẩm hoặc hiệu quả.
- Dùng trình duyệt khách thứ hai: không được đọc hồ sơ khách thứ nhất hoặc bảng ghi chú qua API. Đăng nhập bằng tài khoản không có trong moc_admins: phải bị từ chối.
- Thử mất mạng, mở lại mạng: bản trên thiết bị vẫn giữ và tự gửi lại. Không tự điền trạng thái đã đồng bộ nếu API lỗi.
- Vào Cá nhân → Ngừng chia sẻ & xóa hồ sơ đã gửi: hồ sơ và ghi chú liên quan phải biến mất trong quản trị sau khi làm mới. Ảnh/nhật ký local vẫn còn. Nếu mạng lỗi, app không báo xóa thành công.

## Phạm vi dữ liệu và giới hạn

- Chỉ gửi tên, điện thoại/email tùy chọn, mục tiêu, giờ nhắc và thống kê số lần tự ghi nhận, ngày gần nhất, thời điểm đồng ý. Không gửi ảnh, ghi chú sức khỏe, triệu chứng hoặc kết quả quét.
- Khách chưa đồng ý: không tạo phiên đăng nhập ẩn danh và không gửi hồ sơ. Quyền được kiểm tra bằng Row Level Security trong database, không chỉ ở giao diện.
- Danh tính khách gắn với phiên ẩn danh trong trình duyệt. Xóa dữ liệu trình duyệt, đổi điện thoại hoặc dùng trình duyệt khác có thể tạo hồ sơ khác. Chưa có đăng nhập khách bằng OTP/khôi phục liên thiết bị. Số điện thoại/email chưa xác minh. Nếu đã mất phiên thiết bị, app không thể xác nhận xóa hồ sơ cũ; cần chủ dự án xử lý hồ sơ đó trong Supabase.
- Khi rút chia sẻ, chỉ xóa hồ sơ và ghi chú chăm sóc; tài khoản ẩn danh kỹ thuật có thể còn trong Supabase Auth để dùng lại trên thiết bị. Việc xóa toàn bộ tài khoản Auth cần thao tác quản trị máy chủ.
- Ảnh và nhật ký chi tiết chưa đồng bộ. Thống kê gửi lên là tổng tích lũy, không phải biểu đồ lịch sử hoặc số liệu kinh doanh được xác minh.
- Quản trị dùng sessionStorage của tab. Đăng xuất để xóa phiên khỏi tab; vẫn cần bảo vệ thiết bị, email và mật khẩu quản trị.
- Bài viết vẫn xuất bản bằng JSON; không tự chuyển sang database. Chưa có thông báo đẩy, nhắn tin, thanh toán hoặc xác minh đơn hàng.
- Kiểm tra giới hạn, sao lưu, khu vực lưu trữ và chính sách quyền riêng tư của dịch vụ trước vận hành. Chưa có dịch vụ Supabase thật trong môi trường phát triển để kiểm thử đầu cuối cho đến khi chủ thương hiệu cấu hình dự án.
