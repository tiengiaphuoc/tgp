const {prepareTestProfile}=require('./profile-fixture.cjs');
const {chromium}=require(process.env.MOC_PLAYWRIGHT_PATH||'playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.MOC_CHROME_PATH||undefined,headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}});await prepareTestProfile(page);
  await page.addInitScript(()=>Object.defineProperty(navigator.mediaDevices,'getUserMedia',{value:async()=>{const c=document.createElement('canvas');c.width=300;c.height=400;const ctx=c.getContext('2d');ctx.fillStyle='lime';ctx.fillRect(0,0,300,400);return c.captureStream(12);}}));
  await page.goto((process.env.MOC_APP_URL||'http://localhost:3000/')+'#progress');
  await page.evaluate(()=>{const c=document.createElement('canvas');c.width=300;c.height=400;const ctx=c.getContext('2d');ctx.fillStyle='red';ctx.fillRect(0,0,300,400);localStorage.setItem('moc-care',JSON.stringify({photos:[{id:'reference-red',angle:'Đường ngôi',date:'01/10/2026',src:c.toDataURL()}]}));});
  await page.reload();await page.locator('[data-action="photo"]').first().click();await page.locator('#alignment-old').evaluate(i=>i.decode());
  const blue=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=300;c.height=400;const ctx=c.getContext('2d');ctx.fillStyle='blue';ctx.fillRect(0,0,300,400);return c.toDataURL().split(',')[1];});
  const upload=async()=>{await page.locator('[name="photo"]').setInputFiles({name:'new-blue.png',mimeType:'image/png',buffer:Buffer.from(blue,'base64')});await page.locator('#alignment-new').evaluate(i=>i.decode());};await upload();
  const pixel=async selector=>{const shot=await page.locator(selector).screenshot();return page.evaluate(async data=>{const i=new Image();i.src='data:image/png;base64,'+data;await i.decode();const c=document.createElement('canvas');c.width=i.width;c.height=i.height;const x=c.getContext('2d');x.drawImage(i,0,0);return [...x.getImageData(Math.floor(i.width*.25),Math.floor(i.height*.25),1,1).data];},shot.toString('base64'));};
  for(const width of [360,390,768,1440]){
   await page.setViewportSize({width,height:900});
   const left=await page.locator('.alignment-reference-stage').boundingBox(),right=await page.locator('.alignment-stage').boundingBox();
   assert(left.x+left.width<=right.x+1,'reference and new image must be next to each other');assert(Math.abs(left.y-right.y)<2);assert(Math.abs(left.width-right.width)<2);assert(Math.abs(left.height-right.height)<2);
   const red=await pixel('.alignment-reference-stage'),bluePixel=await pixel('.alignment-stage');assert(red[0]>245&&red[2]<10,'reference is fully visible red');assert(bluePixel[2]>245&&bluePixel[0]<10,'new image is fully visible blue');
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  }
  await page.setViewportSize({width:390,height:844});
  await page.locator('#alignment-zoom').fill('180');await page.locator('#alignment-rotation').fill('12');
  const fixed=await page.locator('#alignment-old').getAttribute('style');
  const drag=async()=>{await page.locator('.alignment-stage').scrollIntoViewIfNeeded();const b=await page.locator('.alignment-stage').boundingBox();await page.mouse.move(b.x+b.width/2,b.y+b.height/2);await page.mouse.down();await page.mouse.move(b.x+b.width/2+30,b.y+b.height/2+10);await page.mouse.up();};await drag();
  assert.match(await page.locator('#alignment-new').evaluate(i=>i.style.transform),/translate\(30px, 10px\) rotate\(12deg\) scale\(-1.8,\s*1.8\)/);
  assert.equal(await page.locator('#alignment-old').getAttribute('style'),fixed,'reference stays fixed');await page.locator('#alignment-reset').click();assert.equal(await page.locator('#alignment-new').evaluate(i=>i.style.transform),'scaleX(-1)');
  await page.locator('#alignment-open').click();await page.waitForFunction(()=>document.querySelector('#alignment-video').videoWidth>0);let green=await pixel('.alignment-stage');assert(green[1]>245&&green[0]<10,'live camera visible in right pane');const red=await pixel('.alignment-reference-stage');assert(red[0]>245&&red[1]<10,'reference remains visible during camera');
  await page.locator('#alignment-zoom').fill('150');await page.locator('#alignment-timer').selectOption('0');await page.locator('#alignment-capture').click();await page.waitForFunction(()=>document.querySelector('[name="photo"]').files.length===1);await page.locator('#alignment-new').evaluate(i=>i.decode());green=await pixel('.alignment-stage');assert(green[1]>235&&green[0]<20,'captured camera frame visible after capture');
  await upload();await drag();await page.locator('#photo-form [type="submit"]').click();await page.waitForSelector('.scan-report-top');
  const saved=await page.evaluate(async()=>{const i=new Image();i.src=JSON.parse(localStorage.getItem('moc-care')).photos.at(-1).src;await i.decode();const c=document.createElement('canvas');c.width=100;c.height=100;const x=c.getContext('2d');x.drawImage(i,0,0,100,100);return {edge:[...x.getImageData(97,50,1,1).data],center:[...x.getImageData(50,50,1,1).data]};});
  assert(saved.edge[2]<100&&saved.center[2]>220,'saved image keeps drag adjustment, without baking mirrored orientation or reference');
  console.log('COMPARISON_BROWSER_PASS: separate opaque old/new frames at 360/390/768/1440px, drag/zoom/rotation/reset, live camera and capture visible, saved alignment retained. Camera uses a synthetic stream.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
