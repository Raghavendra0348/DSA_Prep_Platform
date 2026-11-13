const app    = require('./app');
const prisma = require('./lib/prisma');
const PORT   = process.env.PORT || 5000;

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT} (0.0.0.0)`);

});

// Drain HTTP requests and release DB connections during rolling deployments.
let shuttingDown = false;
function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  const deadline = setTimeout(() => process.exit(1), 10000);
  deadline.unref();
  server.close(async () => {
    try {
      await prisma.$disconnect();
      clearTimeout(deadline);
    } catch {
      console.error('Database shutdown failed');
      process.exitCode = 1;
    }
  });
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
