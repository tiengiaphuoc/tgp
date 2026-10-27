const {chromium}=require(process.env.MOC_PLAYWRIGHT_PATH||'playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.MOC_CHROME_PATH||undefined,args:['--no-sandbox']});
 try {
  const page=await browser.newPage({viewport:{width:390,height:844}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(process.env.MOC_APP_URL||'http://localhost:3000/',{waitUntil:'networkidle'});
  await page.locator('[data-complete="morning"]').click();
  assert.match(await page.locator('.tag').first().textContent(),/1\/2/);
  await page.reload();assert.match(await page.locator('.tag').first().textContent(),/1\/2/);
  await page.locator('[data-action="schedule"]:visible').first().click();
  await page.locator('input[name="morning"]').fill('08:15');
  await page.locator('#schedule-form .btn').click();
  assert.match(await page.locator('.routine-item').first().textContent(),/08:15/);
  await page.locator('[data-mood="Dễ chịu"]').click();
  await page.locator('textarea').fill('Ghi nhận kiểm tra bản demo');
  await page.locator('#check-form .btn').click();
  for(const id of ['progress','routine','product','profile']){
   await page.locator(`[data-page="${id}"]:visible`).first().click();
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,id+' horizontal overflow');
  }
  await page.locator('input[name="name"]').fill('Khách thử');
  await page.locator('#settings-form .btn').click();
  await page.locator('[data-page="home"]:visible').first().click();
  assert.match(await page.locator('.page-heading').textContent(),/Khách thử/);
  const image=await page.screenshot({clip:{x:0,y:0,width:200,height:200}});
  await page.locator('[data-action="photo"]:visible').first().click();
  await page.locator('input[type="file"]').setInputFiles({name:'demo.png',mimeType:'image/png',buffer:image});
  await page.locator('#photo-form .btn').click();
  await page.waitForSelector('.saved-photo');
  assert.equal(await page.locator('.saved-photo').count(),1);
  await page.setViewportSize({width:1440,height:1000});
  await page.locator('[data-page="home"]:visible').first().click();
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'desktop horizontal overflow');
  assert.deepEqual(errors,[]);
  console.log('PUBLIC_BROWSER_PASS: app renders, morning log persists, schedule saves, check-in saves, profile saves, photo upload works, mobile/desktop pages fit, no JS exceptions.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
