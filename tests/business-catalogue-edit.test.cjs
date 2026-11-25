const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const moduleObj={exports:{}};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('lib/business-catalogue-edit.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{module:moduleObj,exports:moduleObj.exports});
const {BUSINESS_EDIT_IDS,leadWithBusinessEdit,mixBusinessCatalogue,restoreBusinessEditThumbnails}=moduleObj.exports;
const make=(id,title,category)=>({doppelProductId:id,title,category,imageUrl:'https://example.com/'+id+'.jpg',originalMarketplaceUrl:'https://detail.1688.com/offer/123.html',priceGBP:2.72});
test('all nine actual catalogue products exist with photographs and source links',()=>{
 const files=['herocon-current-catalogue.json','herocon-verified-marketplace-links.json','herocon-wigs-20261118.json'];
 const all=files.flatMap(file=>{const data=JSON.parse(fs.readFileSync('public/'+file,'utf8'));return Array.isArray(data)?data:data.products;});
 for(const id of BUSINESS_EDIT_IDS){const p=all.find(p=>p.doppelProductId===id);assert.ok(p&&p.imageUrl&&p.originalMarketplaceUrl,id);}
});
test('selected products lead, followed by similar products, without dropping any listings',()=>{
 const exact=Array.from(BUSINESS_EDIT_IDS,id=>make(id,'Selected item','Other'));
 const wig=make('wig','Curly front lace wig','Wigs & Hair Extensions'),decor=make('decor','Decorative sculpture','Home & Decor'),ring=make('ring','Moissanite engagement ring','Jewellery'),other=make('other','Cotton tee','Tops');
 const input=[other,ring,decor,wig,...exact.slice().reverse()];
 const actual=leadWithBusinessEdit(input);
 assert.deepEqual(Array.from(actual,p=>p.doppelProductId),[...BUSINESS_EDIT_IDS,'wig','decor','ring','other']);
 assert.equal(actual.length,input.length);
 assert.equal(new Set(actual).size,input.length);
 assert.equal(actual[0],exact[0]);
});
test('selected original photo stays first without discarding enriched photos',()=>{
 const original=make(BUSINESS_EDIT_IDS[0],'Wig','Wigs & Hair Extensions');
 const enriched={...original,imageUrl:'https://example.com/new.jpg',images:['https://example.com/extra.jpg']};
 const result=restoreBusinessEditThumbnails([enriched],[original])[0];
 assert.equal(result.imageUrl,original.imageUrl);
 assert.ok(result.images.includes(enriched.imageUrl));
 assert.equal(result.priceGBP,original.priceGBP);
});

test('every later page mixes business categories with no missing or repeated products',()=>{
 const categories=['Flowers & Gifts','Jewellery','Nails & Nail Supplies','Hair Accessories','Home & Decor','Bags','Tops','Wigs & Hair Extensions'];
 const exact=Array.from(BUSINESS_EDIT_IDS,id=>make(id,'Selected item','Other'));
 const input=[...exact,...categories.flatMap((category,i)=>Array.from({length:80},(_,j)=>make('p-'+i+'-'+j,category+' product '+j,category)))];
 const actual=mixBusinessCatalogue(input,24);
 assert.equal(actual.length,input.length);
 assert.equal(new Set(actual).size,input.length);
 assert.deepEqual(Array.from(actual.slice(0,9),p=>p.doppelProductId),Array.from(BUSINESS_EDIT_IDS));
 assert.deepEqual(Array.from(actual,p=>p.doppelProductId),Array.from(mixBusinessCatalogue(input,24),p=>p.doppelProductId));
 for(let page=1;page<10;page++){
  const chunk=actual.slice(page*24,(page+1)*24);
  const counts=new Map();for(const p of chunk)counts.set(p.category,(counts.get(p.category)||0)+1);
  assert.ok(counts.size>=6,'page '+(page+1));
  assert.ok(Math.max(...counts.values())<=4,'page '+(page+1));
 }
});
test('handles depleted categories and a partial final page without dropping stock',()=>{
 const input=Array.from({length:83},(_,i)=>make('only-'+i,'Cotton tee',i<80?'Tops':'Bags'));
 const result=mixBusinessCatalogue(input,24);
 assert.equal(result.length,input.length);
 assert.equal(new Set(result).size,input.length);
});
