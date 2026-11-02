# Quyền lợi soi sợi tóc — Mộcceutics

## Chính sách đã chốt

- Mỗi **1.000.000đ giá trị mã hợp lệ tích lũy trong một năm dương lịch** (01/01–31/12 theo giờ Việt Nam) nhận 1 lượt soi sợi tóc miễn phí. 2 triệu = 2 lượt, 2,5 triệu = 2 lượt; phần còn lại trong năm chờ tích lũy thêm.
- Tính theo **thời điểm kích hoạt mã** trong app. Đây là mốc của chương trình tích lũy mã, không tự chứng minh ngày mua trên hóa đơn. Cần ghi rõ điều này trên thẻ mã/chính sách cho khách. Không chuyển số dư sang năm sau; lượt phát sinh từ yêu cầu năm trước vẫn được xử lý theo yêu cầu đó.
- Mỗi yêu cầu hợp lệ giữ 1 lượt; đang chờ/đã duyệt/đang xử lý/đã hoàn tất đều được tính. Từ chối hoặc khách hủy trước duyệt trả lại lượt. Chỉ một yêu cầu mở/khách để tránh gửi trùng; đủ 2 lượt thì gửi tiếp lượt thứ hai sau khi yêu cầu trước kết thúc.
- Mã hoàn/hủy hàng hoặc giá trị chưa được quy đổi không tính. Khóa mã dùng để ngăn kích hoạt mới **không tự thu hồi** giá trị của mã đã dùng; nhân viên đối soát trong mục giá trị mã.

## Bật hệ thống

1. Chạy `supabase/microscopy.sql` sau ba tệp trước (`setup.sql`, `product-codes.sql`, `email-verification.sql`). Nút Sao chép SQL thiết lập đã gộp đủ bốn tệp.
2. Trong Quản lý mã sản phẩm, khai **giá trị thực thanh toán tương ứng mỗi sản phẩm/mã**, sau giảm giá. Không nhập tổng cả hóa đơn cho từng mã nếu một đơn có nhiều sản phẩm. Mặc định 0 nghĩa là chưa cộng tích lũy, không phải suy ra khách chưa mua hàng.
3. Giá trị được chụp lại khi mã kích hoạt. Các mã đã kích hoạt trước khi có tính năng này giữ giá trị 0; nhân viên đối soát hóa đơn và bổ sung qua “Yêu cầu soi tóc → Điều chỉnh giá trị mã đã kích hoạt”. Điều chỉnh được ghi lịch sử phía máy chủ. Không tự gán giá trị mới cho mã cũ mà chưa đối soát.
4. Trước khi bật tiếp nhận, chủ thương hiệu phải xác định: đơn vị/người soi, địa chỉ/người nhận/số điện thoại nhận mẫu, quy cách lấy và đóng gói mẫu, số lượng/chiều dài sợi cần thiết, phí vận chuyển hai chiều nếu có, thời gian xử lý, cách trả kết quả, chính sách giữ/hủy mẫu và yêu cầu bảo vệ dữ liệu. Các mục này **chưa được cung cấp**, app không tự bịa địa chỉ, thời hạn hay lời hứa miễn phí vận chuyển.
5. Đăng nhập quản trị thật → Yêu cầu soi tóc → bật chính sách khi đã sẵn sàng. Mặc định phía database là tắt; prototype chưa kết nối Supabase chỉ lưu nháp trên thiết bị, không giả báo yêu cầu đã gửi hoặc khách đủ điều kiện.

## Khách hàng

Ở cuối Tiến trình có thẻ quyền lợi và form: họ tên, số điện thoại liên hệ, email nhận liên hệ, xử lý hóa chất (tùy chọn), điều muốn kiểm tra (tùy chọn), đồng ý chia sẻ thông tin cho dịch vụ. Không yêu cầu địa chỉ nhà hoặc ảnh tóc khi chưa cần. Không tự gửi các trường da đầu/tuổi/giới tính riêng tư từ hồ sơ sang yêu cầu.

Khách chỉ gửi được khi máy chủ xác nhận đủ lượt và email khớp Auth đã xác nhận. Có thể chuẩn bị/lưu nháp khi chưa đủ điều kiện. Nháp **chưa được đội chăm sóc tiếp nhận**. Yêu cầu gửi thật dùng UUID cố định để thử lại khi mất mạng không tạo trùng. Khách hủy được khi chưa được duyệt; sau khi duyệt, liên hệ đội chăm sóc.

