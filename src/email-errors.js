// Translate allowlisted Auth failures. Never expose SMTP credentials or raw provider responses.
export function authErrorDetails(status,body,isEmailSend=false){
 const rawCode=body?.code||body?.error_code||'';
 const code=typeof rawCode==='string'&&/^[a-z0-9_]{1,80}$/.test(rawCode)?rawCode:'';
 const text=typeof body?.message==='string'?body.message:typeof body?.error_description==='string'?body.error_description:'';
 let emailIssue='unknown';
 if(status===429||['over_email_send_rate_limit','over_request_rate_limit'].includes(code)||code==='smtp_max_frequency')emailIssue='rate_limit';
 else if(code==='email_address_not_authorized')emailIssue='recipient_restricted';
 else if(code==='email_address_invalid'||code==='validation_failed'&&/email/i.test(text))emailIssue='invalid_email';
 else if(code==='signup_disabled'||code==='email_provider_disabled'||code==='otp_disabled')emailIssue='disabled';
 else if(code==='captcha_failed'||code==='captcha_verification_failed')emailIssue='captcha';
 else if(/invalid api key|no api key/i.test(text))emailIssue='configuration';
 else if(isEmailSend&&status>=500)emailIssue='delivery_service';
 else if(status===401||['session_not_found','refresh_token_not_found','refresh_token_already_used','user_not_found'].includes(code))emailIssue='session';
 return {authCode:code,emailIssue};
}
export function emailSendErrorMessage(error){
 if(error?.name==='TimeoutError'||error?.name==='AbortError')return 'Chưa gửi được mã vì kết nối bị quá thời gian. Kiểm tra mạng rồi thử lại sau 60 giây. [EMAIL_TIMEOUT]';
 const messages={
 rate_limit:'Chưa gửi được mã vì đã tới giới hạn gửi thư. Đợi ít nhất 60 giây rồi thử lại; nếu vẫn lỗi, Mộc cần kiểm tra hạn mức gửi. [EMAIL_RATE_LIMIT]',
 recipient_restricted:'Dịch vụ email chưa cho gửi tới địa chỉ này. Mộc cần kiểm tra Custom SMTP và địa chỉ người gửi trong Supabase. [EMAIL_RECIPIENT_RESTRICTED]',
 invalid_email:'Chưa gửi được mã vì địa chỉ email chưa hợp lệ. Kiểm tra lại email vừa nhập. [EMAIL_INVALID_ADDRESS]',
 disabled:'Dịch vụ đăng nhập bằng email chưa được bật đầy đủ. Báo Mộc kiểm tra cấu hình Email và đăng ký tài khoản. [EMAIL_DISABLED]',
 captcha:'Dịch vụ yêu cầu kiểm tra chống thư rác mà app chưa hoàn tất. Báo Mộc kiểm tra cấu hình đăng nhập. [EMAIL_CAPTCHA]',
 configuration:'Kết nối xác nhận email cần được quản trị kiểm tra. Chưa gửi được mã. [EMAIL_CONFIGURATION]',
 delivery_service:'Hệ thống xác nhận email báo lỗi khi xử lý gửi thư. Mộc cần xem Auth Logs để kiểm tra SMTP/Gmail; chưa gửi được mã. [EMAIL_SERVICE_ERROR]',
 session:'Phiên xác nhận email đã hết hạn hoặc không còn hợp lệ. Tải lại app rồi thử lại; chưa xác nhận email. [EMAIL_SESSION]',
 unknown:'Chưa gửi được mã. Kiểm tra kết nối hoặc báo Mộcceutics kèm thông báo này. [EMAIL_REQUEST_FAILED]'
 };
 return messages[error?.emailIssue]||messages.unknown;
}
