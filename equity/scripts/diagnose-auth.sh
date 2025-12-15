#!/bin/bash

##############################################################################
# Authentication Diagnosis Script
# 
# This script diagnoses common authentication issues
##############################################################################

set -e

echo "=========================================="
echo "Authentication Diagnosis"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Check if .env.local exists
echo "1. Checking Environment Configuration..."
if [ ! -f "../env.local" ]; then
    print_error "env.local not found!"
    exit 1
fi
print_success "env.local found"

# Load environment
export $(cat ../env.local | grep -v '^#' | xargs)

# Check NEXTAUTH_SECRET
if [ -z "$NEXTAUTH_SECRET" ]; then
    print_error "NEXTAUTH_SECRET is missing!"
    print_info "Generate one: openssl rand -base64 32"
    exit 1
fi

if [ ${#NEXTAUTH_SECRET} -lt 32 ]; then
    print_warning "NEXTAUTH_SECRET is too short (should be 32+ chars)"
else
    print_success "NEXTAUTH_SECRET is configured"
fi

# Check NEXTAUTH_URL
if [ -z "$NEXTAUTH_URL" ]; then
    print_error "NEXTAUTH_URL is missing!"
    exit 1
fi
print_success "NEXTAUTH_URL: $NEXTAUTH_URL"

# Check Database Configuration
echo ""
echo "2. Checking Database Configuration..."

if [ -z "$DATABASE_HOST" ] || [ -z "$DATABASE_USER" ] || [ -z "$DATABASE_NAME" ]; then
    print_error "Database configuration incomplete!"
    exit 1
fi

print_success "Database config found"
print_info "Host: $DATABASE_HOST"
print_info "User: $DATABASE_USER"
print_info "Database: $DATABASE_NAME"

# Test database connection
echo ""
echo "3. Testing Database Connection..."

if command -v mysql &> /dev/null; then
    if mysql -h"$DATABASE_HOST" -P"${DATABASE_PORT:-3306}" -u"$DATABASE_USER" -p"$DATABASE_PASSWORD" "$DATABASE_NAME" -e "SELECT 1" &>/dev/null; then
        print_success "Database connection successful"
    else
        print_error "Cannot connect to database!"
        print_info "Check if MySQL is running: brew services list | grep mysql"
        print_info "Or: sudo systemctl status mysql"
        exit 1
    fi
else
    print_warning "MySQL client not found, skipping database test"
fi

# Check if users table exists
echo ""
echo "4. Checking Database Tables..."

if command -v mysql &> /dev/null; then
    USERS_TABLE=$(mysql -h"$DATABASE_HOST" -P"${DATABASE_PORT:-3306}" -u"$DATABASE_USER" -p"$DATABASE_PASSWORD" "$DATABASE_NAME" -se "SHOW TABLES LIKE 'users'" 2>/dev/null)
    
    if [ -n "$USERS_TABLE" ]; then
        print_success "users table exists"
        
        # Count users
        USER_COUNT=$(mysql -h"$DATABASE_HOST" -P"${DATABASE_PORT:-3306}" -u"$DATABASE_USER" -p"$DATABASE_PASSWORD" "$DATABASE_NAME" -se "SELECT COUNT(*) FROM users" 2>/dev/null)
        print_info "Total users: $USER_COUNT"
    else
        print_error "users table not found!"
        print_info "Run database migrations first"
        exit 1
    fi
    
    # Check sessions table
    SESSIONS_TABLE=$(mysql -h"$DATABASE_HOST" -P"${DATABASE_PORT:-3306}" -u"$DATABASE_USER" -p"$DATABASE_PASSWORD" "$DATABASE_NAME" -se "SHOW TABLES LIKE 'sessions'" 2>/dev/null)
    
    if [ -n "$SESSIONS_TABLE" ]; then
        print_success "sessions table exists"
    else
        print_warning "sessions table not found!"
        print_info "Run: mysql -u db -p oneapp < scripts/migrate-nextauth-sessions.sql"
    fi
fi

# Check if app is running
echo ""
echo "5. Checking Application Status..."

if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    print_success "Application is running on port 3000"
else
    print_warning "Application is not running"
    print_info "Start with: npm run dev"
fi

# Check node_modules
echo ""
echo "6. Checking Dependencies..."

if [ -d "node_modules" ]; then
    print_success "node_modules exists"
    
    # Check for next-auth
    if [ -d "node_modules/next-auth" ]; then
        print_success "next-auth installed"
    else
        print_error "next-auth not installed!"
        print_info "Run: npm install"
    fi
else
    print_error "node_modules not found!"
    print_info "Run: npm install"
fi

# Check .next build folder
if [ -d ".next" ]; then
    print_success "Build folder exists"
else
    print_warning "Build folder not found"
    print_info "App will build on first run"
fi

echo ""
echo "=========================================="
echo "Diagnosis Complete"
echo "=========================================="
echo ""

# Provide recommendations
echo "RECOMMENDATIONS:"
echo ""

if [ -z "$SESSIONS_TABLE" ]; then
    print_warning "Run the authentication migration:"
    echo "  cd equity"
    echo "  mysql -u db -p oneapp < scripts/migrate-nextauth-sessions.sql"
    echo ""
fi

if ! lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    print_warning "Start the application:"
    echo "  cd equity"
    echo "  npm run dev"
    echo ""
fi

echo "TESTING STEPS:"
echo "1. Open browser: http://localhost:3000"
echo "2. Try to login"
echo "3. Check browser console for errors (F12)"
echo "4. Check server logs in terminal"
echo ""

echo "COMMON ISSUES:"
echo ""
print_info "Issue: Stuck on login page after successful login"
echo "   Solution: Check if sessions table exists"
echo "   Run migration if needed"
echo ""

print_info "Issue: 'Invalid session' error"
echo "   Solution: NEXTAUTH_SECRET might have changed"
echo "   Clear cookies and try again"
echo ""

print_info "Issue: Database connection errors"
echo "   Solution: Start MySQL server"
echo "   macOS: brew services start mysql"
echo "   Linux: sudo systemctl start mysql"
echo ""

print_success "Run this script anytime to diagnose auth issues!"

