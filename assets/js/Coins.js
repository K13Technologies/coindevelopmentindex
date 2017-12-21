/*! COINS */

var Coins = (function($) {
	'use strict';

	var coinfile = 'https://api.myjson.com/bins/909wb',
	// var coinfile = '/assets/json/data.json',
			fieldsfile = '/assets/json/form-fields.json',
			rateAPI = 'https://min-api.cryptocompare.com/data/pricemulti',
			initialized = false,
			currSort = 'latest.rank',
			coins, results, fields;

	var getCoins = function() {
		if(coins) {
			// already fetched
			return new Promise(function(resolve, reject) {
				resolve(coins);
			});
		} else {
			return $.getJSON(coinfile);
		}
	};

	var getFields = function() {
		if(fields) {
			return new Promise(function(resolve, reject) {
				resolve(fields);
			});
		} else {
			return $.getJSON(fieldsfile);
		}
	};

	var init = function(cb) {
		if(initialized) {
			return initialized;
		} else {
			initialized =  getCoins()
							.then(function(data) {
								coins = data;
								return getFields();
							})
							.then(function(data2) {
								fields = data2;
								cb && cb();
							});
			return initialized;
		}
	};

	var file = function() {
		return coinfile;
	};

	var sort = function(prop, asc) {

		currSort = prop || currSort;
		asc = typeof asc !== 'undefined' ? asc : true;

		coins.sort(sorter);
		if(results) results.sort(sorter);

		function sorter(a,b) {

			var nA, nB, arrA, arrB;

			if(currSort.split('.')[0] === 'latest') {

				if(currSort.split('.')[1] === 'release') {
					nA = a.releases[0] ? a.releases[0].publishedAt : null;
					nB = b.releases[0] ? b.releases[0].publishedAt : null;
				} else {
					if(a.data) {
						arrA = Object.keys(a.data).sort().reverse();
						nA = a.data[arrA[0]][currSort.split('.')[1]];
						if(nA) {
							nA = $.isNumeric(nA) ? parseFloat(nA) : nA.toLowerCase();
						} else {
							nA = null;
						}
					} else {
						nA = null;
					}
					if(b.data) {
						arrB = Object.keys(b.data).sort().reverse();
						nB = b.data[arrB[0]][currSort.split('.')[1]];
						if(nB) {
							nB = $.isNumeric(nB) ? parseFloat(nB) : nB.toLowerCase();
						} else {
							nB = null;
						}
					} else {
						nB = null;
					}
				}

			} else {

				if(!a[currSort]) { return 1; }
				if(!b[currSort]) { return -1; }

				nA = $.isNumeric(a[currSort]) ? parseFloat(a[currSort]) : a[currSort].toLowerCase();
				nB = $.isNumeric(b[currSort]) ? parseFloat(b[currSort]) : b[currSort].toLowerCase();

			}

			if(nA === null) { return 1; }
			if(nB === null) { return -1; }

			if(nA === nB) { return 0; }
			return nA < nB ? -1 * (asc ? 1 : -1) : 1 * (asc ? 1 : -1);
		}

		return Coins;

	};

	var list = function(start, end) {

		start = start || 0;
		end = end || coins.length;

		return results ? results.slice(start, end) : coins.slice(start, end);

	};

	var listFields = function() {
		return fields;
	}

	var search = function(search) {
		results = coins
						.filter(function(coin) {
							var regexp = new RegExp(search.regexp, 'ig'),
									tregexp = new RegExp(search.type, 'ig');

							if(search.type !== 'All' && !tregexp.test(coin.type)) {
								return false;
							}
							return regexp.test(coin.coinname) || regexp.test(coin.symbol);
						});
		return results;
	};

	var reset = function() {
		results = null;
		return Coins;
	};

	var find = function(criteria) {
		return coins
						.find(function(coin) {
							for(var prop in criteria) {
								if(criteria[prop] === coin[prop]) { return true; }
							}
						});
	};

	var filter = function(criteria) {
		return coins
						.filter(function(coin) {
							var ret = true;
							for(var prop in criteria) {
								if(criteria[prop] === 'NOT_NULL') {
									if(!coin[prop]) { ret = false; }
									if((_.isString(coin[prop]) || _.isArray(coin[prop])) && _.isEmpty(coin[prop])) { ret = false; }
								} else {
									if(criteria[prop] !== coin[prop]) { ret = false; }
								}
							}
							return ret;
						});
	};

	var price = function(coins, to) {
		var syms = coins.map(function(coin) { return coin.symbol; }),
				url = rateAPI + '?fsyms=' + syms.join(',') + '&tsyms=' + to,
				cb = 'function' === typeof arguments[arguments.length - 1] ?
							arguments[arguments.length - 1] : false;

		// if(coin.exchanges && coin.exchanges.length > 0) {
		// 	url += '&e=' + coin.exchanges.join(',');
		// } else {
		// 	url += '&e=CCCAGG';
		// }

		return $.get(url).done(function(data) {
			return cb && cb(coins.map(function(coin) {
				coin.price[to] = data[coin.symbol][to];
				return coin;
			}));
		});
	};

	var parseNullChars = function() {

		getFields()
			.then(function(fields) {

			});

		coins.forEach(function(coin) {
			var c, f;
			for(c in coin) {
				f = fields.find(function(field) { return field.name === c; });
				if(f && !coin[c] && f['null-char']) {
					coin[c] = f['null-char'];
				}
			}
		});
	};


	return {
		init: init,
		fields: listFields,
		sort: sort,
		list: list,
		search: search,
		find: find,
		filter: filter,
		price: price,
		reset: reset
	};

})(jQuery);
