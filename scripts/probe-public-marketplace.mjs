#!/usr/bin/env node
/**
 * No-login, no-cookie marketplace metadata pilot.
 * Tests only a few exact product URLs already in Herocon's two catalogues.
 * Does not use OpenCLI login adapters, BuckyDrop, HioBuy or proxy services.
 * No CAPTCHA solving, redirect following, retry loops or hidden endpoints.
 */
import {readFile,mkdir,writeFile} from "node:fs/promises";
import {resolve} from "node:path";

const ALLOWED=new Map([
 ["detail.1688.com",/^\/offer\/\d{5,20}\.html$/],
 ["item.taobao.com",/^\/item\.htm$/],
 ["weidian.com",/^\/item\.html$/]
]);
const MAX_BYTES=800_000;
const WAIT_MS=1800;
const delay=ms=>new Promise(done=>setTimeout(done,ms));
function canonical(raw){
 try{
  const u=new URL(raw);
  if(u.protocol!=="https:"||u.username||u.password||u.port||!ALLOWED.get(u.hostname)?.test(u.pathname))return null;
  if(u.hostname==="detail.1688.com")return u.origin+u.pathname;
  const key=u.hostname==="weidian.com"?"itemID":"id",id=u.searchParams.get(key);
  if(!id||!/^\d{5,20}$/.test(id))return null;
  return u.origin+u.pathname+"?"+key+"="+id;
 }catch{return null;}
}
const decode=s=>s.replace(/&amp;/gi,"&").replace(/&quot;/gi,'"').replace(/&#39;|&apos;/gi,"'").replace(/&lt;/gi,"<").replace(/&gt;/gi,">").replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Math.min(1114111,Number(n))));
const clean=s=>typeof s==="string"?decode(s).replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim().slice(0,260):"";
function attributes(tag){
 const a={};
 for(const m of tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g))a[m[1].toLowerCase()]=m[2]??m[3];
 return a;
}
export function parsePublicMetadata(html,source){
 const meta=new Map();
 for(const match of html.slice(0,260000).matchAll(/<meta\b[^>]*>/gi)){
  const a=attributes(match[0]);
  const name=(a.property||a.name||"").toLowerCase();
  if(name&&!meta.has(name))meta.set(name,clean(a.content||""));
 }
 const title=clean(meta.get("og:title")||meta.get("twitter:title")||(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)||[])[1]);
 const description=clean(meta.get("og:description")||meta.get("description"));
 const image=meta.get("og:image")||meta.get("twitter:image")||"";
 const money=meta.get("product:price:amount")||"",currency=meta.get("product:price:currency")||"";
 let validImage=null;
 try{const u=new URL(image);if(u.protocol==="https:"&&!u.username&&!u.password)validImage=u.href;}catch{}
 const obviousBlock=/(captcha|access denied|request blocked|login|sign in|security check|robot check|verify you are human|请登录|安全验证|访问受限)/i;
 if(obviousBlock.test(title)||obviousBlock.test(description))return {status:"access_restricted",fields:[]};
 // A link with only a generic homepage title is never treated as a verified product.
 const hasProduct=String(meta.get("og:type")||"").toLowerCase()==="product"||
  (title.length>12&&!!validImage&&description.length>20);
 const fields=[];
 if(hasProduct){
  if(title)fields.push("title");
  if(validImage)fields.push("image");
  if(description)fields.push("description");
  if(currency==="CNY"&&/^\d+(?:\.\d{1,2})?$/.test(money))fields.push("priceCNY");
 }
 return {status:hasProduct?"public_metadata":"insufficient_product_fields",
  fields,title:hasProduct?title:null,image:hasProduct?validImage:null,
  description:hasProduct?description:null,
  priceCNY:hasProduct&&fields.includes("priceCNY")?Number(money):null,source};
}
async function readJson(path){const data=JSON.parse(await readFile(resolve(path),"utf8"));return Array.isArray(data)?data:Array.isArray(data.products)?data.products:[];}
async function candidates(){
 const [business,personal]=await Promise.all([
  readJson("public/herocon-current-catalogue.json"),readJson("data/shop-personal-merged.json")
 ]);
 const result=[],seen=new Set();
 const picks=[
  {collection:"business",host:"detail.1688.com",rows:business,urlKey:"originalMarketplaceUrl"},
  {collection:"business",host:"item.taobao.com",rows:business,urlKey:"originalMarketplaceUrl"},
  {collection:"personal",host:"weidian.com",rows:personal,urlKey:"originalUrl"},
  {collection:"personal",host:"item.taobao.com",rows:personal,urlKey:"originalUrl"},
  {collection:"personal",host:"detail.1688.com",rows:personal,urlKey:"originalUrl"}
 ];
 for(const pick of picks){
  for(const row of pick.rows){
   const url=canonical(row[pick.urlKey]);
   if(!url||new URL(url).hostname!==pick.host||seen.has(url))continue;
   seen.add(url);
   result.push({collection:pick.collection,marketplace:pick.host,url});
   break;
  }
 }
 return result;
}
async function readPublicPage(url){
 let response;
 try{
  response=await fetch(url,{
   method:"GET",cache:"no-store",redirect:"manual",
   headers:{"Accept":"text/html","User-Agent":"HeroconPublicMetadataPilot/1.0"},
   signal:AbortSignal.timeout(12000)
  });
 }catch(error){return {status:"network_error",reason:error instanceof Error?error.name:"UNKNOWN"};}
 if([401,403,429].includes(response.status))return {status:"access_restricted",httpStatus:response.status};
 if(response.status>=300&&response.status<400)return {status:"redirected",httpStatus:response.status};
 if(!response.ok)return {status:"http_error",httpStatus:response.status};
 if(!(response.headers.get("content-type")||"").includes("text/html"))return {status:"non_html",httpStatus:response.status};
 if(Number(response.headers.get("content-length")||0)>MAX_BYTES)return {status:"page_too_large",httpStatus:response.status};
 const reader=response.body?.getReader();
 if(!reader)return {status:"empty",httpStatus:response.status};
 let html="",bytes=0;
 const decoder=new TextDecoder();
 try{
  while(true){
   const {done,value}=await reader.read();
   if(done)break;
   bytes+=value.byteLength;
   if(bytes>MAX_BYTES)return {status:"page_too_large",httpStatus:response.status};
   html+=decoder.decode(value,{stream:true});
  }
 }finally{await reader.cancel().catch(()=>{});}
 return {...parsePublicMetadata(html,url),httpStatus:response.status,bytes};
}
async function main(){
 const rows=await candidates();
 const results=[];
 for(let i=0;i<rows.length;i++){
  const row=rows[i];
  const outcome=await readPublicPage(row.url);
  results.push({...row,...outcome});
  console.log(JSON.stringify({collection:row.collection,marketplace:row.marketplace,
   status:outcome.status,httpStatus:outcome.httpStatus||null,
   fields:outcome.fields||[],bytes:outcome.bytes||0}));
  if(i<rows.length-1)await delay(WAIT_MS);
 }
 const out=resolve("tmp/public-marketplace-pilot-results.json");
 await mkdir(resolve("tmp"),{recursive:true});
 await writeFile(out,JSON.stringify({checkedAt:new Date().toISOString(),results},null,2));
 console.log("No-login verified product pages: "+results.filter(r=>r.status==="public_metadata").length+"/"+results.length);
 // Failed public pages are a valid pilot outcome. Never retry blocked pages in bulk.
}
if(process.argv[1]?.endsWith("/probe-public-marketplace.mjs"))main().catch(e=>{console.error(e);process.exitCode=1;});
