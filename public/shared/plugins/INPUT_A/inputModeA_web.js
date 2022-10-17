_INPUT.web = {
    parent: null,
    
    //
    configObj: {
        "base":{
            "inputDiv"               : "jsgame_inputDiv",
            "input"                  : "jsgame_input",
            "userMappings_textOutput": "gamepad_nav_view_userMappings_textOutput",
            "downloadH5ls"           : "mapped_downloadH5ls",
            // "updateFromFileH5ls"     : "mapped_updateFromFileH5ls",
            "updateFromTextH5ls"     : "mapped_updateFromTextH5ls",
        },
        "nav":{
            // "defaultTabKey": "help",
            "defaultTabKey": "gp_p1",
            "indicators":{
                "gp_p1": "gamepad_nav_tab_gp_p1_indicator",
                "gp_p2": "gamepad_nav_tab_gp_p2_indicator",
            },
            "tabs": {
                "help"        : "gamepad_nav_tab_help",
                "userMappings": "gamepad_nav_tab_userMappings",
                "gp_p1"       : "gamepad_nav_tab_gp_p1",
                "gp_p2"       : "gamepad_nav_tab_gp_p2",
            },
            "views": {
                "help"        : "gamepad_nav_view_help",
                "userMappings": "gamepad_nav_view_userMappings",
                "gp_p1"       : "gamepad_nav_view_gp_p1",
                "gp_p2"       : "gamepad_nav_view_gp_p2",
            }
        },
    },

    //
    DOM:{},

    //
    nav:{
        parent: null,

        defaultTabKey: null,
        indicators   : {},
        tabs         : {},
        views        : {},
        hideAllViews: function(){
            // Deactivate all tabs and views. 
            for(let key in this.tabs) { this.tabs [key].classList.remove("active"); }
            for(let key in this.views){ this.views[key].classList.remove("active"); }
        },
        showOneView: function(tabKey){
            // Deactivate all tabs and views. 
            this.hideAllViews();
    
            // Set the active class for this tab and view. 
            this.tabs [ tabKey ].classList.add("active");
            this.views[ tabKey ].classList.add("active");
        },
        init: function(parent, configObj){
            return new Promise(async (resolve,reject)=>{
                // Set parent(s).
                this.parent = parent;

                // Load from config.
                this.defaultTabKey = configObj.defaultTabKey;
        
                // Save DOM strings and generate DOM references.
                for(let key in configObj.indicators) { this.indicators[key]  = configObj.indicators[key] ; }
                for(let key in configObj.tabs      ) { this.tabs[key]        = configObj.tabs[key] ; }
                for(let key in configObj.views     ) { this.views[key]       = configObj.views[key]; }
                _JSG.shared.parseObjectStringDOM(this.tabs, false);
                _JSG.shared.parseObjectStringDOM(this.views, false);
        
                // Deactivate all tabs and views. 
                this.hideAllViews();
            
                // Add event listeners to the tabs.
                for(let key in this.tabs){ this.tabs[key].addEventListener("click", () => this.showOneView(key), false); }
        
                // Show the default view.
                this.showOneView(this.defaultTabKey);

                resolve();
            });
        }
    },

    //
    mainView: {
        parent: null, 

        // Holds the previous view states.
        prevViews: {
            app    : undefined,
            lobby  : undefined,
            // loading: undefined,
        },
        // Record the previous views in main.
        showInput_hideOthers: function(keepAppVisible=false){
            // Hide the menu.
            _JSG.DOM["js_game_header_menu"]    .classList.remove('active');
            _JSG.DOM["js_game_backgroundShade"].classList.add('hide');
            _JSG.DOM["js_game_header_menuBtn"] .classList.remove("menuOpen");
    
            // Unhide the divs. 
            this.parent.DOM.base["inputDiv"].classList.remove("hide");
            this.parent.DOM.base["input"].classList.remove("hide");
    
            // Get the show/hide state of the other views.
            if(keepAppVisible){ this.prevViews.app = true; }
            else              { this.prevViews.app = _JSG.DOM["gameDivCont"] .classList.contains("hide") ? false : true; }
            this.prevViews.lobby   = _JSG.DOM["lobbyDivCont"].classList.contains("hide") ? false : true; 
            // this.prevViews.loading = _JSG.DOM["loadingDiv"]  .classList.contains("hide") ? false : true; 
            
            // Hide those other views. 
            if(keepAppVisible){ _JSG.shared.setVisibility(_JSG.DOM["jsgame_menu_toggleApp"] , true, false); }
            else              { _JSG.shared.setVisibility(_JSG.DOM["jsgame_menu_toggleApp"] , false, false); }
            _JSG.shared.setVisibility(_JSG.DOM["jsgame_menu_toggleLobby"], false, false);
            // _JSG.shared.setVisibility(_JSG.DOM["jsgame_menu_toggleLoading"]  , false, false);
    
            // Start the update loop.
            this.parent.loopId = setTimeout(()=>{ window.requestAnimationFrame( ()=>this.parent.updateLoop() ); }, this.loopDelayMs);
        },
        // Restore the previous views in main.
        hideInput_restoreOthers: function(){
            // Start the update loop.
            console.log(this.parent.loopId);
            clearTimeout(this.parent.loopId);
            this.parent.loopId = null;
    
            // Hide the divs. 
            this.parent.DOM.base["inputDiv"].classList.add("hide");
            this.parent.DOM.base["input"].classList.add("hide");
    
            // Restore the state of the previous views.
            _JSG.shared.setVisibility(_JSG.DOM["jsgame_menu_toggleApp"]    , this.prevViews.app    , false);
            _JSG.shared.setVisibility(_JSG.DOM["jsgame_menu_toggleLobby"]  , this.prevViews.lobby  , false);
            // _JSG.shared.setVisibility(_JSG.DOM["jsgame_menu_toggleLoading"], this.prevViews.loading, false);
        },
    },

    mapManager: {
        parent: null, 
        
        playerKey: "",
        buttonName: "",
        buttonSettingMode: "",
        gamepadIndex: "",
        mappedDiv: "",
        gamepadIdleState : {
            axes:[],
            buttons:[],
        },
        tdElem: "",
        // tempMap:{},

        updateOrCreateMap: function(mappedDiv){
            let gp;
            // foundBy
            
            if     (mappedDiv.parentNode.id == _INPUT.web.nav.views.gp_p1.id){ gp = _INPUT.gamepad.gp_list.find(d=>d.data.playerKey=="p1"); }
            else if(mappedDiv.parentNode.id == _INPUT.web.nav.views.gp_p2.id){ gp = _INPUT.gamepad.gp_list.find(d=>d.data.playerKey=="p2"); }
            else   { console.log("updateOrCreateMap: ERROR: Unknown mappedDiv parentNode."); return; }
            if(!gp){ console.log("updateOrCreateMap: ERROR: Missing gp."); return; }
            
            gp.data.mapObj.foundBy = "id-user";

            // Rebuild the button map from the table values. 
            gp.data.mapObj.mapRec = {};
            for(let key of _INPUT.consts.buttons){ 
                let elem = mappedDiv.querySelector(`.snesGpDiv_table1 .setOneButton[name="${key}"]`);
                gp.data.mapObj.mapRec[key] = elem.innerText; 
            }
            
            // Set activeMap to the rebuilt mapRec.
            // gp.data.mapObj.activeMap = gp.data.mapObj.mapRec;
            
            // If idRec is not populated then create it. 
            let idMatchFound = false;
            if( !Object.keys(gp.data.mapObj.idRec).length ){
                gp.data.mapObj.idRec = { "genName":gp.data.mapObj.gp_mapKeyData.mapKey2, "mapKey": "NEW_MAP" };
            }
            else{
                // idRec is populated. Do we already have a matching genName?
                for(let key in _INPUT.gamepadMappings.user.ids){ 
                    if(gp.data.mapObj.gp_mapKeyData.mapKey2 == _INPUT.gamepadMappings.user.ids[key].genName){
                        // console.log("existing id match found with id:", key, _INPUT.gamepadMappings.user.ids[key]);
                        idMatchFound = true;
                        break; 
                    }
                }
            }

            // Does a usermap exist already that matches this mapping? 
            let newMapHash = _JSG.shared.TinySimpleHash( JSON.stringify(gp.data.mapObj.mapRec) );
            let mapMatchFound = false;
            for(let key in _INPUT.gamepadMappings.user.maps){ 
                let mapHash = _JSG.shared.TinySimpleHash( JSON.stringify(_INPUT.gamepadMappings.user.maps[key]) );
                if(newMapHash == mapHash){
                    // console.log("existing map match found with map:", key, _INPUT.gamepadMappings.user.maps[key]);
                    gp.data.mapObj.idRec.mapKey = key; 
                    mapMatchFound = true; 
                    break; 
                }
            }

            // New id needed? 
            if(!idMatchFound){
                console.log("Adding new id.");
                // Add the whole idRec to ids.
                _INPUT.gamepadMappings.user.ids.push( gp.data.mapObj.idRec );
            }
            
            // If a matching map was not found then add it.
            if(!mapMatchFound){
                console.log("Adding new map.");
                _INPUT.gamepadMappings.user.maps[gp.data.mapObj.idRec.mapKey] = gp.data.mapObj.mapRec;
            }

            // Update H5LS
            // console.log("_INPUT.gamepadMappings.user:", _INPUT.gamepadMappings.user);
        },
        start_mapOneButton: function(playerKey, gamepadIndex, buttonName, mappedDiv){
            if(gamepadIndex == undefined){ console.log("ERROR: Missing gamepadIndex."); return; }

            // Poll for gamepads and find the one with the matching gamepadIndex.
            let gamepads;
            if     (navigator.getGamepads)      { gamepads = navigator.getGamepads(); }
            else if(navigator.webkitGetGamepads){ gamepads = navigator.webkitGetGamepads(); }
            else{ gamepads = []; }

            // Find the matching gamepad within the gamepad poll.
            let gamepad = gamepads.filter(d=>d).filter(d=>d.index == gamepadIndex);
            if(!gamepad){ console.log(`ERROR: Gamepad with index: ${gamepadIndex} was not found.`); return; }
            gamepad = gamepad[0];
            // console.log("FOUND:", gamepad);

            // Parse the axes and the buttons to get the gamepadIdleState.
            let gamepadIdleState = {};
            gamepadIdleState.axes    = gamepad.axes   .map(d=>{ return Math.round( d      .toFixed(0) ); });
            gamepadIdleState.buttons = gamepad.buttons.map(d=>{ return Math.round( d.value.toFixed(0) ); });
            // console.log("gamepadIdleState.axes   :", gamepadIdleState.axes);
            // console.log("gamepadIdleState.buttons:", gamepadIdleState.buttons);

            // Make sure that the destination td is there. 
            let tdElem = mappedDiv.querySelector(`.snesGpDiv_table1 .setOneButton[name="${buttonName}"]`);
            if(!tdElem){ console.log(`ERROR: tdElem: ${buttonName} was not found.`); return; }

            // Set the playerKey value so that we know which gamepad we will be reading.
            this.playerKey = playerKey;
            
            // Set the button setting mode.
            this.buttonSettingMode = "mapOneButton";

            // Set the gamepadIndex.
            this.gamepadIndex = gamepadIndex;

            // Set the gamepadIdleState.
            this.gamepadIdleState = gamepadIdleState;

            // Set the buttonName.
            this.buttonName = buttonName;

            // Set the buttonName.
            this.mappedDiv = mappedDiv;

            // Set the tdElem.
            this.tdElem = tdElem;
            this.tdElem.classList.add("waiting");

            // Set the tempMap.
            // this.tempMap = {}; for(let key of _INPUT.consts.buttons){ this.tempMap[key] = ""; }

            // console.log(
            //     `SETTINGS: ` + "\n" +
            //     `  playerKey        : ` + (this.playerKey)                + "\n" + 
            //     `  buttonSettingMode: ` + (this.buttonSettingMode)        + "\n" + 
            //     `  gamepadIndex     : ` + (this.gamepadIndex)             + "\n" + 
            //     `  buttonName       : ` + (this.buttonName)               + "\n" + 
            //     `  idle_axes        : ` + (this.gamepadIdleState.axes)    + "\n" + 
            //     `  idle_buttons     : ` + (this.gamepadIdleState.buttons) + "\n" + 
            //     "\n"
            // );
            // return; 

            //

            // Open the modal display.
            //

            // Populate the text fields. 
            // let elem;
            // let buttonTexts = elem.querySelectorAll(".buttonText");
            
            // `Mapping button ${button}`\n\nPress the matching button on the gamepad.`;
            // `Click 'OK' to set the displayed mapping to the button.`;
            //

        },
        loop_mapOneButton: function(){
            // Poll for gamepads and find the one with the matching gamepadIndex.
            let gamepads;
            if     (navigator.getGamepads)      { gamepads = navigator.getGamepads(); }
            else if(navigator.webkitGetGamepads){ gamepads = navigator.webkitGetGamepads(); }
            else{ gamepads = []; }

            // Find the matching gamepad within the gamepad poll.
            let gamepad = gamepads.filter(d=>d).filter(d=>d.index == this.gamepadIndex);
            if(!gamepad){ console.log(`loop_mapOneButton: ERROR: Gamepad with index: ${this.gamepadIndex} was not found.`); return; }
            gamepad = gamepad[0];
            // console.log("loop_mapOneButton: FOUND:", gamepad);

            // Normalize the received values. 
            let state = {};
            state.axes    = gamepad.axes   .map(d=>{ return Math.round( d      .toFixed(0) ); });
            state.buttons = gamepad.buttons.map(d=>{ return Math.round( d.value.toFixed(0) ); });

            // Compare with the gamepadIdleState.
            let buttonsPressed = [];
            
            // Add any axis/button that does not match the idlestate.
            for(let i=0, l=state.axes.length; i<l; i+=1){
                if(state.axes[i] != this.gamepadIdleState.axes[i]){ buttonsPressed.push( { type: "A", index: i, value: state.axes[i] } ); }
            }
            for(let i=0, l=state.buttons.length; i<l; i+=1){
                if(state.buttons[i] != this.gamepadIdleState.buttons[i]){ buttonsPressed.push( { type: "B", index: i, value: state.buttons[i] } ); }
            }

            // Was ONE button pressed?
            if(buttonsPressed.length == 1){
                buttonsPressed = buttonsPressed[0];

                let gp;
                if     (this.playerKey == "p1"){ gp = _INPUT.gamepad.gp_list.find(d=>d.data.playerKey=="p1"); }
                else if(this.playerKey == "p2"){ gp = _INPUT.gamepad.gp_list.find(d=>d.data.playerKey=="p2"); }
                else{ return; }
                if(!gp){ console.log("loop_mapOneButton: ERROR: Missing gp."); return; }

                // Set the data directly to the mapRec.
                gp.data.mapObj.mapRec[this.buttonName] = `${buttonsPressed.type}:${buttonsPressed.index}:${buttonsPressed.value}`;

                this.stop_mapOneButton();
            }

        },
        stop_mapOneButton: function(){
            // Set the playerKey value so that we know which gamepad we will be reading.
            this.playerKey = "";

            // Set the button setting mode.
            this.buttonSettingMode = "";

            // Set the gamepadIndex.
            this.gamepadIndex = "";

            // Set the gamepadIdleState.
            this.gamepadIdleState = "";

            // Set the buttonName.
            this.buttonName = "";

            // Set the buttonName.
            this.mappedDiv = "";

            if(this.tdElem){
                this.tdElem.classList.remove("waiting");
            }
        },
    },

    //
    createMappedSection: function(playerKey, dest){
        // Clone the mapped section. 
        let mappedDiv = document.getElementById("mappedGpDiv").cloneNode(true);
        mappedDiv.removeAttribute("id");

        // Add event listeners to the table. 
        let buttons = mappedDiv.querySelectorAll(`.snesGpDiv_table1 .setOneButton`);
        for(let i=0, l=buttons.length; i<l; i+=1){
            let button = buttons[i];
            let buttonName = button.getAttribute("name"); 
            button.onclick = ()=>{ 
                // Get the related gamepad.
                let gamepad;
                if     (playerKey == "p1" && _INPUT.gamepad.gp_list.length){ gamepad = _INPUT.gamepad.gp_list.find(d=>d.data.playerKey=="p1"); }
                else if(playerKey == "p2" && _INPUT.gamepad.gp_list.length){ gamepad = _INPUT.gamepad.gp_list.find(d=>d.data.playerKey=="p2"); }
                else{ return; }
                if(!gamepad.gamepad){ return; }
                this.mapManager.stop_mapOneButton();
                this.mapManager.start_mapOneButton(playerKey, gamepad.gamepad.index, buttonName, mappedDiv); 
            };
        }

        // Add event listeners to the buttons. 
        mappedDiv.querySelector(`.mappedGpConfig .mapped_updateOrCreateMap`).onclick = ()=>{
            this.mapManager.updateOrCreateMap(mappedDiv);
        };

        // Save user mapping changes to local storage.
        mappedDiv.querySelector(`.mappedGpConfig .mapped_updateFromRamH5ls`).onclick = ()=>{
            // Update local storage.
            _INPUT.gamepad.setUserGpMappings_localStorage();

            // Update the textarea display in User Mappings. 
            this.DOM.base["userMappings_textOutput"].innerHTML = JSON.stringify(_INPUT.gamepadMappings.user,null,1);
        };

        // Clone the raw section. 
        let raw = document.getElementById("standardGpDiv").cloneNode(true);
        raw.removeAttribute("id");

        // Clear the destination and then add in the data.
        dest.innerHTML = "";
        dest.append(mappedDiv, raw);
    },

    //
    loopId: undefined,
    loopDelayMs: 50, // 20 FPS.

    //
    updateLoop: function(){
        // Loop that displays live button presses (raw gamepad and mapped gamepad.)
        if(!this.mapManager.buttonSettingMode){
            // Don't poll the gamepads.
            // Depend on the existing functions of inputModeA and the running gameLoop to do that.
            // Thus, a running gameLoop is required that calls _INPUT.util.getStatesForPlayers() 
            // to update the saved state of the gamepads. .

            // Input can come from the keyboard or a gamepad. 
            // Data for a gamepad should not be displayed unless that gamepad is connected.
            // This updateLoop will just periodically check _INPUT.states and _INPUT.gamepad.gp_list for gamepad data (raw).

            let mappedStates = {};
            for(let key in _INPUT.states){ mappedStates[key] = _INPUT.util.stateByteToObj(_INPUT.states[key].held); }

            let updateMappedGp_data = function(gamepad, elem){
                // Update the mapKey.
                let idElem = elem.querySelector(".mappedGp_id");
                if(idElem.getAttribute("last") != gamepad.data.mapObj.gp_mapKeyData.mapKey2){
                    idElem.innerText = gamepad.data.mapObj.gp_mapKeyData.mapKey2; 
                    idElem.setAttribute("last", gamepad.data.mapObj.gp_mapKeyData.mapKey2); 
                }
                
                // Update the map that is active.
                let mappingElem = elem.querySelector(".mappedGp_mapping");
                if(mappingElem.getAttribute("last") != gamepad.data.mapObj.idRec.mapKey){
                    mappingElem.innerText = gamepad.data.mapObj.idRec.mapKey; 
                    mappingElem.setAttribute("last", gamepad.data.mapObj.idRec.mapKey); 
                }

                // Update the displayed mapping for each button. 
                let mapTable = elem.querySelector(".snesGpDiv_table1");
                for(let key of _INPUT.consts.buttons){ 
                    let elem = mapTable.querySelector(`.setOneButton[name="${key}"]`);
                    if(elem.getAttribute("last") != gamepad.data.mapObj.mapRec[key] && gamepad.data.mapObj.mapRec[key] != undefined){
                        elem.innerText = gamepad.data.mapObj.mapRec[key]; 
                        elem.setAttribute("last", gamepad.data.mapObj.mapRec[key]); 
                    }
                }

                // Update the foundBy elem.
                let foundByElem = elem.querySelector(".mappedGp_foundBy");
                if(foundByElem.getAttribute("last") != gamepad.data.mapObj.foundBy){
                    foundByElem.innerText = gamepad.data.mapObj.foundBy; 
                    foundByElem.setAttribute("last", gamepad.data.mapObj.foundBy); 
                }

                // Update the gamepadIndex.
                let indexElem = elem.querySelector(".mappedGp_index");
                if(indexElem.getAttribute("last") != gamepad.gamepad.index){
                    indexElem.innerText = gamepad.gamepad.index; 
                    indexElem.setAttribute("last", gamepad.gamepad.index); 
                }

                // Update the playerKey.
                let playerKeyElem = elem.querySelector(".mappedGp_playerKey");
                if(playerKeyElem.getAttribute("last") != gamepad.data.playerKey){
                    playerKeyElem.innerText = gamepad.data.playerKey; 
                    playerKeyElem.setAttribute("last", gamepad.data.playerKey); 
                }
            };

            for(let key in mappedStates){
                let gp;
                let elem1;
                if     (key == "p1"){ elem1 = _INPUT.web.nav.views.gp_p1.querySelector(`.mappedGpDiv`); gp = _INPUT.gamepad.gp_list.find(d=>d.data.playerKey=="p1"); }
                else if(key == "p2"){ elem1 = _INPUT.web.nav.views.gp_p2.querySelector(`.mappedGpDiv`); gp = _INPUT.gamepad.gp_list.find(d=>d.data.playerKey=="p2"); }
                else{ continue; }
                if(!gp){ continue; }

                updateMappedGp_data( gp, elem1 );

                for(let button in mappedStates[key]){
                    let elem2 = elem1.querySelector(`.snesGpDiv_gp .SNESGamepad [name="${button}"`); 
                    let elem3 = elem1.querySelector(`.snesGpDiv_table1 .setOneButton[name="${button}"]`);

                    // snesGpDiv_table1
                    if(mappedStates[key][button]){ 
                        elem2.classList.add("active"); 
                        elem3.classList.add("active");
                    }
                    else                         { 
                        elem2.classList.remove("active"); 
                        elem3.classList.remove("active");
                    }
                }
            }

            let updateTd = function(dest, type, index, value){
                let elem = dest;
                let str = `${type}${index.toString().padStart(2, " ")}:${value.toString().padStart(2, " ")}`;
                if(elem){ 
                    if(elem.getAttribute("last") != value){
                        elem.innerText = str; elem.setAttribute("last", value); 
                        if(value != 0){ elem.classList.add("active"); }
                        else          { elem.classList.remove("active"); }
                    }
                }
                else{ console.log("not found:", str); }
            };
            let updateStandardGp_id = function(gamepad, elem){
                // standardGp_id
                let idElem = elem.querySelector(".standardGp_id");
                if(idElem.getAttribute("last") != gamepad.gamepad.id && gamepad.gamepad.id){
                    idElem.innerText = gamepad.gamepad.id; 
                    idElem.setAttribute("last", gamepad.gamepad.id); 
                }
            };

            //.Start with the raw data for each gamepad. 
            for(let i=0, l=_INPUT.gamepad.gp_list.length; i<l; i+=1){
                // Update the id line. 
                let elem1;
                if     (i==0){ elem1 = this.nav.views.gp_p1; }
                else if(i==1){ elem1 = this.nav.views.gp_p2; }
                else{ continue; }
                updateStandardGp_id( _INPUT.gamepad.gp_list[i], elem1 );

                for(let index in _INPUT.gamepad.gp_list[i].gamepad.axes){
                    let value = Math.round( _INPUT.gamepad.gp_list[i].gamepad.axes[index].toFixed(0) ); 
                    let type = "A";
                    let elem2;
                    if     (i==0){ elem2 = elem1.querySelector(`.standardGpDiv_table1 td[name="${type}${index}"]`); }
                    else if(i==1){ elem2 = elem1.querySelector(`.standardGpDiv_table1 td[name="${type}${index}"]`); }
                    updateTd(elem2, type, index, value);
                }
                for(let index in _INPUT.gamepad.gp_list[i].gamepad.buttons){
                    let value = Math.round( _INPUT.gamepad.gp_list[i].gamepad.buttons[index].value.toFixed(0) ); 
                    let type = "B";
                    let elem2;
                    if     (i==0){ elem2 = elem1.querySelector(`.standardGpDiv_table1 td[name="${type}${index}"]`); }
                    else if(i==1){ elem2 = elem1.querySelector(`.standardGpDiv_table1 td[name="${type}${index}"]`); }
                    updateTd(elem2, type, index, value);
                }
            }
        }
        
        // Awaiting the user to press a button on the gamepad. 
        else if(this.mapManager.buttonSettingMode == "mapOneButton"){ 
            this.mapManager.loop_mapOneButton();
        }

        // Restart the updateLoop unless the loopId was set to null.
        if(this.loopId != null){ this.loopId = setTimeout(()=>{ window.requestAnimationFrame( ()=>this.updateLoop() ); }, this.loopDelayMs); }
    },

    init: async function(parent){
        return new Promise(async (resolve, reject)=>{
            // Set parent(s).
            this.parent = parent;

            // DOM.
            this.DOM["base"] = this.configObj.base;
            await _JSG.shared.parseObjectStringDOM(this.DOM.base, true);

            // Create and add "Open JSGAME Input Config" button to the menu.
            let table = _JSG.DOM["js_game_header_menu_table1"];
            let tr = table.insertRow(-1);
            let td;
            td = tr.insertCell(-1); td.innerText = "Input Config";
            td = tr.insertCell(-1); td.setAttribute("colspan", "3"); 
            let button = document.createElement("button"); // Open modal, hide menu.
            button.innerText = "Open Gamepad/Keyboard Config";
            button.onclick = ()=> this.mainView.showInput_hideOthers();
            td.append(button);

            // Init(s).
            this.nav.init(this, this.configObj.nav);
            this.mainView.parent = this;
            this.mapManager.parent = this;
            this.buttonSettingMode = "";

            // Clone the mapped and standard gamepad divs and put a copy in each gamepad view.
            // Clone the standard gamepad div and put a copy in each gamepad view.
            this.createMappedSection("p1", this.nav.views.gp_p1);
            this.createMappedSection("p2", this.nav.views.gp_p2);

            // The text of the user mappings to the User Mappings textarea.
            this.DOM.base["userMappings_textOutput"].innerHTML = JSON.stringify(_INPUT.gamepadMappings.user,null,1);

            // User Mappings
            this.DOM.base["downloadH5ls"].addEventListener("click", ()=>{
                let body = document.body;
                const a = document.createElement("a");
                a.href = URL.createObjectURL(
                    new Blob( 
                        [ JSON.stringify(_INPUT.gamepadMappings.user, null, 2) ], 
                        { type: "text/plain" }
                    )
                );
                a.setAttribute("download", "JSGAMEv2_userGamepadMappings.json");
                body.appendChild(a);
                a.click();
                body.removeChild(a);
                URL.revokeObjectURL(a.href)
            }, false);

            // User Mappings
            this.DOM.base["updateFromTextH5ls"].addEventListener("click", ()=>{
                let json;
                try{ json = JSON.parse(this.DOM.base["userMappings_textOutput"].value); }
                catch(e){
                    alert("The JSON is not valid. Please correct before trying again.");
                    console.log(e);
                    return; 
                }

                // Update RAM.
                _INPUT.gamepadMappings.user = json;

                // Update local storage.
                _INPUT.gamepad.setUserGpMappings_localStorage();

                alert("updateFromTextH5ls: DONE");
            }, false);

            document.querySelector("#gamepadsDisplay_top_title_bar .close").addEventListener("click", ()=>this.mainView.hideInput_restoreOthers(), false);
            // this.DOM.base["updateFromFileH5ls"].addEventListener("click", ()=>{ console.log("updateFromFileH5ls"); }, false);

            // DEBUG.
            // setTimeout(()=>{
                // this.mainView.showInput_hideOthers(false);
                // this.mainView.showInput_hideOthers(true);
                // setTimeout(()=>{
                //     this.hideInput_restoreOthers();
                // }, 2000);
            // }, 1000);
            
            resolve();
        });
    },
};