export type ProcurementLine={channel:"1688"|"taobao";sellerId:string;offerId:string;skuId:string;quantity:number};
export type ProcurementGroup={channel:ProcurementLine["channel"];sellerId:string;lines:ProcurementLine[]};
/** Only call on fresh, server-verified product and seller identities, never browser labels. */
export function groupProcurementLines(lines:readonly ProcurementLine[]):ProcurementGroup[]{
 if(!lines.length||lines.length>100)throw Error("Invalid line count");
 const groups=new Map<string,ProcurementGroup>();
 for(const line of lines){
  if(!["1688","taobao"].includes(line.channel)||![line.sellerId,line.offerId,line.skuId].every(v=>typeof v==="string"&&v.trim().length>0&&v.length<=500)||!Number.isSafeInteger(line.quantity)||line.quantity<1||line.quantity>999)throw Error("Unverified procurement line");
  const key=JSON.stringify([line.channel,line.sellerId]);
  let group=groups.get(key);
  if(!group){group={channel:line.channel,sellerId:line.sellerId,lines:[]};groups.set(key,group);}
  const existing=group.lines.find(v=>v.offerId===line.offerId&&v.skuId===line.skuId);
  if(existing){if(existing.quantity+line.quantity>999)throw Error("Quantity exceeds limit");existing.quantity+=line.quantity;}
  else group.lines.push({...line});
 }
 return [...groups.values()];
}
export function extractCreatedOrderIds(raw:Record<string,unknown>):string[]{
 const result=new Set<string>();
 const add=(v:unknown)=>{if(typeof v==="string"&&v.trim())result.add(v);};
 add(raw.order_id);
 if(Array.isArray(raw.order_list))for(const row of raw.order_list)if(row&&typeof row==="object")add((row as Record<string,unknown>).order_id);
 return [...result];
}
