-- 親子関係テーブル追加
-- Supabase SQL Editor で実行してください

-- 1. family_relations テーブル（親子関係）
create table if not exists family_relations (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references auth.users(id) on delete cascade not null,
  child_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamp with time zone default now(),
  unique(parent_id, child_id)
);

-- RLS有効化
alter table family_relations enable row level security;

-- RLSポリシー: family_relations
-- 親は自分の関係を見れる
create policy "Parents can view own relations" on family_relations
  for select using (auth.uid() = parent_id);

-- 親は関係を作成できる
create policy "Parents can create relations" on family_relations
  for insert with check (auth.uid() = parent_id);

-- 親は関係を削除できる
create policy "Parents can delete relations" on family_relations
  for delete using (auth.uid() = parent_id);

-- 親が子供のデータを見れるようにRLSポリシーを更新

-- user_profiles: 親は子供のプロフィールも見れる
create policy "Parents can view children profiles" on user_profiles
  for select using (
    exists (
      select 1 from family_relations
      where parent_id = auth.uid() and child_id = user_profiles.id
    )
  );

-- scheduled_tasks: 親は子供のスケジュールも見れる
create policy "Parents can view children scheduled_tasks" on scheduled_tasks
  for select using (
    exists (
      select 1 from family_relations
      where parent_id = auth.uid() and child_id = scheduled_tasks.user_id
    )
  );

-- daily_records: 親は子供の記録も見れる
create policy "Parents can view children daily_records" on daily_records
  for select using (
    exists (
      select 1 from family_relations
      where parent_id = auth.uid() and child_id = daily_records.user_id
    )
  );

-- task_templates: 親は子供のテンプレートも見れる
create policy "Parents can view children task_templates" on task_templates
  for select using (
    exists (
      select 1 from family_relations
      where parent_id = auth.uid() and child_id = task_templates.user_id
    )
  );
