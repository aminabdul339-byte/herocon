import type {PersonalShopProduct} from "./personal-shop";

type Audience="women"|"men";
const bottomWords=/\b(?:jeans?|trousers?|pants?|shorts?|joggers?|sweatpants?|track[\s-]?pants?|cargos?|bottoms?|chinos?)\b/i;
const topWords=/\b(?:t[\s-]?shirts?|tees?|shirts?|polos?|hoodies?|sweatshirts?|sweaters?|jumpers?|knitwear|cardigans?|vests?|tank tops?|tops?)\b/i;
const setWords=/\b(?:sets?|suits?|tracksuits?|outfits?)\b/i;
const bottom=(p:PersonalShopProduct)=>p.category==="Clothing"&&bottomWords.test(p.name)&&!topWords.test(p.name)&&!setWords.test(p.name);
const top=(p:PersonalShopProduct)=>p.category==="Clothing"&&topWords.test(p.name)&&!bottomWords.test(p.name)&&!setWords.test(p.name);
const category=(name:string)=>(p:PersonalShopProduct)=>p.category===name;

// Keep different listing names near the front of each editorial group.
// Multiple variants of the same name remain available further down the list.
function varied(pool:PersonalShopProduct[]):PersonalShopProduct[]{
 const seen=new Set<string>(),first:PersonalShopProduct[]=[],rest:PersonalShopProduct[]=[];
 for(const p of pool){
  const key=p.name.trim().toLowerCase();
  if(seen.has(key))rest.push(p);
  else{seen.add(key);first.push(p);}
 }
 return [...first,...rest];
}

/** Mix the four requested niches in order for the first 24 cards, then
 * continue mixing all available categories. Input order within each group
 * remains stable, apart from moving repeated product names further back.
 * No listings are removed or modified, and no extra supplier calls occur. */
export function mixPersonalEdit(products:PersonalShopProduct[],audience:Audience):PersonalShopProduct[]{
 const selectors=audience==="women"
  ?[category("Bags"),category("Sunglasses"),category("Jewellery"),category("Shoes")]
  :[bottom,category("Shoes"),top,category("Accessories")];
 const pools:PersonalShopProduct[][]=selectors.map(()=>[]);
 const extras=new Map<string,PersonalShopProduct[]>();
 for(const p of products){
  const index=selectors.findIndex(matches=>matches(p));
  if(index>=0)pools[index].push(p);
  else{const pool=extras.get(p.category)||[];pool.push(p);extras.set(p.category,pool);}
 }
 const primary=pools.map(varied),secondary=[...extras.values()].map(varied);
 const ordered:PersonalShopProduct[]=[];
 const take=(pool:PersonalShopProduct[],index:number)=>{const p=pool[index];if(p)ordered.push(p);};
 for(let i=0;i<6;i++)for(const pool of primary)take(pool,i);
 for(let i=0;i<Math.max(0,...primary.map(p=>p.length-6),...secondary.map(p=>p.length));i++){
  for(const pool of primary)take(pool,i+6);
  for(const pool of secondary)take(pool,i);
 }
 return ordered;
}
