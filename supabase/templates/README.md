# Supabase e-posta şablonları

Supabase Dashboard → Authentication → Emails → Templates altına yapıştırılır.
Giriş kodla yapıldığı için şablonlarda link yok, yalnızca `{{ .Token }}` var:
e-posta güvenlik tarayıcıları linklere önceden tıklayıp tek kullanımlık girişi
harcayamaz.

| Şablon (Dashboard) | Dosya | Konu |
|---|---|---|
| Confirm signup | `confirm-signup.html` | Stüdyom giriş kodun: {{ .Token }} |
| Magic Link | `magic-link.html` | Stüdyom giriş kodun: {{ .Token }} |
| Change Email Address | `change-email.html` | E-posta değişikliğini onayla |
| Reauthentication | `reauthentication.html` | Stüdyom doğrulama kodun |

Invite user ve Reset Password kullanılmıyor (davet ve şifre yok).
Metinler 1 saatlik kod süresini varsayar (Authentication → Providers → Email → Email OTP Expiration: 3600).
