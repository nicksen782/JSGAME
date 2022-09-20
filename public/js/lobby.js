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
        loginData: {},

        afterLogin: async function(loginObj){
            return new Promise(async (resolve,reject)=>{
                if(loginObj.success == true){
                    this.loginData = loginObj.data.session;
                    // console.log("TRUE", loginObj.resultType, loginObj.data);

                    // DEBUG: This test is here while testing to see if it ever triggers.
                    if(this.loginData.loadedAppKey != _APP.loadedAppKey){
                        alert("loadedAppKey mismatch:", `${this.loginData.loadedAppKey} VS ${_APP.loadedAppKey}`);
                    }

                    // Show the correct part of the login form.
                    this.DOM.showLogin   .classList.add("hide");
                    this.DOM.showLogout  .classList.remove("hide");
                    this.DOM.showChecking.classList.add("hide");

                    // Change to the PROFILE tab.
                    // this.parent.nav.showOneView("profile");
                    this.parent.nav.showOneView("lobby");
                    // this.parent.nav.showOneView("room");
                    // this.parent.nav.showOneView("dm");
                    // this.parent.nav.showOneView("settings");
                    // this.parent.nav.showOneView("debug");

                    // Populate with some of the returned data.
                    //
                    console.log("loginObj:", loginObj);
                    this.DOM.showLogout_username.innerText = this.loginData.username;
                    this.DOM.showLogout_name    .innerText = this.loginData.name;

                    // Start WebSockets.
                    _APP.net.ws.ws_utilities.initWss();

                    resolve();
                }
                else{
                    // console.log("FALSE", loginObj.resultType, loginObj.data);

                    // Show the correct part of the login form.
                    this.DOM.showLogin   .classList.remove("hide");
                    this.DOM.showLogout  .classList.add("hide");
                    this.DOM.showChecking.classList.add("hide");

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
                        loadedAppKey: _APP.loadedAppKey,
                    } 
                }, 5000);

                await this.afterLogin(loginResp);

                resolve();
            });
        },
        loginCheck: async function(){
            return new Promise(async (resolve,reject)=>{
                let loginCheckResp = await _APP.net.http.send("loginCheck", { type:"json", method:"POST", body:{ loadedAppKey: _APP.loadedAppKey } }, 5000);
                await this.afterLogin(loginCheckResp);
                resolve();
            });
        },
        logout    : async function(){
            return new Promise(async (resolve,reject)=>{
                let logoutResp = await _APP.net.http.send("logout", { type:"json", method:"POST" }, 5000);
                console.log("logoutResp:", logoutResp);
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

                // // Do the login check. 
                // await this.loginCheck();

                resolve();
            });
        },
    },

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
    lobby: {
        parent: null,
        DOM: {},

        // TODO
        startAsHost:function(){
        },
        // TODO
        startAsClient:function(){
        },

        populateGlobalRooms: function(data){
            let table = this.DOM["lobby_globalTable"];
            let old_tbody = this.DOM["lobby_globalTable"].querySelector("tbody");
            let new_tbody = document.createElement('tbody');

            // console.log("populateGlobalRooms:", data, table, old_tbody, new_tbody);
            
            for(let i=0; i<data.length; i+=1){
                let rec = data[i];
                
                let tr = new_tbody.insertRow(-1);
                tr.setAttribute("json", JSON.stringify(data));
                let td;

                // <th>Room title</th>
                td = tr.insertCell(-1);
                td.setAttribute("roomTitle", rec.roomTitle);
                td.innerText = rec.roomTitle;
                
                // <th>Participants</th>
                td = tr.insertCell(-1);
                td.setAttribute("clients", rec.clients);
                td.innerText = rec.clients;

                // <th>JOIN</th>
                td = tr.insertCell(-1);
                let button = document.createElement("button"); td.append(button);
                button.innerText = "JOIN";
                button.onclick = ()=>{
                    _APP.net.ws.activeWs.send(JSON.stringify({ mode:'JOIN_ROOM', data:rec.roomId}));
                };
            }

            window.requestAnimationFrame(function(){
                old_tbody.parentNode.replaceChild(new_tbody, old_tbody);
            });
        },

        init: function(configObj){
            return new Promise(async (resolve,reject)=>{
                // Save the DOM strings. 
                this.DOM = configObj.DOM;
                
                // Parse the DOM strings into elements. 
                this.parent.parent.shared.parseObjectStringDOM(this.DOM, true);

                resolve();
            });
        }
    },

    // TODO
    room: {
        parent: null,
        DOM: {},
        currentRoomId: "",

        // RECV: Adds to the current room members display.
        newMembers:function(data){
            // console.log("newMembers:", data);
    
            let frag1 = document.createDocumentFragment();
            for(let i=0; i<data.length; i+=1){
                let div = document.createElement("div");
                let span1 = document.createElement("span");
                span1.classList.add("lobby_members_item");
                span1.innerText = data[i].username;
                span1.setAttribute("uuid", data[i].uuid);
                span1.title = `${data[i].username} : ${data[i].uuid}`;
                div.append(span1);
                frag1.append(div);
            }
            this.DOM["members"].append(frag1);
            this.parent.nav.showOneView("room");
        },
        addChatMessagesDom: function(messages){
            let table = this.DOM["messages_table"];
            let tbody = table.querySelector("tbody");

            for(let i=0; i<messages.length; i+=1){
                let tr = tbody.insertRow(-1);
                let td;

                // Name
                td = tr.insertCell(-1);
                td.classList.add("tdUsername");
                td.innerText = messages[i].u;
                td.title = new Date(messages[i].d);
                if(messages[i].username == _APP.lobby.login.loginData.username){ tr.classList.add("thisUser"); }
                
                // Message
                td = tr.insertCell(-1);
                td.classList.add("tdMessage");
                td.innerText = messages[i].m;
            }
        },
        // RECV: Populates room data.
        joinRoom:function(data){
            console.log("joinRoom:", data);

            // Update the room display data.
            this.DOM["chat_title"].innerText = data.room.roomTitle;
            this.DOM["chat_title"].title = `roomId: ${data.room.roomId}`;

            // Clear any existing message rows. 
            Array.from(this.DOM["messages_table"].querySelector("tbody").rows).forEach( tr => tr.remove() );

            // this.DOM["messages"].innerHTML = "";
            this.addChatMessagesDom(data.room.chatHistory);

            // Clear the members list. 
            this.DOM["members"].innerHTML = "";

            // Populate the members list. 
            this.newMembers(data.clients);

            // Save the currentRoomId.
            this.currentRoomId = data.room.roomId;
            // Show the room tab.
            this.parent.nav.showOneView("room");
        },
        // RECV: Receive chat message to room and display it.
        recv_CHAT_ROOM_MESSAGE: function(roomId, msgObj){
            console.log("recv_CHAT_ROOM_MESSAGE:", roomId, msgObj, this.DOM.messages);

            if(this.currentRoomId != roomId){
                console.log("recv_CHAT_ROOM_MESSAGE:", `Received message but not for the current chat room.`, data);
                return; 
            }

            // Update the messages display within the room.
            console.log("add to div!");
            this.addChatMessagesDom(msgObj);
        },
        // SEND: Send chat message to the room.
        send_CHAT_ROOM_MESSAGE: function(ev){
            // Get the message value.
            let message = ev.target.value;

            // Clear the message input.
            ev.target.value = "";

            // Send the roomId and message to the server. 
            _APP.net.ws.activeWs.send(JSON.stringify({ mode:'CHAT_ROOM_MESSAGE', data:{roomId:this.currentRoomId, message:message }}));
        },

        init: function(configObj){
            return new Promise(async (resolve,reject)=>{
                // Save the DOM strings. 
                this.DOM = configObj.DOM;
                
                // Parse the DOM strings into elements. 
                this.parent.parent.shared.parseObjectStringDOM(this.DOM, true);

                // Event listeners.
                this.DOM["send"].addEventListener("keyup", (ev)=>{ if(ev.key=='Enter'){ this.send_CHAT_ROOM_MESSAGE(ev); } }, false);

                resolve();
            });
        }
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

        // updateClientsList: function(clientData, removeMissing=false){
        //     let table = this.DOM["table_connections"];
        //     let tbody = this.DOM["table_connections"].querySelector("tbody");
            
        //     // console.log("updateClientsList: table:     ", table);
        //     // console.log("updateClientsList: tbody:     ", tbody);
        //     // console.log("updateClientsList: clientData:", clientData);

        //     // Look through the current rows and update/remove if needed.
        //     let providedUUIDs = clientData.map(d=>d.uuid);
        //     console.log("*** providedUUIDs:", providedUUIDs);
        //     return;
        //     let foundUUIDs = [];
        //     let toRemove = [];

        //     let editRow = function(tr, json){
        //         // Find the record in clientData by uuid.
        //         let rec = clientData.find(d=>d.uuid == json.uuid);
        //         if(!rec){ 
        //             // console.log("---- rec not found for:", json.uuid);
        //             return;
        //         }
        //         console.log("++++ Found rec for:", json.uuid, rec);
        //         foundUUIDs.push(json.uuid);

        //         let td_name        = tr.querySelector("[name='name']");
        //         let td_username    = tr.querySelector("[name='username']");
        //         let td_uuid        = tr.querySelector("[name='uuid']");
        //         let td_application = tr.querySelector("[name='application']");
        //         let td_hostingData = tr.querySelector("[name='hostingData']");
        //         let td_type        = tr.querySelector("[name='type']");

        //         if(json.name        != rec.name       ){ console.log("updated: json.name"       ); td_name       .innerText = rec.name       ; }
        //         if(json.username    != rec.username   ){ console.log("updated: json.username"   ); td_username   .innerText = rec.username   ; }
        //         if(json.uuid        != rec.uuid       ){ console.log("updated: json.uuid"       ); td_uuid       .innerText = rec.uuid.split("-")[0]       ; }
        //         if(json.application != rec.application){ console.log("updated: json.application"); td_application.innerText = rec.application; }
        //         if(json.hostingData != rec.hostingData){ console.log("updated: json.hostingData"); td_hostingData.innerText = rec.hostingData; }
        //         if(json.type        != rec.type       ){ console.log("updated: json.type"       ); td_type       .innerText = rec.type       ; }

        //         // {
        //         //     "uuid": "5249ABFD-7057-453B-827D-2B89B2286A63",
        //         //     "num": 64,
        //         //     "type": "LOBBY",
        //         //     "clientType": "UNATTACHED",
        //         //     "hostingData": {
        //         //         "hosting": false,
        //         //         "appKey": "",
        //         //         "title": "",
        //         //         "numConnected": 0,
        //         //         "maxConnections": 0
        //         //     },
        //         //     "host_uuid": "",
        //         //     "client_uuids": []
        //         // }
        //     };
        //     let createRow = function(clientData){
        //         let tr = tbody.insertRow(-1);
        //         tr.setAttribute("json", JSON.stringify(clientData));
        //         let td;

        //         if(clientData.uuid == _APP.net.ws.uuid){ tr.classList.add("thisUser"); }

        //         // Name
        //         td = tr.insertCell(-1);
        //         td.setAttribute("name", "name");
        //         // td.innerText = clientData.name;
                
        //         // Username
        //         td = tr.insertCell(-1);
        //         td.setAttribute("name", "username");
        //         // td.innerText = clientData.username;
                
        //         // UUID
        //         td = tr.insertCell(-1);
        //         td.setAttribute("name", "uuid");
        //         td.innerText = clientData.uuid.split("-")[0];
                
        //         // Application
        //         td = tr.insertCell(-1);
        //         td.setAttribute("name", "application");
        //         // td.innerText = clientData.hostingData.appKey;
                
        //         // HostingData
        //         td = tr.insertCell(-1);
        //         td.setAttribute("name", "hostingData");
        //         // td.innerText = `${clientData.hostingData.hosting} clients:${clientData.client_uuids.length}` ;
                
        //         // type
        //         td = tr.insertCell(-1);
        //         td.setAttribute("name", "type");
        //         td.innerText = clientData.type;
        //     };

        //     for(let i=0; i<tbody.rows.length; i+=1){
        //         let tr = tbody.rows[i];
        //         let json = JSON.parse(tr.getAttribute("json"));
        //         // Remove?
        //         if(removeMissing && providedUUIDs.indexOf(json.uuid) == -1){ 
        //             // console.log("adding row to remove:", tr, json);
        //             toRemove.push(tr); 
        //         }
        //         else{
        //             editRow(tr, json);
        //         }
        //     }
        //     if(removeMissing && toRemove.length){
        //         for(let i=toRemove.length-1; i>=0; i+=1){
        //             console.log("toRemove:", toRemove[i]);
        //         }
        //     }

        //     // 
        //     for(let i=0; i<clientData.length; i+=1){
        //         // Skip adding a row if a row with this uuid already exists. 
        //         if(foundUUIDs.indexOf(clientData[i].uuid) != -1){ 
        //             console.log("Skiping uuid:", clientData[i].uuid, ", foundUUIDs:", foundUUIDs);
        //             continue; 
        //         }
        //         console.log("Adding uuid:", clientData[i].uuid, ", foundUUIDs:", foundUUIDs);

        //         createRow(clientData[i]);
        //     }
        // },

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

    // TODO
    ws: {
        parent: null,

        // Functions for receiving data (by mode.)
        handlers: {
            JSON:{
                JSGAME_lobby_rooms: {
                    // Get the list of global rooms.
                    GET_GLOBAL_ROOMS: async function(data){ 
                        // console.log("*lobby: .ws:", "MODE:", data.mode, ", DATA:", data.data); 

                        // Populate the lobby rooms table.
                        this.lobby.populateGlobalRooms(data.data);
                    },
                    // When joining a room.
                    JOIN_ROOM: async function(data){ 
                        // console.log("*lobby: .ws:", "MODE:", data.mode, ", DATA:", data.data); 

                        // Populate the lobby rooms table.
                        this.room.joinRoom(data.data);
                    },
                    // For when a new client has joined the join.
                    NEW_MEMBER: async function(data){ 
                        // console.log("*lobby: .ws:", "MODE:", data.mode, ", DATA:", data.data); 

                        // Adds to the room member's list.
                        this.room.newMembers(data.data);
                    },
                    // TODO: New lobby connection. Perhaps a friend? 
                    LOBBY_CLIENT_NEW: async function(data) { 
                        console.log("lobby: .ws:", "MODE:", data.mode, ", DATA:", data.data); 
                        // this.debug.updateClientsList(data.data, false);
                        
                        // Update friend list. (DM)
                        //
                    },
                    CHAT_ROOM_MESSAGE: async function(data){
                        console.log("lobby: .ws:", "MODE:", data.mode, ", DATA:", data.data); 
                        this.room.recv_CHAT_ROOM_MESSAGE(data.data.roomId, data.data.msgObj);
                    },
                },
            },
            TEXT:{},
        },

        onReadyFunction_lobby: async function(){
            _APP.net.ws.activeWs.send('GET_GLOBAL_ROOMS');

            // Populate debug.
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
        
                _APP.net.ws.onReadyFunction_lobby = this.onReadyFunction_lobby.bind(this.parent);

                resolve();
            });
        }
    },


    init: async function(parent, configObj){
        return new Promise(async (resolve,reject)=>{
            // Set parent(s).
            this.parent  = parent;
            this.nav     .parent = this;
            this.profile .parent = this;
            this.lobby   .parent = this;
            this.room    .parent = this;
            this.dm      .parent = this;
            this.settings.parent = this;
            this.debug   .parent = this;
            this.ws      .parent = this;
            this.login   .parent = this;

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