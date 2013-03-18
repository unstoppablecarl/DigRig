ig.module(
    'game.helpers.data'
    )

.defines(function(){

   MultiDimensionalArray = function (iRows,iCols, defaultValue) {
        var i, j, a = new Array(iRows), defaultValue = defaultValue || 0;
        for (i=0; i < iRows; i++) {
            a[i] = new Array(iCols);
            for (j=0; j < iCols; j++) {
                a[i][j] = defaultValue;
            }
        }
        return(a);
    };
});