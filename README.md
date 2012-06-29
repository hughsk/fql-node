# node-fql

Jump into the Facebook Graph API with simpler FQL queries for Node.

## Installation

`npm install fql`

## Usage

A basic query to a particular Facebook page can be made like so:

``` javascript
var fql = require('fql');

fql.query('SELECT name, fan_count FROM page WHERE page_id = 19292868552', function(err, data) {
	if (err) {
		throw err;
	}
	console.log(data); // [ { name: 'Facebook Platform', fan_count: 4549532 } ]
});
```

If you need to throw in an access token for non-anonymous queries, just pass it in as an option:

``` javascript
var fql = require('fql');

fql({
	token: '112341534737288|LbWu8xrqWzW5h40LmTLrbU42Qx8'
}).query('SELECT name FROM user WHERE uid = me()', function(err, data) {
	if (err) {
		throw err;
	}
	console.log(data); // [ { name: 'John Doe' } ]
});
```

You can make multiple queries in one request by passing a JSON object instead of a string too:

``` javascript
var fql = require('fql');

fql.query({
	facebook: 'SELECT name FROM page WHERE page_id = 19292868552',
	coke: 'SELECT name FROM page WHERE page_id = 40796308305'
}, function(err, data) {
	/* `data` should be:
		{
			coke: [ { name: 'Coca-Cola' } ],
			facebook: [ { name: 'Facebook Platform' } ]
		}
	*/
});
```

## Contributors

* [hughsk](https://github.com/hughsk)
* [mugami-ast](https://github.com/mugami-ast)
