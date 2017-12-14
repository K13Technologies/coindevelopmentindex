/*! FOOTER */
jQuery(document).ready(function($) {
	'use strict';

	var $footer = $('footer'),
			$copy = $footer.find('.copyright-year');

	/* globals Coins */
	var onDonateLinkClicked = function(e) {

		var sym = $(e.currentTarget).closest('[class|="donate"]')[0]
									.className.replace(/donate\-/, '').toUpperCase(),
				coin = Coins.find({ symbol: sym }),
				rate = $(e.currentTarget).prev('.rate').text().replace(/\scoins/,''),
				svg = '/assets/img/qr/wallet-' + sym + '.svg',
				url = '/modals/donate-modal.html';

		e.preventDefault();
		$('.donate-modal').remove();

		$.get(url, function(html) {

			var $modal = $(html);

			$modal.find('.modal-title').html(coin.coinname + ' Wallet');
			$modal.find('.qrcode').html('<img src="' + svg + '">');
			$modal.find('.exchrate').html('US$3 Equals: <strong>' + [rate, coin.coinname, '(' + coin.symbol + ')'].join(' ') + '</strong>');
			$modal.find('.hashid').val(coin.wallet);

			$modal.appendTo('body').modal();

			$modal.on('click', '.copyhash', onWalletCopyClicked);

		});

	};

	var onWalletCopyClicked = function(e) {

		var hash = document.querySelector('.hashid');

	  try {
	  	hash.select();
	    var successful = document.execCommand('copy');
	    $('.copied').addClass( successful ? 'show' : 'error');
	  } catch(err) {
	    console.error('Unable to copy to clipboard');
	  }

	  window.getSelection().removeAllRanges();
	};

	$copy.text(new Date().getFullYear());

	$footer.on('click', '[class|="donate"] a', onDonateLinkClicked);

});
