const app    = require('./app');
const prisma = require('./lib/prisma');
const PORT   = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT} (0.0.0.0)`);

  // ── Keep Aiven free-tier DB alive ──────────────────────────────────────
  // Free tier powers off the DB after inactivity → cold start on next request.
  // Ping every 4 minutes with a cheap query to keep the connection warm.
  setInterval(async () => {
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch {
      // Silent — don't crash the server if DB is momentarily unreachable
    }
  }, 4 * 60 * 1000); // every 4 minutes
});
