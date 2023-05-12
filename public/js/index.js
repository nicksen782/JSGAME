// Holds the loaded app.
let _APP = undefined;

// Holds the loaded _GFX plugin.
// let _GFX = undefined;

// Holds the loaded _SND plugin.
// let _SND = undefined;

// Holds the loaded _INPUT plugin.
// let _INPUT = {};

// Holds the any JSGAME WebWorker code.
let _WEBW = {};

// Holds JSGAME.
let _JSG = {
    appStart_timestamp: undefined,
    
    // Contains config settings for "modules". (POPULATED DURING INIT.)
    configObjs : {},

    DOM: {},

    // Stores apps.json.
    apps: {},

    // Stores the loaded appKey
    loadedAppKey: "",

    // Adds the specified file.
    addFile: function(rec, relativePath){
        return new Promise(async (res,rej)=>{
            switch(rec.t){
                case "js": { 
                    // Create the script. 
                    let script = document.createElement('script');

                    // Set the name. 
                    if(rec.n){ script.setAttribute("name", rec.n); }
                    else{ script.setAttribute("name", rec.f); }

                    // Set defer.
                    script.defer=true;

                    // Onload.
                    script.onload = function () { res(); script.onload = null; };
                    script.onerror = function (err) { 
                        console.log("js: FAILURE:", `${relativePath}/${rec.f}`);
                        rej(err); script.onload = null; 
                    };

                    // Append the element. 
                    document.head.appendChild(script);

                    // Set source. 
                    script.src = `${relativePath}/${rec.f}`;
                    
                    break; 
                }

                case "image": {
                    // Get the data.
                    let img = new Image();
                    img.onload = function(){
                        // Determine the data name. 
                        let dataName;
                        if(rec.n){ dataName = rec.n; }
                        else{ dataName = rec.f }

                        // Create the files key in the game if it doesn't exist. 
                        if(!_APP.files){ _APP.files = {"_WARNING":"_WARNING"}};
                        
                        // Save the data to the files object. 
                        _APP.files[dataName] = img;
                        
                        res();
                        img.onload = null;
                    };
                    img.onerror = function (err) { 
                        console.log("image: FAILURE:", `${relativePath}/${rec.f}`);
                        rej(err); img.onload = null; 
                    };
                    img.src = `${relativePath}/${rec.f}`;

                    break; 
                }

                case "json": { 
                    // Get the data.
                    let data = await _JSG.net.http.send(`${relativePath}/${rec.f}`, { type:"json", method:"GET" }, 5000);
                    if(data === false){
                        console.log("json: FAILURE:", `${relativePath}/${rec.f}`);
                        rej(data); return;
                    }

                    // Determine the data name. 
                    let dataName;
                    if(rec.n){ dataName = rec.n; }
                    else{ dataName = rec.f }

                    // Create the files key in the game if it doesn't exist. 
                    if(!_APP.files){ _APP.files = {"_WARNING":"_WARNING"}};

                    // Save the data to the files object. 
                    _APP.files[dataName] = data;

                    res();
                    break; 
                }
                
                case "html": { 
                    // Get the data.
                    let data = await _JSG.net.http.send(`${relativePath}/${rec.f}`, { type:"text", method:"GET" }, 5000);
                    if(data === false){
                        console.log("html: FAILURE:", `${relativePath}/${rec.f}`);
                        rej(data); return;
                    }

                    // Determine the data name. 
                    let dataName;
                    if(rec.n){ dataName = rec.n; }
                    else{ dataName = rec.f }

                    // Create the files key in the game if it doesn't exist. 
                    if(!_APP.files){ _APP.files = {"_WARNING":"_WARNING"}};

                    // Save the data to the files object. 
                    _APP.files[dataName] = data;

                    res();
                    break; 
                }

                case "css": { 
                    // Create CSS link.
                    let link = document.createElement('link');

                    // Set type and rel. 
                    link.type   = 'text/css';
                    link.rel    = 'stylesheet';

                    // Set the name.
                    if(rec.n){ link.setAttribute("name", rec.n); }
                    else{ link.setAttribute("name", rec.f); }

                    // Onload.
                    link.onload = function() { res(); link.onload = null; };
                    link.onerror = function (err) { 
                        console.log("css: FAILURE:", `${relativePath}/${rec.f}`, err);
                        rej(err); link.onload = null; 
                    };
                    // Append the element. 
                    document.head.appendChild( link );

                    // Set source.
                    link.href   = `${relativePath}/${rec.f}`;

                    break; 
                }

                default  : { 
                    let msg = `Cannot load: ${rec.f}. Unknown file type: ${rec.t}`;
                    console.log(msg);
                    rej(msg);
                    break; 
                }
            };
        });
    },

    // Loads the files specified by the appRec.
    loadFiles: async function(appRec){
        return new Promise(async (resolve,reject)=>{
            if(!appRec){ console.log("ERROR: loadFiles: Invalid appRec:", appRec); return; }

            // Get the app config.
            _JSG.loadedConfig = await _JSG.net.http.send(`${appRec.configFile}`, { type:"json", method:"GET" }, 5000);

            // Set and save the loadedAppKey.
            _JSG.loadedAppKey = appRec.appKey;

            // Create the app object if it doesn't exist. 
            if(!_APP){ _APP = {}; }

            // Stop here if the app is already loaded.
            if(_APP.filesLoaded){ console.log("Already loaded!"); return; }

            // Go through each file. 
            for(let i=0; i<_JSG.loadedConfig.files.length; i+=1){
                // Skip the file if it has it's load flag set to false.
                if(_JSG.loadedConfig.files[i].l === false){ 
                    // console.log("skip", _JSG.loadedConfig.files[i]); 
                    continue;
                }
                
                // Determine what type of file this is and load it.
                try{
                    await this.addFile(_JSG.loadedConfig.files[i], appRec.appPath);
                }
                catch(e){
                    let msg1 = `ERROR: Loading file: ${_JSG.loadedConfig.files[i].f}`;
                    let msg2 = "ABORTING APP LOAD.";
                    _JSG.loadingDiv.changeStatus("error");
                    _JSG.loadingDiv.addMessage(msg1);
                    _JSG.loadingDiv.addMessage(msg2);
                    console.log(msg1);
                    console.log(msg2);
                    reject(e); return; 
                }
            }
    
            _APP.filesLoaded = true;
            resolve();
        });
    },
    
    // Loads the selected app.
    loadApp: async function(rec){
        return new Promise(async (resolve,reject)=>{
            // Display the selected app in the select menu.
            let select = this.DOM["appSelectSelect"];
            select.value = rec.appKey;

            
            // Load the app's files. 
            _JSG.loadingDiv.addMessage(`Loading files for: ${rec.appKey}`);
            await _JSG.loadFiles(rec); 
            
            // Display the author data for the app.
            _JSG.updateAuthorData(rec);

            // Pre-load any specified JSGAME shared plug-ins.
            if(_JSG.loadedConfig.meta.jsgame_shared_plugins){
                let plugins = _JSG.loadedConfig.meta.jsgame_shared_plugins;
                for(let i=0; i<plugins.length; i+=1){
                    try{
                        // console.log("LOADING: JSGAME plugin:", plugins[i].n);
                        await this.addFile(plugins[i], ".");
                        console.log("LOADED: JSGAME plugin:", plugins[i].n);
                        _JSG.loadingDiv.addMessage(`LOADED: JSGAME plugin: ${plugins[i].n}`);
                    }
                    catch(e){
                        let msg1 = `ERROR: Loading JSGAME plugin: ${plugins[i].n}`;
                        let msg2 = "ABORTING APP LOAD.";
                        _JSG.loadingDiv.changeStatus("error");
                        _JSG.loadingDiv.addMessage(msg1);
                        _JSG.loadingDiv.addMessage(msg2);
                        console.log(msg1);
                        console.log(msg2);
                        reject(); return; 
                    }
                }
            }

            if(_APP.init){ 
                // Do the login check. 
                // console.log("running loginCheck after loading:", rec.appKey);
                let msg3 = "Running loginCheck...";
                _JSG.loadingDiv.addMessageChangeStatus(msg3, "loading");
                console.log(msg3);
                await _JSG.lobby.login.loginCheck();
                
                let msg4 = `READY! (Total load time: ${(performance.now() - _JSG.appStart_timestamp).toFixed(2)}ms)`;
                _JSG.loadingDiv.addMessageChangeStatus(msg4, "loaded");
                _JSG.loadingDiv.addMessageChangeStatus("", "loaded");
                console.log(msg4);
                console.log("");

                // Run the app's init.
                let msg1 = `_APP INIT   : ${rec.appKey}`;
                _JSG.loadingDiv.addMessage(msg1);
                console.log(msg1);
                await _APP.init(); 
                let msg2 = `_APP LOADED : ${rec.appKey}`;
                _JSG.loadingDiv.addMessage(msg2);
                console.log(msg2);
                
                // DEBUG:
                try{
                    console.log("");
                    console.log("JSGAME DEBUG: VARS:");
                    if(typeof _JSG   !== "undefined"){ console.log("  _JSG  :", _JSG  ); } else { console.log("  _JSG  :", "NOT LOADED"); }
                    if(typeof _APP   !== "undefined"){ console.log("  _APP  :", _APP  ); } else { console.log("  _APP  :", "NOT LOADED"); }
                    if(typeof _GFX   !== "undefined"){ console.log("  _GFX  :", _GFX  ); } else { console.log("  _GFX  :", "NOT LOADED"); }
                    if(typeof _SND   !== "undefined"){ console.log("  _SND  :", _SND  ); } else { console.log("  _SND  :", "NOT LOADED"); }
                    if(typeof _INPUT !== "undefined"){ console.log("  _INPUT:", _INPUT); } else { console.log("  _INPUT:", "NOT LOADED"); }
                    console.log("");
                }
                catch(e){
                    console.log("Error showing debug vars.", e);
                }

                // If the app has a separate start function then run it here.
                if(_APP.start){ await _APP.start(); }

                // Set visabilities.
                await new Promise((res,rej)=>{ setTimeout(()=>res(), 500); });
                this.shared.setVisibility(this.DOM["jsgame_menu_toggleLoading"], false, false);
                
                // Show the app.
                this.shared.setVisibility(this.DOM["jsgame_menu_toggleApp"], true, false);

                // Don't show the lobby if the appConfig says not to.
                if(!_JSG.loadedConfig.meta.hideLobby){
                    this.shared.setVisibility(this.DOM["jsgame_menu_toggleLobby"], true, false);
                }
                
                resolve();
            }
            else{
                let msg1 = `ERROR: Cannot load: ${rec.appKey}. Missing init function.`;
                _JSG.loadingDiv.changeStatus("error");
                _JSG.loadingDiv.addMessage(msg1);
                console.log(msg1);

                // Set visabilities.
                this.shared.setVisibility(this.DOM["jsgame_menu_toggleLoading"], true, false);
                // this.shared.setVisibility(this.DOM["jsgame_menu_toggleApp"], false, false);
                // this.shared.setVisibility(this.DOM["jsgame_menu_toggleLobby"], false, false);

                // Do the login check. 
                // console.log("running loginCheck after loading:", rec.appKey);
                // await _JSG.lobby.login.loginCheck();

                resolve();
            }
        });
    },
    
    // Generates the app select menu.
    loadAppMenus: function(){
        return new Promise((resolve,reject)=>{
            if(!Object.keys(_JSG.apps).length){ 
                let msg1 = "ERROR: loadAppMenus: No entries in apps.json.";
                _JSG.loadingDiv.changeStatus("error");
                _JSG.loadingDiv.addMessage(msg1);
                console.log(msg1); 
                return; 
            }
            
            // Setup the button.
            // let button = this.DOM["appSelectReload"];
            // button.innerText = "Reload";
            // button.addEventListener("click", (ev)=>{ select.dispatchEvent(new Event("change")) }, false);
            
            //. Set up the select menu. 
            let select = this.DOM["appSelectSelect"];
            let option = document.createElement("option");
            // option.value = "";
            // option.innerText = "... Choose an application";
            // select.append(option);
            let frag1 = document.createDocumentFragment();
            for(let key in _JSG.apps){
                let rec = _JSG.apps[key];
                let option = document.createElement("option");
                option.value = rec.appKey;
                option.innerText = "APP: " + rec.displayName;
                option.setAttribute("appKey", rec.appKey);
                option.title = rec.desc;
                frag1.append(option);
            }
            select.append(frag1);
            select.addEventListener("change", async (ev) => { 
                let thisOption = select.options[select.selectedIndex];
                let appKey = thisOption.getAttribute("appKey");
                
                // Reload with the game selected.
                if(appKey){ window.location.href= `?appKey=${appKey}`; }
                
                // Reload with no game selected.
                else{ window.location.href = `?`; }
            }, false);
            resolve();
        });
    },
    
    // Updates the displayed author/app data.
    updateAuthorData: function(rec){
        rec = rec.repo;
        let authorDiv2 = this.DOM["authorDiv2"]; 

        let author_title  = this.DOM["author2_title"];  author_title .innerHTML = "";
        let author_C      = this.DOM["author2_C"];      author_C     .innerHTML = "";
        let author_year   = this.DOM["author2_year"];   author_year  .innerHTML = "";
        let author_name   = this.DOM["author2_name"];   author_name  .innerHTML = "";
        let author_handle = this.DOM["author2_handle"]; author_handle.innerHTML = "";
        // let repoType      = this.DOM["repo2Type"];      repoType     .innerHTML = "";
        let repoLink      = this.DOM["repo2Link"];      repoLink     .innerHTML = "";

        if(!rec){ authorDiv2.classList.add("hide"); return;}
        if(rec.author_title ){ author_title .innerText = rec["author_title"] + ": "; }
        if(rec.author_C     ){ author_C     .innerText = "(C)"; }
        if(rec.author_year  ){ author_year  .innerText = rec["author_year"]        ; }
        if(rec.author_name  ){ author_name  .innerText = rec["author_name"]  ; }
        if(rec.author_handle){ author_handle.innerText = rec["author_handle"]; }
        // if(rec.repoType     ){ repoType     .innerText = rec["repoType"] + " repo: "; }

        if(rec["repoHref"] && rec["repoText"]){
            let alink = document.createElement("a");
            alink.innerText = `${rec["repoText"]}`;
            alink.href = rec["repoHref"];
            alink.target = "_blank";
            repoLink.append(`|| Repo: `, alink, ` ||`);
        }

        authorDiv2.classList.remove("hide"); 
    },
    
    // Get url params.
	getUrlParams: function(){
		const urlSearchParams = new URLSearchParams(window.location.search);
		const params          = Object.fromEntries(urlSearchParams.entries());
		return params;
	},

    // Utility functions intended to be shared.
    shared: {
        parent: null,
        // Pass the DOM object and it's text entries will be replaced with the coresponding DOM elements.
        parseObjectStringDOM: function(DOM={}, showWarnings=false){
            return new Promise((resolve,reject)=>{
                for(let key in DOM){
                    if(typeof DOM[key] == "string"){
                        let elem = document.getElementById( DOM[key] );
                        if(elem != null){ DOM[key] = elem; }
                        else{
                            if(showWarnings){
                                console.log(`parseObjectStringDOM: ${key} (${DOM[key]}) not found in the DOM.`); 
                            }
                        }
                    }
                    // else{
                    //     if(showWarnings){
                    //         console.log(`parseObjectStringDOM: ${key} was not a string. Was: ${typeof DOM[key]}`, DOM[key]); 
                    //     }
                    // }
                }
    
                resolve();
            });
        },
        setVisibility: function(elem, setState=null, toggle=false){
            // console.log(elem, elem.id);
            let part;
            if     (elem.id == this.parent.DOM["jsgame_menu_toggleApp"].id)    { part = "app"; }
            else if(elem.id == this.parent.DOM["jsgame_menu_toggleLobby"].id)  { part = "lobby"; }
            else if(elem.id == this.parent.DOM["jsgame_menu_toggleLoading"].id){ part = "loading"; }
            else{ console.log("toggleVisibility_wrapper: part: no match."); return; }
            
            // console.log(`part: ${part}, newState: ${newState}, oldClass: ${oldClass}, newClass: ${newClass}`);
            
            // Can we continue? 
            if(part != null){
                // Add/remove the class as needed.
                if(toggle && setState == null){
                    // Just toggle the view_shown class. 
                    elem.classList.toggle("view_shown");
                }
                else if(setState === true){
                    // Add the class.
                    elem.classList.add("view_shown");
                }
                else if(setState === false){
                    // Remove the class.
                    elem.classList.remove("view_shown");
                }
                else{ console.log("toggleVisibility_wrapper: invalid state value."); return; }
                
                // Perform the action(s).
                let isShown = elem.classList.contains("view_shown") ? true : false;
                switch(part){
                    case "app"  : { 
                        if(isShown){
                            this.parent.DOM["gameDivCont"].classList.remove("hide");  
                        } 
                        else{ 
                            this.parent.DOM["gameDivCont"].classList.add("hide"); 
                        } 
                        break; 
                    }
                    case "lobby": { 
                        if(isShown){
                            this.parent.DOM["lobbyDivCont"].classList.remove("hide"); 
                        } 
                        else{ 
                            this.parent.DOM["lobbyDivCont"].classList.add("hide"); 
                        } 
                        break; 
                    }
                    case "loading": { 
                        if(isShown){
                            this.parent.DOM["loadingDiv"].classList.remove("hide"); 
                        } 
                        else{ 
                            this.parent.DOM["loadingDiv"].classList.add("hide"); 
                        } 
                        break; 
                    }
                    default: { break; }
                };
            }
        },
        rebuildAppsJson_file: async function(){
            // Request a rebuild of the apps.json file. 
            let resp = await _JSG.net.http.send(`rebuildAppsJson_file`, { type:"json", method:"POST" }, 5000);
            _JSG.apps = resp;
            console.log("rebuildAppsJson_file", resp);
            alert("rebuildAppsJson_file: DONE");
        },
        msToFrames : function(ms, msPerFrame){
            // Convert seconds to ms then divide by msPerFrame.
            if(!msPerFrame){ msPerFrame = 16 }
            let frames = ( (ms) / msPerFrame);
    
            // DEBUG
            // console.log(
            // 	`msToFrames:` + "\n" + 
            // 	`  Requested msPerFrame: ${(msPerFrame).toFixed(2)}` + "\n" + 
            // 	`  Requested ms        : ${(ms).toFixed(2)}`         + "\n" + 
            // 	`  Calculated frames   : ${frames}`                  + "\n" + 
            // 	`  Returned frames     : ${Math.ceil(frames)}`       + "\n" + 
            // 	``
            // );
    
            // Return the number of frames rounded up.
            return Math.ceil(frames);
        },
        TinySimpleHash:s=>{for(var i=0,h=9;i<s.length;)h=Math.imul(h^s.charCodeAt(i++),9**9);return h^h>>>9},
        // DEBUG: Used to measure how long something takes.
        timeIt: {
            // EXAMPLE USAGE: 
            // _JSG.shared.timeIt.stamp("TESTKEY", "s", "SUBKEY"); // START
            // _JSG.shared.timeIt.stamp("TESTKEY", "e", "SUBKEY"); // END
            // _JSG.shared.timeIt.stamp("TESTKEY", "t", "SUBKEY"); // GET TIME

            timeIt_timings : { },
            timeIt_timings_prev : { },

            stamp: function(key, type, subKey="NOT_DEFINED"){
                // Is this a timeIt 'start'?
                if(type == "s"){
                    // Create the subkey if it doesn't exist.
                    if(!this.timeIt_timings     [subKey])     { this.timeIt_timings     [subKey] = {}; }
    
                    // Create the prev subkey if it doesn't exist.
                    if(!this.timeIt_timings_prev[subKey])     { this.timeIt_timings_prev[subKey] = {}; }
    
                    // Create the prev entry key if it does not exist.
                    if(!this.timeIt_timings_prev[subKey][key]){ this.timeIt_timings_prev[subKey][key] = {}; }
    
                    // Create the entry.
                    this.timeIt_timings         [subKey][key] = { s: performance.now(), e: 0, t: 0, }; 
                }
                // Is this a timeIt 'end'?
                else if(type == "e"){
                    if(this.timeIt_timings[subKey][key]){
                        // Set the end entry.
                        this.timeIt_timings[subKey][key].e = performance.now();
    
                        // Calculate the total entry and format.
                        // this.timeIt_timings[subKey][key].t = parseFloat((this.timeIt_timings[subKey][key].e - this.timeIt_timings[subKey][key].s).toFixed(2));
                        this.timeIt_timings[subKey][key].t = ((this.timeIt_timings[subKey][key].e - this.timeIt_timings[subKey][key].s));
    
                        // Add to prev
                        this.timeIt_timings_prev[subKey][key] = { t: this.timeIt_timings[subKey][key].t };
                    }
                }
                // Is this just a request for the total time?
                else if(type == "t"){
                    try{
                        // Return the value if it exists.
                        if(this.timeIt_timings[subKey][key]){ return this.timeIt_timings[subKey][key].t; }
    
                        // Return -1 if the value does not exist.
                        return -1;
                    }
                    catch(e){
                        console.log("Error in timeIt:", e);
                        return -1;
                    }
                }
                // Is this just a request for the previous total time?
                else if(type == "pt"){
                    try{
                        // Return the value if it exists.
                        if(this.timeIt_timings_prev[subKey][key]){ return this.timeIt_timings_prev[subKey][key].t; }
    
                        // Return -1 if the value does not exist.
                        return -1;
                    }
                    catch(e){
                        // console.log("Error in timeIt:", e);
                        return -1;
                    }
                }
            },
        },
    },

    // Loading div.
    loadingDiv: {
        parent: null,

        loadingStatus: `` +
            `-----------------------------\n`+
            `. . . . L O A D I N G . . . .\n`+
            `-----------------------------`+
        ``,
        loadedStatus: `` +
            `-----------------------------\n`+
            `. . . .  L O A D E D  . . . .\n`+
            `-----------------------------`+
        ``,
        errorStatus: `` +
            `-----------------------------\n`+
            `. . . . . E R R O R . . . . .\n`+
            `-----------------------------`+
        ``,

        addMessageChangeStatus: function(str, type, toConsole=false){
            this.changeStatus(type);
            this.addMessage(str, toConsole);
        },
        addMessage: function(str, toConsole=false){
            // _JSG.loadingDiv.addMessage("string");

            // Add the message and a "\n" if the string does not end with "\n".
            let newStr = str + (str.slice(-1) != "\n" ? "\n" : "");
            this.parent.DOM["loadingDiv_messages"].innerHTML += newStr;

            // Also send to the console?
            if(toConsole){
                console.log("loadingDiv:", newStr);
            }
            
            // Add the populated class to add padding. 
            this.parent.DOM["loadingDiv_messages"].classList.add("populated");

            // Scroll to the bottom of the messages.
            setTimeout(()=>{
                this.parent.DOM["loadingDiv_messages"].scrollTop = this.parent.DOM["loadingDiv_messages"].scrollHeight;
            }, 100);
        },
        changeStatus: function(type){
            // _JSG.loadingDiv.changeStatus("loading");
            // _JSG.loadingDiv.changeStatus("loaded");
            // _JSG.loadingDiv.changeStatus("error");

            // Get the element.
            let elem = this.parent.DOM["loadingDiv_status"];

            // Remove previous status classes.
            elem.classList.remove("loading");
            elem.classList.remove("loaded");
            elem.classList.remove("error");
            
            // Set the correct status message.
            if     (type == "loading"){ this.parent.DOM["loadingDiv_status"].innerHTML = this.loadingStatus; elem.classList.add("loading"); }
            else if(type == "loaded" ){ this.parent.DOM["loadingDiv_status"].innerHTML = this.loadedStatus;  elem.classList.add("loaded");  }
            else if(type == "error"  ){ this.parent.DOM["loadingDiv_status"].innerHTML = this.errorStatus;   elem.classList.add("error");   }
        },
        init: async function(parent){
            return new Promise((resolve,reject)=>{
                this.parent = parent;
                
                this.changeStatus("loading");
                // this.addMessage("loading");
                resolve();
            });
        },
    },

    // 
    init: async function(){
        // Set parents. 
        this.shared.parent = this;

        // JSGAME BASE DOM.
        this.DOM = _JSG.configObjs["base"];
        this.shared.parseObjectStringDOM(this.DOM, true);

        // Init the loading div.
        await this.loadingDiv.init(this);

        // Get the apps.json.
        _JSG.appStart_timestamp = performance.now();
        _JSG.loadingDiv.addMessage("Getting apps.json");
        _JSG.apps = await _JSG.net.http.send("shared/apps.json", { type:"json", method:"GET" }, 5000);

        if(_JSG.apps === false){
            let msg1 = "ERROR: init: Failure to retrieve apps.json.";
            _JSG.loadingDiv.changeStatus("error");
            _JSG.loadingDiv.addMessage(msg1);
            console.log(msg1, _JSG.apps); 
            return; 
        }

        this.DOM["js_game_header_menuBtn"].addEventListener("click", (ev)=>{ 
            this.DOM["js_game_header_menu"].classList.toggle('active');
            this.DOM["js_game_backgroundShade"].classList.toggle('hide');
            this.DOM["js_game_header_menuBtn"].classList.toggle("menuOpen");
        }, false);

        this.DOM.jsgame_menu_toggleLoading    .addEventListener("click", (ev)=>{ this.shared.setVisibility(ev.target, null, true); }, false);
        this.DOM.jsgame_menu_toggleApp        .addEventListener("click", (ev)=>{ this.shared.setVisibility(ev.target, null, true); }, false);
        this.DOM.jsgame_menu_toggleLobby      .addEventListener("click", (ev)=>{ this.shared.setVisibility(ev.target, null, true); }, false);
        this.DOM.jsgame_menu_rebuild_apps_file.addEventListener("click", (ev)=>{ this.shared.rebuildAppsJson_file(); }, false);

        // Display the game menus with the apps.json data.
        await _JSG.loadAppMenus();

        // Inits.
        await _JSG.net  .init(_JSG, _JSG.configObjs);
        await _JSG.lobby.init(_JSG, _JSG.configObjs);

        // this.shared.setVisibility(this.DOM["jsgame_menu_toggleLobby"], true, false);

        // Auto-load app?
        _JSG.params = _JSG.getUrlParams();
        if(Object.keys(_JSG.params).length){
            // Check for and get the app record.
            let rec;

            // Does the supplied key match a real key? 
            if(_JSG.params.appKey && (rec = _JSG.apps[_JSG.params.appKey]) ){
                // Load the app and await for it to finish loading. 
                await _JSG.loadApp(rec); 
            }

            // No match to the supplied key.
            else{
                // Do the login check. 
                _JSG.loadingDiv.addMessage("loadApp: appKey not found in apps.json");
                console.log("ERROR: appKey not found in apps.json:", _JSG.params.appKey); 
                _JSG.loadingDiv.changeStatus("error");

                // await new Promise((res,rej)=>{ setTimeout(()=>res(), 500); });
                // this.shared.setVisibility(this.DOM["jsgame_menu_toggleLoading"], false, false);
                // this.shared.setVisibility(this.DOM["jsgame_menu_toggleApp"], true, false);
                this.shared.setVisibility(this.DOM["jsgame_menu_toggleLobby"], true, false);
            
                // console.log("running loginCheck (appKey not found.)");
                await _JSG.lobby.login.loginCheck();
            }
        }
        else{
            // Do the login check. 
            // console.log("appKey not specified."); 
            _JSG.loadingDiv.addMessage("loadApp: appkey not specified.");

            await new Promise((res,rej)=>{ setTimeout(()=>res(), 500); });
            this.shared.setVisibility(this.DOM["jsgame_menu_toggleLoading"], false, false);
            // this.shared.setVisibility(this.DOM["jsgame_menu_toggleApp"], true, false);
            this.shared.setVisibility(this.DOM["jsgame_menu_toggleLobby"], true, false);
            
            // console.log("running loginCheck (No appKey.)");
            await _JSG.lobby.login.loginCheck();
        }
    },
};

window.onload = async function(){
    window.onload = null;
    await _JSG.init();
};
