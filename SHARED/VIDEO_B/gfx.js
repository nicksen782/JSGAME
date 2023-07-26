var _WEBW_V = {
    worker: null,
    // Allowed SEND "modes."
    modes_SEND:[
        "initConfigAndGraphics",
        "initLayers",
        "sendTilesAndSprites",
        "sendGfxUpdates",
        "clearAllLayers",
        "generateCoreImageDataAssets",
        // DEBUG
        "_DEBUG.toggleDebugFlag",
        "requestHashCacheEntry",
        "_DEBUG.toggleCacheFlag",
        "_DEBUG.updateDebugTimings",
        "_DEBUG.setClearType",
        "_DEBUG.getDrawTimingsObject",
    ],
    
    // Allowed RECEIVE "modes."
    modes_RECEIVE:[
        "initConfigAndGraphics",
        "initLayers",
        "sendTilesAndSprites",
        "sendGfxUpdates",
        "clearAllLayers",
        "generateCoreImageDataAssets",
        // DEBUG
        "_DEBUG.toggleDebugFlag",
        "requestHashCacheEntry",
        "_DEBUG.toggleCacheFlag",
        "_DEBUG.updateDebugTimings",
        "_DEBUG.setClearType",
        "_DEBUG.getDrawTimingsObject",
    ],
    
    // Differed promises allow the system to wait for a response from the WebWorker.
    differedProms: {},
    createDeferredPromise : function(){
        var deferred = {};
        var promise = new Promise(function(resolve, reject) {
            deferred.resolve = resolve;
            deferred.reject  = reject;
        });
        deferred.promise = promise;
        return deferred;
    },

    // Handles the reception of responses.
    RECEIVE: function(e){
        // try     { if(this.modes_RECEIVE.indexOf(e.data.mode) == -1){ console.error("Invalid mode for RECEIVE:", mode); return; } }
        // catch(e){ console.error("RECEIVE: Error in 'e.data.mode'. ERROR:", e); return; }
        if(this.modes_RECEIVE.indexOf(e.data.mode) == -1){ console.error("Invalid mode for RECEIVE:", mode); return; }

        // Make sure there is data and a data.mode.
        if(e.data && e.data.mode){
            // if(e.data.data){ console.log("_WEBW_V: RECEIVE", e.data); }
            
            switch(e.data.mode){
                case "initConfigAndGraphics"     : {
                    // Save tileset/tilemap data.
                    if(e.data.data.minimalReturnData){
                        // Save the timings and counts.
                        _GFX.timings.initConfigAndGraphics = {
                            ...e.data.data.timings,
                            ...e.data.data.counts,
                        };
                        _GFX.tilesets = e.data.data.minimalReturnData;
                    }
                    else{
                        _GFX.tilesets = e.data.data;
                    }
                    
                    break;
                }

                case "initLayers"     : {
                    // Save the timings.
                    if(e.data.data.timings){
                        _GFX.timings.initLayers = e.data.data.timings;
                    }

                    break;
                }

                case "sendGfxUpdates"     : {
                    // Send data to afterDraw.
                    _GFX.funcs.afterDraw(e.data.data, false);

                    break;
                }

                case "_DEBUG.updateDebugTimings"     : {
                    // If debug is active is active then run the debugTasks.
                    if(_APP.debugActive){
                        // Save these timings.
                        _DEBUG.savePrevGfxTimings(e.data.data);
                        
                        _DEBUG.debugTasks(1);
                    }

                    break;
                }

                // Unmatched function.
                default     : { 
                    // console.log("RECEIVE: No specific RECEIVE function for:", e.data.mode);
                    break; 
                }
            }

            // Resolve differed promise if applicable.
            if(this.differedProms[e.data.mode]){ 
                this.differedProms[e.data.mode].resolve(e.data); 
            }
        }
        else{ console.error(`ERROR: No mode? e.data: ${e.data}, e.data.mode: ${e.data.mode}, e:`, e); }
    },

    // Sends requests to the WebWorker. Can await a differed promise or request data.
    SEND: async function(mode, data, waitForResp=false, dataRequest=false){
        // try     { if(this.modes_SEND.indexOf(mode) == -1){ console.error("Invalid mode for SEND:", mode); return; } }
        // catch(e){ console.error("SEND: Error in 'e.data.mode'. ERROR:", e); return; }
        if(this.modes_SEND.indexOf(mode) == -1){ console.error("Invalid mode for SEND:", mode); return; } 

        return new Promise(async(resolve,reject)=>{
            // Inject debugActive into data.data.
            if(mode == "initConfigAndGraphics"){
                data.data.debugActive = _APP.debugActive ?? false;
            }

            // Send the message.
            this.worker.postMessage(
                {
                    mode: mode,
                    data: data.data,
                    flags: { waitForResp: waitForResp, dataRequest: dataRequest },
                    // version: 2,
                    version: 5,
                },
                data.refs ?? [],
            );

            // Wait until finished?
            if(waitForResp){ 
                this.differedProms[mode] = this.createDeferredPromise();
                let retData = await this.differedProms[mode].promise;
                // delete this.differedProms[mode];
                resolve(retData); 
                return; 
            }
            else{
                resolve();
            }
        });
    },
};

// Starts the WebWorker and adds the "message" event listener to the WebWorker.
_WEBW_V.init = async function(){
    return new Promise(async (resolve,reject)=>{
        // Add the web worker and set the 'message' listener.
        if(_APP.configObj.gfxConfig.webWorker){
            this.worker = new Worker( `${_APP.configObj.gfxConfig.webWorker}` );
            // this.worker = new Worker( `${_APP.relPath}/VIDEO_B/video_webworker.js` );
            // this.worker = new Worker( `${_APP.relPath}/video_webworker.js`, { type: 'module' } );
            
            this.worker.addEventListener("message", (e)=>_WEBW_V.RECEIVE(e), false);
            resolve();
        }
        else{
            console.log("Missing webWorker config");
            reject("Missing webWorker config");
            throw "Missing webWorker config";
            return;
        }
    });
};

