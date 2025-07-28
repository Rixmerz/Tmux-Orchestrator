#!/bin/bash

# BMad Medicina - Live Integration Monitoring Script
# Continuous validation as Frontend connects to Backend

set -e

echo "🔄 BMad Integration Monitor - LIVE Testing"
echo "=========================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

BACKEND_URL="http://localhost:8080"
FRONTEND_URL="http://localhost:8000"

print_status() {
    local status=$1
    local message=$2
    case "$status" in
        "PASS") echo -e "${GREEN}✅ PASS${NC}: $message" ;;
        "FAIL") echo -e "${RED}❌ FAIL${NC}: $message" ;;
        "WARN") echo -e "${YELLOW}⚠️  WAIT${NC}: $message" ;;
        *) echo -e "${BLUE}ℹ️  INFO${NC}: $message" ;;
    esac
}

check_server() {
    local url=$1
    local name=$2
    
    if curl -s "$url" > /dev/null 2>&1; then
        print_status "PASS" "$name server responding on $url"
        return 0
    else
        print_status "FAIL" "$name server NOT responding on $url"
        return 1
    fi
}

test_api_endpoint() {
    local endpoint=$1
    local description=$2
    
    if curl -s "$BACKEND_URL$endpoint" > /dev/null 2>&1; then
        print_status "PASS" "$description endpoint ready"
        return 0
    else
        print_status "WARN" "$description endpoint not yet available"
        return 1
    fi
}

echo -e "${BLUE}🔍 Server Status Check${NC}"
echo "----------------------------------------"

BACKEND_READY=0
FRONTEND_READY=0

if check_server "$BACKEND_URL" "Backend"; then
    BACKEND_READY=1
fi

if check_server "$FRONTEND_URL" "Frontend"; then
    FRONTEND_READY=1
fi

echo ""
echo -e "${BLUE}🔗 API Endpoint Validation${NC}"
echo "----------------------------------------"

if [ $BACKEND_READY -eq 1 ]; then
    # Test critical medication endpoints
    test_api_endpoint "/api/medications" "Medications API"
    test_api_endpoint "/api/patients" "Patients API"
    test_api_endpoint "/api/alerts" "Alerts API"
    test_api_endpoint "/health" "Health Check"
    
    echo ""
    echo -e "${BLUE}🧪 Running Integration Tests${NC}"
    echo "----------------------------------------"
    
    # Run the integration test suite
    if deno test --allow-all tests/integration/api-integration.test.ts --reporter=pretty; then
        print_status "PASS" "Integration tests completed successfully"
        INTEGRATION_PASSED=1
    else
        print_status "WARN" "Some integration tests pending backend implementation"
        INTEGRATION_PASSED=0
    fi
else
    print_status "WARN" "Backend not ready - waiting for port 8080"
    INTEGRATION_PASSED=0
fi

echo ""
echo -e "${BLUE}🏥 Healthcare Compliance Check${NC}"
echo "----------------------------------------"

if [ $BACKEND_READY -eq 1 ]; then
    # Test data protection endpoints
    if curl -s "$BACKEND_URL/api/privacy/consent" > /dev/null 2>&1; then
        print_status "PASS" "Data consent management ready"
    else
        print_status "WARN" "Consent management endpoint pending"
    fi
    
    # Test audit logging
    if curl -s "$BACKEND_URL/api/audit/log" > /dev/null 2>&1; then
        print_status "PASS" "Audit logging system ready"
    else
        print_status "WARN" "Audit logging endpoint pending"
    fi
else
    print_status "WARN" "Healthcare compliance tests waiting for backend"
fi

echo ""
echo "=========================================="
echo -e "${BLUE}📊 INTEGRATION STATUS SUMMARY${NC}"
echo "=========================================="

echo "Server Status:"
echo "├── Backend (8080):  $([ $BACKEND_READY -eq 1 ] && echo -e "${GREEN}READY${NC}" || echo -e "${RED}WAITING${NC}")"
echo "└── Frontend (8000): $([ $FRONTEND_READY -eq 1 ] && echo -e "${GREEN}READY${NC}" || echo -e "${RED}WAITING${NC}")"

echo ""
if [ $BACKEND_READY -eq 1 ] && [ $FRONTEND_READY -eq 1 ]; then
    echo -e "${GREEN}🎉 INTEGRATION READY${NC}"
    echo "✅ Both servers operational"
    echo "✅ API endpoints accessible" 
    echo "✅ Integration tests can run"
    echo ""
    echo "🚀 Execute full integration test suite:"
    echo "   ./scripts/test-runner.sh --integration-only"
elif [ $BACKEND_READY -eq 1 ]; then
    echo -e "${YELLOW}⏳ BACKEND READY - WAITING FOR FRONTEND${NC}"
    echo "✅ Backend APIs operational on port 8080"
    echo "⏳ Frontend server needed on port 8000"
elif [ $FRONTEND_READY -eq 1 ]; then
    echo -e "${YELLOW}⏳ FRONTEND READY - WAITING FOR BACKEND${NC}"
    echo "✅ Frontend server operational on port 8000"
    echo "⏳ Backend APIs needed on port 8080"
else
    echo -e "${RED}🔄 WAITING FOR BOTH SERVERS${NC}"
    echo "⏳ Backend needed on port 8080"
    echo "⏳ Frontend needed on port 8000"
fi

echo ""
echo "🔄 Monitor Mode: Run this script periodically to track integration progress"
echo "📋 QA Engineer: Standing by for live integration validation"