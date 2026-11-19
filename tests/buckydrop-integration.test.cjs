const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),crypto=require('node:crypto'),ts=require('typescript');
function load(file,overrides={},env={}){
 const src=fs.readFileSync(path.join(process.cwd(),file),'utf8');
 const js=ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const module={exports:{}};
 class BuckydropError extends Error{constructor(code,status,message){super(message);this.code=code;this.status=status;}}
 const modules={'server-only':{},'node:crypto':crypto,'@/lib/buckydrop':{BuckydropError},...overrides.modules};
 const sandbox={module,exports:module.exports,require:name=>{if(!(name in modules))throw Error('Unexpected module '+name);return modules[name];},
 process:{env:{BUCKYDROP_ENV:'live',BUCKYDROP_APP_CODE:'fake-code',BUCKYDROP_APP_SECRET:'fake-secret',...env}},
 fetch:overrides.fetch||(()=>{throw Error('Unexpected network call');}),URL,Request,Response,AbortSignal,Date,Buffer,console};
 vm.runInNewContext(js,sandbox,{filename:file,timeout:4000});return module.exports;
}
const success=data=>({ok:true,json:async()=>({success:true,code:0,data})});
test('signed order detail has canonical path, exact body bytes and correct MD5 signature',async()=>{
 let seen=false;
 const {callBucky}=load('lib/buckydrop-gateway.ts',{fetch:async(url,opts)=>{
  seen=true;const u=new URL(url);
  assert.equal(u.origin,'https://bdopenapi.buckydrop.com');
  assert.equal(u.pathname,'/api/rest/v2/adapt/adaptation/order/detail');
  assert.equal(opts.method,'POST');assert.equal(opts.redirect,'error');
  assert.equal(opts.headers.lang,'en');assert.equal(opts.headers['Content-Type'],'application/json');
  assert.equal(opts.body,JSON.stringify({partnerOrderNo:'HC-TEST'}));
  const expected=crypto.createHash('md5').update('fake-code'+opts.body+u.searchParams.get('timestamp')+'fake-secret').digest('hex');
  assert.equal(u.searchParams.get('sign'),expected);assert.ok(!String(url).includes('fake-secret'));
  return success({shopOrderNo:'SO-1'});
 }});
 const result=await callBucky('order-detail',{partnerOrderNo:'HC-TEST'});
 assert.equal(result.shopOrderNo,'SO-1');assert.ok(seen);
});
test('sandbox/unconfigured environment refuses live gateway requests',async()=>{
 const {callBucky}=load('lib/buckydrop-gateway.ts',{}, {BUCKYDROP_ENV:'sandbox'});
 await assert.rejects(callBucky('order-detail',{partnerOrderNo:'X'}),{code:'LIVE_NOT_CONFIGURED',status:503});
});
test('an accepted Shop Order may omit optional response data without a retryable failure',async()=>{
 for(const data of [null,undefined]){
  const {callBucky}=load('lib/buckydrop-gateway.ts',{fetch:async()=>success(data)});
  assert.deepEqual({...await callBucky('create-shop-order',{partnerOrderNo:'HC-TEST'})},{});
 }
});
test('read response missing data is rejected',async()=>{
 const {callBucky}=load('lib/buckydrop-gateway.ts',{fetch:async()=>success(undefined)});
 await assert.rejects(callBucky('order-detail',{partnerOrderNo:'HC-TEST'}),{code:'UPSTREAM_EMPTY',status:502});
});
test('permission errors, rate limits and network errors fail safely',async()=>{
 for(const [code,wanted,status] of [[70000014,'PERMISSION_NOT_GRANTED',503],[70000015,'UPSTREAM_RATE_LIMIT',429]]){
  const {callBucky}=load('lib/buckydrop-gateway.ts',{fetch:async()=>({ok:true,json:async()=>({success:false,code})})});
  await assert.rejects(callBucky('order-detail',{partnerOrderNo:'X'}),{code:wanted,status});
 }
 const {callBucky}=load('lib/buckydrop-gateway.ts',{fetch:async()=>{throw Error('network unavailable');}});
 await assert.rejects(callBucky('order-detail',{partnerOrderNo:'X'}),{code:'UPSTREAM_TIMEOUT',status:502});
});
function adapters(extra={}){
 let calls=0;
 return {calls:()=>calls,modules:{
  'next/server':{NextResponse:{json:(body,opts={})=>Response.json(body,{status:opts.status||200,headers:opts.headers})}},
  '@/lib/buckydrop-gateway':{liveReady:()=>true,callBucky:async()=>{calls++;return {records:[]};}},
  '@/lib/buckydrop':{queryBuckydropProduct:async()=>{calls++;return {};},BuckydropError:class extends Error{}},
  '@/lib/marketplace-links':{normalizeMarketplaceLink:()=>null},
  '@/lib/buckydrop-order-store':{storageAvailable:()=>true},
  '@/lib/fx-reference':{getReferenceCnyGbpRate:async()=>({rate:0.11,date:'2026-11-19'})},
  ...extra
 }};
}
test('disabled order submission blocks all unauthorised supplier writes',async()=>{
 const a=adapters();const {POST}=load('app/api/buckydrop/orders/submit/route.ts',{modules:a.modules},{HEROCON_ORDER_SUBMISSION_ENABLED:'false'});
 const res=await POST(new Request('https://herocon.store/api/buckydrop/orders/submit',{method:'POST'}));
 assert.equal(res.status,503);assert.match((await res.json()).error,/not enabled/i);assert.equal(a.calls(),0);
});
test('even enabled order submission rejects callers without the server secret',async()=>{
 const a=adapters();const {POST}=load('app/api/buckydrop/orders/submit/route.ts',{modules:a.modules},{HEROCON_ORDER_SUBMISSION_ENABLED:'true',HEROCON_INTERNAL_FULFILMENT_KEY:'x'.repeat(64)});
 const res=await POST(new Request('https://herocon.store/api/buckydrop/orders/submit',{method:'POST'}));
 assert.equal(res.status,401);assert.equal(a.calls(),0);
});
test('shipping quote rejects foreign origins before making a provider request',async()=>{
 const a=adapters();const {POST}=load('app/api/buckydrop/shipping-quote/route.ts',{modules:a.modules});
 const res=await POST(new Request('https://herocon.store/api/buckydrop/shipping-quote',{method:'POST',headers:{origin:'https://example.invalid','content-type':'application/json'},body:'{}'}));
 assert.equal(res.status,403);assert.equal(a.calls(),0);
});
test('shipping quote sends kilograms and makes no payment',async()=>{
 let op,body;
 const a=adapters({'@/lib/buckydrop-gateway':{liveReady:()=>true,callBucky:async(x,y)=>{op=x;body=y;return {records:[{serviceCode:'TEST',totalPrice:12.5}],total:1};}}});
 const {POST}=load('app/api/buckydrop/shipping-quote/route.ts',{modules:a.modules},{BUCKYDROP_QUOTE_CURRENCY:''});
 const payload={country:'GB',kind:'clothing',grams:1400,length:30,width:20,height:10};
 const res=await POST(new Request('https://herocon.store/api/buckydrop/shipping-quote',{method:'POST',headers:{origin:'https://herocon.store','content-type':'application/json'},body:JSON.stringify(payload)}));
 assert.equal(res.status,200);assert.equal(op,'shipping-quote');
 assert.equal(body.item.countryCode,'GB');assert.equal(body.item.productList[0].weight,1.4);
 assert.equal(body.item.productList[0].length,30);
 const result=await res.json();assert.equal(result.rates[0].amount,12.5);
 assert.equal(result.rates[0].currency,null);assert.equal(result.paymentAvailable,false);
});
