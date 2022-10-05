'use strict';

// Holds a version of the parent's _GFX data.
let _GFX = {
    cache:undefined,
    VRAM:{
        _VRAM        : undefined,
        indexByCoords: undefined,
    },

    // Output canvas objects. 
    outputCanvas          : undefined,
    outputCanvasCtx       : undefined,
    outputCanvasImageData : undefined,

    gfxConversion : {
        // Convert rgb32 object to rgb332 pixel.
        rgb32_to_RGB332: function(R, G, B){
            // Convert the RGB value to RGB332 as hex string. (Jubation)
            // #define SQ_COLOR8(r, g, b) (((r >> 5) & 0x07U) | ((g >> 2) & 0x38U) | ((b) & 0xC0U))
            // var index = ((R >> 5) & 0x07) | ((G >> 2) & 0x38) | ((B) & 0xC0);
        
            // Convert the RGB value to RGB332 as hex string. (original)
            var rgb332 = (B & 0xc0) + ((G >> 2) & 0x38) + (R >> 5);
        
            return rgb332;
        },
    
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
    },
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
        let dimensions = this.meta.dimensions;
    
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

    fade: {
        fadeLeveledCanvases: [],
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
             // { b: 66 , g: 85  , r: 85  } , // 8     10 110 110  2 6 6  , 182 , 0xB6 // VERY SIMILAR
                { b: 66 , g: 100 , r: 85  } , // 9     10 111 110  2 7 6  , 190 , 0xBE // VERY SIMILAR

                { b: 66 , g: 100 , r: 100 } , // 10    10 111 111  2 7 7  , 191 , 0xBF

            // { b: 100, g: 100 , r: 100 } , // 11    11 111 111  3 7 7  , 255 , 0xFF // IDENTICAL
                { b: 100, g: 100 , r: 100 } , // 12    11 111 111  3 7 7  , 255 , 0xFF // IDENTICAL
            ], // The rgb values for each fade level.
        } ,
    },
};


// Take care of vendor prefixes.
self.postMessage = self.postMessage || self.webkitPostMessage;

self.onmessage = function(event) {
	switch( event.data.mode ){
		case "init"        : { init(event);        break; }
		case "vram_update" : { vram_update(event); break; }
		case "fade"        : { fade(event);        break; }

		// Unmatched function.
		default     : { 
            console.log("ERROR: Unmatched mode"); 
            self.postMessage( { "mode" : event.data.mode, "data" : "", "success":false }, [] );
            break; 
        }
	}
};

function init(event){
    // console.log(`WW: ${event.data.mode}:`, event.data);

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
function vram_update(event){
    // console.log(`WW: ${event.data.mode}:`, event.data);

    // Update the local copy of VRAM.
    _GFX.VRAM._VRAM  = event.data.data.VRAM._VRAM;

    // Draw the canvas from VRAM. (updates _GFX.outputCanvas)
    _GFX.draw.drawFromVRAM();

    // Get the image data for the output canvas (which has just been updated.)
    _GFX.outputCanvasImageData = _GFX.outputCanvasCtx.getImageData(0,0,_GFX.outputCanvas.width, _GFX.outputCanvas.height);
    
    // Send a response.
    self.postMessage( 
        { 
            "mode" : event.data.mode, 
            "data" : {},
            // "data" : _GFX.outputCanvasCtx.getImageData(0,0,_GFX.outputCanvas.width, _GFX.outputCanvas.height),
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
