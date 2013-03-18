/**
 * base enemy class
 */
ig.module(
	'game.entities.enemy'
)
.requires(
    'game.entities.particle',
	'impact.entity'
)
.defines(function(){

EntityEnemy = ig.Entity.extend({
    /**
     * CONFIG variables
     */
    type: ig.Entity.TYPE.B,
    checkAgainst: ig.Entity.TYPE.A,
    collides: ig.Entity.COLLIDES.PASSIVE,
	size: {
		x: 12,
		y: 13
	},
    gravityFactor: 0,
    speed: 60,
    bounciness: .25,
    friction: {
      x: 50,
      y: 50
    },
    frictionAir: {
        x: 50,
        y: 50
    },
    frictionGround: {
        x: 500,
        y: 50
    },
    damageParticleStartColor: {
        r: 255,
        g: 255,
        b: 255,
        a: 1
    },
    damageParticleEndColor: {
        r: 0,
        g: 255,
        b: 0,
        a: 1
    },
    // when damage is taken, a damage particle will be spawned for every damagePerParticle value of damage
    damagePerParticle: 2,
    // distance from the center of this entity any part of a projectile must be to collide with this enemy
    projectileCollideRadius: 6,
    // time enemy is stunned per stun damage point received in seconds
    stunTimePerDamagePoint: .01,
    // when stun damage is taken, a stun damge particle is spawned for every stunDamagePerParticle value of damage
    stunDamagePerParticle: 300,
    // the max time in seconds this enemy can be stunned
    // maxStunTime is only reached when this.stunDamage == this.maxStunDamage
    maxStunTime: 10,
    // the min force applied to this enemy due to projectile stun damage
    minStunForce: 100,
    // the max force applied to this enemy from projectile stun damage
    // maxStunForce is only reached when this enemy is recieves stun damage equal to this.maxStunDamage
    maxStunForce: 25,
    // the max stun damage this enemy can have
    // used to calculate stun time
    // deturmines scaling of force applied when receiving stun damage
    maxStunDamage: 5000,
    // the number of stun damage points that cause 1 second of stun time
    // used to reduce stun damage over time while stunned
    // set on init() this.stunDamageRecoveredPerSecond = this.maxStunDamage / this.maxStunTime;
    stunDamageRecoveredPerSecond : null,
    // interval that this enemy's path is recalculated in seconds
    pathUpdateInterval: .5,
    maxHealth: 10,

    /**
     * STATE variables
     */
    health: 10,
    // timer used for pathUpdateInterval
    pathTimer: null,
    // current stun damage
    // equal to charge of projectile when collided
    stunDamage: 0,
    // the name of the chunked map to use for pathfinding
    pathMapName: 'collision',
	init: function(x, y, settings) {
		this.parent(x, y, settings);
        this.pathTimer = new ig.Timer(this.pathUpdateInterval);
        this.stunDamageRecoveredPerSecond = this.maxStunDamage / this.maxStunTime;
	},
	update: function() {


        if (this.standing) {
            this.friction.x = this.frictionGround.x;
            this.friction.y = this.frictionGround.y;
        } else {
            this.friction.x = this.frictionAir.x;
            this.friction.y = this.frictionAir.y;
        }

        // if not stunned
        if(!this.stunDamage){
            this.gravityFactor = 0;
            // Update it every 2 seconds
            if(this.pathTimer.delta() > 0) {
                // Get the path to the player
                var x = ig.game.player.pos.x + ig.game.player.size.x/2,
                    y = ig.game.player.pos.y + ig.game.player.size.y/2;

                this.getPath(x, y, true, ['EntityEnemy'], [], ig.game.getChunkedMap(this.pathMapName));
                this.pathTimer.reset();
            }
            // Walk the path
            if(this.pathMap){
                this.followPath(this.speed, true);
            }
        }
        // if stunned
        else {
            this.gravityFactor = this.friction.y/4;
            // the number of stun damage points that cause 1 second of stun time
            // used to reduce stun damage over time while stunned
            var stunDamageRecoveredPerSecond = this.maxStunDamage / this.maxStunTime;
            // reduce stunDamage proportional to time since last update using damagePerSecond
            this.stunDamage -= stunDamageRecoveredPerSecond * ig.system.tick;
            if(this.stunDamage < 0){
                this.stunDamage = 0;
            }
        }
		this.parent();
	},
	draw: function() {


		if(!ig.global.wm) {
			// Draw the path for debugging
			this.drawPath(255, 0, 0, 0.5);
		}

		this.parent();

        // draw stun timer for debugging
        if(this.stunDamage){
            var stunDamageRecoveredPerSecond = this.maxStunDamage / this.maxStunTime,
                stunTimeLeft = (this.stunDamage / stunDamageRecoveredPerSecond).round(2);
            ig.game.font.draw(
                stunTimeLeft,
                this.pos.x - ig.game.screen.x,
                this.pos.y - ig.game.screen.y - 10
            );
        }
	},
    spawnDamageParticles: function(count){
        for(var i = 0; i < count; i++){
            ig.game.addItem(
                new EntityParticle(
                    this.pos.x + this.size.x/2,
                    this.pos.y + this.size.y/2,
                    {
                        startColor: this.damageParticleStartColor,
                        endColor: this.damageParticleEndColor
                    }
                )
            );
        }
    },
    receiveDamage:function(damage, source){
        var particlesToSpawn = Math.ceil(damage /  this.damagePerParticle);

        this.spawnDamageParticles(particlesToSpawn);
        this.health -= damage;

        // @todo death animations
        if( this.health <= 0 ) {
            this.kill();
        }
    },
    receiveStunDamage:function(damage, source){
        if(source.name == 'projectile'){
            var centerX = source.pos.x + source.size.x/2,
                centerY = source.pos.y + source.size.y/2,
                projectileVelocityAngle = Math.atan2(source.vel.y, source.vel.x),
                targetX = this.pos.x + this.size.x/2,
                targetY = this.pos.y + this.size.y/2,
                angleToTarget = Math.atan2(targetY - centerY, targetX - centerX),
                stunDamageFactor = damage / this.maxStunDamage,
                stunForce = stunDamageFactor.map(0,1, this.minStunForce, this.maxStunForce);
            this.vel.x += Math.cos(angleToTarget) * stunForce;
            this.vel.y += Math.sin(angleToTarget) * stunForce;

        }
        var particlesToSpawn = Math.floor(damage / this.stunDamagePerParticle);
        this.spawnDamageParticles(particlesToSpawn);
        this.stunDamage += damage;
        if(this.stunDamage > this.maxStunDamage){
            this.stunDamage = this.maxStunDamage;
        }

     }
});

});