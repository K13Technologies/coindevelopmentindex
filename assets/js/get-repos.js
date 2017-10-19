(function($) {

    var token = '6afe5c8b7e1ae6ac7e5e1ef20ee6c0f39c0af8c2',
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
                .done(function(data) {

                    json.data[0].pushedAt = data.repository.pushedAt;
                    json.data[0].stars = data.repository.stargazers.totalCount;
                    json.data[0].languages = data.repository.languages.edges.reduce(function(prev, curr) { return prev.push(curr.name); }, []);

                    console.log(json);


                });
        });

})(jQuery);