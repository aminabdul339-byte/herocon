export const CATALOGUE_PAGE_SIZE=24;
export const FREE_PAGE_LIMIT=3;
export const FREE_COLLECTION_LIMIT=CATALOGUE_PAGE_SIZE*FREE_PAGE_LIMIT;
export const BUSINESS_CATEGORY_LIMIT=6;
export const PERSONAL_CATEGORY_LIMIT=8;
export const featuredPreviewIds=["YjXAnN1cosMO1iGVWJw5FA","HEWCWVJ5M7RL3Y-J_uV0bg","qLiCZEEhOnut6fHdkH-Bow","g8ulL_pzvvdAvGHNTXB-xw","4QucBqTfsk76WbDuGGzyBA","zmcFLXhlnDI9AyHB3zO8LA"] as const;
/** Fixed collection sample before search/filter/sort: changing filters cannot unlock products. */
export function previewCollection<T>(all:readonly T[],id:(p:T)=>string,category:(p:T)=>string,featured:readonly string[]=[]):T[]{
 const output:T[]=[],seen=new Set<string>(),groups=new Map<string,T[]>();
 const add=(p:T)=>{const k=id(p);if(k&&!seen.has(k)&&output.length<FREE_COLLECTION_LIMIT){seen.add(k);output.push(p);}};
 for(const k of featured){const p=all.find(x=>id(x)===k);if(p)add(p);}
 for(const p of all){const c=category(p)||"Other",g=groups.get(c)||[];g.push(p);groups.set(c,g);}
 for(const group of groups.values())group.sort((a,b)=>id(a).localeCompare(id(b),"en"));
 const ordered=[...groups.entries()].sort(([a],[b])=>a.localeCompare(b,"en")).map(([,g])=>g);
 for(let i=0;i<Math.max(0,...ordered.map(g=>g.length))&&output.length<FREE_COLLECTION_LIMIT;i++)for(const g of ordered){if(g[i])add(g[i]);}
 return output;
}

export function previewCategory<T>(all:readonly T[],id:(p:T)=>string,category:(p:T)=>string,name:string,limit:number):T[]{
 return all.filter(p=>category(p)===name).sort((a,b)=>id(a).localeCompare(id(b),"en")).slice(0,limit);
}
export function allowedPreview<T>(all:readonly T[],id:(p:T)=>string,category:(p:T)=>string,limit:number,featured:readonly string[]=[]):T[]{
 const result=new Map<string,T>();
 for(const p of previewCollection(all,id,category,featured))result.set(id(p),p);
 for(const name of new Set(all.map(category)))for(const p of previewCategory(all,id,category,name,limit))result.set(id(p),p);
 return [...result.values()];
}
export function freePageWindow(requested:number,total:number,category:boolean,categoryLimit:number){
 const pages=Math.max(1,Math.ceil(total/CATALOGUE_PAGE_SIZE));
 const limit=category?1:FREE_PAGE_LIMIT;
 const page=Math.min(Math.max(1,Math.trunc(requested)||1),pages);
 const locked=page>limit;
 const start=category?0:(page-1)*CATALOGUE_PAGE_SIZE;
 const end=category?categoryLimit:start+CATALOGUE_PAGE_SIZE;
 return {page,pages,locked,start,end,hasLocked:total>(category?categoryLimit:CATALOGUE_PAGE_SIZE*FREE_PAGE_LIMIT)};
}
