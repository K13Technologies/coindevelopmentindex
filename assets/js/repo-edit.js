jQuery(document).ready(function($) {
    'use strict';

    var $repoForm = $('form[name="repo"]'),
        $ownerSel = $('select[name="ownername"]'),
        $apiBtn = $('button[name="remote"]'),
        $fields = $('.auto-fields'),
        $output = $('#output'),
        loco = window.location,
        repos, fields;

    var fetchJSONdata = function() {
        $.ajax({
            url: 'http://api.coindev.local',
            dataType: 'json'
        })
        .done(function(data) {

            // TODO: sort array by owner
            repos = data;

            repos.map(function(repo) {
                var selected = (loco.hash.slice(1) === repo.owner + '/' + repo.name),
                    $opt;

                $opt = $('<option value="' + repo.owner + '/' + repo.name + '" ' + '>' +
                        repo.owner + ' / ' + repo.name + '</option>')
                    .prop('selected', selected)
                    .appendTo($ownerSel);
            });

            $ownerSel.prepend('<option value="new">Create new repo...</option>');
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
                            default:
                                $el.attr(a, field[a]);
                                break;
                        }
                    }
                }
                $div.append($label).append($el);
                $fields.append($div);
            });
        });
    };

    var handleOwnerChange = function(e) {

        var repo = repos ? repos.find(function(repo) {
                return repo.owner + '/' + repo.name === $ownerSel.val();
            }) : false;

        if(repo) {
            mapToFields(repo,true);
            window.history.pushState(repo, '', '#'+repo.owner+'/'+repo.name);
        } else {
            $fields.find('input').val('');
            window.history.pushState('', '', '#');
            $repoForm.find('button[type="submit"]').text('Create New JSON Entry');
        }

    };

    var handleForm = function(e) {

        var data;

        e.preventDefault();

        $repoForm.find('input:disabled').prop('disabled', false);

        data = $repoForm.serialize();

        $output.addClass('alert alert-secondary active').html('<i class="fa fa-spinner fa-pulse fa-2x fa-fw"></i> Sending JSON...');

        $.post({
              url: 'http://api.coindev.local',
              data: data
            })
            .done(function(response) {
                var errors = response.errors,
                    out = '';

                if(errors && errors.length > 0) {
                    errors.forEach(function(error) {
                        out += '<b>ERROR: ' + error.type + '</b> ' + error.message;
                    });
                    $output.addClass('alert alert-danger active').html(out);
                    return;
                } else {
                    $output.addClass('alert alert-success active').html(response[0].owner + '/' + response[0].name + ' updated successfully.');
                    window.history.pushState(response[0], '', '#'+response[0].owner+'/'+response[0].name);
                    hideAlert(3000);
                }
            })
            .fail(function(err) {
                $output.addClass('alert alert-danger active').html(err);
            })
            .always(function() {
                $repoForm.find('input:disabled').prop('disabled', true);
            });
    };

    var apiFetch = function(e) {

        $repoForm.find('input:disabled').prop('disabled', false);

        if($('input[name="owner"]').val() === '' || $('input[name="name"]').val()  === '') {
            $output.addClass('alert alert-danger active').text('You must provide the owner and name for repo.');
            hideAlert(3000);
            return false;
        }

        $output.addClass('alert alert-secondary active').html('<i class="fa fa-spinner fa-pulse fa-2x fa-fw"></i> Contacting Github API...');

        $.post({
              url: 'http://api.coindev.local',
              data: $repoForm.serialize() + '&githubfetch=1'
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
                    hideAlert();
                }

                mapToFields(response[0]);

            })
            .fail(function(err) {
                console.log(err);
                $output.addClass('alert alert-danger active').html(err);
            })
            .always(function() {
                $repoForm.find('input:disabled').prop('disabled', true);
            });
    };

    var getJSONLocation = function() {
        $.get('http://api.coindev.local?location=1').done(function(loc) {
            $('header h1').after('<div class="alert alert-info active"><small>' + loc + '</small><i class="fa fa-spinner fa-pulse fa-3x fa-fw"></i></div>');
        });
    };

    var resetForm = function(e) {
        $ownerSel.val('new');
        $('.releases').empty();
        $repoForm.find('button[type="submit"]').text('Create New JSON Entry');
        window.history.pushState('', '', '#');
    };

    var mapToFields = function(repo,reset) {
        var status;
            reset = reset || false;

        $fields.find('input').each(function() {
            var $f = $(this),
                n = $f.attr('name'),
                val = Array.isArray(repo[n]) ? repo[n].join(',') : repo[n];

            $f.removeClass('update');

            if(val && $f.attr('type') === 'datetime-local') {
                val = val.replace(/:\d{2}Z$/, '');
            }
            if(val || reset) {
                if(!reset) {
                    $f.data('prev', $f.val());
                    if(val !== $f.val()) {
                        console.log(val, $f.val());
                        $f.addClass('update');
                    }
                 }
                $f.val(val);
            }
        });

        if(repo.releases) {
            $('.releases').html('<ul>' +
                repo.releases.map(function(release) {
                    return '<li><b>' + release.name + '</b> - <em>' +
                            release.publishedAt + '</em></li>';
                }).join('') + '</ul>')
                .append('<input type="hidden" value="' + encodeURIComponent(JSON.stringify(repo.releases)) + '" >');
        } else {
            $('.releases').empty();
        }

        status = $ownerSel.val() === 'new' ? 'Create' : 'Update';

        $repoForm.find('button[type="submit"]').text(status + ' ' + repo.owner + ' / ' + repo.name + ' JSON');
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
    $apiBtn.on('click', apiFetch);
    $repoForm.on('submit', handleForm);
    $repoForm.on('reset', resetForm);

});
