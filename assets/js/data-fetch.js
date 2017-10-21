jQuery(document).ready(function($) {

    var handleForm = function(e) {

        e.preventDefault();

        var token = $('#bearer').val(),
            owner = $('#owner').val(),
            repo = $('#repo').val(),
            query = ' { \
                        repository(owner: "' + owner + '", name: "' + repo + '") { \
                                description \
                                createdAt \
                                homepageUrl \
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
                        }',
            json;

        // $.get('/assets/json/data.json')
        //     .done(function(data) {

        //         json = data; //JSON.parse(data);

        // reset output warning
        $('.output .container').removeClass('alert alert-danger');

        $.post({
              url: 'https://api.github.com/graphql',
              data: JSON.stringify({ query: query}),
              headers: {
                Authorization: "Bearer " + token
              }
            })
            .done(function(response) {

                // json.data[0].pushedAt = response.data.repository.pushedAt;
                // json.data[0].stars = response.data.repository.stargazers.totalCount;
                // json.data[0].languages = response.data.repository.languages.edges.reduce(function(prev, curr) { prev.push(curr.node.name); return prev; }, []);

                $('.output .container').html('<pre><b>QUERY:</b> \n' + query.replace(/\s{24}/g, '\n') + '\n\n\n<b>RESPONSE:</b> \n' + JSON.stringify(response, null, 4) + '</pre>');


            })
            .fail(function(err) {
                // console.log(err);
                $('.output .container').addClass('alert alert-danger').html(err.responseJSON.message);
            });
            // });

    };

    $('#bearer').focus();

    $('.token-form form[name="token"]').on('submit', handleForm);

});