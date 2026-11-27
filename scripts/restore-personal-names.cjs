const fs=require("node:fs");
const {get}=require("@vercel/blob");
async function main(){
 if(process.env.VERCEL_ENV!=="production"){console.log("[personal-name-restore] production snapshot only");return;}
 if(!process.env.BLOB_READ_WRITE_TOKEN)throw Error("Previous personal names storage is not configured");
 const b=await get("catalogue/detail-name-index/v2/names.json",{access:"private"});
 if(!b||b.statusCode!==200||!b.stream)throw Error("Previous name snapshot unavailable");
 const x=JSON.parse(await new Response(b.stream).text());
 if(x.version!==1||!x.summary?.complete||!x.personal||typeof x.personal!=="object"||Object.keys(x.personal).length<1000)throw Error("Previous name snapshot incomplete");
 const rows=Object.create(null);
 for(const [id,r] of Object.entries(x.personal)){
  if(r&&typeof r.title==="string"&&typeof r.url==="string"&&typeof r.image==="string"&&typeof r.status==="string")rows[id]={url:r.url,image:r.image,title:r.title,status:r.status};
 }
 if(Object.keys(rows).length!==Object.keys(x.personal).length)throw Error("Previous personal names invalid");
 fs.writeFileSync("data/previous-personal-names.json",JSON.stringify(rows));
 console.log("[personal-name-restore] preserved "+Object.keys(rows).length+" names from the pre-original-title release");
}
main().catch(e=>{console.error("[personal-name-restore]",e.message);process.exitCode=1;});
