# Skeleton Loading Architecture & UI Mirroring Rule

## Core Constraint: No Generic Loaders or Spinners for UI States
1. Never use generic spinning loaders (`Loader2`, `animate-spin`, full-page spinners) for page, view, collection, or boundary loading states.
2. Always use bespoke Skeleton loading (`@/components/ui/skeleton`) for all loading states:
   - Initial page loads & Suspense fallbacks.
   - Server-side and client-side data fetching.
   - Filter / search transitions.
   - Infinite scroll next-page fetching.

## Mirroring the Exact UI Layout
1. Every skeleton component must accurately replicate the real UI hierarchy, layout, classes, and dimensions:
   - **Form Builder**: Mirrors the 2-column layout with the exact fixed left palette panel (`w-72 sm:w-80`) and right canvas area (`flex-1`), with toolbar top row and tabs row.
   - **Forms Workspace**: Mirrors the top stats row, filter bar, and 3-column card grid with `FormCardSkeleton`.
   - **Form Preview & Published Forms**: Mirrors form headers, step indicators, question inputs, and submit button actions.
   - **Auth Pages**: Mirrors the split-screen showcase panel and form inputs.
2. **Synchronized Updates**: Whenever a UI layout or component structure is changed, the corresponding skeleton MUST be updated in tandem to prevent layout shift and maintain a seamless transition when data loads.

## Infinite Scrolling
- When fetching additional pages in an infinite scroll list (`isFetchingNextPage`), render skeleton cards directly inline at the end of the grid flow, avoiding disruptive spinners or blank areas.
