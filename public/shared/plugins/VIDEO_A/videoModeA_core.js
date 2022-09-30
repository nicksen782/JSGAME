_GFX = {};

// INTERNAL: Canvas caches of tiles, tilemaps, config.
_GFX.cache = {};

// INTERNAL: VRAM - Holds graphics states.
_GFX.VRAM = {
    // ArrayBuffer of VRAM.
    _VRAM: undefined,

    // TypedArray view of the VRAM ArrayBuffer.
    _VRAM_view: undefined,

    // Lookup table: Get VRAM index by y, x.
    indexByCoords:[],

    // Holds the changes to VRAM that will be drawn on the next draw cycle.
    changes: [],
    
    // Creates the VRAM._VRAM typedArray. (Should only be run once).
    initVram_typedArray: function(){
        // Get the dimensions.
        let dimensions  = _JSG.loadedConfig.meta.dimensions;

        // Get the total number of layers. 
        let numLayers = _JSG.loadedConfig.meta.layers.length;
        
        // Get the total size for _VRAM. (number of layers * 2 bytes per layer * rows * cols)
        let numIndexes = (numLayers * 2) * (dimensions.rows * dimensions.cols);
        
        // Create the _VRAM arraybuffer and the _VRAM dataview.
        if(dimensions.pointersSize == 8){
            this._VRAM      = new ArrayBuffer(numIndexes);
            this._VRAM_view = new Uint8Array(this._VRAM);
        }

        else if(dimensions.pointersSize == 16){
            // 16-bit requires twice the indexes for the ArrayBuffer.
            this._VRAM      = new ArrayBuffer(numIndexes * 2);
            this._VRAM_view = new Uint16Array(this._VRAM);
        }

        // This should not be reached because initChecks would have already caught it.
        else{
            let msg1 = `ERROR: initVram_typedArray: Invalid pointerSize.`;
            console.log(msg1);
            throw msg1;
        }

        // Fill with 0 (tileIndex to 0, tileId to 0 for each layer and x,y coordinate.)
        this._VRAM_view.fill(0);
    },

    // Updates VRAM values and calls addToVramChanges.
    updateVram: function(tileId, x, y, tilesetIndex, layerIndex){
        // Get the tilesetName.
        let tilesetName = _JSG.loadedConfig.meta.tilesets[tilesetIndex];
        if(!tilesetName){ console.log(`updateVram: Tileset index '${tilesetIndex}' was not found.`); return; }
        
        // Update _VRAM_view.
        let VRAM_startIndex = this.indexByCoords[y][x];
        this._VRAM_view[VRAM_startIndex + (layerIndex*2) + 0] = tilesetIndex;
        this._VRAM_view[VRAM_startIndex + (layerIndex*2) + 1] = tileId;
        
        // Add to VRAM changes.
        this.addToVramChanges(x,y);
    },

    // Adds to the changes array. 
    addToVramChanges: function(x, y){
        // Try to find a matching change.
        let change = this.changes.find(c => c[0] == x && c[1] == y);
        
        // Add the change if the x,y is not already on the change list.
        if( !change ){
            // console.log("addToVramChanges: ADDED", x, y);
            this.changes.push([x,y]);
        }

        // Overwrite the existing change.
        else{
            // console.log("addToVramChanges: OVERWRITTEN", x, y);
            change[0] = x; change[1] = y;
        }
    },

    // Clears the changes array.
    clearVramChanges: function(){
        // console.log(`clearVramChanges`);
        this.changes = [];
    },
    
    // Creates the indexByCoords lookup table. 
    create_VRAM_indexByCoords:function(){
        let dimensions = _JSG.loadedConfig.meta.dimensions;
        let numLayers = _JSG.loadedConfig.meta.layers.length;

        // This table is used by updateVram and draw to quickly get the starting VRAM index for a given x and y.
        for(let row=0;row<dimensions.rows;row+=1){
            this.indexByCoords.push([]);
            for(let col=0; col < dimensions.cols; col+=1){
                let index = ( row * ( dimensions.cols * (numLayers+3) ) ) + ( col * (numLayers+3)  );
                this.indexByCoords[row].push(index);
            }
        }
    },

    // Set VRAM to all 0 (The tileId of 0 should be the fully transparent tile in each tileset.)
    clearVram: function(){
        // Get the dimensions.
        let dimensions  = _JSG.loadedConfig.meta.dimensions;
        
        // Get the total number of layers. 
        let numLayers = _JSG.loadedConfig.meta.layers.length;

        // TODO: Is this slow because of all the checks in setTile? 
        // TODO: Use updateVram directly? 
        // Fill the VRAM of each layer with the first tileset's tile 0.
        for(let l=0; l<numLayers; l+=1){
            _GFX.draw.tiles.fillTile(0,  0, 0,  dimensions.cols, dimensions.rows,  0, l);
        }
    },

    // Draws to the app canvas based on the contents of the changes array.
    draw: function(method = 1){
        return new Promise((resolve,reject)=>{
            // Abort if there are no changes. 
            if(!this.changes.length){ resolve(); return; }

            // Get the dimensions.
            let dimensions  = _JSG.loadedConfig.meta.dimensions;

            // Draw changes directly to the destination. 
            if(method == "1"){
                // Go through the VRAM changes.
                for(let i=0; i<this.changes.length; i+=1){
                    // Get the x and y values. 
                    let x = this.changes[i][0];
                    let y = this.changes[i][1];
    
                    // Get the VRAM_start_index
                    let VRAM_startIndex = this.indexByCoords[y][x];
    
                    // Clear the destination.
                    _APP.ctx.clearRect( (x * dimensions.tileWidth), (y * dimensions.tileHeight), (dimensions.tileWidth), (dimensions.tileHeight));
    
                    // Get the tile at each layer and draw the tiles.
                    let numLayers = _JSG.loadedConfig.meta.layers.length;
                    for(let l=0; l<numLayers; l+=1){
                        // Get the tilesetIndex.
                        let tilesetIndex = this._VRAM_view[VRAM_startIndex + (l * 2) + 0];
                        
                        // Get the tileId.
                        let tileId = this._VRAM_view[VRAM_startIndex + (l * 2) + 1];
    
                        // Get the tilesetName.
                        let tilesetName = _JSG.loadedConfig.meta.tilesets[tilesetIndex];
    
                        // Get the tileset.
                        let tileset     = _GFX.cache[tilesetName].tileset;
    
                        // Draw to the canvas. 
                        _APP.ctx.drawImage(tileset[tileId].canvas, (x * dimensions.tileWidth), (y * dimensions.tileHeight));
                    }
                }
    
            }
            // Draw changes to a temp canvas then draw to the destination. 
            else if(method == "2"){
                // Go through the VRAM changes.
                for(let i=0; i<this.changes.length; i+=1){
                    // Create a temp canvas for this change. 
                    let canvas = document.createElement("canvas");
                    canvas.width  = dimensions.tileWidth * dimensions.cols;
                    canvas.height = dimensions.tileHeight * dimensions.rows;
                    let ctx = canvas.getContext("2d", { alpha: true });
                    // _GFX.gfxConversion.setPixelated(ctx);

                    // Get the x and y values. 
                    let x = this.changes[i][0];
                    let y = this.changes[i][1];
    
                    // Get the VRAM_start_index
                    let VRAM_startIndex = this.indexByCoords[y][x];

                    // Get the tile at each layer and draw the tiles.
                    let numLayers = _JSG.loadedConfig.meta.layers.length;
                    for(let l=0; l<numLayers; l+=1){
                        // Get the tilesetIndex.
                        let tilesetIndex = this._VRAM_view[VRAM_startIndex + (l * 2) + 0];
                        
                        // Get the tileId.
                        let tileId = this._VRAM_view[VRAM_startIndex + (l * 2) + 1];
    
                        // Get the tilesetName.
                        let tilesetName = _JSG.loadedConfig.meta.tilesets[tilesetIndex];
    
                        // Get the tileset.
                        let tileset     = _GFX.cache[tilesetName].tileset;
    
                        // Draw to the canvas. 
                        ctx.drawImage(tileset[tileId].canvas, 0, 0);
                    }
                    
                    // Clear the destination.
                    _APP.ctx.clearRect( (x * dimensions.tileWidth), (y * dimensions.tileHeight), (dimensions.tileWidth), (dimensions.tileHeight));
                    
                    // Draw the completed temp canvas to the main canvas.
                    _APP.ctx.drawImage(canvas, (x * dimensions.tileWidth), (y * dimensions.tileHeight));
                }
            }
            // Draw changes to a full temp canvas then draw the full temp canvas to the destination.
            else if(method == "3"){
                // Create a temp canvas for these changes. 
                let canvas = document.createElement("canvas");
                canvas.width  = dimensions.tileWidth * dimensions.cols;
                canvas.height = dimensions.tileHeight * dimensions.rows;
                let ctx = canvas.getContext("2d", { alpha: true });
                // _GFX.gfxConversion.setPixelated(ctx);

                // Go through the VRAM changes.
                for(let i=0; i<this.changes.length; i+=1){
                    // Get the x and y values. 
                    let x = this.changes[i][0];
                    let y = this.changes[i][1];
    
                    // Get the VRAM_start_index
                    let VRAM_startIndex = this.indexByCoords[y][x];

                    // Get the tile at each layer and draw the tiles.
                    let numLayers = _JSG.loadedConfig.meta.layers.length;
                    for(let l=0; l<numLayers; l+=1){
                        // Get the tilesetIndex.
                        let tilesetIndex = this._VRAM_view[VRAM_startIndex + (l * 2) + 0];
                        
                        // Get the tileId.
                        let tileId = this._VRAM_view[VRAM_startIndex + (l * 2) + 1];
    
                        // Get the tilesetName.
                        let tilesetName = _JSG.loadedConfig.meta.tilesets[tilesetIndex];
    
                        // Get the tileset.
                        let tileset     = _GFX.cache[tilesetName].tileset;
    
                        // Draw to the canvas. 
                        ctx.drawImage(tileset[tileId].canvas, (x * dimensions.tileWidth), (y * dimensions.tileHeight));
                    }
                    
                    // Clear the destination.
                    _APP.ctx.clearRect( (x * dimensions.tileWidth), (y * dimensions.tileHeight), (dimensions.tileWidth), (dimensions.tileHeight));
                    
                }

                // Draw the completed temp canvas to the main canvas.
                _APP.ctx.drawImage(canvas, 0, 0);
            }

            // Done drawing. Clear the VRAM changes. 
            this.clearVramChanges();

            resolve();
        });
    },

    // TODO
    // Returns a copy of the specified VRAM region.
    getVramRegion: function(x, y, w, h){
        let vramRegionObj = {};

        //. Get all layers.

        return vramRegionObj;
    },
    
    // TODO
    // Sets the specified VRAM region (usually data from getVramRegion).
    setVramRegion: function(vramRegionObj){
        // this.updateVram();
    },
    
    // Init function for the VRAM object.
    init: async function(){
        return new Promise(async (resolve, reject)=>{
            // Create the lookup table(s) for VRAM.
            this.create_VRAM_indexByCoords();

            // Init the VRAM array.
            this.initVram_typedArray();

            // Clear the VRAM.
            this.clearVram();

            // Draw the VRAM.
            this.draw();

            resolve();
        });
    },
};

