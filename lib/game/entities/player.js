ig.module(
    'game.entities.player'
    )
.requires(
    'impact.entity',
    'game.entities.particle',
    'game.entities.projectile'
    )
.defines(function(){

    EntityPlayer = ig.Entity.extend({
        /**
         * CONFIG variables
         */
        collides: ig.Entity.COLLIDES.NEVER,
        type: ig.Entity.TYPE.A,
        checkAgainst: ig.Entity.TYPE.B,
        name: 'player',

        healthMax: 100,
        size: {
            x: 16,
            y:28
        },
        offset: {
            x: 8,
            y: 4
        },
        xFriction: {
            ground: 800,
            air: 75
        },
        friction: {
            x: 800,
            y: 0
        },
        maxVel: {
            x: 100,
            y: 150
        },
        accelGround: 500,
        accelAir: 300,
        jump: 100,
        animSheet: new ig.AnimationSheet( 'media/player.png', 32, 32 ),
        flip: false,
        projectileSpawnOffset: {
            x: 14,
            y: 2
        },
        gunArm: {
            animSheet: new ig.AnimationSheet( 'media/gun-arm.png', 14, 8 ),
            currentAnim: null,
            pivot : {
                x:0,
                y:4
            },
            ownerOffset: {
                x: 8,
                y: 14
            },
            // offset x in the direction character is facing
            ownerFlipOffset: 2,
            size: {
                x: 14,
                y: 8
            }
        },
        // min time between shots
        gunCoolDown: .15,
        // starting charge increment when starting to charge a shot
        initialChargeIncrement: 50,
        // amount to increase charge increment every charge increment timer loop
        chargeIncrementIncrease: 4,
        // interval that charge is increased when holding a fire button
        chargeInterval: .1,
        // the minimum charge used when firing (if button clicked not held)
        chargeMin: 50,
        // stroke style of the circle drawn when charging your dig rig
        chargePreviewStrokeStyle: 'rgba(255,255,255, .5)',
        // line width of the circle drawn when charging your dig rig
        chargePreviewLineWidth: 1,
        // max material player can store
        materialMax: 5000,
        // the number of veritcal tiles the player can automatically climb when moving horizontally
        tileClimb: 5,
        // when damage is taken, a damage particle will be spawned for every (damage / damagePerParticle)
        damagePerParticle: 2,
        // time that player is transparent after being damaged
        drawDamagedDuration: .5,
        // intensity of screen shake when damaged
        damageScreenShakeIntensity: 60,
        // durration of screen shake when damaged
        damageScreenShakeDurration: .1,
        // color of particles spawned when damaged
        damageParticleColor: {
            r: 255,
            g: 0,
            b: 0,
            a: 1
        },

        /**
         * STATE variables
         */
        health: 100,

        // amount this.charge increses every charge timer loop
        // increased by chargeIncrementIncrease every loop for accelerated chargeIncrement over time
        chargeIncrement: 50,
        chargeIntervalTimer: null,
        // current dig rig charge value
        charge:0,
        // 'created' or 'destroy''
        chargeType: null,
        // curent (predicted if mode == 'create') radius of the projectile in map tiles (maptilesize currently 2x2px)
        // for drawing the projectile preview outline
        chargeTileRadius:0,
        // current material in matter tank
        material: 0,
        // if player has taken damage this update
        drawDamaged: false,
        drawDamagedTimer: null,
        gunCoolDownTimer: null,
        init: function( x, y, settings ) {
            this.parent( x, y, settings );

            this.addAnim('idle', 1, [0]);
            this.addAnim('run', 0.07, [0, 1, 2, 3, 4, 5]);
            this.addAnim('jump', 1, [9]);
            this.addAnim('fall', 0.4, [6, 7]);
            this.addAnim('hurt', this.drawDamagedDuration, [10]);

            this.currentAnim = this.anims.idle;
            this.gunCoolDownTimer = new ig.Timer(this.gunCoolDown);
            this.chargeIntervalTimer = new ig.Timer(this.chargeInterval);

            this.gunArm.currentAnim = new ig.Animation( this.gunArm.animSheet, 1, [0]);
            this.gunArm.currentAnim.pivot = this.gunArm.pivot;

            this.initialChargeIncrement = this.chargeIncrement;

            this.drawDamagedTimer = new ig.Timer(this.drawDamagedDuration);
        },
        handleMovementTrace: function(res) {
            // climb over 1 px vertical difference in floor
            var prevVel = {
                x: this.vel.x,
                y: this.vel.y
            },
            tileSize = ig.game.tileSize;

            this.parent(res);
            if(res.collision.x){
                for(var i = 0; i < this.tileClimb; i++){
                    var climb = i * tileSize,
                        trace = ig.game.collisionMap.trace(this.pos.x, this.pos.y - climb, prevVel.x, prevVel.y, this.size.x, this.size.y);
                    if(!trace.collision.x){
                        this.pos.y -= climb;
                        break;
                    }
                }
            }
        },
        update: function() {

            // set friction for ground and air
            var acceleration;
            if (this.standing) {
                acceleration = this.accelGround;
                this.friction.x = this.xFriction.ground;
            } else {
                acceleration = this.accelAir;
                this.friction.x = this.xFriction.air;
            }

            // move acceleration left or right
            if( ig.input.state('left') ) {
                this.accel.x = -acceleration;
            }
            else if( ig.input.state('right') ) {
                this.accel.x = acceleration;
            } else {
                this.accel.x = 0;
            }

            // flip to face mouse
            if(ig.input.mouse.x < ig.system.width/2){
                this.flip = true;
            } else {
                this.flip = false;
            }

            // if standing on the ground, and jump is being pressed and not already jumping or falling
            // start jumping
            if( this.standing && ig.input.state('jump') && this.vel.y === 0) {
                this.vel.y = -this.jump;
                this.falling = false;

            // if not standing, jump is not pressed and not falling yet
            // reduce the y velocity and mark us as falling
            } else if(!this.standing && !ig.input.state('jump') && !this.falling) {
                this.vel.y = this.vel.y/2;
                this.falling = true;
            }

            // set current anim based on movement direction
            if (this.vel.y < 0) {
                this.currentAnim = this.anims.jump;
            } else if (this.vel.y > 0) {
                this.currentAnim = this.anims.fall;
            } else if (this.vel.x !== 0) {
                this.currentAnim = this.anims.run;
            } else {
                this.currentAnim = this.anims.idle;
            }
            this.currentAnim.flip.x = this.flip;
            // handle shooting
            var mX = ig.input.mouse.x + ig.game.screen.x,
                mY = ig.input.mouse.y + ig.game.screen.y,
                centerX = this.pos.x + this.size.x/2,
                centerY = this.pos.y + this.size.y/2,
                angleToMouse = Math.atan2(mY - centerY, mX - centerX),
                chargeMax = 0,
                gunCooled = this.gunCoolDownTimer.delta() > 0,
                chargeIncrementReady = this.chargeIntervalTimer.delta() > 0;

            // handle gun arm
            if(!ig.global.wm){
                this.gunArm.currentAnim.angle = angleToMouse;
                this.gunArm.x = this.pos.x - ig.game._rscreen.x + this.gunArm.ownerOffset.x,
                this.gunArm.y = this.pos.y - ig.game._rscreen.y + this.gunArm.ownerOffset.y;
                this.gunArm.x += (this.flip)? -this.gunArm.ownerFlipOffset : this.gunArm.ownerFlipOffset;
            }


            if(ig.input.state('leftButton')){
                this.chargeType = 'destroy';
                chargeMax = this.materialMax - this.material;
            }

            if(ig.input.state('rightButton')){
                this.chargeType = 'create';
                chargeMax = this.material;
            }

            // if button was just pressed and gun is cooled down
            // reset charge and charge timer
            if(gunCooled && ig.input.pressed('leftButton') || ig.input.pressed('rightButton')) {
                this.charge = 0;
                this.chargeIntervalTimer.reset();
            }

            // matter tank full
            if(ig.input.pressed('leftButton') && this.material > this.materialMax){
                ig.game.addItem(new Notification('Matter Tank Full'));
            }

            // matter tank empty
            if(ig.input.pressed('rightButton') && this.material < 0){
                ig.game.addItem(new Notification('Matter Tank Empty'));
            }

            // if gun cooled and button is contining to be pressed
            // charge gun
            if(gunCooled && (ig.input.state('leftButton') || ig.input.state('rightButton'))) {
                // if not max charged and charge increment timer complete
                if(this.charge < chargeMax && chargeIncrementReady){
                    this.charge += this.chargeIncrement;
                    this.chargeIntervalTimer.reset();
                    // increase charge tile radius to match projectile radius (roughly)
                    // set tile radius so that the area matches the charge ( use only 90% to account for rounding )
                    this.chargeTileRadius = Math.sqrt(this.charge / Math.PI) * .9;
                    // increase charge rate by this.chargeIncrementIncrease
                    this.chargeIncrement += this.chargeIncrementIncrease;
                }
                // don't let this.charge exceed chargeMax
                if(this.charge > chargeMax){
                    this.charge = chargeMax;
                }
            }

            // flip depending on facing of character
            var projectileOffsetX = (this.flip)? -projectileOffsetX : this.projectileSpawnOffset.x,
                // distance from character
                spawnOffset = this.spawnOffset = this.chargeTileRadius * ig.game.tileSize,
                // offset the spawn position from the center of the character
                spawnX = this.spawnX = centerX + Math.cos(angleToMouse) * spawnOffset,
                spawnY = this.spawnY = centerY + this.projectileSpawnOffset.y + Math.sin(angleToMouse) * spawnOffset;

            if(gunCooled && ig.input.released('leftButton') || ig.input.released('rightButton')) {

                if(this.charge < this.chargeMin){
                    this.charge = this.chargeMin;
                }

                if(this.charge > chargeMax){
                    this.charge = chargeMax;
                }

                var tileModifyCount = this.charge,
                    projectileSettings = {
                        angle:angleToMouse,
                        mode: this.chargeType,
                        createdBy: this
                    };

                if(this.chargeType === 'destroy'){
                    // if we have any room for more material
                    if(this.material < this.materialMax){
                        //if the max space left for material is less than the charge use the difference
                        if(this.material > this.materialMax - tileModifyCount){
                            tileModifyCount = this.materialMax - this.material;
                        }
                        projectileSettings.tilesToModify = tileModifyCount;

                        ig.game.spawnEntity( EntityProjectile, spawnX, spawnY, projectileSettings);
                    } else {
                        ig.game.addItem(new Notification('Matter Tank Full'));
                    }
                } else if(this.chargeType === 'create') {
                    // if we have any material
                    if(this.material > 0){
                        // if material we have is less than the charge use whatever is left
                        if(this.material < tileModifyCount){
                            tileModifyCount = this.material;
                        }
                        projectileSettings.tilesToModify = tileModifyCount;
                        // tile radius is always 1 for create
                        projectileSettings.tileRadius = 1;
                        // reduce material count immediately
                        this.material -= tileModifyCount;

                        ig.game.spawnEntity( EntityProjectile, spawnX, spawnY, projectileSettings );
                    } else {
                        ig.game.addItem(new Notification('Matter Tank Empty'));
                    }
                }
                this.gunCoolDownTimer.reset();
                this.charge = 0;
                this.chargeTileRadius = 0;
                this.chargeIncrement = this.initialChargeIncrement;
            }

            this.parent();

            // if character is being damaged check if drawDamagedDurration has passed
            if(this.drawDamaged && this.drawDamagedTimer.delta() > 0){
                this.drawDamaged = false;
            }
        },
        draw: function(){

            var ctx = ig.system.context;

            // draw transparent if being damaged
            if(this.drawDamaged){
                this.currentAnim = this.anims.hurt;
//                this.currentAnim.alpha = .2;
                this.gunArm.currentAnim.alpha = .5;
            }
            // set default transparency
            else {
                this.gunArm.currentAnim.alpha = 1;
//                this.currentAnim.alpha = 1;
            }

            // default entitiy.draw() code
            if( this.currentAnim ) {
                this.currentAnim.draw(
                    this.pos.x - this.offset.x - ig.game._rscreen.x,
                    this.pos.y - this.offset.y - ig.game._rscreen.y
                );
            }

            // draw gun arm
            this.gunArm.currentAnim.draw(this.gunArm.x, this.gunArm.y);

            // draw projectile preview outline
            if(this.chargeTileRadius){
                var tileSize = ig.game.tileSize * ig.system.scale,
                    arcX = this.spawnX - ig.game.screen.x,
                    arcY = this.spawnY- ig.game.screen.y,
                    arcRadius = tileSize * this.chargeTileRadius;
                ctx.save();
                ctx.beginPath();
                ctx.lineWidth = this.chargePreviewLineWidth;
                ctx.arc(arcX, arcY, arcRadius, 0 , 2 * Math.PI, false);
                ctx.strokeStyle = this.chargePreviewStrokeStyle;
                ctx.stroke();
                ctx.closePath();
                ctx.restore();
            }
        },
        receiveDamage:function(damage){
            var particlesToSpawn = Math.ceil(damage / this.damagePerParticle );
            for(var i = 0; i < particlesToSpawn; i++){
                ig.game.addItem(
                    new EntityParticle(
                        this.pos.x + this.size.x/2,
                        this.pos.y + this.size.y/2,
                        {
                            endColor: this.damageParticleColor
                        }
                    )
                );
            }

            ig.game.screenShaker.timedShake(this.damageScreenShakeIntensity, this.damageScreenShakeDurration);

            // set player to draw as being damaged
            this.drawDamaged = true;
            // reset the timer for how long to draw the player as damaged
            this.drawDamagedTimer.reset();

            this.parent(damage);
        }
    });
});