/* globals Coins, HBS, Handlebars */
jQuery(document).ready(function($) {
	'use strict';

	if(typeof HBS === 'undefined') return false;

	var template = HBS['list-item'],
			$hdgs = $('th[data-prop]'),
			START = 0,
			PER_PAGE = 25,
			ACTIVE_PAGE = 1,
			prop, asc;

	var renderTableView = function(coins) {

		  var list, cb;

		  cb = arguments.length > 1 ? arguments[arguments.length - 1] : false;

		  list = coins.slice(START, START + PER_PAGE).reduce(function(prev,curr) {
		        	var html = template(curr);
		        	return prev + html;
		        },'');
		  $('#coin-list tbody').html(list);

		  buildPagination();

		  return cb && cb();

	};

	var addSortIcons = function() {
		var icons = '<i class="fa fa-arrow-down"></i><i class="fa fa-arrow-up"></i>';

		$hdgs.each(function() {
			$(this).prepend(icons).wrapInner('<div class="sortable"></div>');
		});

	};

	var onCoinSearched = function(e) {
		var $s = $('[name="search"]'),
				$icn = $('#coin-search').find('.fa'),
				$t = $('[name="cointype"]:checked');

		if($s.val().length === 0 && $t.val() === 'All') {
			$icn.removeClass('fa-close').addClass('fa-search');
			return renderTableView(Coins.reset().list());
		}

		$icn
			.removeClass($s.val() ? 'fa-search' : '').addClass($s.val() ? 'fa-close' : '')
			.one('click', function(e) {
				$s.val('');
				$icn.removeClass('fa-close').addClass('fa-search');
				renderTableView(Coins.reset().search({
					regexp: $s.val(),
					type: $t.val()
				}));
			});

		START = 0;

		renderTableView(Coins.search({
			regexp: $s.val(),
			type: $t.val()
		}));
	};

	var onTableHeadClicked = function(e) {

		var $hdg = $(this);

		prop = $hdg.data('prop');
		asc = !$hdg.data('asc');

		$hdg.data('asc', asc);

		$hdgs.removeClass('sorted asc desc');
		$hdg.addClass('sorted').addClass(asc ? 'asc' : 'desc');

		renderTableView(Coins.sort(prop, asc).list());

	};

	var buildPagination = function() {

		var pgs = Math.ceil(Coins.list().length / PER_PAGE),
				str = '', i;

		for(i = 1; i <= pgs; i++) {
			str += '<a class="pg-' + i + (i === ACTIVE_PAGE ? ' active' : '') + '" href="#">' + i + '</a>';
		}

		$('.pg-tools').find('.pgs').empty().html(str);

	};

	var onPaginationClicked = function(e) {

		var nav = e.currentTarget.className.replace(/\-\d/, ''),
				pg;

		e.preventDefault();

		switch(nav) {

			case 'prev' :
				START = Math.max(START - PER_PAGE, 0);
				ACTIVE_PAGE--;
				break;

			case 'next' :
				START = Math.min(START + PER_PAGE, Coins.list().length);
				ACTIVE_PAGE++;
				break;

			case 'pg' :
				pg = parseInt(/\-(\d+)/.exec(e.currentTarget.className)[1],10);
				ACTIVE_PAGE = pg;
				START = (ACTIVE_PAGE - 1) * PER_PAGE;
				break;
		}

		renderTableView(Coins.list());

	};


	Coins.init(function() {

		addSortIcons();
		buildPagination();

		$('#coin-search').on('keyup', onCoinSearched);
		$('#search-type').on('change', onCoinSearched);
		$('#coin-list').on('click', 'th', onTableHeadClicked);
		$('.pg-tools').on('click', 'a', onPaginationClicked);


		renderTableView(Coins.list(), function() {
			$('[data-prop="latest.rank"]').click();
		});

	});

	Handlebars.registerHelper('dateFormat', function(d) {
		var options = { year: 'numeric', month: 'long', day: 'numeric' };
		return d ? new Date(d).toLocaleDateString('en-US', options) : d;
	});

	Handlebars.registerHelper('arrayFormat', function(a) {
		return a.join(', ');
	});

	Handlebars.registerHelper('latestRank', function(data) {
		var arr;
		if(data) {
			arr = Object.keys(data).sort().reverse();
			return data[arr[0]].rank ? '#' + data[arr[0]].rank : '-';
		} else {
			return data;
		}
	});

	Handlebars.registerHelper('trending', function(data) {
		var x = 0, y = 0, xy = 0, x2 = 0, arr, chg;

		if(data) {
			// arr = Object.keys(data).sort();
			// arr.forEach(function(wk) {
			// 	var week = parseInt(wk.split('-')[1],10),
			// 			rank = data[wk].rank ? parseInt(data[wk].rank,10) : 0,
			// 			wr = week * rank,
			// 			ws = week * week;

			// 			x += week;
			// 			y += rank;
			// 			xy += wr;
			// 			x2 += ws;
			// });

			// trend = ((arr.length * xy) - (x * y)) / ((arr.length * x2) - (x * x));

			// return trend > 1 ? 'Rising' : 'Falling';
			//
			arr = Object.keys(data).sort().reverse();
			if(!data[arr[1]] || !data[arr[0]]) return '';
			if(!data[arr[1]].rank || !data[arr[0]].rank) return '';

			chg = data[arr[1]].rank - data[arr[0]].rank;
			if(chg === 0) return '-';

			return chg > 0 ? 'Rising' : 'Falling';

		} else {
			return data;
		}
	});

	Handlebars.registerHelper('changeRank', function(data) {
		var arr, chg;
		if(data) {
			arr = Object.keys(data).sort().reverse();
			if(!data[arr[1]] || !data[arr[0]]) return '';
			if(!data[arr[1]].rank || !data[arr[0]].rank) return '';

			chg = data[arr[1]].rank - data[arr[0]].rank;
			if(chg === 0) return '';

			return chg > 0 ? '(+' + chg + ')' : '(' + chg + ')';
		} else {
			return data;
		}
	});


	Handlebars.registerHelper('volatility', function(data) {
		var arr, week, sum, avg;
		if(data) {
			arr = Object.keys(data).sort().reverse();
			if(!data[arr[0]].volatility) return '';

			week = $.map(data[arr[0]].volatility, function(val, idx) {
				return val;
			});

			sum = week.reduce(function(prev,curr) {
				return prev + curr;
			}, 0);

			avg = sum / week.length;

			return isNaN(avg) ? '' : avg.toFixed(2) + '%';

		} else {
			return data;
		}
	});

	Handlebars.registerHelper('latestStars', function(data) {
		var arr;
		if(data) {
			arr = Object.keys(data).sort().reverse();
			return data[arr[0]].stars;
		} else {
			return data;
		}
	});

	Handlebars.registerHelper('latestForks', function(data) {
		var arr;
		if(data) {
			arr = Object.keys(data).sort().reverse();
			return data[arr[0]].forks;
		} else {
			return data;
		}
	});

	Handlebars.registerHelper('latestUsers', function(data) {
		var arr;
		if(data) {
			arr = Object.keys(data).sort().reverse();
			return data[arr[0]].users;
		} else {
			return data;
		}
	});

});
