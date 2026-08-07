#!/bin/bash
# Database Setup Script for DSA Platform
# Run this once to create the database and user

echo "🗄️  Setting up PostgreSQL database for DSA Platform..."
echo ""

# Create user and database
sudo -u postgres psql << 'EOF'
-- Create user (ignore error if already exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'dsa_user') THEN
    CREATE ROLE dsa_user WITH LOGIN PASSWORD 'dsa1234';
  END IF;
END
$$;

-- Create database (ignore error if already exists)
SELECT 'CREATE DATABASE dsa_db OWNER dsa_user'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'dsa_db')\gexec

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE dsa_db TO dsa_user;

-- Connect to dsa_db and grant schema permissions
\c dsa_db
GRANT ALL ON SCHEMA public TO dsa_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO dsa_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO dsa_user;
EOF

echo ""
echo "✅ Database 'dsa_db' and user 'dsa_user' created!"
echo ""
echo "Next steps:"
echo "  cd backend"
echo "  npx prisma generate    # Generate Prisma client"
echo "  npx prisma db push     # Create tables"
echo "  npm run import          # Import CSV data"
echo "  npm run dev             # Start server"
