// KEYS
core.ASSETS  .graphics       = {} ; // Unchanging assets.
core.FUNCS   .graphics       = {} ; // Functions for handling graphics.
core.FUNCS   .graphics.FADER = {} ; //
core.GRAPHICS.debug          = {} ; //
core.GRAPHICS.debug.flags    = {} ; //
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
// core.GRAPHICS.flags.SPRITE_force = false ; // Forcing the drawing even if it normally would not draw.
core.GRAPHICS.flags.TEXT_force   = false ; // Forcing the drawing even if it normally would not draw.
// core.GRAPHICS.flags.FADE_force   = false ; // Forcing the drawing even if it normally would not draw.
core.GRAPHICS.flags.OUTPUT_force = false ; // Forcing the drawing even if it normally would not draw.

// FLAGS - Override of the drawing of individual layers.
core.GRAPHICS.debug.flags.BG      = true ; // If flag is unset then this layer draw will be skipped.
core.GRAPHICS.debug.flags.SPRITE  = true ; // If flag is unset then this layer draw will be skipped.
core.GRAPHICS.debug.flags.TEXT    = true ; // If flag is unset then this layer draw will be skipped.
core.GRAPHICS.debug.flags.FADE    = true ; // If flag is unset then this layer draw will be skipped.
core.GRAPHICS.debug.flags.OUTPUT  = true ; // If flag is unset then this layer draw will be skipped.

// PERFORMANCE MONITORING
core.GRAPHICS.performance.BG      = [ 0, 0, 0, 0, 0 ,  0, 0, 0, 0, 0,  0, 0, 0, 0, 0,  0, 0, 0, 0, 0 ] ; //
core.GRAPHICS.performance.SPRITE  = [ 0, 0, 0, 0, 0 ,  0, 0, 0, 0, 0,  0, 0, 0, 0, 0,  0, 0, 0, 0, 0 ] ; //
core.GRAPHICS.performance.TEXT    = [ 0, 0, 0, 0, 0 ,  0, 0, 0, 0, 0,  0, 0, 0, 0, 0,  0, 0, 0, 0, 0 ] ; //
core.GRAPHICS.performance.FADE    = [ 0, 0, 0, 0, 0 ,  0, 0, 0, 0, 0,  0, 0, 0, 0, 0,  0, 0, 0, 0, 0 ] ; //
core.GRAPHICS.performance.OUTPUT  = [ 0, 0, 0, 0, 0 ,  0, 0, 0, 0, 0,  0, 0, 0, 0, 0,  0, 0, 0, 0, 0 ] ; //

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
core.CONSTS["SPRITE_BANK3"]     = 3<<6 ; // 3<<6 is 192 (B 11000000)

// *** FADER ***
// *** PART OF: core.FUNCS   .graphics.FADER ***

// Fade table created by tim1724
// Modified for JavaScript by nicksen782.
core.CONSTS["FADER_STEPS"] = 12 ;
core.CONSTS["fader"] = [
	//                                        BB GGG RRR   B G R     DEC       HEX
	/* 0  */ { b: 0  , g: 0   , r: 0   } , // 00 000 000   0 0 0   , 0     ,   0x00
	/* 1  */ { b: 33 , g: 0   , r: 0   } , // 01 000 000   1 0 0   , 64    ,   0x40
	/* 2  */ { b: 66 , g: 14  , r: 0   } , // 10 001 000   2 1 0   , 136   ,   0x88
	/* 3  */ { b: 66 , g: 28  , r: 14  } , // 10 010 001   2 2 1   , 145   ,   0x91
	/* 4  */ { b: 100, g: 28  , r: 28  } , // 11 010 010   3 2 2   , 210   ,   0xD2
	/* 5  */ { b: 100, g: 57  , r: 57  } , // 11 100 100   3 4 4   , 228   ,   0xE4
	/* 6  */ { b: 66 , g: 71  , r: 71  } , // 10 101 101   2 5 5   , 173   ,   0xAD
	/* 7  */ { b: 66 , g: 85  , r: 71  } , // 10 110 101   2 6 5   , 181   ,   0xB5
	/* 8  */ { b: 66 , g: 85  , r: 85  } , // 10 110 110   2 6 6   , 182   ,   0xB6
	/* 9  */ { b: 66 , g: 100 , r: 85  } , // 10 111 110   2 7 6   , 190   ,   0xBE
	/* 10 */ { b: 66 , g: 100 , r: 100 } , // 10 111 111   2 7 7   , 191   ,   0xBF
	/* 11 */ { b: 100, g: 100 , r: 100 } , // 11 111 111   3 7 7   , 255   ,   0xFF
];
core.FUNCS.graphics.FADER.fadeStep      = 0     ;
core.FUNCS.graphics.FADER.fadeSpeed     = 0     ;
core.FUNCS.graphics.FADER.currFadeFrame = 0     ;
core.FUNCS.graphics.FADER.fadeDir       = 1     ;
core.FUNCS.graphics.FADER.fadeActive    = false ;
core.FUNCS.graphics.FADER.blocking      = false ;
core.FUNCS.graphics.FADER.stayDark      = false ;
core.FUNCS.graphics.FADER.lastFadeFrame = false ;

