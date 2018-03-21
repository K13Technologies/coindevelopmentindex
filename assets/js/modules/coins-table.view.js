/* globals Coins, HBS, Handlebars, Utils */
jQuery(document).ready(function($) {
	'use strict';

	if(typeof HBS === 'undefined' || !$('.coin-list')[0]) return false;

	var template = HBS['list-item'],
			$hdgs = $('th[data-prop]'),
			START = 0,
			PER_PAGE = 25,
			timeout = null,
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
			return renderTableView(Coins.reset().list(), buildPagination);
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
		$(window).off('scroll.coinlist', onWindowScrolled);

		if($('.tools').is('.expanded') && window.innerWidth > 600) {
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

	var reportDataStatus = function() {
		var $status = $('#data-status'),
				hasLength = Coins.list().length > 100,
				hasData = Coins.list()[0].data && Coins.list()[0].data.length > 0,
				stat = 'error',
				mtime;

		Coins.file('filemtime')
			.then(function(t) {
				mtime = t;
				if(hasLength && hasData) {
					stat = 'operational';
				}
				$status.html('<i class="' + stat + '"></i> Risk index ' + stat + ', last updated ' + mtime);
			});

	};

	var onWindowScrolled = function(e) {
		if(!timeout) {
			timeout = setTimeout(function() {
				timeout = null;
				if(window.innerWidth < 600 && window.scrollY > ($('header')[0].offsetHeight)) {
					onSearchIconClicked();
				} else {

				}
			 }, 66);
		}
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

		reportDataStatus();
		addSortIcons();
		buildPagination();

		if(window.innerWidth < 600) {
			$('#coin-search input').attr('placeholder', 'Search index');
		}

		$('#coin-search').on('keyup', onCoinSearched);
		$('#search-type').on('change', onCoinSearched);
		$('#coin-search i.fa').on('click', onSearchIconClicked);
		$('.coin-list').on('click', 'th', onTableHeadClicked);
		$('.pg-tools').on('click', 'a', onPaginationClicked);
		$(window).on('scroll.coinlist', onWindowScrolled);

		renderTableView(Coins.sort().list(), function() {
			$('[data-prop="latest.rank"]').trigger('click');
		});

	});

});
