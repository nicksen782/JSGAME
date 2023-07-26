/**
 * Player 1 is always assigned the keyboard at key "p1". This player will get the first available gamepad index. 
 * Player 2 is always assigned the keyboard at key "p2". This player will get the second available gamepad index. 
 * Additional gamepads are ignored.
 */
INPUT = {};

_INPUT = {
    // Constant values.
    consts:{
        // NOTE: Button names and and bit positions are in the Uzebox format. (https://uzebox.org/wiki/Tips:Controller_Event_Handling)

        // List of buttons by name. 
        buttons: [
            "BTN_SR",
            "BTN_SL",
            "BTN_X",
            "BTN_A",
            "BTN_RIGHT",
            "BTN_LEFT",
            "BTN_DOWN",
            "BTN_UP",
            "BTN_START",
            "BTN_SELECT",
            "BTN_Y",
            "BTN_B",
        ],
    
        // Bit positions for each input button.
        bits: {
            "BTN_SR"     : 12, // BINARY: 0000100000000000
            "BTN_SL"     : 11, // BINARY: 0000010000000000
            "BTN_X"      : 10, // BINARY: 0000001000000000
            "BTN_A"      : 9,  // BINARY: 0000000100000000
            "BTN_RIGHT"  : 8,  // BINARY: 0000000010000000
            "BTN_LEFT"   : 7,  // BINARY: 0000000001000000
            "BTN_DOWN"   : 6,  // BINARY: 0000000000100000
            "BTN_UP"     : 5,  // BINARY: 0000000000010000
            "BTN_START"  : 4,  // BINARY: 0000000000001000
            "BTN_SELECT" : 3,  // BINARY: 0000000000000100
            "BTN_Y"      : 2,  // BINARY: 0000000000000010
            "BTN_B"      : 1,  // BINARY: 0000000000000001
        },
    },

    // The last "Official" states of up to 2 players. (BINARY)
    states:{
        "p1":{ "held":0, "_prev":0, "press":0, "release": 0 },
        "p2":{ "held":0, "_prev":0, "press":0, "release": 0 },
    },

    // Handle input from keyboard.
    keyboard: {
        parent: null, 

        // Temporary states for the keyboard (up to 2 players.) (BINARY)
        keyboardState:{ 
            "p1":{ "held":0 },
            "p2":{ "held":0 },
        },

        // Handles "keydown" and "keydown" events from the keyboard. Updates keyboardState.
        keyboardEvent: function(event){
            // Player 1 and 2.
            // Goal is to set the held value to either 0 or 1.
    
            // Look through the keyboard mappings for this event.code to find a button match for each player.
            let players = {
                "p1" : _INPUT.gamepadMappings.keyboard.p1.find( c => c.code == event.code),
                "p2" : _INPUT.gamepadMappings.keyboard.p2.find( c => c.code == event.code),
            };

            // Did neither player have a button match? Abort if so.
            if(!players.p1 && ! players.p2){ 
                // console.log("1: No matching event.code for either player.", event.code); 
                return; 
            }

            // Go through the list of player input.
            for(let pk in players){
                // Get the record for the matching player.
                let rec = players[pk];

                // Skip if there wasn't a record (event.code match) for this player.
                if(!rec){ 
                    // console.log("2: No matching event.code for this player.", pk, event.code); 
                    continue; 
                }

                // Set or unset the Matched key.
                if     (event.type == "keydown"){ this.keyboardState[pk].held |=  (1 << this.parent.consts.bits[rec.button]); } // Set the bit true.
                else if(event.type == "keyup"  ){ this.keyboardState[pk].held &= ~(1 << this.parent.consts.bits[rec.button]); } // Set the bit false.
            }
        },

        init: function(parent, listeningElems){
            // Set parent(s).
            this.parent = parent;

            // Create listeningElems for keyboard event listeners.
            this.listeningElems = [...listeningElems];

            // Add the keyboard event listeners to the listeningElems.
            for(let elem of this.listeningElems){
                elem.addEventListener('keyup'   , (ev)=>{ this.keyboardEvent(ev); } , true);
                elem.addEventListener('keydown' , (ev)=>{ this.keyboardEvent(ev); } , true);
            }
        },
    },
    
    // Handle input from gamepad.
    gamepad: {
        parent: null, 

        // Holds the list of added gamepads and the mapping data for each.
        gp_list:[],

        // Temporary states for the gamepad (up to 2 players.) (BINARY)
        gamepadState:{ 
            p1:{ held:0 },
            p2:{ held:0 },
        },

        //
        getUserGpMappings_localStorage:function(){
            // Get the mappings from local storage.
            let jsonText = localStorage.getItem("JSGAMEv2_userGamepadMappings");

            // Use the default if the key was not populated.
            if(!jsonText){ jsonText = '{"ids":[],"maps":{}}'; }
            
            // Try to parse the JSON
            let json;
            try{ json = JSON.parse(jsonText); }

            // JSON parsing is failed. Set default values. 
            catch(e){ json = { "ids":[], "maps":{} }; }

            // Return the data.
            return json;
        },

        //
        setUserGpMappings_localStorage:function(){
            // localStorage.removeItem("JSGAMEv2_userGamepadMappings");
            localStorage.setItem( "JSGAMEv2_userGamepadMappings", JSON.stringify(_INPUT.gamepadMappings.user) );
        },

        // Generates a key based on the gamepad.id value. (Will be the same in Chrome and Firefox.)
        generateGamepadKey : function(gamepad){
            // Get the vendor and product id.
            let ff_id = gamepad.id.split("-").map(function(d,i,a){ return d.trim();} );
            let cr_id = gamepad.id.split(":").map(function(d,i,a){ return d.trim();} );
            let vendor   = "";
            let product  = "";
            let name     = "";
            let map_key2 = [];
            let axesLen    = gamepad.axes.length;
            let buttonsLen = gamepad.buttons.length;
    
            // Is this a Firefox id string?
            if(ff_id.length==3){
                vendor  = ff_id[0].trim();
                product = ff_id[1].trim();
                name    = ff_id[2].trim();
            }

            // Is this a Chrome id string?
            else if(cr_id.length==3){
                // Need to clean up the string first.
                name    = cr_id[0].split("(")[0]       .trim();
                vendor  = cr_id[1].split(" Product")[0].trim();
                product = cr_id[2].split(")")[0]       .trim();
            }

            // Android with Chrome/Opera with bluetooth gamepad? The id is only expected to include a name.
            else {
                // Need to clean up the string first.
                name    = gamepad.id ;
                vendor  = "" ;
                product = "" ;
            }
    
            // Create map_key2.
            if(name)      { map_key2.push(`(N:${name})`                  ); }
            if(axesLen)   { map_key2.push(`(A:${gamepad.axes.length})`   ); }
            if(buttonsLen){ map_key2.push(`(B:${gamepad.buttons.length})`); }
            if(vendor)    { map_key2.push(`(V:${vendor})`                ); }
            if(product)   { map_key2.push(`(P:${product})`               ); }
            map_key2 = map_key2.join(":");

            return {
                "name"   : name   ,
                "mapKey2": map_key2,
                "id"     : gamepad.id,
            };
        },

        // Tries to find and return mapping data for the gamepad.
        findMapping: function(gamepad){
            let idRec;
            let gp_mapKeyData = this.generateGamepadKey(gamepad);

            // Look through user-created maps.
            idRec = this.parent.gamepadMappings.user.ids.find(i=>i.genName == gp_mapKeyData.mapKey2);
            if(idRec){
                let obj = { 
                    idRec        : Object.assign({}, idRec), 
                    mapRec       : Object.assign({}, this.parent.gamepadMappings.user.maps[idRec.mapKey]), 
                    gp_mapKeyData: gp_mapKeyData, 
                    foundBy      : "id-user" 
                };
                return obj;
            }
            
            // Look through the built-in internal maps.
            idRec = this.parent.gamepadMappings.internal.ids.find(i=>i.genName == gp_mapKeyData.mapKey2);
            if(idRec){
                let obj = { 
                    idRec        : Object.assign({}, idRec), 
                    mapRec       : Object.assign({}, this.parent.gamepadMappings.internal.maps[idRec.mapKey]), 
                    gp_mapKeyData: gp_mapKeyData, 
                    foundBy      : "id-internal" 
                };
                return obj;
            }

            // Mapping not found.
            return { idRec:{}, mapRec: {}, gp_mapKeyData: gp_mapKeyData, foundBy: "" };
        },

        // Creates new object in gp_list with the gamepad and the button mapping data.
        addGamepad: function(gamepad){
            // Try to find and existing button mapping for the gamepad. 
            let mapObj = this.findMapping(gamepad);

            let canAddGamepad = function(){
                let available_playerKeys = ["p1","p2"];
                let used_playerKeys = [];
                for(let rec of _INPUT.gamepad.gp_list){ used_playerKeys.push(rec.data.playerKey); }
                used_playerKeys = new Set(used_playerKeys);
                return available_playerKeys.filter( x=> ! used_playerKeys.has(x) );
            };
            let availablePlayerKeys = canAddGamepad();

            if(!availablePlayerKeys.length){
                // console.log(`ERROR: Only two gamepads can be connected. ${mapObj.gp_mapKeyData.id}`);
                return; 
            }

            let gamepadData = {
                gamepad: gamepad,
                data : {
                    mapObj     : mapObj, 
                    playerKey: availablePlayerKeys[0],
                }
            };

            console.log("Adding connected gamepad     :", "index:", gamepadData.gamepad.index, ", playerKey:", gamepadData.data.playerKey, ", mapKey2:", gamepadData.data.mapObj.gp_mapKeyData.mapKey2);
            // Add the completed data entry.
            this.gp_list.push(gamepadData);
        },

        // Polls for each gamepad and updates gamepadState.
        pollAndUpdate: function(){
            // Poll for the gamepad state.
            let gamepads;
            if     (navigator.getGamepads)      { gamepads = navigator.getGamepads(); }
            else if(navigator.webkitGetGamepads){ gamepads = navigator.webkitGetGamepads(); }
            else{ gamepads = []; }
            
            // Remove "false-y" gamepad entries.
            gamepads = gamepads.filter(d=>d);

            // Are there new gamepads?
            for(let gp of gamepads){
                // Look for the gamepad. 
                let found = this.gp_list.find(g=>g.gamepad.index == gp.index) ;

                // If found then update it's gamepad object.
                if(found){ found.gamepad = gp; }

                // If not found then add it. 
                else{ this.addGamepad(gp); }
            }
            
            // Are there any now missing gamepads?
            for(let gp of this.gp_list){
                let stillThere = gamepads.find(g=>g.index == gp.gamepad.index) ;
                if(!stillThere){
                    console.log("Removing disconnected gamepad:", "index:", gp.gamepad.index, ", playerKey:", gp.data.playerKey, ", mapKey2:", gp.data.mapObj.gp_mapKeyData.mapKey2);

                    // Remove the displayed data for this lost gamepad.
                    //
                    
                    // Remove this gamepad from the list of gamepads. 
                    this.gp_list = this.gp_list.filter( g=> g.gamepad.index !=gp.gamepad.index );
                }
            }

            let tempState = {};
            let playerNum = 1
            for(let i=0, l=gamepads.length; i<l; i+=1){
                // 
                // if(!gamepads[i]) { playerNum+=1; continue; }
                if(!gamepads[i]) { continue; }
                
                let playerKey = "p"+(playerNum);
                tempState[playerKey] = {};

                // Does the index of this gamepad match any that we already may have?
                let gamepad = this.gp_list.find(g=>g.gamepad.index == gamepads[i].index);

                // YES?
                if(gamepad){
                    // Update the gamepad.
                    gamepad.gamepad = gamepads[i];
                    let activeMap = gamepad.data.mapObj.mapRec ;
                    if(!activeMap){ 
                        console.log("ERROR: No active map for this gamepad.", gamepad);
                        continue; 
                    }

                    for(let buttonKey in activeMap){
                        // Look at the value of this key. Break out the type, index, and onValue.
                        let splitString = activeMap[buttonKey].split(":");
                        let type    = splitString[0]; 
                        let index   = splitString[1]; 
                        let onValue = parseInt(splitString[2], 10); 
                        let typeStr = ( ()=>{
                            if(type=="A"){ return "axes"; }
                            if(type=="B"){ return "buttons"; }
                        })(); 
                        let gamepadValue;
                        if(type == "A"){ gamepadValue = Math.round( gamepad.gamepad[typeStr][index].toFixed(0) ); }
                        if(type == "B"){ gamepadValue = Math.round( gamepad.gamepad[typeStr][index].value.toFixed(0) ); }
                        if(gamepadValue >= -1 && gamepadValue <= 1){
                            // Set the value.
                            tempState[playerKey][buttonKey] = (gamepadValue == onValue) ? 1 : 0;
                        }
                        else{
                            console.log("ERROR: Invalid value for button:", buttonKey, gamepadValue);
                        }
                    }

                    // Convert back to binary and save.
                    this.gamepadState[playerKey] = { held: this.parent.util.stateObjToByte(tempState[playerKey]) };

                    // Increment the player number.
                    playerNum+=1;
                }
            }
        },

        init: function(parent, listeningElems){
            // Set parent(s).
            this.parent = parent;
        },
    },

    // Pre-init for the web config tools.
    web_pre: {
        parent: null, 

        // openConfigModal
        init: async function(parent){
            return new Promise(async (resolve, reject)=>{
                this.parent = parent;

                // Get the support files. 
                let proms = [
                    new Promise( async (res,rej) => { await _JSG.addFile({f:"shared/plugins/INPUT_A/inputModeA_user.js"    , t:"js"  , n:"inputModeA_user"         }, "."); res(); } ),
                    new Promise( async (res,rej) => { await _JSG.addFile({f:"shared/plugins/INPUT_A/inputModeA_mappings.js", t:"js"  , n:"inputModeA_mappings"     }, "."); res(); } ),
                    new Promise( async (res,rej) => { await _JSG.addFile({f:"shared/plugins/INPUT_A/inputModeA_web.html"   , t:"html", n:"JSG_inputModeA_web.html" }, "."); res(); } ),
                    new Promise( async (res,rej) => { await _JSG.addFile({f:"shared/plugins/INPUT_A/inputModeA_web.js"     , t:"js"  , n:"JSG_inputModeA_web.js"   }, "."); res(); } ),
                    new Promise( async (res,rej) => { await _JSG.addFile({f:"shared/plugins/INPUT_A/inputModeA_web.css"    , t:"css" , n:"JSG_inputModeA_web.css"  }, "."); res(); } ),
                ];
                await Promise.all(proms);

                // Add the HTML to the destination div.
                let div = document.createElement("div"); 
                div.id = "jsgame_inputDiv"; 
                div.classList.add("hide"); 
                div.innerHTML = _APP.files["JSG_inputModeA_web.html"];
                _JSG.DOM["jsgame_main_cont"].append(div);

                // Run the web init.
                await _INPUT.web.init();

                resolve();
            });
        },
    },

    init :async function(listeningElems){
        return new Promise(async (resolve,reject) => {
            _JSG.shared.timeIt.stamp("TOTAL_INIT_TIME", "s", "_INPUT_INITS"); 

            // Save the config.
            this.config = _JSG.loadedConfig.meta.jsgame_shared_plugins_config.inputModeA;

            // Inits.
            await this.web_pre.init(this);
            console.log(this);
            this.util.init(this);

            // Get the user gamepad mappings from localStorage.
            _INPUT.gamepadMappings.user = this.gamepad.getUserGpMappings_localStorage();

            // Use the keyboard? 
            if(this.config.useKeyboard){
                _JSG.shared.timeIt.stamp("INIT_KEYBOARD", "s", "_INPUT_INITS"); 
                this.keyboard.init(this, [...listeningElems]);
                _JSG.shared.timeIt.stamp("INIT_KEYBOARD", "e", "_INPUT_INITS"); 
            }
    
            // Use gamepad(s)?
            if(this.config.useGamepads){
                _JSG.shared.timeIt.stamp("INIT_GAMEPADS", "s", "_INPUT_INITS"); 
                this.gamepad.init(this, [...listeningElems]);
                _JSG.shared.timeIt.stamp("INIT_GAMEPADS", "e", "_INPUT_INITS"); 
            }
    
            // msg = `gfxConversion TOTAL:  ${_JSG.shared.timeIt.stamp("gfxConversion", "pt", "_INPUT_INITS").toFixed(2)}ms`;
            // _JSG.loadingDiv.addMessageChangeStatus(`  videoModeA: ${msg}`, "loading");
            // console.log(msg);
    
            _JSG.shared.timeIt.stamp("TOTAL_INIT_TIME", "e", "_INPUT_INITS"); 
            resolve();
        });
    },
};
