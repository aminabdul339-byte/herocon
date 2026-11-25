const test=require("node:test");const assert=require("node:assert/strict");
// Node 22+ type stripping supports the pure TypeScript pricing module.
const {productTotal,canPayShipping}=require("../lib/hiobuy-pricing.ts");
test("7 percent charged once; domestic freight excluded from fee",()=>{assert.deepEqual(productTotal(20000,2000,.1),{merchandisePence:2000,domesticPence:200,procurementPence:140,totalPence:2340});});
test("rejects absent or negative pricing",()=>{assert.throws(()=>productTotal(0,0,.1));assert.throws(()=>productTotal(100,-1,.1));});
test("requires packed unpaid shipment and valid final freight",()=>{assert.equal(canPayShipping("WAIT_PAYMENT","UNPAID",true,1200),true);assert.equal(canPayShipping("PENDING","UNPAID",false,1200),false);assert.equal(canPayShipping("WAIT_PAYMENT","PAID",true,1200),false);});
