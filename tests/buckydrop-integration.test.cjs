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
  const {callBucky}=load('lib/buckydrop-gateway.ts',{fetch:async()=>success(data)},{HEROCON_LEGACY_BUCKYDROP_WRITES_ENABLED:'true'});
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

test('one-payment checkout stays off until every independent merchant and supplier gate is enabled',()=>{
 const common={
  HEROCON_STRIPE_LIVE_CHECKOUT_ENABLED:'true',HEROCON_ONE_PAYMENT_LIVE_APPROVED:'true',
  HEROCON_ONE_PAYMENT_PILOT_QUOTES_ENABLED:'true',HEROCON_STRIPE_KEY_ROTATED:'true',
  STRIPE_LIVE_SECRET_KEY:'sk_live_TESTKEY',HEROCON_STRIPE_LIVE_CONNECTIVITY_ENABLED:'true',
  HEROCON_STRIPE_LIVE_ADMIN_KEY:'a'.repeat(40),HEROCON_STRIPE_LIVE_WEBHOOK_ENABLED:'true',
  STRIPE_LIVE_WEBHOOK_SECRET:'whsec_TEST',HEROCON_ORDER_SUBMISSION_ENABLED:'true',
  HEROCON_INTERNAL_FULFILMENT_KEY:'b'.repeat(40),HEROCON_ALL_IN_DELIVERED_PRICING_APPROVED:'true',
  HEROCON_FREIGHT_CURRENCY_CONFIRMED:'true',HEROCON_CHECKOUT_POLICIES_APPROVED:'true',
  HEROCON_CHECKOUT_ADMIN_KEY:'c'.repeat(40),BLOB_READ_WRITE_TOKEN:'fake-private-token',
  RESEND_API_KEY:'re_fake',HEROCON_ORDER_EMAIL_FROM:'orders@example.test',
  HEROCON_ORDER_ALERT_EMAIL:'merchant@example.test'
 };
 const a=load('lib/live-checkout.ts',{},common);
 assert.equal(a.checkoutLaunchReadiness('all_in').enabled,false);
 assert.ok(a.checkoutLaunchReadiness('all_in').missing.some(x=>x.includes('account settlement')));
 const b=load('lib/live-checkout.ts',{},{
  ...common,HEROCON_BUCKYDROP_AUTO_FULFILMENT_CONFIRMED:'true',
  HEROCON_WALLET_TOPUP_RELEASE_WORKFLOW_APPROVED:'true'
 });
 assert.equal(b.checkoutLaunchReadiness('all_in').enabled,false);
 assert.ok(b.checkoutLaunchReadiness('all_in').missing.some(x=>x.includes('Legacy BuckyDrop purchasing')));
 const approved=load('lib/live-checkout.ts',{},{...common,HEROCON_BUCKYDROP_AUTO_FULFILMENT_CONFIRMED:'true',HEROCON_WALLET_TOPUP_RELEASE_WORKFLOW_APPROVED:'true',HEROCON_LEGACY_BUCKYDROP_WRITES_ENABLED:'true'});
 assert.equal(approved.checkoutLaunchReadiness('all_in').enabled,true);
 // An all-in pilot must not accidentally unlock legacy two-stage purchases.
 assert.equal(b.checkoutLaunchReadiness('products').enabled,false);
});


test('complimentary owner premium is bound to one verified Supabase user ID, not a browser email',()=>{
 const id='123e4567-e89b-42d3-a456-426614174000';
 const {isOwnerPremiumCustomer}=load('lib/owner-premium.ts',{},{
  HEROCON_MEMBERSHIP_OWNER_TEST_USER_ID:id
 });
 assert.equal(isOwnerPremiumCustomer({id,email:'owner@example.test'}),true);
 assert.equal(isOwnerPremiumCustomer({id:'223e4567-e89b-42d3-a456-426614174000',email:'owner@example.test'}),false);
 assert.equal(isOwnerPremiumCustomer(null),false);
 const missing=load('lib/owner-premium.ts',{},{});
 assert.equal(missing.isOwnerPremiumCustomer({id,email:'owner@example.test'}),false);
});

