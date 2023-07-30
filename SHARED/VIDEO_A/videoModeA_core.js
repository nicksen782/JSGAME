var _GFX = {
    timeIt: _APP.utility.timeIt ? _APP.utility.timeIt.bind(_APP.utility) : function(){ return 0; }
};

// INTERNAL: WebWorker functions.
var _WEBW = {
    videoModeA : {
        video: {
            // Holds the WebWorker instance.
            webworker: undefined,
    
            // Tracks what part of the conversation per mode is expected.
            createDeferredPromise : function(){
                var deferred = {};
                var promise = new Promise(function(resolve, reject) {
                    deferred.resolve = resolve;
                    deferred.reject  = reject;
                });
                deferred.promise = promise;
                return deferred;
            },
            differedProms: {},
    
            // SHARED: Receives messages from the WebWorker and routes the message to the matching function(s).
            RECEIVE: function(e){
                // Make sure there is data and a data.mode.
                if(e.data && e.data.mode){
                    switch(e.data.mode){
                        case "init"                        : this.initReceive    (e.data.data); break;
                        case "initFade"                    : this.initFadeReceive(e.data.data); break;
                        case "returnInitTimes"             : this.returnInitTimes_receive(e.data.data); break;
                        case "drawSend_useOffscreenCanvas" : this.drawReceive_useOffscreenCanvas (e.data.data); break;
    
                        // Inited by the WebWorker
                        case "loading_progress" : this.loading_progress (e.data.data); break;
                        
                        // Unmatched function.
                        default     : { 
                            console.error("ERROR: Unmatched mode", e.data.mode); 
                            break; 
                        }
                    }
                }
                else{ console.error(`ERROR: No mode? e.data: ${e.data}, e.data.mode: ${e.data.mode}, e:`, e); }
            },
            // SHARED. (TODO: spelling)
            RECIEVE_ASYNC: async function(){
            },
    
            loading_progress: function(data){
                // console.log("loading_progress:", data);
                console.log(`  videoModeA:   ${data}`);
            },
    
            // INIT: Sends graphics data to the WebWorker for later use.
            initSend: function(waitForResp=true){
                // console.log("_WEBW.videoModeA: initSend");
    
                return new Promise(async(resolve,reject)=>{
                    // Update the message state.
                    let ww_mode_key = "init";
                    
                    _GFX.timeIt("WEBWORKER_INITSEND_innerA", "start");
                    let data = { 
                        cache: {},
                        VRAM: { 
                            _VRAM        : _GFX.VRAM._VRAM ,
                            indexByCoords: _GFX.VRAM.indexByCoords ,
                            coordsByIndex: _GFX.VRAM.coordsByIndex ,
                        },
                        meta: {
                            layers       : _APP.configObj.gfxConfig.layers,
                            dimensions   : _APP.configObj.gfxConfig.dimensions,
                            videoModeA_config: _GFX.config,
                        },
                        offscreenLayers: []
                    };
                    _GFX.timeIt("WEBWORKER_INITSEND_innerA", "stop");
                    // console.log("DATA:", data);
    
                    for(let i=0, l=_APP.configObj.gfxConfig.layers.length; i<l; i+=1){
                    }
    
                    _GFX.timeIt("WEBWORKER_INITSEND_innerB", "start");
                    // Need full json, each tile imageData, hasTransparency, isFullyTransparent, each tilemap name, rot 0, and orgTilemap.
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
                        

                        // Go through each tile in the tileset and use the ctx to create imageData.
                        for(let t=0, tl= tileset.tileset.length; t<tl; t+=1){
                            let tile = tileset.tileset[t];
                            data.cache[key].tileset.push( {
                                // imgData : tile.ctx.getImageData(0, 0, tileWidth, tileHeight),
                                imgData           : tile.tileImageData,
                                hasTransparency   : tile.hasTransparency, 
                                isFullyTransparent: tile.isFullyTransparent, 
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
    
                    for(let rec of _GFX.canvasLayers){
                        data.offscreenLayers.push({
                            canvas: rec.canvas.transferControlToOffscreen(),
                            ctx   : null,
                            name  : rec.name,
                            type  : rec.type,
                        });
                    }

                    // console.log("_WEBW.videoModeA: initSend:", data);
                    _WEBW.videoModeA.video.webworker.postMessage(
                        {
                            mode: "init",
                            data: data,
                        }, 
                        [...data.offscreenLayers.map(d=>d.canvas)]
                    );
    
                    // Wait until finished?
                    if(waitForResp){ 
                        this.differedProms[ww_mode_key] = this.createDeferredPromise();
                        await this.differedProms[ww_mode_key].promise;
                        resolve(); 
                        return; 
                    }
    
                    // No wait.
                    resolve();
                });
            },
            initReceive: function(data){
                // console.log("_WEBW.videoModeA: initReceive:", data);
    
                // Set the mode key.
                let ww_mode_key = "init";
                
                // DEBUG: Save the returned ImageData for each tile/fade. Your app's debug can display them if you want.
                if(_GFX.config.debugGFX.recordPrevChanges && data.debugData && Object.keys(data.debugData).length){ 
                    if(_GFX._debug){ _GFX._debug.fadedTileset = data.debugData; }
                }
                if("maxFadeSteps"  in data){ _GFX.fade.maxFadeSteps = data.maxFadeSteps; }
                if("fadeIsEnabled" in data){ _GFX.fade.isEnabled    = data.fadeIsEnabled; }
    
                // Update the message state.
                if(this.differedProms[ww_mode_key]){ this.differedProms[ww_mode_key].resolve(); }
            },
    
            drawSend_useOffscreenCanvas: function(waitForResp=true){
                return new Promise(async(resolve,reject)=>{
                    // Update the message state.
                    let ww_mode_key = "drawSend_useOffscreenCanvas";
    
                    // console.log(_GFX.VRAM.changes); debugger;
                    _WEBW.videoModeA.video.webworker.postMessage(
                        {
                            mode: ww_mode_key,
                            data: {
                                // _VRAM         : _GFX.VRAM._VRAM ,
                                clearVram_flag    : _GFX.VRAM.clearVram_flag,
                                changes           : _GFX.VRAM.changes,
                                previousFadeIndex : _GFX.fade.previousFadeIndex,
                                currentFadeIndex  : _GFX.fade.currentFadeIndex,
                            },
                        }, 
                        []
                    );
    
                    // Wait until finished?
                    if(waitForResp){ 
                        this.differedProms[ww_mode_key] = this.createDeferredPromise();
                        let data = await this.differedProms[ww_mode_key].promise;
                        resolve(data); 
                        return; 
                    }
    
                    // No wait.
                    else{
                        resolve();
                    }
    
                });
            },
            drawReceive_useOffscreenCanvas: function(data){
                // Set the mode key.
                let ww_mode_key = "drawSend_useOffscreenCanvas";
                
                _GFX.fade.previousFadeIndex = _GFX.fade.currentFadeIndex;
                
                // Update the message state.
                if(this.differedProms[ww_mode_key]){ 
                    this.differedProms[ww_mode_key].resolve(data); 
                    return this.differedProms[ww_mode_key].promise;
                }
            },
    
            // FADE: Request/Receive fade layers.
            initFadeSend          : function(waitForResp=false){
                return new Promise(async(resolve,reject)=>{
                    // Update the message state.
                    let ww_mode_key = "initFade";
    
                    let dataToSend = {
                        "mode": ww_mode_key,
                        "data": {},
                    };
                    
                    // console.log("_WEBW.videoModeA: fadeSend: VRAM:", _GFX.VRAM._VRAM);
                    _WEBW.videoModeA.video.webworker.postMessage( dataToSend, [] );
    
                    // Wait until finished?
                    if(waitForResp){ 
                        this.differedProms[ww_mode_key] = this.createDeferredPromise();
                        await this.differedProms[ww_mode_key].promise;
                        resolve(); 
                        return; 
                    }
    
                    // No wait. (fadeReceive will still write them to; _GFX.fade.fadeImages.
                    resolve();
                });
            },
            initFadeReceive       : async function(data){
                // Set the mode key.
                let ww_mode_key = "initFade";
    
                // DEBUG: Save the returned ImageData for each tile/fade. Your app's debug can display them if you want.
                if(_GFX.config.debugGFX.generateAndReturnFadedTiles && data.debugData && Object.keys(data.debugData).length){ 
                    if(_GFX._debug){ _GFX._debug.fadedTileset = data.debugData; }
                }
                if("maxFadeSteps"  in data){ _GFX.fade.maxFadeSteps = data.maxFadeSteps; }
                if("fadeIsEnabled" in data){ _GFX.fade.isEnabled    = data.fadeIsEnabled; }
    
                // Update the message state.
                if(this.differedProms[ww_mode_key]){ this.differedProms[ww_mode_key].resolve(); }
            },
    
            returnInitTimes_send: function(waitForResp=false){
                return new Promise(async(resolve,reject)=>{
                    // Update the message state.
                    let ww_mode_key = "returnInitTimes";
    
                    let dataToSend = {
                        "mode": ww_mode_key,
                        "data": {},
                    };
                    
                    _WEBW.videoModeA.video.webworker.postMessage( dataToSend, [] );
    
                    // Wait until finished?
                    if(waitForResp){ 
                        this.differedProms[ww_mode_key] = this.createDeferredPromise();
                        let data = await this.differedProms[ww_mode_key].promise;
                        resolve(data); 
                        return; 
                    }
    
                    // No wait.
                    resolve();
                });
            },
            returnInitTimes_receive: function(data){
                // Set the mode key.
                let ww_mode_key = "returnInitTimes";

                // // DEBUG: Save the returned ImageData for each tile/fade. Your app's debug can display them if you want.
                // if(_GFX.config.debugGFX.generateAndReturnFadedTiles && data.debugData && Object.keys(data.debugData).length){ 
                //     if(_GFX._debug){ _GFX._debug.fadedTileset = data.debugData; }
                // }
                // if("maxFadeSteps"  in data){ _GFX.fade.maxFadeSteps = data.maxFadeSteps; }
                // if("fadeIsEnabled" in data){ _GFX.fade.isEnabled    = data.fadeIsEnabled; }
                
                // Update the message state.
                if(this.differedProms[ww_mode_key]){ 
                    this.differedProms[ww_mode_key].resolve(data); 
                    return this.differedProms[ww_mode_key].promise;
                }
            },

            // Init this WebWorker.
            init: function(parent){
                return new Promise(async (resolve,reject)=>{
                    // // Create the WebWorkers and their message event listeners.
                    // _WEBW.videoModeA.video.webworker = new Worker( "shared/plugins/VIDEO_A/videoModeA_webworker.js" );
                    // _WEBW.videoModeA.video.webworker.addEventListener("message", (e)=>_WEBW.videoModeA.video.RECEIVE(e), false);
    
                    // // Send the init for the webworker.
                    // await _WEBW.videoModeA.video.initSend(true, 0);
    
                    // resolve();
    
                    // Add the web worker and set the 'message' listener.
                    if(_APP.configObj.gfxConfig.webWorker){
                        _WEBW.videoModeA.video.webworker = new Worker( `${_APP.configObj.gfxConfig.webWorker}` );
                        _WEBW.videoModeA.video.webworker.addEventListener("message", (e)=>_WEBW.videoModeA.video.RECEIVE(e), false);
                        
                        await _WEBW.videoModeA.video.initSend(true, 0);
                        resolve();
                    }
                    else{
                        console.log("Missing webWorker config");
                        reject("Missing webWorker config");
                        throw "Missing webWorker config";
                        return;
                    }
    
                });
    
            },
        },
    },
};

// INTERNAL: Fade.
_GFX.fade = {
    // Set by fadeIn and fadeOut and _GFX.draw. Used to determine if a frame redraw is needed.
    currentFadeIndex          : 0,          // What the fade is set to now.
    previousFadeIndex         : 0,          // What the fade was set to previously.
    isBlocking                : false,      // Block app logic while the fade is active.
    isActive                  : false,      // Fade is active true/false.
    maxFadeSteps              : undefined,  // The length of the fader array (value returned by the WebWorker).
    isEnabled                 : false,      // Value returned by the WebWorker.
    framesBetweenFadeChanges  : 0,          // When framesSinceLastFadeChange reaches this then it is time to change fades.
    framesSinceLastFadeChange : 0,          // Counter used in comparison with framesBetweenFadeChanges.
    fadeStepDir               : 1,          // 1 is for fadeIn, -1 is for fadeOut.
    mode                      : "no-chain", // Can be "no-chain", "fadeIn", "fadeOut". 

    // Called by the gameLoop to handle the processing of fadeIn and fadeOut (chain-fade).
    processFading: async function(callbackFunction=null){
        return new Promise(async (resolve, reject) => {
            // Does the fade level need to change?

            // No. A fade was set but it is not part of a chain of fades.
            if(!this.isEnabled || this.isActive == false || this.mode == "no-chain"){ 
                if(callbackFunction){ callbackFunction(); }
                resolve(this.isBlocking); 
            }
            
            // Fade ready to change? 
            else if(this.framesSinceLastFadeChange < this.framesBetweenFadeChanges){
                // No. Not yet.
                this.framesSinceLastFadeChange += 1;
                if(callbackFunction){ callbackFunction(); }
                resolve(this.isBlocking);
            }

            // Yes, fade is ready to change. 
            else{
                // Reset the counter.
                this.framesSinceLastFadeChange = 0;

                // Update the previous and current fadeIndex.
                this.currentFadeIndex += this.fadeStepDir;

                // Is this the last frame?
                if(this.mode == "fadeIn" && this.currentFadeIndex < 0){
                    this.setFade(0);
                    if(callbackFunction){ callbackFunction(); }
                    resolve(this.isBlocking); 
                }
                else if(this.mode == "fadeOut" && this.currentFadeIndex >= this.maxFadeSteps){
                    this.setFade(this.maxFadeSteps - 1);
                    if(callbackFunction){ callbackFunction(); }
                    resolve(this.isBlocking); 
                }
                else{
                    if(callbackFunction){ callbackFunction(); }
                    resolve(this.isBlocking); 
                }

            }
        });
    },

    // Fade in from black.
    fadeIn: function(framesBetweenFadeChanges, isBlocking){
        if(!this.isEnabled){ console.error("ERROR: Fade tiles have not been generated."); return; }

        this.previousFadeIndex        = 100;
        this.currentFadeIndex         = this.maxFadeSteps -1;

        this.fadeStepDir              = -1;
        this.isBlocking               = isBlocking;
        this.isActive                 = true;
        
        this.framesBetweenFadeChanges = framesBetweenFadeChanges;
        this.mode                     = "fadeIn";
    },

    // Fade out to black.
    fadeOut: function(framesBetweenFadeChanges, isBlocking){
        if(!this.isEnabled){ console.error("ERROR: Fade tiles have not been generated."); return; }

        this.previousFadeIndex        = 100;
        this.currentFadeIndex         = 0;
        
        this.fadeStepDir              = 1;
        this.isBlocking               = isBlocking;
        this.isActive                 = true;
        
        this.framesBetweenFadeChanges = framesBetweenFadeChanges;
        this.mode                     = "fadeOut";
    },

    // Set the fade level (no chaining).
    setFade: function(level){
        if(!this.isEnabled){ console.error("ERROR: Fade tiles have not been generated."); return; }

        this.previousFadeIndex = 100;   // this.currentFadeIndex;
        this.currentFadeIndex  = level;
        
        this.fadeStepDir       = 0;
        this.isBlocking        = false;
        this.isActive          = false;
        
        this.framesBetweenFadeChanges = 0;
        this.mode              = "no-chain";
    },

    // Init function for fade.
    init: async function(){
        return new Promise(async (resolve, reject)=>{
            resolve();
        });
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
    
    // Lookup table: Get y, x coords by VRAM index.
    indexByCoords:[],
    coordsByIndex:[],

    // Holds the changes to VRAM that will be drawn on the next draw cycle.
    clearVram_flag:false,
    changes: {},
    // changes2: new Map(),
    // changes3: new Set(),
    
    // DEBUG: Holds the PREVIOUS changes to VRAM.
    prevDrawn_clearVram_flag:false,
    prevDrawn_changes: {},

    // Stats for changes (this frame).
    changesStats: {
        new      : 0,
        overwrite: 0,
        ignore   : 0,
    },
    
    // Updates VRAM values and calls addToVramChanges.
    updateVram: function(tileId, x, y, tilesetIndex, layerIndex){
        // Get the tilesetName (to make sure that the tilesetIndex is valid.)
        let tilesetName = _APP.configObj.gfxConfig.tilesets[tilesetIndex];
        if(!tilesetName){ console.error(`updateVram: Tileset index '${tilesetIndex}' was not found.`); return; }
        
        // Update _VRAM_view if the changes values are different than the existing values.
        let VRAM_startIndex = this.indexByCoords[y][x];
        let tilesetIndexHasChanged = false;
        if( this._VRAM[layerIndex].view[VRAM_startIndex + 0] != tilesetIndex){ 
            this._VRAM[layerIndex].view[VRAM_startIndex + 0]  = tilesetIndex;
            tilesetIndexHasChanged = true;
        }
        let tileIdHasChanged = false;
        if( this._VRAM[layerIndex].view[VRAM_startIndex + 1] != tileId){ 
            this._VRAM[layerIndex].view[VRAM_startIndex + 1]  = tileId;
            tileIdHasChanged = true;
        }

        // Add to VRAM changes if either the tileset or tileId has changed.
        if(tilesetIndexHasChanged || tileIdHasChanged){
            this.addToVramChanges(tileId, x, y, tilesetIndex, layerIndex);
        }
    },

    addToVramChanges: function(tileId, x, y, tilesetIndex, layerIndex){
        // NOTE: updateVram already makes sure that a layer/coordinate is not rewritten with the same exact values.
        // NOTE: The check for an existing change is needed if a VRAM value changes more than once within the same frame.
        // NOTE: If a tile were to change more than once in the same frame then the checks here will update the existing change.

        // Because each change has an addressable key there is no need to iterate through the whole list of changes. 
        let key = `C${layerIndex}:${x}:${y}`;
        
        // Does this key exist?
        if(this.changes[key]){
            // Yes. Has either the tileId or tilesetIndex changed? 
            if(
                this.changes[key].tileId       != tileId       || 
                this.changes[key].tilesetIndex != tilesetIndex
            ){
                // YES. Update the values that have changed. 
                if(this.changes[key].tileId       != tileId      ){ this.changes[key].tileId       = tileId; }
                if(this.changes[key].tilesetIndex != tilesetIndex){ this.changes[key].tilesetIndex = tilesetIndex; }
                this.changesStats.overwrite += 1;
                return;
            }

            // No. The requested change is the same as an existing change.
            else{
                this.changesStats.ignore += 1;
                return;
            }
        }

        // Add the change since it doesn't already exist.
        this.changesStats.new += 1;
        this.changes[key] = {
            tileId      : tileId,
            x           : x, 
            y           : y,
            tilesetIndex: tilesetIndex,
            layerIndex  : layerIndex,
        };
        // this.changes2.set(key, this.changes[key]);
    },

    // Clears the changes array.
    clearVramChanges: function(){
        // Clears the data used by changes.

        // Clear changes. 
        this.changes = {};

        // Clear the clearVram_flag.
        this.clearVram_flag = false;

        // Reset the changeStats.
        this.changesStats.new      = 0;
        this.changesStats.overwrite= 0;
        this.changesStats.ignore   = 0;
    },

    // Set VRAM to all 0 (The tileId of 0 should be the fully transparent tile in each tileset.)
    clearVram: function(){
        // Dump the changes. 
        this.clearVramChanges();

        // Fill all VRAM layers with 0 (tileIndex to 0, tileId to 0, and each x, y value to 0.)
        for(let i=0, l=this._VRAM.length; i<l; i+=1){ this._VRAM[i].view.fill(0); }

        // Set flag to indicate a full clear of VRAM. (draw will use clearRect to Clear the whole canvas).
        this.clearVram_flag = true;
    },

    // Draws to the app canvas based on the contents of the changes array.
    draw: function(){
        let useAwait = true;
        // let useAwait = false;
        return new Promise( async (resolve,reject)=>{
            // The WebWorker is required. If the webworker is not set (unexpected) then just return.
            if(!_WEBW.videoModeA.video.webworker){ return; }

            // Abort if there are no changes and there are no changes to the currentFadeIndex.
            if( !this.clearVram_flag && _GFX.fade.currentFadeIndex == _GFX.fade.previousFadeIndex && !this.changesStats.new ){ 
                // DEBUG. Update prevDrawn_changes and prevDraw_clearVram_flag.
                if(_GFX.config.debugGFX.recordPrevChanges){
                    // Clear the prevDrawn_changes.
                    this.prevDrawn_changes = {}; 
                    this.prevDrawn_clearVram_flag = false;
                }

                // Resolve and return. No drawing needs to be done. 
                resolve(); 
                return; 
            }

            // Uses WebWorker. Draws occur in the WebWorker.
            
            // Request the draw.
            if(useAwait){
                this.afterDraw( await _WEBW.videoModeA.video.drawSend_useOffscreenCanvas(true) );
            }
            else{
                // _WEBW.videoModeA.video.drawSend_useOffscreenCanvas(false);
            }

            // Update the recorded fade levels. 
            _GFX.fade.previousFadeIndex = _GFX.fade.currentFadeIndex;

            // DEBUG: Copy changes to prevDrawn_changes.
            if(_GFX.config.debugGFX.recordPrevChanges){
                this.prevDrawn_changes = Object.assign({}, this.changes);
                this.prevDrawn_clearVram_flag = this.clearVram_flag;
            }

            // Done drawing. Clear the VRAM changes. 
            this.clearVramChanges();

            resolve();
        });
    },
    afterDraw(data){
        if(_APP.debugActive && _APP.configObj.gfxConfig.debug){
            return;
            // console.log("afterDraw:", data);
            if(_GFX.fade.currentFadeIndex != 0){
                console.log("afterDraw:", data.DRAW_TOTAL.toFixed(1), "_GFX.fade.currentFadeIndex:", _GFX.fade.currentFadeIndex);
            }
            else{
            }
            console.log("afterDraw:", data.DRAW_TOTAL.toFixed(1), "_GFX.fade.currentFadeIndex:", _GFX.fade.currentFadeIndex);
            // debugger;
        }
    },

    // Returns a copy of the specified VRAM region.
    getVramRegion: function(x, y, w, h, layers=[]){
        // Get the dimensions.
        let dimensions = _APP.configObj.gfxConfig.dimensions;
        
        let vramRegionObj = {};
        let i, l, layerCopy, yi, yl, xi, xl, vramIndex1, vramIndex2;

        //.For each requested layer...
        for(i=0, l=layers.length; i<l; i += 1){

            // Create a new layerCopy.
            layerCopy = {};

            // Create the _VRAM arraybuffer and the _VRAM dataview.
            if(dimensions.pointersSize == 8){
                // Get the total size for the layerCopy _VRAM. (number of layers * 2 bytes per layer * rows * cols) * 1.
                layerCopy.buffer = new ArrayBuffer( (2 * (h * w) ) );
                
                // Create the view using the layerCopy buffer.
                layerCopy.view   = new Uint8Array(layerCopy.buffer);
            }
            else if(dimensions.pointersSize == 16){
                // Get the total size for the layerCopy _VRAM. (number of layers * 2 bytes per layer * rows * cols) * 2.
                layerCopy.buffer = new ArrayBuffer( (2 * (h * w)) * 2) ;

                // Create the view using the layerCopy buffer.
                layerCopy.view   = new Uint16Array(layerCopy.buffer);
            }
            // This should not be reached because initChecks should have already caught it.
            else{
                let msg1 = `ERROR: getVramRegion: Invalid pointerSize.`;
                console.error(msg1);
                throw msg1;
            }

            // Update the layerCopy's view with data from VRAM.

            // For each row...
            for(yi=0, yl=h; yi<yl; yi+=1){
                
                // For each col...
                for( xi=0, xl=w; xi<xl; xi+=1){
                    // Get the full VRAM vramIndex for this coordinate.
                    vramIndex1 = this.indexByCoords[y + yi][x + xi];

                    // Get the layerCopy VRAM vramIndex.
                    vramIndex2 = (yi * (w * 2)) + (xi * 2);

                    // Update the layerCopy.
                    layerCopy.view[vramIndex2 + 0] = this._VRAM[ layers[i] ].view[vramIndex1 + 0]; // tilesetIndex
                    layerCopy.view[vramIndex2 + 1] = this._VRAM[ layers[i] ].view[vramIndex1 + 1]; // tileId
                }
            }

            // Save the layerCopy object along with some supporting data.
            vramRegionObj[i] =  { 
                x: x, y: y,            // Origin coordinates of the layerCopy.
                w: w, h: h,            // Dimensions of the layerCopy.
                l: layers[i],          // The layerIndex of the layerCopy.
                vram: layerCopy.view,  // The data for the layerCopy.
                lastChange: new Date() // When this layerCopy was made (can be used for debugging.)
            };
        }
        
        // Return the completed vramRegionObj.
        return vramRegionObj;
    },
    
    // Sets the specified VRAM region (usually data from getVramRegion).
    setVramRegion: function(vramRegionObj){
        let layerIndex, yi, yl, xi, xl, vramIndex2;

        // For each layer in the vramRegionObj...
        for(layerIndex in vramRegionObj){

            // For each row...
            for(yi=0, yl=vramRegionObj[layerIndex].h; yi<yl; yi+=1){
                
                // For each col...
                for(xi=0, xl=vramRegionObj[layerIndex].w; xi<xl; xi+=1){
                    // Get the vram index from within the layerCopy.
                    vramIndex2 = ((yi) * (vramRegionObj[layerIndex].w *2)) + ((xi) * 2);

                    // Make sure not to send any undefined values. 
                    if(vramRegionObj[layerIndex].vram[vramIndex2 + 1] == undefined || vramRegionObj[layerIndex].vram[vramIndex2 + 0] == undefined){ 
                        console.error("ERROR: setVramRegion: undefined values found:", `tilesetIndex: ${vramRegionObj[layerIndex].vram[vramIndex2 + 0]}, tileId: ${vramRegionObj[layerIndex].vram[vramIndex2 + 1]}`);
                        continue; 
                    }

                    // Update VRAM.
                    this.updateVram(
                        vramRegionObj[layerIndex].vram[vramIndex2 + 1], // tileId
                        vramRegionObj[layerIndex].x + xi,               // x
                        vramRegionObj[layerIndex].y + yi,               // y
                        vramRegionObj[layerIndex].vram[vramIndex2 + 0], // tilesetIndex
                        vramRegionObj[layerIndex].l                     // layerIndex
                    );
                }
            }
        }
    },

    // INIT: Creates the VRAM._VRAM typedArray. (Should only be run once).
    initVram_typedArray: function(){
        // Get the dimensions.
        let dimensions = _APP.configObj.gfxConfig.dimensions;

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

        // This should not be reached because initChecks should have already caught it.
        else{
            let msg1 = `ERROR: initVram_typedArray: Invalid pointerSize.`;
            console.error(msg1);
            throw msg1;
        }
    },
    
    // INIT: Creates the indexByCoords lookup table. 
    create_VRAM_indexByCoords:function(){
        let dimensions = _APP.configObj.gfxConfig.dimensions;

        // This table is used by updateVram and draw to quickly get the starting VRAM index for a given x and y.
        let currentIndex = 0;
        for(let row=0;row<dimensions.rows;row+=1){
            this.indexByCoords.push([]);
            for(let col=0; col < dimensions.cols; col+=1){
                let index = (row * (dimensions.cols *2)) + (col*2);
                this.indexByCoords[row].push(index);
                this.coordsByIndex[currentIndex] = [row, col];
                currentIndex +=1;
            }
        }
    },

    // INIT: Init function for the VRAM object.
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
                if(tileId == null)      { console.error("setTile: The tileId was not specified. ARGS:"      , `tileId: ${tileId}, x: ${x}, y: ${y}, tilesetIndex: ${tilesetIndex}, layerIndex: ${layerIndex}`); return false; }
                if(x == null)           { console.error("setTile: The x was not specified. ARGS:"           , `tileId: ${tileId}, x: ${x}, y: ${y}, tilesetIndex: ${tilesetIndex}, layerIndex: ${layerIndex}`); return false; }
                if(y == null)           { console.error("setTile: The y was not specified. ARGS:"           , `tileId: ${tileId}, x: ${x}, y: ${y}, tilesetIndex: ${tilesetIndex}, layerIndex: ${layerIndex}`); return false; }
                if(tilesetIndex == null){ console.error("setTile: The tilesetIndex was not specified. ARGS:", `tileId: ${tileId}, x: ${x}, y: ${y}, tilesetIndex: ${tilesetIndex}, layerIndex: ${layerIndex}`); return false; }
                if(layerIndex == null)  { console.error("setTile: The layerIndex was not specified. ARGS:"  , `tileId: ${tileId}, x: ${x}, y: ${y}, tilesetIndex: ${tilesetIndex}, layerIndex: ${layerIndex}`); return false; }

                // Make sure that the layerIndex is valid.
                let numLayers = _APP.configObj.gfxConfig.layers.length;
                if(layerIndex < 0 || layerIndex >= numLayers){ console.error("setTile: The layerIndex is not valid.", numLayers); debugger; return false; }

                // Get the tilesetName.
                let tilesetName = _APP.configObj.gfxConfig.tilesets[tilesetIndex];
                if(!tilesetName){ console.error(`setTile: Tileset index '${tilesetIndex}' was not found.`); return false; }
                
                // Get the tileset.
                let tileset     = _GFX.cache[tilesetName].tileset;
                if(!tileset){ console.error(`setTile: Tileset '${tilesetName}' was not found.`); return false; }

                // Check for the tile. If not found then skip.
                if(undefined == tileset[tileId] || !tileset[tileId].canvas){ console.error(`setTile: Tile canvas for '${tilesetName}':'${tileId}' was not found.`); return false; }

                // Get the dimensions.
                let dimensions = _APP.configObj.gfxConfig.dimensions;

                // Bounds-checking. (Skip any tile that would be written out of bounds.
                let oob_x = x >= dimensions.cols ? true : false;
                let oob_y = y >= dimensions.rows ? true : false;
                if(oob_x){ 
                    console.error(`setTile: Out-Of-Bounds on X: x: ${x}, y: ${y}, layerIndex: '${layerIndex}', tilesetName: '${tilesetName}', tileId: '${tileId}'`); 
                    return false;
                }
                if(oob_y){ 
                    console.error(`setTile: Out-Of-Bounds on Y: x: ${x}, y: ${y}, layerIndex: '${layerIndex}', tilesetName: '${tilesetName}', tileId: '${tileId}'`); 
                    return false;
                }

                return true; 
            },
            drawTilemap                : function(tilemapName, x, y, tilesetIndex, layerIndex, rotationIndex){
                // Get the tilesetName.
                let tilesetName = _APP.configObj.gfxConfig.tilesets[tilesetIndex];
                if(!tilesetName){ console.error(`drawTilemap: Tileset index '${tilesetIndex}' was not found.`); return false; }

                // Get the tileset.
                let tileset = _GFX.cache[tilesetName].tileset;
                if(!tileset){ console.error(`drawTilemap: Tileset '${tilesetName}' was not found.`); return false; }

                // Get the tilemap object.
                let tilemapObj  = _GFX.cache[tilesetName].tilemap[tilemapName];
                if(!tilemapObj){ console.error("drawTilemap: Tilemap object not found.", "tilesetName:", tilesetName, ", tilemapName:", tilemapName); return false ; }

                // Get the tilemap. 
                let tilemap = tilemapObj[rotationIndex].orgTilemap;

                // Make sure that the tilemap is valid.
                if(!tilemap)               { console.error(`drawTilemap: Tilemap was not found.`); return false; }
                if(!Array.isArray(tilemap)){ console.error(`drawTilemap: Tilemap is not an array.`); return false; }
                if(!tilemap.length)        { console.error(`drawTilemap: Tilemap has no entries.`); return false; }
                if(!tilemap.length > 2)    { console.error(`drawTilemap: Tilemap is not valid.`); return false; }

                return true; 
            },
            drawTilemap_custom         : function(x, y, tilesetIndex, layerIndex, tilemap){
                // Get the tilesetName.
                let tilesetName = _APP.configObj.gfxConfig.tilesets[tilesetIndex];
                if(!tilesetName){ console.error(`drawTilemap_custom: Tileset index '${tilesetIndex}' was not found.`); return false; }

                // Get the tileset.
                let tileset = _GFX.cache[tilesetName].tileset;
                if(!tileset){ console.error(`drawTilemap_custom: Tileset '${tilesetName}' was not found.`); return false; }

                // Make sure that the tilemap is valid.
                if(!tilemap)               { console.error(`drawTilemap_custom: Tilemap was not found.`); return false; }
                if(!Array.isArray(tilemap)){ console.error(`drawTilemap_custom: Tilemap is not an array.`); return false; }
                if(!tilemap.length)        { console.error(`drawTilemap_custom: Tilemap has no entries.`); return false; }
                if(!tilemap.length > 2)    { console.error(`drawTilemap_custom: Tilemap is not valid.`); return false; }

                return true; 
            },
            customTilemapFromTextString: function(str, tilesetIndex){
                if(tilesetIndex == null){ console.error("customTilemapFromTextString: The tilesetIndex was not specified."); return false; }

                // Get the tilesetName.
                let tilesetName = _APP.configObj.gfxConfig.tilesets[tilesetIndex];
                if(!tilesetName){ console.error(`customTilemapFromTextString: Tileset index '${tilesetIndex}' was not found.`); return false; }
    
                // Get the tileset.
                let tileset     = _GFX.cache[tilesetName].tileset;
                if(!tileset){ console.error(`customTilemapFromTextString: Tileset '${tilesetName}' was not found.`); return false; }

                return true; 
            },
        },

        // Set one tile into VRAM.
        setTile : function(tileId, x, y, tilesetIndex, layerIndex){
            // Checks.
            if(! this.checks.setTile(tileId, x, y, tilesetIndex, layerIndex)){ return false; }

            // "Draw" the tile to VRAM.
            _GFX.VRAM.updateVram(tileId, x, y, tilesetIndex, layerIndex);
        },

        // Set text tiles into VRAM using a text string.
        print : function(str="", x, y, tilesetIndex, layerIndex){
            // Checks are done by setTile.

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
            // Checks are done by setTile.

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
            if(!this.checks.drawTilemap(tilemapName, x, y, tilesetIndex, layerIndex, rotationIndex)){ return false; }
            
            // Get the tilesetName.
            let tilesetName = _APP.configObj.gfxConfig.tilesets[tilesetIndex];

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
            if(!this.checks.drawTilemap_custom(x, y, tilesetIndex, layerIndex, tilemap)){ return false; }

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
            if(!this.checks.customTilemapFromTextString(str, tilesetIndex)){ return false; }

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
            
            // Also check if the tile is fully transparent.
            let transparentPixelCounter = 0;
            let isFullyTransparent = false;

            for(let i=0; i<tileData.length; i+=1){
                let rgb32 = {};
                let rgb332_byte = tileData[i];

                if(!isNaN(jsonTileset.config.translucent_color) && rgb332_byte == jsonTileset.config.translucent_color){
                    rgb32.r = 0 ;
                    rgb32.g = 0 ;
                    rgb32.b = 0 ;
                    rgb32.a = 0 ;
                    hasTransparency = true;
                    transparentPixelCounter += 1;
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

            // If this tile is fully transparent then set the flag for that.
            if(transparentPixelCounter == tileData.length ){
                isFullyTransparent = true;
            }

            // Use the pixel data to create imageData for the tile canvas.
            let tileCanvas = document.createElement("canvas");
            tileCanvas.width = jsonTileset.config.tileWidth;
            tileCanvas.height = jsonTileset.config.tileHeight;
            let tileCtx    = tileCanvas.getContext('2d');
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
            _GFX.cache[jsonTileset.tilesetName].tileset.push( { 
                canvas            : tileCanvas, 
                ctx               : tileCtx, 
                tileImageData     : tileImageData, 
                hasTransparency   : hasTransparency, 
                isFullyTransparent: isFullyTransparent 
            } );
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
            if(!tilemap.length){ console.error(`WARNING: Skipping empty tilemap: ${key}.`); return; }

            let tilemapCanvas = document.createElement("canvas");
            tilemapCanvas.width  = w * jsonTileset.config.tileWidth;
            tilemapCanvas.height = h * jsonTileset.config.tileHeight;
            let tilemapCtx    = tilemapCanvas.getContext('2d');
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
            // Preload the files concurrently instead of sequentially.
            let files = [];
            let proms = [];
            _GFX.timeIt("VIDEOMODEA_generateAndCache_tileSetData_fileDownloads", "start");
            for(let i=0; i<_APP.configObj.gfxConfig.tilesets.length; i+=1){
                let tilesetKey = _APP.configObj.gfxConfig.tilesets[i];
                let tilesetFile = _APP.configObj.gfxConfig.tilesetFiles.find(d=>d.indexOf(tilesetKey)!=-1);
                // Add the key immediately to maintain tileset order. (tilesets have numbered indexes that need to be maintained.)
                files[tilesetKey] = {};
                proms.push(
                    new Promise(async function(res,rej){
                        // let data = await _APP.utility.addFile( { "f":tilesetFile, "t":"json" , "n":tilesetKey }, _APP.relPath);
                        // files[tilesetKey] = await _APP.utility.addFile( { "f":tilesetFile, "t":"json" , "n":tilesetKey }, _APP.relPath); 
                        // res();

                        _APP.utility.addFile( { "f":tilesetFile, "t":"json" , "n":tilesetKey }, _APP.relPath).then(
                            (file)=>{
                                files[tilesetKey] = file;
                                res();
                            }, 
                            (err)=>{ console.log("ERROR: generateAndCache_tileSetData:", err); rej(err); }
                        );
                    })
                );
            }
            await Promise.all(proms);
            _GFX.timeIt("VIDEOMODEA_generateAndCache_tileSetData_fileDownloads", "stop");

            // Create tileset config references.
            for(let tilesetKey in files){
                let jsonTileset = files[tilesetKey]; 

                // Make sure that the required file is loaded.
                if(!jsonTileset){ 
                    console.error("ERROR: Tileset file not loaded:", tilesetKey); 
                    continue; 
                }

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
                    tilesetIndex: undefined,
                };
                _GFX.cache[tilesetName].tilesetIndex = Object.keys(_GFX.cache).length-1;

                // Convert the tileset.
                this.convertTileset(jsonTileset);

                // Convert the tilemaps.
                this.convertTilemaps(jsonTileset);
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
        hasVideoModeAConfig: {
            test: function(){ if(undefined ==_APP.configObj.gfxConfig.jsgame_shared_plugins_config.videoModeA){ throw ""; }  }, 
            desc:"jsgame_shared_plugins_config.videoModeA is defined", 
            pass:true, 
        },
        hasDimensions: {
            test: function(){ 
                let dimensions = _APP.configObj.gfxConfig.dimensions;
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
                if(undefined == _APP.configObj.gfxConfig.tilesets){ throw ""; } 
                try{ _APP.configObj.gfxConfig.tilesets.length ? true : false; } catch(e){ throw ""; }
            }, 
            desc:"gfxConfig.tilesets is valid", 
            pass:true, 
        },
        numLayersDefined: { 
            test: function(){ if(undefined == _APP.configObj.gfxConfig.layers){ throw ""; } }, 
            desc:"gfxConfig.layers is defined", 
            pass:true, 
        },
        numLayersLength:  { 
            test: ()=>{ try{ _APP.configObj.gfxConfig.layers.length ? true : false; } catch(e){ throw ""; } }, 
            desc:"gfxConfig.layers has values", 
            pass:true, 
        },
    };

    for(let key in tests){
        let test = tests[key];
        try{ 
            test.test(); 
            test.pass = true;
        }
        catch(e){
            let msg1 = `initChecks: FAILED TEST: '${test.desc}': `;
            console.error(msg1);
            test.pass = false;
        }
    };

    return tests;
};

// INTERNAL: Init the graphics mode and perform conversions. (The _APP should call this one time).
_GFX.init = async function(canvasesDestinationDiv){
    let generateCanvasLayer = function(rec, zIndex, type){
        let dimensions = _APP.configObj.gfxConfig.dimensions;

        // Create a canvas for this layer.
        let canvas = document.createElement("canvas");
        canvas.width  = dimensions.tileWidth * dimensions.cols;
        canvas.height = dimensions.tileHeight * dimensions.rows;
        
        let ctx;

        // Set some CSS for this canvas layer.
        if(rec.bg_color){ canvas.style["background-color"] = rec.bg_color; }
        canvas.style["z-index"] = zIndex;
        // canvas.classList.add("videoModeA_canvasLayer");
        canvas.classList.add("canvasLayer");

        // Add the data to canvasLayers.
        _GFX.canvasLayers.push( { name:rec.name, canvas:canvas, ctx:ctx, type:type } );

        // Return the canvas;
        return canvas;
    };

    return new Promise(async (resolve, reject)=>{
        _GFX.timeIt("VIDEOMODEA_INIT_TOTAL", "start");

        // Save the videoMode config.
        _GFX.config = _APP.configObj.gfxConfig.jsgame_shared_plugins_config.videoModeA;

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
            console.error(msg1, initChecks);
            reject(); return; 
        }
        else{
            // let msg1 = `initChecks: All test(s) have passed.`;
            // console.log(msg1, initChecks);
        }

        // Set any missing defaults.
        if(_GFX.config.fadeCreateAtStart                 == undefined){ _GFX.config.fadeCreateAtStart                 = false; }
        if(_GFX.config.debugGFX                             == undefined){ _GFX.config.debugGFX                             = {};    }
        if(_GFX.config.debugGFX.generateAndReturnFadedTiles == undefined){ _GFX.config.debugGFX.generateAndReturnFadedTiles = false; }
        if(_GFX.config.debugGFX.recordPrevChanges           == undefined){ _GFX.config.debugGFX.recordPrevChanges           = false; }

        // Init(s).

        // GRAPHICS CONVERSION.
        _GFX.timeIt("generateAndCache_tileSetData", "start");
        await this.gfxConversion.init(this); 
        _GFX.timeIt("generateAndCache_tileSetData", "stop");
        
        // GENERATE CANVAS LAYERS.
        _GFX.timeIt("generateCanvasLayers", "start");
        let next_zIndex = 5;
        let outputDiv = document.getElementById(_APP.configObj.gfxConfig.outputDiv);
        for(let i=0, l=_APP.configObj.gfxConfig.layers.length; i<l; i+=1){
            // Get the record.
            let rec = _APP.configObj.gfxConfig.layers[i];
            
            // Generate the canvas.
            let newCanvas = generateCanvasLayer(rec, next_zIndex += 5, "user");

            // Append the canvas to the outputDiv.
            outputDiv.append(newCanvas);
        }
        _GFX.timeIt("generateCanvasLayers", "stop");

        // INIT DRAW.
        _GFX.timeIt("initDraw", "start");
        await this.draw.init(this);
        _GFX.timeIt("initDraw", "stop");
        
        // INIT VRAM.
        _GFX.timeIt("initVRAM", "start");
        await this.VRAM.init(this);
        _GFX.timeIt("initVRAM", "stop");
        
        // TODO: Sprites.
        //
        
        // Init the videoModeA WebWorker.
        _GFX.timeIt("initVideo", "start");
        await _WEBW.videoModeA.video.init();
        _GFX.timeIt("initVideo", "stop");

        _GFX.timeIt("initFade", "start");
        await _GFX.fade.init();
        _GFX.timeIt("initFade", "stop");
        
        _GFX.timeIt("VIDEOMODEA_INIT_TOTAL", "stop");
        resolve();
    });
};
