const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const moduleObj={exports:{}};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('lib/personal-shop-edit.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{module:moduleObj,exports:moduleObj.exports});
const {mixPersonalEdit}=moduleObj.exports;
const products=JSON.parse(fs.readFileSync('data/shop-personal-merged.json','utf8'));
const accepted=new Set(['Bags','Shoes','Sunglasses','Clothing','Accessories','Watches','Jewellery']);
function audience(gender){
 const seenLinks=new Set(),seenImages=new Set();
 return products.filter(p=>{
  if(!accepted.has(p.category)||!p.originalUrl||!p.imageUrl||seenLinks.has(p.originalUrl)||seenImages.has(p.imageUrl))return false;
  seenLinks.add(p.originalUrl);seenImages.add(p.imageUrl);
  return (p.gender===gender||p.gender==='unisex')&&(gender!=='women'||p.category!=='Clothing');
 });
}
test('women start with six rounds of bags, sunglasses, jewellery and shoes',()=>{
 const input=audience('women'),result=mixPersonalEdit(input,'women');
 assert.deepEqual(Array.from(result.slice(0,24),p=>p.category),Array.from({length:6},()=>['Bags','Sunglasses','Jewellery','Shoes']).flat());
 assert.equal(result.length,input.length);
 assert.equal(new Set(result).size,input.length);
 assert.ok(input.every(p=>result.includes(p)));
});
test('men start with bottoms, shoes, tops and accessories',()=>{
 const input=audience('men'),result=mixPersonalEdit(input,'men');
 for(let i=0;i<24;i+=4){
  assert.equal(result[i].category,'Clothing');
  assert.match(result[i].name,/\b(?:jeans?|trousers?|pants?|shorts?|joggers?|sweatpants?|track[\s-]?pants?|cargos?|bottoms?|chinos?)\b/i);
  assert.equal(result[i+1].category,'Shoes');
  assert.equal(result[i+2].category,'Clothing');
  assert.match(result[i+2].name,/\b(?:t[\s-]?shirts?|tees?|shirts?|polos?|hoodies?|sweatshirts?|sweaters?|jumpers?|knitwear|cardigans?|vests?|tank tops?|tops?)\b/i);
  assert.equal(result[i+3].category,'Accessories');
 }
 assert.equal(result.length,input.length);
 assert.equal(new Set(result).size,input.length);
 assert.ok(input.every(p=>result.includes(p)));
});
test('small or missing categories do not drop products',()=>{
 const input=[{name:'A bag',category:'Bags'},{name:'A watch',category:'Watches'},{name:'A shoe',category:'Shoes'}];
 assert.deepEqual(Array.from(mixPersonalEdit(input,'women')),input.filter(p=>p.category!=='Watches').concat(input[1]));
});
