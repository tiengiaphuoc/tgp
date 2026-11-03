# Thông tin khuyến mãi

Khách mở **Sản phẩm của tôi → Thông tin khuyến mãi**. Chưa có chương trình thật được khai báo; app hiển thị trạng thái trống, không tạo ưu đãi mẫu cho khách.

## Cập nhật từ quản trị chung

1. Kết nối Supabase theo `database-setup.html`. Chạy `supabase/promotions.sql` sau `setup.sql` (nút sao chép SQL đầy đủ đã bao gồm tệp này). Khóa frontend chỉ là publishable/anon, không dùng service_role.
2. Đăng nhập tài khoản quản trị được cấp quyền: `admin.html#promotions`, hoặc chọn **Quản lý khuyến mãi** trong quản trị thật.
3. Tạo chương trình: tiêu đề, nội dung/điều kiện, ngày bắt đầu, ngày kết thúc. Nút liên hệ/mua hàng là tùy chọn, cần cả tên nút và URL HTTPS.
4. Chọn **Công bố** rồi **Lưu lên hệ thống chung**. Bản nháp và chương trình ẩn không hiện cho khách. Chương trình chỉ hiện từ đầu ngày bắt đầu đến hết ngày kết thúc theo múi giờ Việt Nam. Hết hạn tự ngừng hiển thị; không xóa lịch sử quản trị.
5. Chọn **Ẩn** và lưu để gỡ chương trình; dùng xóa khi muốn xóa hẳn. Có phân trang 100 chương trình/trang trong quản trị.

Khách không cần tự nhập nội dung. App lấy nội dung chung khi tải app, mở lại tab Sản phẩm, quay lại trình duyệt hoặc bấm Làm mới thông tin khuyến mãi. Không có WebSocket/push thông báo; màn hình đang mở liên tục cần làm mới. Máy chủ kiểm tra lịch hiệu lực khi đọc. Không có khấu trừ giá, tạo đơn hay áp dụng mã tự động; điều kiện và liên kết do công ty khai báo. Chỉ quản trị sửa được nội dung; đọc công khai chỉ trả chương trình công bố trong thời gian hiệu lực, gồm cả trước đăng nhập.

## Khi chưa kết nối cơ sở dữ liệu

Dự án hiện đã bật `adminEnabled:true` và `promotionsEnabled:true`: quản trị dùng tài khoản Supabase, khách đọc khuyến mãi chung. `enabled:false` chỉ giữ đồng bộ hồ sơ khách/xác nhận email ở trạng thái chưa bật, chờ kiểm tra SMTP. Không dùng khóa bí mật trong frontend.

Các hướng dẫn dưới đây chỉ áp dụng bản ngoại tuyến khi cả ba cờ kết nối đều tắt. Menu **Khuyến mãi** lúc đó cho phép soạn và lưu nháp trên trình duyệt; thông báo nêu rõ chưa cập nhật app cho khách.

- **Xem trước trên app** mở `?preview=promotions#product`, chỉ dùng bản lưu trong cùng trình duyệt. Nội dung không tự hiện cho khách khác.
- **Xuất promotions.json** chỉ xuất các chương trình chọn Công bố (kể cả chương trình sắp diễn ra). Thay đúng **`content/promotions.json`** trên GitHub rồi Commit changes; không tải vào thư mục gốc hoặc tên có `(1)`. Chờ GitHub Pages xuất bản rồi khách mở/làm mới app. Bản nháp/ẩn không có trong tệp xuất. Không ghi đè `content/posts.json`.
- Có thể nhập lại tệp khuyến mãi để tiếp tục chỉnh sửa trên thiết bị. Tệp xuất không phải sao lưu bản nháp.
- Khi bật `promotionsEnabled` hoặc `enabled`, máy chủ trở thành nguồn duy nhất; không tự lấy nội dung từ tệp tĩnh hay bản nháp cũ. Cần nhập lại chương trình qua quản trị chung trước khi bật. Nếu lỗi tải, app báo lỗi thay vì hiển thị chương trình cũ đã gỡ.
