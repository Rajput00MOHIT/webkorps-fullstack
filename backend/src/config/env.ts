import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  PORT: parseInt(process.env.PORT || '4000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  API_PREFIX: process.env.API_PREFIX || '/api/v1',
  CORS_ORIGIN: (process.env.CORS_ORIGIN || 'http://localhost:3000,http://localhost:5173').split(','),

  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/corp_talk_db',

  JWT_SECRET: process.env.JWT_SECRET || 'dev_secret_jwt_key_corp_talk_backend_2026',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',

  DEFAULT_TENANT_ID: process.env.DEFAULT_TENANT_ID || '00000000-0000-0000-0000-000000000001',

  LOCAL_OLLAMA_URL: process.env.LOCAL_OLLAMA_URL || 'http://localhost:11434',
  LOCAL_LLM_MODEL: process.env.LOCAL_LLM_MODEL || 'llama3.1:8b-instruct',
  ASSISTANT_MODEL: process.env.ASSISTANT_MODEL || process.env.LOCAL_LLM_MODEL || 'llama3.1:8b-instruct',
  LOCAL_EMBEDDING_MODEL: process.env.LOCAL_EMBEDDING_MODEL || 'bge-small-en-v1.5',

  SEARCH_PROVIDER: process.env.SEARCH_PROVIDER || 'duckduckgo',
  SEARXNG_URL: process.env.SEARXNG_URL || 'http://localhost:8080',

  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || '',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || ''
};
