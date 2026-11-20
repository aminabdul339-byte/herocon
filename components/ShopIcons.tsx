/** Neutral, scalable line icons: no emoji rendering across platforms. */
export function ExternalArrowIcon(){
 return <svg className="hc-external-arrow-icon" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
  <path d="M7 17 17 7M8 7h9v9"/>
 </svg>;
}

export function ShopCategoryIcon({category}:{category:string}){
 const shared={viewBox:"0 0 24 24",width:24,height:24,fill:"none",stroke:"currentColor",strokeWidth:1.65,strokeLinecap:"round" as const,strokeLinejoin:"round" as const,"aria-hidden":true as const,focusable:"false" as const};
 if(category==="Shoes")return <svg {...shared}><path d="M3 13.5c2.3-.3 4-2.7 5-6.7l4 1.2 1.7 4.1c1.5.8 3.5 1.4 5.6 1.8 1.2.3 1.7 1 1.7 2.3v2.6H3c-.8 0-1.5-.7-1.5-1.5v-2.2c0-.9.5-1.5 1.5-1.6Z"/><path d="M3 16.5h18M9 10l3 1.2M8 12l3.3 1.3"/></svg>;
 if(category==="Tops")return <svg {...shared}><path d="m8 3-5 2-2 5 4 2 2-3v12h10V9l2 3 4-2-2-5-5-2c-.6 1.6-1.9 2.5-4 2.5S8.6 4.6 8 3Z"/></svg>;
 if(category==="Bottoms & shorts")return <svg {...shared}><path d="M6 3h12l1.3 18h-6.2L12 11l-1.1 10H4.7L6 3Z"/><path d="M6 7h12M12 7v4"/></svg>;
 if(category==="Jackets & coats")return <svg {...shared}><path d="M8 3 4 5 2 11l4 1 1-3v12h10V9l1 3 4-1-2-6-4-2-4 4-4-4Z"/><path d="m8 3 4 5 4-5M12 8v13M9 11h1M14 11h1"/></svg>;
 if(category==="Accessories")return <svg {...shared}><path d="M2 11h2l1-1.5c.5-.8 1.4-1 2.3-1h2.2c1.2 0 2 .6 2.5 1.5.5-.9 1.3-1.5 2.5-1.5h2.2c.9 0 1.8.2 2.3 1l1 1.5h2"/><path d="M4 11c0 4 1.5 5.7 4.8 5.7s4.7-1.7 4.7-5.7M13.5 11c0 4 1.5 5.7 4.7 5.7S23 15 23 11"/><path d="M10.8 10.5h2.4"/></svg>;
 return <svg {...shared}><rect x="3" y="3" width="7" height="7" rx="1.1"/><rect x="14" y="3" width="7" height="7" rx="1.1"/><rect x="3" y="14" width="7" height="7" rx="1.1"/><rect x="14" y="14" width="7" height="7" rx="1.1"/></svg>;
}
