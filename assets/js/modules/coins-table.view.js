/* globals Coins, HBS, Handlebars */
jQuery(document).ready(function($) {
	'use strict';

	if(typeof HBS === 'undefined' || !$('.coin-list')[0]) return false;

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
		  $('.coin-list tbody').html(list);

		  return cb && cb();

	};

	var addSortIcons = function() {
		var icons = '<i class="fa fa-arrow-down"></i><i class="fa fa-arrow-up"></i>';

		$hdgs.each(function() {
			$(this).prepend(icons).wrapInner('<div class="sortable"></div>');
		});

		// $('.coin-list').on('floatThead', onTheadFloated);

		$('.coin-list').floatThead({
			position: 'absolute',
			top: function() { return $('nav').outerHeight(); },
			autoReflow: true
		});

		// $('th[data-prop="volatility"] .vs').text(
		// 	$('th[data-prop="volatility"] .vs').text()
		// 		.replace(/Avg\)/, 'Avg: ' + Coins.indexAvg('volatility').toFixed(2) + '%)'));

		$('.coin-list thead').addClass('initialized');

	};

	// var onTheadFloated = function(e, isFloated, $container) {

	// 		$('.tools').toggleClass('floated', isFloated);

	// };

	var onCoinSearched = function(e) {
		var $s = $('[name="search"]'),
				$searchdiv = $('#coin-search'),
				$icn = $searchdiv.find('.fa'),
				$t = $('[name="cointype"]:checked');

		if($s.val().length === 0 && $t.val() === 'All') {
			$icn.removeClass('fa-close').addClass('fa-search');
			return renderTableView(Coins.reset().list());
		}

		$searchdiv.addClass('searched');
		scrollTableTop();

		$icn
			.removeClass($s.val() ? 'fa-search' : '').addClass($s.val() ? 'fa-close' : '')
			.one('click', function(e) {
				$s.val('');
				$searchdiv.removeClass('searched');
				$icn.removeClass('fa-close').addClass('fa-search');
				renderTableView(Coins.reset().search({
					regexp: $s.val(),
					type: $t.val()
				}));
				buildPagination();
				scrollTableTop();
			});

		START = 0;

		renderTableView(Coins.search({
			regexp: $s.val(),
			type: $t.val()
		}));

		buildPagination();

	};

	var onSearchIconClicked = function(e) {

		$('.tools').toggleClass('expanded', !$('#coin-search').is('.searched'));
		$('nav').toggleClass('show', !$('.tools').is('.expanded'));

		if($('.tools').is('.expanded')) {
			$('#coin-search').find('input').focus();
			$(document).on('click.tools', function(e) {
				if($(e.target).is('#coin-search i.fa')) {
					return false;
				}
				$(document).off('click.tools');
				$('.tools').removeClass('expanded');
				$(window).trigger('scroll');
			});
		}
	};

	var onTableHeadClicked = function(e) {

		var $hdg = $(this);

		prop = $hdg.data('prop');
		asc = !$hdg.data('asc');

		$hdg.data('asc', asc);

		$hdgs.removeClass('sorted asc desc');
		$hdg.addClass('sorted').addClass(asc ? 'asc' : 'desc');

		// reset pagination
		START = 0;
		buildPagination();

		renderTableView(Coins.sort(prop, asc).list());

	};

	var buildPagination = function() {

		// var pgs = Math.ceil(Coins.list().length / PER_PAGE),
		// 		str = '', i;

		// for(i = 1; i <= pgs; i++) {
		// 	str += '<a class="pg-' + i + (i === ACTIVE_PAGE ? ' active' : '') + '" href="#">' + i + '</a>';
		// }

		var str = '<span class="text-dark">Showing ' + (START + 1) + ' &mdash; ' +
								Math.min((START + PER_PAGE), Coins.list().length) +
									'</span> of ' + Coins.list().length;

		if(Coins.list().length === 0) {
			str = 'No results';
		}

		$('.pg-tools').find('.pgs').empty().html(str);
		$('.pg-tools')
			.addClass('initialized')
			.toggleClass('noresults', Coins.list().length === 0);

		$('.prev').toggleClass('disabled', START === 0);
		$('.next').toggleClass('disabled', START + PER_PAGE > Coins.list().length);

	};

	var onPaginationClicked = function(e) {

		var nav = e.currentTarget.className.replace(/\-\d/, ''),
				$pgs = $('.pgs'),
				i = 0, timer;

		e.preventDefault();

		if($(e.currentTarget).is('.disabled')) { return false; }

		switch(nav) {

			case 'prev' :
				START = Math.max(START - PER_PAGE, 0);
				break;

			case 'next' :
				START = Math.min(START + PER_PAGE, Coins.list().length);
				break;

		}

		renderTableView(Coins.list());

		timer = setInterval(function() {
			switch(i) {
				case 0 :
					$pgs.addClass('hide');
					break;
				case 1 :
		  		buildPagination();
		  		break;
	  		case 2 :
					$pgs.removeClass('hide');
					break;
				case 3 :
					break;
				case 4 :
					scrollTableTop();
					clearInterval(timer);
					break;
			}
			i++;
		}, 200);

	};

	var scrollTableTop = function() {

		var tableTop = $('.coin-list tbody').offset().top
												- $('nav')[0].offsetHeight
												- $('.coin-list thead')[0].offsetHeight
												+ 6;

		if(window.scrollY <= tableTop && window.innerWidth > 600) { return false; }

		$('html, body').animate({
					scrollTop: tableTop
				}, 400);
	};


	Coins.init(function() {

		addSortIcons();
		buildPagination();

		$('#coin-search').on('keyup', onCoinSearched);
		$('#search-type').on('change', onCoinSearched);
		$('#coin-search i.fa').on('click', onSearchIconClicked);
		$('.coin-list').on('click', 'th', onTableHeadClicked);
		$('.pg-tools').on('click', 'a', onPaginationClicked);

		renderTableView(Coins.sort().list(), function() {
			$('[data-prop="latest.rank"]').trigger('click');
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
		if(data) {
			return data[0].rank ? '#' + data[0].rank : '-';
		} else {
			return data;
		}
	});

	Handlebars.registerHelper('trending', function(data) {
		var x = 0, y = 0, xy = 0, x2 = 0, chg;

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
			if(!data[0] || !data[1]) return '';
			if(!data[0].rank || !data[1].rank) return '';

			chg = data[1].rank - data[0].rank;
			if(chg === 0) return '-';

			return chg > 0 ? 'Rising' : 'Falling';

		} else {
			return data;
		}
	});

	Handlebars.registerHelper('changeRank', function(data) {
		var chg;
		if(data) {
			if(!data[0]) return '';
			if(!data[0].rank || !data[data.length - 1].rank) return '';

			chg = data[data.length - 1].rank - data[0].rank;
			if(chg === 0) return '';

			return new Handlebars.SafeString(
				'<span class="vs ' +
						(chg > 0 ? 'text-success"> (+' + chg + ')' : 'text-danger"> (' + chg + ')') +
						'</span>'
				);
		} else {
			return data;
		}
	});

	Handlebars.registerHelper('changeUsers', function(data) {
		var chg;
		if(data) {
			if(!data[0]) return '';
			if(!data[0].users) return '';

			chg = (data[0].users - data[data.length - 1].users) / data[data.length - 1].users * 100;
			if(chg === 0) return '';

			return new Handlebars.SafeString(
						'<span class="vs ' +
						(chg > 0 ? 'text-success"> (+' + chg.toFixed(2) + '%)' : 'text-danger"> (' + chg.toFixed(2) + '%)') +
						'</span>'
				);
		} else {
			return data;
		}
	});

	Handlebars.registerHelper('changeForks', function(data) {
		var chg;
		if(data) {
			if(!data[0]) return '';
			if(!data[0].forks) return '';

			chg = (data[0].forks - data[data.length - 1].forks) / data[data.length - 1].forks * 100;
			if(chg === 0) return '';

			return new Handlebars.SafeString(
				'<span class="vs ' +
						(chg > 0 ? 'text-success"> (+' + chg.toFixed(2) + '%)' : 'text-danger"> (' + chg.toFixed(2) + '%)') +
						'</span>'
				);
		} else {
			return data;
		}
	});

	Handlebars.registerHelper('changeStars', function(data) {
		var chg;
		if(data) {
			if(!data[0]) return '';
			if(!data[0].stars) return '';

			chg = (data[0].stars - data[data.length - 1].stars) / data[data.length - 1].stars * 100;
			if(chg === 0) return '';

			return new Handlebars.SafeString(
				'<span class="vs ' +
						(chg > 0 ? 'text-success"> (+' + chg.toFixed(2) + '%)' : 'text-danger"> (' + chg.toFixed(2) + '%)') +
						'</span>'
				);
		} else {
			return data;
		}
	});

	Handlebars.registerHelper('volatility', function(data) {

		var sum, avg, vs, sign, vssign, color;

		if(data) {
			if(!data[0]) return '';
			if(!data[0].volatility) return '';

			sum = data.reduce(function(prev,curr) {
				return prev + curr.volatility;
			}, 0);

			avg = sum / data.length;

			if(isNaN(avg)) return '';

			sign = avg > 0 ? '+' : '';

			vs = avg / Coins.indexAvg('volatility');

			if(vs > 0) {
				vssign = '+';
				color = 'text-success';
			} else if (vs < 0) {
				vssign = '';
				color = 'text-danger';
			} else {
				vssign = '';
				color = 'text-secondary';
			}

			return new Handlebars.SafeString(
				'<span>'  + sign + avg.toFixed(2) + '%</span><br>'
					+ '<span class="vs ' + color + '">(' + vssign + vs.toFixed(2) + '%)</span>'
			);

		} else {
			return data;
		}
	});

	Handlebars.registerHelper('latestStars', function(data) {
		if(data) {
			return data[0].stars;
		} else {
			return data;
		}
	});

	Handlebars.registerHelper('latestForks', function(data) {
		if(data) {
			return data[0].forks;
		} else {
			return data;
		}
	});

	Handlebars.registerHelper('latestUsers', function(data) {
		if(data) {
			return data[0].users;
		} else {
			return data;
		}
	});

});
