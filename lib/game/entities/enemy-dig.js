ig.module(
	'game.entities.enemy-dig'
)
.requires(
    'game.entities.particle',
    'game.classes.enemy',
	'impact.entity'
)
.defines(function(){

EntityEnemyDig = Enemy.extend({
	size: {
		x: 25,
		y: 25
	},
    health: 30,
    speed: 50,
    digCooldown: 3,
    digCooldownTimer: null,
    digCharge: 150,
    animSheet: new ig.AnimationSheet('media/enemy-2.png', 18, 18),
    material: 0,
    // the name of the chunked map to use for pathfinding
    pathMapName: 'fixed',
  	init: function(x, y, settings) {
		this.parent(x, y, settings);
        this.addAnim('idle', 1, [0]);
		this.pathTimer = new ig.Timer(this.pathUpdateInterval);
        this.digCooldownTimer = new ig.Timer(this.digCooldown);
	},
    handleMovementTrace: function(res) {

        if((res.collision.x || res.collision.y) && (this.digCooldownTimer.delta() > 0)){
                var centerX = this.pos.x + this.size.x/2,
                    centerY = this.pos.y + this.size.y/2,
                    projectileSettings = {
                            angle:0,
                            mode: 'destroy',
                            createdBy: this,
                            tilesToModify: this.digCharge,
                            expanding: true,
                            tileRadius: 10,
                            initialVelocity: 0,
                            zIndex: this.zIndex -1
                    };
                ig.game.sortEntitiesDeferred()
                ig.game.spawnEntity( EntityProjectile, centerX, centerY, projectileSettings);
                this.digCooldownTimer.reset();
        } else {
            this.parent(res);
        }
    },
    kill:function(){
         this.parent();

        var centerX = this.pos.x + this.size.x/2,
            centerY = this.pos.y + this.size.y/2,
            projectileSettings = {
                angle:0,
                mode: 'create',
                createdBy: this,
                tilesToModify: this.material,
                expanding: true,
                tileRadius: 2,
                initialVelocity: 0
            };
        ig.game.spawnEntity( EntityProjectile, centerX, centerY, projectileSettings);
     }
});

});