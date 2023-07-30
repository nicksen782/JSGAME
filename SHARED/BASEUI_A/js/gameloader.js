"use strict";
// @ts-nocheck
var _JSG = {}; 
var _APP = {
    standAlone : true,
    usingJSGAME: false,
    usingJSGAME_INPUT: false,
}; 

_APP.basePath = window.location.pathname.includes('/JSGAME/') ? '/JSGAME' : '';

_APP.debugActive = false;
_APP.debug2Active = false;
_APP.configObj = {}; // Populated by appConfigs.js.
_APP.sharedPlugins = {
    __util: {
        loadFiles1: async function(recs, syncType){
            let proms = [];
            for(let rec of recs){
                // Load files in order sequentially.
                if     (syncType == "sync") { await _APP.utility.addFile( rec, _APP.relPath);  }
                
                // Load files in order in parallel.
                else if(syncType == "async"){
                    proms.push( _APP.utility.addFile( rec, _APP.relPath) );
                }
            }

            // Wait for all promises to resolve. 
            if(proms.length){ await Promise.all(proms); }
        },
        fileLoadFunc1: async function(config, pluginObj){
            // NOTE: debugFiles2 and webWorker are loaded elsewhere.
            // for files and debugFiles, do the "loadFirst" files then the rest.
            let loadFirst;
            let loadAfter;

            // Load files: do the "loadFirst" files then the rest.
            if(config && config.enabled && config.files.length){
                loadFirst = pluginObj.files.filter(d=>d.syncType == "sync");
                loadAfter = pluginObj.files.filter(d=>d.syncType == "async");
                // console.log("files:", loadFirst, loadAfter);
                await _APP.sharedPlugins.__util.loadFiles1(loadFirst, "sync");
                await _APP.sharedPlugins.__util.loadFiles1(loadAfter, "async");
            }
            
            // Load debugFiles: do the "loadFirst" files then the rest.
            if(config && config.enabled && config.debugFiles.length){
                loadFirst = pluginObj.debugFiles.filter(d=>d.syncType == "sync");
                loadAfter = pluginObj.debugFiles.filter(d=>d.syncType == "async");
                // console.log("debug files:", loadFirst, loadAfter);
                await _APP.sharedPlugins.__util.loadFiles1(loadFirst, "sync");
                await _APP.sharedPlugins.__util.loadFiles1(loadAfter, "async");
            }
        },
    },
    GAME: {
        // Populate this via the appConfigs.js file.
        // Example: 
        // _APP.sharedPlugins.GAME.fileLoadFunc = async function(){
        //     await _APP.sharedPlugins.__util.fileLoadFunc1(_APP.configObj["gameConfig"], _APP.configObj["gameConfig"]);
        // };
    },
    INPUT_A:{
        files:[
            { f: `${_APP.basePath}/SHARED/INPUT_A/inputModeA_core.js`      , t:"js"  , syncType: "sync" },
            { f: `${_APP.basePath}/SHARED/INPUT_A/inputModeA_user.js`      , t:"js"  , syncType: "async" },
            { f: `${_APP.basePath}/SHARED/INPUT_A/inputModeA_mappings.js`  , t:"js"  , syncType: "async" },
            { f: `${_APP.basePath}/SHARED/INPUT_A/inputModeA_web.js`       , t:"js"  , syncType: "async" },
            { f: `${_APP.basePath}/SHARED/INPUT_A/inputModeA_web.css`      , t:"css" , syncType: "async" },
            { f: `${_APP.basePath}/SHARED/INPUT_A/inputModeA_customized.js`, t:"js"  , syncType: "async" },
        ],
        files2:[
            { f: `${_APP.basePath}/SHARED/INPUT_A/inputModeA_web.html`     , t:"html", type:"webConfig", syncType: "" },
        ],
        debugFiles:[
            // { f: `${_APP.basePath}/SHARED/INPUT_A/debug.js` , t:"js" , syncType: "async" },
            // { f: `${_APP.basePath}/SHARED/INPUT_A/debug.css`, t:"css", syncType: "async" },
        ],
        debugFiles2:[
        ],
        webWorker: ``,
        fileLoadFunc: async function(){
            await _APP.sharedPlugins.__util.fileLoadFunc1(_APP.configObj["inputConfig"], this);
        },
    },
    VIDEO_A:{
        files:[
            { f: `${_APP.basePath}/SHARED/VIDEO_A/videoModeA_core.js` , t:"js" , syncType: "sync" },
            { f: `${_APP.basePath}/SHARED/VIDEO_A/videoModeA_user.js` , t:"js" , syncType: "async" },
            { f: `${_APP.basePath}/SHARED/VIDEO_A/videoModeA.css`     , t:"css", syncType: "async" },
        ],
        files2:[
        ],
        debugFiles: [
            // { f: `${_APP.basePath}/SHARED/VIDEO_A/videoModeA_debug.js`, t:"js" , syncType: "async" },
            // { f: `${_APP.basePath}/SHARED/VIDEO_A/debug.js`  , t:"js" , syncType: "async" },
            // { f: `${_APP.basePath}/SHARED/VIDEO_A/debug.css` , t:"css" , syncType: "async" },
        ],
        debugFiles2: [
            { f:`${_APP.basePath}/SHARED/VIDEO_A/debug.html`, t:"html", syncType: "async", destId: "navView_gfx_debug" },
        ],
        webWorker: `${_APP.basePath}/SHARED/VIDEO_A/videoModeA_webworker.js`,
        fileLoadFunc: async function(){
            await _APP.sharedPlugins.__util.fileLoadFunc1(_APP.configObj["gfxConfig"], this);
        },
    },
    VIDEO_B:{
        files:[
            { f:`${_APP.basePath}/SHARED/VIDEO_B/gfx.js`  , t:"js" , syncType: "async" },
            { f:`${_APP.basePath}/SHARED/VIDEO_B/gfx.css` , t:"css", syncType: "async" },
        ],
        files2:[
        ],
        debugFiles: [
            { f:`${_APP.basePath}/SHARED/VIDEO_B/debug.js`  , t:"js" , syncType: "async" },
            { f:`${_APP.basePath}/SHARED/VIDEO_B/debug.css` , t:"css", syncType: "async" },
        ],
        debugFiles2: [
            { f:`${_APP.basePath}/SHARED/VIDEO_B/debug.html`, t:"html", destId: "navView_gfx_debug", syncType: "" },
        ],
        webWorker: `${_APP.basePath}/SHARED/VIDEO_B/video_webworker.js`,
        fileLoadFunc: async function(){
            await _APP.sharedPlugins.__util.fileLoadFunc1(_APP.configObj["gfxConfig"], this);
        },
    },
    SOUND_A:{
        files:[
            // { f:"${_APP.basePath}/SHARED/SOUND_A/soundModeA_core.js", t:"js" , syncType: "sync"  },
            // { f:"${_APP.basePath}/SHARED/SOUND_A/soundModeA_user.js", t:"js" , syncType: "async" },
            // { f:"${_APP.basePath}/SHARED/SOUND_A/soundModeA.css"    , t:"css", syncType: "async" },
        ],
        files2:[
        ],
        debugFiles: [
            // { f:"${_APP.basePath}/SHARED/SOUND_A/debug.js" , t:"js" , syncType: "async" },
            // { f:"${_APP.basePath}/SHARED/SOUND_A/debug.css", t:"css", syncType: "async" },
        ],
        debugFiles2: [
        ],
        webWorker: ``,
        fileLoadFunc: async function(){
            await _APP.sharedPlugins.__util.fileLoadFunc1(_APP.configObj["soundConfig"], this);
        },
    },
    SOUND_B:{
        files:[
            // { f:"${_APP.basePath}/SHARED/SOUND_B/soundModeB_core.js", t:"js" , syncType: "sync"  },
            // { f:"${_APP.basePath}/SHARED/SOUND_B/soundModeB_user.js", t:"js" , syncType: "async" },
            // { f:"${_APP.basePath}/SHARED/SOUND_B/soundModeB.css"    , t:"css", syncType: "async" },
        ],
        files2:[
        ],
        debugFiles: [
            // { f:"${_APP.basePath}/SHARED/SOUND_B/debug.js" , t:"js" , syncType: "async" },
            // { f:"${_APP.basePath}/SHARED/SOUND_B/debug.css", t:"css", syncType: "async" },
        ],
        debugFiles2: [
        ],
        webWorker: ``,
        fileLoadFunc: async function(){
            await _APP.sharedPlugins.__util.fileLoadFunc1(_APP.configObj["soundConfig"], this);
        },
    },
};

