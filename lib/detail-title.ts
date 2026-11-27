import type {Product,Variant} from "./types";
import {conciseProductTitle} from "./product-title";
import {withoutEmoji} from "./emoji-free";
type Spec={name:string;value:string};
export type NameEvidence={title?:string;descriptionText?:string;sourceSpecs?:Spec[];variants?:Variant[];images?:string[]};
const norm=(s?:string)=>withoutEmoji(s||"").replace(/\s+/g," ").trim();
const generic=(s:string)=>/^(?:product(?: details)?|marketplace product|other|unknown|untitled|[.\d#\s-]+)$/i.test(s.trim());
const photo=(s?:string)=>{if(!s)return "";try{const u=new URL(s);if(/(?:^|\.)alicdn\.com$/.test(u.hostname))return (u.pathname.split("/").pop()||"").replace(/(\.(?:jpg|jpeg|png|webp))(?:_.*|\.webp)$/i,"$1");if(/(?:^|\.)geilicdn\.com$/.test(u.hostname))return u.origin+u.pathname;return u.href}catch{return s;}};
const cap=(s:string)=>s.toLowerCase().replace(/\b[a-z]/g,x=>x.toUpperCase()).replace(/\bGray\b/g,"Grey");
const unique=(a:string[])=>[...new Set(a.map(x=>norm(x).toLowerCase()).filter(Boolean))];
const colours=/^(?:(?:light|dark|dusty|pastel|baby|royal|sage|olive|deep|hot)\s+)?(?:red|pink|yellow|green|blue|purple|orange|white|black|brown|beige|grey|gray|cream|ivory|burgundy|lilac|lavender|peach|coral|navy|mint|champagne|silver|gold)$/i;
const colourKey=/^(?:product\s+)?(?:colou?r|colou?r classification|colourway|颜色|颜色分类)$/i;
const designKey=/^(?:style|design|pattern|shape|flower type|flower variety|variety|hair texture|texture|nail shape|款式|图案|形状)$/i;
const attrs=(v:Variant):Spec[]=>[...(v.attributes||[]),...(v.colour?[{name:"Colour",value:v.colour}]:[]),...(v.style?[{name:"Style",value:v.style}]:[]),...(v.material?[{name:"Material",value:v.material}]:[])];
const specificDesign: [RegExp,string][]=[
 [/\b(?:six[ -]claw|six[ -]prong|6[ -]claw|6[ -]prong)\b/i,"Six-Prong"],[/\b(?:four[ -]claw|four[ -]prong|4[ -]claw|4[ -]prong)\b/i,"Four-Prong"],[/\b(?:signet)\b/i,"Signet"],[/\b(?:halo setting|halo ring)\b/i,"Halo"],[/\b(?:oval cut|oval shaped|oval shape)\b/i,"Oval-Cut"],[/\b(?:emerald cut|emerald-cut)\b/i,"Emerald-Cut"],[/\b(?:pear cut|pear-shaped)\b/i,"Pear-Shaped"],[/\b(?:square cut|square-shaped)\b/i,"Square-Cut"],[/\b(?:heart shaped|heart-shaped)\b/i,"Heart-Shaped"],[/\b(?:round brilliant|round cut)\b/i,"Round-Cut"],[/\b(?:french tip|french-tip)\b/i,"French-Tip"],[/\balmond\b/i,"Almond"],[/\bcoffin\b/i,"Coffin"],[/\b(?:wide leg|wide-leg)\b/i,"Wide-Leg"],[/\b(?:square neck|square-neck)\b/i,"Square-Neck"],[/\b(?:halter neck|halter-neck)\b/i,"Halter-Neck"],[/\b(?:floral print|flower print)\b/i,"Floral"],[/\b(?:striped|stripes)\b/i,"Striped"],[/\b(?:polka dot|polka-dot)\b/i,"Polka-Dot"],[/\b(?:houndstooth|houndstooth pattern)\b/i,"Houndstooth"],[/\b(?:deep wave|deep-wave)\b/i,"Deep-Wave"],[/\b(?:body wave|body-wave)\b/i,"Body-Wave"]
];
function add(name:string,part:string){return !part||name.toLowerCase().includes(part.toLowerCase())?name:part+" "+name;}
/** Use source-linked evidence, not arbitrary adjectives from a long seller description.
 * A colour describes the displayed photo only if its asset matches a unique variant.
 * If the whole listing has one colour, that colour can describe the listing. */
export function titleFromDetails(p:Product,e:NameEvidence,personal=false):string{
 const original=norm(p.title),supplier=norm(e.title),variants=e.variants||[];
 const specs=[...(e.sourceSpecs||[])];
 // Only explicit, labelled description fields are used as naming evidence.
 // Marketing paragraphs may describe accessories, other products or shipping.
 const description=e.descriptionText||"";
 for(const m of description.matchAll(/(?:^|[\n;|])\s*(product name|product type|flower type|flower variety|pattern|shape|hair texture|nail shape|style|material|colou?r)\s*[:：]\s*([^;\n|]{1,70})(?=$|[;\n|])/gi)){
  if(!specs.some(s=>s.name.toLowerCase()===m[1].toLowerCase()))specs.push({name:m[1],value:m[2].trim()});
 }
 const primary=photo(p.imageUrl),matched=variants.filter(v=>primary&&photo(v.image)===primary);
 const variantColours=unique(variants.flatMap(v=>attrs(v).filter(a=>colourKey.test(a.name.trim())).map(a=>a.value)));
 const matchingColours=unique(matched.flatMap(v=>attrs(v).filter(a=>colourKey.test(a.name.trim())).map(a=>a.value)));
 const specColours=unique(specs.filter(s=>colourKey.test(s.name.trim())).map(s=>s.value));
 const selected=matchingColours.length===1?matchingColours[0]:variantColours.length===1?variantColours[0]:variantColours.length===0&&specColours.length===1?specColours[0]:"";
 const colour=colours.test(selected)?cap(selected):"";
 const designValues=unique(specs.filter(s=>designKey.test(s.name.trim())).map(s=>s.value));
 const matchedDesign=unique(matched.flatMap(v=>attrs(v).filter(a=>designKey.test(a.name.trim())).map(a=>a.value)));
 const allDesign=unique(variants.flatMap(v=>attrs(v).filter(a=>designKey.test(a.name.trim())).map(a=>a.value)));
 const designText=[...designValues.filter(v=>v.length<=55),...(matchedDesign.length===1?matchedDesign:allDesign.length===1?allDesign:[])].join(" ");
 const typeHint=specs.find(s=>/^(?:product name|product type|item type)$/i.test(s.name.trim())&&s.value.length<=70)?.value||"";
 const sourceName=supplier&&!generic(supplier)&&!(/[\u3400-\u9fff]/.test(supplier))?supplier:generic(original)&&typeHint&&!generic(typeHint)?typeHint:original;
 // Keep personal model/collection names when source title does not supply a
 // reliable alternative. Use normal business title rules for supplier evidence.
 let name=personal?original:conciseProductTitle({...p,title:sourceName,displayTitle:undefined,originalTitle:sourceName,supplierTitle:supplier,sourceSpecs:specs,variants, titleHints:{colours:variants.flatMap(v=>attrs(v).filter(a=>colourKey.test(a.name.trim())).map(a=>({image:photo(v.image),value:a.value}))),variety:specs.find(s=>/^(?:variety|flower type|flower variety)$/i.test(s.name))?.value},imageUrl:primary});
 if(personal&&generic(name)&&sourceName!==original)name=conciseProductTitle({...p,title:sourceName,displayTitle:undefined,originalTitle:sourceName,sourceSpecs:specs,variants});
 const context=[sourceName,designText].join(" ");
 if(p.category==="Flowers & Gifts"&&/\b(?:crochet|knitted|yarn|wool)\b/i.test(sourceName)&&/\bbouquet\b/i.test(sourceName)){
  const flowers=[[/\bsunflowers?\b/i,"Sunflower"],[/\btulips?\b/i,"Tulip"],[/\broses?\b/i,"Rose"],[/\bcarnations?\b/i,"Carnation"],[/\bdais(?:y|ies)\b/i,"Daisy"],[/\blil(?:y|ies)\b/i,"Lily"],[/\bpeon(?:y|ies)\b/i,"Peony"],[/\bhydrangeas?\b/i,"Hydrangea"]] as const;
  const local=unique(matched.flatMap(v=>[v.label||"",...attrs(v).filter(a=>colourKey.test(a.name.trim())||designKey.test(a.name.trim())).map(a=>a.value)]));
  const localFlowers=flowers.filter(([r])=>local.some(x=>r.test(x)));
  const specified=flowers.filter(([r])=>designValues.some(x=>r.test(x)));
  const chosen=localFlowers.length===1?localFlowers[0][1]:specified.length===1?specified[0][1]:"";
  if(chosen&&/\bCrochet Flower Bouquet\b/i.test(name))name=name.replace(/\bCrochet Flower Bouquet\b/i,"Crochet "+chosen+" Bouquet").replace(/ – Assorted Flower Designs$/,"");
 }
 const isRing=/\bring\b/i.test(name)&&p.category==="Jewellery";
 const evidenceText=[...specs.map(s=>s.value),...variants.flatMap(v=>[v.label||"",...attrs(v).map(a=>a.value)])].join(" ");
 // The source can offer different gemstone materials even though the headline
 // advertises only one. Never label the entire listing as one gemstone.
 if(isRing){
  const multi=/\bmoissanite\b/i.test(evidenceText)&&/\b(?:zircon|zirconia)\b/i.test(evidenceText);
  const motif=specificDesign.slice(0,9).find(([r])=>r.test(context))?.[1];
  if(multi){name=[motif,/\bsterling silver\b/i.test(sourceName)&&!/\b(?:imitation|plated|silver tone)\b/i.test(sourceName)?"Sterling Silver":"","Ring – Moissanite or Zircon"].filter(Boolean).join(" ");return name;}
  if(/\b(?:simulated|simulation|imitation|fake|faux)\b/i.test(sourceName))name=name.replace(/\bMoissanite\b/gi,"").replace(/\s+/g," ").trim();
  if(motif)name=add(name,motif);
 }
 const design=specificDesign.find(([r,label])=>r.test(context)&&!name.toLowerCase().includes(label.toLowerCase()))?.[1];
 if(design&&designText&&specificDesign.some(([r,label])=>label===design&&r.test(designText)))name=add(name,design);
 // Use the matched/sole option rather than a colour listed only as gift wrapping.
 if(colour&&!name.toLowerCase().includes(colour.toLowerCase())&&!/\b(?:gold-plated|sterling silver)\b/i.test(name)&&!/\b(?:red|pink|yellow|green|blue|purple|orange|white|black|brown|beige|grey|gray|cream|ivory|burgundy|lilac|lavender|navy|mint)\b/i.test(name))name=add(name,colour);
 return norm(name).slice(0,150)||original;
}

/** Preserve the original listing wording rather than running the title through
 * generic category labels again. Only unmistakable sales boilerplate is removed.
 * Source claims remain supplier claims; never infer a brand or material. */
export function cleanOriginalListingTitle(value:string):string{
 return norm(value).replace(/&amp;/gi,"&")
  .replace(/\b(?:cross[- ]border|factory direct sale|factory direct sales|manufacturer direct sales|foreign trade|hot selling|hot sale|new arrival|new arrivals|in stock|ready stock|wholesale price)\b/gi," ")
  .replace(/\s+([,;:])/g,"$1").replace(/(?:\s*[,;|]\s*){2,}/g,", ").replace(/^[\s,;|–—-]+|[\s,;|–—-]+$/g,"")
  .replace(/\s+/g," ").trim();
}
const weak=(s:string)=>generic(s)||/^(?:ring|necklace|earrings?|bracelet|bag|dress|clothing|wig|shoes?|watch|hair clip|crochet flower bouquet|flower bouquet|makeup brush set|fashion accessories|jewellery|home decor)(?:\s*[-#]?\s*\d+)?$/i.test(s.trim());
export function originalListingEvidence(p:Product,e:NameEvidence,personal=false):{original:string;name:string;fallback:string}{
 const imported=norm(p.originalTitle||p.title),supplier=norm(e.title);
 const english=(s:string)=>!!s&&!/[\u3400-\u9fff]/.test(s);
 // Business details show the imported Original listing title; personal
 // imported labels are often editorial, so use the saved supplier title.
 const original=personal&&supplier?supplier:imported||supplier;
 const source=personal&&english(supplier)&&!weak(supplier)?supplier:
  english(imported)&&!weak(imported)?imported:
  english(supplier)&&!weak(supplier)?supplier:original;
 const fallback=cleanOriginalListingTitle(source)||source;
 const enriched=titleFromDetails(p,e,personal);
 const id=p.doppelProductId||"";
 // These explicit image-reviewed corrections avoid restoring known misleading
 // supplier descriptions. Other generic/editorial aliases no longer win.
 if(["DgoQWJ3vpr7IwjtVXqAyKA","OpohXCbwOZlcaz5oQkeBCQ","yXvk725eTqDy7uIaBMAuUQ"].includes(id))return {original,name:"Gold-Tone Crown Signet Ring",fallback:"Gold-Tone Crown Signet Ring"};
 if(id==="link-c98a18758ce75c64bc7154e2a4ba")return {original,name:"Green Crochet Tulip Bouquet",fallback};
 if(/Moissanite or Zircon/i.test(enriched))return {original,name:enriched,fallback:enriched};
 if(weak(fallback)&&enriched&&!weak(enriched))return {original,name:enriched,fallback};
 // Use the original descriptive wording even if a concise label is available.
 // Add a verified extra colour only when the listing itself does not name one.
 const colour=enriched.match(/^(?:(?:Light|Dark|Dusty|Pastel|Baby|Royal|Sage|Olive|Deep|Hot) )?(?:Red|Pink|Yellow|Green|Blue|Purple|Orange|White|Black|Brown|Beige|Grey|Cream|Ivory|Burgundy|Lilac|Lavender|Peach|Coral|Navy|Mint|Champagne)\b/)?.[0];
 const name=colour&&!/\b(?:red|pink|yellow|green|blue|purple|orange|white|black|brown|beige|grey|gray|cream|ivory|burgundy|lilac|lavender|peach|coral|navy|mint|champagne)\b/i.test(fallback)?colour+" "+fallback:fallback;
 return {original,name:name||enriched||imported,fallback:fallback||enriched||imported};
}