var _GFX = {
    timings: {},

    // Cache of tileset settings, tiles (optional), and tilemaps.
    tilesets:{},

    // LayerKeys (Used as a lookup instead of Object.keys().)
    layerKeys: new Set(),

    // TODO: remove "tilemaps". These will be stored in _GFX.layerObjs.objs instead.
    // Holds the graphics data that will be sent to the WebWorker.
    currentData : {
        // NOTE: Only the first layer will have: bgColorRgba.
        // Each layer will be key here containing a Set() similar to this:
        // "MyLayerName":{
        //     canvas: null,
        //     bgColorRgba: [0,0,0,255],
        //     tilemaps   : {},
        //     changes    : false,
        //     fade:{
        //         fade    : false,
        //         currFade: null,
        //         prevFade: null,
        //     },
        //     useFlicker: true
        // },
    },

    // Default values for settings.
    defaultSettings: {
        fade       : null,
        xFlip      : false,
        yFlip      : false,
        rotation   : 0,
        colorData  : [],
        bgColorRgba: []
    },

    ALLCLEAR: true,         //
    REMOVALS: {
        // Each layer will be key here containing a Set() similar to this:
        // MyLayerName: new Set(),
    },
    
    GFX_UPDATE_DATA: {
        gs1: "",
        gs2: "",
        version: 4,
        ALLCLEAR: false,
        hasChanges: false,

        // Each layer will be a key here containing an object similar to this:
        // MyLayerName: { 
        //     REMOVALS_ONLY: [],
        //     CHANGES: {}, 
        //     fade       : {}, 
        //     changes    : false, 
        //     bgColorRgba: [0,0,0,0]
        // }, 
    },
    create_GFX_UPDATE_DATA: function(){
        let DATA = this.GFX_UPDATE_DATA;
        DATA.gs1        = _APP.game.gs1 ;
        DATA.gs2        = _APP.game.gs2 ;
        DATA.ALLCLEAR   = _GFX.ALLCLEAR;
        DATA.hasChanges = false;

        let tilemapsThatHadChanges = [];

        for(let layerKey of _GFX.layerKeys){
            let layerData = _GFX.currentData[layerKey];
            if(layerKey == _GFX.L1_layerKey){
                if( !LayerObject.areArraysEqual(DATA[layerKey].bgColorRgba, layerData.bgColorRgba) ){
                    // console.log("Setting bgColorRgba on the first layer:", layerKey, DATA[layerKey].bgColorRgba, layerData.bgColorRgba);
                    DATA[layerKey].bgColorRgba = layerData.bgColorRgba;
                }
            }
            
            DATA[layerKey].CHANGES       = {};
            DATA[layerKey].REMOVALS_ONLY = [];
            DATA[layerKey].fade          = layerData.fade;
            DATA[layerKey].changes       = layerData.changes;
            DATA[layerKey].useFlicker    = layerData.useFlicker;

            // Process what has changed.
            let tilemap;
            
            for(let mapKey in layerData.tilemaps){
                tilemap = layerData.tilemaps[mapKey];

                // Find this value in _GFX.layerObjs.objs
                let tilemap2 = _GFX.layerObjs.objs[_APP.game.gs1][mapKey];

                // This value is likely added or changed. Check the actual LayerObject for _changedDrawNeeded to be sure.
                if(tilemap2 && tilemap2._changedDrawNeeded){
                    // console.log("needs update:", mapKey, tilemap2);

                    DATA[layerKey]["CHANGES"][mapKey] = tilemap; 
                    DATA.hasChanges = true; 
                    DATA[layerKey].changes = true; 

                    tilemapsThatHadChanges.push(mapKey);
                }
                else{
                    // console.log("does NOT need an update.", mapKey, tilemap2);
                    // continue;
                }
            }
            
            // REMOVALS_ONLY 
            // Compare the keys of changes against the keys of removals. 
            // Any key that is in changes should NOT be in removals.
            for(let key of _GFX.REMOVALS[layerKey]){
                if(!(key in DATA[layerKey].CHANGES)){ 
                    DATA[layerKey]["REMOVALS_ONLY"].push(key); 
                }
            }
            
            // If there is a removal on this layer then then the layer should be flagged for changes. 
            if(DATA[layerKey]["REMOVALS_ONLY"].length){
                DATA.hasChanges = true; 

                DATA[layerKey].changes = true;
            }
        }

        // Clear the _changedDrawNeeded flags on all maps that had it set previously.
        if(tilemapsThatHadChanges.length){
            for(let mapKey of tilemapsThatHadChanges){
                let tilemap2 = _GFX.layerObjs.objs[_APP.game.gs1][mapKey];
                tilemap2._changedDrawNeeded = false;
            }
        }
    },

    // Used for layer object management within a gamestate.
    layerObjs: {
        // Holds the layer objects per gamestate.
        objs: {},
        
        // Holds object key that are to be removed (hidden first THEN removed on the next frame.)
        // removalQueue: new Set(),

        // Returns the specified layer object for a gamestate.
        getOne: function(key, gamestate){
            /* 
            // EXAMPLE USAGE:
            // NOTE: The last argument, gamestate is technically optional and defaults to the current gamestate 1.

            _GFX.layerObjs.getOne("keyToGet", _APP.game.gs1);
            */

            // If the gamestate was not provided use the current gamestate 1.
            if(gamestate === ""){ return; }
            if(gamestate == undefined){ gamestate = _APP.game.gs1; }

            // Create the gamestate key in objs if it does not exist.
            if(this.objs[gamestate] == undefined){ this.objs[gamestate] = {}; }

            // console.log(`key: ${key}, gamestate: ${gamestate},`, this.objs[gamestate][key]);

            // Return the object.
            return this.objs[gamestate][key];
        },

        // Adds or replaces one layer object for a gamestate.
        createOne: function(className, config, gamestate){
            /* 
            // EXAMPLE USAGE:
            // NOTE: The last argument, gamestate is technically optional and defaults to the current gamestate 1.

            _GFX.layerObjs.createOne(LayerObject, {
                    layerObjKey: "demo_board", layerKey: "MyLayerName", tilesetKey: "bg_tiles",
                    tmap: _GFX.funcs.getTilemap("bg_tiles", "board_28x28"),
                    x: 0, y: 0, xyByGrid: true,
                    settings : {
                        xFlip: false, yFlip: false, rotation: 0, colorData:[]
                    }
                }, _APP.game.gs1
            );
            */

            // If the gamestate was not provided use the current gamestate 1.
            if(gamestate === ""){ return; }
            if(gamestate == undefined){ gamestate = _APP.game.gs1; }

            // Create the gamestate key in objs if it does not exist.
            if(this.objs[gamestate] == undefined){ this.objs[gamestate] = {}; }

            // Add/Create the new layer object.
            if(!config.layerObjKey && config.text){ config.layerObjKey = config.text; }
            return this.objs[gamestate][ config.layerObjKey ] = new className(config);
        },

        // Remove one layer object from objs for a gamestate.
        removeOne: function(key, gamestate){
            /* 
            // EXAMPLE USAGE:
            // NOTE: The last argument, gamestate is technically optional and defaults to the current gamestate 1.

            _GFX.layerObjs.removeOne("keyNameToRemove", _APP.game.gs1);
            */

            // If the gamestate was not provided use the current gamestate 1.
            if(gamestate === ""){ return; }
            if(gamestate == undefined){ gamestate = _APP.game.gs1; }

            // Create the gamestate key in objs if it does not exist.
            if(this.objs[gamestate] == undefined){ this.objs[gamestate] = {}; }

            // If this key was not found then return.
            if(!this.objs[gamestate][key]){ return {}; }

            // If this layer object does not have a render function then assume the layer object is not created yet and skip the render.
            if(!this.objs[gamestate][key].render){ return {}; }

            // this.removalQueue.add(key);

            // Remove from the graphics cache. 
            let config = this.objs[gamestate][key].removeLayerObject();
        
            // Clear this key.
            this.objs[gamestate][key] = {}; 
            
            // Delete this key.
            this.objs[gamestate][key] = null;
            delete this.objs[gamestate][key];

            // Return the config to the caller (makes reuse easier.)
            return config;
        },
        
        // Removes the specified key from all gamestate keys in objs.
        removeOneAllGamestates: function(key){
            for(let gs in this.objs){ this.removeOne(key, gs); }
        },

        // Clear ALL layer objects in objs for a gamestate.
        clearAll : function(gamestate){
            /* 
            // EXAMPLE USAGE:
            // NOTE: The last argument, gamestate is technically optional and defaults to the current gamestate 1.

            _GFX.layerObjs.clearAll(_APP.game.gs1);
            */

            // If the gamestate was not provided use the current gamestate 1.
            if(gamestate === ""){ return; }
            if(gamestate == undefined){ gamestate = _APP.game.gs1; }

            // Create the gamestate key in objs if it does not exist.
            if(this.objs[gamestate] == undefined){ this.objs[gamestate] = {}; }

            // Set each layer object to {}.
            for(let key in this.objs[gamestate]){ this.objs[gamestate][key] = {}; }
        },

        // Remove ALL layer objects for a gamestate.
        removeAll : function(gamestate){
            /* 
            // EXAMPLE USAGE:
            // NOTE: The last argument, gamestate is technically optional and defaults to the current gamestate 1.

            _GFX.layerObjs.removeAll(_APP.game.gs1_prev);
            _GFX.layerObjs.removeAll(_APP.game.gs1);
            */

            // If the gamestate was not provided use the current gamestate 1.
            if(gamestate === ""){ return; }
            if(gamestate == undefined){ gamestate = _APP.game.gs1; }

            // Create the gamestate key in objs if it does not exist.
            if(this.objs[gamestate] == undefined){ this.objs[gamestate] = {}; }

            // Run the removeOne function against each key for the gamestate's layer objects.
            for(let key in this.objs[gamestate]){ this.removeOne(key, gamestate); }
        },
        
        // Render ALL layer objects for a gamestate. (Skips layer objects with the hidden flag set.)
        render: function(gamestate){
            /* 
            // EXAMPLE USAGE:
            // NOTE: The last argument, gamestate is technically optional and defaults to the current gamestate 1.

            _GFX.layerObjs.render(_APP.game.gs1);
            */

            // If the gamestate was not provided use the current gamestate 1.
            if(gamestate === ""){ return; }
            if(gamestate == undefined){ gamestate = _APP.game.gs1; }

            // Create the gamestate key in objs if it does not exist.
            if(this.objs[gamestate] == undefined){ this.objs[gamestate] = {}; }

            let layerObjects = {};
            [..._GFX.layerKeys].map(d=>layerObjects[d] = {} );
            
            // Get all the layer objects. 
            let temp;
            let cnt = 0;
            for(let key in this.objs[gamestate]){
                let obj = this.objs[gamestate][key];

                // Skip the rendering of unchanged layer objects. 
                if(!obj._changed){ continue; }
                
                // Render the layer objects if it contains the render function.
                if(obj.render){ 
                    // Run the object's render function. Pass true for "onlyReturnLayerObjData".
                    temp = obj.render(true); 

                    // Data should have been returned. If not then skip.
                    if(!temp){ continue; }

                    // Store the returned layerObjectData into the object: layerObjects.
                    layerObjects[temp.layerKey][key] = temp;

                    // Increment the count.
                    cnt += 1;
                }

                // A LayerObject should always have a render function (either inherited or custom to an extended class.)
                // else{
                    // console.log("_GFX.layerObjs.render: Missing render function for object.");
                // }
            }

            // Render the layer object data records if there were any.
            // console.log(`Number of changed objects for for all layerKeys: ${cnt}`);
            if(cnt){ 
                // console.log(`Number of changed objects for for all layerKeys: ${cnt}`);
                
                // Send to updateLayer the layer objects for each individual layer (One layer at a time.)
                for(let layerKey in layerObjects){ 
                    _GFX.funcs.updateLayer(layerKey, layerObjects[layerKey]);
                }
            }

            layerObjects = null;
            // delete layerObjects;
        },
    },

    // Drawing update and drawing functions. 
    funcs:{
        // Sets all changed data to unchanged.
        clearChanges: function(){
            // Clear the special changes flags.
            _GFX.ALLCLEAR = false;
    
            // Clear the changes flags.
            // NOTE: _GFX.currentData and _GFX.REMOVALS have the same layerKeys.
            for(let layerKey in _GFX.currentData){ 
                // Get a handle to this layer.
                let layer = _GFX.currentData[layerKey];

                // Save the layerChange if debug mode is on (for _DEBUG.layerObjs.)
                if(_APP.debugActive && _APP.configObj.gfxConfig.enabled   && _APP.configObj.gfxConfig.debug && 'DEBUG' in _GFX){
                    if(layer.changes){
                        // _DEBUG.layerObjs.changes[layerKey] = true;
                    }
                }

                // Clear the changes flag.
                layer.changes = false;

                // Clear the REMOVALS array.
                _GFX.REMOVALS[layerKey].clear();

                // Update prevFade to currFade.
                // if(layer.fade.fade && layer.fade.prevFade != layer.fade.currFade){
                if(layer.fade.prevFade != layer.fade.currFade){
                    // console.log("Updating prevFade");
                    layer.fade.prevFade = layer.fade.currFade;
                }

                // Clear the CHANGES object in GFX_UPDATE_DATA.
                _GFX.GFX_UPDATE_DATA[layerKey].CHANGES = {};

                // Clear the REMOVALS_ONLY array in GFX_UPDATE_DATA.
                _GFX.GFX_UPDATE_DATA[layerKey].REMOVALS_ONLY = [];

                // fade
                // changes
                // bgColorRgba 
            }
        },

        // This requests that all output canvases be cleared. 
        // Also removes all tilemap object data locally and in the WebWorker.
        clearAllLayers: async function(keepBg1BgColor=true){
            // Local data clear.
            for(let layerKey in _GFX.currentData){ 
                // Add to REMOVALS.
                for(let mapKey in _GFX.currentData[layerKey].tilemaps){ 
                    _GFX.REMOVALS[layerKey].add(mapKey); 
                }

                // Remove all tilemaps.
                for(let layerObjKey in _GFX.currentData[layerKey].tilemaps){
                    // console.log("CLEAR ALL LAYERS:", layerKey, layerObjKey, _GFX.currentData[layerKey].tilemaps[layerObjKey]);
                    // _GFX.layerObjs.removeOneAllGamestates(layerObjKey);
                    _GFX.funcs.removeLayerObj(layerKey, layerObjKey);
                }
                // _GFX.currentData[layerKey].tilemaps = {};

                // Keep the background color for L1?
                if(layerKey == _GFX.L1_layerKey && !keepBg1BgColor){
                    _GFX.currentData[layerKey].bgColorRgba = [0,0,0,0];
                }

                // Clear all changes and removals for this layer. 
                _GFX.REMOVALS[layerKey].clear();
                _GFX.currentData[layerKey].REMOVALS_ONLY = [];
                _GFX.currentData[layerKey].CHANGES = {};

                // Set changes true so that this updates the canvas output.
                _GFX.currentData[layerKey].changes = true;
            }

            // Set the flag for screen and WebWorker cache clear.
            _GFX.ALLCLEAR = true;

            // Directly request the screen and WebWorker cache clear.
            // await _WEBW_V.SEND("clearAllLayers", { data:{}, refs:[] }, true, false);
        },

        // Updates the background color for L1.
        updateL1BgColorRgba: function(bgColorRgba=[0,0,0,255]){
            // _GFX.funcs.updateL1BgColorRgba([0,0,255,255]);
            let layerKey = _GFX.L1_layerKey;

            if(Array.isArray(bgColorRgba) && bgColorRgba.length){
                // TODO: Needed?
                _GFX.GFX_UPDATE_DATA[layerKey].bgColorRgba = bgColorRgba;
                
                _GFX.currentData[layerKey].bgColorRgba = bgColorRgba;
            }
            else{
                // TODO: Needed?
                _GFX.GFX_UPDATE_DATA[layerKey].bgColorRgba = [0,0,0,0];

                _GFX.currentData[layerKey].bgColorRgba = [0,0,0,0];
            }

            //
            _GFX.currentData[layerKey].changes = true;
        },

        // Updates the specified layer (main thread.) Can accept multiple tilemaps.
        // Creates/Updates an entry in _GFX.currentData[layer].tilemaps[tilemapKey].
        // Only updates if the data has changed. (Uses a hash.)
        // Accepts data created by funcs.createLayerObjData or createPrintLayerObjData.
        // Called by _GFX.layerObjs.render.
        updateLayer: function(layer, tilemaps={}){
            // Only accept real layerKeys.
            if(_GFX.layerKeys.has(layer)){
                let tilemap;
                let tw ;
                let th ;

                // Go through each tilemap in the list.
                for(let tilemapKey in tilemaps){
                    // Get the tilemap from the provided list.
                    tilemap = tilemaps[tilemapKey];
                    tw = _GFX.tilesets[tilemap.ts].config.tileWidth;
                    th = _GFX.tilesets[tilemap.ts].config.tileHeight;

                    // Make sure that settings is an object and is correct.
                    tilemap.settings = LayerObject.correctSettings(tilemap.settings);

                    // Ensure that x and y are integers.
                    tilemap.x = tilemap.x | 0;
                    tilemap.y = tilemap.y | 0;

                    // If useGlobalOffsets is defined use them to offset x and y.
                    if(_APP.configObj.gfxConfig.useGlobalOffsets){
                        tilemap.x += ( (_APP.configObj.gfxConfig.globalOffsets_x ?? 0) * tw);
                        tilemap.y += ( (_APP.configObj.gfxConfig.globalOffsets_y ?? 0) * th);
                    }

                    // Accept the changed object and store to _GFX.currentData.

                    // Update the layerObject (main thread.)
                    _GFX.currentData[layer].tilemaps[tilemapKey] = {
                        ts       : tilemap.ts,                                    // Tileset name.
                        tmap     : tilemap.tmap,                                  // Tilemap array.
                        x        : tilemap.x,                                     // Coordinate: x (Relative to the pixel, not a grid tile.)
                        y        : tilemap.y,                                     // Coordinate: y (Relative to the pixel, not a grid tile.)
                        w        : tilemap.w,                                     // Dimension : w (Relative to the pixel, not a grid tile.)
                        h        : tilemap.h,                                     // Dimension : h (Relative to the pixel, not a grid tile.)
                        hidden   : tilemap.hidden ?? false,                       // Visibility.
                        settings : tilemap.settings,                              // Transform settings.
                        mapKey   : tilemapKey,                                    // Name used by the LayerObject.
                        text     : tilemap.text ?? null,                          // Text using it exists.
                        removeHashOnRemoval: tilemap.removeHashOnRemoval ?? true, // When removed also remove from the Hashcache.
                        allowResort        : tilemap.allowResort ?? false,        // All the draw order to be reversed every-other frame when changed.)
                    };

                    // Set the changes flag for this layer since there were changes.
                    _GFX.currentData[layer].changes = true;
                }
            }
            else{
                console.error("updateLayer: INVALID LAYER KEY:", layer);
            }
        },

        // Sets the fade over-ride values for all or any layers.
        // NOTE: Fade uses preGenerated fadeTiles so color replacements will be skipped.
        setFade: function(layer="ALL", level=0){
            // EXAMPLE USAGE:
            // _GFX.funcs.setFade("ALL", 5);
            // NOTES: 
            // layer can be one of: [ "L1", "L2", "L3", "TXT1", "ALL" ]. (Or any valid layerKey name.)
            // level can be one of: [ null, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11 ]
            // level for null can alternatively be: [ "off" ]
            // level for 10 and 11 can alternatively be one of: [ "black", "clear" ]

            // Convert named levels to their actual level value.
            if     (level == "off"){ level = null; }
            else if(level == "black"){ level = 10; }
            else if(level == "clear"){ level = 11; }

            // Affect all layers?
            if(layer=="ALL"){
                // If the fade level is off then reset the fade settings for each layer.
                for(let layerKey in _GFX.currentData){
                    if(level==null){
                        for(let layerKey in _GFX.currentData){ 
                            // Set fade false.
                            _GFX.currentData[layerKey].fade.fade = false;
                        
                            // Set prevFade to null.
                            // _GFX.currentData[layerKey].fade.prevFade = null;
                        
                            // Set currFade to null.
                            _GFX.currentData[layerKey].fade.currFade = null;
                        }
                    }
                    // No, set the fade level for each layer. 
                    else{
                        for(let layerKey in _GFX.currentData){ 
                            // Set fade true.
                            _GFX.currentData[layerKey].fade.fade = true;
                        
                            // Set prevFade to currFade.
                            // _GFX.currentData[layerKey].fade.prevFade = _GFX.currentData[layerKey].fade.currFade;
                        
                            // Set currFade to level.
                            _GFX.currentData[layerKey].fade.currFade = level;
                        }
                    }

                    // Set changes to true.
                    _GFX.currentData[layerKey].changes = true;
                }
            }

            // Affect an individual layer.
            else{
                // If the fade level is off then reset the fade settings for the layer.
                if(level==null){
                    // Set fade false.
                    _GFX.currentData[layer].fade.fade = false;
                     
                    // Set prevFade to null.
                    // _GFX.currentData[layer].fade.prevFade = null;
                 
                    // Set currFade to null.
                    _GFX.currentData[layer].fade.currFade = null;
                }
                // No, set the fade level for the layer. 
                else{
                    // Set fade true.
                    _GFX.currentData[layer].fade.fade = true;
                                        
                    // Set prevFade to currFade.
                    // _GFX.currentData[layer].fade.prevFade = _GFX.currentData[layer].fade.currFade;

                    // Set currFade to level.
                    _GFX.currentData[layer].fade.currFade = level;
                }

                // Set changes to true.
                _GFX.currentData[layer].changes = true;
            }
        },

        // This gathers the data created by the other update functions and sends the values.
        sendGfxUpdates: async function(awaitDraw){
            // Update _GFX.GFX_UPDATE_DATA
            _GFX.create_GFX_UPDATE_DATA();

            if(_GFX.GFX_UPDATE_DATA.hasChanges){
                // Send ASYNC
                if(!awaitDraw){
                    // console.log("using await: false");
                    _WEBW_V.SEND("sendGfxUpdates", { 
                        data: _GFX.GFX_UPDATE_DATA, 
                        refs:[]
                    }, false, _APP.debugActive); // Request data if debug is active.
                }
                
                // Await for the graphics update to finish.
                else{
                    // console.log("using await: true");
                    await _WEBW_V.SEND("sendGfxUpdates", { 
                        data: _GFX.GFX_UPDATE_DATA, 
                        refs:[]
                    }, true, _APP.debugActive); // waitForResp, Request data if debug is active.
                }
            }

            // Clear the changes.
            _GFX.funcs.clearChanges();
        },

        // Returns a copy of a tilemap.
        getTilemap: function(ts, mapKey){
            // Reference.
            // return _GFX.tilesets[ts].tilemaps[mapKey];
            
            // Value copy.
            let tilemap = _GFX.tilesets[ts].tilemaps[mapKey];

            let pointersSize = _GFX.tilesets[ts].config.pointersSize;

            if(!tilemap){ 
                console.error(`Missing tile map for '${ts}':'${mapKey}'. Returning blank tilemap.`);
                return pointersSize == 8 
                    ? new Uint8Array([0,0, 0])
                    : new Uint16Array([0,0, 0]);
            }

            return pointersSize == 8 
                ? new Uint8Array(tilemap)
                : new Uint16Array(tilemap);
        },

        // Removes a layer object and sets the changes for that layer to true. 
        removeLayerObj: function(layerKey, mapKey){
            if(!_GFX.currentData[layerKey].tilemaps[mapKey]){
                // console.log("removeLayerObj: Could not find:", layerKey, mapKey);
                return; 
            }

            // Add to the set (won't add if it is already there.)
            _GFX.REMOVALS[layerKey].add(mapKey);

            // Delete from currentData.
            if(_GFX.currentData[layerKey].tilemaps[mapKey]){
                _GFX.currentData[layerKey].tilemaps[mapKey] = null;
                delete _GFX.currentData[layerKey].tilemaps[mapKey];
            }
            
            // Set changes to true so that the canvas output updates.
            _GFX.currentData[layerKey].changes = true;
        }, 

        // This is called after each draw completes.
        afterDraw: function(data={}, forceGraphicsDataUsed=false){
            // console.log(data);
            // debugger;
            
            if(data == ""){ return; }

            // BACKGROUND COLOR CHANGES
            if(data.newL1_bgColor){
                // Break out the rgb data.
                let [r,g,b,a] = data.newL1_bgColor;
                a = ( ( (a/255) * 100 ) |0 ) / 100;

                // Create strings for comparison
                let currentString = _GFX.currentData[_GFX.L1_layerKey].canvas.style['background-color'];
                let newString;

                // If the alpha is fully opaque then the browser will set to rgb, otherwise rgba. 
                if(a==1){ newString = `rgb(${r}, ${g}, ${b})`; }
                else    { newString = `rgba(${r}, ${g}, ${b}, ${a})`; }
                
                // Apply the new bgColorRgba if the currentString and newString do not match.
                if(currentString != newString){
                    _GFX.currentData[_GFX.L1_layerKey].canvas.style['background-color'] = newString;
                    // console.log(`Changed from: ${currentString} to ${newString}`, r,b,g,a);
                }
                // else{
                    // console.log(`SAME: DATA  : ${currentString} to ${newString}`, r,b,g,a);
                // }
            }

            // DEBUG: If debug is active then schedule the debug tasks.
            if(_APP.debugActive && _APP.configObj.gfxConfig.debug && 'DEBUG' in _GFX){
                _APP.utility.funcQueue.add({
                    name: `GFX_DEBUG: FRAME: ${_APP.game.gameLoop.frameCounter}`, // OPTIONAL. Only useful for debugging the funcQueue.
                    args: [data],
                    bind: this,
                    func: function(data){
                        // console.log("You passed these args:", data);
                        _GFX.DEBUG.updateDebugDisplays(data);
                    }
                });
            }
        },
    },

    // Transformation utilities.
    utilities:{
        // Returns a hash for the specified string. (Variation of Dan Bernstein's djb2 hash.)
        djb2Hash: function(str) {
            // Example usages:
            // _GFX.utilities.djb2Hash( "string to hash" );
            // _GFX.utilities.djb2Hash( [1, 2, 3, "4", "5", [1,2,3] ]);
            if(typeof str != "string") { str = str.toString(); }
            var hash = 5381;
            for (var i = 0; i < str.length; i++) {
                hash = ((hash << 5) + hash) + str.charCodeAt(i); /* hash * 33 + c */
            }
            return hash;
        },
    },
};

