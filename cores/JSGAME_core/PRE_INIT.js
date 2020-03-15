// =================================
// ==== FILE START: PRE_INIT.js ====
// =================================

'use strict';

let thisPath   = window.location.pathname;
let parentPath = thisPath.split("/");
parentPath.pop(); parentPath.pop();
parentPath = window.location.origin + (parentPath.join("/")) + "/" ;

let requestAnimationFrame = window.requestAnimationFrame       || window.mozRequestAnimationFrame ||
							window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
let cancelAnimationFrame = window.cancelAnimationFrame || window.mozCancelAnimationFrame;

let app = {};
let JSGAME={
	PRELOAD    : {} ,
	FLAGS      : {} ,
	SHARED     : {} ,
	DOM        : {} ,
	INIT       : {} ,
	GUI        : {} ,
	GAMEPADS   : {} ,
	consts     : {} , //
	CORE_SETUP_PERFORMANCE : {
		"starts" : {} ,
		"ends"   : {} ,
		"times"  : {} ,
	},
	TEMP       : {} , // Temporarily holds data during JSGAME load.
};
let core = {
	SETTINGS   : {} , // Core kernel settings.
	DOM        : {} , // DOM cache.
	ASSETS     : {} , // Populated by Populated by game init code.
	AUDIO      : {} , // Populated by sound mode.
	GRAPHICS   : {} , // Populated by video mode.
	FUNCS      : {} , // Populated by video/audio kernels. (legacy. videoModeA, soundModeA)
	EXTERNAL   : {} , // The game can add to this. The cores determine the default contents.
	// debug      : {} , // Holds DOM specific to debugging.
	// CONSTS     : {} , // Populated by video/audio kernels.
};
core.FUNCS.graphics = {};

let game={};

JSGAME.PRELOAD.PHP_VARS = {
	"gamelist_json"     : null ,
	"gamesettings_json" : null ,
	"gameSelected"      : null ,
	"typeGamepads"      : null ,
	"numGamepads"       : null ,
	"fps"               : null ,
	"videokernel"       : null ,
	"queryString"       : null ,
	"CANLOADGAME"       : null ,
};

JSGAME.PRELOAD.gamelist_json     = null ;
JSGAME.PRELOAD.gameselected_json = null ;
JSGAME.PRELOAD.gamesettings_json = null ;

// ===============================
// ==== FILE END: PRE_INIT.js ====
// ===============================
