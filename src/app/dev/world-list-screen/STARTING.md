# Starting the Test Harness

## 1. Start the Next.js Development Server

```bash
npm run dev
```

## 2. Access the Test Harness

Once the server is running, navigate to:
```
http://localhost:3000/dev/world-list-screen
```

## 3. Use Browser Console for Testing

Open your browser's developer console (F12) and use the test utilities:

```javascript
// Add test worlds
worldListTestUtils.addTestWorlds()

// Clear all worlds
worldListTestUtils.clearWorlds()

// Test loading state
worldListTestUtils.setLoadingState(true)
worldListTestUtils.setLoadingState(false)

// Test error state
worldListTestUtils.setErrorState('Failed to load worlds')
worldListTestUtils.setErrorState(null)
```

## Troubleshooting

If you can't connect to localhost:3000:

1. Make sure the development server is running (`npm run dev`)
2. Check if another process is using port 3000
3. Try using a different browser or incognito mode
4. Check the terminal output for any errors

## Testing Commands

```bash
# Run harness tests
npm test src/app/dev/world-list-screen

# Run with coverage
npm test -- --coverage src/app/dev/world-list-screen
```
