// ==============================
// ==== FILE START: FLAGS.js ====
// ==============================

'use strict';

/**
 * JSGAME FLAGS.
 * @summary JSGAME FLAGS.
 * @namespace JSGAME.FLAGS
*/
JSGAME.FLAGS={

	/**
	 * @summary Flag indicating if the tab/window has focus..
	 * @memberof JSGAME.FLAGS
	*/
	windowIsFocused               : true  ,

	/**
	 * @summary Set by JSGAME to pause/unpause the game.
	 * @memberof JSGAME.FLAGS
	 */
	paused                        : false ,

	/**
	 * @summary Set/unset by the user to pause the game.
	 * @memberof JSGAME.FLAGS
	*/
	manuallyPaused                : false ,

	/**
	 * @summary The game will set this flag indicating that it has been fully loaded.
	 * @memberof JSGAME.FLAGS
	*/
	gameReady                     : false ,

	/**
	 * @summary Flag indicating if the debug mode is on..
	 * @memberof JSGAME.FLAGS
	*/
	debug                         : false ,

	/**
	 * @summary Flag used while waiting for the user to interact with the window.
	 * @memberof JSGAME.FLAGS
	*/
	hasUserInteractionRestriction : false ,

	/**
	 * @summary Detects gamepad support.
	 * @memberof JSGAME.FLAGS
	*/
	support_gamepadAPI : ('GamepadEvent' in window) && typeof navigator.getGamepads == "function",

	/**
	 * @summary Flag is used in the Global Error Handler to block errors after the first (prevents tons of errors.)
	 * @memberof JSGAME.FLAGS
	*/
	errorThrown_stopReporting : false,

	/**
	 * @summary DEBUG. Set at the end of the logic loop and cleared by the debug loop. Helps to limit the number of debug draws to one per each logic loop.
	 * @memberof JSGAME.FLAGS
	*/
	allowDebugToRun : false,
};

// ============================
// ==== FILE END: FLAGS.js ====
// ============================
