/* globals HBS, Handlebars */
jQuery(document).ready(function($) {
	'use strict';

	if(typeof HBS === 'undefined') return false;

	var template =  HBS['list-item'],
			coins;

	var fetchJSONdata = function() {

    $.ajax({
        url: 'https://api.myjson.com/bins/909wb',
        dataType: 'json'
    })
    .done(function(data) {

        coins = data.sort(function(a,b) {
        	return a.rank ? a.rank - b.rank : 1;
        });

        renderTableView(coins);
    })
    .fail(function(err) {
    	console.log(err);

    });
	};

	var renderTableView = function(coins) {

		  var list = coins.reduce(function(prev,curr) {
		        	var html = template(curr);
		        	return prev + html;
		        },'');

		  $('#coin-list tbody').html(list);

	};

	var onTableHeadClicked = function(e) {

		var $hdg = $(this),
				prop = $hdg.data('prop'),
				asc, abs;

		asc = !$hdg.data('asc');
		$hdg.data('asc', asc);

		abs = asc ? 1 : -1;

		coins.sort(function(a,b) {

			var nA, nB, arr;

			if(prop.split('.')[0] === 'latest') {
				if(a.data) {
					arr = Object.keys(a.data).sort().reverse();
					nA = a.data[arr[0]][prop.split('.')[1]];
				}
				if(a.data) {
					arr = Object.keys(b.data).sort().reverse();
					nB = b.data[arr[0]][prop.split('.')[1]];
				}
			} else {
				nA = 'string' === typeof a[prop] ? a[prop].toLowerCase() : a[prop];
				nB = 'string' === typeof b[prop] ? b[prop].toLowerCase() : b[prop];
			}
			if(nA === nB) return 0;
			return nA < nB ? -1 * abs : 1 * abs;
		});


		renderTableView(coins);

	};

	fetchJSONdata();

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
