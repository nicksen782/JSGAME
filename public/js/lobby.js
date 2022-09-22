_APP.lobby = {
    parent: null,

    nav:{
        parent:null,
        defaultTabKey: null,
        tabs: {},
        views: {},
        hideAllViews: function(){
            // Deactivate all tabs and views. 
            for(let key in this.tabs) { this.tabs[key] .classList.remove("active"); }
            for(let key in this.views){ this.views[key].classList.remove("active"); }
        },
        showOneView: function(tabKey){
            // Deactivate all tabs and views. 
            this.hideAllViews();
    
            // Get the tab and the view.
            let tabElem  = this.tabs [ tabKey ];
            let viewElem = this.views[ tabKey ];
    
            // Set the active class for this tab and view. 
            tabElem .classList.add("active");
            viewElem.classList.add("active");
        },
        init: function(configObj){
            return new Promise(async (resolve,reject)=>{
                // Load from config.
                this.defaultTabKey = configObj.defaultTabKey;
        
                // Save DOM strings and generate DOM references.
                for(let key in configObj.tabs) { this.tabs[key]  = configObj.tabs[key] ; }
                for(let key in configObj.views){ this.views[key] = configObj.views[key]; }
                this.parent.parent.shared.parseObjectStringDOM(this.tabs, false);
                this.parent.parent.shared.parseObjectStringDOM(this.views, false);
        
                // Deactivate all tabs and views. 
                this.hideAllViews();
            
                // Add event listeners to the tabs.
                for(let key in this.tabs){
                    this.tabs[key].addEventListener("click", () => this.showOneView(key), false); 
                }
        
                // Show the default view.
                this.showOneView(this.defaultTabKey);

                resolve();
            });
        }
    },

    // Loaded via _loadFiles.
    login: {},

    // Loaded via _loadFiles.
    lobby: {},

    // Loaded via _loadFiles.
    room: {},

    profile: {
        parent: null,
        DOM: {},
        
        // GET_updateDetails:function(data){
        //     console.log("GET_updateDetails:", data);

        //     for(let i=0; i<data.length; i+=1){
        //         let key   = data[i].key;
        //         let value = data[i].value;
        //         let uuid  = data[i].uuid;
                
        //         // Updating self.
        //         if(uuid == _APP.net.ws.uuid){
        //             console.log(key, value, uuid);
        //             if(key == "handle"){ 
        //                 this.DOM["lobby_handle"].value = value; 
        //                 this.parent.login["showLogout_username"] = value;
        //                 this.parent.login["showLogout_handle"] = value;
        //             }
        //             if(key == "name"  ){ 
        //                 this.DOM["lobby_name"]  .value = value; 
        //             }
        //         }
        //     }

        // },
        // SEND_updateDetails: function(){
        //     if(!_APP.net.ws.activeWs){ alert("You are not connected."); return;  } 
            
        //     let handle = this.DOM["lobby_handle"];
        //     let name   = this.DOM["lobby_name"];
            
        //     let obj = {
        //         mode:"UPDATE_USERDATA_KEY",
        //         data:[
        //             {key:"handle", value:handle.value },
        //             {key:"name"  , value:name.value   },
        //         ]
        //     };
        //     _APP.net.ws.activeWs.send(JSON.stringify(obj));
        // },

        init: function(configObj){
            return new Promise(async (resolve,reject)=>{
                // Save the DOM strings. 
                this.DOM = configObj.DOM;
                
                // Parse the DOM strings into elements. 
                this.parent.parent.shared.parseObjectStringDOM(this.DOM, true);

                // Event listeners.
                // this.DOM["lobby_detailsUpdate"].addEventListener("click", ()  =>{ this.SEND_updateDetails(); }, false);

                resolve();
            });
        }
    },
    
    // TODO
    room2: {
    },
    
    // TODO
    dm: {
        parent: null,
        DOM: {},

        init: function(configObj){
            return new Promise(async (resolve,reject)=>{
                resolve();
            });
        }
    },
    
    // TODO
    settings: {
        parent: null,
        DOM: {},

        init: function(configObj){
            return new Promise(async (resolve,reject)=>{
                resolve();
            });
        }
    },
    
    // TODO
    debug: {
        parent: null,
        DOM: {},

        init: function(configObj){
            return new Promise(async (resolve,reject)=>{
                // Save the DOM strings. 
                this.DOM = configObj.DOM;
                
                // Parse the DOM strings into elements. 
                this.parent.parent.shared.parseObjectStringDOM(this.DOM, true);

                // Event listeners.
                // this.DOM["lobby_detailsUpdate"].addEventListener("click", ()  =>{ this.updateDetails(); }, false);

                resolve();
            });
        }
    },

    // 
    ws: {
        parent: null,

        // SHARED. Functions for receiving data (by key, type, mode.)
        handlers: {
            JSON:{},
            TEXT:{},
        },

        onReadyFunction_lobby: async function(){
            _APP.net.ws.activeWs.send('GET_GLOBAL_ROOMS');
        },

        addWsModes: async function(parent){
            return new Promise(async (resolve,reject)=>{
                // Websockets config:
        
                // let keys = ["JSON","TEXT"];
                let keys = Object.keys(parent.handlers);
                for(let key0 of keys){
                    for(let key1 in parent.handlers[key0]){
                        for(let key2 in parent.handlers[key0][key1]){
                            // Create the entries in allowedMessageTypes.
                            if(!_APP.net.ws.ws_event_handler.allowedMessageTypes[key0][key1]){ _APP.net.ws.ws_event_handler.allowedMessageTypes[key0][key1] = []; }
                            
                            // Create the entries in handlers.
                            if(!_APP.net.ws.ws_event_handler.handlers[key0][key1]){ _APP.net.ws.ws_event_handler.handlers[key0][key1] = {}; }
                            
                            // Add to allowedMessageTypes.
                            _APP.net.ws.ws_event_handler.allowedMessageTypes[key0][key1].push(key2);
                            
                            // Add to handlers.
                            _APP.net.ws.ws_event_handler.handlers[key0][key1][key2] = parent.handlers[key0][key1][key2].bind(parent.parent);
                        }
                    }
                }
                resolve();
            });
        },

        init: function(){
            return new Promise(async (resolve,reject)=>{
                // Websockets config:
                await this.addWsModes(this);
                _APP.net.ws.onReadyFunction_lobby = this.onReadyFunction_lobby.bind(this.parent);
                resolve();
            });
        }
    },

    _loadFiles: async function(_files){
        return new Promise(async function(resolve,reject){
            // Adds file by type.
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
                            script.src = `${rec.f}`;
                            
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

            // Add each file (synchronously)
            for(let i=0; i<_files.length; i+=1){
                // Determine what type of file this is and load it.
                await addFile(_files[i]);
            }

            resolve();
        });
    },
    init: async function(parent, configObj){
        return new Promise(async (resolve,reject)=>{
            // Load the lobby JavaScript files. 
            await this._loadFiles(configObj.lobby._files);

            // Set parent(s).
            this.parent  = parent;
            this.nav     .parent = this;
            this.profile .parent = this;
            // this.lobby   .parent = this;
            this.room    .parent = this;
            this.dm      .parent = this;
            this.settings.parent = this;
            this.debug   .parent = this;
            this.ws      .parent = this;
            this.login   .parent = this;

            // Populate the lobby html.
            _APP.DOM["lobbyDiv"].innerHTML = await _APP.net.http.send(`lobby.html`, { type:"text", method:"GET" }, 5000); 

            // Inits.
            await this.nav     .init(configObj.lobby.nav);
            await this.login   .init(configObj.lobby.login);
            await this.profile .init(configObj.lobby.profile);
            // await this.lobby   .init(configObj.lobby.lobby);
            await this.room    .init(configObj.lobby.room);
            await this.dm      .init(configObj.lobby.dm);
            await this.settings.init(configObj.lobby.settings);
            await this.debug   .init(configObj.lobby.debug);
            await this.ws      .init();

            resolve();
        });
    },
};