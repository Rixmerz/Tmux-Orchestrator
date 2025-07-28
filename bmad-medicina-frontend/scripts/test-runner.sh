#!/bin/bash

# BMad Medicina - Comprehensive Test Runner
# QA Engineer: Automated testing pipeline for healthcare MVP

set -e

echo "🧪 BMad Medicina Test Suite - Starting Comprehensive Testing"
echo "============================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results tracking
UNIT_PASSED=0
INTEGRATION_PASSED=0
E2E_PASSED=0
SECURITY_PASSED=0
ACCESSIBILITY_PASSED=0
PERFORMANCE_PASSED=0

# Function to print colored output
print_status() {
    local status=$1
    local message=$2
    if [ "$status" = "PASS" ]; then
        echo -e "${GREEN}✅ PASS${NC}: $message"
    elif [ "$status" = "FAIL" ]; then
        echo -e "${RED}❌ FAIL${NC}: $message"
    elif [ "$status" = "WARN" ]; then
        echo -e "${YELLOW}⚠️  WARN${NC}: $message"
    else
        echo -e "${BLUE}ℹ️  INFO${NC}: $message"
    fi
}

# Function to run tests with error handling
run_test_suite() {
    local test_type=$1
    local test_path=$2
    local description=$3
    
    echo ""
    echo -e "${BLUE}🔄 Running $test_type Tests${NC}"
    echo "Description: $description"
    echo "Path: $test_path"
    echo "----------------------------------------"
    
    if deno test --allow-all "$test_path" --reporter=pretty; then
        print_status "PASS" "$test_type tests completed successfully"
        return 0
    else
        print_status "FAIL" "$test_type tests failed"
        return 1
    fi
}

# Pre-test checks
echo -e "${BLUE}🔧 Pre-test Environment Checks${NC}"
echo "----------------------------------------"

# Check Deno installation
if command -v deno &> /dev/null; then
    DENO_VERSION=$(deno --version | head -n1)
    print_status "INFO" "Deno found: $DENO_VERSION"
else
    print_status "FAIL" "Deno not found. Please install Deno first."
    exit 1
fi

# Check if server is running
if curl -s http://localhost:8000 > /dev/null; then
    print_status "PASS" "Development server is running on port 8000"
else
    print_status "WARN" "Development server not running. Starting server..."
    deno task start &
    SERVER_PID=$!
    sleep 5
    
    if curl -s http://localhost:8000 > /dev/null; then
        print_status "PASS" "Development server started successfully"
    else
        print_status "FAIL" "Could not start development server"
        exit 1
    fi
fi

# Create test results directory
mkdir -p test-results/coverage
mkdir -p test-results/reports

echo ""
echo -e "${BLUE}🧪 Starting Test Execution${NC}"
echo "============================================================="

# 1. Unit Tests - Core functionality
if run_test_suite "Unit" "tests/unit/" "Testing core medication management logic"; then
    UNIT_PASSED=1
fi

# 2. Integration Tests - API and database
if run_test_suite "Integration" "tests/integration/" "Testing API endpoints and data flow"; then
    INTEGRATION_PASSED=1
fi

# 3. End-to-End Tests - User workflows
if run_test_suite "E2E" "tests/e2e/" "Testing complete user journeys and workflows"; then
    E2E_PASSED=1
fi

# 4. Security Tests - CRITICAL for healthcare data
if run_test_suite "Security" "tests/security/" "Testing Ley 19.628 compliance and data protection"; then
    SECURITY_PASSED=1
fi

# 5. Accessibility Tests - CRITICAL for senior users
if run_test_suite "Accessibility" "tests/accessibility/" "Testing WCAG 2.1 AA compliance for seniors"; then
    ACCESSIBILITY_PASSED=1
fi

# 6. Performance Tests - Core Web Vitals
if run_test_suite "Performance" "tests/performance/" "Testing Core Web Vitals and senior device performance"; then
    PERFORMANCE_PASSED=1
