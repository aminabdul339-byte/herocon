import {NextResponse} from "next/server";
import {currentCustomer} from "@/lib/customer-auth";
import {customerRequests} from "@/lib/quote-requests";

export const dynamic="force-dynamic";
export const runtime="nodejs";
const headers={"Cache-Control":"private, no-store","Vary":"Cookie","X-Content-Type-Options":"nosniff"};

export async function GET(){
 const customer=await currentCustomer();
 if(!customer)return NextResponse.json({error:"Sign in to see your quote requests."},{status:401,headers});
 if(!process.env.BLOB_READ_WRITE_TOKEN)return NextResponse.json({error:"Quote history is temporarily unavailable."},{status:503,headers});
 try{
  const rows=await customerRequests(customer.id,40);
  // Every row has already been scoped to the signed-in customer on the server.
  // Do not return stored customer email, product source URLs or another user's notes.
  const requests=rows.map(row=>({
   id:row.id,createdAt:row.createdAt,reviewState:row.reviewState,
   reviewNote:row.reviewNote,reviewedAt:row.reviewedAt,
   itemCount:row.lines.length,unitCount:row.lines.reduce((sum,line)=>sum+line.quantity,0),
   paymentStatus:row.paymentStatus
  }));
  return NextResponse.json({requests},{headers});
 }catch{
  return NextResponse.json({error:"Quote history could not be loaded."},{status:503,headers});
 }
}
