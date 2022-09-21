_APP.lobby.lobby = {
    parent: null,
    DOM: {},
};
_APP.lobby.room = {
    parent: null,
    DOM: {},
    currentRoomId: "",
    roomData: {
        room   : {},
        clients: [],
    },


    // WS: RECV: Populates the list of available chat rooms.
    recv_populateGlobalRooms: function(data){
        let old_tbody = this.DOM["lobby_globalTable"].querySelector("tbody");
        let new_tbody = document.createElement('tbody');

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
    // WS: RECV: Adds to the current room members display.
    recv_newMembers:function(data=false){
        // console.log("recv_newMembers:", data);

        // Loop through the new members data.
        for(let i=0; i<data.length; i+=1){
            // Determine if the new member is already in the client list. 
            let existingClient = this.roomData.clients.find(d => d.username == data[i].username && d.uuid == data[i].uuid);

            // If the new client is NOT in the roomData.clients list then add it.
            if(!existingClient){
                // console.log("New member is NOT on the client's list. Adding.");
                this.roomData.clients.push({
                    username: data[i].username,
                    uuid    : data[i].uuid
                });
            }
        }

        // Redraw the members div with data from roomData.clients.
        let frag1 = document.createDocumentFragment();
        for(let i=0; i<this.roomData.clients.length; i+=1){
            let div = document.createElement("div");
            let span1 = document.createElement("span");
            span1.classList.add("lobby_members_item");
            span1.innerText = this.roomData.clients[i].username;
            span1.setAttribute("uuid", this.roomData.clients[i].uuid);
            span1.title = `${this.roomData.clients[i].username} : ${this.roomData.clients[i].uuid}`;
            div.append(span1);
            frag1.append(div);
        }
        
        // Clear the members div and update the contents with the fragment.
        this.DOM["members"].innerHTML = "";
        this.DOM["members"].append(frag1);
        // this.parent.nav.showOneView("room");
    },
    // WS: RECV: Populates room data.
    recv_joinRoom:function(roomData){
        // console.log("joinRoom:", roomData);

        // Save the roomData.
        this.roomData = roomData;

        // Update the room display data.
        this.DOM["chat_title"].innerText = this.roomData.room.roomTitle;
        this.DOM["chat_title"].title     = `roomId: ${this.roomData.room.roomId}`;

        // Clear any existing message rows. 
        Array.from(this.DOM["messages_table"].querySelector("tbody").rows).forEach( tr => tr.remove() );

        this.addChatMessagesDom(this.roomData.room.chatHistory);

        // Clear the members list. 
        this.DOM["members"].innerHTML = "";

        // Populate the members list. 
        this.recv_newMembers(this.roomData.clients);

        // Show the room tab.
        this.parent.nav.showOneView("room");
    },
    // WS: RECV: Receive chat message to room and display it.
    recv_CHAT_ROOM_MESSAGE: function(roomId, msgObj){
        // console.log("recv_CHAT_ROOM_MESSAGE:", roomId, msgObj, this.DOM.messages);

        if(this.roomData.room.roomId != roomId){
            console.log("recv_CHAT_ROOM_MESSAGE:", `Received message but not for the current chat room.`, data);
            return; 
        }

        // Update the messages display within the room.
        this.addChatMessagesDom(msgObj);
    },
    // WS: SEND: Send chat message to the room.
    send_CHAT_ROOM_MESSAGE: function(ev){
        // Get the message value.
        let message = ev.target.value;

        // Clear the message input.
        ev.target.value = "";

        // Send the roomId and message to the server. 
        _APP.net.ws.activeWs.send(JSON.stringify({ mode:'CHAT_ROOM_MESSAGE', data:{roomId:this.roomData.room.roomId, message:message }}));

        // Add the message to the messages display. (Server doesn't send the new message to the client that send it.)
        let msgObj = {
            r: this.roomData.room.roomId,
            u: _APP.lobby.login.loginData.username, 
            d: (new Date().getTime()), 
            m: message
        };
        this.addChatMessagesDom([msgObj]);
    },

    // Adds the new message(s) to the room.
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

    _ws: {
        parent: null,

        // LOBBY. Functions for receiving data (by key, type, mode.)
        handlers: {
            JSON:{
                JSGAME_lobby_rooms: {
                    // Get the list of global rooms.
                    GET_GLOBAL_ROOMS: async function(data){ 
                        // console.log("*lobby: .ws:", "MODE:", data.mode, ", DATA:", data.data); 

                        // Populate the lobby rooms table.
                        this.recv_populateGlobalRooms(data.data);
                    },
                    // When joining a room.
                    JOIN_ROOM: async function(data){ 
                        // console.log("*lobby: .ws:", "MODE:", data.mode, ", DATA:", data.data); 

                        // Populate the lobby rooms table.
                        this.recv_joinRoom(data.data);
                    },
                    // For when a new client has joined the join.
                    NEW_MEMBER: async function(data){ 
                        // console.log("*lobby: .ws:", "MODE:", data.mode, ", DATA:", data.data); 

                        // Adds to the room member's list.
                        this.recv_newMembers(data.data);
                    },
                    // TODO: New lobby connection. Perhaps a friend? 
                    LOBBY_CLIENT_NEW: async function(data) { 
                        // console.log("lobby: .ws:", "MODE:", data.mode, ", DATA:", data.data); 
                    },
                    CHAT_ROOM_MESSAGE: async function(data){
                        // console.log("lobby: .ws:", "MODE:", data.mode, ", DATA:", data.data); 
                        this.recv_CHAT_ROOM_MESSAGE(data.data.roomId, data.data.msgObj);
                    },
                }
            },
            TEXT:{},
        }, 
        init: function(){
            return new Promise(async (resolve,reject)=>{
                // Websockets config:
                await this.parent.parent.ws.addWsModes(this);
                resolve();
            });
        }

    },
    init: function(configObj){
        return new Promise(async (resolve,reject)=>{
            // Save the DOM strings. 
            this.DOM = configObj.DOM;
            
            // Set parent(s).
            this._ws.parent = this;

            // Parse the DOM strings into elements. 
            this.parent.parent.shared.parseObjectStringDOM(this.DOM, true);

            // Event listeners.
            this.DOM["send"].addEventListener("keyup", (ev)=>{ if(ev.key=='Enter'){ this.send_CHAT_ROOM_MESSAGE(ev); } }, false);

            // Config Websockets modes.
            this._ws.init();

            resolve();
        });
    }
};