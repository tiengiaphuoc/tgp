# Quản trị dữ liệu thật

Bản admin-studio-32 đưa giao diện quản trị thật về cùng hệ thiết kế Mộcceutics: đăng nhập có minh họa thương hiệu, thanh bên, tổng quan, thẻ thống kê, danh sách khách, các mục quản lý riêng và trạng thái trống. Không đưa bộ khách minh họa vào dữ liệu thật, không thay đổi chính sách quyền truy cập.

- Mở `admin.html?view=live#live`, đăng nhập email/mật khẩu quản trị đã cấp quyền trên Supabase. Chỉ sau `is_moc_admin()` và tải hồ sơ thành công mới hiện không gian dữ liệu.
- Tổng quan `#overview`: ảnh minh họa thảo mộc, số hồ sơ trong trang, khách có/chưa có lượt ghi nhận và tổng lượt tự ghi nhận. Phạm vi trang được ghi ngay dưới thẻ; không trình bày như tổng toàn bộ hệ thống.
- Khách hàng `#customers`: tìm tên/điện thoại/email và lọc đã/chưa có ghi nhận **trong trang**, phân trang 100 hồ sơ, chi tiết, ghi chú nội bộ và xem nhật ký/ảnh đã được khách đồng ý chia sẻ. Không suy ra hiệu quả sản phẩm hoặc bệnh lý từ thống kê.
- Mã sản phẩm `#codes`, bài viết `#content`, khuyến mãi `#promotions`, soi tóc `#microscopy`: gọi các module quản trị thật đã có. Mỗi module có vùng riêng; đổi mục loại vùng cũ để phản hồi bất đồng bộ không chèn nhầm sang hồ sơ khác.
- `#articles` vẫn là trình biên tập/xuất tệp cũ để bảo toàn luồng bản nháp. Để công bố trực tiếp từ quản trị thật, chọn Bài viết trong thanh bên (`#content`).
- Không có hồ sơ thì thẻ 0 và hướng dẫn khách xác nhận email/đồng ý chia sẻ/lưu hồ sơ. Không chèn biểu đồ, doanh thu, số khách hoặc thông báo mẫu.
- Đăng xuất xóa vùng dữ liệu đã hiển thị và phiên quản trị. Bản minh họa `?view=demo#demo` tách riêng, có nhãn minh họa.

Giao diện thích ứng điện thoại/máy tính bảng: thanh bên chuyển thành dãy mục cuộn ngang, bảng khách cuộn trong vùng bảng. Các kiểm tra giao diện dùng dữ liệu fixture, không đọc/ghi hồ sơ khách thật hoặc gửi email.
