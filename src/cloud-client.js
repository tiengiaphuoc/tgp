import {cloudConfig} from './cloud-config.js';
export function validateCloudConfig(config){
 if(!config?.enabled)return false;
 let url;try{url=new URL(config.url);}catch{throw new Error('Project URL chưa hợp lệ.');}
 if(url.protocol!=='https:'||url.username||url.password||url.pathname!=='/'||url.search||url.hash)throw new Error('Project URL cần là địa chỉ HTTPS gốc của Supabase.');
 const key=String(config.publishableKey||'');if(!key||key.startsWith('sb_secret_'))throw new Error('Chỉ dùng publishable/anon key công khai.');
 if(!key.startsWith('sb_publishable_')&&!key.includes('.'))throw new Error('Khóa chưa đúng định dạng publishable/anon.');
 if(key.includes('.')){try{const payload=JSON.parse(atob(key.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));if(payload.role!=='anon')throw new Error();}catch{throw new Error('Không dùng khóa quản trị hoặc service_role trong app.');}}
 return true;
}
export function createCloudClient({config=cloudConfig,storage=localStorage,sessionKey='moc-cloud-customer',fetcher=fetch}={}){
 let session=null;try{session=JSON.parse(storage.getItem(sessionKey)||'null');}catch{}
 const configured=()=>validateCloudConfig(config);
 const root=()=>config.url.replace(/\/$/,'');
 function saveSession(value){session=value?.access_token?{...value,expires_at:Math.floor(Date.now()/1000)+(value.expires_in||3600)}:null;if(session)storage.setItem(sessionKey,JSON.stringify(session));else storage.removeItem(sessionKey);return session;}
 async function request(path,{method='GET',body,raw=false,token,headers={}}={}){
  if(!configured())throw new Error('Chưa cấu hình cơ sở dữ liệu chung.');
  const response=await fetcher(root()+path,{method,headers:{apikey:config.publishableKey,...(token?{Authorization:'Bearer '+token}:{}),...(body!==undefined?{'Content-Type':'application/json'}:{}),...headers},...(body!==undefined?{body:raw?body:JSON.stringify(body)}:{}),cache:'no-store',signal:AbortSignal.timeout(20000)});
  if(!response.ok){const error=new Error(response.status===401?'Phiên đăng nhập hết hạn. Vui lòng thử đăng nhập lại.':response.status===403?'Tài khoản chưa có quyền truy cập dữ liệu này.':'Chưa kết nối được dữ liệu. Kiểm tra mạng và cấu hình Supabase.');error.status=response.status;throw error;}
  return response.status===204?null:response.text().then(text=>text?JSON.parse(text):null);
 }
 async function authImpl({anonymous=false}={}){
  if(!session){if(!anonymous)throw new Error('Vui lòng đăng nhập quản trị.');return saveSession(await request('/auth/v1/signup',{method:'POST',body:{data:{app:'mocceutics'}}}));}
  if(session.expires_at<=Math.floor(Date.now()/1000)+60)saveSession(await request('/auth/v1/token?grant_type=refresh_token',{method:'POST',body:{refresh_token:session.refresh_token}}));
  return session;
 }
 let authPending=null;
 async function auth(options={}){if(authPending)return authPending;authPending=authImpl(options);try{return await authPending;}finally{authPending=null;}}
 async function rest(path,options={}){const current=await auth();try{return await request(path,{...options,token:current.access_token});}catch(error){if(error.status!==401)throw error;session.expires_at=0;const refreshed=await auth();return request(path,{...options,token:refreshed.access_token});}}
 return {configured,hasSession:()=>!!session,
  async signIn(email,password){const result=await request('/auth/v1/token?grant_type=password',{method:'POST',body:{email,password}});saveSession(result);return result;},
  async signOut(){try{if(session)await request('/auth/v1/logout',{method:'POST',token:session.access_token});}finally{saveSession(null);}},
  emailVerificationRequired:()=>configured()&&config.emailVerificationRequired!==false,
  async currentUser(){if(!session)return null;const current=await auth();return request('/auth/v1/user',{token:current.access_token});},
  async sendEmailOtp(email){
   if(session){const current=await auth();const user=await request('/auth/v1/user',{token:current.access_token});if(user.email?.toLowerCase()!==email.toLowerCase()||!user.email_confirmed_at){await request('/auth/v1/user',{method:'PUT',token:current.access_token,body:{email}});return {type:'email_change',owner:user.id};}}
   await request('/auth/v1/otp',{method:'POST',body:{email,create_user:true}});return {type:'email',owner:session?.user?.id||null};
  },
  async confirmEmailOtp(email,token,challenge){
   const data=await request('/auth/v1/verify',{method:'POST',body:{email,token,type:challenge.type}});
   if(challenge.owner&&data.user?.id&&data.user.id!==challenge.owner)throw new Error('Phiên xác nhận không khớp hồ sơ.');
   if(!data.access_token&&!session)throw new Error('Chưa xác nhận được email.');
   const current=data.access_token?data:await auth();const user=await request('/auth/v1/user',{token:current.access_token});
   if(!user.email_confirmed_at||user.email?.toLowerCase()!==email.toLowerCase()||(challenge.owner&&user.id!==challenge.owner))throw new Error('Email chưa được xác nhận đầy đủ. Nếu đổi email, có thể cần xác nhận cả hộp thư cũ và mới.');
   if(data.access_token)saveSession({...data,user});
   return user;
  },
  async upsertProfile(payload){const current=await auth({anonymous:config.emailVerificationRequired===false});
   if(config.emailVerificationRequired!==false){const user=await request('/auth/v1/user',{token:current.access_token});if(!user.email_confirmed_at||user.email?.toLowerCase()!==payload.email?.toLowerCase())throw new Error('Cần xác nhận đúng email trước khi gửi hồ sơ.');}const body={...payload,id:current.user.id};return rest('/rest/v1/customer_profiles?on_conflict=id',{method:'POST',body,headers:{Prefer:'resolution=merge-duplicates,return=minimal'}});},
  async deleteProfile(){const current=await auth();return rest('/rest/v1/customer_profiles?id=eq.'+encodeURIComponent(current.user.id),{method:'DELETE'});},
  async isAdmin(){return (await rest('/rest/v1/rpc/is_moc_admin',{method:'POST',body:{}}))===true;},
  async profiles({offset=0,limit=100}={}){return rest(`/rest/v1/customer_profiles?select=*&order=updated_at.desc&limit=${limit}&offset=${offset}`);},
  async redeemCode(code){return rest('/rest/v1/rpc/redeem_product_code',{method:'POST',body:{input_code:code}});},
  async entitlement(){const current=await auth();const rows=await rest('/rest/v1/product_entitlements?user_id=eq.'+encodeURIComponent(current.user.id)+'&select=valid_until');return rows[0]||null;},
  async listCodes(offset=0){return rest('/rest/v1/product_codes?select=*,product_redemptions(user_id,redeemed_at,granted_until,purchase_value,reward_eligible)&order=created_at.desc,code&limit=100&offset='+offset);},
  async importCodes(codes,days,expires,purchaseValue){return rest('/rest/v1/rpc/'+(purchaseValue===undefined?'import_product_codes':'import_product_codes_value'),{method:'POST',body:{codes,days,expires,...(purchaseValue===undefined?{}:{purchase_value:purchaseValue})}});},
  async checkCode(code){return rest('/rest/v1/rpc/check_product_code',{method:'POST',body:{input_code:code}});},
  async toggleCode(code,enabled){return rest('/rest/v1/product_codes?code=eq.'+encodeURIComponent(code),{method:'PATCH',body:{enabled},headers:{Prefer:'return=minimal'}});},
  async microscopyImages(id){return rest('/rest/v1/microscopy_images?request_id=eq.'+encodeURIComponent(id)+'&select=*&order=created_at.asc');},
  async microscopyImageUrl(path){const result=await rest('/storage/v1/object/sign/microscopy-results/'+path,{method:'POST',body:{expiresIn:300}});return new URL('/storage/v1'+result.signedURL,root()).href;},
  async uploadMicroscopyImage(id,file,details){
   const ext={'image/jpeg':'jpg','image/png':'png','image/webp':'webp'}[file.type];
   if(!ext||!file.size||file.size>5242880)throw new Error('Ảnh JPG/PNG/WebP tối đa 5 MB.');
   const path=id+'/'+crypto.randomUUID()+'.'+ext;
   await rest('/storage/v1/object/microscopy-results/'+path,{method:'POST',body:file,raw:true,headers:{'Content-Type':file.type}});
   try{await rest('/rest/v1/microscopy_images',{method:'POST',body:{request_id:id,path,...details}});}catch(error){try{await rest('/storage/v1/object/microscopy-results',{method:'DELETE',body:{prefixes:[path]}});}catch{}throw error;}
  },
  async deleteMicroscopyImage(image){await rest('/storage/v1/object/microscopy-results',{method:'DELETE',body:{prefixes:[image.path]}});await rest('/rest/v1/microscopy_images?id=eq.'+encodeURIComponent(image.id),{method:'DELETE'});},
  async microscopyEligibility(){return rest('/rest/v1/rpc/microscopy_eligibility',{method:'POST',body:{}});},
  async microscopyRequests(offset=0){return rest('/rest/v1/microscopy_requests?select=*&order=created_at.desc&limit=100&offset='+offset);},
  async submitMicroscopy(body){return rest('/rest/v1/rpc/submit_microscopy_request',{method:'POST',body});},
  async cancelMicroscopy(id){return rest('/rest/v1/rpc/cancel_microscopy_request',{method:'POST',body:{request_id:id}});},
  async updateMicroscopy(id,status,message,result){return rest('/rest/v1/rpc/update_microscopy_request',{method:'POST',body:{request_id:id,next_status:status,message,result_text:result}});},
  async microscopyPolicy(){const rows=await rest('/rest/v1/microscopy_policy?select=*');return rows[0];},
  async setMicroscopyPolicy(enabled,period){return rest('/rest/v1/microscopy_policy?id=eq.1',{method:'PATCH',body:{enabled,period},headers:{Prefer:'return=minimal'}});},
  async adjustRewardCredit(code,value,eligible){return rest('/rest/v1/rpc/adjust_reward_credit',{method:'POST',body:{input_code:code,new_value:value,eligible}});},
  async getNote(id){const rows=await rest('/rest/v1/customer_notes?customer_id=eq.'+encodeURIComponent(id)+'&select=note');return rows[0]?.note||'';},
  async saveNote(id,note){return rest('/rest/v1/customer_notes?on_conflict=customer_id',{method:'POST',body:{customer_id:id,note},headers:{Prefer:'resolution=merge-duplicates,return=minimal'}});}
 };
}
export function profilePayload(state){
 const records=Object.entries(state.records||{});const times=records.filter(([,r])=>r?.morning||r?.evening).map(([date])=>date).sort();
 return {name:String(state.name||'').trim().slice(0,40),phone:String(state.profile?.phone||'').slice(0,24),email:String(state.profile?.email||'').slice(0,120),goal:String(state.profile?.goal||'').slice(0,120),product_code_input:String(state.profile?.productCode||'').slice(0,64),consented_at:state.profile?.cloudConsentAt,care_summary:{total:records.reduce((n,[,r])=>n+Number(!!r?.morning)+Number(!!r?.evening),0),days:times.length,lastDate:times.at(-1)||null,morning:state.morning,evening:state.evening}};
}