// INTERNAL: Functions for drawing tiles/tilemaps text.
_GFX.draw = {
    // Drawing for grid-aligned tiles and tilemaps. 
    tiles: {
        // Set one tile into VRAM.
        setTile : function(tileId, x, y, tilesetIndex, layerIndex){
            // Checks.
            if(tileId == null)      { console.log("setTile: The tileId was not specified."); return; }
            if(x == null)           { console.log("setTile: The x was not specified."); return; }
            if(y == null)           { console.log("setTile: The y was not specified."); return; }
            if(tilesetIndex == null){ console.log("setTile: The tilesetIndex was not specified."); return; }
            if(layerIndex == null)  { console.log("setTile: The layerIndex was not specified."); return; }

            // Make sure that the layerIndex is valid.
            let numLayers = _JSG.loadedConfig.meta.layers.length;
            if(layerIndex < 0 || layerIndex >= numLayers){ console.log("setTile: The layerIndex is not valid."); return;  }

            // Get the tilesetName.
            let tilesetName = _JSG.loadedConfig.meta.tilesets[tilesetIndex];
            if(!tilesetName){ console.log(`setTile: Tileset index '${tilesetIndex}' was not found.`); return; }
            
            // Get the tileset.
            let tileset     = _GFX.cache[tilesetName].tileset;
            if(!tileset){ console.log(`setTile: Tileset '${tilesetName}' was not found.`); return; }

            // Check for the tile. If not found then skip.
            if(undefined == tileset[tileId] || !tileset[tileId].canvas){ console.log(`setTile: Tile canvas for '${tilesetName}':'${tileId}' was not found.`); return; }

            // Get the dimensions.
            let dimensions  = _JSG.loadedConfig.meta.dimensions;

            // Bounds-checking. (Skip any tile that would be written out of bounds.
            let oob_x = x >= dimensions.cols ? true : false;
            let oob_y = y >= dimensions.rows ? true : false;
            if(oob_x){ 
                console.log(`setTile: Out-Of-Bounds on X: x: ${x}, y: ${y}, layerIndex: '${layerIndex}', tilesetName: '${tilesetName}', tileId: '${tileId}'`); 
                return;
            }
            if(oob_y){ 
                console.log(`setTile: Out-Of-Bounds on Y: x: ${x}, y: ${y}, layerIndex: '${layerIndex}', tilesetName: '${tilesetName}', tileId: '${tileId}'`); 
                return;
            }
            
            // "Draw" the tile to VRAM.
            _GFX.VRAM.updateVram(tileId, x, y, tilesetIndex, layerIndex);
        },

        // Set text tiles into VRAM using a text string.
        print : function(str="", x, y, tilesetIndex, layerIndex){
            // NOTE: print assumes that the text tileset's first tilemap is the fontset and that those tiles are generated in ASCII order.

            // Convert to string if the input is a number. 
            if(typeof str == "number"){ str = str.toString(); }
            
            // Loop through the list of chars and draw them.
            let chars = Array.from(str); 
            let dx = x + 0;
            for(let i=0; i<chars.length; i+=1){
                // Convert the ASCII value to a tileId
                let tileId = chars[i].charCodeAt(0) - 32;

                // Add the tile to VRAM via setTile.
                this.setTile(tileId, dx, y, tilesetIndex, layerIndex);
                dx+=1;
            }
        },

        // Fill a rectangular region with one tile. 
        fillTile : function(tileId=" ", x, y, w, h, tilesetIndex, layerIndex){
            // For each row...
            for(let dy=0; dy<h; dy+=1){
                
                // For each col...
                for(let dx=0; dx<w; dx+=1){
                    // Add the tile to VRAM via setTile.
                    this.setTile(tileId, x+dx, y+dy, tilesetIndex, layerIndex);
                }

            }
        },

        // Draw the individual tiles of a tilemap to VRAM.
        drawTilemap : function(tilemapName, x, y, tilesetIndex, layerIndex, rotationIndex=0){
            // Get the tilesetName.
            let tilesetName = _JSG.loadedConfig.meta.tilesets[tilesetIndex];
            if(!tilesetName){ console.log(`drawTilemap: Tileset index '${tilesetIndex}' was not found.`); return; }
            
            // Get the tileset.
            let tileset = _GFX.cache[tilesetName].tileset;
            if(!tileset){ console.log(`drawTilemap: Tileset '${tilesetName}' was not found.`); return; }

            // Get the tilemap object.
            let tilemapObj  = _GFX.cache[tilesetName].tilemap[tilemapName];
            if(!tilemapObj){ console.log("drawTilemap: Tilemap object not found.", tilesetName, tilemapName); return ; }

            // Get the tilemap. 
            let tilemap = tilemapObj[rotationIndex].orgTilemap;

            // Make sure that the tilemap is valid.
            if(!tilemap)               { console.log(`drawTilemap: Tilemap was not found.`); return; }
            if(!Array.isArray(tilemap)){ console.log(`drawTilemap: Tilemap is not an array.`); return; }
            if(!tilemap.length)        { console.log(`drawTilemap: Tilemap has no entries.`); return; }
            if(!tilemap.length > 2)    { console.log(`drawTilemap: Tilemap is not valid.`); return; }

            // The width of the tilemap is first.
            let w = tilemap[0];

            // The height of the tilemap is second.
            let h = tilemap[1];

            // Strip off the width and height from the tilemap.
            let tilesInmap = tilemap.slice(2);

            let index = 0;
            for(let dy=0; dy<h; dy+=1){
                for(let dx=0; dx<w; dx+=1){
                    // Get the next tileId.
                    let tileId =  tilesInmap[index++];

                    // Add the tile to VRAM via setTile.
                    this.setTile(tileId, dx+x, dy+y, tilesetIndex, layerIndex);
                }
            }
        },

        // Draw the individual tiles of a custom tilemap to VRAM.
        drawTilemap_custom : function(x, y, tilesetIndex, layerIndex, tilemap){
            // Get the tilesetName.
            let tilesetName = _JSG.loadedConfig.meta.tilesets[tilesetIndex];
            if(!tilesetName){ console.log(`drawTilemap_custom: Tileset index '${tilesetIndex}' was not found.`); return; }

            // Get the tileset.
            let tileset = _GFX.cache[tilesetName].tileset;
            if(!tileset){ console.log(`drawTilemap_custom: Tileset '${tilesetName}' was not found.`); return; }
            
            // Make sure that the tilemap is valid.
            if(!tilemap)               { console.log(`drawTilemap_custom: Tilemap was not found.`); return; }
            if(!Array.isArray(tilemap)){ console.log(`drawTilemap_custom: Tilemap is not an array.`); return; }
            if(!tilemap.length)        { console.log(`drawTilemap_custom: Tilemap has no entries.`); return; }
            if(!tilemap.length > 2)    { console.log(`drawTilemap_custom: Tilemap is not valid.`); return; }

            // The width of the tilemap is first.
            let w = tilemap[0];

            // The height of the tilemap is second.
            let h = tilemap[1];

            // Strip off the width and height from the tilemap.
            let tilesInmap = tilemap.slice(2);

            let index = 0;
            for(let dy=0; dy<h; dy+=1){
                for(let dx=0; dx<w; dx+=1){
                    // Get the next tileId.
                    let tileId =  tilesInmap[index++];

                    // Add the tile to VRAM via setTile.
                    this.setTile(tileId, dx+x, dy+y, tilesetIndex, layerIndex);
                }
            }
        },

        // Creates a tilemap from a string. (draw with drawTilemap_custom).
        customTilemapFromTextString: function(str, tilesetIndex){
            // NOTE: print assumes that the text tileset's first tilemap is the fontset and that those tiles are generated in ASCII order.

            // Checks.
            if(tilesetIndex == null){ console.log("customTilemapFromTextString: The tilesetIndex was not specified."); return; }

            // Get the tilesetName.
            let tilesetName = _JSG.loadedConfig.meta.tilesets[tilesetIndex];
            if(!tilesetName){ console.log(`customTilemapFromTextString: Tileset index '${tilesetIndex}' was not found.`); return; }

            // Get the tileset.
            let tileset     = _GFX.cache[tilesetName].tileset;
            if(!tileset){ console.log(`customTilemapFromTextString: Tileset '${tilesetName}' was not found.`); return; }

            // Convert to string if the input is a number. 
            if(typeof str == "number"){ str = str.toString(); }

            // Loop through the list of chars and create a custom tilemap.
            let chars = Array.from(str); 
            let w = chars.length;
            let h = 1;
            let newTilemap = [ w, h ];
            for(let i=0; i<chars.length; i+=1){
                // Convert the ASCII value to a tileId
                let tileId = chars[i].charCodeAt(0) - 32;
                
                // Add the tileId to the newTilemap.
                newTilemap.push(tileId);
            }

            // Return the completed tilemap.
            return newTilemap;
        },
    },

    // TODO: SPRITES.
    // Drawing for non-grid-aligned tiles and tilemaps. 
    sprites:{
    },

    // Init function for the draw object.
    init: async function(parent){
        return new Promise(async (resolve, reject)=>{
            resolve();
        });
    },
};

