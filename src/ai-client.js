/* No service is enabled by default. Public configuration must never contain keys. */
export const aiConfig = Object.freeze({
  enabled: false,
  baseUrl: null,
  providerLabel: null,
  privacyUrl: null,
  retentionNotice: null,
  policyVersion: 'moc-ai-consent-v1',
});
export class AiError extends Error {constructor(code,message){super(message);this.code=code;}}
const fields=['requestId','imageSha256','status','area','hairVisible','areaMatches','imageUsable','observations','limitations','nextActions','modelVersion'];
const text=(v,max=1200)=>typeof v==='string'&&v.trim().length>0&&v.length<=max;
export function validateAiResult(data,request){
 if(!data||typeof data!=='object'||Array.isArray(data)||Object.keys(data).some(k=>!fields.includes(k)))throw new AiError('invalid_response','Phản hồi AI không đúng định dạng hỗ trợ.');
 if(data.requestId!==request.requestId||data.imageSha256!==request.image.sha256||data.area!==request.image.area)throw new AiError('image_mismatch','Phản hồi AI không khớp ảnh vừa gửi.');
 if(!['observations_only','insufficient_image'].includes(data.status)||!['yes','no','uncertain'].includes(data.hairVisible)||!['yes','no','uncertain'].includes(data.areaMatches)||typeof data.imageUsable!=='boolean'||!text(data.modelVersion,200))throw new AiError('invalid_response','Phản hồi AI chưa đủ thông tin bắt buộc.');
 for(const k of ['observations','limitations'])if(!Array.isArray(data[k])||data[k].length>8||!data[k].every(v=>text(v)))throw new AiError('invalid_response','Nội dung báo cáo AI không hợp lệ.');
 if(!data.limitations.length||!Array.isArray(data.nextActions)||data.nextActions.length>3||!data.nextActions.every(x=>['retake_photo','repeat_standardized','seek_professional'].includes(x)))throw new AiError('invalid_response','Thiếu giới hạn hoặc bước tiếp theo phù hợp.');
 if(data.status==='observations_only'&&(data.hairVisible!=='yes'||data.areaMatches!=='yes'||!data.imageUsable))throw new AiError('invalid_response','AI chưa xác nhận ảnh đủ điều kiện quan sát.');
 if(data.status==='insufficient_image'&&data.observations.length)throw new AiError('invalid_response','Ảnh không đủ điều kiện không được kèm nhận xét tóc.');
 return structuredClone(data);
}
export async function imageDigest(dataUrl){const response=await fetch(dataUrl);const bytes=await response.arrayBuffer();const hash=await crypto.subtle.digest('SHA-256',bytes);return [...new Uint8Array(hash)].map(x=>x.toString(16).padStart(2,'0')).join('');}
export function serviceReady(config=aiConfig){
 if(!config.enabled||!config.baseUrl||!config.providerLabel||!config.privacyUrl||!config.retentionNotice)return false;
 try{return new URL(config.baseUrl).protocol==='https:'&&new URL(config.privacyUrl).protocol==='https:';}catch{return false;}
}
export async function requestAiAssessment(photo,{consent,signal,config=aiConfig,fetcher=fetch}={}){
 if(!serviceReady(config))throw new AiError('not_connected','Chưa kết nối dịch vụ AI. Ảnh chưa được gửi.');
 if(!consent?.acceptedAt||consent.policyVersion!==config.policyVersion)throw new AiError('consent_required','Cần đồng ý xử lý ảnh cho lần gửi này.');
 const request={requestId:crypto.randomUUID(),schemaVersion:1,image:{dataUrl:photo.src,sha256:await imageDigest(photo.src),area:photo.angle},consent:{acceptedAt:consent.acceptedAt,policyVersion:consent.policyVersion}};
 const controller=new AbortController();const abort=()=>controller.abort();signal?.addEventListener('abort',abort,{once:true});if(signal?.aborted)controller.abort();const timer=setTimeout(abort,30000);
 try{const response=await fetcher(new URL('analyze',config.baseUrl.endsWith('/')?config.baseUrl:config.baseUrl+'/').href,{method:'POST',credentials:'include',headers:{'Content-Type':'application/json','X-Moc-Request':request.requestId},body:JSON.stringify(request),signal:controller.signal});
 if(response.status===401||response.status===403)throw new AiError('authentication_required','Cần đăng nhập tài khoản được cấp quyền trước khi phân tích ảnh.');
 if(response.status===429)throw new AiError('rate_limit','Đã đạt giới hạn phân tích. Vui lòng thử lại sau.');
 if(!response.ok)throw new AiError('service_error','Dịch vụ AI chưa xử lý được ảnh. Không tạo kết quả thay thế.');
 const data=validateAiResult(await response.json(),request);return {...data,createdAt:new Date().toISOString(),provider:config.providerLabel,consentVersion:consent.policyVersion};
 }catch(error){if(error instanceof AiError)throw error;if(controller.signal.aborted)throw new AiError('cancelled','Đã dừng yêu cầu hoặc hết thời gian chờ. Chưa lưu kết quả AI.');throw new AiError('network_error','Không kết nối được AI hoặc phản hồi không hợp lệ. Vui lòng thử lại sau.');}finally{clearTimeout(timer);signal?.removeEventListener('abort',abort);}
}
