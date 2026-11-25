import type {Stage} from "./hiobuy-test-lifecycle";
export type ShoppingSection="orders"|"warehouse"|"parcels";
export function shoppingSection(stage:Stage):ShoppingSection|null{
 if(stage==="products_paid"||stage==="purchased")return "orders";
 if(stage==="warehouse_received"||stage==="packing"||stage==="shipping_due")return "warehouse";
 if(stage==="shipping_paid"||stage==="shipped"||stage==="delivered")return "parcels";
 return null;
}
