var fql = require('../index.js'),
	assert = require('assert'),
	querystring = require('querystring');

suite('QueryMaker', function() {
	suite('#parse', function() {
		test('Single simple query', function() {
			var parser = new (fql.QueryMaker)(),
				query = 'SELECT uid2 FROM friend WHERE uid1=me()';

			assert.equal(
				parser.parse(query),
				'/fql?q=%7B"single"%3A"SELECT+uid2+FROM+friend+WHERE+uid1%3Dme()"%7D'
			);
		});
		test('Two simple queries', function() {
			var parser = new (fql.QueryMaker)(),
				query = {
					'one': 'SELECT uid2 FROM friend WHERE uid1=me()',
					'two': 'SELECT name FROM user WHERE uid=me()'
				};

			assert.equal(
				parser.parse(query),
				'/fql?q=%7B"one"%3A"SELECT+uid2+FROM+friend+WHERE+uid1%3Dme()"%' +
				'2C"two"%3A"SELECT+name+FROM+user+WHERE+uid%3Dme()"%7D'
			);
		});
		test('Appends access token', function() {
			var parser = new (fql.QueryMaker)(),
				parsed = {},
				query = 'SELECT';

			parsed = parser.parse(query, { token: 'THISISATOKEN' });
			parsed = querystring.parse(parsed);
			
			assert.ok(parsed['access_token']);
			assert.equal(parsed['access_token'], 'THISISATOKEN');
		});
	});
	suite('#query', function() {
		test('Accesses the Facebook Platform page OK', function(done) {
			var query;
			
			query = fql().query('SELECT name, fan_count FROM page WHERE page_id = 19292868552', function(err, data) {
				assert.ifError(err);
				assert.ok(data && data[0]);
				assert.ok(data[0].name);
				assert.ok(data[0].fan_count);
				done();
			});
		});

		test('Accesses the Coca Cola page OK', function(done) {
			var query;
			
			query = fql().query('SELECT name, fan_count FROM page WHERE page_id = 40796308305', function(err, data) {
				assert.ifError(err);
				assert.ok(data && data[0]);
				assert.ok(data[0].name);
				assert.ok(data[0].fan_count);
				done();
			});
		});

		test('Accesses both pages in multi-query', function(done) {
			var query;

			query = fql().query({
				facebook: 'SELECT name, fan_count FROM page WHERE page_id = 19292868552',
				coke: 'SELECT name, fan_count FROM page WHERE page_id = 40796308305'
			}, function(err, data) {
				assert.ifError(err);
				assert.ok(data);
				assert.ok(data.coke);
				assert.ok(data.facebook);
				assert.ok({'name': data['name']});
				assert.ok({'fan_count': data['fan_count']});
				done();
			});
		});

		test('Handles quotes in queries OK', function(done) {
			fql.query('SELECT name FROM page WHERE username = "coca-cola"', function(err, data) {
				assert.ifError(err);

				assert.ok(data && data[0]);
				assert.ok(data[0].name);

				done();
			});
		});

		test('Returns an error with falsey responses', function(done) {

			// This should return false as Bacardi has an age gate which prevents API access
			fql.query('SELECT name FROM page WHERE username = "bacardi"', function(err, data) {
				assert.ok(err instanceof Error);
				done();
			});
		});

		test('fda.query is equivalent to fda().query', function(done) {
			var firstResponse;

			fql.query('SELECT name, fan_count FROM page WHERE page_id = 19292868552', function(err, data) {
				assert.ifError(err);
				
				assert.ok(data && data[0]);
				assert.ok(data[0].name);
				assert.ok(data[0].fan_count);
				
				firstResponse = data;

				fql().query('SELECT name, fan_count FROM page WHERE page_id = 19292868552', function(err, data) {
					assert.ifError(err);
					assert.deepEqual(firstResponse, data);

					done();
				});
			});
		});

	});
});
