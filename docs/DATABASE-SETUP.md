# Kết nối hồ sơ khách hàng Mộcceutics

Trạng thái ban đầu: chưa có dự án Supabase hoặc khóa kết nối. Mã tích hợp sẵn, nhưng **chưa gửi hồ sơ thật lên cơ sở dữ liệu**. GitHub Pages chỉ phục vụ giao diện, Supabase lưu dữ liệu và kiểm tra quyền ở máy chủ.

Hướng dẫn có nút sao chép: https://tiengiaphuoc.github.io/tgp/database-setup.html

## 1. Tạo dự án

1. Vào https://supabase.com/dashboard và tạo tài khoản/dự án riêng của thương hiệu. Chọn khu vực Singapore nếu phù hợp; xem mức phí và giới hạn trước khi tạo.
2. Trong SQL Editor, mở một truy vấn, dán toàn bộ nội dung `supabase/setup.sql`, bấm Run. Tệp không chứa dữ liệu khách.
3. Thiết lập Email OTP theo mục “Xác nhận hộp thư khách hàng” bên dưới: bật Email/Confirm email, SMTP và mẫu thư có mã. Luồng mới không cần tạo tài khoản ẩn danh; phiên ẩn danh cũ được liên kết email trên cùng ID. Kiểm tra giới hạn tốc độ, khả năng gửi và chống lạm dụng trước khi mời nhiều khách. App hiện chưa tích hợp CAPTCHA.

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

- Chỉ gửi tên, email và mã sản phẩm bắt buộc trong form, điện thoại tùy chọn, mục tiêu, giờ nhắc và thống kê số lần tự ghi nhận, ngày gần nhất, thời điểm đồng ý. Không gửi ảnh, ghi chú sức khỏe, triệu chứng hoặc kết quả quét.
- Khách chưa đồng ý: không tạo phiên đăng nhập ẩn danh và không gửi hồ sơ. Quyền được kiểm tra bằng Row Level Security trong database, không chỉ ở giao diện.
- Danh tính khách gắn với phiên ẩn danh trong trình duyệt. Xóa dữ liệu trình duyệt, đổi điện thoại hoặc dùng trình duyệt khác có thể tạo hồ sơ khác. Chưa có đăng nhập khách bằng OTP/khôi phục liên thiết bị. Số điện thoại/email chưa xác minh. Nếu đã mất phiên thiết bị, app không thể xác nhận xóa hồ sơ cũ; cần chủ dự án xử lý hồ sơ đó trong Supabase.
- Khi rút chia sẻ, chỉ xóa hồ sơ và ghi chú chăm sóc; tài khoản ẩn danh kỹ thuật có thể còn trong Supabase Auth để dùng lại trên thiết bị. Việc xóa toàn bộ tài khoản Auth cần thao tác quản trị máy chủ.
- Ảnh và nhật ký chi tiết chưa đồng bộ. Thống kê gửi lên là tổng tích lũy, không phải biểu đồ lịch sử hoặc số liệu kinh doanh được xác minh.
- Quản trị dùng sessionStorage của tab. Đăng xuất để xóa phiên khỏi tab; vẫn cần bảo vệ thiết bị, email và mật khẩu quản trị.
- Bài viết vẫn xuất bản bằng JSON; không tự chuyển sang database. Chưa có thông báo đẩy, nhắn tin, thanh toán hoặc xác minh đơn hàng.
- Kiểm tra giới hạn, sao lưu, khu vực lưu trữ và chính sách quyền riêng tư của dịch vụ trước vận hành. Chưa có dịch vụ Supabase thật trong môi trường phát triển để kiểm thử đầu cuối cho đến khi chủ thương hiệu cấu hình dự án.

## Bộ mã sản phẩm và chính sách tặng app

Chạy thêm `supabase/product-codes.sql` sau `setup.sql`. Nút Sao chép SQL trên trang `database-setup.html` đã gộp hai tệp; nếu đã cài trước đây, chỉ cần chạy tệp bổ sung.

Sau khi cấu hình Supabase, đăng nhập quản trị thật → **Quản lý mã sản phẩm**. Nhập mã đã in (mỗi dòng một mã, tối đa 200/lần), số ngày tặng và hạn kích hoạt tùy chọn. Mặc định 30 trong form chỉ là giá trị khởi đầu để sửa, chưa phải chính sách đã công bố. Hạn ngày tính đến cuối ngày giờ Việt Nam. Có nút tạo 20 mã ngẫu nhiên mạnh; cần lưu vào hệ thống rồi mới in/gửi cho khách. Không đăng bộ mã thật lên GitHub, không gửi qua chat công khai. Không có mã thực được tạo trong source.

Khách nhập mã ở lần khai báo đầu hoặc trong Cá nhân, lưu hồ sơ và đồng ý chia sẻ. Khi lưu, app kiểm tra/kích hoạt qua máy chủ; có nút kiểm tra lại trong phần ưu đãi. Chưa cấu hình hoặc lỗi mạng: mã chỉ là dữ liệu chưa xác thực, không tự cấp quyền. Kiểm tra bên quản trị không tiêu thụ mã.

