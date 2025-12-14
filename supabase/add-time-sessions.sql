-- 時間セッションテーブル追加
-- 1つのdaily_recordに複数の時間セッションを記録できるようにする

-- 1. time_sessions テーブル
create table if not exists time_sessions (
  id uuid primary key default gen_random_uuid(),
  daily_record_id uuid references daily_records(id) on delete cascade not null,
  start_time time not null,
  end_time time,
  minutes integer,
  created_at timestamp with time zone default now()
);

-- RLS有効化
alter table time_sessions enable row level security;

-- RLSポリシー: time_sessions
-- ユーザーは自分の記録に紐づくセッションを管理できる
create policy "Users can manage own time_sessions" on time_sessions
  for all using (
    exists (
      select 1 from daily_records
      where daily_records.id = time_sessions.daily_record_id
      and daily_records.user_id = auth.uid()
    )
  );

-- 親は子供のセッションも見れる
create policy "Parents can view children time_sessions" on time_sessions
  for select using (
    exists (
      select 1 from daily_records dr
      join family_relations fr on fr.child_id = dr.user_id
      where dr.id = time_sessions.daily_record_id
      and fr.parent_id = auth.uid()
    )
  );

-- 親は子供のセッションを追加・更新・削除できる
create policy "Parents can insert children time_sessions" on time_sessions
  for insert with check (
    exists (
      select 1 from daily_records dr
      join family_relations fr on fr.child_id = dr.user_id
      where dr.id = time_sessions.daily_record_id
      and fr.parent_id = auth.uid()
    )
  );

create policy "Parents can update children time_sessions" on time_sessions
  for update using (
    exists (
      select 1 from daily_records dr
      join family_relations fr on fr.child_id = dr.user_id
      where dr.id = time_sessions.daily_record_id
      and fr.parent_id = auth.uid()
    )
  );

create policy "Parents can delete children time_sessions" on time_sessions
  for delete using (
    exists (
      select 1 from daily_records dr
      join family_relations fr on fr.child_id = dr.user_id
      where dr.id = time_sessions.daily_record_id
      and fr.parent_id = auth.uid()
    )
  );
