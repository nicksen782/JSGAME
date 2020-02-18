// core.GRAPHICS = {};
core.GRAPHICS.DATA         = {} ;
core.GRAPHICS.DATA.FLAGS   = {} ;
core.GRAPHICS.DATA.VRAM    = {} ;
core.GRAPHICS.DATA.SPRITES = {} ;
core.GRAPHICS.FUNCS        = {} ;
// Holds tile and tilemap assets.
core.GRAPHICS.ASSETS      = {
	"tileObjs"        : {} , // All tile graphics separated by their tileset.
	"CUSTOM_tileObjs" : {} , // Flipped/Rotated versions of tiles.
	"tilemaps"        : {} , // All tilemaps separated by their tileset.
} ;
// PERFORMANCE MONITORING
core.GRAPHICS.performance = {
	LAYERS : {
		// BG : [ 0, 0, 0, 0, 0 ] , //
	},
};
core.GRAPHICS.performance.LAYERS["update_layers_type1"]=[ 0, 0, 0, 0, 0 ];
// Holds the canvas elements.
core.GRAPHICS.canvas      = {} ;
// Holds the canvas contexts.
core.GRAPHICS.ctx         = {} ;

// Shortened ways to access core.GRAPHICS.
var _CGF = core.GRAPHICS.FUNCS;
// Shortened ways to access core.SETTINGS.
var _CS = core.SETTINGS;

