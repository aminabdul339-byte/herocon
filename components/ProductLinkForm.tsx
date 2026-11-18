export default function ProductLinkForm({defaultValue="",compact=false}:{defaultValue?:string;compact?:boolean}){
 return <div className={"hc-link-search"+(compact?" hc-link-search-compact":"")}>
   <form action="/find-product" method="get" className="hc-link-search-form">
    <label htmlFor={compact?"hc-link-compact":"hc-link-full"}>Have a product link? Search it on Herocon</label>
    <div className="hc-link-search-bar">
     <span aria-hidden="true">↗</span>
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
     <button type="submit">Find product <span aria-hidden="true">↗</span></button>
    </div>
   </form>
   <p>Search a product even if it isn't in the Herocon catalogue. Full original marketplace links only. Successful searches may be saved to Herocon's public catalogue.</p>
 </div>;
}