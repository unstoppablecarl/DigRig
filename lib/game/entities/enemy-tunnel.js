ig.module(
	'game.entities.enemy-tunnel'
)
.requires(
    'game.entities.particle',
	'impact.entity'
)
.defines(function(){

EntityEnemyTunnel = EntityEnemy.extend({
	size: {
		x: 10,
		y: 10
	},
    health: 30,
	speed: 50,
	digCooldown: .5,
    digCooldownTimer: null,
    digCharge: 50,
    animSheet: new ig.AnimationSheet('media/enemy-2.png', 10, 10),
    material: 0,
    lastVel: {
      x:0,
      y:0
    },
    projectileSpawnOffset: 1,
    pathMapName: 'fixed',
  	init: function(x, y, settings) {
        this.parent(x, y, settings);
		this.addAnim('idle', 1, [0]);
        this.digCooldownTimer = new ig.Timer(this.digCooldown);
	},

	update: function() {
        if(this.vel.x || this.vel.y){
            this.lastVel.x = this.vel.x;
            this.lastVel.y = this.vel.y;
        }
        this.parent();
	},
    handleMovementTrace: function(res) {
        if((res.collision.x || res.collision.y) && (this.digCooldownTimer.delta() > 0)){
                var centerX = this.pos.x + this.size.x/2,
                    centerY = this.pos.y + this.size.y/2,
                    angleToTarget = Math.atan2(this.lastVel.y, this.lastVel.x),
                    projectileSettings = {
                            angle: angleToTarget,
                            mode: 'destroy',
                            createdBy: this,
                            tilesToModify: this.digCharge,
                            expanding: false,
                            tileRadius:5
                    },
                    spawnX = centerX + Math.cos(angleToTarget) * this.projectileSpawnOffset,
                    spawnY = centerY + Math.sin(angleToTarget) * this.projectileSpawnOffset;

                ig.game.spawnEntity( EntityProjectile, spawnX, spawnY, projectileSettings);



                var angleToTarget = angleToTarget - (180/Math.PI)/2,
                    spawnOffset = 20,
                    spawnX = centerX + Math.cos(angleToTarget) * spawnOffset,
                    spawnY = centerY + Math.sin(angleToTarget) * spawnOffset;
                    projectileSettings = {
                        angle: angleToTarget,
                        mode: 'create',
                        createdBy: this,
                        tilesToModify: this.material,
                        expanding: true,
                        tileRadius:15,
                        drawCreate:false
                    }
                    this.material = 0;
                ig.game.spawnEntity( EntityProjectile, spawnX, spawnY, projectileSettings);
                this.digCooldownTimer.reset();
        } else {
            this.parent(res);
        }
    }
});

});