// One-time-use init function for the graphics.
core.GRAPHICS.init = function(){
	// Lots of functions here.
	return new Promise(function(res_VIDEO_INIT, rej_VIDEO_INIT){
		// Read in the gamesettings.json settings into local JavaScript vars.
		let gamesettings_setup = function(){ return new Promise(function(res1, rej1){
			//

			JSGAME.SHARED.PERFORMANCE.stamp("VIDEO_INIT_gamesettings_setup" , "START");

			// Low-level settings.
			core.SETTINGS['TRANSLUCENT_COLOR'] = JSGAME.PRELOAD.gamesettings_json.graphics['TRANSLUCENT_COLOR'] ;
			core.SETTINGS['TILE_WIDTH']        = JSGAME.PRELOAD.gamesettings_json.graphics['TILE_WIDTH']     ;
			core.SETTINGS['TILE_HEIGHT']       = JSGAME.PRELOAD.gamesettings_json.graphics['TILE_HEIGHT']    ;
			core.SETTINGS['VRAM_TILES_H']      = JSGAME.PRELOAD.gamesettings_json.graphics['VRAM_TILES_H']   ;
			core.SETTINGS['VRAM_TILES_V']      = JSGAME.PRELOAD.gamesettings_json.graphics['VRAM_TILES_V']   ;
			core.SETTINGS['INTRO_LOGO']        = JSGAME.PRELOAD.gamesettings_json.graphics['INTRO_LOGO']     ;
			core.SETTINGS['FPS']               = JSGAME.PRELOAD.gamesettings_json.graphics['FPS']            ;
			core.SETTINGS['fps']               = JSGAME.PRELOAD.gamesettings_json.graphics['FPS']            ;
			core.SETTINGS['SCALE']             = JSGAME.PRELOAD.gamesettings_json.graphics['SCALE']          ;

			// Layer and tile data. (processed later.)
			core.GRAPHICS.DATA.DRAWORDER    = JSGAME.PRELOAD.gamesettings_json.graphics['layerDrawOrder'] ;
			core.SETTINGS['layers']         = JSGAME.PRELOAD.gamesettings_json.graphics['layers']         ;
			core.SETTINGS['tilesets']       = JSGAME.PRELOAD.gamesettings_json.graphics['tilesets']       ;
			core.SETTINGS['fonts']          = JSGAME.PRELOAD.gamesettings_json.graphics['fonts']          ;
			core.SETTINGS['inputTilesets']  = JSGAME.PRELOAD.gamesettings_json.graphics['inputTilesets']  ;

			// Fix some values.
			core.SETTINGS['TRANSLUCENT_COLOR'] = parseInt(core.SETTINGS['TRANSLUCENT_COLOR'], 16)   ;

			// Done! Resolve.
			JSGAME.SHARED.PERFORMANCE.stamp("VIDEO_INIT_gamesettings_setup" , "END");
			res1();

		}); };

		// DOM setup.
		let dom_setup = function(){ return new Promise(function(res1, rej1){
			//

			JSGAME.SHARED.PERFORMANCE.stamp("VIDEO_INIT_dom_setup" , "START");

			core.DOM['gameCanvas_DIV'] = document.getElementById("gameCanvas_DIV");

			// Done! Resolve.
			JSGAME.SHARED.PERFORMANCE.stamp("VIDEO_INIT_dom_setup" , "END");
			res1();
		}); };

		// Canvas setup.
		let canvas_setup = function(){ return new Promise(function(res1, rej1){
			JSGAME.SHARED.PERFORMANCE.stamp("VIDEO_INIT_canvas_setup" , "START");

			// Create the layers, save some flag values too.
			let canvases = [];
			for(let layer in core.SETTINGS['layers']){
				// Get settings for this layer.
				let alpha           = core.SETTINGS['layers'][layer].alpha ;
				let clearBeforeDraw = core.SETTINGS['layers'][layer].clearBeforeDraw ;
				let clearWith       = core.SETTINGS['layers'][layer].clearWith ;

				// Create canvas.
				let newCanvas = document.createElement('canvas'); //

				// Set dimensions of canvas.
				newCanvas.width  = ( core.SETTINGS['VRAM_TILES_H'] * core.SETTINGS['TILE_WIDTH']  ) ;
				newCanvas.height = ( core.SETTINGS['VRAM_TILES_V'] * core.SETTINGS['TILE_HEIGHT'] ) ;

				// Set the pixelated settings.
				JSGAME.SHARED.setpixelated(newCanvas);

				// Set the pre-clear and layer update flags.
				core.GRAPHICS.DATA.FLAGS[layer] = {};
				core.GRAPHICS.DATA.FLAGS[layer].clearWith       = clearWith ;
				core.GRAPHICS.DATA.FLAGS[layer].clearBeforeDraw = clearBeforeDraw ;
				core.GRAPHICS.DATA.FLAGS[layer].UPDATE          = false ; // Indicates that an update is needed.
				core.GRAPHICS.DATA.FLAGS[layer].REDRAW          = false ; // Draw all of VRAM even if already drawn.
				core.GRAPHICS.DATA.FLAGS[layer].lastUpdate      = performance.now() ; //

				// Save the canvas.
				core.GRAPHICS.canvas[layer] = newCanvas;

				// Save the ctx (respect the alpha setting.)
				core.GRAPHICS.ctx[layer] = newCanvas.getContext('2d', { alpha: alpha }) ;

				// Add to core.GRAPHICS.performance
				core.GRAPHICS.performance.LAYERS[layer] = [ 0, 0, 0, 0, 0 ] ; //
			}

			// Create the OUTPUT canvas.
			core.GRAPHICS.canvas.OUTPUT        = document.createElement('canvas'); //
			core.GRAPHICS.ctx.OUTPUT           = core.GRAPHICS.canvas.OUTPUT.getContext("2d", { alpha : true } ); //
			core.GRAPHICS.canvas.OUTPUT.width  = ( core.SETTINGS['VRAM_TILES_H'] * core.SETTINGS['TILE_WIDTH']  ) ;
			core.GRAPHICS.canvas.OUTPUT.height = ( core.SETTINGS['VRAM_TILES_V'] * core.SETTINGS['TILE_HEIGHT'] ) ;
			core.GRAPHICS.canvas.OUTPUT.id     = "canvas_OUTPUT";
			JSGAME.SHARED.setpixelated(core.GRAPHICS.canvas.OUTPUT);

			// Create the pre-OUTPUT canvas.
			core.GRAPHICS.canvas.pre_OUTPUT        = document.createElement('canvas'); //
			core.GRAPHICS.ctx.pre_OUTPUT           = core.GRAPHICS.canvas.pre_OUTPUT.getContext("2d", { alpha : true } ); //
			core.GRAPHICS.canvas.pre_OUTPUT.width  = ( core.SETTINGS['VRAM_TILES_H'] * core.SETTINGS['TILE_WIDTH']  ) ;
			core.GRAPHICS.canvas.pre_OUTPUT.height = ( core.SETTINGS['VRAM_TILES_V'] * core.SETTINGS['TILE_HEIGHT'] ) ;
			// core.GRAPHICS.canvas.pre_OUTPUT.id     = "canvas_pre_OUTPUT";
			JSGAME.SHARED.setpixelated(core.GRAPHICS.canvas.pre_OUTPUT);

			// Attach the canvas_OUTPUT to gameCanvas_DIV.
			core.DOM['gameCanvas_DIV'].appendChild(core.GRAPHICS.canvas.OUTPUT);

			// Done! Resolve.
			JSGAME.SHARED.PERFORMANCE.stamp("VIDEO_INIT_canvas_setup" , "END");
			res1();

		}); };

		// VRAM setup.
		let vram_setup = function(){ return new Promise(function(res1, rej1){
			JSGAME.SHARED.PERFORMANCE.stamp("VIDEO_INIT_vram_setup" , "START");

			// Create the default tileset ("default_tileset"), "black" and "transparent" tiles.
			let canvas;
			let ctx;
			let imgData;

			// Create default tileset.
			core.GRAPHICS.ASSETS.tileObjs["default_tileset"]=[];

			// Create black tile and add to the default tileset.
			canvas=document.createElement("canvas");
			canvas.width  = core.SETTINGS.TILE_WIDTH;
			canvas.height = core.SETTINGS.TILE_HEIGHT;
			ctx=canvas.getContext("2d");
			// ctx.fillStyle = "rgba(255, 0, 0, 1.0)";    // Red
			ctx.fillStyle = "rgba(0, 0, 0, 1.0)";      // Black
			ctx.fillRect(0, 0, canvas.width, canvas.height);
			imgData = ctx.getImageData(0,0,canvas.width, canvas.height);
			core.GRAPHICS.ASSETS.tileObjs["default_tileset"].push({
				"canvas"  : canvas ,
				"imgData" : imgData ,
				"numUsed" : 0 ,
			});

			// Create transparent tile and add to the default tileset.
			canvas=document.createElement("canvas");
			canvas.width  = core.SETTINGS.TILE_WIDTH;
			canvas.height = core.SETTINGS.TILE_HEIGHT;
			ctx=canvas.getContext("2d");
			// ctx.fillStyle = "rgba(0, 0, 255, 1.0)";          // Blue
			// ctx.fillRect(0, 0, canvas.width, canvas.height); // Blue
			ctx.clearRect(0,0,canvas.width,canvas.height); // Full transparent.
			imgData = ctx.getImageData(0,0,canvas.width, canvas.height);
			core.GRAPHICS.ASSETS.tileObjs["default_tileset"].push({
				"canvas"  : canvas ,
				"imgData" : imgData ,
				"numUsed" : 0 ,
			});

			// Get the number of tiles for VRAM.
			let screen_wh   = (core.SETTINGS['VRAM_TILES_H'] * core.SETTINGS['VRAM_TILES_V']);
			// Create the VRAMs for each layer.
			for(let layer in core.SETTINGS['layers']){
				let clearWith  = core.GRAPHICS.DATA.FLAGS[layer].clearWith;

				// Sprite layers.
				if(core.SETTINGS.layers[layer].sprite){
					core.GRAPHICS.DATA.SPRITES[layer] = [];
					let numSprites = core.GRAPHICS.DATA.SPRITES[layer].numSprites;

					// Set all sprites with the default tile object.
					for(let i=0; i<numSprites; i+=1){
						core.GRAPHICS.DATA.SPRITES[layer][i] = core.GRAPHICS.FUNCS.returnNewTile_obj();
						core.GRAPHICS.DATA.SPRITES[layer][i].flags.SPRITE=true;
						core.GRAPHICS.DATA.SPRITES[layer][i].flags.OFF=true;
						core.GRAPHICS.DATA.SPRITES[layer][i].clearThis=false;
						core.GRAPHICS.DATA.SPRITES[layer][i].tileset="default_tileset";
						core.GRAPHICS.DATA.SPRITES[layer][i].tileindex=1; // Transparent
					}

				}
				// Non-sprite layers.
				else{
					core.GRAPHICS.DATA.VRAM[layer] = [];
					for(let i=0; i<screen_wh; i+=1){
						core.GRAPHICS.DATA.VRAM[layer][i]=core.GRAPHICS.FUNCS.returnNewTile_obj();
						core.GRAPHICS.DATA.VRAM[layer][i].tileset="default_tileset";
						core.GRAPHICS.DATA.VRAM[layer][i].tileindex=0; // Black
						core.GRAPHICS.DATA.VRAM[layer][i].drawThis=true;
					}
				}
			}

			// Done! Resolve.
			JSGAME.SHARED.PERFORMANCE.stamp("VIDEO_INIT_vram_setup" , "END");
			res1();
		}); };

		// Download all graphics and convert from Uzebox to JS_GAME.
		let tmp_tilesets = {} ;
		let graphics1_setup = function(){ return new Promise(function(res1, rej1){
			JSGAME.SHARED.PERFORMANCE.stamp("VIDEO_INIT_graphics1_setup" , "START");

			let gamedir = parentPath + JSGAME.PRELOAD.gameselected_json['gamedir'];
			gamedir = gamedir.replace("../", "");

			let graphicsConvert = function(res){
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
				var thisArrayName    = "" ;

				var start ;
				var end   ;
				var values;

				// Split on \n
				data = data.split("\n");

				// CURRENT TILESET:
				let currentTileset = "_INVALID_";
				let lines = [];
				let retData = {
				};

				// Trim each line. Also get each array name.
				data.forEach(function(d){
					// Trim the line.
					d = d.trim();

					// Skip blank lines.
					if(d==""){ return d; }

					// Get the array name.
					thisArrayName=d.substring(0, d.indexOf("["));

					// Get the start and end of the values for this array.
					start  = d.indexOf("{");
					end    = d.indexOf("}");
					values = d.substring(start+1, end);

					// Split the string on ",".
					values = values.split(",");

					// Is this the tileset?
					if(d.indexOf("{0x") != -1){
						currentTileset=thisArrayName;

						// Convert the base 16 hex to base 10. (The tileset is represented in hex, not dec.)
						values = values.map(function(d){ return parseInt(d, 16); });

						if(! retData["tilesets"] ) { retData["tilesets"] = {} ; }
						retData["tilesets"][currentTileset] = values;
					}
					// This is a tilemap within the existing tileset.
					else{
						let mapValues = values.map(function(d){ return parseInt(d, 10); });
						if(! retData["tilemaps"] )                 { retData["tilemaps"] = {} ; }
						if(! retData["tilemaps"][currentTileset] ) { retData["tilemaps"][currentTileset] = {} ; }

						retData["tilemaps"][currentTileset][thisArrayName] = mapValues ;
					}

					// Return the new string.
					return d;
				});

				// Return the data
				return  retData;

			};

			let proms_gfx = [];

			core.SETTINGS['inputTilesets'].forEach(function(d){
				// console.log("Downloading and converting: ", d);
				let rel_url = JSGAME.PRELOAD.gameselected_json['gamedir'] + "/"+ d;
				proms_gfx.push(
					JSGAME.SHARED.getFile_fromUrl(rel_url, true, "text")
				);
			});

			Promise.all(proms_gfx).then(function( r ){
				//
				let tmp_tilemaps = {} ;

				for(let i=0; i<r.length; i+=1){
					// Get the converted data.
					let converted = graphicsConvert( r[i] );
					// console.log("converted:", converted);

					// Add the data to the temp.
					for(let tileset in converted.tilesets){
						// console.log("", tileset, converted.tilesets[tileset]);
						tmp_tilesets[tileset] =  converted.tilesets[tileset] ;

						if(! tmp_tilemaps[tileset] ) { tmp_tilemaps[tileset] = {}; }

						for(let tilemap in converted.tilemaps[tileset]){
							// console.log("tileset:", tileset, ", tilemap:", tilemap, converted.tilemaps[tileset][tilemap]);

							// Save map as Array.
							// tmp_tilemaps[tileset][tilemap] = converted.tilemaps[tileset][tilemap];

							// Save map as ArrayBuffer.
							let bufferType=8;
							for(let index=0; index<converted.tilemaps[tileset][tilemap].length; index+=1){
								if(converted.tilemaps[tileset][tilemap] > 255){ bufferType=16; break; }
							}

							if(bufferType==8 ){ tmp_tilemaps[tileset][tilemap] = new Uint8Array(converted.tilemaps[tileset][tilemap]); }
							if(bufferType==16){ tmp_tilemaps[tileset][tilemap] = new Uint16Array(converted.tilemaps[tileset][tilemap]);}
						}
					}
				}

				// The tilemaps can be added now.
				core.GRAPHICS.ASSETS.tilemaps=tmp_tilemaps;

				// Done! Resolve.
				JSGAME.SHARED.PERFORMANCE.stamp("VIDEO_INIT_graphics1_setup" , "END");
				res1();
			});

		}); };

		let proms1 = [
			gamesettings_setup() ,
			dom_setup()          ,
			canvas_setup()       ,
			vram_setup()         ,
			graphics1_setup()    ,
		];

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
						let str = ["=E= rgb_decode332: UNKNOWN METHOD: " + method ];
						// console.error(str);
						throw Error(str);
					}
				};
				// Converts Uzebox tiles to Canvas. Respects transparency if indicated.
				convertUzeboxTilesToCanvasTiles = function(inputTileset, inputTilesetName, newTilesetKey, handleTransparency, outputType, trackTransparent){
					let curTileId;
					let vramdata_rgb_332;
					let tile_width  = core.SETTINGS['TILE_WIDTH'];
					let tile_height = core.SETTINGS['TILE_HEIGHT'];
					let tile_size   = tile_width * tile_height;
					let buf8;
					let buf32;
					let vramdata_rgb_332_length;
					let pixel;
					let pixel_index;
					let i;
					let ii;
					let vramdata_rgb32;
					let len = 0;
					let convertedPixel;
					try{
						len = inputTileset.length / tile_size;
					}
					catch(e){
						let str = ["=E= convertUzeboxTilesToCanvasTiles: Invalid inputTileset.", JSON.stringify([inputTileset]), e];
						// console.error(str);
						throw Error(str);
					}
					let arr=[];
					let hasTransparency ;
					let transparencies = [];

					// Create the tempCanvas.
					let tempCanvas     = document.createElement('canvas') ;
					let tempCanvas_ctx = tempCanvas.getContext('2d');
					tempCanvas.width   = tile_width ;
					tempCanvas.height  = tile_height ;

					for(i=0; i<len; i+=1){
						hasTransparency = false;
						curTileId = i;

						// BY VALUE: Returns the portion of the vram array buffer for the specified tileset and tile.
						// Get the tile source data. Should come as: Uint8ClampedArray(64) (Still Uzebox format.)
						// vramdata_rgb_332 = core.ASSETS.graphics.tiles[ inputTilesetName ].slice(
						vramdata_rgb_332 = inputTileset.slice(
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
							pixel              = vramdata_rgb_332[ii];
							pixel_index        = ii;
							convertedPixel     = rgb_decode332( pixel, "arraybuffer_32", handleTransparency ) ;
							buf32[pixel_index] = convertedPixel;

							// A transparent pixel will come back as 0.
							if(trackTransparent && handleTransparency && convertedPixel==0){ hasTransparency = true; }
						}
						//
						if(trackTransparent && handleTransparency && hasTransparency){ transparencies.push(curTileId); }

						// Write the arraybuffer to the imageData.
						vramdata_rgb32.data.set(buf8);

						// Store the data.
						if     (outputType=="canvas"){
							// Write the imageData to a canvas element.
							let canvas = document.createElement('canvas');
							let ctx    = canvas.getContext("2d", { alpha: true }) ;
							canvas.width  = tile_width;
							canvas.height = tile_height;
							ctx.putImageData( vramdata_rgb32, 0, 0 );

							// Store the canvas element.
							arr[curTileId]=canvas;
						}
						else if(outputType=="imgData"){
							// Write the imageData.
							arr[curTileId]=vramdata_rgb32;
						}

						// vramdata_rgb32=null;
					}

					// RETURN THE VALUE
					return arr;
				};
				// Graphics conversions.
				post_graphicsConversion         = function(){
					// Convert tileset.

					// Get the number of tilesets.
					let len = core.SETTINGS['tilesets'].length;

					// Convert all tilesets from the Uzebox format.
					for(let i=0; i<len; i+=1){
						// Get the data for this tileset.
						let record = core.SETTINGS['tilesets'][i];
						let tilesetName        = record.tileset            ;
						let handleTransparency = record.handleTransparency ;
						let useCanvas          = record.useCanvas          ;
						let useImgData         = record.useImgData         ;
						let src_data           = tmp_tilesets[tilesetName] ;
						let numTiles           = src_data.length / (core.SETTINGS.TILE_WIDTH * core.SETTINGS.TILE_HEIGHT) ;

						let canvas  = [] ;
						let imgData = [] ;
						let numUsed = 0  ;

						if(useCanvas){
							// Add the data to the tile object.
							canvas = convertUzeboxTilesToCanvasTiles(
								src_data          , // tilesSource,
								tilesetName       , // thisCanvas.tileset ,
								tilesetName       , // thisCanvas.tileset ,
								handleTransparency, // thisCanvas.handleTransparency,
								"canvas"          , // thisCanvas.type,
								false               // thisCanvas.trackTransparent
							);
						}
						else { canvas = undefined; }

						if(useImgData){
							// Add the data to the tile object.
							imgData = convertUzeboxTilesToCanvasTiles(
								src_data          , // tilesSource,
								tilesetName       , // thisCanvas.tileset ,
								tilesetName       , // thisCanvas.tileset ,
								handleTransparency, // thisCanvas.handleTransparency,
								"imgData"         , // thisCanvas.type,
								false               // thisCanvas.trackTransparent
							);
						}
						else { imgData = undefined; }

						// Add the tile object to the inventory.
						if( core.GRAPHICS.ASSETS.tileObjs[tilesetName] == undefined ){
							core.GRAPHICS.ASSETS.tileObjs[tilesetName] = [];
						}

						// Add the canvases and imgData piece by piece.
						for(let n=0; n<numTiles; n+=1){
							// Create an empty object.
							core.GRAPHICS.ASSETS.tileObjs[tilesetName][n]={};

							// Canvas version of image.
							if(useCanvas){
								core.GRAPHICS.ASSETS.tileObjs[tilesetName][n].canvas  = canvas[n] ;
							}

							// imgData version of the image.
							if(useImgData){
								core.GRAPHICS.ASSETS.tileObjs[tilesetName][n].imgData = imgData[n] ;
							}

							// Tile usage count (DEBUG.)
							core.GRAPHICS.ASSETS.tileObjs[tilesetName][n].numUsed = numUsed ;
						}
					}
				};

				// tilemapsToCanvas conversions.
				post_graphicsConversion2        = function(){
					// Get the number of tilesets.
					let len = core.SETTINGS['tilesets'].length;

					// Convert all tilesets from the Uzebox format.
					for(let i=0; i<len; i+=1){
						// Get the data for this tileset.
						let record = core.SETTINGS['tilesets'][i];
						let tilemapsToCanvas = record.tilemapsToCanvas ;
						let tilesetName      = record.tileset          ;
						let tileset          = core.GRAPHICS.ASSETS.tileObjs[tilesetName] ;
						let tilemaps         = core.GRAPHICS.ASSETS.tilemaps[tilesetName] ;

						// Add the missing tilemaps_canvas key.
						if(core.GRAPHICS.ASSETS.tilemaps_canvas==undefined){
							core.GRAPHICS.ASSETS.tilemaps_canvas={};
						}

						if(tilemapsToCanvas){
							core.GRAPHICS.ASSETS.tilemaps_canvas[tilesetName]={};

							// Convert each tilemap to a new canvas (leave existing tilemap.)
							let tilemap_keys = Object.keys(tilemaps);
							for(let m = 0; m<tilemap_keys.length; m+=1){
								let tilemap_name = tilemap_keys[m];

								let tilemap = tilemaps[ tilemap_keys[m] ];
								let mapWidth  = tilemap[0];
								let mapHeight = tilemap[1];

								let tile_w = core.SETTINGS['TILE_WIDTH'];
								let tile_h = core.SETTINGS['TILE_HEIGHT'];

								// Create the canvas container.
								let canvas    = document.createElement("canvas");
								canvas.width  = mapWidth  * tile_w ;
								canvas.height = mapHeight * tile_h ;
								let ctx       = canvas.getContext("2d");

								// Draw the tiles (which are canvases) onto this canvas.
								for(let y=0; y<mapHeight; y+=1){
									for(let x=0; x<mapWidth; x+=1){
										let tileIndex = tilemap[ (y * mapWidth) + x + 2 ];
										let tile = tileset[tileIndex];

										ctx.drawImage(tile.canvas, x*tile_w, y*tile_h);
									}
								}

								// Save the new object.
								core.GRAPHICS.ASSETS.tilemaps_canvas[tilesetName][tilemap_name]={
									"canvas":canvas,
									"imgData":ctx.getImageData(0, 0, canvas.width, canvas.height),
									"numUsed":0,
								}

							}
						}
					}
				};

				// Convert core.ASSETS.graphics.tiles to an array of canvases.
				JSGAME.SHARED.PERFORMANCE.stamp("VIDEO_INIT_post_graphicsConversion" , "START");
				post_graphicsConversion();
				JSGAME.SHARED.PERFORMANCE.stamp("VIDEO_INIT_post_graphicsConversion" , "END");

				//
				JSGAME.SHARED.PERFORMANCE.stamp("VIDEO_INIT_post_graphicsConversion2" , "START");
				post_graphicsConversion2();
				JSGAME.SHARED.PERFORMANCE.stamp("VIDEO_INIT_post_graphicsConversion2" , "END");

				// Make sure all canvases are cleared.
				JSGAME.SHARED.PERFORMANCE.stamp("VIDEO_INIT_clearAllCanvases"        , "START");
				core.GRAPHICS.FUNCS.clearAllCanvases();
				JSGAME.SHARED.PERFORMANCE.stamp("VIDEO_INIT_clearAllCanvases"        , "END");

				// TOTAL VIDEO INIT PERFORMANCE:
				JSGAME.SHARED.PERFORMANCE.stamp("VIDEO_INIT_ALL"                     , "END");

				res_VIDEO_INIT();
			},
			function(err){
				rej_VIDEO_INIT();
				let str = ["=E= core.GRAPHICS.FUNCS.init part 1", err];
				// console.error(str);
				throw Error(str);
			},
		);
		res_VIDEO_INIT();
	});
};