_APP.utility = {
    // If debug is requested this function makes sure that it is allowed.
    debugAuthCheck: function(params){
        let debugActive = ("debug" in params && params.debug === '1') ? true : false;
        if (debugActive && window.location.hostname !== 'localhost') {
            _APP.debugActive = false;
            _APP.debug2Active = false;

            // Change the 'debug' parameter in the URL to '0'.
            let url = new URL(window.location.href);
            let newParams = url.searchParams;
            newParams.set('debug', '0');
            url.search = newParams.toString();

            // Update the URL in the address bar without reloading the page.
            window.history.pushState({}, '', url.toString());

            console.error("Debug is not availble from this location:", window.location.hostname);
        }
        else{
            _APP.debugActive = debugActive;
            _APP.debug2Active = debugActive;
        }
    },

    // This is used to verify that strict mode is on. (only used manually for debugging.)
    isStrictMode() {
        try {
            // In strict mode, this will throw an error.
            // In non-strict mode, it will not.
            someUndeclaredVariable = 1; 
        } 
        catch (e) {
            // If an error is caught, it means strict mode is enabled.
            return true;
        }
        // If no error was caught, it means strict mode is not enabled.
        return false;
    },

    //
    ww_ImageDataAssetsGenerated: false, 
    generateCoreImageDataAssets: async function(){
        // DISABLED
        // _APP.game.gameLoop.loop_stop();
        // _APP.utility.await generateCoreImageDataAssets();
        // _APP.game.gameLoop.loop_start();

        if(this.ww_ImageDataAssetsGenerated){ console.log("Already done!"); return; }
        this.ww_ImageDataAssetsGenerated = true;
        
        let list = {
            "sprite_tiles1":{
                "mapObjs"  : {},
                "mapKeys"  : [],
                "mapsArray": [
                    // { "baseMapKey": "cursor1_f1", "mapKey": "_cursor1_f1",  "settings": { rotation: 0 }  },
                    // { "baseMapKey": "cursor1_f2", "mapKey": "_cursor1_f2",  "settings": { rotation: 0 }  },
                    // { "baseMapKey": "cursor1_f1", "mapKey": "_cursor1_f1",  "settings": { rotation: 90 }  },
                    // { "baseMapKey": "cursor1_f2", "mapKey": "_cursor1_f2",  "settings": { rotation: 90 }  },
                ]
            },
        };
        
        for(let tilesetKey in list){ 
            for(let rec of list[tilesetKey].mapsArray){ 
                rec.ts = tilesetKey;
                list[tilesetKey].mapKeys.push(rec.mapKey);
            }
        }
        list = null;
        await _WEBW_V.SEND("generateCoreImageDataAssets", {
            data:{ list:list },
            refs:[]
        }, true, false);
    },

    // Adds the specified file.
    addFile: function(rec, relativePath){
        return new Promise(async (res,rej)=>{
            // let timeItKey = `addFile_timer_${rec.f.split("/").pop()}`;
            let timeItKey = `addFile_timer_${rec.f}`;
            _APP.utility.timeIt(timeItKey, "start");

            // if(relativePath){ relativePath += "/"; }
            // if(relativePath){ relativePath = ""; }
            // console.log(`${relativePath}${rec.f}`, rec); 
            switch(rec.t){
                // Adds the JAVASCRIPT to the document.
                case "js": { 
                    // Create the script. 
                    let script = document.createElement('script');

                    // Set the name. 
                    script.setAttribute("name", rec.f); 

                    // Set defer.
                    script.defer=true;

                    // Onload.
                    script.onload = function () { 
                        _APP.utility.timeIt(timeItKey, "stop"); 
                        res(); 
                        script.onload = null; 
                    };
                    script.onerror = function (err) { 
                        console.log("addFile: js: FAILURE:", `${relativePath}${rec.f}`);
                        _APP.utility.timeIt(timeItKey, "stop");
                        rej(err); 
                        script.onload = null; 
                    };

                    // Append the element. 
                    document.head.appendChild(script);

                    // Set source. 
                    script.src = `${relativePath}${rec.f}`;
                    
                    break; 
                }

                // Returns the IMAGE object.
                case "image": {
                    // Get the data.
                    let img = new Image();
                    img.onload = function(){
                        _APP.utility.timeIt(timeItKey, "stop");
                        res(img);
                        img.onload = null;
                    };
                    img.onerror = function (err) { 
                        console.log("addFile: image: FAILURE:", `${relativePath}${rec.f}`);
                        _APP.utility.timeIt(timeItKey, "stop");
                        rej(err); 
                        img.onload = null; 
                    };
                    img.src = `${relativePath}${rec.f}`;

                    break; 
                }

                // Returns the parsed JSON.
                case "json": { 
                    // Get the data.
                    let data = await (await fetch(`${relativePath}${rec.f}`)).json();

                    _APP.utility.timeIt(timeItKey, "stop");
                    res(data);
                    break; 
                }
                
                // Returns the HTML text.
                case "html": { 
                    // Get the data.
                    let data = await (await fetch(`${relativePath}${rec.f}`)).text();

                    _APP.utility.timeIt(timeItKey, "stop");
                    res(data);
                    break; 
                }

                // Adds the CSS to the document.
                case "css": { 
                    // Create CSS link.
                    let link = document.createElement('link');

                    // Set type and rel. 
                    link.type   = 'text/css';
                    link.rel    = 'stylesheet';

                    // Set the name.
                    link.setAttribute("name", rec.f);

                    // Onload.
                    link.onload = function() { 
                        _APP.utility.timeIt(timeItKey, "stop");
                        res(); 
                        link.onload = null; 
                    };
                    link.onerror = function (err) { 
                        console.log("addFile: css: FAILURE:", `${relativePath}${rec.f}`, err);
                        _APP.utility.timeIt(timeItKey, "stop");
                        rej(err); link.onload = null; 
                    };
                    // Append the element. 
                    document.head.appendChild( link );

                    // Set source.
                    link.href   = `${relativePath}${rec.f}`;

                    break; 
                }

                // MISMATCHED TYPE.
                default  : { 
                    let msg = `Cannot load: ${rec.f}. Unknown file type: ${rec.t}`;
                    console.log(msg);
                    _APP.utility.timeIt(timeItKey, "stop");
                    rej(msg);
                    break; 
                }
            };
        });
    },

    // Error handler.
    errorHandler: {
        //
        DOM: {
            error_display:null,
            errorText_inner:null,
            error_display_close:null,
        },
        errorTriggered: false,

        handler: function(e){
            e.preventDefault();
            if(this.errorTriggered){ return false; }
            this.errorTriggered = true;
    
            if(e.type == "unhandledrejection"){
                try{
                    console.error( 
                        `ERRORHANDLER: ${e.type}` + "\n" +
                        `  message:`, e.reason.message + "\n" +
                        `  stack  :`, e.reason.stack + "\n" +
                        `  e      :`, e,
                        ``
                    ); 
                    console.log(e);
                } 
                catch(innerError){
                    console.error( 
                        `ERRORHANDLER: ${e.type}` + "\n" +
                        `  INNERERROR:`, innerError, + "\n" +
                        `  e:`, e
                    ); 
                }
            }
            else if(e.type == "uncaughtException"){
                console.error( `ERRORHANDLER: ${e.type}`, e.error ?? e.reason); 
            }
            else if(e.type == "uncaughtException"){
                console.error( `ERRORHANDLER: ${e.type}`, e.error ?? e.reason); 
            }
            else if(e.type == "error"){
                console.error( `ERRORHANDLER: ${e.type}`+ `\n  e.error: `, e.error ); 
            }
            else{
                console.error("UNKNOWN:", e);
            }
            
            // if(_APP.debugActive){
                // console.error( `ERRORHANDLER  ${e.type} (FULL EVENT):`, e.error ?? e.reason ); 
            // }
            
            try{
                // if(_APP.debugActive){
                //     let toggleGameLoop = document.getElementById("debug_test_toggleGameLoop");
                //     toggleGameLoop.classList.remove("debug_bgColor_on");
                //     toggleGameLoop.classList.add("debug_bgColor_off");
                //     toggleGameLoop.innerText = "LOOP: OFF";
                // }

                // Stop the game loop.
                _APP.game.gameLoop.loop_stop();

                // Display the error.
                let msg = e.message ?? e.reason.message ?? "UNKNOWN ERROR";
                this.displayError(msg);

                //
                console.error(`${_APP.configObj.gameConfig.appNameText}: STOPPED THE GAMELOOP DUE TO ERROR`);
                
                // Open the debugger.
                // if(_APP.debugActive){ setTimeout(()=>{debugger;}, 250); }
            }
            catch(innerError){
                console.log(e, innerError);
            }
    
            return false;
        },
        displayError: function(message){
            this.DOM.error_display.style.display = "";
            // this.DOM.errorText_inner.innerText = message + `${_APP.game.gs1 ? `GS1: ${_APP.game.gs1}, GS2: ${_APP.game.gs2}` : ``};
            if(_APP.debugActive){
                message += `${_APP.game.gs1 ? `\n\nGS1: ${_APP.game.gs1}\nGS2: ${_APP.game.gs2}` : `` }`;
            }
            this.DOM.errorText_inner.innerText = message;
        },
    
        // 
        closeError: function(){
            this.errorTriggered = false;
            this.DOM.error_display.style.display = "none";
        },
        
        init: function(){
            this.DOM.error_display   = document.getElementById("error_display");
            this.DOM.errorText_inner = document.getElementById("error_display_text_inner");
            this.DOM.error_display_close = document.getElementById("error_display_close");

            window.addEventListener('error'                      , (e)=>this.handler(e));
            window.addEventListener('unhandledrejection'         , (e)=>this.handler(e));
            window.addEventListener('DOMException'          , (e)=>this.handler(e)); // ?
            // window.addEventListener('uncaughtException'          , (e)=>this.handler(e)); // ?
            this.DOM.error_display_close.addEventListener('click', (e)=>this.closeError(e));
        },
    },

    // Get url params.
    getUrlParams: function(){
        const urlSearchParams = new URLSearchParams(window.location.search);
        const params          = Object.fromEntries(urlSearchParams.entries());
        return params;
    },

    timeItData: {},
    timeIt: function(key, func, value=0){
        // funcs: "start", "stop", "get", "reset", "set", "getBySimilarKey"

        // _APP.utility.timeIt("KEY_NAME", "start");
        // _APP.utility.timeIt("KEY_NAME", "stop");
        // _APP.utility.timeIt("KEY_NAME", "get");
        // _APP.utility.timeIt("KEY_NAME", "reset");
        // _APP.utility.timeIt("KEY_NAME", "set", 14);
        // _APP.utility.timeIt("", "getAll");
        // _APP.utility.timeIt("addFile_timer", "getBySimilarKey");
        
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
            this.timeItData[key] = { t:value, s:0, e:0 };
        }
        else if(func == "getAll"){
            let data = {};
            for(let key in this.timeItData){ data[key] = this.timeItData[key].t; }
            return data;
        }
        else if(func == "getBySimilarKey"){
            let keys = Object.keys(this.timeItData).filter(d=>d.indexOf(key) != -1);
            return keys;
        }
        else if(func == "reset"){
            this.timeItData[key] = { t:0, s:0, e:0 };
            return this.timeItData[key].t;
        }
    },

    determineGlobalsAfter: function(){
        // Step 2: Capture properties on the window object after your code has run
        let globalsAfter = new Set(Object.getOwnPropertyNames(window));

        // Step 3: Compare the two sets of properties
        let newGlobals = [...globalsAfter].filter(property => !_APP.globalsBefore.has(property));
        let newGlobals_filtered = newGlobals.filter(d=>{
            if(
                [
                    // Variables that I expect and need to be global:
                    "_WEBW_V",
                    "_GFX",
                    "INPUT",
                    "_INPUT",
                    "_DEBUG",
                    "_DEBUG2",

                    // Variables created by the dev tools console:
                    "dir",
                    "dirxml",
                    "profile",
                    "profileEnd",
                    "clear",
                    "table",
                    "keys",
                    "values",
                    "undebug",
                    "monitor",
                    "unmonitor",
                    "inspect",
                    "copy",
                    "queryObjects",
                    "$_",
                    "$0",
                    "$1",
                    "$2",
                    "$3",
                    "$4",
                    "getEventListeners",
                    "getAccessibleName",
                    "getAccessibleRole",
                    "monitorEvents",
                    "unmonitorEvents",
                    "$",
                    "$$",
                    "$x",
                    
                    // UNKNOWN.
                    "debug",
                ].indexOf(d) == -1){ 
                    return true; 
                }
        });


        // console.log("New global variables:", newGlobals);
        console.log("New global (filtered) variables:", newGlobals_filtered);

        globalsAfter        = null; 
        // delete globalsAfter;
        newGlobals          = null; 
        // delete newGlobals;
        newGlobals_filtered = null; 
        // delete newGlobals_filtered;
    },

    // Prevent certain keys from shifting the window view.
    preventScroll_elemIds: [],
    preventScroll : function(e){
        if( _APP.utility.preventScroll_elemIds.has(e.target.id)){
            // console.log( e.code, e.keyCode, "MATCHING ELEM:", "e.target:", e.target.id,  "list:", [..._APP.utility.preventScroll_elemIds], "event:", e, performance.now()  );
            
            switch(e.key){
                case "Space"      : { e.preventDefault(); break; } // Space bar.
                case "ArrowLeft"  : { e.preventDefault(); break; } // Left arrow
                case "ArrowUp"    : { e.preventDefault(); break; } // Up arrow
                case "ArrowRight" : { e.preventDefault(); break; } // Right arrow
                case "ArrowDown"  : { e.preventDefault(); break; } // Down arrow
            };
            
            // switch(e.keyCode){
            //     case 32 : { e.preventDefault(); break; } // Space bar.
            //     case 37 : { e.preventDefault(); break; } // Left arrow
            //     case 38 : { e.preventDefault(); break; } // Up arrow
            //     case 39 : { e.preventDefault(); break; } // Right arrow
            //     case 40 : { e.preventDefault(); break; } // Down arrow
            // };
        }
    },

    // A queue of functions intended to be run once each and sequentially.
    // NOTES: 
    // These scheduled functions are run via _APP.game.gameLoop.endOfLoopTasks at the end of a frame.
    // Intended for the scheduling of debug tasks but can also be for general use for running functions at the end of a frame.
    // runNext: The next func does not wait for the prev func to finish. Await is NOT used by runNext.
    funcQueue: {
        // An array of scheduled functions.
        funcs: [], 

        // Adds a new function to the funcQueue. (funcs)
        add: function(funcObj){
            // EXAMPLE USAGE:
            // _APP.utility.funcQueue.add({
            //     name: "functionName", // OPTIONAL. Not actually used.
            //     args: [arg1, arg2, arg3],
            //     bind: this,
            //     func: function(arg1, arg2, arg3){
            //         console.log("You passed these args:", arg1, arg2, arg3);
            //     }
            // });

            // Make sure that a function was specified.
            if(!funcObj.func){ 
                console.error("ERROR: funcQueue:add: A function was not specified.", `name: '${name}'`);
                return; 
            }

            // Add the function.
            let newEntry = {
                name: funcObj.name ?? "NOT_SPECIFIED",
                func: funcObj.func,
                args: funcObj.args ?? [],
                bind: funcObj.bind
            };
            this.funcs.push(newEntry);

            // return newEntry;
        },
        
        // Shifts off the first function from the funcs array and runs it.
        runNext: function(){
            // EXAMPLE USAGE:
            // _APP.utility.funcQueue.runNext();

            // Don't run if there are not any queued functions.
            if(!this.funcs.length){ return true; }

            // Remove the first funcObj.
            let funcObj = this.funcs.shift();

            // Run the funcObj using the binding provided.
            // console.log("RUNNING:", funcObj.name);
            funcObj.func.bind(funcObj.bind)(...funcObj.args);

            // The funcObj is no longer part of this.funcs.
            return false;
        },

        // Clears the funcs array.
        clearQueue: function(){
            // EXAMPLE USAGE:
            // _APP.utility.funcQueue.clearQueue();

            // Clear the queued functions.
            this.funcs = [];
        },
    },
};

