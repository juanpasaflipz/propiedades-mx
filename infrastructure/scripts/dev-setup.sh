#!/bin/bash
# Development Environment Setup Script

set -e

echo "🚀 Setting up Real Estate Aggregator development environment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop and try again."
    exit 1
fi

echo "✅ Docker is running"

# Navigate to project root
cd "$(dirname "$0")/../.."

# Start PostgreSQL and Redis
echo "🐘 Starting PostgreSQL and Redis..."
docker-compose up -d postgres redis

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
until docker-compose exec -T postgres pg_isready -U postgres > /dev/null 2>&1; do
    printf "."
    sleep 1
done
echo ""
echo "✅ PostgreSQL is ready"

# Wait for Redis to be ready
echo "⏳ Waiting for Redis to be ready..."
until docker-compose exec -T redis redis-cli ping > /dev/null 2>&1; do
    printf "."
    sleep 1
done
echo ""
echo "✅ Redis is ready"

# Run database migrations
echo "🔄 Running database migrations..."
cd apps/api
npm run db:migrate || echo "⚠️  Migrations need to be set up"
cd ../..

echo ""
echo "✨ Development environment is ready!"
echo ""
echo "📝 Next steps:"
echo "1. Run 'npm run dev:all' to start all services"
echo "2. Open http://localhost:3000 for the frontend"
echo "3. API is available at http://localhost:3003"
echo ""
echo "🛠️  Useful commands:"
echo "- View logs: docker-compose logs -f"
echo "- Stop services: docker-compose down"
echo "- Reset database: docker-compose down -v"