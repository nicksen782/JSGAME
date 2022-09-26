let _GFX = {
    // Canvas caches of tiles, tilemaps, config.
    cache:{},

    // VRAM - Holds graphics states.
    VRAM: [
    ],

    // Functions for drawing tiles/tilemaps text.
    draw: {
        parent: null,
        // Drawing for grid-aligned tiles and tilemaps. 
        tiles: {
            parent: null,
            setTile :function(tileName=" ", x, y, xcolLayer=1, tilesetName){
                // Set the tileset name if it was not specified. 
                if(!tilesetName){ 
                    // Fail if the xcolLayer is not an index of VRAM.
                    if(!this.parent.VRAM[xcolLayer]){ console.log(`ERROR: setTile: xcolLayer: ${xcolLayer} not found in VRAM layers.`); return; }
                    
                    // Set the tilesetName from the layer tileset value.
                    tilesetName = VRAM[xcolLayer].tileset; 
                }
    
                // Get the dimensions.
                let dimensions = _JSG.loadedConfig.meta.dimensions;
    
                // Bounds-checking. (Ignore further chars on x if oob. Ignore oob on y too.)
                let oob_x = x >= dimensions.cols ? true : false;
                let oob_y = y >= dimensions.rows ? true : false;
                if(oob_x){ 
                    console.log(`oob_x:${x} >> x:${x}, y${y}, tileName:${tileName}, xcolLayer:${xcolLayer}`); 
                    return;
                }
                if(oob_y){ 
                    console.log(`oob_y:${y} >> x:${x}, y${y}, tileName:${tileName}, xcolLayer:${xcolLayer}`); 
                    return;
                }
    
                // Numbers and spaces cannot be used as JSON keys. This is the fix.
                if(tileName.length == 1 && tileName.match(/[0-9\s]/g)){
                    tileName = `n${tileName}`;
                }
    
                // Check for the tile. If not found then use 'nochar'.
                // try{
                //     if(_APP.m_config.tilenamesByIndex.indexOf(tileName) == -1){ 
                //         console.log("setTile: Tile not found:", tileName); 
                //         tileName = 'nochar'; 
                //     };
                // }
                // catch(e){
                //     console.log("ERROR: setTile : ", tileName);
                //     tileName = 'nochar'; 
                // }
                
                // "Draw" the tile to VRAM.
                this._updateVramTile_flat(tileName, x, y, xcolLayer);
            },
            print   :function(str="", x, y, xcolLayer=2, tilesetName=null){
                // Set the tileset name if it was not specified. 
                if(!tilesetName){ 
                    // Fail if the xcolLayer is not an index of VRAM.
                    if(!this.parent.VRAM[xcolLayer]){ console.log(`ERROR: print: xcolLayer: ${xcolLayer} not found in VRAM layers.`); return; }
                    
                    // Set the tilesetName from the layer tileset value.
                    tilesetName = VRAM[xcolLayer].tileset; 
                }
    
                // Convert to string if the input is a number. 
                if(typeof str == "number"){ str = str.toString(); }
                
                // Set the string to uppercase.
                // str = str.toUpperCase();
                // /^[a-zA-Z]+$/.test("a");
                // /^[0-9]+$/.test("1");
    
                // Break up the string into separate chars.
                let chars = str.split("");
    
                // Loop through the list of chars and draw them.
                for(let i=0; i<chars.length; i+=1){
                    this.setTile(chars[i], x++, y, xcolLayer, tilesetName);
                }
            },
            fillTile:function(tileName=" ", x, y, w, h, xcolLayer=0, tilesetName=null){
                // Set the tileset name if it was not specified. 
                if(!tilesetName){ 
                    // Fail if the xcolLayer is not an index of VRAM.
                    if(!this.parent.VRAM[xcolLayer]){ console.log(`ERROR: fillTile: xcolLayer: ${xcolLayer} not found in VRAM layers.`); return; }
                    
                    // Set the tilesetName from the layer tileset value.
                    tilesetName = VRAM[xcolLayer].tileset; 
                }
    
                for(let dy=0; dy<h; dy+=1){
                    for(let dx=0; dx<w; dx+=1){
                        this.setTile(tileName, x+dx, y+dy, xcolLayer, tilesetName);
                    }
                }
            },
            drawMap:function(){
                 // Create a tilemap image canvas out of tiles for each tilemap.
                 let index = 0;
                 for(let y=0; y<h; y+=1){
                     for(let x=0; x<w; x+=1){
                         let tileId =  tilemap[index];
                         let canvas = this.cache[json.tilesetName].tileset[ tileId ].canvas;
                         let dx = x * json.config.tileWidth ;
                         let dy = y * json.config.tileHeight;
                         tilemapCtx.drawImage( canvas, dx, dy );
                     }
                 }
            },
        },

        // Drawing for non-grid-aligned tiles and tilemaps. 
        sprites:{
            parent: null,
        },

        init: async function(parent){
            return new Promise(async (resolve, reject)=>{
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
            // return { r: parseInt(nR), g: parseInt(nG), b: parseInt(nB), a: parseInt(255) };
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
                        // console.log("translucent pixel");
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
                    canvas    : tilemapCanvas, 
                    ctx       : tilemapCtx,
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
                    let jsonTileset = _APP.files[_JSG.loadedConfig.meta.tilesets[i]];
                    let tilesetName = jsonTileset.tilesetName;
                    // console.log(tilesetName, jsonTileset);
                    
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
                    console.log(`TILESET : ${tilesetName}: Conversion : ${(tse-tss).toFixed(2)}ms` );
                    
                    // Convert the tilemaps.
                    tss = performance.now(); 
                    this.convertTilemaps(jsonTileset);
                    tse = performance.now(); 
                    console.log(`TILEMAPS: ${tilesetName}: Conversion : ${(tse-tss).toFixed(2)}ms` );
                }
                resolve();
            });
        },

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
            await this.gfxConversion.init(this);
            await this.draw.init(this);

            resolve();
        });
    },
};
console.log("Hey! I'm Video Mode A!");