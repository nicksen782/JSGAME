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
                    uuids  : [], // Tracks the UUIDs used by the user.
                    session: [], // Stays with the user even if the browser is refreshed.
                    ws:      [], // Only stays with the user as long as the browser is not refreshed.
                }
            }
            else{
                console.log("userTrack: User key already exists.", username);
            }
        },
        addToExistingUser: function(username, sessionObj, wsObj){
            // Add to sessions only if this is a new uuid.
            if(this.uuids.indexOf(sessionObj.data.uuid) == -1){
                // Add the uuid to the main list. 
                this.uuids.push(sessionObj.data.uuid);
                
                // Add the uuid to the user's list. 
                this.data[username].uuids.push(sessionObj.data.uuid);

                // Add the session. 
                this.data[username].session.push(sessionObj);
            }
            // Always add the ws object since it is new every browser refresh.
            this.data[username].ws.push(wsObj);
        },

        // Get a data object with data matching the provided uuid.
        getByUuid     : function(uuid){
            // Each session and ws for each user's login has the same uuid. 
            // The uuid is what differentiates different login sessions. 

            let obj = {
                username: "",
                uuid    : uuid,
                session : [], 
                ws      : [],
            };

            // Look through the data list until the user with the matching UUID is found. Return it.
            for(let userKey in this.data){
                // Get the user data key.
                let user = this.data[userKey];

                // Find the first session for this user that has a matching UUID.
                let data = user.session.find(u=>u.data.uuid == uuid);

                // Record found? 
                if(data){ 
                    // Set the username.
                    obj.username = data.data.username; 

                    // Get the sessions that match the UUID. (There should be only one session per distinct login/uuid.)
                    let user_sessions = user.session;
                    for(let i_session=0; i_session<user_sessions.length; i_session+=1){
                        let session = user_sessions[i_session];
                        if(session.data.uuid == uuid){ obj.session.push(session); }
                    }
                    if(obj.session.length == 0){
                        console.log("ERROR: There is no session for this user and uuid.");
                        throw "ERROR: There is no session for this user and uuid.";
                        return; 
                    }
                    else if(obj.session.length > 1){
                        console.log("ERROR: There should only be one session per login/uuid.");
                        throw "ERROR: There should only be one session per login/uuid.";
                        return; 
                    }
                    else{
                        obj.session = obj.session[0];
                    }
                    
                    // Get the ws connections that match the UUID. 
                    let user_wss = user.ws;
                    for(let i_ws=0; i_ws<user_wss.length; i_ws+=1){
                        let ws = user_wss[i_ws];
                        if(ws.CONFIG.uuid == uuid){ obj.ws.push(ws); }
                    }

                    break;
                }
            }

            return obj;
        },

        // Get a data object with data matching the provided username. (All data/session/ws for the user.)
        getByUsername     : function(username){
            // If not found then return false.
            if(!this.data[username]){ return false; }

            // Return the whole userTrack userKey for the matching user. 
            return this.data[username];
        },

        // Remove data from userTrack.
        removeData: function(username, uuid){
            // Get the user.
            let user = this.data[username];

            // Remove sessions of this user that match the specified uuid.
            user.session = user.session.filter(session=> session.data.uuid != uuid );
            
            // Close and remove the ws connections for this user that are NOT open.
            user.ws = user.ws.filter(ws=>{ 
                if(ws.readyState == WebSocket.OPEN){ ws.close(); return false; }
                return true;
            });

            // Remove this uuid from this.uuids.
            this.uuids = this.uuids.filter(u=>u != uuid);

            // Remove this uuid from the user's uuids.
            user.uuids = user.uuids.filter(u=>u != uuid);

            // If the user has no more sessions or ws then delete the userKey.
            // console.log(`User: ${userKey} has ${user.session.length} sessions and ${user.ws.length} ws.`);
            if(user.session.length == 0 && user.ws.length == 0){ delete this.data[username]; }
        },

        // Remove ws entries that have a closed readystate.
        cleanOld: function(){
            for(let userKey in this.data){
                // Get the user data key.
                let user = this.data[userKey];

                // Remove closed WebSocket objects for this user.
                user.ws = user.ws.filter(ws=>{ return (ws.readyState == WebSocket.OPEN) });
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
                    socket.destroy();
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
        },
        TEXT:{
            JSGAME_connections:{
                GET_ALL_CLIENTS:async function(ws, data){ 
                    ws.send( JSON.stringify( {mode:"GET_ALL_CLIENTS", data:_MOD.ws_funcs.getAllClients()} ) );
                },
            },
        },
    },
    ws_funcs:{
        // Provide uuids and the websockets associated to them will be sent the specified message.
        sendToList: function(uuids, data){
            let ws_objs = [];
            for(let uuid of uuids){
                let user = _MOD.userTrack.getByUuid(uuid);
                ws_objs.push(...user.ws);
            }
            console.log("sendToList:", ws_objs.length);
            for(let i=0; i<ws_objs.length; i+=1){
                ws_objs[i].send(data);
            }
       },
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

            // Remove any old data from userTrack.
            _MOD.userTrack.cleanOld();
        },
        el_error  : function(ws, event){ 
            console.log("WebSockets Server: ERROR  :", ws.CONFIG.uuid, event);
            ws.close(); 

            // Remove any old data from userTrack.
            _MOD.userTrack.cleanOld();
        },
    },

    initWss: function(){
        // Websockets config:
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
        _MOD.ws.on("connection", function connection(ws, request, client){
            // LOBBY
            if( request.url == "/LOBBY"){
                // Create the userTrack object if it does not exist.
                if(!_MOD.userTrack.getByUsername(request.session.data.username)){
                    _MOD.userTrack.addNewUser(request.session.data.username);
                }

                // Add this data to userTrack.
                _MOD.userTrack.addToExistingUser(request.session.data.username, request.session, ws);

                // Remove any old data from userTrack.
                _MOD.userTrack.cleanOld();

                // Add the CONFIG object to this ws object. 
                ws.CONFIG = {
                    uuid: request.session.data.uuid,
                    session: request.session.data,
                    subscriptions : [],
                    multiplayerData: {
                        host_uuid    : [], // Host within shared app.
                        client_uuids : [], // Peers of host within shared app.
                        isHost       : false, // Used only by host.
                        isInSharedApp: false, // Used by host/client.
                        allowAudio   : false, // Allows the reception of audio from other clients. 
                        allowVideo   : false, // Allows the reception of video from other clients. 
                        loadedAppKey : request.session.data.loadedAppKey,
                    },
                };

                // CONNECT MESSAGE.
                console.log("WebSockets Server: CONNECT:", ws.CONFIG.type, request.session.data.uuid);

                // Indicate that the connection is open and ready.
                ws.send(JSON.stringify( {"mode":"NEWCONNECTION", data:request.session.uuid } ));
                
                // SEND THE NEW CONNECTION MESSAGE.
                ws.send(JSON.stringify( {"mode":"WELCOMEMESSAGE", data:`WELCOME TO JSGAME (LOBBY).`} ));

                // Announce the new connection.
                _MOD.ws_funcs.sendToAll( JSON.stringify( {mode:"LOBBY_CLIENT_NEW", data:[ws.CONFIG.session.username]} ) );

                // console.log(_MOD.userTrack.getByUuid(request.session.data.uuid));

                // ADD EVENT LISTENERS.
                ws.addEventListener('message', (event)=>_MOD.ws_events.el_message(ws, event) );
                ws.addEventListener('close'  , (event)=>_MOD.ws_events.el_close  (ws, event) );
                ws.addEventListener('error'  , (event)=>_MOD.ws_events.el_error  (ws, event) );
            }
        });
    },
};

module.exports = _MOD;