// *** Helper functions ***

// Returns a new VRAM tile object with default settings.
core.GRAPHICS.FUNCS.returnNewTile_obj = function(){
	let output = 	{
		"clearThis" : false     , // New clear status.  true: tile will be cleared., false: tile will not be cleared.
		"drawThis"  : false     , // New draw status.  true: tile will be drawn., false: tile will not be drawn (assumes already drawn.)
		"x"         : 0         , // Pixel-aligned x position.
		"y"         : 0         , // Pixel-aligned y position.
		"tileindex" : 0         , // Tile index. Index into core.GRAPHICS.ASSETS.tileObjs.
		"tileset"   : ""        , // Name of tileset.
		"flags"     : {
			"ROT"     : 0     , // Rotation. (degrees, -360 through +360. Default: 0.)
			"FLIP_X"  : false , // true: Tile canvas flipped horizontally., false: Tile is not flipped horizontally
			"FLIP_Y"  : false , // true: Tile canvas flipped vertically., false: Tile is not flipped vertically
			"OFF"     : true  , // true: tile is ignored. false, tile is drawn.
			"SPRITE"  : false , // true: x and y are used as is., false, x=x*TILE_WIDTH y=y*TILE_HEIGHT.
			"CLEAR"   : false , // true: cleared before draw., false: not cleared before draw (overrides the layer clearThis setting.)
			"CANVAS"  : false , // true: draw as whole canvas., false: draw as individual tiles.
		},
	};

	return output;
};

// *** Logo functions ***

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

				width = output.canvas.width;
				height = output.canvas.height;
				xpos=0;
				ypos=0;

				// Draw the image.
				//     drawImage( image, sx , sy, sWidth   , sHeight   , dx   , dy   , dWidth, dHeight );
				output.drawImage( img  , 0  , 0 , img.width, img.height, xpos , ypos , width , height  );

				// Hold the image for a moment. It should be cleared by the game.
				setTimeout( res , 750);
			};
			img.src = logo;
		}
		else{ res(); }
	});
};

// *** Layer update functions ***

