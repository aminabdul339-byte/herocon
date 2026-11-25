import type {NextConfig} from "next";

/*
 * Default-deny browser policy. Next.js App Router emits inline bootstrapping
 * scripts, so script-src still permits inline code; a future nonce-based CSP
 * would tighten this further but requires testing every rendered route.
 * External supplier images are intentional and require HTTPS.
 */
const policy=[
 "default-src 'self'",
 "base-uri 'self'",
 "object-src 'none'",
 "frame-ancestors 'none'",
 "form-action 'self'",
 "script-src 'self' 'unsafe-inline'",
 "style-src 'self' 'unsafe-inline'",
 "img-src 'self' data: blob: https:",
 "font-src 'self' data:",
 "connect-src 'self' https://*.vercel-insights.com https://vitals.vercel-insights.com",
 "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
 "upgrade-insecure-requests"
].join("; ");
const securityHeaders=[
 {key:"Content-Security-Policy",value:policy},
 {key:"X-Content-Type-Options",value:"nosniff"},
 {key:"X-Frame-Options",value:"DENY"},
 {key:"Referrer-Policy",value:"strict-origin-when-cross-origin"},
 {key:"Permissions-Policy",value:"camera=(), microphone=(), geolocation=()"},
 {key:"Strict-Transport-Security",value:"max-age=31536000; includeSubDomains"},
 {key:"X-Permitted-Cross-Domain-Policies",value:"none"}
];
const nextConfig:NextConfig={
 images:{unoptimized:true},
 experimental:{serverActions:{bodySizeLimit:"1mb"}},
 poweredByHeader:false,
 // Raw catalogue imports are server-read data, not public download endpoints.
 async redirects(){return ["herocon-current-catalogue.json","herocon-linked-products-only.json","herocon-makeup-brushes-20261119.json","herocon-nails-20261118.json","herocon-next-catalogue.json","herocon-products-import.example.json","herocon-verified-marketplace-links.json","herocon-wigs-20261118.json"].map(file=>({source:"/"+file,destination:"/membership",permanent:false}));},
 async headers(){
  return [
   {source:"/:path*",headers:securityHeaders},
   {source:"/api/:path*",headers:[
    {key:"X-Content-Type-Options",value:"nosniff"},
    {key:"X-Frame-Options",value:"DENY"},
    {key:"Referrer-Policy",value:"no-referrer"},
    {key:"Cache-Control",value:"no-store"}
   ]}
  ];
 }
};
export default nextConfig;
