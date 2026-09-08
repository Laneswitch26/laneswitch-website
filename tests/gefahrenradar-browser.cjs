// Run against a local static server: RADAR_BASE_URL=http://localhost:8080 node tests/gefahrenradar-browser.cjs
// Playwright is a development-only test tool, not a website dependency.
const assert = require('node:assert/strict');
const { chromium } = require(require.resolve('playwright', {paths: [process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES || process.cwd()]}));
const BASE=process.env.RADAR_BASE_URL || 'http://localhost:8080';
const screenshots=process.env.RADAR_SCREENSHOTS;
(async()=>{
 const {SCENES}=await import('../lernwelt/gefahrenradar/scenes.mjs');
 const browser=await chromium.launch({headless:true});
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 const page=await context.newPage(); const errors=[],thirdParty=[];
 page.on('pageerror',error=>errors.push(error.message));
 page.on('request',req=>{if(!req.url().startsWith(BASE))thirdParty.push(req.url());});
 await page.clock.install();
 await page.goto(BASE+'/lernwelt/gefahrenradar/');
 await page.locator('#gr-play:not([disabled])').waitFor();
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 if(screenshots)await page.screenshot({path:screenshots+'/start-mobile.png',fullPage:true});
 await page.locator('#gr-play').click();
 async function hit(){
  const title=await page.locator('#gr-scene-title').innerText();const s=SCENES.find(s=>s.title===title);
  const transform=await page.locator('#gr-stage [data-moving]').getAttribute('transform');
  const [x,y]=transform.match(/[\d.]+/g).map(Number);const box=await page.locator('#gr-stage').boundingBox();
  await page.touchscreen.tap(box.x+x/800*box.width,box.y+y/560*box.height);
  await page.locator('#gr-question').waitFor();return s;
 }
 const seen=[];
 for(let i=0;i<5;i++){
  const currentTitle=await page.locator('#gr-scene-title').innerText();
  const current=SCENES.find(s=>s.title===currentTitle);
  await page.clock.runFor(current.cueMs===0?1000:4400);
  const title=await page.locator('#gr-scene-title').innerText();seen.push(title);
  if(screenshots)await page.screenshot({path:screenshots+'/scene-'+SCENES.find(s=>s.title===title).id+'-mobile.png',fullPage:true});
  const s=await hit();
  await page.locator('[data-answer="'+s.options.find(o=>o.correct).id+'"]').click();
  assert.match(await page.locator('.gr-feedback-points').innerText(),/^20 \/ 20/);
  if(i===0 && screenshots) await page.screenshot({path:screenshots+'/feedback-mobile.png',fullPage:true});
  await page.locator('#gr-next').click();
 }
 assert.equal(new Set(seen).size,5);assert.match(await page.locator('.gr-result-score').innerText(),/^100/);
 assert.match(await page.locator('.gr-badge').innerText(),/Gefahrenprofi/);
 if(screenshots)await page.screenshot({path:screenshots+'/result-mobile.png',fullPage:true});
 assert.deepEqual(await page.evaluate(()=>({keys:Object.keys(localStorage),session:Object.keys(sessionStorage),cookies:document.cookie})),{keys:[],session:[],cookies:''});
 console.log('PASS: five touch scenes, correct answers, 100 points, badge, no storage/cookies');
 await page.locator('#gr-again').click();
 assert.match(await page.locator('#gr-total').innerText(),/^0 Punkte/);
 assert(!seen.includes(await page.locator('#gr-scene-title').innerText()),'replay starts with a new scene');
 // An early, irrelevant tap receives one penalty; a rapid second tap is ignored.
 let box=await page.locator('#gr-stage').boundingBox();await page.touchscreen.tap(box.x+20,box.y+20);await page.touchscreen.tap(box.x+20,box.y+20);
 assert.match(await page.locator('#gr-status').innerText(),/1\/4/);
 for(let i=0;i<5;i++){await page.clock.runFor(700);box=await page.locator('#gr-stage').boundingBox();await page.touchscreen.tap(box.x+20,box.y+20);}
 assert.match(await page.locator('#gr-status').innerText(),/Abzugslimit/);
 await page.clock.runFor(700);
 const penaltyScene=await hit();await page.locator('[data-answer="'+penaltyScene.options.find(o=>o.correct).id+'"]').click();
 assert.match(await page.locator('.gr-feedback-points').innerText(),penaltyScene.cueMs===0?/^14 \/ 20/:/^16 \/ 20/);
 console.log('PASS: cooldown and capped penalties');
 await page.locator('#gr-next').click();
 await page.clock.runFor(3500);
 await page.locator('#gr-pause').click();const frozen=await page.locator('#gr-stage [data-moving]').getAttribute('transform');
 await page.clock.runFor(20000);assert.equal(await page.locator('#gr-stage [data-moving]').getAttribute('transform'),frozen);
 assert.equal(await page.locator('#gr-stage').getAttribute('data-paused'),'true');
 await page.locator('#gr-pause').click();await page.clock.runFor(12000);
 assert.match(await page.locator('.gr-feedback-heading').innerText(),/übersehen/);
 const title=await page.locator('#gr-scene-title').innerText();const s=SCENES.find(s=>s.title===title);
 await page.locator('[data-answer="'+s.options.find(o=>!o.correct).id+'"]').click();
 assert.match(await page.locator('.gr-feedback-points').innerText(),/^0 \/ 20/);
 console.log('PASS: pause/resume, missed hazard, wrong answer and zero floor');
 await page.reload();assert.equal(await page.locator('#gr-start').isVisible(),true);
 await page.locator('#gr-calm').check();await page.locator('#gr-play').click();await page.clock.runFor(30000);
 assert.equal(await page.locator('#gr-stage').getAttribute('data-locked'),'false');
 const calm=await hit();await page.locator('[data-answer="'+calm.options.find(o=>o.correct).id+'"]').click();
 assert.match(await page.locator('.gr-feedback-points').innerText(),/^18 \/ 18/);
 await page.locator('#gr-exit').click();await page.locator('#gr-text').check();await page.locator('#gr-play').click();
 for(let i=0;i<5;i++){
  assert.equal(await page.locator('#gr-stage').isVisible(),false);
  const t=await page.locator('#gr-scene-title').innerText(),data=SCENES.find(s=>s.title===t);
  await page.locator('[data-answer="'+data.options.find(o=>o.correct).id+'"]').focus();await page.keyboard.press('Enter');await page.locator('#gr-next').click();
 }
 assert.match(await page.locator('.gr-result-score').innerText(),/^60/);assert.match(await page.locator('.gr-badge').innerText(),/Textmodus/);
 console.log('PASS: reload reset, untimed mode, complete text mode via keyboard');
 await page.locator('#gr-settings-back').click();await page.locator('#gr-text').uncheck();
 await page.locator('#gr-play').click();
 const transform=await page.locator('#gr-stage [data-moving]').getAttribute('transform');const coords=transform.match(/[\d.]+/g).map(Number);
 await page.locator('#gr-stage').focus();
 for(let i=0;i<Math.round(Math.abs(coords[0]-400)/25);i++)await page.keyboard.press(coords[0]>400?'ArrowRight':'ArrowLeft');
 for(let i=0;i<Math.round(Math.abs(coords[1]-280)/25);i++)await page.keyboard.press(coords[1]>280?'ArrowDown':'ArrowUp');
 await page.keyboard.press('Enter');await page.locator('#gr-question').waitFor();
 console.log('PASS: visual keyboard hit target');
 // Responsive checks, both themes, and screenshots of each view.
 for(const width of [320,390,768,1280])for(const dark of [false,true]){
  await page.setViewportSize({width,height:width===768?600:900});
  await page.evaluate(dark=>document.documentElement.dataset.theme=dark?'dark':'light',dark);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`overflow ${width} dark=${dark}`);
  if(screenshots)await page.screenshot({path:screenshots+`/question-${width}-${dark?'dark':'light'}.png`,fullPage:true});
 }
 assert.deepEqual(errors,[]);assert.deepEqual(thirdParty,[]);
 console.log('PASS: mobile/tablet/desktop, light/dark, no JS errors or third-party requests');
 await page.goto(BASE+'/lernwelt/');
 await page.locator('#storageSession').click();
 assert.equal(await page.locator('a[href="./gefahrenradar/"]').count(),1);
 await page.locator('[data-mode="exam"]').click();await page.locator('#questionText').waitFor();
 assert((await page.locator('#questionText').innerText()).length>10);
 assert.equal(await page.locator('.canonical-site-header').count(),1);
 console.log('PASS: existing learning quiz and shared navigation smoke check');
 await browser.close();
})().catch(error=>{console.error(error);process.exit(1)});
