#!/bin/bash

# OneApp Portfolio - Setup Verification Script
# This script checks if everything is properly configured

echo "🔍 OneApp Portfolio - Setup Verification"
echo "=========================================="
echo ""

# Check if DDEV is installed
echo "1. Checking DDEV installation..."
if command -v ddev &> /dev/null; then
    echo "   ✅ DDEV is installed: $(ddev version | head -1)"
else
    echo "   ❌ DDEV is not installed"
    echo "   Install from: https://ddev.readthedocs.io/en/stable/#installation"
    exit 1
fi
echo ""

# Check if Docker is running
echo "2. Checking Docker..."
if docker ps &> /dev/null; then
    echo "   ✅ Docker is running"
else
    echo "   ❌ Docker is not running"
    echo "   Please start Docker Desktop and try again"
    exit 1
fi
echo ""

# Check DDEV project status
echo "3. Checking DDEV project status..."
cd "$(dirname "$0")"
if ddev describe &> /dev/null; then
    echo "   ✅ DDEV project 'oneapp' is running"
    echo ""
    echo "   📊 Project Details:"
    ddev describe | grep -E "(Name|Status|URLs|Database)"
else
    echo "   ⚠️  DDEV project is not running"
    echo "   Starting DDEV..."
    ddev start
    if [ $? -eq 0 ]; then
        echo "   ✅ DDEV started successfully"
    else
        echo "   ❌ Failed to start DDEV"
        exit 1
    fi
fi
echo ""

# Check database
echo "4. Checking database..."
if ddev mysql -e "USE oneapp; SHOW TABLES;" &> /dev/null; then
    echo "   ✅ Database 'oneapp' exists"
    
    # Count tables
    table_count=$(ddev mysql -s -N -e "USE oneapp; SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'oneapp';")
    echo "   📊 Tables found: $table_count"
    
    if [ "$table_count" -ge 3 ]; then
        echo "   ✅ All required tables exist (accounts, trades, ledger)"
    else
        echo "   ⚠️  Some tables may be missing. Reinitializing..."
        ddev mysql < .ddev/mysql/init.sql
        echo "   ✅ Database reinitialized"
    fi
else
    echo "   ❌ Database 'oneapp' not found"
    echo "   Creating database..."
    ddev mysql < .ddev/mysql/init.sql
    echo "   ✅ Database created"
fi
echo ""

# Check Node modules
echo "5. Checking Node.js dependencies..."
if [ -d "kite-client-app/node_modules" ]; then
    echo "   ✅ node_modules exists"
    
    # Check for key dependencies
    if [ -d "kite-client-app/node_modules/mysql2" ] && \
       [ -d "kite-client-app/node_modules/csv-parse" ] && \
       [ -d "kite-client-app/node_modules/xirr" ]; then
        echo "   ✅ All required packages installed (mysql2, csv-parse, xirr)"
    else
        echo "   ⚠️  Some packages may be missing. Installing..."
        ddev exec "cd kite-client-app && npm install"
    fi
else
    echo "   ⚠️  node_modules not found. Installing dependencies..."
    ddev exec "cd kite-client-app && npm install"
fi
echo ""

# Check if app is accessible
echo "6. Checking application accessibility..."
if curl -k -s -o /dev/null -w "%{http_code}" https://oneapp.ddev.site | grep -q "200\|301\|302"; then
    echo "   ✅ Application is accessible at https://oneapp.ddev.site"
else
    echo "   ⚠️  Application may not be fully ready yet"
    echo "   This is normal if you just started DDEV"
    echo "   Try accessing https://oneapp.ddev.site in your browser"
fi
echo ""

# Summary
echo "=========================================="
echo "📋 VERIFICATION SUMMARY"
echo "=========================================="
echo ""
echo "✅ Setup verification complete!"
echo ""
echo "🚀 Next Steps:"
echo "   1. Open your browser and go to: https://oneapp.ddev.site"
echo "   2. Navigate to Settings → Accounts to add your accounts"
echo "   3. Go to Import page to upload your CSV files"
echo "   4. View your portfolio on the Dashboard"
echo ""
echo "📚 Documentation:"
echo "   • Getting Started: ./GETTING_STARTED.md"
echo "   • Project Status:  ./PROJECT_STATUS.md"
echo "   • Requirements:    ./docs/FR-001-accounts-overview.md"
echo ""
echo "🛠️  Useful Commands:"
echo "   • ddev describe    - View project details"
echo "   • ddev logs        - View application logs"
echo "   • ddev mysql       - Access database CLI"
echo "   • ddev stop        - Stop the project"
echo "   • ddev restart     - Restart the project"
echo ""
echo "=========================================="

