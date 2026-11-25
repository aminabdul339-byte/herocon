import type {Product} from "./types";
/** Editorial discovery order only. No material or authenticity claims. */
export function jewelleryDiscoveryRank(p:Product):number{
 const t=[p.originalTitle,p.title,p.displayTitle].filter(Boolean).join(" ").toLowerCase();
 if(/\b(?:ring holder|ring box|ring display|ring light|key\s*ring|keychain|nose ring|ear ring|toe ring|piercing|jewell?ery box|packaging)\b/.test(t))return 5;
 const ring=/\b(?:rings?|engagement bands?|wedding bands?)\b/.test(t);
 const stone=/\b(?:moissanite|zircon(?:ia)?|diamond|gemstones?|gem stone|sapphire|emerald|ruby|amethyst|crystal|rhinestone|opal|aquamarine|topaz|garnet|halo|solitaire|pav[eé]|princess cut|cushion cut|oval cut|pear cut)\b/.test(t);
 const bridal=/\b(?:engagement|wedding|bridal|proposal|bride)\b/.test(t);
 const novelty=/\b(?:skull|skeleton|hip.hop|gothic|punk|dragon|cartoon|anime|spider|sports team|lakers)\b/.test(t);
 if(ring&&!novelty&&stone&&bridal)return 0;
 if(ring&&!novelty&&(stone||bridal))return 1;
 if(ring&&!novelty)return 2;
 if(/\b(?:necklaces?|bracelets?|earrings?|pendants?|bangles?)\b/.test(t)&&!novelty)return 3;
 return novelty?5:4;
}
export function prioritizeJewelleryDiscovery(products:Product[]):Product[]{return [...products].sort((a,b)=>jewelleryDiscoveryRank(a)-jewelleryDiscoveryRank(b));}