// Resets VRAM to default state.
core.GRAPHICS.FUNCS.ClearVram           = function(layer){
	let layersToClear=[];

	// If a layer was not specifed then clear all layers.
	if(layer==undefined){
		for(let c=0; c<core.GRAPHICS.DATA.DRAWORDER.length; c+=1){
			let l = core.GRAPHICS.DATA.DRAWORDER[c];
			if(!core.SETTINGS.layers[l].sprite){
				layersToClear.push(core.GRAPHICS.DATA.DRAWORDER[c]);
			}
			else{
				// core.GRAPHICS.FUNCS.clearSprites(l);
			}
		}
	}

	// If a specific layer was specified then only clear that layer.
	else{ layersToClear.push(layer); }

	// Get the number of tiles for VRAM.
	let screen_wh   = (core.SETTINGS['VRAM_TILES_H'] * core.SETTINGS['VRAM_TILES_V']);

	// Clear the specified VRAM(s).
	for(let l=0; l<layersToClear.length; l+=1){
		layer=layersToClear[l];

		// Determine which tile to clear with.
		let clearWith = core.GRAPHICS.DATA.FLAGS[layer].clearWith;
		let clearTileset="default_tileset";
		let clearIndex;
		if     (clearWith=="black")      { clearIndex=0; }
		else if(clearWith=="transparent"){ clearIndex=1; }
		else{
			let str = ["=E= ClearVram: clearWith is invalid.", layer, clearWith,clearTileset,clearIndex];
			console.error(str);
			throw Error(str);
		}

		for(let i=0; i<screen_wh; i+=1){
			core.GRAPHICS.DATA.VRAM[layer][i]=core.GRAPHICS.FUNCS.returnNewTile_obj();
			//
			// core.GRAPHICS.DATA.VRAM[layer][i].drawThis     = true;
			core.GRAPHICS.DATA.VRAM[layer][i].clearThis    = true;
			// core.GRAPHICS.DATA.VRAM[layer][i].tileset      = clearTileset;
			// core.GRAPHICS.DATA.VRAM[layer][i].tileindex    = clearIndex;
			core.GRAPHICS.DATA.VRAM[layer][i].flags.SPRITE = false;
			core.GRAPHICS.DATA.VRAM[layer][i].flags.OFF    = false;
			// core.GRAPHICS.DATA.VRAM[layer][i].flags.CLEAR  = true;
		}

		// Set this layer to update.
		core.GRAPHICS.DATA.FLAGS[layer].UPDATE=true;
		core.GRAPHICS.DATA.FLAGS[layer].REDRAW=true;
	}
};
// Clears all canvases and sets the OUTPUT canvas to all black;
core.GRAPHICS.FUNCS.clearAllCanvases    = function(){
	// Clear the canvas layers and related VRAM.
	for(let c=0; c<core.GRAPHICS.DATA.DRAWORDER.length; c+=1){
		// Clear the canvas.
		let layerName = core.GRAPHICS.DATA.DRAWORDER[c];
		let canvas    = core.GRAPHICS.canvas[layerName];
		let ctx       = core.GRAPHICS.ctx[layerName];
		ctx.clearRect(0, 0, canvas.width, canvas.height);
	}

	// Clear the VRAM and SPRITES.

	// For grid-locked VRAM-type layers.
	core.GRAPHICS.FUNCS.ClearVram();
	// For non-grid-locked SPRITE-type layers.
	core.GRAPHICS.FUNCS.clearSprites();

	// Clear the OUTPUT canvas.
	let canvas = core.GRAPHICS.canvas["OUTPUT"];
	let ctx    = core.GRAPHICS.ctx["OUTPUT"];
	// ctx.fillStyle = "rgba(0, 0, 0, 1.0)";       // Black
	// ctx.fillStyle = "rgba(255, 255, 255, 1.0)"; // White
	// ctx.fillRect(0, 0, canvas.width, canvas.height);
	ctx.clearRect( 0,0, canvas.width, canvas.height );
};
// Can draw any map from any tileset to any layer. (Draws tile-based BG, TEXT, and SPRITE.)
core.GRAPHICS.FUNCS.update_layers_type1 = function(){
	return new Promise(function(res,rej){
		try{
		// PER LAYER:
			// Force "clearThis" on a tile if tindicated or specified by gamesettings.json.
			// Draw only the tiles that have the "drawThis" flag set.
			// Clear only the tiles that have the "clearThis" flag set.

		let updateOUTPUT = false;

		if(!core.GRAPHICS.performance.LAYERS["update_layers_type1"]){
			core.GRAPHICS.performance.LAYERS["update_layers_type1"]=[ 0, 0, 0, 0, 0 ];
		}

		let drawStart_update_layers_type1;
		if(JSGAME.FLAGS.debug) { drawStart_update_layers_type1 = performance.now(); core.GRAPHICS.performance.LAYERS["update_layers_type1"].shift(); }

		// Determine the output canvas.
		for(let c=0; c<core.GRAPHICS.DATA.DRAWORDER.length; c+=1){
			let layerName = core.GRAPHICS.DATA.DRAWORDER[c]    ;

			// let canvas    = core.GRAPHICS.canvas[layerName]    ;
			let ctx       = core.GRAPHICS.ctx[layerName]       ;

			// Sprites.
			let data ;
			if(core.SETTINGS.layers[layerName].sprite){
				data = core.GRAPHICS.DATA.SPRITES[layerName] ;
			}
			// Non-sprites
			else{
				data = core.GRAPHICS.DATA.VRAM[layerName] ;
			}

			let drawStart = performance.now();

			// The layer needs an update.
			let updateNeeded = core.GRAPHICS.DATA.FLAGS[layerName].UPDATE;

			// The layer must be redrawn.
			let forceRedraw  = core.GRAPHICS.DATA.FLAGS[layerName].REDRAW;

			// Draw the tile if indicated.
			if(updateNeeded || forceRedraw){
				// Clear the tile if indicated.
				for(let t=0; t<data.length; t+=1){
					// Skip gaps in the array. (Would happen more often with sprites.)
					if(!data[t]){ continue; }

					// Skip the whole canvas drawing tiles. This is handled elsewhere.
					if(data[t].flags.CANVAS){ continue; }

					// Is this tile set to be cleared?
					if( data[t].clearThis ){
						// let tile = core.GRAPHICS.ASSETS.tileObjs[ data[t].tileset ][ data[t].tileindex ];
						// let canvas = tile.canvas;

						// Determine which tile to clear with.
						let clearWith = core.GRAPHICS.DATA.FLAGS[layerName].clearWith;
						let clearTileset="default_tileset";
						let clearIndex;
						if     (clearWith=="black")      { clearIndex=0; }
						else if(clearWith=="transparent"){ clearIndex=1; }
						else{
							let str = ["=E= update_layers_type1: clearWith is invalid.", layerName, clearWith,clearTileset,clearIndex];
							console.error(str);
							throw Error(str);
						}

						// console.log("Clearing", t, data[t]);
						// Get the x and y positions.
						let x         = data[t].x    ;
						let y         = data[t].y    ;

						// Clear the tile destination first.
						ctx.clearRect( (x) << 0, (y) << 0, core.SETTINGS.TILE_WIDTH, core.SETTINGS.TILE_HEIGHT );
						ctx.clearRect( (x) << 0, (y) << 0, core.SETTINGS.TILE_WIDTH, core.SETTINGS.TILE_HEIGHT );

						// Draw the tile.
						tile         = core.GRAPHICS.ASSETS.tileObjs[clearTileset][clearIndex]  ;
						try{
							tile_canvas  = tile.canvas  ;
							tile_imgData = tile.imgData ;
							ctx.drawImage( tile_canvas, (x) << 0, (y) << 0 );
							tile.numUsed+=1;
						}
						catch(e){
							let str = ["=E= update_layers_type1: (in clear) canvas or imgData not found.", e];
							rej(str);
							throw Error(str);
							return;
						}

						// Clear the clearThis flag.
						data[t].clearThis=false;
					}
				}

				// Go through the data.
				for(let t=0; t<data.length; t+=1){
					// Skip gaps in the array. (Would happen more often with sprites.)
					if(!data[t]){ continue; }

					// Skip the whole canvas drawing tiles. This is handled elsewhere.
					if(data[t].flags.CANVAS){ continue; }

					// Draw this tile?
					if(data[t].drawThis || forceRedraw){
						// Get some data on the tile.
						let tileset   = data[t].tileset      ;
						let tileindex = data[t].tileindex    ;
						let flags     = data[t].flags        ;
						let ROT       = data[t].flags.ROT    ;
						let FLIP_X    = data[t].flags.FLIP_X ;
						let FLIP_Y    = data[t].flags.FLIP_Y ;
						let OFF       = data[t].flags.OFF    ;

						// Get the x and y positions.
						let x         = data[t].x    ;
						let y         = data[t].y    ;

						// Skip the drawing if at least one of these conditions is true.
						if(!tileset || tileset==""){ continue; }
						if(OFF)                    { console.log("tile set to off"); continue; }

						// Get the tile object and graphics data.
						let tile;
						let tile_canvas;
						let tile_imgData;

						// Non-sprites (No ROT, FLIP_X, or FLIP_Y.)
						if(!core.SETTINGS.layers[layerName].sprite){
							// Use the normal unmodified tile.
							tile         = core.GRAPHICS.ASSETS.tileObjs[tileset][tileindex] ;
							try{
								tile_canvas  = tile.canvas  ;
								tile_imgData = tile.imgData ;
							}
							catch(e){
								let str = ["=E= update_layers_type1: (non-sprite in draw) canvas or imgData not found.", e];
								rej(str);
								throw Error(str);
								return;
							}
						}
						// Sprites (Possible ROT, FLIP_X, or FLIP_Y.)
						else{
							// Use the normal unmodified tile?
							if(!ROT && !FLIP_X && !FLIP_Y){
								tile         = core.GRAPHICS.ASSETS.tileObjs[tileset][tileindex] ;
								try{
									tile_canvas  = tile.canvas  ;
									tile_imgData = tile.imgData ;
								}
								catch(e){
									let str = ["=E= update_layers_type1: (sprite in draw) canvas or imgData not found.", e];
									rej(str);
									throw Error(str);
									return;
								}
							}
							// Tile has modifications. Use cached modification or generate new.
							else{
								// Original tile (unmodified.)
								tile         = core.GRAPHICS.ASSETS.tileObjs[tileset][tileindex] ;

								// Rotate? Flip X? Flip Y?
								if(ROT!=0 || FLIP_X || FLIP_Y){
									// Original, unmodifed tile.
									tile         = core.GRAPHICS.ASSETS.tileObjs[tileset][tileindex] ;

									// Try to find a cached copy of this tile.
									let cachedTile = core.GRAPHICS.FUNCS.findFlippedTileInCache (tileset, tileindex, flags);

									// Not available in cache? Create the tile and then add the cachedTile to the cache.
									if(cachedTile.tile===false){
										// Modifiy the tile.
										let modifiedTile = core.GRAPHICS.FUNCS.flipImage_canvas(tile, tileset, tileindex, flags);
										// console.log("Created modified tile:",modifiedTile,tileset,tileindex,flags);

										// Set this tile to be drawn.
										tile = modifiedTile;
										tile_canvas  = tile.canvas  ;
										tile_imgData = tile.imgData ;

										// Cache new tiles that have one of the following rotations.
										if(ROT==0 || ROT == 90 || ROT == 180 || ROT == 270){
											// Add the tile data to the cache.
											// console.log("Adding tile to cache:",modifiedTile,tileset,tileindex,flags);
											core.GRAPHICS.FUNCS.AddFlippedTileToCache(modifiedTile, tileset, tileindex, flags);
										}
										else{
											// Original, unmodifed tile.
											// console.log("NOT adding tile to cache:",modifiedTile,tileset,tileindex,flags);
											continue;
										}
									}
									// In cache? Use the returned tile object.
									else{
										// console.log("Using existing cache:",cachedTile, tileset,tileindex,flags);
										tile = cachedTile.tile;
										tile_canvas  = tile.canvas  ;
										tile_imgData = tile.imgData ;
									}

								}
								else{
									try{
										// Original tile (unmodified.)
										tile         = core.GRAPHICS.ASSETS.tileObjs[tileset][tileindex] ;
										tile_canvas  = tile.canvas  ;
										tile_imgData = tile.imgData ;
									}
									catch(e){
										let str = ["=E= update_layers_type1: (sprite no flags in draw) canvas or imgData not found.", e];
										rej(str);
										throw Error(str);
										return;
									}
								}
							}
						}


						// Try to draw the tile.
						try{
							// Draw the tile.
							ctx.drawImage( tile_canvas, (x) << 0, (y) << 0 );

							// Update some flags.
							data[t].drawThis=false;
							tile.numUsed+=1;
						}
						catch(e){
							// console.log(e);
							let str = ["=E= update_layers_type1: ", e];
							rej(str);
							throw Error(str);
						}
					}
				}

				// Set the updateOUTPUT flag.
				updateOUTPUT=true;

				// Set the last update time for this layer.
				core.GRAPHICS.DATA.FLAGS[layerName].lastUpdate=performance.now();

				// Clear the UPDATE and REDRAW flags for this layer.
				core.GRAPHICS.DATA.FLAGS[layerName].UPDATE=false;
				core.GRAPHICS.DATA.FLAGS[layerName].REDRAW=false;
			}

			if(JSGAME.FLAGS.debug) { core.GRAPHICS.performance.LAYERS[layerName].shift(); core.GRAPHICS.performance.LAYERS[layerName].push(performance.now() - drawStart);                   }
		}

		// Done! Resolve.
		if(JSGAME.FLAGS.debug) { core.GRAPHICS.performance.LAYERS["update_layers_type1"].push(performance.now() - drawStart_update_layers_type1);                   }
		res( {"updateOUTPUT":updateOUTPUT} );
		}
		catch(e){
			console.log("=E= update_layers_type1: failure.", e);
			throw Error(e);
			rej(e);
		}
	});
};
// For sprites.
core.GRAPHICS.FUNCS.update_layers_type2 = function(){
	return new Promise(function(res,rej){
		// Skip the whole canvas drawing tiles. This is handled elsewhere.
		// if(!data[t].flags.CANVAS){ continue; }

		// let updateOUTPUT = false;
		let updateOUTPUT = true;
		res( {"updateOUTPUT":updateOUTPUT} );
	});

	return new Promise(function(res,rej){
		try{
		// PER LAYER:
			// Force "clearThis" on a tile if tindicated or specified by gamesettings.json.
			// Draw only the tiles that have the "drawThis" flag set.
			// Clear only the tiles that have the "clearThis" flag set.

		let updateOUTPUT = false;

		if(!core.GRAPHICS.performance.LAYERS["update_layers_type2"]){
			core.GRAPHICS.performance.LAYERS["update_layers_type2"]=[ 0, 0, 0, 0, 0 ];
		}

		let drawStart_update_layers_type2;
		if(JSGAME.FLAGS.debug) { drawStart_update_layers_type2 = performance.now(); core.GRAPHICS.performance.LAYERS["update_layers_type1"].shift(); }

		// Determine the output canvas.
		for(let c=0; c<core.GRAPHICS.DATA.DRAWORDER.length; c+=1){
			let layerName = core.GRAPHICS.DATA.DRAWORDER[c]    ;

			// let canvas    = core.GRAPHICS.canvas[layerName]    ;
			let ctx       = core.GRAPHICS.ctx[layerName]       ;

			// Sprites.
			let data ;
			if(core.SETTINGS.layers[layerName].sprite){
				data = core.GRAPHICS.DATA.SPRITES[layerName] ;
			}
			// Non-sprites
			else{
				data = core.GRAPHICS.DATA.VRAM[layerName] ;
			}

			let drawStart = performance.now();

			// The layer needs an update.
			let updateNeeded = core.GRAPHICS.DATA.FLAGS[layerName].UPDATE;

			// The layer must be redrawn.
			let forceRedraw  = core.GRAPHICS.DATA.FLAGS[layerName].REDRAW;

			// Draw the tile if indicated.
			if(updateNeeded || forceRedraw){
				// Clear the tile if indicated.
				for(let t=0; t<data.length; t+=1){
					// Skip gaps in the array. (Would happen more often with sprites.)
					if(!data[t]){ continue; }

					// Skip the whole canvas drawing tiles. This is handled elsewhere.
					if(!data[t].flags.CANVAS){ continue; }

					// Is this tile set to be cleared?
					if( data[t].clearThis ){
						// let tile = core.GRAPHICS.ASSETS.tileObjs[ data[t].tileset ][ data[t].tileindex ];
						// let canvas = tile.canvas;

						// Determine which tile to clear with.
						let clearWith = core.GRAPHICS.DATA.FLAGS[layerName].clearWith;
						let clearTileset="default_tileset";
						let clearIndex;
						if     (clearWith=="black")      { clearIndex=0; }
						else if(clearWith=="transparent"){ clearIndex=1; }
						else{
							let str = ["=E= update_layers_type2: clearWith is invalid.", layerName, clearWith,clearTileset,clearIndex];
							console.error(str);
							throw Error(str);
						}

						// console.log("Clearing", t, data[t]);
						// Get the x and y positions.
						let x         = data[t].x    ;
						let y         = data[t].y    ;

						// Clear the tile destination first.
						ctx.clearRect( (x) << 0, (y) << 0, core.SETTINGS.TILE_WIDTH, core.SETTINGS.TILE_HEIGHT );
						ctx.clearRect( (x) << 0, (y) << 0, core.SETTINGS.TILE_WIDTH, core.SETTINGS.TILE_HEIGHT );

						// Draw the tile.
						tile         = core.GRAPHICS.ASSETS.tileObjs[clearTileset][clearIndex]  ;
						try{
							tile_canvas  = tile.canvas  ;
							tile_imgData = tile.imgData ;
							ctx.drawImage( tile_canvas, (x) << 0, (y) << 0 );
							tile.numUsed+=1;
						}
						catch(e){
							let str = ["=E= update_layers_type2: (in clear) canvas or imgData not found.", e];
							rej(str);
							throw Error(str);
							return;
						}

						// Clear the clearThis flag.
						data[t].clearThis=false;
					}
				}

				// Go through the data.
				for(let t=0; t<data.length; t+=1){
					// Skip gaps in the array. (Would happen more often with sprites.)
					if(!data[t]){ continue; }

					// Skip the whole canvas drawing tiles. This is handled elsewhere.
					if(!data[t].flags.CANVAS){ continue; }

					// Draw this tile?
					if(data[t].drawThis || forceRedraw){
						// Get some data on the tile.
						let tileset   = data[t].tileset      ;
						let tileindex = data[t].tileindex    ;
						let flags     = data[t].flags        ;
						let ROT       = data[t].flags.ROT    ;
						let FLIP_X    = data[t].flags.FLIP_X ;
						let FLIP_Y    = data[t].flags.FLIP_Y ;
						let OFF       = data[t].flags.OFF    ;

						// Get the x and y positions.
						let x         = data[t].x    ;
						let y         = data[t].y    ;

						// Skip the drawing if at least one of these conditions is true.
						if(!tileset || tileset==""){ continue; }
						if(OFF)                    { console.log("tile set to off"); continue; }

						// Get the tile object and graphics data.
						let tile;
						let tile_canvas;
						let tile_imgData;

						// Non-sprites (No ROT, FLIP_X, or FLIP_Y.)
						if(!core.SETTINGS.layers[layerName].sprite){
							// Use the normal unmodified tile.
							tile         = core.GRAPHICS.ASSETS.tileObjs[tileset][tileindex] ;
							try{
								tile_canvas  = tile.canvas  ;
								tile_imgData = tile.imgData ;
							}
							catch(e){
								let str = ["=E= update_layers_type2: (non-sprite in draw) canvas or imgData not found.", e];
								rej(str);
								throw Error(str);
								return;
							}
						}
						// Sprites (Possible ROT, FLIP_X, or FLIP_Y.)
						else{
							// Use the normal unmodified tile?
							if(!ROT && !FLIP_X && !FLIP_Y){
								tile         = core.GRAPHICS.ASSETS.tileObjs[tileset][tileindex] ;
								try{
									tile_canvas  = tile.canvas  ;
									tile_imgData = tile.imgData ;
								}
								catch(e){
									let str = ["=E= update_layers_type2: (sprite in draw) canvas or imgData not found.", e];
									rej(str);
									throw Error(str);
									return;
								}
							}
							// Tile has modifications. Use cached modification or generate new.
							else{
								// Original tile (unmodified.)
								tile         = core.GRAPHICS.ASSETS.tileObjs[tileset][tileindex] ;

								// Rotate? Flip X? Flip Y?
								if(ROT!=0 || FLIP_X || FLIP_Y){
									// Original, unmodifed tile.
									tile         = core.GRAPHICS.ASSETS.tileObjs[tileset][tileindex] ;

									// Try to find a cached copy of this tile.
									let cachedTile = core.GRAPHICS.FUNCS.findFlippedTileInCache (tileset, tileindex, flags);

									// Not available in cache? Create the tile and then add the cachedTile to the cache.
									if(cachedTile.tile===false){
										// Modifiy the tile.
										let modifiedTile = core.GRAPHICS.FUNCS.flipImage_canvas(tile, tileset, tileindex, flags);
										// console.log("Created modified tile:",modifiedTile,tileset,tileindex,flags);

										// Set this tile to be drawn.
										tile = modifiedTile;
										tile_canvas  = tile.canvas  ;
										tile_imgData = tile.imgData ;

										// Cache new tiles that have one of the following rotations.
										if(ROT==0 || ROT == 90 || ROT == 180 || ROT == 270){
											// Add the tile data to the cache.
											// console.log("Adding tile to cache:",modifiedTile,tileset,tileindex,flags);
											core.GRAPHICS.FUNCS.AddFlippedTileToCache(modifiedTile, tileset, tileindex, flags);
										}
										else{
											// Original, unmodifed tile.
											// console.log("NOT adding tile to cache:",modifiedTile,tileset,tileindex,flags);
											continue;
										}
									}
									// In cache? Use the returned tile object.
									else{
										// console.log("Using existing cache:",cachedTile, tileset,tileindex,flags);
										tile = cachedTile.tile;
										tile_canvas  = tile.canvas  ;
										tile_imgData = tile.imgData ;
									}

								}
								else{
									try{
										// Original tile (unmodified.)
										tile         = core.GRAPHICS.ASSETS.tileObjs[tileset][tileindex] ;
										tile_canvas  = tile.canvas  ;
										tile_imgData = tile.imgData ;
									}
									catch(e){
										let str = ["=E= update_layers_type2: (sprite no flags in draw) canvas or imgData not found.", e];
										rej(str);
										throw Error(str);
										return;
									}
								}
							}
						}


						// Try to draw the tile.
						try{
							// Draw the tile.
							ctx.drawImage( tile_canvas, (x) << 0, (y) << 0 );

							// Update some flags.
							data[t].drawThis=false;
							tile.numUsed+=1;
						}
						catch(e){
							// console.log(e);
							let str = ["=E= update_layers_type2: ", e];
							rej(str);
							throw Error(str);
						}
					}
				}

				// Set the updateOUTPUT flag.
				updateOUTPUT=true;

				// Set the last update time for this layer.
				core.GRAPHICS.DATA.FLAGS[layerName].lastUpdate=performance.now();

				// Clear the UPDATE and REDRAW flags for this layer.
				core.GRAPHICS.DATA.FLAGS[layerName].UPDATE=false;
				core.GRAPHICS.DATA.FLAGS[layerName].REDRAW=false;
			}

			if(JSGAME.FLAGS.debug) { core.GRAPHICS.performance.LAYERS[layerName].shift(); core.GRAPHICS.performance.LAYERS[layerName].push(performance.now() - drawStart);                   }
		}

		// Done! Resolve.
		if(JSGAME.FLAGS.debug) { core.GRAPHICS.performance.LAYERS["update_layers_type2"].push(performance.now() - drawStart_update_layers_type2);                   }
		res( {"updateOUTPUT":updateOUTPUT} );
		}
		catch(e){
			console.log("=E= update_layers_type2: failure.", e);
			throw Error(e);
			rej(e);
		}
	});


};
// Combines the layer and draws to the OUTPUT canvas.
core.GRAPHICS.FUNCS.update_layer_OUTPUT = function(){
	return new Promise(function(res,rej){
		// Get a handle to the temp output.
		let tempOutput = core.GRAPHICS.canvas.pre_OUTPUT;
		let tempOutput_ctx = core.GRAPHICS.ctx.pre_OUTPUT;
		tempOutput_ctx.clearRect( 0,0, tempOutput.width, tempOutput.height );

		// Draw each layer to the OUTPUT in the order specified by the gamesettings.json file.
		for(let i=0; i<core.GRAPHICS.DATA.DRAWORDER.length; i+=1){
			let layerName = core.GRAPHICS.DATA.DRAWORDER[i];
			let canvas = core.GRAPHICS.canvas[layerName];
			tempOutput_ctx.drawImage( canvas, 0, 0) ;
		}

		// Draw to the OUTPUT canvas.
		core.GRAPHICS.ctx.OUTPUT.clearRect( 0,0, core.GRAPHICS.canvas.OUTPUT.width, core.GRAPHICS.canvas.OUTPUT.height );
		core.GRAPHICS.ctx.OUTPUT.drawImage(tempOutput,0,0);

		// Done! Resolve.
		res();
	});
};
// Invokes the layer updates.
core.GRAPHICS.FUNCS.update_allLayers    = function(){
	// This should not fire until the game is ready. This is a guard (and is likely unneeded.)
	if(!JSGAME.FLAGS.gameReady){ alert("game not ready but update_allLayers was started."); return ; }

	// While this flag is set, main will not run the logic loop or another graphics loop.
	core.GRAPHICS.DATA.INLAYERUPDATE=true;

	// If an update is not needed then the promise will resolve right away.
	let proms = [
		core.GRAPHICS.FUNCS.update_layers_type1() ,
		core.GRAPHICS.FUNCS.update_layers_type2() ,
	];

	Promise.all(proms).then(
		// Success? Write the OUTPUT layer.
		function(res){
			if( res[0].updateOUTPUT || res[1].updateOUTPUT ){
				core.GRAPHICS.FUNCS.update_layer_OUTPUT().then(
					// Success?
					function(){
						// Clear INLAYERUPDATE to allow another game loop.
						core.GRAPHICS.DATA.INLAYERUPDATE=false;
					},
					// Failure?
					function(err){
						// Throw error.
						let str = ["=E= update_allLayers: failed in update_layer_OUTPUT: ", err];
						console.error(str);
						throw Error(str);
					}
				);
			}
			else {
				// Clear INLAYERUPDATE to allow another game loop.
				core.GRAPHICS.DATA.INLAYERUPDATE=false;
			}
		},
			// Failure of at least one promise in the array?
		function(err){
			// Throw error.
			let str = ["=E= update_allLayers: failed promise in layer draws: ", err];
			console.error(err, str);
			throw Error(str);
		},
	);

};