_GFX.init = async function(){
    return new Promise(async (resolve,reject)=>{
        // Generate canvas.
        const generateCanvasLayer = function(rec, dimensions){
            // Create a canvas for this layer.
            let canvas = document.createElement("canvas");
            canvas.width  = dimensions.tileWidth * dimensions.cols;
            canvas.height = dimensions.tileHeight * dimensions.rows;
            
            // Set CSS for this canvas layer.
            if(rec.css){
                for(let c=0; c<rec.css.length; c+=1){
                    let k = rec.css[c].k;
                    let v = rec.css[c].v;
                    canvas.style[k] = v;
                }
            }
            canvas.classList.add("canvasLayer");
    
            // Return the object.
            return { 
                name      : rec.name, 
                canvasElem: canvas, 
            };
        };

        // Web Worker.
        await _WEBW_V.init();
        
        // Send the init request with the config data. Await the response.
        let currentPageUrl = new URL(window.location.href);
        let appRootPath = currentPageUrl.pathname.substring(0, currentPageUrl.pathname.lastIndexOf(currentPageUrl.pathname.includes('.') ? '/' : '') + 1);
        await _WEBW_V.SEND("initConfigAndGraphics", {
            data: { 
                endianness     : _APP.configObj.endianness,
                gfxConfig      : _APP.configObj.gfxConfig,
                defaultSettings: _GFX.defaultSettings, 
                appRootPath    : appRootPath 
            } 
        }, true, true);
        
        // Generate canvas layers and attach to the DOM.
        let outputDiv = document.getElementById( _APP.configObj.gfxConfig.outputDiv );
        let layers = [];
        for(let l=0; l<_APP.configObj.gfxConfig.layers.length; l+=1){
            let rec = _APP.configObj.gfxConfig.layers[l];
            let layer = generateCanvasLayer(rec, _APP.configObj.gfxConfig.dimensions);
            layer.canvasElem.setAttribute("name", rec.name);
            outputDiv.append(layer.canvasElem);
            layer.canvas = layer.canvasElem.transferControlToOffscreen();
            
            // Save data to _GFX.currentData.
            _GFX.currentData[rec.name] = {
                canvas: layer.canvasElem,
                tilemaps   : {},
                changes    : false,
                fade:{
                    fade    : false,
                    currFade: null,
                    prevFade: null,
                },
                useFlicker: rec.useFlicker
            }

            // Save the layerKey (name) to _GFX.layerKeys.
            _GFX.layerKeys.add(rec.name);

            // Add a new set in _GFX.REMOVALS.
            _GFX.REMOVALS[rec.name] = new Set();

            // Configure _GFX.GFX_UPDATE_DATA for this layer.
            _GFX.GFX_UPDATE_DATA[rec.name] = {
                REMOVALS_ONLY: [],
                CHANGES: {}, 
                fade       : {}, 
                changes    : false, 
            };

            // Add keys/values that are specific for the first layer.
            if(l==0){ 
                _GFX.currentData[rec.name].bgColorRgba = [0,0,0,255]; 
                _GFX.GFX_UPDATE_DATA[rec.name].bgColorRgba = [0,0,0,0]; 
                _GFX.L1_layerKey = rec.name; 
            }

            layers.push({
                canvas        : layer.canvas,
                canvasOptions : rec.canvasOptions,
                name          : rec.name,
                clearType     : rec.clearType,
            });
        }

        // Send transferred canvases to the webworker. Await the response.
        await _WEBW_V.SEND("initLayers", {
            data:{
                layers: layers,
            },
            refs:[...layers.map(d=>d.canvas)]
        }, true, true);

        resolve();
    });
};
_GFX.postInit = function(){
    // Apply borders.
    let outputDiv = document.querySelector(`#${_APP.configObj.gfxConfig.outputDiv}`);
    let canvasLayers = outputDiv.querySelectorAll(`.canvasLayer`);
    if(_APP.configObj.gfxConfig.borders.outputDiv){ outputDiv.classList.add("borderOnGameView");  }
    if(_APP.configObj.gfxConfig.borders.canvasLayers){
        for(let elem of canvasLayers){ 
            elem.classList.add("borderOnCanvasLayer"); 
        }
    }

    // setInterval(function(){
    //     let w1,w2, h1, h2, rect1, rect2;
    //     {
    //         let {width, height} = getComputedStyle( document.querySelector(".canvasLayer") ); 
    //         w1=width; h1=height;
    //         rect1 = document.querySelector(".canvasLayer").getBoundingClientRect(); 
    //     }
        
    //     {
    //         let {width, height} = getComputedStyle( outputDiv ); w2=width; h2=height;
    //         rect2 = outputDiv.getBoundingClientRect(); 
    //     }
    //     console.log("outputDiv      :", w1, h1, rect1, outputDiv );
    //     console.log("1st canvasLayer:", w2, h2, rect2, canvasLayers[0] ) ;
    // }, 2000);
    
};