fi

# Test Coverage Report
echo ""
echo -e "${BLUE}📊 Generating Test Coverage Report${NC}"
echo "----------------------------------------"

if deno test --allow-all --coverage=test-results/coverage/ tests/; then
    deno coverage test-results/coverage/ --html test-results/reports/coverage.html
    print_status "PASS" "Coverage report generated: test-results/reports/coverage.html"
else
    print_status "WARN" "Coverage report generation failed"
fi

# Generate test summary
echo ""
echo "============================================================="
echo -e "${BLUE}📋 TEST EXECUTION SUMMARY${NC}"
echo "============================================================="

TOTAL_SUITES=6
PASSED_SUITES=$((UNIT_PASSED + INTEGRATION_PASSED + E2E_PASSED + SECURITY_PASSED + ACCESSIBILITY_PASSED + PERFORMANCE_PASSED))

echo "Test Suite Results:"
echo "├── Unit Tests:          $([ $UNIT_PASSED -eq 1 ] && echo -e "${GREEN}PASS${NC}" || echo -e "${RED}FAIL${NC}")"
echo "├── Integration Tests:   $([ $INTEGRATION_PASSED -eq 1 ] && echo -e "${GREEN}PASS${NC}" || echo -e "${RED}FAIL${NC}")"
echo "├── E2E Tests:           $([ $E2E_PASSED -eq 1 ] && echo -e "${GREEN}PASS${NC}" || echo -e "${RED}FAIL${NC}")"
echo "├── Security Tests:      $([ $SECURITY_PASSED -eq 1 ] && echo -e "${GREEN}PASS${NC}" || echo -e "${RED}FAIL${NC}")"
echo "├── Accessibility Tests: $([ $ACCESSIBILITY_PASSED -eq 1 ] && echo -e "${GREEN}PASS${NC}" || echo -e "${RED}FAIL${NC}")"
echo "└── Performance Tests:   $([ $PERFORMANCE_PASSED -eq 1 ] && echo -e "${GREEN}PASS${NC}" || echo -e "${RED}FAIL${NC}")"

echo ""
echo "Overall Result: $PASSED_SUITES/$TOTAL_SUITES test suites passed"

# Healthcare-specific quality gates
echo ""
echo -e "${BLUE}🏥 Healthcare Quality Gates${NC}"
echo "----------------------------------------"

CRITICAL_TESTS_PASSED=1

# Security is non-negotiable for healthcare
if [ $SECURITY_PASSED -eq 0 ]; then
    print_status "FAIL" "CRITICAL: Security tests failed - Cannot deploy healthcare app without data protection"
    CRITICAL_TESTS_PASSED=0
fi

# Accessibility is mandatory for senior users
if [ $ACCESSIBILITY_PASSED -eq 0 ]; then
    print_status "FAIL" "CRITICAL: Accessibility tests failed - Senior users must be able to use the app"
    CRITICAL_TESTS_PASSED=0
fi

# E2E tests ensure medication alerts work
if [ $E2E_PASSED -eq 0 ]; then
    print_status "FAIL" "CRITICAL: E2E tests failed - Medication alerts may not work properly"
    CRITICAL_TESTS_PASSED=0
fi

# Final verdict
echo ""
echo "============================================================="
if [ $CRITICAL_TESTS_PASSED -eq 1 ] && [ $PASSED_SUITES -ge 5 ]; then
    echo -e "${GREEN}🎉 QUALITY GATE: PASSED${NC}"
    echo "✅ Healthcare application meets quality standards"
    echo "✅ Safe for senior user deployment"
    echo "✅ Compliant with Chilean data protection laws"
    exit 0
else
    echo -e "${RED}🚫 QUALITY GATE: FAILED${NC}"
    echo "❌ Healthcare application does not meet minimum quality standards"
    echo "❌ NOT SAFE for deployment - patient safety risk"
    echo "🔧 Fix failing tests before deployment"
    exit 1
fi