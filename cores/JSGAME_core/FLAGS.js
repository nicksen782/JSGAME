// ==============================
// ==== FILE START: FLAGS.js ====
// ==============================

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

	// Flag is used in the Global Error Handler to block errors after the first (prevents tons of errors.)
	errorThrown_stopReporting : false,

	// DEBUG. Set at the end of the logic loop and cleared by the debug loop.
	// Helps to limit the number of debug draws to one per each logic loop.
	allowDebugToRun : false,
};

// ============================
// ==== FILE END: FLAGS.js ====
// ============================
