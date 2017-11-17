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
            url: '/assets/json/data.json',
            dataType: 'json'
        })
        .done(function(data) {

            repos = data;

            $ownerSel.html(repos.map(function(repo) {
                var selected = (loco.hash.slice(1) === repo.owner + '/' + repo.name) ? 'selected' : '';
                return '<option value="' + repo.owner + '/' + repo.name + '" ' + selected + '>' +
                            repo.owner + ' / ' + repo.name + '</option>';
            }).join('\n'));

            $ownerSel.prepend('<option value="new">Create new repo...</option>');

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
            mapToFields(repo);
            window.history.pushState(repo, '', '#'+repo.owner+'/'+repo.name);
        } else {
            $fields.find('input').val('');
            loco.hash = '';
            $repoForm.find('button[type="submit"]').text('Create New JSON Entry');
        }

    };

    var handleForm = function(e) {

        var data;

        hideAlert();
        e.preventDefault();

        $repoForm.find('input:disabled').prop('disabled', false);

        data = $repoForm.serialize();

        $output.removeClass('alert alert-danger');

        $.post({
              url: 'http://api.coindev.local',
              data: data
            })
            .done(function(response) {
                $output.addClass('alert alert-success active').html(response[0].owner + '/' + response[0].name + ' updated successfully.');
                window.history.pushState(response[0], '', '#'+response[0].owner+'/'+response[0].name);
                hideAlert(3000);
            })
            .fail(function(err) {
                $output.addClass('alert alert-danger active').html(err);
            })
            .always(function() {
                $repoForm.find('input:disabled').prop('disabled', true);
            });
    };

    var apiFetch = function(e) {

        hideAlert();

        $repoForm.find('input:disabled').prop('disabled', false);

        if($('input[name="owner"]').val() === '' || $('input[name="name"]').val()  === '') {
            $output.addClass('alert alert-danger active').text('You must provide the owner and name for repo.');
            hideAlert(3000);
            return false;
        }

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
                    return;
                } else {
                    $output.addClass('alert alert-success active').html('Found data for ' + response[0].owner + '/' + response[0].name);
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

    var mapToFields = function(repo) {
        var status;

        $fields.find('input').each(function() {
            var $f = $(this),
                n = $f.attr('name'),
                val = repo[n];

            if(val && $f.attr('type') === 'datetime-local') {
                val = val.replace(/:\d{2}Z$/, '');
            }
            if(val) {
                $f.data('prev', $f.val()).val(val);
            }
        });

        if(repo.releases) {
            $('.releases').html('<ul>' +
                repo.releases.map(function(release) {
                    return '<li><b>' + release.name + '</b> - <em>' +
                            release.publishedAt + '</em></li>';
                }).join('') + '</ul>');
        } else {
            $('.releases').empty();
        }

        status = $ownerSel.val() === 'new' ? 'Create' : 'Update';

        $repoForm.find('button[type="submit"]').text(status + ' ' + repo.owner + ' / ' + repo.name + ' JSON');
    };

    var hideAlert = function(t) {
        t = t || 2000;
        setTimeout(function() {
            $output.removeClass('alert alert-danger alert-success active');
        }, t);
        setTimeout(function() {
            $output.empty();
        }, t + 800);
    };

    fetchJSONdata();
    fetchFormFields();

    $ownerSel.focus();

    $ownerSel.on('change', handleOwnerChange);
    $apiBtn.on('click', apiFetch);
    $repoForm.on('submit', handleForm);
    $output.on('click', hideAlert);





});
