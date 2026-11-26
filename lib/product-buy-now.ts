// Public product actions navigate only; they do not initiate checkout or add items.
export function productBuyNowDestination(status:string):string{
 return status==="authenticated"?"/cart":"/account?mode=signup&next=%2Fcart";
}
