import {NextResponse} from "next/server";
import {currentCustomer,accountOriginValid} from "@/lib/customer-auth";
import {customerRequests,createCustomerRequest,QuoteRequestError} from "@/lib/quote-requests";

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

export async function POST(request:Request){
 const customer=await currentCustomer();
 if(!customer)return NextResponse.json({error:"Sign in before requesting a quote."},{status:401,headers});
 if(!accountOriginValid(request))return NextResponse.json({error:"Submit requests from Herocon."},{status:403,headers});
 if(!(request.headers.get("content-type")||"").startsWith("application/json"))
  return NextResponse.json({error:"JSON required."},{status:415,headers});
 let input:unknown;
 try{
  const raw=await request.text();
  if(raw.length>12000)return NextResponse.json({error:"Request too large."},{status:413,headers});
  input=JSON.parse(raw);
 }catch{return NextResponse.json({error:"Invalid quote request."},{status:400,headers});}
 try{
  // Does not create an order, reserve inventory, make a provider API request or charge a card.
  const quote=await createCustomerRequest(input,customer);
  return NextResponse.json({id:quote.id,createdAt:quote.createdAt,status:"received",paymentStatus:"no_payment_requested"},{
   status:201,headers
  });
 }catch(error){
  return NextResponse.json({error:error instanceof QuoteRequestError?error.message:"Unable to save quote request."},{
   status:error instanceof QuoteRequestError?error.status:503,headers
  });
 }
}
