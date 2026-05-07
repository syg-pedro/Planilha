# Seed notes

The app seeds data automatically at runtime when the `household_settings` table is empty.
Source file: `dados.txt`.

If you use Supabase:
1. Run migration `supabase/migrations/0001_init.sql`.
2. Set `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` in `.env`.
3. Start app and call `/api/bootstrap?key=<EDIT_KEY>` once.
