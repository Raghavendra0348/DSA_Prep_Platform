const dns = require('node:dns');

if (dns.setDefaultResultOrder) dns.setDefaultResultOrder('ipv4first');

// Normalize TLS before pg parses the URL: URL ssl options otherwise override
// the Pool's ssl object. Remote databases always verify the CA and hostname.
function databaseConfig(connectionString, env = process.env) {
  let url;
  try {
    url = new URL(connectionString);
    if (!['postgres:', 'postgresql:'].includes(url.protocol)) throw new Error();
  } catch {
    throw new Error('A valid PostgreSQL connection URL is required');
  }
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  const tls = !local || env.NODE_ENV === 'production' ||
    (url.searchParams.has('sslmode') && url.searchParams.get('sslmode') !== 'disable');
  url.searchParams.delete('uselibpqcompat');
  url.searchParams.delete('ssl');
  url.searchParams.set('sslmode', tls ? 'verify-full' : 'disable');
  if (tls && env.DB_SSL_CA_PATH) url.searchParams.set('sslrootcert', env.DB_SSL_CA_PATH);
  return {
    connectionString: url.toString(),
    enableChannelBinding: true,
    connectionTimeoutMillis: 10000,
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000,
  };
}

module.exports = { databaseConfig };