// For loading customized wrappers for plug-ins.
_APP.loader = {
    loadFiles: async function(){
        return new Promise(async (resolve,reject)=>{
            // URL params can affect app settings.
            let params = _APP.utility.getUrlParams();
            if( ("debug" in params && params.debug === '1') ? true : false ) { 
                // Make sure that debug can be activated.
                _APP.utility.debugAuthCheck(params); 
            }

            // Load files.
            await this.loadFilesFromConfig();

            resolve();
        });
    },

    loadFilesFromConfig: async function(){
        let loadConfigFiles = async function(key, showMessage=false){
            if(showMessage){ console.log(`FILES: ${key}: loading: ${_APP.configObj[key].files.length} files`); }
            if(_APP.configObj[key] && _APP.configObj[key].enabled && _APP.configObj[key].files.length){
                for(let rec of _APP.configObj[key].files){ 
                    let data = await _APP.utility.addFile( rec, _APP.relPath); 
                    if(rec.t == "html" && rec.destId){ console.log(rec); document.getElementById(rec.destId).innerHTML = data;}
                }
            }

            if(_APP.configObj[key] && _APP.configObj[key].enabled && _APP.debugActive && _APP.configObj[key].debug){
                if(showMessage){ console.log(`  DEBUG: ${key}: loading: ${_APP.configObj[key].files.length} files`); }
                if(_APP.configObj[key].debugFiles.length){
                    for(let rec of _APP.configObj[key].debugFiles){ 
                        let data = await _APP.utility.addFile( rec, _APP.relPath); 
                        if(rec.t == "html" && rec.destId){ document.getElementById(rec.destId).innerHTML = data;}
                    }
                }
            }
        };

        // Load the files from these configs.
        let proms = [];
        for(let key of _APP.configObj.configKeys){
            // Skip configs that are not set to enabled.
            if(!_APP.configObj[key].enabled){ continue; }

            // Faster: Load sequentially and/or in parallel based on each file's syncType setting.
            if(_APP.configObj[key].useSharedPluginLoader){
                // console.log(`'${key}' is using: useSharedPluginLoader`);
                proms.push(
                    _APP.sharedPlugins[ _APP.configObj[key].useSharedPluginLoader ].fileLoadFunc()
                );
                // await _APP.sharedPlugins[ _APP.configObj[key].useSharedPluginLoader ].fileLoadFunc();
            }
            
            // Slower but more simple: Load sequentially.
            else{
                if(_APP.debugActive){
                    console.log(`'${key}' is NOT using: useSharedPluginLoader`);
                }
                await loadConfigFiles(key  , false);
                // await loadConfigFiles(key  , true);
            }
        }
        await Promise.all(proms);
        // await loadConfigFiles("gfxConfig"  , false);
        // await loadConfigFiles("inputConfig", false);
        // await loadConfigFiles("soundConfig", false);
        // await loadConfigFiles("gameConfig" , false);
    },

    inits: async function(){
        // INITS

        // Input init.
        if(_APP.configObj.inputConfig && _APP.configObj.inputConfig.enabled){
            if(_INPUT.customized && _INPUT.customized.init){
                await _INPUT.customized.init(_APP.configObj.inputConfig);
            }
        }

        // Sound init.
        if(_APP.configObj.soundConfig && _APP.configObj.soundConfig.enabled){
            // console.log("INIT: sound (user interaction detection test)");
            _SND.canPlayAudio = await _SND.detectUserInteraction();
            if(!_SND.canPlayAudio){
                // Show the user interaction needed message.
                document.getElementById("audio_userInputNeeded_container").style.display = "block";

                // A document.body event listener will be added by _SND.init.
                // Clicking the body will allow audio to load and will dismiss the message.
                // TODO: The game should pause too while waiting for the user to interact with the page.
            }

            // console.log("INIT: sound");
            if(_SND.init){
                await _SND.init(_APP, _APP.configObj.soundConfig);
            }
        }

        // Graphics init.
        if(_APP.configObj.gfxConfig && _APP.configObj.gfxConfig.enabled){
            if(_GFX.init){
                await _GFX.init(); // Graphics (main thread)
            }
        }

        // Gameloop init.
        if(_APP.configObj.gameConfig && _APP.configObj.gameConfig.enabled){
            // Game init. 
            if(_APP.game && _APP.game.init){
                await _APP.game.init();
            }

            // Game loop init.
            if(_APP.game && _APP.game.gameLoop && _APP.game.gameLoop.init){
                await _APP.game.gameLoop.init();
            }
        }

        // DEBUG inits.
        if(_APP.debugActive){
            if(_APP.configObj.inputConfig && _APP.configObj.inputConfig.enabled && _APP.configObj.inputConfig.debug){
                if(_INPUT && _INPUT.DEBUG.init){ await _INPUT.DEBUG.init(); }
            }
            if(_APP.configObj.soundConfig && _APP.configObj.soundConfig.enabled && _APP.configObj.soundConfig.debug){
                if(_SND.DEBUG && _SND.DEBUG.init){ await _SND.DEBUG.init(); }
            }
            if(_APP.configObj.gfxConfig   && _APP.configObj.gfxConfig  .enabled && _APP.configObj.gfxConfig  .debug){
                if(_GFX.DEBUG && _GFX.DEBUG.init){ await _GFX.DEBUG.init(); }
            }
            if(_APP.configObj.gameConfig  && _APP.configObj.gameConfig .enabled && _APP.configObj.gameConfig .debug){
                if(_APP.game && _APP.game.DEBUG){ await _APP.game.DEBUG.init();  }
            }
        }

        // POST INITS.
        if(_APP.configObj.inputConfig && _APP.configObj.inputConfig.enabled && ('postInit' in _INPUT))   { _INPUT.postInit();    }
        if(_APP.configObj.soundConfig && _APP.configObj.soundConfig.enabled && ('postInit' in _SND))     { _SND.postInit();      }
        if(_APP.configObj.gfxConfig   && _APP.configObj.gfxConfig  .enabled && ('postInit' in _GFX))     { _GFX.postInit();      }
        if(_APP.configObj.gameConfig  && _APP.configObj.gameConfig .enabled && _APP && _APP.game && ('postInit' in _APP.game)){ _APP.game.postInit(); }

        // Init the main nav bar. (Any additional tabs/views should have already been added to the DOM object in _APP.navBarMAIN.DOM.
        _APP.navBarMAIN.init(true);

        // Main nav bar: close on click.
        let menuButton = document.getElementById("navTab_MENUBUTTON");
        menuButton.addEventListener("click", ()=>{
            // Close the menu if it is open.
            if(menuButton.classList.contains("open")) { _APP.navBarMAIN.hideAll(); }

            // It is already closed. Reopen the menu.
            else{
                // Use the lastActiveView if it is available.
                if(_APP.navBarMAIN.lastActiveView){ _APP.navBarMAIN.showOne(_APP.navBarMAIN.lastActiveView); }
                
                // Use the first tab in the key list.
                else{
                    let firstKey = Object.keys(_APP.navBarMAIN.DOM)[0];
                    if(firstKey){ _APP.navBarMAIN.showOne( firstKey ); }
                    else{ console.log("menuButton: There are no tabs that can be opened."); }
                }
            }
        });

        // Prevent certain keys from shifting the window view.
        this.preventScroll();
        
        // Handle changing to and from full screen.
        this.setupFullScreen();
    },

    // Prevent certain keys from shifting the window view.
    preventScroll: function(){
        // Get the element ids, starting with the outputDiv.
        _APP.utility.preventScroll_elemIds = new Set([_APP.configObj.gfxConfig.outputDiv]);

        // Add elements from inputConfig.
        if(_APP.configObj.inputConfig && _APP.configObj.inputConfig.enabled){
            let ids = [..._APP.configObj.inputConfig.listeningElems.map(d=>d.id)];
            ids.forEach(d=>_APP.utility.preventScroll_elemIds.add(d));
        }

        // Add onkeydown and onkeyup listeners.
        window.onkeydown = _APP.utility.preventScroll;
        window.onkeyup   = _APP.utility.preventScroll;
    },

    // Handle changing to and from full screen.
    setupFullScreen: function(){
        let allowFullScreen = false;
        let listeningElem  = null;
        let fullScreenElem = null;

        // Check fullScreenConfig.
        if(_APP.configObj.fullScreenConfig && _APP.configObj.fullScreenConfig.listenOnId && _APP.configObj.fullScreenConfig.idToMakeFullscreen){ 
            allowFullScreen = true; 
            listeningElem  = _APP.configObj.fullScreenConfig.listenOnId;
            fullScreenElem = _APP.configObj.fullScreenConfig.idToMakeFullscreen;
        }

        // Check within gfxConfig.
        else if(_APP.configObj.gfxConfig.outputDiv && _APP.configObj.gfxConfig.fullScreenElemId){ 
            allowFullScreen = true; 
            listeningElem  = _APP.configObj.gfxConfig.outputDiv;
            fullScreenElem = _APP.configObj.gfxConfig.fullScreenElemId;
        }

        // Do we have ids to configure fullscreen with?
        if(allowFullScreen){
            // Get the elements by id.
            listeningElem  = document.getElementById(listeningElem);
            fullScreenElem = document.getElementById(fullScreenElem);

            // Add listener for dblclick to request and to exit fullscreen.
            listeningElem.addEventListener('dblclick', function() {
                if (!document.fullscreenElement) {
                    const requestFullscreen = 
                        fullScreenElem.requestFullscreen       || // Standard
                        fullScreenElem.mozRequestFullScreen    || // Firefox 
                        fullScreenElem.webkitRequestFullscreen || // Chrome, Safari and Opera
                        fullScreenElem.msRequestFullscreen;       // IE/Edge

                    if (requestFullscreen) { requestFullscreen.call(fullScreenElem); }
                    else{ console.log("WARNING: Entering full screen mode is unavailable."); }
                }
                else{
                    const exitFullscreen = 
                        document.exitFullscreen       || // Standard
                        document.mozCancelFullScreen  || // Firefox 
                        document.webkitExitFullscreen || // Chrome, Safari and Opera
                        document.msExitFullscreen;       // IE/Edge
                        
                    if (exitFullscreen) { exitFullscreen.call(document); }
                    else{ console.log("WARNING: Leaving full screen mode is unavailable."); }
                }
            });
        }
    },
};

