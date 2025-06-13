#!/bin/bash
# Check status of all services

echo "🔍 Checking Real Estate Aggregator services..."
echo ""

# Check Docker
if docker info > /dev/null 2>&1; then
    echo "✅ Docker: Running"
    
    # Check PostgreSQL
    if docker-compose ps postgres 2>/dev/null | grep -q "Up"; then
        echo "✅ PostgreSQL: Running"
        docker-compose exec -T postgres psql -U postgres -c "SELECT version();" 2>/dev/null | head -1 || echo "   ⚠️  Cannot connect to database"
    else
        echo "❌ PostgreSQL: Not running"
    fi
    
    # Check Redis
    if docker-compose ps redis 2>/dev/null | grep -q "Up"; then
        echo "✅ Redis: Running"
        docker-compose exec -T redis redis-cli ping 2>/dev/null || echo "   ⚠️  Cannot connect to Redis"
    else
        echo "❌ Redis: Not running"
    fi
else
    echo "❌ Docker: Not running"
fi

echo ""

# Check Node.js services
echo "📡 Checking application services..."

# Check API
if curl -s http://localhost:3003/health > /dev/null 2>&1; then
    echo "✅ API: Running at http://localhost:3003"
    curl -s http://localhost:3003/health | jq -r '.status' 2>/dev/null || echo "   Response received"
else
    echo "❌ API: Not running"
fi

# Check Frontend
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Frontend: Running at http://localhost:3000"
elif curl -s http://localhost:3001 > /dev/null 2>&1; then
    echo "✅ Frontend: Running at http://localhost:3001"
else
    echo "❌ Frontend: Not running"
fi

echo ""
echo "💡 Tips:"
echo "- Start all services: npm run dev:all"
echo "- View Docker logs: docker-compose logs -f"
echo "- Check specific service: docker-compose ps"