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

			  var list = coins.reduce(function(prev,curr) {
			        	var html = template(curr);
			        	return prev + html;
			        },'');

			  $('#coin-list tbody').html(list);

    })
    .fail(function(err) {
    	console.log(err);

    });
	};

	fetchJSONdata();

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
