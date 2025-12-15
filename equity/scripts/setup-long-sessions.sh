#!/bin/bash

##############################################################################
# Long Session Authentication Setup Script
# 
# This script helps set up database-backed authentication with long sessions
##############################################################################

set -e  # Exit on error

echo "=========================================="
echo "Long Session Authentication Setup"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
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
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Check if .env.local exists
if [ ! -f "../env.local" ]; then
    print_error "env.local not found!"
    print_info "Please create env.local with database credentials"
    exit 1
fi

print_success "Found env.local"

# Load environment variables
export $(cat ../env.local | grep -v '^#' | xargs)

# Check required environment variables
print_info "Checking environment variables..."

if [ -z "$DATABASE_HOST" ] || [ -z "$DATABASE_USER" ] || [ -z "$DATABASE_NAME" ]; then
    print_error "Missing required database environment variables!"
    print_info "Required: DATABASE_HOST, DATABASE_USER, DATABASE_NAME, DATABASE_PASSWORD"
    exit 1
fi

print_success "Environment variables OK"

# Check if NEXTAUTH_SECRET exists and is strong enough
if [ -z "$NEXTAUTH_SECRET" ] || [ ${#NEXTAUTH_SECRET} -lt 32 ]; then
    print_warning "NEXTAUTH_SECRET is missing or too short!"
    print_info "Generating a secure secret..."
    
    # Generate a secure secret
    NEW_SECRET=$(openssl rand -base64 32)
    
    echo ""
    print_info "Add this to your env.local:"
    echo "NEXTAUTH_SECRET=$NEW_SECRET"
    echo ""
    
    read -p "Would you like to add it automatically? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # Check if NEXTAUTH_SECRET exists in file
        if grep -q "NEXTAUTH_SECRET=" ../env.local; then
            # Replace existing
            sed -i.backup "s|NEXTAUTH_SECRET=.*|NEXTAUTH_SECRET=$NEW_SECRET|" ../env.local
        else
            # Add new
            echo "NEXTAUTH_SECRET=$NEW_SECRET" >> ../env.local
        fi
        print_success "NEXTAUTH_SECRET added to env.local"
        NEXTAUTH_SECRET=$NEW_SECRET
    fi
fi

# Test database connection
print_info "Testing database connection..."

mysql -h"$DATABASE_HOST" -P"${DATABASE_PORT:-3306}" -u"$DATABASE_USER" -p"$DATABASE_PASSWORD" "$DATABASE_NAME" -e "SELECT 1" &>/dev/null

if [ $? -eq 0 ]; then
    print_success "Database connection successful"
else
    print_error "Cannot connect to database!"
    print_info "Please check your database credentials in env.local"
    exit 1
fi

# Check if sessions table already exists
print_info "Checking if sessions table exists..."

TABLE_EXISTS=$(mysql -h"$DATABASE_HOST" -P"${DATABASE_PORT:-3306}" -u"$DATABASE_USER" -p"$DATABASE_PASSWORD" "$DATABASE_NAME" -se "SHOW TABLES LIKE 'sessions'" 2>/dev/null)

if [ -n "$TABLE_EXISTS" ]; then
    print_warning "Sessions table already exists!"
    read -p "Do you want to recreate it? This will delete existing sessions. (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Skipping table creation"
    else
        print_info "Dropping existing sessions table..."
        mysql -h"$DATABASE_HOST" -P"${DATABASE_PORT:-3306}" -u"$DATABASE_USER" -p"$DATABASE_PASSWORD" "$DATABASE_NAME" -e "DROP TABLE IF EXISTS sessions"
    fi
fi

# Run migration
print_info "Running database migration..."

mysql -h"$DATABASE_HOST" -P"${DATABASE_PORT:-3306}" -u"$DATABASE_USER" -p"$DATABASE_PASSWORD" "$DATABASE_NAME" < migrate-nextauth-sessions.sql

if [ $? -eq 0 ]; then
    print_success "Migration completed successfully"
else
    print_error "Migration failed!"
    exit 1
fi

# Verify tables
print_info "Verifying tables..."

SESSIONS_TABLE=$(mysql -h"$DATABASE_HOST" -P"${DATABASE_PORT:-3306}" -u"$DATABASE_USER" -p"$DATABASE_PASSWORD" "$DATABASE_NAME" -se "SHOW TABLES LIKE 'sessions'" 2>/dev/null)
VERIFICATION_TABLE=$(mysql -h"$DATABASE_HOST" -P"${DATABASE_PORT:-3306}" -u"$DATABASE_USER" -p"$DATABASE_PASSWORD" "$DATABASE_NAME" -se "SHOW TABLES LIKE 'verification_tokens'" 2>/dev/null)

if [ -n "$SESSIONS_TABLE" ]; then
    print_success "Sessions table created"
else
    print_error "Sessions table not found!"
    exit 1
fi

if [ -n "$VERIFICATION_TABLE" ]; then
    print_success "Verification tokens table created"
else
    print_warning "Verification tokens table not found (may already exist)"
fi

# Check event scheduler
print_info "Checking MySQL event scheduler..."

EVENT_SCHEDULER=$(mysql -h"$DATABASE_HOST" -P"${DATABASE_PORT:-3306}" -u"$DATABASE_USER" -p"$DATABASE_PASSWORD" -se "SHOW VARIABLES LIKE 'event_scheduler'" 2>/dev/null | awk '{print $2}')

if [ "$EVENT_SCHEDULER" = "ON" ]; then
    print_success "Event scheduler is enabled"
else
    print_warning "Event scheduler is disabled!"
    print_info "Expired sessions won't be automatically cleaned up"
    print_info "To enable: SET GLOBAL event_scheduler = ON;"
fi

echo ""
echo "=========================================="
print_success "Setup completed successfully!"
echo "=========================================="
echo ""

print_info "Next steps:"
echo "1. Restart your application: npm run dev"
echo "2. Test login with credentials or Google OAuth"
echo "3. Check session persistence (close/reopen browser)"
echo "4. Read LONG_SESSION_AUTH_SETUP.md for more details"
echo ""

print_warning "Important Notes:"
echo "• Sessions now last 30 days (configurable)"
echo "• Existing users will need to log in again"
echo "• Keep NEXTAUTH_SECRET secure and never change it"
echo "• In production, use HTTPS (secure cookies)"
echo ""

print_success "All done! 🎉"

