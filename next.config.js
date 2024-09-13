/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
}

module.exports = nextConfig

module.exports = {
  env: {
    solanaRpcUrl: process.env.SOLANA_RPC_URL,
    hfApi: process.env.HF_API,
    hfApiEndpoint: process.env.HF_API_ENDPOINT,
    secretKey: process.env.SECRET_KEY,
    openAI: process.env.OPENAI_API_KEY
  },
};