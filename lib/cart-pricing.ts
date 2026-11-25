/** Product API amounts are CNY yuan; estimates only, never a payable quote. */
export function validFreight(v:unknown):v is number{return typeof v==="number"&&Number.isFinite(v)&&v>=0&&v<=1000000;}
export function domesticFromProduct(p:unknown):number|null{
 if(!p||typeof p!=="object")return null;
 const shipping=(p as Record<string,unknown>).shipping;
 if(!shipping||typeof shipping!=="object")return null;
 const fee=(shipping as Record<string,unknown>).domestic_shipping_fee;
 if(!fee||typeof fee!=="object")return null;
 const f=fee as Record<string,unknown>;
 const currency=f.currency??f.display_currency;
 if(currency!=="CNY")return null;
 const v=f.amount??f.display_amount;
 return validFreight(v)?v:null;
}
export type FreightLine={marketplaceUrl:string;domesticFreightCny?:number|null;unitPrice:number|null;quantity:number;currency:"CNY"|"GBP"};
/** One recorded estimate per distinct listing, not one per variant or unit.
 * Actual order-level freight depends on seller, quantity and address. */
export function freightSummary(lines:readonly FreightLine[]){
 const groups=new Map<string,{values:number[];missing:boolean}>();
 for(const l of lines){const g=groups.get(l.marketplaceUrl)||{values:[],missing:false};if(validFreight(l.domesticFreightCny))g.values.push(l.domesticFreightCny);else g.missing=true;groups.set(l.marketplaceUrl,g);}
 let knownFen=0,unknown=0;
 for(const g of groups.values()){if(!g.values.length||g.values.some(v=>v!==g.values[0]))unknown++;else knownFen+=Math.round(g.values[0]*100);}
 return {knownFen,unknown,complete:unknown===0};
}
export function productPayment(goodsMinor:number,domesticMinor:number){if(![goodsMinor,domesticMinor].every(x=>Number.isSafeInteger(x)&&x>=0))throw Error("Invalid payment amounts");const feeMinor=Math.round(goodsMinor*7/100);const totalMinor=goodsMinor+domesticMinor+feeMinor;if(!Number.isSafeInteger(totalMinor))throw Error("Invalid total");return {goodsMinor,domesticMinor,feeMinor,totalMinor};}
