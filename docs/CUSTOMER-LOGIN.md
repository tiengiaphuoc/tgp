# Đăng nhập khách hàng

Bật bằng `customerLoginEnabled:true` trong cấu hình dự án. Không cần SQL mới; dùng Supabase Auth Email/Password và OTP hiện có. Chỉ sau khi máy chủ xác thực và xác nhận email mới được mở hồ sơ.

## Trải nghiệm

- Trang mặc định có **Đăng nhập / Đăng ký mới**. Đăng nhập chỉ cần email/mật khẩu, không nhập lại mã sản phẩm hoặc tên mỗi lần.
- Khách mới xác nhận email qua mã trước, đặt mật khẩu và nhập lại mật khẩu (giao diện yêu cầu ít nhất 8 ký tự), rồi hoàn tất hồ sơ/mã sản phẩm. Mật khẩu được đặt ở Supabase Auth qua phiên đã xác nhận; không có trong hồ sơ khách, backup hoặc quản trị.
- Khách đã có tài khoản email nhưng chưa đặt/đã quên mật khẩu chọn **Quên mật khẩu / Chưa đặt mật khẩu?** → mã email → xác nhận → đặt mật khẩu mới. Yêu cầu khôi phục dùng `create_user:false`, không tạo thêm danh tính hay đổi email của phiên cũ. Cần cấu hình mẫu thư có `{{ .Token }}` như luồng OTP trước.
- Mỗi lần mở/tải lại trang phải đăng nhập mới. Không ghi nhớ phiên khách bằng localStorage/sessionStorage; token chỉ ở bộ nhớ của trang đang mở. Không ảnh hưởng phiên quản trị riêng. Kiểm tra lại chính sách mật khẩu trong Supabase nếu muốn máy chủ buộc độ dài/độ mạnh cao hơn giao diện hiện tại.
- Có nút Đăng xuất ở đầu trang và trong Cá nhân, kể cả khi hồ sơ còn chưa hoàn tất. Ẩn dữ liệu ngay khi đăng xuất, khóa khi pagehide/BFCache, sau 15 phút không thao tác hoặc khi rời app từ 5 phút. Không khóa chỉ vì mở hộp thư để nhận OTP khi đang đăng ký/khôi phục.

## Dữ liệu và chuyển tài khoản

Dữ liệu đang dùng được gắn Auth user ID. Khi đăng nhập, máy chủ trả đúng danh tính và hồ sơ của người đó. Cache cũ chưa có Auth ID chỉ được nhận khi email khớp email đã xác thực; dữ liệu khác được giữ riêng, không đưa vào tài khoản vừa đăng nhập. Bản cũ chưa xác định được chủ không tự hiển thị. Nếu server không còn hồ sơ, không tự khôi phục lại đồng ý chia sẻ đã mất từ cache cũ.

Bản nháp mỗi tài khoản được giữ trong IndexedDB để không mất nhật ký chưa đồng bộ khi đăng xuất/đổi người dùng. Cache đang dùng trong localStorage được xóa sau khi lưu riêng thành công; bản riêng chỉ nạp vào app sau đăng nhập đúng tài khoản. Nếu không lưu được riêng thì giữ bản đang dùng và báo lỗi, không âm thầm xóa dữ liệu. Xóa dữ liệu trình duyệt có thể xóa bản chưa đồng bộ. Thiết bị mới có thể cần chọn Khôi phục từ tài khoản trong Cá nhân để tải nhật ký và ảnh đã đồng bộ.

Đây là phân tách cache và bảo vệ giao diện bằng đăng nhập, không phải kho mã hóa bằng mật khẩu ở cấp thiết bị. Người có quyền kiểm soát trình duyệt/DevTools có thể đọc dữ liệu lưu cục bộ; cần bảo vệ tài khoản hệ điều hành/thiết bị dùng chung. Backend tiếp tục kiểm tra JWT, RLS và quyền đồng ý chia sẻ; không dựa vào trường chủ cache để cấp quyền máy chủ.

Khi khóa/đăng xuất, bỏ nội dung app/modal/ảnh đang hiển thị, dừng đồng bộ đang chờ, loại dữ liệu ưu đãi/soi tóc trong bộ nhớ và chặn phản hồi cũ vẽ vào tài khoản mới. Token/mã xác nhận cũ và refresh trả chậm không được ghi đè phiên mới. JWT/refresh token cũ của bản trước được xóa khỏi localStorage khi chuyển sang bản này. Không tự gọi gửi OTP hoặc tạo khách khi mở app.

Kiểm thử dùng Auth/API fixture: mật khẩu sai, mở lại, chuyển A↔B giữ bản riêng, phản hồi soi tóc cũ, đăng ký đã xác nhận và khôi phục qua mã. Không gửi thư thật hoặc tạo hồ sơ thử trên dự án. Cần chủ thương hiệu thử đăng nhập/khôi phục bằng tài khoản của mình sau xuất bản; không gửi mật khẩu hoặc mã OTP vào chat.
