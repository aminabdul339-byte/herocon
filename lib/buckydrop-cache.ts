import {unstable_cache} from "next/cache";
import {queryBuckydropProduct} from "@/lib/buckydrop";

// Shared by the API and product pages so repeat visits can reuse the same
// one-hour result instead of making two BuckyDrop requests.
export const getCachedBuckydropProduct=unstable_cache(
 async (originalMarketplaceUrl:string)=>queryBuckydropProduct(originalMarketplaceUrl),
 ["herocon-buckydrop-product-v1"],
 {revalidate:3600}
);