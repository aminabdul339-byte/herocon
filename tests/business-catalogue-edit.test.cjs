const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const moduleObj={exports:{}};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('lib/business-catalogue-edit.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{module:moduleObj,exports:moduleObj.exports});
const {BUSINESS_EDIT_IDS,leadWithBusinessEdit,restoreBusinessEditThumbnails}=moduleObj.exports;
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