_APP.navBarMAIN = {
    // Holds the DOM for the nav buttons and nav views.
    DOM: {
        // info   : { tab: "navTab_info"   , view: "navView_info"   , extraClasses: { cont: ["infoWide"]  }, onShow: null, onHide: null },
        // chat   : { tab: "navTab_chat"   , view: "navView_chat"   , extraClasses: { cont: ["chatWide"]  }, onShow: null, onHide: null },
        // debug  : { tab: "navTab_debug"  , view: "navView_debug"  , extraClasses: { cont: ["debugWide"] }, onShow: null, onHide: null },
    },
    inited: false,
    tabsContainer : "mainNavMenu_ul",
    viewsContainer: "mainNavMenuViews",
    lastActiveView : "",
    activeView: "",

    // Check DOM/key validity.
    checkValidity: function(key){
        // Check that the nav key is valid.
        if(! (key in this.DOM)){
            console.log("WARN: Invalid nav key.", key);
            return false;
        }
        // Check that the viewsContainer DOM is valid.
        else if(typeof this.viewsContainer == "string"){
            console.log("WARN: Unprocessed DOM for: viewsContainer. Key:", key, this.viewsContainer);
            return false;
        }
        // Check that the tab DOM is valid.
        else if(typeof this.DOM[key].tab == "string"){
            console.log("WARN: Unprocessed DOM for: tab. Key:", key, this.DOM[key].tab);
            return false;
        }
        // Check that the view DOM is valid.
        else if(typeof this.DOM[key].view == "string"){
            console.log("WARN: Unprocessed DOM for: view. Key:", key, this.DOM[key].view);
            return false;
        }

        // Validation was successful.
        return true;
    },

    // Deactivates all nav buttons and views.
    hideAll: function(showOneIsNext=false) {
        // Deactivate all tabs and views.
        for (let key in this.DOM) {
            if(!this.checkValidity(key)){
                console.log("WARN: Failed check: checkValidity on key:", key);
                continue;
            }

            // Do not hide a key that is already not active.
            if(!this.DOM[key].tab.classList.contains("active")){ continue; }

            // Remove the active class from the viewsContainer.
            this.viewsContainer.classList.remove("active");
            
            // Remove extraClasses for the viewsContainer.
            if(this.DOM[key].extraClasses.cont && this.DOM[key].extraClasses.cont.length){
                this.viewsContainer.classList.remove(
                    ...(this.DOM[key].extraClasses.cont.filter(d=>d))
                );
            }
            
            // Run the onHide function if it exists.
            if( this.DOM[key].onHide && this.DOM[key].tab.classList.contains("active") ){ this.DOM[key].onHide(this); }

            // Remove the active class from the tab.
            this.DOM[key].tab.classList.remove("active");
            
            // Remove the active class from the view.
            this.DOM[key].view.classList.remove("active");
        }
        this.activeView = "";

        // Show menu button as closed.
        if(!showOneIsNext && this.adjustMenuButton){
            if(this.mainMenuButon.classList.contains("open")) { this.mainMenuButon.classList.remove("open", "change"); }
        }
    },

    // Activates one nav buttons and view. 
    showOne: function(key){
        if(!this.checkValidity(key)){
            console.log("WARN: Failed check: checkValidity on key:", key);
            return;
        }

        // Do not show a key that is already active.
        if(this.DOM[key].tab.classList.contains("active")){ return; }

        // Deactivate all views and nav buttons.
        this.lastActiveView = key;
        this.hideAll(true);

        // Add the active class to the viewsContainer.
        this.viewsContainer.classList.add("active");
            
        // Add the extraClasses for the viewsContainer.
        if(this.DOM[key].extraClasses.cont && this.DOM[key].extraClasses.cont.length){
            this.viewsContainer.classList.add(
                ...(this.DOM[key].extraClasses.cont.filter(d=>d))
            );
        }

        // Run the onShow function if it exists.
        if( this.DOM[key].onShow && !this.DOM[key].tab.classList.contains("active") ){ this.DOM[key].onShow(this); }

        // Add the active class for the tab.
        this.DOM[key].tab .classList.add("active");

        // Add the active class for the view.
        this.DOM[key].view.classList.add("active");

        // Show menu button as open.
        if(this.adjustMenuButton){
            if(!this.mainMenuButon.classList.contains("open")) { this.mainMenuButon.classList.add("open", "change"); }
        }

        this.activeView = key;
    },

    // Init for the nav.
    init: function(adjustMenuButton=false){
        // Populate the DOM cache for the viewsContainer. (If it has not already been processed.)
        if(typeof this.viewsContainer == "string"){
            this.viewsContainer  = document.getElementById(this.viewsContainer) ;
        }

        // Populate the DOM cache for the tabs and views that have not been processed.
        for (let key in this.DOM) {
            // Skip DOM that has already been processed.
            if(typeof this.DOM[key].tab != "string" || typeof this.DOM[key].view != "string"){ 
                // console.log("Already processed:", this.DOM[key].tab, this.DOM[key].view); 
                continue; 
            }

            // Get the DOM elements.
            let tab  = document.getElementById(this.DOM[key].tab) ;
            let view = document.getElementById(this.DOM[key].view);
            
            // If the tab and the view exist then set the DOM values and add the event listener to the tab.
            if(tab && view){
                // Save the DOM values for the tab and the view.
                this.DOM[key].tab  = tab;
                this.DOM[key].view = view;
                
                // Add event listener to the tab.
                this.DOM[key].tab.addEventListener("click", () => { this.showOne(key); }, false);
            }
        }

        // Main nav bar: close on click.
        this.adjustMenuButton = adjustMenuButton;
        if(adjustMenuButton){
            this.mainMenuButon = document.getElementById("navTab_MENUBUTTON");
        }

        // Set the inited flag.
        this.inited = true;
    },
};

