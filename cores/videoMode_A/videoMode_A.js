// KEYS
core.ASSETS  .graphics       = {} ; // Unchanging assets.
core.FUNCS   .graphics       = {} ; // Functions for handling graphics.
// core.FUNCS   .graphics.FADER = {} ; //
core.GRAPHICS.FADER          = {} ; //
core.GRAPHICS.debug          = {} ; //
core.GRAPHICS.fonts          = {} ; //
core.GRAPHICS.fontSettings   = {} ; //
core.GRAPHICS.activeTileset  = {} ; //
core.GRAPHICS.flags          = {} ; //
core.GRAPHICS.performance    = {} ; //

// Graphics assets.
core.ASSETS.graphics.tilesetNames     = []   ; // Name of each tileset.
core.ASSETS.graphics.ramtiles         = []   ; // RAM-tiles are stored here.
core.ASSETS.graphics.tiles            = []   ; // Normal tiles are stored here.
core.ASSETS.graphics.tilemaps         = []   ; // Tilemaps for all tilesets are stored here.
core.GRAPHICS.tiles                   = {}   ; //
core.GRAPHICS.ramtiles                = {}   ; //
core.GRAPHICS.spritebanks             = []   ; // Max of 4 indexes.
core.GRAPHICS.activeTileset["BG"]     = null ; // String of the tileset used for this layer.
core.GRAPHICS.activeTileset["SPRITE"] = null ; // String of the tileset used for this layer.
core.GRAPHICS.activeTileset["TEXT"]   = null ; // String of the tileset used for this layer.
core.GRAPHICS.activeTileset["FADE"]   = null ; // String of the tileset used for this layer.

core.GRAPHICS.tiles_flipped           = {     // Flipped versions of previously flipped sprite tiles.
	// EXAMPLE:
	// "tilesetName" :{
	// 	149 : {
	// 		X  : "canvas" ,
	// 		Y  : "canvas" ,
	// 		XY : "canvas" ,
	// 	}
	// },
}   ; //

// Font settings.
// core.GRAPHICS.fonts["fonts1"] = { "tileset":"", "fontmap":"" };
core.GRAPHICS.fontSettings = {
	fontmap   : "" , // Takes the string of a fontmap.
	tileset   : "" , // Takes the string of the tileset used for the fontmap.
};

// CANVAS
core.GRAPHICS["canvas"] = {} ; // Canvas elems.
core.GRAPHICS["ctx"]    = {} ; // Canvas contexts.

// VRAM
core.GRAPHICS["VRAM1"]          = [] ; // VRAM1, tiles (current)
core.GRAPHICS["VRAM1_TO_WRITE"] = [] ; // What needs to be drawn on the current frame.
core.GRAPHICS["VRAM2"]          = [] ; // VRAM2, text (previous)
core.GRAPHICS["VRAM2_TO_WRITE"] = [] ; // What needs to be drawn on the current frame.

// FLAGS - A change has been specified.
core.GRAPHICS.flags.BG     = false ; // Draw layer.
core.GRAPHICS.flags.SPRITE = false ; // Draw layer.
core.GRAPHICS.flags.TEXT   = false ; // Draw layer.
core.GRAPHICS.flags.FADE   = false ; // Draw layer.
core.GRAPHICS.flags.OUTPUT = false ; // Draw output.

core.GRAPHICS.flags.INLAYERUPDATE=false; //

core.GRAPHICS.flags.BG_force     = false ; // Forcing the drawing even if it normally would not draw.
core.GRAPHICS.flags.SPRITE_force = false ; // Forcing the drawing even if it normally would not draw.
core.GRAPHICS.flags.TEXT_force   = false ; // Forcing the drawing even if it normally would not draw.
// core.GRAPHICS.flags.FADE_force   = false ; // Forcing the drawing even if it normally would not draw.
core.GRAPHICS.flags.OUTPUT_force = false ; // Forcing the drawing even if it normally would not draw.

// PERFORMANCE MONITORING
core.GRAPHICS.performance.BG      = [ 0, 0, 0, 0, 0 ] ; //
core.GRAPHICS.performance.SPRITE  = [ 0, 0, 0, 0, 0 ] ; //
core.GRAPHICS.performance.TEXT    = [ 0, 0, 0, 0, 0 ] ; //
core.GRAPHICS.performance.FADE    = [ 0, 0, 0, 0, 0 ] ; //
core.GRAPHICS.performance.OUTPUT  = [ 0, 0, 0, 0, 0 ] ; //

// Sprites
core.GRAPHICS.sprites = [
	// x         , // x pixel position.
	// y         , // y pixel position.
	// tileIndex , // tile index used by this sprite.
	// flags     , // flags in use by this sprite (binary.)
	// hash        // "hash" of the data for this sprite.
] ;
core.GRAPHICS.sprites_prev = [
	// x         , // x pixel position.
	// y         , // y pixel position.
	// tileIndex , // tile index used by this sprite.
	// flags     , // flags in use by this sprite (binary.)
	// hash        // "hash" of the data for this sprite.
] ;
core.GRAPHICS.sprites_toClear = [] ;

// Sprites (constants used with bitmasks.)
core.CONSTS["SPRITE_FLIP_X"]    = 1    ; //             (B 00000001)
core.CONSTS["SPRITE_FLIP_Y"]    = 2    ; //             (B 00000010)
core.CONSTS["SPRITE_OFF"]       = 4    ; //             (B 00000100)
core.CONSTS["SPRITE_RAM"]       = 8    ; //             (B 00001000)
core.CONSTS["SPRITE_BANK0"]     = 0<<6 ; // 0<<6 is 0   (B 00000000)
core.CONSTS["SPRITE_BANK1"]     = 1<<6 ; // 1<<6 is 64  (B 01000000)
core.CONSTS["SPRITE_BANK2"]     = 2<<6 ; // 2<<6 is 128 (B 10000000)

// Other constants: (
core.CONSTS["OffscreenCanvas_supported"] ;

// *** FADER *** tim1724
// Modified for JavaScript by nicksen782.

core.GRAPHICS.FADER.CONSTS = {}
core.GRAPHICS.FADER.FUNCS = {}

core.GRAPHICS.FADER.CONSTS["FADER_STEPS"] = 12 ; // Number of steps in a fade.
core.GRAPHICS.FADER.CONSTS["fader"] = [
	//                               INDEX BB GGG RRR  B G R    DEC   HEX
	{ b: 0  , g: 0   , r: 0   } , // 0     00 000 000  0 0 0  , 0   , 0x00
	{ b: 33 , g: 0   , r: 0   } , // 1     01 000 000  1 0 0  , 64  , 0x40
	{ b: 66 , g: 14  , r: 0   } , // 2     10 001 000  2 1 0  , 136 , 0x88
	{ b: 66 , g: 28  , r: 14  } , // 3     10 010 001  2 2 1  , 145 , 0x91
	{ b: 100, g: 28  , r: 28  } , // 4     11 010 010  3 2 2  , 210 , 0xD2
	{ b: 100, g: 57  , r: 57  } , // 5     11 100 100  3 4 4  , 228 , 0xE4
	{ b: 66 , g: 71  , r: 71  } , // 6     10 101 101  2 5 5  , 173 , 0xAD
	{ b: 66 , g: 85  , r: 71  } , // 7     10 110 101  2 6 5  , 181 , 0xB5
	{ b: 66 , g: 85  , r: 85  } , // 8     10 110 110  2 6 6  , 182 , 0xB6
	{ b: 66 , g: 100 , r: 85  } , // 9     10 111 110  2 7 6  , 190 , 0xBE
	{ b: 66 , g: 100 , r: 100 } , // 10    10 111 111  2 7 7  , 191 , 0xBF
	{ b: 100, g: 100 , r: 100 } , // 11    11 111 111  3 7 7  , 255 , 0xFF
]; // The rgb values for each fade level.
core.GRAPHICS.FADER.prevFadeStep   = 0     ; // Previous frame step.
core.GRAPHICS.FADER.fadeStep       = 0     ; // Current frame step.
core.GRAPHICS.FADER.fadeSpeed      = 0     ; // Speed between fader array index changes.
core.GRAPHICS.FADER.currFadeFrame  = 0     ; // Current index into the fader array.
core.GRAPHICS.FADER.fadeDir        = 1     ; // Direction of fade (1 is up, -1 is down.)
core.GRAPHICS.FADER.fadeActive     = false ; // Fade is active.
core.GRAPHICS.FADER.blocking       = false ; // Do not allow further game logic updates if true.
core.GRAPHICS.FADER.blockAfterFade = false ; //
core.GRAPHICS.FADER.stayDark       = false ; // Stay dark after fade completes.

// JS GAME logo for this video mode.
core.FUNCS.graphics.logo = function(){
	return new Promise(function(res,rej){
		// Display the JSGAME logo.
		if(JSGAME.PRELOAD.PHP_VARS.INTRO_LOGO){
			let logo = JSGAME.PRELOAD.PHP_VARS.INTRO_LOGO_IMGB64;

			let img = new Image();
			img.onload = function() {
				let xpos   ;
				let ypos   ;
				let width  ;
				let height ;
				let output  = core.GRAPHICS.ctx.OUTPUT;
				let stretch = JSGAME.PRELOAD.PHP_VARS.INTRO_LOGO_STRETCH;
				let center  = JSGAME.PRELOAD.PHP_VARS.INTRO_LOGO_CENTER;

				// Stretch?
				if(stretch){ width = output.canvas.width; height = output.canvas.height; }
				else       { width = img.width;           height = img.height;           }

				// Center? (Vertical and Horizontal.)
				if(!stretch) {
					xpos=(output.canvas.width  / 2) - img.width  / 2;
					ypos=(output.canvas.height / 2) - img.height / 2;
				}
				else         { xpos=0; ypos=0; }

				// Draw the image.
				//     drawImage( image, sx , sy, sWidth   , sHeight   , dx   , dy   , dWidth, dHeight );
				output.drawImage( img  , 0  , 0 , img.width, img.height, xpos , ypos , width , height  );

				// Hold the image for a moment. It should be cleared by the game.
				setTimeout( res , 1000);
			};
			img.src = logo;
		}
		else{ res(); }
	});
};

// Can be replaced by the game. Used for full-screen graphics changes during output.
core.EXTERNAL.GRAPHICS = function(ctx){ return new Promise(function(res,rej){ res(ctx); }); };

// WEB WORKERS - EXPERIEMENT
// core.FLAGS = {};
core.WORKERS = {};
core.WORKERS.VIDEO = new Worker("cores/videoMode_A/videoMode_A_webworker.js");

// *** Init conversion functions - Removed after use. ***

