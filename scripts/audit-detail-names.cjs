const fs=require("node:fs"),path=require("node:path"),ts=require("typescript"),crypto=require("node:crypto");
const out=path.join(process.cwd(),"data/catalogue-detail-names.json");
const empty={version:1,summary:{},business:{},personal:{}};
if(process.env.VERCEL_ENV!=="production"){console.log("[name-audit] production-only saved-source scan skipped");process.exit(0);}
if(!process.env.BLOB_READ_WRITE_TOKEN){console.log("[name-audit] storage unavailable; no full audit claimed");process.exit(0);}
const modCache=new Map();
function load(file){const p=path.resolve(file);if(modCache.has(p))return modCache.get(p).exports;const m={exports:{}};modCache.set(p,m);const js=ts.transpileModule(fs.readFileSync(p,"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;new Function("module","exports","require",js)(m,m.exports,n=>n.startsWith(".")?load(path.resolve(path.dirname(p),n+".ts")):require(n));return m.exports;}
const {conciseProductTitle}=load("lib/product-title.ts"),{originalListingEvidence}=load("lib/detail-title.ts"),{normalizeMarketplaceLink}=load("lib/marketplace-links.ts"),{classifyProduct,isModestFashion}=load("lib/product-taxonomy.ts"),{CATEGORY_OVERRIDES}=load("lib/category-overrides.ts"),{excludedCatalogueListing}=load("lib/catalogue-editorial-exclusions.ts");
const hash=s=>crypto.createHash("sha256").update(s).digest("hex");
const rows=filename=>{const x=JSON.parse(fs.readFileSync(filename,"utf8"));return Array.isArray(x)?x:x.products||[]};
const {get,list,put}=require("@vercel/blob");
const read=async pathname=>{const r=await get(pathname,{access:"private"});if(!r||r.statusCode!==200||!r.stream)return null;const raw=await new Response(r.stream).text();if(Buffer.byteLength(raw)>16*1024*1024)throw Error("snapshot too large");return JSON.parse(raw);};
async function index(prefix){const map=new Map();let cursor;do{const r=await list({prefix,limit:1000,cursor});for(const b of r.blobs)map.set(b.pathname.slice(prefix.length).replace(/\.json$/,""),b);cursor=r.hasMore?r.cursor:undefined;}while(cursor);return map;}
const prefixes=["catalogue/source-enrichment/v2/","catalogue/source-enrichment/v1/","catalogue/buckydrop-snapshots/v2/","catalogue/buckydrop-snapshots/v1/"];
const cachePath="catalogue/detail-name-index/v3/names.json";
async function main(){
 const [maps,discovered,prior]=await Promise.all([Promise.all(prefixes.map(index)),index("catalogue/discovered/v1/"),read(cachePath).catch(()=>null)]);
 const business=new Map(),personal=new Map();
 for(const f of ["public/herocon-current-catalogue.json","public/herocon-verified-marketplace-links.json","public/herocon-wigs-20261118.json","public/herocon-nails-20261118.json","public/herocon-makeup-brushes-20261119.json"]){for(const p of rows(f)){const id=p.doppelProductId||p.canonicalId?.replace(/^doppel:/,"");if(id)business.set(id,{...business.get(id),...p});}}
 let discoveredRead=0,discoveredFailed=0;
 const direct=new Set([...business.values()].map(p=>normalizeMarketplaceLink(p.originalMarketplaceUrl||p.marketplaceUrl||p.directLink)).filter(Boolean));
 const db=[...discovered.values()];for(let i=0;i<db.length;i+=12){await Promise.all(db.slice(i,i+12).map(async b=>{try{const p=await read(b.pathname);if(!p||!p.doppelProductId||!p.title){discoveredFailed++;return;}discoveredRead++;const link=normalizeMarketplaceLink(p.originalMarketplaceUrl);if(link&&!direct.has(link))business.set(p.doppelProductId,p);}catch{discoveredFailed++;}}));}
 const entries=[];
 for(const [id,p] of business){const url=normalizeMarketplaceLink(p.originalMarketplaceUrl||p.marketplaceUrl||p.directLink||p.originalMarketplaceUrls?.[0]);if(!url||excludedCatalogueListing(url,p.title,p.originalTitle))continue;const category=isModestFashion([p.title,p.originalTitle].filter(Boolean).join(" "),p.sellerName)?"Modest Fashion":CATEGORY_OVERRIDES[id]||classifyProduct(p.title,p.category);entries.push({collection:"business",id,url,p:{...p,title:p.title||p.originalTitle||"Product",category,originalMarketplaceUrl:url}});}
 const seenLinks=new Set(),seenImages=new Set();for(const p of rows("data/shop-personal-merged.json")){const url=normalizeMarketplaceLink(p.originalUrl);if(!url||!p.imageUrl||!p.name||!["Bags","Shoes","Sunglasses","Clothing","Accessories","Watches","Jewellery"].includes(p.category)||excludedCatalogueListing(url,p.name)||seenLinks.has(url)||seenImages.has(p.imageUrl))continue;seenLinks.add(url);seenImages.add(p.imageUrl);entries.push({collection:"personal",id:p.id,url,p:{doppelProductId:p.id,title:p.name,category:p.category,imageUrl:p.imageUrl,originalMarketplaceUrl:url}});}
 const result={version:1,summary:{total:entries.length,scanned:0,savedDetails:0,noSavedDetails:0,failed:0,changed:0,reused:0,discoveredRead,discoveredFailed,variantEvidence:0,descriptionEvidence:0,specEvidence:0,photoEvidence:0,examples:[]},business:{},personal:{}};
 const grouped=new Map();for(const row of entries){const k=hash(row.url);if(!grouped.has(k))grouped.set(k,[]);grouped.get(k).push(row);}
 const groups=[...grouped.entries()];const started=Date.now();
 for(let i=0;i<groups.length;i+=16){
  if(Date.now()-started>260000){console.log("[name-audit] scan time budget reached");break;}
  await Promise.all(groups.slice(i,i+16).map(async ([key,items])=>{
   const sources=maps.map(m=>m.get(key)).filter(Boolean),sig=sources.map(x=>x.pathname+":"+x.uploadedAt).join("|");
   const input=items.map(r=>hash(JSON.stringify([r.url,r.p.title,r.p.originalTitle,r.p.category,r.p.imageUrl,r.p.variants,r.p.sourceSpecs,r.p.descriptionText])));const old=items.map((r,j)=>prior?.version===1?prior[r.collection]?.[r.id]:null);
   const allCached=old.every((v,j)=>v&&v.sig===sig&&v.input===input[j]&&v.status!=="failed");
   let e=null,failed=false;
   if(!allCached&&sources.length){
    for(const b of sources){try{const raw=await read(b.pathname);if(b.pathname.includes("source-enrichment/")&&raw?.sourceUrl===items[0].url&&Array.isArray(raw.variants)&&Array.isArray(raw.sourceSpecs)&&Array.isArray(raw.images)){e=raw;break;}
    if(b.pathname.includes("buckydrop-snapshots/")&&raw?.canonicalUrl===items[0].url&&raw.product?.environment==="live"&&Array.isArray(raw.product.variants)&&Array.isArray(raw.product.images)){const p=raw.product;e={title:p.title,descriptionText:p.descriptionText,sourceSpecs:p.productProps||[],images:p.images,variants:p.variants.map(v=>({id:v.skuCode,label:v.title,image:v.image||undefined,attributes:v.options||[]}))};break;}}catch{}}
    failed=!e;
   }
   for(let j=0;j<items.length;j++){
    const r=items[j];let record;
    if(allCached){record=old[j];result.summary.reused++;}
    else if(failed){record={url:r.url,image:r.p.imageUrl||"",input:input[j],sig,status:"failed",title:"",variants:0,description:false,specs:0,photos:0};}
    else {const evidence=e||{title:r.p.originalTitle||r.p.title,descriptionText:r.p.descriptionText,sourceSpecs:r.p.sourceSpecs||[],variants:(r.p.variants||[]).filter(v=>typeof v==="object"),images:r.p.images||[]};const naming=originalListingEvidence(r.p,evidence,r.collection==="personal");record={url:r.url,image:r.p.imageUrl||"",input:input[j],sig,status:e?"saved":"imported-only",title:naming.name,original:naming.original,fallback:naming.fallback,variants:evidence.variants?.length||0,description:!!evidence.descriptionText,specs:evidence.sourceSpecs?.length||0,photos:evidence.images?.length||0};}
    result[r.collection][r.id]=record;result.summary.scanned++;if(record.status==="saved")result.summary.savedDetails++;else if(record.status==="failed")result.summary.failed++;else result.summary.noSavedDetails++;if(record.variants)result.summary.variantEvidence++;if(record.description)result.summary.descriptionEvidence++;if(record.specs)result.summary.specEvidence++;if(record.photos)result.summary.photoEvidence++;
    if(record.title&&record.title!==(r.collection==="personal"?r.p.title:conciseProductTitle(r.p))){result.summary.changed++;if(result.summary.examples.length<5&&record.status==="saved")result.summary.examples.push({id:r.id,title:record.title,variants:record.variants});}
   }
  }));
  if(i%256===0)console.log("[name-audit] scanned",result.summary.scanned,"of",entries.length);
 }
 result.summary.complete=result.summary.scanned===entries.length&&discoveredFailed===0&&result.summary.failed===0;
 // Only name evidence and provenance counts, never raw supplier data.
 fs.writeFileSync(out,JSON.stringify(result));
 try{await put(cachePath,JSON.stringify(result),{access:"private",addRandomSuffix:false,allowOverwrite:true,contentType:"application/json"});}catch{console.log("[name-audit] index cache not persisted");}
 console.log("[name-audit] SUMMARY "+JSON.stringify(result.summary));
}
main().catch(e=>{console.log("[name-audit] aborted: "+(e?.name||"error"));fs.writeFileSync(out,JSON.stringify(empty));});
