/**
 * Product feeds and external listing titles can contain pictographic emoji.
 * Keep customer-facing product text consistent with Herocon's line-icon design.
 * URLs, IDs and source data are intentionally left untouched by this helper.
 */
const pictographs=/(?:\p{Regional_Indicator}{2}|[\p{Emoji_Presentation}\u2600-\u27BF\u2190-\u21FF]\uFE0F?|\uFE0F|\u20E3|\u200D)/gu;

export function withoutEmoji(text:string):string {
  return text.replace(pictographs,"").replace(/\s{2,}/g," ").trim();
}
