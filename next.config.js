/** @type {import('next').NextConfig} */
/** @type {import('next-sitemap').IConfig} */

module.exports = {
  reactStrictMode: false,
  env: {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY
  }
};
