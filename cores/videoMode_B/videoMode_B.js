// core.GRAPHICS = {};
core.GRAPHICS.DATA        = {} ;
core.GRAPHICS.DATA.FLAGS  = {} ;
core.GRAPHICS.DATA.VRAM   = {} ;
core.GRAPHICS.FUNCS       = {} ;
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

				// Create canvas.
				let newCanvas = document.createElement('canvas'); //

				// Set dimensions of canvas.
				newCanvas.width  = ( core.SETTINGS['VRAM_TILES_H'] * core.SETTINGS['TILE_WIDTH']  ) ;
				newCanvas.height = ( core.SETTINGS['VRAM_TILES_V'] * core.SETTINGS['TILE_HEIGHT'] ) ;

				// Set the pixelated settings.
				JSGAME.SHARED.setpixelated(newCanvas);

				// Set the pre-clear and layer update flags.
				core.GRAPHICS.DATA.FLAGS[layer] = {};
				core.GRAPHICS.DATA.FLAGS[layer].clearBeforeDraw = clearBeforeDraw ;
				core.GRAPHICS.DATA.FLAGS[layer].UPDATE          = false ; // Indicates that an update is needed.
				core.GRAPHICS.DATA.FLAGS[layer].REDRAW          = false ; // Draw all of VRAM even if already drawn.

				// Save the canvas.
				core.GRAPHICS.canvas[layer] = newCanvas;

				// Save the ctx (respect the alpha setting.)
				core.GRAPHICS.ctx[layer] = newCanvas.getContext('2d', { alpha: alpha }) ;

				// Add to core.GRAPHICS.performance
				core.GRAPHICS.performance.LAYERS[layer] = [ 0, 0, 0, 0, 0 ] ; //
			}

			// Create the OUTPUT canvas.
			core.GRAPHICS.canvas.OUTPUT        = document.createElement('canvas'); //
			core.GRAPHICS.ctx.OUTPUT           = core.GRAPHICS.canvas.OUTPUT.getContext("2d", { alpha : false } ); //
			core.GRAPHICS.canvas.OUTPUT.width  = ( core.SETTINGS['VRAM_TILES_H'] * core.SETTINGS['TILE_WIDTH']  ) ;
			core.GRAPHICS.canvas.OUTPUT.height = ( core.SETTINGS['VRAM_TILES_V'] * core.SETTINGS['TILE_HEIGHT'] ) ;
			core.GRAPHICS.canvas.OUTPUT.id     = "canvas_OUTPUT";
			JSGAME.SHARED.setpixelated(core.GRAPHICS.canvas.OUTPUT);

			// Attach the canvas_OUTPUT to gameCanvas_DIV.
			core.DOM['gameCanvas_DIV'].appendChild(core.GRAPHICS.canvas.OUTPUT);

			// Done! Resolve.
			JSGAME.SHARED.PERFORMANCE.stamp("VIDEO_INIT_canvas_setup" , "END");
			res1();

		}); };

		// VRAM setup.
		let vram_setup = function(){ return new Promise(function(res1, rej1){
			JSGAME.SHARED.PERFORMANCE.stamp("VIDEO_INIT_vram_setup" , "START");

			// Get the number of tiles for VRAM.
			let screen_wh   = (core.SETTINGS['VRAM_TILES_H'] * core.SETTINGS['VRAM_TILES_V']);

			// Create the VRAMs for each layer.
			for(let layer in core.SETTINGS['layers']){
				core.GRAPHICS.DATA.VRAM[layer] = [];
				for(let i=0; i<screen_wh; i+=1){
					core.GRAPHICS.DATA.VRAM[layer][i]=core.GRAPHICS.FUNCS.returnNewTile_obj();
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
					let tile_height = core.SETTINGS['TILE_WIDTH'];
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

				// Convert core.ASSETS.graphics.tiles to an array of canvases.
				JSGAME.SHARED.PERFORMANCE.stamp("VIDEO_INIT_post_graphicsConversion" , "START");
				post_graphicsConversion();
				JSGAME.SHARED.PERFORMANCE.stamp("VIDEO_INIT_post_graphicsConversion" , "END");

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
		"tileindex" : 0         , // Tile index. Index into core.GRAPHICS.tiles .
		"tileset"   : ""        , // Name of tileset.
		"flags"     : {
			"ROT"     : 0     , // Rotation. (degrees, -360 through +360. Default: 0.)
			"FLIP_X"  : false , // true: Tile canvas flipped horizontally., false: Tile is not flipped horizontally
			"FLIP_Y"  : false , // true: Tile canvas flipped vertically., false: Tile is not flipped vertically
			"OFF"     : true  , // true: tile is ignored. false, tile is drawn.
			"SPRITE"  : false , // true: x and y are used as is., false, x=x*TILE_WIDTH y=y*TILE_HEIGHT.
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
	if(!layer){ for(let c=0; c<core.GRAPHICS.DATA.DRAWORDER.length; c+=1){ layersToClear.push(core.GRAPHICS.DATA.DRAWORDER[c]); } }
	// If a specific layer was specified then only clear that layer.
	else{ layersToClear.push(layer); }

	// Get the number of tiles for VRAM.
	let screen_wh   = (core.SETTINGS['VRAM_TILES_H'] * core.SETTINGS['VRAM_TILES_V']);

	// Clear the specified VRAM(s).
	for(let l=0; l<layersToClear.length; l+=1){
		layer=layersToClear[l];
		for(let i=0; i<screen_wh; i+=1){
			core.GRAPHICS.DATA.VRAM[layer][i]=core.GRAPHICS.FUNCS.returnNewTile_obj();

			// Set clear and OFF for this tile.
			// core.GRAPHICS.DATA.VRAM[layer][i].drawThis=true;
			core.GRAPHICS.DATA.VRAM[layer][i].clearThis=true;
			core.GRAPHICS.DATA.VRAM[layer][i].flags.OFF=true;
		}
	}
};
// Clears all canvases and sets the OUTPUT canvas to all black;
core.GRAPHICS.FUNCS.clearAllCanvases    = function(){
	// Clear the canvas layers and related VRAM.
	for(let c=0; c<core.GRAPHICS.DATA.DRAWORDER.length; c+=1){
		// Clear the canvas.
		let layerName = core.GRAPHICS.DATA.DRAWORDER[c];
		let canvas = core.GRAPHICS.canvas[layerName];
		let ctx = core.GRAPHICS.ctx[layerName];
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		// Clear the related VRAM.
		for(let layer in core.SETTINGS['layers']){
			core.GRAPHICS.FUNCS.ClearVram(layer);
		}
	}

	// Clear the OUTPUT canvas.
	let canvas = core.GRAPHICS.canvas["OUTPUT"];
	let ctx    = core.GRAPHICS.ctx["OUTPUT"];
	ctx.fillStyle = "rgba(0, 0, 0, 1.0)";       // Black
	// ctx.fillStyle = "rgba(255, 255, 255, 1.0)"; // White
	ctx.fillRect(0, 0, canvas.width, canvas.height);
};
// Can draw any map from any tileset to any layer.
core.GRAPHICS.FUNCS.update_layers_type1 = function(){
	return new Promise(function(res,rej){
		// PER LAYER:
			// Force "clearThis" on a tile if tindicated or specified by gamesettings.json.
			// Draw only the tiles that have the "drawThis" flag set.
			// Clear only the tiles that have the "clearThis" flag set.

		if(!core.GRAPHICS.performance.LAYERS["update_layers_type1"]){
			core.GRAPHICS.performance.LAYERS["update_layers_type1"]=[ 0, 0, 0, 0, 0 ];
		}

		let drawStart_update_layers_type1;
		if(JSGAME.FLAGS.debug) { drawStart_update_layers_type1 = performance.now(); core.GRAPHICS.performance.LAYERS["update_layers_type1"].shift(); }

		// Determine the output canvas.
		for(let c=0; c<core.GRAPHICS.DATA.DRAWORDER.length; c+=1){
			let layerName = core.GRAPHICS.DATA.DRAWORDER[c]    ;
			let canvas    = core.GRAPHICS.canvas[layerName]    ;
			let ctx       = core.GRAPHICS.ctx[layerName]       ;
			let VRAM      = core.GRAPHICS.DATA.VRAM[layerName] ;

			let drawStart = performance.now();

			// The layer needs an update.
			let updateNeeded = core.GRAPHICS.DATA.FLAGS[layerName].UPDATE;
			// The layer must be redrawn.
			let forceRedraw  = core.GRAPHICS.DATA.FLAGS[layerName].REDRAW;

			// Clear the tile if indicated.
			for(let t=0; t<VRAM.length; t+=1){
				// Is this tile set to be cleared?
				if( VRAM[t].clearThis ){
					// Get the x and y positions.
					let x         = VRAM[t].x    ;
					let y         = VRAM[t].y    ;

					// Clear the tile destination first.
					ctx.clearRect( (x) << 0, (y) << 0, core.SETTINGS.TILE_WIDTH, core.SETTINGS.TILE_HEIGHT );

					// Clear the clearThis flag.
					VRAM[t].clearThis=false;
				}
			}

			// Draw the tile if indicated.
			if(updateNeeded || forceRedraw){
				// Go through the VRAM.
				for(let t=0; t<VRAM.length; t+=1){
					// Draw this tile?
					if(VRAM[t].drawThis || forceRedraw){
						// Get some data on the tile.
						let tileset   = VRAM[t].tileset      ;
						let tileindex = VRAM[t].tileindex    ;
						let ROT       = VRAM[t].flags.ROT    ;
						let FLIP_X    = VRAM[t].flags.FLIP_X ;
						let FLIP_Y    = VRAM[t].flags.FLIP_Y ;
						let OFF       = VRAM[t].flags.OFF    ;

						// Get the x and y positions.
						let x         = VRAM[t].x    ;
						let y         = VRAM[t].y    ;

						// Skip the drawing if at least one of these conditions is true.
						if(!tileset || tileset==""){ continue; }
						if(OFF)                    { console.log("tile set to off"); continue; }

						// Get the tile object and graphics data.
						let tile;
						let tile_canvas;
						let tile_imgData;

						// Use the normal unmodified tile?
						if(!ROT && !FLIP_X && !FLIP_Y){
							tile         = core.GRAPHICS.ASSETS.tileObjs[tileset][VRAM[t].tileindex]  ;
							try{
								tile_canvas  = core.GRAPHICS.ASSETS.tileObjs[tileset][VRAM[t].tileindex].canvas  ;
								tile_imgData = core.GRAPHICS.ASSETS.tileObjs[tileset][VRAM[t].tileindex].imgData ;
							}
							catch(e){
								let str = ["=E= update_layers_type1: canvas or imgData not found.", e];
								rej(str);
								throw Error(str);
								return;
							}
						}
						// Tile has modifications. Use cached modification or generate new.
						else{
							// Skip these tiles. (TODO)
							continue;

							// Flip X and/or Flip Y?
							if(FLIP_X | FLIP_Y){

							}

							// Rotate?
							if(ROT){

							}

						}

						// Try to draw the tile.
						try{
							// Draw the tile.
							ctx.drawImage( tile_canvas, (x) << 0, (y) << 0 );

							// Update some flags.
							VRAM[t].drawThis=false;
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

				// Clear the UPDATE and REDRAW flags for this layer.
				core.GRAPHICS.DATA.FLAGS[layerName].UPDATE=false;
				core.GRAPHICS.DATA.FLAGS[layerName].REDRAW=false;
			}

			if(JSGAME.FLAGS.debug) { core.GRAPHICS.performance.LAYERS[layerName].shift(); core.GRAPHICS.performance.LAYERS[layerName].push(performance.now() - drawStart);                   }
		}

		// Done! Resolve.
		if(JSGAME.FLAGS.debug) { core.GRAPHICS.performance.LAYERS["update_layers_type1"].push(performance.now() - drawStart_update_layers_type1);                   }
		res();
	});
};
// Combines the layer and draws to the OUTPUT canvas.
core.GRAPHICS.FUNCS.update_layer_OUTPUT = function(){
	return new Promise(function(res,rej){
		// Create the temp output.
		let tempOutput     = document.createElement("canvas");
		JSGAME.SHARED.setpixelated(tempOutput);
		let tempOutput_ctx = tempOutput.getContext('2d', { alpha: true });
		tempOutput.width   = core.GRAPHICS["canvas"].OUTPUT.width;
		tempOutput.height  = core.GRAPHICS["canvas"].OUTPUT.height;

		// Draw each layer to the OUTPUT in the order specified by the gamesettings.json file.
		for(let i=0; i<core.GRAPHICS.DATA.DRAWORDER.length; i+=1){
			let layerName = core.GRAPHICS.DATA.DRAWORDER[i];
			let canvas = core.GRAPHICS.canvas[layerName];
			tempOutput_ctx.drawImage( canvas, 0, 0) ;
		}

		// Draw to the OUTPUT canvas.
		core.GRAPHICS.ctx.OUTPUT.drawImage(tempOutput,0,0);

		// Done! Resolve.
		res();
	});
};
// Invokes the layer updates.
core.GRAPHICS.FUNCS.update_allLayers    = function(){
	// While this flag is set, main will not run the logic loop or another graphics loop.
	core.GRAPHICS.DATA.INLAYERUPDATE=true;

	// If an update is not needed then the promise will resolve right away.
	let proms = [
		core.GRAPHICS.FUNCS.update_layers_type1() ,
	];

	Promise.all(proms).then(
		// Success? Write the OUTPUT layer.
		function(){
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
					// console.error(str);
					throw Error(str);
				}
			);
		},
		// Failure of at least one promise in the array?
		function(err){
			// Throw error.
			let str = ["=E= update_allLayers: failed promise in layer draws: ", err];
			// console.error(err, str);
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

	// If flags were specified, then use them to override the default settings.
	if(flags.ROT   ) { currentTile.flags.ROT    = flags.ROT    ; }
	if(flags.FLIP_X) { currentTile.flags.FLIP_X = flags.FLIP_X ; }
	if(flags.FLIP_Y) { currentTile.flags.FLIP_Y = flags.FLIP_Y ; }
	if(flags.OFF   ) { currentTile.flags.OFF    = flags.OFF    ; }
	if(flags.SPRITE) { currentTile.flags.SPRITE = flags.SPRITE ; }

	// Change the tile data.
	if(currentTile.flags.OFF){ currentTile.clearThis=true; }
	else                     { currentTile.clearThis = core.SETTINGS['layers'][layer].clearBeforeDraw; }
	currentTile.drawThis     = true;
	currentTile.tileindex    = tileid;
	currentTile.tileset      = tileset;

	// Adjust coordinates if this is NOT a sprite.
	if(currentTile.flags.SPRITE){
		currentTile.x = x ;
		currentTile.y = y ;
	}
	else{
		currentTile.x = x * core.SETTINGS['TILE_WIDTH']  ;
		currentTile.y = y * core.SETTINGS['TILE_HEIGHT'] ;
	}

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
			let str = ["=E= DrawMap2: Map not valid: ", tileset, map, e ];
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
			let str = ["=E= DrawMap_customDimensions: Map not valid: ", tileset, map, e ];
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
// *** SPRITE functions. ***

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
		let str = ["=E= Print: Map not valid: ", tileset, map, e ];
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

// *** FADE functions. ***