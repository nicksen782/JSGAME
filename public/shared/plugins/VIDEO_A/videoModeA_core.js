_GFX = {};

// INTERNAL: WebWorker functions.
_WEBW.videoModeA = {
    video: {
        // Holds the WebWorker instance.
        webworker: undefined,

        // Tracks what part of the conversation per mode is expected.
        messageStates: {
            init       : { waiting: false } ,
            vram_update: { waiting: false } ,
            fade       : { waiting: false } ,
        },

        // SHARED: Receives messages from the WebWorker and routes the message to the matching function(s).
        RECEIVE: function(e){
            // console.log("_WEBW.videoModeA.video: RECEIVE:", e.data.mode, e.data);

            // Make sure there is data and a data.mode.
            if(e.data && e.data.mode){
                switch(e.data.mode){
                    case "init"       : this.initReceive       (e.data.data); break;
                    case "vram_update": this.vram_updateReceive(e.data.data); break;
                    case "fade"       : this.fadeReceive       (e.data.data); break;

                    // Unmatched function.
                    default     : { 
                        console.log("ERROR: Unmatched mode", e.data.mode); 
                        break; 
                    }
                }
            }
            else{ console.log(`ERROR: No mode? e.data: ${e.data}, e.data.mode: ${e.data.mode}, e:`, e); }
        },
        // SHARED: Will repeatedly check for the messageStates "waiting" key to be set to false before resolving.
        waitForResp: async function(resolve, reject, ww_mode_key, waitCheckMs){
            try{
                return new Promise((res,rej)=>{
                    let id = setInterval( ()=>{
                        if( _WEBW.videoModeA.video.messageStates[ww_mode_key].waiting == false ){
                            // console.log("waitForResp: DONE", key);
                            clearInterval(id);
                            res();
                            resolve();
                        }
                        // else{ console.log("waitForResp: WAIT", key); }
                    }, waitCheckMs );
                });
            }
            catch(e){ reject(e); }
        },

        // INIT: Sends graphics data to the WebWorker for later use.
        initSend: function(waitForResp=true, waitCheckMs=1){
            return new Promise(async(resolve,reject)=>{
                // Update the message state.
                let ww_mode_key = "init";
                this.messageStates.init.waiting = true;

                let data = { 
                    cache: {},
                    VRAM: { 
                        _VRAM        : _GFX.VRAM._VRAM ,
                        indexByCoords: _GFX.VRAM.indexByCoords ,
                    },
                    meta: {
                        layers    : _JSG.loadedConfig.meta.layers,
                        dimensions: _JSG.loadedConfig.meta.dimensions,
                    }
                };console.log("DATA:", data);

                for(let i=0, l=_JSG.loadedConfig.meta.layers.length; i<l; i+=1){
                }

                // Need full json, each tile imageData, hasTransparency, each tilemap name, rot 0, and orgTilemap.
                let ts_keys = Object.keys(_GFX.cache);
                for(let ts_key=0, l=ts_keys.length; ts_key<l; ts_key+=1){
                    // Get handle to the tileset key.
                    let key = ts_keys[ts_key];
                    let tileset = _GFX.cache[key];

                    // Add the key to the data.
                    data.cache[key] = {
                        json:{},
                        tileset:[],
                        tilemap:{},
                    };

                    // Add the most of the json.
                    data.cache[key].json = {
                        config: tileset.json.config,
                        tileset: tileset.json.tileset,
                    }  ;
                    
                    // Get the tileWidth and tileHeight for this tileset.
                    let tileWidth  = tileset.json.config.tileWidth;
                    let tileHeight = tileset.json.config.tileHeight;

                    // Go through each tile in the tileset and use the ctx to create imageData.
                    for(let t=0, tl= tileset.tileset.length; t<tl; t+=1){
                        let tile = tileset.tileset[t];
                        data.cache[key].tileset.push( {
                            imgData : tile.ctx.getImageData(0, 0, tileWidth, tileHeight),
                            hasTransparency: tile.hasTransparency, 
                        } ) ;
                    }

                    // Go through each tilemap in the tileset and add the orgTilemap. (First rotation only).
                    let tilemap_keys = Object.keys(tileset.tilemap);
                    for(let tm=0, tml= tilemap_keys.length; tm<tml; tm+=1){
                        let tmKey = tilemap_keys[tm];
                        let tilemap = tileset.tilemap[tmKey];
                        data.cache[key].tilemap[tmKey] = tilemap[0].orgTilemap;
                    }
                }

                // console.log("_WEBW.videoModeA: initSend:", data);
                _WEBW.videoModeA.video.webworker.postMessage(
                    {
                        mode: "init",
                        data: data,
                    }, 
                    []
                );

                // Wait until finished?
                if(waitForResp){ await this.waitForResp(resolve, reject, ww_mode_key, waitCheckMs); resolve(); return; }

                // No wait.
                resolve();
            });
        },
        initReceive: function(data){
            // Update the message state.
            let ww_mode_key = "init";
            this.messageStates[ww_mode_key].waiting = false;
            // console.log("_WEBW.videoModeA: initReceive:", data, this.messageStates);
        },

        // VRAM: Updates to WebWorker VRAM.
        vram_updateSend   : function(waitForResp=false, waitCheckMs=1){
            return new Promise(async(resolve,reject)=>{
                // Update the message state.
                let ww_mode_key = "vram_update";
                this.messageStates[ww_mode_key].waiting = true;

                // console.log("_WEBW.videoModeA: vram_updateSend:", _GFX.VRAM._VRAM);
                _WEBW.videoModeA.video.webworker.postMessage(
                    {
                        mode: "vram_update",
                        data: {
                            VRAM: {
                                _VRAM: _GFX.VRAM._VRAM
                            },
                        }
                    }, 
                    []
                );

                // Wait until finished?
                if(waitForResp){ await this.waitForResp(resolve, reject, ww_mode_key, waitCheckMs); resolve(); return; }

                // No wait.
                resolve();
            });
        },
        vram_updateReceive: function(data){
            let ww_mode_key = "vram_update";
            this.messageStates[ww_mode_key].waiting = true;

            console.log("_WEBW.videoModeA: vram_updateReceive:", data, this.messageStates);
        },

        // FADE: Request/Receive fade layers.
        fadeObj: {
        },
        fadeSend          : function(waitForResp=false, waitCheckMs=1){
            return new Promise(async(resolve,reject)=>{
                // Update the message state.
                let ww_mode_key = "fade";
                this.messageStates[ww_mode_key].waiting = true;

                console.log("_WEBW.videoModeA: fadeSend:", _GFX.VRAM._VRAM);
                _WEBW.videoModeA.video.webworker.postMessage(
                    {
                        mode: "fade",
                        data: {
                            VRAM: {
                                _VRAM: _GFX.VRAM._VRAM
                            },
                        }
                    }, 
                    []
                );

                // Wait until finished?
                if(waitForResp){ await this.waitForResp(resolve, reject, ww_mode_key, waitCheckMs); resolve(); return; }

                // No wait.
                resolve();
            });
        },
        fadeReceive       : async function(data){
            let getDataUrlFromImageData = function(imgData){
                let canvas = document.createElement("canvas");
                canvas.width = imgData.width;
                canvas.height = imgData.height;
                let ctx = canvas.getContext("2d");
                ctx.putImageData(imgData, 0, 0);
                console.log(canvas.toDataURL());
            };
            // Update the message state.
            this.messageStates.fade.waiting = false;

            console.log("_WEBW.videoModeA: fadeReceive:", data, this.messageStates);
            _GFX.test = data;

            // Hide the "user" canvases.
            for(let i=0, l=_GFX.canvasLayers.length; i<l; i+=1){
                if(_GFX.canvasLayers[i].type == "user"){ _GFX.canvasLayers[i].canvas.style["display"] = "none"; }
            }

            _APP.game.gameLoop.running = false;
            for(let c=0; c<50; c+=1){
                for(let i=0, l=data.length; i<l; i+=1){
                    console.log("fade:", i);
                    _GFX.canvasLayers[3].ctx.putImageData(data[i], 0, 0);
                    await new Promise((res,rej)=>{ setTimeout(()=>res(), 100); });
                }
                for(let i=data.length-1, l=0; i>=l; i-=1){
                    console.log("fade:", i);
                    _GFX.canvasLayers[3].ctx.putImageData(data[i], 0, 0);
                    await new Promise((res,rej)=>{ setTimeout(()=>res(), 100); });
                }
            }
        },

        // Init this WebWorker.
        init: function(parent){
            return new Promise(async (resolve,reject)=>{
                let ww_ts = performance.now();

                // Create the WebWorkers and their message event listeners.
                _WEBW.videoModeA.video.webworker = new Worker( "shared/plugins/VIDEO_A/videoModeA_webworker.js" );
                _WEBW.videoModeA.video.webworker.addEventListener("message", (e)=>_WEBW.videoModeA.video.RECEIVE(e), false);

                // Send the init for the webworker.
                await _WEBW.videoModeA.video.initSend(true, 1);

                // Update the loadingDiv messages.
                if( _WEBW.videoModeA.video.messageStates.init.waiting == false ){
                    msg1 = `init: WebWorker: _WEBW.videoModeA.video - COMPLETE (${(performance.now() - ww_ts).toFixed(2)}ms)`;
                    _JSG.loadingDiv.addMessageChangeStatus(`  videoModeA: ${msg1}`, "loading");
                    console.log(msg1);
                    resolve();
                }
                else{
                    console.log("_WEBW.videoModeA.video is waiting.");
                }
            });

        },
    },
};

