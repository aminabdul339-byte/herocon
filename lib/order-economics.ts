/**
 * Herocon merchant-cost guard for private approved GBP checkout prices.
 * PENCE ONLY for all amounts. Stripe fees are a conservative planning
 * allowance, not the merchant account's verified effective processing rate.
 * Supplier FX, freight, duties and BuckyDrop charges must be merchant-verified.
 *
 * These are projected unit economics, not a guarantee of realised profit:
 * cancellations, refunds, disputes, reweighing, bank FX and taxes can differ.
 */
export const STRIPE_PLANNING_RATE_BPS=600; // 6% of full charge, incl service fee and shipping
export const STRIPE_PLANNING_FIXED_PENCE=30; // 30p per initial transaction
export const TARGET_GROSS_MARGIN_BPS=1200; // at least 12% of customer payment
export const MIN_PROJECTED_PROFIT_PENCE=200; // or £2 per order, whichever is higher

export type PricingCosts={
 supplierCostPence:number;
 internationalFreightPence:number;
 buckydropFeesPence:number;
 walletAndFxFeesPence:number;
 taxAndDutiesPence:number;
 shippingRiskReservePence:number;
};
export type PricingAssessment=PricingCosts&{
 totalPence:number;
 stripeAllowancePence:number;
 totalExpectedCostPence:number;
 projectedProfitPence:number;
 requiredProfitPence:number;
 minimumCustomerTotalPence:number;
 priceApproved:boolean;
 pricingModel:"merchant_cost_guard_v1";
};

function moneyPence(value:number){
 return Number.isSafeInteger(value)&&value>=0&&value<=500000;
}
export function calculateMinimumCustomerPrice(costs:PricingCosts):number{
 if(!Object.values(costs).every(moneyPence))throw Error("Invalid order-cost input.");
 const nonStripe=Object.values(costs).reduce((sum,n)=>sum+n,0);
 const fixed=STRIPE_PLANNING_FIXED_PENCE;
 // Profit must clear the larger of £2 and 12% of *gross checkout revenue*.
 const withFixedProfit=Math.ceil((nonStripe+fixed+MIN_PROJECTED_PROFIT_PENCE)*10000/(10000-STRIPE_PLANNING_RATE_BPS));
 const withMargin=Math.ceil((nonStripe+fixed)*10000/(10000-STRIPE_PLANNING_RATE_BPS-TARGET_GROSS_MARGIN_BPS));
 let price=Math.max(50,withFixedProfit,withMargin);
 // Round-up effects in Stripe / margin checks must not admit a 1p loss.
 while(price<=500000&&!assessAt(price,costs).priceApproved)price++;
 return price;
}
function assessAt(totalPence:number,costs:PricingCosts){
 const stripeAllowancePence=Math.ceil(totalPence*STRIPE_PLANNING_RATE_BPS/10000)+STRIPE_PLANNING_FIXED_PENCE;
 const totalExpectedCostPence=Object.values(costs).reduce((sum,n)=>sum+n,0)+stripeAllowancePence;
 const projectedProfitPence=totalPence-totalExpectedCostPence;
 const requiredProfitPence=Math.max(MIN_PROJECTED_PROFIT_PENCE,
  Math.ceil(totalPence*TARGET_GROSS_MARGIN_BPS/10000));
 return {stripeAllowancePence,totalExpectedCostPence,projectedProfitPence,requiredProfitPence,
  priceApproved:projectedProfitPence>=requiredProfitPence};
}
export function assessMerchantCheckout(totalPence:number,costs:PricingCosts):PricingAssessment{
 if(!moneyPence(totalPence)||totalPence<50)throw Error("Invalid GBP checkout total.");
 if(!Object.values(costs).every(moneyPence))throw Error("Invalid order-cost input.");
 const minimumCustomerTotalPence=calculateMinimumCustomerPrice(costs);
 return {pricingModel:"merchant_cost_guard_v1",...costs,totalPence,
  ...assessAt(totalPence,costs),minimumCustomerTotalPence};
}
