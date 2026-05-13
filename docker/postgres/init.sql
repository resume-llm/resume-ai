-- Create application user and databases
DO
$$
BEGIN
   IF NOT EXISTS (
      SELECT FROM pg_catalog.pg_roles WHERE rolname = 'appuser') THEN
      CREATE ROLE appuser LOGIN PASSWORD 'apppass';
   END IF;
END
$$;

-- Create databases if not exist
DO
$$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_database WHERE datname = 'app_db') THEN
      CREATE DATABASE app_db OWNER appuser;
   END IF;
   IF NOT EXISTS (SELECT FROM pg_database WHERE datname = 'mlflow') THEN
      CREATE DATABASE mlflow OWNER appuser;
   END IF;
END
$$;
