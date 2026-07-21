-- Tabela profiles (1:1 com auth.users)
-- Trigger em auth.users pode inserir linha aqui ao criar usuário.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url text,
  profession text,
  job_title text,
  salary_range text check (salary_range in (
    'ate_1k', '1k_3k', '3k_5k', '5k_10k', '10k_20k', '20k_plus'
  )),
  payday smallint check (payday >= 1 and payday <= 31),
  financial_goal text,
  theme_preference text check (theme_preference in ('dark', 'light', 'system')) default 'dark',
  onboarding_completed boolean not null default false,
  onboarding_completed_at timestamptz,
  updated_at timestamptz not null default now()
);

-- RLS
alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Opcional: trigger para criar profile ao inscrever usuário
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, updated_at)
  values (new.id, now())
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