// INTERNAL: Performs the graphics conversion from json to tiles and stores the data in _GFX.cache. 
_GFX.gfxConversion = {
    // Convert rgb332 pixel to rgb32 object.
    rgb332_to_rgb32 : function(rgb332_byte) {
        let nR = ( ((rgb332_byte >> 0) & 0b00000111) * (255 / 7) ) << 0; // red
        let nG = ( ((rgb332_byte >> 3) & 0b00000111) * (255 / 7) ) << 0; // green
        let nB = ( ((rgb332_byte >> 6) & 0b00000011) * (255 / 3) ) << 0; // blue
        return { r: nR, g: nG, b: nB, a: 255 };
    },

    // Set pixelated values on the specified ctx.
    setPixelated: function(ctx){
        ctx.mozImageSmoothingEnabled    = false; // Firefox
        ctx.imageSmoothingEnabled       = false; // Firefox
        ctx.oImageSmoothingEnabled      = false; //
        ctx.webkitImageSmoothingEnabled = false; //
        ctx.msImageSmoothingEnabled     = false; //
    },

    // Converts tileset tile data to canvas and stores in _GFX.cache.
    convertTileset: function(jsonTileset){
        for(let index in jsonTileset.tileset){
            // Get the tileData.
            let tileData = jsonTileset.tileset[index];

            // Go through each pixel.
            let tilePixels = [];
            for(let i=0; i<tileData.length; i+=1){
                let rgb32 = {};
                let rgb332_byte = tileData[i];

                if(!isNaN(jsonTileset.config.translucent_color) && rgb332_byte == jsonTileset.config.translucent_color){
                    rgb32.r = 0 ;
                    rgb32.g = 0 ;
                    rgb32.b = 0 ;
                    rgb32.a = 0 ;
                }
                else{
                    rgb32 = this.rgb332_to_rgb32(rgb332_byte);
                    rgb32.r = rgb32.r ;
                    rgb32.g = rgb32.g ;
                    rgb32.b = rgb32.b ;
                    rgb32.a = rgb32.a ;
                }
                tilePixels.push(rgb32);
            }

            // Use the pixel data to create imageData for the tile canvas.
            let tileCanvas = document.createElement("canvas");
            tileCanvas.width = jsonTileset.config.tileWidth;
            tileCanvas.height = jsonTileset.config.tileHeight;
            tileCanvas.title = index;
            let tileCtx    = tileCanvas.getContext('2d');
            this.setPixelated(tileCanvas);
            this.setPixelated(tileCtx);
            let tileImageData = tileCtx.createImageData(jsonTileset.config.tileWidth, jsonTileset.config.tileHeight);
            
            // Create the image data for this tile. 
            for(let p in tilePixels){
                tileImageData.data[ (p*4) + 0 ] = tilePixels[p].r;
                tileImageData.data[ (p*4) + 1 ] = tilePixels[p].g;
                tileImageData.data[ (p*4) + 2 ] = tilePixels[p].b;
                tileImageData.data[ (p*4) + 3 ] = tilePixels[p].a ? 255 : 0;
            }
            tileCtx.putImageData(tileImageData, 0, 0);

            // Add this tile object to the list.
            _GFX.cache[jsonTileset.tilesetName].tileset.push( { canvas:tileCanvas, ctx:tileCtx } );
        }
    },

    // Converts tileset tilemap data to canvas and stores in _GFX.cache.
    convertTilemaps: function(jsonTileset){
        for(let key in jsonTileset.tilemaps){
            // Get the tilemap data.
            let tilemap = jsonTileset.tilemaps[key];
            
            // The width of the tilemap is first.
            let w = tilemap[0];
            
            // The height of the tilemap is second.
            let h = tilemap[1];

            // Strip off the width and height from the tilemap.
            tilemap = tilemap.slice(2);

            // If a tilemap has no tiles in it then skip it. 
            if(!tilemap.length){ console.log(`WARNING: Skipping empty tilemap: ${key}.`); return; }

            let tilemapCanvas = document.createElement("canvas");
            tilemapCanvas.width  = w * jsonTileset.config.tileWidth;
            tilemapCanvas.height = h * jsonTileset.config.tileHeight;
            tilemapCanvas.title = key;
            let tilemapCtx    = tilemapCanvas.getContext('2d');
            this.setPixelated(tilemapCanvas);
            this.setPixelated(tilemapCtx);
            
            // Create a tilemap image canvas out of tiles for each tilemap.
            let index = 0;
            for(let y=0; y<h; y+=1){
                for(let x=0; x<w; x+=1){
                    let tileId =  tilemap[index];
                    let canvas = _GFX.cache[jsonTileset.tilesetName].tileset[ tileId ].canvas;
                    let dx = x * jsonTileset.config.tileWidth ;
                    let dy = y * jsonTileset.config.tileHeight;
                    tilemapCtx.drawImage( canvas, dx, dy );
                    index += 1 ;
                }
            }

            // Create the empty key.
            _GFX.cache[jsonTileset.tilesetName].tilemap[key] = [];

            // Push to the key.
            _GFX.cache[jsonTileset.tilesetName].tilemap[key].push( { 
                canvas    : tilemapCanvas, // TODO: Unsure if I intend to keep these.
                ctx       : tilemapCtx,    // TODO: Unsure if I intend to keep these.
                orgTilemap: [ w, h, ...tilemap ],
            } );
        }
    },

    // This runs the tile/tilemap conversions.
    generateAndCache_tileSetData: function(){
        return new Promise(async (resolve, reject)=>{
            // Create tileset config references.
            for(let i=0; i<_JSG.loadedConfig.meta.tilesets.length; i+=1){
                // Make sure that the required file is loaded.
                if(!_APP.files[_JSG.loadedConfig.meta.tilesets[i]]){ 
                    console.log("ERROR: Tileset file not loaded:", _JSG.loadedConfig.meta.tilesets[i]); 
                    continue; 
                }

                // Get the json tileset data.
                let jsonTileset = _APP.files[_JSG.loadedConfig.meta.tilesets[i]];

                // Get the tilesetName. 
                let tilesetName = jsonTileset.tilesetName;
                
                // Tile data: Parse/convert the JSON-string(s) to Uint8Array.
                for(let tileId in jsonTileset.tileset){ jsonTileset.tileset[tileId] = new Uint8Array( JSON.parse(jsonTileset.tileset[tileId]) ); }

                // Tilemap data: Parse/convert the JSON-string(s) to Uint8Array.
                for(let key in jsonTileset.tilemaps){ jsonTileset.tilemaps[key] = new Uint8Array( JSON.parse(jsonTileset.tilemaps[key]) ); }

                // Create the initial placeholder structure for this tileset. 
                _GFX.cache[tilesetName] = {
                    tileset: [],
                    tilemap: {},
                    json: {
                        config  : jsonTileset.config,
                        tileset : jsonTileset.tileset,
                        tilemaps: jsonTileset.tilemaps,
                    },
                };

                let tss, tse;

                // Convert the tileset.
                tss = performance.now(); 
                this.convertTileset(jsonTileset);
                tse = performance.now(); 
                let msg1 = `TILESET : ${tilesetName}: Conversion : ${(tse-tss).toFixed(2)}ms`;
                _JSG.loadingDiv.addMessageChangeStatus(`  videoModeA: convert tileset data: ${msg1}`, "loading");
                
                // Convert the tilemaps.
                tss = performance.now(); 
                this.convertTilemaps(jsonTileset);
                tse = performance.now(); 
                let msg2 = `TILEMAPS: ${tilesetName}: Conversion : ${(tse-tss).toFixed(2)}ms`;
                _JSG.loadingDiv.addMessageChangeStatus(`  videoModeA: convert tilemap data: ${msg2}`, "loading");
            }
            resolve();
        });
    },

    // Init function for the gfxConversion object.
    init: async function(parent){
        return new Promise(async (resolve, reject)=>{
            // Init(s).
            await this.generateAndCache_tileSetData();

            resolve();
        });
    },
};

