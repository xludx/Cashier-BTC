cashier-part
============

Based on [Cashier-BTC](https://github.com/Overtorment/Cashier-BTC).

This software is still Work-In-Progress and should not be used in production.

v2 refactored and improved
---------------------------

Self-hosted Node.js Particl payment gateway. Provides REST API (microservice).
Process Particl payments on your end, securely, with no commission.

Request payments (invoicing), check payments (whether invoice is paid), receive callbacks if payment is made.
Aggregate funds on final (aggregational) address.
Depends on Nodejs v8+, Particl Core, Couchdb for storage.

* Simple
* No 3rd parties (works though Particl Core node)
* Transactions are signed locally. No private keys leak
* Battle-tested in production
* SegWit compatible


Installation
------------

```
$ git clone git@github.com:xludx/cashier-part.git && cd cashier-part
$ npm install
```


Tests
-----

```
$ npm test
```

Running
-------

Run the app using docker-compose:
```
$ docker-compose up
```

Open [http://localhost:2222](http://localhost:2222) in browser, you should see 'cashier-part reporting for duty'.
That's it, ready to use.

License
-------

[WTFPL](http://www.wtfpl.net/txt/copying/)

Author
------

Juha Kovanen


TODO
----

* [x] ~~Get rid of Chain and leave Bitcore only~~
* [x] ~~Add options to work through bitcoind and other bitcoin network endpoints~~
* [x] ~~Add tests~~
* [x] ~~Better abstractioning (add more abstraction layers)~~
* [x] ~~CI~~
* [x] ~~logging~~
* [ ] Better error handling
* [ ] Stats
* [ ] Better tests
* [x] ~~Ditch bitcore-lib in favor of bitcoinjs-lib~~
* [x] ~~SegWit~~
* [ ] Flexible (user-defined?) fees
* [ ] BigNumber lib for all numbers handling
* [ ] Add support for multiple cryptocurrencies


API
===

### GET /request_payment/:expect/:currency/:message/:seller/:customer/:callback_url


Create a request to pay, supported currencies: PART, USD, EUR. Non-part currency is converted to part using current rate from XXX api.
Returns a json document with QR code to be displayed to the payer, and a unique address for that particular payment (you can use it as invoice id).
Message will be displayed to the client (for example, you can write "Payment for goods"). Seller and customer - system field, here you can
write the application that created the request and the payer id. Keep Seller field private, it is also used for payouts.
Callback_url will be requested once the invoice is paid.

	Example

		http://localhost:2222/request_payment/0.005/PART/wheres%20the%20money%20lebowski/iamseller/iambuyer/http%3A%2F%2Fgoogle.com%2F
        http://localhost:2222/request_payment/0.005/PART/wheresmymoney/iamseller/iambuyer/http%3A%2F%2Fgoogle.com
	Response

		{
			"link" : "bitcoin:1DzJepHCRD2C9vpFjk11eXJi97juEZ3ftv?amount=0.004&message=wheres%20the%20money%20lebowski",
			"qr" : "http://localhost:2222/generate_qr/bitcoin%3A1DzJepHCRD2C9vpFjk11eXJi97juEZ3ftv%3Famount%3D0.004%26message%3Dwheres%2520the%2520money%2520lebowski",
			"qr_simple" : "http://localhost:2222/generate_qr/1DzJepHCRD2C9vpFjk11eXJi97juEZ3ftv",
			"address" : "1DzJepHCRD2C9vpFjk11eXJi97juEZ3ftv"
		}

Link can be opened by the payer, there is a chance it will be handled by his particl wallet.
QR shoud be shown to payer as well. Duplicate it with text, like, dear user, please pay the %expect% amount to %address%.

### GET /check_payment/:address


Check payment by a unique address received in the "request_payment" call.


	Example

		http://localhost:2222/check_payment/16FsTPe5JG8yj1P31AqXrMGzu7iAet7NTL

	Response

		{
			"part_expected" : 0.0001009,
			"part_actual" : 0.0001009,
			"part_unconfirmed" : 0.0001009
		}

Using difference between "part_expected" and "part_actual" you can judge whether payment request (invoice) was paid.
You can use this call to implement some kind of frontend animation which shows 'waiting for funds', and 
polls periodically about the status of payment (i.e. unconfirmed incoming funds, paid in full/not in full).
In case you accept unconfirmed balances (see `config.small_amount_threshhold`), you might want to check payment again before shipping actual goods.




### GET /payout/:seller/:amount/:currency/:address


Transfer funds from aggregated seller's address to some other address.
Supported currencies: PART.
There's no additional sequrity here, it is presumed that the %seller% identifier is kept secret.
You might want to disable this call for security reasons (or manually replace seller's address in 
database with the one you control).

	Example

		http://localhost:2222/payout/new_test_seller/0.01/PART/1MahZCousgNv6EAofCfi7Wpp2RKUfHH8uD

	Response

		If successfull, json document with transaction details (txid etc)


### GET /get_seller_balance/:seller


Check the total balance of seller's aggregated address.

	Example

		http://localhost:2222/get_seller_balance/treehorn

	Response

		Json encoded available balance


Hardening for Production
------------------------

When the `seller` is created in `/request_payment/` call, database record also stores seller's `address` 
and associated `WIF` which allows to spend seller's aggregated funds.
You might want to manually replace this record with your own `address` (probably a cold storage), and not putting `WIF` in the record.
This breaks the `/payout/` call, but at least the funds from orders will be forwarded to a secure storage.

Small risk remains with hot wallets still having their `WIFs` in the database, but this is a reality any other Bitcoin processor
has to live in.

