const fs = require('fs');
// const path = require('path');
const os   = require('os');
const WSServer = require('ws').WebSocketServer;

let _APP = null;

let _MOD = {
    moduleLoaded: false,

    ws:null,
    subscriptionKeys: [
        "TEST"
    ],

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
                    _APP.consolelog("DISABLED IN CONFIG", 2);
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
        _MOD.ws = new WSServer({ server: _APP.server }); 
    },

    ws_readyStates:{
        "0":"CONNECTING",
        "1":"OPEN",
        "2":"CLOSING",
        "3":"CLOSED",
        "CONNECTING":0,
        "OPEN"      :1,
        "CLOSING"   :2,
        "CLOSED"    :3,
    },

    ws_utilities: {
        // Generate and return a uuid v4.
        uuidv4: function() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        },
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
            JSGAME_:{
            },
            tests:{
                ECHO:  async function(ws, data){ 
                    ws.send( JSON.stringify({mode:"ECHO", data:data.data}) );
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
                    let clients = [];
                    _MOD.ws.clients.forEach(function each(ws) { 
                        if (ws.readyState === _MOD.ws_readyStates.OPEN) {
                            clients.push(ws.CONFIG);
                        }
                    });

                    _MOD.funcs.sendToAll( JSON.stringify( {mode:"GET_ALL_CLIENTS", data:clients} ) );
                },
            },
            connectivity: {
            },
        },
        TEXT:{
            JSGAME_:{
            },
            tests:{
                GET_ALL_CLIENTS:async function(ws, data){ 
                    let clients = [];
                    _MOD.ws.clients.forEach(function each(ws) { 
                        if (ws.readyState === _MOD.ws_readyStates.OPEN) {
                            clients.push(ws.CONFIG);
                        }
                    });
                    ws.send( JSON.stringify( {mode:"GET_ALL_CLIENTS", data:clients} ) );
                },
            },
            connectivity: {
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
                if (ws.readyState === _MOD.ws_readyStates.OPEN) {
                    ws.send(data); 
                }
            });
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
            console.log("WebSockets Server: CLOSE  :", ws.CONFIG.type.padEnd(7, " "), ws.CONFIG.uuid);
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
            console.log("WebSockets Server: ERROR  :", ws.CONFIG.type.padEnd(7, " "), ws.CONFIG.uuid, event);
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
        _MOD.ws.on("connection", function connection(ws, res){
            // What type of connection is this? 
            
            // LOBBY
            if( res.url == "/LOBBY"){
                // GENERATE A UNIQUE ID FOR THIS CONNECTION. 
                ws.id = _MOD.ws_utilities.uuidv4().toUpperCase();

                // Add the config object to this ws object. 
                ws.CONFIG = {};
                
                // ADD THE SUBSCRIPTIONS ARRAY TO THIS CONNECTION. 
                ws.subscriptions = [];

                // AUTO-ADD SOME SUBSCRIPTIONS. 
                // _MOD.ws_utilities.addSubscription(ws, "STATS1");
                // _MOD.ws_utilities.addSubscription(ws, "STATS2");

                // Save this data to the ws for future use.
                ws.CONFIG.uuid = ws.id; 
                ws.CONFIG.type = "LOBBY"; 
                ws.CONFIG.num = userCount ++; 

                console.log("WebSockets Server: CONNECT:", ws.CONFIG.type.padEnd(7, " "), ws.CONFIG.uuid);

                // SEND THE UUID.
                ws.send(JSON.stringify( {"mode":"NEWCONNECTION", data:ws.id } ));
                
                // SEND THE NEW CONNECTION MESSAGE.
                ws.send(JSON.stringify( {"mode":"WELCOMEMESSAGE", data:`WELCOME TO JSGAME (LOBBY).`} ));

                // ADD EVENT LISTENERS.
                ws.addEventListener('message', (event)=>_MOD.ws_events.el_message(ws, event) );
                ws.addEventListener('close'  , (event)=>_MOD.ws_events.el_close  (ws, event) );
                ws.addEventListener('error'  , (event)=>_MOD.ws_events.el_error  (ws, event) );
            }
        });
    },

};

module.exports = _MOD;