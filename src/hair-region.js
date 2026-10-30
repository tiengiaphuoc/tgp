export const regionGuides={
 'Đường ngôi':'Khoanh sát đường ngôi và phần tóc hai bên. Giữ cùng cách rẽ ngôi để đối chiếu độ lộ da đầu.',
 'Đỉnh đầu':'Khoanh vùng xoáy tóc ở đỉnh đầu, tránh lấy nền phòng hoặc trán. Giữ xoáy ở cùng vị trí giữa hai lần chụp.',
 'Đường chân tóc':'Khoanh đường tiếp giáp tóc và trán, kèm một phần tóc phía trên. Giữ cùng tư thế đầu và cách vén tóc.',
 'Thái dương trái':'Khoanh đường viền tóc ở thái dương trái. Giữ cùng phía, góc nghiêng và cách vén tóc.',
 'Thái dương phải':'Khoanh đường viền tóc ở thái dương phải. Giữ cùng phía, góc nghiêng và cách vén tóc.'
};
export function regionBounds(region,width,height){
 const size=Math.max(.2,Math.min(1,Number(region?.width)||.6));
 const h=Math.max(.2,Math.min(1,Number(region?.height)||size));
 const x=Math.max(0,Math.min(1-size,Number(region?.x)||0));const y=Math.max(0,Math.min(1-h,Number(region?.y)||0));
 return {x:Math.floor(x*width),y:Math.floor(y*height),width:Math.max(1,Math.floor(size*width)),height:Math.max(1,Math.floor(h*height))};
}
export function mountHairRegion({form,alignment}){
 const root=form.querySelector('#hair-region');let selection={x:.2,y:.2,width:.6,height:.6,source:'center-default'},timer,revision=0,url='',closed=false;
 root.innerHTML=`<section class="hair-region"><h3>Khoanh vùng tóc cần theo dõi</h3><p id="hair-region-guide"></p><p>Khung vàng là vùng được kiểm tra. Kéo khung hoặc chỉnh thanh bên dưới để chỉ lấy vùng tóc/da đầu, tránh nền và khuôn mặt.</p><div class="hair-region-preview" hidden><img alt="Ảnh mới đã căn với vùng tóc được chọn"><div class="hair-region-box" aria-hidden="true"></div></div><p class="hair-region-empty">Chọn hoặc chụp ảnh để khoanh vùng tóc.</p><div class="hair-region-controls"><label>Kích thước vùng <output id="hair-region-size-label">60%</output><input type="range" id="hair-region-size" min="20" max="100" value="60"></label><label>Vị trí ngang<input type="range" id="hair-region-x" min="0" max="100" value="50"></label><label>Vị trí dọc<input type="range" id="hair-region-y" min="0" max="100" value="50"></label></div><small>Khung giữa ảnh chỉ là gợi ý ban đầu, chưa tự nhận diện tóc. Hãy kiểm tra và chỉnh đúng vùng cần theo dõi.</small></section>`;
 const get=id=>root.querySelector('#'+id),preview=root.querySelector('.hair-region-preview'),img=preview.querySelector('img'),box=preview.querySelector('.hair-region-box');
 function draw(){box.style.left=selection.x*100+'%';box.style.top=selection.y*100+'%';box.style.width=selection.width*100+'%';box.style.height=selection.height*100+'%';get('hair-region-size-label').textContent=Math.round(selection.width*100)+'%';}
 function update(){const size=Number(get('hair-region-size').value)/100;selection={x:(1-size)*Number(get('hair-region-x').value)/100,y:(1-size)*Number(get('hair-region-y').value)/100,width:size,height:size,source:'manual'};draw();}
 for(const id of ['hair-region-size','hair-region-x','hair-region-y'])get(id).oninput=update;
 let drag=null;box.onpointerdown=e=>{e.preventDefault();box.setPointerCapture(e.pointerId);drag={id:e.pointerId,x:e.clientX,y:e.clientY,left:selection.x,top:selection.y};};box.onpointermove=e=>{if(drag?.id!==e.pointerId)return;selection.x=Math.max(0,Math.min(1-selection.width,drag.left+(e.clientX-drag.x)/preview.clientWidth));selection.y=Math.max(0,Math.min(1-selection.height,drag.top+(e.clientY-drag.y)/preview.clientHeight));selection.source='manual';get('hair-region-x').value=selection.width===1?50:selection.x/(1-selection.width)*100;get('hair-region-y').value=selection.height===1?50:selection.y/(1-selection.height)*100;draw();};box.onpointerup=box.onpointercancel=()=>drag=null;
 function guide(){get('hair-region-guide').textContent=regionGuides[form.elements.namedItem('angle').value];}guide();form.elements.namedItem('angle').addEventListener('change',guide);draw();
 async function refresh(){const token=++revision,file=form.elements.namedItem('photo').files[0];if(!file)return;try{const adjusted=await alignment.adjustedFile(file);if(closed||token!==revision)return;const next=URL.createObjectURL(adjusted);if(url)URL.revokeObjectURL(url);url=next;img.src=url;preview.hidden=false;root.querySelector('.hair-region-empty').hidden=true;}catch{root.querySelector('.hair-region-empty').textContent='Không đọc được ảnh để khoanh vùng. Hãy thử ảnh JPG hoặc PNG khác.';}}
 const schedule=()=>{clearTimeout(timer);timer=setTimeout(refresh,180);};form.addEventListener('alignmentchange',schedule);form.elements.namedItem('photo').addEventListener('change',schedule);
 function cleanup(){if(closed)return;closed=true;revision++;clearTimeout(timer);if(url)URL.revokeObjectURL(url);observer.disconnect();form.removeEventListener('alignmentchange',schedule);form.elements.namedItem('photo').removeEventListener('change',schedule);}
 const modal=form.closest('#modal');const observer=new MutationObserver(()=>{if(!form.isConnected||modal?.hidden)cleanup();});observer.observe(modal,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden']});
 return {refresh,getSelection:()=>({...selection}),cleanup};
}
