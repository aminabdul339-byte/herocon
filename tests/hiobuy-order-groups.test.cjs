const test=require("node:test");const assert=require("node:assert/strict");
const {groupProcurementLines,extractCreatedOrderIds}=require("../lib/hiobuy-order-groups.ts");
const line=(channel,sellerId,offerId="a",skuId="s",quantity=1)=>({channel,sellerId,offerId,skuId,quantity});
test("groups by marketplace and verified seller, not seller name",()=>{const groups=groupProcurementLines([line("1688","1"),line("1688","1","b"),line("1688","2"),line("taobao","1")]);assert.equal(groups.length,3);assert.equal(groups[0].lines.length,2);});
test("merges exact duplicate sku quantities",()=>{assert.equal(groupProcurementLines([line("1688","1"),line("1688","1")])[0].lines[0].quantity,2);});
test("rejects missing seller and invalid quantity",()=>{assert.throws(()=>groupProcurementLines([line("1688","")]));assert.throws(()=>groupProcurementLines([line("1688","1","a","s",0)]));});
test("preserves all returned order IDs including partial creates",()=>{assert.deepEqual(extractCreatedOrderIds({order_id:"A",order_list:[{order_id:"A"},{order_id:"B"},{order_id:"C"}],failed_offers:[{}]}),["A","B","C"]);});
