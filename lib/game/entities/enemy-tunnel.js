ig.module(
	'game.entities.enemy-tunnel'
)
.requires(
    'game.entities.particle',
    'game.classes.enemy',
	'impact.entity'
)
.defines(function(){

EntityEnemyTunnel = Enemy.extend({
	size: {
		x: 10,
		y: 10
	},
    health: 30,
	speed: 50,
	digCooldown: 0.5,
    digCooldownTimer: null,
    digExpandCharge: 40,
    digCharge: 70,
    animSheet: new ig.AnimationSheet('media/enemy-2.png', 10, 10),
    material: 0,
    lastVel: {
      x:0,
      y:0
    },
    projectileSpawnOffset: 1,
    pathMapName: 'fixed',
	init: function(x, y, settings){
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
        if(!this.stunDamage && (res.collision.x || res.collision.y) && (this.digCooldownTimer.delta() > 0)){
            var centerX = this.pos.x + this.size.x/2,
                centerY = this.pos.y + this.size.y/2,
                angleToTarget = Math.atan2(this.vel.y, this.vel.x);

            if(this.material){
                var angleToTarget2 = Math.atan2(-this.vel.y, -this.vel.x);
                    spawnOffset = 20,
                    spawnX = centerX + Math.cos(angleToTarget2) * spawnOffset,
                    spawnY = centerY + Math.sin(angleToTarget2) * spawnOffset;
                    projectileSettings = {
                        angle: angleToTarget,
                        mode: 'create',
                        createdBy: this,
                        tilesToModify: this.material,
                        expanding: true,
                        tileRadius:1,
                        initialVelocity: 0,
                        drawProjectile:false
                    };
                    this.material = 0;
                ig.game.spawnEntity( EntityProjectile, spawnX, spawnY, projectileSettings);
            }

                var projectileSettings = {
                            angle: angleToTarget,
                            mode: 'destroy',
                            createdBy: this,
                            tilesToModify: this.digExpandCharge,
                            expanding: true,
                            tileRadius:1,
                            initialVelocity: 0,
                            drawProjectile: false
                    },
                    projectileSettings2 = {
                            angle: angleToTarget,
                            mode: 'destroy',
                            createdBy: this,
                            tilesToModify: this.digCharge,
                            expanding: false,
                            tileRadius:5,
                            drawProjectile: false

                    },
                    spawnX = centerX + Math.cos(angleToTarget) * this.projectileSpawnOffset,
                    spawnY = centerY + Math.sin(angleToTarget) * this.projectileSpawnOffset;

                ig.game.spawnEntity( EntityProjectile, spawnX, spawnY, projectileSettings);

                ig.game.spawnEntity( EntityProjectile, spawnX, spawnY, projectileSettings2);


                this.digCooldownTimer.reset();
            
        } else {
            this.parent(res);
        }
    }
});

});