-- Kids-schedule データベーススキーマ
-- Supabase SQL Editor で実行してください

-- 1. user_profiles テーブル
create table if not exists user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  role text not null default 'child',
  start_date date,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 2. task_templates テーブル
create table if not exists task_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  category text not null,
  subcategory text not null,
  task_type text,
  default_minutes integer not null default 30,
  is_active boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 3. scheduled_tasks テーブル
create table if not exists scheduled_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  template_id uuid references task_templates(id) on delete set null,
  week_start date not null,
  day_of_week integer not null,
  planned_minutes integer not null,
  category text not null,
  subcategory text not null,
  task_type text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 4. daily_records テーブル
create table if not exists daily_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  scheduled_task_id uuid references scheduled_tasks(id) on delete cascade,
  record_date date not null,
  start_time time,
  end_time time,
  actual_minutes integer,
  is_completed boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- RLS有効化
alter table user_profiles enable row level security;
alter table task_templates enable row level security;
alter table scheduled_tasks enable row level security;
alter table daily_records enable row level security;

-- RLSポリシー: user_profiles
create policy "Users can view own profile" on user_profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on user_profiles
  for update using (auth.uid() = id);

create policy "Users can insert own profile" on user_profiles
  for insert with check (auth.uid() = id);

-- RLSポリシー: task_templates
create policy "Users can manage own task_templates" on task_templates
  for all using (auth.uid() = user_id);

-- RLSポリシー: scheduled_tasks
create policy "Users can manage own scheduled_tasks" on scheduled_tasks
  for all using (auth.uid() = user_id);

-- RLSポリシー: daily_records
create policy "Users can manage own daily_records" on daily_records
  for all using (auth.uid() = user_id);

-- updated_at自動更新用トリガー関数
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- 各テーブルにトリガーを設定
create trigger update_user_profiles_updated_at
  before update on user_profiles
  for each row execute function update_updated_at_column();

create trigger update_task_templates_updated_at
  before update on task_templates
  for each row execute function update_updated_at_column();

create trigger update_scheduled_tasks_updated_at
  before update on scheduled_tasks
  for each row execute function update_updated_at_column();

create trigger update_daily_records_updated_at
  before update on daily_records
  for each row execute function update_updated_at_column();
