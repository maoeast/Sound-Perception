import { DEFAULT_APP_TITLE } from '../config/app-settings'

const DEFAULT_APP_TITLE_SQL = DEFAULT_APP_TITLE.replaceAll("'", "''")

export const SCHEMA_SQL = `
create table if not exists settings (
  id integer primary key,
  teacher_pin_hash text not null,
  app_title text not null default '${DEFAULT_APP_TITLE_SQL}',
  soft_mode_enabled integer not null default 1,
  guided_option_count integer not null default 4,
  guided_option_count_migrated_to_four integer not null default 0,
  fullscreen_enabled integer not null default 1,
  first_run_completed integer not null default 0,
  created_at text not null,
  updated_at text not null
);

create table if not exists assets (
  id text primary key,
  category text not null,
  title text not null,
  image_path text not null,
  audio_path text not null,
  source_type text not null,
  enabled integer not null default 1,
  sort_order integer not null default 0,
  created_at text not null,
  updated_at text not null
);

create table if not exists sessions (
  id text primary key,
  mode text not null,
  category text,
  started_at text not null,
  ended_at text,
  duration_ms integer not null default 0
);

create table if not exists attempts (
  id text primary key,
  session_id text not null,
  target_asset_id text not null,
  candidate_asset_ids_json text not null,
  selected_asset_id text,
  is_correct integer not null,
  answered_at text not null
);

create table if not exists interaction_events (
  id text primary key,
  session_id text not null,
  asset_id text,
  event_type text not null,
  event_at text not null
);
`
