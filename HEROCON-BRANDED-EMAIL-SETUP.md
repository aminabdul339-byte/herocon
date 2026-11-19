# Herocon branded Supabase Auth email setup

Status: custom SMTP is NOT yet activated. Branded templates are prepared for a merchant to paste into Supabase Auth > Email Templates.

Intended From: Herocon <no-reply@herocon.store>
Signup subject: Welcome to Herocon — confirm your email
Password reset subject: Reset your Herocon password

1. Create a Resend account at https://resend.com/signup and add herocon.store under Domains. Obtain the exact verification DNS records.
2. The herocon.store DNS is managed by the Vercel team aminabdul339-4573s-projects. After Resend provides records, enter the exact SPF/DKIM/MX records. Do not guess or overwrite existing SPF/mail routing.
3. Create a Resend sending API key. Keep it private and never share in chat or GitHub.
4. Open Supabase project qwthqnvkusuneifieykr, Authentication > SMTP Settings and enable Custom SMTP:
    Sender name: Herocon
    Sender email: no-reply@herocon.store
    Host: smtp.resend.com
    Port: 465 (TLS) or 587 (STARTTLS)
    Username: resend
    Password: private Resend sending API key (paste directly into Supabase dashboard)
5. In Authentication > Email Templates, replace the Confirm signup HTML using supabase/email-templates/confirm-signup.html and Reset password HTML using supabase/email-templates/reset-password.html.
6. Set confirmation subject to Welcome to Herocon — confirm your email; reset subject to Reset your Herocon password.
7. Confirm Supabase Authentication > URL Configuration has Site URL https://herocon.store and https://herocon.store/** in the redirect allow list.
8. Test a fresh registration and password reset. Verify the From header is Herocon <no-reply@herocon.store>, the links confirm identity in Herocon and saved pending cart selections return.

Important: custom SMTP is required to change the real From address. The Supabase default is restricted and not suitable for general public production emails.

Sources: https://supabase.com/docs/guides/auth/auth-smtp ; https://supabase.com/docs/guides/auth/auth-email-templates ; https://resend.com/docs/send-with-smtp