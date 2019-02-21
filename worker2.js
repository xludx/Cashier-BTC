
/**
 * worker iterates through all paid addresses (which are actually hot wallets),
 * and sweeps (forwards funds) to seller final (aggregational) wallet
 *
 */

const storage = require('./models/storage');
const config = require('./config');
const blockchain = require('./models/blockchain');
const signer = require('./models/signer');
const logger = require('./utils/logger').logger;

require('./smoke-test');

(async () => {
  while (1) {
    logger.debug('worker2.js' + ' tick tock');
    const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
    await storage.getPaidAdressesNewerThanPromise(Date.now() - config.process_unpaid_for_period)
      .then(async (job) => {
        logger.info(`worker2 js found ${job.rows.length} records`);
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

  for (const row of rows.rows) {
    const json = row.doc;

    const received = await blockchain.getreceivedbyaddress(json.address, config.minimum_confirmation_required);
    logger.info(`worker2.js address: ${json.address}, expect: ${json.part_to_ask}, confirmed:${received[1].result}, unconfirmed:${received[0].result}`);

    if (+received[1].result === +received[0].result && received[0].result > 0) { // balance is ok, need to transfer it
      const seller = await storage.getSellerPromise(json.seller);
      logger.info(`worker2.js : transferring ${received[1].result} PART (minus fee) from ${json.address} to seller ${seller.seller}(${seller.address})`);
      const unspentOutputs = await blockchain.listunspent(json.address);

      let createTx = signer.createTransaction;
      if (json.address[0] === '3') {
        // assume source address is SegWit P2SH
        // pretty safe to assume that since we generate those addresses
        createTx = signer.createSegwitTransaction;
      }
      const tx = createTx(unspentOutputs.result, seller.address, received[1].result, 0.0001, json.WIF); // received[1].result has the confirmed amount
      logger.info(`worker2.js broadcasting ${tx}`);
      const broadcastResult = await blockchain.broadcastTransaction(tx);
      logger.info(`worker2.js broadcast result: ${JSON.stringify(broadcastResult)}`);

      json.processed = 'paid_and_sweeped';
      json.sweep_result = json.sweep_result || {};
      json.sweep_result[Date.now()] = {
        tx,
        broadcast: broadcastResult,
      };

      await storage.saveJobResultsPromise(json);
    } else {
      logger.warn('worker2.js:  balance is not ok, skip');
    }
  }
}