// *** VRAM tile functions.

// Draws a tile to the specified location.
core.GRAPHICS.FUNCS.SetTile      = function(x, y, tileid, tileset, layer, flags){
	// Make sure the layer exists and that the tileset exists.
	let layerExists   = core.SETTINGS['layers'][layer]         ? true : false;
	let tilesetExists = core.GRAPHICS.ASSETS.tileObjs[tileset] ? true : false;
	if( !layerExists   ){ let str = ["=E= SetTile: Layer not found: "   + layer  ]; throw Error(str); }
	if( !tilesetExists ){ let str = ["=E= SetTile: Tileset not found: " + tileset]; throw Error(str); }
	// Make sure the tileid is valid for this tileset.
	if(tileid >= core.GRAPHICS.ASSETS.tileObjs[tileset].length){
		let str = ["=E= SetTile: Tile id not found in tileset. ", tileid, tileset, layer ]; throw Error(str);
	}

	let addr;
	let tmp_x=x;
	let tmp_y=y;

	// Do a bounds-check before drawing the tile.

	// Out of bounds on x?
	if(x >= core.SETTINGS.VRAM_TILES_H)     {
		// console.log("Out of bounds: x", "x:", x, "core.SETTINGS.VRAM_TILES_H:", core.SETTINGS.VRAM_TILES_H);
		return;
	}
	// Out of bounds on y?
	else if(y >= core.SETTINGS.VRAM_TILES_V){
		// console.log("Out of bounds: y", "y:", y, "core.SETTINGS.VRAM_TILES_V:", core.SETTINGS.VRAM_TILES_V);
		return;
	}

	// Determine the VRAM index.
	addr = ( tmp_y * core.SETTINGS['VRAM_TILES_H'] ) + tmp_x ;

	// Get the current tile object.
	let currentTile;
	currentTile = core.GRAPHICS.DATA.VRAM[layer][addr] ;

	// Is it a tile object?
	if(addr > core.GRAPHICS.DATA.VRAM[layer].length-1 || currentTile==undefined) {
		console.log(
			"\n tileObj    :" ,core.GRAPHICS.DATA.VRAM[layer][addr] ,
			"\n layer      :" ,layer ,
			"\n addr       :" ,addr ,
			"\n currentTile:" ,currentTile ,
			"\n tmp_x      :" ,tmp_x ,
			"\n x          :" ,x     ,
			"\n tmp_y      :" ,tmp_y ,
			"\n y          :" ,y     ,
			"\n"
		);
		let str = ["=E= SetTile: Tile not found.", JSON.stringify({"layer":layer, "x":x, "y":y, "addr":addr, "lastTileId":core.GRAPHICS.DATA.VRAM[layer].length-1 })];
		throw Error(str);
	}

	// Set the flag defaults.
	currentTile.flags.ROT    = 0;
	currentTile.flags.FLIP_X = false;
	currentTile.flags.FLIP_Y = false;
	currentTile.flags.OFF    = false;
	currentTile.flags.SPRITE = false;
	currentTile.flags.CLEAR = false;

	// If flags were specified, then use them to override the default settings.
	if(flags.ROT   ) { currentTile.flags.ROT    = flags.ROT    ; }
	if(flags.FLIP_X) { currentTile.flags.FLIP_X = flags.FLIP_X ; }
	if(flags.FLIP_Y) { currentTile.flags.FLIP_Y = flags.FLIP_Y ; }
	if(flags.OFF   ) { currentTile.flags.OFF    = flags.OFF    ; }
	if(flags.SPRITE) { currentTile.flags.SPRITE = flags.SPRITE ; }
	if(flags.CLEAR ) { currentTile.flags.CLEAR  = flags.CLEAR  ; }

	// Change the tile data.
	if     ( currentTile.flags.OFF   ){ currentTile.clearThis = true ; }
	else if( currentTile.flags.CLEAR ){ currentTile.clearThis = true ; }
	else                              { currentTile.clearThis = core.SETTINGS['layers'][layer].clearBeforeDraw ; }
	currentTile.flags.CLEAR=false; // Flag value no longer needed.

	currentTile.drawThis     = true;
	currentTile.tileindex    = tileid;
	currentTile.tileset      = tileset;

	// Adjust coordinates to be pixel-aligned instead of grid-aligned.
	currentTile.x = x * core.SETTINGS['TILE_WIDTH']  ;
	currentTile.y = y * core.SETTINGS['TILE_HEIGHT'] ;

	// Make the change.
	core.GRAPHICS.DATA.VRAM[layer][addr] = currentTile ;

	// Update the draw flag for the specified layer.
	core.GRAPHICS.DATA.FLAGS[layer].UPDATE=true;
};
// Fills a rectangular region with the specified tile id.
core.GRAPHICS.FUNCS.Fill         = function(xpos, ypos, w, h, tileid, tileset, layer, flags){
	// Make sure the layer exists and that the tileset exists.
	let layerExists   = core.SETTINGS['layers'][layer]         ? true : false;
	let tilesetExists = core.GRAPHICS.ASSETS.tileObjs[tileset] ? true : false;
	if( !layerExists   ){ let str = ["=E= Fill: Layer not found: "   + layer  ]; throw Error(str); }
	if( !tilesetExists ){ let str = ["=E= Fill: Tileset not found: " + tileset]; throw Error(str); }
	// Make sure the tileid is valid for this tileset.
	if(tileid >= core.GRAPHICS.ASSETS.tileObjs[tileset].length){
		let str = ["=E= Fill: Tile id not found in tileset. ", tileid, tileset, layer ]; throw Error(str);
	}

	// If flags was not set, then provide an empty object.
	if(!flags){ flags = {}; }

	// Draw the box, one tile at a time with SetTile.
	for(let y=0; y<h; y+=1){
		for(let x=0; x<w; x+=1){
			// Do a bounds-check before drawing the tile.

			// Out of bounds on x?
			if(x+xpos >= core.SETTINGS.VRAM_TILES_H)     {
				// console.log("Out of bounds: x", "x:", x, "core.SETTINGS.VRAM_TILES_H:", core.SETTINGS.VRAM_TILES_H);
				continue;
			}
			// Out of bounds on y?
			else if(y+ypos >= core.SETTINGS.VRAM_TILES_V){
				// console.log("Out of bounds: y", "y:", y, "core.SETTINGS.VRAM_TILES_V:", core.SETTINGS.VRAM_TILES_V);
				continue;
			}
			// In-bounds. Draw the tile.
			else{
				// Update VRAM
				core.GRAPHICS.FUNCS.SetTile(x+xpos, y+ypos, tileid, tileset, layer, flags);
			}
		}
	}
};
// Draws a tilemap to the specified layer with the specified tileset and flags.
core.GRAPHICS.FUNCS.DrawMap2     = function(x, y, map, tileset, layer, flags){
	// Draw a tilemap to the specified VRAM.

	// A map can be specified as a string or an actual map array.

	// Make sure the layer exists the tileset exists, and the map exists.
	let layerExists   = core.SETTINGS['layers'][layer]              ? true : false;
	let tilesetExists = core.GRAPHICS.ASSETS.tileObjs[tileset]      ? true : false;
	if( !layerExists   ){ let str = ["=E= DrawMap2: Layer not found: "   + layer  ]; throw Error(str); }
	if( !tilesetExists ){ let str = ["=E= DrawMap2: Tileset not found: " + tileset]; throw Error(str); }
	// Can accept either an Array or an ArrayBuffer view.
	if     (typeof map == "string"){
		if(!core.GRAPHICS.ASSETS.tilemaps[tileset][map]){
			let str = ["=E= DrawMap2: Map not valid: ", tileset, map ];
			throw Error(str);
		}
		else { map = core.GRAPHICS.ASSETS.tilemaps[tileset][map]; }
	}
	else if( map.constructor === Array || ArrayBuffer.isView(map) ){ map = map; }
	else{
		let str = ["=E= DrawMap2: Map not valid: ", tileset, map ];
		throw Error(str);
	}

	// Width and height should be the first values in the tilemap.
	let mapWidth  = map[0] ;
	let mapHeight = map[1] ;

	// Set the tiles.
	for(let dy = 0; dy < mapHeight; dy++){
		for(let dx = 0; dx < mapWidth; dx++){
			// Vars for easier reading.
			let tileIndex = map[ (dy * mapWidth) + dx + 2 ] ;

			// Make sure the tileid is valid for this tileset.
			if(tileIndex >= core.GRAPHICS.ASSETS.tileObjs[tileset].length){
				let str = ["=E= DrawMap2: Tile id not found in tileset. ", tileIndex, map, tileset, layer ]; throw Error(str);
			}

			let destx = (x + dx) ;
			let desty = (y + dy) ;

			// Do a bounds-check before drawing the tile.

			// Out of bounds on x?
			if(destx >= core.SETTINGS.VRAM_TILES_H){
				// console.log("Out of bounds: x", "x:", x, "destx:", destx, "core.SETTINGS.VRAM_TILES_H:", core.SETTINGS.VRAM_TILES_H);
				continue;
			}
			// Out of bounds on y?
			else if(desty >= core.SETTINGS.VRAM_TILES_V){
				// console.log("Out of bounds: y", "y:", y, "desty:", desty, "core.SETTINGS.VRAM_TILES_V:", core.SETTINGS.VRAM_TILES_V);
				continue;
			}
			// In-bounds. Draw the tile.
			else{
				// Draw this tile of the specified tilemap.
				core.GRAPHICS.FUNCS.SetTile(destx, desty, tileIndex, tileset, layer, flags);
			}
		}
	}

};
// Allows for repeating a tilemap over a larger surface.
core.GRAPHICS.FUNCS.DrawMap_customDimensions = function(sx, sy, nw, nh, map, tileset, layer, flags){
	// EXAMPLES:
	// core.FUNCS.graphics.DrawMap_customDimensions(0,17,14,4, "main_bg_pattern2", "tilesBG1", "BG1");

	// Make sure the layer exists the tileset exists, and the map exists.
	let layerExists   = core.SETTINGS['layers'][layer]              ? true : false;
	let tilesetExists = core.GRAPHICS.ASSETS.tileObjs[tileset]      ? true : false;
	if( !layerExists   ){ let str = ["=E= DrawMap_customDimensions: Layer not found: "   + layer  ]; throw Error(str); }
	if( !tilesetExists ){ let str = ["=E= DrawMap_customDimensions: Tileset not found: " + tileset]; throw Error(str); }
	// Can accept either an Array or an ArrayBuffer view.
	if     (typeof map == "string"){
		if(!core.GRAPHICS.ASSETS.tilemaps[tileset][map]){
			let str = ["=E= DrawMap_customDimensions: Map not valid: ", tileset, map ];
			throw Error(str);
		}
		// else { map = core.GRAPHICS.ASSETS.tilemaps[tileset][map]; }
	}
	else if( map.constructor === Array || ArrayBuffer.isView(map) ){ map = map; }
	else{
		let str = ["=E= DrawMap_customDimensions: Map not valid: ", tileset, map ];
		throw Error(str);
	}

	let mapWidth  = core.GRAPHICS.ASSETS.tilemaps[tileset][map][0] ;
	let mapHeight = core.GRAPHICS.ASSETS.tilemaps[tileset][map][1] ;

	for(let y=0; y<nh; y+=mapHeight){
		for(let x=0; x<nw; x+=mapWidth){
			core.GRAPHICS.FUNCS.DrawMap2(x+sx, y+sy, map, tileset, layer, flags);
		}
	}
};
// // Fills a region with a tile based on map dimensions.
// core.GRAPHICS.FUNCS.FillMap     = function(x, y, map, tileset, layer, flags, tileid){
// 	// (xpos, ypos, w, h, tileid, tileset, layer, flags)
// 	core.GRAPHICS.FUNCS.Fill(x, y, map[0], map[1], tileid, tileset, layer, flags );
// };

