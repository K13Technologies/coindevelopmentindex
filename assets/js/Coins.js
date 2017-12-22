/*! COINS */

/* globals R */
var Coins = (function($) {
	'use strict';

	var params = window.location.search.slice(1).split('&')
				.reduce(function(prev,curr) {
					var param = curr.split('=');
					prev[param[0]] = param[1] ? param[1] : true;
					return prev;
				}, {}),
	coinfile = params.local ? '/assets/json/data.json' : 'https://api.myjson.com/bins/909wb',
	fieldsfile = '/assets/json/form-fields.json',
	coinAPI = 'http://api.coindev.local',
	rateAPI = 'https://min-api.cryptocompare.com/data/pricemulti',
	initialized = false,
	complete = false,
	callbacks = [],
	currSort = 'latest.rank',
	indexAvgs = {},
	coins, results, fields;

	var getCoins = function() {
		if(coins) {
			// already fetched
			return new Promise(function(resolve, reject) {
				resolve(coins);
			});
		} else {
			return $.getJSON(coinfile, params);
		}
	};

	var getFields = function() {
		if(fields) {
			return new Promise(function(resolve, reject) {
				resolve(fields);
			});
		} else {
			return $.getJSON(fieldsfile, params);
		}
	};

	var init = function(q) {

		var cb = 'function' === typeof arguments[arguments.length - 1] ?
					arguments[arguments.length - 1] : false;

		callbacks.push(cb);

		if(complete) {
			processCallbacks();
		} else if(initialized) {
			return initialized;
		} else {
			initialized = getCoins()
					.then(function(data) {
						coins = data;
						return getFields();
					})
					.then(function(data2) {
						fields = data2;
						complete = true;

						processCallbacks();
					});
		}
	};

	var processCallbacks = function() {
		while(callbacks.length > 0) {
			callbacks.shift()();
		}
	};

	var file = function() {
		return coinfile;
	};

	var sort = function(prop, asc) {

		var sorter,
				propArr,
				sortFn = function(a,b) {

					if(a === null) { return 1; }
					if(b === null) { return -1; }

					if(a === b) { return 0; }
					return a < b ? -1 * (asc ? 1 : -1) : 1 * (asc ? 1 : -1);

				},
				sorters = {

					'default': function(a,b) {

						var nA, nB;

						if(!a[currSort]) { return 1; }
						if(!b[currSort]) { return -1; }

						nA = $.isNumeric(a[currSort]) ? parseFloat(a[currSort]) : a[currSort].toLowerCase();
						nB = $.isNumeric(b[currSort]) ? parseFloat(b[currSort]) : b[currSort].toLowerCase();

						return sortFn(nA,nB);

					},
					latest: {
						'default': function(a,b) {

							var nA, nB, arrA, arrB;

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

							return sortFn(nA,nB);
						},
						releases: function(a,b) {

							var nA, nB;

							nA = a.releases[0] ? a.releases[0].publishedAt : null;
							nB = b.releases[0] ? b.releases[0].publishedAt : null;

							return sortFn(nA,nB);
						}
					},
					trend: function(a,b) {
							var nA = true, nB = true, arrA, arrB;

							if(a.data) {
								arrA = Object.keys(a.data).sort().reverse();
								if(!a.data[arrA[1]] || !a.data[arrA[0]]) nA = null;
								if(!nA || !a.data[arrA[1]].rank || !a.data[arrA[0]].rank) nA = null;
								if(nA) nA = a.data[arrA[0]].rank - a.data[arrA[1]].rank;
							} else {
								nA = null;
							}
							if(b.data) {
								arrB = Object.keys(b.data).sort().reverse();
								if(!b.data[arrB[1]] || !b.data[arrB[0]]) nB = null;
								if(!nB || !b.data[arrB[1]].rank || !b.data[arrB[0]].rank) nB = null;
								if(nB) nB = b.data[arrB[0]].rank - b.data[arrB[1]].rank;
							} else {
								nB = null;
							}

							return sortFn(nA,nB);
					},
					volatility: function(a,b) {
							var nA, nB, arrA, arrB, sumA, sumB;

							if(a.data) {
								arrA = Object.keys(a.data).sort().reverse();
								nA = a.data[arrA[0]].volatility;
								if(nA) {
									sumA = $.map(a.data[arrA[0]].volatility, function(val, idx) {
													return val;
												})
												.reduce(function(prev,curr) {
													return prev + curr;
												}, 0);
									nA =  sumA / $.makeArray(a.data[arrA[0]].volatility).length;
								} else {
									nA = null;
								}
							} else {
								nA = null;
							}
							if(b.data) {
								arrB = Object.keys(b.data).sort().reverse();
								nB = b.data[arrB[0]].volatility;
								if(nB) {
									sumB = $.map(b.data[arrB[0]].volatility, function(val, idx) {
													return val;
												})
												.reduce(function(prev,curr) {
													return prev + curr;
												}, 0);
									nB = sumB / $.makeArray(b.data[arrB[0]].volatility).length;
								} else {
									nB = null;
								}
							} else {
								nB = null;
							}

							return sortFn(nA,nB);
					}
				};

		currSort = prop || currSort;
		propArr = currSort.split('.').length > 1 ? currSort.split('.') : false;
		asc = typeof asc !== 'undefined' ? asc : true;

		if(propArr) {
			sorter = sorters[propArr[0]][propArr[1]] ?
								sorters[propArr[0]][propArr[1]] :
								sorters[propArr[0]]['default'];
		} else {
			sorter = sorters[currSort] ?
								sorters[currSort] :
								sorters['default'];
		}

		// var ascSorter, sortByProp;

		// ascSorter = asc ? R.ascend(R.path(currSort.split('.'))) : R.descend(R.path(currSort.split('.')));

		// sortByProp = R.sortWith([
		// 	ascSorter,
		// 	R.ascend(R.path(['latest', 'rank']))
		// ]);

		// sortByProp(coins);

		coins.sort(sorter);
		if(results) results.sort(sorter);

		return Coins;

	};

	var list = function(start, end) {

		start = start || 0;
		end = end || coins.length;

		return results ? results.slice(start, end) : coins.slice(start, end);

	};

	var listFields = function() {
		return fields;
	};

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

	var update = function(coin) {

		var data =  Object.keys(params)
												.filter(function(key) { return key.length > 0; })
												.map(function(key) { return { name: key, value: params[key] } })

      return $.post({
          url: coinAPI,
          data: coin.concat(data)
        });
	};

	var fetch = function(coin, endpoint) {

		var data =  Object.keys(params)
												.filter(function(key) { return key.length > 0; })
												.map(function(key) { return { name: key, value: params[key] }; })
												.concat([{
													name: endpoint,
													value: /=/.test(endpoint) ? endpoint.split('=')[1] : true
												}]);

      return $.post({
          url: coinAPI,
          data: coin.concat(data)
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

	var indexAvg = function(field) {

		var arr, week, sum, avg, idxSum;

		if(indexAvgs[field]) return indexAvgs[field];

		idxSum = coins.reduce(function(prev,curr) {

			var data = curr.data,
					dataArr;

			if(data) {

				arr = Object.keys(data).sort().reverse();

				if(!data[arr[0]][field]) return prev;

				dataArr = $.isPlainObject(data[arr[0]][field]) ?
									$.map(data[arr[0]][field], function(val, idx) {
										return val;
									})
									: [data[arr[0]][field]];

				sum = dataArr.reduce(function(prev,curr) {
					return prev + ($.isNumeric(curr) ? curr : 0);
				}, 0);

				avg = sum / dataArr.length;

				if(!$.isNumeric(avg)) return prev;
				return prev + avg;
			}

			return prev;

		}, 0);

 		indexAvgs[field] = idxSum / coins.length;

		return idxSum;

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
		fetch: fetch,
		find: find,
		filter: filter,
		indexAvg: indexAvg,
		update: update,
		price: price,
		reset: reset
	};

})(jQuery);
