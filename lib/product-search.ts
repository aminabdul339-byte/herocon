import type {Product} from "./types";
import {resolveCategory} from "./product-taxonomy";

/**
 * Search never uses arbitrary fuzzy matches or CDN image filenames.
 * Exact category searches (e.g. "shoes", "tops", "jewellery") only
 * return that primary category, not incidental text from other products.
 */
const synonymPhrases:Record<string,string[]>={
 "tee":["t shirt","tee shirt","tshirt","t-shirt"],
 "tshirt":["t shirt","tee","shirt"],
 "hoodie":["hooded sweatshirt","pullover hoodie"],
 "sweatshirt":["hoodie","crewneck sweatshirt"],
 "sneaker":["trainer","running shoe","sports shoe"],
 "trainer":["sneaker","running shoe","sports shoe"],
 "pants":["trousers"],
 "trouser":["pants"],
 "jean":["denim jeans"],
 "handbag":["shoulder bag","crossbody bag","purse"],
 "backpack":["rucksack","schoolbag"],
 "earring":["ear studs","stud earrings"],
 "necklace":["pendant necklace"],
 "hairclip":["hair clip","barrette","hairpin"],
 "scrunchie":["hair tie","hair band"],
 "sunglasse":["sun glasses"],
 "jumper":["sweater","pullover"]
};

function normalize(text:string):string {
 return String(text).toLowerCase().normalize("NFKD")
  .replace(/(?<=[a-z])(?=[0-9])/g," ")
  .replace(/[^\p{L}\p{N}]+/gu," ").replace(/\s+/g," ").trim();
}
function singular(token:string):string {
 if(token==="dresses")return "dress";
 if(token==="watches")return "watch";
 if(token==="shoes")return "shoe";
 if(token==="glasses")return "glass";
 if(token==="accessories")return "accessory";
 if(token.endsWith("ies")&&token.length>4)return token.slice(0,-3)+"y";
 if(token.endsWith("sses")&&token.length>5)return token.slice(0,-2);
 if(token.endsWith("s")&&!token.endsWith("ss")&&token.length>3)return token.slice(0,-1);
 return token;
}
const tokens=(text:string)=>normalize(text).split(" ").filter(Boolean).map(singular);
const synonymous=(term:string,tok:Set<string>,haystack:string):boolean=>{
 if(tok.has(term))return true;
 for(const phrase of synonymPhrases[term]||[]){
  const phraseTerms=tokens(phrase);
  if(phraseTerms.length===1&&tok.has(phraseTerms[0]))return true;
  if(phraseTerms.length>1&&haystack.includes(phraseTerms.join(" ")))return true;
 }
 return false;
};
export function productSearchScore(product:Product,query:string):number {
 const trimmed=query.trim();
 if(!trimmed)return 1;
 const category=resolveCategory(trimmed);
 if(category)return product.category===category?10000:0;
 // Product-noun phrases should not return items that merely mention the words.
 // e.g. "ring light luxury" jewellery is not photography lighting.
 const specificIntent:Record<string,string>={
  "ring light":"Lighting","table lamp":"Lighting","desk lamp":"Lighting",
  "shoe rack":"Storage & Organisation","shoe cabinet":"Storage & Organisation",
  "jewellery box":"Storage & Organisation","jewelry box":"Storage & Organisation",
  "coffee table":"Furniture","dining table":"Furniture",
  "sofa cushion":"Home Textiles","pillow case":"Home Textiles",
  "pillow bag":"Bags","shoe bag":"Bags",
  "dress shirt":"Tops","phone case":"Electronics & Tech",
  "hair clip":"Hair Accessories"
 };
 const normalizedQuery=normalize(trimmed);
 for(const [phrase,targetCategory] of Object.entries(specificIntent)){
  if(normalizedQuery===phrase||normalizedQuery.startsWith(phrase+" ")||normalizedQuery.endsWith(" "+phrase)){
   if(product.category!==targetCategory)return 0;
  }
 }
 const name=normalize([product.title,product.displayTitle,product.originalTitle].filter(Boolean).join(" "));
 if(!name)return 0;
 const queryWords=tokens(trimmed);
 const itemWords=new Set(tokens(name));
 let score=0;
 for(const term of queryWords){
  if(synonymous(term,itemWords,name))score+=100;
  else return 0;
 }
 const phrase=queryWords.join(" ");
 if(name.includes(phrase))score+=150;
 if(name.startsWith(phrase))score+=100;
 if(product.sellerName&&normalize(product.sellerName)===normalize(trimmed))score+=50;
 return score;
}