// *** TEXT functions. ***

// Prints a line of text at the specified location.
core.GRAPHICS.FUNCS.Print   = function(x, y, string, map, tileset, layer, flags){
	// Example usage:
	// core.GRAPHICS.FUNCS.Print(0, 12, "I'm written with font_black.", "font_black", "tilesTX1", "TEXT", {});

	// Make sure the layer exists the tileset exists, and the map exists.
	let layerExists   = core.SETTINGS['layers'][layer]              ? true : false;
	let tilesetExists = core.GRAPHICS.ASSETS.tileObjs[tileset]      ? true : false;
	if( !layerExists   ){ let str = ["=E= Print: Layer not found: "   + layer  ]; throw Error(str); }
	if( !tilesetExists ){ let str = ["=E= Print: Tileset not found: " + tileset]; throw Error(str); }
	// Can accept either an Array or an ArrayBuffer view.
	if     (typeof map == "string"){
		if(!core.GRAPHICS.ASSETS.tilemaps[tileset][map]){ throw ""; }
		else                                            { map = core.GRAPHICS.ASSETS.tilemaps[tileset][map]; }
	}
	else if( map.constructor === Array || ArrayBuffer.isView(map) ){ map = map; }
	else{
		let str = ["=E= Print: Map not valid: ", tileset, map ];
		throw Error(str);
	}

	// Allow for the fontset to be temporarily switched.
	let fontmap = map;

	// Make sure that only a whole number makes it through.
	x = (x) << 0;
	y = (y) << 0;
	let startx = x;

	// This assumes that the correct tileset and tilemap for the fonts have already been set.
	// Font tiles are expected to be in the following order in the fontmap:
	//    !  "  #  $  %  &  '  (  )  *  +  ,  -  .  /
	// 0  1  2  3  4  5  6  7  8  9  :  ;  <  =  >  ?
	// @  A  B  C  D  E  F  G  H  I  J  K  L  M  N  O
	// P  Q  R  S  T  U  V  W  X  Y  Z  [  c  ]  ^  _

	let fontmap_len = fontmap.length -2 ; // -2 is for skipping the first two indexes.)

	// Turn the string into an iterable array.
	Array.from( string ).forEach(function(d,i,a){
		// Move down a line if a line break is found.
		if(d=="\n"){ x=startx; y+=1; return; }

		// Get the tileid for this character.
		let tileid;
		tileid = d.toUpperCase().charCodeAt() - 32;

		// Make sure this is a valid tile in the font map (bounds-check.)
		if(tileid < fontmap_len){
			// Do a bounds-check before drawing the tile.

			// Out of bounds on x?
			if(x >= core.SETTINGS.VRAM_TILES_H)     {
				// console.log("Out of bounds: x", "x:", x, "core.SETTINGS.VRAM_TILES_H:", core.SETTINGS.VRAM_TILES_H);
				return;
			}
			// Out of bounds on y?
			else if(y >= core.SETTINGS.VRAM_TILES_V){
				// console.log("Out of bounds: y", "y:", y, "core.SETTINGS.VRAM_TILES_V:", core.SETTINGS.VRAM_TILES_V);
				return;
			}
			// Draw the tile.
			else{
				core.GRAPHICS.FUNCS.SetTile(x, y, fontmap[ tileid+2 ], tileset, layer, flags );
			}
		}

		// If it is out of bounds, (such as the "|" character) print a space.
		else {
			tileid = " ".toUpperCase().charCodeAt() - 32;
			core.GRAPHICS.FUNCS.SetTile(x, y, fontmap[ tileid+2 ], tileset, layer, flags );
		}

		// Move the "cursor" over one to the right.
		x+=1;

		// No wrapping allowed.
		if(x>=core.SETTINGS.VRAM_TILES_H-0){ return; }
		if(y>=core.SETTINGS.VRAM_TILES_V-0){ return; }
	});
};
// Prints a line of text at the specified location (accepts an object with text and font settings for each char.)
core.GRAPHICS.FUNCS.Print_multiFont   = function(data){
	// Example usage:
	// core.GRAPHICS.FUNCS.Print_multiFont(
	// 	{
	// 		"x"       : 0,
	// 		"y"       : 15,
	// 		"text"    : "I use multiple fonts!" ,
	// 		"font"    : "010101010101010101010".split("").map(function(d){ return parseInt(d,10); }) ,
	// 		"maps"    : [ "font_black", "font_white" ],
	// 		"tileset" : "tilesTX1",
	// 		"layer"   : "TEXT",
	// 		"flags"   : {}
	// 	},
	// );

	// Check that the specified layer is valid.
	// Check that the and the maps provided are valid.
	// Check that each map is valid.
	let layerExists   = core.SETTINGS['layers'][data.layer]         ? true : false ;
	let tilesetExists = core.GRAPHICS.ASSETS.tileObjs[data.tileset] ? true : false ;
	if( !layerExists   ){ let str = ["=E= Print_multiFont: Layer not found: "   + layer  ]; throw Error(str); }
	if( !tilesetExists ){ let str = ["=E= Print_multiFont: Tileset not found: " + tileset]; throw Error(str); }
	data.maps.forEach(function(d){
		let map = d;
		if(!core.GRAPHICS.ASSETS.tilemaps[data.tileset][map]){
			let str = ["=E= Print_multiFont: Map not valid: ", data.tileset, map ];
			throw Error(str);
		}
	});

	// Make sure that only a whole number makes it through.
	x = (data.x) << 0;
	y = (data.y) << 0;
	let startx = x;

	// Turn the string into an iterable array.
	Array.from( data.text ).forEach(function(d,i){
		// Move down a line if a line break is found.
		if(d=="\n"){ x=startx; y+=1; return; }

		// Determine which fontmap will be used.
		// console.log( data.maps[data.font[i]]);

		let fontmap = core.GRAPHICS.ASSETS.tilemaps[ data.tileset][data.maps[data.font[i]] ];
		// NOTE: Fontsets should all be the same length.
		let fontmap_len = fontmap.length -2 ; // -2 is for skipping the first two indexes.)

		// Get the tileid for this character.
		tileid = d.toUpperCase().charCodeAt() - 32;

		// Make sure this is a valid tile in the font map (bounds-check.)
		if(tileid < fontmap_len){
			core.GRAPHICS.FUNCS.SetTile(x, y, fontmap[ tileid+2 ], data.tileset, data.layer, data.flags );
		}

		// If it is out of bounds, (such as the "|" character) print a space.
		else {
			tileid = " ".toUpperCase().charCodeAt() - 32;
			core.GRAPHICS.FUNCS.SetTile(x, y, fontmap[ tileid+2 ], data.tileset, data.layer, data.flags );
		}

		// Move the "cursor" over one to the right.
		x+=1;

		// No wrapping allowed.
		if(x>=core.SETTINGS.VRAM_TILES_H-0){ return; }
		if(y>=core.SETTINGS.VRAM_TILES_V-0){ return; }
	});
};

