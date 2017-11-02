jQuery(document).ready(function($) {
    'use strict';

    var $ownerSel = $('#owner'),
        repos, query;

    $.ajax({
        url: '/assets/json/data.json',
        dataType: 'json'
    })
    .done(function(data) {
        repos = data;

        $ownerSel.html(repos.map(function(repo) {
            return '<option value="' + repo.owner + '/' + repo.name + '">' + repo.owner + ' / ' + repo.name + '</option>';
        }).join('\n'));
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

        $('#output #datajson').html('<pre>' + JSON.stringify(repo, null, 4) + '</pre>');
        $('#output #queryjson').html('<pre>' + query.replace(/\s{24}/g, '\n') + '</pre>');
    };

    var handleForm = function(e) {

        e.preventDefault();

        var token = $('#bearer').val(),
            repo = $('#owner').val().split(' / ').reduce(function(acc,cur,i){ if(i==0){pre.owner=cur}else{pre.name=cur}return pre}),
            json;

        $('#output #apijson').removeClass('alert alert-danger');

        $.post({
              url: 'https://api.github.com/graphql',
              data: JSON.stringify({ query: $('#output #queryjson').text() }),
              headers: {
                Authorization: "Bearer " + token
              }
            })
            .done(function(response) {
                $('#output #apijson').html('<pre>' + JSON.stringify(response, null, 4) + '</pre>');
            })
            .fail(function(err) {
                $('#output #apijson').addClass('alert alert-danger').html(err.responseJSON.message);
            })
            .always(function() {
                 $('#output #apijson').collapse('show');
            });
    };

    $('#bearer').focus();

    $ownerSel.on('change', handleOwnerChange);
    $('.token-form form[name="token"]').on('submit', handleForm);

});