// ***********
// * CLASSES *
// ***********

// Creates one LayerObject.
class LayerObject {
    /* EXAMPLE USAGE:
    */

    // Checks if arrays are equal. (May use recursion.)
    static areArraysEqual(array1, array2){
        // LayerObject.areArraysEqual(tmap1, tmap2);

        // Ensure that the inputs are defined.
        if (undefined === array1 || undefined === array2) { 
            console.error("areArraysEqual: Inputs must be arrays.", array1, array2);
            return false; 
        }

        // Check if the arrays are the same length. If they are then there is nothing more that needs to be checked.
        if (array1.length !== array2.length) { return false; }
    
        // Check if all items exist and are in the same order
        for (let i = 0; i < array1.length; i++) {
            // Handle arrays using recursion.
            if (
                Array.isArray(array1[i]) && 
                Array.isArray(array2[i])
            ) {
                if (!this.areArraysEqual(array1[i], array2[i])) {
                    return false;
                }
            } 
            // Handle normal properties. Are these properties that same value?
            else if (array1[i] !== array2[i]) {
                return false;
            }
        }
    
        // If we have not returned false by this point then the arrays are equal.
        return true;
    };
    
    // Ensures that settings is an object with at least the default values within it.
    static correctSettings(settings){
        // Check if settings is a valid object. Make it an object if it is not already.
        if (settings === null || typeof settings !== 'object' || Array.isArray(settings)) {
            settings = {};
        }

        // Merge the default settings with the provided settings.
        // Already existing settings will remain and missing settings will be added from the default settings.
        return Object.assign({}, _GFX.defaultSettings, settings);
    };