// *** Init conversion functions - Removed after use. ***

core.FUNCS.graphics.init = function(){
	return new Promise(function(resolve,reject){
		JSGAME.CORE_SETUP_PERFORMANCE.starts.VIDEO  = performance.now();

		// Copy some PRELOAD settings into core.SETTINGS.
		let settingsSetup = function(){
			// Set the game settings and game consts.
			core.SETTINGS['RAM_TILES_COUNT']   = JSGAME.PRELOAD.gamesettings_json['RAM_TILES_COUNT']  ;
			core.SETTINGS['TILE_HEIGHT']       = JSGAME.PRELOAD.gamesettings_json['TILE_HEIGHT']      ;
			core.SETTINGS['TILE_WIDTH']        = JSGAME.PRELOAD.gamesettings_json['TILE_WIDTH']       ;
			core.SETTINGS['TRANSLUCENT_COLOR'] = JSGAME.PRELOAD.gamesettings_json['TRANSLUCENT_COLOR'];
			core.SETTINGS['VRAM_TILES_H']      = JSGAME.PRELOAD.gamesettings_json['VRAM_TILES_H']     ;
			core.SETTINGS['VRAM_TILES_V']      = JSGAME.PRELOAD.gamesettings_json['VRAM_TILES_V']     ;
			core.SETTINGS['fps']               = JSGAME.PRELOAD.gamesettings_json['fps']              ;

			// Convert the TRANSLUCENT_COLOR string to integer. (If specified as HEX then it is likely a string.)
			core.SETTINGS['TRANSLUCENT_COLOR'] = parseInt(core.SETTINGS['TRANSLUCENT_COLOR'], 16);

			// These will be added in graphicsSetup.
			// core.GRAPHICS.tilesetNames = [] ;
			// core.GRAPHICS.ramtiles     = [] ;
			// core.GRAPHICS.tiles        = [] ;
			// core.GRAPHICS.tilemaps     = [] ;
		};
		// Copies some DOM into the core DOM cache.
		let DOMSetup    = function(){
			// DOM cache (GAME ELEMENTS ONLY.)
			core.DOM['gameCanvas_DIV'] = document.getElementById("gameCanvas_DIV");
		};
		// Configure canvases for the video mode.
		let canvasSetup = function(){
			// Configure the canvas(es)

			// This video mode requires 5 canvases. 4 for the layers and 1 for the output.

			// CANVAS
			core.GRAPHICS.canvas.BG     = document.createElement('canvas'); // Background tiles - Tile grid-aligned, no alpha.
			core.GRAPHICS.canvas.SPRITE = document.createElement('canvas'); // Sprite tiles     - Tile pixel-aligned, with alpha.
			core.GRAPHICS.canvas.TEXT   = document.createElement('canvas'); // Text tiles       - Tile grid-aligned, with alpha.
			core.GRAPHICS.canvas.FADE   = document.createElement('canvas'); // Fade layer       - Used for Fading. General purpose bitmap canvas.
			core.GRAPHICS.canvas.OUTPUT = document.createElement('canvas'); // Output canvas    - Combination of the other 4 layers. (no alpha.)

			// CANVAS CTX
			core.GRAPHICS.ctx.BG     = core.GRAPHICS.canvas.BG    .getContext('2d', { alpha: false });
			core.GRAPHICS.ctx.SPRITE = core.GRAPHICS.canvas.SPRITE.getContext('2d', { alpha: true  });
			core.GRAPHICS.ctx.TEXT   = core.GRAPHICS.canvas.TEXT  .getContext('2d', { alpha: true  });
			core.GRAPHICS.ctx.FADE   = core.GRAPHICS.canvas.FADE  .getContext('2d', { alpha: true  });
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
		};
		// Create VRAM arrays.
		let vramSetup   = function(){
			// Get the number of tiles for VRAM.
			let screen_wh   = (core.SETTINGS.VRAM_TILES_H * core.SETTINGS.VRAM_TILES_V);

			// VRAM1 (BG layer.) (Set all to tile id 0.)
			core.GRAPHICS.VRAM1 = new Uint8ClampedArray( screen_wh );

			// VRAM2 (TEXT layer.) (Set all to tile id 0.)
			core.GRAPHICS.VRAM2 = new Uint8ClampedArray( screen_wh );
		};
		// Preload and pre-convert all graphics.
		let graphicsSetup = function(){
			// Download and convert the source graphics (first convert.)
			return new Promise(function(GFXresolve,GFXreject){
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

					GFXresolve();
				});

			});
		};

		// (1/2) GRAPHICS SETUP.
		let proms1 = [
			new Promise(function(res,rej){
				let key = "video_p1_settingsSetup";
				JSGAME.CORE_SETUP_PERFORMANCE.starts[key] = performance.now();
				settingsSetup();
				JSGAME.CORE_SETUP_PERFORMANCE.ends[key]   = performance.now();
				JSGAME.CORE_SETUP_PERFORMANCE.times[key]  = JSGAME.CORE_SETUP_PERFORMANCE.ends[key] - JSGAME.CORE_SETUP_PERFORMANCE.starts[key];
				res();
			}) ,
			new Promise(function(res,rej){
				let key = "video_p1_DOMSetup";
				JSGAME.CORE_SETUP_PERFORMANCE.starts[key] = performance.now();
				DOMSetup()     ;
				JSGAME.CORE_SETUP_PERFORMANCE.ends[key]   = performance.now();
				JSGAME.CORE_SETUP_PERFORMANCE.times[key]  = JSGAME.CORE_SETUP_PERFORMANCE.ends[key] - JSGAME.CORE_SETUP_PERFORMANCE.starts[key];
				res();
			}) ,
			new Promise(function(res,rej){
				let key = "video_p1_canvasSetup";
				JSGAME.CORE_SETUP_PERFORMANCE.starts[key] = performance.now();
				canvasSetup()  ;
				JSGAME.CORE_SETUP_PERFORMANCE.ends[key]   = performance.now();
				JSGAME.CORE_SETUP_PERFORMANCE.times[key]  = JSGAME.CORE_SETUP_PERFORMANCE.ends[key] - JSGAME.CORE_SETUP_PERFORMANCE.starts[key];
				res();
			}) ,
			new Promise(function(res,rej){
				let key = "video_p1_vramSetup";
				JSGAME.CORE_SETUP_PERFORMANCE.starts[key] = performance.now();
				vramSetup()    ;
				JSGAME.CORE_SETUP_PERFORMANCE.ends[key]   = performance.now();
				JSGAME.CORE_SETUP_PERFORMANCE.times[key]  = JSGAME.CORE_SETUP_PERFORMANCE.ends[key] - JSGAME.CORE_SETUP_PERFORMANCE.starts[key];
				res();
			}) ,
			new Promise(function(res,rej){
				let key = "video_p1_graphicsSetup";
				JSGAME.CORE_SETUP_PERFORMANCE.starts[key] = performance.now();
				graphicsSetup().then(
					function(results){
						JSGAME.CORE_SETUP_PERFORMANCE.ends[key]  = performance.now();
						JSGAME.CORE_SETUP_PERFORMANCE.times[key] = JSGAME.CORE_SETUP_PERFORMANCE.ends[key] - JSGAME.CORE_SETUP_PERFORMANCE.starts[key];
						res();
					},
					function(err){
						console.log("err:", err);
						rej();
					}
				);
			}) ,
		];

		// (2/2) GRAPHICS SETUP.
		Promise.all(proms1).then(
			function(res){
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
				let key ;
				key = "video_p2_post_graphicsConversion";
				JSGAME.CORE_SETUP_PERFORMANCE.starts[key]=performance.now();
				post_graphicsConversion();
				JSGAME.CORE_SETUP_PERFORMANCE.ends[key]=performance.now();
				JSGAME.CORE_SETUP_PERFORMANCE.times[key] = JSGAME.CORE_SETUP_PERFORMANCE.ends[key] - JSGAME.CORE_SETUP_PERFORMANCE.starts[key];

				// Add the font data from PRELOAD into core.GRAPHICS.fonts.
				key = "video_p2_post_graphicsConversion";
				JSGAME.CORE_SETUP_PERFORMANCE.starts[key]=performance.now();
				applyFontSettings();
				JSGAME.CORE_SETUP_PERFORMANCE.ends[key]=performance.now();
				JSGAME.CORE_SETUP_PERFORMANCE.times[key] = JSGAME.CORE_SETUP_PERFORMANCE.ends[key] - JSGAME.CORE_SETUP_PERFORMANCE.starts[key];

				// Make sure all canvases are cleared.
				key = "video_p2_clearAllCanvases";
				JSGAME.CORE_SETUP_PERFORMANCE.starts[key]=performance.now();
				core.FUNCS.graphics.clearAllCanvases();
				JSGAME.CORE_SETUP_PERFORMANCE.ends[key]=performance.now();
				JSGAME.CORE_SETUP_PERFORMANCE.times[key] = JSGAME.CORE_SETUP_PERFORMANCE.ends[key] - JSGAME.CORE_SETUP_PERFORMANCE.starts[key];

				// TOTAL VIDEO INIT PERFORMANCE:
				JSGAME.CORE_SETUP_PERFORMANCE.ends  .VIDEO  = performance.now();
				JSGAME.CORE_SETUP_PERFORMANCE.times .VIDEO  = JSGAME.CORE_SETUP_PERFORMANCE.ends.VIDEO  - JSGAME.CORE_SETUP_PERFORMANCE.starts.VIDEO ;

				resolve();
			},
			function(err){
				console.log("err:", err);
				reject();
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

	// Clear VRAM1 and VRAM1_TO_WRITE.
	core.GRAPHICS["VRAM1"].fill(0);
	core.GRAPHICS["VRAM1_TO_WRITE"]=[];

	// Clear VRAM2 and VRAM2_TO_WRITE.
	core.GRAPHICS["VRAM2"].fill(0);
	core.GRAPHICS["VRAM2_TO_WRITE"]=[];

	// Set the draw flags.
	core.GRAPHICS.flags.BG     = true ;
	core.GRAPHICS.flags.SPRITE = true ;
	core.GRAPHICS.flags.TEXT   = true ;
	core.GRAPHICS.flags.FADE   = true ;
	core.GRAPHICS.flags.OUTPUT = true ;

	// Set the force draw flags.
	core.GRAPHICS.flags.BG     = true ;
	core.GRAPHICS.flags.TEXT   = true ;
	core.GRAPHICS.flags.OUTPUT = true ;
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
			retval.draw.push( {
				"flags"     : core.GRAPHICS.sprites[i].flags     ,
				"tileIndex" : core.GRAPHICS.sprites[i].tileIndex ,
				"x"         : core.GRAPHICS.sprites[i].x << 0    ,
				"y"         : core.GRAPHICS.sprites[i].y << 0    ,
			} );
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
	}

	return retval;
}

// *** Layer update functions ***

// Read through VRAM1 and update any tiles that have changed.
core.FUNCS.graphics.update_layer_BG     = function(){
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

} ;
// Read through core.GRAPHICS.sprites and update any sprites tiles that have changed.
core.FUNCS.graphics.update_layer_SPRITE = function(){
	// GETTING HERE MEANS THAT SOMETHING SPRITE-RELATED HAS CHANGED.

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
			if(thisSprite.SPRITE_OFF){ console.log("sprite was off!"); return; }

			// If the tileset name was not available, skip this sprite.
			if(!thisSprite.tilesetname){ console.log("tileset name not found!"); return; }

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

	}
	// No sprite changes? Nothing to do.
	else{
		// IGNORE
		//
	}

} ;
// Read through VRAM2 and update any tiles that have changed.
core.FUNCS.graphics.update_layer_TEXT   = function(){
	// core.GRAPHICS.fontSettings.tileset
	// core.GRAPHICS.fontSettings.map

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
} ;
//
core.FUNCS.graphics.update_layer_FADE   = function(){
	let layer = core.GRAPHICS["ctx"].FADE;
} ;
// Combine each layer and then draw to the output canvas.
core.FUNCS.graphics.update_layer_OUTPUT = function(){
	// Combine all layers into output and then draw the attached DOM canvas.

	// Create the temp output.
	let tempOutput     = document.createElement("canvas");
	let tempOutput_ctx = tempOutput.getContext('2d', { alpha: true });
	// let tempOutput_ctx = tempOutput.getContext('2d', { alpha: false });
	tempOutput.width   = core.GRAPHICS["canvas"].OUTPUT.width;
	tempOutput.height  = core.GRAPHICS["canvas"].OUTPUT.height;

	// Combine the layers into the temp output.
	if(core.GRAPHICS.debug.flags.BG    ){ tempOutput_ctx.drawImage( core.GRAPHICS["canvas"].BG    , 0, 0) ; } // BG
	if(core.GRAPHICS.debug.flags.SPRITE){ tempOutput_ctx.drawImage( core.GRAPHICS["canvas"].SPRITE, 0, 0) ; } // SPRITE
	if(core.GRAPHICS.debug.flags.TEXT  ){ tempOutput_ctx.drawImage( core.GRAPHICS["canvas"].TEXT  , 0, 0) ; } // TEXT
	if(core.GRAPHICS.debug.flags.FADE  ){ tempOutput_ctx.drawImage( core.GRAPHICS["canvas"].FADE  , 0, 0) ; } // FADE

	// Write the combined layers to the attached DOM canvas.
	// core.GRAPHICS["ctx"].OUTPUT.clearRect(0, 0, core.GRAPHICS["ctx"].OUTPUT.canvas.width, core.GRAPHICS["ctx"].OUTPUT.canvas.height);
	if(core.GRAPHICS.debug.flags.OUTPUT){ core.GRAPHICS["ctx"].OUTPUT.drawImage(tempOutput,0,0); } // OUTPUT
} ;
//
core.FUNCS.graphics.update_allLayers    = function(){
	core.GRAPHICS.flags.INLAYERUPDATE=true;
	let drawStart_BG;
	let drawStart_SPRITE;
	let drawStart_TEXT;
	let drawStart_FADE;
	let drawStart_OUTPUT;

	// Will there be an output drawing?
	if(
		(core.GRAPHICS.flags.BG     || core.GRAPHICS.flags.BG_force     ) ||
		(core.GRAPHICS.flags.SPRITE || 0 ) ||
		(core.GRAPHICS.flags.TEXT   || core.GRAPHICS.flags.TEXT_force   ) ||
		(core.GRAPHICS.flags.FADE   || 0   )
	){
		core.GRAPHICS.flags.OUTPUT=true;
	}
	else{ core.GRAPHICS.flags.OUTPUT=false; }

	// core.GRAPHICS.flags.OUTPUT=true;

	// Does the BG layer need an update?
	if(JSGAME.SHARED.debug)       { drawStart_BG     = performance.now();      core.GRAPHICS.performance.BG.shift(); }
	if(core.GRAPHICS.flags.BG || core.GRAPHICS.flags.BG_force)         { core.FUNCS.graphics.update_layer_BG();     core.GRAPHICS.flags.BG     = false ;  }
	if(JSGAME.SHARED.debug)       { core.GRAPHICS.performance.BG.push(performance.now()-drawStart_BG);               }

	// Does the SPRITE layer need an update?
	if(JSGAME.SHARED.debug)       { drawStart_SPRITE = performance.now();      core.GRAPHICS.performance.SPRITE.shift(); }
	if(core.GRAPHICS.flags.SPRITE){ core.FUNCS.graphics.update_layer_SPRITE(); core.GRAPHICS.flags.SPRITE = false ;      }
	if(JSGAME.SHARED.debug)       { core.GRAPHICS.performance.SPRITE.push(performance.now()-drawStart_SPRITE);           }

	// Does the TEXT layer need an update?
	if(JSGAME.SHARED.debug)       { drawStart_TEXT   = performance.now();      core.GRAPHICS.performance.TEXT.shift(); }
	if(core.GRAPHICS.flags.TEXT || core.GRAPHICS.flags.TEXT_force)     { core.FUNCS.graphics.update_layer_TEXT();   core.GRAPHICS.flags.TEXT   = false ;    }
	if(JSGAME.SHARED.debug)       { core.GRAPHICS.performance.TEXT.push(performance.now()-drawStart_TEXT);             }

	// Does the FADE layer need an update?
	if(JSGAME.SHARED.debug)       { drawStart_FADE   = performance.now();      core.GRAPHICS.performance.FADE.shift(); }
	if(core.GRAPHICS.flags.FADE)  { core.FUNCS.graphics.update_layer_FADE();   core.GRAPHICS.flags.FADE   = false ;    }
	if(JSGAME.SHARED.debug)       { core.GRAPHICS.performance.FADE.push(performance.now()-drawStart_FADE);             }

	// Does the OUTPUT layer need an update?
	if(JSGAME.SHARED.debug)       { drawStart_OUTPUT = performance.now();      core.GRAPHICS.performance.OUTPUT.shift(); }
	if(core.GRAPHICS.flags.OUTPUT || core.GRAPHICS.flags.OUTPUT_force) { core.FUNCS.graphics.update_layer_OUTPUT(); core.GRAPHICS.flags.OUTPUT = false ;      }
	if(JSGAME.SHARED.debug)       { core.GRAPHICS.performance.OUTPUT.push(performance.now()-drawStart_OUTPUT);           }

	// Clear the force flags.
	core.GRAPHICS.flags.BG_force     = false ;
	core.GRAPHICS.flags.SPRITE_force = false ;
	core.GRAPHICS.flags.TEXT_force   = false ;
	core.GRAPHICS.flags.FADE_force   = false ;
	core.GRAPHICS.flags.OUTPUT_force = false ;

	core.GRAPHICS.flags.INLAYERUPDATE=false;
};

