ig.module(
    'game.main'
    )
.requires(
    'impact.impact',
    'impact.game',
    'impact.debug.debug',

    'game.map',

    'game.entities.player',
    'game.entities.exit',

    'game.classes.enemy',

    'game.entities.enemy-dig',
    'game.entities.enemy-tunnel',
    'game.entities.crate',

    'game.classes.game-loader',
    'game.classes.notification',

//    'plugins.lodash',
    'plugins.layers',
    'plugins.screenshaker',
    'plugins.astar-for-entities'
//    'plugins.astar-for-entities-debug'
    )
.defines(function(){

    DigRig = ig.Game.extend({
        gravity: 100, // All entities are affected by this

        font: new ig.Font( 'media/fonts/04b03.png' ),
        clearColor: '#1b2026',
        debugDraw: [],
        // array of tiles {x:1,y:1} to be destroyed
        _deferredDestroyTile: [],
        // array of tiles {x:1,y:1} to be created
        _deferredCreateTile: [],

        // only update chunked maps when the terrain changes
        // set to true so chunks will be generated on init
        collisionMapChanged: true,

        // map of fixed colision tiles (cannot be destroyed)
        fixedMap: null,

        chunkedMaps: {
            fixed: {
                data: null,
                width: 0,
                height: 0,
                // number of tiles per chunk
                chunkSize: 5,
                // px size of a chunk
                chunkSizePx: 0
            },
            collision: {
                data: null,
                width: 0,
                height: 0,
                // number of tiles per chunk
                chunkSize: 5,
                // px size of a chunk
                chunkSizePx: 0
            },
        },
        // easier access tileSize
        tileSize: null,

        // screen shaker plugin
        screenShake: null,
        screenShaker: null,

        patternImg: new ig.Image('media/patterns.png'),
        patterns: [],

        // level to be loaded
        levelToLoad: null,
        init: function() {

            this.initCamera();
            this.initCore();

            // don't start entities until map data is ready
            this.layers.entities.noUpdate = true;
            this.layers.entities.noDraw = true;

            this.initKeys();
            this.initPatterns();
            this.loadLevel(ig.gameLoader.levelClass);
            this.initDynamicBackground();
            this.initTileEffects();
            this.initParticles();
            this.initGui();
            this.initNotifications();
            this.initDebug();
//            this.initChunkDebug('collision');

            this.layerOrder =["backgroundMaps","backgroundCalculations", "tileEffects", "entities", 'particles', "foregroundMaps", 'gui', 'notifications', 'debug', 'camera'];
                // map layers are ready
            this.layers.entities.noUpdate = false;
            this.layers.entities.noDraw = false;

        },

        initPatterns:function(){
            var tileCount = 2,
                tileSize = 32;

            for(var i = 0; i < tileCount; i++) {
                var patternCanvas = document.createElement('canvas'),
                    ctx = patternCanvas.getContext('2d');

                patternCanvas.width = tileSize;
                patternCanvas.height = tileSize;
                this.patternImg.drawTileCustom( 0, 0, i, tileSize, tileSize, 0, 0, ctx, 1);
                this.patterns.push(patternCanvas);
            }

            // apparently when creating a pattern to be used latter it doesn't matter if it is drawn to a different context than the one used when it was created
            this.removableColor = ig.system.context.createPattern(this.patterns[0], 'repeat');
            this.fixedColor = ig.system.context.createPattern(this.patterns[1], 'repeat');
        },
        initCamera:function(){
            this.screenShaker = new ScreenShaker();
            this.createLayer('camera', {
                noDraw: true
            });
            this.addItem({
                _layer: 'camera',
                update: (function(){
                    // center on player
                    if(ig.game.player) {
                        this.screen.x = (ig.game.player.pos.x + ig.game.player.size.x/2).round() - ig.system.width/2;
                        this.screen.y = (ig.game.player.pos.y + ig.game.player.size.y/2).round() - ig.system.height/2;
                    }
                    this.screenShaker.update();
                    this.screenShaker.shakeScreen(this.screen);
                }).bind(this)
            });
        },
        initCore:function(){

            // Creating default layers
            this.createLayer('backgroundMaps', {
                clearOnLoad: true,
                mapLayer: true
            });

            this.createLayer('entities', {
                clearOnLoad: true,
                entityLayer: true,
                autoSort : this.autoSort,
                sortBy   : this.sortBy,
                _doSortEntities: false
            });

            this.createLayer('foregroundMaps', {
                clearOnLoad: true,
                mapLayer: true
            });
        },
        initKeys:function(){

            // Bind keys
            ig.input.bind( ig.KEY.LEFT_ARROW, 'left' );
            ig.input.bind( ig.KEY.A, 'left' );

            ig.input.bind( ig.KEY.RIGHT_ARROW, 'right' );
            ig.input.bind( ig.KEY.D, 'right' );

            ig.input.bind( ig.KEY.W, 'jump' );
            ig.input.bind( ig.KEY.UP_ARROW, 'jump' );
            ig.input.bind( ig.KEY.SPACE, 'jump' );

            ig.input.bind( ig.KEY.Z, 'debug' );


            ig.input.bind( ig.KEY.MOUSE1, 'leftButton' );
            ig.input.bind( ig.KEY.MOUSE2, 'rightButton' );
        },
        initDynamicBackground:function(){
            this.chunkedMaps.fixed = this.fixedMap.getReducedMap(this.chunkedMaps.fixed.chunkSize);
            this.chunkedMaps.collision = this.collisionMap.getReducedMap(this.chunkedMaps.collision.chunkSize);

            this.createLayer('backgroundCalculations');
            this.addItem({
                _layer: 'backgroundCalculations',
                update: (function(){

                    var collisionMap = ig.game.collisionMap,
                        tileSize = this.tileSize,
                        ctx = ig.game.bgContext,
                        x, y, tile;


                    for(var i = 0, l = this._deferredDestroyTile.length; i < l; i++){

                        tile = this._deferredDestroyTile[i];
                        collisionMap.data[tile.y][tile.x] = 0;

                        x = tileSize * tile.x * ig.system.scale;
                        y = tileSize * tile.y * ig.system.scale;
                        ctx.save();

                        ctx.clearRect(x,y, tileSize * ig.system.scale, tileSize * ig.system.scale);
                        ctx.restore();
                        this.collisionMapChanged = true;
                    }
                    this._deferredDestroyTile = [];

                    for(i = 0, l = this._deferredCreateTile.length; i < l; i++){

                        tile = this._deferredCreateTile[i];
                        collisionMap.data[tile.y][tile.x] = 1;

                        x = tileSize * tile.x * ig.system.scale;
                        y = tileSize * tile.y * ig.system.scale;
                        ctx.save();
                        ctx.fillStyle = this.removableColor;
                        ctx.fillRect(x,y, tileSize * ig.system.scale, tileSize * ig.system.scale);
                        this.collisionMapChanged = true;
                        ctx.restore();
                    }
                    this._deferredCreateTile = [];

                    if(this.chunkedMaps.collision){
                        this.chunkedMaps.collision = this.collisionMap.getReducedMap(this.chunkedMaps.collision.chunkSize);
                    }
                }).bind(this),

                draw: (function(){
                    // copy removable bg from bgCanvas
                    ig.system.context.drawImage(
                        ig.game.bgCanvas,
                        0,
                        0,
                        ig.game.bgCanvas.width,
                        ig.game.bgCanvas.height,
                        -ig.game.screen.x * ig.system.scale,
                        -ig.game.screen.y * ig.system.scale,
                        ig.game.bgCanvas.width ,
                        ig.game.bgCanvas.height
                    );
                }).bind(this)
            });

        },
        initTileEffects:function(){

            this.createLayer('tileEffects', {
                noUpdate:true,
                beforeDraw: function(){
                    ig.system.context.save();
                    ig.system.context.beginPath();
                },
                afterDraw:function(){
                    ig.system.context.restore();
                }
            });

        },
        initParticles:function(){
            this.createLayer('particles', {
                clearOnLoad: true,
                entityLayer: true,
                autoSort : this.autoSort,
                sortBy   : this.sortBy,
                _doSortEntities: false,
                beforeDraw: function(){
                    ig.system.context.save();
                    ig.system.context.beginPath();
                },
                afterDraw:function(){
                    ig.system.context.restore();
                }
            });

        },
        initGui:function(){

            this.createLayer('gui', {
                noUpdate:true
            });

            // add material bar
            this.addItem({
                _layer: 'gui',
                width: 10,
                height: 400,
                chargeBar: {
                    width: 6
                },
                leftOffset: 20,
                barColor: 'rgba(255,255,255,1)',
                frameOffset: 1,
                lineWidth: 1,
                frameColor: '#808080',
                startColor: {
                    r: 255,
                    g: 255,
                    b: 255,
                    a: 1
                },
                endColor: {
                    r: 255,
                    g: 0,
                    b: 0,
                    a: 1
                },
                draw:function(){
                    var ctx = ig.system.context,
                        barHeight = (ig.game.player.material / ig.game.player.materialMax) * this.height,
                        x = this.leftOffset,
                        y = ((ig.system.height - this.height) /2) + this.height - barHeight,
                        barWidth = this.width,
                        frameWidth = this.width + (this.frameOffset + this.lineWidth) *2 -1,
                        frameHeight = this.height + (this.frameOffset + this.lineWidth) *2 -1,
                        frameX = x - this.frameOffset - 0.5,
                        frameY = ((ig.system.height - this.height) /2) - this.frameOffset - 0.5;

                    ctx.save();
                    ctx.fillStyle = this.barColor;
                    ctx.fillRect(x,y,barWidth,barHeight);
                    ctx.lineWidth = this.lineWidth;
                    ctx.strokeStyle = this.frameColor;
                    ctx.strokeRect(frameX, frameY, frameWidth, frameHeight);
                    ctx.restore();


                    if(ig.game.player){
                        ig.game.font.draw( 'Material: ' + ig.game.player.material, 5, frameY + frameHeight + 5 );
                        ig.game.font.draw( 'Charge: ' + ig.game.player.charge, 5, frameY + frameHeight + 15 );
                    }
                    var player = ig.game.player;

                    var min, max, chargePercent, cw, cHeightMax, ch, cx, cy, fillStyle;
                   if(player.chargeType === 'create'){
                        min = 0;
                        max = player.material;
                        chargePercent = (player.charge).map(min,max,0,1);
                        cw = this.chargeBar.width;
                        cHeightMax = barHeight;
                        ch = chargePercent * cHeightMax;
                        cx = x + (this.width - this.chargeBar.width)/2;
                        cy = y + barHeight - ch - (barHeight - ch);
                        fillStyle = 'rgba(0,70,255,1)';
                    }
                    else if (player.chargeType === 'destroy'){
                        min = 0;
                        max = player.materialMax - player.material;
                        cHeightMax = this.height - barHeight;
                        chargePercent = (player.charge).map(min,max,0,1);
                        cw = this.chargeBar.width;
                        ch = chargePercent * cHeightMax;
                        cx = x + (this.width - this.chargeBar.width)/2;
                        cy = y - ch;
                        fillStyle = 'rgba(255,0,70,1)';
                    }
                    else {
                        return;
                    }


                    ctx.save();
                    ctx.fillStyle = fillStyle;
                    ctx.fillRect(cx,cy,cw,ch);
                    ctx.restore();

                }
            });

            // add health bar
            this.addItem({
                _layer: 'gui',
                width: 100,
                height: 6,

                leftOffset: 120,
                bottomOffset: 30,
                barColor: 'rgba(255,0,0,1)',
                frameOffset: 1,
                lineWidth: 1,
                frameColor: '#fff',
                startColor: {
                    r: 255,
                    g: 255,
                    b: 255,
                    a: 1
                },
                endColor: {
                    r: 255,
                    g: 0,
                    b: 0,
                    a: 1
                },
                draw:function(){
                    var ctx = ig.system.context,
                        barWidth = (ig.game.player.health / ig.game.player.healthMax) * this.width,
                        x = this.leftOffset,
                        y = ((ig.system.height - this.height)) - this.bottomOffset,
                        barHeight = this.height,
                        frameWidth = this.width + (this.frameOffset + this.lineWidth) *2 -1,
                        frameHeight = this.height + (this.frameOffset + this.lineWidth) *2 -1,
                        frameX = x - this.frameOffset - 0.5,
                        frameY = y - this.frameOffset - 0.5;

                    ctx.save();
                    ctx.fillStyle = this.barColor;
                    ctx.fillRect(x,y,barWidth,barHeight);
                    ctx.lineWidth = this.lineWidth;
                    ctx.strokeStyle = this.frameColor;
                    ctx.strokeRect(frameX, frameY, frameWidth, frameHeight);
                    ctx.restore();

                    var message = 'HP',
                        width = ig.game.font.widthForString(message);
                        x = x - width - 10;
                        y = y;
                    ig.game.font.draw( message, x, y);
                }
            });




        },
        initDebug:function(){
            this.createLayer('debug', {
                noUpdate:true
            });

            this.addItem({
                _layer: 'debug',
                draw: (function(){
                    for(var i = 0, l = this.debugDraw.length; i < l; i++){
                        var func = this.debugDraw[i];
                        // call the debug function, if it returns false remove it
                        if(func && func() === false){
                            this.debugDraw.splice(i,1);
                        }
                    }
                }).bind(this)
            });


        },
        initChunkDebug:function(mapName){

            this.addItem({
                _layer: 'debug',
                draw: (function(){
                    var ctx = ig.system.context,
                        map = this.getChunkedMap(mapName),
                        width = map.width,
                        height = map.height,
                        tileSize = this.tileSize,
                        chunkSize = map.chunkSize;

                    if(!map || !map.data) return;
                    ctx.save();
                    ctx.strokeStyle = 'black';
                    ctx.lineWidth = 0.5;
                    for( var y = 0; y < height; y++) {
                        for( var x = 0; x < width; x++ ) {

                            var t = map.data[y][x];
                            if(t === 1){
                                ctx.fillStyle = 'rgba(255,0,0,.1)';
                                ctx.fillRect(
                                    (x * tileSize * chunkSize) - ig.game.screen.x,
                                    (y * tileSize * chunkSize) - ig.game.screen.y,
                                    chunkSize * tileSize,
                                    chunkSize * tileSize
                                );
                            }

//                            ctx.strokeRect(
//                                    (x * tileSize * chunkSize) - ig.game.screen.x,
//                                    (y * tileSize * chunkSize) - ig.game.screen.y,
//                                    chunkSize * tileSize,
//                                    chunkSize * tileSize
//                                )
                        }
                    }

                    ctx.restore();

                }).bind(this)
            });
        },
        initNotifications:function(){
            this.createLayer('notifications', {
                noUpdate:true
            });
        },
        levelComplete: function(){
            this.createLayer('levelComplete', {
                noUpdate:true
            });
            this.addItem({
                _layer: 'levelComplete',
                draw: (function(){
                    this.font.draw('Level Complete!', ig.system.width/2, ig.system.height/2,ig.Font.ALIGN.CENTER);
                }).bind(this)
            });
            this.layerOrder = ['levelComplete'];
        },
        loadLevel:function(level){

            // load collision and fixed layers from images
            for(i = 0; i < level.layer.length; i++) {
                if(level.layer[i].name === '_collision'){
                    level.layer[i].name = 'collision';
                }
                if(
                    level.layer[i].name === 'collision' || level.layer[i].name === 'fixed'
                ){
                    level.layer[i] = LoadMapLayer(level.layer[i]);
                }

            }

            this.parent(level);

            this.tileSize = this.collisionMap.tilesize;
            this.fixedMap = this.getMapByName('fixed');
            // fixed map should not render
            this.fixedMap.enabled = false;

            this.player = this.getEntitiesByType( EntityPlayer )[0];

            this.bgCanvas = document.createElement('canvas');

            this.bgCanvas.width = this.tileSize * this.collisionMap.width * ig.system.scale;
            this.bgCanvas.height = this.tileSize * this.collisionMap.height * ig.system.scale;
            this.bgContext = this.bgCanvas.getContext('2d');

            // draw the full bg to the bgCanvas
            this.collisionMap.drawFull(this.bgContext, this.removableColor);
            this.fixedMap.drawFull(this.bgContext, this.fixedColor);
        },
        getChunkedMap: function(map){
            return this.chunkedMaps[map];
        }
    });
//
//if(ig.global.wm){
//    // render entity at 50% in weltmeister to match bg scale
//    ig.Entity.inject({
//        init:function(x,y,settings){
//            this.size.x = this.size.x/2;
//            this.size.y = this.size.y/2;
//            this.offset.x = this.offset.x/2;
//            this.offset.y = this.offset.y/2;
//        },
//        draw:function(){
//            var ctx = ig.system.context;
//            ctx.save();
//            ctx.translate(
//                ig.system.getDrawPos( (this.pos.x - this.offset.x) - ig.game.screen.x),
//                ig.system.getDrawPos( (this.pos.y - this.offset.y) - ig.game.screen.y)
//            );
//            ctx.scale(0.5, 0.5);
//            this.currentAnim.draw( 0, 0 );
//            ctx.restore();
//            return;
//        }
//    });
// }
//

ig.Image.inject({
    drawTileCustom: function( targetX, targetY, tile, tileWidth, tileHeight, flipX, flipY, context, scale) {
		tileHeight = tileHeight ? tileHeight : tileWidth;
        context = context || ig.system.context;
        scale = scale || ig.system.scale;

		if( !this.loaded || tileWidth > this.width || tileHeight > this.height ) { return; }

		var tileWidthScaled = Math.floor(tileWidth * scale);
		var tileHeightScaled = Math.floor(tileHeight * scale);

		var scaleX = flipX ? -1 : 1;
		var scaleY = flipY ? -1 : 1;

		if( flipX || flipY ) {
			context.save();
			context.scale( scaleX, scaleY );
		}
		context.drawImage(
			this.data,
			( Math.floor(tile * tileWidth) % this.width ) * scale,
			( Math.floor(tile * tileWidth / this.width) * tileHeight ) * scale,
			tileWidthScaled,
			tileHeightScaled,
			targetX * scaleX - (flipX ? tileWidthScaled : 0),
			targetY * scaleY - (flipY ? tileHeightScaled : 0),
			tileWidthScaled,
			tileHeightScaled
		);
		if( flipX || flipY ) {
			context.restore();
		}

		ig.Image.drawCount++;
	}
});





//ig.main('#canvas', DigRig, 60, 800, 600, 1);
ig.gameLoader = new GameLoader({
    canvasId: '#canvas',
    gameClass: DigRig,
    width: 800,
    height: 600,
    scale: 1,
});
ig.gameLoader.load();

});
