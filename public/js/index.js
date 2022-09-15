_APP = {
    parent: null,

    // Contains config settings for "modules".
    configObjs : {
        net: {
            DOM: {
                coloredElems: {
                    main         : "net_ws_status" ,
                    statusSquare : "net_ws_status_square",
                },
                elems: {
                    statusText   : "net_ws_status_text", 
                },
            }
        }
    },

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
        let select = document.querySelector("#gameSelectDiv select");
        select.value = rec.appKey;

        await _APP.loadFiles(rec); 
        _APP.updateAuthorData(rec);
        if(_APP[rec.appKey].init){ _APP[rec.appKey].init(); }
        else{
            console.log("ERROR: Missing init function in:", rec.appKey, _APP[rec.appKey]);
        }
    },
    
    // Generates the app select menu.
    loadAppMenus : function(){
        return new Promise((resolve,reject)=>{
            if(!Object.keys(_APP.apps).length){ console.log("ERROR: loadAppMenus: Error in apps.json."); return; }
            let gameSelectDiv = document.getElementById("gameSelectDiv");

            let select = document.createElement("select");
            select.addEventListener("change", async (ev) => { 
                let thisOption = select.options[select.selectedIndex];
                let appKey = thisOption.getAttribute("appKey");
                
                // Reload with the game selected.
                if(appKey){ window.location.href= `?appKey=${appKey}`; }
                
                // Reload with no game selected.
                else{ window.location.href = `?`; }
            }, false);

            let button = document.createElement("button");
            button.innerText = "Reload";
            button.addEventListener("click", (ev)=>{ select.dispatchEvent(new Event("change")) }, false);

            let option = document.createElement("option");
            option.value = "";
            option.innerText = "... Choose an application";
            select.append(option);

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
            gameSelectDiv.innerHTML = "";

            select.append(frag1);
            gameSelectDiv.append(select);
            gameSelectDiv.append(button);
            resolve();
        });
    },
    
    // Updates the displayed author/app data.
    updateAuthorData: function(rec){
        rec = rec.repo;
        let authorDiv2 = document.getElementById("authorDiv2");

        let author_title  = document.getElementById("author2_title");  author_title .innerHTML = ""
        let author_C      = document.getElementById("author2_C");      author_C     .innerHTML = ""
        let author_year   = document.getElementById("author2_year");   author_year  .innerHTML = ""
        let author_name   = document.getElementById("author2_name");   author_name  .innerHTML = ""
        let author_handle = document.getElementById("author2_handle"); author_handle.innerHTML = ""
        let repoType      = document.getElementById("repo2Type");      repoType     .innerHTML = ""
        let repoLink      = document.getElementById("repo2Link");      repoLink     .innerHTML = ""

        if(!rec){ authorDiv2.classList.add("hide"); return;}
        if(rec.author_title ){ author_title .innerText = rec["author_title"] + ": "; }
        if(rec.author_C     ){ author_C     .innerText = "(C)"; }
        if(rec.author_year  ){ author_year  .innerText = rec["author_year"]        ; }
        if(rec.author_name  ){ author_name  .innerText = rec["author_name"]  ; }
        if(rec.author_handle){ author_handle.innerText = rec["author_handle"]; }
        if(rec.repoType     ){ repoType     .innerText = rec["repoType"] + " repo: "; }

        if(rec["repoHref"] && rec["repoText"]){
            let alink = document.createElement("a");
            alink.innerText = rec["repoText"];
            alink.href = rec["repoHref"];
            alink.target = "_blank";
            repoLink.append(alink);
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
                                console.log(`parseObjectStringDOM: ${key} not found in the DOM.`); 
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
    },

    // 
    init: async function(parent){
        // Set parents. 
        this.parent = parent;
        this.shared.parent = this;

        // Init net.
        _APP.net.init(_APP, _APP.configObjs.net);

        // Get the apps.json.
        _APP.apps = await _APP.net.http.send("shared/apps.json", { type:"json", method:"GET" }, 5000);

        // Display the game menus with the apps.json data.
        await _APP.loadAppMenus();
        
        // Auto-load app?
        let params = _APP.getUrlParams();
        if(Object.keys(params).length){
            if(params.appKey){
                if(_APP.apps[params.appKey]){ 
                    let rec = _APP.apps[params.appKey];
                    if(rec){ _APP.loadApp(rec); }
                }
                else { console.log("Game not found in apps.json:", params.appKey); }
            }
        }
    },
};

window.onload = async function(){
    window.onload = null;
    await _APP.init(_APP);
};