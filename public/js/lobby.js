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

    login: {
        parent:null,
        DOM:{},
        afterLogin: async function(loginObj){
            return new Promise(async (resolve,reject)=>{
                if(loginObj.success == true){
                    // console.log("TRUE", loginObj.resultType, loginObj.data);

                    // Show the correct part of the login form.
                    this.DOM.showLogin.classList.add("hide");
                    this.DOM.showLogout.classList.remove("hide");

                    // Change to the PROFILE tab.
                    this.parent.nav.showOneView("profile");

                    // Populate some of the returned data.
                    //

                    // Start WebSockets.
                    _APP.net.ws.ws_utilities.initWss();

                    resolve();
                }
                else{
                    // console.log("FALSE", loginObj.resultType, loginObj.data);

                    // Show the correct part of the login form.
                    this.DOM.showLogin.classList.remove("hide");
                    this.DOM.showLogout.classList.add("hide");

                    resolve();
                }
            });
        },
        login     : async function(){
            return new Promise(async (resolve,reject)=>{
                let loginResp = await _APP.net.http.send("login", { 
                    type:"json", 
                    method:"POST", 
                    body:{
                        username    : this.DOM.username.value,
                        passwordHash: sha256(this.DOM.password.value),
                    } 
                }, 5000);

                await this.afterLogin(loginResp);

                resolve();
            });
        },
        loginCheck: async function(){
            return new Promise(async (resolve,reject)=>{
                let loginCheckResp = await _APP.net.http.send("loginCheck", { type:"json", method:"POST" }, 5000);
                await this.afterLogin(loginCheckResp);
                resolve();
            });
        },
        logout    : async function(){
            return new Promise(async (resolve,reject)=>{
                let logoutResp = await _APP.net.http.send("logout", { type:"json", method:"POST" }, 5000);
                if(logoutResp.success == true){
                    // console.log("TRUE", logoutResp.resultType, logoutResp.data);

                    // Show the correct part of the login form.
                    this.DOM.showLogin.classList.remove("hide");
                    this.DOM.showLogout.classList.add("hide");

                    _APP.net.ws.ws_utilities.wsCloseAll();

                    resolve();
                }
                else{
                    // console.log("FALSE", logoutResp.resultType, logoutResp.data);

                    // Show the correct part of the login form.
                    this.DOM.showLogin.classList.add("hide");
                    this.DOM.showLogout.classList.remove("hide");

                    _APP.net.ws.ws_utilities.wsCloseAll();

                    resolve();
                }
            });
        },
        init: async function(configObj){
            return new Promise(async (resolve,reject)=>{
                // Save the DOM strings. 
                this.DOM = configObj.DOM;
                
                // Parse the DOM strings into elements. 
                this.parent.parent.shared.parseObjectStringDOM(this.DOM, true);

                // Add event listeners. 
                this.DOM.login.addEventListener("click", async ()=>{ await this.login(); }, false);
                this.DOM.logout.addEventListener("click", async ()=>{ await this.logout(); }, false);

                // Do the login check. 
                await this.loginCheck();

                resolve();
            });
        },
    },

    profile: {
        parent: null,
        DOM: {},
        
        updateDetails: function(){
            if(!_APP.net.ws.activeWs){ alert("You are not connected."); return;  } 
            
            let handle = this.DOM["lobby_handle"];
            let name   = this.DOM["lobby_name"];
            
            let obj = {
                mode:"UPDATE_MY_DETAILS",
                data:{
                    handle: handle.value,
                    name  : name.value,
                }
            };
            _APP.net.ws.activeWs.send(JSON.stringify(obj));
        },

        init: function(configObj){
            return new Promise(async (resolve,reject)=>{
                // Save the DOM strings. 
                this.DOM = configObj.DOM;
                
                // Parse the DOM strings into elements. 
                this.parent.parent.shared.parseObjectStringDOM(this.DOM, true);

                // Event listeners.
                console.log(this.DOM);
                this.DOM["lobby_detailsUpdate"].addEventListener("click", ()  =>{ this.updateDetails(); }, false);

                resolve();
            });
        }
    },
    // lobby_handle
    // lobby_name
    
    // TODO
    lobby: {
        parent: null,
        DOM: {},

        joinLobby:function(){
        },
        startAsHost:function(){
        },
        startAsClient:function(){
        },

        sendChatMessage:function(){
            if(!_APP.net.ws.activeWs){ alert("You are not connected."); return;  } 
    
            let elem = this.DOM["lobby_chat_send"];
            let obj = {
                mode:"CHAT_MSG_TO_ALL",
                data: elem.value
            };
            _APP.net.ws.activeWs.send(JSON.stringify(obj));
            elem.value = "";
        },

        init: function(configObj){
            return new Promise(async (resolve,reject)=>{
                // Save the DOM strings. 
                this.DOM = configObj.DOM;
                
                // Parse the DOM strings into elements. 
                this.parent.parent.shared.parseObjectStringDOM(this.DOM, true);

                // Event listeners.
                this.DOM["lobby_chat_send"].addEventListener("keyup", (ev)=>{ if(ev.key=='Enter'){ this.sendChatMessage(); } }, false);

                resolve();
            });
        }
    },

    // TODO
    room: {
        parent: null,

        init: function(configObj){
            return new Promise(async (resolve,reject)=>{
                resolve();
            });
        }
    },
    
    // TODO
    dm: {
        parent: null,

        init: function(configObj){
            return new Promise(async (resolve,reject)=>{
                resolve();
            });
        }
    },
    
    // TODO
    settings: {
        parent: null,

        init: function(configObj){
            return new Promise(async (resolve,reject)=>{
                resolve();
            });
        }
    },
    
    // TODO
    debug: {
        parent: null,

        init: function(configObj){
            return new Promise(async (resolve,reject)=>{
                resolve();
            });
        }
    },

    // TODO
    ws: {
        parent: null,

        // Functions for receiving data (by mode.)
        handlers: {
            JSON:{
                lobby_tests:{
                    GET_UUID: async function(data) { 
                        console.log("RESPONSE:", "MODE:", data.mode, ", DATA:", data.data); 
                    },
                    ECHO: async function(data) { 
                        console.log("RESPONSE:", "MODE:", data.mode, ", DATA:", data.data); 
                    },
                    GET_ALL_CLIENTS: async function(data) { 
                        console.log("MODE:", data.mode, ", DATA:", data.data); 
                        // document.getElementById("lobby_debugOutput1").innerHTML = JSON.stringify(data.data, null, 1);
                    },
                    CHAT_MSG_TO_ALL: async function(data) { 
                        console.log("MODE:", data.mode, ", DATA:", data.data); 
                        document.getElementById("lobby_debugOutput2").innerHTML += data.data + "\n";
                    },
                },
            },
            TEXT:{},
        },

        onReadyFunction: async function(){
            // console.log("hello! I am the onReadyFunction!", this);
            _APP.net.ws.activeWs.send('GET_UUID');
            _APP.net.ws.activeWs.send('GET_ALL_CLIENTS');
        },

        init: function(configObj){
            return new Promise(async (resolve,reject)=>{
                // Websockets config:
        
                // let keys = ["JSON","TEXT"];
                let keys = Object.keys(this.handlers);
                for(let key0 of keys){
                    for(let key1 in this.handlers[key0]){
                        for(let key2 in this.handlers[key0][key1]){
                            // Create the entries in allowedMessageTypes.
                            if(!_APP.net.ws.ws_event_handler.allowedMessageTypes[key0][key1]){ _APP.net.ws.ws_event_handler.allowedMessageTypes[key0][key1] = []; }
                            
                            // Create the entries in handlers.
                            if(!_APP.net.ws.ws_event_handler.handlers[key0][key1]){ _APP.net.ws.ws_event_handler.handlers[key0][key1] = {}; }
                            
                            // Add to allowedMessageTypes.
                            _APP.net.ws.ws_event_handler.allowedMessageTypes[key0][key1].push(key2);
                            
                            // Add to handlers.
                            _APP.net.ws.ws_event_handler.handlers[key0][key1][key2] = this.handlers[key0][key1][key2].bind(this.parent);
                        }
                    }
                }
        
                // _APP.net.ws.onReadyFunction = this.onReadyFunction;
                _APP.net.ws.onReadyFunction = this.onReadyFunction.bind(this.parent);

                resolve();
            });
        }
    },


    init: async function(parent, configObj){
        return new Promise(async (resolve,reject)=>{
            // Set parent(s).
            this.parent  = parent;
            this.nav     .parent = this;
            this.login   .parent = this;
            this.profile .parent = this;
            this.lobby   .parent = this;
            this.room    .parent = this;
            this.dm      .parent = this;
            this.settings.parent = this;
            this.debug   .parent = this;
            this.ws      .parent = this;

            // Populate the lobby html.
            document.getElementById("lobbyDiv").innerHTML = await _APP.net.http.send(`lobby.html`, { type:"text", method:"GET" }, 5000); 

            // Inits.
            await this.nav     .init(configObj.lobby.nav);
            await this.login   .init(configObj.lobby.login);
            await this.profile .init(configObj.lobby.profile);
            await this.lobby   .init(configObj.lobby.lobby);
            await this.room    .init(configObj.lobby.room);
            await this.dm      .init(configObj.lobby.dm);
            await this.settings.init(configObj.lobby.settings);
            await this.debug   .init(configObj.lobby.debug);
            await this.ws      .init(configObj.lobby.ws);

            resolve();
        });
    },
};