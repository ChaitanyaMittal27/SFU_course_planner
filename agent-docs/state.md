# State - overwrite each subtask, max 30 lines
Task: UI refresh - subtask 9 release prep display fixes - Updated: 2026-11-23 - Branch: ui-2
## Done so far
Subtasks 1-8 verified; subtask 9 release preparation and display fixes implemented; owner release actions remain.
Seat-load status now uses raw seat counts (including CourseSys waitlists), bypassing rounded offering API percentages.
Load labels floor percentages across browse, offering details, comparisons, dashboard, graphs and summaries.
Compare grade distributions keep the header median; Grades graph keeps the summary sentence; histogram highlights remain.
Enrollment summary checks every capacity: varied ranges show min/max; only constant ranges say stayed at.
Phone hero stats use three equal columns with wrapping labels; desktop layout and typography retained.
## Last subtask result (incl. tests)
Frontend lint PASS; 43 files / 288 tests PASS; production build PASS (Next.js 16.4.6, TypeScript/static generation).
Regression coverage: 199/200 Almost full 99%, 200/200 Full 100%, 179/200 Open 89%; rounded API row; variable capacities; single medians.
Production browser check with real API PASS: /browse/CMPT/225 Spring 2026 D100 199/200 renders 99% with warning text.
375px landing PASS: three stats share one row and aligned numbers; labels wrap; document width 375px; desktop flex/gap 40px retained.
Screenshots and isolated browser script are ignored artifacts in test-logs/; original frontend container restored.
git diff --check PASS. No commits, pushes, backend changes or deployments.
## Uncommitted files (git status)
agent-docs/{state,plan,decisions,to-do}.md; frontend/{package.json,package-lock.json}; contexts/AuthContext.tsx.
frontend/app/admin/{page,support/page,terms/page}.tsx; app/dashboard/{page.tsx,dashboard-flow.test.tsx}.
frontend/app/compare/courses/{page.tsx,courses-flow.test.tsx}.
frontend/components/analytics/{CanonicalAnalyticsPage.tsx,CanonicalAnalyticsPage.test.tsx,GradeHistogram.tsx,HistoryCharts.tsx}.
frontend/components/course/{CourseOfferingsPanel.tsx,CourseOfferingsPanel.test.tsx,OfferingDetailScreen.tsx,OfferingsTable.tsx,SectionComparisonResults.tsx}.
frontend/components/enrollment/{LoadBar.tsx,enrollment.test.tsx}; components/landing/Hero.tsx.
frontend/lib/{enrollment-status.ts,enrollment-status.test.ts,analytics-summary.ts,analytics-summary.test.ts}.
## Blockers / known issues
Existing audit: 4 moderate dev-only shadcn/minimatch findings; production audit clean in prior prep; no new audit run.
Original Docker frontend served stale code during initial smoke; rebuilt host production app passed; Docker dependencies/cache still need refreshing.
## Next
- [ ] Owner review/commit, push ui-2, merge to dev, CI green, merge main, deploy and production smoke.
- [ ] Refresh Docker frontend dependencies/cache for the previous package changes before using it for further UI checks.