// INTERNAL: Certain values must be in the appConfig.json file. This checks those values. 
_GFX.initChecks = function(){
    let tests = {
        hasMeta: { 
            test: function(){ if(undefined ==_JSG.loadedConfig.meta){ throw ""; } }, 
            desc:"meta is defined", 
            pass:true, 
        },
        hasDimensions: {
            test: function(){ 
                let dimensions = _JSG.loadedConfig.meta.dimensions;
                if(undefined == dimensions)                      { throw ""; } 
                if(undefined == dimensions.tileWidth)            { throw ""; } 
                if(undefined == dimensions.tileHeight)           { throw ""; } 
                if(undefined == dimensions.rows)                 { throw ""; } 
                if(undefined == dimensions.cols)                 { throw ""; } 
                if(undefined == dimensions.pointersSize)         { throw ""; } 
                if([8,16].indexOf(dimensions.pointersSize) == -1){ throw ""; } 
            }, 
            desc:"meta.dimensions is valid", 
            pass:true, 
        },
        hasTilesets: {
            test: function(){ 
                if(undefined == _JSG.loadedConfig.meta.tilesets){ throw ""; } 
                try{ _JSG.loadedConfig.meta.tilesets.length ? true : false; } catch(e){ throw ""; }
            }, 
            desc:"meta.tilesets is valid", 
            pass:true, 
        },
        numLayersDefined: { 
            test: function(){ if(undefined == _JSG.loadedConfig.meta.layers){ throw ""; } }, 
            desc:"meta.layers is defined", 
            pass:true, 
        },
        numLayersLength:  { 
            test: ()=>{ try{ _JSG.loadedConfig.meta.layers.length ? true : false; } catch(e){ throw ""; } }, 
            desc:"meta.layers has values", 
            pass:true, 
        },
    };

    for(let key in tests){
        let test = tests[key];
        try{ 
            test.test(); 
            // let msg1 = `initChecks: PASSED TEST: '${test.desc}'`;
            // _JSG.loadingDiv.addMessage(`  videoModeA: ${msg1}`);
            // console.log(msg1);
            test.pass = true;
        }
        catch(e){
            let msg1 = `initChecks: FAILED TEST: '${test.desc}': `;
            _JSG.loadingDiv.addMessage(`  videoModeA: ${msg1}`);
            console.log(msg1);
            test.pass = false;
        }
    };

    return tests;
};