    // Force x and y values to be within the acceptable range of the screen dimensions.
    static _clampXandY(x, y, w, h, ts){
        let maxX = _APP.configObj.gfxConfig.dimensions.cols * _APP.configObj.gfxConfig.dimensions.tileWidth;
        let maxY = _APP.configObj.gfxConfig.dimensions.rows * _APP.configObj.gfxConfig.dimensions.tileHeight;
        
        // Min/Max x.
        x = Math.max(
            0-w, 
            Math.min(x, maxX+w)
        );

        // Min/Max y.
        y = Math.max(
            0-h, 
            Math.min(y, maxY+h)
        );

        return { x:x, y:y };
    };

    static xy_toPixelType(x, y, tw, th, ts, xyByGrid){
        // Draw by grid or by pixel?
        if(xyByGrid && ts){ 
            x = x * tw; 
            y = y * th;
        }

        // Ensure that x and y are integers.
        x = x | 0;
        y = y | 0;

        // Return the x and y values.
        return {
            x: x,
            y: y,
        };
    };

    // Creates a layer object from a tilemap.
    // NOTE: Output is used with updateLayer.
    static createLayerObjData(obj){
        // Correct any missing data in the object.
        if(undefined == obj)        { console.log(obj); throw `createLayerObjData: Missing obj: ${JSON.stringify(obj)}`; }
        if(undefined == obj.mapKey) { console.log(obj); throw `createLayerObjData: Missing mapKey: ${JSON.stringify(obj)}`; }
        if(undefined == obj.ts)     { console.log(obj); throw `createLayerObjData: Missing ts: ${JSON.stringify(obj)}`; }
        if(undefined == obj.tmap)   { console.log(obj); throw `createLayerObjData: Missing tmap: ${JSON.stringify(obj)}`; }
        // if(undefined == obj.x)      { console.log(obj); throw `createLayerObjData: Missing x: ${JSON.stringify(obj)}`; }
        // if(undefined == obj.y)      { console.log(obj); throw `createLayerObjData: Missing y: ${JSON.stringify(obj)}`; }
        obj.settings = LayerObject.correctSettings(obj.settings); // Make sure that settings is an object.

        let tw = _GFX.tilesets[obj.ts].config.tileWidth;
        let th = _GFX.tilesets[obj.ts].config.tileHeight;

        // Create the layerObject.
        let newObj = { 
            [obj.mapKey]: {
                ...obj,
                w       : obj.tmap[0] * tw,
                h       : obj.tmap[1] * th,
                // text    : false,
            }
        };

        // Adjust width and height if there is a rotation that would require the change.
        newObj[obj.mapKey].w = (obj.settings.rotation % 180 === 0) ? newObj[obj.mapKey].w : newObj[obj.mapKey].h;
        newObj[obj.mapKey].h = (obj.settings.rotation % 180 === 0) ? newObj[obj.mapKey].h : newObj[obj.mapKey].w;

        // Return the layerObject.
        return newObj;
    };

