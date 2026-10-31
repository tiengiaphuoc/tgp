import {createCloudClient,profilePayload} from './cloud-client.js?v=email-17';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function createProfileSync(getState){
 const client=createCloudClient();let timer,running=null,revision=0,stopping=false,status='Chưa chia sẻ hồ sơ',retryDelay=2000;
 let configured=false;try{configured=client.configured();}catch{status='Cấu hình kết nối chưa hợp lệ';}
 function show(message){status=message;document.querySelectorAll('[data-cloud-status]').forEach(e=>e.textContent=message);}
 async function flush(){if(running||stopping||!configured||!getState().profile?.cloudConsentAt)return;const version=revision;
  running=(async()=>{show('Đang đồng bộ hồ sơ…');try{await client.upsertProfile(profilePayload(getState()));retryDelay=2000;show('Đã gửi hồ sơ về Mộcceutics');}catch{show('Chưa gửi được · bản trên thiết bị vẫn được giữ');clearTimeout(timer);timer=setTimeout(flush,retryDelay);retryDelay=Math.min(retryDelay*2,60000);}})();
  await running;running=null;if(version!==revision&&!stopping){clearTimeout(timer);timer=setTimeout(flush,600);}
 }
 function schedule(){revision++;if(!configured||stopping)return;clearTimeout(timer);if(!getState().profile?.cloudConsentAt){show('Chưa chia sẻ hồ sơ');return;}show('Đang chờ gửi hồ sơ…');timer=setTimeout(flush,600);}
 window.addEventListener('online',schedule);
 return {configured,schedule,statusText:()=>status,emailRequired:()=>configured&&client.emailVerificationRequired(),currentUser:()=>client.currentUser(),sendEmailOtp:email=>client.sendEmailOtp(email),confirmEmailOtp:(email,token,challenge)=>client.confirmEmailOtp(email,token,challenge),
  async redeemCode(code){if(!configured)throw new Error('Cần kết nối cơ sở dữ liệu trước khi xác thực mã.');if(!getState().profile?.cloudConsentAt)throw new Error('Lưu hồ sơ và đồng ý chia sẻ để xác thực mã.');await client.upsertProfile(profilePayload(getState()));return client.redeemCode(code);},
  async entitlement(){if(!configured||!getState().profile?.cloudConsentAt||!client.hasSession())return null;return client.entitlement();},
  consentField(){return configured?`<label class="cloud-consent"><input name="cloudConsent" type="checkbox" ${getState().profile?.cloudConsentAt?'checked disabled':''}>Tôi đồng ý gửi tên, thông tin liên hệ, mục tiêu chăm tóc, mã sản phẩm và thống kê ghi nhận cho đội chăm sóc Mộcceutics. Không gửi ảnh tóc hoặc ghi chú sức khỏe.</label>`:'';},
  storageNote(){return configured?'Thông tin vẫn lưu trên thiết bị. Khi bạn đồng ý chia sẻ, hồ sơ và thống kê ghi nhận được gửi về đội chăm sóc Mộcceutics.':'Hồ sơ hiện chỉ lưu trên thiết bị. Kết nối dữ liệu chung đang chờ cấu hình.';},
  html(){return `<section class="cloud-panel"><h2>Kết nối với đội chăm sóc</h2><p>${esc(configured?'Chia sẻ hồ sơ và thống kê ghi nhận khi bạn đồng ý. Ảnh và cảm nhận da đầu không được gửi lên hệ thống.':'Chưa kết nối cơ sở dữ liệu chung. Hồ sơ và nhật ký vẫn được giữ trên thiết bị.')}</p><span data-cloud-status role="status">${esc(status)}</span>${configured?`<div class="cloud-actions">${getState().profile?.cloudConsentAt?'<button type="button" class="btn outline" data-cloud-retry>Gửi lại hồ sơ</button><button type="button" class="text-btn" data-cloud-remove>Ngừng chia sẻ & xóa hồ sơ đã gửi</button>':'<p>Bạn có thể đồng ý chia sẻ trong phần hồ sơ ở trên.</p>'}</div>`:''}</section>`;},
  async withdraw(){stopping=true;clearTimeout(timer);try{if(running)await running;await client.deleteProfile();show('Đã xóa hồ sơ trên hệ thống chung');}catch(error){show('Chưa xóa được hồ sơ. Hãy kiểm tra mạng và thử lại.');throw error;}finally{stopping=false;}}
 };
}