## Đội chăm sóc

Trạng thái: Chờ xác nhận → Đã duyệt → Đã nhận mẫu → Đang soi → Đã có nhận xét. Có thể từ chối trước nhận mẫu. Khi duyệt phải điền hướng dẫn gửi mẫu (địa chỉ, liên hệ, đóng gói, vận chuyển/phí và thời gian dự kiến); khi hoàn tất phải có nhận xét. Nội dung trả khách hiển thị trong app sau làm mới, **không tự gửi email/tin nhắn**. Kết quả gồm nhận xét và thư viện ảnh ngay trong từng yêu cầu. Chạy thêm `supabase/microscopy-images.sql` sau bốn tệp SQL trước để tạo bucket riêng tư `microscopy-results` và phân quyền. Quản trị tải tối đa 6 ảnh gốc JPG/PNG/WebP, mỗi ảnh tối đa 5 MB, kèm vị trí quan sát, độ phóng đại do người soi ghi và chú thích. Chỉ tải khi đang soi/đã hoàn tất; ảnh nháp không hiện cho khách cho đến khi yêu cầu hoàn tất. Khách bấm “Xem ảnh kết quả soi tóc” để mở ảnh và phóng to 100–300%. Không suy ra phép đo hoặc chẩn đoán từ ảnh.

Quyền miễn phí áp dụng dịch vụ soi, không tự khẳng định phí gửi/hoàn mẫu được bao gồm. Chưa có thao tác gửi vận đơn, đặt đơn vị vận chuyển, thanh toán hoặc đặt lịch soi tự động.

## Giới hạn và riêng tư

Soi sợi tóc có thể mô tả đặc điểm nhìn thấy của thân tóc, dấu hiệu gãy/hư tổn. Không xác định nguyên nhân rụng tóc, bệnh da đầu, thiếu dưỡng chất hoặc kê điều trị chỉ từ mẫu sợi tóc. Không nhổ tóc để lấy mẫu. Cách lấy mẫu phải do đơn vị soi hướng dẫn; chưa có quy cách hoặc địa chỉ thì chưa gửi mẫu. Các dấu hiệu đau/đỏ/rụng đột ngột cần khám da liễu.

Thông tin yêu cầu chỉ chủ hồ sơ và quản trị được cấp quyền đọc; khách không sửa số tiền/trạng thái/kết quả. Yêu cầu dịch vụ có đồng ý riêng và lưu tách với hồ sơ liên hệ chung. Xóa hồ sơ liên hệ không xóa các yêu cầu dịch vụ/lịch sử dùng lượt, để tránh tự đặt lại quyền lợi. Chủ thương hiệu cần có quy trình tiếp nhận yêu cầu xóa thông tin, thời hạn lưu và xử lý mẫu; nếu cần xóa tài khoản Auth toàn bộ, thao tác quản trị phải bảo đảm không cấp lại lượt/mã đã sử dụng. Không công bố danh sách mã hoặc dữ liệu khách trong repo.

Ảnh không được đưa vào GitHub hay localStorage. Bucket không công khai; khách chỉ đọc ảnh thuộc yêu cầu hoàn tất của mình, quản trị được cấp quyền đọc/quản lý. Liên kết có chữ ký hết hạn sau 5 phút; người có liên kết có thể xem đến lúc hết hạn, kể cả sau thao tác xóa quyền. Mở lại ảnh để lấy liên kết mới. Khi xóa ảnh, app xóa tệp qua Storage API trước rồi xóa metadata. Nếu upload lỗi, app thử dọn tệp; quản trị cần kiểm tra tệp mồ côi sau mất mạng hoặc sau xóa yêu cầu/tài khoản (cascade metadata không xóa byte trong Storage). Chủ thương hiệu cần đặt thời hạn giữ ảnh và quy trình xóa. Cấu hình Supabase hiện vẫn tắt: giao diện sẵn sàng, việc lưu ảnh thật cần kết nối backend và chạy SQL; kiểm thử dùng dữ liệu mô phỏng, chưa xác nhận Storage dự án thật.