    // Convert any HEX values to RGBA.
    static hexToRgba(settings){
        // Helper function for converting HEX to RGBA
        function convertHexToRGBA(hexColor){
            return [
                parseInt(hexColor.slice(1, 3), 16),  // red
                parseInt(hexColor.slice(3, 5), 16),  // green
                parseInt(hexColor.slice(5, 7), 16),  // blue
                hexColor.length === 9 ? parseInt(hexColor.slice(7, 9), 16) : 255 // alpha
            ];
        }

        // Handle colorData HEX to RGBA conversion.
        if(settings.colorData && settings.colorData.length){
            for(let i=0, len=settings.colorData.length; i<len; i+=1){
                for(let j=0; j<2; j++){  // Loop over both src and dst
                    let color = settings.colorData[i][j];
                    if(typeof color === "string"){
                        let convertedColor = convertHexToRGBA(color);
                        settings.colorData[i][j] = convertedColor;
                        // console.log(`settings.colorData[${i}][${j}]:`, "BEFORE:", color, ", AFTER:", convertedColor);
                    }
                }
            }
        }

        // Handle bgColorRgba HEX to RGBA conversion.
        if(settings.bgColorRgba){
            let color = settings.bgColorRgba;
            if(typeof color === "string"){
                settings.bgColorRgba = convertHexToRGBA(color);
                // console.log("bgColorRgba:              BEFORE:", color, ", AFTER:", settings.bgColorRgba);
            }
        }

        return settings;
    };

    // Getters and setters:
    get x()          { return this._x; } 
    get y()          { return this._y; } 
    get tmap()       { return this._tmap; } 
    get layerKey()   { return this._layerKey; } 
    get tilesetKey() { return this._tilesetKey; } 
    get settings()   { return this._settings; } 
    get xyByGrid()   { return this._xyByGrid; } 
    get hidden()     { return this._hidden; } 
    
    set hidden(value)     { if( this._hidden     !== value){ this._hidden     = value; this._changed = true; } }
    set x(value)          { if( this._x          !== value){ this._x          = value; this._changed = true; } }
    set y(value)          { if( this._y          !== value){ this._y          = value; this._changed = true; } }
    set tmap(value)       { 
        if(undefined === this._tmap || !LayerObject.areArraysEqual(this._tmap, value) ){
            this._tmap = value; this._changed = true; 
        } 
    }
    set layerKey(value)   { if( this._layerKey   !== value){ 
        // Remove the existing layerObject from it's previous layer.
        if(this._layerKey && this.layerObjKey && _GFX.currentData[this._layerKey].tilemaps[this.layerObjKey]){
            // console.log(`REMOVING: layerKey: ${this._layerKey}, layerObjKey: ${this.layerObjKey}`);
            _GFX.funcs.removeLayerObj(this._layerKey, this.layerObjKey);
        }

        this._layerKey   = value; 
        this._changed = true; 
    } }
    set tilesetKey(value) { 
        if( this._tilesetKey !== value){ 
            this._tilesetKey = value; 
            this._changed = true; 
        } 
    }
    set settings(value)   { 
        // Make sure that the settings object is valid and at least has the default values. 
        this._settings = LayerObject.correctSettings(value);

        // Convert any HEX colorData and/or bgColorRgba values to RGBA.
        if( this._settings.colorData || this._settings.bgColorRgba ){
            this._settings = LayerObject.hexToRgba(this._settings);
        }

        // Set the _changed flag.
        this._changed = true; 
    }

    // TODO: FIX. Works find with gridxy to pixelxy. Need fix for pixelxy to gridxy.
    // IS THIS NEEDED?
    set xyByGrid(value)   { 
        if(this._xyByGrid == value) { return; }

        // xyByGrid requires tw and th.
        
        // Get the tileWidth and tileHeight from the tileset config. 
        if(this.tilesetKey){
            // console.log("this.tilesetKey:", this.tilesetKey);
            // console.log(this._tilesetKey, _GFX.tilesets[this._tilesetKey]);
            this.tw = _GFX.tilesets[this._tilesetKey].config.tileWidth ;
            this.th = _GFX.tilesets[this._tilesetKey].config.tileHeight;
        }

        // Get the tileWidth and tileHeight from the configObj.dimensions config.
        else{
            this.tw = _APP.configObj.dimensions.tileWidth ;
            this.th = _APP.configObj.dimensions.tileHeight;
        }

        this._xyByGrid = value; 
        this._changed = true; 
    }
    
