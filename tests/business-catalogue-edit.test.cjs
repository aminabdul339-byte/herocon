const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const moduleObj={exports:{}};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('lib/business-catalogue-edit.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{module:moduleObj,exports:moduleObj.exports});
const {BUSINESS_EDIT_IDS,BUSINESS_PAGE_ONE_REPLACEMENTS,BUSINESS_PAGE_ONE_ORDER,leadWithBusinessEdit,mixBusinessCatalogue,restoreBusinessEditThumbnails}=moduleObj.exports;
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
 assert.deepEqual(Array.from(actual.slice(0,9),p=>p.doppelProductId),Array.from(BUSINESS_PAGE_ONE_ORDER).filter(id=>BUSINESS_EDIT_IDS.includes(id)));
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

test('the three requested page-one swaps preserve all other cards and inventory',()=>{
 const exact=Array.from(BUSINESS_EDIT_IDS,id=>make(id,'Selected item','Other'));
 const old=[make(BUSINESS_PAGE_ONE_REPLACEMENTS[0][0],'Curly lace wig','Wigs & Hair Extensions'),make(BUSINESS_PAGE_ONE_REPLACEMENTS[1][0],'Decorative figurine','Home & Decor'),make(BUSINESS_PAGE_ONE_REPLACEMENTS[2][0],'Diamond ring','Jewellery')];
 const replacements=BUSINESS_PAGE_ONE_REPLACEMENTS.map(([,id],i)=>make(id,i===2?'Nordic minimalist bedside lamp':'Gift bouquet',i===2?'Lighting':'Flowers & Gifts'));
 const remainder=Array.from({length:20},(_,i)=>make('rest-'+i,'Cotton tee','Tops'));
 const input=[...exact,...old,...remainder,...replacements];
 const result=mixBusinessCatalogue(input,24);
 const availablePinned=Array.from(BUSINESS_PAGE_ONE_ORDER).filter(id=>input.some(p=>p.doppelProductId===id));
 assert.deepEqual(Array.from(result.slice(0,availablePinned.length),p=>p.doppelProductId),availablePinned);
 for(const replacement of replacements)assert.ok(result.indexOf(replacement)<24);
 assert.equal(result.length,input.length);assert.equal(new Set(result).size,input.length);
 for(const item of old)assert.ok(result.indexOf(item)>=24);
});

test('the live first-page edit is the same 24 products in a new stable order',()=>{
 const pinned=Array.from(BUSINESS_PAGE_ONE_ORDER,id=>make(id,'Curated product','Other'));
 const input=[...Array.from({length:30},(_,i)=>make('extra-'+i,'Cotton tee','Tops')),...pinned.slice().reverse()];
 const result=mixBusinessCatalogue(input,24);
 assert.deepEqual(Array.from(result.slice(0,24),p=>p.doppelProductId),Array.from(BUSINESS_PAGE_ONE_ORDER));
 assert.equal(result.length,input.length);
 assert.equal(new Set(result).size,input.length);
 assert.ok(result.slice(24).every(p=>p.doppelProductId.startsWith('extra-')));
});

test('homepage dress is a real public catalogue listing and is independently selected even when defaults contain only three products',()=>{
 const data=JSON.parse(fs.readFileSync('public/herocon-verified-marketplace-links.json','utf8'));
 const products=Array.isArray(data)?data:data.products;
 const dress=products.find(p=>p.doppelProductId==='8t3fo9eRc1lLdPqNSasQ2w');
 assert.ok(dress?.imageUrl&&dress?.originalMarketplaceUrl);
 assert.match(dress.title,/square neck bodycon dress/i);
 const page=fs.readFileSync('app/page.tsx','utf8');
 assert.match(page,/const dress=all\.find\(p=>productId\(p\)==="8t3fo9eRc1lLdPqNSasQ2w"/);
 assert.match(page,/\.\.\.\(dress\?\[dress\]:defaults\.slice\(3,4\)\)/);
 assert.match(fs.readFileSync('lib/catalogue-access-model.ts','utf8'),/8t3fo9eRc1lLdPqNSasQ2w/);
});
test('save product controls and saved navigation are not rendered in catalogue or account views',()=>{
 for(const path of ['components/ProductCard.tsx','components/ProductExperience.tsx','components/HiobuyDiscovery.tsx','components/Header.tsx','app/account/page.tsx']){
  const source=fs.readFileSync(path,'utf8');assert.doesNotMatch(source,/<SaveFind|href="\/saved"/,path);
 }
});

test("founder-selected abstract decor replaces glassware in homepage hero only, and hair category uses the selected image",()=>{
 const hero=fs.readFileSync("components/AtelierHero.tsx","utf8");
 assert.match(hero,/id:"j2R9wzAx7bv39GGzSRkj3Q",title:"Silent Wind Abstract Art",marketplace:"1688"/);
 assert.doesNotMatch(hero,/Gold-accent glassware/);
 for(const id of ["YjXAnN1cosMO1iGVWJw5FA","HEWCWVJ5M7RL3Y-J_uV0bg","qLiCZEEhOnut6fHdkH-Bow"])assert.ok(hero.includes(id));
 const raw=JSON.parse(fs.readFileSync("public/herocon-verified-marketplace-links.json","utf8"));const item=(Array.isArray(raw)?raw:raw.products).find(p=>p.doppelProductId==="j2R9wzAx7bv39GGzSRkj3Q");
 assert.ok(item?.imageUrl&&item.originalMarketplaceUrl);
 assert.match(fs.readFileSync("lib/catalogue-access-model.ts","utf8"),/j2R9wzAx7bv39GGzSRkj3Q/);
 assert.match(fs.readFileSync("app/search/page.tsx","utf8"),/category==="Wigs & Hair Extensions"\?"\/editorial-wigs-hair.webp":item.imageUrl/);
 const photo=fs.readFileSync("public/editorial-wigs-hair.webp");assert.equal(photo.toString("ascii",0,4),"RIFF");assert.equal(photo.toString("ascii",8,12),"WEBP");
});

const titleModule={exports:{}};
vm.runInNewContext(ts.transpileModule(fs.readFileSync("lib/product-title.ts","utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{module:titleModule,exports:titleModule.exports,require:name=>{if(name==="./emoji-free")return {withoutEmoji:s=>s};throw Error(name);}});
const conciseTitle=titleModule.exports.conciseProductTitle;
test("bouquets preserve verified thumbnail colour and flower variety",()=>{
 const p={title:"Graduation knitted yarn flower bouquet",category:"Flowers & Gifts",imageUrl:"https://example.com/yellow.jpg",titleHints:{variety:"Tulip",colours:[{value:"Yellow",image:"https://example.com/yellow.jpg"},{value:"Red",image:"https://example.com/red.jpg"}]}};
 assert.equal(conciseTitle(p),"Yellow Crochet Tulip Bouquet");
 assert.equal(conciseTitle({...p,imageUrl:"https://example.com/red.jpg"}),"Red Crochet Tulip Bouquet");
 assert.equal(conciseTitle({...p,imageUrl:"https://example.com/unknown.jpg"}),"Crochet Tulip Bouquet");
 assert.equal(conciseTitle({title:"Handmade crochet sunflower bouquet",category:"Flowers & Gifts"}),"Crochet Sunflower Bouquet");
 assert.equal(conciseTitle({title:"Pink knitted rose bouquet",category:"Flowers & Gifts"}),"Pink Crochet Rose Bouquet");
 assert.equal(conciseTitle({title:"Blue cotton shirt",category:"Tops"}),"Blue Cotton Shirt");
});

test("duplicate card grouping preserves source links and separates title-only matches",()=>{
 const load=(file,modules)=>{const mod={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{module:mod,exports:mod.exports,URL,require:n=>{if(n in modules)return modules[n];throw Error(n)}});return mod.exports;};
 const links=load("lib/marketplace-links.ts",{}),dups=load("lib/catalogue-duplicates.ts",{"./marketplace-links":links,"./business-catalogue-edit":{BUSINESS_PAGE_ONE_ORDER:[]},"./catalogue-access-model":{featuredPreviewIds:[]}});
 const a={id:"a",title:"Handmade Crochet Bouquet",category:"Flowers & Gifts",url:"https://detail.1688.com/offer/12345.html",image:"https://img.alicdn.com/img/O1CN123!!1.jpg_720x720q70.jpg_.webp",priceGBP:2};
 const b={...a,id:"b",url:"https://detail.1688.com/offer/12346.html",image:"https://cbu01.alicdn.com/img/O1CN123!!1.jpg",priceGBP:1};
 const c={...a,id:"c",url:"https://detail.1688.com/offer/12347.html",image:"https://cbu01.alicdn.com/img/O1CN456!!1.jpg"};
 const result=dups.auditDuplicateCards([a,b,c]);assert.equal(result.total,3);assert.equal(result.suppressed.size,1);assert.ok(result.suppressed.has("a"));assert.equal(result.duplicateGroups[0].keep.id,"b");assert.equal(result.titleReview.length,1);
 assert.notEqual(dups.photoIdentity("https://drive.google.com/thumbnail?id=one"),dups.photoIdentity("https://drive.google.com/thumbnail?id=two"));
 const ring=dups.auditDuplicateCards([{...a,id:"DgoQWJ3vpr7IwjtVXqAyKA",priceGBP:.34},{...b,id:"OpohXCbwOZlcaz5oQkeBCQ",priceGBP:.23},{...c,id:"yXvk725eTqDy7uIaBMAuUQ",priceGBP:.23}]);assert.equal(ring.suppressed.size,2);assert.equal(ring.duplicateGroups[0].keep.priceGBP,.23);
});
