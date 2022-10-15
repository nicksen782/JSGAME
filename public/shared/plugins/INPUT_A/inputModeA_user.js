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

    init: function(parent){
        // Set parent(s).
        this.parent = parent;
    },
};