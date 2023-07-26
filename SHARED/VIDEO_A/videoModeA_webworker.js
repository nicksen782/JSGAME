'use strict';

// Holds a version of the parent's _GFX data.
let _GFX = {
    // SHARED
    timeItData: {},
    timeIt: function(key, func, value=0){
        // funcs: "start", "stop", "get", "reset", "set"

        // _APP.utility.timeIt("KEY_NAME", "start");
        // _APP.utility.timeIt("KEY_NAME", "stop");
        // _APP.utility.timeIt("KEY_NAME", "get");
        // _APP.utility.timeIt("KEY_NAME", "reset");
        // _APP.utility.timeIt("KEY_NAME", "set", 14);
        // _APP.utility.timeIt("", "getAll");
        
        if     (func == "start"){
            this.timeItData[key] = { t:0, s:performance.now(), e:0 };
            return this.timeItData[key].t;
        }
        else if(func == "stop"){
            this.timeItData[key].e = performance.now();
            this.timeItData[key].t = this.timeItData[key].e - this.timeItData[key].s;
            return this.timeItData[key].t;
        }
        else if(func == "get"){
            return this.timeItData[key] ? this.timeItData[key].t : 0;
        }
        else if(func == "set"){
            return this.timeItData[key].t = value;
        }
        else if(func == "getAll"){
            let data = {};
            for(let key in this.timeItData){ data[key] = this.timeItData[key].t; }
            return data;
        }
        else if(func == "reset"){
            this.timeItData[key] = { t:0, s:0, e:0 };
            return this.timeItData[key].t;
        }
    },
    returnInitTimes: function(){
        let timings = {
            createCtxAndClears    : _GFX.timeIt("createCtxAndClears", "get"),
            createTilesetCanvases : _GFX.timeIt("createTilesetCanvases", "get"),
            // fadeCreateAtStart     : _GFX.timeIt("fadeCreateAtStart", "get"),
            createFadeValues      : _GFX.timeIt("createFadeValues", "get"),
            convertAllFadeTilesets: _GFX.timeIt("convertAllFadeTilesets", "get"),
            // __ALL    : _GFX.timeIt("", "getAll"),
        }

        self.postMessage( {  
            "mode" : "returnInitTimes", 
            "data" : timings, 
        }, [] );
    },

    cache:undefined,
    VRAM:{
        _VRAM        : undefined,
        indexByCoords: undefined,
    },
    canvasLayers:[],
    gfxConversion : {
        // TODO: UNUSED?
        // Convert rgb32 object to rgb332 pixel.
        rgb32_to_RGB332: function(R, G, B){
            // Convert the RGB value to RGB332 as hex string. (Jubation)
            // #define SQ_COLOR8(r, g, b) (((r >> 5) & 0x07U) | ((g >> 2) & 0x38U) | ((b) & 0xC0U))
            // var index = ((R >> 5) & 0x07) | ((G >> 2) & 0x38) | ((B) & 0xC0);
        
            // Convert the RGB value to RGB332 as hex string. (original)
            var rgb332 = (B & 0xc0) + ((G >> 2) & 0x38) + (R >> 5);
        
            return rgb332;
        },
    
        // TODO: UNUSED?
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
    },
    meta:{
        layers: undefined,
        dimensions: undefined,
        videoModeA_config: undefined,
    },

    fade: {
        isEnabled: false,
        inited: false,
        convertForTileset: async function(tilesetName){
            return new Promise(async (resolve,reject)=>{
                let i_32 = new Uint16Array(1);
                let maxRed   ;
                let maxGreen ;
                let maxBlue  ;

                // Get the tileset data.
                let tilesetObj = _GFX.cache[tilesetName];
                let tiles = tilesetObj.tileset;

                // Canvas to be a strip of tiles.length tiles wide and one tile tall.
                let tileset_canvas = new OffscreenCanvas(_GFX.meta.dimensions.tileWidth * tiles.length, _GFX.meta.dimensions.tileHeight * 1);
                let tileset_ctx = tileset_canvas.getContext('2d');

                // Draw all tiles in the tileset to the canvas strip.
                for(let ti=0, tl=tiles.length; ti<tl; ti+=1){
                    // Draw the tile. 
                    tileset_ctx.drawImage(tiles[ti].canvas, ti*_GFX.meta.dimensions.tileWidth, 0);
                    
                    // Create the fadeTiles array if it does not already exist. 
                    if(!tiles[ti].fadeTiles){ tiles[ti].fadeTiles = []; }
                }

                // Convert the entire canvas to each fade level.
                let tileset_ImageData = tileset_ctx.getImageData(0, 0, tileset_canvas.width, tileset_canvas.height).data;
                let len = tileset_ImageData.byteLength;

                for(let levelI=0, levelL=_GFX.fade.CONSTS.fadeTable.length; levelI<levelL; levelI+=1){
                    // Skip the creation of the full color and black version of the tile (save some RAM since the draw2logic can already handle this.)
                    if(levelI == 0 || levelI == _GFX.fade.CONSTS.fadeTable.length -1){ continue; }

                    // Create empty image data.
                    let fade_canvas = new OffscreenCanvas(tileset_canvas.width, tileset_canvas.height);
                    let fade_ctx = fade_canvas.getContext("2d");
                    let fadeImageData = tileset_ctx.createImageData( tileset_canvas.width, tileset_canvas.height );
                    
                    // Get the max for red, green, and blue fade level values.
                    let fadeColorObj = _GFX.fade.CONSTS.fadeTable[levelI];
                    maxRed   = fadeColorObj[2] / 100; // 
                    maxGreen = fadeColorObj[1] / 100; // 
                    maxBlue  = fadeColorObj[0] / 100; // 

                    // Create a 32-bit unsigned view to the image data.
                    let img_view32 = new Uint32Array(fadeImageData.data.buffer);
                    
                    // Set the 32-bit view's index to 0.
                    i_32[0] = 0;
    
                    // Convert the tileset_ImageData into the new fadeImageData.
                    for(let i=0; i<len; i+=4){
                        // Any fully transparent pixel can be skipped.
                        if(tileset_ImageData[i+3]==0){ i_32[0] +=1; continue; }

                        // Replace colors (32-bit)
                        // Explanation: 
                        //   Multiply the rgb values individually by their max (percentage of color.)
                        //   Use << 0 to ensure an integer.
                        //   Use bitshifting to create one 32-bit value out of the individual 8-bit values. 
                        img_view32[i_32[0]] =
                            ( ( (tileset_ImageData[i+3]           ) << 0 ) << 24) | // alpha
                            ( ( (tileset_ImageData[i+2] * maxBlue ) << 0 ) << 16) | // blue
                            ( ( (tileset_ImageData[i+1] * maxGreen) << 0 ) <<  8) | // green
                            ( ( (tileset_ImageData[i+0] * maxRed  ) << 0 )      )   // red
                        ;

                        //
                        i_32[0]+=1;
                    }

                    // Write the image data to the fade canvas. 
                    fade_ctx.putImageData( fadeImageData, 0, 0 );

                    // Break out the individual tiles and save them to tiles[ti].fadeTiles.
                    for(let ti=0, tl=tiles.length; ti<tl; ti+=1){
                        // Create new canvas.
                        let canvas = new OffscreenCanvas(_GFX.meta.dimensions.tileWidth, _GFX.meta.dimensions.tileHeight);
                        let ctx    = canvas.getContext("2d");

                        // Draw the image to the canvas. 
                        ctx.drawImage(fade_canvas, ti*_GFX.meta.dimensions.tileWidth, 0, _GFX.meta.dimensions.tileWidth, _GFX.meta.dimensions.tileHeight, 0, 0, _GFX.meta.dimensions.tileWidth, _GFX.meta.dimensions.tileHeight);

                        // Add the tile.
                        tiles[ti].fadeTiles.push({
                            canvas   : canvas,
                            fadeLevel: levelI,
                        });
                    }
                }
                resolve();
            });
        },
        convertAllTilesets: async function(type){
            // Create faded versions of each tile. 
            let proms = [];
            for(let tilesetName in _GFX.cache){
                let tilesetObj = _GFX.cache[tilesetName];
                let tiles = tilesetObj.tileset;
                proms.push(
                    new Promise(async (res,rej)=>{
                        let ts = performance.now();
                        await _GFX.fade.convertForTileset(tilesetName);
                        let msg = `Created fade tileset: ${tilesetName}, length: ${tiles.length.toString().padStart(4, " ")} tiles. (${(performance.now()-ts).toFixed(2)}ms)`;
                        // if(type=="init"){
                        //     self.postMessage( {  "mode" : "loading_progress", "data" : msg, }, [] );
                        // }
                        // console.log(msg);
                        res();
                    })
                );
            }
            await Promise.all(proms);
        },

        previousFadeIndex: 0, // TODO: No used in the WebWorker?
        currentFadeIndex : 0, 

        CONSTS : {
            // Fade table created by tim1724 
            // http://uzebox.org/forums/viewtopic.php?p=2232#p2232
            // https://github.com/Uzebox/uzebox/blob/88991dbd76d3dd8590c1e18a47be0f7169049294/kernel/uzeboxVideoEngine.c#L259
            srcFadeTable: [
                //    // INDEX // DEC // B G R // BB GGG RRR // B%  G%  R%  
                0x00, //     0 // 0   // 0 0 0 // 00 000 000 // 0   0   0   
                0x40, //     1 // 64  // 1 0 0 // 01 000 000 // 33  0   0   
                0x88, //     2 // 136 // 2 1 0 // 10 001 000 // 66  14  0   
                0x91, //     3 // 145 // 2 2 1 // 10 010 001 // 66  28  14  
                0xD2, //     4 // 210 // 3 2 2 // 11 010 010 // 100 28  28  
                0xE4, //     5 // 228 // 3 4 4 // 11 100 100 // 100 57  57  
                0xAD, //     6 // 173 // 2 5 5 // 10 101 101 // 66  71  71  
                0xB5, //     7 // 181 // 2 6 5 // 10 110 101 // 66  85  71  
                0xB6, //     8 // 182 // 2 6 6 // 10 110 110 // 66  85  85  
                0xBE, //     9 // 190 // 2 7 6 // 10 111 110 // 66  100 85  
                0xBF, //    10 // 191 // 2 7 7 // 10 111 111 // 66  100 100 
                0xFF, //    11 // 255 // 3 7 7 // 11 111 111 // 100 100 100 
            ],
            
            // Modified srcFadeTable for max red/green/blue percentages of full by nicksen782.
            // Created by: createFadeValues.
            fadeTable: [],
        },

        createFadeValues: function(){
            let src = this.CONSTS.srcFadeTable;
            let b,g,r;

            for(let i=0, l=src.length; i<l; i+=1){
                // console.log( {
                //     "index:"      : i,
                //     "hex_string"  : "0x"+src[i].toString(16).toUpperCase().padStart(2, "0"), 
                //     "dec"         : src[i], 
                //     "bin_string_b": ( (src[i] & 0b11000000) >> 6 ).toString(2).padStart(2, "0"), 
                //     "bin_string_g": ( (src[i] & 0b00111000) >> 3 ).toString(2).padStart(3, "0"), 
                //     "bin_string_r": ( (src[i] & 0b00000111) >> 0 ).toString(2).padStart(3, "0"),
                // } );

                // Add the values in reverse order (round down to the nearest whole integer).
                b = ( ( ( ( src[i] & 0b11000000 ) >> 6) / 3 ) * 100 ) << 0;
                g = ( ( ( ( src[i] & 0b00111000 ) >> 3) / 7 ) * 100 ) << 0;
                r = ( ( ( ( src[i] & 0b00000111 ) >> 0) / 7 ) * 100 ) << 0;
                this.CONSTS.fadeTable.unshift( new Uint8ClampedArray([ b, g, r ]) );
            }
        },
        init: async function(type="postInit"){
            if(this.inited){ console.log("ALREADY DONE: fade.init:", type); return; }

            // Generate the percentages version of the srcFadeTable.
            _GFX.timeIt("createFadeValues", "start");
            this.createFadeValues();
            _GFX.timeIt("createFadeValues", "stop");
            
            // Create faded versions of each tile for each tileset. 
            _GFX.timeIt("convertAllFadeTilesets", "start");
            await _GFX.fade.convertAllTilesets(type);
            _GFX.timeIt("convertAllFadeTilesets", "stop");
            this.isEnabled = true; 

            let debugData = {};
            if( _GFX.meta.videoModeA_config.debugGFX.generateAndReturnFadedTiles ){
                for(let tilesetName in _GFX.cache){
                    let tilesetObj = _GFX.cache[tilesetName];
                    let tiles = tilesetObj.tileset;
                    debugData[tilesetName] = [];
                    for(let ti=0, tl=tiles.length; ti<tl; ti+=1){
                        debugData[tilesetName].push( tiles[ti].fadeTiles.map( (d)=>{
                            let canvas = d.canvas;
                            let ctx = canvas.getContext("2d");
                            let imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                            return imgData;
                        }) );
                    }
                }
            }

            if(type=="init"){
                // Send a response.
                self.postMessage( 
                    { 
                        "mode" : "initFade", 
                        "data" : {
                            "debugData"    : debugData,
                            "maxFadeSteps" : _GFX.fade.CONSTS.fadeTable.length,
                            // "maxFadeSteps" : 11, // DEBUG: the fadeTable should already be this value.
                            "fadeIsEnabled": this.isEnabled,
                        },
                        "success":true,
                    },
                    []
                );
            }
            if(type=="postInit"){
                // Send a response.
                self.postMessage( 
                    { 
                        "mode" : "initFade", 
                        "data" : {
                            "debugData"    : debugData,
                            "maxFadeSteps" : _GFX.fade.CONSTS.fadeTable.length,
                            // "maxFadeSteps" : 11, // DEBUG: the fadeTable should already be this value.
                            "fadeIsEnabled": this.isEnabled,
                        },
                        "success":true,
                    },
                    []
                );
            }

            this.inited = true;
            return debugData;
        }, 
    },

    // Draws from VRAM and/or changes.
    draw2: async function(type="vram", changes=[] ){
        let dimensions = _GFX.meta.dimensions;
        let tilesetNames = Object.keys(_GFX.cache);
        let tileset;
        let thisVRAM;
        let vramIndex;

        if     (type=="vram"){
            let layerCanvas;
            let tilesetIndex;
            let tileId;
            let tilesetName;
            let tile;
            let vramLayerI;
            let y;
            let x;
            let l2;
            let vramLayerIndex;
            let vramLayerIndex_len;

            for(let i=0, l1=_GFX.meta.layers.length; i<l1; i+=1){
                // Read through each VRAM layer.
                for(vramLayerI=0, l2=_GFX.VRAM._VRAM.length; vramLayerI<l2; vramLayerI+=1){
                    // Get the layer.
                    thisVRAM    = _GFX.VRAM._VRAM[vramLayerI];
                    layerCanvas = _GFX.canvasLayers[vramLayerI];
                    
                    // Read through the VRAM for this layer to build up the image.
                    for(vramLayerIndex=0, vramLayerIndex_len=_GFX.VRAM.coordsByIndex.length; vramLayerIndex < vramLayerIndex_len; vramLayerIndex +=1){
                        // Get the y and x for this vram index (by actual coord count, not vram size.)
                        [y, x] = _GFX.VRAM.coordsByIndex[vramLayerIndex];

                        // Get the actual VRAM index for this x and y.
                        vramIndex = _GFX.VRAM.indexByCoords[y][x];

                        // Get the tilesetIndex and the tileId.
                        tilesetIndex = thisVRAM.view[vramIndex + 0];
                        tileId       = thisVRAM.view[vramIndex + 1];

                        // Get the tileset name. 
                        tilesetName = tilesetNames[ tilesetIndex ];

                        // Get the tileset.
                        tileset = _GFX.cache[ tilesetName ].tileset;

                        // Get the tile (main).
                        tile = tileset[tileId] ;

                        // Clear if the previous fade index was at max.
                        if(tile.isFullyTransparent || _GFX.fade.previousFadeIndex >= _GFX.fade.CONSTS.fadeTable.length -1){
                            layerCanvas.ctx.clearRect(
                                x* dimensions.tileWidth, y*dimensions.tileHeight,
                                dimensions.tileWidth, dimensions.tileHeight
                            );

                            // Don't draw fully transparent tiles.
                            if(tile.isFullyTransparent){ continue; }
                        }

                        // Draw the correct tile to the canvas. 

                        // If the currentFadeIndex is 0 then draw the normal tile.
                        if(_GFX.fade.currentFadeIndex == 0 || !_GFX.fade.isEnabled){ tile = tile.canvas; }
                        
                        // If the currentFadeIndex is the last index in the fader2 array then draw a black tile. 
                        else if( _GFX.fade.currentFadeIndex >= _GFX.fade.CONSTS.fadeTable.length -1 ){
                            layerCanvas.ctx.fillStyle = "#000000";
                            layerCanvas.ctx.fillRect( (x * dimensions.tileWidth), (y * dimensions.tileHeight), dimensions.tileWidth , dimensions.tileHeight);
                            continue; 
                        }
                        
                        // Otherwise, draw the currentFadeIndex tile minus 1 index.
                        else{ tile = tile.fadeTiles[ _GFX.fade.currentFadeIndex-1 ].canvas; }

                        // Draw this canvas to the output layer. 
                        layerCanvas.ctx.drawImage(tile, x* dimensions.tileWidth, y*dimensions.tileHeight);
                    }
                }
            }
        }
        else if(type=="changes"){
            // Update the local VRAM with the changes.

            // Draw changes to the canvases.
            for(let key in changes){
                let change = changes[key];
                
                // Get the VRAM layer, and VRAM index for this x and y.
                let thisVRAM  = _GFX.VRAM._VRAM[change.layerIndex].view;
                let vramIndex = _GFX.VRAM.indexByCoords[change.y][change.x];

                // Update VRAM with this tilesetIndex and tileId.
                thisVRAM[vramIndex + 0] = change.tilesetIndex;
                thisVRAM[vramIndex + 1] = change.tileId;

                // Get the tileset.
                tileset = _GFX.cache[ tilesetNames[ change.tilesetIndex ] ].tileset;
                
                // Get the tile (main).
                let tile = tileset[change.tileId] ;

                // Clear the destination if the new tile has transparency. (This is prevent the previous tile from showing through.)
                // Also clear if the previous fade index was at max.
                if(tile.hasTransparency || _GFX.fade.previousFadeIndex >= _GFX.fade.CONSTS.fadeTable.length -1){
                    _GFX.canvasLayers[ change.layerIndex ].ctx.clearRect(
                        change.x* dimensions.tileWidth, change.y*dimensions.tileHeight,
                        dimensions.tileWidth, dimensions.tileHeight
                    );
                }

                // Draw the correct tile to the canvas. 

                // If the currentFadeIndex is 0 then draw the normal tile.
                if(_GFX.fade.currentFadeIndex == 0 || !_GFX.fade.isEnabled){ tile = tile.canvas; }
                
                // If the currentFadeIndex is the last index in the fader2 array then draw a black tile. 
                else if( _GFX.fade.currentFadeIndex >= _GFX.fade.CONSTS.fadeTable.length -1 ){
                    _GFX.canvasLayers[ change.layerIndex ].ctx.fillStyle = "#000000";
                    _GFX.canvasLayers[ change.layerIndex ].ctx.fillRect( (change.x * dimensions.tileWidth), (change.y * dimensions.tileHeight), dimensions.tileWidth , dimensions.tileHeight);
                    continue; 
                }
                
                // Otherwise, draw the currentFadeIndex tile minus 1 index.
                else{ tile = tile.fadeTiles[ _GFX.fade.currentFadeIndex-1 ].canvas; }
                
                // Draw to the destination. 
                _GFX.canvasLayers[ change.layerIndex ].ctx.drawImage(tile, (change.x * dimensions.tileWidth), (change.y * dimensions.tileHeight));
            }
        }
        else{
            console.log("ERROR: draw2: Invalid type specified.", type);
        }
    },

    // Wrapper to draw2. Draws from VRAM and/or changes.
    draw: async function(event){
        // This function updates local VRAM and draws the changes.
        // It is expected that the data sent to this function is correct and free of duplication.

        let dimensions = _GFX.meta.dimensions;
        if(event.data.data.clearVram_flag){
            // Clear the VRAM. Fill all VRAM layers with 0 (tileIndex to 0, tileId to 0, and x,y coordinate to 0.)
            for(let i=0, l=_GFX.VRAM._VRAM.length; i<l; i+=1){ _GFX.VRAM._VRAM[i].view.fill(0); }

            // Clear each canvas layer.
            for(let i=0, l=_GFX.VRAM._VRAM.length; i<l; i+=1){
                _GFX.canvasLayers[i].ctx.clearRect( (0 * dimensions.tileWidth), (0 * dimensions.tileHeight), (_GFX.canvasLayers[i].canvas.width), (_GFX.canvasLayers[i].canvas.height));
            }
        }

        // Draw changes to the canvases and update VRAM?.
        if(Object.keys(event.data.data.changes).length){
            await this.draw2("changes", event.data.data.changes);
        }

        // Force a redraw using the fadetile versions.
        if(_GFX.fade.isEnabled && (_GFX.fade.previousFadeIndex != event.data.data.currentFadeIndex)){ 
            // Update to the new currentFadeIndex.
            _GFX.fade.currentFadeIndex = event.data.data.currentFadeIndex;

            // Redraw the entire VRAM but with the fadeTiles at the currentFadeIndex.
            await this.draw2("vram", []);

            // Update previousFadeIndex so that this check only happens once per fade level change.
            _GFX.fade.previousFadeIndex = _GFX.fade.currentFadeIndex;
        }

        // Inform the main thread that we are done. 
        self.postMessage( 
            { 
                "mode" : event.data.mode, 
                "data" : {},
                "success":true,
            }, []
        );
    },

    init: async function(event){
        // Update the local copy of VRAM.
        _GFX.VRAM._VRAM  = event.data.data.VRAM._VRAM;

        // Update the indexByCoords x,y lookup array.
        _GFX.VRAM.indexByCoords  = event.data.data.VRAM.indexByCoords;
        _GFX.VRAM.coordsByIndex  = event.data.data.VRAM.coordsByIndex;

        // Update the local graphics cache. 
        _GFX.cache = event.data.data.cache;

        // Update the local dimensions data. 
        _GFX.meta.dimensions = event.data.data.meta.dimensions;

        // Update the local canvas layer data. 
        _GFX.meta.layers = event.data.data.meta.layers;

        // Update the jsgame_shared_plugins_config. 
        _GFX.meta.videoModeA_config = event.data.data.meta.videoModeA_config;

        // Break-out the layer data and store the drawing contexts. 
        _GFX.timeIt("createCtxAndClears", "start");
        for(let layer of event.data.data.offscreenLayers){
            layer.ctx = layer.canvas.getContext("2d", layer.canvasOptions || {});
            layer.ctx.clearRect(0, 0, layer.canvas.width, layer.canvas.height);
            // _GFX.gfxConversion.setPixelated(layer.ctx);
            _GFX.canvasLayers.push(layer);
        }
        _GFX.timeIt("createCtxAndClears", "stop");
        
        // Create canvases for each tileset tile (from the supplied imageData).
        _GFX.timeIt("createTilesetCanvases", "start");
        let dimensions = _GFX.meta.dimensions;
        for(let tilesetName in _GFX.cache){
            let tilesetObj = _GFX.cache[tilesetName];
            let tiles = tilesetObj.tileset;

            // For each tile in the tileset.
            for(let i=0, l=tiles.length; i<l; i+=1){
                let width  = dimensions.tileWidth  * dimensions.cols;
                let height = dimensions.tileHeight * dimensions.rows;
                tiles[i].canvas = new OffscreenCanvas(width, height);
                tiles[i].ctx = tiles[i].canvas.getContext('2d');
                // _GFX.gfxConversion.setPixelated(tiles[i].ctx);
                tiles[i].ctx.putImageData( tiles[i].imgData, 0, 0 );
            }
        }
        _GFX.timeIt("createTilesetCanvases", "stop");
        
        // _GFX.timeIt("fadeCreateAtStart", "start");
        let debugData = {};
        if( _GFX.meta.videoModeA_config.fadeCreateAtStart ){
            // console.log("_GFX.meta.videoModeA_config.fadeCreateAtStart was true. running _GFX.fade.init('init').");
            // Create faded versions of each tile for each tileset. 
            debugData = await _GFX.fade.init("init");
        }
        // _GFX.timeIt("fadeCreateAtStart", "stop");

        // Send a response.
        self.postMessage( 
            { 
                "mode" : event.data.mode, 
                "data" : debugData,
                "success":true,
            },
            []
        );
    },
};

// Take care of vendor prefixes.
self.postMessage = self.postMessage || self.webkitPostMessage;

self.onmessage = function(event) {
    switch( event.data.mode ){
        // Method 0: useOffscreenCanvas: false
        case "init"     : { _GFX.init(event);           break; } 
        case "initFade" : { _GFX.fade.init("postInit"); break; } 
        case "returnInitTimes" : { _GFX.returnInitTimes(); break; } 

        // Method 1: useOffscreenCanvas: true
        case "drawSend_useOffscreenCanvas" : { _GFX.draw(event); break; } // Method 1

        // Unmatched function.
        default     : { 
            console.log("ERROR: Unmatched mode:", event.data.mode); 
            self.postMessage( { "mode" : event.data.mode, "data" : "", "success":false }, [] );
            break; 
        }
    }
};

