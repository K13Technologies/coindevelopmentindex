function sortTable(f,n){
    var rows = $('#myTable tbody  tr').get();

    rows.sort(function(a, b) {

        var A = getVal(a);
        var B = getVal(b);

        if(A < B) {
            return -1*f;
        }
        if(A > B) {
            return 1*f;
        }
        return 0;
    });

    function getVal(elm){
        var v = $(elm).children('td').eq(n).text().toUpperCase();
        if($.isNumeric(v)){
            v = parseInt(v,10);
        }
        return v;
    }

    $.each(rows, function(index, row) {
        $('#myTable').children('tbody').append(row);
    });
}

var f_stars = 1;
var f_name = 1;
var f_team = 1;
var f_contributors = 1;
var f_repo = 1;
var f_update = 1;

$("#stars").click(function(){
    f_stars *= -1;
    var n = $(this).prevAll().length;
    sortTable(f_stars,n);
});
$("#name").click(function(){
    f_name *= -1;
    var n = $(this).prevAll().length;
    sortTable(f_name,n);
});
$("#team").click(function(){
    f_team *= -1;
    var n = $(this).prevAll().length;
    sortTable(f_team,n);
});
$("#contributors").click(function(){
    f_contributors *= -1;
    var n = $(this).prevAll().length;
    sortTable(f_contributors,n);
});
$("#repo").click(function(){
    f_repo *= -1;
    var n = $(this).prevAll().length;
    sortTable(f_repo,n);
});
$("#update").click(function(){
    f_update *= -1;
    var n = $(this).prevAll().length;
    sortTable(f_update,n);
});