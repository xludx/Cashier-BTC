
/**
 * simple smoke tests check accessibility of
 * database and RPC
 *
 */

const rp = require('request-promise');
const assert = require('assert');
const particld = require('./models/blockchain');
const config = require('./config');

(async () => {
  try {
    const info = await particld.getblockchaininfo();
    assert(info.result.chain);
  } catch (err) {
    console.log('Bitcoin Core RPC problem: ', err);
    process.exit(1);
  }

  try {
    const couchdb = await rp.get({ url: config.couchdb, json: true });
    assert(couchdb.db_name);
  } catch (err) {
    console.log('couchdb problem: ', err);
    process.exit(1);
  }
})();
