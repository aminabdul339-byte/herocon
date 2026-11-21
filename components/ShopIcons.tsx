/** Neutral, scalable line icons: no emoji rendering across platforms. */
export function ExternalArrowIcon(){
 return <svg className="hc-external-arrow-icon" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
  <path d="M7 17 17 7M8 7h9v9"/>
 </svg>;
}

export function ShopCategoryIcon({category}:{category:string}){
 const shared={viewBox:"0 0 24 24",width:24,height:24,fill:"none",stroke:"currentColor",strokeWidth:1.65,strokeLinecap:"round" as const,strokeLinejoin:"round" as const,"aria-hidden":true as const,focusable:"false" as const};
 if(category==="Bags")return <svg {...shared}><path d="M4 9h16l-1.1 12H5.1L4 9Z"/><path d="M8 9V7a4 4 0 0 1 8 0v2"/><path d="M4 12h16"/></svg>;
 if(category==="Sunglasses")return <svg {...shared}><path d="M2 11h3l1.1-1.8h3c1.7 0 2.8.8 3 2.5M22 11h-3l-1.1-1.8h-3c-1.7 0-2.8.8-3 2.5"/><path d="M4.4 11c0 4 1.6 5.5 4.2 5.5s4.2-1.5 4.2-5.5M12.8 11c0 4 1.6 5.5 4.2 5.5s4.2-1.5 4.2-5.5"/></svg>;
 if(category==="Clothing")return <svg {...shared}><path d="m8 3-5 2-2 5 4 2 2-3v12h10V9l2 3 4-2-2-5-5-2c-.6 1.6-1.9 2.5-4 2.5S8.6 4.6 8 3Z"/></svg>;
 if(category==="Watches")return <svg {...shared}><rect x="7" y="7" width="10" height="10" rx="4"/><path d="M9 7V2h6v5M9 17v5h6v-5M12 9.5V12l2 1.5"/></svg>;
 if(category==="Jewellery")return <svg {...shared}><path d="M7 4h10l5 6-10 11L2 10l5-6Z"/><path d="M2 10h20M7 4l2 6 3 11 3-11 2-6"/></svg>;
 if(category==="Sportswear")return <svg {...shared}><path d="m8 3-5 2-2 5 4 2 2-3v12h10V9l2 3 4-2-2-5-5-2-4 4-4-4Z"/><path d="M9 15h6M12 8v13"/></svg>;
 if(category==="Shoes")return <svg {...shared}><path d="M3 13.5c2.3-.3 4-2.7 5-6.7l4 1.2 1.7 4.1c1.5.8 3.5 1.4 5.6 1.8 1.2.3 1.7 1 1.7 2.3v2.6H3c-.8 0-1.5-.7-1.5-1.5v-2.2c0-.9.5-1.5 1.5-1.6Z"/><path d="M3 16.5h18M9 10l3 1.2M8 12l3.3 1.3"/></svg>;
 if(category==="Tops")return <svg {...shared}><path d="m8 3-5 2-2 5 4 2 2-3v12h10V9l2 3 4-2-2-5-5-2c-.6 1.6-1.9 2.5-4 2.5S8.6 4.6 8 3Z"/></svg>;
 if(category==="Bottoms & shorts")return <svg {...shared}><path d="M6 3h12l1.3 18h-6.2L12 11l-1.1 10H4.7L6 3Z"/><path d="M6 7h12M12 7v4"/></svg>;
 if(category==="Jackets & coats")return <svg {...shared}><path d="M8 3 4 5 2 11l4 1 1-3v12h10V9l1 3 4-1-2-6-4-2-4 4-4-4Z"/><path d="m8 3 4 5 4-5M12 8v13M9 11h1M14 11h1"/></svg>;
 if(category==="Accessories")return <svg {...shared}><path d="M2 11h2l1-1.5c.5-.8 1.4-1 2.3-1h2.2c1.2 0 2 .6 2.5 1.5.5-.9 1.3-1.5 2.5-1.5h2.2c.9 0 1.8.2 2.3 1l1 1.5h2"/><path d="M4 11c0 4 1.5 5.7 4.8 5.7s4.7-1.7 4.7-5.7M13.5 11c0 4 1.5 5.7 4.7 5.7S23 15 23 11"/><path d="M10.8 10.5h2.4"/></svg>;
 return <svg {...shared}><rect x="3" y="3" width="7" height="7" rx="1.1"/><rect x="14" y="3" width="7" height="7" rx="1.1"/><rect x="3" y="14" width="7" height="7" rx="1.1"/><rect x="14" y="14" width="7" height="7" rx="1.1"/></svg>;
}
