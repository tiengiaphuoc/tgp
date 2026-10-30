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
 async function request(path,{method='GET',body,token,headers={}}={}){
  if(!configured())throw new Error('Chưa cấu hình cơ sở dữ liệu chung.');
  const response=await fetcher(root()+path,{method,headers:{apikey:config.publishableKey,...(token?{Authorization:'Bearer '+token}:{}),...(body!==undefined?{'Content-Type':'application/json'}:{}),...headers},...(body!==undefined?{body:JSON.stringify(body)}:{}),cache:'no-store',signal:AbortSignal.timeout(20000)});
  if(!response.ok){const error=new Error(response.status===401?'Phiên đăng nhập hết hạn. Vui lòng thử đăng nhập lại.':response.status===403?'Tài khoản chưa có quyền truy cập dữ liệu này.':'Chưa kết nối được dữ liệu. Kiểm tra mạng và cấu hình Supabase.');error.status=response.status;throw error;}
  return response.status===204?null:response.text().then(text=>text?JSON.parse(text):null);
 }
 async function auth({anonymous=false}={}){
  if(!session){if(!anonymous)throw new Error('Vui lòng đăng nhập quản trị.');return saveSession(await request('/auth/v1/signup',{method:'POST',body:{data:{app:'mocceutics'}}}));}
  if(session.expires_at<=Math.floor(Date.now()/1000)+60)saveSession(await request('/auth/v1/token?grant_type=refresh_token',{method:'POST',body:{refresh_token:session.refresh_token}}));
  return session;
 }
 async function rest(path,options={}){const current=await auth();try{return await request(path,{...options,token:current.access_token});}catch(error){if(error.status!==401)throw error;session.expires_at=0;const refreshed=await auth();return request(path,{...options,token:refreshed.access_token});}}
 return {configured,hasSession:()=>!!session,
  async signIn(email,password){const result=await request('/auth/v1/token?grant_type=password',{method:'POST',body:{email,password}});saveSession(result);return result;},
  async signOut(){try{if(session)await request('/auth/v1/logout',{method:'POST',token:session.access_token});}finally{saveSession(null);}},
  async upsertProfile(payload){const current=await auth({anonymous:true});const body={...payload,id:current.user.id};return rest('/rest/v1/customer_profiles?on_conflict=id',{method:'POST',body,headers:{Prefer:'resolution=merge-duplicates,return=minimal'}});},
  async deleteProfile(){const current=await auth();return rest('/rest/v1/customer_profiles?id=eq.'+encodeURIComponent(current.user.id),{method:'DELETE'});},
  async isAdmin(){return (await rest('/rest/v1/rpc/is_moc_admin',{method:'POST',body:{}}))===true;},
  async profiles({offset=0,limit=100}={}){return rest(`/rest/v1/customer_profiles?select=*&order=updated_at.desc&limit=${limit}&offset=${offset}`);},
  async getNote(id){const rows=await rest('/rest/v1/customer_notes?customer_id=eq.'+encodeURIComponent(id)+'&select=note');return rows[0]?.note||'';},
  async saveNote(id,note){return rest('/rest/v1/customer_notes?on_conflict=customer_id',{method:'POST',body:{customer_id:id,note},headers:{Prefer:'resolution=merge-duplicates,return=minimal'}});}
 };
}
export function profilePayload(state){
 const records=Object.entries(state.records||{});const times=records.filter(([,r])=>r?.morning||r?.evening).map(([date])=>date).sort();
 return {name:String(state.name||'').trim().slice(0,40),phone:String(state.profile?.phone||'').slice(0,24),email:String(state.profile?.email||'').slice(0,120),goal:String(state.profile?.goal||'').slice(0,120),consented_at:state.profile?.cloudConsentAt,care_summary:{total:records.reduce((n,[,r])=>n+Number(!!r?.morning)+Number(!!r?.evening),0),days:times.length,lastDate:times.at(-1)||null,morning:state.morning,evening:state.evening}};
}