// *** SPRITE functions. ***

/*
	Sprites are non-grid-aligned tiles that support transparency.
	Sprites do NOT use the VRAM array but they do use tile objects.
	When sprites overlap the higher sprite id (not tile id) is on top.
	OPTION #1: Sprites are cleared and redrawn on any update.

	core.GRAPHICS.DATA.SPRITES holds the tile objects for each sprite.
*/

// Clears the core.GRAPHICS.DATA.SPRITES array.
core.GRAPHICS.FUNCS.clearSprites = function(layer){
	let layersToClear=[];

	// If a layer was not specifed then clear all sprite layers.
	if(layer==undefined){
		for(let c=0; c<core.GRAPHICS.DATA.DRAWORDER.length; c+=1){
			let l = core.GRAPHICS.DATA.DRAWORDER[c];
			if(core.SETTINGS.layers[l].sprite){
				layersToClear.push(core.GRAPHICS.DATA.DRAWORDER[c]);
			}
		}
	}

	// If a specific layer was specified then only clear that layer.
	else{ layersToClear.push(layer); }

	// Clear the sprite objects and the sprite canvas(es).
	for(let c=0; c<layersToClear.length; c+=1){
		let thisLayer = layersToClear[c];

		// Determine which tile to clear with.
		let clearWith = core.GRAPHICS.DATA.FLAGS[thisLayer].clearWith;
		let clearTileset="default_tileset";
		let clearIndex;
		if     (clearWith=="black")      { clearIndex=0; }
		else if(clearWith=="transparent"){ clearIndex=1; }
		else{
			let str = ["=E= clearSprites: clearWith is invalid.", thisLayer, clearWith,clearTileset,clearIndex];
			console.error(str);
			throw Error(str);
		}

		// Replace all sprites with the default tile object.
		let len = core.GRAPHICS.DATA.SPRITES[thisLayer].length;
		for(let i=0; i<len; i+=1){
			core.GRAPHICS.DATA.SPRITES[thisLayer][i] = core.GRAPHICS.FUNCS.returnNewTile_obj();
			// core.GRAPHICS.DATA.SPRITES[thisLayer][i].drawThis     = true;
			core.GRAPHICS.DATA.SPRITES[thisLayer][i].clearThis    = true;
			// core.GRAPHICS.DATA.SPRITES[thisLayer][i].tileset      = clearTileset;
			// core.GRAPHICS.DATA.SPRITES[thisLayer][i].tileindex    = clearIndex;
			core.GRAPHICS.DATA.SPRITES[thisLayer][i].flags.SPRITE = true;
			core.GRAPHICS.DATA.SPRITES[thisLayer][i].flags.OFF    = false;
			// core.GRAPHICS.DATA.SPRITES[thisLayer][i].flags.CLEAR  = true;
		}

		// Clear the canvas.
		let canvas = core.GRAPHICS.canvas[thisLayer];
		let ctx = core.GRAPHICS.ctx[thisLayer];
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		// Update the draw flag for the specified layer.
		core.GRAPHICS.DATA.FLAGS[thisLayer].UPDATE=true;
	}

};
// Adds the tiles of a sprite map to the sprites array.
core.GRAPHICS.FUNCS.MapSprite2   = function(startSprite, map, tileset, layer, flags){
	// A map can be specified as a string or an actual map array.

	// Make sure the layer exists the tileset exists, and the map exists.
	let layerExists   = core.SETTINGS['layers'][layer]              ? true : false;
	let tilesetExists = core.GRAPHICS.ASSETS.tileObjs[tileset]      ? true : false;
	if( !layerExists   ){ let str = ["=E= MapSprite2: Layer not found: "   + layer  ]; throw Error(str); }
	if( !tilesetExists ){ let str = ["=E= MapSprite2: Tileset not found: " + tileset]; throw Error(str); }
	if     (typeof map == "string"){
		if(!core.GRAPHICS.ASSETS.tilemaps[tileset][map]){
			let str = ["=E= MapSprite2: Map not valid: ", tileset, map ];
			throw Error(str);
		}
		else { map = core.GRAPHICS.ASSETS.tilemaps[tileset][map]; }
	}
	else if( map.constructor === Array || ArrayBuffer.isView(map) ){ map = map; }
	else{
		let str = ["=E= MapSprite2: Map not valid: ", tileset, map ];
		throw Error(str);
	}

	// Make sure that flags were set. Assign default values if not set.
	if(flags.ROT    == undefined ){ flags.ROT    = 0    ; }
	if(flags.FLIP_X == undefined ){ flags.FLIP_X = false; }
	if(flags.FLIP_Y == undefined ){ flags.FLIP_Y = false; }
	if(flags.OFF    == undefined ){ flags.OFF    = true ; }
	if(flags.SPRITE == undefined ){ flags.SPRITE = true ; }

	let mapWidth  = map[0] ;
	let mapHeight = map[1] ;
	let x  ;
	let y  ;
	let dx ;
	let dy ;
	let t  ;
	let numSprites = mapWidth * mapHeight;

	// FLIP_X and FLIP_Y. This function does not flip the tiles. It only draws them in the correct order for the flip.

	// Flip on X?
	if( flags && flags.FLIP_X ){
		x  = (mapWidth-1);
		dx = -1;
	}
	else{
		x  = 0;
		dx = 1;
	}

	// Flip on Y?
	if( flags && flags.FLIP_Y ){
		y  = (mapHeight-1);
		dy = -1;
	}
	else{
		y  = 0;
		dy = 1;
	}

	// Create sprite objects for the specified sprite tilemap.
	for(let i=0; i<numSprites; i+=1){
		core.GRAPHICS.DATA.SPRITES[layer][startSprite+i] = core.GRAPHICS.FUNCS.returnNewTile_obj();
		core.GRAPHICS.DATA.SPRITES[layer][startSprite+i].flags.SPRITE=true;
		core.GRAPHICS.DATA.SPRITES[layer][startSprite+i].tileset=tileset;
	}

	// Place the sprite tile ids in order.
	for(let cy=0;cy<mapHeight;cy++){
		for(let cx=0;cx<mapWidth;cx++){
			// Is the sprite index still in bounds?
			//

			t=map[(y*mapWidth)+x+2];

			core.GRAPHICS.DATA.SPRITES[layer][startSprite].tileindex = t;
			core.GRAPHICS.DATA.SPRITES[layer][startSprite].flags = flags;

			x += dx;

			// Increment the start sprite number.
			startSprite++;
		}
		y += dy;
		x = ( flags && flags.FLIP_X ) ? (mapWidth-1) : 0 ;
	}
};
// Updates the sprites of an already allocated sprite map in the sprites array.
core.GRAPHICS.FUNCS.MoveSprite   = function(startSprite, x, y, width, height, layer){
	let layerExists   = core.SETTINGS['layers'][layer]              ? true : false;
	if( !layerExists   ){ let str = ["=E= MoveSprite: Layer not found: "   + layer  ]; throw Error(str); }

	let dy;
	let dx;

	//
	for (dy = 0; dy < height; dy++){
		for (dx = 0; dx < width; dx++){
			// Is the sprite index still in bounds?
			//

			core.GRAPHICS.DATA.SPRITES[layer][startSprite].x = (x + (core.SETTINGS.TILE_WIDTH  * dx)) << 0;
			core.GRAPHICS.DATA.SPRITES[layer][startSprite].y = (y + (core.SETTINGS.TILE_HEIGHT * dy)) << 0;

			core.GRAPHICS.DATA.SPRITES[layer][startSprite].flags.OFF=false;
			core.GRAPHICS.DATA.SPRITES[layer][startSprite].clearThis=true;
			core.GRAPHICS.DATA.SPRITES[layer][startSprite].drawThis=true;

			// Increment the start sprite number.
			startSprite++;
		}
	}

	// Update the UPDATE and REDRAW flags for the specified layer.
	core.GRAPHICS.DATA.FLAGS[layer].UPDATE=true;
	core.GRAPHICS.DATA.FLAGS[layer].REDRAW=true;
};
// Flips a canvas on X and/or Y.
core.GRAPHICS.FUNCS.flipImage_canvas = function (tileObj, tileset, tileindex, flags) {

	let srcCanvas = tileObj.canvas;

	// Create temporary canvas to match the srcCanvas.
	let destCanvas      = document.createElement("canvas");
	let destCanvas_ctx  = destCanvas.getContext('2d');
	destCanvas.width    = srcCanvas.width  ;
	destCanvas.height   = srcCanvas.height ;

	// Determine the settings for the flip.
	let scaleH = flags.FLIP_X ? -1                     : 1; // Set horizontal scale to -1 if flip horizontal
	let scaleV = flags.FLIP_Y ? -1                     : 1; // Set verical scale to -1 if flip vertical
	let posX   = flags.FLIP_X ? destCanvas.width  * -1 : 0; // Set x position to -100% if flip horizontal
	let posY   = flags.FLIP_Y ? destCanvas.height * -1 : 0; // Set y position to -100% if flip vertical

	// Do the flip.
	destCanvas_ctx.save();                                                                // Save the current state
	destCanvas_ctx.scale(scaleH, scaleV);                                                 // Set scale to flip the image
	destCanvas_ctx.drawImage(srcCanvas, posX, posY); // Draw the image
	destCanvas_ctx.restore();                                                             // Restore the last saved state

	// Do the rotation.
	if(flags.ROT){
		let destCanvas2      = document.createElement("canvas");
		let destCanvas2_ctx  = destCanvas2.getContext('2d');
		destCanvas2.width    = destCanvas.width  ;
		destCanvas2.height   = destCanvas.height ;

		destCanvas2_ctx.save();    // Save the current state
		destCanvas2_ctx.translate(destCanvas2.width/2, destCanvas2.height/2);
		destCanvas2_ctx.rotate(flags.ROT * Math.PI/180);
		destCanvas2_ctx.translate(-destCanvas2.width/2, -destCanvas2.height/2);
		destCanvas2_ctx.drawImage(destCanvas,0,0);
		destCanvas2_ctx.restore(); // Restore the last saved state
		destCanvas=destCanvas2;
	}

	// Return the temp canvas
	return {
		"canvas":destCanvas ,
		"imgData":destCanvas_ctx.getImageData(0,0,destCanvas.width, destCanvas.height),
		"numUsed":0,
	};
};
// Add to the cache of flipped canvas files (X, Y, XY)
core.GRAPHICS.FUNCS.AddFlippedTileToCache  = function(tile, tilesetname, tileindex, flags){
	// console.log("AddFlippedTileToCache:",
	// 	"\n tile       :", tile,
	// 	"\n tilesetname:", tilesetname,
	// 	"\n tileindex  :", tileindex,
	// 	"\n flags      :", flags
	// );

	// Generate the cache key.
	let key = "";
	if     (flags.FLIP_X && flags.FLIP_Y ){ key="XY"; }
	else if(flags.FLIP_X                 ){ key="X_";  }
	else if(flags.FLIP_Y                 ){ key="_Y";  }
	key=(flags.ROT).toString().padStart(3, "0") + "_" + key; // EX: 000_X_

	// Does the tilesetname key NOT exist in core.GRAPHICS.tiles_flipped?
	if(core.GRAPHICS.ASSETS.CUSTOM_tileObjs[tilesetname]==undefined){
		core.GRAPHICS.ASSETS.CUSTOM_tileObjs[tilesetname] = {};
	}

	// Does the tile key NOT exist ?
	if(core.GRAPHICS.ASSETS.CUSTOM_tileObjs[tilesetname][tileindex]==undefined){
		core.GRAPHICS.ASSETS.CUSTOM_tileObjs[tilesetname][tileindex] = {};
	}

	// Does the flip key NOT exist ?
	if(core.GRAPHICS.ASSETS.CUSTOM_tileObjs[tilesetname][tileindex][key]==undefined){
		core.GRAPHICS.ASSETS.CUSTOM_tileObjs[tilesetname][tileindex][key] =  tile;
		// console.log("Tile has been added to the cache.", core.GRAPHICS.ASSETS.tileObjs[tilesetname][tileindex][key]);
	}
	// else{ console.log("----------- Tile already is in cache."); }
};
// Retrieve a cached flipped canvas tile (X, Y, XY)
core.GRAPHICS.FUNCS.findFlippedTileInCache = function(tilesetname, tileindex, flags){
	// Generate the cache key.
	let key = "";
	if     (flags.FLIP_X && flags.FLIP_Y ){ key="XY"; }
	else if(flags.FLIP_X                 ){ key="X_";  }
	else if(flags.FLIP_Y                 ){ key="_Y";  }
	key=(flags.ROT).toString().padStart(3, "0") + "_" + key; // EX: 000_X_

	// Try to find the cached copy of the requested tile.
	try{
		// Try to get to the cached tile. (Exception thrown on miss.)
		// Get the tile.
		let tile = core.GRAPHICS.ASSETS.CUSTOM_tileObjs[tilesetname][tileindex][key];
		if(!tile){ console.log("cache miss", e); throw "cache miss"; }

		// Return the cached tile.
		return {
			"tile":tile,
			"key":key,
		};
	}
	// Exception thrown. Tile was not found. Return false.
	catch(e){
		return {
			"tile":false,
			"key":key,
			"e":e,
		};
	}

};

// // Draw a sprite tilemap as a canvas.
// core.GRAPHICS.FUNCS.mapSprite_canvas   = function(spriteNum, map, tileset, layer, flags){
// };
// // Move a sprite canvas.
// core.GRAPHICS.FUNCS.moveSprite_canvas  = function(spriteNum, map, tileset, layer, flags){
// };
// Draws a canvas sprite.
core.GRAPHICS.FUNCS.moveSprite_canvas  = function(spriteNum, map, tileset, layer, flags){
	core.GRAPHICS.DATA.SPRITES[layer][spriteNum] = core.GRAPHICS.FUNCS.returnNewTile_obj();
	core.GRAPHICS.DATA.SPRITES[layer][spriteNum].flags.SPRITE=true;
	core.GRAPHICS.DATA.SPRITES[layer][spriteNum].flags.CANVAS=true;
	core.GRAPHICS.DATA.SPRITES[layer][spriteNum].tileset=tileset;
};

// core.GRAPHICS.ctx.OUTPUT.drawImage(
// 	core.GRAPHICS.ASSETS.tilemaps_canvas.tilesSP1.mm_f2.canvas,
// 	0,0
// );

// *** FADE functions. ***

// TODO: Make sure the VRAM functions do not accept the sprite layers as input.
