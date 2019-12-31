JSGAME.FLAGS={
	//
	windowIsFocused               : true  ,
	//
	paused                        : false ,
	//
	manuallyPaused                : false ,
	//
	gameReady                     : false ,

	// Flag indicating if the debug mode is on.
	debug                         : false ,

	// Flag used while waiting for the user to interact with the window.
	hasUserInteractionRestriction : false ,

	// Detects gamepad support.
	support_gamepadAPI : ('GamepadEvent' in window) && typeof navigator.getGamepads == "function",
};