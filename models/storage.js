
let request = require('request')
let config = require('../config')
let rp = require('request-promise')

exports.getDocumentPromise = function (docid) {
  return exports.getAddressPromise(docid) // since atm it does exactly the same
}

exports.saveDocumentPromise = function (body) {
  return new Promise(function (resolve, reject) {
    request.post(config.couchdb, { json: body }, function (error, response, body) {
      if (error) {
        return reject(body)
      }
      return resolve(response.body)
    })
  })
}

exports.getAddressPromise = function (address) {
  return new Promise(function (resolve, reject) {
    request.get(config.couchdb + '/' + address, function (error, response, body) {
      if (error) {
        return reject(error)
      }

      resolve(JSON.parse(body))
    })
  })
}

exports.getSellerPromise = function (sellerId) {
  return new Promise(function (resolve, reject) {
    request.get(config.couchdb + '/' + sellerId, function (error, response, body) {
      if (error) {
        return reject(error)
      }

      return resolve(JSON.parse(body))
    })
  })
}

exports.saveAddressPromise = function (body) {
  return new Promise(function (resolve, reject) {
    request.post(config.couchdb, { json: body }, function (error, response, body) {
      if (error) {
        return reject(body)
      }
      return resolve(response.body)
    })
  })
}

exports.savePayoutPromise = function (body) {
  return new Promise(function (resolve, reject) {
    request.post(config.couchdb, { json: body }, function (error, response, body) {
      if (error) {
        return reject(body)
      } else {
        return resolve(response.body)
      }
    })
  })
}

exports.saveSellerPromise = function (sellerId, data) {
  return new Promise(function (resolve, reject) {
    request.post(config.couchdb, { json: data }, function (error, response, body) {
      if (error) {
        return reject(body)
      }
      return resolve(response.body)
    })
  })
}

exports.getUnprocessedAdressesNewerThanPromise = function (timestamp) {
  return rp.get({url: config.couchdb + '/_design/address/_view/unprocessed_by_timestamp?startkey=' + timestamp + '&inclusive_end=true&limit=10000&reduce=false&include_docs=true', json: true})
}

exports.getPaidAdressesNewerThanPromise = function (timestamp) {
  return rp.get({url: config.couchdb + '/_design/address/_view/paid_by_timestamp?startkey=' + timestamp + '&inclusive_end=true&limit=10000&reduce=false&include_docs=true', json: true})
}

exports.saveJobResultsPromise = function (json) {
  return rp.put(config.couchdb + '/' + json._id, { 'json': json })
}

