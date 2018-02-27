/*! COINS */

/* globals R */
var Coins = (function($) {
	'use strict';

	var params = window.location.search.slice(1).split('&')
				.reduce(function(prev,curr) {
					var param = curr.split('=');
					if(param[0]) prev[param[0]] = param[1] ? param[1] : true;
					return prev;
				}, {}),
	coinfile = params.local ? 'http://api.coindev.local' : 'https://api.coindevelopmentindex.tech',
	// coinfile = 'https://api.coindevelopmentindex.tech',
	fieldsfile = coinfile + '?fields',
	coinAPI = 'https://api.coindevelopmentindex.tech',
	rateAPI = 'https://min-api.cryptocompare.com/data/pricemulti',
	initialized = false,
	complete = false,
	callbacks = [],
	currSort = 'latest.rank',
	indexAvgs = {},
	coins, results, fields;

	var isAdminSite = function() {
		return /(api\.)?coindev(elopmentindex)?\.(tech|local)\/admin/.test(window.location);
	};

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

	var file = function(query) {
		var data =  Object.keys(params)
												.filter(function(key) { return key.length > 0; })
												.map(function(key) { return { name: key, value: params[key] }; });
		
		query = query || 'location';

		return $.get(coinfile + '?' + query, data);
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

							var nA, nB;

							if(a.data.length) {
								nA = a.data[0][currSort.split('.')[1]];
								if(nA) {
									nA = $.isNumeric(nA) ? parseFloat(nA) : nA.toLowerCase();
								} else {
									nA = null;
								}
							} else {
								nA = null;
							}
							if(b.data.length) {
								nB = b.data[0][currSort.split('.')[1]];
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
						classification: function(a,b) {
							var nA, nB;

							nA = a.classification ? a.classification : a.type;
							nB = b.classification ? b.classification : b.type;

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
							var nA = null, nB = null, iA = 0, iB = 0,
									xA = 0, yA = 0, xyA = 0, x2A = 0,
									xB = 0, yB = 0, xyB = 0, x2B = 0;

							if(a.data.length && a.data[0].rank) {
								a.data.forEach(function(d) {
									var day = new Date(d.date).getTime()/1000/60/60/24,
											rank = d.rank ? parseInt(d.rank,10) : null,
											wr = day * rank,
											ws = day * day;

										if(rank) {
											xA += day;
											yA += rank;
											xyA += wr;
											x2A += ws;
											iA++;
										}
								});
								nA = -((iA * xyA) - (xA * yA)) / ((iA * x2A) - (xA * xA)) * iA;
								if(Number.isNaN(nA)) nA = null;
							}
							if(b.data.length && b.data[0].rank) {
								b.data.forEach(function(d) {
									var day = new Date(d.date).getTime()/1000/60/60/24,
											rank = d.rank ? parseInt(d.rank,10) : null,
											wr = day * rank,
											ws = day * day;

										if(rank) {
											xB += day;
											yB += rank;
											xyB += wr;
											x2B += ws;
											iB++;
										}
								});
								nB = -((iB * xyB) - (xB * yB)) / ((iB * x2B) - (xB * xB)) * iB;
								if(Number.isNaN(nB)) nB = null;
							}
							return sortFn(nA,nB);
					},
					volatility: function(a,b) {
							var nA, nB, sumA, sumB;

							if(a.data.length && a.data[0].volatility) {
								sumA = a.data.reduce(function(prev,curr) {
												return prev + (curr.volatility ? curr.volatility : 0);
											}, 0);
								nA =  sumA / a.data.length;
								if(Number.isNaN(nA)) nA = null;
							} else {
								nA = null;
							}
							if(b.data.length && b.data[0].volatility) {
								sumB = b.data.reduce(function(prev,curr) {
												return prev + (curr.volatility ? curr.volatility : 0);
											}, 0);
								nB = sumB / b.data.length;
								if(Number.isNaN(nB)) nB = null;
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
							var match;
							for(var prop in criteria) {
								if(criteria[prop] === coin[prop]) { match = true; }
								else { match = false; }
							}
							return match;
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
												.map(function(key) { return { name: key, value: params[key] }; });

      return isAdminSite() && $.post({
          url: coinAPI,
          data: coin.concat(data)
        });
	};

	var deleteCoin = function(coin, index) {

			return isAdminSite() && $.post({
	      url: coinAPI,
	      data: { 'delete': true, index: index, coinname: coin.coinname, symbol: coin.symbol }
	    });
	};

	var fetch = function(coin, endpoint) {

		var data =  Object.keys(params)
												.filter(function(key) { return key.length > 0; })
												.map(function(key) { return { name: key, value: params[key] }; })
												.concat([{
													name: /=/.test(endpoint) ? endpoint.split('=')[0] : endpoint,
													value: /=/.test(endpoint) ? endpoint.split('=')[1] : true
												}]);

      return isAdminSite() && $.post({
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
				if(!coin.price) coin.price = {};
				coin.price[to] = data[coin.symbol][to];
				return coin;
			}));
		});
	};

	var indexAvg = function(field) {

		var sum, avg, idxSum;

		if(indexAvgs[field]) return indexAvgs[field];

		idxSum = coins.reduce(function(prev,curr) {

			var data = curr.data;

			if(data.length) {

				if(!data[0][field]) return prev;

				sum = data.reduce(function(prev,curr) {
					return prev + ($.isNumeric(curr[field]) ? curr[field] : 0);
				}, 0);

				avg = sum / data.length;
				if(!$.isNumeric(avg)) return prev;
				return prev + avg;
			}

			return prev;

		}, 0);

 		indexAvgs[field] = idxSum / coins.length;

		return indexAvgs[field];

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
		file: file,
		find: find,
		filter: filter,
		indexAvg: indexAvg,
		update: update,
		deleteCoin: deleteCoin,
		price: price,
		reset: reset
	};

})(jQuery);
