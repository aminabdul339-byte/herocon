/** Consistent outline icon for navigation, product, and account actions. */
export type ArrowDirection="up-right"|"right"|"left"|"up"|"down"|"close"|"refresh";
export function ArrowIcon({direction="up-right",className=""}:{direction?:ArrowDirection;className?:string}) {
 const paths:Record<ArrowDirection,string>={
  "up-right":"M5 19 19 5M8 5h11v11",
  "right":"M4 12h16m-7-7 7 7-7 7",
  "left":"M20 12H4m7-7-7 7 7 7",
  "up":"M12 20V4m-7 7 7-7 7 7",
  "down":"M12 4v16m-7-7 7 7 7-7",
  "close":"M5 5l14 14M19 5 5 19",
  "refresh":"M20 4v7h-7M20 11a8 8 0 1 0-2.5 5.8"
 };
 return <svg className={"hc-ui-icon"+(className?" "+className:"")} aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d={paths[direction]}/></svg>;
}
