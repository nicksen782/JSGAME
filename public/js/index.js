_APP = {
    apps: {},
    loadedAppKey: "",
    loadedConfig: {},
    loadFiles: async function(gameRec){
        return new Promise(async function(resolve,reject){
            if(!gameRec){ console.log("ERROR: loadFiles: Invalid gameRec:", gameRec); return; }

            // Get the game config.
            _APP.loadedConfig = await( await fetch(`${gameRec.configFile}`) ).json();

            // Set and save the loadedAppKey.
            _APP.loadedAppKey = gameRec.appKey;

            // Create the game object if it doesn't exist. 
            if(!_APP[_APP.loadedAppKey]){ _APP[_APP.loadedAppKey] = {}; }

            // Stop here if the game is already loaded.
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
                            script.src = `${gameRec.gamePath}/${rec.f}`;
                            
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
                            img.src = `${gameRec.gamePath}/${rec.f}`;
    
                            break; 
                        }

                        case "json": { 
                            // Get the data.
                            let data = await( await fetch(`${gameRec.gamePath}/${rec.f}`) ).json();

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
                            let data = await( await fetch(`${gameRec.gamePath}/${rec.f}`) ).text();

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
                            link.href   = `${gameRec.gamePath}/${rec.f}`;

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
                _APP.updateAuthorData(rec);
                _APP[rec.appKey].init(); 
            }, false);
            frag.append(button);
        }
        gameSelectDiv.innerHTML = "";
        gameSelectDiv.append(frag);
    },
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
};

window.onload = async function(){
    window.onload = null;

    // Get the apps.json.
    _APP.apps = await( await fetch(`shared/apps.json`) ).json();

    // Display the game menus.
    _APP.loadGameMenus();

    // Auto-load game?
    // TODO
};