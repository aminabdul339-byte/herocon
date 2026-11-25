import {CustomerAuthError} from "@/lib/customer-auth";
export function publicEmailError(e:unknown,flow:string){
 if(!(e instanceof CustomerAuthError))return {status:503,error:"Email verification is temporarily unavailable. Please try again."};
 const code=e.code||"unknown";
 // No email, token, password or raw provider message in logs.
 console.warn("herocon-email-auth",{flow,status:e.status,code});
 if(e.status===429||code==="over_email_send_rate_limit")return {status:429,error:"Too many email requests. Wait a minute before requesting another email. If the problem continues, try again later."};
 if(code==="email_address_not_authorized"||code==="email_provider_disabled"||/email address not authorized|error sending|smtp/i.test(e.message))return {status:503,error:"Our email delivery service could not send your verification email. Please try again later or contact support."};
 if(code==="otp_expired"||code==="invalid_otp"||flow==="verify"&&e.status===403)return {status:400,error:"The verification code is incorrect or expired. Request a new email and try again."};
 return {status:e.status,error:e.status>=500?"Email delivery is temporarily unavailable. Please try again later.":"Email verification could not be completed. Check your details and try again."};
}
