ig.module( 'game.levels.tunnel' )
.requires( 'impact.image','game.entities.player','game.entities.exit','game.entities.enemy-tunnel' )
.defines(function(){
LevelTunnel=/*JSON[*/{"entities":[{"type":"EntityPlayer","x":18,"y":113},{"type":"EntityExit","x":265,"y":123},{"type":"EntityEnemyTunnel","x":138,"y":251}],"layer":[{"name":"_collision","width":1,"height":1,"linkWithCollision":false,"visible":1,"tilesetName":"media/levels/tunnel/collision.png","repeat":false,"preRender":false,"distance":"1","tilesize":300,"foreground":false,"data":[[1]]},{"name":"fixed","width":1,"height":1,"linkWithCollision":true,"visible":1,"tilesetName":"media/levels/tunnel/fixed.png","repeat":false,"preRender":false,"distance":"1","tilesize":300,"foreground":false,"data":[[1]]}]}/*]JSON*/;
LevelTunnelResources=[new ig.Image('media/levels/tunnel/collision.png'), new ig.Image('media/levels/tunnel/fixed.png')];
});