    getSetting(key)       { return this._settings[key]; } 
    setSetting(key, value){ 
        if(this._settings[key] == value) { return; }

        // Set the new setting key/value.
        this._settings[key] = value; 

        // Convert any HEX colorData and/or bgColorRgba values to RGBA.
        if(key == "colorData" || key == "bgColorRgba"){
            this._settings[key] = LayerObject.hexToRgba(this._settings)[key];
        }

        this._changed = true; 
    }

    constructor(config){
        this.className = this.constructor.name;
        
        this.orgConfig  = config;

        // layerObjKey (MapKey), layerKey, and tilesetKey.
        this.layerObjKey = config.layerObjKey;
        this._layerKey    = config.layerKey;
        this._tilesetKey  = config.tilesetKey ?? "combined1";
        this.removeHashOnRemoval = config.removeHashOnRemoval ?? true;
        this.allowResort = config.allowResort ?? false;

        // Tilemap. (It is possible that a tilemap is not provided/required.)
        this._tmap = config.tmap; 

        // X position.
        this._x = config.x ?? 0;
        
        // Y position.
        this._y = config.y ?? 0;

        // x,y positioning (grid or pixel based.)
        this._xyByGrid = config.xyByGrid ?? false;
        this.tw = _GFX.tilesets[this._tilesetKey].config.tileWidth ;
        this.th = _GFX.tilesets[this._tilesetKey].config.tileHeight;
        
        this._hidden = config.hidden ?? false;

        // Settings.
        // this.settings = config.settings ?? LayerObject.correctSettings(null); // Needs the setter to properly initialize.
        if(config.settings){ this.settings = LayerObject.correctSettings(config.settings); }
        else               { this.settings = LayerObject.correctSettings(null); }

        // Change detection.
        this._changed = true;
    };
    
    // Removes the LayerObject from _GFX.layerObj.objs.
    removeLayerObject(){
        // console.log("NOT READY: removeLayerObject", this); return;
        
        // NOTE: The object instance will need to be removed from where it was stored.
        
        // Remove the layer object from the cache.
        _GFX.funcs.removeLayerObj(this.layerKey, this.layerObjKey);
        
        // Return the original config. (Helpful when changing layers.)
        return this.orgConfig;
    };

    // Render function.
    render(onlyReturnLayerObjData=false){
        // Do not render unchanged LayerObjects.
        if(!this._changed){ return; }

        // Convert x,y to pixel coordinates.
        let {x,y} = LayerObject.xy_toPixelType(this.x, this.y, this.tw, this.th, this._tilesetKey, this._xyByGrid);
        
        // Create the layer object data.
        let layerObjectData;
        layerObjectData = LayerObject.createLayerObjData({ 
            mapKey  : this.layerObjKey, 
            ts      : this.tilesetKey, 
            tmap    : this.tmap,
            settings: this.settings, 

            removeHashOnRemoval: this.removeHashOnRemoval,
            allowResort        : this.allowResort,
            hidden             : this.hidden,
        });

        // Save some of the returned values.
        this.w    = layerObjectData[this.layerObjKey].w;
        this.h    = layerObjectData[this.layerObjKey].h;
        // this.tmap = layerObjectData[this.layerObjKey].tmap;

        // TODO: This might not work with certain rotations since it is based on the tilemap dimensions.
        // Clamp x and y to the acceptable range on screen.
        let w = this._tmap[0];
        let h = this._tmap[1];
        ({x:layerObjectData[this.layerObjKey].x ,y: layerObjectData[this.layerObjKey].y} = LayerObject._clampXandY(x,y, w, h, this._tilesetKey));

        if(onlyReturnLayerObjData){ 
            layerObjectData[this.layerObjKey].layerKey = this.layerKey;
            this._changed = false;
            this._changedDrawNeeded = true;
            return layerObjectData[this.layerObjKey]; 
        }
    };
}

// 
class PrintText extends LayerObject{
    /*
    // Create one line as one LayerObject.
    _GFX.layerObjs.createOne(PrintText, { text: "LINE OF TEXT: ", x:0, y: 0, layerObjKey: `textLine1`, layerKey: "L4", xyByGrid: true, });

    // Create multiple lines as one LayerObject. 
    // (Width of the entire tilemap is determined by the longest line. 
    // Shorter lines are padded with spaces.)
    _GFX.layerObjs.createOne(PrintText, { text: ["LINE 1", "THIS IS LINE 2"], x:0, y: 0, layerObjKey: `textLine1`, layerKey: "L4", xyByGrid: true, });

    // Create multiple lines each being a separate LayerObject allowing each line to have different settings.
    // layerObjectKeys will contain an array of the LayerObject keys created.
    let layerObjectKeys;
    {
        // Specify some settings that can be used by lines.
        let bgColorRgba = [16, 16, 16, 224];
        let settingsGrayOut   = { colorData: [ [ [255,255,255,255], [104,104,104,255] ]], bgColorRgba: bgColorRgba };

        // Create the lines.
        layerObjectKeys = PrintText.genMultipleLines({
            // Start position of x and y.
            x:PauseMenu.pos.box.x, 
            y:PauseMenu.pos.box.y, 

            // Starts as hidden (true/false)
            hidden:true,

            // This indicates if each line should be the same width as the longest line (padded with spaces.)
            padLines: true, 

            layerObjKey: "pause_menu_text", tilesetKey: "combined1", layerKey: "L4", 

            // Shared settings (if settings is not specified for a line.)
            settings: { bgColorRgba: [16, 16, 16, 224] },
            
            lines: [
                { t: `  PAUSE   MENU  `   , },
                { t: ``                   , },
                { t: `   RESET ROUND`     , },
                { t: `   EXIT GAME`       , },
                { t: `   AUTO PLAY`       , s: settingsGrayOut }, // This line has grayOut settings applied.
                { t: `   CANCEL`          , },
                { t: ``                   , },
                { t: ``                   , skip: true }, // These lines are ignored but y still increments.
                { t: ``                   , skip: true }, // These lines are ignored but y still increments.
                { t: ``                   , skip: true }, // These lines are ignored but y still increments.
                { t: ``                   , skip: true }, // These lines are ignored but y still increments.
                { t: ``                   , skip: true }, // These lines are ignored but y still increments.
                { t: ``                   , },
                { t: `B:CANCEL   A:SET`   , },
            ]
        });
    }
    */

    // Getters and setters:
    get text()   { return this._text; } 
    set text(value){ if( this._text !== value){ this._text = value; this._changed = true; } }

    static genMultipleLines(config){
        // Set any missing defaults.
        if(!config.tilesetKey){ config.tilesetKey = _APP.configObj.gfxConfig.defaultFontTileset; }
        if(!config.layerKey)  { config.layerKey = "L4";}

        let line;
        let settings;
        let padLines = config.padLines ?? false;
        let textWidth;
        if(padLines){
            // Determine the longest line. 
            textWidth = config.lines.reduce((longestLength, current) => {
                return current.t.length > longestLength ? current.t.length : longestLength;
            }, 0);
        }

        // Get the x and y from the config.
        let x = config.x;
        let y = config.y;

        let layerObjectKey;
        let layerObjectKeys = [];

        // Create each line from the config.
        for(let i=0, len=config.lines.length; i<len; i+=1){
            // Go to the next line down.
            if(config.lines[i].skip){ y+=1; continue; }

            // Get the text for this line (trim the right side of the line or pad it.)
            if(padLines){ line = config.lines[i].t.padEnd(textWidth, " "); }
            else        { line = config.lines[i].t.trimRight(); }

            // Get the settings for this line.
            settings = config.lines[i].s ?? config.settings ?? {};

            // If the line has length then create the line with the text and settings for this line.
            if(line.length){
                layerObjectKey = `${config.layerObjKey}_L_${i}`;
                // Create the line.
                _GFX.layerObjs.createOne(PrintText, { 
                    text: line, 
                    x: x, 
                    y: y,
                    layerObjKey: layerObjectKey, 
                    layerKey   : config.layerKey  ,
                    tilesetKey : config.tilesetKey,
                    xyByGrid   : true, 
                    settings   : settings,
                    hidden: config.hidden ?? false,
                });
                layerObjectKeys.push(layerObjectKey);
            }

            // Go to the next line down.
            y+=1;
        }

        // Return the array of layerObjectKeys.
        return layerObjectKeys;
    };

