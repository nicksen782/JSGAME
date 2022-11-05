_INPUT.util = {
    parent: null,

    // Parse the keyboard/gamepad input states. Update and return the updated states.
    getStatesForPlayers: async function(){
        // Gamepads must be polled for. (Keyboard events are handled automatically).
        await this.parent.gamepad.pollAndUpdate();
        
        // Copy all states.
        let states         = Object.assign({}, this.parent.states);
        let keyboardStates = Object.assign({}, this.parent.keyboard.keyboardState);
        let gamepadStates  = Object.assign({}, this.parent.gamepad.gamepadState);

        // For each playerKey in statesRaw.
        let playerKeys = Object.keys(keyboardStates);
        for(let p=0, lp=playerKeys.length; p<lp; p+=1){
            let pk = playerKeys[p];
            let newHeld;
            
            // HELD: Use the keyboard state combined with the gamepad state?
            if( gamepadStates[pk] && undefined != gamepadStates[pk].held) { newHeld = keyboardStates[pk].held | (gamepadStates[pk].held | 0); }
            
            // HELD: Use the keyboard state only.
            else{ newHeld = keyboardStates[pk].held; }

            // _PREV: Set the previous state to the current held state.
            states[pk]._prev = states[pk].held;
            
            // HELD: Set the current held state.
            states[pk].held = newHeld;

            // PRESS: Determine the pressed states.
            states[pk].press = states[pk].held & (states[pk].held ^ states[pk]._prev);

            // RELEASE: Determine the released states.
            states[pk].release = states[pk]._prev & (states[pk].held ^ states[pk]._prev);
        }

        // Return the raw states. The game/app can convert it if it wants to.
        this.parent.states = states;
        return this.parent.states;
    },

    // Convert the given gamepad state (held, _prev, press, release) to an object.
    stateByteToObj: function(byte){
        // EXAMPLE USAGE: _INPUT.util.stateByteToObj(_INPUT.states.p1.press)
        let keys = Object.keys(this.parent.consts.bits);
        let state = {};

        // Mask out the bit of each button represented in the byte and set the key to the result.
        for(let key of keys){ 
            state[key] = byte & (1 << this.parent.consts.bits[key]) ? true : false; 
        }
        return state;
    },

    // Convert the given gamepad state object to binary.
    stateObjToByte: function(state){
        let keys = Object.keys(this.parent.consts.bits);
        let byte = 0;
        for(let key of keys){ 
            // Get the value.
            let value = state[key];

            // Create the mask.
            let mask = 1 << this.parent.consts.bits[key];

            // If the value is true then "or in" the bit.
            if(value){ byte |=  mask; }
            
            // If the value is true then "and out" the bit.
            else     { byte &= ~mask; }
        }
        return byte;
    },

    // Utility function to check user-input state.
    checkButton: function(playerKeys=["p1"], types=["press"], buttonNames=[]){
        // Function: 
        //   Will return true on matches and false otherwise.
        //   Can check for one button of a type.
        //   Can check multiple buttons for a type and will return true if any of those buttons are set.
        //   Can check against ANY button being active for a type. (Ex: "Press any button to continue")

        // Example usages:
        //   _INPUT.util.checkButton("p1",         "press"  ,         "BTN_Y");                 // One button: press.
        //   _INPUT.util.checkButton("p1",         "release",         "BTN_Y");                 // One button: release.
        //   _INPUT.util.checkButton("p2",         ["held", "press"], "BTN_A");                 // One button: Either held or press.
        //   _INPUT.util.checkButton(["p1", "p2"], "press",            ["BTN_START", "BTN_A"]); // Multiple button: press for either player.

        // Convert inputs to arrays.
        if(!Array.isArray(playerKeys))  { playerKeys   = [playerKeys]; }
        if(!Array.isArray(types))       { types        = [types]; }
        if(!Array.isArray(buttonNames)){ buttonNames = [buttonNames]; }

        // For each player specified...
        for(let p=0, pl=playerKeys.length; p<pl; p+=1){
            // Skip this player if the playerKey isn't valid.
            if(_INPUT.states[playerKeys[p]] == undefined){ continue; }

            // For each type specified...
            for(let t=0, tl=types.length; t<tl; t+=1){
                // Skip this type if it is not valid.
                if(["press", "held", "release"].indexOf(types[t]) == -1){ 
                    continue; 
                }

                // (ANY BUTTON OF TYPE) If the array is empty then check for a non-zero value matching the type specified for the player.
                if(buttonNames.length == 0){ 
                    if(_INPUT.states[ playerKeys[p] ][ types[t] ]){ return true; } 
                }

                // Check each specified button against the playerKey and type.
                for(let button of buttonNames){ 
                    // Make sure the button name is valid. 
                    if(_INPUT.consts.bits[button]){
                        // Get the data byte.
                        let data = _INPUT.states[ playerKeys[p] ][ types[t] ];

                        // Look for this button being active.
                        if(data & (1 <<_INPUT.consts.bits[button])){ return true; }
                    }
                }
            }
        }

        return false;
    },

    init: function(parent){
        // Set parent(s).
        this.parent = parent;
    },
};