// *** VRAM update functions.

// Sets the tileset to use when drawing bg tiles.
core.FUNCS.graphics.SetTileTable = function(tileset){
	// Make sure that the tileset is actually available.
	if(core.ASSETS.graphics.tilesetNames.indexOf(tileset) != -1){
		core.GRAPHICS.activeTileset["BG"] = tileset ;
	}
	else{
		throw new Error('INVALID TILE TABLE NAME! '  + tileset);
	}

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
		// Set all tiles in VRAM1 to 0.
		core.GRAPHICS["VRAM1"].fill(0);

		// Indicate that a draw is required for this layer.
		core.GRAPHICS.flags.BG = true;
		core.GRAPHICS.flags.BG_force     = true;
	}

	if(vram_str=='VRAM2' || doboth==true){
		// Set all tiles in VRAM2 to 0.
		core.GRAPHICS["VRAM2"].fill(0);

		// Indicate that a draw is required for this layer.
		core.GRAPHICS.flags.TEXT = true;
		core.GRAPHICS.flags.TEXT_force   = true;
	}

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
core.FUNCS.graphics.getTilemap   = function(tilemap_str){
	let tilemap = core.ASSETS.graphics.tilemaps[tilemap_str];
	if(tilemap){ return tilemap; }
	else{ return new Uint8ClampedArray([0,0]); }
}

