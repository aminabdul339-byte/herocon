import previous from "@/data/previous-personal-names.json";
type Row={url:string;image:string;title:string;status:string};
const rows=previous as Record<string,Row>;
/** Reproduce the previous production release's strict source + image match.
 * New or changed listings retain their curated imported name. */
export function previousPersonalName(id:string,url:string,image:string):string|undefined{
 const r=rows[id];return r&&r.status!=="failed"&&r.title&&r.url===url&&r.image===image?r.title:undefined;
}
