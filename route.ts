import { NextResponse } from "next/server";
const DEFAULT_REFERRAL="https://m.sugargoo.com/register?memberId=3603566965386341407";
export async function GET(){const destination=process.env.SUGARGOO_REFERRAL_URL||DEFAULT_REFERRAL;return NextResponse.redirect(destination,302);}
