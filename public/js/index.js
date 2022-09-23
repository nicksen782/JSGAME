_APP = {
    // Contains config settings for "modules". (POPULATED DURING INIT.)
    configObjs : {},

    DOM: {},

    // Stores apps.json.
    apps: {},

    // Stores the loaded appKey
    loadedAppKey: "",
    
    // Stores the loaded app config.
    loadedConfig: {},
    
    // Loads the files specified by the appRec.
    loadFiles: async function(appRec){
        return new Promise(async function(resolve,reject){
            if(!appRec){ console.log("ERROR: loadFiles: Invalid appRec:", appRec); return; }

            // Get the app config.
            _APP.loadedConfig = await _APP.net.http.send(`${appRec.configFile}`, { type:"json", method:"GET" }, 5000);

            // Set and save the loadedAppKey.
            _APP.loadedAppKey = appRec.appKey;

            // Create the app object if it doesn't exist. 
            if(!_APP[_APP.loadedAppKey]){ _APP[_APP.loadedAppKey] = {}; }

            // Stop here if the app is already loaded.
            if(_APP[_APP.loadedAppKey].filesLoaded){ console.log("Already loaded!"); return; }

            let addFile = function(rec){
                return new Promise(async function(res,rej){
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
                                console.log("JS: FAILURE:", `${appRec.appPath}/${rec.f}`);
                                res(); script.onload = null; 
                            };

                            // Append the element. 
                            document.head.appendChild(script);

                            // Set source. 
                            script.src = `${appRec.appPath}/${rec.f}`;
                            
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
                                if(!_APP[_APP.loadedAppKey].files){ _APP[_APP.loadedAppKey].files = {"_WARNING":"_WARNING"}};
                                
                                // Save the data to the files object. 
                                _APP[_APP.loadedAppKey].files[dataName] = img;
                                
                                res();
                                img.onload = null;
                            };
                            img.src = `${appRec.appPath}/${rec.f}`;
    
                            break; 
                        }

                        case "json": { 
                            // Get the data.
                            let data = await _APP.net.http.send(`${appRec.appPath}/${rec.f}`, { type:"json", method:"GET" }, 5000);

                            // Determine the data name. 
                            let dataName;
                            if(rec.n){ dataName = rec.n; }
                            else{ dataName = rec.f }

                            // Create the files key in the game if it doesn't exist. 
                            if(!_APP[_APP.loadedAppKey].files){ _APP[_APP.loadedAppKey].files = {"_WARNING":"_WARNING"}};

                            // Save the data to the files object. 
                            _APP[_APP.loadedAppKey].files[dataName] = data;

                            res();
                            break; 
                        }
                        
                        case "html": { 
                            // Get the data.
                            let data = await _APP.net.http.send(`${appRec.appPath}/${rec.f}`, { type:"text", method:"GET" }, 5000);

                            // Determine the data name. 
                            let dataName;
                            if(rec.n){ dataName = rec.n; }
                            else{ dataName = rec.f }

                            // Create the files key in the game if it doesn't exist. 
                            if(!_APP[_APP.loadedAppKey].files){ _APP[_APP.loadedAppKey].files = {"_WARNING":"_WARNING"}};

                            // Save the data to the files object. 
                            _APP[_APP.loadedAppKey].files[dataName] = data;

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
                            
                            // Append the element. 
                            document.head.appendChild( link );

                            // Set source.
                            link.href   = `${appRec.appPath}/${rec.f}`;

                            break; 
                        }

                        default  : { 
                            console.log(`Cannot load: ${rec.f}. Unknown file type: ${rec.t}`);
                            rej();
                            break; 
                        }
                    };
                });
            };

            // Go through each file. 
            for(let i=0; i<_APP.loadedConfig.files.length; i+=1){
                // Determine what type of file this is and load it.
                await addFile(_APP.loadedConfig.files[i]);
            }
    
            _APP[_APP.loadedAppKey].filesLoaded = true;
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
            await _APP.loadFiles(rec); 

            // Display the author data for the app.
            _APP.updateAuthorData(rec);

            // Hide the debug div if the screen is too small.
            // NOTE: If debug was true and not disabled here then the app should take care of displaying the debugDiv.
            // if(document.documentElement.clientWidth < 768){
            //     // console.log("**************", "width: " + document.documentElement.clientWidth + ", height: " + document.documentElement.clientHeight);
            //     if(_APP.loadedConfig.meta && _APP.loadedConfig.meta.debug == true){
            //         console.log("Screen is too narrow. Hiding the debugDiv and disabling in the app.");
            //         document.getElementById("debugDiv").classList.add("hide");
            //         _APP.loadedConfig.meta.debug = false;
            //     }
            // }

            console.log("LOADING:", rec.appKey);
            if(_APP[rec.appKey].init){ 
                // Run the app's init.
                await _APP[rec.appKey].init(); 
                console.log("LOADED :", rec.appKey);
                
                // Set visabilities.
                this.shared.setVisibility(this.DOM["jsgame_menu_toggleLoading"], false, false);
                this.shared.setVisibility(this.DOM["jsgame_menu_toggleApp"], true, false);
                this.shared.setVisibility(this.DOM["jsgame_menu_toggleLobby"], true, false);

                // Do the login check. 
                // console.log("running loginCheck after loading:", rec.appKey);
                await _APP.lobby.login.loginCheck();
                resolve();
            }
            else{
                console.log(`ERROR: Cannot load: ${rec.appKey}. Missing init function.` );

                // Set visabilities.
                this.shared.setVisibility(this.DOM["jsgame_menu_toggleLoading"], false, false);
                this.shared.setVisibility(this.DOM["jsgame_menu_toggleApp"], false, false);
                this.shared.setVisibility(this.DOM["jsgame_menu_toggleLobby"], true, false);

                // Do the login check. 
                // console.log("running loginCheck after loading:", rec.appKey);
                await _APP.lobby.login.loginCheck();

                resolve();
            }
        });
    },
    
    // Generates the app select menu.
    loadAppMenus : function(){
        return new Promise((resolve,reject)=>{
            if(!Object.keys(_APP.apps).length){ console.log("ERROR: loadAppMenus: Error in apps.json."); return; }
            
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
            for(let key in _APP.apps){
                let rec = _APP.apps[key];
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
	getUrlParams                     : function(){
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
    },

    // 
    init: async function(){
        // Set parents. 
        this.shared.parent = this;

        // Get the apps.json.
        _APP.apps = await _APP.net.http.send("shared/apps.json", { type:"json", method:"GET" }, 5000);

        // JSGAME BASE DOM.
        this.DOM = _APP.configObjs["base"];
        this.shared.parseObjectStringDOM(this.DOM, true);

        this.DOM["js_game_header_menuBtn"].addEventListener("click", (ev)=>{ 
            this.DOM["js_game_header_menu"].classList.toggle('active');
            this.DOM["js_game_backgroundShade"].classList.toggle('hide');
            this.DOM["js_game_header_menuBtn"].classList.toggle("menuOpen");
        }, false);

        this.DOM.jsgame_menu_toggleLoading.addEventListener("click", (ev)=>{ this.shared.setVisibility(ev.target, null, true); }, false);
        this.DOM.jsgame_menu_toggleApp    .addEventListener("click", (ev)=>{ this.shared.setVisibility(ev.target, null, true); }, false);
        this.DOM.jsgame_menu_toggleLobby  .addEventListener("click", (ev)=>{ this.shared.setVisibility(ev.target, null, true); }, false);

        // Display the game menus with the apps.json data.
        await _APP.loadAppMenus();

        // Inits.
        await _APP.net  .init(_APP, _APP.configObjs);
        await _APP.lobby.init(_APP, _APP.configObjs);

        // this.shared.setVisibility(this.DOM["jsgame_menu_toggleLobby"], true, false);

        // Auto-load app?
        let params = _APP.getUrlParams();
        if(Object.keys(params).length){
            // Check for and get the app record.
            let rec;
            // Does the supplied key match a real key? 
            if(params.appKey && (rec = _APP.apps[params.appKey]) ){
                // Load the app and await for it to finish loading. 
                await _APP.loadApp(rec); 
                
                // Set visabilities.
                // this.shared.setVisibility(this.DOM["jsgame_menu_toggleLoading"], false, false);
                // this.shared.setVisibility(this.DOM["jsgame_menu_toggleApp"], true, false);
                // this.shared.setVisibility(this.DOM["jsgame_menu_toggleLobby"], true, false);
            }
            else{
                // Do the login check. 
                console.log("appKey not found in apps.json:", params.appKey); 
            
                this.shared.setVisibility(this.DOM["jsgame_menu_toggleLoading"], false, false);
                // this.shared.setVisibility(this.DOM["jsgame_menu_toggleApp"], true, false);
                this.shared.setVisibility(this.DOM["jsgame_menu_toggleLobby"], true, false);
            
                // console.log("running loginCheck (appKey not found.)");
                await _APP.lobby.login.loginCheck();
            }
        }
        else{
            // Do the login check. 
            // console.log("appKey not specified."); 
            
            this.shared.setVisibility(this.DOM["jsgame_menu_toggleLoading"], false, false);
            // this.shared.setVisibility(this.DOM["jsgame_menu_toggleApp"], true, false);
            this.shared.setVisibility(this.DOM["jsgame_menu_toggleLobby"], true, false);
            
            // console.log("running loginCheck (No appKey.)");
            await _APP.lobby.login.loginCheck();
        }
    },
};

window.onload = async function(){
    window.onload = null;
    await new Promise((res,rej)=>{ setTimeout(()=>res(), 500); });
    await _APP.init();
};

// Do the login check. 
// console.log("running loginCheck after loading:", rec.appKey);
// await _APP.lobby.login.loginCheck();