#!/bin/bash

# Test script for secure API keys implementation
# This script verifies that the security enhancement is working correctly

echo "🔒 SECURE API KEYS TESTING SCRIPT"
echo "================================="
echo ""

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counter
TESTS_RUN=0
TESTS_PASSED=0

run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_pattern="$3"
    
    echo -e "${BLUE}Test ${TESTS_RUN}:${NC} $test_name"
    TESTS_RUN=$((TESTS_RUN + 1))
    
    if eval "$test_command" | grep -q "$expected_pattern"; then
        echo -e "${GREEN}✅ PASS${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${RED}❌ FAIL${NC}"
        echo "   Expected pattern: $expected_pattern"
        echo "   Actual output:"
        eval "$test_command" | head -5 | sed 's/^/   /'
    fi
    echo ""
}

# Check prerequisites
echo "🔧 CHECKING PREREQUISITES"
echo "-------------------------"

if ! command_exists npm; then
    echo -e "${RED}❌ npm not found. Please install Node.js.${NC}"
    exit 1
fi

if [ ! -f package.json ]; then
    echo -e "${RED}❌ package.json not found. Please run from project root.${NC}"
    exit 1
fi

if [ ! -f .env.local ]; then
    echo -e "${YELLOW}⚠️  .env.local not found. Some tests may fail.${NC}"
fi

echo -e "${GREEN}✅ Prerequisites check passed${NC}"
echo ""

# Start the development server in the background
echo "🚀 STARTING DEVELOPMENT SERVER"
echo "------------------------------"
npm run dev > /tmp/narraitor-test.log 2>&1 &
DEV_SERVER_PID=$!

# Wait for server to start
echo "Waiting for server to start..."
sleep 8

# Check if server is running
if ! kill -0 $DEV_SERVER_PID 2>/dev/null; then
    echo -e "${RED}❌ Failed to start development server${NC}"
    exit 1
fi

# Determine the port (try common Next.js ports)
PORT=""
for test_port in 3000 3001 3002 3003; do
    if curl -s http://localhost:$test_port >/dev/null 2>&1; then
        PORT=$test_port
        break
    fi
done

if [ -z "$PORT" ]; then
    echo -e "${RED}❌ Server not responding on any common ports (3000-3003)${NC}"
    echo "Checking server logs..."
    tail -10 /tmp/narraitor-test.log
    kill $DEV_SERVER_PID 2>/dev/null
    exit 1
fi

echo -e "${GREEN}✅ Development server running on port $PORT${NC}"
echo ""

# Test 1: Verify API routes exist
echo "🧪 RUNNING API SECURITY TESTS"
echo "==============================="

run_test "Narrative generation API route exists" \
    "curl -s -o /dev/null -w '%{http_code}' http://localhost:$PORT/api/narrative/generate" \
    "405"

run_test "Choice generation API route exists" \
    "curl -s -o /dev/null -w '%{http_code}' http://localhost:$PORT/api/narrative/choices" \
    "405"

run_test "Portrait generation API route exists" \
    "curl -s -o /dev/null -w '%{http_code}' http://localhost:$PORT/api/generate-portrait" \
    "405"

# Test 2: Verify API key security (no API key should be visible in client)
run_test "API debug endpoint shows server-side security" \
    "curl -s http://localhost:$PORT/api/debug" \
    "server-side-only"

# Test 3: Test rate limiting functionality
echo "🚦 TESTING RATE LIMITING"
echo "========================"

# Make a valid request to test rate limiting headers
run_test "Rate limiting headers present on valid requests" \
    "curl -s -I -X POST -H 'Content-Type: application/json' -d '{\"prompt\":\"test\"}' http://localhost:$PORT/api/narrative/generate | grep -i 'X-RateLimit-Limit'" \
    "X-RateLimit-Limit"

# Test 4: Verify request validation
echo "📝 TESTING REQUEST VALIDATION"
echo "============================="

run_test "Empty request returns 400" \
    "curl -s -o /dev/null -w '%{http_code}' -X POST -H 'Content-Type: application/json' -d '{}' http://localhost:$PORT/api/narrative/generate" \
    "400"

run_test "Invalid JSON returns 400 or 500" \
    "curl -s -o /dev/null -w '%{http_code}' -X POST -H 'Content-Type: application/json' -d '{invalid}' http://localhost:$PORT/api/narrative/generate" \
    "[45]"

# Test 5: Check that no API keys are exposed in the build
echo "🔍 CHECKING BUILD SECURITY"
echo "=========================="

if [ -d ".next" ]; then
    if grep -r "NEXT_PUBLIC_GEMINI_API_KEY" .next/ 2>/dev/null; then
        echo -e "${RED}❌ SECURITY ISSUE: NEXT_PUBLIC_GEMINI_API_KEY found in build${NC}"
    else
        echo -e "${GREEN}✅ No public API keys found in build${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    fi
    TESTS_RUN=$((TESTS_RUN + 1))
fi

# Test 6: Verify environment configuration
echo "🌍 CHECKING ENVIRONMENT CONFIGURATION"
echo "====================================="

if grep -q "NEXT_PUBLIC_GEMINI_API_KEY" .env.local 2>/dev/null; then
    echo -e "${YELLOW}⚠️  WARNING: NEXT_PUBLIC_GEMINI_API_KEY still in .env.local${NC}"
    echo "   Consider removing it and using only GEMINI_API_KEY"
else
    echo -e "${GREEN}✅ No public API keys in .env.local${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
fi
TESTS_RUN=$((TESTS_RUN + 1))

# Cleanup
echo ""
echo "🧹 CLEANUP"
echo "=========="
kill $DEV_SERVER_PID 2>/dev/null
wait $DEV_SERVER_PID 2>/dev/null
echo -e "${GREEN}✅ Development server stopped${NC}"

# Summary
echo ""
echo "📊 TEST SUMMARY"
echo "==============="
echo -e "Tests run: ${BLUE}$TESTS_RUN${NC}"
echo -e "Tests passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests failed: ${RED}$((TESTS_RUN - TESTS_PASSED))${NC}"

if [ $TESTS_PASSED -eq $TESTS_RUN ]; then
    echo ""
    echo -e "${GREEN}🎉 ALL TESTS PASSED! 🎉${NC}"
    echo -e "${GREEN}Your API keys are now secure for production deployment.${NC}"
    exit 0
else
    echo ""
    echo -e "${YELLOW}⚠️  Some tests failed. Please review the output above.${NC}"
    exit 1
fi