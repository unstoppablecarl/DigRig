ig.module(
    'game.classes.notification'
    )
.requires(
    'impact.impact',
    'impact.font'

    )
.defines(function(){


Notification = ig.Class.extend({
    _layer: 'notifications',
    lifespan: 1.5,
    fadeInTime: .3,
    fadeOutTime: .8,

    ctx: null,
    message: null,

    lifespanTimer: null,
    pos: {
        x: 0,
        y: 30
    },
    align: ig.Font.ALIGN.CENTER,
    font: new ig.Font('media/fonts/9x5.red.png'),
    ease: true,
    size: {
        x: 0,
        y: 0
    },
    bg: {
        fillStyle: 'rgba(210,240,255,.8)',
        strokeStyle: 'rgba(249,249,255,.9)',
        strokeOffset: 1,
        lineWidth: 1,
        x:0,
        y:0,
        width: 0,
        height: 0,
        padding: {
            x: 10,
            y: 5
        }
    },
    init: function(message, settings){
        this.ctx = ig.system.context;
        this.pos.x = ig.system.width/2;
        this.pos.y = ig.system.height - this.pos.y;
        this.message = message;
        ig.merge(this, settings);
        this.lifespanTimer = new ig.Timer();

        this.size.x = this.font.widthForString(this.message);
        this.size.y = this.font.heightForString(this.message);

        this.pos.y -= this.size.y;
        // clear any existing notifications
        if(this._layer == 'notifications'){
            ig.game.layers['notifications'].items = []
        }

        this.bg.x = Math.floor(((ig.system.width - this.size.x)/2) - (this.bg.lineWidth + this.bg.padding.x));
        this.bg.y = Math.floor(this.pos.y - (this.bg.lineWidth + this.bg.padding.y));

        // if odd adjust to be pixel perfect
        if(this.bg.lineWidth % 2){
            this.bg.x -= 0.5;
            this.bg.y -= 0.5;
        }
        this.bg.width = Math.floor(this.size.x + (this.bg.padding.x + this.bg.lineWidth) *2);
        this.bg.height = Math.floor(this.size.y + (this.bg.padding.y + this.bg.lineWidth)*2);
    },
    draw: function(){
        var delta = this.lifespanTimer.delta(),
            fadeInEnd = this.fadeInTime,
            fadeOutStart = this.lifespan - this.fadeOutTime,
            a = 1,
            ctx = ig.system.context;

        if(delta > this.lifespan) {
            ig.game.removeItem(this);
			return;
		}

        if(delta < fadeInEnd){
            a = delta.map(
                0, fadeInEnd,
                0, 1
            );
            if(this.ease){
                // ease out
                a = 1 - ( --a * a * a * a );
            }
        } else if(delta > fadeOutStart){
            a = delta.map(
                fadeOutStart, this.lifespan,
                1, 0
            );
            if(this.ease){
                // ease in
                a = a * a * a * a;
            }
        }

        ctx.save();
        ctx.globalAlpha = a;
        ctx.fillStyle = this.bg.fillStyle;


        ctx.fillRect(this.bg.x, this.bg.y, this.bg.width, this.bg.height);
        if(this.bg.lineWidth){
            ctx.lineWidth = this.bg.lineWidth;
            ctx.strokeStyle = this.bg.strokeStyle;
            ctx.strokeRect(this.bg.x - this.bg.strokeOffset, this.bg.y - this.bg.strokeOffset, this.bg.width + this.bg.strokeOffset*2, this.bg.height + this.bg.strokeOffset*2);
        }
        ctx.restore();

        this.font.alpha = a ;
        this.font.draw(this.message, this.pos.x, this.pos.y, this.align)


    }


});


});