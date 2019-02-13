/* + + + + + + + + + + + + + + + + + + + + +
* Logger
* -----------
* a winston instance wrapper
*
* Author: Michael Samonte
*
+ + + + + + + + + + + + + + + + + + + + + */
let fs = require('fs')
let winston = require('winston')
let createLogger = winston.createLogger
let format = winston.format
let transports = winston.transports
let config = require('../config')

/* + + + + + + + + + + + + + + + + + + + + +
// Start
+ + + + + + + + + + + + + + + + + + + + + */
const {
  combine,
  timestamp,
  printf
} = format

const myFormat = printf(info => {
  return `${info.timestamp} : ${info.level} : ${info.message}`
})

const logger = createLogger({
  level: config.logging_level,
  format: combine(
    timestamp(),
    myFormat
  ), // winston.format.json(),
  transports: [
    // - Write to all logs with level `info` and below to `combined.log`
    // - Write all logs error (and below) to `error.log`.
    // or new transports.Console()
    new transports.File({
      filename: './logs/error.log',
      maxsize: 52428800,
      level: 'error'
    }),
    new transports.File({
      filename: './logs/combined.log',
      maxsize: 52428800
    }),
    new transports.Console({
      timestamp: true,
      colorize: true
    })
  ]
})

/**
 * create logs folder if it does not exist
 */
if (!fs.existsSync('logs')) {
  fs.mkdirSync('logs')
}

/**
 * @param {string} label group label
 * @param {string} message log message
 */
function log (label, message) {
  console.log(new Date(), label, message)
  logger.log({
    level: 'info',
    label: label,
    message: JSON.stringify(message)
  })
}

/**
 * TODO: we can do additional reporting here
 * @param {string} label group label
 * @param {string} message log message
 */
function error (label, message) {
  console.error(new Date(), label, message)
  logger.log({
    level: 'error',
    label: label,
    message: JSON.stringify(message)
  })
}

exports.log = log
exports.error = error
exports.logger = logger