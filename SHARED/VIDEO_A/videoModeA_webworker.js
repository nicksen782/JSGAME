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
            DEBUG_generateAndReturnFadedTiles: _GFX.timeIt("DEBUG_generateAndReturnFadedTiles", "get"),
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
    meta:{
        layers: undefined,
        dimensions: undefined,
        videoModeA_config: undefined,
    },

    fade: {
        isEnabled: false,
        inited: false,
        NEWFADECONVERSION: {
            // Transforms using fade (By reference)
            draws: {
                // Same boundary checks:
                // clearRegion
                // copyRegion
                boundaryCheck1: function(source, srcWidth, dx, dy, w, h, adjustSizeForCopy){
                    // EXAMPLE USAGE:
                    // For clearRegion
                    // let newDims = this.boundaryCheck1(source, srcWidth, dx, dy, w, h, false);
                    // if(!newDims){ return; }
                    // let {maxY, x_start, x_end, y_start, y_end } = newDims;
                    
                    // EXAMPLE USAGE:
                    // For copyRegion
                    // let newDims = this.boundaryCheck1(source, srcWidth, dx, dy, w, h, true);
                    // if(!newDims){ return new Uint8Array(0); }
                    // let {maxY, x_start, x_end, y_start, y_end } = newDims;
                    // ({w, h} = newDims);

                    // Calculate the maximum X (width) and Y (height) based on the given source and source width
                    let maxY = source.length / srcWidth;

                    // Determine the start and end of the destination region in both dimensions.
                    // If dx or dy are negative (indicating a region starting outside the actual source data), they're clamped to 0.
                    let x_start = dx < 0            ? 0    : dx;
                    let x_end   = dx + w > srcWidth ? srcWidth : dx + w;

                    // Similarly, if the destination extends beyond the source data, the end of the region is clamped.
                    let y_start = dy < 0            ? 0    : dy;
                    let y_end   = dy + h > maxY     ? maxY : dy + h;

                    // If the entire destination region outside the valid source area, exit the function early.
                    // This could occur if dx,dy and dx+w,dy+h both point outside the valid source area.
                    if (x_start == srcWidth || y_start == maxY || x_end == 0 || y_end == 0) {
                        return false;
                    }

                    // FOR: copyRegion.
                    if(adjustSizeForCopy){
                        // If the region to be copied starts outside the actual source data,
                        // the size of the region is adjusted accordingly.
                        if (dx < 0) w += dx;
                        if (dy < 0) h += dy;
                    }

                    return {
                        maxY   : maxY, 
                        x_start: x_start, 
                        x_end  : x_end, 
                        y_start: y_start, 
                        y_end  : y_end, 
                        w      : w, 
                        h      : h, 
                    };
                },
                // Same boundary checks:
                // updateRegion_replace
                // updateRegion_blit
                // updateRegion_reverseBlit
                boundaryCheck2: function(source, srcWidth, destination, destWidth, destHeight, dx, dy, w, h){
                    // EXAMPLE USAGE:
                    // let newDims = gfxCoreV5.boundaryCheck2(source, srcWidth, destination, destWidth, destHeight, dx, dy, w, h);
                    // if(!newDims){ return; }
                    // let {x_start, x_end, y_start, y_end } = newDims;

                    // Determine the start and end of the destination region in both dimensions.
                    // If dx or dy are negative (indicating a region starting outside the actual source data), they're clamped to 0.
                    let x_start = dx < 0              ? 0          : dx;
                    let y_start = dy < 0              ? 0          : dy;

                    // Similarly, if the destination extends beyond the source data, the end of the region is clamped.
                    let x_end   = dx + w > destWidth  ? destWidth  : dx + w;
                    let y_end   = dy + h > destHeight ? destHeight : dy + h;

                    // If the entire destination region outside the valid source area, exit the function early.
                    // This could occur if dx,dy and dx+w,dy+h both point outside the valid source area.
                    if (x_start >= destWidth || y_start >= destHeight || x_end <= 0 || y_end <= 0) {
                        return false;
                    }

                    return {
                        x_start: x_start, 
                        x_end  : x_end, 
                        y_start: y_start, 
                        y_end  : y_end, 
                    };
                },

                // COPY a region of the source to a new Uint8Array.
                copyRegion: function(source, srcWidth, dx, dy, w, h, asImageData=false) {
                    // Boundary check.
                    let newDims = this.boundaryCheck1(source, srcWidth, dx, dy, w, h, true);
                    if(!newDims){ 
                        if(asImageData){ return new ImageData(w,h); }
                        else           { return new Uint8Array(0); }
                    }
                    let {maxY, x_start, x_end, y_start, y_end } = newDims;
                    ({w, h} = newDims);

                    // Prepare the result array.
                    let resultData;
                    if(asImageData){ resultData = new ImageData(w, h); }
                    else           { resultData = new Uint8Array(w * h * 4); }
                    let resultIndex = 0;

                    // Iterate through the region defined by x_start to x_end and y_start to y_end.
                    for (let y = y_start; y < y_end; y++) {
                        // Get the start and end indexs for this row.
                        let start = (y * srcWidth + x_start) << 2;
                        let end = (y * srcWidth + x_end) << 2;

                        // Copy the row.
                        if(asImageData){ resultData.data.set(source.subarray(start, end), resultIndex); }
                        else           { resultData.set(source.subarray(start, end), resultIndex); }

                        // Increment the result index for the next pixel.
                        resultIndex += (x_end - x_start) << 2;
                    }

                    // Return the result data.
                    return resultData;
                },

                // REPLACE a region in the destination with the source data (no blit support) (source is Uint8Array.)
                updateRegion_replace: function(source, srcWidth, destination, destWidth, destHeight, dx, dy, w, h) {
                    // Boundary check.
                    let newDims = this.boundaryCheck2(source, srcWidth, destination, destWidth, destHeight, dx, dy, w, h);
                    if(!newDims){ 
                        console.log("updateRegion_replace: dest out of bounds: dx, dy, w, h, destHeight:", dx, dy, w, h, destHeight); 
                        return; 
                    }
                    let {x_start, x_end, y_start, y_end } = newDims;

                    // Iterate through the region defined by x_start to x_end and y_start to y_end.
                    for (let y = y_start; y < y_end; y++) {
                        // Compute the start and end offsets in the source and the destination arrays.
                        let srcOffset  = ((y - dy) * srcWidth + (x_start - dx)) << 2;
                        let destOffset = (y * destWidth + x_start) << 2;
                        let destRowStart = destOffset;

                        // Calculate the row end and start.
                        let srcRowStart  = srcOffset;
                        let srcRowEnd    = srcOffset + ((x_end - x_start) << 2);

                        // Copy the entire row at once from the source to the destination.
                        destination.set(source.subarray(srcRowStart, srcRowEnd), destRowStart);
                    }
                },
            },
            transforms: {
                // RGB332 fade table values.
                fadeMasks : [
                    //    // INDEX // DEC // B G R // BB GGG RRR // B%  G%  R%  
                    0x00, //     0 // 0   // 0 0 0 // 00 000 000 // 0   0   0   
                    0x40, //     1 // 64  // 1 0 0 // 01 000 000 // 33  0   0    // 0
                    0x88, //     2 // 136 // 2 1 0 // 10 001 000 // 66  14  0    // 1
                    0x91, //     3 // 145 // 2 2 1 // 10 010 001 // 66  28  14   // 2
                    0xD2, //     4 // 210 // 3 2 2 // 11 010 010 // 100 28  28   // 3
                    0xE4, //     5 // 228 // 3 4 4 // 11 100 100 // 100 57  57   // 4
                    0xAD, //     6 // 173 // 2 5 5 // 10 101 101 // 66  71  71   // 5
                    0xB5, //     7 // 181 // 2 6 5 // 10 110 101 // 66  85  71   // 6
                    0xB6, //     8 // 182 // 2 6 6 // 10 110 110 // 66  85  85   // 7
                    0xBE, //     9 // 190 // 2 7 6 // 10 111 110 // 66  100 85   // 8
                    0xBF, //    10 // 191 // 2 7 7 // 10 111 111 // 66  100 100  // 9
                    0xFF, //    11 // 255 // 3 7 7 // 11 111 111 // 100 100 100 
                ].reverse(),

                // RGBA32 fade table values.
                fadeMasksRGBA : [],

                // Apply a fade to image data.
                applyFadeToImageDataArray: function(typedData, fadeLevel){
                    let len  = typedData.length;

                    // OFF
                    if(fadeLevel === null){ return; }

                    // BLACK
                    else if(fadeLevel == 10){ 
                        for(let i=0; i<len; i+=4){
                            typedData[i+0] =  0;
                            typedData[i+1] =  0;
                            typedData[i+2] =  0;
                            typedData[i+3] =  255;
                        }
                        return;
                    } 

                    // CLEAR
                    else if(fadeLevel == 11){ typedData.fill(0); return; }

                    // Convert each pixel's color to the max level as specified by the fadeLevel.
                    else{
                        // Need the max values.
                        let fadeColorObj = this.fadeMasksRGBA[fadeLevel];
                        let maxRed   = fadeColorObj[0] / 100; 
                        let maxGreen = fadeColorObj[1] / 100; 
                        let maxBlue  = fadeColorObj[2] / 100; 
                        
                        // Restrict r, g, b, a values and then round down.
                        for(let i=0; i<len; i+=4){
                            // Don't operate on transparent pixels.
                            if(typedData[i+3] != 255){ continue; } 

                            typedData[i+0] =  (typedData[i+0] * maxRed)   | 0;
                            typedData[i+1] =  (typedData[i+1] * maxGreen) | 0;
                            typedData[i+2] =  (typedData[i+2] * maxBlue)  | 0;
                            // typedData[i+3] =  (typedData[i+3])            | 0;
                        }
                    }
                },
            },
            _createRgbaFadeValues: function(){
                let src = this.transforms.fadeMasks;
                let r,g,b;
            
                // Add the values in order (round down to the nearest whole integer).
                for(let i=0, l=src.length; i<l; i+=1){
                    r = ( ( ( ( src[i] & 0b00000111 ) >> 0) / 7 ) * 100 ) << 0;
                    g = ( ( ( ( src[i] & 0b00111000 ) >> 3) / 7 ) * 100 ) << 0;
                    b = ( ( ( ( src[i] & 0b11000000 ) >> 6) / 3 ) * 100 ) << 0;
                    this.transforms.fadeMasksRGBA.push( new Uint8Array([ r, g, b ]) ); 
                }
            },

            convertForTileset: async function(tilesetName){
                // Create fade versions of each tile in the specified tileset.
                let tiles = _GFX.cache[tilesetName].tileset;
                // console.log("convertForTileset:", tilesetName, tiles);

                for(let ti=0, tl=tiles.length; ti<tl; ti+=1){
                    // Copy the tile ImageData for fading.
                    let baseImgData = tiles[ti].imgData;

                    // Create the fadeTiles array if it does not already exist. 
                    if(!tiles[ti].fadeTiles){ tiles[ti].fadeTiles = []; }

                    // Copy the base and fade to each fade level.
                    for(let levelI=0, levelL=this.transforms.fadeMasksRGBA.length; levelI<levelL; levelI+=1){
                        // Skip the creation of the full color and black version of the tile (save some RAM since the draw2logic can already handle this.)
                        if(levelI == 0 || levelI == this.transforms.fadeMasksRGBA.length -1){ continue; }
                        
                        // Copy the base tile to a new ImageData object.
                        let fadeImgData = this.draws.copyRegion( 
                            baseImgData.data, 
                            baseImgData.width, 
                            0, 0, 
                            _GFX.meta.dimensions.tileWidth, 
                            _GFX.meta.dimensions.tileHeight,
                            true
                        );

                        // Fade the copy at the current level to a new ImageData object.
                        this.transforms.applyFadeToImageDataArray(fadeImgData.data, levelI-1);

                        // Create canvas for the fadeImgData.
                        let canvas = new OffscreenCanvas(baseImgData.width, baseImgData.height);
                        let ctx    = canvas.getContext("2d");

                        // Draw the image to the canvas. 
                        ctx.putImageData(fadeImgData, 0, 0);

                        // Store the faded tile to the tile object in fadeTiles.
                        tiles[ti].fadeTiles.push({
                            canvas   : canvas,
                            imgData  : fadeImgData,
                            fadeLevel: levelI,
                        });
                    }
                }
            },
            convertForTileset2: async function(tilesetName){
                // GOALS:
                // One big canvas with each fadeLevel as a separate row consisting of all tiles in the tileset.
                // One row for each fadeLevel.
                
                // Get a handle to the tiles in the tileset. 
                let tiles = _GFX.cache[tilesetName].tileset;
                
                // Create tilesetBaseImgData.
                let tilesetBaseImgData = new ImageData(
                    (_GFX.meta.dimensions.tileWidth * tiles.length), 
                    (_GFX.meta.dimensions.tileHeight * (this.transforms.fadeMasksRGBA.length-1))
                );

                // tilesetBaseImgData to be a strip of tiles.length tiles wide and one tile tall per fade level.
                // There should be 12 fadeLevel entries and the first and the last are ignored.

                // Draw the tileset tiles to the canvas. One row for each fade level. Copy previous row.
                let x=0; let y=0;
                for(let ti=0, tl=tiles.length; ti<tl; ti+=1){
                    // Create the fadeTiles array if it does not already exist for this tile. 
                    if(!tiles[ti].fadeTiles){ tiles[ti].fadeTiles = []; }

                    // Draw the tile to the first canvas row. 
                    // tileset_ctx.putImageData( tiles[ti].imgData, x, y );
                    // Write the tile to the imageData.
                    this.draws.updateRegion_replace(
                        tiles[ti].imgData.data,              // source
                        tiles[ti].imgData.width,             // srcWidth
                        tilesetBaseImgData.data,             // destination
                        tilesetBaseImgData.width,            // destWidth
                        tilesetBaseImgData.height,           // destHeight
                        x * _GFX.meta.dimensions.tileWidth,  // x
                        y * _GFX.meta.dimensions.tileHeight, // y
                        _GFX.meta.dimensions.tileWidth,      // w
                        _GFX.meta.dimensions.tileHeight,     // h
                    );

                    // Increment x.
                    x += 1;
                }

                // The top row of the tileset_canvas should have all tiles now. 
                // Copy the row, fade it, draw it to the correct row based on fadeLevel.

                // Make a copy of the top row which will be copied and written for each fadeLevel.
                // let fadeImgData = this.draws.copyRegion( 
                //     tilesetBaseImgData.data, 
                //     tilesetBaseImgData.width, 
                //     0, 0, 
                //     _GFX.meta.dimensions.tileWidth, _GFX.meta.dimensions.tileHeight,
                //     true
                // );

                x=0; y=0;
                for(let levelI=0, levelL=this.transforms.fadeMasksRGBA.length; levelI<levelL; levelI+=1){
                    // Skip the creation of the full color and black version of the tile (save some RAM since the draw2logic can already handle this.)
                    if(levelI == 0 || levelI == this.transforms.fadeMasksRGBA.length -1){ y++; continue; }

                    // Copy the first row.
                    let fadeImgData = this.draws.copyRegion( 
                        tilesetBaseImgData.data,        // source
                        tilesetBaseImgData.width,       // srcWidth
                        0,                                 // sx
                        0,                                 // sy
                        tilesetBaseImgData.width,          // w
                        _GFX.meta.dimensions.tileHeight,   // h
                        true                               // asImageData
                    );

                    // Fade the copy at the current level to a new ImageData object.
                    this.transforms.applyFadeToImageDataArray(fadeImgData.data, levelI-1);
                    
                    // Write the faded row to tilesetBaseImgData;
                    // console.log(tilesetName, levelI);
                    this.draws.updateRegion_replace(
                        fadeImgData.data,                    // source     
                        fadeImgData.width,                   // srcWidth   
                        tilesetBaseImgData.data,             // destination
                        tilesetBaseImgData.width,            // destWidth  
                        tilesetBaseImgData.height,           // destHeight 
                        0 * _GFX.meta.dimensions.tileWidth,  // dx         
                        y * _GFX.meta.dimensions.tileHeight, // dy         
                        fadeImgData.width,                   // w          
                        _GFX.meta.dimensions.tileHeight,     // h          
                    );
                    
                    // Increment y.
                    y += 1;

                    // DEBUG: See the canvas image.
                    // tilesBG1
                    // tilesSP1
                    // tilesTX1
                    // tilesTX2
                    // tilesMISC
                    // tilesG1
                    // tilesLOAD
                    if(0 && levelI == 9 && tilesetName == "tilesTX1"){
                        setTimeout(()=>{
                            let tileset_canvas = new OffscreenCanvas(tilesetBaseImgData.width, tilesetBaseImgData.height);
                            // let tileset_canvas = new OffscreenCanvas(fadeImgData.width, fadeImgData.height);
                            let ctx    = tileset_canvas.getContext("2d");
                            ctx.putImageData(tilesetBaseImgData, 0, 0);
                            // ctx.putImageData(fadeImgData, 0, 0);
                            tileset_canvas[
                                tileset_canvas.convertToBlob 
                                ? 'convertToBlob' // specs
                                : 'toBlob'        // current Firefox
                            ]()
                            .then(
                                blob => {
                                    const dataURL = new FileReaderSync().readAsDataURL(blob);
                                    console.log(tilesetName);
                                    console.log(dataURL);
                                }
                            );
                        }, 1000);
                    }
                }

                // Convert the tilesetBaseImgData to canvas.
                let tileset_canvas = new OffscreenCanvas(tilesetBaseImgData.width, tilesetBaseImgData.height);
                let ctx    = tileset_canvas.getContext("2d");
                ctx.putImageData(tilesetBaseImgData, 0, 0);

                // For each tile...
                for(let ti=0, tl=tiles.length; ti<tl; ti+=1){
                    // For each fadeLevel...
                    for(let levelI=0, levelL=this.transforms.fadeMasksRGBA.length; levelI<levelL; levelI+=1){
                        // Skip the creation of the full color and black version of the tile (save some RAM since the draw2logic can already handle this.)
                        if(levelI == 0 || levelI == this.transforms.fadeMasksRGBA.length -1){ y++; continue; }

                        // Create canvas for the fadeImgData.
                        let canvas = new OffscreenCanvas(
                            _GFX.meta.dimensions.tileWidth,
                            _GFX.meta.dimensions.tileHeight
                        );
                        let ctx    = canvas.getContext("2d");

                        // Draw the image to the canvas. 
                        ctx.drawImage(
                            tileset_canvas,                    // image
                            ti*_GFX.meta.dimensions.tileWidth, // sx
                            // 0,                                 // sy
                            levelI * _GFX.meta.dimensions.tileWidth, // sy
                            _GFX.meta.dimensions.tileWidth,    // sWidth
                            _GFX.meta.dimensions.tileHeight,   // sHeight
                            0,                                 // dx
                            0,                                 // dy
                            _GFX.meta.dimensions.tileWidth,    // dWidth
                            _GFX.meta.dimensions.tileHeight    // dHeight
                        );

                        // Copy this tile as imgData.
                        let fadeImgData = this.draws.copyRegion( 
                            tilesetBaseImgData.data,                 // source
                            tilesetBaseImgData.width,                // srcWidth
                            ti*_GFX.meta.dimensions.tileWidth,       // sx
                            levelI * _GFX.meta.dimensions.tileWidth, // sy
                            _GFX.meta.dimensions.tileHeight,         // w
                            _GFX.meta.dimensions.tileHeight,         // h
                            true                                     // asImageData
                        );

                        // Store the faded tile to the tile object in fadeTiles.
                        tiles[ti].fadeTiles.push({
                            canvas   : canvas,
                            imgData  : fadeImgData,
                            fadeLevel: levelI,
                        });
                    }
                }
                // BASE TILES CANVAS: 
                // Create ImageData for each tile in the tileset.
                // Create a row for each fade level.
                // Fade each row according to the fade level.
                // Break-out each tile from each fade level in the ImageData and store them to .fadeTiles.

                // Create a new ImageData that will have each tile written to it as one row.

                // Convert the ImageData of the baseTilesCanvas to 


            },
            convertAllTilesets: async function(type){
                // console.log("convertAllTilesets");

                // Need to create fade versions of each tile in each tileset.
                let proms = [];
                for(let tilesetName in _GFX.cache){
                    let tilesetObj = _GFX.cache[tilesetName];
                    let tiles = tilesetObj.tileset;
                    // console.log("tilesetName:", tilesetName);
                    // console.log("tilesetObj :", tilesetObj);
                    // console.log(`tilesetName: '${tilesetName}', tiles:`, tiles);

                    proms.push(
                        new Promise(async (res,rej)=>{
                            let ts = performance.now();
                            // await this.convertForTileset(tilesetName);
                            await this.convertForTileset2(tilesetName);
                            let msg = `NEW: Created fade tileset: ${tilesetName}, length: ${tiles.length.toString().padStart(4, " ")} tiles. (${(performance.now()-ts).toFixed(2)}ms)`;
                            // // if(type=="init"){
                            // //     self.postMessage( {  "mode" : "loading_progress", "data" : msg, }, [] );
                            // // }
                            // console.log(msg);
                            res();
                        })
                    );
                }
                await Promise.all(proms);
            },

            init: async function(){
                // .imgData
                this._createRgbaFadeValues();
            },
        },

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
            
            // TODO: The fade does not work but the tiles appear to be created.
            // Also, the processing time appears to be about the same. I expected a much better improvement.
            await this.NEWFADECONVERSION.init(); // NEW
            await this.NEWFADECONVERSION.convertAllTilesets(type); // NEW

            // await _GFX.fade.convertAllTilesets(type); // OLD
            _GFX.timeIt("convertAllFadeTilesets", "stop");
            this.isEnabled = true; 

            let debugData = {};
            if( _GFX.meta.videoModeA_config.debugGFX.generateAndReturnFadedTiles ){
                _GFX.timeIt("DEBUG_generateAndReturnFadedTiles", "start");
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
                _GFX.timeIt("DEBUG_generateAndReturnFadedTiles", "stop");
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

    // Draws from VRAM.
    draw_vram: function(type="vram", changes=[]){
        const dimensions          = _GFX.meta.dimensions;
        const tilesetNames        = Object.keys(_GFX.cache);
    
        // let directToCanvasDraw = false; // Uses putImageData.
        let directToCanvasDraw = true; // Uses drawImage.

        if(type == "vram"){
            // Need to completely redraw from each VRAM layer.
            for(let i=0, l1=_GFX.meta.layers.length; i<l1; i+=1){
                for(let vramLayerI=0, l2=_GFX.VRAM._VRAM.length; vramLayerI<l2; vramLayerI+=1){
                    // Get the layer VRAM, CANVAS.
                    let thisVRAM    = _GFX.VRAM._VRAM[vramLayerI];
                    let layerCanvas = _GFX.canvasLayers[vramLayerI];
                    let layerCanvas_imgData = _GFX.canvasLayers[vramLayerI].imgData;

                    // Read through each VRAM layer.
                    for(let vramLayerIndex=0, vramLayerIndex_len=_GFX.VRAM.coordsByIndex.length; vramLayerIndex < vramLayerIndex_len; vramLayerIndex += 1){
                        let [y, x] = _GFX.VRAM.coordsByIndex[vramLayerIndex];
                        let vramIndex     = _GFX.VRAM.indexByCoords[y][x];
                        let tilesetIndex  = thisVRAM.view[vramIndex + 0];
                        let tileId        = thisVRAM.view[vramIndex + 1];
                        let tilesetName   = tilesetNames[ tilesetIndex ];
                        let tileset       = _GFX.cache[ tilesetName ].tileset;
                        let tileImageData = tileset[tileId] ; 
                        let tile          = tileset[tileId] ;

                        // Is the tile transparent or the fade is set to full transparent?

                        // Determine what tile (base, fade, black) that needs to be drawn.
                        // BASE:
                        if(_GFX.fade.currentFadeIndex == 0 || !_GFX.fade.isEnabled){ 
                            tileImageData = tile.imgData;
                            tile          = tile.canvas; 
                        }
                        // FADE: BLACK
                        else if( _GFX.fade.currentFadeIndex >= _GFX.fade.CONSTS.fadeTable.length -1 ){
                            if(directToCanvasDraw){
                                layerCanvas.ctx.clearRect( 
                                    (x * dimensions.tileWidth), 
                                    (y * dimensions.tileHeight), 
                                    dimensions.tileWidth , 
                                    dimensions.tileHeight
                                );
                                continue; 
                            }
                            else{}
                        }
                        // FADE: INDEX
                        else{ 
                            tileImageData = tile.fadeTiles[ _GFX.fade.currentFadeIndex-1 ].imgData; 
                            tile          = tile.fadeTiles[ _GFX.fade.currentFadeIndex-1 ].canvas; 
                        }

                        // DRAW.
                        if(directToCanvasDraw){
                            layerCanvas.ctx.drawImage(tile, x* dimensions.tileWidth, y*dimensions.tileHeight);
                        }
                        else{
                            // layerCanvas_imgData
                            // console.log(tilesetName, vramLayerI, x, y);
                            _GFX.fade.NEWFADECONVERSION.draws.updateRegion_replace(
                                tileImageData.data,              // source
                                tileImageData.width,             // srcWidth
                                layerCanvas_imgData.data,        // destination
                                layerCanvas_imgData.width,       // destWidth
                                layerCanvas_imgData.height,      // destHeight
                                x * dimensions.tileWidth,        // x
                                y * dimensions.tileHeight,       // y
                                tileImageData.width,  // w
                                tileImageData.height, // h
                            );
                        }
                    }
                    
                    if(!directToCanvasDraw){
                        // console.log("putImageData", vramLayerI);
                        layerCanvas.ctx.putImageData(layerCanvas_imgData, 0, 0);
                    }
                }
            }
            
            // Use the imgData of the canvasLayers.
            // for(let layer of _GFX.canvasLayers){}
            
            // Use the canvas of the canvasLayers.
            // for(let layer of _GFX.canvasLayers){}
        }
        else{
            console.log("ERROR: draw_vram: Invalid type specified.", type);
        }
    },

    // Draws from changes.
    draw_changes: function(type="vram", changes=[] ){
        let dimensions = _GFX.meta.dimensions;
        let tilesetNames = Object.keys(_GFX.cache);
        let tileset;
        let numDraws = {};
        for(let layer of _GFX.meta.layers){ numDraws[layer.name] = 0; }

        if(type=="changes"){
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

                numDraws[_GFX.VRAM._VRAM[change.layerIndex].name] += 1;

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
            console.log("ERROR: draw_changes: Invalid type specified.", type);
        }

        return numDraws;
    },

    // Wrapper to draw_changes/draw_vram. Draws from VRAM and/or changes.
    draw: function(event){
        // This function updates local VRAM and draws the changes.
        // It is expected that the data sent to this function is correct and free of duplication.
        _GFX.timeIt("DRAW_TOTAL", "start");

        let numDraws = {
            clearVram: event.data.data.clearVram_flag,
            changes: {},
            vram: {},
        };

        let dimensions = _GFX.meta.dimensions;
        _GFX.timeIt("DRAW_clearVram_flag", "start");
        if(event.data.data.clearVram_flag){
            // Clear the VRAM. Fill all VRAM layers with 0 (tileIndex to 0, tileId to 0, and x,y coordinate to 0.)
            for(let i=0, l=_GFX.VRAM._VRAM.length; i<l; i+=1){ _GFX.VRAM._VRAM[i].view.fill(0); }

            // Clear each canvas layer.
            for(let i=0, l=_GFX.VRAM._VRAM.length; i<l; i+=1){
                _GFX.canvasLayers[i].ctx.clearRect( (0 * dimensions.tileWidth), (0 * dimensions.tileHeight), (_GFX.canvasLayers[i].canvas.width), (_GFX.canvasLayers[i].canvas.height));
            }
        }
        _GFX.timeIt("DRAW_clearVram_flag", "stop");

        // Draw changes to the canvases and update VRAM?.
        _GFX.timeIt("DRAW_changes", "start");
        if(Object.keys(event.data.data.changes).length){
            numDraws.draw_changes = this.draw_changes("changes", event.data.data.changes);
        }
        _GFX.timeIt("DRAW_changes", "stop");

        // Force a redraw using the fadetile versions.
        _GFX.timeIt("DRAW_fade", "start");
        // _GFX.fade.isEnabled = false;
        if(_GFX.fade.isEnabled && (_GFX.fade.previousFadeIndex != event.data.data.currentFadeIndex)){ 
            // Update to the new currentFadeIndex.
            _GFX.fade.currentFadeIndex = event.data.data.currentFadeIndex;

            // Redraw the entire VRAM but with the fadeTiles at the currentFadeIndex.
            numDraws.vram = this.draw_vram("vram", []);

            // Update previousFadeIndex so that this check only happens once per fade level change.
            _GFX.fade.previousFadeIndex = _GFX.fade.currentFadeIndex;
        }
        _GFX.timeIt("DRAW_fade", "stop");

        _GFX.timeIt("DRAW_TOTAL", "stop");

        // Inform the main thread that we are done. 
        self.postMessage( 
            { 
                "mode" : event.data.mode, 
                "data" : {
                    "DRAW_TOTAL"         : _GFX.timeIt("DRAW_TOTAL"         , "get"),
                    "DRAW_clearVram_flag": _GFX.timeIt("DRAW_clearVram_flag", "get"),
                    "DRAW_changes"       : _GFX.timeIt("DRAW_changes"       , "get"),
                    "DRAW_fade"          : _GFX.timeIt("DRAW_fade"          , "get"),
                    "numDraws"           : numDraws,
                },
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
            layer.imgData = new ImageData(layer.canvas.width, layer.canvas.height);
            // layer.ctx.clearRect(0, 0, layer.canvas.width, layer.canvas.height);
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
        case "init"             : { _GFX.init(event);           break; } 
        case "initFade"         : { _GFX.fade.init("postInit"); break; } 
        case "returnInitTimes"  : { _GFX.returnInitTimes();     break; } 

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

