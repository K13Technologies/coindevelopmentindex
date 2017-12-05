/* globals HBS, Handlebars */
jQuery(document).ready(function($) {
	'use strict';

	if(typeof HBS === 'undefined') return false;

	var template =  HBS['list-item'],
			$hdgs = $('th[data-prop]'),
			coins;

	var fetchJSONdata = function() {

    $.ajax({
        url: 'https://api.myjson.com/bins/909wb',
        dataType: 'json'
    })
    .done(function(data) {

    		coins = data;
        renderTableView(coins, function() {
      		$('[data-prop="rank"]').click();
        });

    })
    .fail(function(err) {
    	console.log(err);

    });
	};

	var renderTableView = function(coins, cb) {

		  var list = coins.reduce(function(prev,curr) {
		        	var html = template(curr);
		        	return prev + html;
		        },'');
		  $('#coin-list tbody').html(list);

		  return cb && cb();

	};

	var addSortIcons = function() {
		var icon = '<i class="fa fa-sort"></i>';

		$hdgs.each(function() {
			$(this).prepend(icon).wrapInner('<div class="sortable"></div>');
		});

	};

	var onTableHeadClicked = function(e) {

		var $hdg = $(this),
				prop = $hdg.data('prop'),
				asc, abs;

		asc = !$hdg.data('asc');
		$hdg.data('asc', asc);

		abs = asc ? 1 : -1;

		coins.sort(function(a,b) {

			var nA, nB, arrA, arrB;

			if(prop.split('.')[0] === 'latest') {

				if(prop.split('.')[1] === 'release') {
					nA = a.releases[0] ? a.releases[0].publishedAt : null;
					nB = b.releases[0] ? b.releases[0].publishedAt : null;
				} else {
					if(a.data) {
						arrA = Object.keys(a.data).sort().reverse();
						nA = a.data[arrA[0]][prop.split('.')[1]];
					} else {
						nA = null;
					}
					if(b.data) {
						arrB = Object.keys(b.data).sort().reverse();
						nB = b.data[arrB[0]][prop.split('.')[1]];
					} else {
						nB = null;
					}
				}

			} else {

				if(!a[prop]) { return 1; }
				if(!b[prop]) { return -1; }

				nA = isNaN(a[prop]) ? a[prop].toLowerCase() : parseFloat(a[prop]);
				nB = isNaN(b[prop]) ? b[prop].toLowerCase() : parseFloat(b[prop]);

			}

			if(nA === null) { return 1; }
			if(nB === null) { return -1; }

			if(nA === nB) { return 0; }
			return nA < nB ? -1 * abs : 1 * abs;
		});

		$hdgs.removeClass('sorted')
			.find('i.fa').removeClass('fa-sort-asc fa-sort-desc');
		$hdg.addClass('sorted')
			.find('i.fa').addClass(asc ? 'fa-sort-asc' : 'fa-sort-desc');

		renderTableView(coins);

	};

	fetchJSONdata();
	addSortIcons();

	$('#coin-list').on('click', 'th', onTableHeadClicked);

	Handlebars.registerHelper('dateFormat', function(d) {
		var options = { year: 'numeric', month: 'long', day: 'numeric' };
		return d ? new Date(d).toLocaleDateString('en-US', options) : d;
	});

	Handlebars.registerHelper('arrayFormat', function(a) {
		return a.join(', ');
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
