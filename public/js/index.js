_APP = {
    apps: {},
    loadedAppKey: "",
    loadedConfig: {},
    loadFiles: async function(gameRec){
        return new Promise(async function(res,rej){
            if(!gameRec){ console.log("ERROR: loadFiles: Invalid gameRec:", gameRec); return; }

            // Get the game config.
            _APP.loadedConfig = await( await fetch(`${gameRec.configFile}`) ).json();

            // Set and save the loadedAppKey.
            _APP.loadedAppKey = gameRec.appKey;

            // Create the game object if it doesn't exist. 
            if(!_APP[_APP.loadedAppKey]){
                _APP[_APP.loadedAppKey] = {};
            }

            // Stop here if the game is already loaded.
            if(_APP[_APP.loadedAppKey].filesLoaded){ console.log("Already loaded!"); return; }

            // This keeps promises for each file to load.
            let proms = [];

            // Go through each file. 
            for(let i=0; i<_APP.loadedConfig.files.length; i+=1){
                // Get this file record.
                let rec = _APP.loadedConfig.files[i];
                
                // Add to the proms array. 
                proms.push(
                    // Determine what type of file this is and load it.
                    new Promise(async function(res_i,rej_i){
                        switch(rec.t){

                            case "js": { 
                                // Create the script. 
                                let script = document.createElement('script');

                                // Set defer.
                                script.defer=true;

                                // Onload.
                                script.onload = function () { script.onload = null; res_i(); };

                                // Set source. 
                                script.src = `${gameRec.gamePath}/${rec.f}`;

                                // Set the name. 
                                if(rec.n){ script.setAttribute("name", rec.n); }
                                else{ script.setAttribute("name", rec.f); }

                                // Append the element. 
                                document.head.appendChild(script);
                                
                                break; 
                            }

                            case "html": { 
                                // Get the data.
                                let data = await( await fetch(`${gameRec.gamePath}/${rec.f}`) ).text();

                                // Determine the data name. 
                                let dataName;
                                if(rec.n){ dataName = rec.n; }
                                else{ dataName = rec.f }

                                // Create the html key in the game if it doesn't exist. 
                                if(!_APP[_APP.loadedAppKey].html){ _APP[_APP.loadedAppKey].html = {"T":"T"}};

                                // Save the data to the html object. 
                                _APP[_APP.loadedAppKey].html[dataName] = data;

                                res_i();
                                break; 
                            }

                            case "css": { 
                                // Create CSS link.
                                let link = document.createElement('link');

                                // Set type and rel. 
                                link.type   = 'text/css';
                                link.rel    = 'stylesheet';

                                // Onload.
                                link.onload = function() { link.onload = null; res_i(); };

                                // Set source.
                                link.href   = `${gameRec.gamePath}/${rec.f}`;

                                // Set the name.
                                if(rec.n){ link.setAttribute("name", rec.n); }
                                else{ link.setAttribute("name", rec.f); }

                                // Append the element. 
                                document.head.appendChild( link );
                                break; 
                            }

                            default  : { 
                                console.log(`Cannot load: ${rec.f}. Unknown file type: ${rec.t}`);
                                rej_i();
                                break; 
                            }
                        };
                    })
                );
            }
    
            await Promise.all(proms);
            _APP[_APP.loadedAppKey].filesLoaded = true;
            res();
        });
    },
    loadGameMenus : function(){
        if(!Object.keys(_APP.apps).length){ console.log("ERROR: loadGameMenus: Error in apps.json."); return; }
        let gameSelectDiv = document.getElementById("gameSelectDiv")
        let frag = document.createDocumentFragment();
        for(let key in _APP.apps){
            let rec = _APP.apps[key];
            let button = document.createElement("button");
            button.innerText = "LOAD: " + rec.displayName;
            button.title = rec.desc;
            button.addEventListener("click", async (ev) => { 
                await _APP.loadFiles(rec); 
                _APP[rec.appKey].init(); 
                _APP.updateAuthorData(rec);
            }, false);
            frag.append(button);
        }
        gameSelectDiv.innerHTML = "";
        gameSelectDiv.append(frag);
    },
    updateAuthorData: function(rec){
        rec = rec.repo;

        let author_title  = document.getElementById("author_title");  author_title .innerHTML = ""
        let author_C      = document.getElementById("author_C");      author_C     .innerHTML = ""
        let author_year   = document.getElementById("author_year");   author_year  .innerHTML = ""
        let author_name   = document.getElementById("author_name");   author_name  .innerHTML = ""
        let author_handle = document.getElementById("author_handle"); author_handle.innerHTML = ""
        let repoType      = document.getElementById("repoType");      repoType     .innerHTML = ""
        let repoLink      = document.getElementById("repoLink");      repoLink     .innerHTML = ""

        if(!rec){ return;}
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
    },
};

window.onload = async function(){
    window.onload = null;

    // Get the apps.json.
    _APP.apps = await( await fetch(`apps.json`) ).json();

    // Display the game menus.
    _APP.loadGameMenus();

    // Auto-load game?
    // TODO
};