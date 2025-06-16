#!/bin/bash

echo "🏠 Real Estate Aggregator - Database Setup"
echo "=========================================="

# Check if .env exists in root
if [ ! -f .env ]; then
    echo "Creating .env file from .env.example..."
    cp .env.example .env
    echo "✅ Created .env file"
    echo "⚠️  Please edit .env and add your database credentials"
    echo "   Specifically, update DATABASE_URL with your PostgreSQL connection string"
    exit 1
fi

# Check if DATABASE_URL is set
source .env
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL not found in .env file"
    echo "Please add your PostgreSQL connection string to .env"
    echo "Example: DATABASE_URL=postgresql://user:password@localhost:5432/real_estate_db"
    exit 1
fi

echo "📊 Database URL found: ${DATABASE_URL:0:30}..."

# Create .env files for apps if they don't exist
if [ ! -f apps/api/.env ]; then
    echo "Creating apps/api/.env..."
    cat > apps/api/.env << EOF
DATABASE_URL=$DATABASE_URL
PORT=3003
NODE_ENV=development
EOF
    echo "✅ Created apps/api/.env"
fi

if [ ! -f apps/web/.env.local ]; then
    echo "Creating apps/web/.env.local..."
    cat > apps/web/.env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:3003
CLAUDE_API_KEY=$CLAUDE_API_KEY
EOF
    echo "✅ Created apps/web/.env.local"
fi

# Run migrations
echo "🔄 Running database migrations..."
cd apps/api
npm run db:migrate

if [ $? -eq 0 ]; then
    echo "✅ Database migrations completed successfully!"
    
    # Test the connection
    echo "🧪 Testing database connection..."
    cd ../..
    
    # Start the API server in background
    echo "Starting API server for testing..."
    cd apps/api
    npm run dev &
    API_PID=$!
    
    # Wait for server to start
    sleep 5
    
    # Test the health endpoint
    echo "Testing API health endpoint..."
    curl -s http://localhost:3003/api/health | grep -q "connected"
    
    if [ $? -eq 0 ]; then
        echo "✅ Database connection successful!"
        echo ""
        echo "🎉 Setup completed! You can now:"
        echo "   1. Run 'npm run dev:all' from the root directory"
        echo "   2. Visit http://localhost:3000"
        echo "   3. The app will use real database data when available"
    else
        echo "⚠️  Database connection test failed"
        echo "Please check your DATABASE_URL and try again"
    fi
    
    # Kill the test server
    kill $API_PID 2>/dev/null
else
    echo "❌ Migration failed. Please check your database connection."
    echo "Make sure PostgreSQL is running and accessible."
fi