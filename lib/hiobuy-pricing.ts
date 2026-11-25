/** Money inputs are integer minor units. Goods and domestic shipping are CNY fen. */
export function productTotal(goods:number,domestic:number,rate:number){
 if(!Number.isSafeInteger(goods)||goods<=0||!Number.isSafeInteger(domestic)||domestic<0||
  !Number.isFinite(rate)||rate<=0.01||rate>=0.5)throw Error("Invalid quote");
 const merchandisePence=Math.round(goods*rate);
 const domesticPence=Math.round(domestic*rate);
 const procurementPence=Math.round(merchandisePence*7/100);
 const totalPence=merchandisePence+domesticPence+procurementPence;
 if(!Number.isSafeInteger(totalPence)||totalPence<=0)throw Error("Invalid total");
 return {merchandisePence,domesticPence,procurementPence,totalPence};
}
export function canPayShipping(status:string,payment:string,packed:boolean,fen:number){
 return status==="WAIT_PAYMENT"&&payment==="UNPAID"&&packed&&Number.isSafeInteger(fen)&&fen>0;
}
