begin;

create table public.languages (
  id smallint primary key,
  name text not null unique
);

insert into public.languages (id, name) values
  (1, 'Urdu'),
  (2, 'Punjabi'),
  (3, 'Haryanvi'),
  (4, 'Saraiki'),
  (5, 'Italian'),
  (6, 'Pashto'),
  (7, 'Sindhi'),
  (8, 'Balochi'),
  (9, 'Russian'),
  (10, 'Portuguese'),
  (11, 'Arabic'),
  (12, 'Hindi'),
  (13, 'Bengali'),
  (14, 'Turkish'),
  (15, 'Dutch'),
  (16, 'Swedish'),
  (17, 'Greek'),
  (18, 'Hebrew'),
  (19, 'Polish'),
  (20, 'Thai')
on conflict (id) do nothing;

create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  age_years smallint not null,
  gender text not null,
  profession text not null,
  education text not null,
  height text not null,
  weight text not null,
  hobbies text not null,
  religion text not null,
  sect text not null default '',
  city text not null,
  about text not null default '',
  employment_status text not null,
  marital_status text not null,
  is_discoverable boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profile_private (
  user_id uuid primary key references public.profiles (user_id) on delete cascade,
  date_of_birth date,
  updated_at timestamptz not null default now()
);

create table public.profile_languages (
  user_id uuid not null references public.profiles (user_id) on delete cascade,
  language_id smallint not null references public.languages (id),
  primary key (user_id, language_id)
);

create table public.profile_media (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (user_id) on delete cascade,
  bucket_id text not null default 'profile-media'
    check (bucket_id = 'profile-media'),
  object_path text not null unique,
  kind text not null check (kind in ('avatar', 'gallery')),
  position smallint not null,
  mime_type text not null
    check (mime_type in ('image/jpeg', 'image/png', 'image/webp')),
  file_name text not null,
  created_at timestamptz not null default now(),
  unique (user_id, position),
  check (
    (kind = 'avatar' and position = 0)
    or (kind = 'gallery' and position between 1 and 3)
  )
);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  participant_a uuid not null references auth.users (id) on delete cascade,
  participant_b uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (participant_a, participant_b),
  check (participant_a < participant_b)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null references auth.users (id) on delete cascade,
  text text not null default '',
  created_at timestamptz not null default now()
);

create table public.favorites (
  user_id uuid not null references auth.users (id) on delete cascade,
  favorite_user_id uuid not null references public.profiles (user_id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, favorite_user_id),
  check (user_id <> favorite_user_id)
);

create index profiles_discoverable_gender_age_idx
  on public.profiles (gender, age_years)
  where is_discoverable;

create index profiles_discoverable_religion_idx
  on public.profiles (religion)
  where is_discoverable;

create index profile_languages_language_user_idx
  on public.profile_languages (language_id, user_id);

create index conversations_participant_b_idx
  on public.conversations (participant_b);

create index messages_conversation_created_at_idx
  on public.messages (conversation_id, created_at desc);

create function public.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger profile_private_set_updated_at
before update on public.profile_private
for each row execute function public.set_updated_at();

revoke execute on function public.set_updated_at() from public, anon, authenticated;

alter table public.languages enable row level security;
alter table public.profiles enable row level security;
alter table public.profile_private enable row level security;
alter table public.profile_languages enable row level security;
alter table public.profile_media enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.favorites enable row level security;

revoke all on table
  public.languages,
  public.profiles,
  public.profile_private,
  public.profile_languages,
  public.profile_media,
  public.conversations,
  public.messages,
  public.favorites
from anon, authenticated;

grant select on table public.languages to authenticated;
grant select, insert, update on table public.profiles to authenticated;
grant select, insert, update on table public.profile_private to authenticated;
grant select, insert, delete on table public.profile_languages to authenticated;
grant select, insert, update, delete on table public.profile_media to authenticated;
grant select, insert on table public.conversations to authenticated;
grant select, insert on table public.messages to authenticated;
grant select, insert, delete on table public.favorites to authenticated;

create policy languages_read_authenticated
on public.languages
for select to authenticated
using (true);

create policy profiles_read_discoverable
on public.profiles
for select to authenticated
using (user_id = (select auth.uid()) or is_discoverable);

create policy profiles_insert_owner
on public.profiles
for insert to authenticated
with check (user_id = (select auth.uid()));

create policy profiles_update_owner
on public.profiles
for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy profile_private_read_owner
on public.profile_private
for select to authenticated
using (user_id = (select auth.uid()));

create policy profile_private_insert_owner
on public.profile_private
for insert to authenticated
with check (user_id = (select auth.uid()));

create policy profile_private_update_owner
on public.profile_private
for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy profile_languages_read_visible_profile
on public.profile_languages
for select to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.user_id = profile_languages.user_id
  )
);

