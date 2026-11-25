export const FREE_COLLECTION_LIMIT=24;
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
