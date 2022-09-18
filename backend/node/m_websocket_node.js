// const fs = require('fs');
// const path = require('path');
// const os   = require('os');
const WebSocket = require('ws');

let _APP = null;

let _MOD = {
    moduleLoaded: false,

    ws:null,
    subscriptionKeys: [
        "TEST"
    ],

    userTrack: {
        // Holds sessions/ws by username as key.
        data:{},
        uuids:[],

        // Add a new object (once per login.)
        addNewUser     : function(username){
            if(!this.data[username]){
                console.log("userTrack: Adding new user key:", username);
                this.data[username] = {
                    session:[], // Stays with the user even if the browser is refreshed.
                    ws:     [], // Only stays with the user as long as the browser is not refreshed.
                }
            }
            else{
                console.log("userTrack: User key already exists.", username);
            }
        },
        addToExistingUser: function(username, sessionObj, wsObj){
            // Add to sessions only if this is a new uuid.
            if(this.uuids.indexOf(sessionObj.data.uuid) == -1){
                // Add the uuid to the list. 
                this.uuids.push(sessionObj.data.uuid);
                // Add the session. 
                this.data[username].session.push(sessionObj);
            }
            // Always add the ws object since it is new every browser refresh.
            this.data[username].ws.push(wsObj);
        },

        // Get a data object with data matching the provided uuid.
        getByUuid     : function(uuid){
            // Each session and ws has the same uuid. 
            // The uuid is what differentiates different login sessions. 

            let obj = {
                uuid:uuid,
                session:[],
                ws:[],
            };
            // console.log("getByUuid: Object.keys(this.data).length: ", Object.keys(this.data).length);
            for(let userKey in this.data){
                // Get the user data key.
                let user = this.data[userKey];

                // Get the sessions.
                let user_sessions = user.session;
                for(let i_session=0; i_session<user_sessions.length; i_session+=1){
                    let session = user_sessions[i_session];
                    if(session.data.uuid == uuid){ obj.session.push(session); }
                    // if(session.data.uuid == uuid){ obj.session.push(session.data.uuid); }
                }
                
                // Get the ws connections. 
                let user_wss = user.ws;
                for(let i_ws=0; i_ws<user_wss.length; i_ws+=1){
                    let ws = user_wss[i_ws];
                    if(ws.CONFIG.uuid == uuid){ obj.ws.push(ws); }
                    // if(ws.CONFIG.uuid == uuid){ obj.ws.push(ws.CONFIG.uuid); }
                }
            }

            return obj;
        },

        // Get a data object with data matching the provided username.
        getByUsername     : function(username){
            if(!this.data[username]){ return false; }
            return this.data[username];
        },

        removeData: function(username, uuid){
            console.log("removeData:", username, uuid);

            // Get the user.
            let user = this.data[username];

            // Remove sessions of this user that match the specified uuid.
            user.session = user.session.filter(session=> session.data.uuid != uuid );
            
            // Close and remove the ws connections for this user that are NOT open.
            user.ws = user.ws.filter(ws=>{ 
                if(ws.readyState == WebSocket.OPEN){ ws.close(); return false; }
                return true;
            });

            // console.log(`User: ${userKey} has ${user.session.length} sessions and ${user.ws.length} ws.`);

            // If the user has no more sessions or ws then delete the userKey.
            if(user.session.length == 0 && user.ws.length == 0){ delete this.data[username]; }
        },

        // Remove ws entries that have a closed readystate.
        cleanOld: function(){
            for(let userKey in this.data){
                // Get the user data key.
                let user = this.data[userKey];

                // Remove closed WebSocket objects. 
                // console.log("old ws count:", user.ws.length);
                user.ws = user.ws.filter(ws=>{ return (ws.readyState == WebSocket.OPEN) });
                // console.log("new ws count:", user.ws.length);
            }
        },
    },

     // Init this module.
    module_init: async function(parent){
        return new Promise(async function(resolve,reject){
            if(!_MOD.moduleLoaded){
                // Save reference to the parent module.
                _APP = parent;
        
                _APP.consolelog("WebSockets Server", 2);
                if(_APP.m_config.config.toggles.isActive_nodeWsServer){
                    _APP.consolelog("Create Server", 4);
                    _MOD.createWebSocketsServer();

                    _APP.consolelog("Init Server", 4);
                    _MOD.initWss();
                }
                else{
                    _APP.consolelog("DISABLED IN CONFIG_FILE", 2);
                    _MOD.ws = null;
                }

                // Add routes.
                _APP.consolelog("addRoutes", 2);
                _MOD.addRoutes(_APP.app, _APP.express);

                // Set the moduleLoaded flag.
                _MOD.moduleLoaded = true;
            }

            resolve();
        });
    },

    // Adds routes for this module.
    addRoutes: function(app, express){
        // ********************
        // Websockets "routes".
        // ********************

        // _APP.addToRouteList({ path: "SUBSCRIBE"                  , method: "ws", args: [], file: __filename, desc: "JSON: subscriptions    : Subscribe to event." });
        // _APP.addToRouteList({ path: "UNSUBSCRIBE"                , method: "ws", args: [], file: __filename, desc: "JSON: subscriptions    : Unsubscribe from event." });
        // _APP.addToRouteList({ path: "GET_SUBSCRIPTIONS"          , method: "ws", args: [], file: __filename, desc: "TEXT: subscriptions    : Get list of active subscriptions." });
        // _APP.addToRouteList({ path: "PROCESS_EXIT"               , method: "ws", args: [], file: __filename, desc: "TEXT: general          : Tells node to exit (will restart with PM2.)" });
        // _APP.addToRouteList({ path: "CONNECTIVITY_STATUS_UPDATE" , method: "ws", args: [], file: __filename, desc: "TEXT: general          : Get connectivity statuses." });
        
        // TEXT
        // _APP.addToRouteList({ path: "GET_CLIENTS_ATTACHED"   , method: "ws", args: [], file: __filename, desc: "Clients that are attached to a host." });
        // _APP.addToRouteList({ path: "GET_CLIENTS_UNATTACHED" , method: "ws", args: [], file: __filename, desc: "Clients that are not attached yet to a host." });
        // _APP.addToRouteList({ path: "GET_HOSTS_INACTIVE"     , method: "ws", args: [], file: __filename, desc: "Hosts that have not started the game." });
        // _APP.addToRouteList({ path: "GET_HOSTS_ACTIVE"       , method: "ws", args: [], file: __filename, desc: "Hosts that have started the game." });
        
        // JSON
        // _APP.addToRouteList({ path: "LOBBY_JOIN"        , method: "ws", args: [], file: __filename, desc: "Join the lobby as a client." });
        // _APP.addToRouteList({ path: "LOBBY_JOIN_GAME"   , method: "ws", args: [], file: __filename, desc: "Join a hosted game." });
        // _APP.addToRouteList({ path: "LOBBY_HOST_GAME"   , method: "ws", args: [], file: __filename, desc: "Create a hosted game." });
        
        // _APP.addToRouteList({ path: "LOBBY_CHAT_GET_ALL", method: "ws", args: [], file: __filename, desc: "Get all chat messages." });
        // _APP.addToRouteList({ path: "LOBBY_CHAT_SEND"   , method: "ws", args: [], file: __filename, desc: "Send a chat message." });

        // _APP.addToRouteList({ path: "GET_HOSTS_BY_GAME_ACTIVE"    , method: "ws", args: [], file: __filename, desc: "Active hosts by game." });
        // _APP.addToRouteList({ path: "GET_HOSTS_BY_GAME_INACTIVE"  , method: "ws", args: [], file: __filename, desc: "Inactive hosts by game." });
        // _APP.addToRouteList({ path: "GET_CLIENTS_BY_HOST"         , method: "ws", args: [], file: __filename, desc: "Clients by attached host." });
        // _APP.addToRouteList({ path: "SEND_MSG_TO_HOST"            , method: "ws", args: [], file: __filename, desc: "Send message to any host." });
        // _APP.addToRouteList({ path: "SEND_MSG_TO_CLIENT"          , method: "ws", args: [], file: __filename, desc: "Send message to any client." });
        // _APP.addToRouteList({ path: "SEND_MSG_TO_HOST_CLIENT"     , method: "ws", args: [], file: __filename, desc: "Send message to client of host." });
        // _APP.addToRouteList({ path: "SEND_MSG_TO_HOST_ALL_CLIENTS", method: "ws", args: [], file: __filename, desc: "Send message to all clients of host." });

        // ************
        // HTTP routes. 
        // ************

    },

    // **********
    createWebSocketsServer: function(){
        _MOD.ws = new WebSocket.WebSocketServer({ clientTracking: true, noServer: true }); 
        
        _APP.server.on('upgrade', function (request, socket, head) {
            // Parse request.session into a js object. 
            _APP.session(request, {}, () => {
                // Is this user logged in? 
                if (!request.session.loggedIn) {
                    // No. Only a logged-in user should be able to start a new WebSockets connection. 
                    socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
                    // socket.destroy();
                    console.log("NOT LOGGED IN.");
                    return;
                }

                // Upgrade the connection from http to WebSockets.
                _MOD.ws.handleUpgrade(request, socket, head, function (ws) {
                    // Start the new WebSockets connection. 
                    _MOD.ws.emit('connection', ws, request);
                });
            });
        });
    },

    ws_utilities: {
    },

    // Populated during init via data from ws_event_handlers.
    allowedMessageTypes: {
        JSON:{},
        TEXT:{},
    },
    handlerLookup: function(mode, type){
        let keys = Object.keys(_MOD.allowedMessageTypes[type]);
        for(let i=0; i<keys.length; i+=1){ if(_MOD.allowedMessageTypes[type][keys[i]].indexOf(mode) != -1){ return keys[i]; } }
        return false;
    },
    ws_event_handlers:{
        JSON:{
            JSGAME_lobby:{
                UPDATE_USERDATA_KEY:  async function(ws, data){ 
                    // Only allow updates to certain keys within the whitelist.
                    let updates = [];
                    let keys_whitelist = [
                        "name", "handle"
                    ];
                    for(let i=0; i<data.data.length; i+=1){
                        let key   = data.data[i].key;
                        let value = data.data[i].value;
                        // console.log(`DEBUG: key: ${key}, value: ${value}`);

                        if(keys_whitelist.indexOf(key) != -1){
                            console.log(`UPDATED: key: ${key}, value: ${value}`);
                            
                            // Add to the list of updates. 
                            updates.push( { key  :key, value:value, uuid :ws.CONFIG.uuid } );

                            // Update the user's key in the ws object.
                            ws.CONFIG[key] = value;
    
                            // TODO
                            // If this is a login-type key then update the user's data in the database as well.
                            //
                        }
                        else{
                            console.log(`NOT UPDATING. INVALID KEY: key: ${key}, value: ${value}`);
                        }
                    }

                    if(updates.length){
                        // Send this update to all clients so that they can also update their copy of the data.
                        let obj = {
                            mode: "UPDATE_USERDATA_KEY", 
                            data: updates
                        };
                        _MOD.funcs.sendToAll( JSON.stringify( obj ) );
                    }
                },
                CHAT_MSG_TO_ALL:  async function(ws, data){ 
                    let prefix;
                    if     (ws.CONFIG.name)  { prefix = ws.CONFIG.name; }
                    else if(ws.CONFIG.handle){ prefix = ws.CONFIG.handle; }
                    else                     { prefix = `USER_${ws.CONFIG.num.toString().padStart(3, "0")}`; }
                    _MOD.funcs.sendToAll( JSON.stringify( {mode:"CHAT_MSG_TO_ALL", data:prefix + ": " + data.data} ) );
                },
                UPDATE_MY_DETAILS: async function(ws, data){ 
                    ws.CONFIG.name   = data.data.name;
                    ws.CONFIG.handle = data.data.handle;
                    _MOD.funcs.sendToAll( JSON.stringify( {mode:"GET_ALL_CLIENTS", data:_MOD.funcs.getAllClients()} ) );
                },
            },
            tests:{
                // ECHO:  async function(ws, data){ 
                //     ws.send( JSON.stringify({mode:"ECHO", data:data.data}) );
                // },
            },
        },
        TEXT:{
            JSGAME_connections:{
                GET_UUID: async function(ws){ 
                    ws.send( JSON.stringify( {mode:"GET_UUID", data:ws.CONFIG.uuid} ) );
                },
                GET_ALL_CLIENTS:async function(ws, data){ 
                    ws.send( JSON.stringify( {mode:"GET_ALL_CLIENTS", data:_MOD.funcs.getAllClients()} ) );
                },
                PING: async function(ws){ 
                    console.log("PING");
                    ws.send("PONG");
                },
                PONG: async function(ws){ 
                    console.log("PONG");
                },
            },
        },
    },
    funcs:{
       sendToAll: function(data){
            _MOD.ws.clients.forEach(function each(ws) { 
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(data); 
                }
            });
        },
        getAllClients: function(){
            let clients = [];
            _MOD.ws.clients.forEach(function each(ws) { 
                if (ws.readyState === WebSocket.OPEN) {
                    clients.push(ws.CONFIG);
                }
            });
            clients.sort(function(a,b){ return a.num - b.num; });
            return clients;
        },
    },
    ws_events:{
        el_message: function(ws, event){
            let data;
            let tests = { isJson: false, isText: false };

            // First, assume the data is JSON (verify this.)
            try{ data = JSON.parse(event.data); tests.isJson = true; }
            
            // Isn't JSON. Assume that it is text. 
            catch(e){ data = event.data; tests.isText = true; }

            // Handle JSON.
            if(tests.isJson){
                // Find the event handler key.
                let key = _MOD.handlerLookup(data.mode, "JSON");
                console.log("JSON,", `key: ${key}, mode:`, data.mode);

                // Use the key if found.
                if(key){ _MOD.ws_event_handlers.JSON[key][data.mode](ws, data); }

                // Unhandled.
                else{
                    console.log("UNKNOWN MODE:", "MODE:", data.mode, "JSON");
                    ws.send(JSON.stringify({"mode":"ERROR", "data":"UNKNOWN MODE: " + data.mode}));
                    return; 
                }
            }

            // Handle TEXT.
            else if(tests.isText){
                // Find the event handler key.
                let key = _MOD.handlerLookup(data, "TEXT");
                console.log("TEXT,", `key: ${key}, mode: ${data}`);

                // Use the key if found.
                if(key){ _MOD.ws_event_handlers.TEXT[key][data](ws); }

                // Unhandled.
                else{
                    console.log("UNKNOWN MODE:", "data:", data, "TEXT");
                    ws.send(JSON.stringify({"mode":"ERROR", "data":"UNKNOWN MODE: " + data}));
                    return;
                }
            }
        },
        el_close  : function(ws, event){ 
            console.log("WebSockets Server: CLOSE  :", ws.CONFIG.uuid);
            ws.close(); 

            // TODO: Remove all terminal ws connections that have the matching UUID.
            // 

            // Make sure this ws connection is removed after a short delay. 
            setTimeout(function(){
                ws.terminate(); 
                setTimeout(function(){
                    ws=null; 
                }, 1000);
            }, 1000);
        },
        el_error  : function(ws, event){ 
            console.log("WebSockets Server: ERROR  :", ws.CONFIG.uuid, event);
            ws.close(); 

            // Make sure this ws connection is removed after a short delay. 
            // setTimeout(function(){
            //     ws.terminate(); 
            //     setTimeout(function(){
            //         ws=null; 
            //     }, 1000);
            // }, 1000);
        },
    },

    initWss: function(){
        // Websockets config:
        // let keys = ["JSON","TEXT"];
        let keys = Object.keys(this.ws_event_handlers);
        for(let key0 of keys){
            for(let key1 in this.ws_event_handlers[key0]){
                for(let key2 in this.ws_event_handlers[key0][key1]){
                    // Create the entries in allowedMessageTypes.
                    if(!_MOD.allowedMessageTypes[key0][key1]){ _MOD.allowedMessageTypes[key0][key1] = []; }
                    
                    // Add to allowedMessageTypes.
                    _MOD.allowedMessageTypes[key0][key1].push(key2);
                }
            }
        }

        // Run this for each new websocket connection. 
        let userCount = 0;
        _MOD.ws.on("connection", function connection(ws, request, client){
            // LOBBY
            if( request.url == "/LOBBY"){
                // Add the config object to this ws object. 
                ws.CONFIG = {};
                
                // ADD THE SUBSCRIPTIONS ARRAY TO THIS CONNECTION. 
                ws.subscriptions = [];

                // AUTO-ADD SOME SUBSCRIPTIONS. 
                // _MOD.ws_utilities.addSubscription(ws, "STATS1");
                // _MOD.ws_utilities.addSubscription(ws, "STATS2");

                // Save this data to the ws for future use.
                
                // Create the userTrack object if it does not exist.
                if(!_MOD.userTrack.getByUsername(request.session.data.username)){
                    _MOD.userTrack.addNewUser(request.session.data.username);
                }
                
                // Add this data to userTrack.
                _MOD.userTrack.addToExistingUser(request.session.data.username, request.session, ws);

                // Save the UUID to the ws.CONFIG. (Redundant due to userTrack?)
                ws.CONFIG.uuid            = request.session.data.uuid; 
                
                // Save the session to the ws.CONFIG. (Redundant due to userTrack?)
                ws.CONFIG.session = request.session.data;

                // Remove any old data from userTrack.
                _MOD.userTrack.cleanOld();

                // ws.CONFIG.uuid         = _APP.uuidv4().toUpperCase(); 
                // ws.CONFIG.num          = userCount ++; 
                // ws.CONFIG.type         = "LOBBY"; 
                // ws.CONFIG.clientType   = "UNATTACHED"; 
                // ws.CONFIG.hostingData  = {
                    // hosting       : false,
                    // appKey        : "",
                    // title         : "",
                    // numConnected  : 0,
                    // maxConnections: 0,
                // }; 
                // ws.CONFIG.admin        = false; 
                // ws.CONFIG.clientType   = "GAME_HOST"; 
                // ws.CONFIG.clientType   = "GAME_CLIENT"; 
                // ws.CONFIG.isHost       = ""; 
                // ws.CONFIG.host_uuid    = ""; // UUID of the host that this client has connected to. (If the client is the host then this will match their own UUID.)
                // ws.CONFIG.client_uuids = []; // UUIDs of clients connected to this host.

                console.log("WebSockets Server: CONNECT:", ws.CONFIG.type, request.session.data.uuid);

                // Indicate that the connection is open and ready.
                ws.send(JSON.stringify( {"mode":"NEWCONNECTION", data:request.session.uuid } ));
                
                // SEND THE NEW CONNECTION MESSAGE.
                ws.send(JSON.stringify( {"mode":"WELCOMEMESSAGE", data:`WELCOME TO JSGAME (LOBBY).`} ));

                // SEND THE NEW CONNECTION DATA TO ALL CONNECTED CLIENTS.
                _MOD.funcs.sendToAll( JSON.stringify( {mode:"NEW_LOBBY_CLIENT", data:[ws.CONFIG]} ) );

                // _MOD.funcs.sendToAll( JSON.stringify( {mode:"GET_ALL_CLIENTS", data:_MOD.funcs.getAllClients()} ) );

                // ws.send(JSON.stringify( {"mode":"NEW_LOBBY_CLIENT", data:`WELCOME TO JSGAME (LOBBY).`} ));

                // console.log("request.session:", request.session);
                // console.log("request.session.uuid:", request.session.uuid);
                // console.log("ws.CONFIG.uuid      :", ws.CONFIG.uuid);

                // ADD EVENT LISTENERS.
                ws.addEventListener('message', (event)=>_MOD.ws_events.el_message(ws, event) );
                ws.addEventListener('close'  , (event)=>_MOD.ws_events.el_close  (ws, event) );
                ws.addEventListener('error'  , (event)=>_MOD.ws_events.el_error  (ws, event) );
            }
        });
    },
};

module.exports = _MOD;