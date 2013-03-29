/**
 * base enemy class
 */
ig.module(
        'game.entities.enemy-bomb'
)
.requires(
        'game.entities.particle',
        'game.classes.enemy',
        'game.entities.enemy-dig',
        'game.entities.enemy-tunnel',
        'impact.entity'
)
.defines(function(){
    EntityEnemyBomb = Enemy.extend({
        health: 10,
        // damage inflicted on player when contact is made
        damageOnContact: 10,
        animSheet: new ig.AnimationSheet('media/enemy-1.png', 12, 13),
        init: function(x,y,settings){
            this.parent(x,y,settings);
            this.addAnim('idle', 1, [0]);
        },
        check: function(other){
            // kill when colliding with player
            if(other == ig.game.player){
                other.receiveDamage(this.damageOnContact);
                this.kill();
            }
        }
    });

});