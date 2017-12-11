/*! COINS */

var Coins = (function($) {
	'use strict';

	var coinfile = 'https://api.myjson.com/bins/909wb',
			fieldsfile = '/assets/json/form-fields.json',
			initialized = false,
			coins, results, fields;

	var getCoins = function() {

		if(coins) {
			return new Promise(function(resolve, reject) {
				resolve(coins);
			});
		} else {
			return $.ajax({
				url: coinfile,
				dataType: 'json'
			});
		}
	};

	var getFields = function() {
		if(fields) {
			return new Promise(function(resolve, reject) {
				resolve(fields);
			});
		} else {
			return $.ajax({
				url: fieldsfile,
				dataType: 'json'
			});
		}
	};

	var init = function(cb) {
		return getFields()
							.then(function(data) {
								fields = data;
								return getCoins();
							})
							.then(function(data2) {
								coins = data2;
								initialized = true;
								cb && cb({
									coins: coins,
									fields: fields
								});
							});
	};

	var file = function() {
		return coinfile;
	};

	var sort = function(prop, asc) {

		prop = prop || 'latest.rank';
		asc = typeof asc !== 'undefined' ? asc : true;

		coins.sort(sorter);
		if(results) results.sort(sorter);

		function sorter(a,b) {

			var nA, nB, arrA, arrB;

			if(prop.split('.')[0] === 'latest') {

				if(prop.split('.')[1] === 'release') {
					nA = a.releases[0] ? a.releases[0].publishedAt : null;
					nB = b.releases[0] ? b.releases[0].publishedAt : null;
				} else {
					if(a.data) {
						arrA = Object.keys(a.data).sort().reverse();
						nA = a.data[arrA[0]][prop.split('.')[1]];
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
						nB = b.data[arrB[0]][prop.split('.')[1]];
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

				if(!a[prop]) { return 1; }
				if(!b[prop]) { return -1; }

				nA = $.isNumeric(a[prop]) ? parseFloat(a[prop]) : a[prop].toLowerCase();
				nB = $.isNumeric(b[prop]) ? parseFloat(b[prop]) : b[prop].toLowerCase();

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

	var search = function(search) {
		results = coins
						.filter(function(coin) {
							var regexp = new RegExp(search.regexp, 'ig');

							if(search.type !== 'All' && coin.type !== search.type) {
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
		sort: sort,
		list: list,
		search: search,
		reset: reset
	};

})(jQuery);
