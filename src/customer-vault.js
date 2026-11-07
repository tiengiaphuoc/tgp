// Browser-only per-account cache. Never contains passwords or Auth session tokens.
let opening;
function database(){if(!opening)opening=new Promise((resolve,reject)=>{const r=indexedDB.open('moc-customer-cache',1);r.onupgradeneeded=()=>r.result.createObjectStore('accounts');r.onsuccess=()=>resolve(r.result);r.onerror=()=>{opening=null;reject(r.error);};});return opening;}
async function transaction(mode,action){const db=await database();return new Promise((resolve,reject)=>{const tx=db.transaction('accounts',mode);let value;const request=action(tx.objectStore('accounts'));request.onsuccess=()=>{value=request.result;};tx.oncomplete=()=>resolve(value);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);});}
export const customerVault={get:key=>transaction('readonly',s=>s.get(key)),put:(key,value)=>transaction('readwrite',s=>s.put(value,key)),remove:key=>transaction('readwrite',s=>s.delete(key))};
export function customerMemorySession(){
 // Retire persistent customer tokens from older builds. The admin session is separate.
 try{const old=JSON.parse(localStorage.getItem('moc-cloud-customer')||'null'),care=JSON.parse(localStorage.getItem('moc-care')||'null');if(old?.user?.id&&old.user.email&&care?.profile?.email?.toLowerCase()===old.user.email.toLowerCase())localStorage.setItem('moc-care-owner',old.user.id);localStorage.removeItem('moc-cloud-customer');}catch{localStorage.removeItem('moc-cloud-customer');}
 const values=new Map();return {getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,String(v)),removeItem:k=>values.delete(k)};
}
