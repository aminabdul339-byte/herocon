import test from "node:test";
import assert from "node:assert/strict";
import {normalise1688,normaliseTaobao,unwrapCliJson} from "../scripts/opencli-enrich.mjs";

const source="https://detail.1688.com/offer/887904326744.html";
const input={url:source,id:"887904326744",imageUrl:"https://img.example.com/catalogue.jpg"};
test("OpenCLI JSON output handles structured envelope",()=>{
 const parsed=unwrapCliJson(JSON.stringify({ok:true,data:[{offer_id:"887904326744"}]}));
 assert.equal(parsed[0].offer_id,"887904326744");
});
test("1688 product extracts public seller, CNY price tiers, and gallery without guessing variants",()=>{
 const item={
  offer_id:"887904326744",title:"Cotton jacket",seller_name:"Example supplier",
  price_text:"¥96.00-98.00",
  main_images:["https://img.example.com/first.jpg"],
  price_tiers:[{quantity_min:3,price:98,currency:"CNY"},{quantity_min:20,price:95,currency:"CNY"}],
  moq_value:3,visible_attributes:[{key:"Fabric",value:"Cotton"}]
 };
 const a=normalise1688(item,input,{main_images:["https://img.example.com/extra.jpg"],
  detail_images:["https://img.example.com/detail.jpg"],sku_images:[]});
 assert.equal(a.sourceProductId,"887904326744");
 assert.equal(a.priceCNY,98);
 assert.equal(a.moq,3);
 assert.equal(a.sellerName,"Example supplier");
 assert.equal(a.images.length,3);
 assert.equal(a.detailImages.length,1);
 assert.deepEqual(a.sourceSpecs,[{name:"Fabric",value:"Cotton"}]);
 assert.equal(Object.hasOwn(a,"variants"),false);
});
test("1688 product ID mismatch is rejected",()=>{
 assert.throws(()=>normalise1688({offer_id:"999999999",title:"Jacket",main_images:["https://x.example/a.jpg"]},input,null),/product ID/);
});
test("Taobao detail reads only fields supplied and reuses existing catalogue photo",()=>{
 const q={url:"https://item.taobao.com/item.htm?id=827563850178",id:"827563850178",imageUrl:"https://img.example.com/old.jpg"};
 const parsed=normaliseTaobao([
  {field:"商品名称",value:"Cotton shirt"},
  {field:"价格",value:"¥39.90"},
  {field:"店铺",value:"A fashion shop"},
  {field:"ID",value:"827563850178"}
 ],q);
 assert.equal(parsed.title,"Cotton shirt");
 assert.equal(parsed.priceCNY,39.90);
 assert.deepEqual(parsed.images,["https://img.example.com/old.jpg"]);
 assert.deepEqual(parsed.priceTiers,[]);
});
test("Taobao mismatched product ID is not imported",()=>{
 const q={url:"https://item.taobao.com/item.htm?id=827563850178",id:"827563850178",imageUrl:"https://img.example.com/old.jpg"};
 assert.throws(()=>normaliseTaobao([{field:"ID",value:"888888888"},{field:"商品名称",value:"Wrong"}],q),/different product/);
});
test("OpenCLI authentication failure is never treated as product content",()=>{
 assert.throws(()=>unwrapCliJson(JSON.stringify({ok:false,error:{code:"AUTH_REQUIRED",message:"Login required"}})),/Login required/);
});
