/**
Video Mode A


*/
_GFX = {
    // Tests, etc.
    _debug: {
        drawTest_setTile: function(){
            // TEST: setTile:
            // tileId, x, y, tilesetIndex, layerIndex=0
            _GFX.draw.tiles.setTile(1,  0, 0,  3, 0);
            _GFX.draw.tiles.setTile(2,  1, 0,  3, 1);
            _GFX.draw.tiles.setTile(3,  2, 0,  3, 2);
            _GFX.draw.tiles.setTile(4,  3, 0,  2, 0);
            _GFX.draw.tiles.setTile(5,  4, 0,  2, 1);
            _GFX.draw.tiles.setTile(6,  5, 0,  2, 2);

            // Draw from VRAM:
            _GFX.VRAM.draw();
        },
        drawTest_fillTile: function(){
            // TEST: fillTile:
            _GFX.draw.tiles.fillTile(10,  19, 0,  8, 5,  2, 2);

            // Draw from VRAM:
            _GFX.VRAM.draw();
        },
        drawTest_print: function(){
            // TEST: print:
            _GFX.draw.tiles.print("Test of VideoModeA",  0, 1,  2, 0);

            // TEST: print:
            let testStrings = [
                " !\"#$%&'()*+,-,/",
                "0123456789",
                ":;<=>?@",
                "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
                "[\\]^_`",
                "abcdefghijklmnopqrstuvwxyz",
                "{|}~",
            ];
            let x=0; 
            let y=3;
            for(let i=0; i<testStrings.length; i+=1){
                // tilesTX1 
                _GFX.draw.tiles.print(testStrings[i], x, y, 2, 2);

                // tilesTX2
                _GFX.draw.tiles.print(testStrings[i], x, y+8, 3, 2);
                y+=1;
            }

            // Draw from VRAM:
            _GFX.VRAM.draw();
        },
        drawTest_drawTilemap: function(){
            // TEST: drawTilemap:
            _GFX.draw.tiles.drawTilemap("dpad_all_off", 0, 22, 0, 2);
            _GFX.draw.tiles.drawTilemap("n782_text_f1", 20, 9, 0, 2);

            // Draw from VRAM:
            _GFX.VRAM.draw();
        },

        // Speed tests for each VRAM.draw "method".
        drawMethodTests: {
            // EXAMPLE USAGE: _GFX._debug.drawMethodTests.run();

            // Holds the timings of each draw run. 
            times: {
                method1:[], // 6.05ms - 6.35ms (0.30ms range.)
                method2:[], // 6.01ms - 6.25ms (0.24ms range.)
                method3:[], // 5.99ms - 6.14ms (0.15ms range.)
            },
            method1: async function(){
                let id;
    
                // Method1
                for(let i=0; i<500; i+=1){
                    let ts = performance.now();
                    _GFX._debug.drawTest_print(); 
                    await _GFX.VRAM.draw(1);
                    let te = performance.now();
                    if(te-ts != 0){
                        this.times.method1.push(te-ts);
                    }
                }
                let avg = this.times.method1.reduce((a,b)=>a+b)/this.times.method1.length;
                console.log("method1: avg:", avg);
            },
            method2: async function(){
                // Method2
                for(let i=0; i<500; i+=1){
                    let ts = performance.now();
                    _GFX._debug.drawTest_print(); 
                    await _GFX.VRAM.draw(1);
                    let te = performance.now();
                    if(te-ts != 0){
                        this.times.method2.push(te-ts);
                    }
                }
                let avg = this.times.method2.reduce((a,b)=>a+b)/this.times.method2.length;
                console.log("method2: avg:", avg);
            },
            method3: async function(){
                let id;
    
                // Method3
                for(let i=0; i<500; i+=1){
                    let ts = performance.now();
                    _GFX._debug.drawTest_print(); 
                    await _GFX.VRAM.draw(1);
                    let te = performance.now();
                    if(te-ts != 0){
                        this.times.method3.push(te-ts);
                    }
                }
                let avg = this.times.method3.reduce((a,b)=>a+b)/this.times.method3.length;
                console.log("method3: avg:", avg);
            },

            // Run this to run the tests.
            run: async function(){
                // Clear the time records. 
                this.times.method1 = [];
                this.times.method2 = [];
                this.times.method3 = [];

                // Specify how many times to run each test.
                let numberOfRuns = 2;

                // Run tests using requestAnimationFrame.
                console.log("Running tests using requestAnimationFrame.");
                for(let i=0; i<numberOfRuns; i+=1){ await new Promise( async(res,rej)=>{ window.requestAnimationFrame( async ()=> { await _GFX._debug.drawMethodTests.method1(); res(); } ) } ); } 
                for(let i=0; i<numberOfRuns; i+=1){ await new Promise( async(res,rej)=>{ window.requestAnimationFrame( async ()=> { await _GFX._debug.drawMethodTests.method2(); res(); } ) } ); } 
                for(let i=0; i<numberOfRuns; i+=1){ await new Promise( async(res,rej)=>{ window.requestAnimationFrame( async ()=> { await _GFX._debug.drawMethodTests.method3(); res(); } ) } ); } 
                
                // Run tests WITHOUT using requestAnimationFrame.
                console.log("Running tests WITHOUT using requestAnimationFrame.");
                for(let i=0; i<numberOfRuns; i+=1){ await new Promise( async(res,rej)=>{ await _GFX._debug.drawMethodTests.method1(); res(); } ); } 
                for(let i=0; i<numberOfRuns; i+=1){ await new Promise( async(res,rej)=>{ await _GFX._debug.drawMethodTests.method2(); res(); } ); } 
                for(let i=0; i<numberOfRuns; i+=1){ await new Promise( async(res,rej)=>{ await _GFX._debug.drawMethodTests.method3(); res(); } ); } 
            },
        },
    },

    // Canvas caches of tiles, tilemaps, config.
    cache:{},

    // VRAM - Holds graphics states.
    VRAM: {
        // One flat array to hold the VRAM state (includes tileset and tileId for each "layer".)
        indexes: [],

        // Lookup table: Get VRAM index by y, x.
        indexByCoords:[],

        // Holds the changes to VRAM that will be drawn on the next draw cycle.
        changes: [],
        
        initVramIndexes: function(){
            // Get the dimensions.
            let dimensions  = _JSG.loadedConfig.meta.dimensions;

            // Get the total number of layers. 
            let numLayers = _JSG.loadedConfig.meta.layers.length;
            
            // Get the total number of VRAM indexes. 
            let numIndexes = (numLayers * 2) * (dimensions.rows * dimensions.cols);
            
            // Create the indexes array.
            for(let i=0; i<numIndexes; i+=1){
                // This will set each layer to tilesetIndex 0, tileId 0. 
                this.indexes.push(0);
            }
        },

        // Updates VRAM values and calls addToVramChanges.
        updateVram: function(tileId, x, y, tilesetIndex, layerIndex){
            // Get the tilesetName.
            let tilesetName = _JSG.loadedConfig.meta.tilesets[tilesetIndex];
            if(!tilesetName){ console.log(`updateVram: Tileset index '${tilesetIndex}' was not found.`); return; }
            
            // Update VRAM indexes.
            let VRAM_startIndex = this.indexByCoords[y][x];
            this.indexes[VRAM_startIndex + (layerIndex*2) + 0] = tilesetIndex;
            this.indexes[VRAM_startIndex + (layerIndex*2) + 1] = tileId;
            
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
            if(!numLayers){ 
                console.log("No layers have been defined. Cannot continue.");
                return; 
            }

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
                            let tilesetIndex = this.indexes[VRAM_startIndex + (l*2) + 0];
                            
                            // Get the tileId.
                            let tileId = this.indexes[VRAM_startIndex + (l*2) + 1];
        
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

                        // Get the x and y values. 
                        let x = this.changes[i][0];
                        let y = this.changes[i][1];
        
                        // Get the VRAM_start_index
                        let VRAM_startIndex = this.indexByCoords[y][x];

                        // Get the tile at each layer and draw the tiles.
                        let numLayers = _JSG.loadedConfig.meta.layers.length;
                        for(let l=0; l<numLayers; l+=1){
                            // Get the tilesetIndex.
                            let tilesetIndex = this.indexes[VRAM_startIndex + (l*2) + 0];
                            
                            // Get the tileId.
                            let tileId = this.indexes[VRAM_startIndex + (l*2) + 1];
        
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
                            let tilesetIndex = this.indexes[VRAM_startIndex + (l*2) + 0];
                            
                            // Get the tileId.
                            let tileId = this.indexes[VRAM_startIndex + (l*2) + 1];
        
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

        // Init function for the VRAM object.
        init: async function(){
            return new Promise(async (resolve, reject)=>{
                let numLayers = _JSG.loadedConfig.meta.layers.length;
                if(!numLayers){ 
                    console.log("No layers have been defined. Cannot continue.");
                    return; 
                }

                // Create the lookup table(s) for VRAM.
                this.create_VRAM_indexByCoords();

                // Init the VRAM array.
                this.initVramIndexes();

                // Clear the VRAM.
                this.clearVram();

                // Draw the VRAM.
                this.draw();

                resolve();
            });
        },
    },

    // Functions for drawing tiles/tilemaps text.
    draw: {
        parent: null,

        // Drawing for grid-aligned tiles and tilemaps. 
        tiles: {
            parent: null,

            // Set one tile into VRAM.
            setTile : function(tileId, x, y, tilesetIndex, layerIndex){
                // Checks.
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
                if(!tileset[tileId].canvas){ console.log(`setTile: Tile canvas for '${tilesetName}':'${tileId}' was not found.`); return; }

                // Get the dimensions.
                let dimensions  = _JSG.loadedConfig.meta.dimensions;

                // Bounds-checking. (Ignore further chars on x if oob. Ignore oob on y too.)
                let oob_x = x >= dimensions.cols ? true : false;
                let oob_y = y >= dimensions.rows ? true : false;
                if(oob_x){ 
                    console.log(`oob_x:${x} >> x:${x}, y${y}, tilesetName: '${tilesetName}', tileId: '${tileId}', layerIndex: '${layerIndex}'`); 
                    return;
                }
                if(oob_y){ 
                    console.log(`oob_y:${y} >> x:${x}, y${y}, tilesetName: '${tilesetName}', tileId: '${tileId}', layerIndex: '${layerIndex}'`); 
                    return;
                }
                
                // "Draw" the tile to VRAM.
                _GFX.VRAM.updateVram(tileId, x, y, tilesetIndex, layerIndex);
            },
            // Set text tiles into VRAM using a text string.
            print : function(str="", x, y, tilesetIndex, layerIndex, ){
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
                for(let dy=0; dy<h; dy+=1){
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

                // The width of the tilemap is first.
                let w = tilemap[0];

                // The height of the tilemap is second.
                let h = tilemap[1];

                // Strip off the width and height from the tilemap.
                tilemap = tilemap.slice(2);

                let index = 0;
                for(let dy=0; dy<h; dy+=1){
                    for(let dx=0; dx<w; dx+=1){
                        // Get the next tileId.
                        let tileId =  tilemap[index++];

                        // Add the tile to VRAM via setTile.
                        this.setTile(tileId, dx+x, dy+y, tilesetIndex, layerIndex);
                    }
                }
            },
        },

        // TODO: SPRITES.
        // Drawing for non-grid-aligned tiles and tilemaps. 
        sprites:{
            parent: null,

        },

        // Init function for the draw object.
        init: async function(parent){
            return new Promise(async (resolve, reject)=>{
                // Set parent(s).
                this.parent = parent;
                this.tiles.parent = parent;
                this.sprites.parent = parent;

                resolve();
            });
        },
    },

    // Performs the graphics conversion from json to tiles and stores the data in _GFX.cache. 
    gfxConversion: {
        parent: null,

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
                // Convert the array string back to an array.
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
                this.parent.cache[jsonTileset.tilesetName].tileset.push( { canvas:tileCanvas, ctx:tileCtx } );
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
                        let canvas = this.parent.cache[jsonTileset.tilesetName].tileset[ tileId ].canvas;
                        let dx = x * jsonTileset.config.tileWidth ;
                        let dy = y * jsonTileset.config.tileHeight;
                        tilemapCtx.drawImage( canvas, dx, dy );
                        index += 1 ;
                    }
                }

                // Create the empty key.
                this.parent.cache[jsonTileset.tilesetName].tilemap[key] = [];

                // Push to the key.
                this.parent.cache[jsonTileset.tilesetName].tilemap[key].push( { 
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
                    
                    // Tile data: Parse/convert the JSON-string(s).
                    for(let tileId in jsonTileset.tileset){ jsonTileset.tileset[tileId] = JSON.parse(jsonTileset.tileset[tileId]); }

                    // Tilemap data: Parse/convert the JSON-string(s).
                    for(let key in jsonTileset.tilemaps){ jsonTileset.tilemaps[key] = JSON.parse(jsonTileset.tilemaps[key]); }

                    // Create the initial placeholder structure for this tileset. 
                    this.parent.cache[tilesetName] = {
                        tileset: [],
                        tilemap: {},
                        config: jsonTileset.config,
                    };

                    let tss, tse;

                    // Convert the tileset.
                    tss = performance.now(); 
                    this.convertTileset(jsonTileset);
                    tse = performance.now(); 
                    let msg1 = `TILESET : ${tilesetName}: Conversion : ${(tse-tss).toFixed(2)}ms`;
                    _JSG.loadingDiv.addMessageChangeStatus(`  ${_JSG.loadedAppKey}: convert tileset data: ${msg1}`, "loading");
                    
                    // Convert the tilemaps.
                    tss = performance.now(); 
                    this.convertTilemaps(jsonTileset);
                    tse = performance.now(); 
                    let msg2 = `TILEMAPS: ${tilesetName}: Conversion : ${(tse-tss).toFixed(2)}ms`;
                    _JSG.loadingDiv.addMessageChangeStatus(`  ${_JSG.loadedAppKey}: convert tilemap data: ${msg2}`, "loading");
                }
                resolve();
            });
        },

        // Init function for the gfxConversion object.
        init: async function(parent){
            return new Promise(async (resolve, reject)=>{
                // Parent(s).
                this.parent = parent;
                
                // Init(s).
                await this.generateAndCache_tileSetData();

                resolve();
            });
        },
    },

    // Init the graphics mode and perform conversions. 
    init: async function(){
        return new Promise(async (resolve, reject)=>{
            // Parent(s).
            // this.parent = parent;
            
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
    },
};