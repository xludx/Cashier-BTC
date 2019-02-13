
/**
 * worker iterates through all addresses,
 * marks paid and fires callbacks
 *
*/

const rp = require('request-promise');
const storage = require('./models/storage');
const blockchain = require('./models/blockchain');
const config = require('./config');
const logger = require('./utils/logger').logger;

require('./smoke-test');

(async () => {
  while (1) {
    logger.info('worker.js' + ' tick tock');
    const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
    await storage.getUnprocessedAdressesNewerThanPromise(Date.now() - config.process_unpaid_for_period)
      .then(async (job) => {
        logger.info(`worker js found ${job.rows.length} records`);
        await processJob(job);
      })
      .catch((reason) => {
        logger.error(reason);
      });
    await wait(15000);
  }
})();

async function processJob(rows) {
  rows = rows || {};
  rows.rows = rows.rows || [];
  logger.debug('worker js processing rows');
  for (const row of rows.rows) {
    const json = row.doc;
    const received = await blockchain.getreceivedbyaddress(json.address, config.minimum_confirmation_required);
    logger.debug(`worker.js address:${json.address}, expect:${json.part_to_ask}, confirmed:${received[1].result}, unconfirmed:${received[0].result}`);
    if (
      (!config.only_accept_equal_or_more_funds && received[1].result > 0)
      || (
        (json.part_to_ask > config.small_amount_threshhold && (received[1].result >= json.part_to_ask))
        || (json.part_to_ask <= config.small_amount_threshhold && (received[0].result >= json.part_to_ask))
      )
    ) {
      // paid ok
      json.processed = 'paid';
      json.paid_on = Date.now();
      await storage.saveJobResultsPromise(json);
      logger.info(`worker.js: firing callback: ${json.callback_url}`);
      await rp({ uri: json.callback_url, timeout: 10 * 1000 });
      // marked as paid and fired a callback. why not forward funds instantly?
      // because in case of zero-conf accepted balance we would need to wait for a couple of
      // confirmations till we can forward funds
    }
  }
}
