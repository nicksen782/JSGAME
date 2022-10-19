'use strict';

// Holds a version of the parent's _GFX data.
let _GFX = {
    // SHARED
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

        convertForTileset: async function(tilesetName){
            return new Promise(async (resolve,reject)=>{
                let i_32 = new Uint16Array(1);
                let maxRed   ;//= new Uint8ClampedArray(1) ;
                let maxGreen ;//= new Uint8ClampedArray(1) ;
                let maxBlue  ;//= new Uint8ClampedArray(1) ;

                // Get the tileset data.
                let tilesetObj = _GFX.cache[tilesetName];
                let tiles = tilesetObj.tileset;

                // Canvas to be a strip tiles.length tiles wide and one tile tall.
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

                for(let levelI=0, levelL=_GFX.fade.CONSTS.fader2.length; levelI<levelL; levelI+=1){
                    // Create empty image data.
                    let fade_canvas = new OffscreenCanvas(tileset_canvas.width, tileset_canvas.height);
                    let fade_ctx = fade_canvas.getContext("2d");
                    let fadeImageData = tileset_ctx.createImageData( tileset_canvas.width, tileset_canvas.height );
                    
                    // Get the max for red, green, and blue fade level values.
                    let fadeColorObj = _GFX.fade.CONSTS.fader2[levelI];
                    maxRed   = fadeColorObj[2] / 100; // 
                    maxGreen = fadeColorObj[1] / 100; // 
                    maxBlue  = fadeColorObj[0] / 100; // 
                    // console.log("level:", levelI, ", maxRed:", maxRed, ", maxGreen:", maxGreen, ", maxBlue:", maxBlue);

                    // Create a 32-bit unsigned view to the image data.
                    let img_view32 = new Uint32Array(fadeImageData.data.buffer);
                    
                    // Set the 32-bit view's index to 0.
                    i_32[0] = 0;
    
                    // Convert the tileset_ImageData into the new fadeImageData.
                    for(let i=0; i<len; i+=4){
                        // Any fully transparent pixel can be skipped.
                        if(tileset_ImageData[i+3]==0){ i_32[0] +=1; continue; }

                        // Replace colors (32-bit)
                        // Explanation: Multiply the rgb values individually by their max (percentage of color.)
                        // Use << 0 to ensure an integer.
                        // Use bitshifting to create one 32-bit value out of the individual 8-bit values. 
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
                        if(type=="init"){
                            self.postMessage( {  "mode" : "loading_progress", "data" : msg, }, [] );
                        }
                        console.log(msg);
                        res();
                    })
                );
            }
            await Promise.all(proms);
        },

        previousFadeIndex: 0, 
        currentFadeIndex: 0, 

        // _GFX.fade.CONSTS.currentFadeIndex
        // _GFX.fade.CONSTS.fader2.length
        CONSTS : {
            // *** FADER *** tim1724
            // Modified for max red/green/blue percentages for JavaScript by nicksen782.
            fader : [
                //                               INDEX BB GGG RRR  B G R    DEC   HEX
                { b: 100, g: 100 , r: 100 } , // 0  11 111 111  3 7 7  , 255 , 0xFF // FULL ON. (Is this needed?)
                { b: 66 , g: 100 , r: 100 } , // 1  10 111 111  2 7 7  , 191 , 0xBF
                { b: 66 , g: 100 , r: 85  } , // 2  10 111 110  2 7 6  , 190 , 0xBE
                { b: 66 , g: 85  , r: 71  } , // 3  10 110 101  2 6 5  , 181 , 0xB5
                { b: 66 , g: 71  , r: 71  } , // 4  10 101 101  2 5 5  , 173 , 0xAD
                { b: 100, g: 57  , r: 57  } , // 5  11 100 100  3 4 4  , 228 , 0xE4
                { b: 100, g: 28  , r: 28  } , // 6  11 010 010  3 2 2  , 210 , 0xD2
                { b: 66 , g: 28  , r: 14  } , // 7  10 010 001  2 2 1  , 145 , 0x91
                { b: 66 , g: 14  , r: 0   } , // 8  10 001 000  2 1 0  , 136 , 0x88
                { b: 33 , g: 0   , r: 0   } , // 9  01 000 000  1 0 0  , 64  , 0x40
                { b: 0  , g: 0   , r: 0   } , // 10 00 000 000  0 0 0  , 0   , 0x00 // FULL OFF 
            ], // The rgb values for each fade level.
            
            fader2 : [
                new Uint8ClampedArray([ 100, 100, 100 ]), // 0 b: 100, g: 100 , r: 100 // FULL ON. (Is this needed?)
                new Uint8ClampedArray([ 66 , 100, 100 ]), // 1 b: 66 , g: 100 , r: 100
                new Uint8ClampedArray([ 66 , 100, 85  ]), // 2 b: 66 , g: 100 , r: 85 
                new Uint8ClampedArray([ 66 , 85 , 71  ]), // 3 b: 66 , g: 85  , r: 71 
                new Uint8ClampedArray([ 66 , 71 , 71  ]), // 4 b: 66 , g: 71  , r: 71 
                new Uint8ClampedArray([ 100, 57 , 57  ]), // 5 b: 100, g: 57  , r: 57 
                new Uint8ClampedArray([ 100, 28 , 28  ]), // 6 b: 100, g: 28  , r: 28 
                new Uint8ClampedArray([ 66 , 28 , 14  ]), // 7 b: 66 , g: 28  , r: 14 
                new Uint8ClampedArray([ 66 , 14 , 0   ]), // 8 b: 66 , g: 14  , r: 0  
                new Uint8ClampedArray([ 33 , 0  , 0   ]), // 9 b: 33 , g: 0   , r: 0  
                new Uint8ClampedArray([ 0  , 0  , 0   ]), // 10b: 0  , g: 0   , r: 0   // FULL OFF.
            ], // The rgb values for each fade level.
        } ,

        init: async function(type="postInit"){
            // Create faded versions of each tile for each tileset. 
            await _GFX.fade.convertAllTilesets(type);
            this.isEnabled = true; 

            let debugData = {};
            if( _GFX.meta.videoModeA_config.debugMode ){
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

            // if(type=="init"){}
            if(type=="postInit"){
                // Send a response.
                self.postMessage( 
                    { 
                        "mode" : "initFade", 
                        "data" : debugData,
                        "success":true,
                    },
                    []
                );
            }

            return debugData;
        }, 
    },
    redrawFromVram: async function(){
        // Draw the background color (if it exists) for the first layer. 
        // if(_GFX.meta.layers[0].bg_color){
        //     _GFX.canvasLayers[0].ctx.fillStyle = _GFX.meta.layers[0].bg_color;
        //     _GFX.canvasLayers[0].ctx.fillRect(0, 0, _GFX.canvasLayers[0].canvas.width, _GFX.canvasLayers[0].canvas.height);
        // }
        // // If it doesn't then just use clearRect.
        // else{
        //     _GFX.canvasLayers[0].ctx.clearRect(0, 0, _GFX.canvasLayers[0].canvas.width, _GFX.canvasLayers[0].canvas.height);
        // }

        // Use the VRAM to create combine each layer in order.
        let dimensions = _GFX.meta.dimensions;
        let tilesetNames = Object.keys(_GFX.cache);
        let tileset; 
        let width  = dimensions.tileWidth  * dimensions.cols;
        let height = dimensions.tileHeight * dimensions.rows;

        // Vars.
        let layer;
        let layerCanvas;
        let vramIndex;
        let tilesetIndex;
        let tileId;
        let tilesetName;
        let tile;

        for(let i=0, l1=_GFX.meta.layers.length; i<l1; i+=1){
            // Read through each VRAM layer.
            for(let vramLayerI=0, l2=_GFX.VRAM._VRAM.length; vramLayerI<l2; vramLayerI+=1){
                // Get the layer.
                layer       = _GFX.VRAM._VRAM[vramLayerI];
                layerCanvas = _GFX.canvasLayers[vramLayerI];
                
                // let tmpCanvas = new OffscreenCanvas(width, height);
                // let tmpCtx    = tmpCanvas.getContext('2d');

                // Read through the VRAM for this layer to build up the image.
                for(let y=0; y<dimensions.rows; y+=1){
                    for(let x=0; x < dimensions.cols; x+=1){
                        // Get the VRAM index for this x and y.
                        vramIndex = _GFX.VRAM.indexByCoords[y][x];

                        // Get the tilesetIndex and the tileId.
                        tilesetIndex = layer.view[vramIndex + 0];
                        tileId       = layer.view[vramIndex + 1];

                        // Get the tileset name. 
                        tilesetName = tilesetNames[tilesetIndex];

                        // Get the tileset.
                        tileset = _GFX.cache[ tilesetNames[ tilesetIndex ] ].tileset;

                        // Get the tile (main).
                        tile = tileset[tileId] ;

                        // Don't draw fully transparent tiles.
                        if(tile.isFullyTransparent){ continue; }

                        //
                        if(_GFX.fade.isEnabled && _GFX.fade.currentFadeIndex != 0){ 
                            tile = tile.fadeTiles[ _GFX.fade.currentFadeIndex ].canvas; }
                        else{ tile = tile.canvas; }

                        // Draw this canvas to the output layer. 
                        layerCanvas.ctx.drawImage(tile, x* dimensions.tileWidth, y*dimensions.tileHeight);
                        
                        // Draw this tile to the temp layer.
                        // tmpCtx.drawImage(tile, x* dimensions.tileWidth, y*dimensions.tileHeight);
                    }
                }
                
                // Draw the layer to the actual canvas.
                // _GFX.canvasLayers[vramLayerI].ctx.drawImage(tmpCanvas, 0, 0);
            }
        }
    },

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

        // Force a redraw using the fadetile versions.
        if(_GFX.fade.isEnabled && event.data.data.currentFadeIndex != 0){ 
            _GFX.fade.currentFadeIndex = event.data.data.currentFadeIndex;
            if(_GFX.fade.currentFadeIndex != _GFX.fade.previousFadeIndex){
                // Redraw the entire VRAM but with the fadeTiles at the currentFadeIndex.
                await this.redrawFromVram();

                // Update previousFadeIndex so that this check only happens once per fade level change.
                _GFX.fade.previousFadeIndex = _GFX.fade.currentFadeIndex;
            }
        }

        // Update the local VRAM with the changes.
        let tilesetNames = Object.keys(_GFX.cache);
        let tileset;
        
        // Draw changes to the canvases.
        for(let key in event.data.data.changes){
            let change = event.data.data.changes[key];
            
            // UPDATE VRAM.
            // Get the VRAM index for this x and y.
            // Set the tilesetIndex and the tileId.
            let thisVRAM  = _GFX.VRAM._VRAM[change.layerIndex].view;
            let vramIndex = _GFX.VRAM.indexByCoords[change.y][change.x];
            thisVRAM[vramIndex + 0] = change.tilesetIndex;
            thisVRAM[vramIndex + 1] = change.tileId;

            // Get the tileset.
            tileset = _GFX.cache[ tilesetNames[ change.tilesetIndex ] ].tileset;
            
            // Get the tile (main).
            let tile = tileset[change.tileId] ;

            // Clear the destination if the new tile has transparency. 
            // (This is prevent the previous tile from showing through.)
            if(tile.hasTransparency){
                _GFX.canvasLayers[ change.layerIndex ].ctx.clearRect(
                     change.x* dimensions.tileWidth, change.y*dimensions.tileHeight,
                     dimensions.tileWidth, dimensions.tileHeight
                );
            }

            // Draw the correct tile to the canvas. 
            if(_GFX.fade.isEnabled && _GFX.fade.currentFadeIndex != 0){ 
                tile = tile.fadeTiles[ _GFX.fade.currentFadeIndex ].canvas; 
            }
            else{ tile = tile.canvas; }
            
            // Draw to the destination. 
            _GFX.canvasLayers[ change.layerIndex ].ctx.drawImage(tile, (change.x * dimensions.tileWidth), (change.y * dimensions.tileHeight));
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

        // Update the local graphics cache. 
        _GFX.cache = event.data.data.cache;

        // Update the local dimensions data. 
        _GFX.meta.dimensions = event.data.data.meta.dimensions;

        // Update the local canvas layer data. 
        _GFX.meta.layers = event.data.data.meta.layers;

        // Update the jsgame_shared_plugins_config. 
        _GFX.meta.videoModeA_config = event.data.data.meta.videoModeA_config;

        // Break-out the layer data and store the drawing contexts. 
        for(let layer of event.data.data.offscreenLayers){
            layer.ctx = layer.canvas.getContext("2d", layer.canvasOptions || {});
            layer.ctx.clearRect(0, 0, layer.canvas.width, layer.canvas.height);
            _GFX.gfxConversion.setPixelated(layer.ctx);
            _GFX.canvasLayers.push(layer);
        }

        // Create canvases for each tileset tile (from the supplied imageData).
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
                _GFX.gfxConversion.setPixelated(tiles[i].ctx);
                tiles[i].ctx.putImageData( tiles[i].imgData, 0, 0 );
            }
        }

        let debugData = {};
        if( _GFX.meta.videoModeA_config.fadeCreateAtStart ){
            // Create faded versions of each tile for each tileset. 
            debugData = await _GFX.fade.init("init");
        }

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

