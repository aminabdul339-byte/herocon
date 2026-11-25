import {createHash} from "node:crypto";

export type BuckydropProduct = {
  source: "buckydrop";
  environment: "sandbox"|"live";
  spuCode:string|null;
  title:string;
  originalUrl:string|null;
  marketplace:string|null;
  currency:"CNY";
  /** Permanent saved supplier snapshot timestamp, if available. */
  snapshotSavedAt?:string;
  productProps?:{name:string;value:string}[];
  listPrice:number|null;
  offerPrice:number|null;
  chinaDomesticFreight:number|null;
  moq:number|null;
  available:boolean|null;
  images:string[];
  descriptionText:string;
  detailImages:string[];
  sellerName:string|null;
  variants:{skuCode:string;title:string;options:{name:string;value:string}[];price:number|null;stock:number|null;image:string|null}[];
};

const endpoints={
  sandbox:"https://dev.buckydrop.com",
  live:"https://bdopenapi.buckydrop.com"
} as const;
const PATH="/api/rest/v2/adapt/openapi/product/detail";

export function isApprovedSource(url:string,env:"sandbox"|"live"):boolean{
  try {
    const u=new URL(url);
    if(u.protocol!=="https:"||u.username||u.password||u.port)return false;
    if(env==="sandbox")return u.hostname==="dev.buckydrop.com" && /^\/sandbox\/products\/SAMPLE-[A-Za-z0-9-]+$/.test(u.pathname);
    if(u.hostname==="detail.1688.com")return /^\/offer\/\d+\.html$/.test(u.pathname);
    if(u.hostname==="item.taobao.com"||u.hostname==="detail.tmall.com")return u.pathname==="/item.htm" && /^\d+$/.test(u.searchParams.get("id")||"");
    if(u.hostname==="weidian.com"||u.hostname==="www.weidian.com")return /^\d+$/.test(u.searchParams.get("itemID")||u.searchParams.get("itemId")||"");
    return false;
  } catch {return false;}
}
function str(v:unknown):string|null{return typeof v==="string"&&v.trim()?v.trim():null;}
function num(v:unknown):number|null{return typeof v==="number"&&Number.isFinite(v)?v:null;}
function obj(v:unknown):Record<string,unknown>{return v&&typeof v==="object"&&!Array.isArray(v)?v as Record<string,unknown>:{};}
function arr(v:unknown):unknown[]{return Array.isArray(v)?v:[];}
function textOnly(v:unknown):string {
  const s=str(v)||"";
  // Never render supplier HTML unescaped, including its images, scripts or anchors.
  return s.replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi," ").replace(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi," ").replace(/<[^>]*>/g," ").replace(/\s+/g," ").trim().slice(0,16000);
}
function safeImage(v:unknown):string|null{
  const x=str(v);if(!x)return null;
  try{const u=new URL(x.startsWith("//")?"https:"+x:x);return u.protocol==="https:"&&!u.username&&!u.password?u.href:null;}catch{return null;}
}
function extractDescriptionImages(v:unknown):string[]{
  const html=str(v)||"";
  const results:string[]=[];
  // Read image links from the seller description without rendering untrusted HTML.
  for(const tag of html.match(/<img\b[^>]*>/gi)||[]){
    const attributes=[...tag.matchAll(/\b(?:data-original|data-lazy-src|data-src|src)\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s>]+))/gi)];
    for(const match of attributes){
      const value=(match[1]||match[2]||match[3]||"").replace(/&amp;/gi,"&").replace(/&quot;/gi,'"');
      const url=safeImage(value);
      if(url&&!results.includes(url)){results.push(url);break;}
    }
    // Preserve all supplier description photos; the display paginates them.
  }
  return results;
}
export function normalizeBuckydropProduct(value:unknown,environment:"sandbox"|"live"):BuckydropProduct{
  const d=obj(value);
  const variants=arr(d.skuList).map(item=>{
    const s=obj(item);
    const options=arr(s.props).map(v=>({name:str(obj(v).propName)||"",value:str(obj(v).valueName)||""})).filter(v=>v.name&&v.value);
    return {
      skuCode:str(s.skuCode)||"",
      title:str(s.skuName)||options.map(p=>p.value).join(" / ")||"Standard",
      options,
      price:num(obj(s.proPrice).price)??num(obj(s.price).price),
      stock:num(s.quantity),
      image:safeImage(s.imgUrl)
    };
  }).filter(v=>v.skuCode);
  const images=[...new Set([safeImage(d.picUrl),...arr(d.productImageList).map(v=>safeImage(v)||safeImage(obj(v).imgUrl)||safeImage(obj(v).url)),...variants.map(v=>v.image)].filter((x):x is string=>!!x))];
  const productProps=arr(d.productProps).map(v=>{
    const p=obj(v);
    const name=str(p.propName)||str(p.name)||str(p.key)||"";
    const value=str(p.valueName)||str(p.propValue)||str(p.value)||"";
    return {name:name.slice(0,100),value:value.slice(0,250)};
  }).filter(v=>v.name&&v.value);
  return {
    source:"buckydrop",
    environment,
    spuCode:str(d.spuCode),
    title:str(d.productName)||"Product details",
    originalUrl:str(d.productLink),
    marketplace:str(d.platform),
    currency:"CNY",
    productProps,
    listPrice:num(obj(d.price).price),
    offerPrice:num(obj(d.proPrice).price),
    chinaDomesticFreight:num(obj(d.freight).price),
    moq:num(d.beginCount),
    available:d.soldOutTag===1?true:d.soldOutTag==null?null:false,
    images,
    descriptionText:textOnly(d.productDetailHtml),
    detailImages:extractDescriptionImages(d.productDetailHtml),
    sellerName:str(obj(d.shop).shopName),
    variants
  };
}
export class BuckydropError extends Error{
  public code:string;
  public status:number;
  constructor(code:string,status:number,message:string){super(message);this.code=code;this.status=status;}
}
export async function queryBuckydropProduct(productLink:string):Promise<BuckydropProduct>{
  const environment=process.env.BUCKYDROP_ENV==="live"?"live":"sandbox";
  if(environment==="live"&&process.env.HEROCON_LEGACY_BUCKYDROP_WRITES_ENABLED!=="true")throw new BuckydropError("PROVIDER_RETIRED",503,"New supplier requests are migrating to HioBuy. Saved reference details remain available.");
  if(process.env.BUCKYDROP_ENABLE_PRODUCT_LOOKUP!=="true")throw new BuckydropError("NOT_ENABLED",503,"Product lookup is not enabled.");
  if(!isApprovedSource(productLink,environment))throw new BuckydropError("INVALID_SOURCE",400,"The source URL is unsupported in this environment.");
  const appCode=process.env.BUCKYDROP_APP_CODE;
  const appSecret=process.env.BUCKYDROP_APP_SECRET;
  if(!appCode||!appSecret)throw new BuckydropError("NOT_CONFIGURED",503,"our sourcing partner account credentials have not been configured.");
  const body=JSON.stringify({productLink});
  const timestamp=String(Date.now());
  const sign=createHash("md5").update(appCode+body+timestamp+appSecret).digest("hex");
  const uri=new URL(PATH,endpoints[environment]);
  uri.searchParams.set("appCode",appCode);
  uri.searchParams.set("timestamp",timestamp);
  uri.searchParams.set("sign",sign);
  let response:Response;
  try {
    response=await fetch(uri,{
      method:"POST",
      headers:{"Content-Type":"application/json",lang:"en"},
      body,
      signal:AbortSignal.timeout(15000),
      cache:"no-store"
    });
  }catch{throw new BuckydropError("UPSTREAM_UNAVAILABLE",502,"our sourcing partner product lookup is temporarily unavailable.");}
  if(!response.ok)throw new BuckydropError("UPSTREAM_HTTP_ERROR",502,"our sourcing partner did not return a successful HTTP response.");
  let result:unknown;
  try{result=await response.json();}catch{throw new BuckydropError("INVALID_RESPONSE",502,"our sourcing partner returned invalid JSON.");}
  const data=obj(result);
  if(data.success!==true||data.code!==0){
    const errorCode=String(data.code??"UNKNOWN");
    if(errorCode==="70000015"||errorCode==="70000022"||errorCode==="70011103"){
      throw new BuckydropError("RATE_LIMIT",429,"our sourcing partner temporarily limited product requests; try again later.");
    }
    if(errorCode==="70000014")throw new BuckydropError("ACCESS_DENIED",503,"our sourcing partner has not authorised this product operation.");
    if(errorCode==="70000028")throw new BuckydropError("ACCOUNT_FUNDS",503,"our sourcing partner has suspended billable API requests because of insufficient balance. Check the developer console Billing Info page.");
    if(errorCode==="70011202")throw new BuckydropError("NOT_FOUND",404,"our sourcing partner did not find this product.");
    throw new BuckydropError("UPSTREAM_"+errorCode,502,"our sourcing partner could not retrieve the product at this time.");
  }
  if(!data.data||typeof data.data!=="object"||Array.isArray(data.data))throw new BuckydropError("EMPTY_PRODUCT",404,"Product details were not returned.");
  return normalizeBuckydropProduct(data.data,environment);
}