// *** SPRITE update functions. ***

//
// Clears the core.GRAPHICS.sprites array.
core.FUNCS.graphics.clearSprites       = function(){
	// core.GRAPHICS.sprites.length=0;
	core.GRAPHICS.sprites=[];
	core.GRAPHICS.flags.SPRITE = true ;
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

	// let newToDraw  = core.GRAPHICS.sprites.find     (x => !core.GRAPHICS.sprites_prev.includes(x));
	// let clearThese = core.GRAPHICS.sprites_prev.find(x => !core.GRAPHICS.sprites     .includes(x));
	// core.GRAPHICS.sprites[startSprite].hash = core.FUNCS.graphics.hashSprite(core.GRAPHICS.sprites[startSprite]);
};
// Adds the tiles of a sprite map to the sprites array.
core.FUNCS.graphics.MapSprite2         = function(startSprite, map, spriteFlags){
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
	// Accepts a canvas, creates a new temp canvas to do the flip then draws the results to the src canvas.
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
	//   ! " # $ % & ' ( ) * + , - . /
	// 0 1 2 3 4 5 6 7 8 9 : ; < = > ?
	// @ A B C D E F G H I J K L M N O
	// P Q R S T U V W X Y Z [ c ] ^ _

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

//
core.FUNCS.graphics.FADER.ProcessFading = function(){
	// if(this.fadeActive==true){
	// 	if(this.currFadeFrame==0){
	// 		this.currFadeFrame=this.fadeSpeed;

	// 		// Save the previous global color alter values.
	// 		app.kernel.prev_maxRed   = app.kernel.maxRed  ;
	// 		app.kernel.prev_maxGreen = app.kernel.maxGreen;
	// 		app.kernel.prev_maxBlue  = app.kernel.maxBlue ;

	// 		// Adjust the global color alter values.
	// 		app.kernel.maxRed   = this.fader[this.fadeStep].r ;
	// 		app.kernel.maxGreen = this.fader[this.fadeStep].g ;
	// 		app.kernel.maxBlue  = this.fader[this.fadeStep].b ;

	// 		if(this.fadeDir==  1){ this.fadeStep+=this.fadeDir; }

	// 		if(this.fadeStep==0 || this.fadeStep==(this.FADER_STEPS)){
	// 			this.fadeActive=false;

	// 			if(this.fadeDir==  1){ this.lastFadeFrame=true; return; }
	// 			if(this.fadeDir== -1){ this.lastFadeFrame=true; return; }
	// 		}

	// 		if(this.fadeDir== -1){ this.fadeStep+=this.fadeDir; }

	// 	}
	// 	else{
	// 		this.currFadeFrame--;
	// 	}
	// }
};
//
core.FUNCS.graphics.FADER.doFade        = function(speed, blocking){
	// this.lastFadeFrame = false;
	// this.stayDark      = false;

	// // Save the previous global color alter values.
	// app.kernel.prev_maxRed   = app.kernel.maxRed  ;
	// app.kernel.prev_maxGreen = app.kernel.maxGreen;
	// app.kernel.prev_maxBlue  = app.kernel.maxBlue ;

	// this.fadeSpeed     = speed;
	// this.currFadeFrame = 0;
	// this.fadeActive    = true;
	// this.blocking      = blocking;
};
//
core.FUNCS.graphics.FADER.FadeIn        = function(speed, blocking){
	console.log("FadeIn");

	// // app.kernel.funcs.fader.FadeIn(1, false);

	// if(speed==0){
	// 	// Save the previous global color alter values.
	// 	app.kernel.prev_maxRed   = app.kernel.maxRed  ;
	// 	app.kernel.prev_maxGreen = app.kernel.maxGreen;
	// 	app.kernel.prev_maxBlue  = app.kernel.maxBlue ;

	// 	// Adjust the global color alter values.
	// 	app.kernel.maxRed   = 100 ;
	// 	app.kernel.maxGreen = 100 ;
	// 	app.kernel.maxBlue  = 100 ;

	// 	return;
	// }
	// this.fadeStep = 1;
	// this.fadeDir  = 1;
	// this.doFade(speed, blocking);
};
//
core.FUNCS.graphics.FADER.FadeOut       = function(speed, blocking){
	console.log("FadeOut");

	// // app.kernel.funcs.fader.FadeOut(1, false);

	// if(speed==0){
	// 	// Save the previous global color alter values.
	// 	app.kernel.prev_maxRed   = app.kernel.maxRed  ;
	// 	app.kernel.prev_maxGreen = app.kernel.maxGreen;
	// 	app.kernel.prev_maxBlue  = app.kernel.maxBlue ;

	// 	// Adjust the global color alter values.
	// 	app.kernel.maxRed   = 0 ;
	// 	app.kernel.maxGreen = 0 ;
	// 	app.kernel.maxBlue  = 0 ;

	// 	return;
	// }

	// this.fadeStep=this.FADER_STEPS-1;
	// this.fadeDir=-1;
	// this.doFade(speed, blocking);
};
