import {NextResponse} from "next/server";

export const dynamic = "force-dynamic";

// Public central-bank reference feed, not a payment or checkout conversion rate.
export async function GET() {
 try {
  const response = await fetch("https://api.frankfurter.dev/v2/rate/CNY/GBP", {
   next: {revalidate: 21600},
   signal: AbortSignal.timeout(8000)
  });
  if (!response.ok) throw new Error("FX provider unavailable");
  const data: unknown = await response.json();
  if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error("Invalid FX response");
  const rate = (data as Record<string,unknown>).rate;
  const date = (data as Record<string,unknown>).date;
  const base = (data as Record<string,unknown>).base;
  const quote = (data as Record<string,unknown>).quote;
  if (base !== "CNY" || quote !== "GBP" || typeof rate !== "number" || !Number.isFinite(rate)
   || rate <= 0.01 || rate >= 0.5 || typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error("Unexpected exchange rate");
  }
  return NextResponse.json({base:"CNY",quote:"GBP",rate,date,source:"Frankfurter reference rates"}, {
   headers: {"Cache-Control":"public, s-maxage=1800, stale-while-revalidate=3600"}
  });
 } catch {
  return NextResponse.json({error:"GBP reference conversion unavailable"}, {
   status:503,headers:{"Cache-Control":"no-store"}
  });
 }
}