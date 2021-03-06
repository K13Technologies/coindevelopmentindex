/* globals JSON */
jQuery(document).ready(function($) {
    'use strict';

    if(!$('form[name="coin"]')[0]) return false;

    var $coinForm = $('form[name="coin"]'),
        $coinSel = $('select#coin'),
        $apiBtns = $('button[data-endpoint]'),
        $deleteBtn = $('button[name="delete"]'),
        $fields = $('.auto-fields'),
        $output = $('#output'),
        loco = window.location,
        $releases, $data;

    var onCoinsLoaded = function() {

        Coins.list().map(function(coin) {
            var selected = (loco.hash.slice(1) === coin.symbol),
                $opt;

            $opt = $('<option value="' + coin.symbol + '" >' +
                    coin.coinname + ' (' + coin.symbol + ')</option>')
                .prop('selected', selected)
                .appendTo($coinSel);
        });

        $coinSel.prepend('<option value="new">Create new coin...</option>');
        $('header .alert').find('i.fa-spinner').remove();

        handleOwnerChange();
    };

    var onFieldsLoaded = function() {

        var $tabs = $('<ul id="categoryTab" class="nav nav-tabs" role="tablist">'),
            $tab = $('<li class="nav-item">'),
            $ctr = $('<div class="tab-content" id="categoryTabContent">'),
            $panel,
            tabs = ['general', 'contact', 'developer', 'data', 'admin'],
            tabsort = function(a,b) {
                            var nA = null, nB = null;
                            if(tabs.includes(a)) { nA = tabs.indexOf(a); }
                            if(tabs.includes(b)) { nB = tabs.indexOf(b); }
                            if(nA === null) { return 1; }
                            if(nB === null) { return -1; }
                            if(nA === nB) { return 0; }
                            return nA < nB ? -1  : 1;
                        },
            fields = Coins.fields()
                        .reduce(function(obj, f) {
                            if(!obj[f.group])  {
                                obj[f.group] = [];
                            }
                            obj[f.group].push(f);
                            return obj;
                        },{});

        Object.keys(fields).sort(tabsort).forEach(function(cat) {

            $tabs.append($tab.clone().html('<a class="nav-link" id="' + cat +
                '-tab" data-toggle="tab" href="#' + cat +
                '" role="tab" aria-controls="' + cat +
                '" aria-selected="false">' + cat + '</a>'));

            $panel = $('<div class="tab-pane fade" role="tabpanel">').attr({
                         id: cat,
                        'aria-labelledby': cat + '-tab'
                     }).appendTo($ctr);

            fields[cat].sort(function(a,b) {

                return (typeof a.order === 'number' && typeof b.order === 'number') ?
                    a.order - b.order :
                    a.name.localeCompare(b.name);

            }).forEach(function(field) {

                var $div = $('<div class="form-group form-row"></div>'),
                    $el = $('<input class="form-control col-sm-8" />'),
                    $label = $('<label class="col-sm-4"></label>'),
                    a;

                if(!field.type) return;

                for(a in field) {
                    if(field.hasOwnProperty(a)) {
                        switch(a) {
                            case 'name':
                                $label.attr('for', field[a]);
                            case 'disabled':
                                $el.attr('data-disabled', field[a]);
                            case 'required':
                                $el.prop(a, field[a]);
                                break;
                            case 'options':
                                $el = $('<select class="form-control col-sm-8"></select>');
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
                $label
                    .text(field.label || field.heading || field.name[0].toUpperCase() + field.name.slice(1))
                    .css('font-weight', field.required ? 'bold' : '');

                $div.append($label).append($el);
                $panel.append($div);

            });

        });

        $fields.append($tabs).append($ctr);

        $tabs.find('li.nav-item a').first().click();

        // $releases = $('input[name="releases"]');
        $data = $('input[name="data"]');

    };

    var handleOwnerChange = function(e) {

        var coin = Coins.find({
                symbol: $coinSel.val()
            });

        if(coin) {
            mapToFields(coin,true);
            window.history.pushState(coin, '', '#'+coin.symbol);
        } else {
            $fields.find('input').val('');
            window.history.pushState('', '', '#');
            $coinForm.find('button[type="submit"]').text('Create New JSON Entry');
        }

        $('.coinnav.prev').prop('disabled', ($coinSel.val() === 'new'));
        $('.coinnav.next').prop('disabled', ($coinSel.val() === Coins.list()[Coins.list().length - 1].symbol));

    };

    var handleForm = function(e) {

        var status = $coinSel.val() === 'new' ? 'created' : 'updated',
            coin;

        e.preventDefault();
        resetAlert();

        $coinForm.find('input:disabled').prop('disabled', false);
        coin = $coinForm.serializeArray();

        if($coinSel.val() === 'new') {
            coin.push({ name: "new", value: true });
        }

        $output.addClass('alert alert-secondary active').html('<i class="fa fa-spinner fa-pulse fa-2x fa-fw"></i> Sending JSON...');

        Coins.update(coin)
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
                    $output.addClass('alert alert-success active').html(
                        response[0].coinname + ' (' + response[0].symbol + ') ' +
                            status + ' successfully... Refreshing in <span class="count">' + count + '</span>');
                    window.history.pushState(response[0], '', '#' + response[0].symbol);
                    setInterval(function() { count--; $output.find('.count').text(count); if(count === 0) loco.reload(); }, 500);
                }
            })
            .fail(function(err) {
                $output.addClass('alert alert-danger active').html(err.responseText);
            })
            .always(function() {
                $coinForm.find('input:disabled').prop('disabled', true);
            });
    };

    var apiFetch = function(e) {

        var service = $(this).text(),
            endpoint = $(this).data('endpoint'),
            reqs = $(this).data('reqs').split(','),
            invalid = reqs.reduce(function(prev, curr) {
                return prev +
                        ($('input[name="' + curr + '"]').val() === '' ? 'You must provide the ' + curr + ' for the coin.<br>' : '');
            }, ''),
            coin;

        resetAlert();

        if(invalid.length > 0) {
            $output.addClass('alert alert-danger active').html(invalid);
            hideAlert(3000);
            return false;
        }

        $coinForm.find('input:disabled').prop('disabled', false);
        coin = $coinForm.serializeArray();

        if($coinSel.val() === 'new') {
            coin.push({ name: "new", value: true });
        }

        $output.addClass('alert alert-secondary active').html('<i class="fa fa-spinner fa-pulse fa-2x fa-fw"></i> Contacting ' + service + '...');

        Coins.fetch(coin, endpoint)
            .done(function(response) {
                var errors = response.errors,
                    out = '';

                if(errors && errors.length > 0) {
                    errors.forEach(function(error) {
                        out += '<b>ERROR: ' + error.type + '</b> ' + error.message + '<br>';
                    });
                    $output.addClass('alert alert-danger active').html(out);
                    $output.one('click', hideAlert);
                    return;
                } else {
                    $output.addClass('alert alert-success active').html('Found data for ' + response[0].coinname + ' (' + response[0].symbol + ')');
                    hideAlert();
                }

                mapToFields(response[0]);

            })
            .fail(function(err) {
                $output.addClass('alert alert-danger active').html(err.responseText);
            })
            .always(function() {
                $coinForm.find('[data-disabled="true"]').prop('disabled', true);
            });
    };

    var deleteRecord = function(e) {

        var index = getSelectedIndex(),
            coin = Coins.find({
                coinname: $('input[name="coinname"]').val(),
                symbol: $('input[name="symbol"]').val()
            }),
            count = 3;

        e.preventDefault();
        resetAlert();

        if(window.confirm('Are you sure you want to DELETE ' + coin.coinname + ' (' + coin.symbol + ') ?')) {

            $output.addClass('alert alert-warning active').html('<i class="fa fa-spinner fa-pulse fa-2x fa-fw"></i> Deleting ' + coin.coinname + ' (' + coin.symbol + ') ...');

            Coins.deleteCoin(coin, index)
                .done(function(response) {

                    var errors = response.errors,
                        out = '';

                    if(errors && errors.length > 0) {
                        errors.forEach(function(error) {
                            out += '<b>ERROR: ' + error.type + '</b> ' + error.message + '<br>';
                        });
                        $output.addClass('alert alert-danger active').html(out);
                        $output.one('click', hideAlert);
                        return;
                    } else {
                        if(response.length === Coins.list().length - 1) {
                            $output.addClass('alert alert-success active').html(coin.coinname + ' (' + coin.symbol + ') deleted successfully... Refreshing in <span class="count">' + count + '</span>');
                            setInterval(function() { count--; $output.find('.count').text(count); if(count === 0) loco.reload(); }, 1000);
                        } else {
                            $output.addClass('alert alert-danger active').html('Possible deletion error... you may need to double check ' + Coins.file());
                        }
                    }
                });
        }
    };

    var onNavClick = function(e) {
        var $this = $(e.currentTarget),
            idx = getSelectedIndex();

        if($this.is('.prev') && (idx - 1 > -1)) {
            $coinSel.val(Coins.list()[idx - 1].symbol);
        }
        if($this.is('.next') && (idx + 1 < Coins.list().length)) {
            $coinSel.val(Coins.list()[idx + 1].symbol);
        }

        handleOwnerChange();
    };

    var getJSONLocation = function() {
        Coins.file().done(function(loc) {
            $('header h1').after('<div class="alert alert-info active"><small>' + loc +
                '</small><i class="fa fa-spinner fa-pulse fa-3x fa-fw"></i></div>');
        });
    };

    var getSelectedIndex = function() {
        return Array.prototype.slice.call($coinSel.find('option')).findIndex(function(opt) { return opt.selected }) - 1;
    };

    var resetForm = function(e) {
        resetAlert();
        $coinSel.val('new');
        // if($releases.hasClass('wrapped')) {
        //     $releases.val('').removeClass('wrapped').addClass('col-sm-12').unwrap().next('ul').remove();
        // }
        if($data.hasClass('wrapped')) {
            $data.val('').removeClass('wrapped').addClass('col-sm-12').unwrap().next('table').remove();
        }
        handleOwnerChange();
        window.history.pushState('', '', '#');
    };

    var mapToFields = function(coin,reset) {

        var status,
            reset = reset || false,
            // $releasesDiv = $('<div class="col-sm-9"></div>'),
            $dataDiv = $('<div class="col-sm-12"></div>'),
            data = '',
            releases;

        $fields.find('input, select').each(function() {
            var $f = $(this),
                n = $f.attr('name'),
                val = coin[n] || '';

            if(reset) {

                $f.removeClass('update');
                if($f.next('.input-group-addon')[0]) {
                    $f
                        .addClass('col-sm-8')
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

        // if(coin.releases && coin.releases.length > 0) {

        //     releases = '<ul class="releases">' +
        //         coin.releases.map(function(release) {
        //             return '<li><b>' + release.name + '</b> - <em>' +
        //                     release.publishedAt + '</em></li>';
        //         }).join('') + '</ul>';


        //     if(!$releases.hasClass('wrapped')) {
        //         $releases
        //             .removeClass('col-sm-9')
        //             .addClass('wrapped')
        //             .wrap($releasesDiv)
        //             .after(releases);
        //     } else {
        //         $('ul.releases').replaceWith(releases);
        //     }

        // } else if($releases.hasClass('wrapped') && reset) {
        //     $releases.removeClass('wrapped').addClass('col-sm-9').unwrap().next('ul').remove();
        // }

        if(coin.data) {
            data = '<table class="table table-sm data">' +
                        '<thead>' +
                            '<th>day</th>' +
                            '<th>rank</th>' +
                            '<th>volatility</th>' +
                            '<th>price USD</th>' +
                            '<th>users</th>' +
                            '<th>forks</th>' +
                            '<th>commits</th>' +
                            '<th>stars</th>' +
                        '</thead>' +
                        '<tbody>';
            coin.data.forEach(function(day) {
                data += '<tr>' +
                            '<td>' + (day.date || '') + '</td>' +
                            '<td>' + (day.rank || '') + '</td>' +
                            '<td>' + (day.volatility ? day.volatility.toFixed(2) + '%' : '') + '</td>' +
                            '<td>' + (day.price ? parseFloat(day.price).toFixed(4) : '') + '</td>' +
                            '<td>' + (day.users || '') + '</td>' +
                            '<td>' + (day.forks || '') + '</td>' +
                            '<td>' + (day.commits || '') + '</td>' +
                            '<td>' + (day.stars || '') + '</td>' +
                        '</tr>';
            });
            data +=     '</tbody>' +
                    '</table>';
            if(!$data.hasClass('wrapped')) {
                $data
                    .removeClass('col-sm-12')
                    .addClass('wrapped')
                    .wrap($dataDiv)
                    .after(data);
            } else {
                $('table.data').replaceWith(data);
            }
        } else if($data.hasClass('wrapped') && reset) {
            $data.removeClass('wrapped').addClass('col-sm-12').unwrap().next('table').remove();
        }

        status = $coinSel.val() === 'new' ? 'Create' : 'Update';

        $coinForm.find('button[type="submit"]').text(status + ' ' + $coinSel.val() + ' JSON');
    };

    var addRevertBtn = function($input) {
        var $grp = $('<div class="input-group col-sm-8"></div>');
        $input.removeClass('col-sm-8').wrap($grp);
        $input.after('<span class="undo input-group-addon"><i class="fa fa-undo" title="Revert Update"></i></span>');
    };

    var toggleRevert = function(e) {
        var $grp = $(e.target).closest('.input-group'),
            $input = $grp.find('input');

        if(!$input.data('curr')) {
            $input.data('curr', $input.val());
        }
        if($input.val() === $input.data('prev')) {
            $input.val($input.data('curr'));
        } else {
            $input.val($input.data('prev'));
        }
    };

    var revertField = function(e) {
        var $grp = $(e.target).closest('.input-group'),
            $input = $grp.find('input');

        $input
            .val($input.data('prev'))
            .removeClass('update')
            .addClass('col-sm-8')
            .unwrap()
            .next('.input-group-addon').remove();
    };

    var hideAlert = function(t) {
        t = t || 2000;
        setTimeout(resetAlert, t);
        setTimeout(function() {
            $output.empty();
        }, t + 800);
    };

    var resetAlert = function() {
        $output.removeClass('alert alert-danger alert-success alert-info  alert-secondary active');
    };

    getJSONLocation();

    /* globals Coins */
    Coins.init(function() {

        onFieldsLoaded();
        onCoinsLoaded();

        $coinSel.focus();

        $coinSel.on('change', handleOwnerChange);
        $apiBtns.on('click', apiFetch);
        $deleteBtn.on('click', deleteRecord);
        $coinForm.on('mouseenter mouseleave', '.undo', toggleRevert);
        $coinForm.on('click', '.undo', revertField);
        $coinForm.on('click', '.coinnav', onNavClick);
        $coinForm.on('submit', handleForm);
        $coinForm.on('reset', resetForm);

    });
});
