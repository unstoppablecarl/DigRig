ig.module(
    'game.map'
    )
.requires(
    'game.helpers.data',
    'impact.map'

    )
.defines(function(){
    // loads and processes a map layer from an image where each pixel is 1 map tile
    LoadMapLayer = function(mapLayer){
        var tempCanvas = document.createElement('canvas'),
            img = new ig.Image(mapLayer.tilesetName),
            width = img.width,
            height = img.height,
            ctx = tempCanvas.getContext('2d');

        tempCanvas.width = width;
        tempCanvas.height = height;

        ctx.drawImage(img.data, 0, 0);

        var imageData = ctx.getImageData(0, 0, width, height),
        pixels = imageData.data,
        dataMap = MultiDimensionalArray(height, width);


        for(var y = 0; y < height; y++) {
            // loop through each column
            for(var x = 0; x < width; x++) {
                var red = pixels[((width * y) + x) * 4],
                green = pixels[((width * y) + x) * 4 + 1],
                blue = pixels[((width * y) + x) * 4 + 2],
                alpha = pixels[((width * y) + x) * 4 + 3];

                if(alpha != 0){
//                if(red == 255 && blue == 255 && green == 255){
                    dataMap[y][x] = 1;
                }
            }
        }
        mapLayer.tilesize = 2;
        mapLayer.data= dataMap;
        mapLayer.width = width;
        mapLayer.height = height;
        return mapLayer;

    };


    ig.Map.inject({
        // reduces a collision or other binary tile map to a lower resolution "chunked" map
        getReducedMap:function(chunkSize){
            var width = Math.floor(this.width / chunkSize),
                height = Math.floor(this.height / chunkSize),
                tileSize = this.tilesize,
                chunks = MultiDimensionalArray(height, width);

            for( var cy = 0; cy < height; cy++) {
                for( var cx = 0; cx < width; cx++ ) {
                    var minTileX = cx * chunkSize,
                        minTileY = cy * chunkSize;
                    loopX: for( var y = minTileY; y < minTileY + chunkSize; y++) {
                        loopY: for( var x = minTileX; x < minTileX + chunkSize; x++ ) {
                            if(this.data[y][x] != 0){
                                chunks[cy][cx] = 1;
                                break loopX;
                            }
                        }
                    }
                }
            }
            return {
                data: chunks,
                width: width,
                height: height,
                chunkSize: chunkSize,
                chunkSizePx: chunkSize * tileSize
            }
        },
        // checks the value of a tile or false if it does not exist
        checkTile: function(x,y){

            if(
            (x >= 0 && x < this.width) &&
            (y >= 0 && y < this.height)
            ) {
                return this.data[y][x];
            }
            else {
                return false;
            }
        },
        // draw the entire map layer
        drawFull: function(context, color) {
            color = color || ig.game.removeColor;
            var ctx = context = context || ig.system.context,
                scale = ig.system.scale,
                tileWidthScaled = Math.floor(this.tilesize),
                tileHeightScaled = Math.floor(this.tilesize),
                tile;
            ctx.save();
            ctx.scale(scale, scale);
            for( var y = 0; y < this.height; y++) {
                for( var x = 0; x < this.width; x++ ) {

                    var pxX = Math.floor((x) * this.tilesize),
                        pxY = Math.floor((y) * this.tilesize);
                    if( (tile = this.data[y][x]) ) {
                        ctx.fillStyle = color;
                        ctx.fillRect(pxX, pxY,tileWidthScaled, tileHeightScaled);
                    }
                } // end for x
            } // end for y
            ctx.restore();
        }

    });

});