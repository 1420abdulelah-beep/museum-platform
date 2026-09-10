/**
 * Vercel Serverless Function Handler
 * Routes incoming API and dynamic requests to server.js request handler
 */

const requestHandler = require('../server');

module.exports = async (req, res) => {
  return requestHandler(req, res);
};
