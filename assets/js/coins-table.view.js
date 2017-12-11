/* globals Coins, HBS, Handlebars */
jQuery(document).ready(function($) {
	'use strict';

	if(typeof HBS === 'undefined') return false;

	var template = HBS['list-item'],
			$hdgs = $('th[data-prop]'),
			START = 0,
			PER_PAGE = 25,
			prop, asc;

	var renderTableView = function(coins) {

		  var list, cb;

		  cb = arguments.length > 1 ? arguments[arguments.length - 1] : false;

		  list = coins.slice(START, START + PER_PAGE).reduce(function(prev,curr) {
		        	var html = template(curr);
		        	return prev + html;
		        },'');
		  $('#coin-list tbody').html(list);

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


	Coins.init(function() {

		addSortIcons();

		$('#coin-search').on('keyup', onCoinSearched);
		$('#search-type').on('change', onCoinSearched);
		$('#coin-list').on('click', 'th', onTableHeadClicked);

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
			return data[arr[0]].rank;
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
