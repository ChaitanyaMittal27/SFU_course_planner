-- Rate My Professors (RMP) integration.
--
-- rmp_schools           SFU listings on RMP. Instructor searches run per school.
-- rmp_lookup            which RMP professor a CourseSys name maps to, per department.
--                       Only the identification is stored; ratings are fetched live.
-- rmp_mismatch_reports  user reports that a lookup points at the wrong professor.
-- departments.rmp_name  the department label RMP uses, for match scoring.
--
-- All new tables are backend-only: RLS on, no policies, no browser grants.

-- =========================================================
-- departments.rmp_name
-- =========================================================
alter table public.departments
    add column rmp_name varchar(255);

comment on column public.departments.rmp_name is
    'Department label as RMP writes it (CMPT -> Computer Science). Used only for match scoring; null = no useful label. Editable.';

-- Curated values. Kept in a function so the insert trigger below can apply them
-- to departments inserted later (e.g. seed.sql runs after migrations on a local reset).
create function public.rmp_department_name(code text)
returns varchar
language sql
immutable
set search_path = ''
as $$
select case lower(code)
    when 'acma'  then 'Statistics'
    when 'als'   then 'Criminology'
    when 'apma'  then 'Mathematics'
    when 'arab'  then 'Languages'
    when 'arch'  then 'Archaeology'
    when 'bisc'  then 'Biology'
    when 'bpk'   then 'Biomedical Physiology & Kinesiology'
    when 'bus'   then 'Business Administration'
    when 'ca'    then 'Fine Arts'
    when 'cenv'  then 'Environmental Science'
    when 'chem'  then 'Chemistry'
    when 'chin'  then 'Languages'
    when 'cmns'  then 'Communication'
    when 'cmpt'  then 'Computer Science'
    when 'cogs'  then 'Cognitive Science'
    when 'crim'  then 'Criminology'
    when 'dmed'  then 'Design'
    when 'easc'  then 'Earth Science'
    when 'econ'  then 'Economics'
    when 'edpr'  then 'Education'
    when 'educ'  then 'Education'
    when 'engl'  then 'English'
    when 'ensc'  then 'Engineering'
    when 'evsc'  then 'Environmental Science'
    when 'fal'   then 'English'
    when 'fan'   then 'Mathematics'
    when 'fass'  then 'Social Science'
    when 'fep'   then null
    when 'fren'  then 'French'
    when 'ga'    then 'Asian Studies'
    when 'geog'  then 'Geography'
    when 'germ'  then 'Languages'
    when 'gero'  then 'Gerontology'
    when 'grad'  then null
    when 'grk'   then 'Languages'
    when 'gsws'  then 'Women''s Studies'
    when 'hist'  then 'History'
    when 'hsci'  then 'Health Science'
    when 'hum'   then 'Humanities'
    when 'iat'   then 'Information Technology'
    when 'indg'  then 'Native Studies'
    when 'inlg'  then 'Native Studies'
    when 'ins'   then null
    when 'is'    then 'International Studies'
    when 'ital'  then 'Languages'
    when 'japn'  then 'Languages'
    when 'lbrl'  then 'Liberal Studies'
    when 'lbst'  then 'Labour Studies'
    when 'ling'  then 'Linguistics'
    when 'ls'    then 'Liberal Studies'
    when 'macm'  then 'Mathematics'
    when 'math'  then 'Mathematics'
    when 'mbb'   then 'Biochemistry'
    when 'mse'   then 'Engineering'
    when 'neur'  then 'Neuroscience'
    when 'nusc'  then 'Chemistry'
    when 'onc'   then 'Health Science'
    when 'pers'  then 'Languages'
    when 'phil'  then 'Philosophy'
    when 'phys'  then 'Physics'
    when 'plan'  then 'Urban Planning'
    when 'plcy'  then 'Public Policy'
    when 'pol'   then 'Political Science'
    when 'port'  then 'Languages'
    when 'psyc'  then 'Psychology'
    when 'pub'   then 'Publishing'
    when 'punj'  then 'Languages'
    when 'rem'   then 'Environmental Resources'
    when 'sa'    then 'Sociology'
    when 'sd'    then 'Sustainability'
    when 'sda'   then 'Data Science'
    when 'see'   then 'Engineering'
    when 'span'  then 'Languages'
    when 'stat'  then 'Statistics'
    when 'tekx'  then 'Technology'
    when 'ugrad' then null
    when 'urb'   then 'Urban Studies'
    when 'wl'    then 'Literature'
    else null
end
$$;

update public.departments
set rmp_name = public.rmp_department_name(dept_code);

create function public.initialize_rmp_department_name()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
    if new.rmp_name is null then
        new.rmp_name := public.rmp_department_name(new.dept_code);
    end if;
    return new;
end
$$;

