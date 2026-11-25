/** Supplier stock snapshots can contain contradictory listing and SKU flags.
 * Never advertise confirmed live stock from a historical snapshot.
 * A conflict permits draft planning, but does not authorize purchasing.
 */
export function supplierAvailability(source:{available:boolean|null;variants:ReadonlyArray<{stock:number|null}>}|null|undefined){
 const variants=source?.variants||[];
 const positive=variants.some(v=>typeof v.stock==="number"&&v.stock>0);
 const conflict=source?.available===false&&positive;
 const allZero=variants.length>0&&variants.every(v=>v.stock===0);
 return {conflict,outOfStock:allZero||(source?.available===false&&!conflict)};
}
