/** Real hair products come first; accessory and novelty listings remain at the end.
 * Stable ordering within each group preserves existing supplier priority.
 */
import type {Product} from "./types";
const accessoryIds=new Set(["c1PXF3BwjL-GvIdSmr571Q","t5E4kINWJoOJtesA2qzfjQ","k1tgZjA_Vw-d3psK0uXEGg","qWK14Z0KzuDCah9G_7DzHQ","GCaHScgzs6UBnoKIqifsAw"]);
export function hairDiscoveryRank(p:Product):number{
 const title=[p.originalTitle,p.title,p.displayTitle].filter(Boolean).join(" ").toLowerCase();
 if(accessoryIds.has(p.doppelProductId||""))return 3;
 if(/\b(?:cosplay|anime|costume|halloween|doll|toy|photo props)\b/.test(title))return 3;
 if(/\b(?:wig\s+(?:glue|adhesive|remover|installation tools?|install\s*kit|stands?|holders?|racks?|storage|accessories)|(?:lace|bonding)\s+glue|hair\s+(?:ties?|bands?|ropes?|pins?|clips?|beads?|accessories|ornaments)|hairpin|headband|rubber band|dreadlock\s+(?:beads?|rings?)|extension rings?|ponytail holder|wig ring)\b/.test(title)){
  // Real full headband wigs remain wigs, rather than headbands.
  if(!/\b(?:full headband wig|full headband style|headband wig)\b/.test(title))return 3;
 }
 if(/\b(?:wig\s+(?:net\s+)?cap|wig\s+net|lace wig cap|hair net)\b/.test(title)&&!/\b(?:human hair|curly hair|straight hair|long hair|deep wave|body wave|full head cover)\b/.test(title))return 3;
 if(/\b(?:wig|wigs|lace\s+front(?:al)?|lace\s+closure|full\s+lace|hair\s+(?:extensions?|wefts?|bundles?)|toupee|hairpiece|hair piece)\b/.test(title)){
  return /\b(?:lace\s+front|front\s+lace|full\s+lace|glueless|human\s+hair|lace\s+closure)\b/.test(title)?0:1;
 }
 return 2;
}
export function prioritizeHairDiscovery(products:Product[]):Product[]{return [...products].sort((a,b)=>hairDiscoveryRank(a)-hairDiscoveryRank(b));}
