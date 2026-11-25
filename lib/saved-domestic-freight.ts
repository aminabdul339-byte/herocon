import "server-only";
import {getSavedMarketplaceSource} from "@/lib/marketplace-source-enrichment";
import {getSavedBuckydropProduct} from "@/lib/buckydrop-cache";
import {normalizeMarketplaceLink} from "@/lib/marketplace-links";
import {readFreightRecord} from "@/lib/domestic-freight-audit";
import {validFreight} from "@/lib/cart-pricing";
export async function savedDomesticFreight(value:unknown):Promise<number|null>{
 const url=normalizeMarketplaceLink(value);if(!url)return null;
 const saved=await getSavedMarketplaceSource(url);
 if(validFreight(saved?.chinaDomesticFreight))return saved.chinaDomesticFreight;
 // Historic supplier snapshot: no billable lookup and no inference from weight.
 const legacy=await getSavedBuckydropProduct(url).catch(()=>null);
 if(validFreight(legacy?.chinaDomesticFreight))return legacy.chinaDomesticFreight;
 const recorded=await readFreightRecord(url);return validFreight(recorded?.amountCny)?recorded.amountCny:null;
}
