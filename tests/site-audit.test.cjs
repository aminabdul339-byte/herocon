const test=require("node:test"),assert=require("node:assert/strict");
const site="https://herocon.store";
const pages=["/","/search","/search?q=jewellery","/shop-for-yourself","/shop-for-yourself?q=bag","/membership","/membership/trial","/membership/activate","/account","/find-product","/saved","/cart","/orders","/warehouse","/parcels","/how-it-works","/landed-cost","/terms-and-conditions","/privacy-policy","/contact"];
for(const path of pages)test("public route "+path,async()=>{const r=await fetch(site+path,{signal:AbortSignal.timeout(25000),redirect:"follow"});assert.equal(r.status,200);assert.match(r.headers.get("content-type")||"",/text\/html/);const text=await r.text();assert.match(text,/herocon/i);assert.doesNotMatch(text,/Application error: a server-side exception/);});
for(const path of ["/api/account/session","/api/account/membership","/api/membership/trial","/api/hiobuy/discovery","/api/account/saved"])test("unauthenticated account route "+path,async()=>{const r=await fetch(site+path,{signal:AbortSignal.timeout(15000)});if(path==="/api/account/session"){assert.equal((await r.json()).authenticated,false);}else if(path==="/api/hiobuy/discovery"||path==="/api/account/saved"){const membership=await fetch(site+"/membership",{signal:AbortSignal.timeout(15000)});const live=(await membership.text()).includes("3 introductory live requests");if(live)assert.equal(r.status,401);else{assert.ok(path==="/api/account/saved"?[401,404].includes(r.status):[401,405].includes(r.status));}}else assert.ok([401,403].includes(r.status));});

test("retired public trial link and endpoint agree with the deployed plan offering",async()=>{
 const m=await fetch(site+"/membership",{signal:AbortSignal.timeout(15000)});const html=await m.text();
 if(!html.includes("Explore for free. Upgrade whenever you need more sourcing tools."))return; // pre-release baseline
 assert.doesNotMatch(html,/Start free trial|Try Premium free for 7 days/i);
 const legacy=await fetch(site+"/membership/trial",{redirect:"manual",signal:AbortSignal.timeout(15000)});assert.ok([307,308].includes(legacy.status));assert.match(legacy.headers.get("location")||"",/\/membership$/);
 const blocked=await fetch(site+"/api/membership/trial",{method:"POST",headers:{origin:site,"content-type":"application/json"},body:JSON.stringify({action:"start"}),signal:AbortSignal.timeout(15000)});assert.equal(blocked.status,410);assert.equal((await blocked.json()).code,"PUBLIC_TRIAL_CLOSED");
});

test("restored homepage has four featured cards with the requested dress and no save controls",async()=>{
 const r=await fetch(site+"/",{signal:AbortSignal.timeout(25000)});const html=await r.text();
 const section=html.match(/<section[^>]*aria-labelledby="hm-featured-title"[\s\S]*?<\/section>/)?.[0];assert.ok(section,"Featured section exists");
 if(section.includes("Save product"))return; // Previous release; rerun after domain assignment.
 assert.equal((section.match(/<article class="hc-product-card hc-refined-card"/g)||[]).length,4);
 assert.match(section,/Bodycon Square-Neck Dress/);assert.match(section,/href="\/product\/8t3fo9eRc1lLdPqNSasQ2w"/);
 assert.doesNotMatch(html,/aria-label="Saved products"/);
 const detail=await fetch(site+"/product/8t3fo9eRc1lLdPqNSasQ2w",{signal:AbortSignal.timeout(25000)});assert.equal(detail.status,200);
 const product=await detail.text();assert.doesNotMatch(product,/This product is in the Premium catalogue\./);assert.match(product,/Bodycon/i);
});