create trigger initialize_rmp_department_name
    before insert on public.departments
    for each row execute function public.initialize_rmp_department_name();

-- seed.sql runs with session_replication_role = replica, which skips ordinary
-- triggers. ALWAYS makes this one fire there too.
alter table public.departments
    enable always trigger initialize_rmp_department_name;

-- =========================================================
-- rmp_schools
-- =========================================================
create table public.rmp_schools (
    rmp_school_id varchar(64)  primary key,
    legacy_id     integer      not null unique,
    name          varchar(255) not null,
    search_limit  integer      not null check (search_limit between 1 and 20),
    active        boolean      not null default true
);

comment on table public.rmp_schools is
    'SFU listings on RMP. Every active school is searched; search_limit = results taken per search.';

-- data for the schools we know about. The legacy_id is the numeric ID used in ratemyprofessors.com/professor/<id> links.
-- see test/rmp/legacy for details.
insert into public.rmp_schools (rmp_school_id, legacy_id, name, search_limit, active) values
    ('U2Nob29sLTE0ODI=',  1482,  'Simon Fraser University',                8, true),
    ('U2Nob29sLTQyNjc=',  4267,  'Simon Fraser University - Surrey',       5, true),
    ('U2Nob29sLTU3ODg=',  5788,  'Simon Fraser University Harbour Centre', 3, true),
    ('U2Nob29sLTE0OTc3',  14977, 'Simon Fraser University - Woodwards',    3, true),
    -- Listed under Gibsons, BC; looks like a duplicate. Activate if it has professors.
    ('U2Nob29sLTE5MzE3',  19317, 'Simon Fraser University',                3, false);

-- =========================================================
-- rmp_lookup
-- =========================================================
create table public.rmp_lookup (
    lookup_id      bigint generated by default as identity primary key,
    raw_name       varchar(255) not null,
    cleaned_name   varchar(255) not null,
    dept_code      varchar(10)  not null,
    rmp_teacher_id varchar(64),
    rmp_legacy_id  integer,
    match_score    double precision,
    no_match       boolean      not null default false,
    checked_at     timestamptz  not null default now(),
    constraint rmp_lookup_name_dept_key unique (cleaned_name, dept_code),
    constraint rmp_lookup_no_match_has_no_teacher
        check (no_match = (rmp_teacher_id is null)),
    constraint rmp_lookup_match_has_legacy_id
        check (no_match or rmp_legacy_id is not null),
    constraint rmp_lookup_score_range
        check (match_score is null or match_score between 0 and 1)
);

create index idx_rmp_lookup_teacher on public.rmp_lookup(rmp_teacher_id);

comment on table public.rmp_lookup is
    'CourseSys name + department -> RMP professor. One row per (cleaned_name, dept_code). Ratings are fetched live by rmp_teacher_id.';
comment on column public.rmp_lookup.raw_name is
    'Name as CourseSys sent it on first lookup (e.g. "Hall, Margaret").';
comment on column public.rmp_lookup.cleaned_name is
    'Normalized key (e.g. "margaret hall").';
comment on column public.rmp_lookup.rmp_teacher_id is
    'RMP GraphQL ID, used for API requests. Null when no_match.';
comment on column public.rmp_lookup.rmp_legacy_id is
    'RMP numeric ID, used for ratemyprofessors.com/professor/<id> links.';
comment on column public.rmp_lookup.match_score is
    '0.8 * name similarity + 0.2 * department similarity of the chosen candidate.';
comment on column public.rmp_lookup.no_match is
    'Search succeeded but no candidate scored >= 0.75.';
comment on column public.rmp_lookup.checked_at is
    'When the last successful search ran.';

-- =========================================================
-- rmp_mismatch_reports
-- =========================================================
create table public.rmp_mismatch_reports (
    report_id      bigint generated by default as identity primary key,
    lookup_id      bigint      not null
        references public.rmp_lookup(lookup_id) on delete cascade,
    rmp_teacher_id varchar(64),
    created_at     timestamptz not null default now()
);

create index idx_rmp_mismatch_reports_lookup on public.rmp_mismatch_reports(lookup_id);

comment on table public.rmp_mismatch_reports is
    'Anyone can report that a lookup shows the wrong RMP professor. For manual review.';
comment on column public.rmp_mismatch_reports.rmp_teacher_id is
    'The RMP ID the lookup pointed to when reported (null if it was a no-match).';

-- =========================================================
-- Access: backend only
-- =========================================================
alter table public.rmp_schools enable row level security;
alter table public.rmp_lookup enable row level security;
alter table public.rmp_mismatch_reports enable row level security;

revoke all on public.rmp_schools, public.rmp_lookup, public.rmp_mismatch_reports
    from anon, authenticated;
revoke all on sequence public.rmp_lookup_lookup_id_seq, public.rmp_mismatch_reports_report_id_seq
    from anon, authenticated;
