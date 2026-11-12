"use client";
import { useEffect, useMemo, useState } from "react";
export default function ProductGallery({ title, images, variantImage }: { title: string; images: string[]; variantImage?: string }) {
  const all = useMemo(() => [...new Set([variantImage, ...images].filter((x): x is string => Boolean(x)))], [images, variantImage]);
  const [active, setActive] = useState(all[0]);
  useEffect(() => { if (variantImage) setActive(variantImage); else if (!active && all[0]) setActive(all[0]); }, [variantImage, all, active]);
  if (!active) return <div className="gallery-main no-image">Image coming soon</div>;
  return <div className="gallery"><div className="gallery-main"><img src={active} alt={title}/><span className="gallery-count">{Math.max(1, all.indexOf(active) + 1)} / {all.length}</span></div>{all.length > 1 && <div className="gallery-thumbs" aria-label="Product images">{all.slice(0, 12).map((src, i) => <button type="button" key={src} className={src === active ? "selected" : ""} onClick={() => setActive(src)} aria-label={`View image ${i + 1}`} aria-pressed={src === active}><img src={src} alt=""/></button>)}</div>}</div>;
}
