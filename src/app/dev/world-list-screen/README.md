# World List Screen Test Harness

This test harness is part of the Three-Stage Component Testing approach for the World List Screen component.

## Starting the Development Server

```bash
npm run dev
```

## Access the harness

Navigate to: `http://localhost:3000/dev/world-list-screen`

## Purpose

Stage 2 testing: Testing the WorldListScreen component with real worldStore integration.

## Features being tested

- World list display (grid layout)
- Loading states
- Error states
- Empty state
- Delete functionality with confirmation dialog
- Integration with worldStore Zustand store

## Not included in this test

- Play functionality (TODO)
- Edit functionality (TODO)
- Advanced filtering or sorting
- Visual styling enhancements

## Three-Stage Testing Status

- [x] Stage 1: Storybook isolation - Completed
- [x] Stage 2: Test harness integration - This harness
- [ ] Stage 3: System integration - Not tested in full app
