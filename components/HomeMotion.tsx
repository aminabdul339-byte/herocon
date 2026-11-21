"use client";
import {useEffect} from "react";

/** Subtle, progressive-enhancement-only motion. The page remains readable without JS. */
export default function HomeMotion(){
 useEffect(()=>{
  const root=document.querySelector<HTMLElement>(".eh-home");
  if(!root)return;
  const prefersReducedMotion=window.matchMedia("(prefers-reduced-motion: reduce)");
  if(prefersReducedMotion.matches)return;
  const elements=Array.from(root.querySelectorAll<HTMLElement>("[data-eh-reveal]"));
  if(!("IntersectionObserver" in window))return;
  const observer=new IntersectionObserver(entries=>{
   for(const entry of entries){
    if(entry.isIntersecting){
     entry.target.classList.add("eh-is-visible");
     observer.unobserve(entry.target);
    }
   }
  },{rootMargin:"0px 0px -34px 0px",threshold:0.06});
  // Start observing before enabling transitions to avoid hiding the whole page.
  elements.forEach(el=>observer.observe(el));
  root.classList.add("eh-motion-on");
  let frame=0;
  const update=()=>{
   frame=0;
   if(window.innerWidth<900)return;
   const image=root.querySelector<HTMLElement>(".eh-hero-photo");
   if(!image)return;
   const value=Math.min(25,Math.max(0,window.scrollY*0.075));
   image.style.setProperty("--eh-photo-shift",value+"px");
  };
  const onScroll=()=>{if(!frame)frame=window.requestAnimationFrame(update);};
  window.addEventListener("scroll",onScroll,{passive:true});
  update();
  return ()=>{
   observer.disconnect();
   window.removeEventListener("scroll",onScroll);
   if(frame)window.cancelAnimationFrame(frame);
   root.classList.remove("eh-motion-on");
  };
 },[]);
 return null;
}
