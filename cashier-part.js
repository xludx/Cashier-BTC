
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const express = require('express');
const morgan = require('morgan');
const uuid = require('node-uuid');
const logger = require('./utils/logger').logger;

morgan.token('id', req => req.id);

const app = express();

app.use((req, res, next) => {
  req.id = uuid.v4();
  next();
});
app.use(morgan(':id :remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"'));

app.set('trust proxy', 'loopback');

const bodyParser = require('body-parser');
const config = require('./config');
const rp = require('request-promise');

app.use(bodyParser.urlencoded({ extended: false })); // parse application/x-www-form-urlencoded
app.use(bodyParser.json(null)); // parse application/json

global.exchanges = {};

app.use('/qr', express.static('qr'));
app.use(require('./controllers/api'));
app.use(require('./controllers/website'));

const updateExchangeRate = async function () {
  let json;
  try {
    for (let i = 0; i < config.currencies.length; i++) { // foreach currency defined in config.js
      const currency = config.currencies[i];
      if (currency === 'PART') {
        global.exchanges[currency] = 1; // one PART is one PART
        continue;
      }

      // todo: use bittrex
      const options = {
        uri: `https://bravenewcoin-v1.p.rapidapi.com/ticker?show=${currency}&coin=part`,
        headers: {
          'X-RapidAPI-Key': 'ftAlKW0LnRmshDon38KJmYF9hWpYp13PGcjjsnp5CDhhBNkO6Y',
        },
        json: true, // Automatically parses the JSON string in the response
      };

      json = await rp.get(options);
      // logger.info('PART/' + currency + ': ' + json.last_price)

      global.exchanges[currency] = json.last_price;
    }
  } catch (err) {
    return logger.error(err.message);
  }
};

updateExchangeRate();
setInterval(() => updateExchangeRate(), config.exchange_update_interval);

require('./smoke-test');
require('./deploy-design-docs'); // checking design docs in Couchdb

const server = app.listen(config.port, () => {
  logger.info(`Listening on port ${config.port}`);
});

module.exports = server;
