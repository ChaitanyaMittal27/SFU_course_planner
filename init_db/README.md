# Database initialization

`init_db/` is the home for controlled operational data work: collection,
validation, backfills, imports, and one-time initialization. It is intentionally
outside the Spring Boot application. These operations may make many external
requests or write batches of database rows, so they must never run during
normal application startup or deployment.

## Operating model

Every current initializer should follow the same explicit, reviewable path:

1. Apply the reviewed schema migration to a local database.
2. Collect source data into a generated artifact under `out/`.
3. Validate and inspect the artifact with a summary of source failures and
   record counts.
4. Load the approved artifact idempotently into an explicitly selected target.
5. Verify the database result before running the same approved operation against
   production.

Collection and loading are deliberately separate. A failed collection must not
partially mutate the database, and an unavailable database must not discard an
otherwise useful collection artifact. Loaders must be safe to rerun and report
inserted, reused, skipped, and failed records.

Generated output is not committed. Production work must require an explicit
target and apply action; local testing must not write to the hosted Supabase
project. New tools should support a dry run where practical and must print a
concise final summary.

## Layout

- `scripts/` holds current, supported initialization tooling.
- `out/` holds generated, local-only artifacts such as CSV files and run
  summaries.
- `legacy/` retains historical material that may be useful for reference, but
  is not a source of truth for the current schema or workflow.

Any init_db will use the  collect →
inspect → idempotently load model without becoming coupled to that feature flow.