create policy profile_languages_insert_owner
on public.profile_languages
for insert to authenticated
with check (user_id = (select auth.uid()));

create policy profile_languages_delete_owner
on public.profile_languages
for delete to authenticated
using (user_id = (select auth.uid()));

create policy profile_media_read_visible_profile
on public.profile_media
for select to authenticated
using (
  user_id = (select auth.uid())
  or exists (
    select 1
    from public.profiles p
    where p.user_id = profile_media.user_id
      and p.is_discoverable
  )
);

create policy profile_media_insert_owner
on public.profile_media
for insert to authenticated
with check (
  user_id = (select auth.uid())
  and split_part(object_path, '/', 1) = (select auth.uid())::text
);

create policy profile_media_update_owner
on public.profile_media
for update to authenticated
using (user_id = (select auth.uid()))
with check (
  user_id = (select auth.uid())
  and split_part(object_path, '/', 1) = (select auth.uid())::text
);

create policy profile_media_delete_owner
on public.profile_media
for delete to authenticated
using (user_id = (select auth.uid()));

create policy conversations_read_participant
on public.conversations
for select to authenticated
using (
  (select auth.uid()) = participant_a
  or (select auth.uid()) = participant_b
);

create policy conversations_insert_discoverable_pair
on public.conversations
for insert to authenticated
with check (
  (
    (select auth.uid()) = participant_a
    or (select auth.uid()) = participant_b
  )
  and exists (
    select 1
    from public.profiles p
    where p.user_id = case
      when participant_a = (select auth.uid()) then participant_b
      else participant_a
    end
      and p.is_discoverable
  )
);

create policy messages_read_participant
on public.messages
for select to authenticated
using (
  exists (
    select 1
    from public.conversations c
    where c.id = messages.conversation_id
      and (
        c.participant_a = (select auth.uid())
        or c.participant_b = (select auth.uid())
      )
  )
);

create policy messages_insert_sender_participant
on public.messages
for insert to authenticated
with check (
  sender_id = (select auth.uid())
  and exists (
    select 1
    from public.conversations c
    where c.id = messages.conversation_id
      and (
        c.participant_a = (select auth.uid())
        or c.participant_b = (select auth.uid())
      )
  )
);

create policy favorites_read_owner
on public.favorites
for select to authenticated
using (user_id = (select auth.uid()));

create policy favorites_insert_owner_discoverable
on public.favorites
for insert to authenticated
with check (
  user_id = (select auth.uid())
  and exists (
    select 1
    from public.profiles p
    where p.user_id = favorites.favorite_user_id
      and p.is_discoverable
  )
);

create policy favorites_delete_owner
on public.favorites
for delete to authenticated
using (user_id = (select auth.uid()));

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'profile-media',
  'profile-media',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

do $$
begin
  if not exists (
    select 1
    from storage.buckets b
    where b.id = 'profile-media'
      and b.name = 'profile-media'
      and b.public = false
      and b.file_size_limit = 5242880
      and b.allowed_mime_types @> array['image/jpeg', 'image/png', 'image/webp']
      and array['image/jpeg', 'image/png', 'image/webp'] @> b.allowed_mime_types
  ) then
    raise exception 'Existing profile-media bucket settings differ from the approved private bucket configuration';
  end if;
end;
$$;

create policy profile_media_storage_read
on storage.objects
for select to authenticated
using (
  bucket_id = 'profile-media'
  and (
    split_part(name, '/', 1) = (select auth.uid())::text
    or exists (
      select 1
      from public.profile_media m
      join public.profiles p on p.user_id = m.user_id
      where m.object_path = storage.objects.name
        and p.user_id::text = split_part(storage.objects.name, '/', 1)
        and p.is_discoverable
    )
  )
);

create policy profile_media_storage_insert_owner
on storage.objects
for insert to authenticated
with check (
  bucket_id = 'profile-media'
  and split_part(name, '/', 1) = (select auth.uid())::text
  and exists (
    select 1
    from public.profile_media m
    where m.object_path = storage.objects.name
      and m.user_id = (select auth.uid())
  )
);

create policy profile_media_storage_update_owner
on storage.objects
for update to authenticated
using (
  bucket_id = 'profile-media'
  and split_part(name, '/', 1) = (select auth.uid())::text
)
with check (
  bucket_id = 'profile-media'
  and split_part(name, '/', 1) = (select auth.uid())::text
  and exists (
    select 1
    from public.profile_media m
    where m.object_path = storage.objects.name
      and m.user_id = (select auth.uid())
  )
);

create policy profile_media_storage_delete_owner
on storage.objects
for delete to authenticated
using (
  bucket_id = 'profile-media'
  and split_part(name, '/', 1) = (select auth.uid())::text
);

alter publication supabase_realtime add table public.messages;

commit;
