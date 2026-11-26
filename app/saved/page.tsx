import {redirect} from "next/navigation";
// Saved-product UI retired; stored account records are not deleted.
export default function SavedRedirect(){redirect("/search");}
