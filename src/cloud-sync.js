import {createFullSync} from './full-sync.js?v=sync-live-30';
import {createCloudClient,profilePayload} from './cloud-client.js?v=sync-live-30';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function createProfileSync(getState,{onRestore=()=>{}}={}){
 const client=createCloudClient();const full=createFullSync(client,getState,onRestore);let timer,running=null,revision=0,stopping=false,status='Chưa chia sẻ hồ sơ',retryDelay=2000;
 let configured=false;try{configured=client.configured();}catch{status='Cấu hình kết nối chưa hợp lệ';}
 function show(message){status=message;document.querySelectorAll('[data-cloud-status]').forEach(e=>e.textContent=message);}
 async function flush(){if(running||stopping||!configured||!getState().profile?.cloudConsentAt)return;const version=revision;
  running=(async()=>{show('Đang đồng bộ hồ sơ…');try{await client.upsertProfile(profilePayload(getState()));const detailed=await full.sync();retryDelay=2000;show(detailed?'Đã đồng bộ hồ sơ, nhật ký và ảnh lên tài khoản':'Đã gửi hồ sơ về Mộcceutics');}catch(error){show('Chưa đồng bộ xong · bản trên thiết bị vẫn được giữ. '+(error.message||''));clearTimeout(timer);if(!error.requiresRestore){timer=setTimeout(flush,retryDelay);retryDelay=Math.min(retryDelay*2,60000);}}})();
  await running;running=null;if(version!==revision&&!stopping){clearTimeout(timer);timer=setTimeout(flush,600);}
 }
 function schedule(){revision++;if(!configured||stopping)return;clearTimeout(timer);if(!getState().profile?.cloudConsentAt){show('Chưa chia sẻ hồ sơ');return;}show('Đang chờ gửi hồ sơ…');timer=setTimeout(flush,600);}
 window.addEventListener('online',schedule);
 return {configured,schedule,full,statusText:()=>status,emailRequired:()=>configured&&client.emailVerificationRequired(),currentUser:()=>client.currentUser(),sendEmailOtp:email=>client.sendEmailOtp(email),confirmEmailOtp:(email,token,challenge)=>client.confirmEmailOtp(email,token,challenge),
  async redeemCode(code){if(!configured)throw new Error('Cần kết nối cơ sở dữ liệu trước khi xác thực mã.');if(!getState().profile?.cloudConsentAt)throw new Error('Lưu hồ sơ và đồng ý chia sẻ để xác thực mã.');await client.upsertProfile(profilePayload(getState()));return client.redeemCode(code);},
  async entitlement(){if(!configured||!getState().profile?.cloudConsentAt||!client.hasSession())return null;return client.entitlement();},
  microscopyImages:id=>client.microscopyImages(id),
  microscopyImageUrl:path=>client.microscopyImageUrl(path),
  async microscopyStatus(){if(!configured||!client.hasSession())throw new Error('Chưa kết nối hồ sơ chung.');return {eligibility:await client.microscopyEligibility(),requests:await client.microscopyRequests()};},
  async submitMicroscopy(body){if(!configured)throw new Error('Chưa kết nối để gửi yêu cầu.');return client.submitMicroscopy(body);},
  async cancelMicroscopy(id){return client.cancelMicroscopy(id);},
  consentField(){return configured?`<label class="cloud-consent"><input name="cloudConsent" type="checkbox" ${getState().profile?.cloudConsentAt?'checked disabled':getState().profile?.cloudRemovalPending?'disabled':''}>Tôi đồng ý gửi tên, thông tin liên hệ, mục tiêu chăm tóc, mã sản phẩm và thống kê ghi nhận cho đội chăm sóc Mộcceutics. Lựa chọn này không bao gồm ảnh tóc hoặc ghi chú sức khỏe.</label>${full.field()}`:'';},
  storageNote(){return configured?'Thông tin vẫn lưu trên thiết bị. Khi bạn đồng ý chia sẻ, hồ sơ và thống kê ghi nhận được gửi về đội chăm sóc Mộcceutics.':'Hồ sơ hiện chỉ lưu trên thiết bị. Kết nối dữ liệu chung đang chờ cấu hình.';},
  html(){return `<section class="cloud-panel"><h2>Kết nối với đội chăm sóc</h2><p>${esc(configured?'Chia sẻ hồ sơ và thống kê khi bạn đồng ý. Ảnh và cảm nhận chỉ đồng bộ nếu bạn chọn thêm đồng ý chia sẻ chi tiết.':'Chưa kết nối cơ sở dữ liệu chung. Hồ sơ và nhật ký vẫn được giữ trên thiết bị.')}</p><span data-cloud-status role="status">${esc(status)}</span>${configured?`<div class="cloud-actions">${getState().profile?.cloudConsentAt||getState().profile?.cloudRemovalPending?'<button type="button" class="btn outline" data-cloud-retry>Gửi lại hồ sơ</button><button type="button" class="text-btn" data-cloud-remove>Ngừng chia sẻ & xóa hồ sơ đã gửi</button>':'<p>Bạn có thể đồng ý chia sẻ trong phần hồ sơ ở trên.</p>'}</div>`:''}</section>${full.html()}`;},
  async withdraw(){stopping=true;clearTimeout(timer);const profile=getState().profile;profile.cloudConsentAt=null;profile.cloudRemovalPending=true;if(full.enabled){profile.fullConsentAt=null;profile.fullConsentToken=null;profile.fullRemovalPending=true;}try{localStorage.setItem('moc-care',JSON.stringify(getState()));if(running)await running;if(full.enabled)await full.remove();await client.deleteProfile();profile.cloudRemovalPending=false;profile.fullRemovalPending=false;localStorage.setItem('moc-care',JSON.stringify(getState()));show('Đã xóa hồ sơ trên hệ thống chung');}catch(error){show('Đã dừng đồng bộ trên thiết bị. Chưa xóa xong hồ sơ hệ thống; hãy thử lại khi có mạng.');throw error;}finally{stopping=false;}}

 };
}
