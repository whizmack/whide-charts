/** Optional real-browser checks. Install Playwright separately and pass its module path.
 * PLAYWRIGHT_MODULE=/path/to/playwright/index.mjs node scripts/verify-openalgo.mjs
 * Uses a fresh isolated browser context and never writes /api/session.
 */
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE??'playwright');
const base=process.env.BASE_URL??'http://127.0.0.1:8765';
const output=resolve(process.env.OUTPUT_DIR??'/tmp/perp-openalgo-verification');
await mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
const context=await browser.newContext({viewport:{width:1280,height:720}});
const page=await context.newPage(),errors=[],report={date:new Date().toISOString(),browser:browser.version(),viewport:{width:1280,height:720}};
page.on('pageerror',e=>errors.push(String(e)));
page.on('console',m=>{if(m.type()==='error')errors.push(m.text()+' '+m.location().url)});
const key='perp-openalgo:v1:cell:chart-1:replay:BTCUSDT:5m';
const read=()=>page.evaluate(()=>Object.fromEntries(Object.entries(localStorage).filter(([k])=>k.startsWith('perp-openalgo:')).map(([k,v])=>[k,JSON.parse(v)])));
const shot=name=>page.screenshot({path:resolve(output,name+'.png')});
const ready=async(n=1)=>{await page.waitForFunction(n=>[...document.querySelectorAll('.oa-status')].filter(e=>e.textContent==='Replay · safe prefix').length===n,n);await page.waitForTimeout(200)};
const drag=async(x,y,xx,yy)=>{await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(xx,yy,{steps:20});await page.mouse.up();await page.waitForTimeout(250)};
const drawing=async()=> (await read())[key]?.drawings[0]?.drawing;
try{
 const before=await (await context.request.get(base+'/api/session')).text();
 await page.goto(base+'/openalgo.html');await ready();await shot('single');
 await page.getByRole('button',{name:'Replay',exact:true}).click();await page.getByRole('button',{name:'5m',exact:true}).click();await page.getByRole('button',{name:'Go',exact:true}).click();assert.ok(await page.getByRole('button',{name:'Step',exact:true}).isEnabled());
 await page.getByRole('button',{name:'Long',exact:true}).click();await page.mouse.click(850,300);await page.mouse.click(1000,250);await page.waitForTimeout(250);
 const original=await drawing();assert.equal(original.tool,'long-position');assert.equal(original.points.length,3);
 await drag(850,300,850,312);const entry=await drawing();assert.notEqual(entry.points[0].price,original.points[0].price);assert.equal(entry.points[1].price,original.points[1].price);
 await drag(1000,250,1000,230);const target=await drawing();assert.notEqual(target.points[1].price,entry.points[1].price);assert.equal(target.points[2].price,entry.points[2].price);
 await drag(1000,325,1000,345);const stop=await drawing();assert.notEqual(stop.points[2].price,target.points[2].price);
 await page.getByRole('button',{name:'Undo',exact:true}).first().click();assert.deepEqual((await drawing()).points,target.points);
 await page.getByRole('button',{name:'Redo',exact:true}).first().click();assert.deepEqual((await drawing()).points,stop.points);
 report.position={original:original.points,entry:entry.points,target:target.points,stop:stop.points,undoRedo:true};
 await page.getByRole('button',{name:'Short',exact:true}).click();await page.mouse.click(600,270);await page.mouse.click(730,320);assert.equal((await read())[key].drawings.length,2);await shot('positions');
 await page.getByRole('button',{name:'Objects',exact:true}).click();await page.getByRole('button',{name:'Settings for RSI',exact:true}).click();
 report.rsiDialog=await page.getByRole('dialog').filter({hasText:'RSI'}).innerText();
 const length=page.getByRole('dialog').getByRole('spinbutton').first();await length.fill('21');await length.press('Tab');
 await page.getByRole('button',{name:'OK',exact:true}).click();await page.getByRole('button',{name:'Close',exact:true}).click();
 await page.waitForTimeout(250);
 // Save native pane geometry through a real boundary drag.
 const beforeResize=(await read())[key]?.widget.chart.panes;
 await drag(400,486,400,466);await page.waitForTimeout(250);report.panes={before:beforeResize,after:(await read())[key]?.widget.chart.panes};report.paneResizeConfirmed=JSON.stringify(report.panes.before)!==JSON.stringify(report.panes.after);
 await page.getByRole('button',{name:'Magnet: off',exact:true}).click();assert.ok(await page.getByRole('button',{name:'Magnet: weak',exact:true}).count());await page.getByRole('button',{name:'Magnet: weak',exact:true}).click();assert.ok(await page.getByRole('button',{name:'Magnet: strong',exact:true}).count());await page.getByRole('button',{name:'Magnet: strong',exact:true}).click();
 await page.getByRole('button',{name:'Trend Line (pinned)',exact:true}).click();await page.keyboard.down('Control');await page.mouse.move(1100,310);await page.keyboard.up('Control');await page.mouse.move(1150,320);await page.keyboard.press('Escape');assert.ok(await page.getByRole('button',{name:'Magnet: off',exact:true}).count());report.magnet='off → weak → strong → off; Control release leaves off';
 await page.mouse.move(500,210);await page.mouse.wheel(0,-350);await page.waitForTimeout(450);const zoom=(await read())[key]?.view;
 await drag(500,210,570,210);const pan=(await read())[key]?.view;assert.notDeepEqual(zoom,pan);report.navigation={zoom,pan};
 await page.reload();await ready();assert.equal((await read())[key].drawings.length,2);report.reload=true;
 // Rewind remains empty while the real backend request is delayed.
 let release,seen;const gate=new Promise(r=>release=r),requested=new Promise(r=>seen=r);
 await page.route('**/api/bars?**',async route=>{seen();await gate;await route.continue().catch(()=>{})});
 await page.getByLabel('Replay cutoff UTC').fill('2023-05-12T10:24');await page.getByRole('button',{name:'Go',exact:true}).click();await requested;await page.waitForTimeout(150);
 report.pending=await page.locator('.oa-cell-body').innerText();assert.ok(report.pending.includes('0 bars'));await shot('rewind-pending');
 await page.getByRole('button',{name:'Objects',exact:true}).click();assert.equal(await page.getByRole('button',{name:'Select Long Position',exact:true}).count(),0);await page.getByRole('button',{name:'Close',exact:true}).click();release();await ready();await page.unroute('**/api/bars?**');
 await page.getByRole('button',{name:'Undo',exact:true}).first().click();
 await page.getByLabel('Replay cutoff UTC').fill('2023-05-12T10:25');await page.getByRole('button',{name:'Go',exact:true}).click();await ready();
 const version=(await (await context.request.get(base+'/api/markets')).json()).datasetVersion,asOf=Date.UTC(2023,4,12,10,25);
 const load=async tf=>(await (await context.request.get(`${base}/api/bars?symbol=BTCUSDT&timeframe=${tf}&asOf=${asOf}&version=${version}&limit=1000`)).json()).bars;
 const minute=(await load('1m')).filter(b=>b.time>=Date.UTC(2023,4,12,10)),hour=(await load('1h')).at(-1);
 assert.equal(minute.length,25);assert.equal(hour.high,Math.max(...minute.map(b=>b.high)));assert.equal(hour.low,Math.min(...minute.map(b=>b.low)));assert.equal(hour.close,minute.at(-1).close);assert.ok(Math.abs(hour.volume-minute.reduce((s,b)=>s+b.volume,0))<1e-7);report.partial={minutes:minute.length,hour};
 await page.getByLabel('Chart layout').selectOption('2');await ready(2);assert.ok(await page.getByRole('button',{name:'Step',exact:true}).isEnabled());
 await page.getByLabel('Activate chart-2').click();await page.getByLabel('Pair',{exact:true}).selectOption('ETHUSDT');await ready(2);assert.ok(await page.getByRole('button',{name:'Step',exact:true}).isEnabled());
 await page.getByLabel('Sync time',{exact:true}).check();await page.getByLabel('Crosshair',{exact:true}).check();await drag(280,210,370,210);
 const values=await read(),viewA=values[key].view,viewB=values['perp-openalgo:v1:cell:chart-2:replay:ETHUSDT:15m'].view;assert.ok(Math.abs(viewA.from-viewB.from)<1);assert.ok(Math.abs(viewA.to-viewB.to)<1);report.sync={viewA,viewB};await page.mouse.move(20,20);await page.waitForTimeout(150);const crossBefore=await page.locator('.oa-cell').nth(1).screenshot();await page.mouse.move(280,210);await page.waitForTimeout(200);const crossAfter=await page.locator('.oa-cell').nth(1).screenshot();assert.notDeepEqual(crossBefore,crossAfter);report.crosshairLinked=true;
 await page.getByLabel('Chart layout').selectOption('4');await ready(4);await shot('four');assert.ok(await page.getByRole('button',{name:'Step',exact:true}).isEnabled());
 await page.getByLabel('Activate chart-4').click();await page.getByRole('button',{name:'Settings',exact:true}).click();const box=await page.getByRole('dialog',{name:'Chart settings',exact:true}).boundingBox();assert.ok(box.x>=0&&box.y>=0&&box.x+box.width<=1280&&box.y+box.height<=720);report.settingsBox=box;await shot('four-settings');await page.keyboard.press('Escape');
 await page.getByRole('button',{name:'Step',exact:true}).click();await ready(4);const cutoffs=await page.locator('.oa-cell-body').evaluateAll(nodes=>nodes.map(n=>n.dataset.asOf));assert.equal(new Set(cutoffs).size,1);report.cutoffs=cutoffs;
 await page.reload();await ready(4);assert.equal(await page.locator('.oa-cell').count(),4);
 await page.setViewportSize({width:390,height:720});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.getByLabel('Maximize chart-4').click();await ready(1);await shot('narrow-max');report.narrow=true;
 await page.setViewportSize({width:1280,height:720});await page.getByRole('button',{name:'Live',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.oa-status')?.textContent==='live',{},{timeout:30000});report.live=await page.locator('.oa-cell-body').innerText();await shot('live');
 await page.getByRole('button',{name:'Replay',exact:true}).click();await ready();report.returnCutoff=await page.getByLabel('Replay cutoff UTC').inputValue();
 assert.equal(await (await context.request.get(base+'/api/session')).text(),before);report.sessionUnchanged=true;
 assert.deepEqual(errors,[]);report.errors=errors;report.passed=true;
}catch(e){report.passed=false;report.failure=String(e);report.errors=errors;await shot('failure');process.exitCode=1}
finally{await writeFile(resolve(output,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({passed:report.passed,failure:report.failure,output}));await browser.close()}
