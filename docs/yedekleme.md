# Veritabanı yedeği

Her gece 03:00'te (Türkiye saati) GitHub Actions production veritabanının dökümünü alır, şifreler ve 30 gün saklar. Workflow dosyası: `.github/workflows/db-backup.yml`.

## Kurulum (bir kez)

GitHub'da depo → **Settings → Secrets and variables → Actions → New repository secret**:

| Ad | Değer |
|---|---|
| `SUPABASE_DB_URL` | Supabase → **Connect** → **Session pooler** bağlantı adresi (port 5432), şifresi içinde. Direct connection GitHub'dan çalışmaz. |
| `BACKUP_PASSPHRASE` | Uzun, rastgele bir parola. Bir kopyasını parola yöneticine kaydet. Bu parola olmadan yedekler açılmaz. |

Sonra **Actions → Database backup → Run workflow** ile bir kez elle çalıştır. İş yeşil bitince alttaki **Artifacts** bölümünde `studyom-YYYY-AA-GG` dosyası görünür.

## Geri yükleme

1. Actions'tan istediğin günün dosyasını indir ve zip'ten çıkar.
2. Şifreyi çöz:

   ```bash
   gpg --decrypt --output studyom.dump studyom-YYYY-AA-GG.dump.gpg
   ```

3. Önce içeriğe bak (hiçbir şeye yazmaz):

   ```bash
   pg_restore --list studyom.dump | head
   ```

4. Geri yükleme hedefi **boş, yeni bir Supabase projesi** olmalı; çalışan production veritabanının üzerine yükleme. Yeni projede `pnpm db:migrate` çalıştırmadan, verileri yükle:

   ```bash
   pg_restore --dbname "<yeni projenin session pooler adresi>" --no-owner --no-privileges --data-only --schema=auth studyom.dump
   pg_restore --dbname "<yeni projenin session pooler adresi>" --no-owner --no-privileges --schema=public studyom.dump
   ```

   Sonra uygulamanın `DATABASE_URL` ve Supabase anahtarlarını yeni projeye çevir.

Ayda bir, dosyalardan birini indirip 2. ve 3. adımı denemek yedeğin gerçekten açıldığını gösterir.
