/**
 * draws a solid color over a tile and fades, then removes itself
 */
ig.module(
    'game.classes.tile-effect'
)
.requires(
    'impact.impact'

)
.defines(function(){

    TileEffect = function(tilesToHighlight, color){
        this.color = color || '255,0,0';
        this.tilesToHighlight = tilesToHighlight;
        this.tileSize = ig.game.collisionMap.tilesize;
        this.ctx = ig.system.context;
        this.timer = new ig.Timer(1);
    };

    TileEffect.prototype._layer = 'tileEffects';

    TileEffect.prototype.draw = function(){

        var delta = this.timer.delta();
        if(delta > 0){
            ig.game.removeItem(this);
            return;
        }

        var ctx = this.ctx,
            tilesToHighlight = this.tilesToHighlight,
            tileSize = this.tileSize,
            scale = ig.system.scale,
            width = tileSize * scale,
            height = tileSize * scale,
            alpha = -delta;

        if(alpha < 0 || alpha > 1) alpha = 0;

        for(var i = 0; i < tilesToHighlight.length; i++){
            var tile = tilesToHighlight[i],
                tx = (tile.x * tileSize - ig.game.screen.x) * scale,
                ty = (tile.y * tileSize - ig.game.screen.y) * scale;

            ctx.fillStyle = 'rgba(' + this.color + ',' + alpha + ')';
            ctx.fillRect(
                tx,
                ty,
                width,
                height
            );
        }
    };
});