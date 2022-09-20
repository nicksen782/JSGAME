let _APP = null;

let _MOD = {
    moduleLoaded: false,

    // Init this module.
        module_init: async function(parent){
        return new Promise(async (resolve,reject)=>{
            if(!_MOD.moduleLoaded){
                // Save reference to the parent module.
                _APP = parent;
        
                _APP.consolelog("Plug-in: Lobby", 2);
                _APP.consolelog("Get reference to userTrack", 4);
                _MOD.userTrack = _APP.m_websocket_node.userTrack;

                _APP.consolelog("Get reference to ws_funcs", 4);
                _MOD.ws_funcs = _APP.m_websocket_node.ws_funcs;

                _APP.consolelog("Poulate global room data", 4);
                _MOD.lobby_populateGlobalRoomData();
                
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

        // ************
        // HTTP routes. 
        // ************

        _APP.consolelog("Add ws route data", 4);
        
        let keys = Object.keys(this.ws_event_handlers);

        // For each key ("JSON", "TEXT") within ws_event_handlers...
        for(let key0 of keys){
            
            // For each key within ("JSON", "TEXT")...
            for(let key1 in this.ws_event_handlers[key0]){
                
                // For each entry within the subkey...
                for(let key2 in this.ws_event_handlers[key0][key1]){
                    _APP.consolelog(`${key0}: ${key1}: ${key2}`, 6);
                    
                    // Create the subkey in allowedMessageTypes if it does not exist. 
                    if(!_APP.m_websocket_node.allowedMessageTypes[key0][key1]){ 
                        _APP.m_websocket_node.allowedMessageTypes[key0][key1] = []; 
                    }
    
                    // Create the subkey in ws_event_handlers if it does not exist. 
                    if(!_APP.m_websocket_node.ws_event_handlers[key0][key1]){
                        _APP.m_websocket_node.ws_event_handlers[key0][key1] = {};
                    }
                    
                    // Add to allowedMessageTypes.
                    _APP.m_websocket_node.allowedMessageTypes[key0][key1].push(key2);

                    // Add to handlers.
                    _APP.m_websocket_node.ws_event_handlers[key0][key1][key2] = 
                    this.ws_event_handlers[key0][key1][key2].bind(this.parent);
                }
            }
        }

    },

    // "local" reference to m_websocket_node.userTrack.
    userTrack:{},

    // "local" reference to m_websocket_node.userTrack.
    ws_funcs : {},

    lobby_rooms:[],
    lobby_populateGlobalRoomData: function(){
        // Populate the default general chat room(s).
        _MOD.lobby_rooms = [
            {
            roomId: "GENERAL_CHAT_1",
            roomTitle: "General chat1",
            hoverTitle: "General chat1",
            chatHistory: [
                {u:"SYSTEM", d:(new Date().getTime()), m:"GC1: first line  - Test chat history"},
                {u:"SYSTEM", d:(new Date().getTime()), m:"GC1: second line - Test chat history. This will be a much larger line that should wrap. What will happen when it wraps? Take a look!"},
                {u:"SYSTEM", d:(new Date().getTime()), m:"GC1: third line  - Test chat history\nnext line\nline after that."},
            ],
            },
            {
                roomId: "GENERAL_CHAT_2",
                roomTitle: "General chat2",
                hoverTitle: "General chat2",
                chatHistory: [
                    {u:"SYSTEM", d:(new Date().getTime()), m:"GC2: first line  - Test chat history"},
                    {u:"SYSTEM", d:(new Date().getTime()), m:"GC2: second line - Test chat history"},
                    {u:"SYSTEM", d:(new Date().getTime()), m:"GC2: third line  - Test chat history"},
                ],
            }
        ];
        
        // Create a room for each app within apps.json.
        for(let key in _APP.m_config.apps){
            let app = _APP.m_config.apps[key];
            _MOD.lobby_rooms.push({
                roomId     : `${app.displayName} chat`,
                roomTitle  : `(APP): ${app.displayName}`,
                hoverTitle : `${app.desc}`,
                chatHistory: [
                    {u:"SYSTEM", d:(new Date().getTime()), m:`Welcome to "${app.displayName}" chat.`},
                ],
            });
        }

    },
    lobby_getRoomMembers: function(roomId){
        // _MOD.userTrack.data;
        let data = [];
        for(let userKey in _MOD.userTrack.data){
            // Get the user data key.
            let user = _MOD.userTrack.data[userKey];

            // Go through all ws connections. Read the CONFIG. Look for matching currentRoomId.
            let user_wss = user.ws;
            for(let i_ws=0; i_ws<user_wss.length; i_ws+=1){
                if(user_wss[i_ws].CONFIG.currentRoomId == roomId){
                    data.push({
                        username: user_wss[i_ws].CONFIG.session.username,
                        uuid    : user_wss[i_ws].CONFIG.uuid,
                    });
                }
            }
        }
        return data;
    },
    // Provides data on all global rooms but without chatHistory.
    lobby_getGlobalRooms: function(){
        let data = [];
        for(let i=0; i<_MOD.lobby_rooms.length; i+=1){
            // Get a count of how many clients are in this room.
            let clients = _MOD.lobby_getRoomMembers(_MOD.lobby_rooms[i].roomId);
            // console.log(clients);

            data.push({
                roomId     :_MOD.lobby_rooms[i].roomId, 
                roomTitle  :_MOD.lobby_rooms[i].roomTitle, 
                hoverTitle :_MOD.lobby_rooms[i].hoverTitle, 
                // clients    :_MOD.lobby_rooms[i].clients.length, 
                clients    : clients.length, 
                chatHistory: [], //_MOD.lobby_rooms[i].chatHistory, 
            });
        }
        return data;
    },

    ws_event_handlers:{
        JSON:{
            JSGAME_lobby_rooms:{
                JOIN_ROOM:  async function(ws, data){ 
                    // console.log("mode:", data.mode, ", data:", data.data);

                    let roomId = data.data;
                    let room = _MOD.lobby_rooms.find(r=>r.roomId==roomId);
                    if(room){
                        // Get the username for this user.
                        let username = ws.CONFIG.session.username;
                        
                        // Set this client's roomId.
                        ws.CONFIG.currentRoomId = room.roomId;

                        // Get the clients connected to this room (including this client). 
                        let clients = _MOD.lobby_getRoomMembers(roomId);

                        // Send the client the room data.
                        let obj1 =  {
                            mode: "JOIN_ROOM", 
                            data: { 
                                room   : room, 
                                clients: clients 
                            } 
                        };
                        ws.send( JSON.stringify(obj1) );

                        // Inform all clients of the room of the new member.
                        let obj2 = { 
                            mode:"NEW_MEMBER", 
                            data: [{
                                username: username, 
                                uuid    : ws.CONFIG.uuid, 
                            }]
                        };
                        // Don't include this client in the list or else it will end up being added twice.
                        let uuids = clients.map(u=>u.uuid).filter(u=>u != ws.CONFIG.uuid);
                        _MOD.userTrack.sendToList(uuids, JSON.stringify(obj2));
                    }
                    else{
                        console.log(`ERROR: roomId: ${data.data.roomId} not found.`);
                    }
                },
                CHAT_ROOM_MESSAGE:  async function(ws, data){ 
                    console.log("mode:", data.mode, ", data:", data.data);

                    // Break out the roomId and message. 
                    let roomId = data.data.roomId;
                    let message = data.data.message;

                    // Create the message object. 
                    let msgObj = {
                        r: roomId,
                        u: ws.CONFIG.session.username, 
                        d: (new Date().getTime()), 
                        m: message
                    };

                    // Get the room object.
                    let room = _MOD.lobby_rooms.find(r=>r.roomId==roomId);

                    // Add the message to the chatHistory.
                    room.chatHistory.push(msgObj);

                    // Get the clients connected to this room (including this client). 
                    let clients = _MOD.lobby_getRoomMembers(roomId);

                    // Break out the uuids. Do not include this client in the list. 
                    // let uuids = clients.map(u=>u.uuid).filter(u=>u != ws.CONFIG.uuid);

                    // Break out the uuids. Include the client in the list. 
                    let uuids = clients.map(u=>u.uuid);

                    // Send the message to each client in the room.
                    let obj = {
                        mode:"CHAT_ROOM_MESSAGE", 
                        data: { 
                            roomId: roomId, 
                            msgObj: [msgObj],
                        }
                    };
                    _MOD.userTrack.sendToList(uuids, JSON.stringify(obj));
                },
            },
            JSGAME_lobby:{
                // UPDATE_USERDATA_KEY:  async function(ws, data){ 
                //     // Only allow updates to certain keys within the whitelist.
                //     let updates = [];
                //     let keys_whitelist = [
                //         "name", "handle"
                //     ];
                //     for(let i=0; i<data.data.length; i+=1){
                //         let key   = data.data[i].key;
                //         let value = data.data[i].value;
                //         // console.log(`DEBUG: key: ${key}, value: ${value}`);

                //         if(keys_whitelist.indexOf(key) != -1){
                //             console.log(`UPDATED: key: ${key}, value: ${value}`);
                            
                //             // Add to the list of updates. 
                //             updates.push( { key  :key, value:value, uuid :ws.CONFIG.uuid } );

                //             // Update the user's key in the ws object.
                //             ws.CONFIG[key] = value;
    
                //             // TODO
                //             // If this is a login-type key then update the user's data in the database as well.
                //             //
                //         }
                //         else{
                //             console.log(`NOT UPDATING. INVALID KEY: key: ${key}, value: ${value}`);
                //         }
                //     }

                //     if(updates.length){
                //         // Send this update to all clients so that they can also update their copy of the data.
                //         let obj = {
                //             mode: "UPDATE_USERDATA_KEY", 
                //             data: updates
                //         };
                //         _MOD.funcs.sendToAll( JSON.stringify( obj ) );
                //     }
                // },
                // CHAT_MSG_TO_ALL:  async function(ws, data){ 
                //     let prefix;
                //     if     (ws.CONFIG.name)  { prefix = ws.CONFIG.name; }
                //     else if(ws.CONFIG.handle){ prefix = ws.CONFIG.handle; }
                //     else                     { prefix = `USER_${ws.CONFIG.num.toString().padStart(3, "0")}`; }
                //     _MOD.funcs.sendToAll( JSON.stringify( {mode:"CHAT_MSG_TO_ALL", data:prefix + ": " + data.data} ) );
                // },
                // UPDATE_MY_DETAILS: async function(ws, data){ 
                //     ws.CONFIG.name   = data.data.name;
                //     ws.CONFIG.handle = data.data.handle;
                //     _MOD.funcs.sendToAll( JSON.stringify( {mode:"GET_ALL_CLIENTS", data:_MOD.funcs.getAllClients()} ) );
                // },
            },
            tests:{
                // ECHO:  async function(ws, data){ 
                //     ws.send( JSON.stringify({mode:"ECHO", data:data.data}) );
                // },
            },
        },
        TEXT:{
            JSGAME_lobby_rooms:{
                GET_GLOBAL_ROOMS: async function(ws){ 
                    // console.log("mode:", "GET_GLOBAL_ROOMS");
                    let data = _MOD.lobby_getGlobalRooms();
                    let obj = { mode:"GET_GLOBAL_ROOMS",  data:data };
                    ws.send( JSON.stringify( obj ) );
                },
            },
        },
    },
};

module.exports = _MOD;