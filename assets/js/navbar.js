/*! NAVBAR */
jQuery(document).ready(function($) {
	'use strict';

	var $nav = $('nav'),
			$header = $('header'),
			timeout = null;

	$(window).on('scroll', onWindowScrolled);

	function onWindowScrolled(e) {
		if(!timeout) {
			timeout = setTimeout(function() {
				timeout = null;

				$nav.toggleClass('show', window.scrollY > ($header[0].offsetHeight / 2));

			 }, 66);
		}
	}

});
