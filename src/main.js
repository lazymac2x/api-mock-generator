/**
 * Apify Actor entry point — runs the MCP server for Apify platform.
 */
const { Actor } = require('apify');

Actor.main(async () => {
  // Start the Express server
  require('./server');
  console.log('Actor started — MCP server is running');
});
