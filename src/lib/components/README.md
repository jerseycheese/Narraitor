# Components Library (moved)

This directory no longer holds shared components. The `ErrorMessage` component that used to live
here was replaced by **`ErrorDisplay`** (and the `PageError` variant) in
[`src/components/ui/ErrorDisplay/`](../../components/ui/ErrorDisplay/), which covers the same
job — turning technical errors into user-friendly messages with optional retry — but styled with
the design-token CSS system rather than the old Tailwind classes.

For the error-message-mapping logic, see `src/lib/ai/userFriendlyErrors.ts`.

Shared UI components now live under `src/components/ui/` (design-system primitives) and
`src/components/shared/` (cross-domain components). Put new shared components there, not here.