test('complimentary owner membership does not require a live Stripe subscription',async()=>{
 const owner={id:'123e4567-e89b-42d3-a456-426614174000',email:'owner@example.test'};
 let membershipCalls=0;
 const {checkActiveMembership}=load('lib/membership-access.ts',{modules:{
  'react':{cache:fn=>fn},
  '@/lib/premium-trial':{activePremiumTrial:async()=>null},
  '@/lib/premium-trial-model':load('lib/premium-trial-model.ts'),
  '@/lib/membership-billing':{hasLiveMembership:async()=>{membershipCalls++;return false;}},
  '@/lib/owner-premium':{isOwnerPremiumCustomer:c=>c.id===owner.id}
 }});
 assert.equal(await checkActiveMembership(owner),true);
 assert.equal(membershipCalls,0);
 assert.equal(await checkActiveMembership({id:'different-user',email:'other@example.test'}),false);
 assert.equal(membershipCalls,1);
});

test('nonowners cannot start live product checkout even if someone has a paid membership',async()=>{
 let stripeCalls=0;
 const {POST}=load('app/api/checkout/start-session/route.ts',{modules:{
  'next/server':{NextResponse:{json:(body,opts={})=>Response.json(body,{status:opts.status||200,headers:opts.headers})}},
  '@/lib/approved-checkout':{},
  '@/lib/live-checkout':{checkoutLaunchReadiness:()=>({enabled:true,missing:[]})},
  '@/lib/stripe-live':{verifyLiveAccount:async()=>{stripeCalls++;return {chargesEnabled:true,country:'GB'};}},
  '@/lib/customer-auth':{currentCustomer:async()=>({id:'not-owner',email:'member@example.test'})},
  '@/lib/membership-access':{checkActiveMembership:async()=>true},
  '@/lib/owner-premium':{isOwnerPremiumCustomer:()=>false}
 }});
 const res=await POST(new Request('https://herocon.store/api/checkout/start-session',{
  method:'POST',headers:{origin:'https://herocon.store','content-type':'application/json'},body:JSON.stringify({quoteId:'hq_'+'a'.repeat(40)})
 }));
 assert.equal(res.status,403);
 assert.match((await res.json()).error,/owner pilot/i);
 assert.equal(stripeCalls,0);
});


test('checkout profit floor counts supplier FX, all BuckyDrop charges, international shipping, Stripe percentage and per-transaction fixed fees',()=>{
 const {assessMerchantCheckout,calculateMinimumCustomerPrice}=load('lib/order-economics.ts');
 const costs={
  supplierCostPence:182,
  internationalFreightPence:500,
  buckydropFeesPence:200,
  walletAndFxFeesPence:75,
  taxAndDutiesPence:0,
  shippingRiskReservePence:150
 };
 const low=assessMerchantCheckout(182+500+99,costs);
 assert.equal(low.priceApproved,false);
 assert.ok(low.projectedProfitPence<low.requiredProfitPence);
 assert.ok(low.stripeAllowancePence>=Math.ceil(low.totalPence*.06)+30);
 const floor=calculateMinimumCustomerPrice(costs);
 const safe=assessMerchantCheckout(floor,costs);
 assert.equal(safe.priceApproved,true);
 assert.ok(safe.projectedProfitPence>=200);
 assert.ok(safe.projectedProfitPence>=Math.ceil(safe.totalPence*.12));
 assert.equal(assessMerchantCheckout(floor-1,costs).priceApproved,false);
});

test('extra BuckyDrop, freight or payment FX fees can never improve checkout profitability',()=>{
 const {assessMerchantCheckout}=load('lib/order-economics.ts');
 const costs={supplierCostPence:300,internationalFreightPence:500,
  buckydropFeesPence:100,walletAndFxFeesPence:50,taxAndDutiesPence:100,
  shippingRiskReservePence:100};
 const original=assessMerchantCheckout(2000,costs);
 for(const field of ['supplierCostPence','internationalFreightPence',
  'buckydropFeesPence','walletAndFxFeesPence','taxAndDutiesPence','shippingRiskReservePence']){
  const after=assessMerchantCheckout(2000,{...costs,[field]:costs[field]+200});
  assert.ok(after.projectedProfitPence<original.projectedProfitPence);
  assert.ok(after.minimumCustomerTotalPence>original.minimumCustomerTotalPence);
 }
});

test('merchant pricing rejects missing or negative costs, rather than treating them as free',()=>{
 const {assessMerchantCheckout}=load('lib/order-economics.ts');
 const c={supplierCostPence:100,internationalFreightPence:500,buckydropFeesPence:100,
  walletAndFxFeesPence:20,taxAndDutiesPence:0,shippingRiskReservePence:100};
 assert.throws(()=>assessMerchantCheckout(1500,{...c,buckydropFeesPence:undefined}),/Invalid/);
 assert.throws(()=>assessMerchantCheckout(1500,{...c,walletAndFxFeesPence:-1}),/Invalid/);
 assert.throws(()=>assessMerchantCheckout(1499.5,c),/Invalid/);
});


