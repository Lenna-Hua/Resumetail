-- ResuTail cloud sync schema
-- Run this once in the Supabase SQL editor (Project → SQL Editor → New query) after creating your project.

create table if not exists public.user_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  onboarded boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.user_data enable row level security;

drop policy if exists "select own row" on public.user_data;
create policy "select own row" on public.user_data
  for select using (auth.uid() = user_id);

drop policy if exists "insert own row" on public.user_data;
create policy "insert own row" on public.user_data
  for insert with check (auth.uid() = user_id);

drop policy if exists "update own row" on public.user_data;
create policy "update own row" on public.user_data
  for update using (auth.uid() = user_id);

-- Keeps updated_at accurate on every write, used for last-write-wins sync resolution.
create or replace function public.set_user_data_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_user_data_updated_at on public.user_data;
create trigger set_user_data_updated_at
  before update on public.user_data
  for each row
  execute function public.set_user_data_updated_at();
