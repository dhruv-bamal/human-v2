-- Run once via scripts/migrate.ts; never from application requests.
create table public.app_settings (id boolean primary key default true check(id), timezone text not null);
insert into public.app_settings values (true, 'Asia/Kolkata');
create table public.programs (
 id text primary key check(id in ('dhruv','annanya')), name text not null, goal text not null,
 meal_basis text not null check(meal_basis in ('weekday','sequence')), source text not null
);
create table public.profiles (
 id text primary key references public.programs(id), auth_user_id uuid unique references auth.users(id) on delete restrict,
 start_date date, created_at timestamptz not null default now()
);
create table public.program_days (
 person text references public.programs(id), day integer check(day between 1 and 30), week integer not null check(week between 1 and 5),
 title text not null, focus text not null, kind text not null check(kind in ('strength','recovery','rest','benchmark')),
 instructions text not null default '', source_page integer not null, primary key(person,day)
);
create table public.plan_tasks (
 id text primary key, person text not null, day integer not null, position integer not null,
 name text not null, target text not null, kind text not null, cue text not null default '', rest text not null default '',
 optional boolean not null default false, source_page integer not null,
 foreign key(person,day) references public.program_days(person,day), unique(person,day,id), unique(person,day,position)
);
create table public.meal_slots (
 id text primary key, person text not null references public.programs(id), rotation_day integer not null check(rotation_day between 1 and 7),
 position integer not null, label text not null, menu text not null, optional boolean not null default false,
 notes text not null default '', unique(person,id), unique(person,rotation_day,position)
);
create table public.meal_options (
 id text primary key, slot_id text not null references public.meal_slots(id), position integer not null, description text not null,
 unique(slot_id,position)
);
create table public.program_notes (
 id text primary key, person text not null references public.programs(id), category text not null,
 title text not null, body text not null, source_page integer not null
);
create table public.metric_definitions (
 person text not null references public.programs(id), key text not null, label text not null, unit text not null,
 min_value numeric not null default 0, max_value numeric not null, primary key(person,key)
);
create table public.task_progress (
 person text not null references public.profiles(id), day integer not null, task_id text not null,
 completed boolean not null default false, actual text not null default '' check(length(actual)<=500),
 notes text not null default '' check(length(notes)<=2000), updated_at timestamptz not null default now(),
 primary key(person,day,task_id), foreign key(person,day,task_id) references public.plan_tasks(person,day,id)
);
create table public.meal_progress (
 person text not null references public.profiles(id), day integer not null, slot_id text not null,
 completed boolean not null default false, notes text not null default '' check(length(notes)<=2000), updated_at timestamptz not null default now(),
 primary key(person,day,slot_id), foreign key(person,day) references public.program_days(person,day),
 foreign key(person,slot_id) references public.meal_slots(person,id)
);
create table public.measurements (
 person text not null references public.profiles(id), day integer not null, metric text not null, value numeric not null,
 updated_at timestamptz not null default now(), primary key(person,day,metric),
 foreign key(person,day) references public.program_days(person,day), foreign key(person,metric) references public.metric_definitions(person,key)
);
create table public.weekly_checkins (
 person text not null references public.profiles(id) check(person='annanya'), week integer not null check(week between 1 and 4),
 energy integer check(energy between 1 and 5), ankle_comfort integer check(ankle_comfort between 1 and 5),
 strength text not null default '' check(length(strength)<=500), notes text not null default '' check(length(notes)<=2000),
 updated_at timestamptz not null default now(), primary key(person,week)
);
create index task_progress_recent on public.task_progress(updated_at desc);
create index meal_progress_recent on public.meal_progress(updated_at desc);
create index plan_tasks_day on public.plan_tasks(person,day);
create index meal_options_slot on public.meal_options(slot_id);

create function public.current_person() returns text language sql stable security definer set search_path = '' as $$
 select id from public.profiles where auth_user_id = (select auth.uid())
$$;
revoke all on function public.current_person() from public;
grant execute on function public.current_person() to authenticated;
create function public.local_today() returns date language sql stable security definer set search_path = '' as $$
 select (now() at time zone timezone)::date from public.app_settings where id = true
$$;
revoke all on function public.local_today() from public;
grant execute on function public.local_today() to authenticated;

create function public.guard_progress() returns trigger language plpgsql security definer set search_path = '' as $$
declare start_on date; slot_day integer; expected_day integer; min_v numeric; max_v numeric;
begin
 select start_date into start_on from public.profiles where id=new.person;
 if start_on is null then raise exception 'Program has not started'; end if;
 if TG_TABLE_NAME='weekly_checkins' then
   if start_on + ((new.week-1)*7) > public.local_today() then raise exception 'Future week'; end if;
 else
   if start_on + (new.day-1) > public.local_today() then raise exception 'Future day'; end if;
 end if;
 if TG_TABLE_NAME='meal_progress' then
   select rotation_day into slot_day from public.meal_slots where id=new.slot_id and person=new.person;
   expected_day := case when new.person='dhruv' then extract(isodow from start_on + (new.day-1))::integer else ((new.day-1)%7)+1 end;
   if slot_day is distinct from expected_day then raise exception 'Incorrect meal for date'; end if;
 end if;
 if TG_TABLE_NAME='measurements' then
   select min_value,max_value into min_v,max_v from public.metric_definitions where person=new.person and key=new.metric;
   if min_v is null or new.value < min_v or new.value > max_v then raise exception 'Invalid measurement'; end if;
 end if;
 new.updated_at := now();
 return new;
end $$;
revoke all on function public.guard_progress() from public;

-- A fixed pair of mapped accounts can read; only the owner can write progress.
do $$ declare t text; begin
 foreach t in array array['app_settings','programs','profiles','program_days','plan_tasks','meal_slots','meal_options','program_notes','metric_definitions','task_progress','meal_progress','measurements','weekly_checkins'] loop
   execute format('alter table public.%I enable row level security',t);
   execute format('revoke all on public.%I from anon, authenticated',t);
   execute format('grant select on public.%I to authenticated',t);
   execute format('create policy members_read on public.%I for select to authenticated using ((select public.current_person()) is not null)',t);
 end loop;
 foreach t in array array['task_progress','meal_progress','measurements','weekly_checkins'] loop
   execute format('grant insert, update on public.%I to authenticated',t);
   execute format('create policy owner_insert on public.%I for insert to authenticated with check (person=(select public.current_person()))',t);
   execute format('create policy owner_update on public.%I for update to authenticated using (person=(select public.current_person())) with check (person=(select public.current_person()))',t);
   execute format('create trigger validate_progress before insert or update on public.%I for each row execute function public.guard_progress()',t);
 end loop;
end $$;

create function public.set_start_date(chosen_date date) returns void language plpgsql security definer set search_path = '' as $$
declare me text; existing date;
begin
 me := public.current_person();
 if me is null then raise exception 'Not authorized'; end if;
 select start_date into existing from public.profiles where id=me for update;
 if existing is not null then raise exception 'Start date is already set'; end if;
 if chosen_date is null or chosen_date < public.local_today() then raise exception 'Choose today or a future date'; end if;
 update public.profiles set start_date=chosen_date where id=me;
end $$;
revoke all on function public.set_start_date(date) from public;
grant execute on function public.set_start_date(date) to authenticated;