_APP.init_standAlone = async function(){
    _APP.globalsBefore = new Set(Object.getOwnPropertyNames(window)); //  DEBUG
    return new Promise(async (resolve,reject)=>{
        // Set the relPath for the _APP.
        _APP.relPath = ``;

        _APP.utility.timeIt("GAMELOADER_preInit", "set", performance.now());

        // Get the appConfigs.js file. (Populates _APP.configObj.)
        _APP.utility.timeIt("GAMELOADER_getAppConfigs", "start");
        await _APP.utility.addFile( { f:"appConfigs.js"  , t:"js"  }, _APP.relPath); 
        _APP.utility.timeIt("GAMELOADER_getAppConfigs", "stop");

        // Show/hide.
        let loading = document.getElementById("loading");
        let wrapper = document.getElementById("wrapper");
        wrapper.style.display = "none";

        // Load the files specified by the _APP.configObj.
        _APP.utility.timeIt("GAMELOADER_loadFiles", "start");
        await _APP.loader.loadFiles();
        _APP.utility.timeIt("GAMELOADER_loadFiles", "stop");
        
        // Init the error handler.
        _APP.utility.errorHandler.init();
        
        // Inits for loaded files.
        _APP.utility.timeIt("GAMELOADER_inits", "start");
        await _APP.loader.inits();
        _APP.utility.timeIt("GAMELOADER_inits", "stop");

        let navTab_gameName = document.getElementById("navTab_gameName");
        if(navTab_gameName && _APP.configObj.gameConfig && _APP.configObj.gameConfig.appNameText){
            navTab_gameName.innerText = _APP.configObj.gameConfig.appNameText;
        }
        document.title = _APP.configObj.gameConfig.appNameText;

        loading.style.display = "none";
        wrapper.style.display = "";
        if(_APP.game && _APP.game.gameLoop && _APP.game.gameLoop.loop_start){
            _APP.game.gameLoop.loop_start(); 
        }
        // if(_APP.debugActive && ('_DEBUG' in window) && ('toggleButtons1' in _DEBUG)){_DEBUG.toggleButtons1.setCurrentStates(); }

        // _APP.utility.timeIt("GAMELOADER_init_TOTAL", "set", performance.now());
        resolve();
    });
};

(
    function() {
        let handler = async () => {
            // Remove this listener.
            window.removeEventListener('load', handler);

            // let loadTime = performance.now(); 
            await _APP.init_standAlone(); 
            // loadTime = performance.now() - loadTime; 
            // console.log(`LOADED: '${_APP.configObj.gameConfig.appNameText}' (${loadTime.toFixed(2)}ms)`);
            _APP.utility.timeIt("GAMELOADER_init_TOTAL", "set", performance.now());
            console.log(`LOADED: '${_APP.configObj.gameConfig.appNameText}' (${_APP.utility.timeIt("GAMELOADER_init_TOTAL", "get").toFixed(1)} ms)`);
        };
        window.addEventListener('load', handler);
    }
)();