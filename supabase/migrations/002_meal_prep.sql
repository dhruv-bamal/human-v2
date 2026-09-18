-- Additive migration: keeps every profile, task, measurement and progress row.
-- Meal 2 keeps its original ID; only its display position changes.
alter table public.meal_slots
 add column timing text not null default '',
 add column day_offset integer not null default 0 check(day_offset between 0 and 1),
 add column vegetarian boolean;
update public.meal_slots set position=3 where person='dhruv' and position=2;

create table public.recipes (
 id text primary key, name text not null, vegetarian boolean not null,
 notes text not null default '', source_page integer not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.recipe_ingredients (
 id text primary key, recipe_id text not null references public.recipes(id),
 position integer not null check(position>0), ingredient_name text not null,
 quantity text not null default '', unit text not null default '',
 preparation_note text not null default '', optional boolean not null default false,
 unique(recipe_id,position)
);
create table public.recipe_steps (
 id text primary key, recipe_id text not null references public.recipes(id),
 step_number integer not null check(step_number>0), instruction text not null,
 unique(recipe_id,step_number)
);
create table public.meal_recipe_links (
 id text primary key, slot_id text not null references public.meal_slots(id),
 recipe_id text not null references public.recipes(id), position integer not null check(position>0),
 context text not null default '', unique(slot_id,recipe_id), unique(slot_id,position)
);
create index meal_recipe_links_recipe on public.meal_recipe_links(recipe_id);
-- Definition data is readable by either mapped member and writable by neither.
do $$ declare t text; begin
 foreach t in array array['recipes','recipe_ingredients','recipe_steps','meal_recipe_links'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('revoke all on public.%I from anon,authenticated',t);
  execute format('grant select on public.%I to authenticated',t);
  execute format('create policy members_read on public.%I for select to authenticated using ((select public.current_person()) is not null)',t);
 end loop;
end $$;

-- The evening date anchors Dhruv's overnight session. At 05:00, the PDF's
-- wind-down ends and sleep begins. Annanya retains her midnight boundary.
-- Explicit instant argument is pure/read-only and permits deterministic tests.
create function public.training_date(person_id text, instant timestamptz default now())
 returns date language sql stable security definer set search_path='' as $$
 select ((instant at time zone timezone) -
  case when person_id='dhruv' then interval '5 hours' else interval '0 hours' end)::date
 from public.app_settings where id=true
$$;
revoke all on function public.training_date(text,timestamptz) from public;
grant execute on function public.training_date(text,timestamptz) to authenticated;

create or replace function public.guard_progress() returns trigger language plpgsql security definer set search_path='' as $$
declare start_on date; slot_day integer; expected_day integer; min_v numeric; max_v numeric;
begin
 select start_date into start_on from public.profiles where id=new.person;
 if start_on is null then raise exception 'Program has not started'; end if;
 if TG_TABLE_NAME='weekly_checkins' then
  if start_on + ((new.week-1)*7) > public.training_date(new.person) then raise exception 'Future week'; end if;
 else
  if start_on + (new.day-1) > public.training_date(new.person) then raise exception 'Future day'; end if;
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
 new.updated_at:=now();
 return new;
end $$;

create or replace function public.set_start_date(chosen_date date) returns void language plpgsql security definer set search_path='' as $$
declare me text; existing date;
begin
 me:=public.current_person();
 if me is null then raise exception 'Not authorized'; end if;
 select start_date into existing from public.profiles where id=me for update;
 if existing is not null then raise exception 'Start date is already set'; end if;
 if chosen_date is null or chosen_date < public.training_date(me) then raise exception 'Choose today or a future date'; end if;
 update public.profiles set start_date=chosen_date where id=me;
end $$;