// INTERNAL: Canvas caches of tiles, tilemaps, config.
_GFX.cache = {};

// INTERNAL: 
_GFX.canvasLayers = [];

// INTERNAL: VRAM - Holds graphics states.
_GFX.VRAM = {
    // ArrayBuffer of VRAM.
    _VRAM: [
        // {view: undefined, buffer: undefined }
    ],

    // Lookup table: Get VRAM index by y, x.
    indexByCoords:[],

    // Holds the changes to VRAM that will be drawn on the next draw cycle.
    changes: [],
    
    // Creates the VRAM._VRAM typedArray. (Should only be run once).
    initVram_typedArray: function(){
        // Get the dimensions.
        let dimensions  = _JSG.loadedConfig.meta.dimensions;

        // Get the total size for _VRAM. (number of layers * 2 bytes per layer * rows * cols)
        let numIndexes = (2) * (dimensions.rows * dimensions.cols);
        
        // Create the _VRAM arraybuffer and the _VRAM dataview.
        if(dimensions.pointersSize == 8){
            let entry;
            for(let i=0, l=_GFX.canvasLayers.length; i<l; i+=1){
                // Only create VRAM for the "user" type layers (not FADE).
                if(_GFX.canvasLayers[i].type != "user"){ continue; }

                // Create the object with an ArrayBuffer and a TypedArray view.
                entry = {};
                entry.buffer = new ArrayBuffer(numIndexes);
                entry.view = new Uint8Array(entry.buffer);
                entry.name = _GFX.canvasLayers[i].name;

                // Fill with 0 (tileIndex to 0, tileId to 0 for each layer and x,y coordinate.)
                entry.view.fill(0);

                // Add the VRAM layer entry to the _VRAM array.
                this._VRAM.push( entry ) ;
            }
        }

        else if(dimensions.pointersSize == 16){
            // 16-bit requires twice the indexes for the ArrayBuffer.
            let entry;
            for(let i=0, l=_GFX.canvasLayers.length; i<l; i+=1){
                // Only create VRAM for the "user" type layers (not FADE).
                if(_GFX.canvasLayers[i].type != "user"){ continue; }

                // Create the object with an ArrayBuffer and a TypedArray view.
                entry = {};
                entry.buffer = new ArrayBuffer(numIndexes * 2);
                entry.view = new Uint16Array(entry.buffer);
                entry.name = _GFX.canvasLayers[i].name;

                // Fill with 0 (tileIndex to 0, tileId to 0 for each layer and x,y coordinate.)
                entry.view.fill(0);

                // Add the VRAM layer entry to the _VRAM array.
                this._VRAM.push( entry ) ;
            }
        }

        // This should not be reached because initChecks would have already caught it.
        else{
            let msg1 = `ERROR: initVram_typedArray: Invalid pointerSize.`;
            console.log(msg1);
            throw msg1;
        }
    },

    // Updates VRAM values and calls addToVramChanges.
    updateVram: function(tileId, x, y, tilesetIndex, layerIndex){
        // Get the tilesetName.
        let tilesetName = _JSG.loadedConfig.meta.tilesets[tilesetIndex];
        if(!tilesetName){ console.log(`updateVram: Tileset index '${tilesetIndex}' was not found.`); return; }
        
        // Update _VRAM_view.
        let VRAM_startIndex = this.indexByCoords[y][x];
        this._VRAM[layerIndex].view[VRAM_startIndex + 0] = tilesetIndex;
        this._VRAM[layerIndex].view[VRAM_startIndex + 1] = tileId;

        // Add to VRAM changes.
        this.addToVramChanges(tileId, x, y, tilesetIndex, layerIndex);
    },

    // Adds to the changes array. 
    addToVramChanges: function(tileId, x, y, tilesetIndex, layerIndex){
        // Try to find a matching change based on x,y, and layerIndex.
        let existingChangeRec = this.changes.find(c => {
            if( c.x == x && c.y == y && c.layerIndex == layerIndex ){ 
                // console.log("IS EXISTING:", c);
                return true; 
            } 
            
            // console.log("NOT EXISTING:", c);
            return false;
        });

        // Do we have a match on x,y, and layerIndex?
        if(existingChangeRec){
            // Yes. Same layer and same position. Have either of the other values changed?
            if( existingChangeRec.tileId != tileId || existingChangeRec.tilesetIndex != tilesetIndex ){ 
                existingChangeRec = {
                    tileId      : tileId,
                    x           : x, 
                    y           : y,
                    tilesetIndex: tilesetIndex,
                    layerIndex  : layerIndex,
                };
                // console.log("addToVramChanges: OVERWRITTEN", existingChangeRec);
                return; 
            }
            // console.log("addToVramChanges: OLD RECORD - UNCHANGED", existingChangeRec);
        }
        
        // Add the change since it doesn't already exist.
        let newChange = {
            tileId      : tileId,
            x           : x, 
            y           : y,
            tilesetIndex: tilesetIndex,
            layerIndex  : layerIndex,
        };
        this.changes.push(newChange);
        // console.log("addToVramChanges: ADDED", newChange);
    },

    // Clears the changes array.
    clearVramChanges: function(){
        // console.log(`clearVramChanges`);
        this.changes = [];
    },
    
    // Creates the indexByCoords lookup table. 
    create_VRAM_indexByCoords:function(){
        let dimensions = _JSG.loadedConfig.meta.dimensions;

        // This table is used by updateVram and draw to quickly get the starting VRAM index for a given x and y.
        for(let row=0;row<dimensions.rows;row+=1){
            this.indexByCoords.push([]);
            for(let col=0; col < dimensions.cols; col+=1){
                let index = (row * (dimensions.cols *2)) + (col*2);
                this.indexByCoords[row].push(index);
            }
        }
    },

    // Set VRAM to all 0 (The tileId of 0 should be the fully transparent tile in each tileset.)
    clearVram: function(){
        // Dump the changes. 
        this.clearVramChanges();

        // Fill all VRAM layers with 0 (tileIndex to 0, tileId to 0, and x,y coordinate to 0.)
        for(let i=0, l=this._VRAM.length; i<l; i+=1){ this._VRAM[i].view.fill(0); }

        // Set flag to indicate a full clear of VRAM. (draw will use clearRect to Clear the whole canvas).
        this.clearVram_flag = true;
    },

    // Draws to the app canvas based on the contents of the changes array.
    draw: function(method = 0){
        return new Promise((resolve,reject)=>{
            // Get the dimensions.
            let dimensions  = _JSG.loadedConfig.meta.dimensions;

            // If this flag is set just clear the canvases directly. Any changes after clearVram was run will still be available.
            if(this.clearVram_flag){
                for(let i=0, l=_GFX.VRAM._VRAM.length; i<l; i+=1){
                    // Clear the layer.
                    _GFX.canvasLayers[i].ctx.clearRect( (0 * dimensions.tileWidth), (0 * dimensions.tileHeight), (_GFX.canvasLayers[i].canvas.width), (_GFX.canvasLayers[i].canvas.height));
                }

                // Set the flag back to false.
                this.clearVram_flag = false;
            }

            // TODO
            // Are there any regions to pre-clear before drawing? (tilemaps, fillTile).

            // Abort if there are no changes. 
            if(!this.changes.length){ resolve(); return; }

            // Draw changes to individually layered DOM canvases.
            if(method == "0"){
                // Go through the VRAM changes.
                for(let i=0; i<this.changes.length; i+=1){
                    // Break out the changes array.
                    let tileId       = this.changes[i].tileId;
                    let x            = this.changes[i].x;
                    let y            = this.changes[i].y;
                    let tilesetIndex = this.changes[i].tilesetIndex;
                    let layerIndex   = this.changes[i].layerIndex;

                    // Get the tilesetName.
                    let tilesetName = _JSG.loadedConfig.meta.tilesets[tilesetIndex];

                    // Get the tileset.
                    let tileset     = _GFX.cache[tilesetName].tileset;

                    // Clear the destination if the new tile has transparency. (This is prevent the old image from showing through.)
                    if(tileset[tileId].hasTransparency){
                        // console.log("hasTransparency", `tilesetName: ${tilesetName}, tileId: ${tileId}, layerIndex: ${layerIndex}`);
                        _GFX.canvasLayers[layerIndex].ctx.clearRect( (x * dimensions.tileWidth), (y * dimensions.tileHeight), (dimensions.tileWidth), (dimensions.tileHeight));
                    }

                    // Draw to the destination. 
                    _GFX.canvasLayers[layerIndex].ctx.drawImage(tileset[tileId].canvas, (x * dimensions.tileWidth), (y * dimensions.tileHeight));
                }
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
        checks: {
            setTile                    : function(tileId, x, y, tilesetIndex, layerIndex){
                // Checks.
                if(tileId == null)      { console.log("setTile: The tileId was not specified."); return false; }
                if(x == null)           { console.log("setTile: The x was not specified."); return false; }
                if(y == null)           { console.log("setTile: The y was not specified."); return false; }
                if(tilesetIndex == null){ console.log("setTile: The tilesetIndex was not specified."); return false; }
                if(layerIndex == null)  { console.log("setTile: The layerIndex was not specified."); return false; }

                // Make sure that the layerIndex is valid.
                let numLayers = _JSG.loadedConfig.meta.layers.length;
                if(layerIndex < 0 || layerIndex >= numLayers){ console.log("setTile: The layerIndex is not valid."); return false;  }

                // Get the tilesetName.
                let tilesetName = _JSG.loadedConfig.meta.tilesets[tilesetIndex];
                if(!tilesetName){ console.log(`setTile: Tileset index '${tilesetIndex}' was not found.`); return false; }
                
                // Get the tileset.
                let tileset     = _GFX.cache[tilesetName].tileset;
                if(!tileset){ console.log(`setTile: Tileset '${tilesetName}' was not found.`); return false; }

                // Check for the tile. If not found then skip.
                if(undefined == tileset[tileId] || !tileset[tileId].canvas){ console.log(`setTile: Tile canvas for '${tilesetName}':'${tileId}' was not found.`); return false; }

                // Get the dimensions.
                let dimensions  = _JSG.loadedConfig.meta.dimensions;

                // Bounds-checking. (Skip any tile that would be written out of bounds.
                let oob_x = x >= dimensions.cols ? true : false;
                let oob_y = y >= dimensions.rows ? true : false;
                if(oob_x){ 
                    console.log(`setTile: Out-Of-Bounds on X: x: ${x}, y: ${y}, layerIndex: '${layerIndex}', tilesetName: '${tilesetName}', tileId: '${tileId}'`); 
                    return false;
                }
                if(oob_y){ 
                    console.log(`setTile: Out-Of-Bounds on Y: x: ${x}, y: ${y}, layerIndex: '${layerIndex}', tilesetName: '${tilesetName}', tileId: '${tileId}'`); 
                    return false;
                }

                return true; 
            },
            // TODO?
            print                      : function(str, x, y, tilesetIndex, layerIndex){
                return true; 
            },
            // TODO?
            fillTile                   : function(tileId, x, y, w, h, tilesetIndex, layerIndex){
                return true; 
            },
            drawTilemap                : function(tilemapName, x, y, tilesetIndex, layerIndex, rotationIndex){
                // Get the tilesetName.
                let tilesetName = _JSG.loadedConfig.meta.tilesets[tilesetIndex];
                if(!tilesetName){ console.log(`drawTilemap: Tileset index '${tilesetIndex}' was not found.`); return false; }

                // Get the tileset.
                let tileset = _GFX.cache[tilesetName].tileset;
                if(!tileset){ console.log(`drawTilemap: Tileset '${tilesetName}' was not found.`); return false; }

                // Get the tilemap object.
                let tilemapObj  = _GFX.cache[tilesetName].tilemap[tilemapName];
                if(!tilemapObj){ console.log("drawTilemap: Tilemap object not found.", tilesetName, tilemapName); return false ; }

                // Get the tilemap. 
                let tilemap = tilemapObj[rotationIndex].orgTilemap;

                // Make sure that the tilemap is valid.
                if(!tilemap)               { console.log(`drawTilemap: Tilemap was not found.`); return false; }
                if(!Array.isArray(tilemap)){ console.log(`drawTilemap: Tilemap is not an array.`); return false; }
                if(!tilemap.length)        { console.log(`drawTilemap: Tilemap has no entries.`); return false; }
                if(!tilemap.length > 2)    { console.log(`drawTilemap: Tilemap is not valid.`); return false; }

                return true; 
            },
            drawTilemap_custom         : function(x, y, tilesetIndex, layerIndex, tilemap){
                // Get the tilesetName.
                let tilesetName = _JSG.loadedConfig.meta.tilesets[tilesetIndex];
                if(!tilesetName){ console.log(`drawTilemap_custom: Tileset index '${tilesetIndex}' was not found.`); return false; }

                // Get the tileset.
                let tileset = _GFX.cache[tilesetName].tileset;
                if(!tileset){ console.log(`drawTilemap_custom: Tileset '${tilesetName}' was not found.`); return false; }

                // Make sure that the tilemap is valid.
                if(!tilemap)               { console.log(`drawTilemap_custom: Tilemap was not found.`); return false; }
                if(!Array.isArray(tilemap)){ console.log(`drawTilemap_custom: Tilemap is not an array.`); return false; }
                if(!tilemap.length)        { console.log(`drawTilemap_custom: Tilemap has no entries.`); return false; }
                if(!tilemap.length > 2)    { console.log(`drawTilemap_custom: Tilemap is not valid.`); return false; }

                return true; 
            },
            customTilemapFromTextString: function(str, tilesetIndex){
                if(tilesetIndex == null){ console.log("customTilemapFromTextString: The tilesetIndex was not specified."); return false; }

                // Get the tilesetName.
                let tilesetName = _JSG.loadedConfig.meta.tilesets[tilesetIndex];
                if(!tilesetName){ console.log(`customTilemapFromTextString: Tileset index '${tilesetIndex}' was not found.`); return false; }
    
                // Get the tileset.
                let tileset     = _GFX.cache[tilesetName].tileset;
                if(!tileset){ console.log(`customTilemapFromTextString: Tileset '${tilesetName}' was not found.`); return false; }

                return true; 
            },
        },

        // Set one tile into VRAM.
        setTile : function(tileId, x, y, tilesetIndex, layerIndex){
            // Checks.
            if(! this.checks.setTile(tileId, x, y, tilesetIndex, layerIndex)){ return; }

            // "Draw" the tile to VRAM.
            _GFX.VRAM.updateVram(tileId, x, y, tilesetIndex, layerIndex);
        },

        // Set text tiles into VRAM using a text string.
        print : function(str="", x, y, tilesetIndex, layerIndex){
            // Checks.
            // Done when setTile is called.

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
            // Checks.
            // Done when setTile is called.

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
            // Checks.
            if(!this.checks.drawTilemap(tilemapName, x, y, tilesetIndex, layerIndex, rotationIndex)){ return; }
            
            // Get the tilesetName.
            let tilesetName = _JSG.loadedConfig.meta.tilesets[tilesetIndex];

            // Get the tilemap object.
            let tilemapObj  = _GFX.cache[tilesetName].tilemap[tilemapName];

            // Get the tilemap. 
            let tilemap = tilemapObj[rotationIndex].orgTilemap;

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
            // Checks.
            if(!this.checks.drawTilemap_custom(x, y, tilesetIndex, layerIndex, tilemap)){ return; }

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
            // Checks.
            if(!this.checks.customTilemapFromTextString(str, tilesetIndex)){ return; }

            // NOTE: print assumes that the text tileset's first tilemap is the fontset and that those tiles are generated in ASCII order.

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

    // Converts tileset tile data to canvas and stores in _GFX.cache.
    convertTileset: function(jsonTileset){
        for(let index in jsonTileset.tileset){
            // Get the tileData.
            let tileData = jsonTileset.tileset[index];

            // Go through each pixel.
            let hasTransparency = false;
            let tilePixels = [];
            for(let i=0; i<tileData.length; i+=1){
                let rgb32 = {};
                let rgb332_byte = tileData[i];

                if(!isNaN(jsonTileset.config.translucent_color) && rgb332_byte == jsonTileset.config.translucent_color){
                    rgb32.r = 0 ;
                    rgb32.g = 0 ;
                    rgb32.b = 0 ;
                    rgb32.a = 0 ;
                    hasTransparency = true;
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
            // tileCanvas.title = index;
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
            _GFX.cache[jsonTileset.tilesetName].tileset.push( { canvas:tileCanvas, ctx:tileCtx, hasTransparency: hasTransparency } );
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
                // ctx       : tilemapCtx,    // TODO: Unsure if I intend to keep these.
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
                        config  : {
                            ...jsonTileset.config, 
                            "translucent_color_rgba":_GFX.gfxConversion.rgb332_to_rgb32(jsonTileset.config.translucent_color)
                        },
                        tileset : jsonTileset.tileset,
                        tilemaps: jsonTileset.tilemaps,
                    },
                };

                let msg;

                // Convert the tileset.
                _JSG.shared.timeIt.stamp("gfxConversion.convertTileset", "s", "_GFX_INITS");
                this.convertTileset(jsonTileset);
                _JSG.shared.timeIt.stamp("gfxConversion.convertTileset", "e", "_GFX_INITS");
                msg = `  videoModeA: gfxConversion.convertTileset:  ${jsonTileset.tilesetName}: ${_JSG.shared.timeIt.stamp("gfxConversion.convertTileset", "pt", "_GFX_INITS").toFixed(2)}ms`;
                _JSG.loadingDiv.addMessageChangeStatus(msg, "loading");
                console.log(msg);

                // Convert the tilemaps.
                _JSG.shared.timeIt.stamp("gfxConversion.convertTilemaps", "s", "_GFX_INITS");
                this.convertTilemaps(jsonTileset);
                _JSG.shared.timeIt.stamp("gfxConversion.convertTilemaps", "e", "_GFX_INITS");
                msg = `  videoModeA: gfxConversion.convertTileset:  ${jsonTileset.tilesetName}: ${_JSG.shared.timeIt.stamp("gfxConversion.convertTilemaps", "pt", "_GFX_INITS").toFixed(2)}ms`;
                _JSG.loadingDiv.addMessageChangeStatus(msg, "loading");
                console.log(msg);
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

// INTERNAL: Init the graphics mode and perform conversions. (The _APP should call this one time).
_GFX.init = async function(canvasesDestinationDiv){
    let generateCanvasLayer = function(rec, zIndex, type){
        let dimensions = _JSG.loadedConfig.meta.dimensions;

        // Create a canvas for this layer.
        let canvas = document.createElement("canvas");
        canvas.width  = dimensions.tileWidth * dimensions.cols;
        canvas.height = dimensions.tileHeight * dimensions.rows;
        
        // Create the ctx for this layer. 
        let ctx = canvas.getContext("2d", rec.canvasOptions || {});
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        _GFX.gfxConversion.setPixelated(ctx);

        // Set some CSS for this canvas layer.
        if(rec.bg_color){ canvas.style["background-color"] = rec.bg_color; }
        canvas.style["z-index"] = zIndex;
        // canvas.style["image-rendering"] = "optimizeSpeed";
        // canvas.style["image-rendering"] = "-moz-crisp-edges";
        // canvas.style["image-rendering"] = "-webkit-optimize-contrast";
        // canvas.style["image-rendering"] = "-o-crisp-edges";
        // canvas.style["image-rendering"] = "pixelated";
        // canvas.style["-ms-interpolation-mode"] = "nearest-neighbor";

        canvas.classList.add("videoModeA_canvasLayer");

        // Add the data to canvasLayers.
        _GFX.canvasLayers.push( { name:rec.name, canvas:canvas, ctx:ctx, type:type } );

        // Return the canvas;
        return canvas;
    };

    return new Promise(async (resolve, reject)=>{
        _JSG.shared.timeIt.stamp("TOTAL_INIT_TIME", "s", "_GFX_INITS"); 

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
        let msg;

        // GRAPHICS CONVERSION.
        _JSG.shared.timeIt.stamp("gfxConversion", "s", "_GFX_INITS"); 
        await this.gfxConversion.init(this); 
        _JSG.shared.timeIt.stamp("gfxConversion", "e", "_GFX_INITS");
        msg = `gfxConversion TOTAL:  ${_JSG.shared.timeIt.stamp("gfxConversion", "pt", "_GFX_INITS").toFixed(2)}ms`;
        _JSG.loadingDiv.addMessageChangeStatus(`  videoModeA: ${msg}`, "loading");
        console.log(msg);
        
        // GENERATE CANVAS LAYERS.
        _JSG.shared.timeIt.stamp("canvasLayers", "s", "_GFX_INITS"); 
        let video_config = _JSG.loadedConfig.meta.jsgame_shared_plugins_config;
        let next_zIndex = 5;
        for(let i=0, l=_JSG.loadedConfig.meta.layers.length; i<l; i+=1){
            // Get the record.
            let rec = _JSG.loadedConfig.meta.layers[i];
            
            let msg1 = `init: Generating canvas layer: ${rec.name}.`;
            _JSG.loadingDiv.addMessageChangeStatus(`  videoModeA: ${msg1}`, "loading");
            console.log(msg1);

            generateCanvasLayer(rec, next_zIndex += 5, "user");
        }
        if(video_config.videoModeA && video_config.videoModeA.useFade){
            // Add the fade layer last.
            let msg1 = "init: Generating canvas layer: FADE.";
            _JSG.loadingDiv.addMessageChangeStatus(`  videoModeA: ${msg1}`, "loading");
            console.log(msg1);
            generateCanvasLayer({ "name": "FADE" , "canvasOptions": { "alpha": true } }, next_zIndex += 5, "_FADE_");
            _JSG.shared.timeIt.stamp("canvasLayers", "e", "_GFX_INITS");
        }
        else { _JSG.shared.timeIt.stamp("canvasLayers", "e", "_GFX_INITS"); }

        // INIT DRAW.
        _JSG.shared.timeIt.stamp("draw", "s", "_GFX_INITS"); 
        await this.draw.init(this);          
        _JSG.shared.timeIt.stamp("draw", "e", "_GFX_INITS");
        
        // INIT VRAM.
        _JSG.shared.timeIt.stamp("VRAM", "s", "_GFX_INITS"); 
        await this.VRAM.init(this);          
        _JSG.shared.timeIt.stamp("VRAM", "e", "_GFX_INITS");

        // Add the fade layer if specified.
        if(video_config.videoModeA && video_config.videoModeA.useFade){
            // Init the videoModeA WebWorker.
            msg1 = "init: WebWorker: _WEBW.videoModeA.video - STARTED";
            _JSG.loadingDiv.addMessageChangeStatus(`  videoModeA: ${msg1}`, "loading");
            console.log(msg1);
            await _WEBW.videoModeA.video.init();
        }
        
        _JSG.shared.timeIt.stamp("TOTAL_INIT_TIME", "e", "_GFX_INITS"); 

        // End of videoModeA inits.
        msg = `Inits are complete:  TOTAL TIME: ${_JSG.shared.timeIt.stamp("TOTAL_INIT_TIME", "pt", "_GFX_INITS").toFixed(2)}ms`;
        _JSG.loadingDiv.addMessageChangeStatus(`  videoModeA: ${msg}`, "loading");
        console.log(msg);

        resolve();
    });
};
