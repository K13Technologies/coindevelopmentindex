/* globals HBS */
jQuery(document).ready(function($) {
	'use strict';

	var template = HBS['list-item'],
			repos;

	var fetchJSONdata = function() {

    $.ajax({
        url: 'https://api.myjson.com/bins/909wb',
        dataType: 'json'
    })
    .done(function(data) {

        repos = data;

			  var list = repos.reduce(function(prev,curr) {
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

});
