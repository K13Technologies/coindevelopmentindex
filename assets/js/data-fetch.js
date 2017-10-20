jQuery.noConflict();
jQuery(document).ready(function($) {

    var handleForm = function(e) {

        console.log('ok');

        e.preventDefault();

        var token = $('#bearer').val(),
            json;

        $.get('/assets/json/data.json')
            .done(function(data) {

                json = data;//JSON.parse(data);

                $.post({
                      url: 'https://api.github.com/graphql',
                      data: JSON.stringify({ query: ' { \
                        repository(owner: "bitcoin", name: "bitcoin") { \
                                description \
                                createdAt \
                                pushedAt \
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
                        }' }),
                      headers: {
                        Authorization: "Bearer " + token
                      }
                    })
                    .done(function(response) {

                        json.data[0].pushedAt = response.data.repository.pushedAt;
                        json.data[0].stars = response.data.repository.stargazers.totalCount;
                        json.data[0].languages = response.data.repository.languages.edges.reduce(function(prev, curr) { prev.push(curr.node.name); return prev; }, []);

                        $('.output .container').html(json);


                    });
            });

    };

    $('.token-form form[name="token"]').on('submit', function(e) {
        e.preventDefault();
        handleForm();
    });

})(jQuery);