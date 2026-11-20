/**
 * Herocon design invariant: our own UI must use scalable icons, not emoji glyphs.
 * Run automatically before every Next.js build, including Vercel deployments.
 * Imported supplier data is normalised separately by lib/emoji-free.ts.
 */
import {readdir,readFile} from "node:fs/promises";
import path from "node:path";
const scanDirs=["app","components","lib"];
const extensions=new Set([".tsx",".ts",".jsx",".js",".css"]);
const forbidden=/[\p{Emoji_Presentation}\uFE0F\u2600-\u27BF]/gu;
let violations=0;
async function scan(dir){
  for(const entry of await readdir(dir,{withFileTypes:true})){
    const file=path.join(dir,entry.name);
    if(entry.isDirectory()){if(!entry.name.startsWith(".")&&entry.name!=="node_modules")await scan(file);continue;}
    if(!extensions.has(path.extname(entry.name)))continue;
    const lines=(await readFile(file,"utf8")).split("\n");
    for(let i=0;i<lines.length;i++){
      const matches=[...lines[i].matchAll(forbidden)];
      if(matches.length){
        violations++;
        console.error(file+":"+(i+1)+": replace decorative characters with SVG/CSS icons ("+[...new Set(matches.map(m=>m[0]))].join(" ")+")");
      }
    }
  }
}
for(const dir of scanDirs)await scan(dir);
if(violations){console.error("Emoji-free UI check failed on "+violations+" lines.");process.exitCode=1;}
else console.log("Emoji-free UI check passed.");
