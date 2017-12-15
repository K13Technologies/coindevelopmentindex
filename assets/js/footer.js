/*! FOOTER */
jQuery(document).ready(function($) {
	'use strict';

	var $footer = $('footer'),
			$copy = $footer.find('.copyright-year'),
			DONATE_AMT = 3;

	/* globals HBS,Coins */
	var onDonateLinkClicked = function(e) {

		if(typeof HBS === 'undefined') { return false; }

		var sym = $(e.currentTarget).closest('[class|="donate"]')[0]
									.className.replace(/donate\-/, '').toUpperCase(),
				coin = Coins.find({ symbol: sym }),
				template = HBS['donate-modal'],
				$modal;

		e.preventDefault();

		$('.donate-modal').remove();

		Coins.price(coin, 'USD', function(coinPrice) {

			$modal = $(template(coinPrice));

			$modal.appendTo('body').modal();

			$modal.on('click', onWalletModalClicked);

		});


	};

	var onWalletModalClicked = function(e) {

		var hash = document.querySelector('.hashid'),
				$target = $(e.target);

  	hash.select();

		if($target.is('.copyhash')) {

		  try {
		    var successful = document.execCommand('copy');
		    $('.copied').addClass( successful ? 'show' : 'error');
		    setTimeout(function() { $('.copied').removeClass('show error'); }, 2000);
		  } catch(err) {
		    console.error('Unable to copy to clipboard');
		  }

		  window.getSelection().removeAllRanges();
	  }

	};

	$copy.text(new Date().getFullYear());

	$footer.on('click', '[class|="donate"] a', onDonateLinkClicked);

	Handlebars.registerHelper('donation', function(p) {
		return (DONATE_AMT / p).toFixed(4);
	});

});
