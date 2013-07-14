ig.module(
    'game.entities.projectile'
)
.requires(
    'impact.entity',
    'game.classes.tile-effect',
    'game.entities.particle'
)
.defines(function(){

    EntityProjectile = ig.Entity.extend({
        /**
         * CONFIG variables
         */
        name: 'projectile',
        size: {
            x: 1,
            y: 1
        },
        type: ig.Entity.TYPE.A,
        checkAgainst: ig.Entity.TYPE.B,
//        collides: ig.Entity.COLLIDES.FIXED,
        gravityFactor: 0,
        // intial projectile movement speed, should not change once set in init()
        initialVelocity : 10,
        // inital value of this.tileRadius
        initialTileRadius: null,

        // the min tile radius of the projectile
        minTileRadius: 2,
        // 'create' or 'destroy'
        mode: 'destroy',

        // maximum number of tiles this projectile should destroy or create, depending on mode
        tilesToModify: 200,
        // interval between expansions when projectile is expanding
        expandInterval: 0.01,
        // amount radius is increased per expandInterval
        expandAmount: 1,
        tileDestroyColor: '255,0,70',
        tileCreateColor: '0,70,255',
        angleCos: null,
        angleSin: null,
        createdBy: null,
        drawProjectile: true,

        /**
         * STATE variables
         */
        // radius of projectile in bg tiles
        tileRadius: 10,
        // tiles this projectile has modified since projectile creation
        tilesModified: 0,
        // if collision has started when in create mode ( projectile is expanding )
        expanding: false,
        expandTimer: null,
        init: function( x, y, settings ) {

            // set tile radius so that the area matches the charge ( use only 90% to account for rounding )
            if(!settings.tileRadius){
                settings.tileRadius = Math.sqrt(settings.tilesToModify / Math.PI) * .9;
            }

            this.parent( x, y, settings );

            this.expandAmount = ig.game.tileSize/2;

            this.angleCos = Math.cos(this.angle);
            this.angleSin = Math.sin(this.angle);

            this.vel.x = this.angleCos * this.initialVelocity;
            this.vel.y = this.angleSin * this.initialVelocity;

            this.initialTileRadius = this.tileRadius;
            this.expandTimer = new ig.Timer(this.expandInterval);
            this.updateRadius();

        },
        handleMovementTrace: function(res) {

            // if in create mode, and not already collided/expanding yet, and collided with collision map tile
            // initial collision of create mode projectile
            if(this.mode == 'create' && !this.expanding && (res.collision.x || res.collision.y)){

                // stop
                this.vel.x = 0;
                this.vel.y = 0;

                // center on collision coord
                this.pos.x = res.pos.x - this.size.x/2;
                this.pos.y = res.pos.y - this.size.y/2;

                // start expanding
                this.expanding = true;
                this.expandTimer.reset();
            }

            // move normally ignoring collisions
            this.pos.x += this.vel.x;
            this.pos.y += this.vel.y;

        },
        update:function(){
            // never standing
            this.standing = false;

            // destroy if out of map bounds
            if(
                this.pos.x < -this.size.x
                ||
                this.pos.x > ig.game.collisionMap.width * ig.game.tileSize + this.size.x
                ||
                this.pos.y < -this.size.y
                ||
                this.pos.y > ig.game.collisionMap.height * ig.game.tileSize + this.size.y
            ){
                this.kill();
                return;
            }

            // prevent overages in material increase / decrease
            if(this.tilesModified >= this.tilesToModify){
                this.kill();
                return;
            }

            // expand radius when expandTimer is complete
            if(this.expanding && this.expandTimer.delta() > 0){
                this.updateRadius(this.tileRadius + this.expandAmount);
                this.expandTimer.reset();
                if(this.mode == 'create') {
                    this.createTiles(this.getTilesWithinRadius());
                }

            }

            if(this.mode == 'destroy'){
                this.destroyTiles(this.getTilesWithinRadius());

                var tilesLeftToModify = this.tilesToModify - this.tilesModified,
                    lifespanPercent = (tilesLeftToModify / this.tilesToModify ),
                    // decay velocity with Circular.EaseOut function
                    lifespanEase = Math.sqrt(1 - (--lifespanPercent * lifespanPercent)),
                    velocityDecay = lifespanEase * this.initialVelocity;

                // decay velocity with easing function
                this.vel.x = this.angleCos * (velocityDecay);
                this.vel.y = this.angleSin * (velocityDecay);
                // reduce size proportional to tiles destroyed
//              var newTileRadius = (lifespanPercent * this.initialTileRadius);
//                this.updateRadius(newTileRadius);

            }

            this.parent();

        },
        draw :function(){
            // keep this.parent() for debug draw
            this.parent();

            if(!this.drawProjectile) return;

            var tileSize = ig.game.tileSize * ig.system.scale,
                x = ((this.pos.x + this.size.x/2) - ig.game.screen.x) * ig.system.scale,
                y = ((this.pos.y + this.size.y/2) - ig.game.screen.y) * ig.system.scale,
                ctx = ig.system.context,
                innerRadius = this.tileRadius,
                arcRadius = tileSize * this.tileRadius,
                outx = x,
                outy = y,
                inx = x,
                iny = y,
                radgrad;

            radgrad = ig.system.context.createRadialGradient(outx, outy, innerRadius, inx, iny, arcRadius);

            ctx.save();
            ctx.beginPath();
            ctx.arc(x, y, arcRadius, 0 , 2 * Math.PI, false);
            if(this.mode == 'destroy'){
                radgrad.addColorStop(0.5, 'rgba(255,255,255,1)');
                radgrad.addColorStop(0.6, 'rgba(255,150,150,.8)');
                radgrad.addColorStop(1, 'rgba(255,0,0,0)');
            } else if(this.mode == 'create') {
                radgrad = 'rgba(255,255,255,.2)';
            }
            ctx.fillStyle = radgrad;
            ctx.fill();
            ctx.closePath();
            ctx.restore();

        },
        getTilesWithinRadius:function(radius){
            radius = radius || this.tileRadius;
            //get tiles within radius
            var tileSize = ig.game.tileSize,
                cX = this.pos.x + this.size.x/2,
                cY = this.pos.y + this.size.y/2,
                centerX = Math.round( cX / tileSize ),
                centerY = Math.round( cY / tileSize ),
                minX = centerX - Math.round(radius),
                minY = centerY - Math.round(radius),
                maxX = centerX + Math.round(radius),
                maxY = centerY + Math.round(radius),
                tilesWithinRadius = [];

            for (var x = minX; x <= maxX; x++){
                for (var y = minY; y <= maxY; y++){
                    var xd = centerX - x,
                        yd = centerY - y,
                        distance = Math.round(Math.sqrt( xd*xd + yd*yd ));

                    if(distance <= radius){
                        tilesWithinRadius.push({x: x, y: y});
                    }
                }
            }
            return tilesWithinRadius;
        },
        _reduceArrayRandomly: function(array, newArrayLength){
            // should probably be copying, but NOT currently nessisary
            // comment for performance
//            array = ig.copy(array);
            var remainingItems = [];
            for(var i = 0; i < newArrayLength; i++){
                var index = Math.floor(Math.random() * array.length);
                // remove selected array item so it cannot be selected again
                remainingItems.push(array[index]);
                array.splice(index, 1);
            }

            return remainingItems;
        },
        destroyTiles:function(tiles){
            var tile,
                removeableTilesWithinRadius = [],
                tilesLeftToDestroy = this.tilesToModify - this.tilesModified;

            // limit to valid tiles within radius
            for(var i = 0, len = tiles.length; i < len; i++){
                var t = tiles[i];

                // only remove collision tiles, that are not fixedTiles
                var isCollisionTile = ig.game.collisionMap.checkTile(t.x, t.y),
                    isFixedTile =  ig.game.fixedMap.checkTile(t.x, t.y);
                if(isCollisionTile !== false && isCollisionTile != 0 && isFixedTile == 0){
                    tile = t;
                } else {
                    continue;
                }
                removeableTilesWithinRadius.push(tile);
            }
            // randomly select tiles if we don't have enough left to destroy them all
            if(removeableTilesWithinRadius.length > tilesLeftToDestroy){
                removeableTilesWithinRadius = this._reduceArrayRandomly(removeableTilesWithinRadius, tilesLeftToDestroy);
            }

            for(var i = 0, len = removeableTilesWithinRadius.length; i < len; i++){
                if(this.createdBy == ig.game.player){

                    if(ig.game.player.material >= ig.game.player.materialMax){
                        this.kill();
                        return;
                    }
                }

                this.createdBy.material++;

                var tile = removeableTilesWithinRadius[i];
                // randomly spawn particles
//                if(Math.random() < .05){
//                    ig.game.spawnEntity(EntityParticle, tile.x * ig.game.tileSize, tile.y * ig.game.tileSize);
//                }

                ig.game._deferredDestroyTile.push(tile);
                this.tilesModified++;
            }

            // queue pixel animation effects
            if(removeableTilesWithinRadius.length){
                ig.game.addItem(new TileEffect(removeableTilesWithinRadius, this.tileDestroyColor));
            }
        },
        createTiles:function(tiles){
            var tile,
                creatableTilesWithinRadius = [],
                tilesLeftToCreate = this.tilesToModify - this.tilesModified;

            // limit to valid tiles within radius
            for(var i = 0; i < tiles.length; i++){
                var t = tiles[i];

                // only remove active collision tiles
                var tileResult = ig.game.collisionMap.checkTile(t.x, t.y);
                if(tileResult !== false && tileResult === 0){
                    tile = t;
                } else {
                    continue;
                }

                creatableTilesWithinRadius.push(tile);
            }

            // randomly select tiles if we don't have enough left to destroy them all
            if(creatableTilesWithinRadius.length > tilesLeftToCreate){
                creatableTilesWithinRadius = this._reduceArrayRandomly(creatableTilesWithinRadius, tilesLeftToCreate);
            }

            for(var i = 0, len = creatableTilesWithinRadius.length; i < len; i++){
                var tile = creatableTilesWithinRadius[i];

                ig.game._deferredCreateTile.push(tile);

                this.tilesModified++;
            }
            // queue pixel animation effects
            if(creatableTilesWithinRadius.length){
                ig.game.addItem(new TileEffect(creatableTilesWithinRadius, this.tileCreateColor));
            }
        },
        updateRadius: function(radius){
            radius = radius || this.tileRadius;

            if(radius < this.minTileRadius){
                radius = this.minTileRadius;
            }
            var centerX = this.pos.x + this.size.x/2,
                centerY = this.pos.y + this.size.y/2;

            this.tileRadius = radius;

            this.size.x = this.tileRadius * 2 * ig.game.tileSize;
            this.size.y = this.tileRadius * 2 * ig.game.tileSize;

            this.pos.x = centerX - this.size.x/2;
            this.pos.y = centerY - this.size.y/2;
        },
        check : function(other){

            if(this.createdBy == ig.game.player && this.mode == 'destroy'){
                if(this.distanceTo(other) - other.projectileCollideRadius <= this.tileRadius * ig.game.tileSize){
                    other.receiveStunDamage(this.tilesToModify, this);
                }
            }

            // if colliding with an enemy and in create mode, start expanding
            if(this.mode == 'create' && !this.expanding){

                // stop
                this.vel.x = 0;
                this.vel.y = 0;

                // start expanding
                this.expanding = true;
                this.expandTimer = new ig.Timer(this.expandInterval);

                this.createTiles(this.getTilesWithinRadius());
            }
        }
    });
});