const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

const dbUrl = process.env.DATABASE_URL || '';
const isCloud = dbUrl.includes('sslmode=require') || dbUrl.includes('aivencloud.com') || process.env.NODE_ENV === 'production';
const cleanUrl = dbUrl.replace(/([?&])sslmode=[^&]+(&|$)/, (m, p1, p2) => p1 === '?' && p2 ? '?' : '').replace(/\?$/, '');

const pool = new Pool({
  connectionString: cleanUrl,
  ssl: isCloud ? { rejectUnauthorized: false } : false,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

module.exports = prisma;
