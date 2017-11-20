/* globals JSON */
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

        $('.reponav.prev').prop('disabled', ($ownerSel.val() === 'new'));
        $('.reponav.next').prop('disabled', ($ownerSel.val() === repos[repos.length - 1].owner + '/' + repos[repos.length - 1].name));

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
                    setInterval(function() { count--; $output.find('.count').text(count); if(count === 0) loco.reload(); }, 1000);
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

    var onNavClick = function(e) {
        var $this = $(e.currentTarget),
            val = $ownerSel.val(),
            idx;

        idx = repos.findIndex(function(repo) { return repo.owner + '/' + repo.name === val; });

        if($this.is('.prev') && (idx - 1 > -1)) $ownerSel.val(repos[idx - 1].owner + '/' + repos[idx - 1].name);
        if($this.is('.next') && (idx + 1 < repos.length)) $ownerSel.val(repos[idx + 1].owner + '/' + repos[idx + 1].name);

        handleOwnerChange();
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
        var status,
            reset = reset || false,
            $releases = $('input[name="releases"]'),
            $data = $('input[name="data"]'),
            $releasesDiv = $('<div class="col-sm-9"></div>'),
            $dataDiv = $('<div class="col-sm-9"></div>'),
            data = '',
            releases;

        $fields.find('input').each(function() {
            var $f = $(this),
                n = $f.attr('name'),
                val = repo[n];

            $f.removeClass('update');
            if($f.next('.input-group-addon')[0]) {
                $f
                    .addClass('col-sm-9')
                    .unwrap()
                    .next('.input-group-addon').remove();
            }

            if(val || reset) {

                val = $f.data('stringify') ? JSON.stringify(val) : val;
                val = $f.data('remove') ? val.replace(new RegExp($f.data('remove'),'g'),'') : val;

                if(!reset) {
                    $f.data('prev', $f.val());
                    if(val !== $f.val()) {
                        if($f.data('revertable')) addRevertBtn($f);
                        $f.addClass('update');
                    }
                 }
                $f.val(val);
            }
        });

        if(repo.releases && repo.releases.length > 0) {

            releases = '<ul>' +
                repo.releases.map(function(release) {
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
                $releases.next('ul').replaceWith(releases);
            }

        } else if($releases.hasClass('wrapped')) {
            $releases.removeClass('wrapped').addClass('col-sm-9').unwrap().next('ul').remove();
        }

        if(repo.data) {
            data = '<table class="table table-sm data">' +
                        '<thead>' +
                            '<th>week</th>' +
                            '<th>users</th>' +
                            '<th>stars</th>' +
                        '</thead>' +
                        '<tbody>';
            for(var d in repo.data) {
                if(repo.data.hasOwnProperty(d)) {
                    data += '<tr>' +
                                '<td>' + d + '</td>' +
                                '<td>' + repo.data[d].users + '</td>' +
                                '<td>' + repo.data[d].stars + '</td>' +
                            '</tr>';
                }
            }
            if(!$data.hasClass('wrapped')) {
                $data
                    .removeClass('col-sm-9')
                    .addClass('wrapped')
                    .wrap($dataDiv)
                    .after(data);
            } else {
                $data.closest('col-sm-9').find('table').replaceWith(data);
            }
        } else if($data.hasClass('wrapped')) {
            $data.removeClass('wrapped').addClass('col-sm-9').unwrap().next('table').remove();
        }

        status = $ownerSel.val() === 'new' ? 'Create' : 'Update';

        $repoForm.find('button[type="submit"]').text(status + ' ' + repo.owner + ' / ' + repo.name + ' JSON');
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
    $apiBtn.on('click', apiFetch);
    $repoForm.on('click', '.undo', revertField);
    $repoForm.on('click', '.reponav', onNavClick);
    $repoForm.on('submit', handleForm);
    $repoForm.on('reset', resetForm);

});
