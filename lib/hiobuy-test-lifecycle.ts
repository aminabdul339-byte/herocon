/** Isolated customer journey simulation: never calls a payment or supplier API. */
export const stages=["draft","products_paid","purchased","warehouse_received","packing","shipping_due","shipping_paid","shipped","delivered"] as const;
export type Stage=typeof stages[number];
export const stageLabels:Record<Stage,string>={draft:"Order review",products_paid:"Product payment received",purchased:"Products purchased",warehouse_received:"Arrived at warehouse",packing:"Preparing your parcel",shipping_due:"Shipping payment required",shipping_paid:"Shipping paid",shipped:"Dispatched",delivered:"Delivered"};
export const notices:Record<Exclude<Stage,"draft">,{subject:string;body:string}>={
 products_paid:{subject:"We've received your product payment",body:"Your test order has been received. We will confirm the supplier purchase before warehouse delivery."},
 purchased:{subject:"Your products have been purchased",body:"Your supplier order is confirmed. Your items are on their way to the China warehouse."},
 warehouse_received:{subject:"Your products have arrived at the warehouse",body:"Your parcel is recorded as received. Review the available shipping options when packing is complete."},
 packing:{subject:"Your parcel is being prepared",body:"Your items are being packed and measured for international delivery."},
 shipping_due:{subject:"Your shipping payment is ready",body:"Review the final shipping charge and approve the second payment before dispatch."},
 shipping_paid:{subject:"Your shipping payment is confirmed",body:"Your parcel is awaiting dispatch."},
 shipped:{subject:"Your order has shipped",body:"Your parcel has been dispatched. View your tracking reference and delivery progress."},
 delivered:{subject:"Your order has been delivered",body:"Your order is marked delivered. Thank you for sourcing with Herocon."}
};
export function nextStage(stage:Stage):Stage|null{const i=stages.indexOf(stage);return i>=0&&i<stages.length-1?stages[i+1]:null;}
export function testTotals(unitFen:number,quantity:number,domesticFen:number,feeFen:number,shippingFen:number){const products=unitFen*quantity+domesticFen+feeFen;if(![unitFen,quantity,domesticFen,feeFen,shippingFen,products,products+shippingFen].every(n=>Number.isSafeInteger(n)&&n>=0)||quantity<1||unitFen<1)throw Error("Invalid test amount");return {products,shipping:shippingFen,total:products+shippingFen};}
