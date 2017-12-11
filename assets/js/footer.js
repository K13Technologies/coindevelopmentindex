/*! FOOTER */
jQuery(document).ready(function($) {
	'use strict';

	var $footer = $('footer'),
			$copy = $footer.find('.copyright-year');

	$copy.text(new Date().getFullYear());

});