Một mã dùng cho một hồ sơ; gửi lại cùng mã không gia hạn thêm; mã mua tiếp còn hợp lệ sẽ cộng số ngày vào quyền đang còn (hoặc tính từ hiện tại khi quyền đã hết). Mã hết hạn kích hoạt/bị khóa không được dùng mới. Khóa mã không rút lại quyền đã tặng. Mã trùng trong đợt nhập được bỏ qua, không sửa thời hạn mã cũ. Máy chủ khóa giao dịch để tránh dùng hai lần, giới hạn 8 lần thử/15 phút theo danh tính thiết bị.

Quyền lợi và lịch sử đổi mã lưu riêng ở máy chủ, khách không tự sửa thời hạn. Chúng không bị đặt lại khi khách xóa hồ sơ liên hệ; lịch sử mã đã dùng được giữ để ngăn tái sử dụng, kể cả khi tài khoản Auth bị xóa (ID có thể được bỏ nhưng mã vẫn đã dùng). Khách đổi máy/xóa trình duyệt chưa khôi phục được quyền bằng OTP; cần thương hiệu hỗ trợ, không tự chuyển quyền chỉ vì trùng số điện thoại chưa xác minh.

Đây là quản lý thời gian ưu đãi. App hiện vẫn là bản trải nghiệm miễn phí, chưa thu tiền hoặc triển khai khóa tính năng trả phí. Khi triển khai tính năng có phí, API phía máy chủ cũng phải kiểm tra entitlement; không dùng nhãn hiển thị/localStorage làm cơ chế chặn quyền.

## Xác nhận hộp thư khách hàng trước khi mở app

Phần xác nhận email được bật tự động khi `cloudConfig.enabled: true` (không đặt `emailVerificationRequired: false` trong vận hành thật). Khi chưa cấu hình Supabase, bản trải nghiệm vẫn chỉ kiểm tra định dạng và hiển thị rõ xác nhận hộp thư chưa bật; chưa có email nào được gửi thật. Không tạo mã OTP trong trình duyệt, không ghi log/lưu mã vào localStorage.

1. Chạy `supabase/email-verification.sql` **sau** hai tệp SQL cơ bản/mã sản phẩm. Nút sao chép thiết lập đã gộp đủ ba tệp theo đúng thứ tự. Nếu chạy lại các tệp, luôn chạy xác nhận email cuối cùng.
2. Authentication → Email: bật Confirm email. Cấu hình **SMTP riêng**, tên miền gửi và giới hạn gửi phù hợp để gửi cho khách thật. Email mặc định của Supabase bị hạn chế người nhận/công suất, không nên coi là dịch vụ gửi cho toàn bộ khách. Không gửi mật khẩu SMTP hoặc service_role trong chat/mã frontend.
3. Email Templates → Confirm Sign Up, Magic Link và Change Email Address: thêm `{{ .Token }}` để khách nhận mã số. Giữ thêm liên kết `{{ .ConfirmationURL }}` trong mẫu đổi email để hỗ trợ xác nhận an toàn ở cả hai hộp thư. Đặt Site URL/Redirect URLs về địa chỉ GitHub Pages của app. Sau khi mở các liên kết đổi email, khách bấm “Kiểm tra lại trạng thái xác nhận” trên cùng thiết bị. Kiểm tra Token Length khớp 6–10 chữ số, hạn mã và giới hạn gửi. Mẫu tiếng Việt sẵn có: `supabase/email-templates/verify-email.html` dùng cho Confirm Sign Up và Magic Link; `supabase/email-templates/change-email.html` dùng cho Change Email Address. Sao chép nội dung HTML vào mẫu tương ứng trong Supabase. Đặt tiêu đề email có tên thương hiệu. Giữ Secure Email Change; khi đổi email đã xác nhận, có thể cần xác nhận cả hộp thư cũ và mới.
4. Khách nhập email, bấm Gửi mã, nhập mã thực nhận, bấm Xác nhận email, rồi mới lưu hồ sơ để mở app. Gửi lại có đếm chờ tối thiểu 60 giây; máy chủ tiếp tục áp giới hạn riêng. Không suy ra “email tồn tại” từ gửi yêu cầu thành công.
5. App đọc lại Supabase Auth để kiểm tra `email_confirmed_at` và email khớp. Không tin cờ “đã xác nhận” do người dùng tự nhập trong hồ sơ. Sau khi tải lại trang cần kiểm tra phiên qua mạng. Không có phiên/không xác nhận được: chưa mở nội dung app trong chế độ xác nhận thật.
6. Hồ sơ ẩn danh đã tồn tại được liên kết/xác nhận email trên cùng User ID bằng quy trình đổi email để giữ mã sản phẩm và quyền lợi. Nếu không có phiên, dùng email OTP để đăng nhập/tạo danh tính email. Không tự chuyển dữ liệu local của một người dùng chung thiết bị sang hồ sơ đã có của người khác; kiểm tra quy trình đổi thiết bị với dữ liệu thử trước vận hành. Ảnh local vẫn chưa tự đồng bộ giữa thiết bị.

SQL mới yêu cầu email đã xác nhận và trùng với email Auth khi tạo/sửa hồ sơ và kích hoạt mã sản phẩm. Nó không thay cho việc bảo vệ API tính năng có phí sau này. Đây là kiểm chứng quyền truy cập hộp thư tại thời điểm xác nhận, không xác minh danh tính thật hay bảo đảm khách luôn nhận được email trong tương lai.
