
ig.module(
	'game.entities.exit'
)
.requires(
	'impact.entity'
)
.defines(function(){

    EntityExit = ig.Entity.extend({
        checkAgainst: ig.Entity.TYPE.A,
        gravityFactor: 0,
        size: {
            x: 26,
            y: 34
        },
        collides:ig.Entity.COLLIDES.NEVER,
        animSheet: new ig.AnimationSheet( 'media/exit.png', 26, 34 ),
        init: function(x, y, settings){
            this.parent(x,y,settings);
            this.addAnim('idle', 1, [0]);
            // view entities at 50% in weltmeister
            if(ig.global.wm){
                this.size.x = this.size.x/2;
                this.size.y = this.size.y/2;
                this.offset.x = this.offset.x/2;
                this.offset.y = this.offset.y/2;
            }
            
        },
        update:function(){
            this.parent();
        },
        draw:function(){
          // render entity at 50% in weltmeister to match bg scale
            if(ig.global.wm){
                var ctx = ig.system.context;
                ctx.save();
                var scaledWidth = .5 * this.size.x,
                    scaledHeight = .5 * this.size.y;
                ctx.translate(
                    ig.system.getDrawPos( (this.pos.x - this.offset.x) - ig.game.screen.x),
                    ig.system.getDrawPos( (this.pos.y - this.offset.y) - ig.game.screen.y)
                );
                ctx.scale(.5, .5);
                this.currentAnim.draw( 0, 0 );
                ctx.restore();
                return;
            }
            this.parent();
        },
        check: function(other){
            if(other == ig.game.player){
                ig.game.levelComplete();
            }
        }
    });

});