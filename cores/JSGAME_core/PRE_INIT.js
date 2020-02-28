// =================================
// ==== FILE START: PRE_INIT.js ====
// =================================

'use strict';

// window.location.origin
var thisPath   = window.location.pathname;
var parentPath = thisPath.split("/");
parentPath.pop(); parentPath.pop();
parentPath = window.location.origin + (parentPath.join("/")) + "/" ;
// console.log( parentPath );

var requestAnimationFrame = window.requestAnimationFrame       || window.mozRequestAnimationFrame ||
							window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
var cancelAnimationFrame = window.cancelAnimationFrame || window.mozCancelAnimationFrame;

var app = {};
var JSGAME={
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
var core = {
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

var game={};

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
