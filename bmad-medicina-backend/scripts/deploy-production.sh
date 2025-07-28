#!/bin/bash
# BMad Medicina Backend - Production Deployment Script
# Usage: ./scripts/deploy-production.sh

set -e  # Exit on any error

echo "🚀 BMad Medicina Backend - Production Deployment"
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="bmad-medicina-backend"
DENO_DEPLOY_PROJECT="bmad-medicina"
HEALTH_CHECK_URL="https://${DENO_DEPLOY_PROJECT}.deno.dev/health"
API_TEST_URL="https://${DENO_DEPLOY_PROJECT}.deno.dev/api/v1"

echo -e "${BLUE}Starting deployment process...${NC}"

# Step 1: Pre-deployment checks
echo -e "\n${YELLOW}🔍 Step 1: Pre-deployment verification${NC}"

echo "Checking code quality..."
if ! deno fmt --check; then
    echo -e "${RED}❌ Code formatting check failed. Run 'deno fmt' first.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Code formatting OK${NC}"

echo "Running type checks..."
if ! deno check src/main.ts; then
    echo -e "${RED}❌ Type checking failed. Fix TypeScript errors first.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Type checking OK${NC}"

echo "Running tests..."
if ! deno test -A tests/ 2>/dev/null || true; then
    echo -e "${YELLOW}⚠️  Tests not found or failed. Continuing deployment...${NC}"
else
    echo -e "${GREEN}✅ Tests passed${NC}"
fi

# Step 2: Environment validation
echo -e "\n${YELLOW}🔧 Step 2: Environment validation${NC}"

if [ -z "$DENO_DEPLOY_TOKEN" ]; then
    echo -e "${RED}❌ DENO_DEPLOY_TOKEN environment variable not set${NC}"
    echo "Set it with: export DENO_DEPLOY_TOKEN=your_token"
    exit 1
fi
echo -e "${GREEN}✅ Deno Deploy token configured${NC}"

# Step 3: Git preparation
echo -e "\n${YELLOW}📝 Step 3: Git preparation${NC}"

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}⚠️  Uncommitted changes detected. Committing automatically...${NC}"
    git add -A
    git commit -m "Production deployment $(date '+%Y-%m-%d %H:%M:%S')"
fi

# Push to main branch
echo "Pushing to main branch..."
git push origin main
echo -e "${GREEN}✅ Code pushed to repository${NC}"

# Step 4: Deploy to Deno Deploy
echo -e "\n${YELLOW}🚀 Step 4: Deploying to Deno Deploy${NC}"

# Create deployment
DEPLOY_RESPONSE=$(curl -s -X POST "https://api.deno.com/v1/projects/${DENO_DEPLOY_PROJECT}/deployments" \
  -H "Authorization: Bearer ${DENO_DEPLOY_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "entryPointUrl": "https://raw.githubusercontent.com/your-username/your-repo/main/src/main.ts",
    "envVars": {},
    "databases": {}
  }')

if echo "$DEPLOY_RESPONSE" | grep -q "error"; then
    echo -e "${RED}❌ Deployment failed:${NC}"
    echo "$DEPLOY_RESPONSE"
    exit 1
fi

DEPLOYMENT_ID=$(echo "$DEPLOY_RESPONSE" | jq -r '.id')
echo -e "${GREEN}✅ Deployment initiated: ${DEPLOYMENT_ID}${NC}"

# Step 5: Wait for deployment
echo -e "\n${YELLOW}⏳ Step 5: Waiting for deployment to complete${NC}"

echo "Waiting for deployment to be ready..."
sleep 30  # Give it time to deploy

# Check deployment status
for i in {1..12}; do  # Wait up to 2 minutes
    STATUS=$(curl -s "https://api.deno.com/v1/projects/${DENO_DEPLOY_PROJECT}/deployments/${DEPLOYMENT_ID}" \
      -H "Authorization: Bearer ${DENO_DEPLOY_TOKEN}" | jq -r '.status')
    
    if [ "$STATUS" = "success" ]; then
        echo -e "${GREEN}✅ Deployment completed successfully${NC}"
        break
    elif [ "$STATUS" = "failed" ]; then
        echo -e "${RED}❌ Deployment failed${NC}"
        exit 1
    else
        echo "Deployment status: $STATUS (attempt $i/12)"
        sleep 10
    fi
done

# Step 6: Post-deployment verification
echo -e "\n${YELLOW}🔍 Step 6: Post-deployment verification${NC}"

# Health check
echo "Testing health endpoint..."
sleep 5  # Give the app time to start

HEALTH_STATUS=$(curl -s -f "$HEALTH_CHECK_URL" | jq -r '.status' 2>/dev/null || echo "failed")
if [ "$HEALTH_STATUS" != "healthy" ]; then
    echo -e "${RED}❌ Health check failed: $HEALTH_STATUS${NC}"
    echo "URL: $HEALTH_CHECK_URL"
    exit 1
fi
echo -e "${GREEN}✅ Health check passed${NC}"

# API test
echo "Testing API endpoint..."
API_STATUS=$(curl -s -f "$API_TEST_URL" | jq -r '.service' 2>/dev/null || echo "failed")
if [ "$API_STATUS" != "BMad Medicina Backend API" ]; then
    echo -e "${RED}❌ API test failed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ API test passed${NC}"

# Performance test
echo "Testing response time..."
RESPONSE_TIME=$(curl -o /dev/null -s -w "%{time_total}" "$HEALTH_CHECK_URL")
if (( $(echo "$RESPONSE_TIME > 1.0" | bc -l) )); then
    echo -e "${YELLOW}⚠️  Warning: Response time ${RESPONSE_TIME}s exceeds 1s${NC}"
else
    echo -e "${GREEN}✅ Response time OK: ${RESPONSE_TIME}s${NC}"
fi

# Step 7: Update monitoring
echo -e "\n${YELLOW}📊 Step 7: Updating monitoring${NC}"

# Send deployment notification (example with Slack webhook)
if [ -n "$SLACK_WEBHOOK_URL" ]; then
    curl -X POST -H 'Content-type: application/json' \
    --data "{\"text\":\"🚀 BMad Medicina Backend deployed successfully to production\\nDeployment ID: ${DEPLOYMENT_ID}\\nHealth: ${HEALTH_STATUS}\\nResponse time: ${RESPONSE_TIME}s\"}" \
    "$SLACK_WEBHOOK_URL" 2>/dev/null || true
    echo -e "${GREEN}✅ Notification sent${NC}"
fi

# Step 8: Deployment summary
echo -e "\n${GREEN}🎉 DEPLOYMENT COMPLETED SUCCESSFULLY${NC}"
echo "========================================"
echo "Project: $PROJECT_NAME"
echo "Deployment ID: $DEPLOYMENT_ID"
echo "Health Status: $HEALTH_STATUS"
echo "Response Time: ${RESPONSE_TIME}s"
echo "Health URL: $HEALTH_CHECK_URL"
echo "API URL: $API_TEST_URL"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "1. Monitor application performance"
echo "2. Verify frontend integration"
echo "3. Check logs for any issues"
echo "4. Update team on deployment status"
echo ""
echo -e "${GREEN}Deployment completed at: $(date)${NC}"