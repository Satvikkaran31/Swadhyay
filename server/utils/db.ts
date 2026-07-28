import pkg from 'pg';

const { Pool } = pkg;

const sslConfig = process.env.NODE_ENV === 'production'
  ? {
      rejectUnauthorized: Boolean(process.env.DATABASE_CA_CERT),
      ...(process.env.DATABASE_CA_CERT && { ca: process.env.DATABASE_CA_CERT }),
    }
  : false;

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: sslConfig,
});

export default pool;
