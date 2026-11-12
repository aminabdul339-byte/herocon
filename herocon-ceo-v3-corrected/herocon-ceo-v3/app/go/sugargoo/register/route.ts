import { NextResponse } from "next/server";
export async function GET(){return NextResponse.redirect(process.env.SUGARGOO_REFERRAL_URL || "https://m.sugargoo.com/register?memberId=3603566965386341407",302)}
