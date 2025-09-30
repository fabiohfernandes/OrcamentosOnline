// Custom server wrapper for Railway deployment
// Ensures the standalone server binds to the correct port

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const port = parseInt(process.env.PORT || '3001', 10);
const hostname = '0.0.0.0';

console.log(`🚀 Starting Next.js server on ${hostname}:${port}`);
console.log(`📝 Environment: ${process.env.NODE_ENV}`);
console.log(`🔗 API URL: ${process.env.NEXT_PUBLIC_API_URL}`);

// Start the standalone server
const standaloneServer = require('./.next/standalone/server.js');

console.log(`✅ Server should be running on http://${hostname}:${port}`);
