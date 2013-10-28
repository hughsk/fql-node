// Dependencies
var querystring = require('querystring'),
	url = require('url'),
	https = require('https'),
	http = require('http'),

// Exported functions/classes
	fql, QueryMaker;

module.exports = fql = function(options) {
	return new QueryMaker(options);
};

module.exports.QueryMaker = QueryMaker = function(options) {
	if (!(this instanceof QueryMaker)) {
		return new QueryMaker();
	}
	this.options = options || {};
};

/**
 * Query the Facebook Graph API.
 * 
 * @param  {String|Object}   query    The query you want to pass to Facebook. Use a string for single queries, or an object for multiqueries.
 * @param  {Object}          options  Options to pass onto the query. Optional
 * @param  {Function}        callback Called on response (err, data)
 * @return {QueryMaker} Returns itself - #query is chainable.
 */
QueryMaker.prototype.query = function(query, options, callback) {
	var safe = true,
	    multi = (typeof query === 'object');

	// `options` and `callback` are optional
	if (typeof options === 'function') {
		callback = options;
	}
	callback = callback || function() {};
	options = options || {};

	query = this.parse(query, options);

	(options.token ? https : http).get({
		host: 'graph.facebook.com',
		path: query
	}, function(response) {
		var buffer = '';

		response.on('data', function(chunk) {
			buffer += chunk.toString();
		});

		response.on('end', function() {
			// Don't process if we've somehow already caught an error
			if (!safe) {
				return;
			}

			var data,
				error = false;
			
			// Catch any errors in the response
			try {
				data = JSON.parse(buffer);
			} catch(e) { error = e + '(' + buffer + ')'; }

			if (!error && !data && !data.data) {
				error = new Error('Facebook returned a falsey value');
			}
			if (data && data.error) {
				// Errors supplied by Facebook
				error = new Error(data.error.type + ': ' + data.error.message);
			}
			if (error) {
				return callback(error);
			}

			// Condenses response data
			// Supports multi-query responses too...
			data = data.data;

			if (!multi) {
				data = data[0].fql_result_set;
			} else {
				data = data.reduce(function(memo, result){
					memo[result.name] = result.fql_result_set;

					return memo;
				}, {});
			}

			// One last check for falsey responses
			if (Array.isArray(data) && !data.length) {
				return callback(new Error('Facebook returned a falsey value'));
			}

			return callback(null, data);
		});
	}).on('error', function(err) {
		safe = false;
		callback(err);
	}).end();

	return this;
};


/**
 * Parses either a single query string or a JSON object
 * of queries (see http://developers.facebook.com/docs/reference/fql/)
 * 
 * @param  {String|Object} fqlQuery The query/queries to parse
 * @param  {Object} options         Additional options to pass, inherited from #query.
 * @return {String}                 The parsed querystring
 */
QueryMaker.prototype.parse = function(fqlQuery, options) {
	options = options || this.options || {};

	if (!fqlQuery) {
		throw new Error('No query supplied for FQL');
	}
	if (typeof fqlQuery !== 'object') {
		fqlQuery = {
			'single': fqlQuery
		};
	}

	fqlQuery = querystring.stringify({
		q: JSON.stringify(fqlQuery)
	}).replace(/\%20/g, '+')
	  .replace(/\%5C\%22/g, '\\"')
	  .replace(/\%22/g, '"');

	// Append the access token if supplied
	if (options.token) {
		fqlQuery += '&access_token=' + options.token;
	}

	return '/fql?' + fqlQuery;
};

// Allows not having to call fql() to use #query or #parse.
fql.query = function(query, options, callback) {
	var queryMaker = new QueryMaker();
	
	queryMaker.query(query, options, callback);

	return queryMaker;
};
fql.parse = function(fqlQuery, options) {
	var queryMaker = new QueryMaker();
	
	return queryMaker.parse(fqlQuery, options);
};
