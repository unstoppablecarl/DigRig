


$(function(){


    $('#level-list a').click(function(e){
        e.preventDefault();
        var $this = $(this);
        ig.gameLoader.load($this.data('levelName'));
    });

});
