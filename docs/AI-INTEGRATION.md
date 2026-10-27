# Mộc AI: trạng thái và hợp đồng tích hợp

## Hiện tại

Giao diện, chấp thuận gửi ảnh, hủy yêu cầu, kiểm tra kết quả và các trạng thái lỗi đã được chuẩn bị. `src/ai-client.js` mặc định `enabled: false`. Không có máy chủ AI, tài khoản người dùng hoặc mô hình thực đang kết nối. Không phát sinh lượt gọi hoặc kết quả AI thật. Kiểm tra chất lượng ảnh cũ chạy riêng trên thiết bị và không phải phân tích tóc.

Trước khi bật cần chọn dịch vụ/mô hình, kiểm chứng khả năng trên các nhóm khách và điều kiện chụp; triển khai backend có đăng nhập; thiết lập chính sách xử lý/lưu giữ/xóa ảnh. API key giữ ở secret của backend, tuyệt đối không đặt trong tệp frontend, GitHub Pages hay mã nguồn Git.

## Cấu hình công khai

`aiConfig` chỉ chứa metadata công khai: `enabled`, `baseUrl` HTTPS, `providerLabel`, `privacyUrl` HTTPS, `retentionNotice`, `policyVersion`. Chỉ bật sau khi backend thực hoạt động, kiểm tra quyền tài khoản và các tuyên bố xử lý dữ liệu tương ứng chính sách dịch vụ đã được duyệt. Cấu hình không nhận khóa bí mật. GitHub Pages chỉ phục vụ tệp tĩnh, không thực thi endpoint AI.

Nên phục vụ app và API ở cùng origin với cookie phiên HttpOnly, Secure, SameSite phù hợp. Cần xây đăng nhập thật trước khi đưa API tính phí vào hoạt động. Adapter hiện gửi `credentials: include`; không có cookie quản trị hoặc API key cài sẵn. Nếu API khác origin, phải thiết kế cookie/CORS theo origin cụ thể và bảo vệ CSRF, không dùng `Access-Control-Allow-Origin: *` cho dữ liệu riêng tư. Không bật endpoint không có xác thực chỉ để giao diện chạy được.

## Yêu cầu `POST {baseUrl}/analyze`

```json
{
  "schemaVersion": 1,
  "requestId": "uuid",
  "image": {"dataUrl": "data:image/jpeg;base64,...", "sha256": "SHA-256 của byte ảnh", "area": "Đỉnh đầu"},
  "consent": {"acceptedAt": "ISO-8601", "policyVersion": "moc-ai-consent-v1"}
}
```

Backend xác thực tài khoản và quyền của chính ảnh đó, kiểm tra CSRF/origin, kích thước và định dạng ảnh, mã băm, phiên bản chính sách và đồng ý; áp hạn mức; gọi dịch vụ AI bằng credential máy chủ. Không coi UUID, header `X-Moc-Request`, mã băm hoặc consent do trình duyệt gửi là bằng chứng xác thực. Không ghi base64/ảnh vào log. Không thu ảnh người chưa đồng ý, không dùng chấp thuận này cho quảng cáo hoặc huấn luyện mô hình.

## Phản hồi được hỗ trợ

```json
{
  "requestId": "uuid khớp yêu cầu",
  "imageSha256": "mã băm khớp ảnh",
  "area": "Đỉnh đầu",
  "status": "observations_only",
  "hairVisible": "yes",
  "areaMatches": "yes",
  "imageUsable": true,
  "observations": ["Nhận xét có giới hạn do dịch vụ thực tạo ra"],
  "limitations": ["Giới hạn quan trọng của lần quan sát"],
  "nextActions": ["repeat_standardized"],
  "modelVersion": "Phiên bản mô hình thực"
}
```

`hairVisible` và `areaMatches`: `yes`, `no`, `uncertain`. `status`: `observations_only` hoặc `insufficient_image`. `observations_only` chỉ được dùng khi hairVisible/areaMatches đều yes và imageUsable true. Nếu `insufficient_image`, observations phải rỗng. `nextActions` chỉ hỗ trợ `retake_photo`, `repeat_standardized`, `seek_professional`. Model không được kê thuốc hoặc đưa ra nguyên nhân rụng tóc. Backend phải kiểm tra và giới hạn đầu ra, không chỉ phụ thuộc kiểm tra frontend.

Không hỗ trợ trường mật độ sợi/cm², điểm hói, Norwood/Sinclair hoặc phần trăm hiệu quả sản phẩm. Adapter từ chối trường ngoài hợp đồng và kết quả không khớp ảnh. Không gắn nhãn độ tin cậy bằng xác suất chưa hiệu chuẩn. Phải có quy trình lâm sàng riêng nếu sau này bổ sung các đo lường này.

Mã lỗi: 401/403 chưa có quyền; 429 hạn mức; 5xx lỗi dịch vụ. Frontend chờ tối đa 30 giây, có thể hủy và không tạo kết quả giả khi lỗi. Hủy ở trình duyệt không đảm bảo tác vụ máy chủ đã dừng; backend cần cơ chế tương ứng và chính sách xóa riêng. Kết quả thành công lưu cùng ảnh trong localStorage, chưa đồng bộ máy chủ. Xóa kết quả cục bộ không phải yêu cầu xóa từ dịch vụ AI.

## Kiểm tra đã có

`node scripts/ai-contract-test.mjs` dùng fixture, không gọi mô hình thật: không upload nếu chưa kết nối/chưa đồng ý; chống ghép nhầm kết quả vào ảnh; từ chối trường lâm sàng chưa hỗ trợ; xử lý ảnh không đủ điều kiện và lỗi xác thực/hạn mức/hủy. `scripts/scan-smoke.cjs` kiểm tra giao diện chưa kết nối không gửi POST. Đây không phải bằng chứng độ chính xác AI hoặc kiểm định lâm sàng.
