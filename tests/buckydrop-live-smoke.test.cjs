const test=require('node:test');
const assert=require('node:assert/strict');
// Safe production smoke tests: no secret headers, no valid order payloads and
// no requests capable of creating orders or triggering billable BuckyDrop lookups.
const SITE='https://herocon.store';
async function post(path,body,origin=SITE){
 const response=await fetch(SITE+path,{method:'POST',headers:{'content-type':'application/json',origin},
  body:JSON.stringify(body),redirect:'follow',signal:AbortSignal.timeout(15000)});
 const data=await response.json();
 return {status:response.status,data};
}
test('live site rejects unauthenticated supplier order submissions',async()=>{
 const r=await post('/api/buckydrop/orders/submit',{});
 assert.ok([401,503].includes(r.status),JSON.stringify(r));
 assert.match(String(r.data.error),/not authorized|not enabled/i);
});
test('live BuckyDrop product route rejects unsupported source before any lookup',async()=>{
 const r=await post('/api/buckydrop/lookup',{url:'https://invalid.example/item/123'});
 assert.equal(r.status,400,JSON.stringify(r));
 assert.match(String(r.data.error),/1688|unsupported|product URL/i);
});
test('live shipping quote denies foreign origins before any provider request',async()=>{
 const r=await post('/api/buckydrop/shipping-quote',{},'https://invalid.example');
 assert.equal(r.status,403,JSON.stringify(r));
 assert.match(String(r.data.error),/Herocon|origin/i);
});
