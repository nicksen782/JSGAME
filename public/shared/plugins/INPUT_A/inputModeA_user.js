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
    checkButton: function(playerKey="p1", type="press", buttonNames=[]){
        // Function: 
        //   Will return true on matches and false otherwise.
        //   Can check for one button of a type.
        //   Can check multiple buttons for a type and will return true if any of those buttons are set.
        //   Can check against ANY button being active for a type. (Ex: "Press any button to continue")

        // Example usages:
        //   _INPUT.util.checkButton("p1", "press"  , "BTN_Y");            // One button: press.
        //   _INPUT.util.checkButton("p1", "release", "BTN_Y");            // One button: release.
        //   _INPUT.util.checkButton("p2", "held"   , "BTN_A");            // One button: held.
        //   _INPUT.util.checkButton("p1", "press"  , ["BTN_A", "BTN_B"]); // Multiple button: press.

        // Input checks:
        // Will return false if the buttonName(s) specified are not valid.
        if(!_INPUT.states[playerKey]){ return false; }
        if(["press", "held", "release"].indexOf(type) == -1){ return false; }

        // If buttonNames is not an array, do the simple check. 
        if(!Array.isArray(buttonNames)){
            if(_INPUT.consts.bits[buttonNames]){
                let data = _INPUT.states[playerKey][type];
                if(data & (1 <<_INPUT.consts.bits[buttonNames])){ return true; }
            }
        }
        
        // If the buttonNames is an array...
        else{
            // If the array is empty then check for a non-zero value matching the type specified for the player.
            if(buttonNames.length == 0){ 
                if(_INPUT.states[playerKey][type]){ return true; } 
            }

            // Look for any of the specified buttons matching the specified type for the player.
            else{
                for(let button of buttonNames){ 
                    if(_INPUT.consts.bits[button]){
                        let data = _INPUT.states[playerKey][type];
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