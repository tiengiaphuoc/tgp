const {chromium}=require(process.env.MOC_PLAYWRIGHT_PATH||'playwright');
const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({headless:true,executablePath:process.env.MOC_CHROME_PATH||undefined,args:['--no-sandbox']});try{
const page=await browser.newPage({viewport:{width:1440,height:1050}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
const base=process.env.MOC_APP_URL||'http://localhost:3000/';await page.goto(new URL('admin.html',base).href,{waitUntil:'networkidle'});
assert.match(await page.locator('.demo-banner').textContent(),/minh họa/);assert.equal(await page.locator('.stat').count(),4);
if(process.env.MOC_ADMIN_SHOTS)await page.screenshot({path:'/tmp/moc-admin-desktop.png',fullPage:true});
await page.locator('[data-view="customers"]').first().click();
await page.locator('#customer-search').fill('MC002');assert.equal(await page.locator('tbody tr').count(),1);assert.match(await page.locator('tbody').textContent(),/Bình/);
await page.locator('.customer-link').click();assert.match(await page.locator('.privacy-note').textContent(),/chưa đồng ý/);assert.equal(await page.locator('.photo-placeholders').count(),0);
await page.locator('textarea[name="note"]').fill('Ghi chú kiểm tra giả lập');await page.locator('select[name="owner"]').selectOption('Đội chăm sóc Mộc');await page.locator('input[name="handled"]').check();await page.locator('#care-form .primary').click();assert.match(await page.locator('tbody').textContent(),/Đã hỗ trợ/);
await page.reload();await page.locator('[data-view="customers"]').first().click();await page.locator('#customer-search').fill('MC002');await page.locator('.customer-link').click();assert.match(await page.locator('.note-item').textContent(),/Ghi chú kiểm tra giả lập/);assert.equal(await page.locator('select[name="owner"]').inputValue(),'Đội chăm sóc Mộc');await page.keyboard.press('Escape');
await page.locator('#customer-search').fill('');await page.locator('#status-filter').selectOption('handled');assert.equal(await page.locator('tbody tr').count(),1);
await page.locator('#status-filter').selectOption('all');await page.locator('[data-select="MC001"]').check();await page.locator('[data-do="bulk-assign"]').click();await page.locator('.customer-link[data-customer="MC001"]').click();assert.equal(await page.locator('select[name="owner"]').inputValue(),'Đội chăm sóc Mộc');await page.keyboard.press('Escape');
await page.locator('#plan-filter').selectOption('paid');assert.equal(await page.locator('tbody tr').count(),4);
const download=page.waitForEvent('download');await page.locator('[data-do="export"]').click();const file=await download;assert.match(file.suggestedFilename(),/MAU.csv/);
await page.locator('#customer-search').fill('không tồn tại');assert.match(await page.locator('tbody').textContent(),/Không có khách/);
await page.setViewportSize({width:390,height:844});for(const v of ['overview','customers','care','products','reports','settings']){await page.locator(`[data-view="${v}"]:visible`).first().click();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,v+' mobile overflow');}
await page.locator('[data-view="overview"]:visible').first().click();await page.locator('#period').selectOption('7');assert.match(await page.locator('.stat').nth(1).textContent(),/7 ngày/);
if(process.env.MOC_ADMIN_SHOTS)await page.screenshot({path:'/tmp/moc-admin-mobile.png',fullPage:true});assert.deepEqual(errors,[]);
console.log('ADMIN_BROWSER_PASS: filters/search, consent display, notes persistence, assignment, handled queue, CSV export, empty state, all mobile pages and period selection.');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
