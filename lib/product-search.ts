import type {Product} from "./types";

const synonyms:Record<string,string[]>={
 ring:["rings","finger ring","band ring","signet","jewellery ring","jewelry ring","戒指","指环"],
 earring:["earrings","ear stud","ear studs","hoop earrings","耳环","耳钉"],
 necklace:["necklaces","pendant","chain necklace","项链"],
 bracelet:["bracelets","bangle","手链"],
 trainer:["sneaker","sneakers","trainers"],
 hoodie:["hooded sweatshirt","hoodies"],
 bag:["handbag","purse","tote","bags"]
};
const normal=(s:string)=>s.toLowerCase().normalize("NFKD").replace(/[^\p{L}\p{N}]+/gu," ").trim();
const singular=(s:string)=>s.endsWith("ies")?s.slice(0,-3)+"y":s.endsWith("s")&&!s.endsWith("ss")?s.slice(0,-1):s;
const distance=(a:string,b:string)=>{if(Math.abs(a.length-b.length)>2)return 3;let row=Array.from({length:b.length+1},(_,i)=>i);for(let i=1;i<=a.length;i++){const next=[i];for(let j=1;j<=b.length;j++)next[j]=Math.min(next[j-1]+1,row[j]+1,row[j-1]+(a[i-1]===b[j-1]?0:1));row=next}return row[b.length]};
const words=(s:string)=>normal(s).split(/\s+/).filter(Boolean).map(singular);
export function productSearchScore(p:Product,query:string):number{
 const terms=words(query);if(!terms.length)return 1;
 const title=normal([p.title,p.displayTitle,p.originalTitle].filter(Boolean).join(" "));
 const titleTokens=words(title);
 const extra=normal([p.category,p.sellerName,p.colours?.join(" "),p.styles?.join(" "),p.variants?.map(v=>typeof v==="string"?v:v.label).join(" ")].filter(Boolean).join(" "));
 // Some image URLs include meaningful descriptive filenames; opaque IDs are ignored.
 const imageLabels=[p.imageUrl,...(p.images||[])].filter(Boolean).map(u=>{try{const file=decodeURIComponent(new URL(u!).pathname.split("/").pop()||"");return /[a-z]{4,}[-_ ][a-z]{3,}/i.test(file)?file.replace(/\.(jpg|jpeg|png|webp).*/i,""):""}catch{return""}}).join(" ");
 const metadataTokens=words(extra+" "+imageLabels);
 const scoreTerm=(term:string)=>{
  const variants=[term,...(synonyms[term]||[]).flatMap(words)];
  let best=0;
  for(const v of variants){
   if(titleTokens.includes(v))best=Math.max(best,100);
   else if(metadataTokens.includes(v))best=Math.max(best,55);
   else if(v.length>=4&&titleTokens.some(w=>w.length>=4&&distance(v,w)<= (v.length>=7?2:1)))best=Math.max(best,35);
  }
  if(term==="ring"&&titleTokens.some(w=>["earring","earrings","spring","drawstring","string"].includes(w)))return best>=100?best:0;
  return best;
 };
 const scores=terms.map(scoreTerm);return scores.every(Boolean)?scores.reduce((a,b)=>a+b,0):0;
}
