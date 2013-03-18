ig.module(
	'game.entities.crate'
)
.requires(
    'impact.entity'
)
.defines(function(){

EntityCrate = ig.Entity.extend({
	size: {x: 8, y: 8},
	type: ig.Entity.TYPE.A,
	checkAgainst: ig.Entity.TYPE.B,
    lifespanAfterCollide: 3,
    lifespanTimer: null,
    fadeTime: 2,
    collided: false,
	animSheet: new ig.AnimationSheet( 'media/crate.png', 8, 8 ),
    touchedLast: [],
	init: function( x, y, settings ) {
		this.addAnim( 'idle', 1, [0] );
		this.parent( x, y, settings );
	},
    check:function(other){

        if(this.touchedLast.indexOf(other) != -1){
            return;
        } else {
            this.touchedLast.push(other);
        }

        // if moving fast enough cause damage
        var vel = Math.sqrt(this.vel.x*this.vel.x + this.vel.y*this.vel.y);

        other.receiveDamage(vel / 10);
//        this.lifeSpanTimer = new ig.Timer();
//        this.collided = true;
    },
    update: function(){
//        if(this.collided){
//            var delta = this.lifeSpanTimer.delta();
//            this.currentAnim.alpha = delta.map(this.lifespanAfterCollide - this.fadeTime, this.lifespanAfterCollide, 1, 0);
//            if(delta > this.lifespanAfterCollide){
//                this.kill();
//            }
//        }
        this.parent();
    }

});


});