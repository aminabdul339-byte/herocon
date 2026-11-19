# Herocon legal pages: operational launch review
Drafts published: 19 November 2026. These are original, Herocon-specific drafts, not verbatim Doppel.fit policies or legal advice.

## Pages
- /privacy-policy — based on currently inspected code: browser-local cart/saved lists, Vercel infrastructure, BuckyDrop supplier lookup, public saved product-link searches, third-party imagery and support/reporting emails.
- /terms-and-conditions — product discovery only; no Herocon direct consumer sales yet.
- /cookie-settings — functional local preference record and local-cart/saved-items clearing; no optional analytics currently present in app code, so no misleading accept-all switch.
- /ip — prepared email report for copyright/trademark content.
- /dsa — prepared email report for allegedly illegal content under EU law, without claiming DSA compliance or territorial scope.
- /imprint — acknowledges missing verified legal operator information.

## Must complete before public promotion
1. Supply and verify legal operator's name, form (sole trader/company), geographical business or service address, company registration/VAT details if applicable, required public business contact channels; then update /imprint, /privacy-policy and terms. A hidden mailto link alone may not satisfy all disclosure duties.
2. Confirm UK GDPR controller, lawful bases, processors, international-transfer arrangements, accurate retention periods, processing inventory, data-request handling and incident response; complete Privacy Policy before paid orders.
3. Confirm whether DSA applies, based on nature of service and EU targeting; if it does, a mailto draft workflow may not satisfy notice acknowledgement, decision, transparency and complaint obligations. Implement a durable reporting queue and operator process.
4. Decide IP notice processing, takedown and appeals procedures. Ensure inbox is monitored and report records are handled securely.
5. Review whether any additional hosting/CDN/analytics cookies are active in deployed production and add consent-gated scripts if optional tracking is introduced. The page's controls reflect the code reviewed, not an exhaustive third-party cookie audit.
6. When Stripe paid checkout, customer accounts, order processing, shipping, payment emails or new analytics launch, revise terms/privacy and document consumer rights, refunds, payments, data flows.
7. Have a UK qualified legal/privacy professional review these drafts before relying on them as compliance evidence.

The public site currently links to the existing support mailto address without displaying the address in page body text. The underlying email address remains discoverable in page links and source code.
