ig.module(
    'game.classes.game-loader'
)
.requires(
    'impact.impact'
)
.defines(function(){

GameLoader = ig.Class.extend({
    defaultLevelName: 'test',
    levelName: null,
    levelClass: null,
    width: 800,
    height: 600,
    scale: 1,
    canvasId: '#canvas',
    gameClass: null,
    init: function(settings){
        ig.merge(this, settings);
        this.levelName = this.getLastLevelName() || this.defaultLevelName;
        this.setLastLevelName(this.levelName);
    },
    getLastLevelName: function(){
        return ig.global.localStorage.lastLevel;
    },
    setLastLevelName: function(lastLevel){
        ig.global.localStorage.lastLevel = lastLevel;
    },
    load: function(levelName){
        levelName = levelName || this.levelName;

        // prepend and capitalize
        var levelObjName = 'Level' + levelName.charAt(0).toUpperCase() + levelName.slice(1),
            levelPath = 'game.levels.' + levelName;

        this.setLastLevelName(levelName);

        // reset dom event handler
        delete ig.modules['dom.ready'];
        // clear dummy loader obj
        delete ig.modules['dummy.loader'];

        // if level had already been loaded just change the level
        if(ig.modules[levelPath]){
            this.levelClass  = ig.global[levelObjName];
            ig.game.loadLevel(this.levelClass);
        }
        // tell impact to load the level module
        else {

            ig
                .module('dummy.loader')
                .requires(levelPath)
                .defines((function(){
                    // get level class from global now that it has been autoloaded
                    this.levelClass  = ig.global[levelObjName];

                    // double coords of player to match map scale
                    for(var i = 0; i < this.levelClass.entities.length; i++) {
                            this.levelClass.entities[i].x *=2;
                            this.levelClass.entities[i].y *=2;
                    }

                    // init main if not ready or use loader if it is
                    if(!ig.ready){
                        ig.main(this.canvasId, this.gameClass, 60, this.width, this.height, this.scale);
                    } else {
                        var loader = new ig.Loader( this.gameClass, ig.resources );
                        loader.load();
                    }
                }).bind(this));
            // force the module load
            ig._execModules();
        }
    }
});
});