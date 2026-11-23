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
  '@/lib/buckydrop-cache':{getSavedBuckydropProduct:async()=>{calls++;return null;}},
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
  HEROCON_BUCKYDROP_PREPAID_WALLET_CONFIRMED:'true',
  HEROCON_ALLOW_PREFUNDED_AUTO_SUPPLIER_RELEASE:'true',
  HEROCON_WALLET_TOPUP_RELEASE_WORKFLOW_APPROVED:'true'
 });
 assert.equal(b.checkoutLaunchReadiness('all_in').enabled,true);
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
  '@/lib/owner-premium':{isOwnerPremiumCustomer:()=>false},
  '@/lib/checkout-origin':{checkoutOriginFor:()=>null}
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


test('owner automatic checkout uses a saved BuckyDrop SKU without a new paid product lookup',async()=>{
 const economics=load('lib/order-economics.ts');
 let reads=0;
 const {computeOwnerAutoPrice}=load('lib/owner-auto-price.ts',{modules:{
  '@/lib/catalogue-server':{getProducts:async()=>[{doppelProductId:'example123',originalMarketplaceUrl:'https://detail.1688.com/offer/123456.html'}]},
  '@/lib/catalogue':{productId:p=>p.doppelProductId},
  '@/lib/personal-shop':{findPersonalProduct:()=>null},
  '@/lib/buckydrop-cache':{getSavedBuckydropProduct:async()=>{reads++;return {
   environment:'live',spuCode:'spu123',available:true,moq:1,
   snapshotSavedAt:new Date().toISOString(),
   title:'Test SKU',variants:[{skuCode:'skuA',title:'Gold',price:15.2,stock:20}]
  };}},
  '@/lib/marketplace-links':{normalizeMarketplaceLink:x=>x},
  '@/lib/order-economics':economics
 }},{
  BLOB_READ_WRITE_TOKEN:'token',
  HEROCON_OWNER_AUTOBUY_PRICING_APPROVED:'true',
  HEROCON_OWNER_PILOT_SHIPPING_BUDGET_APPROVED:'true',
  HEROCON_OWNER_PILOT_FX_GBP_PER_CNY:'0.13',
  HEROCON_OWNER_PILOT_SHIPPING_GBP:'6.50',
  HEROCON_OWNER_PILOT_BUCKYDROP_FEES_GBP:'1.50',
  HEROCON_OWNER_PILOT_WALLET_FEES_GBP:'0.30',
  HEROCON_OWNER_PILOT_SHIPPING_BUFFER_GBP:'2.00',
  HEROCON_OWNER_PILOT_TAX_DUTIES_GBP:'0.00'
 });
 const out=await computeOwnerAutoPrice({productId:'example123',skuCode:'skuA',quantity:1});
 assert.equal(reads,1);
 assert.equal(out.supplierPriceCNY,15.2);
 assert.equal(out.shippingPence,650);
 assert.equal(out.serviceFeePence,99);
 assert.equal(out.economics.priceApproved,true);
 assert.ok(out.economics.projectedProfitPence>=200);
 assert.equal(out.productSubtotalPence+out.shippingPence+out.taxPence+99,out.totalPence);
 assert.equal(out.totalPence<=10000,true);
});

test('owner automatic checkout fails closed when wallet/shipping budgets are missing',async()=>{
 const economic=load('lib/order-economics.ts');
 let reads=0;
 const {computeOwnerAutoPrice}=load('lib/owner-auto-price.ts',{modules:{
  '@/lib/catalogue-server':{getProducts:async()=>{reads++;return [];}},
  '@/lib/catalogue':{productId:()=>''},
  '@/lib/personal-shop':{findPersonalProduct:()=>null},
  '@/lib/buckydrop-cache':{getSavedBuckydropProduct:async()=>null},
  '@/lib/marketplace-links':{normalizeMarketplaceLink:x=>x},
  '@/lib/order-economics':economic
 }},{
  BLOB_READ_WRITE_TOKEN:'token',
  HEROCON_OWNER_AUTOBUY_PRICING_APPROVED:''
 });
 await assert.rejects(computeOwnerAutoPrice({productId:'example123',skuCode:'skuA',quantity:1}),{status:503});
 assert.equal(reads,0);
});

test('an unverified prepaid wallet never unlocks the all-in Stripe checkout',()=>{
 const {checkoutLaunchReadiness}=load('lib/live-checkout.ts',{},{
  HEROCON_STRIPE_LIVE_CHECKOUT_ENABLED:'true',
  HEROCON_ONE_PAYMENT_LIVE_APPROVED:'true',
  HEROCON_OWNER_AUTOBUY_PRICING_APPROVED:'true',
  HEROCON_BUCKYDROP_AUTO_FULFILMENT_CONFIRMED:'true',
  HEROCON_ALLOW_PREFUNDED_AUTO_SUPPLIER_RELEASE:'true',
  HEROCON_BUCKYDROP_PREPAID_WALLET_CONFIRMED:'false'
 });
 const result=checkoutLaunchReadiness('all_in');
 assert.equal(result.enabled,false);
 assert.ok(result.missing.some(m=>m.includes('wallet')));
});


test('Stripe checkout return URL cannot point to an arbitrary host or an unapproved preview',()=>{
 const {checkoutOriginFor:prod}=load('lib/checkout-origin.ts',{},{
  VERCEL_ENV:'production',
  VERCEL_URL:'herocon-ecommerce-test.vercel.app',
  HEROCON_ALLOW_PREVIEW_OWNER_PAYMENT:'false'
 });
 assert.equal(prod('https://herocon.store/api/checkout/start-session'),'https://herocon.store');
 assert.equal(prod('https://herocon-ecommerce-test.vercel.app/api/checkout/start-session'),null);
 assert.equal(prod('https://evil.example/api/checkout/start-session'),null);
 const {checkoutOriginFor:preview}=load('lib/checkout-origin.ts',{},{
  VERCEL_ENV:'preview',VERCEL_URL:'herocon-ecommerce-test.vercel.app',
  HEROCON_ALLOW_PREVIEW_OWNER_PAYMENT:'true'
 });
 assert.equal(preview('https://herocon-ecommerce-test.vercel.app/api/checkout/start-session'),
  'https://herocon-ecommerce-test.vercel.app');
 assert.equal(preview('https://other.vercel.app/api/checkout/start-session'),null);
});