function mockSignup(){
 const calls=[];const a=adapters({
  '@/lib/email-auth-error':{publicEmailError:()=>({status:503,error:'Delivery unavailable'})},
  '@/lib/customer-auth':{accountOriginValid:()=>true,customerAuthConfigured:()=>true,CustomerAuthError:class extends Error{},setCustomerCookies:()=>{},authApi:async(path,body)=>{calls.push({path,body});return {};}}
 });
 const {POST}=load('app/api/account/auth/route.ts',{modules:a.modules});
 const submit=async(body)=>{const r=await POST(new Request('https://herocon.store/api/account/auth',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email:'test@example.invalid',...body})}));return {status:r.status,data:await r.json()};};
 return {submit,calls};
}
test('signup requires eight characters and matching password before requesting confirmation',async()=>{
 const f=mockSignup();
 for(const [password,confirmPassword] of [['Example','Example'],['Example8','Different'],['Example8',undefined]]){
  const result=await f.submit({mode:'signup',password,confirmPassword});
  assert.equal(result.status,400);
 }
 assert.equal(f.calls.length,0);
 const result=await f.submit({mode:'signup',password:'Example8',confirmPassword:'Example8'});
 assert.equal(result.status,200);assert.equal(result.data.requiresConfirmation,true);
 assert.equal(f.calls.length,1);assert.match(f.calls[0].path,/^\/signup\?/);
 assert.equal(f.calls[0].body.password,'Example8');
 assert.equal(f.calls[0].body.confirmPassword,undefined);
});
test('signup email template contains numeric OTP and confirmation link fallback',()=>{
 const template=fs.readFileSync('supabase/email-templates/confirm-signup.html','utf8');
 assert.ok(template.includes('{{ .Token }}'));
 assert.ok(template.includes('{{ .TokenHash }}'));
});

