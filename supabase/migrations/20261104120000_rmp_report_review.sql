-- =========================================================
-- RMP wrong-match reports: admin review
--
-- Reports become resolved when an admin acts on them from the admin RMP Reports page
-- (match is correct / no match / set professor). Open reports have resolved_at = null.
-- Access is unchanged: the table stays backend-only (RLS on, no client grants).
-- =========================================================

alter table public.rmp_mismatch_reports
    add column resolved_at timestamptz;

comment on column public.rmp_mismatch_reports.resolved_at is
    'When an admin resolved the report. Null while the report is open.';

-- The admin list reads only open reports, grouped by lookup.
create index idx_rmp_mismatch_reports_open
    on public.rmp_mismatch_reports(lookup_id)
    where resolved_at is null;
