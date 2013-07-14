ig.module( 'game.levels.level1' )
.requires( 'impact.image','game.entities.enemy-bomb','game.entities.player','game.entities.exit' )
.defines(function(){
LevelLevel1=/*JSON[*/{"entities":[{"type":"EntityEnemyBomb","x":372,"y":330},{"type":"EntityEnemyBomb","x":339,"y":330},{"type":"EntityEnemyBomb","x":334,"y":232},{"type":"EntityEnemyBomb","x":486,"y":353},{"type":"EntityEnemyBomb","x":302,"y":232},{"type":"EntityPlayer","x":21,"y":302},{"type":"EntityEnemyBomb","x":354,"y":233},{"type":"EntityExit","x":560,"y":298},{"type":"EntityEnemyBomb","x":374,"y":233},{"type":"EntityEnemyBomb","x":396,"y":232},{"type":"EntityEnemyBomb","x":420,"y":232},{"type":"EntityEnemyBomb","x":436,"y":232},{"type":"EntityEnemyBomb","x":455,"y":230},{"type":"EntityEnemyBomb","x":488,"y":327},{"type":"EntityEnemyBomb","x":469,"y":330},{"type":"EntityEnemyBomb","x":439,"y":330},{"type":"EntityEnemyBomb","x":402,"y":330},{"type":"EntityEnemyBomb","x":308,"y":330},{"type":"EntityEnemyBomb","x":289,"y":330},{"type":"EntityEnemyBomb","x":308,"y":356},{"type":"EntityEnemyBomb","x":340,"y":356},{"type":"EntityEnemyBomb","x":372,"y":359},{"type":"EntityEnemyBomb","x":303,"y":257},{"type":"EntityEnemyBomb","x":328,"y":257},{"type":"EntityEnemyBomb","x":369,"y":257},{"type":"EntityEnemyBomb","x":394,"y":257},{"type":"EntityEnemyBomb","x":429,"y":257},{"type":"EntityEnemyBomb","x":450,"y":257},{"type":"EntityEnemyBomb","x":474,"y":257},{"type":"EntityEnemyBomb","x":400,"y":353},{"type":"EntityEnemyBomb","x":421,"y":353},{"type":"EntityEnemyBomb","x":450,"y":353},{"type":"EntityEnemyBomb","x":469,"y":353}],"layer":[{"name":"paralax_bg","width":2,"height":2,"linkWithCollision":false,"visible":1,"tilesetName":"media/dark-rock.png","repeat":true,"preRender":false,"distance":"5","tilesize":40,"foreground":false,"data":[[1,1],[1,1]]},{"name":"_collision","width":1,"height":1,"linkWithCollision":false,"visible":1,"tilesetName":"media/levels/level1/collision.png","repeat":false,"preRender":false,"distance":"1","tilesize":600,"foreground":false,"data":[[1]]},{"name":"fixed","width":1,"height":1,"linkWithCollision":false,"visible":1,"tilesetName":"media/levels/level1/fixed.png","repeat":false,"preRender":false,"distance":"1","tilesize":600,"foreground":false,"data":[[1]]}]}/*]JSON*/;
LevelLevel1Resources=[new ig.Image('media/dark-rock.png'), new ig.Image('media/levels/level1/collision.png'), new ig.Image('media/levels/level1/fixed.png')];
});