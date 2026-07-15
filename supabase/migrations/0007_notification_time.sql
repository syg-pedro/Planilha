alter table household_settings
  add column if not exists notification_time text not null default '09:00';
