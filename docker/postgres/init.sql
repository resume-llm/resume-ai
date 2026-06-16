-- Create application user if it doesn't exist
DO
$$
BEGIN
   IF NOT EXISTS (
      SELECT FROM pg_catalog.pg_roles WHERE rolname = 'appuser') THEN
      CREATE ROLE appuser LOGIN PASSWORD 'apppass';
   END IF;
END
$$;

-- app_db is created automatically by POSTGRES_DB env var in docker-compose;
-- this grants ownership in case the role was created after the database.
ALTER DATABASE app_db OWNER TO appuser;
