// =================================
// ==== FILE START: PRE_INIT.js ====
// =================================

'use strict';

// window.location.origin
let thisPath   = window.location.pathname;
let parentPath = thisPath.split("/");
parentPath.pop(); parentPath.pop();
parentPath = window.location.origin + (parentPath.join("/")) + "/" ;
// console.log( parentPath );

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
};
let core = {
	SETTINGS   : {} , // Core kernel settings.
	DOM        : {} , // DOM cache.
	debug      : {} , // Holds DOM specific to debugging.
	ASSETS     : {} , // Populated by Populated by game init code.
	AUDIO      : {} , // Populated by game init code.
	GRAPHICS   : {} , // Populated by game init code.
	CONSTS     : {} , // Populated by video/audio kernels.
	FUNCS      : {} , // Populated by video/audio kernels.
	EXTERNAL   : {} , // The game can add to this. The cores determine the default contents.
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
