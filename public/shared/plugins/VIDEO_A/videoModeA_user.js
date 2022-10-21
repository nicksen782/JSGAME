/**
 * These are the functions that the user is expected to use.
 * The internal functions require many function arguments.
 * The user functions all accept an object instead.
 * The object keys can be in any order.
 * Any missing key will get a default value.
 * Therefore, the user functions are easier to write and to look at instead of memorizing the function's declaration.
 * Nothing prevents the user from using the internal versions of the functions if they want.
*/

// USER: Functions intended to be used by the user.
_GFX.util = {
    // Drawing of tiles/tilemaps to VRAM.
    tiles: {
        // Set one tile into VRAM.
        setTile           : function(obj) {
            // EXAMPLE USAGE: _GFX.util.tiles.setTile({ tid:5, x:0, y:0, tsi:0, li:0 });
            // EXAMPLE USAGE: _GFX.util.tiles.setTile({ tid:5, x:0, y:0, tsn:"tilesBG1", li:0 });
            let tileId       = obj.tid || 0;;
            let x            = obj.x   || 0;
            let y            = obj.y   || 0;
            let tileset;
            if(obj.tsi != undefined               ){ tileset = obj.tsi; }
            else if(obj.tsn && _GFX.cache[obj.tsn]){ tileset = _GFX.cache[obj.tsn].tilesetIndex; }
            else{ tileset = 0; }
            let layerIndex   = obj.li  || 0;
            _GFX.draw.tiles.setTile(tileId, x, y, tileset, layerIndex);
        },

        // Set text tiles into VRAM using a text string.
        print             : function(obj) {
            // EXAMPLE USAGE: _GFX.util.tiles.print({ str:"Text string.", x:0, y:0, tsi:2, li:2 });
            // EXAMPLE USAGE: _GFX.util.tiles.print({ str:"Text string.", x:0, y:0, tsn:"tilesTX1", li:2 });
            // NOTE: print assumes that the text tileset's first tilemap is the fontset and that those tiles are generated in ASCII order.
            let str          = obj.str || "";
            let x            = obj.x   || 0;
            let y            = obj.y   || 0;
            let tileset;
            if(obj.tsi != undefined               ){ tileset = obj.tsi; }
            else if(obj.tsn && _GFX.cache[obj.tsn]){ tileset = _GFX.cache[obj.tsn].tilesetIndex; }
            else{ tileset = 0; }
            let layerIndex   = obj.li  || 0;
            _GFX.draw.tiles.print(str, x, y, tileset, layerIndex);
        },

        // Fill a rectangular region with one tile. 
        fillTile          : function(obj) {
            // EXAMPLE USAGE: _GFX.util.tiles.fillTile({ tid:1, x:0, y:0, w:2, h:2, tsi:0, li:1 });
            // EXAMPLE USAGE: _GFX.util.tiles.fillTile({ tid:1, x:0, y:0, w:2, h:2, tsn:"tilesBG1", li:1 });
            let tileId       = obj.tid || 0;
            let x            = obj.x   || 0;
            let y            = obj.y   || 0;
            let w            = obj.w   || 0;
            let h            = obj.h   || 0;
            let tileset;
            if(obj.tsi != undefined               ){ tileset = obj.tsi; }
            else if(obj.tsn && _GFX.cache[obj.tsn]){ tileset = _GFX.cache[obj.tsn].tilesetIndex; }
            else{ tileset = 0; }
            let layerIndex   = obj.li  || 0;
            _GFX.draw.tiles.fillTile(tileId, x, y, w, h, tileset, layerIndex);
        },
        
        // Allows for a tile fill with the first tile of a tilemap.
        fillWithOneTile_tilemap          : function(obj) {
            // EXAMPLE USAGE: _GFX.util.tiles.fillWithOneTile_tilemap({ tmn:"TilemapName", x:0, y:0, w:2, h:2, tsi:0, li:1 });
            // EXAMPLE USAGE: _GFX.util.tiles.fillWithOneTile_tilemap({ tmn:"TilemapName", x:0, y:0, w:2, h:2, tsn:"tilesBG1", li:1 });
            let tileId = (()=>{
                try{
                    if     (obj.tsn             ){ return _GFX.cache[obj.tsn].tilemap[obj.tmn][0].orgTilemap[2]; }
                    else if(obj.tsn != undefined){ return _GFX.cache[obj.tsi].tilemap[obj.tmn][0].orgTilemap[2]; }
                }
                catch(e){ console.log("ERROR", e); return 0; }
            })();
            let x            = obj.x   || 0;
            let y            = obj.y   || 0;
            let w            = obj.w   || 0;
            let h            = obj.h   || 0;
            let tileset;
            if(obj.tsi != undefined               ){ tileset = obj.tsi; }
            else if(obj.tsn && _GFX.cache[obj.tsn]){ tileset = _GFX.cache[obj.tsn].tilesetIndex; }
            else{ tileset = 0; }
            let layerIndex   = obj.li  || 0;
            _GFX.draw.tiles.fillTile(tileId, x, y, w, h, tileset, layerIndex);
        },

        // Draw the individual tiles of a tilemap to VRAM.
        drawTilemap       : function(obj) {
            // EXAMPLE USAGE: _GFX.util.tiles.drawTilemap({ tmn:"TilemapName", x:0, y:0, tsi:0, li:0, ri:0 } );
            // EXAMPLE USAGE: _GFX.util.tiles.drawTilemap({ tmn:"TilemapName", x:0, y:0, tsn:"tilesBG1", li:0, ri:0 } );
            let tilemapName   = obj.tmn || "";
            let x             = obj.x   || 0;
            let y             = obj.y   || 0;
            let tileset;
            if(obj.tsi != undefined               ){ tileset = obj.tsi; }
            else if(obj.tsn && _GFX.cache[obj.tsn]){ tileset = _GFX.cache[obj.tsn].tilesetIndex; }
            else{ tileset = 0; }
            let layerIndex    = obj.li  || 0;
            let rotationIndex = obj.ri  || 0;
            _GFX.draw.tiles.drawTilemap(tilemapName, x, y, tileset, layerIndex, rotationIndex);
        },

        // Draw the individual tiles of a custom tilemap to VRAM.
        drawTilemap_custom: function(obj) {
            // EXAMPLE USAGE: _GFX.util.tiles.drawTilemap_custom({ x:0, y:0, tsi:0, li:0, tm:customTileMap } );
            // EXAMPLE USAGE: _GFX.util.tiles.drawTilemap_custom({ x:0, y:0, tsn:"tilesBG1", li:0, tm:customTileMap } );
            let x            = obj.x   || 0;
            let y            = obj.y   || 0;
            let tileset;
            if(obj.tsi != undefined               ){ tileset = obj.tsi; }
            else if(obj.tsn && _GFX.cache[obj.tsn]){ tileset = _GFX.cache[obj.tsn].tilesetIndex; }
            else{ tileset = 0; }
            let layerIndex   = obj.li  || 0;
            let tilemap      = obj.tm  || [];
            _GFX.draw.tiles.drawTilemap_custom(x, y, tileset, layerIndex, tilemap);
        },

        // Creates a tilemap from a string. (draw with drawTilemap_custom).
        customTilemapFromTextString: function(obj){
            // EXAMPLE USAGE:
            // EXAMPLE USAGE:
            let str          = obj.str || ""
            let tileset;
            if(obj.tsi != undefined               ){ tileset = obj.tsi; }
            else if(obj.tsn && _GFX.cache[obj.tsn]){ tileset = _GFX.cache[obj.tsn].tilesetIndex; }
            else{ tileset = 0; }
            return _GFX.draw.tiles.customTilemapFromTextString(str, tileset);
        },
    },

    // VRAM functions.
    VRAM: {
        // Calls the internal VRAM.draw function. 
        draw: async function(){ return _GFX.VRAM.draw(); },

        // TODO
        // Returns a copy of the specified VRAM region.
        getVramRegion: function(obj){
            let x = obj.x;
            let y = obj.y;
            let w = obj.w;
            let h = obj.h;
            return _GFX.VRAM.getVramRegion(x,y,w,h);
        },
        
        // TODO
        // Sets the specified VRAM region (usually data from getVramRegion).
        setVramRegion: function(vramRegionObj){
            // this.updateVram();
        },
    },

};
