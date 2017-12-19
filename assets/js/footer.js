/*! FOOTER */
/* globals HBS,Coins */
jQuery(document).ready(function($) {
	'use strict';

	if(typeof HBS === 'undefined') { return false; }

	var $footer = $('footer'),
			$copy = $footer.find('.copyright-year'),
			DONATE_AMT = 3;

	var initLinks = function() {
		var template = HBS['donate-links'];

		Coins.init(function() {
			Coins.price(Coins.filter({ wallet: 'NOT_NULL', qrcode: 'NOT_NULL' }), 'USD', function(coins) {
				$footer.find('.footer-center').html(template({
					coins: coins,
					DONATE_AMT: DONATE_AMT.toFixed(2)
				}));
			});
		});

	};

	var onDonateLinkClicked = function(e) {

		var sym = $(e.currentTarget).closest('[class|="donate"]')[0]
									.className.replace(/donate\-/, ''),
				coin = Coins.find({ symbol: sym }),
				template = HBS['donate-modal'],
				$modal;

		e.preventDefault();

		$('.donate-modal').remove();

		$modal = $(template(coin));

		$modal.appendTo('body').modal();

		$modal.on('click', onWalletModalClicked);

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

	initLinks();
	setInterval(initLinks, 1000*60*2);

	$copy.text(new Date().getFullYear());

	$footer.on('click', '[class|="donate"] a', onDonateLinkClicked);

	Handlebars.registerHelper('donation', function(p) {
		return (DONATE_AMT / p).toFixed(4);
	});

});