// INTERNAL: Init the graphics mode and perform conversions. 
_GFX.init = async function(){
    return new Promise(async (resolve, reject)=>{
        // Do the init checks. 
        let initChecks = this.initChecks();
        
        // Determine if any init checks have failed. 
        let initChecksAllPassed = true;
        for(let key in initChecks){ 
            if( !initChecks[key].pass ){ initChecksAllPassed = false; break; } 
        }

        // Display init check failure messages. 
        if(!initChecksAllPassed){
            let msg1 = "initChecks: Test(s) have failed. Cannot continue.";
            _JSG.loadingDiv.addMessageChangeStatus(`  videoModeA: ${msg1}`, "error");
            console.log(msg1, initChecks);
            reject(); return; 
        }
        else{
            let msg1 = `initChecks: All test(s) have passed.`;
            _JSG.loadingDiv.addMessageChangeStatus(`  videoModeA: ${msg1}`, "loading");
            console.log(msg1, initChecks);
        }

        // Init(s).
        _JSG.shared.timeIt.stamp("gfxConversion", "s", "_GFX_INITS"); 
        await this.gfxConversion.init(this); 
        _JSG.shared.timeIt.stamp("gfxConversion", "e", "_GFX_INITS");

        _JSG.shared.timeIt.stamp("draw", "s", "_GFX_INITS"); 
        await this.draw.init(this);          
        _JSG.shared.timeIt.stamp("draw", "e", "_GFX_INITS");

        _JSG.shared.timeIt.stamp("VRAM", "s", "_GFX_INITS"); 
        await this.VRAM.init(this);          
        _JSG.shared.timeIt.stamp("VRAM", "e", "_GFX_INITS");


        // DEBUG:
        // this._debug.drawTest_setTile();
        // this._debug.drawTest_fillTile();
        // this._debug.drawTest_print();
        // this._debug.drawTest_drawTilemap();

        resolve();
    });
};
