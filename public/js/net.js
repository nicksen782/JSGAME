_APP.net = {
    parent: null,

    http:{
        parent: null,
    
        // Can use either "GET" or "POST" and type of either "json" or "text".
        send: async function(url, userOptions, timeoutMs=5000){
            return new Promise(async (resolve,reject)=>{
                // Set default values if the value is missing.
                if(!userOptions || typeof userOptions != "object"){ userOptions = {}; }
                if(!userOptions.method){ userOptions.method = "POST"; }
                if(!userOptions.type)  { userOptions.type = "json"; }
    
                // Set method.
                method = userOptions.method.toUpperCase();
                let options = {
                    method: userOptions.method, 
                    headers: {},
                };
    
                // Set body?
                switch(userOptions.method){
                    case "GET": { break; }
                    case "POST": { if(userOptions.body) { options.body = JSON.stringify(userOptions.body); } break; }
                    default : { throw "ERROR: INVALID METHOD: " + method; resolve(false); return; break; }
                }
    
                // Set headers.
                switch(userOptions.type){
                    case "json": { 
                        options.headers = { 
                            'Accept': 'application/json', 
                            'Content-Type': 'application/json' 
                        };
                        break; 
                    }
                    case "text": { 
                        options.headers = { 
                            'Accept': 'text/plain', 
                            'Content-Type': 'text/plain' 
                        };
                        break;
                    }
                    default : { throw "ERROR: INVALID TYPE: " + userOptions.type; resolve(false); return; break; }
                };
    
                // Setup an AbortController to control the timeout length of the request.
                const controller = new AbortController();
                const id = setTimeout(() => controller.abort(), timeoutMs);
                options.signal = controller.signal;
                let aborted = false;
                
                // Make the request.
                let resp;
                try{
                    resp = await fetch(url, options )
                    .catch(e=>{ 
                        clearTimeout(id);
                        if(e.type=="aborted"){ aborted = true; resolve(e.type); return; }
                        throw e; 
                    });
    
                    if(!aborted){
                        clearTimeout(id);
                        if     (userOptions.type=="json"){ resp = await resp.json(); }
                        else if(userOptions.type=="text"){ resp = await resp.text(); }
                        resolve(resp); return;
                    }
                    else{
                        resolve(false); return;
                    }
                    
                }
                catch(e){
                    resolve(false); return;
                }
            });
        },
    
        // Ping the server.
        pingServer: async function(){
            return new Promise(async (resolve,reject)=>{
                // Set the status.
                this.parent.status.setStatusColor("pinging");
    
                // Generate the url of the server.
                let serverUrl = `` +
                    `${window.location.protocol == "https:" ? "https" : "http"}://` +
                    `${location.hostname}` + 
                    `${location.port ? ':'+location.port : ''}`
                ;
    
                // Make the request. 
                let options = { type:"text", method:"GET" };
                let resp = await this.send(serverUrl, options, 5000);
                resp = resp === false ? false : true;
    
                // Force a short wait.
                await new Promise(async (res,rej)=>{ setTimeout(function(){ res(); }, this.parent.ws.forcedDelay_ms); });
    
                // Reset to the previous status.
                this.parent.status.restorePrevStatusColor();
    
                // End.
                resolve(resp);
            });
        },
    
        init: function(parent){
            return new Promise(async (resolve,reject)=>{
                this.parent = parent;
                resolve();
            });
        },
    },

    ws:{
        parent:null,
        connecting:false,
        uuid:null,
        activeWs:null,
        wsArr:[],
        skipAutoReconnect         : false,
        autoReconnect             : true,
        autoReconnect_counter     : 0,
        autoReconnect_counter_max : 30,
        autoReconnect_id          : false,
        autoReconnect_ms          : 2000,
        forcedDelay_ms            : 100,
        connectivity_status_update_ms : 5000,
    
        ws_event_handler:{
            parent: null,

            allowedMessageTypes: {
                JSON:{
                    init: ["NEWCONNECTION","WELCOMEMESSAGE"],
                },
                TEXT:{
                    connectivity: ["PING","PONG"],
                },
            },
            handlerLookup: function(mode, type){
                let keys = Object.keys(this.allowedMessageTypes[type]);
                for(let i=0; i<keys.length; i+=1){ if(this.allowedMessageTypes[type][keys[i]].indexOf(mode) != -1){ return keys[i]; } }
                return false;
            },

            handlers:{
                JSON:{
                    init: {
                        NEWCONNECTION : async function(data) { 
                            console.log("MODE:", data.mode, ", DATA:", data.data); 

                            // Save the UUID.
                            _APP.net.ws.uuid = data.data;

                            // Display the UUID as a hover title on net_ws_status.
                            _APP.net.status.coloredElems.main.title = `UUID:  ${data.data}`;
                        },
                        WELCOMEMESSAGE: async function(data) { 
                            console.log("MODE:", data.mode, ", DATA:", data.data); 
                        },
                    },
                },
                TEXT:{
                    connectivity:{
                        PING: async function(data) { 
                            console.log("MODE:", data); 
                        },
                        PONG: async function(data) { 
                            console.log("MODE:", data); 
                        },
                    },
                },
            }
        },

        ws_events:{
            el_message: function(event){
                let data;
                let tests = { isJson: false, isText: false };

                // First, assume the data is JSON (verify this.)
                try{ data = JSON.parse(event.data); tests.isJson = true; }
                
                // Isn't JSON. Assume that it is text. 
                catch(e){ data = event.data; tests.isText = true; }
    
                // Handle JSON.
                if(tests.isJson){
                    // Find the event handler key.
                    let key = this.parent.ws_event_handler.handlerLookup(data.mode, "JSON");
                    if(!key){ 
                        console.log(`Handler key not found. (mode: '${data.mode}', type: 'JSON')`); 
                        console.log("UNKNOWN MODE:", data.mode, "JSON");
                        return; 
                    }
                    if(!this.parent.ws_event_handler.handlers.JSON[key]){
                        console.log(`Handler function key not found. (key: '${key}', mode: '${data.mode}', type: 'JSON').`); 
                        console.log("UNKNOWN MODE:", data.mode, "JSON");
                        return; 
                    }
                    if(!this.parent.ws_event_handler.handlers.JSON[key][data.mode]){
                        console.log(`Handler function not found. (key: '${key}', mode: '${data.mode}', type: 'JSON').`); 
                        console.log("UNKNOWN MODE:", data.mode, "JSON");
                        return; 
                    }

                    // Run the handler function. 
                    this.parent.ws_event_handler.handlers.JSON[key][data.mode](data); 
                }
    
                // Handle TEXT.
                else if(tests.isText){
                    // Find the event handler key.
                    let key = this.parent.ws_event_handler.handlerLookup(data, "TEXT");

                    if(!key){ 
                        console.log(`Handler key not found. (mode: '${data}', type: 'TEXT')`); 
                        console.log("UNKNOWN MODE:", data, "TEXT");
                        return; 
                    }
                    if(!this.parent.ws_event_handler.handlers.TEXT[key]){
                        console.log(`Handler function key not found. (key: '${key}', mode: '${data}', type: 'TEXT').`); 
                        console.log("UNKNOWN MODE:", data, "TEXT");
                        return; 
                    }
                    if(!this.parent.ws_event_handler.handlers.TEXT[key][data]){
                        console.log(`Handler function not found. (key: '${key}', mode: '${data}', type: 'TEXT').`); 
                        console.log("UNKNOWN MODE:", data, "TEXT");
                        return; 
                    }
    
                    // Run the handler function. 
                    this.parent.ws_event_handler.handlers.TEXT[key][data](data);
                }
            },
            el_close  : function( event){ 
                console.log("WebSockets Client: CLOSE  :");
                this.parent.parent.status.setStatusColor("disconnecting");
                
                // Make sure this ws connection is removed after a short delay. 
                setTimeout(()=>{
                    this.parent.parent.status.setStatusColor("disconnected");
                }, 1000);
            },
            el_error  : function(event){ 
                console.log("WebSockets Client: ERROR  :", event);
                this.parent.parent.status.setStatusColor("disconnecting");
                
                // Make sure this ws connection is removed after a short delay. 
                setTimeout(()=>{
                    this.parent.parent.status.setStatusColor("disconnected");
                }, 1000);
            },
            el_open  : function(event){ 
                // console.log("WebSockets Client: OPEN  :");
                this.parent.parent.status.setStatusColor("connected");
            },
        },

        // UTILITIES
        ws_utilities: {
            parent: null,
    
            // Start the WebSocket connection.
            initWss: async function(conf={}){
                return new Promise(async (resolve,reject)=>{
                    if(this.parent.connecting){ console.log("WS connection attempt already in progress."); resolve(false); return; }
    
                    // GENERATE THE WEBSOCKET URL.
                    let prePath = window.location.pathname.split("/");
                    prePath.pop(); 
                    prePath = prePath.join("/");
                    prePath = prePath.indexOf("/") != 0 ? ("/") : (prePath + "/");
                    let locUrl = `` +
                    `${window.location.protocol == "https:" ? "wss" : "ws"}://` +
                    `${window.location.hostname}` + 
                    `${window.location.port ? ':'+window.location.port : ''}` +
                    `${prePath}` +
                    `LOBBY`
                    ;
    
                    // Make sure that the server is up.
                    let isServerUp = await this.parent.parent.http.pingServer();
                    if(isServerUp === false) {
                        console.log("Server is unavailable");
                        resolve(false);
                        return; 
                    };
    
                    // Set the connection indicator.
                    this.parent.parent.status.setStatusColor("connecting");
    
                    // Close any existing connections. 
                    this.parent.ws_utilities.wsCloseAll();
    
                    // Create new WebSocket connection. 
                    this.parent.connecting = true;
    
                    // Force a short wait.
                    await new Promise(async (res,rej)=>{ setTimeout(()=>{ res(); }, this.parent.forcedDelay_ms); });
                    
                    let ws = new WebSocket(locUrl);
                    if(conf.open)   { console.log("Cannot set 'open' yet."); }
                    else{ ws.addEventListener("open",    (ev)=>this.parent.ws_events.el_open(ev), false)   ; }

                    if(conf.message){ console.log("Cannot set 'message' yet."); }
                    else{ ws.addEventListener("message", (ev)=>this.parent.ws_events.el_message(ev), false); }
                    
                    if(conf.close)  { console.log("Cannot set 'close' yet."); }
                    else{ ws.addEventListener("close",   (ev)=>this.parent.ws_events.el_close(ev), false)  ; }
                    
                    if(conf.error)  { console.log("Cannot set 'error' yet.");}
                    else{ ws.addEventListener("error",   (ev)=>this.parent.ws_events.el_error(ev), false)  ; }
                    
                    if(conf.binaryType){ console.log("Cannot set 'binaryType' yet."); }
                    else{ ws.binaryType = 'arraybuffer'; }
                    
                    this.parent.activeWs = ws;
    
                    // Add new to array of ws.
                    this.parent.wsArr.push(ws);
    
                    resolve(true);
                    return; 
                });
            },
            // Close all WebSocket connections. 
            wsCloseAll: function(){
                // Close existing. 
                if(this.parent.activeWs){
                    this.parent.activeWs.close();
                }
    
                // Close/reclose previous ws connections. 
                for(let i=0; i<this.parent.wsArr.length; i+=1){
                    if(this.parent.wsArr[i] && this.parent.wsArr[i].close){
                        this.parent.wsArr[i].close();
                    }
                }
            },
            
            // Timeout function for automatically reconnecting after a connection loss.
            autoReconnect_func: async function(){
                // Is autoReconnect disabled?
                if(!this.parent.autoReconnect){
                    this.parent.autoReconnect_counter = 0;
                    clearTimeout(this.parent.autoReconnect_id);
                    return; 
                }
    
                // Have we reached the max number of attempts? 
                if(this.parent.autoReconnect_counter > this.parent.autoReconnect_counter_max){
                    console.log(`  Reconntion has failed. Max number of attempts (${this.parent.autoReconnect_counter_max}) was reached. ((${(( (this.parent.autoReconnect_counter-1)*this.parent.autoReconnect_ms)/1000).toFixed(1)})) seconds`);
                    this.parent.autoReconnect_counter = 0;
                    clearTimeout(this.parent.autoReconnect_id);
                }
    
                // No. Try to connect.
                else{
                    // Increment the counter by 1.
                    this.parent.autoReconnect_counter += 1;
    
                    console.log(`  Reconnection attempt ${this.parent.autoReconnect_counter} of ${this.parent.autoReconnect_counter_max}`);
                    let resp = await this.parent.ws_utilities.initWss();
    
                    // Did the connection fail?
                    if(resp === false){
                        // If this was the last attempt then set the timeout delay to a smaller number.
                        if(this.parent.autoReconnect_counter >= this.parent.autoReconnect_counter_max){
                            this.parent.autoReconnect_id = setTimeout(()=>this.parent.ws_utilities.autoReconnect_func(), 100);
                        }
                        // Set the next attempt timeout.
                        else{
                            this.parent.autoReconnect_id = setTimeout(()=>this.parent.ws_utilities.autoReconnect_func(), this.parent.autoReconnect_ms);
                        }
                    }
                    // The connection was successful.
                    else{
                        console.log(`  Reconnection successful (${((this.parent.autoReconnect_counter*this.parent.autoReconnect_ms)/1000).toFixed(1)} seconds)`);
                        this.parent.autoReconnect_counter = 0;
                        clearTimeout(this.parent.autoReconnect_id);
                    }
                }
    
            },
    
            //
            isWsConnected: function(){
                if(this.parent.activeWs){ return true; }
                return false;
            },
        },
    },

    status:{
        parent: null,
        inited: false,
        coloredElems: {}, // Populated via configObj.
        elems: {},        // Populated via configObj.
        previousClass: "disconnected",
        classes: [
            "pinging",
            "connecting",
            "connected",
            "disconnecting",
            "disconnected",
        ],
        classes_text: [
            "Pinging",
            "Connecting",
            "Connected",
            "Disconnecting",
            "Disconnected",
        ],
        removeStatus: function(){
            // Remove the classes.
            let keys = Object.keys(this.coloredElems);
            for(let i=0; i<this.classes.length; i+=1){
                for(let j=0; j<keys.length; j+=1){
                    this.coloredElems[keys[j]].classList.remove( this.classes[i] );
                }
            }

            // Remove the text.
            this.elems.statusText.innerText = "";
        },
        getStatusColor: function(){
            // Get the active classes that are within the classes list.
            // NOTE: only check "statusSquare" because the other colored elems should have the same class anyway.
            let classes =  Array.from(this.coloredElems.statusSquare.classList).sort().filter(c => this.classes.indexOf(c) != -1 );
            
            // Return the classes. (there should only be one.)
            return classes[0];
        },
        setStatusColor: function(newClass=""){
            // Is this a valid class?
            if(this.classes.indexOf(newClass) == -1){
                console.log("Not a valid class", newClass, "Valid classes are:", this.classes);
                return; 
            }

            // Update the previous class.
            this.previousClass = this.getStatusColor();

            // Remove all classes on the elem first.
            this.removeStatus();

            // Set the new status.
            let keys = Object.keys(this.coloredElems);
            for(let j=0; j<keys.length; j+=1){
                this.coloredElems[keys[j]].classList.add( newClass );
            }

            // Set the status text.
            this.elems.statusText.innerText = this.classes_text[this.classes.indexOf(newClass)];
        },
        restorePrevStatusColor:function(){
            // Record the current class.
            let currentClass = this.getStatusColor();
            
            // Set the status indicator color back to it's previous value.
            this.setStatusColor(this.previousClass);

            // Update the previous class.
            this.previousClass = currentClass;
        },

        init: function(configObj){
            return new Promise(async (resolve,reject)=>{
                if(this.inited){ console.log("status object has already been inited."); return; }
                
                // Generate the DOM cache for each element.
                this.coloredElems = configObj.DOM.coloredElems;
                this.elems        = configObj.DOM.elems;
                _APP.shared.parseObjectStringDOM(this.coloredElems, false);
                _APP.shared.parseObjectStringDOM(this.elems, false);

                this.inited = true; 

                resolve();
            });
        },
    },

    init: async function(parent, configObj){
        return new Promise(async (resolve,reject)=>{
            this.parent         = parent;
            this.http                .parent = this;
            this.ws                  .parent = this;
            this.ws.ws_events        .parent = this.ws;
            this.ws.ws_event_handler .parent = this.ws;
            this.ws.ws_utilities     .parent = this.ws;
            this.status              .parent = this;

            // Init status.
            await this.status.init(configObj);
            
            resolve();
        });
    },
};