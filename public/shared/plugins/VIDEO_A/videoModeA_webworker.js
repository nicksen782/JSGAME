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
        fadeLeveledCanvases: [],

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

        CONSTS : {
            // *** FADER *** tim1724
            // Modified for JavaScript by nicksen782.
            fader : [
                //                               INDEX BB GGG RRR  B G R    DEC   HEX
                { b: 0  , g: 0   , r: 0   } , // 0     00 000 000  0 0 0  , 0   , 0x00
                { b: 33 , g: 0   , r: 0   } , // 1     01 000 000  1 0 0  , 64  , 0x40
                { b: 66 , g: 14  , r: 0   } , // 2     10 001 000  2 1 0  , 136 , 0x88
                { b: 66 , g: 28  , r: 14  } , // 3     10 010 001  2 2 1  , 145 , 0x91
                { b: 100, g: 28  , r: 28  } , // 4     11 010 010  3 2 2  , 210 , 0xD2
                { b: 100, g: 57  , r: 57  } , // 5     11 100 100  3 4 4  , 228 , 0xE4
                { b: 66 , g: 71  , r: 71  } , // 6     10 101 101  2 5 5  , 173 , 0xAD
                { b: 66 , g: 85  , r: 71  } , // 7     10 110 101  2 6 5  , 181 , 0xB5 // VERY SIMILAR
                { b: 66 , g: 100 , r: 85  } , // 9     10 111 110  2 7 6  , 190 , 0xBE // VERY SIMILAR
                { b: 66 , g: 100 , r: 100 } , // 10    10 111 111  2 7 7  , 191 , 0xBF
                { b: 100, g: 100 , r: 100 } , // 12    11 111 111  3 7 7  , 255 , 0xFF 
            ], // The rgb values for each fade level.
            
            fader2 : [
                new Uint8ClampedArray([ 0  , 0  , 0   ]), // b: 0  , g: 0   , r: 0  
                new Uint8ClampedArray([ 33 , 0  , 0   ]), // b: 33 , g: 0   , r: 0  
                new Uint8ClampedArray([ 66 , 14 , 0   ]), // b: 66 , g: 14  , r: 0  
                new Uint8ClampedArray([ 66 , 28 , 14  ]), // b: 66 , g: 28  , r: 14 
                new Uint8ClampedArray([ 100, 28 , 28  ]), // b: 100, g: 28  , r: 28 
                new Uint8ClampedArray([ 100, 57 , 57  ]), // b: 100, g: 57  , r: 57 
                new Uint8ClampedArray([ 66 , 71 , 71  ]), // b: 66 , g: 71  , r: 71 
                new Uint8ClampedArray([ 66 , 85 , 71  ]), // b: 66 , g: 85  , r: 71 
                new Uint8ClampedArray([ 66 , 100, 85  ]), // b: 66 , g: 100 , r: 85 
                new Uint8ClampedArray([ 66 , 100, 100 ]), // b: 66 , g: 100 , r: 100
                new Uint8ClampedArray([ 100, 100, 100 ]), // b: 100, g: 100 , r: 100
            ], // The rgb values for each fade level.
        } ,
    },

    // ONLY USED BY: Method 0: useOffscreenCanvas: false
    outputCanvas          : undefined,
    outputCanvasCtx       : undefined,
    outputCanvasImageData : undefined,
    draw: {
        drawFromVRAM: function(){
            // Draw the background color (if it exists) for the first layer. 
            if(_GFX.meta.layers[0].bg_color){
                _GFX.outputCanvasCtx.fillStyle = _GFX.meta.layers[0].bg_color;
                _GFX.outputCanvasCtx.fillRect(0, 0, _GFX.outputCanvas.width, _GFX.outputCanvas.height);
            }
            // If it doesn't then just use clearRect.
            else{
                // Clear the output canvas. 
                _GFX.outputCanvasCtx.clearRect(0, 0, _GFX.outputCanvas.width, _GFX.outputCanvas.height);
            }

            // Use the VRAM to create combine each layer in order.
            let dimensions = _GFX.meta.dimensions;
            let tilesetNames = Object.keys(_GFX.cache);
            for(let i=0, l1=_GFX.meta.layers.length; i<l1; i+=1){
                if(i==0){
                    
                }

                // Read through each VRAM layer.
                for(let vramLayerI=0, l2=_GFX.VRAM._VRAM.length; vramLayerI<l2; vramLayerI+=1){
                    // Get the layer.
                    let layer = _GFX.VRAM._VRAM[vramLayerI];
                    
                    // Read through the VRAM for this layer to build up the image.
                    for(let y=0; y<dimensions.rows; y+=1){
                        for(let x=0; x < dimensions.cols; x+=1){
                            // Get the VRAM index for this x and y.
                            let vramIndex = _GFX.VRAM.indexByCoords[y][x];

                            // Get the tilesetIndex and the tileId.
                            let tilesetIndex = layer.view[vramIndex + 0];
                            let tileId       = layer.view[vramIndex + 1];

                            // Get the tileset name. 
                            let tilesetName = tilesetNames[tilesetIndex];

                            // Get the actual tile canvas.
                            let tile = _GFX.cache[tilesetName].tileset[tileId].canvas;

                            // Draw this tile to the output layer.
                            _GFX.outputCanvasCtx.drawImage(tile, x* dimensions.tileWidth, y*dimensions.tileHeight);
                        }
                    }
                }
            }
        },
    },
    generateCanvasLayer : function(rec){
        let dimensions = _GFX.meta.dimensions;
    
        // Create a canvas for this layer.
        let width  = dimensions.tileWidth * dimensions.cols;
        let height = dimensions.tileHeight * dimensions.rows;
        let canvas = new OffscreenCanvas(width, height);
        
        // Create the ctx for this layer. 
        let ctx = canvas.getContext("2d", rec.canvasOptions || {});
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        _GFX.gfxConversion.setPixelated(ctx);
    
        // Return the canvas, ctx, ImageData;
        return {
            canvas   : canvas,
            ctx      : ctx,
            ImageData: ctx.getImageData(0,0,canvas.width, canvas.height),
        };
    },

    // ONLY USED BY: Method 1: useOffscreenCanvas: true
};


