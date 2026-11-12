# Release gate

Must pass in the complete repository before production:
1. npm install
2. npm run build
3. homepage -> product
4. product -> seller
5. product -> recommendation
6. product with sugargooProductUrl -> exact Sugargoo item
7. product without sugargooProductUrl -> no misleading purchase redirect
8. signup -> referral registration route
9. mobile checks at 375px and 430px
