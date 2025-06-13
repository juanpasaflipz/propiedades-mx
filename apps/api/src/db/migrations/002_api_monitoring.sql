-- Create API monitoring tables
CREATE TABLE IF NOT EXISTS api_logs (
  id SERIAL PRIMARY KEY,
  request_id UUID DEFAULT gen_random_uuid(),
  api_provider VARCHAR(50) NOT NULL,
  endpoint VARCHAR(255) NOT NULL,
  method VARCHAR(10) NOT NULL,
  request_params JSONB,
  response_status INTEGER,
  response_time_ms INTEGER,
  error_message TEXT,
  user_ip VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX idx_api_logs_created_at ON api_logs(created_at DESC);
CREATE INDEX idx_api_logs_provider ON api_logs(api_provider);
CREATE INDEX idx_api_logs_status ON api_logs(response_status);

-- Create API provider configuration table
CREATE TABLE IF NOT EXISTS api_providers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  enabled BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 1,
  base_url VARCHAR(255),
  api_key_env_var VARCHAR(50),
  rate_limit INTEGER DEFAULT 100, -- requests per minute
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default API providers
INSERT INTO api_providers (name, priority, base_url, api_key_env_var) VALUES
  ('EasyBroker', 1, 'https://api.easybroker.com/v1', 'EASYBROKER_API_KEY'),
  ('MercadoLibre', 2, 'https://api.mercadolibre.com', 'MERCADOLIBRE_API_KEY'),
  ('Inmuebles24', 3, 'https://api.inmuebles24.com', 'INMUEBLES24_API_KEY')
ON CONFLICT (name) DO NOTHING;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for api_providers
CREATE TRIGGER update_api_providers_updated_at BEFORE UPDATE
    ON api_providers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();