function privateBlobFixture(){
 const records=new Map();
 return {records,adapter:{
 list:async({prefix,limit})=>({blobs:[...records.keys()].filter(k=>k.startsWith(prefix)).slice(0,limit).map(pathname=>({pathname,uploadedAt:new Date()}))}),
 get:async key=>records.has(key)?{statusCode:200,stream:new Response(records.get(key)).body}:null,
 put:async(key,value,options)=>{assert.equal(options.access,"private");if(records.has(key)&&options.allowOverwrite===false)throw Error("Exists");records.set(key,value);return {pathname:key};},
 del:async key=>{records.delete(key);}
 }};
}
test("introductory credits cannot be exceeded; refunds restore customer allowance but not spent provider capacity",async()=>{
 const b=privateBlobFixture(),q=load("lib/discovery-quota.ts",{modules:{"@vercel/blob":b.adapter,"@/lib/discovery-access-model":load("lib/discovery-access-model.ts")}}, {BLOB_READ_WRITE_TOKEN:"mock"});
 const r=await Promise.all(Array.from({length:4},()=>q.reserveDiscovery("u1","free@example.invalid","free")));
 assert.equal(r.filter(x=>x.status==="ok").length,3);
 assert.equal((await q.discoveryBalance("free@example.invalid","free")).remaining,0);
 await q.refundDiscovery(r.find(x=>x.status==="ok").credit);
 assert.equal((await q.discoveryBalance("free@example.invalid","free")).remaining,1);
 assert.equal([...b.records.keys()].filter(x=>x.includes("/shared/")).length,3);
 assert.equal((await q.reserveDiscovery("u2","other@example.invalid","trial")).status,"ok");
 assert.equal((await q.reserveDiscovery("u3","third@example.invalid","trial")).status,"ok");
 assert.equal((await q.reserveDiscovery("u4","fourth@example.invalid","trial")).status,"shared");
 assert.equal((await q.reserveDiscovery("paid","paid@example.invalid","premium")).status,"ok");
 assert.equal((await q.discoveryBalance("fourth@example.invalid","trial")).remaining,15);
});
test("saved-link allowance deduplicates simultaneous requests and enforces three monthly products",async()=>{
 const b=privateBlobFixture(),q=load("lib/free-link-trial.ts",{modules:{"@vercel/blob":b.adapter}});
 const results=await Promise.all(Array.from({length:4},()=>q.claimLinkTrial("u1","https://detail.1688.com/offer/12345.html")));
 assert.ok(results.every(Boolean));assert.equal(b.records.size,1);
 assert.equal(await q.claimLinkTrial("u1","https://detail.1688.com/offer/12346.html"),true);
 assert.equal(await q.claimLinkTrial("u1","https://detail.1688.com/offer/12347.html"),true);
 assert.equal(await q.claimLinkTrial("u1","https://detail.1688.com/offer/12348.html"),false);
 assert.equal(await q.claimLinkTrial("u2","https://detail.1688.com/offer/12348.html"),true);
});
test("saved sourcing products are account scoped and remain accessible without premium",async()=>{
 const b=privateBlobFixture(),links=load("lib/marketplace-links.ts"),model=load("lib/sourcing-workspace-model.ts",{modules:{"./marketplace-links":links}});
 let customer={id:"first"};const a=adapters({"@vercel/blob":b.adapter,"@/lib/customer-auth":{accountOriginValid:()=>true,currentCustomer:async()=>customer},"@/lib/marketplace-links":links,"@/lib/sourcing-workspace-model":model});
 const route=load("app/api/account/saved/route.ts",{modules:a.modules});
 const call=(body)=>route.POST(new Request("https://herocon.store/api/account/saved",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)}));
 const data={action:"save",url:"https://detail.1688.com/offer/12345.html",title:"Vase",path:"/product/a",price:4,currency:"GBP"};
 assert.equal((await call(data)).status,200);assert.equal((await call({...data,action:"folder",folder:"Home decor"})).status,200);
 assert.equal((await (await route.GET()).json()).items[0].folder,"Home decor");
 customer={id:"second"};assert.equal((await (await route.GET()).json()).items.length,0);
 assert.equal((await call({...data,action:"folder",folder:"Unauthorised"})).status,404);
 customer=null;assert.equal((await route.GET()).status,401);
});
test("live supplier detail is persisted and cache hit avoids another paid request",async()=>{
 const b=privateBlobFixture(),links=load("lib/marketplace-links.ts");let calls=0,saves=0,source=null,claims=0,refunds=0;
 const url="https://detail.1688.com/offer/12345.html",image="https://example.test/vase.jpg";
 const a=adapters({"@vercel/blob":b.adapter,"@/lib/customer-auth":{accountOriginValid:()=>true,currentCustomer:async()=>({id:"customer",email:"customer@example.invalid"})},"@/lib/membership-access":{membershipEntitlement:async()=>({premium:false,trialEndsAt:null})},"@/lib/owner-premium":{isOwnerPremiumCustomer:()=>false},"@/lib/discovery-access-model":load("lib/discovery-access-model.ts"),"@/lib/discovery-quota":{reserveDiscovery:async()=>{claims++;return {status:"ok",credit:"slot"}},refundDiscovery:async()=>{refunds++}},"@/lib/marketplace-links":links,"@/lib/cart-pricing":{domesticFromProduct:()=>null},"@/lib/discovered-products":{saveSupplierDiscovery:async()=>{saves++;return {status:"added",productId:"link-123"}}},"@/lib/catalogue-server":{getBaseProducts:async()=>[]},"@/lib/catalogue":{productId:x=>x.id},"@/lib/product-taxonomy":{classifyProduct:()=>"Home & Decor"},"@/lib/catalogue-editorial-exclusions":{excludedCatalogueListing:()=>false},"@/lib/marketplace-source-enrichment":{fromHiobuy:(raw,link)=>{assert.equal(raw.product.id,"12345");return {sourceUrl:link,title:"Vase",images:[image],variants:[],priceCNY:10,variantCompleteness:"complete"}},getSavedMarketplaceSource:async()=>source,saveMarketplaceSource:async value=>{source=value;}}});
 const route=load("app/api/hiobuy/discovery/route.ts",{modules:a.modules,fetch:async()=>{calls++;return Response.json({product:{id:"12345",channel:"1688",source_url:url,title:{translated:"Vase"},image,price:{display_amount:10},variants:[]}})}},{HIOBUY_API_KEY:"mock"});
 const request=()=>route.POST(new Request("https://herocon.store/api/hiobuy/discovery",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({action:"detail",channel:"1688",id:"12345"})}));
 const first=await request();assert.equal(first.status,200);assert.equal((await first.json()).catalogueSave.status,"added");assert.equal(source.title,"Vase");
 const second=await request();assert.equal(second.status,200);assert.equal((await second.json()).cacheStatus,"hit");assert.equal(calls,1);assert.equal(claims,1);assert.equal(refunds,0);assert.equal(saves,2);
});
