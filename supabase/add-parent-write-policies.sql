-- 親が子供のデータを書き込めるようにRLSポリシーを追加
-- Supabase SQL Editor で実行してください

-- scheduled_tasks: 親は子供のスケジュールを追加できる
create policy "Parents can insert children scheduled_tasks" on scheduled_tasks
  for insert with check (
    exists (
      select 1 from family_relations
      where parent_id = auth.uid() and child_id = scheduled_tasks.user_id
    )
  );

-- scheduled_tasks: 親は子供のスケジュールを更新できる
create policy "Parents can update children scheduled_tasks" on scheduled_tasks
  for update using (
    exists (
      select 1 from family_relations
      where parent_id = auth.uid() and child_id = scheduled_tasks.user_id
    )
  );

-- scheduled_tasks: 親は子供のスケジュールを削除できる
create policy "Parents can delete children scheduled_tasks" on scheduled_tasks
  for delete using (
    exists (
      select 1 from family_relations
      where parent_id = auth.uid() and child_id = scheduled_tasks.user_id
    )
  );

-- daily_records: 親は子供の記録を追加できる
create policy "Parents can insert children daily_records" on daily_records
  for insert with check (
    exists (
      select 1 from family_relations
      where parent_id = auth.uid() and child_id = daily_records.user_id
    )
  );

-- daily_records: 親は子供の記録を更新できる
create policy "Parents can update children daily_records" on daily_records
  for update using (
    exists (
      select 1 from family_relations
      where parent_id = auth.uid() and child_id = daily_records.user_id
    )
  );

-- daily_records: 親は子供の記録を削除できる
create policy "Parents can delete children daily_records" on daily_records
  for delete using (
    exists (
      select 1 from family_relations
      where parent_id = auth.uid() and child_id = daily_records.user_id
    )
  );
