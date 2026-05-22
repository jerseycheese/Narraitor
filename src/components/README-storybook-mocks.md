# Storybook Mock Components Guide (obsolete)

This pattern is no longer used. The project once kept separate `Mock*` components (e.g.
`MockWorldCard`, `MockWorldList`) so that App-Router-dependent components could render in Storybook
without a router context. Those mock components have been removed.

Storybook now mocks the Next.js App Router directly via the `@storybook/nextjs` framework. The
real components render in Storybook as-is — `nextjs: { appDirectory: true }` is set globally in
[`.storybook/preview.tsx`](../../.storybook/preview.tsx), and individual stories add per-story
`nextjs:` parameters (navigation, app-directory segments) when they need specific routing
behavior. There's no `Mock*` component to write anymore.

See the superseded [ADR: Mock Components for Storybook](../../public_docs/architecture/mock-components-for-storybook.md)
for the full history.
