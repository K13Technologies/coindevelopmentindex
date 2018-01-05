jQuery(document).ready(function($) {
    'use strict';

    if(!$('.token-form form[name="token"]')[0]) return false;

    var $tokenForm = $('.token-form form[name="token"]'),
        $ownerSel = $('#owner'),
        $output = $('#output'),
        repos, query;

    Coins.init(function() {

        repos = Coins.list();

        $ownerSel.html(repos.map(function(repo) {
            return '<option value="' + repo.owner + '/' + repo.name + '">' + repo.owner + ' / ' + repo.name + '</option>';
        }).join('\n'));

        $ownerSel.prepend('<option selected>Select a repo...</option>');
    });

    var handleOwnerChange = function(e) {

        var repo = repos.find(function(repo) {
            var arr = $ownerSel.val().split('/');
            return repo.owner === arr[0] && repo.name === arr[1];
        });

        query = ' { \
                        repository(owner: "' + repo.owner + '", name: "' + repo.name + '") { \
                            description \
                            createdAt \
                            url \
                            homepageUrl \
                            pushedAt \
                            releases (last: 3) { \ \
                              edges { \
                                node { \
                                  name \
                                  description \
                                  publishedAt \
                                } \
                              } \
                            } \
                            mentionableUsers { \
                                totalCount \
                            } \
                            forks { \
                                totalCount \
                            } \
                            stargazers { \
                                totalCount \
                            } \
                            languages (first: 3, orderBy: { field: SIZE, direction: DESC }) { \
                                edges { \
                                    node { \
                                        name \
                                    } \
                                } \
                            } \
                        } \
                        rateLimit { \
                            cost \
                            remaining \
                          } \
                        }';

        $('#datajson').html('<pre>' + JSON.stringify(repo, null, 4) + '</pre>');
        $('#queryjson').html('<pre>' + query.replace(/\s{24}/g, '\n') + '</pre>');
    };

    var handleForm = function(e) {

        e.preventDefault();

        var token = $('#bearer').val(),
            repo = $('#owner').val().split(' / ').reduce(function(acc,cur,i){ if(i==0){pre.owner=cur}else{pre.name=cur}return pre}),
            json;

        $output.removeClass('alert alert-danger');

        $.post({
              url: 'https://api.github.com/graphql',
              data: JSON.stringify({ query: $('#output #queryjson').text() }),
              headers: {
                Authorization: "Bearer " + token
              }
            })
            .done(function(response) {
                $('#apijson').html('<pre>' + JSON.stringify(response, null, 4) + '</pre>');
            })
            .fail(function(err) {
                $output.addClass('alert alert-danger').html(err.responseJSON.message);
            })
            .always(function() {
                 $('#apijson').collapse('show');
            });
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

    $('#bearer').focus();

    $ownerSel.on('change', handleOwnerChange);
    $tokenForm.on('submit', handleForm);
    $output.on('click', hideAlert);

});
