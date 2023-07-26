'use strict';

/*
    INPUT MODE A CUSTOMIZATION FILE.
    The base files for inputModeA are copies from JSGAME V2.
    The files for inputModeA are expected to be in js/INPUT_A.
    This customization file allows this game to work independently of JSGAME V2
    by replacing/adding values and functions of inputModeA prior to init.
    NOTE: If the base inputModeA changes then this file may need to be adjusted.
    This file should still work when using JSGAME but the replacements won't be added. (code is in _INPUT.customized.init.)
*/

_INPUT.customized = {
    consoleMessage: function(str1, str2, noIndent=false){
        return;
        // _INPUT.customized.consoleMessage("Replacing", "Thing you are replacing.");
        str1 = str1.trim();
        str2 = str2.trim();
        let outputString = ``;
        if(noIndent){ outputString = `${str1}: ${str2}`; }
        else        { outputString = ` * ${str1.padEnd(10, " ")} : ${str2}`; }
        console.info(outputString);
    },

    // _INPUT.util
    // Returns the object version of the specified state for all button states. 
    replacement_stateByteToObj2: function(pKey){
        // EXAMPLE USAGE: _INPUT.util.stateByteToObj2("p1");
        let state = {
            "held"   : _INPUT.util.stateByteToObj(_INPUT.states[pKey].held),
            // "_prev"  : _INPUT.util.stateByteToObj(_INPUT.states[pKey]._prev),
            "press"  : _INPUT.util.stateByteToObj(_INPUT.states[pKey].press),
            "release": _INPUT.util.stateByteToObj(_INPUT.states[pKey].release)
        };

        // Return the values. 
        return state;
    },
    // Convert the given gamepad state (held, _prev, press, release) to an object.
    replacement_stateByteToObj: function(byte){
        // EXAMPLE USAGE: _INPUT.util.stateByteToObj(_INPUT.states.p1.press)
        let keys = Object.keys(this.parent.consts.bits);
        let state = {};

        // Mask out the bit of each button represented in the byte and set the key to the result.
        for(let key of keys){ 
            // state[key] = byte & (1 << this.parent.consts.bits[key]) ? true : false; 
            state[key] = !!(byte & (1 << this.parent.consts.bits[key]));
        }
        return state;
    },

    // _JSG
    _JSG: {
        shared: {
            //
            TinySimpleHash:s=>{for(var i=0,h=9;i<s.length;)h=Math.imul(h^s.charCodeAt(i++),9**9);return h^h>>>9},
            // Pass the DOM object and it's text entries will be replaced with the coresponding DOM elements.
            parseObjectStringDOM: function(DOM={}, showWarnings=false){
                return new Promise((resolve,reject)=>{
                    for(let key in DOM){
                        if(typeof DOM[key] == "string"){
                            let elem = document.getElementById( DOM[key] );
                            if(elem != null){ DOM[key] = elem; }
                            else{
                                if(showWarnings){
                                    console.log(`parseObjectStringDOM: ${key} (${DOM[key]}) not found in the DOM.`); 
                                }
                            }
                        }
                        // else{
                        //     if(showWarnings){
                        //         console.log(`parseObjectStringDOM: ${key} was not a string. Was: ${typeof DOM[key]}`, DOM[key]); 
                        //     }
                        // }
                    }

                    resolve();
                });
            },
            //
            setVisibility: function(elem, setState=null, toggle=false){
                console.log("setVisibility is disabled:", elem, setState, toggle);
                return;
                // console.log(elem, elem.id);
                let part;
                if     (elem.id == this.parent.DOM["jsgame_menu_toggleApp"].id)    { part = "app"; }
                else if(elem.id == this.parent.DOM["jsgame_menu_toggleLobby"].id)  { part = "lobby"; }
                else if(elem.id == this.parent.DOM["jsgame_menu_toggleLoading"].id){ part = "loading"; }
                else{ console.log("toggleVisibility_wrapper: part: no match."); return; }
                
                // console.log(`part: ${part}, newState: ${newState}, oldClass: ${oldClass}, newClass: ${newClass}`);
                
                // Can we continue? 
                if(part != null){
                    // Add/remove the class as needed.
                    if(toggle && setState == null){
                        // Just toggle the view_shown class. 
                        elem.classList.toggle("view_shown");
                    }
                    else if(setState === true){
                        // Add the class.
                        elem.classList.add("view_shown");
                    }
                    else if(setState === false){
                        // Remove the class.
                        elem.classList.remove("view_shown");
                    }
                    else{ console.log("toggleVisibility_wrapper: invalid state value."); return; }
                    
                    // Perform the action(s).
                    let isShown = elem.classList.contains("view_shown") ? true : false;
                    switch(part){
                        case "app"  : { 
                            if(isShown){
                                this.parent.DOM["gameDivCont"].classList.remove("hide");  
                            } 
                            else{ 
                                this.parent.DOM["gameDivCont"].classList.add("hide"); 
                            } 
                            break; 
                        }
                        case "lobby": { 
                            if(isShown){
                                this.parent.DOM["lobbyDivCont"].classList.remove("hide"); 
                            } 
                            else{ 
                                this.parent.DOM["lobbyDivCont"].classList.add("hide"); 
                            } 
                            break; 
                        }
                        case "loading": { 
                            if(isShown){
                                this.parent.DOM["loadingDiv"].classList.remove("hide"); 
                            } 
                            else{ 
                                this.parent.DOM["loadingDiv"].classList.add("hide"); 
                            } 
                            break; 
                        }
                        default: { break; }
                    };
                }
            },
        },
    },

    // _INPUT.WEB.mainView
    replacement_showInput_hideOthers   : function(keepAppVisible=false){
        this.parent.loopId = setTimeout(()=>{ window.requestAnimationFrame( ()=>this.parent.updateLoop() ); }, this.loopDelayMs);
    },
    replacement_hideInput_restoreOthers: function(){
        clearTimeout(this.parent.loopId);
        this.parent.loopId = null;
    },

    // _INPUT
    replacement_web_pre: {
        parent: null, 

        // openConfigModal
        init: async function(parent, config){
            return new Promise(async (resolve, reject)=>{
                this.parent = parent;

                _INPUT.customized.consoleMessage("Running"  , " _INPUT.web_pre.init (modified.)");

                // Get the support files. 
                // let html;
                let proms;
                
                // proms = [
                    // new Promise( async (res,rej) => { await _APP.utility.addFile({f:"INPUT_A/inputModeA_user.js"        , t:"js"  }, _APP.relPath); res(); } ),
                    // new Promise( async (res,rej) => { await _APP.utility.addFile({f:"INPUT_A/inputModeA_mappings.js"    , t:"js"  }, _APP.relPath); res(); } ),
                    // new Promise( async (res,rej) => { await _APP.utility.addFile({f:"INPUT_A/inputModeA_web.js"         , t:"js"  }, _APP.relPath); res(); } ),
                    // new Promise( async (res,rej) => { await _APP.utility.addFile({f:"INPUT_A/inputModeA_web.css"        , t:"css" }, _APP.relPath); res(); } ),
                    // new Promise( async (res,rej) => { html = await _APP.utility.addFile({f:"INPUT_A/inputModeA_web.html", t:"html"}, _APP.relPath); res(); } ),
                // ];
                // await Promise.all(proms);

                // Add the webConfig HTML to the destination div.
                if(_APP.configObj['inputConfig'].files2){
                    if(_APP.configObj['inputConfig'].files2.length){
                        let rec = _APP.configObj['inputConfig'].files2.find(d=>d.type=="webConfig");
                        let html = await _APP.utility.addFile( rec, _APP.relPath); 

                        // Add the HTML to the destination div.
                        let div = document.createElement("div"); 
                        div.id = "jsgame_inputDiv"; 
                        div.classList.add("hide"); 
                        div.innerHTML = html;
                        
                        config.webElem.append(div);
                    }
                }

                // Run the web init.
                // await _INPUT.web.init();

                resolve();
            });
        },
    },
    replacement_init :async function(config){
        return new Promise(async (resolve,reject) => {
            // Create the DOM handles for each config.listeningElems.
            for(let key in config.listeningElems){
                config.listeningElems[key] = document.getElementById( config.listeningElems[key] );
            }

            // Create the DOM handles for config.webElem.
            config.webElem = document.getElementById( config.webElem );

            // Init: web_pre, util.
            await _INPUT.web_pre.init(_INPUT, config);
            _INPUT.util.init(_INPUT);

            // Get the user gamepad mappings from localStorage.
            _INPUT.gamepadMappings.user = _INPUT.gamepad.getUserGpMappings_localStorage();

            // Use the keyboard? 
            if(config.useKeyboard){
                _INPUT.keyboard.init(_INPUT, config.listeningElems);
            }
    
            // Use gamepad(s)?
            if(config.useGamepads){
                _INPUT.gamepad.init(_INPUT, config.listeningElems);
            }

            resolve();
        });
    },

    div_gp_p1: null,
    div_gp_p1_buttons: {},
    div_gp_p1_buttons_clickOverlay: {},

    div_gp_p2: null,
    div_gp_p2_buttons: {},
    div_gp_p2_buttons_clickOverlay: {},

    setupClickLiveGamepadDisplay: function(){
        let gpData = [
            { buttons1: this.div_gp_p1_buttons, buttons2: this.div_gp_p1_buttons_clickOverlay, pkey: "p1" },
            { buttons1: this.div_gp_p2_buttons, buttons2: this.div_gp_p2_buttons_clickOverlay, pkey: "p2" },
        ];
        for(let i=0, len=gpData.length; i<len; i+=1){
            let gp = gpData[i];

            for(let buttonName in gp.buttons1){
                let button;
                let buttonReal = gp.buttons1[buttonName];
                if( !(buttonName in gp.buttons2)){ button = gp.buttons1[buttonName]; }
                else                             { button = gp.buttons2[buttonName]; }
                
                // button.addEventListener("mouseenter", ()=>{
                    // console.log("mouseenter:", button);
                // }, false);
                
                button.addEventListener("mouseleave", ()=>{
                    // console.log("mouseleave:", button);
                    if(buttonReal.classList.contains("active")){ buttonReal.classList.remove("active"); }
                }, false);
                
                button.addEventListener("mousedown", ()=>{
                    // console.log("You clicked:", gp.pkey, buttonName, _INPUT.consts.bits[buttonName]);
                    _INPUT.states[gp.pkey].held |=  (1 << _INPUT.consts.bits[buttonName]); // Set the bit true.
                    if(!buttonReal.classList.contains("active")){ buttonReal.classList.add("active"); }
                }, false);
                
                button.addEventListener("mouseup", ()=>{
                    // console.log("You released:", gp.pkey, buttonName, _INPUT.consts.bits[buttonName]);
                    _INPUT.states[gp.pkey].held &= ~(1 << _INPUT.consts.bits[buttonName]); // Set the bit false.
                    if(buttonReal.classList.contains("active")){ buttonReal.classList.remove("active"); }
                }, false);
            }
        };

    },
    // liveGamepadHeldOverrides: {
    //     p1: 0,
    //     p2: 0
    // },
    updateLiveGamepadDisplay: function(){
        // Do not run this if the Input tab is not visible.
        if(_APP.navBarMAIN.activeView != "input"){ return; }

        // Get the button states for p1.
        let state_p1 = _INPUT.util.stateByteToObj(_INPUT.states["p1"].held);

        // Update the gamepad display (only on changes.)
        for(let buttonName in state_p1){
            if(!this.div_gp_p1_buttons[buttonName]){
                // console.log(`Button not found: ${buttonName}`, this.div_gp_p1_buttons);
                // console.log(`  `, this.div_gp_p1_buttons);
                // console.log(`  `, this);
                continue;
            }

            if      (state_p1[buttonName]  && !this.div_gp_p1_buttons[buttonName].classList.contains("active")){ 
                this.div_gp_p1_buttons[buttonName].classList.add("active"); 
            }
            else if (!state_p1[buttonName] && this.div_gp_p1_buttons[buttonName].classList.contains("active")) {
                this.div_gp_p1_buttons[buttonName].classList.remove("active");
            }
        }
        
        // Get the button states for p2.
        let state_p2 = _INPUT.util.stateByteToObj(_INPUT.states["p2"].held);

        // Update the gamepad display (only on changes.)
        for(let buttonName in state_p2){
            if(!this.div_gp_p2_buttons[buttonName]){
                // console.log(`Button not found: ${buttonName}`);
                // console.log(`  `, this.this.div_gp_p2_buttons);
                // console.log(`  `, this);
                continue;
            }
            if      (state_p2[buttonName]  && !this.div_gp_p2_buttons[buttonName].classList.contains("active")){ 
                this.div_gp_p2_buttons[buttonName].classList.add("active"); 
            }
            else if (!state_p2[buttonName] && this.div_gp_p2_buttons[buttonName].classList.contains("active")) {
                this.div_gp_p2_buttons[buttonName].classList.remove("active");
            }
        }
    },
    createLiveGamepadDisplay: function(config){
        _INPUT.customized.consoleMessage("Adding", "Local gamepad live view container.");
        // let dest = document.getElementById("controls_navBar1_view_controls");
        let dest = document.getElementById( config.liveGamepadsDestId);
        
        let divCont = document.createElement("div"); 
        // divCont.classList.add("controls_border");
        
        let label = document.createElement("label"); 
        label.classList.add("controls_title"); 
        label.innerText = "GAMEPADS";
        
        this.div_gp_p1 = document.createElement("div"); 
        this.div_gp_p1.id = "gamepadsLive_p1";

        this.div_gp_p2 = document.createElement("div"); 
        this.div_gp_p2.id = "gamepadsLive_p2";

        divCont.append(label, this.div_gp_p1, this.div_gp_p2);
        dest.append(divCont);

        _INPUT.customized.consoleMessage("Adding", "Local add two gamepads for a live button display");
        //
        let gamepads = {
            p1: { dest: this.div_gp_p1, buttonsDest: "div_gp_p1_buttons", buttonsDest2: "div_gp_p1_buttons_clickOverlay", src: document.querySelector("#mappedGpDiv").cloneNode(true) },
            p2: { dest: this.div_gp_p2, buttonsDest: "div_gp_p2_buttons", buttonsDest2: "div_gp_p2_buttons_clickOverlay", src: document.querySelector("#mappedGpDiv").cloneNode(true) },
        };
        for(let playerKey in gamepads){
            let gp_obj = gamepads[playerKey];
            gp_obj.src.removeAttribute("id");
            let gpElem = gp_obj.src.querySelector(".SNESGamepad");
            gpElem.style.width = "100%";
            gp_obj.dest.style.width = "320px";
            gp_obj.dest.style.margin = "auto";
            
            let buttons = gpElem.querySelectorAll(`.button`);
            
            for(let i=0, l=buttons.length; i<l; i+=1){
                let button = buttons[i];
                let buttonName = button.getAttribute("name"); 
                this[gp_obj.buttonsDest][buttonName] = button;
            }
            
            let buttons2 = gpElem.querySelectorAll(`.clickableArea`);
            for(let i=0, l=buttons2.length; i<l; i+=1){
                let button2 = buttons2[i];
                let buttonName2 = button2.getAttribute("data-name"); 
                this[gp_obj.buttonsDest2][buttonName2] = button2;
            }

            gp_obj.dest.append(gpElem);
        }
    },

    addKeyboardInstructionsDiv: function(config){
        // Add the keyboardInstructionsDiv.
        let dest = document.getElementById(config.tabConfig.destViewId2);

        let sortOrder = [
            'BTN_UP', 
            'BTN_DOWN', 
            'BTN_LEFT', 
            'BTN_RIGHT', 
            'BTN_A', 
            'BTN_B', 
            'BTN_Y', 
            'BTN_X', 
            'BTN_SL', 
            'BTN_SR',
            'BTN_SELECT', 
            'BTN_START', 
        ];
        let p1 = [..._INPUT.gamepadMappings.keyboard.p1].sort((a, b) => sortOrder.indexOf(a.button) - sortOrder.indexOf(b.button));
        let p2 = [..._INPUT.gamepadMappings.keyboard.p2].sort((a, b) => sortOrder.indexOf(a.button) - sortOrder.indexOf(b.button));

        let keyboardInstructionsDiv = `
            <table style="background-color:gray; width: 100%;">
            <caption>Player 1 Keyboard Mappings</caption>
            <tr> 
                <th>BUTTON</th> <th>KEY</th>  
                <th>BUTTON</th> <th>KEY</th> 
            </tr>
        `;
        for(let i=0, len=p1.length; i<len; i+=2){
            let rec1 = p1[i];
            let rec2 = p1[i+1];

            keyboardInstructionsDiv += `
                <tr> 
                <td>${rec1.button.replace("BTN_", "")} </td> <td>${rec1.code}</td>  
                <td>${rec2.button.replace("BTN_", "")} </td> <td>${rec2.code}</td> 
                </tr>
            `;
        }
        keyboardInstructionsDiv += `</table>`;

        keyboardInstructionsDiv += `
        <table style="background-color:gray; width: 100%;">
            <caption>Player 2 Keyboard Mappings</caption>
            <tr> 
                <th>BUTTON</th> <th>KEY</th>  
                <th>BUTTON</th> <th>KEY</th> 
            </tr>
        `;
        keyboardInstructionsDiv += `<br>`;
        for(let i=0, len=p2.length; i<len; i+=2){
            let rec1 = p2[i];
            let rec2 = p2[i+1];

            keyboardInstructionsDiv += `
                <tr> 
                <td>${rec1.button.replace("BTN_", "")} </td> <td>${rec1.code}</td>  
                <td>${rec2.button.replace("BTN_", "")} </td> <td>${rec2.code}</td> 
                </tr>
            `;
        }
        keyboardInstructionsDiv += `</table>`;

        let tempDiv = document.createElement('div');
        tempDiv.innerHTML = keyboardInstructionsDiv;

        let counter = 0;
        while (tempDiv.firstChild && counter < 5) {
            dest.append(tempDiv.firstChild);
            counter += 1;
        }
    },

    // Replaces functions in _INPUT if _APP.usingJSGAME_INPUT is false.
    init: async function(config){
        _INPUT.customized.consoleMessage("Running", "_INPUT.customized.init.", true);

        // Add local tab and view.
        if(!_APP.usingJSGAME_INPUT){
            _INPUT.customized.consoleMessage("Adding", "Local tab and view.");
            let navBar1Tabs  = document.getElementById(config.tabConfig.destTabs);
            let navBar1Views = document.getElementById(config.tabConfig.destViews);

            // Create the DOM entry for the main menu bar.
            _APP.navBarMAIN.DOM["input"] = { tab: "navTab_input"   , view: "navView_input"   , extraClasses: { cont: ["inputNormal"]  }, onShow: null, onHide: null };

            // Input tab.
            let tab2 = document.createElement("li");
            tab2.id = config.tabConfig.destTabId2; 
            tab2.innerText = "Input";
            navBar1Tabs.append(tab2);
            
            // Input view.
            let view2 = document.createElement("div");
            view2.id = config.tabConfig.destViewId2; 
            view2.classList.add("navView");
            view2.setAttribute("tabindex", 0);
            navBar1Views.append(view2);

            // NOTE:
            // The keyboard control data div is added by replacement_web_pre.init later.

            // Create the DOM entry for the main menu bar.
            _APP.navBarMAIN.DOM["inputConfig"] = { tab: "navTab_inputConfig"  , view: "navView_inputConfig"  , extraClasses: { cont: ["inputWide"] }, 
                onShow: function(){ 
                    if(_APP.configObj.inputConfig.enabled){
                        // console.log("show inputConfig"); 
                        try{ _INPUT.web.mainView.showInput_hideOthers(); }
                        catch(e){}
                    }
                }, 
                onHide: function(){ 
                    if(_APP.configObj.inputConfig.enabled){
                        // console.log("hide inputConfig"); 
                        try{ _INPUT.web.mainView.hideInput_restoreOthers();  }
                        catch(e){}
                    }
                } 
            };

            // Config tab.
            let tab = document.createElement("li");
            tab.id = config.tabConfig.destTabId; 
            tab.innerText = "Input Config";
            navBar1Tabs.append(tab);
            
            // Config view.
            let view = document.createElement("div");
            view.id = config.tabConfig.destViewId; 
            view.classList.add("navView");
            navBar1Views.append(view);
        }

        // Replace.
        if(!_APP.usingJSGAME_INPUT){
            _INPUT.customized.consoleMessage("Replacing", " _INPUT.init and _INPUT.web_pre.");
            _INPUT.web_pre = this.replacement_web_pre;
            _INPUT.init    = this.replacement_init;
        }
        
        // Add missing JSGAME functions?
        if(!_APP.usingJSGAME_INPUT){
            _INPUT.customized.consoleMessage("Adding"   , " _JSG object.");

            // NOT using JSGAME.
            if(!_APP.usingJSGAME && !_APP.usingJSGAME_INPUT){
                _JSG.DOM = {};
                _JSG.DOM["js_game_header_menu_table1"] = document.createElement("table"); // "dummyTable",

                _JSG.shared = {};
                _JSG.shared.TinySimpleHash       = _INPUT.customized._JSG.shared.TinySimpleHash;
                _JSG.shared.parseObjectStringDOM = _INPUT.customized._JSG.shared.parseObjectStringDOM;
                _JSG.shared.setVisibility        = _INPUT.customized._JSG.shared.setVisibility;
            }
        }
        
        // Init.
        if(!_APP.usingJSGAME_INPUT){
            _INPUT.customized.consoleMessage("Running"  , " _INPUT.init (modified.)");
            await _INPUT.init(config);
        }
        else{
            await _INPUT.init(config.listeningElems);
        }

        // ADD NEW FUNCTIONS.
        // Add functions (inputModeA_user.js.)
        _INPUT.customized.consoleMessage("Adding"   , " _INPUT.util functions.");
        _INPUT.util.stateByteToObj2 = _INPUT.customized.replacement_stateByteToObj2;
        _INPUT.util.stateByteToObj  = _INPUT.customized.replacement_stateByteToObj;
        
        // Add missing JSGAME functions?
        if(!_APP.usingJSGAME_INPUT){
            _INPUT.customized.consoleMessage("Changing" , " Unhide the web config html");

            // _INPUT.web: Remove the hidden class from the inputDiv (contains the web html.)
            _JSG.DOM["jsgame_inputDiv"] = document.getElementById("jsgame_inputDiv");
            _JSG.DOM["jsgame_inputDiv"].classList.remove("hide");
            
            // _INPUT.web replacements.
            _INPUT.web.mainView.showInput_hideOthers    = _INPUT.customized.replacement_showInput_hideOthers;
            _INPUT.web.mainView.hideInput_restoreOthers = _INPUT.customized.replacement_hideInput_restoreOthers;
        }
        
        // Run the web init.
        if(!_APP.usingJSGAME_INPUT){
            _INPUT.customized.consoleMessage("Running"  , " _INPUT.web.init");
            await _INPUT.web.init();
        }
        
        // Remove some HTML from the web config.
        if(!_APP.usingJSGAME_INPUT){
            _INPUT.customized.consoleMessage("Removing" , " Red close 'X' and gamepad count.");

            // Remove the red x.
            document.querySelector("#gamepadsDisplay_top_title_bar .close").remove();

            // Remove the gamepad connected count.
            document.getElementById("gamepadsDisplay_status").remove();
        }

        // Add two gamepads for a live button display.
        if(!_APP.usingJSGAME_INPUT){
            _INPUT.customized.createLiveGamepadDisplay(config);
            _INPUT.customized.setupClickLiveGamepadDisplay();

            this.addKeyboardInstructionsDiv(config);
        };

    },
}
