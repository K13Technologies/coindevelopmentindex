/* globals HBS, Handlebars */
jQuery(document).ready(function($) {
	'use strict';

	if(typeof HBS === 'undefined') return false;

	var template =  HBS['list-item'],
			$hdgs = $('th[data-prop]'),
			fields, coins;

	var fetchJSONdata = function() {

    return $.ajax({
        url: 'https://api.myjson.com/bins/909wb',
        dataType: 'json'
    })
	};

	var fetchFormFields = function() {

		return	$.ajax({
				url: '/assets/json/form-fields.json',
	      dataType: 'json'
			});
	};

	var renderNullChars = function(coins) {

		coins.forEach(function(coin) {
			var c, f;
			for(c in coin) {
				f = fields.find(function(field) { return field.name === c; });
				if(f && !coin[c] && f['null-char']) {
					coin[c] = f['null-char'];
				}
			}
		});

		return coins;
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
		var icon = '<i class="fa fa-sort fa-2x"></i>';

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

	fetchFormFields()
		.then(function(data) {
			fields = data;
			return fetchJSONdata();
		})
		.then(function(data) {
  		coins = data;
  		coins = renderNullChars(coins);
      renderTableView(coins, function() {
    		$('[data-prop="rank"]').click();
      });
		})
		.catch(function(err) {
			console.error(err);
		});

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

	Handlebars.registerHelper('latestForks', function(data) {
		var p, arr;
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
