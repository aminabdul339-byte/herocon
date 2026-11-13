(() => {
 const text=x=>typeof x==="string"?x.trim():"";
 const meta=(...selectors)=>selectors.map(s=>document.querySelector(s)?.getAttribute("content")).find(Boolean)||"";
 const cleanPrice=v=>{const s=text(String(v??"")).replace(/,/g,"");const m=s.match(/(?:¥|￥|CNY|RMB)?\s*(\d+(?:\.\d{1,2})?)/i);return m?m[1]:null};
 const scripts=[...document.querySelectorAll('script[type="application/ld+json"]')].flatMap(s=>{try{const j=JSON.parse(s.textContent);return Array.isArray(j)?j:[j]}catch{return[]}});
 const walk=o=>{if(!o||typeof o!=="object")return[];return [o,...(Array.isArray(o["@graph"])?o["@graph"].flatMap(walk):[])]};
 const product=scripts.flatMap(walk).find(x=>(Array.isArray(x["@type"])?x["@type"]:[x["@type"]]).includes("Product"))||{};
 const offer=Array.isArray(product.offers)?product.offers[0]:product.offers||{};
 const seller=offer.seller||product.seller||{};
 const shopName=typeof seller==="string"?seller:seller.name;
 const title=text(product.name)||meta('meta[property="og:title"]')||text(document.querySelector("h1")?.innerText)||text(document.title);
 const image=text(typeof product.image==="string"?product.image:Array.isArray(product.image)?product.image[0]:"")||meta('meta[property="og:image"]');
 const price=cleanPrice(offer.price||offer.lowPrice||meta('meta[property="product:price:amount"]','meta[itemprop="price"]'));
 const currency=text(offer.priceCurrency)||meta('meta[property="product:price:currency"]','meta[itemprop="priceCurrency"]')||(price?"CNY":"");
 const category=text(product.category)||meta('meta[property="product:category"]');
 const description=text(product.description)||meta('meta[name="description"]');
 const candidates=[...document.querySelectorAll("a[href]")].filter(a=>/shop|seller|store|店铺|进店/i.test(a.innerText||"")).slice(0,5);
 const sellerLink=candidates.map(a=>a.href).find(h=>/^https:\/\//.test(h))||"";
 const variantTexts=[...document.querySelectorAll('[class*="sku"] [class*="item"],[class*="variant"] [class*="item"]')].map(x=>text(x.innerText)).filter(x=>x&&x.length<90).slice(0,30);
 const canonical=location.href.split("#")[0];
 return {url:canonical,title,imageUrl:image,price,currency:currency||null,sellerName:text(shopName)||null,sellerUrl:sellerLink||null,category:category||null,description:description||null,variants:[...new Set(variantTexts)],capturedAt:new Date().toISOString(),source:"visible-page-structured-data",requiresReview:true};
})()