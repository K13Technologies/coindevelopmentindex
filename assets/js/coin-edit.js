/* globals JSON */
jQuery(document).ready(function($) {
    'use strict';

    if(!$('form[name="coin"]')[0]) return false;

    var $coinForm = $('form[name="coin"]'),
        $ownerSel = $('select[name="ownername"]'),
        $githubBtn = $('button[name="github"]'),
        $cryptoBtn = $('button[name="cryptocomp"]'),
        $coinmarketBtn = $('button[name="coinmarket"]'),
        $deleteBtn = $('button[name="delete"]'),
        $fields = $('.auto-fields'),
        $output = $('#output'),
        loco = window.location,
        coins, fields,
        $releases, $data;

    var fetchJSONdata = function() {
        $.ajax({
            url: 'http://api.coindev.local' + loco.search,
            dataType: 'json'
        })
        .done(function(data) {

            coins = data;

            coins.map(function(coin) {
                var selected = (loco.hash.slice(1) === coin.owner + '/' + coin.name),
                    $opt;

                $opt = $('<option value="' + coin.owner + '/' + coin.name + '" ' + '>' +
                        coin.owner + ' / ' + coin.name + '</option>')
                    .prop('selected', selected)
                    .appendTo($ownerSel);
            });

            $ownerSel.prepend('<option value="new">Create new coin...</option>');
            $('header .alert').find('i.fa-spinner').remove();

            handleOwnerChange();
        });
    };

    var fetchFormFields = function() {
        $.ajax({
            url: '/assets/json/form-fields.json',
            dataType: 'json'
        })
        .done(function(data) {

            fields = data;

            fields.forEach(function(field) {

                var $div = $('<div class="form-group form-row"></div>'),
                    $el = $('<input class="form-control col-sm-9" />'),
                    $label = $('<label class="col-sm-3"></label>'),
                    a;

                if(!field.type) return;

                for(a in field) {
                    if(field.hasOwnProperty(a)) {
                        switch(a) {
                            case 'name':
                                $label.attr('for', field[a])
                                    .text(field[a])
                                    .css('font-weight', field.required ? 'bold' : '');
                            case 'disabled':
                            case 'required':
                                $el.prop(a, field[a]);
                                break;
                            case 'options':
                                $el = $('<select class="form-control col-sm-9"></select>');
                                $el.append(field[a].map(function(opt) {
                                        return '<option value="' + opt + '">' + opt + '</option>';
                                    }).join(''));
                                break;
                            default:
                                $el.attr(a, field[a]);
                                break;
                        }
                    }
                }
                $div.append($label).append($el);
                $fields.append($div);
            });

            $releases = $('input[name="releases"]');
            $data = $('input[name="data"]');
        });

    };

    var handleOwnerChange = function(e) {

        var index = getSelectedIndex(),
            coin = coins ? coins.find(function(coin) {
                return coin.owner + '/' + coin.name === $ownerSel.val() && coins.indexOf(coin) === index;
            }) : false;

        if(coin) {
            mapToFields(coin,true);
            window.history.pushState(coin, '', '#'+coin.owner+'/'+coin.name);
        } else {
            $fields.find('input').val('');
            window.history.pushState('', '', '#');
            $coinForm.find('button[type="submit"]').text('Create New JSON Entry');
        }

        $('.coinnav.prev').prop('disabled', ($ownerSel.val() === 'new'));
        $('.coinnav.next').prop('disabled', ($ownerSel.val() === coins[coins.length - 1].owner + '/' + coins[coins.length - 1].name));

    };

    var handleForm = function(e) {

        e.preventDefault();

        $coinForm.find('input:disabled').prop('disabled', false);

        $output.addClass('alert alert-secondary active').html('<i class="fa fa-spinner fa-pulse fa-2x fa-fw"></i> Sending JSON...');

        $.post({
              url: 'http://api.coindev.local' + loco.search,
              data: $coinForm.serialize()
            })
            .done(function(response) {
                var errors = response.errors,
                    out = '', count = 3;

                if(errors && errors.length > 0) {
                    errors.forEach(function(error) {
                        out += '<b>ERROR: ' + error.type + '</b> ' + error.message;
                    });
                    $output.addClass('alert alert-danger active').html(out);
                    return;
                } else {
                    $output.addClass('alert alert-success active').html(response[0].owner + '/' + response[0].name + ' updated successfully... Refreshing in <span class="count">' + count + '</span>');
                    window.history.pushState(response[0], '', '#'+response[0].owner+'/'+response[0].name);
                    setInterval(function() { count--; $output.find('.count').text(count); if(count === 0) loco.reload(); }, 500);
                }
            })
            .fail(function(err) {
                $output.addClass('alert alert-danger active').html(err);
            })
            .always(function() {
                $coinForm.find('input:disabled').prop('disabled', true);
            });
    };

    var githubFetch = function(e) {

        $coinForm.find('input:disabled').prop('disabled', false);

        if($('input[name="owner"]').val() === '' || $('input[name="name"]').val()  === '') {
            $output.addClass('alert alert-danger active').text('You must provide the owner and name for coin.');
            hideAlert(3000);
            return false;
        }

        $output.addClass('alert alert-secondary active').html('<i class="fa fa-spinner fa-pulse fa-2x fa-fw"></i> Contacting Github API...');

        $.post({
              url: 'http://api.coindev.local' + loco.search,
              data: $coinForm.serialize() + '&githubfetch=1'
            })
            .done(function(response) {

                // console.log(response);
                var errors = response.errors,
                    out = '';

                if(errors && errors.length > 0) {
                    errors.forEach(function(error) {
                        out += '<b>ERROR: ' + error.type + '</b> ' + error.message;
                    });
                    $output.addClass('alert alert-danger active').html(out);
                    $output.one('click', hideAlert);
                    return;
                } else {
                    $output.addClass('alert alert-success active').html('Found data for ' + response[0].owner + '/' + response[0].name);
                    mapToFields(response[0]);
                    hideAlert();
                }

            })
            .fail(function(err) {
                console.log(err);
                $output.addClass('alert alert-danger active').html(err);
            })
            .always(function() {
                $coinForm.find('input:disabled').prop('disabled', true);
            });
    };


    var cryptocompFetch = function(e) {

        if($('input[name="symbol"]').val()  === '') {
            $output.addClass('alert alert-danger active').text('You must provide the symbol for the coin.');
            hideAlert(3000);
            return false;
        }

        $output.addClass('alert alert-secondary active').html('<i class="fa fa-spinner fa-pulse fa-2x fa-fw"></i> Contacting CryptoCompare API...');

        $.post({
              url: 'http://api.coindev.local' + loco.search,
              data: $coinForm.serialize() + '&cryptocompfetch=1'
            })
            .done(function(response) {

                console.log(response);
                var errors = response.errors,
                    out = '';

                if(errors && errors.length > 0) {
                    errors.forEach(function(error) {
                        out += '<b>ERROR: ' + error.type + '</b> ' + error.message;
                    });
                    $output.addClass('alert alert-danger active').html(out);
                    $output.one('click', hideAlert);
                    return;
                } else {
                    $output.addClass('alert alert-success active').html('Found data for ' + response[0].owner + '/' + response[0].name);
                    hideAlert();
                }

                mapToFields(response[0]);

            })
            .fail(function(err) {
                console.log(err);
                $output.addClass('alert alert-danger active').html(err);
            })
            .always(function() {
                $coinForm.find('input:disabled').prop('disabled', true);
            });
    };

    var coinmarketFetch = function(e) {

        if($('input[name="symbol"]').val()  === '') {
            $output.addClass('alert alert-danger active').text('You must provide the symbol for the coin.');
            hideAlert(3000);
            return false;
        }

        $output.addClass('alert alert-secondary active')
            .html('<i class="fa fa-spinner fa-pulse fa-2x fa-fw"></i> Contacting CoinMarketCap API...');

        $.post({
              url: 'http://api.coindev.local' + loco.search,
              data: $coinForm.serialize() + '&coinmarketfetch=1'
            })
            .done(function(response) {

                console.log(response);
                var errors = response.errors,
                    out = '';

                if(errors && errors.length > 0) {
                    errors.forEach(function(error) {
                        out += '<b>ERROR: ' + error.type + '</b> ' + error.message;
                    });
                    $output.addClass('alert alert-danger active').html(out);
                    $output.one('click', hideAlert);
                    return;
                }
                if(response.length > 0) {
                    $output.addClass('alert alert-success active').html('Found data for ' + response[0].coinname + ' (' + response[0].symbol + ')');
                    mapToFields(response[0]);
                    hideAlert();
                } else {
                    $output.addClass('alert alert-danger active').text('Could not find data for ' + $('input[name="symbol"]').val());
                    hideAlert(4000);
                }

            })
            .fail(function(err) {
                console.log(err);
                $output.addClass('alert alert-danger active').html(err);
            })
            .always(function() {
                $coinForm.find('input:disabled').prop('disabled', true);
            });
    };

    var deleteRecord = function(e) {

        var index = getSelectedIndex(),
            owner = $('input[name="owner"]').val(),
            name = $('input[name="name"]').val(),
            count = 3;

        $output.addClass('alert alert-secondary active').html('<i class="fa fa-spinner fa-pulse fa-2x fa-fw"></i> Deleting ' + owner + '/' + name + ' ...');

        $.post({
              url: 'http://api.coindev.local' + loco.search,
              data: { 'delete': true, index: index, owner: owner, name: name }
            })
            .done(function(response) {
                console.log(response);

                var errors = response.errors,
                    out = '';

                if(errors && errors.length > 0) {
                    errors.forEach(function(error) {
                        out += '<b>ERROR: ' + error.type + '</b> ' + error.message;
                    });
                    $output.addClass('alert alert-danger active').html(out);
                    $output.one('click', hideAlert);
                    return;
                } else {
                    if(response.length === coins.length - 1) {
                        $output.addClass('alert alert-success active').html(owner + '/' + name + ' deleted successfully... Refreshing in <span class="count">' + count + '</span>');
                        setInterval(function() { count--; $output.find('.count').text(count); if(count === 0) loco.reload(); }, 1000);
                    } else {
                        console.warn('Possible deletion error');
                    }
                }

            });
    };

    var onNavClick = function(e) {
        var $this = $(e.currentTarget),
            idx = getSelectedIndex();

        if($this.is('.prev') && (idx - 1 > -1)) {
            $ownerSel.val(coins[idx - 1].owner + '/' + coins[idx - 1].name);
        }
        if($this.is('.next') && (idx + 1 < coins.length)) {
            $ownerSel.val(coins[idx + 1].owner + '/' + coins[idx + 1].name);
        }

        handleOwnerChange();
    };

    var getJSONLocation = function() {
        $.get('http://api.coindev.local?location=1&' + loco.search.substring(1)).done(function(loc) {
            $('header h1').after('<div class="alert alert-info active"><small>' + loc +
                '</small><i class="fa fa-spinner fa-pulse fa-3x fa-fw"></i></div>');
        });
    };

    var getSelectedIndex = function() {
        return Array.prototype.slice.call($ownerSel.find('option')).findIndex(function(opt) { return opt.selected }) - 1;
    };

    var resetForm = function(e) {
        $ownerSel.val('new');
        if($releases.hasClass('wrapped')) {
            $releases.removeClass('wrapped').addClass('col-sm-9').unwrap().next('ul').remove();
        }
        if($data.hasClass('wrapped')) {
            $data.removeClass('wrapped').addClass('col-sm-9').unwrap().next('table').remove();
        }
        window.history.pushState('', '', '#');
    };

    var mapToFields = function(coin,reset) {

        var status,
            reset = reset || false,
            $releasesDiv = $('<div class="col-sm-9"></div>'),
            $dataDiv = $('<div class="col-sm-9"></div>'),
            data = '',
            releases;

        $fields.find('input, select').each(function() {
            var $f = $(this),
                n = $f.attr('name'),
                val = coin[n];

            if(reset) {

                $f.removeClass('update');
                if($f.next('.input-group-addon')[0]) {
                    $f
                        .addClass('col-sm-9')
                        .unwrap()
                        .next('.input-group-addon').remove();
                }
            }



            if(val || reset) {

                val = $f.data('stringify') ? JSON.stringify(val) : val;
                val = $f.data('remove') ? val.replace(new RegExp($f.data('remove'),'g'),'') : val;

                // don't overwrite already updated fields
                if(!reset && val !== $f.data('prev')) {
                    $f.data('prev', $f.val());
                    if(val !== $f.val()) {
                        if($f.data('revertable')) addRevertBtn($f);
                        $f.addClass('update');
                    }
                 }
                $f.val(val);
            }
        });

        if(coin.releases && coin.releases.length > 0) {

            releases = '<ul class="releases">' +
                coin.releases.map(function(release) {
                    return '<li><b>' + release.name + '</b> - <em>' +
                            release.publishedAt + '</em></li>';
                }).join('') + '</ul>';


            if(!$releases.hasClass('wrapped')) {
                $releases
                    .removeClass('col-sm-9')
                    .addClass('wrapped')
                    .wrap($releasesDiv)
                    .after(releases);
            } else {
                $('ul.releases').replaceWith(releases);
            }

        } else if($releases.hasClass('wrapped') && reset) {
            $releases.removeClass('wrapped').addClass('col-sm-9').unwrap().next('ul').remove();
        }

        if(coin.data) {
            data = '<table class="table table-sm data">' +
                        '<thead>' +
                            '<th>week</th>' +
                            '<th>rank</th>' +
                            '<th>users</th>' +
                            '<th>forks</th>' +
                            '<th>stars</th>' +
                        '</thead>' +
                        '<tbody>';
            for(var d in coin.data) {
                if(coin.data.hasOwnProperty(d)) {
                    data += '<tr>' +
                                '<td>' + d + '</td>' +
                                '<td>' + (coin.data[d].rank || '') + '</td>' +
                                '<td>' + (coin.data[d].users || '') + '</td>' +
                                '<td>' + (coin.data[d].forks || '') + '</td>' +
                                '<td>' + (coin.data[d].stars || '') + '</td>' +
                            '</tr>';
                }
            }
            data +=     '</tbody>' +
                    '</table>';
            if(!$data.hasClass('wrapped')) {
                $data
                    .removeClass('col-sm-9')
                    .addClass('wrapped')
                    .wrap($dataDiv)
                    .after(data);
            } else {
                $('table.data').replaceWith(data);
            }
        } else if($data.hasClass('wrapped') && reset) {
            $data.removeClass('wrapped').addClass('col-sm-9').unwrap().next('table').remove();
        }

        status = $ownerSel.val() === 'new' ? 'Create' : 'Update';

        $coinForm.find('button[type="submit"]').text(status + ' ' + $ownerSel.val() + ' JSON');
    };

    var addRevertBtn = function($input) {
        var $grp = $('<div class="input-group col-sm-9"></div>');
        $input.removeClass('col-sm-9').wrap($grp);
        $input.after('<span class="undo input-group-addon"><i class="fa fa-undo" title="Revert Update"></i></span>');
    };

    var revertField = function(e) {
        var $grp = $(e.target).closest('.input-group'),
            $input = $grp.find('input');

        $input
            .val($input.data('prev'))
            .removeClass('update')
            .addClass('col-sm-9')
            .unwrap()
            .next('.input-group-addon').remove();
    };

    var hideAlert = function(t) {
        t = t || 2000;
        setTimeout(function() {
            $output.removeClass('alert alert-danger alert-success  alert-info  alert-secondary active');
        }, t);
        setTimeout(function() {
            $output.empty();
        }, t + 800);
    };

    getJSONLocation();
    fetchJSONdata();
    fetchFormFields();

    $ownerSel.focus();

    $ownerSel.on('change', handleOwnerChange);
    $githubBtn.on('click', githubFetch);
    $cryptoBtn.on('click', cryptocompFetch);
    $coinmarketBtn.on('click', coinmarketFetch);
    $deleteBtn.on('click', deleteRecord);
    $coinForm.on('click', '.undo', revertField);
    $coinForm.on('click', '.coinnav', onNavClick);
    $coinForm.on('submit', handleForm);
    $coinForm.on('reset', resetForm);

});
