/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
}

module.exports = nextConfig

module.exports = {
  env: {
    rpcNode: process.env.RPC,
    hfApi: process.env.HF_API,
    hfApiEndpoint: process.env.HF_API_ENDPOINT,
    fetchHeadlines: process.env.FETCH_HEADLINES,
    generateImage: process.env.GENERATE_IMAGE,
    mintHH: process.env.MINT_HH
  },
};

