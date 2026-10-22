const assert=require('node:assert/strict');
const {chromium}=require(require.resolve('playwright',{paths:[process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES||process.cwd()]}));
const base=process.env.AV_BASE||'http://localhost:8080', online=process.env.AV_ONLINE==='1', prefix=online?'/konzept':'';
(async()=>{const browser=await chromium.launch({headless:true,executablePath:process.env.AV_CHROME||undefined,args:["--no-sandbox"]});const page=await browser.newPage();const errors=[],requests=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));
for(const audience of ['fahrschueler','fahrschulen']){
 await page.goto(base+prefix+'/altersvorsorge/?zielgruppe='+audience);await page.locator('#law-year').filter({hasText:'2027'}).waitFor();
 await page.selectOption('#status','pension-insured');await page.fill('#age','24');await page.selectOption('#bonus','unused');await page.selectOption('#scope','new-single');await page.selectOption('#domestic','yes');
 assert.match(await page.locator('#result-status').innerText(),/380,00/);await page.fill('#children','2');await page.selectOption('#assigned','yes');assert.match(await page.locator('#result-status').innerText(),/980,00/);
 await page.fill('#inquiry-name','Änne & Ömer');await page.locator('#inquiry details summary').click();assert.match(await page.inputValue('#email-preview'),/Änne & Ömer/);assert.match(await page.inputValue('#email-preview'),/360,00 € jährlich/);
 for(const width of [320,390,768,1280])for(const theme of ['light','dark']){await page.setViewportSize({width,height:900});await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Overflow ${audience} ${width} ${theme}`);await page.screenshot({path:`/tmp/av-shots/${online?"online":"de"}-${audience}-${width}-${theme}.png`,fullPage:true});}
 await page.selectOption('#period','year');await page.fill('#contribution','121');await page.selectOption('#period','month');await page.selectOption('#period','year');assert.equal(await page.inputValue('#contribution'),'121,00');assert.match(await page.inputValue('#email-preview'),/121,00 € jährlich/);
 await page.fill('#contribution','119,99');assert.match(await page.locator('#result-status').innerText(),/0,00/);
 await page.selectOption('#status','self-employed');await page.selectOption('#self-conditions','no');assert.match(await page.locator('#result-content').innerText(),/individuelle Prüfung/);assert.doesNotMatch(await page.inputValue('#email-preview'),/Zulagen 2027 insgesamt/);
 await page.selectOption('#self-conditions','yes');await page.fill('#age','40');await page.fill('#contribution','1800');assert.match(await page.locator('#result-status').innerText(),/1.140,00/);
 await page.fill('#contribution','-1');assert.equal(await page.locator('#inquiry').isVisible(),false);
 await page.fill('#contribution','1800');await page.locator('button[type=submit]').focus();await page.keyboard.press('Enter');assert.equal(await page.evaluate(()=>document.activeElement.id),'result-title');
 const stored=await page.evaluate(()=>({local:Object.keys(localStorage),session:Object.keys(sessionStorage),cookies:document.cookie}));assert.deepEqual(stored.local.filter(k=>!online||!['ls-audience-v2','laneswitch-theme-v1'].includes(k)),[]);assert.deepEqual(stored.session,[]);assert.equal(stored.cookies,'');
 await page.reload();assert.equal(await page.inputValue('#age'),'');
}
for(const route of ['/fahrschueler/','/fahrschulen/']){await page.goto(base+prefix+route+(online?'#werkzeuge':''));await page.locator('a[href^="'+prefix+'/altersvorsorge/"]').first().waitFor();assert((await page.locator('a[href^="'+prefix+'/altersvorsorge/"]').count())>=1);}
assert.deepEqual(errors,[]);assert.deepEqual(requests.filter(u=>!u.startsWith(base)),[]);
console.log('PASS: two audiences, 16 viewport/theme combinations, bonus/children/self-employed/manual review, exact annual toggle, UTF-8 draft, keyboard, reload, no storage or third-party requests, both integration links.');await browser.close();})().catch(e=>{console.error(e);process.exit(1)});