core.FUNCS.graphics.init = function(){
	// TODO:

	// Take performance metrics.

	return new Promise(function(res_VIDEO_INIT, rej_VIDEO_INIT){
		JSGAME.SHARED.PERFORMANCE.stamp("VIDEO_INIT_ALL"                   , "START");

		// Copy some PRELOAD settings into core.SETTINGS.
		let settingsSetup = function(){
			return new Promise(function(res_settingsSetup, rej_settingsSetup){
				JSGAME.SHARED.PERFORMANCE.stamp("VIDEO_INIT_settingsSetup"                    , "START");

				// Set the game settings and game consts.
				core.SETTINGS['RAM_TILES_COUNT']   = JSGAME.PRELOAD.gamesettings_json['RAM_TILES_COUNT']  ;
				core.SETTINGS['TILE_HEIGHT']       = JSGAME.PRELOAD.gamesettings_json['TILE_HEIGHT']      ;
				core.SETTINGS['TILE_WIDTH']        = JSGAME.PRELOAD.gamesettings_json['TILE_WIDTH']       ;
				core.SETTINGS['TRANSLUCENT_COLOR'] = JSGAME.PRELOAD.gamesettings_json['TRANSLUCENT_COLOR'];
				core.SETTINGS['VRAM_TILES_H']      = JSGAME.PRELOAD.gamesettings_json['VRAM_TILES_H']     ;
				core.SETTINGS['VRAM_TILES_V']      = JSGAME.PRELOAD.gamesettings_json['VRAM_TILES_V']     ;
				core.SETTINGS['INTRO_LOGO']        = JSGAME.PRELOAD.gamesettings_json['INTRO_LOGO']       ;
				core.SETTINGS['fps']               = JSGAME.PRELOAD.gamesettings_json['fps']              ;

				// Convert the TRANSLUCENT_COLOR string to integer. (If specified as HEX then it is likely a string.)
				core.SETTINGS['TRANSLUCENT_COLOR'] = parseInt(core.SETTINGS['TRANSLUCENT_COLOR'], 16);

				// These will be added in graphicsSetup.
				// core.GRAPHICS.tilesetNames = [] ;
				// core.GRAPHICS.ramtiles     = [] ;
				// core.GRAPHICS.tiles        = [] ;
				// core.GRAPHICS.tilemaps     = [] ;

				JSGAME.SHARED.PERFORMANCE.stamp("VIDEO_INIT_settingsSetup"                    , "END");

				res_settingsSetup();
			});
		};
		// Copies some DOM into the core DOM cache.
		let DOMSetup    = function(){
			return new Promise(function(res_DOMSetup, rej_DOMSetup){
				JSGAME.SHARED.PERFORMANCE.stamp("VIDEO_INIT_DOMSetup"                         , "START");

					// DOM cache (GAME ELEMENTS ONLY.)
					core.DOM['gameCanvas_DIV'] = document.getElementById("gameCanvas_DIV");

				JSGAME.SHARED.PERFORMANCE.stamp("VIDEO_INIT_DOMSetup"                         , "END");
				res_DOMSetup();
			});
		};
		// Configure canvases for the video mode.
		let canvasSetup = function(){
			return new Promise(function(res_canvasSetup, rej_canvasSetup){
				JSGAME.SHARED.PERFORMANCE.stamp("VIDEO_INIT_canvasSetup"                      , "START");

				// Configure the canvas(es)

				// This video mode requires 5 canvases. 4 for the layers and 1 for the output.

				// CANVAS
				core.GRAPHICS.canvas.BG     = document.createElement('canvas'); // Background tiles - Tile grid-aligned, no alpha.
				core.GRAPHICS.canvas.SPRITE = document.createElement('canvas'); // Sprite tiles     - Tile pixel-aligned, with alpha.
				core.GRAPHICS.canvas.TEXT   = document.createElement('canvas'); // Text tiles       - Tile grid-aligned, with alpha.
				core.GRAPHICS.canvas.FADE   = document.createElement('canvas'); // Fade layer       - Used for Fading. General purpose bitmap canvas. (no alpha.)
				core.GRAPHICS.canvas.OUTPUT = document.createElement('canvas'); // Output canvas    - Combination of the other 4 layers. (no alpha.)

				// CANVAS CTX
				core.GRAPHICS.ctx.BG     = core.GRAPHICS.canvas.BG    .getContext('2d', { alpha: false });
				core.GRAPHICS.ctx.SPRITE = core.GRAPHICS.canvas.SPRITE.getContext('2d', { alpha: true  });
				core.GRAPHICS.ctx.TEXT   = core.GRAPHICS.canvas.TEXT  .getContext('2d', { alpha: true  });
				core.GRAPHICS.ctx.FADE   = core.GRAPHICS.canvas.FADE  .getContext('2d', { alpha: false });
				core.GRAPHICS.ctx.OUTPUT = core.GRAPHICS.canvas.OUTPUT.getContext('2d', { alpha: false });

				// CANVAS ARRAY (temp.)
				let canvases = [
					core.GRAPHICS.canvas.BG     ,
					core.GRAPHICS.canvas.SPRITE ,
					core.GRAPHICS.canvas.TEXT   ,
					core.GRAPHICS.canvas.FADE   ,
					core.GRAPHICS.canvas.OUTPUT ,
				];

				// Set the dimensions of each canvas.
				var width  = core.SETTINGS.VRAM_TILES_H * core.SETTINGS.TILE_WIDTH;
				var height = core.SETTINGS.VRAM_TILES_V * core.SETTINGS.TILE_HEIGHT;
				canvases.forEach(function(d){
					d.width  = width  ; d.height = height ;
					JSGAME.SHARED.setpixelated(d);                         // This may not be necessary.
					d.getContext('2d').clearRect(0, 0, d.width, d.height); // This may not be necessary.
				});

				// Set an id on the canvas_OUTPUT.
				core.GRAPHICS.canvas.OUTPUT.id="canvas_OUTPUT";

				// Attach the canvas_OUTPUT to gameCanvas_DIV.
				core.DOM['gameCanvas_DIV'].appendChild(core.GRAPHICS.canvas.OUTPUT);

				JSGAME.SHARED.PERFORMANCE.stamp("VIDEO_INIT_canvasSetup"                      , "END");

				res_canvasSetup();
			});
		};
		// Create VRAM arrays.
		let vramSetup   = function(){
			return new Promise(function(res_vramSetup, rej_vramSetup){
				JSGAME.SHARED.PERFORMANCE.stamp("VIDEO_INIT_vramSetup"                        , "START");

				// Get the number of tiles for VRAM.
				let screen_wh   = (core.SETTINGS.VRAM_TILES_H * core.SETTINGS.VRAM_TILES_V);

				// VRAM1 (BG layer.) (Set all to tile id 0.)
				// core.GRAPHICS.VRAM1 = new Uint8ClampedArray( screen_wh );
				core.GRAPHICS.VRAM1 = new Uint8Array ( screen_wh );
				// core.GRAPHICS.VRAM1 = new Uint16Array( screen_wh );

				// VRAM2 (TEXT layer.) (Set all to tile id 0.)
				// core.GRAPHICS.VRAM2 = new Uint8ClampedArray( screen_wh );
				core.GRAPHICS.VRAM2 = new Uint8Array ( screen_wh );
				// core.GRAPHICS.VRAM2 = new Uint16Array( screen_wh );

				JSGAME.SHARED.PERFORMANCE.stamp("VIDEO_INIT_vramSetup"                        , "END");

				res_vramSetup();
			});
		};
		// Preload and pre-convert all graphics.
		let graphicsSetup = function(){
			// Download and convert the source graphics (first convert.)
			return new Promise(function(res_graphicsSetup, rej_graphicsSetup){
				JSGAME.SHARED.PERFORMANCE.stamp("VIDEO_INIT_graphicsSetup"                    , "START");

				let gamedir = parentPath + JSGAME.PRELOAD.gameselected_json['gamedir'];
				gamedir = gamedir.replace("../", "");

				function graphicsConvert(res){
					// Manipulate the string to something easier to manage.
					// NOTE: If this is done to the files PRIOR to this then the file download will be smaller.
					var data = res
						.replace(/\\r\\n/g                           , "\n"  ) // Normalize to Unix line endings.
						.replace(/^\s*[\r\n]/gm                      , ''    ) // Blank lines.
						.replace(/const char/gm                      , ''    ) // Remove const char
						.replace(/PROGMEM/gm                         , ''    ) // Remove PROGMEM
						.replace(/(\/\*([\s\S]*?)\*\/)|(\/\/(.*)$)/gm, ''    ) // Single and Multi-line comments.
						.replace(/\s*[#;].+$/gm                      , ''    ) // Hash and Comma comments.
						.replace(/  +/g                              , ''    ) // ?? Multiple spaces (to become 0 spaces)
						.replace(/^\s+|\s+$/g                        , ''    ) // Strip leading and trailing spaces
						.replace(/= /gm                              , '='   ) // Remove "= "
						.replace(/, /gm                              , ','   ) // Remove ", "
						.replace(/\n/gm                              , ''    ) // Remove "\n"
						.replace(/};/gm                              , '};\n') // Add "\n" after "};"
						.replace(/ /g                                , ''    ) // Remove all spaces.
					;

					// Temp variables.
					var arrayNames       = [] ;
					var tilemapNames     = [] ;
					var tilesetNames     = [] ;
					var thisArrayName    = "" ;
					var bin_tilesetData  = [] ;
					var bin_tilemapData  = [] ;

					var start ;
					var end   ;
					var values;

					// Split on \n
					data = data.split("\n");

					// Trim each line. Also get each array name.
					data.forEach(function(d){
						// Trim the line.
						d = d.trim();

						// Get the tileset name.
						thisArrayName=d.substring(0, d.indexOf("["));

						// Collect the name of the array.
						arrayNames.push( thisArrayName );

						// Get the start and end of the values for this array.
						start  = d.indexOf("{");
						end    = d.indexOf("}");
						values = d.substring(start+1, end);

						// Split the string on ",".
						values = values.split(",");

						// Is this the tileset?
						if(d.indexOf("{0x") != -1){
							// Add the tileset to the list of tilesets.
							tilesetNames.push( thisArrayName );

							// Convert the base 16 hex to base 10. (The tileset is represented in hex, not dec.)
							values = values.map(function(d){ return parseInt(d, 16); });

							// Take the array and make an array buffer out of it.
							bin_tilesetData[thisArrayName] = new Uint8ClampedArray(values);

							// Put the values of the string back together.
							values = values.join(",");

							// Replace the contents of the line.
							d = thisArrayName + "[]={"+values+"};";
						}
						// This is a tilemap.
						else{
							// Add the tilemap to the list of tilemaps.
							tilemapNames.push( thisArrayName );

							// Take the array and make an array buffer out of it.
							bin_tilemapData[thisArrayName] = new Uint8ClampedArray(values);
						}

						// Return the new string.
						return d;
					});

					// Return the data
					return  {
						"tilesetNames"    : tilesetNames    ,
						"bin_tilesetData" : bin_tilesetData ,
						"bin_tilemapData" : bin_tilemapData ,
					};

				}

				let proms_gfx = [];

				JSGAME.PRELOAD.gamesettings_json['graphics_files'].forEach(function(d){
					proms_gfx.push(
						JSGAME.SHARED.getFile_fromUrl(gamedir + "/" + d, false, "text")
					);
				});

				Promise.all(proms_gfx).then(function( r ){
					for(let i=0; i<r.length; i+=1){
						// Get the converted data.
						let converted = graphicsConvert( r[i] );

						// Get the keys.
						let keys_bin_tilesetData  = Object.keys(converted.bin_tilesetData ) ;
						let keys_bin_tilemapData  = Object.keys(converted.bin_tilemapData ) ;

						// Save the data.
						converted.tilesetNames.forEach( function(d){ if(d){ core.ASSETS.graphics.tilesetNames.push(d) ; } });
						keys_bin_tilesetData  .forEach( function(d){ if(d){ core.ASSETS.graphics.tiles[d]    = converted.bin_tilesetData[d]  ; } });
						keys_bin_tilemapData  .forEach( function(d){ if(d){ core.ASSETS.graphics.tilemaps[d] = converted.bin_tilemapData[d]  ; } });
					}

					JSGAME.SHARED.PERFORMANCE.stamp("VIDEO_INIT_graphicsSetup"                    , "END");

					res_graphicsSetup();
				});

			});
		};
		// Determines if OffscreenCanvas is available in the browser.
		let featureDetect_OffscreenCanvas = function(){
			// Do we have OffscreenCanvas?
			if( ('OffscreenCanvas' in self ? true : false ) ){
				// Do we also have transferControlToOffscreen?
				let canvasObj = document.createElement("canvas");
				if(typeof canvasObj.transferControlToOffscreen === "function" ? true : false){
					// Last test.
					try{
						var canvasObj_ctx = canvasObj.getContext("bitmaprenderer");
						var offscreen = new OffscreenCanvas(8, 8);
						var twod = offscreen.getContext("2d");
						// var gl = offscreen.getContext("webgl");
						var bitmap = offscreen.transferToImageBitmap();
						canvasObj_ctx.transferFromImageBitmap(bitmap);

						// Return a true.
						return true;
					}
					catch(e){
						// Return a false.
						return false;
					}

				}
			}

			// Getting here means that we do not have support for OffscreenCanvas.
			return false;
		};

		// Determine if OffscreenCanvas is supported.
		core.CONSTS["OffscreenCanvas_supported"] = featureDetect_OffscreenCanvas();

		// DEBUG:
		if(JSGAME.FLAGS.debug) { console.log("MAIN: OffscreenCanvas support: ", core.CONSTS["OffscreenCanvas_supported"]); }

		// (1/2) GRAPHICS SETUP.
		let proms1 = [
			settingsSetup() ,
			DOMSetup()      ,
			canvasSetup()   ,
			vramSetup()     ,
			graphicsSetup() ,
		];

		// (2/2) GRAPHICS SETUP.
		Promise.all(proms1).then(
			function(res){
				// Get 32-bit rgba version of 1-byte rgb332.
				rgb_decode332                   = function(RGB332, method, handleTransparency) {
					// Converts one RGB332 pixel to another data type.

					if(handleTransparency==undefined){ handleTransparency=false;}

					// Sent a pixel of rgb332. Return either an object with the separated rgba values or a 32 bit array buffer/view.

					// Variables.
					let nR     ;
					let nG     ;
					let nB     ;
					let buf    ;
					let view8  ;
					let view32 ;
					let alpha  ;

					// NOTE: endianness matters when doing bitwise math.
					//       This assumes Little Endian.
					nR = ( ((RGB332 << 0) & 7) * (255 / 7) ) << 0; // red
					nG = ( ((RGB332 >> 3) & 7) * (255 / 7) ) << 0; // green
					nB = ( ((RGB332 >> 5) & 7) * (255 / 7) ) << 0; // blue
					// var nB = ((((RGB332 >> 5) & 6) * (255 / 7))); // blue
					// var nB = ((((RGB332 >> 5) & 6) * (255 / 6))); // blue

					if(handleTransparency){
						if(RGB332 == core.SETTINGS['TRANSLUCENT_COLOR']){
							alpha=0;
							nB   =0;
							nG   =0;
							nR   =0;
						}
						else                                        {
							alpha=255;
						}
					}
					else {
						alpha=255;
					}
					if(method == "arraybuffer_32"){
						buf    = new ArrayBuffer(4);
						view8  = new Uint8ClampedArray(buf);
						view32 = new Uint32Array(buf);

						view32 =
							(alpha << 24) | // alpha
							(nB    << 16) | // blue
							(nG    <<  8) | // green
							nR              // red
						;

						return view32;
					}
					// else if     (method == undefined || method =="object"){
					// 	// Return an object with the separated rgba values in separated keys.

					// 	// Output all values as an object.
					// 	return {
					// 		red   : nR  ,
					// 		green : nG  ,
					// 		blue  : nB  ,
					// 		alpha : alpha ,
					// 	};
					// }
					// else if(method == "arraybuffer_8" ){
					// 	buf    = new ArrayBuffer(4);
					// 	view8  = new Uint8ClampedArray(buf);
					// 	view32 = new Uint32Array(buf);

					// 	view32 =
					// 		(alpha << 24) | // alpha
					// 		(nB    << 16) | // blue
					// 		(nG    <<  8) | // green
					// 		nR              // red
					// 	;

					// 	return view8;
					// }

					// else if(method == "rgba_string"   ){
					// 	// Output all values as an rgba CSS string.
					// 	alpha = app.shared.remap_numberRangeToNumberRange( alpha, 0, 255, 0, 1.0 );
					// 	return "rgba("+nR+","+nG+","+nB+","+alpha+")";
					// }
					else{
						throw new Error("ERROR: rgb_decode332: UNKNOWN METHOD. " + method);
					}
				};
				// Converts Uzebox tiles to Canvas. Respects transparency if indicated.
				convertUzeboxTilesToCanvasTiles = function(inputTileset, inputTilesetName, newTilesetKey, handleTransparency, outputType){
					// console.log( inputTileset, inputTilesetName, newTilesetKey, handleTransparency, outputType  );
					// console.log(  inputTilesetName, newTilesetKey, handleTransparency, outputType  );
					let curTileId;
					let vramdata_rgb_332;
					let tile_width = core.SETTINGS['TILE_WIDTH'];
					let tile_height = core.SETTINGS['TILE_WIDTH'];
					let tile_size = tile_width * tile_height;
					let buf8;
					let buf32;
					let vramdata_rgb_332_length;
					let pixel;
					let pixel_index;
					let i;
					let ii;
					let vramdata_rgb32;
					let len = 0;
					try{
						len = inputTileset.length / tile_size;
					}
					catch(e){
						console.log( inputTileset, inputTilesetName, newTilesetKey, handleTransparency, outputType  );
						console.log("ERROR: ", inputTileset, tile_size);
						throw "ERROR";
					}
					let arr=[];

					// Create the tempCanvas.
					let tempCanvas     = document.createElement('canvas') ;
					let tempCanvas_ctx = tempCanvas.getContext('2d');
					tempCanvas.width   = tile_width ;
					tempCanvas.height  = tile_height ;

					for(i=0; i<len; i+=1){
						curTileId = i;

						// BY VALUE: Returns the portion of the vram array buffer for the specified tileset and tile.
						// Get the tile source data. Should come as: Uint8ClampedArray(64) (Still Uzebox format.)
						vramdata_rgb_332 = core.ASSETS.graphics.tiles[ inputTilesetName ].slice(
							curTileId  * tile_size ,
							(curTileId * tile_size)+tile_size
						);

						// Set blank container (canvas imageData) for the soon to be converted tile.
						vramdata_rgb32 = tempCanvas_ctx.createImageData( tile_width, tile_height );

						// Convert the rgb332 to rbg32.
						buf8  = new Uint8ClampedArray(vramdata_rgb32.data.buffer);
						buf32 = new Uint32Array(vramdata_rgb32.data.buffer);

						vramdata_rgb_332_length = vramdata_rgb_332.length;
						for(ii=0; ii<vramdata_rgb_332_length; ii+=1){
							pixel = vramdata_rgb_332[ii];
							pixel_index = ii;
							buf32[pixel_index] = rgb_decode332( pixel, "arraybuffer_32", handleTransparency ) ;
						}

						// Write the arraybuffer to the imageData.
						vramdata_rgb32.data.set(buf8);

						if     (outputType=="canvas"){
							// Write the imageData to a canvas element.
							let canvas = document.createElement('canvas');
							canvas.width  = tile_width;
							canvas.height = tile_height;
							canvas.getContext('2d').putImageData( vramdata_rgb32, 0, 0 );

							// Store the canvas element.
							arr[curTileId]=canvas;
						}
						else if(outputType=="imageData"){
							// Store the imageData.
							arr[curTileId]=vramdata_rgb32;
						}

						// vramdata_rgb32=null;
					}

					core.GRAPHICS.tiles[newTilesetKey] = arr ;
					// arr=null;
				};
				// Graphics conversions.
				post_graphicsConversion         = function(){
					// Get the length of canvases in gamesettings.
					let len = JSGAME.PRELOAD.PHP_VARS.graphics_conversionSettings.length;

					// Go through each of those canvases...
					for(let i=0; i<len; i+=1){
						// Convert from the Uzebox format to canvas format and handle transparent pixels.
						let thisCanvas = JSGAME.PRELOAD.PHP_VARS.graphics_conversionSettings[i];
						let tilesSource = core.ASSETS.graphics.tiles[ thisCanvas.tileset ] ;

						if(!tilesSource){
							console.log(
								"WE ARE GOING TO HAVE AN ERROR!",
								"\n thisCanvas                 : ", thisCanvas,
								"\n tilesSource                : ", tilesSource,
								"\n core.ASSETS.graphics.tiles : ", core.ASSETS.graphics.tiles,
								"\n thisCanvas.tileset         : ", thisCanvas.tileset
							);
						}

						convertUzeboxTilesToCanvasTiles(
							tilesSource,
							thisCanvas.tileset ,
							thisCanvas.tileset ,
							thisCanvas.handleTransparency,
							thisCanvas.type
						);
					}
				};
				// Apply font settings. (Adds the font data from PRELOAD into core.GRAPHICS.fonts.)
				applyFontSettings               = function(){
					let keys = Object.keys(JSGAME.PRELOAD.PHP_VARS.fonts);
					let len  = keys.length;

					// Add all values.
					for(let i=0; i<len; i+=1){
						let key = keys[i];
						let rec = JSGAME.PRELOAD.PHP_VARS.fonts[key];

						core.GRAPHICS.fonts[key] = {
							"tileset"   : rec.tileset  ,
							"fontmap"   : key          ,
						};
					}

				};

				// Convert core.ASSETS.graphics.tiles to an array of canvases.
				JSGAME.SHARED.PERFORMANCE.stamp("VIDEO_INIT_post_graphicsConversion" , "START");
				post_graphicsConversion();
				JSGAME.SHARED.PERFORMANCE.stamp("VIDEO_INIT_post_graphicsConversion" , "END");

				// Add the font data from PRELOAD into core.GRAPHICS.fonts.
				JSGAME.SHARED.PERFORMANCE.stamp("VIDEO_INIT_applyFontSettings"       , "START");
				applyFontSettings();
				JSGAME.SHARED.PERFORMANCE.stamp("VIDEO_INIT_applyFontSettings"       , "END");

				// Make sure all canvases are cleared.
				JSGAME.SHARED.PERFORMANCE.stamp("VIDEO_INIT_clearAllCanvases"        , "START");
				core.FUNCS.graphics.clearAllCanvases();
				JSGAME.SHARED.PERFORMANCE.stamp("VIDEO_INIT_clearAllCanvases"        , "END");

				// TOTAL VIDEO INIT PERFORMANCE:
				JSGAME.SHARED.PERFORMANCE.stamp("VIDEO_INIT_ALL"                   , "END");

				res_VIDEO_INIT();
			},
			function(err){
				console.log("err:", err);
				rej_VIDEO_INIT();
			},
		);

	});
};

// *** Helper functions ***

// Clears each canvas.
core.FUNCS.graphics.clearAllCanvases       = function(){
	// BG layer
	if(core.GRAPHICS["ctx"].BG    ){
		core.GRAPHICS["ctx"].BG    .clearRect(0, 0, core.GRAPHICS["ctx"].BG    .canvas.width, core.GRAPHICS["ctx"].BG    .canvas.height);
	}

	// SPRITE layer
	if(core.GRAPHICS["ctx"].SPRITE){
		core.GRAPHICS["ctx"].SPRITE.clearRect(0, 0, core.GRAPHICS["ctx"].SPRITE.canvas.width, core.GRAPHICS["ctx"].SPRITE.canvas.height);
	}

	// TEXT layer
	if(core.GRAPHICS["ctx"].TEXT  ){
		core.GRAPHICS["ctx"].TEXT  .clearRect(0, 0, core.GRAPHICS["ctx"].TEXT  .canvas.width, core.GRAPHICS["ctx"].TEXT  .canvas.height);
	}

	// FADE layer
	if(core.GRAPHICS["ctx"].FADE  ){
		core.GRAPHICS["ctx"].FADE  .clearRect(0, 0, core.GRAPHICS["ctx"].FADE  .canvas.width, core.GRAPHICS["ctx"].FADE  .canvas.height);
	}

	// OUTPUT canvas
	if(core.GRAPHICS["ctx"].OUTPUT){
		core.GRAPHICS["ctx"].OUTPUT.fillStyle = "rgba(0, 0, 0, 1.0)";
		core.GRAPHICS["ctx"].OUTPUT.fillRect(0, 0, core.GRAPHICS["ctx"].OUTPUT.canvas.width, core.GRAPHICS["ctx"].OUTPUT.canvas.height);
		// core.GRAPHICS["ctx"].OUTPUT.clearRect(0, 0, core.GRAPHICS["ctx"].OUTPUT.canvas.width, core.GRAPHICS["ctx"].OUTPUT.canvas.height);
	}

	core.FUNCS.graphics.ClearVram();
	core.FUNCS.graphics.clearSprites();

	// Set the draw flags.
	core.GRAPHICS.flags.BG     = true ;
	core.GRAPHICS.flags.SPRITE = true ;
	core.GRAPHICS.flags.TEXT   = true ;
	core.GRAPHICS.flags.FADE   = true ;
	core.GRAPHICS.flags.OUTPUT = true ;

	// Set the force draw flags.
	// core.GRAPHICS.flags.BG_force     = true ;
	// core.GRAPHICS.flags.TEXT_force   = true ;
	core.GRAPHICS.flags.OUTPUT_force = true ;
};
// Add to the cache of flipped canvas files (X, Y, XY)
core.FUNCS.graphics.AddFlippedTileToCache  = function(tilesetname, tileIndex, FLIP_X, FLIP_Y, canvas){
	let flipKey = "";
	if     (FLIP_X && FLIP_Y){ flipKey="XY"; }
	else if(FLIP_X          ){ flipKey="X"; }
	else if(FLIP_Y          ){ flipKey="Y"; }

	// Does the tilesetname key NOT exist in core.GRAPHICS.tiles_flipped?
	if(core.GRAPHICS.tiles_flipped[tilesetname]==undefined){ core.GRAPHICS.tiles_flipped[tilesetname] = {}; }

	// Does the tile key NOT exist ?
	if(core.GRAPHICS.tiles_flipped[tilesetname][tileIndex]==undefined){ core.GRAPHICS.tiles_flipped[tilesetname][tileIndex] = {}; }

	// Does the flip key NOT exist ?
	if(core.GRAPHICS.tiles_flipped[tilesetname][tileIndex][flipKey]==undefined){ core.GRAPHICS.tiles_flipped[tilesetname][tileIndex][flipKey] = canvas; }
};
// Retrieve a cached flipped canvas tile (X, Y, XY)
core.FUNCS.graphics.findFlippedTileInCache = function(tilesetname, tileIndex, FLIP_X, FLIP_Y){
	let canvas;
	let flipKey = "";
	if     (FLIP_X == core.CONSTS["SPRITE_FLIP_X"] && FLIP_Y == core.CONSTS["SPRITE_FLIP_Y"] ){ flipKey="XY"; }
	else if(FLIP_X == core.CONSTS["SPRITE_FLIP_X"]                                           ){ flipKey="X";  }
	else if(FLIP_Y == core.CONSTS["SPRITE_FLIP_Y"]                                           ){ flipKey="Y";  }
	else {
		console.log("invalid flipKey!");
	}

	// Check if the cached tile exists. Will throw and exception if it is does exist.
	try{
		canvas = core.GRAPHICS.tiles_flipped[tilesetname][tileIndex][flipKey];
		if(canvas==undefined){ throw ""; }
		// console.log("Cached copy found!", canvas, tilesetname, tileIndex, FLIP_X, FLIP_Y, "flipKey:", flipKey, core.GRAPHICS.tiles_flipped[tilesetname][tileIndex], core.GRAPHICS.tiles_flipped[tilesetname][tileIndex][flipKey]);

		// Return the cached tile.
		return canvas;
	}

	// Exception thrown. Handle it by just returning false.
	catch(e){
		// console.log("Cached copy NOT found!", canvas, tilesetname, tileIndex, FLIP_X, FLIP_Y, "flipKey:", flipKey);
		return false;
	}

};
// Copies (by value) each object in the core.GRAPHICS.sprites array into core.GRAPHICS.sprites_prev.
core.FUNCS.graphics.update_sprites_prev    = function(){
	// Clear core.GRAPHICS.sprites_prev.
	// core.GRAPHICS.sprites_prev.length=0;

	// Get length of core.GRAPHICS.sprites array.
	let len = core.GRAPHICS.sprites.length;

	// Set all values in core.GRAPHICS.sprites into core.GRAPHICS.sprites_prev.
	for(let i=0; i<len; i+=1){
		core.GRAPHICS.sprites_prev[i] = {
			"flags"     : core.GRAPHICS.sprites[i].flags     ,
			"hash"      : core.GRAPHICS.sprites[i].hash      ,
			"tileIndex" : core.GRAPHICS.sprites[i].tileIndex ,
			"x"         : core.GRAPHICS.sprites[i].x << 0    ,
			"y"         : core.GRAPHICS.sprites[i].y << 0    ,
		}
	}

	// for is fastest                                   (100 sprites, 0.0029)
	// .map with Object.assign is a little slower.      (100 sprites, 0.0146)
	// JSON is slowest.                                 (100 sprites, 0.0914)

	// core.GRAPHICS.sprites_prev = core.GRAPHICS.sprites.map(a => Object.assign({}, a));
	// core.GRAPHICS.sprites_prev = JSON.parse(JSON.stringify(core.GRAPHICS.sprites));

};
// Axis-Aligned Bounding Box collision check. Checks for overlap of the two specified rectangles.
core.FUNCS.graphics.rectCollisionDetection = function(src_rect1, src_rect2){
	// Needs to be passed: x, y, w, h.

	// https://developer.mozilla.org/en-US/docs/Games/Techniques/2D_collision_detection
	let r1 = { "x": src_rect1.x , "y": src_rect1.y , "w": src_rect1.w, "h": src_rect1.h }
	let r2 = { "x": src_rect2.x , "y": src_rect2.y , "w": src_rect2.w, "h": src_rect2.h }

	// Collision detected?
	if (
		r1.x < r2.x + r2.w && //
		r1.x + r1.w > r2.x && //
		r1.y < r2.y + r2.h && //
		r1.y + r1.h > r2.y    //
	) {
		return true;
	}

	// No collision detected?
	return false;
};
// Determine which sprites are to be cleared and/or drawn.
core.FUNCS.graphics.getSpriteChanges       = function(){
	// Any sprite set to clear will have any sprites that may have overlapped the same region drawn again.

	// Detect a change in curr vs prev.
	let curr_hashes = core.GRAPHICS.sprites     .map((d) => {return d.hash; });
	let prev_hashes = core.GRAPHICS.sprites_prev.map((d) => {return d.hash; });

	// Add data to this. Will be returned at function end.
	let retval = {
		"clear"          : [],
		"draw"           : [],
		"changeDetected" : false,
	};
	let overlapped = [];

	// Different lengths? Probably the first iteration. Draw ALL sprites in curr sprites.
	if(curr_hashes.length != prev_hashes.length){
		// To CLEAR
		let len1 = core.GRAPHICS.sprites_prev.length;
		for(let i=0; i<len1; i+=1){
			retval.clear.push( {
				"flags"     : core.GRAPHICS.sprites_prev[i].flags     ,
				"tileIndex" : core.GRAPHICS.sprites_prev[i].tileIndex ,
				"x"         : core.GRAPHICS.sprites_prev[i].x << 0    ,
				"y"         : core.GRAPHICS.sprites_prev[i].y << 0    ,
			} );
		}

		// To DRAW
		let len2 = core.GRAPHICS.sprites.length;
		for(let i=0; i<len2; i+=1){
			try{
				retval.draw.push( {
					"flags"     : core.GRAPHICS.sprites[i].flags     ,
					"tileIndex" : core.GRAPHICS.sprites[i].tileIndex ,
					"x"         : core.GRAPHICS.sprites[i].x << 0    ,
					"y"         : core.GRAPHICS.sprites[i].y << 0    ,
				} );
			}
			catch(e){
				console.log("ERROR: getSpriteChanges: Cannot read value from sprite.", e, "i:", i, "sprite:", core.GRAPHICS.sprites[i], "all:", core.GRAPHICS.sprites);
			}
		}

		retval.changeDetected = true;
	}
	else{
		let len = curr_hashes.length;

		// Both hash lists should be the same length.
		for(let i=0; i<len; i+=1){
			// curr_hashes
			curr_hash = curr_hashes[i];
			prev_hash = prev_hashes[i];

			// CLEAR
			if(curr_hashes.indexOf(prev_hash) == -1 ){
				retval.clear.push( {
					"flags"     : core.GRAPHICS.sprites_prev[i].flags     ,
					"tileIndex" : core.GRAPHICS.sprites_prev[i].tileIndex ,
					"x"         : core.GRAPHICS.sprites_prev[i].x << 0    ,
					"y"         : core.GRAPHICS.sprites_prev[i].y << 0    ,
				} );

				// Check if this previous sprite was at least partially overlapping a current sprite.
				// Does this cleared sprite share its region with any existing sprites?
				for(let ii=0; ii<len; ii+=1){
					let aabb = core.FUNCS.graphics.rectCollisionDetection(
						{
							"x" : core.GRAPHICS.sprites[ii].x ,
							"y" : core.GRAPHICS.sprites[ii].y ,
							"w" : core.SETTINGS.TILE_WIDTH    ,
							"h" : core.SETTINGS.TILE_HEIGHT   ,
						},
						{
							"x" : core.GRAPHICS.sprites_prev[i].x,
							"y" : core.GRAPHICS.sprites_prev[i].y,
							"w" : core.SETTINGS.TILE_WIDTH       ,
							"h" : core.SETTINGS.TILE_HEIGHT      ,
						}
					);
					if(aabb && overlapped.indexOf( core.GRAPHICS.sprites[ii].hash ) == -1){
					// if(aabb ){
						retval.draw.push( {
							"flags"     : core.GRAPHICS.sprites[ii].flags     ,
							"tileIndex" : core.GRAPHICS.sprites[ii].tileIndex ,
							"x"         : core.GRAPHICS.sprites[ii].x << 0    ,
							"y"         : core.GRAPHICS.sprites[ii].y << 0    ,
						} );

						// Add to the overlapped array. Make sure not to draw this one twice.
						overlapped.push( core.GRAPHICS.sprites[ii].hash );
					}
				}
			}

			// DRAW
			if(prev_hashes.indexOf(curr_hash) == -1 ){
				if(overlapped.indexOf(curr_hash) == -1){
					retval.draw.push( {
						"flags"     : core.GRAPHICS.sprites[i].flags     ,
						"tileIndex" : core.GRAPHICS.sprites[i].tileIndex ,
						"x"         : core.GRAPHICS.sprites[i].x << 0    ,
						"y"         : core.GRAPHICS.sprites[i].y << 0    ,
					} );
				}
			}

			// IGNORE
			//

			retval.changeDetected = true;
		}
		// let s=peformance.now();
		// console.log(performance.now()-s);
	}

	return retval;
}

// *** Layer update functions ***

// Read through VRAM1 and update any tiles that have changed.
core.FUNCS.graphics.update_layer_BG     = function(){
	return new Promise(function(res,rej){
		let drawStart_BG;
		if(JSGAME.FLAGS.debug)       { drawStart_BG     = performance.now();      core.GRAPHICS.performance.BG.shift();     }

		if(core.GRAPHICS.flags.BG || core.GRAPHICS.flags.BG_force) {
			core.GRAPHICS.flags.OUTPUT = true;
			let canvasLayer = core.GRAPHICS["ctx"].BG;
			let y = 0 ;
			let x = 0 ;
			let thisTile;
			let i;
			let activeTileset = core.GRAPHICS.activeTileset["BG"];
			if(!activeTileset){ console.log("ERROR: update_layer_BG: Missing activeTileset!"); return; }

			let force = core.GRAPHICS.flags.BG_force;

			// If force then draw EVERYTHING in VRAM1
			if(force){
				let len = core.GRAPHICS["VRAM1"].length;
				for(i=0; i<len; i+=1){
					// VRAM BOUNDS CHECKING AND ROW INCREMENTING.
					if(x>=core.SETTINGS.VRAM_TILES_H){ x=0; y+=1; }
					if(y>=core.SETTINGS.VRAM_TILES_V){ break;     }

					// Get the tile id at this region of the vram.
					thisTile = core.GRAPHICS["VRAM1"][i];

					// Write the tile data to the tempCanvas.
					canvasLayer.drawImage(
						core.GRAPHICS.tiles[ activeTileset ][ thisTile ],
						(x*core.SETTINGS.TILE_WIDTH)  << 0,
						(y*core.SETTINGS.TILE_HEIGHT) << 0
					);

					// Increment x.
					x+=1;
				}
			}

			// Otherwise only draw what needs to be drawn.
			else{
				let len = core.GRAPHICS["VRAM1_TO_WRITE"].length;
				for(i=0; i<len; i+=1){
					let coord = core.GRAPHICS["VRAM1_TO_WRITE"][i] ;
					let x     = coord.x  ;
					let y     = coord.y  ;
					let id    = coord.id ;

					// Write the tile data to the tempCanvas.
					canvasLayer.drawImage(
						core.GRAPHICS.tiles[ activeTileset ][ id ],
						(x*core.SETTINGS.TILE_WIDTH)  << 0,
						(y*core.SETTINGS.TILE_HEIGHT) << 0
					);
				}
			}

			core.GRAPHICS["VRAM1_TO_WRITE"]=[];
		}

		if(JSGAME.FLAGS.debug)       { core.GRAPHICS.performance.BG.push(performance.now()-drawStart_BG);                   }

		res();
	});

} ;
// Read through core.GRAPHICS.sprites and update any sprites tiles that have changed.
core.FUNCS.graphics.update_layer_SPRITE = function(){
	// GETTING HERE MEANS THAT SOMETHING SPRITE-RELATED HAS CHANGED.

	return new Promise(function(res,rej){
		let drawStart_SPRITE;
		if(JSGAME.FLAGS.debug)       { drawStart_SPRITE = performance.now();      core.GRAPHICS.performance.SPRITE.shift(); }

		//
		if(core.GRAPHICS.flags.SPRITE) {
			let canvasLayer = core.GRAPHICS["ctx"].SPRITE;
			let changes     = core.FUNCS.graphics.getSpriteChanges();

			// Have there been any sprite changes?
			if(changes.changeDetected){
				// CLEAR
				let len1 = changes.clear.length;
				for(let i=0; i<len1; i+=1){
					canvasLayer.clearRect(
						(changes.clear[i].x) ,
						(changes.clear[i].y) ,
						core.SETTINGS.TILE_WIDTH,
						core.SETTINGS.TILE_HEIGHT
					);
				}

				// DRAW
				let len2 = changes.draw.length;
				for(let i=0; i<len2; i+=1){
					// Get local copies of the sprite values and flags.
					thisSprite = core.FUNCS.graphics.getSpriteData( changes.draw[i] );

					// If this sprite is off then skip this sprite.
					// if(thisSprite.SPRITE_OFF){ console.log("sprite was off!"); return; }
					if(thisSprite.SPRITE_OFF){
						// console.log("sprite was off!");
						continue;
					}

					// If the tileset name was not available, skip this sprite.
					// if(!thisSprite.tilesetname){ console.log("tileset name not found!"); return; }
					if(!thisSprite.tilesetname){
						// console.log("tileset name not found!");
						continue;
					}

					// Get the canvas for this tile.
					spriteTileData = core.GRAPHICS.tiles[ thisSprite.tilesetname ][ thisSprite.tileIndex ];

					// Does the 'spriteTileData' need to be flipped?
					if(thisSprite.SPRITE_FLIP_X || thisSprite.SPRITE_FLIP_Y){
						let cachedCanvas = false;

						// Check for a cached copy of this flipped tile.
						cachedCanvas = core.FUNCS.graphics.findFlippedTileInCache(
							thisSprite.tilesetname   ,
							thisSprite.tileIndex     ,
							thisSprite.SPRITE_FLIP_X ,
							thisSprite.SPRITE_FLIP_Y
						);

						// We got a cache hit? Good, use that instead of flipping the tile again.
						if(cachedCanvas !== false){
							spriteTileData=cachedCanvas;
						}
						// No cache hit. Flip the tile and then add it to the cache.
						else{
							// Flip the tile
							spriteTileData = core.FUNCS.graphics.flipImage_canvas(
								spriteTileData                     , // Flip this imageData.
								(thisSprite.SPRITE_FLIP_X) ? 1 : 0 , // Flip on X?
								(thisSprite.SPRITE_FLIP_Y) ? 1 : 0   // Flip on Y?
								);

							// Cache the tile.
							core.FUNCS.graphics.AddFlippedTileToCache(
								thisSprite.tilesetname   ,
								thisSprite.tileIndex     ,
								thisSprite.SPRITE_FLIP_X ,
								thisSprite.SPRITE_FLIP_Y ,
								spriteTileData
							);

						}
					}

					// Draw the tile.
					canvasLayer.drawImage(
						spriteTileData,
						(thisSprite.x) << 0,
						(thisSprite.y) << 0
					);

				}

				// Update sprites_prev.
				core.FUNCS.graphics.update_sprites_prev();

				core.GRAPHICS.flags.OUTPUT = true;
			}
			// No sprite changes? Nothing to do.
			else{
				// IGNORE
				//
			}
		}
		//

		if(JSGAME.FLAGS.debug)       { core.GRAPHICS.performance.SPRITE.push(performance.now()-drawStart_SPRITE);           }

		res();
	});

} ;
// Read through VRAM2 and update any tiles that have changed.
core.FUNCS.graphics.update_layer_TEXT   = function(){
	// core.GRAPHICS.fontSettings.tileset
	// core.GRAPHICS.fontSettings.map

	return new Promise(function(res,rej){
		let drawStart_TEXT;
		if(JSGAME.FLAGS.debug)       { drawStart_TEXT   = performance.now();      core.GRAPHICS.performance.TEXT.shift();   }

		if(core.GRAPHICS.flags.TEXT || core.GRAPHICS.flags.TEXT_force){
			core.GRAPHICS.flags.OUTPUT = true;

			let canvasLayer = core.GRAPHICS["ctx"].TEXT;

			let y = 0 ;
			let x = 0 ;
			let thisTile;
			let i;
			let activeTileset = core.GRAPHICS.fontSettings.tileset;

			if(!activeTileset){ console.log("ERROR: update_layer_TEXT: Missing activeTileset!"); return; }

			let force = core.GRAPHICS.flags.TEXT_force;

			// If force then draw EVERYTHING in VRAM2.
			if(force){
				// Go through each vram index.
				let len = core.GRAPHICS["VRAM2"].length;
				for(i=0; i<len; i+=1){
					// VRAM BOUNDS CHECKING AND ROW INCREMENTING.
					if(x>=core.SETTINGS.VRAM_TILES_H){ x=0; y+=1; }
					if(y>=core.SETTINGS.VRAM_TILES_V){ return;    }

					// Get the tile id at this region of the vram.
					thisTile      = core.GRAPHICS["VRAM2"][i];

					canvasLayer.clearRect(
						(x*core.SETTINGS.TILE_WIDTH)  << 0,
						(y*core.SETTINGS.TILE_HEIGHT) << 0,
						core.SETTINGS.TILE_WIDTH,
						core.SETTINGS.TILE_HEIGHT
					);

					// Write the tile data to the tempCanvas.
					canvasLayer.drawImage(
						core.GRAPHICS.tiles[ activeTileset ][ thisTile ],
						(x*core.SETTINGS.TILE_WIDTH)  << 0,
						(y*core.SETTINGS.TILE_HEIGHT) << 0
					);

					// Increment x.
					x+=1;
				}
			}
			else{
				let len = core.GRAPHICS["VRAM2_TO_WRITE"].length;
				for(i=0; i<len; i+=1){
					let coord = core.GRAPHICS["VRAM2_TO_WRITE"][i] ;
					let x     = coord.x  ;
					let y     = coord.y  ;
					let id    = coord.id ;

					canvasLayer.clearRect(
						(x*core.SETTINGS.TILE_WIDTH)  << 0,
						(y*core.SETTINGS.TILE_HEIGHT) << 0,
						core.SETTINGS.TILE_WIDTH,
						core.SETTINGS.TILE_HEIGHT
					);

					// Write the tile data to the tempCanvas.
					canvasLayer.drawImage(
						core.GRAPHICS.tiles[ activeTileset ][ id ],
						(x*core.SETTINGS.TILE_WIDTH)  << 0,
						(y*core.SETTINGS.TILE_HEIGHT) << 0
					);
				}
			}

		core.GRAPHICS["VRAM2_TO_WRITE"]=[];

		}

		if(JSGAME.FLAGS.debug)       { core.GRAPHICS.performance.TEXT.push(performance.now()-drawStart_TEXT);               }

		res();
	});
} ;
// Combine each layer and then draw to the output canvas.
core.FUNCS.graphics.update_layer_OUTPUT = function(){
	// Combine all layers into output and then draw the attached DOM canvas.

	return new Promise(function(res,rej){
		let drawStart_OUTPUT;
		if(JSGAME.FLAGS.debug)       { drawStart_OUTPUT = performance.now();      core.GRAPHICS.performance.OUTPUT.shift(); }
		let COMPLETED = function(){
			if(JSGAME.FLAGS.debug)       { core.GRAPHICS.performance.OUTPUT.push(performance.now()-drawStart_OUTPUT);           }

			// Clear the draw flags.
			core.GRAPHICS.flags.BG     = false ;
			core.GRAPHICS.flags.SPRITE = false ;
			core.GRAPHICS.flags.TEXT   = false ;
			core.GRAPHICS.flags.FADE   = false ;
			core.GRAPHICS.flags.OUTPUT = false ;

			// Clear the force flags.
			core.GRAPHICS.flags.BG_force     = false ;
			core.GRAPHICS.flags.SPRITE_force = false ;
			core.GRAPHICS.flags.TEXT_force   = false ;
			core.GRAPHICS.flags.OUTPUT_force = false ;

			res();
		};

		// Force the output flag if the fader is active.
		if(core.GRAPHICS.FADER.fadeActive){ core.GRAPHICS.flags.OUTPUT=true; }

		if(core.GRAPHICS.flags.OUTPUT || core.GRAPHICS.flags.OUTPUT_force){
			// Create the temp output.
			let tempOutput     = document.createElement("canvas");
			JSGAME.SHARED.setpixelated(tempOutput);
			let tempOutput_ctx = tempOutput.getContext('2d', { alpha: true });
			tempOutput.width   = core.GRAPHICS["canvas"].OUTPUT.width;
			tempOutput.height  = core.GRAPHICS["canvas"].OUTPUT.height;

			// Combine the individual layers.
			tempOutput_ctx.drawImage( core.GRAPHICS["canvas"].BG    , 0, 0) ; // BG
			tempOutput_ctx.drawImage( core.GRAPHICS["canvas"].SPRITE, 0, 0) ; // SPRITE
			tempOutput_ctx.drawImage( core.GRAPHICS["canvas"].TEXT  , 0, 0) ; // TEXT

			// Change the composite settings for the temp canvas from this point on. (default is "source-over": Draws new shapes on top of the existing canvas content.)
			// https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/globalCompositeOperation
			let prev_globalCompositeOperation = tempOutput_ctx.globalCompositeOperation ;
			// tempOutput_ctx.globalCompositeOperation = "copy";                        // Only the new shape is shown.

			// Process the tempOutput further before writing it?
			core.GRAPHICS.FADER.FUNCS.ProcessFading(tempOutput_ctx)

			// Additional full-screen modifications from the game code?
			.then ( function() {
				tempOutput_ctx.globalCompositeOperation = prev_globalCompositeOperation;
				return core.EXTERNAL.GRAPHICS(tempOutput_ctx) ;
			} )

			// Draw to the output canvas.
			.then(
				function(){
					// Combine the layers into the temp output.
					// core.GRAPHICS["ctx"].OUTPUT.clearRect(0, 0, tempOutput.width, tempOutput.height);
					core.GRAPHICS["ctx"].OUTPUT.drawImage(tempOutput,0,0); // OUTPUT
					COMPLETED();
				},
				function(err){ console.log("ERR:", err); }
			)
			.catch(function(c1){ console.log("ERROR:", c1); })
			;

		}
		else{
			COMPLETED();
		}

	});

} ;
//
core.FUNCS.graphics.update_allLayers    = function(){
	// While this flag is set, main will not run the logic loop or another graphics loop.
	core.GRAPHICS.flags.INLAYERUPDATE=true;

	// Make sure the draw flags match if the corresponding force flag is set.
	if(core.GRAPHICS.flags.BG_force)     { core.GRAPHICS.flags.BG     = true ; }
	if(core.GRAPHICS.flags.SPRITE_force) { core.GRAPHICS.flags.SPRITE = true ; }
	if(core.GRAPHICS.flags.TEXT_force)   { core.GRAPHICS.flags.TEXT   = true ; }
	if(core.GRAPHICS.flags.OUTPUT_force) { core.GRAPHICS.flags.OUTPUT = true ; }

	// If an update is not needed then the promise will resolve right away.
	let proms = [
		core.FUNCS.graphics.update_layer_BG()     ,
		core.FUNCS.graphics.update_layer_SPRITE() ,
		core.FUNCS.graphics.update_layer_TEXT()   ,
	];

	Promise.all(proms).then(
		function(){
			core.FUNCS.graphics.update_layer_OUTPUT().then(
				function(){
					// Allowing another game loop.
					core.GRAPHICS.flags.INLAYERUPDATE=false;
				},
				function(err){ console.log("ERR:", err);  }
			);
		},
		function(err){ console.log("ERR:", err); },
	);

};

// *** VRAM update functions.

// Sets the tileset to use when drawing bg tiles.
core.FUNCS.graphics.SetTileTable = function(tileset){
	// Make sure that the tileset is actually available.
	if(core.ASSETS.graphics.tilesetNames.indexOf(tileset) != -1){ core.GRAPHICS.activeTileset["BG"] = tileset ; }
	else { throw new Error('INVALID TILE TABLE NAME! '  + tileset); }

	// Indicate that a background draw is needed.
	core.GRAPHICS.flags.BG=true;
};
// Sets all values in the specified VRAM to 0.
core.FUNCS.graphics.ClearVram    = function(vram_str){
	// vram_str can be 'VRAM1' or 'VRAM2'
	// If neither is specified then both will be cleared.

	let doboth = false;

	// Was vram NOT specified?
	if( vram_str == undefined ){ doboth = true; }

	if(vram_str=='VRAM1' || doboth==true){
		// Clear VRAM1 and VRAM1_TO_WRITE.
		core.GRAPHICS["VRAM1"].fill(0);
		core.GRAPHICS["VRAM1_TO_WRITE"]=[];

		// Indicate that a draw is required for this layer.
		core.GRAPHICS.flags.BG       = true;
		core.GRAPHICS.flags.BG_force = true;
	}

	if(vram_str=='VRAM2' || doboth==true){
		// Clear VRAM2 and VRAM2_TO_WRITE.
		core.GRAPHICS["VRAM2"].fill(0);
		core.GRAPHICS["VRAM2_TO_WRITE"]=[];

		// Indicate that a draw is required for this layer.
		core.GRAPHICS.flags.TEXT       = true;
		core.GRAPHICS.flags.TEXT_force = true;
	}

	// Redundant?
	core.GRAPHICS.flags.OUTPUT_force = true;
};
// Draws a bg tile to the specified location.
core.FUNCS.graphics.SetTile      = function(x, y, id, vram_str){
	// vram_str can be 'VRAM1' or 'VRAM2'
	if( vram_str==undefined ){ vram_str = 'VRAM1'; }

	// Determine the VRAM index.
	let addr = ( y * core.SETTINGS['VRAM_TILES_H'] ) + x ;

	// Update VRAMx_TO_WRITE.
	core.GRAPHICS[vram_str+"_TO_WRITE"].push({
		"x"  : x  ,
		"y"  : y  ,
		"id" : id ,
	});

	// Make the change.
	core.GRAPHICS[vram_str][ addr ] = id;

	// Indicate that a background draw is needed.
	if     (vram_str=='VRAM1'){ core.GRAPHICS.flags.BG   = true; }
	else if(vram_str=='VRAM2'){ core.GRAPHICS.flags.TEXT = true; }
};
// Draws a tile map to the specified location.
core.FUNCS.graphics.DrawMap2     = function(x, y, map, vram_str){
	// Draw a tilemap to the specified VRAM.

	// vram_str can be 'VRAM1' or 'VRAM2'
	if( vram_str==undefined ){ vram_str = 'VRAM1'; }

	// Width and height should be the first values in a tilemap.
	let mapWidth  = map[0] ;
	let mapHeight = map[1] ;

	// Set the tiles.
	for(let dy = 0; dy < mapHeight; dy++){
		for(let dx = 0; dx < mapWidth; dx++){
			core.FUNCS.graphics.SetTile(x + dx, y + dy, map[ (dy * mapWidth) + dx + 2 ], vram_str);
		}
	}
};
// Fills a rectangular region with the specified tile id.
core.FUNCS.graphics.Fill         = function(xpos, ypos, w, h, tileid, vram_str){
	// vram_str can be 'VRAM1' or 'VRAM2'
	if( vram_str == undefined ){ vram_str='VRAM1'; }

	// Indicate that a background draw is needed.
	if(vram_str=='VRAM1'){ core.GRAPHICS.flags.BG   = true; }
	if(vram_str=='VRAM2'){ core.GRAPHICS.flags.TEXT = true; }

	for(let y=0; y<h; y+=1){
		for(let x=0; x<w; x+=1){
			// Update VRAM
			core.FUNCS.graphics.SetTile(x+xpos, y+ypos, tileid, vram_str);
		}
	}
};
//
// core.FUNCS.graphics.getTilemap   = function(tilemap_str){
// 	let tilemap = core.ASSETS.graphics.tilemaps[tilemap_str];
// 	if(tilemap){ return tilemap; }
// 	else{ return new Uint8ClampedArray([0,0]); }
// }

// *** SPRITE update functions. ***

// Clears the core.GRAPHICS.sprites array.
core.FUNCS.graphics.clearSprites       = function(){
	// Blank out sprites and sprites_prev.
	core.GRAPHICS.sprites=[];
	core.GRAPHICS.sprites_prev=[];

	// Set the force draw flag on the sprites.
	core.GRAPHICS.flags.SPRITE = true ;
	core.GRAPHICS.flags.SPRITE_force = true ;

	// Clear the canvas.
	if(core.GRAPHICS["ctx"].SPRITE){
		core.GRAPHICS["ctx"].SPRITE.clearRect(0, 0, core.GRAPHICS["ctx"].SPRITE.canvas.width, core.GRAPHICS["ctx"].SPRITE.canvas.height);
	}
};
// Sets the tileset for the specified sprite bank.
core.FUNCS.graphics.SetSpritesTileBank = function(bank, tileset){
	// Make sure that the tileset is actually available.
	if(core.ASSETS.graphics.tilesetNames.indexOf(tileset) != -1){
		core.GRAPHICS.spritebanks[bank] = tileset;
	}
	else{
		throw new Error('INVALID TILE TABLE NAME! ' + tileset);
	}

	// Indicate that a sprite draw is needed.
	core.GRAPHICS.flags.SPRITE  = true ;
};
// Returns hash of parts of the provide object (should be a sprite.)
core.FUNCS.graphics.hashSprite         = function(obj){
	// NOTE: If any of these values are NaN, null, or undefined then this function will fail.

	let toReturn = "";

	// Try the normal way.
	try{
		// console.log(obj);
		toReturn =  "X:"         + (obj.x         .toString()) + "_" +
					"Y:"         + (obj.y         .toString()) + "_" +
					"TILEINDEX:" + (obj.tileIndex .toString()) + "_" +
					"FLAGS:"     + (obj.flags     .toString())
		;
	}
	// Error somewhere.
	catch(e){
		console.log("ERROR: hashSprite: ", e, obj);
		toReturn =  "X:"         + (obj.x         + '') + "_" +
					"Y:"         + (obj.y         + '') + "_" +
					"TILEINDEX:" + (obj.tileIndex + '') + "_" +
					"FLAGS:"     + (obj.flags     + '')
		;
	}

	return toReturn ;
};
// Adds the tiles of a sprite map to the sprites array.
core.FUNCS.graphics.MapSprite2         = function(startSprite, map, spriteFlags){
	// Make sure that a map was actually passed.
	if(map==undefined){
		// console.log( "startSprite, map, spriteFlags:", startSprite, map, spriteFlags );
		return;
	}

	let mapWidth  = map[0] ;
	let mapHeight = map[1] ;
	let x  ;
	let y  ;
	let dx ;
	let dy ;
	let t  ;
	let numSprites = mapWidth * mapHeight;

	// Flip on X?
	if(spriteFlags & core.CONSTS["SPRITE_FLIP_X"]){
		x  = (mapWidth-1);
		dx = -1;
	}
	else{
		x  = 0;
		dx = 1;
	}

	// Flip on Y?
	if(spriteFlags & core.CONSTS["SPRITE_FLIP_Y"]){
		y  = (mapHeight-1);
		dy = -1;
	}
	else{
		y  = 0;
		dy = 1;
	}

	for(let i=0; i<numSprites; i+=1){
		core.GRAPHICS.sprites[startSprite+i] = {
			"x"         : 0 ,
			"y"         : 0 ,
			"tileIndex" : 0 ,
			"flags"     : 0 ,
			"hash"      : "",
		};
	}

	// Place the sprite tile ids in order.
	for(let cy=0;cy<mapHeight;cy++){
		for(let cx=0;cx<mapWidth;cx++){
			t=map[(y*mapWidth)+x+2];
			core.GRAPHICS.sprites[startSprite].tileIndex = t           ;
			core.GRAPHICS.sprites[startSprite].flags     = spriteFlags ;
			x += dx;

			// Create the hash for this sprite.
			core.GRAPHICS.sprites[startSprite].hash = core.FUNCS.graphics.hashSprite( core.GRAPHICS.sprites[startSprite] );

			// Increment the start sprite number.
			startSprite++;
		}
		y += dy;
		x = (spriteFlags & core.CONSTS["SPRITE_FLIP_X"]) ? (mapWidth-1) : 0 ;
	}

	// Indicate that a sprite draw is needed.
	core.GRAPHICS.flags.SPRITE=true;
};
// Updates the sprites of an already allocated sprite map in the sprites array.
core.FUNCS.graphics.MoveSprite         = function(startSprite, x, y, width, height){
	let dy;
	let dx;

	for (dy = 0; dy < height; dy++){
		for (dx = 0; dx < width; dx++){
			core.GRAPHICS.sprites[startSprite].x = (x + (core.SETTINGS.TILE_WIDTH  * dx)) << 0;
			core.GRAPHICS.sprites[startSprite].y = (y + (core.SETTINGS.TILE_HEIGHT * dy)) << 0;

			// Create/update the hash for this sprite.
			core.GRAPHICS.sprites[startSprite].hash = core.FUNCS.graphics.hashSprite( core.GRAPHICS.sprites[startSprite] );

			// Increment the start sprite number.
			startSprite++;
		}
	}

	// Indicate that a sprite draw is needed.
	core.GRAPHICS.flags.SPRITE=true;
};
//
core.FUNCS.graphics.getSpriteData      = function(thisSprite){
	// Get local copies of the sprite values and flags.
	let x           = thisSprite.x         ;
	let y           = thisSprite.y         ;
	let tileIndex   = thisSprite.tileIndex ;
	let flags       = thisSprite.flags     ;

	// Determine what the sprite flags have been set to.
	let SPRITE_OFF        = (core.CONSTS["SPRITE_OFF"] & flags) == core.CONSTS["SPRITE_OFF"]   ? 1 : 0 ;

	let SPRITE_FLIP_X = flags & core.CONSTS["SPRITE_FLIP_X"] ;
	let SPRITE_FLIP_Y = flags & core.CONSTS["SPRITE_FLIP_Y"] ;

	// Determine what the sprite flags have been set to.
	let SPRITE_RAM        = (core.CONSTS["SPRITE_RAM"]   & flags) == core.CONSTS["SPRITE_RAM"]   ? 1 : 0 ;
	let SPRITE_BANK0      = (core.CONSTS["SPRITE_BANK0"] & flags) == core.CONSTS["SPRITE_BANK0"] ? 1 : 0 ;
	let SPRITE_BANK1      = (core.CONSTS["SPRITE_BANK1"] & flags) == core.CONSTS["SPRITE_BANK1"] ? 1 : 0 ;
	let SPRITE_BANK2      = (core.CONSTS["SPRITE_BANK2"] & flags) == core.CONSTS["SPRITE_BANK2"] ? 1 : 0 ;
	let SPRITE_BANK3      = (core.CONSTS["SPRITE_BANK3"] & flags) == core.CONSTS["SPRITE_BANK3"] ? 1 : 0 ;

	// Determine the sprite bank in use for this sprite.
	let tilesetname;
	if     ( SPRITE_BANK0 ){ tilesetname = core.GRAPHICS.spritebanks[0] ; }
	else if( SPRITE_BANK1 ){ tilesetname = core.GRAPHICS.spritebanks[1] ; }
	else if( SPRITE_BANK2 ){ tilesetname = core.GRAPHICS.spritebanks[2] ; }
	else if( SPRITE_BANK3 ){ tilesetname = core.GRAPHICS.spritebanks[3] ; }
	else                   { tilesetname = ""; }

	// Return the data as an object.
	return {
		tilesetname   : tilesetname   ,
		SPRITE_RAM    : SPRITE_RAM    ,
		SPRITE_OFF    : SPRITE_OFF    ,
		SPRITE_FLIP_X : SPRITE_FLIP_X ,
		SPRITE_FLIP_Y : SPRITE_FLIP_Y ,
		x             : x             ,
		y             : y             ,
		tileIndex     : tileIndex     ,
		flags         : flags         ,
	};
};
// Flips a canvas on X and/or Y.
core.FUNCS.graphics.flipImage_canvas   = function (srcCanvas, flipH, flipV) {
	// Accepts a canvas, creates a new temp canvas to do the flip then returns the new canvas.
	// Originally based on work from: yong: http://jsfiddle.net/yong/ZJQX5/

	// Create temporary canvas to match the srcCanvas.
	let destCanvas = document.createElement("canvas");
	let destCanvas_ctx = destCanvas.getContext('2d');
	destCanvas.width  = srcCanvas.width  ;
	destCanvas.height = srcCanvas.height ;

	// Determine the settings for the flip.
	let scaleH = flipH ? -1                     : 1; // Set horizontal scale to -1 if flip horizontal
	let scaleV = flipV ? -1                     : 1; // Set verical scale to -1 if flip vertical
	let posX   = flipH ? destCanvas.width  * -1 : 0; // Set x position to -100% if flip horizontal
	let posY   = flipV ? destCanvas.height * -1 : 0; // Set y position to -100% if flip vertical

	// Do the flip.
	destCanvas_ctx.save();                                                                // Save the current state
	destCanvas_ctx.scale(scaleH, scaleV);                                                 // Set scale to flip the image
	destCanvas_ctx.drawImage(srcCanvas, posX, posY, destCanvas.width, destCanvas.height); // Draw the image
	destCanvas_ctx.restore();                                                             // Restore the last saved state

	// Return the temp canvas
	return destCanvas;
};

// *** TEXT update functions. ***

// Prints a line of text at the specified location.
core.FUNCS.graphics.Print   = function(x, y, string, vram_str){
	let tileid;
	let fontmap   = core.ASSETS.graphics.tilemaps[core.GRAPHICS.fontSettings.fontmap];

	// Make sure that only a whole number makes it through.
	x = (x) << 0;
	y = (y) << 0;

	if( vram_str==undefined ){ vram_str='VRAM2'; }

	// This assumes that the correct tileset and tilemap for the fonts have already been set.
	// Font tiles are expected to be in the following order in the fontmap:
	//    !  "  #  $  %  &  '  (  )  *  +  ,  -  .  /
	// 0  1  2  3  4  5  6  7  8  9  :  ;  <  =  >  ?
	// @  A  B  C  D  E  F  G  H  I  J  K  L  M  N  O
	// P  Q  R  S  T  U  V  W  X  Y  Z  [  c  ]  ^  _

	// Turn the string into an iterable array.
	Array.from( string ).forEach(function(d,i,a){
		tileid = d.toUpperCase().charCodeAt() - 32;
		core.FUNCS.graphics.SetTile(x, y, fontmap[ tileid+2 ], vram_str );
		x+=1;
	});
};
// Set the font to use.
core.FUNCS.graphics.SetFont = function(fontmap){
	let font = core.GRAPHICS.fonts[fontmap];
	if(!font){ console.log("Font name was NOT found."); return ; }

	// Updates the tileset that will be used for the fonts.
	core.GRAPHICS.activeTileset["TEXT"]  = core.GRAPHICS.fonts[fontmap]["tileset"]   ;
	core.GRAPHICS.fontSettings.tileset   = core.GRAPHICS.fonts[fontmap]["tileset"]   ;

	// Updates the tilemap that will be used for the fonts.
	core.GRAPHICS.fontSettings.fontmap   = core.GRAPHICS.fonts[fontmap]["fontmap"]   ;
};

// Draws a tilemap but uses the specified w and h to specify the dimensions.
core.FUNCS.graphics.DrawMap_customDimensions = function(x, y, w, h, map, vram_str){
	// EXAMPLES:
	// core.FUNCS.graphics.DrawMap_customDimensions(0, 0, core.SETTINGS.VRAM_TILES_H, 1,                          core.ASSETS.graphics.tilemaps["nums_0_9_wh"], "VRAM2");
	// core.FUNCS.graphics.DrawMap_customDimensions(0, 0, 1                         , core.SETTINGS.VRAM_TILES_V, core.ASSETS.graphics.tilemaps["nums_0_9_wv"], "VRAM2");
	// core.FUNCS.graphics.DrawMap_customDimensions(0, 0, core.SETTINGS.VRAM_TILES_H, 1,                          core.ASSETS.graphics.tilemaps["nums_0_9_bh"], "VRAM2");
	// core.FUNCS.graphics.DrawMap_customDimensions(0, 0, 1                         , core.SETTINGS.VRAM_TILES_V, core.ASSETS.graphics.tilemaps["nums_0_9_bv"], "VRAM2");

	if( vram_str==undefined ){ vram_str='VRAM2'; }

	let mapWidth  = map[0] ;
	let mapHeight = map[1] ;
	let numMapTiles = mapWidth * mapHeight;

	let tilesToDraw = w * h;

	let xpos=0; let ypos=0; let tileid; let reducer; let mults=0;
	for(let i=0; i<tilesToDraw; i+=1){
		// Bounds checking.
		if(x+xpos>=core.SETTINGS.VRAM_TILES_H || x+xpos >= w){ xpos=0; ypos+=1; }
		if(y+ypos>=core.SETTINGS.VRAM_TILES_V || y+ypos >= h){ return;          }

		// More bounds checking
		mults = parseInt( i/numMapTiles );
		let tilecoord = ((ypos * mapWidth) + xpos + 2) - (mults*numMapTiles);

		core.FUNCS.graphics.SetTile(x + xpos, y + ypos, map[ tilecoord ], vram_str);

		xpos+=1;
	}
};

// *** FADE update functions. ***

// Processes the fade.
core.GRAPHICS.FADER.FUNCS.ProcessFading = function(ctx){
	return new Promise(function(res,rej){
			let drawStart_FADE;
			if(JSGAME.FLAGS.debug)       { drawStart_FADE   = performance.now();      core.GRAPHICS.performance.FADE.shift();   }

			let lastIndex = core.GRAPHICS.FADER.CONSTS["FADER_STEPS"] -1 ;

			//
			let COMPLETED = function(){
				// If there was a fadeOut and the stayDark flag is set then draw a black screen.
				if(core.GRAPHICS.FADER.stayDark){
					ctx.fillStyle = "#000022";
					ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
				}

				if(JSGAME.FLAGS.debug)       { core.GRAPHICS.performance.FADE.push(performance.now()-drawStart_FADE);           }

				res();
			};
			//
			let fadeIsInactive      = function(){
				COMPLETED();
				return;
			};
			//
			let fadeOutHasCompleted = function(){
				// Return the darkened version.

				// Make sure that OUTPUT is true.
				core.GRAPHICS.flags.OUTPUT = true ;

				// Just draw what already exists for the FADE layer.
				ctx.drawImage(core.GRAPHICS["canvas"].FADE, 0,0);
				core.GRAPHICS["ctx"].FADE.drawImage(ctx.canvas, 0,0);

				core.GRAPHICS.FADER.stayDark=true;
				core.GRAPHICS.FADER.fadeActive=false;

				if(core.GRAPHICS.FADER.blockAfterFade){ core.GRAPHICS.FADER.blocking = true  ; }
				else                                  { core.GRAPHICS.FADER.blocking = false ; }

				COMPLETED();
				return;

			};
			//
			let fadeInHasCompleted  = function(){
				// Make sure that OUTPUT is true.
				core.GRAPHICS.flags.OUTPUT = true ;

				// No changes. No change in the passed canvas.
				// Fading is done!
				core.GRAPHICS.FADER.stayDark=false;
				core.GRAPHICS.FADER.fadeActive=false;

				if(core.GRAPHICS.FADER.blockAfterFade){ core.GRAPHICS.FADER.blocking = true  ; }
				else                                  { core.GRAPHICS.FADER.blocking = false ; }

				COMPLETED();
				return;
			};
			//
			let doNewFade          = function(fadeStep){
				let width  = ctx.canvas.width;
				let height = ctx.canvas.height;
				let img;

				img = ctx.getImageData(0, 0, width, height);

				core.WORKERS.VIDEO.onmessage=function(e){
					core.WORKERS.VIDEO.onmessage=null;

					// let imgData = new ImageData( new Uint8ClampedArray( e.data.modbuf ), width, height);
					let arr     = new Uint8ClampedArray( e.data.modbuf );
					let imgData = new ImageData(arr, width, height);

					// Copy the image to the FADE canvas (can be used later if the other layers do not change.)
					core.GRAPHICS["ctx"].FADE.putImageData(imgData, 0,0);

					// Copy the image to the passed ctx.
					ctx.putImageData(imgData, 0,0);

					// Reset the counter.
					core.GRAPHICS.FADER.currFadeFrame=core.GRAPHICS.FADER.fadeSpeed;

					// Record previous fade step.
					core.GRAPHICS.FADER.prevFadeStep = fadeStep ;

					// Is this the end of a fadeOut?
					if      ( core.GRAPHICS.FADER.fadeDir == -1 && core.GRAPHICS.FADER.fadeStep==0         ){ fadeOutHasCompleted(); }

					// Is this the end of a fadeIn?
					else if ( core.GRAPHICS.FADER.fadeDir ==  1 && core.GRAPHICS.FADER.fadeStep==lastIndex ){ fadeInHasCompleted(); }

					// Fade steps still remain!
					else{
						// Adjust to the new fade index.
						core.GRAPHICS.FADER.fadeStep += core.GRAPHICS.FADER.fadeDir ;

						COMPLETED();

						return;
					}

				};

				core.WORKERS.VIDEO   .postMessage(
					{
						"func"     : "fade",
						"maxRed"   : core.GRAPHICS.FADER.CONSTS["fader"][fadeStep].r ,
						"maxGreen" : core.GRAPHICS.FADER.CONSTS["fader"][fadeStep].g ,
						"maxBlue"  : core.GRAPHICS.FADER.CONSTS["fader"][fadeStep].b ,
						"buf"      : img.data.buffer,
					} ,
					[
						img.data.buffer
					]
				);

			};
			let doNewFade_withOffscreenCanvas           = function(fadeStep){
				// ... haven't figured out a way to do this correctly yet...
				doNewFade(fadeStep); return;

				// function createOffscreenCanvas(width,height) {
				// 	var offScreenCanvas= document.createElement('canvas');
				// 	offScreenCanvas.width = width  + 'px';
				// 	offScreenCanvas.height= height + 'px';
				// 	var context= offScreenCanvas.getContext("2d");
				// 	context.fillRect(10,10,200,200);
				// 	return offScreenCanvas;
				// }

				// let width  = ctx.canvas.width;
				// let height = ctx.canvas.height;

				// let canvas = createOffscreenCanvas(width,height);

				// // let tmp_canvas     = document.createElement("canvas");
				// // let tmp_canvas_ctx = tmp_canvas.getContext("bitmaprenderer");

				// // img = ctx.canvas.transferToImageBitmap();
				// // ctx.globalCompositeOperation = "copy";

				// // off_canvas = document.createElement("canvas");
				// // off_canvas.width  = width ;
				// // off_canvas.height = height;

				// // transferControlToOffscreen
				// // off_canvas = new OffscreenCanvas(width, height);// .getContext("2d");
				// // off_canvas_ctx = off_canvas.getContext("2d");
				// // delete off_canvas_ctx;

				// core.WORKERS.VIDEO.onmessage=function(e){
				// 	core.WORKERS.VIDEO.onmessage=null;

				// 	// let imgData = new ImageData( new Uint8ClampedArray( e.data.modbuf ), width, height);
				// 	let arr     = new Uint8ClampedArray( e.data.modbuf );
				// 	let imgData = new ImageData(arr, width, height);

				// 	// Copy the image to the FADE canvas (can be used later if the other layers do not change.)
				// 	core.GRAPHICS["ctx"].FADE.putImageData(imgData, 0,0);

				// 	// Copy the image to the passed ctx.
				// 	ctx.putImageData(imgData, 0,0);

				// 	// Reset the counter.
				// 	core.GRAPHICS.FADER.currFadeFrame=core.GRAPHICS.FADER.fadeSpeed;

				// 	// Record previous fade step.
				// 	core.GRAPHICS.FADER.prevFadeStep = fadeStep ;

				// 	// Is this the end of a fadeOut?
				// 	if      ( core.GRAPHICS.FADER.fadeDir == -1 && core.GRAPHICS.FADER.fadeStep==0         ){ fadeOutHasCompleted(); }

				// 	// Is this the end of a fadeIn?
				// 	else if ( core.GRAPHICS.FADER.fadeDir ==  1 && core.GRAPHICS.FADER.fadeStep==lastIndex ){ fadeInHasCompleted(); }

				// 	// Fade steps still remain!
				// 	else{
				// 		// Adjust to the new fade index.
				// 		core.GRAPHICS.FADER.fadeStep += core.GRAPHICS.FADER.fadeDir ;

				// 		COMPLETED();

				// 		return;
				// 	}

				// };

				// core.WORKERS.VIDEO   .postMessage(
				// 	{
				// 		"func"     : "fade_withOffscreenCanvas",
				// 		"maxRed"   : core.GRAPHICS.FADER.CONSTS["fader"][fadeStep].r ,
				// 		"maxGreen" : core.GRAPHICS.FADER.CONSTS["fader"][fadeStep].g ,
				// 		"maxBlue"  : core.GRAPHICS.FADER.CONSTS["fader"][fadeStep].b ,
				// 		// "canvas"   : ctx.canvas,
				// 		"canvas"   : canvas,
				// 	} ,
				// 	[
				// 	]
				// );

			};
			//
			let addExistingFade    = function(){
				let BG     = core.GRAPHICS.flags.BG     ;
				let SPRITE = core.GRAPHICS.flags.SPRITE ;
				let TEXT   = core.GRAPHICS.flags.TEXT   ;
				// let FADE   = core.GRAPHICS.flags.FADE   ;
				// let OUTPUT = core.GRAPHICS.flags.OUTPUT ;

				// If the BG, SPRITE, and TEXT layers have NOT changed then we can just redraw from cache.
				if( !BG && !SPRITE && !TEXT ){
					// Update the passed ctx with the cached layer.
					ctx.drawImage(core.GRAPHICS["canvas"].FADE, 0,0);
					COMPLETED();
					return;
				}

				// Otherwise, a new fade must be calculated.
				else{
					// doNewFade( core.GRAPHICS.FADER.fadeStep );

					if( core.CONSTS["OffscreenCanvas_supported"] ){ doNewFade_withOffscreenCanvas( core.GRAPHICS.FADER.fadeStep ); }
					else                                          { doNewFade( core.GRAPHICS.FADER.fadeStep ); }

					return;
				}

			};

			// Is the fader active?
			if(core.GRAPHICS.FADER.fadeActive==false){ fadeIsInactive(); return; }
			// Yes the fader is active.
			else{
				// Shortened variables (don't use these to update with.)
				let fadeStep     = core.GRAPHICS.FADER.fadeStep    ;
				let prevFadeStep = core.GRAPHICS.FADER.prevFadeStep;

				// Will an adjustment need to be done? (Checking for a change in fadeStep.)
				if( prevFadeStep != fadeStep ){
					// Are we ready for the next fade frame?
					if(core.GRAPHICS.FADER.currFadeFrame == 0){
						// Do the fade.
						// doNewFade(fadeStep);
						if( core.CONSTS["OffscreenCanvas_supported"] ){ doNewFade_withOffscreenCanvas( fadeStep ); }
						else                                          { doNewFade( fadeStep ); }

						return;
					}

					// No? Decrement the counter.
					else{
						core.GRAPHICS.FADER.currFadeFrame -= 1;

						// Can we send the existing FADE canvas or do we need to update first?
						if(core.GRAPHICS.flags.OUTPUT){ addExistingFade(); return; }
					}
				}
				else{ addExistingFade(); return; }

			}

	});
};
// Starts the fade.
core.GRAPHICS.FADER.FUNCS.doFade        = function(speed, blocking, blockAfterFade){
	if(blockAfterFade==undefined){ blockAfterFade=false; }

	core.GRAPHICS.FADER.fadeIn_complete  = false;
	core.GRAPHICS.FADER.fadeOut_complete = false;

	core.GRAPHICS.FADER.stayDark      = false;

	core.GRAPHICS.FADER.blockAfterFade = blockAfterFade;

	core.GRAPHICS.FADER.fadeActive    = true     ;
	core.GRAPHICS.FADER.currFadeFrame = 0        ; //
	core.GRAPHICS.FADER.fadeSpeed     = speed    ;
	core.GRAPHICS.FADER.blocking      = blocking ;
};
// Sets up a fade out.
core.GRAPHICS.FADER.FUNCS.FadeIn        = function(speed, blocking, blockAfterFade){
	if(blockAfterFade==undefined){ blockAfterFade=false; }

	core.GRAPHICS.FADER.prevFadeStep = 99;
	core.GRAPHICS.FADER.fadeStep     = 0;
	core.GRAPHICS.FADER.fadeDir      = 1;
	core.GRAPHICS.FADER.FUNCS.doFade(speed, blocking, blockAfterFade);
};
// Sets up a fade in.
core.GRAPHICS.FADER.FUNCS.FadeOut       = function(speed, blocking, blockAfterFade){
	if(blockAfterFade==undefined){ blockAfterFade=false; }

	core.GRAPHICS.FADER.prevFadeStep = 99;
	core.GRAPHICS.FADER.fadeStep     = core.GRAPHICS.FADER.CONSTS["FADER_STEPS"]-1;
	core.GRAPHICS.FADER.fadeDir      = -1;
	core.GRAPHICS.FADER.FUNCS.doFade(speed, blocking, blockAfterFade);
};
// Logic blockers for fades.
core.GRAPHICS.FADER.FUNCS.blockLogic    = function(newValue){
	core.GRAPHICS.FADER.blocking       = newValue;
	core.GRAPHICS.FADER.blockAfterFade = newValue;
};