    // Creates a layer object from a tilemap based on text string(s).
    // NOTE: Output is used with updateLayer.
    // NOTE: If using an array of strings each line will have the same length as the longest line (padded with spaces.)
    static createPrintLayerObjData(obj){
        // Correct any missing data in the object.
        if(undefined == obj)        { console.log(obj); throw `createPrintLayerObjData: Missing obj: ${JSON.stringify(obj)}`; }
        if(undefined == obj.mapKey) { console.log(obj); throw `createPrintLayerObjData: Missing mapKey: ${JSON.stringify(obj)}`; }
        if(undefined == obj.ts)     { console.log(obj); throw `createPrintLayerObjData: Missing ts: ${JSON.stringify(obj)}`; }
        if(undefined == obj.text)   { console.log(obj); throw `createPrintLayerObjData: Missing text: ${JSON.stringify(obj)}`; }
        // if(undefined == obj.x)      { console.log(obj); throw `createPrintLayerObjData: Missing x: ${JSON.stringify(obj)}`; }
        // if(undefined == obj.y)      { console.log(obj); throw `createPrintLayerObjData: Missing y: ${JSON.stringify(obj)}`; }
        obj.settings = LayerObject.correctSettings(obj.settings); // Make sure that settings is an object.

        let tw = _GFX.tilesets[obj.ts].config.tileWidth;
        let th = _GFX.tilesets[obj.ts].config.tileHeight;

        let fontObj = _APP.configObj.gfxConfig.fontObj ;
        let fontMap = _GFX.funcs.getTilemap(fontObj.ts, fontObj.tmap);

        // Get the highest tile. (For handling font tilesets that only have capital letters.)
        let maxTileId = fontMap.length -3; // Subtract for dimensions, and 1 more for max id.

        // Convert string to array of that string.
        if(!Array.isArray(obj.text)){ obj.text = [ obj.text ]; }
        
        // Determine the longest line. 
        let mapWidth = obj.text.reduce((longestLength, current) => {
            return current.length > longestLength ? current.length : longestLength;
        }, 0);
        let mapHeight = obj.text.length;
        
        // Start the new tilemap.
        let newTilemap;
        let pointersSize = _GFX.tilesets[obj.ts].config.pointersSize;
        newTilemap = pointersSize == 8 
            ? new Uint8Array( 2 + (mapWidth * mapHeight) )
            : new Uint16Array( 2 + (mapWidth * mapHeight) );
        
        newTilemap[0] = mapWidth;
        newTilemap[1] = mapHeight;

        // Go through each line.
        let index = 2;
        let line, chars, tileId, charCode, c, len;
        for(let l=0; l<obj.text.length; l+=1){
            // Get the line.
            line = obj.text[l];

            // Convert numbers to string.
            if(typeof line == "number"){ line = line.toString(); }

            // Convert the string to upper case (indicated by the fontObj config.)
            if(fontObj.forceUpperCase){ line = line.toUpperCase(); }

            // Pad the end of the line with spaces.
            line = line.padEnd(mapWidth, " ");

            // Create a tilemap of the characters in the string.
            chars = Array.from(line); 
            
            // Convert the ASCII values to tileIds.
            for(c=0, len=chars.length; c<len; c+=1){
                // Get the char code (ASCII) of the charactor.
                charCode = chars[c].charCodeAt(0);
                
                // Remove 32 to get a tileId index.
                tileId = charCode - 32;
                
                // Ensure that the tileId index is no greater than maxTileId.
                tileId = Math.min(tileId, maxTileId);
                
                // Use the tileId index to get the tileId based on the fontMap. (+2 to handle dimension bytes.)
                tileId = fontMap[tileId+2];
                
                // Add the tileId to the newTilemap.
                newTilemap[index] = tileId;

                // Increment the next newTilemap index.
                index +=1 ;
            }
        }

        // Create the layerObject.
        let newObj = { 
            [obj.mapKey]: {
                ...obj,
                tmap    : newTilemap,
                w       : newTilemap[0] * tw,
                h       : newTilemap[1] * th,
            }
        };

        // Adjust width and height if there is a rotation that would require the change.
        newObj[obj.mapKey].w = (obj.settings.rotation % 180 === 0) ? newObj[obj.mapKey].w : newObj[obj.mapKey].h;
        newObj[obj.mapKey].h = (obj.settings.rotation % 180 === 0) ? newObj[obj.mapKey].h : newObj[obj.mapKey].w;

        // Return the layerObject.
        return newObj;
    };

    constructor(config){
        // Set any missing defaults.
        if(!config.tilesetKey){ config.tilesetKey = _APP.configObj.gfxConfig.defaultFontTileset; }
        if(!config.layerKey)  { config.layerKey = "L4";}

        super(config);
        this.className = this.constructor.name;

        // mapKey  : this.layerObjKey, 
        
        this._text = config.text ?? ""
        this.removeHashOnRemoval = config.removeHashOnRemoval ?? true;
        this.allowResort = config.allowResort ?? true;

        // This part should be handled already by _GFX.funcs.layerObjs.createOne.
        // TODO: This could result in a very large name.
        // if(!config.layerObjKey){ config.layerObjKey = config.text; }

        this._changed = true;
    };

    // Render function.
    render(onlyReturnLayerObjData=false){
        // Do not render unchanged LayerObjects.
        if(!this._changed){ return; }

        // Text with no length? 
        if(!this.text.length){ this.text = ""; }

        // Convert x,y to pixel coordinates.
        let {x,y} = LayerObject.xy_toPixelType(this.x, this.y, this.tw, this.th, this._tilesetKey, this._xyByGrid);

        // Create the layer object data.
        let layerObjectData;
        layerObjectData = PrintText.createPrintLayerObjData({ 
            mapKey  : this.layerObjKey, 
            ts      : this._tilesetKey, 
            text    : this._text, 
            settings: this._settings, 

            removeHashOnRemoval: this.removeHashOnRemoval,
            allowResort        : this.allowResort,
            hidden             : this._hidden,
        });

        // Save some of the returned values.
        this.w     = layerObjectData[this.layerObjKey].w;
        this.h     = layerObjectData[this.layerObjKey].h;
        this._tmap = layerObjectData[this.layerObjKey].tmap;

        // TODO: This might not work with certain rotations since it is based on the tilemap dimensions.
        // Clamp x and y to the acceptable range on screen.
        let w = this._tmap[0];
        let h = this._tmap[1];
        ({x:layerObjectData[this.layerObjKey].x ,y: layerObjectData[this.layerObjKey].y} = LayerObject._clampXandY(x,y, w, h, this._tilesetKey));

        if(onlyReturnLayerObjData){ 
            layerObjectData[this.layerObjKey].layerKey = this.layerKey;
            this._changed = false;
            this._changedDrawNeeded = true;
            return layerObjectData[this.layerObjKey]; 
        }
    };
};