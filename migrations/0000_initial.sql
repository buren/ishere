CREATE TABLE IF NOT EXISTS links (
  id VARCHAR(100) PRIMARY KEY,
  destinationUrl VARCHAR(2048) NOT NULL,
	expirationTtl INT,
  namespace VARCHAR(100),
	-- TODO do we need to add explicit time zone information here?
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	expiresAt TIMESTAMP
);
