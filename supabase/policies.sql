alter table projects enable row level security;
alter table sources enable row level security;
alter table facts enable row level security;
alter table reports enable row level security;
alter table source_chunks enable row level security;

create policy if not exists "Projects are owned by user" on projects
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy if not exists "Sources inherit project ownership" on sources
  for all using (
    exists(
      select 1 from projects
      where projects.id = sources.project_id
      and projects.user_id = auth.uid()
    )
  );

create policy if not exists "Facts inherit project ownership" on facts
  for all using (
    exists(
      select 1 from projects
      where projects.id = facts.project_id
      and projects.user_id = auth.uid()
    )
  );

create policy if not exists "Reports inherit project ownership" on reports
  for all using (
    exists(
      select 1 from projects
      where projects.id = reports.project_id
      and projects.user_id = auth.uid()
    )
  );

create policy if not exists "Chunks inherit project ownership" on source_chunks
  for all using (
    exists(
      select 1 from projects
      where projects.id = source_chunks.project_id
      and projects.user_id = auth.uid()
    )
  );
