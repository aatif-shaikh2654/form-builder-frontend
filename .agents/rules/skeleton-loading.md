# Skeleton Loading Architecture & UI Mirroring Rule

## Core Constraint: Mandatory Bespoke Skeletons (No Generic Loaders or Spinners)
1. **Never use generic spinning loaders** (`Loader2`, `RefreshCw` with `animate-spin`, circular spinners, loading dots, or placeholder text like "Loading...") for page, view, tab, table, collection, or boundary loading states.
2. **Always use bespoke Skeleton loading (`@/components/ui/skeleton`) whenever ANY API is loading**:
   - Initial page loads & Next.js `Suspense` fallbacks.
   - Client-side data fetching via React Query (`isLoading`, `isPending`).
   - Builder tab transitions (Canvas, Submissions, Preview, Settings).
   - Filter, pagination, and search transitions.
   - Infinite scroll next-page fetching (`isFetchingNextPage`).
   - Modals and side drawers during data loading.

## Mirroring the Exact UI Layout
Every skeleton component must accurately replicate the real UI hierarchy, layout, classes, and dimensions:
1. **Form Builder (`BuilderSkeleton`)**:
   - Mirrors the 2-column layout with the exact fixed left palette panel (`w-72 sm:w-80`) and right canvas area (`flex-1`), with toolbar top row and tabs row.
2. **Forms Workspace (`FormCardSkeleton`)**:
   - Mirrors the top stats row, filter bar, and 3-column card grid.
3. **Form Submissions & Analytics (`SubmissionsSkeleton`)**:
   - **Table View**: Mirrors the full-width data table structure: sticky `#`, `Submitted At`, `Status`, dynamic question column headers, 6 skeleton data rows, and sticky `Action` buttons.
   - **Card View**: Mirrors the responsive multi-column card grid with response numbers, status badges, timestamp, and field answer lines.
4. **Form Preview & Published Forms (`PublicFormSkeleton`, `PreviewSkeleton`)**:
   - Mirrors form headers, step indicators, question inputs, radio/checkbox pills, and action buttons.
5. **Auth Pages (`AuthPageSkeleton`)**:
   - Mirrors the split-screen showcase panel and form inputs.

## Synchronized Updates
- Whenever a UI layout or component structure is changed, the corresponding skeleton MUST be updated in tandem to prevent layout shift and maintain a seamless transition when data loads.

## Infinite Scrolling & Data Lists
- When fetching additional pages in an infinite scroll list (`isFetchingNextPage`), render skeleton cards directly inline at the end of the grid flow, avoiding disruptive spinners or blank areas.
