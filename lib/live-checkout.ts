import "server-only";

/**
 * No flag is switched on by deploying code. Missing merchant attestations
 * intentionally keep customer charges and supplier writes disabled.
 */
export function checkoutLaunchReadiness(){
 const checks=[
  ["Live checkout explicitly enabled",process.env.HEROCON_STRIPE_LIVE_CHECKOUT_ENABLED==="true"],
  ["Fresh rotated Stripe live key attested",process.env.HEROCON_STRIPE_KEY_ROTATED==="true"],
  ["Stripe live secret installed",(process.env.STRIPE_LIVE_SECRET_KEY||"").startsWith("sk_live_")],
  ["Read-only Stripe account verification enabled",process.env.HEROCON_STRIPE_LIVE_CONNECTIVITY_ENABLED==="true"],
  ["Independent Stripe account-verification admin key installed",(process.env.HEROCON_STRIPE_LIVE_ADMIN_KEY||"").length>=32],
  ["Stripe live webhook signing enabled",process.env.HEROCON_STRIPE_LIVE_WEBHOOK_ENABLED==="true"&&(process.env.STRIPE_LIVE_WEBHOOK_SECRET||"").startsWith("whsec_")],
  ["Supplier submission enabled",process.env.HEROCON_ORDER_SUBMISSION_ENABLED==="true"],
  ["Private supplier handoff secret installed",(process.env.HEROCON_INTERNAL_FULFILMENT_KEY||"").length>=32],
  ["Merchant confirmed BuckyDrop manual-payment account mode",process.env.HEROCON_BUCKYDROP_MANUAL_PAYMENT_CONFIRMED==="true"],
  ["Shipping currency and seller pricing reviewed",process.env.HEROCON_FREIGHT_CURRENCY_CONFIRMED==="true"],
  ["Legal business, shipping and refund terms approved",process.env.HEROCON_CHECKOUT_POLICIES_APPROVED==="true"],
  ["Merchant checkout key installed",(process.env.HEROCON_CHECKOUT_ADMIN_KEY||"").length>=32],
  ["Private order storage installed",!!process.env.BLOB_READ_WRITE_TOKEN],
  ["BuckyDrop live configured",process.env.BUCKYDROP_ENV==="live"&&!!process.env.BUCKYDROP_APP_CODE&&!!process.env.BUCKYDROP_APP_SECRET],
  ["Transactional order email configured",(process.env.RESEND_API_KEY||"").startsWith("re_")&&
    !!process.env.HEROCON_ORDER_EMAIL_FROM&&!!process.env.HEROCON_ORDER_ALERT_EMAIL]
 ] as const;
 const missing=checks.filter(([,ok])=>!ok).map(([label])=>label);
 return {enabled:missing.length===0,missing};
}