// Take care of vendor prefixes.
self.postMessage = self.postMessage || self.webkitPostMessage;

self.onmessage = function(event) {
    switch( event.data.mode ){
        // Method 0: useOffscreenCanvas: false
        case "init"                    : { init(event);                    break; } // Method 0, 1
        case "fade"                    : { fade(event);                    break; } // Method 0

        // Method 1: useOffscreenCanvas: true
        case "initSend_useOffscreenCanvas" : { init_useOffscreenCanvas(event); break; } // Method 1
        case "drawSend_useOffscreenCanvas" : { draw_useOffscreenCanvas(event); break; } // Method 1

        // Unmatched function.
        default     : { 
            console.log("ERROR: Unmatched mode:", event.data.mode); 
            self.postMessage( { "mode" : event.data.mode, "data" : "", "success":false }, [] );
            break; 
        }
    }
};

// Method 0 and 1: useOffscreenCanvas: false/true
function init(event){
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
    
    // Create placeholders for the fade levels. 
    for(let i=0, l=_GFX.fade.CONSTS.fader.length; i<l; i+=1){
        _GFX.fade.fadeLeveledCanvases.push(undefined);
    }

    // Create one OffscreenCanvas for the output.
    {
        let canvasObj = _GFX.generateCanvasLayer( { "canvasOptions": { "alpha": true } } );
        _GFX.outputCanvas          = canvasObj.canvas;
        _GFX.outputCanvasCtx       = canvasObj.ctx;
        _GFX.outputCanvasImageData = canvasObj.ImageData;
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

    // Send a response.
    self.postMessage( 
        { 
            "mode" : event.data.mode, 
            "data" : {
                maxFadeSteps : _GFX.fade.CONSTS.fader.length,
            },
            "success":true,
        },
        []
    );
};
function fade(event){
    // console.log(`WW: ${event.data.mode}:`, event.data);
    let ts_start = performance.now();

    if(event.data.data._options.includeVramUpdate){
        // Update the local copy of VRAM.
        _GFX.VRAM._VRAM  = event.data.data.VRAM._VRAM;

        // Draw the canvas from VRAM. (updates _GFX.outputCanvas)
        _GFX.draw.drawFromVRAM();

        // Get the image data for the output canvas (which has just been updated.)
        _GFX.outputCanvasImageData = _GFX.outputCanvasCtx.getImageData(0,0,_GFX.outputCanvas.width, _GFX.outputCanvas.height);
    }

    // Get the dimensions and the length of the source ImageData.
    let len = _GFX.outputCanvasImageData.data.byteLength;
    let dimensions = _GFX.meta.dimensions;

    // Create/update new ImageData entries for the fade levels.
    for(let levelI=0, levelL=_GFX.fade.fadeLeveledCanvases.length; levelI<levelL; levelI+=1){
        // Create the new ImageData for this fade level.
        _GFX.fade.fadeLeveledCanvases[levelI] = _GFX.outputCanvasCtx.createImageData( dimensions.tileWidth * dimensions.cols, dimensions.tileHeight * dimensions.rows );
    }

    // Populate the values for each fade imageData.
    for(let levelI=0, levelL=_GFX.fade.fadeLeveledCanvases.length; levelI<levelL; levelI+=1){
        let fadeColorObj = _GFX.fade.CONSTS.fader[levelI];
        
        // Get the max for red, green, and blue fade level values and make sure they are between 0 and 255.
        let maxRed   = Math.min( Math.max((fadeColorObj.r / 100), 0), 255); // 
        let maxGreen = Math.min( Math.max((fadeColorObj.g / 100), 0), 255); // 
        let maxBlue  = Math.min( Math.max((fadeColorObj.b / 100), 0), 255); // 

        for(let i=0; i<len; i+=4){
            // Determine the replacement colors.
            let replaceWith_blue  = _GFX.outputCanvasImageData.data[i+2] * maxBlue  ;
            let replaceWith_green = _GFX.outputCanvasImageData.data[i+1] * maxGreen ;
            let replaceWith_red   = _GFX.outputCanvasImageData.data[i+0] * maxRed   ;

            // Replace colors (8-bit)
            _GFX.fade.fadeLeveledCanvases[levelI].data[i+3] = _GFX.outputCanvasImageData.data[i+3]  ;
            _GFX.fade.fadeLeveledCanvases[levelI].data[i+2] = replaceWith_blue  ;
            _GFX.fade.fadeLeveledCanvases[levelI].data[i+1] = replaceWith_green ;
            _GFX.fade.fadeLeveledCanvases[levelI].data[i+0] = replaceWith_red   ;
        }
    }

    // console.log("TIME:", performance.now() - ts_start);
    self.postMessage( 
        { 
            "mode" : event.data.mode, 
            "data" : _GFX.fade.fadeLeveledCanvases,
            "success":true,
        },
        []
    );
};

// Method 1: useOffscreenCanvas: true
function draw_useOffscreenCanvas(event){
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

    // Update the local VRAM with the changes.
    let tilesetNames = Object.keys(_GFX.cache);
    let tileset;
    for(let change of event.data.data.changes){
        // Get the VRAM index for this x and y.
        let thisVRAM  = _GFX.VRAM._VRAM[change.layerIndex];
        let vramIndex = _GFX.VRAM.indexByCoords[change.y][change.x];

        // Set the tilesetIndex and the tileId.
        thisVRAM[vramIndex + 0] = change.tilesetIndex;
        thisVRAM[vramIndex + 1] = change.tileId;

        // Get the tileset.
        tileset = _GFX.cache[ tilesetNames[ change.tilesetIndex ] ].tileset;

        // If a tile is fully transparent then during a draw with a fadeLevel the tile will not be drawn (no point since it is invisible anyway.)
        // if(tileset[ change.tileId ].isFullyTransparent){
        // }
        
        if(0){}

        // Clear the destination if the new tile has transparency. 
        // (This is prevent the previous tile from showing through.)
        else if(tileset[ change.tileId ].hasTransparency){
            _GFX.canvasLayers[ change.layerIndex ].ctx.clearRect( (change.x * dimensions.tileWidth), (change.y * dimensions.tileHeight), (dimensions.tileWidth), (dimensions.tileHeight));
        }

        // Draw to the destination. 
        _GFX.canvasLayers[ change.layerIndex ].ctx.drawImage(tileset[ change.tileId ].canvas, (change.x * dimensions.tileWidth), (change.y * dimensions.tileHeight));
    }

    // Inform the main thread that we are done. 
    self.postMessage( 
        { 
            "mode" : event.data.mode, 
            "data" : {},
            "success":true,
        }, []
    );
};

async function init_useOffscreenCanvas(event){
    // Break-out the layer data and store the drawing contexts. 
    for(let layer of event.data.data){
        layer.ctx = layer.canvas.getContext("2d", layer.canvasOptions || {});
        layer.ctx.clearRect(0, 0, layer.canvas.width, layer.canvas.height);
        _GFX.gfxConversion.setPixelated(layer.ctx);
        _GFX.canvasLayers.push(layer);
    }

    // Create faded versions of each tile. 
    let proms = [];
    for(let tilesetName in _GFX.cache){
        let tilesetObj = _GFX.cache[tilesetName];
        let tiles = tilesetObj.tileset;
        
        proms.push(
            new Promise(async (res,rej)=>{
                let ts = performance.now();
                await _GFX.fade.convertForTileset(tilesetName);
                self.postMessage( {  "mode" : "loading_progress", "data" : `Created fade tileset: ${tilesetName}, length: ${tiles.length.toString().padStart(4, " ")} tiles. (${(performance.now()-ts).toFixed(2)}ms)`, }, [] );
                res();
            })
        );
    }
    await Promise.all(proms);

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

    // Inform the main thread that we are done. 
    self.postMessage( 
        { 
            "mode" : event.data.mode, 
            "data" : debugData,
            "success":true,
        }, []
    );
}