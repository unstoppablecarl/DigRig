/*
Base entity class for particle entities. Subclass your own particles from
this class. See the EntityDebrisParticle in debris.js for an example.

Particle entities will kill themselfs after #lifetime# seconds. #fadetime#
seconds before the #lifetime# ends, they will start to fade out.

The velocity of a particle is randomly determined by its initial .vel
properties. Its Animation will start at a random frame.
*/

ig.module(
	'game.entities.particle'
)
.requires(
	'impact.entity'
)
.defines(function(){

EntityParticle = ig.Entity.extend({
    _layer: 'particles',
	size: {x: 2, y: 2},
	offset: {x: 0, y: 0},
	maxVel: {x: 160, y: 160},
	minBounceVelocity: 0,

	type: ig.Entity.TYPE.NONE,
	checkAgainst: ig.Entity.TYPE.NONE,
	collides: ig.Entity.COLLIDES.LITE,

	lifetime: 2,
	fadetime: 1,
	bounciness: 0.1,
	friction: {x:20, y: 0},
    // if true, color will transition from startColor to endColor, if false this.startColor will be used instead
    colorChange: true,
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
    lifespanTimer: null,
	init: function( x, y, settings ) {
		this.parent( x, y, settings );
		this.vel.x = (Math.random() - .5) * 100;
		this.vel.y = (Math.random() - .5) * 100;

		this.lifespanTimer = new ig.Timer();
	},
	update: function() {
		if( this.lifespanTimer.delta() > this.lifetime ) {
			this.kill();
			return;
		}

		this.parent();
	},
    draw: function(){
        var ctx = ig.system.context,
            scale = ig.system.scale,
            x = (this.pos.x - ig.game.screen.x) * scale,
            y = (this.pos.y - ig.game.screen.y) * scale,
            width = this.size.x * scale,
            height = this.size.y * scale,
            color = {},
            delta = this.lifespanTimer.delta(),
            alpha = delta.map(this.lifetime - this.fadetime, this.lifetime, 1, 0);

        if(this.colorChange){
            color.r = Math.floor(delta.map(0, 1, this.startColor.r, this.endColor.r ));
            color.g = Math.floor(delta.map(0, 1, this.startColor.g, this.endColor.g ));
            color.b = Math.floor(delta.map(0, 1, this.startColor.b, this.endColor.b ));
            color.a = Math.floor(delta.map(0, 1, 1, 0 ));
        } else {
            color = this.startColor;
        }
        ctx.fillStyle = 'rgba(' + color.r + ',' + color.g + ',' + color.b + ',' + alpha + ')';
        ctx.fillRect(
            x,
            y,
            width,
            height
        );
    }
});


});