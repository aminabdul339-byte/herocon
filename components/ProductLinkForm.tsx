import {ArrowIcon} from "@/components/ArrowIcon";
export default function ProductLinkForm({defaultValue="",compact=false}:{defaultValue?:string;compact?:boolean}){
 return <div className={"hc-link-search"+(compact?" hc-link-search-compact":"")}>
   <form action="/find-product" method="get" className="hc-link-search-form">
    <label htmlFor={compact?"hc-link-compact":"hc-link-full"}>Marketplace product link</label>
    <div className="hc-link-search-bar">
     <span aria-hidden="true"><ArrowIcon/></span>
     <input
      id={compact?"hc-link-compact":"hc-link-full"}
      name="url"
      type="url"
      inputMode="url"
      autoComplete="url"
      maxLength={700}
      placeholder="Paste a 1688, Taobao, Tmall or Weidian product URL"
      defaultValue={defaultValue}
      aria-label="Paste a Chinese marketplace product link"
      required
     />
     <button type="submit">Find product</button>
    </div>
   </form>
 </div>;
}