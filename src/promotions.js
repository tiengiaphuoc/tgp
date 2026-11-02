import {cloudConfig} from './cloud-config.js';
import {validateCloudConfig} from './cloud-client.js?v=promotions-25';
export const PROMOTIONS_KEY='moc-promotions-editor-v1';
export const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const vietnamDate=(now=new Date())=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Ho_Chi_Minh',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
function date(value){return typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&!Number.isNaN(Date.parse(value))&&new Date(value).toISOString().slice(0,10)===value;}
export function validatePromotion(row){
 const text=(v,max,min=0)=>typeof v==='string'&&v.length<=max&&v.trim().length>=min;
 if(!row||!text(row.id,36)||!/^[-0-9a-f]{36}$/.test(row.id)||!text(row.title,180,3)||!text(row.body,4000,10)||!date(row.starts_on)||!date(row.ends_on)||row.ends_on<row.starts_on||!['draft','published','hidden'].includes(row.status)||!text(row.cta_text,60)||!text(row.cta_url,1000))throw Error('Nhập tiêu đề, nội dung và thời gian hợp lệ. Ngày kết thúc không trước ngày bắt đầu.');
 if(Boolean(row.cta_text.trim())!==Boolean(row.cta_url.trim()))throw Error('Điền cả tên nút và liên kết, hoặc bỏ trống cả hai.');
 if(row.cta_url){try{const u=new URL(row.cta_url);if(u.protocol!=='https:'||!u.hostname||u.username||u.password||/\s/.test(row.cta_url))throw Error();}catch{throw Error('Liên kết cần là địa chỉ HTTPS hợp lệ.');}}
 return Object.fromEntries(['id','title','body','starts_on','ends_on','status','cta_text','cta_url'].map(k=>[k,row[k]]));
}
export function activePromotions(rows,today=vietnamDate()){return rows.filter(r=>r.status==='published'&&r.starts_on<=today&&r.ends_on>=today).sort((a,b)=>b.starts_on.localeCompare(a.starts_on));}
export function readPromotionDrafts(){try{const rows=JSON.parse(localStorage.getItem(PROMOTIONS_KEY)||'null');return Array.isArray(rows)?rows.map(validatePromotion):null;}catch{return null;}}
export async function loadPromotions(){try{
 let rows;
 if(cloudConfig.enabled){validateCloudConfig(cloudConfig);const r=await fetch(cloudConfig.url.replace(/\/$/,'')+'/rest/v1/promotions?select=*&status=eq.published&order=starts_on.desc&limit=100',{headers:{apikey:cloudConfig.publishableKey},cache:'no-store',signal:AbortSignal.timeout(12000)});if(!r.ok)throw Error();rows=await r.json();}
 else{const r=await fetch(new URL('../content/promotions.json',import.meta.url),{cache:'no-store'});if(!r.ok)throw Error();const data=await r.json();if(data.schemaVersion!==1)throw Error();rows=data.promotions;}
 if(!Array.isArray(rows))throw Error();rows=rows.map(validatePromotion);
 const preview=new URLSearchParams(location.search).get('preview')==='promotions';
 if(preview)rows=readPromotionDrafts()??rows;
 return {rows,error:false,preview};
 }catch{return {rows:[],error:true,preview:false};}}
export function promotionCards(rows){return rows.map(r=>`<article class="promotion-item"><span class="promotion-tag">ƯU ĐÃI TỪ MỘC</span><h3>${esc(r.title)}</h3><p class="promotion-dates">${esc(r.starts_on.split('-').reverse().join('/'))} – ${esc(r.ends_on.split('-').reverse().join('/'))} · giờ Việt Nam</p><div class="promotion-body">${esc(r.body)}</div>${r.cta_url?`<a class="btn dark" href="${esc(r.cta_url)}" target="_blank" rel="noopener noreferrer">${esc(r.cta_text)}</a>`:''}</article>`).join('');}
export function promotionsSection(data){const rows=activePromotions(data.rows);return `<section class="card promotions-section" id="product-promotions"><span class="eyebrow">ƯU ĐÃI & ĐỒNG HÀNH</span><div class="section-title"><div><h2>Thông tin khuyến mãi</h2><p>Cập nhật các chương trình chính thức từ Mộcceutics.</p></div><span class="promotion-gift" aria-hidden="true">✦</span></div>${data.preview?'<p class="promotion-notice">BẢN XEM TRƯỚC TRÊN THIẾT BỊ · Chưa cập nhật cho khách hàng.</p>':''}<div class="promotion-list">${data.error?'<p role="status">Chưa tải được thông tin khuyến mãi. Vui lòng thử lại.</p>':rows.length?promotionCards(rows):'<div class="promotion-empty"><b>Chưa có chương trình khuyến mãi đang áp dụng</b><p>Mộc sẽ cập nhật thông tin tại đây khi có chương trình mới. Bạn xem thời gian và điều kiện trong từng ưu đãi nhé.</p></div>'}</div><button type="button" class="text-btn" data-promotions-refresh>Làm mới thông tin khuyến mãi</button></section>`;}
