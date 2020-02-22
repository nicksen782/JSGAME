// core.GRAPHICS = {};
core.GRAPHICS.DATA         = {} ;
core.GRAPHICS.DATA.FLAGS   = {} ;
core.GRAPHICS.DATA.VRAM    = {} ;
core.GRAPHICS.DATA.SPRITES = {} ;
core.GRAPHICS.FUNCS        = {} ;
// Holds tile and tilemap assets.
core.GRAPHICS.ASSETS      = {
	"tilesets"       : {}, // All tiles, separated by their tileset name.
	"tilemaps"       : {}, // All tilemaps, separated by their tileset name.
	"_original_data" : {}  // Original Uzebox format tilesets/tilemaps.
} ;

// *** WEB WORKERS ***
// window.navigator.hardwareConcurrency;
// (typeof(Worker) !== "undefined");
core.GRAPHICS.WORKERS = {
	// newVRAM_entry.canvas  = new_canvas ;
	// newVRAM_entry.imgData = undefined ;
	// newVRAM_entry.w         = new_canvas.width  ;
	// newVRAM_entry.h         = new_canvas.height ;
	w_colorswaps :{
		"worker": [] ,
		// "callback":function(){
		// 	worker.onmessage=null;
		// 	switch( event.data.function ){
		// 		// imgData manipulation for color swaps.
		// 		case "colorswaps" : {
		// 			// Convert the imgData back into an imgData object.
		// 			// var array = new Uint8ClampedArray(event.data.imgData);
		// 			// var imgData = new ImageData(array, event.data.imgData_w, event.data.imgData_h);

		// 			// Clear the queue.
		// 			core.GRAPHICS.WORKERS.w_colorswaps.queue=[];

		// 			let imgDatas=event.data.finished_img_buffers_arr;
		// 			let newVRAMs=event.data.finished_newVRAM_entries;

		// 			for(let i=0; i<newVRAMs.length; i+=1){
		// 				let img_buff = imgDatas[i] ;
		// 				let img_view = new Uint8ClampedArray(img_buff) ;
		// 				let newVRAM  = newVRAMs[i] ;
		// 				let flags    = newVRAMs[i].flags ;

		// 				// Create the src canvas from the imgData.
		// 				let src_canvas    = document.createElement("canvas");  ;
		// 				src_canvas.width  = newVRAM.w ;
		// 				src_canvas.height = newVRAM.h ;
		// 				JSGAME.SHARED.setpixelated(src_canvas);
		// 				let src_ctx     = src_canvas.getContext("2d") ;
		// 				src_ctx.putImageData(
		// 					new ImageData(img_view, src_canvas.width, src_canvas.height) ,
		// 					0,
		// 					0
		// 				);

		// 				// Create the destination canvas.
		// 				let dst_canvas    = document.createElement("canvas");  ;
		// 				dst_canvas.width  = newVRAM.w ;
		// 				dst_canvas.height = newVRAM.h ;
		// 				JSGAME.SHARED.setpixelated(dst_canvas);
		// 				let dst_ctx     = dst_canvas.getContext("2d") ;

		// 				let newX=0;
		// 				let newY=0;
		// 				if(flags.ROT !== false || flags.FLIP_X || flags.FLIP_Y){
		// 					if( flags.ROT ){
		// 						let size = Math.max(src_canvas.width, src_canvas.height);
		// 						dst_canvas.width   = size ;
		// 						dst_canvas.height  = size ;

		// 						dst_ctx.translate(src_canvas.width/2, src_canvas.height/2);
		// 						dst_ctx.rotate(flags.ROT * Math.PI/180);
		// 						dst_ctx.translate(-src_canvas.width/2, -src_canvas.height/2);
		// 					}

		// 					// FLIP_X and/or FLIP_Y?
		// 					if( flags.FLIP_X || flags.FLIP_Y ){
		// 						let scaleH = flags.FLIP_X ? -1                     : 1; // Set horizontal scale to -1 if flip horizontal
		// 						let scaleV = flags.FLIP_Y ? -1                     : 1; // Set verical scale to -1 if flip vertical
		// 						newX       = flags.FLIP_X ? src_canvas.width  * -1 : 0; // Set x position to -100% if flip horizontal
		// 						newY       = flags.FLIP_Y ? src_canvas.height * -1 : 0; // Set y position to -100% if flip vertical
		// 						dst_ctx.scale(scaleH, scaleV);             // Set scale to flip the image
		// 					}
		// 				}

		// 				// Draw the src_canvas to the dst_canvas.
		// 				dst_ctx.drawImage(src_canvas,newX,newY);

		// 				newVRAM.canvas         = dst_canvas ;
		// 				newVRAM.imgData        = undefined ;
		// 				newVRAM.flags.drawThis = true ;
		// 				core.GRAPHICS.DATA.FLAGS[newVRAM.layer].UPDATE=true;

		// 				core.GRAPHICS.FUNCS.placeTile({
		// 					"mapWidth"      : (newVRAM.canvas.width   / _CS.TILE_WIDTH ) << 0 ,
		// 					"mapHeight"     : (newVRAM.canvas.height  / _CS.TILE_HEIGHT) << 0 ,
		// 					"newVRAM_entry" : newVRAM ,
		// 				});
		// 			}

		// 			// Set w, h values.
		// 			// newVRAM_entry.w = imgObj.canvas.width ;
		// 			// newVRAM_entry.h = imgObj.canvas.height ;

		// 			// newVRAM_entry.canvas  = undefined ;
		// 			// newVRAM_entry.imgData = undefined ;

		// 			// Set drawThis.
		// 			// newVRAM_entry.flags.drawThis=true;

		// 			// Set the UPDATE flag for this layer.
		// 			// core.GRAPHICS.DATA.FLAGS[layer].UPDATE=true;

		// 			// Place the tile.
		// 			// core.GRAPHICS.FUNCS.placeTile({
		// 			// 	"mapWidth"      : (imgObj.canvas.width   / _CS.TILE_WIDTH ) << 0 ,
		// 			// 	"mapHeight"     : (imgObj.canvas.height  / _CS.TILE_HEIGHT) << 0 ,
		// 			// 	"newVRAM_entry" : newVRAM_entry ,
		// 			// });

		// 			// console.log("FROM WORKER: ", event.data);
		// 			res();

		// 			break;
		// 		}

		// 	// Unmatched function.
		// 	default     : { break; }
		// 	}
		// },
		"queue" : [
		],
	}
};
for(let i=0; i<window.navigator.hardwareConcurrency; i+=1){
	//
	let worker = new Worker('cores/videoMode_C/videoMode_C_webworker.js') ;
	// worker.onmessage = core.GRAPHICS.WORKERS.w_colorswaps.callback;
	core.GRAPHICS.WORKERS.w_colorswaps.worker.push( worker );
}

// PERFORMANCE MONITORING (layer draw timings.)
core.GRAPHICS.performance = {
	LAYERS : {
		// BG : [ 0, 0, 0, 0, 0 ] , //
		"update_layers_type2":[ 0, 0, 0, 0, 0 ],
	},
};
// Holds the canvas elements.
core.GRAPHICS.canvas      = {} ;
// Holds the canvas contexts.
core.GRAPHICS.ctx         = {} ;

// Shortened way to access core.GRAPHICS.
var _CGF = core.GRAPHICS.FUNCS;

// Shortened way to access core.ASSETS.
var _CGA = core.GRAPHICS.ASSETS;

// Shortened way to access core.SETTINGS.
var _CS = core.SETTINGS;

// *** Logo functions ***

// _DOC_ | logo | JS GAME logo for this video mode.
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
// _DOC_ | init | One-time-use init function for the graphics.
core.GRAPHICS.init = function(){
	return new Promise(function(res_VIDEO_INIT, rej_VIDEO_INIT){
		JSGAME.SHARED.PERFORMANCE.stamp("VIDEO_INIT_ALL"                   , "START");

		/**
		 * PART1: Reads the settings returned from gamesettings.json file into core.SETTINGS.
		*/
		let getSettings = function(){ return new Promise(function(res1, rej1){
			let _perf_name = "VIDEO_INIT_"+"getSettings";
			try{
				JSGAME.SHARED.PERFORMANCE.stamp(_perf_name , "START");

				// Core, Low-level settings.
				core.SETTINGS['TRANSLUCENT_COLOR'] = JSGAME.PRELOAD.gamesettings_json.graphics.core['TRANSLUCENT_COLOR'] ;
				core.SETTINGS['TILE_WIDTH']        = JSGAME.PRELOAD.gamesettings_json.graphics.core['TILE_WIDTH']     ;
				core.SETTINGS['TILE_HEIGHT']       = JSGAME.PRELOAD.gamesettings_json.graphics.core['TILE_HEIGHT']    ;
				core.SETTINGS['VRAM_TILES_H']      = JSGAME.PRELOAD.gamesettings_json.graphics.core['VRAM_TILES_H']   ;
				core.SETTINGS['VRAM_TILES_V']      = JSGAME.PRELOAD.gamesettings_json.graphics.core['VRAM_TILES_V']   ;
				core.SETTINGS['INTRO_LOGO']        = JSGAME.PRELOAD.gamesettings_json.graphics.core['INTRO_LOGO']     ;
				core.SETTINGS['FPS']               = JSGAME.PRELOAD.gamesettings_json.graphics.core['FPS']            ;
				core.SETTINGS['fps']               = JSGAME.PRELOAD.gamesettings_json.graphics.core['FPS']            ;
				core.SETTINGS['SCALE']             = JSGAME.PRELOAD.gamesettings_json.graphics.core['SCALE']          ;

				// Tileset/Tilemap data.
				core.SETTINGS['inputTilesetData'] = JSGAME.PRELOAD.gamesettings_json.graphics['inputTilesetData']   ;
				core.SETTINGS['tilesets']         = JSGAME.PRELOAD.gamesettings_json.graphics['tilesets']   ;

				// Layer data.
				core.SETTINGS['layers']         = JSGAME.PRELOAD.gamesettings_json.graphics['layers']   ;
				core.SETTINGS['layerDrawOrder'] = JSGAME.PRELOAD.gamesettings_json.graphics['layerDrawOrder']   ;

				// Fix some values.
				core.SETTINGS['TRANSLUCENT_COLOR'] = parseInt(core.SETTINGS['TRANSLUCENT_COLOR'], 16)   ;

				JSGAME.SHARED.PERFORMANCE.stamp(_perf_name , "END");

				// Done! Resolve.
				res1();
			}
			catch(e){ rej1({_perf_name, e}); }
		});};

		/**
		 * PART1: Does any required DOM setup.
		*/
		let dom_setup = function(){ return new Promise(function(res1, rej1){
			let _perf_name = "VIDEO_INIT_"+"dom_setup";
			try{
				JSGAME.SHARED.PERFORMANCE.stamp(_perf_name , "START");

				// Get a handle to gameCanvas_DIV.
				core.DOM['gameCanvas_DIV'] = document.getElementById("gameCanvas_DIV");

				JSGAME.SHARED.PERFORMANCE.stamp(_perf_name , "END");

				// Done! Resolve.
				res1();
			}
			catch(e){ rej1({_perf_name, e}); }
		});};

		/**
		 * PART1: Setup the canvas layers, flags for layers, output layer.
		*/
		let canvas_setup = function(){ return new Promise(function(res1, rej1){
			let _perf_name = "VIDEO_INIT_"+"canvas_setup";
			try{
				JSGAME.SHARED.PERFORMANCE.stamp(_perf_name , "START");

				// Create the layers, save some flag values too.
				for(let layer in core.SETTINGS['layers']){
					// Get flags.
					let clearWith       = core.SETTINGS['layers'][layer].clearWith       ; // Saved to core.GRAPHICS.FLAGS[layer]
					let clearCanvasBeforeUpdate = core.SETTINGS['layers'][layer].clearCanvasBeforeUpdate ; // Saved to core.GRAPHICS.FLAGS[layer]
					let alpha           = core.SETTINGS['layers'][layer].alpha           ; // Used once here.
					let type            = core.SETTINGS['layers'][layer].type            ;

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
					core.GRAPHICS.DATA.FLAGS[layer].clearCanvasBeforeUpdate = clearCanvasBeforeUpdate ;
					core.GRAPHICS.DATA.FLAGS[layer].UPDATE          = false ; // Indicates that an update is needed.
					core.GRAPHICS.DATA.FLAGS[layer].REDRAW          = false ; // Draw all of VRAM even if already drawn.
					core.GRAPHICS.DATA.FLAGS[layer].lastUpdate      = performance.now() ; //
					core.GRAPHICS.DATA.FLAGS[layer].type            = type ; //

					// Save the canvas.
					core.GRAPHICS.canvas[layer] = newCanvas;

					// Save the ctx (respect the alpha setting.)
					core.GRAPHICS.ctx[layer] = newCanvas.getContext('2d', { alpha: alpha }) ;

					// Add to core.GRAPHICS.performance
					core.GRAPHICS.performance.LAYERS[layer] = [ 0, 0, 0, 0, 0 ] ; //
				}

				// Create the OUTPUT canvas. (Primary output canvas.)
				core.GRAPHICS.canvas.OUTPUT        = document.createElement('canvas'); //
				core.GRAPHICS.ctx.OUTPUT           = core.GRAPHICS.canvas.OUTPUT.getContext("2d", { alpha : true } ); //
				core.GRAPHICS.canvas.OUTPUT.width  = ( core.SETTINGS['VRAM_TILES_H'] * core.SETTINGS['TILE_WIDTH']  ) ;
				core.GRAPHICS.canvas.OUTPUT.height = ( core.SETTINGS['VRAM_TILES_V'] * core.SETTINGS['TILE_HEIGHT'] ) ;
				core.GRAPHICS.canvas.OUTPUT.id     = "canvas_OUTPUT";
				JSGAME.SHARED.setpixelated(core.GRAPHICS.canvas.OUTPUT);

				// Create the pre_OUTPUT canvas. (Used to combine layers before writing to the primary output canvas.)
				core.GRAPHICS.canvas.pre_OUTPUT        = document.createElement('canvas'); //
				core.GRAPHICS.ctx.pre_OUTPUT           = core.GRAPHICS.canvas.pre_OUTPUT.getContext("2d", { alpha : true } ); //
				core.GRAPHICS.canvas.pre_OUTPUT.width  = ( core.SETTINGS['VRAM_TILES_H'] * core.SETTINGS['TILE_WIDTH']  ) ;
				core.GRAPHICS.canvas.pre_OUTPUT.height = ( core.SETTINGS['VRAM_TILES_V'] * core.SETTINGS['TILE_HEIGHT'] ) ;
				core.GRAPHICS.canvas.pre_OUTPUT.id     = "canvas_pre_OUTPUT";
				JSGAME.SHARED.setpixelated(core.GRAPHICS.canvas.pre_OUTPUT);

				// Attach the canvas_OUTPUT to gameCanvas_DIV.
				core.DOM['gameCanvas_DIV'].appendChild(core.GRAPHICS.canvas.OUTPUT);

				JSGAME.SHARED.PERFORMANCE.stamp(_perf_name , "END");

				// Done! Resolve.
				res1();
			}
			catch(e){ rej1({_perf_name, e}); }
		});};

		/**
		 * PART2: Download all graphics and convert graphics from Uzebox format to JS_GAME.
		 */

		let graphics1_setup = function(){ return new Promise(function(res1, rej1){
			let _perf_name = "VIDEO_INIT_"+"graphics1_setup";
			try{
				JSGAME.SHARED.PERFORMANCE.stamp(_perf_name , "START");

				/**
				 * PART2: (HELPER) Convert graphics from Uzebox format to JS_GAME.
				*/
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

				// Get gamedir data.
				let gamedir = parentPath + JSGAME.PRELOAD.gameselected_json['gamedir'];
				gamedir = gamedir.replace("../", "");

				// Download the files.
				let proms_gfx = [];
				core.SETTINGS['inputTilesetData'].forEach(function(d){
					let rel_url = JSGAME.PRELOAD.gameselected_json['gamedir'] + "/"+ d;
					proms_gfx.push(
						JSGAME.SHARED.getFile_fromUrl(rel_url, true, "text")
					);
				});

				// After the files have downloaded...
				Promise.all(proms_gfx).then(
					function( r ){
						// Temporarily hold the final tilemaps.
						let tmp_tilesets = {} ;
						let tmp_tilemaps = {} ;

						// Convert each graphics file and add to tmp_tilemaps.
						for(let i=0; i<r.length; i+=1){
							// Convert this graphics file.
							let converted = graphicsConvert( r[i] );

							// Add the data to the temp.
							for(let tileset in converted.tilesets){
								// Add the tileset to the tmp_tilesets.
								tmp_tilesets[tileset] = converted.tilesets[tileset] ;

								// Create entry for the tilemaps.
								if(! tmp_tilemaps[tileset] ) { tmp_tilemaps[tileset] = {}; }

								for(let tilemap in converted.tilemaps[tileset]){
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
						core.GRAPHICS.ASSETS._original_data={};
						core.GRAPHICS.ASSETS._original_data.tilemaps=tmp_tilemaps;
						core.GRAPHICS.ASSETS._original_data.tilesets=tmp_tilesets;

						JSGAME.SHARED.PERFORMANCE.stamp(_perf_name , "END");

						// Done! Resolve.
						res1();
					},
					function(err){
						rej1({"str":str,"err":err});
						throw Error([str,JSON.stringify(err)]);
					}
				);

			}
			catch(e){ rej1({_perf_name, e}); }
		});};

		/**
		 * PART3: Convert individual tiles and tilemaps to images.
		*/
		let graphics2_setup = function(){ return new Promise(function(res1, rej1){
			let _perf_name = "VIDEO_INIT_"+"graphics2_setup";
			try{
				// JSGAME.SHARED.PERFORMANCE.stamp(_perf_name , "START");

				// Get 32-bit rgba version of 1-byte rgb332.
				let rgb_decode332                   = function(RGB332, method, convertTransparent) {
					// Converts one RGB332 pixel to another data type.

					if(convertTransparent==undefined){ convertTransparent=false;}

					// Sent a pixel of rgb332. Return either an object with the separated rgba values or a 32 bit array buffer/view.

					// Variables.
					let nR     ;
					let nG     ;
					let nB     ;
					let buf    ;
					let view32 ;
					let alpha  ;

					// NOTE: endianness matters when doing bitwise math.
					//       This assumes Little Endian.
					nR = ( ((RGB332 << 0) & 7) * (255 / 7) ) << 0; // red
					nG = ( ((RGB332 >> 3) & 7) * (255 / 7) ) << 0; // green
					nB = ( ((RGB332 >> 5) & 7) * (255 / 7) ) << 0; // blue
					// var nB = ((((RGB332 >> 5) & 6) * (255 / 7))); // blue
					// var nB = ((((RGB332 >> 5) & 6) * (255 / 6))); // blue

					if(convertTransparent){
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
					else if     (method =="object"){
						// Return an object with the separated rgba values in separated keys.

						// Output all values as an object.
						return {
							"r" : nR    ,
							"g" : nG    ,
							"b" : nB    ,
							"a" : alpha ,
						};
					}

				};
				// Converts Uzebox tiles to Canvas. Respects transparency if indicated.
				let convertUzeboxTilesToCanvasTiles = function(inputTileset, convertTransparent){
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
					// let transparencies = [];

					// Create the tempCanvas.
					let tempCanvas     = document.createElement('canvas') ;
					let tempCanvas_ctx = tempCanvas.getContext('2d');
					tempCanvas.width   = tile_width ;
					tempCanvas.height  = tile_height ;

					for(i=0; i<len; i+=1){
						// let hasTransparency = false;
						curTileId = i;

						// BY VALUE: Returns the portion of the vram array buffer for the specified tileset and tile.
						// Get the tile source data. Should come as: Uint8ClampedArray(64) (Still Uzebox format.)
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
							convertedPixel     = rgb_decode332( pixel, "arraybuffer_32", convertTransparent ) ;
							buf32[pixel_index] = convertedPixel;

							// A transparent pixel will come back as 0.
							// if(trackTransparent && convertTransparent && convertedPixel==0){ hasTransparency = true; }
						}
						//
						// if(trackTransparent && convertTransparent && hasTransparency){ transparencies.push(curTileId); }

						// Write the arraybuffer to the imageData.
						vramdata_rgb32.data.set(buf8);

						// Write the imageData to a canvas element.
						let canvas = document.createElement('canvas');
						let ctx    = canvas.getContext("2d", { alpha: true }) ;
						canvas.width  = tile_width;
						canvas.height = tile_height;
						JSGAME.SHARED.setpixelated(canvas);
						ctx.putImageData( vramdata_rgb32, 0, 0 );

						// Store the canvas element.
						arr[curTileId]=canvas;

						// vramdata_rgb32=null;
					}

					// RETURN THE ARRAY OF CANVASES.
					return arr;
				};
				let post_graphicsConversion         = function(){
					let _perf_name = "VIDEO_INIT_"+"post_graphicsConversion";
					JSGAME.SHARED.PERFORMANCE.stamp(_perf_name , "START");

					// Get the number of tilesets.
					let len = core.SETTINGS.tilesets.length;

					//

					// Convert all tilesets from the Uzebox format.
					for(let i=0; i<len; i+=1){
						let tilesetName        = core.SETTINGS.tilesets[i].tileset ;
						let convertTransparent = core.SETTINGS.tilesets[i].convertTransparent ;
						let tilesetData        = core.GRAPHICS.ASSETS._original_data.tilesets[tilesetName] ;
						let numTiles           = tilesetData.length / (core.SETTINGS.TILE_WIDTH * core.SETTINGS.TILE_HEIGHT) ;

						core.GRAPHICS.ASSETS.tilesets[tilesetName] = {};

						let arrayOfCanvases  = [] ;

						// Add the data to the tile object.
						arrayOfCanvases = convertUzeboxTilesToCanvasTiles(
							tilesetData          , // tilesetData,
							convertTransparent     // convertTransparent,
						);

						// Add the canvases and imgData piece by piece.
						for(let n=0; n<numTiles; n+=1){
							// Create an empty object.
							core.GRAPHICS.ASSETS.tilesets[tilesetName][n]={};
							let handle = core.GRAPHICS.ASSETS.tilesets[tilesetName][n];

							// Canvas version of image.
							handle.canvas  = arrayOfCanvases[n] ;
							JSGAME.SHARED.setpixelated(handle.canvas);
							let ctx = handle.canvas.getContext("2d");

							// imgData version of the image.
							imgData = ctx.getImageData(0, 0, handle.canvas.width, handle.canvas.height),
							handle.imgData = imgData ;

							// Store the ctx for the canvas.
							handle.ctx = ctx ;

							// Tile usage count (DEBUG.)
							handle.numUsed = 0 ;
						}

					}

					JSGAME.SHARED.PERFORMANCE.stamp(_perf_name , "END");

				};
				let post_graphicsConversion2        = function(){
					// We have a converted tileset. Now we must create images for each tilemap.

					let _perf_name = "VIDEO_INIT_"+"post_graphicsConversion2";
					JSGAME.SHARED.PERFORMANCE.stamp(_perf_name , "START");

					let tile_w = core.SETTINGS['TILE_WIDTH'];
					let tile_h = core.SETTINGS['TILE_HEIGHT'];

					// Get the number of tilesets.
					let tilesetNames     = Object.keys(core.GRAPHICS.ASSETS.tilesets);
					let tilesetNames_len = tilesetNames.length;

					// Through each tileset...
					for(let t=0; t<tilesetNames_len; t+=1){
						let tilesetName = tilesetNames[t];

						// Go through each tilesets tilemaps...
						let tilemapNames     = Object.keys(core.GRAPHICS.ASSETS._original_data.tilemaps[tilesetName]);
						let tilemapNames_len = tilemapNames.length;

						// Create the entry in tilesets.
						core.GRAPHICS.ASSETS.tilemaps[tilesetName] = {};

						for(let m=0; m<tilemapNames_len; m+=1){
							let tilemapName = tilemapNames[m];
							let org_map=core.GRAPHICS.ASSETS._original_data.tilemaps[tilesetName][tilemapName];
							let mapWidth  = org_map[0];
							let mapHeight = org_map[1];

							// Create the canvas container.
							let canvas    = document.createElement("canvas");
							canvas.width  = mapWidth  * tile_w ;
							canvas.height = mapHeight * tile_h ;
							let ctx       = canvas.getContext("2d");

							// Draw the tiles (which are canvases) onto this canvas.
							for(let y=0; y<mapHeight; y+=1){
								for(let x=0; x<mapWidth; x+=1){
									let tileIndex = org_map[ (y * mapWidth) + x + 2 ];
									let tile = core.GRAPHICS.ASSETS.tilesets[tilesetName][tileIndex];

									ctx.drawImage(tile.canvas, x*tile_w, y*tile_h);
								}
							}

							// Save the new object.
							core.GRAPHICS.ASSETS.tilemaps[tilesetName][tilemapName]={
								"canvas"  : canvas,
								"imgData" : ctx.getImageData(0, 0, canvas.width, canvas.height),
								"ctx"     : ctx,
								"numUsed" : 0,
							}

						}

					}

					JSGAME.SHARED.PERFORMANCE.stamp(_perf_name , "END");
				};
				let createVRAMs                      = function(){
					let layers = Object.keys(core.SETTINGS['layers']);
					for(let i=0; i<layers.length; i+=1){
						let layer = layers[i];
						let layerFlags = core.GRAPHICS.DATA.FLAGS[layer];
						if     (layerFlags.type=="VRAM"  ){
							core.GRAPHICS.DATA.VRAM  [layer] = [];
							let numIndexes = core.SETTINGS['VRAM_TILES_H']*core.SETTINGS['VRAM_TILES_V'];

							let y=0;
							let x=0;
							for(let i=0; i<numIndexes; i+=1){
								if(x>=core.SETTINGS.VRAM_TILES_H){ x=0; y+=1; }
								if(y>=core.SETTINGS.VRAM_TILES_V){ break;     }

								core.GRAPHICS.DATA.VRAM[layer][i] = core.GRAPHICS.FUNCS.returnNewTile_obj();

								// Set the index within the tileObj.
								let addr = (y*_CS.VRAM_TILES_H)+x;
								core.GRAPHICS.DATA.VRAM[layer][i].index_VRAM   = addr;
								core.GRAPHICS.DATA.VRAM[layer][i].index_SPRITE = undefined;
								core.GRAPHICS.DATA.VRAM[layer][i].layerType    = layerFlags.type;

								let clearWith       = core.GRAPHICS.DATA.FLAGS[layer].clearWith       ;

								if     (clearWith=="black"      ){
									core.GRAPHICS.DATA.VRAM[layer][i].tileset="default_tileset";
									core.GRAPHICS.DATA.VRAM[layer][i].tileindex=0;
									core.GRAPHICS.DATA.VRAM[layer][i].flags.drawThis=true;
									core.GRAPHICS.DATA.VRAM[layer][i].x=x*_CS.TILE_WIDTH;
									core.GRAPHICS.DATA.VRAM[layer][i].y=y*_CS.TILE_HEIGHT;
								}
								else if(clearWith=="transparent"){
									core.GRAPHICS.DATA.VRAM[layer][i].tileset="default_tileset";
									core.GRAPHICS.DATA.VRAM[layer][i].tileindex=1;
									core.GRAPHICS.DATA.VRAM[layer][i].flags.drawThis=true;
									core.GRAPHICS.DATA.VRAM[layer][i].x=x*_CS.TILE_WIDTH;
									core.GRAPHICS.DATA.VRAM[layer][i].y=y*_CS.TILE_HEIGHT;
								}

								x+=1;

							}
						}
						else if(layerFlags.type=="SPRITE"){
							core.GRAPHICS.DATA.SPRITES[layer] = [];
						}
						else{
							let str = ["=E= createVRAMs: type is invalid."];
							console.error(str);
							throw Error(str);
						}
					}
				};
				let createColorConversionTable       = function(){
					// 256 colors, 0x00 - 0xFF.
					let str="";
					let obj = {
						// "r332":{},
						// "r32":{},
						"r32_hex":{}
					};
					for(let i=0; i<256; i+=1){
						let dec_text = i.toString() ;
						let hex_text = "0x"+i.toString(16).toUpperCase().padStart(2,"0") ;
						let bin_text = "0b"+i.toString(2).padStart(8,"0") ;
						// let rgba32   = rgb_decode332(i, "arraybuffer_32", false) ;
						let rgba     = rgb_decode332(i, "object"        , false) ;
						let r32_hex =
							"#" +
							  ( (rgba.r).toString(16).padStart(2, "0").toUpperCase() )
							+ ( (rgba.g).toString(16).padStart(2, "0").toUpperCase() )
							+ ( (rgba.b).toString(16).padStart(2, "0").toUpperCase() )
							// + ( (rgba.a).toString(16).padStart(2, "0").toUpperCase() )
						;

						obj["r32_hex"][r32_hex]={
							"uze_dec":dec_text,
							"uze_hex":hex_text,
							"uze_bin":bin_text,
							// "rgba32" : rgba32 ,
							"rgba"   : rgba ,
							"r32_hex": r32_hex
						};

						// obj["r32"][rgba32] = {
						// 	"dec":dec_text,
						// 	"hex":hex_text,
						// 	"bin":bin_text,
						// 	"rgba32" : rgba32 ,
						// 	"rgba"   : rgba ,
						// 	"r32_hex": r32_hex
						// };

						// obj["r332"][i] = {
						// 	"dec":dec_text,
						// 	"hex":hex_text,
						// 	"bin":bin_text,
						// 	"rgba32" : rgba32 ,
						// 	"rgba"   : rgba ,
						// 	"r32_hex": r32_hex
						// };
					}

					core.GRAPHICS.DATA.lookups = {};
					core.GRAPHICS.DATA.lookups.colors = obj;

					// console.info("core.GRAPHICS.DATA.lookups.colors :\n", core.GRAPHICS.DATA.lookups.colors);
				};
				let createDefaultTileset             = function(){
					// Create default tileset.
					core.GRAPHICS.ASSETS.tilesets["default_tileset"]=[];

					// Create black tile and add to the default tileset.
					canvas=document.createElement("canvas");
					canvas.width  = core.SETTINGS.TILE_WIDTH;
					canvas.height = core.SETTINGS.TILE_HEIGHT;
					JSGAME.SHARED.setpixelated(canvas);
					ctx=canvas.getContext("2d");
					ctx.fillStyle = "rgba(0, 0, 0, 1.0)";      // Black
					ctx.fillRect(0, 0, canvas.width, canvas.height);
					imgData = ctx.getImageData(0,0,canvas.width, canvas.height);
					core.GRAPHICS.ASSETS.tilesets["default_tileset"].push({
						"canvas"  : canvas ,
						"imgData" : imgData ,
						"numUsed" : 0 ,
					});

					// Create transparent tile and add to the default tileset.
					canvas=document.createElement("canvas");
					canvas.width  = core.SETTINGS.TILE_WIDTH;
					canvas.height = core.SETTINGS.TILE_HEIGHT;
					JSGAME.SHARED.setpixelated(canvas);
					ctx=canvas.getContext("2d");
					ctx.clearRect(0,0,canvas.width,canvas.height); // Full transparent.
					imgData = ctx.getImageData(0,0,canvas.width, canvas.height);
					core.GRAPHICS.ASSETS.tilesets["default_tileset"].push({
						"canvas"  : canvas ,
						"imgData" : imgData ,
						"numUsed" : 0 ,
					});

					// Create a tile for each available color in the color conversion table.
					let keys = Object.keys(core.GRAPHICS.DATA.lookups.colors.r32_hex);

					/*
					for(let i=0; i<keys.length; i+=1){
						let key = keys[i];
						let rgba = core.GRAPHICS.DATA.lookups.colors.r32_hex[key].rgba;
						let uze_dec = core.GRAPHICS.DATA.lookups.colors.r32_hex[key].uze_dec;

						canvas=document.createElement("canvas");
						canvas.width  = core.SETTINGS.TILE_WIDTH;
						canvas.height = core.SETTINGS.TILE_HEIGHT;
						JSGAME.SHARED.setpixelated(canvas);
						ctx=canvas.getContext("2d");
						imgData = ctx.createImageData(canvas.width, canvas.height);
						ctx.fillStyle = key;
						ctx.fillRect(0, 0, canvas.width, canvas.height);
						ctx.putImageData(imgData,0,0);

						core.GRAPHICS.ASSETS.tilesets["default_tileset"].push({
							"canvas"  : canvas ,
							"imgData" : imgData ,
							"numUsed" : 0 ,
							"r32_hex" : key ,
							"uze_dec" : parseInt(uze_dec,10) ,
						});
					}
					*/

					// core.GRAPHICS.DATA.lookups.colors


				};

				post_graphicsConversion();
				post_graphicsConversion2();
				createVRAMs();
				createColorConversionTable();
				createDefaultTileset();

				// JSGAME.SHARED.PERFORMANCE.stamp(_perf_name , "END");
				// Done! Resolve.
				res1();
			}
			catch(e){ console.info("============", {_perf_name, e} ); rej1({_perf_name, e}); }
		});};

		/**
		 * PART4: Clean-up and canvas clearing.
		*/
		let cleanup = function(){ return new Promise(function(res1, rej1){
			let _perf_name = "VIDEO_INIT_"+"cleanup";
			try{
				// Clear all canvases and data.
				JSGAME.SHARED.PERFORMANCE.stamp(_perf_name+"_clearAllCanvases" , "START");
				core.GRAPHICS.FUNCS.clearAllCanvases();
				JSGAME.SHARED.PERFORMANCE.stamp(_perf_name+"_clearAllCanvases" , "END");

				// Set the OUTPUT canvas CSS background-color to black.
				JSGAME.SHARED.PERFORMANCE.stamp(_perf_name+"_OUTPUTcanvasToBlack" , "START");
				core.GRAPHICS.canvas.OUTPUT.style["background-color"]="black";
				JSGAME.SHARED.PERFORMANCE.stamp(_perf_name+"_OUTPUTcanvasToBlack" , "END");

				// Done! Resolve.
				res1();
			}
			catch(e){ rej1({_perf_name, e}); }
		});};

		// =================================================================
		/**
		 * FUNCTION DESCRIPTION GOES HERE.
		*/
		let TEMPLATE = function(){ return new Promise(function(res1, rej1){
			let _perf_name = "VIDEO_INIT_"+"TEMPLATE";
			try{
				JSGAME.SHARED.PERFORMANCE.stamp(_perf_name , "START");

				JSGAME.SHARED.PERFORMANCE.stamp(_perf_name , "END");

				// Done! Resolve.
				res1();
			}
			catch(e){ rej1({_perf_name, e}); }
		});};
		// =================================================================

		let errorLevel=function(err, level){
			let str = ["=E= core.GRAPHICS.FUNCS.init level "+level];
			console.info(
				"***********************************************",
				"\n str             :  ", str,
				"\n err             :  ", err,
				"\n err._perf_name  :  ", err._perf_name,
				"\n err.e           :  \n", err.e,
				"\n***********************************************\n",
				""
			);
			rej_VIDEO_INIT({"str":str,"err":err});

			return new Promise(function(resolve,reject){reject( {"str":str,"err":err} );});

			// throw Error([str,JSON.stringify(err)]);
		}

		// First layer of functions. (Settings, DOM, Canvas setup.)
		let proms1 = [
			getSettings()     ,
			dom_setup()       ,
			canvas_setup()    ,
		];
		Promise.all(proms1).then(
			function(res1){
				// Second layer of functions. (Download and first conversion of graphics. )
				let proms2 = [
					graphics1_setup() ,
				];
				Promise.all(proms2).then(
					function(res2){
						// Third layer of functions. (Second conversion of graphics.)
						let proms3 = [
							graphics2_setup() ,
						];
						Promise.all(proms3).then(
							function(res3){
								// Last layer function.
								cleanup().then(
									function(res4){
										JSGAME.SHARED.PERFORMANCE.stamp("VIDEO_INIT_ALL"                   , "END");

										// Done! Resolve.
										res_VIDEO_INIT();
									},
									function(err){ errorLevel(err, 4); },
								);
							},
							function(err){ errorLevel(err, 3); },
						);
					},
					function(err){ errorLevel(err, 2); },
				);
			},
			function(err){ errorLevel(err, 1); },
		);

	});
}
// _DOC_ | update_layers_type2 | Handles drawing of VRAM and SPRITE layers.
core.GRAPHICS.FUNCS.update_layers_type2 = function( updatedLayers ){
	return new Promise(function(res,rej){
		// Get all layer draw start time.
		let drawStart_update_layers_type2;
		if(JSGAME.FLAGS.debug) { drawStart_update_layers_type2 = performance.now(); core.GRAPHICS.performance.LAYERS["update_layers_type2"].shift(); }

		let drawOutput=false;

		let layers = Object.keys(core.SETTINGS['layers']);
		for(let i=0; i<layers.length; i+=1){
			// Get draw start time.
			let drawStart = performance.now();

			// Get layer variables.
			let layer           = layers[i];
			let UPDATE          = core.GRAPHICS.DATA.FLAGS[layer].UPDATE          ;
			let REDRAW          = core.GRAPHICS.DATA.FLAGS[layer].REDRAW          ;
			let layerFlags      = core.GRAPHICS.DATA.FLAGS[layer]                 ;
			let clearCanvasBeforeUpdate = core.GRAPHICS.DATA.FLAGS[layer].clearCanvasBeforeUpdate ;
			let canvas          = core.GRAPHICS.canvas[layer]                     ;
			let ctx             = core.GRAPHICS.ctx[layer]                        ;

			// Force redraw if UPDATE is set and the layer has clearCanvasBeforeUpdate set.
			if(UPDATE && clearCanvasBeforeUpdate){
				// Set REDRAW.
				REDRAW=true;

				// Clear this canvas.
				if(clearCanvasBeforeUpdate){ ctx.clearRect(0,0,canvas.width,canvas.height); }
			}

			// Draw?
			if( (UPDATE || REDRAW) ){
				let VRAM  ;

				// An update has been indicated on this layer. Get a handle the correct data.
				if     (layerFlags.type=="VRAM"  ){ VRAM = core.GRAPHICS.DATA.VRAM   [layer] ; }
				else if(layerFlags.type=="SPRITE"){ VRAM = core.GRAPHICS.DATA.SPRITES[layer] ; }
				else{
					let str = ["=E= update_layers_type2: invalid layer type.", JSON.stringify(VRAM[t],null,1)];
					throw Error(str);
				}

				// DRAW TILES?
				for(let t=0; t<VRAM.length; t+=1){
					// Skip gaps in the array.
					if(!VRAM[t]){ continue; }

					// Do not draw tiles that have OFF set.
					if(VRAM[t].flags.OFF){ continue; }

					// Does this tile have the drawThis flag set?
					if(VRAM[t].flags.drawThis || REDRAW){
						// Position and Dimension
						let x = VRAM[t].x ;
						let y = VRAM[t].y ;
						let w = VRAM[t].w ;
						let h = VRAM[t].h ;

						// Source image data.
						let tileset   = VRAM[t].tileset   ;
						// let layer     = VRAM[t].layer     ;
						let tilemap   = VRAM[t].tilemap   ;
						let tileindex = VRAM[t].tileindex ;
						let img_canvas  = (VRAM[t].canvas instanceof HTMLCanvasElement) ? VRAM[t].canvas  : false ;

						let finalImage;

						// Skip the draw if the tileset was not specified.
						if(!tileset || tileset==""){
							console.info("Skipping VRAM["+t+"] due to missing tileset.", VRAM[t]);
							continue;
						}

						// *** DETERMINE WHAT IMAGE WILL BE DRAWN. ***

						// Draw the custom canvas if it exists.
						if     (img_canvas !== false ){
							finalImage=img_canvas; // Get the image.
							finalImage.numUsed+=1; // Update numUsed for this imgObj.
						}
						// Draw the tilemap if it exists.
						else if(tilemap   !== ""){
							finalImage=core.GRAPHICS.ASSETS.tilemaps[tileset][tilemap].numUsed+=1; // Update numUsed for this imgObj.
							finalImage=core.GRAPHICS.ASSETS.tilemaps[tileset][tilemap].canvas;     // Get the image.
						}
						// Draw the tileindex if it exists.
						else if(tileindex   !== ""){
							core.GRAPHICS.ASSETS.tilesets[tileset][tileindex].numUsed+=1;        // Update numUsed for this imgObj.
							finalImage=core.GRAPHICS.ASSETS.tilesets[tileset][tileindex].canvas; // Get the image.
						}
						else{
							// continue;
							let str = ["=E= update_layers_type2: (drawThis) invalid data.", JSON.stringify(VRAM[t],null,1)];
							// console.error("============================", str, VRAM[t]);
							console.info(
								"============================",
								"\n layer :"         , layer     , "----",
								"\n finalImage     :", finalImage, "----",
								"\n tileset        :", tileset   , "----",
								"\n img_canvas     :", img_canvas, "----",
								"\n tilemap        :", tilemap   , "----",
								"\n tileindex      :", tileindex , "----",
								"\n VRAM           :", VRAM[t] ,
								"\n VRAM[t].canvas :", VRAM[t].canvas ,
								"\n TEST1: "         ,img_canvas !== false ,
								"\n TEST2: "         ,tilemap    !== ""    ,
								"\n TEST3: "         ,tileindex  !== ""    ,

								"\n instanceof HTMLImageElement :", VRAM[t].canvas instanceof HTMLCanvasElement,
								"\n core.GRAPHICS.ASSETS.tilemaps[tileset][tilemap]  :", core.GRAPHICS.ASSETS.tilemaps[tileset][tilemap] ,
								"\n core.GRAPHICS.ASSETS.tilesets[tileset][tileindex]:", core.GRAPHICS.ASSETS.tilesets[tileset][tileindex] ,
								""
							);
							throw Error(str);
						}

						// Draw the tile.
						ctx.drawImage( finalImage, (x) << 0, (y) << 0 );

						// Clear the drawThis flag.
						VRAM[t].flags.drawThis=false;

						// Update the lastUpdate time for this layer.
						try{
							core.GRAPHICS.DATA.FLAGS[layer].lastUpdate=performance.now();
						}
						catch(e){
							console.log("1: e                             :", e);
							console.log("2: core.GRAPHICS.DATA.FLAGS      :", core.GRAPHICS.DATA.FLAGS);
							console.log("3: layer                         :", layer);
							console.log("4: core.GRAPHICS.DATA.FLAGS.layer:", core.GRAPHICS.DATA.FLAGS.layer);
						}

						// Set the drawOutput flag.
						drawOutput=true;
					}
				}

				// Clear the UPDATE and REDRAW flags for this layer.
				core.GRAPHICS.DATA.FLAGS[layer].UPDATE=false;
				core.GRAPHICS.DATA.FLAGS[layer].REDRAW=false;
			}

			// Update the layer draw performance data.
			if(JSGAME.FLAGS.debug) { core.GRAPHICS.performance.LAYERS[layer].shift(); core.GRAPHICS.performance.LAYERS[layer].push(performance.now() - drawStart);                   }
		}

		// Update the all layer draw performance data.
		if(JSGAME.FLAGS.debug) { core.GRAPHICS.performance.LAYERS["update_layers_type2"].push(performance.now() - drawStart_update_layers_type2);                   }

		// Done! Resolve.
		res(drawOutput);
	});
};
// _DOC_ | update_layer_OUTPUT | Combines the layer and draws to the OUTPUT canvas.
core.GRAPHICS.FUNCS.update_layer_OUTPUT = function(){
	return new Promise(function(res,rej){
		// Get a handle to the temp output.
		let tempOutput = core.GRAPHICS.canvas.pre_OUTPUT;
		let tempOutput_ctx = core.GRAPHICS.ctx.pre_OUTPUT;
		tempOutput_ctx.clearRect( 0,0, tempOutput.width, tempOutput.height );

		// Draw each layer to the OUTPUT in the order specified by the gamesettings.json file.
		for(let i=0; i<core.SETTINGS['layerDrawOrder'].length; i+=1){
			let layerName = core.SETTINGS['layerDrawOrder'][i];
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
// _DOC_ | update_allLayers | Draws the layer updates.
core.GRAPHICS.FUNCS.update_allLayers    = function(){
	return new Promise(function(res_updateAllLayers, rej_updateAllLayers){
		// Update the layers.
		let proms = [
			core.GRAPHICS.FUNCS.update_layers_type2() ,
		];

		// Update the OUTPUT canvas.
		Promise.all(proms).then(
			// Success? Write the OUTPUT layer.
			function(res){
				// Was there an update to the layers?
				if(res[0]==true){
					core.GRAPHICS.FUNCS.update_layer_OUTPUT().then(
						// Success?
						function(){
							res_updateAllLayers();
							return;
						},

						// Failure?
						function(err){
							// Throw error.
							rej_updateAllLayers();
							let str = ["=E= update_layer_OUTPUT:", err];
							console.error(str);
							throw Error(str);
						}
					);
				}
				// No? Nothing to do. Resolve.
				else{
					res_updateAllLayers();
					return;
				}
			},

			// Failure of at least one promise in the array?
			function(err){
				// Throw error.
				rej_updateAllLayers();
				let str = ["=E= update_allLayers: failed promise in layer draws: ", err];
				console.error(err, str);
				throw Error(str);
			},
		);

	});
};
// _DOC_ | returnNewTile_obj | Returns a new VRAM tile object with default settings.
core.GRAPHICS.FUNCS.returnNewTile_obj   = function(){
	let output = 	{
		// Position and Dimension
		"x"               : 0                 , // Pixel-aligned x position.
		"y"               : 0                 , // Pixel-aligned y position.
		"w"               : _CS.TILE_WIDTH    , // Width in pixels.
		"h"               : _CS.TILE_HEIGHT   , // Height in pixels.

		// Source image data.
		"layerType"       : ""                ,
		"tileset"         : "default_tileset" , // Name of tileset. Used for filtering.
		"layer"           : ""                , // Name of layer. Used for filtering.
		"tilemap"         : ""                , // Name of tilemap. (Might not always be populated.)
		"tileindex"       : 0                 , // Tile index into the tileset. (Might not always be populated.)

		// Customized canvas (not using one of the pre-converted imgObj.
		"canvas"          : undefined             , // If set with a canvas it can be drawn instead of from imgObj. false: ignored.
		"imgData"         : undefined             , // If set with a imgData it can be drawn instead of from imgObj. false: ignored.

		// VRAM or SPRITE array indexes.
		"index_VRAM"      : undefined         , //
		"index_SPRITE"    : undefined         , //

		// Draw flags
		"flags"           : {
			// Sprite-like flags:
			"OFF"         : false             , // If true then the tile is ignored at draw time.
			"ROT"         : false             , // Rotation. (degrees, -360 through +360.), false: rotation is not considered.
			"FLIP_X"      : false             , // Horizontal flip. true: Tile canvas flipped horizontally., false: Tile is not flipped horizontally
			"FLIP_Y"      : false             , // Vertical flip. true: Tile canvas flipped vertically., false: Tile is not flipped vertically
			"spriteIndex" : undefined         , // Vertical flip. true: Tile canvas flipped vertically., false: Tile is not flipped vertically

			// Draw flags.
			"drawThis"    : false             , // Draw status.  true: Image will be drawn., false: Image will not be drawn.
		}
	};

	return output;
};
// _DOC_ | ClearSprites | Clears the SPRITE data and clears the existing canvas layers.
core.GRAPHICS.FUNCS.ClearSprites             = function(layer){
	let layersToClear=[];

	// If a layer was not specifed then clear all layers.
	if(layer==undefined){
		let layers = Object.keys(core.SETTINGS['layers']);
		for(let i=0; i<layers.length; i+=1){
			if(core.GRAPHICS.DATA.FLAGS[layers[i]].type=="SPRITE"){
				layersToClear.push( layers[i] );
			}
		}
	}

	// If a specific layer was specified then only clear that layer.
	else{
		if(core.GRAPHICS.DATA.FLAGS[layer].type=="SPRITE"){
			layersToClear.push(layer);
		}
	}

	// Clear the specified SPRITE layer(s).
	for(let l=0; l<layersToClear.length; l+=1){
		layer=layersToClear[l];
		let canvas = core.GRAPHICS.canvas[layer];
		let ctx    = core.GRAPHICS.ctx[layer];
		let w      = canvas.width;
		let h      = canvas.height;

		core.GRAPHICS.DATA.SPRITES[layer]=[];

		// Set this layer to update. (Needed?)
		core.GRAPHICS.DATA.FLAGS[layer].UPDATE=true;
		core.GRAPHICS.DATA.FLAGS[layer].REDRAW=true;

		// Clear the canvas.
		ctx.clearRect(0,0,w,h); // Full transparent.
	}
}
// _DOC_ | ClearVram | Clears the VRAM data and clears the existing canvas layers.
core.GRAPHICS.FUNCS.ClearVram                = function(layer){
	let layersToClear=[];

	// If a layer was not specifed then clear all layers.
	if(layer==undefined){
		let layers = Object.keys(core.SETTINGS['layers']);
		for(let i=0; i<layers.length; i+=1){
			if     (core.GRAPHICS.DATA.FLAGS[layers[i]].type=="VRAM")  {
				layersToClear.push( layers[i] );
			}
		}
	}

	// If a specific layer was specified then only clear that layer.
	else{ layersToClear.push(layer); }

	// Clear the specified VRAM(s).
	for(let l=0; l<layersToClear.length; l+=1){
		layer=layersToClear[l];
		let canvas = core.GRAPHICS.canvas[layer];
		let ctx    = core.GRAPHICS.ctx[layer];
		let w      = canvas.width;
		let h      = canvas.height;

		// Determine how to clear the region.
		let clearWith = core.GRAPHICS.DATA.FLAGS[layer].clearWith       ;

		if     (clearWith=="black")      {
			if     (core.GRAPHICS.DATA.FLAGS[layer].type=="VRAM")  {
				let y=0;
				let x=0;
				for(let i=0; i<core.GRAPHICS.DATA.VRAM[layer].length; i+=1){
					if(x>=core.SETTINGS.VRAM_TILES_H){ x=0; y+=1; }
					if(y>=core.SETTINGS.VRAM_TILES_V){ break;     }
					core.GRAPHICS.DATA.VRAM[layer][i] = core.GRAPHICS.FUNCS.returnNewTile_obj();

					// Set the index within the tileObj.
					let addr = (y*_CS.VRAM_TILES_H)+x;
					core.GRAPHICS.DATA.VRAM[layer][i].index_VRAM   = addr;
					core.GRAPHICS.DATA.VRAM[layer][i].index_SPRITE = undefined;

					core.GRAPHICS.DATA.VRAM[layer][i].x=x*_CS.TILE_WIDTH;
					core.GRAPHICS.DATA.VRAM[layer][i].y=y*_CS.TILE_HEIGHT;
					core.GRAPHICS.DATA.VRAM[layer][i].tileindex=0;
					core.GRAPHICS.DATA.VRAM[layer][i].drawThis=true;
					x+=1;
				}
			}
		}
		else if(clearWith=="transparent"){
			if     (core.GRAPHICS.DATA.FLAGS[layer].type=="VRAM")  {
				let y=0;
				let x=0;
				for(let i=0; i<core.GRAPHICS.DATA.VRAM[layer].length; i+=1){
					if(x>=core.SETTINGS.VRAM_TILES_H){ x=0; y+=1; }
					if(y>=core.SETTINGS.VRAM_TILES_V){ break;     }
					core.GRAPHICS.DATA.VRAM[layer][i] = core.GRAPHICS.FUNCS.returnNewTile_obj();

					// Set the index within the tileObj.
					let addr = (y*_CS.VRAM_TILES_H)+x;
					core.GRAPHICS.DATA.VRAM[layer][i].index_VRAM   = addr;
					core.GRAPHICS.DATA.VRAM[layer][i].index_SPRITE = undefined;

					core.GRAPHICS.DATA.VRAM[layer][i].x=x*_CS.TILE_WIDTH;
					core.GRAPHICS.DATA.VRAM[layer][i].y=y*_CS.TILE_HEIGHT;
					core.GRAPHICS.DATA.VRAM[layer][i].tileindex=1;
					core.GRAPHICS.DATA.VRAM[layer][i].drawThis=true;
					x+=1;
				}
			}
		}
		else{
			let str = ["=E= ClearVram: clearWith is invalid."];
			console.error(str);
			throw Error(str);
		}

		// Set this layer to update. (Needed?)
		core.GRAPHICS.DATA.FLAGS[layer].UPDATE=true;
		core.GRAPHICS.DATA.FLAGS[layer].REDRAW=true;

		// Clear the sprite layers.
		core.GRAPHICS.FUNCS.ClearSprites();

		// Clear the output canvas.
		core.GRAPHICS.FUNCS.ClearOUTPUT();
	}
}
// _DOC_ | ClearOUTPUT | Clear the OUTPUT canvas.
core.GRAPHICS.FUNCS.ClearOUTPUT              = function(){
	let canvas = core.GRAPHICS.canvas.OUTPUT;
	core.GRAPHICS.ctx.OUTPUT.clearRect(0,0,canvas.w,canvas.h);
};
// _DOC_ | clearAllCanvases | Clear all canvas layers and their data.
core.GRAPHICS.FUNCS.clearAllCanvases         = function(){
	// Clear the VRAM, SPRITE, and OUTPUT layers and DATA.
	core.GRAPHICS.FUNCS.ClearSprites();
	core.GRAPHICS.FUNCS.ClearVram();
	core.GRAPHICS.FUNCS.ClearOUTPUT();

	// Clear each canvas.
	let layers = Object.keys(core.SETTINGS['layers']);
	for(let i=0; i<layers.length; i+=1){
		let canvas = core.GRAPHICS.canvas[layers[i]];
		let ctx    = core.GRAPHICS.ctx[layers[i]];
		ctx.clearRect(0,0,canvas.w,canvas.h);
	}
};
// _DOC_ | DrawTile | Draws a canvas tile to the indicated area.
core.GRAPHICS.FUNCS.DrawTile                 = function(x, y, tileset, tileindex, layer, flags){
	// Confirm that all arguments were provided.
	if(tileset   == undefined){ let str = ["=E= DrawTile: tileset is undefined."  ]; throw Error(str); }
	if(layer     == undefined){ let str = ["=E= DrawTile: layer is undefined."    ]; throw Error(str); }
	if(flags     == undefined){ let str = ["=E= DrawTile: flags is undefined."    ]; throw Error(str); }
	if(tileindex == undefined){ let str = ["=E= DrawTile: tileindex is undefined."]; throw Error(str); }

	// Make sure that the specified tileset, tileindex, and layer exist.
	if(_CGA.tilesets[tileset]            == undefined){ let str = ["=E= DrawTile: tileset is invalid."  ]; throw Error(str); }
	if(_CS.layers[layer]                 == undefined){ let str = ["=E= DrawTile: layer is invalid."    ]; throw Error(str); }
	if(_CGA.tilesets[tileset][tileindex] == undefined){ let str = ["=E= DrawTile: tileindex is invalid."]; throw Error(str); }

	let imgObj = _CGA.tilesets[tileset][tileindex];

	core.GRAPHICS.FUNCS.Adjust_NewTile_obj({
		"__calledBy": "DrawTile",
		"x"         : x         ,
		"y"         : y         ,
		"tileset"   : tileset   ,
		"tileindex" : tileindex ,
		"tilemap"   : ""        ,
		"layer"     : layer     ,
		"flags"     : flags     ,
		"imgObj"    : imgObj
	});
}
// _DOC_ | DrawMap | Draws a canvas tilemap to the indicated area.
core.GRAPHICS.FUNCS.DrawMap                  = function(x, y, tileset, tilemap , layer, flags){
	// Confirm that all arguments were provided.
	if(tileset   == undefined){ let str = ["=E= DrawTile: tileset is undefined."  ]; throw Error(str); }
	if(layer     == undefined){ let str = ["=E= DrawTile: layer is undefined."    ]; throw Error(str); }
	if(flags     == undefined){ let str = ["=E= DrawTile: flags is undefined."    ]; throw Error(str); }
	if(tilemap   == undefined){ let str = ["=E= DrawTile: tilemap is undefined."  ]; throw Error(str); }

	// Make sure that the specified tileset, tileindex, and layer exist.
	if(_CGA.tilesets[tileset]          == undefined){ let str = ["=E= DrawTile: tileset is invalid."  ]; throw Error(str); }
	if(_CS.layers[layer]               == undefined){ let str = ["=E= DrawTile: layer is invalid."    ]; throw Error(str); }
	if(_CGA.tilemaps[tileset][tilemap] == undefined){ let str = ["=E= DrawTile: tilemap is invalid."  ]; throw Error(str); }

	let imgObj = _CGA.tilemaps[tileset][tilemap];
	// console.log(imgObj, "----", x, y, tileset, tilemap , layer, flags);
	core.GRAPHICS.FUNCS.Adjust_NewTile_obj({
		"__calledBy": "DrawMap" ,
		"x"         : x         ,
		"y"         : y         ,
		"tileset"   : tileset   ,
		"tileindex" : ""        ,
		"tilemap"   : tilemap   ,
		"layer"     : layer     ,
		"flags"     : flags     ,
		"imgObj"    : imgObj
	});
}
// _DOC_ | Adjust_NewTile_obj | Used by DrawTile and DrawMap to draw.
core.GRAPHICS.FUNCS.Adjust_NewTile_obj       = function(data){
	let x          = data.x          ;
	let y          = data.y          ;
	let tileset    = data.tileset    ;
	let tileindex  = data.tileindex  ;
	let tilemap    = data.tilemap    ;
	let layer      = data.layer      ;
	let flags      = data.flags      ;
	let imgObj     = data.imgObj     ;
	let __calledBy = data.__calledBy ;

	let useGrid    ;
	layerType      = core.GRAPHICS.DATA.FLAGS[layer].type;

	// Determine grid-alignment based on layer type.
	if     (layerType == "VRAM"   ){ useGrid=true;  }
	else if(layerType == "SPRITE" ){ useGrid=false; }
	else{
		let str = ["=E= Adjust_NewTile_obj: ("+__calledBy+") layer type is invalid."];
		throw Error(str);
	}

	// All sprites need a sprite index.
	if( layerType == "SPRITE" && ( flags.spriteIndex==undefined ) ){
		let str = ["=E= Adjust_NewTile_obj: ("+__calledBy+") spriteIndex or useGrid is invalid."]; throw Error(str);
	}

	// Get a new default tileObj.
	let newVRAM_entry = core.GRAPHICS.FUNCS.returnNewTile_obj();

	newVRAM_entry.layerType = layerType;

	// Set the tileset, tileindex, layer values.
	newVRAM_entry.tileset   = tileset   ;
	newVRAM_entry.layer     = layer     ;
	if     (tileindex !== "" ){ newVRAM_entry.tileindex = tileindex ; }
	else if(tilemap   !== "" ){ newVRAM_entry.tilemap   = tilemap   ; }

	// Grid?
	if(useGrid==true){
		// In bounds on x?
		if(x >= core.SETTINGS.VRAM_TILES_H) {
			console.info("x is out of bounds.", x, core.SETTINGS.VRAM_TILES_H, __calledBy);
			return;
		}
		// In bounds on y?
		if(y >= core.SETTINGS.VRAM_TILES_V) {
			console.info("y is out of bounds.", y, core.SETTINGS.VRAM_TILES_V, __calledBy);
			return;
		}

		// Set x, y values.
		newVRAM_entry.x = x * _CS.TILE_WIDTH;
		newVRAM_entry.y = y * _CS.TILE_HEIGHT;
	}
	// No grid.
	else{
		// In bounds on x?
		if(x >= core.SETTINGS.VRAM_TILES_H * _CS.TILE_WIDTH) {
			console.info("x is out of bounds.", x * _CS.TILE_WIDTH);
			return;
		}
		// In bounds on y?
		if(y >= core.SETTINGS.VRAM_TILES_V * _CS.TILE_HEIGHT) {
			console.info("y is out of bounds.", y * _CS.TILE_HEIGHT);
			return;
		}

		// Set x, y values.
		newVRAM_entry.x = x ;
		newVRAM_entry.y = y ;
	}

	// Set the flags if present. Otherwise, use the defaults.
	if(flags.ROT         == undefined){ flags.ROT         = false     ; }
	if(flags.FLIP_X      == undefined){ flags.FLIP_X      = false     ; }
	if(flags.FLIP_Y      == undefined){ flags.FLIP_Y      = false     ; }
	if(flags.spriteIndex == undefined){ flags.spriteIndex = undefined ; }
	if(flags.colorSwaps  == undefined){ flags.colorSwaps  = []        ; }
	newVRAM_entry.flags = flags;

	// DEBUG:
	newVRAM_entry.__calledBy = data.__calledBy;

	// Rotate or flip the image?
	if(flags.ROT !== false || flags.FLIP_X || flags.FLIP_Y || flags.colorSwaps.length){
		// Custom canvases will not have the tilemap or tileindex set.
		newVRAM_entry.tileindex = "";
		newVRAM_entry.tilemap   = "";
		newVRAM_entry.w         = imgObj.canvas.width  ;
		newVRAM_entry.h         = imgObj.canvas.height ;

		let hash = "TS:"+tileset+"TM:"+tilemap+"TI:"+tileindex;
		core.GRAPHICS.FUNCS.addTileFlagChangesToQueue(imgObj.imgData, newVRAM_entry, hash);
	}
	else{
		// Set w, h values.
		newVRAM_entry.w = imgObj.canvas.width ;
		newVRAM_entry.h = imgObj.canvas.height ;

		newVRAM_entry.canvas  = undefined ;
		newVRAM_entry.imgData = undefined ;

		// Set drawThis.
		newVRAM_entry.flags.drawThis=true;

		// Set the UPDATE flag for this layer.
		core.GRAPHICS.DATA.FLAGS[layer].UPDATE=true;

		// Place the tile.
		core.GRAPHICS.FUNCS.placeTile({
			"mapWidth"      : (imgObj.canvas.width   / _CS.TILE_WIDTH ) << 0 ,
			"mapHeight"     : (imgObj.canvas.height  / _CS.TILE_HEIGHT) << 0 ,
			"newVRAM_entry" : newVRAM_entry ,
		});
	}
};
// _DOC_ | TileFill | Fill a region with a tile.
core.GRAPHICS.FUNCS.TileFill                 = function(x, y, w, h, tileset, tileindex, layer, flags){
	// Confirm that all arguments were provided.
	if(tileset   == undefined){ let str = ["=E= TileFill: tileset is undefined."  ]; throw Error(str); }
	if(layer     == undefined){ let str = ["=E= TileFill: layer is undefined."    ]; throw Error(str); }
	if(flags     == undefined){ let str = ["=E= TileFill: flags is undefined."    ]; throw Error(str); }
	if(tileindex == undefined){ let str = ["=E= TileFill: tileindex is undefined."]; throw Error(str); }

	// Make sure that the specified tileset, tileindex, and layer exist.
	if(_CGA.tilesets[tileset]            == undefined){ let str = ["=E= TileFill: tileset is invalid."  ]; throw Error(str); }
	if(_CS.layers[layer]                 == undefined){ let str = ["=E= TileFill: layer is invalid."    ]; throw Error(str); }
	if(_CGA.tilesets[tileset][tileindex] == undefined){ let str = ["=E= TileFill: tileindex is invalid."]; throw Error(str); }

	// TileFill should only be used on VRAM.
	layerType      = core.GRAPHICS.DATA.FLAGS[layer].type;
	if     (layerType != "VRAM"   ){
		let str = ["=E= TileFill: layer type must be VRAM.."];
		throw Error(str);
	}

	// Draw the box, one tile at a time with SetTile.
	for(let ypos=0; ypos<h; ypos+=1){
		for(let xpos=0; xpos<w; xpos+=1){
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
				core.GRAPHICS.FUNCS.DrawTile(x+xpos, y+ypos, tileset, tileindex, layer, flags);
			}
		}
	}

}

// _DOC_ | MapFill | Draw a tilemap to cover a region of varying dimensions. (Each dimension being a multiple of w and h.)
core.GRAPHICS.FUNCS.MapFill                  = function(sx, sy, nw, nh, tileset, tilemap, layer, flags){
	// Confirm that all arguments were provided.
	if(tileset   == undefined){ let str = ["=E= DrawTile: tileset is undefined."  ]; throw Error(str); }
	if(layer     == undefined){ let str = ["=E= DrawTile: layer is undefined."    ]; throw Error(str); }
	if(flags     == undefined){ let str = ["=E= DrawTile: flags is undefined."    ]; throw Error(str); }
	if(tilemap   == undefined){ let str = ["=E= DrawTile: tilemap is undefined."  ]; throw Error(str); }

	// Make sure that the specified tileset, tileindex, and layer exist.
	if(_CGA.tilesets[tileset]          == undefined){ let str = ["=E= DrawTile: tileset is invalid."  ]; throw Error(str); }
	if(_CS.layers[layer]               == undefined){ let str = ["=E= DrawTile: layer is invalid."    ]; throw Error(str); }
	if(_CGA.tilemaps[tileset][tilemap] == undefined){ let str = ["=E= DrawTile: tilemap is invalid."  ]; throw Error(str); }

	// Get the width and height of this tilemap.
	let imgObj = _CGA.tilemaps[tileset][tilemap];
	let mapWidth  = (imgObj.canvas.width   / _CS.TILE_WIDTH ) << 0;
	let mapHeight = (imgObj.canvas.height  / _CS.TILE_HEIGHT) << 0;

	// console.log(
	// 	"\n tileset   :", tileset   ,
	// 	"\n tilemap   :", tilemap   ,
	// 	"\n mapWidth  :", mapWidth  ,
	// 	"\n mapHeight :", mapHeight ,
	// 	""
	// );

	for(let y=0; y<nh; y+=mapHeight){
		for(let x=0; x<nw; x+=mapWidth){
			core.GRAPHICS.FUNCS.DrawMap( (x+sx), (y+sy), tileset, tilemap, layer, flags);
		}
	}

}
// _DOC_ | Print | Draw a text string to the screen.
core.GRAPHICS.FUNCS.Print                    = function(x, y, string, tileset, tilemap, layer, flags){
	// Font maps should be 64 characters (plus 2 for the width/height of the map.)
	// Font tiles are expected to be in the following order in the fontmap:
	//    !  "  #  $  %  &  '  (  )  *  +  ,  -  .  /
	// 0  1  2  3  4  5  6  7  8  9  :  ;  <  =  >  ?
	// @  A  B  C  D  E  F  G  H  I  J  K  L  M  N  O
	// P  Q  R  S  T  U  V  W  X  Y  Z  [  c  ]  ^  _

	// Confirm that all arguments were provided.
	if(tileset   == undefined){ let str = ["=E= Print: tileset is undefined."  ]; throw Error(str); }
	if(layer     == undefined){ let str = ["=E= Print: layer is undefined."    ]; throw Error(str); }
	if(flags     == undefined){ let str = ["=E= Print: flags is undefined."    ]; throw Error(str); }
	if(tilemap   == undefined){ let str = ["=E= Print: tilemap is undefined."  ]; throw Error(str); }

	// Make sure that the specified tileset, tileindex, and layer exist.
	if(_CGA.tilesets[tileset]          == undefined){ let str = ["=E= Print: tileset is invalid."  ]; throw Error(str); }
	if(_CS.layers[layer]               == undefined){ let str = ["=E= Print: layer is invalid."    ]; throw Error(str); }
	if(_CGA.tilemaps[tileset][tilemap] == undefined){ let str = ["=E= Print: tilemap is invalid."  ]; throw Error(str); }

	// Make sure that only a whole number makes it through.
	x = (x) << 0;
	y = (y) << 0;
	let startx = x;

	// We need to use the original tilemap array for printing.
	let fontmap = core.GRAPHICS.ASSETS._original_data.tilemaps[tileset][tilemap];
	let fontmap_len = fontmap.length -2 ; // -2 is for skipping the first two indexes.)

	// Turn the string into an iterable array and draw each letter individually.
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
			if(x >= _CS.VRAM_TILES_H)     {
				// console.log("Out of bounds: x", "x:", x, "core.SETTINGS.VRAM_TILES_H:", core.SETTINGS.VRAM_TILES_H);
				return;
			}
			// Out of bounds on y?
			else if(y >= _CS.VRAM_TILES_V){
				// console.log("Out of bounds: y", "y:", y, "core.SETTINGS.VRAM_TILES_V:", core.SETTINGS.VRAM_TILES_V);
				return;
			}
			// Draw the tile.
			else{
				let tileindex = fontmap[ tileid+2 ];
				core.GRAPHICS.FUNCS.DrawTile(x, y, tileset, tileindex, layer, flags);
			}
		}

		// If it is out of bounds, (such as the "|" character) print a space.
		else {
			let tileindex = " ".toUpperCase().charCodeAt() - 32;
			core.GRAPHICS.FUNCS.DrawTile(x, y, tileset, tileindex, layer, flags);
		}

		// Move the "cursor" over one to the right.
		x+=1;

		// No wrapping allowed.
		if(x>=_CS.VRAM_TILES_H-0){ return; }
		if(y>=_CS.VRAM_TILES_V-0){ return; }
	});
}
// _DOC_ | Print_multiFont | Draw a text string to the screen (using multiple fonts.)
core.GRAPHICS.FUNCS.Print_multiFont          = function(data){
	// Example usage:
	// core.GRAPHICS.FUNCS.Print_multiFont(
	// 	{
	// 		"x"       : 0,
	// 		"y"       : 0,
	// 		"text"    : "I use multiple fonts!" ,
	// 		"font"    : "010101010101010101010".split("").map(function(d){ return parseInt(d,10); }) ,
	// 		"maps"    : [ "font_black", "font_white" ],
	// 		"tileset" : "tilesTX1",
	// 		"layer"   : "TEXT",
	// 		"flags"   : {}
	// 	},
	// );

	// Font maps should be 64 characters (plus 2 for the width/height of the map.)
	// Font tiles are expected to be in the following order in the fontmap:
	//    !  "  #  $  %  &  '  (  )  *  +  ,  -  .  /
	// 0  1  2  3  4  5  6  7  8  9  :  ;  <  =  >  ?
	// @  A  B  C  D  E  F  G  H  I  J  K  L  M  N  O
	// P  Q  R  S  T  U  V  W  X  Y  Z  [  c  ]  ^  _

	// Confirm that all arguments were provided.
	if(data.tileset == undefined){ let str = ["=E= Print_multiFont: tileset is undefined."  ]; throw Error(str); }
	if(data.layer   == undefined){ let str = ["=E= Print_multiFont: layer is undefined."    ]; throw Error(str); }
	if(data.flags   == undefined){ let str = ["=E= Print_multiFont: flags is undefined."    ]; throw Error(str); }

	// Make sure that the specified tileset, tileindex, and layer exist.
	if(_CGA.tilesets[data.tileset] == undefined){ let str = ["=E= Print_multiFont: tileset is invalid."  ]; throw Error(str); }
	if(_CS.layers[data.layer]      == undefined){ let str = ["=E= Print_multiFont: layer is invalid."    ]; throw Error(str); }
	data.maps.forEach(function(d){
		let map = d;
		if(!core.GRAPHICS.ASSETS._original_data.tilemaps[data.tileset][map]){
			let str = ["=E= Print_multiFont: Map not valid: ", data.tileset, map ];
			throw Error(str);
		}
	});

	// Make sure that only a whole number makes it through.
	let x = (data.x) << 0;
	let y = (data.y) << 0;
	let startx = x;

	// Turn the string into an iterable array.
	Array.from( data.text ).forEach(function(d,i){
		// Move down a line if a line break is found.
		if(d=="\n"){ x=startx; y+=1; return; }

		// Determine which fontmap will be used.
		// NOTE: We need to use the original tilemap array for printing.
		let fontmap = core.GRAPHICS.ASSETS._original_data.tilemaps[ data.tileset][data.maps[data.font[i]] ];

		// NOTE: Fontsets should all be the same length.
		let fontmap_len = fontmap.length -2 ; // -2 is for skipping the first two indexes.)

		// Get the tileid for this character.
		tileid = d.toUpperCase().charCodeAt() - 32;

		// Make sure this is a valid tile in the font map (bounds-check.)
		if(tileid < fontmap_len){
			let tileindex = fontmap[ tileid+2 ];
			core.GRAPHICS.FUNCS.DrawTile(x, y, data.tileset, tileindex, data.layer, data.flags);
		}

		// If it is out of bounds, (such as the "|" character) print a space.
		else {
			let tileindex = " ".toUpperCase().charCodeAt() - 32;
			core.GRAPHICS.FUNCS.DrawTile(x, y, data.tileset, tileindex, data.layer, data.flags);
		}

		// Move the "cursor" over one to the right.
		x+=1;

		// No wrapping allowed.
		if(x>=core.SETTINGS.VRAM_TILES_H-0){ return; }
		if(y>=core.SETTINGS.VRAM_TILES_V-0){ return; }
	});

}

//
core.GRAPHICS.FUNCS.placeTile                 = function(data){
	let newVRAM_entry = data.newVRAM_entry       ;
	let layerType     = newVRAM_entry.layerType  ;
	let __calledBy    = newVRAM_entry.__calledBy ;
	let layer         = newVRAM_entry.layer      ;
	let flags         = newVRAM_entry.flags      ;

	// Add the newVRAM_entry to the specified layer's VRAM/SPRITES.
	if     (layerType=="VRAM")  {
		let x  = (newVRAM_entry.x / _CS.TILE_WIDTH ) << 0;
		let y  = (newVRAM_entry.y / _CS.TILE_HEIGHT) << 0;

		// Adjust VRAM. (One entry.)
		if     (__calledBy=="DrawTile"){
			addr = (y*_CS.VRAM_TILES_H)+x;
			newVRAM_entry.flags.OFF = false ;
			core.GRAPHICS.DATA.VRAM[layer][addr] = newVRAM_entry;

			core.GRAPHICS.DATA.VRAM[layer][addr].index_VRAM   = addr;
			core.GRAPHICS.DATA.VRAM[layer][addr].index_SPRITE = undefined;

			// console.log(__calledBy, layer, addr, newVRAM_entry);
		}

		// Adjust VRAM. (Multiple entries.)
		else if(__calledBy=="DrawMap"){
			// Start VRAM index.
			let addr_1    = (y*_CS.VRAM_TILES_H)+x;

			let mapWidth      = data.mapWidth            ;
			let mapHeight     = data.mapHeight           ;

			// Go through all VRAM indexes that would be used if this map were made up of tiles.
			for(let _y=0; _y < mapHeight; _y += 1){
				for(let _x=0; _x < mapWidth; _x += 1){
					// What is the next VRAM index?
					let thisAddr = addr_1 + ( (_y * _CS.VRAM_TILES_H) + _x );

					// First index gets the newVRAM_entry.
					if(thisAddr==addr_1){
						newVRAM_entry.flags.OFF = false ;
						newVRAM_entry.index_VRAM=thisAddr;
						newVRAM_entry.index_SPRITE=undefined;
						core.GRAPHICS.DATA.VRAM[layer][thisAddr] = newVRAM_entry;
					}
					// Other indexes get turned off.
					else{
						// Set this tile to be OFF.
						let existingObj = core.GRAPHICS.DATA.VRAM[layer][thisAddr];
						existingObj.flags.OFF = true ;
						existingObj.index_VRAM=thisAddr;
						existingObj.index_SPRITE=undefined;

						// Set this tile to be transparent.
						// existingObj.flags.OFF = false ;
						// existingObj.tileset   = "default_tileset" ;
						// existingObj.tilemap   = "" ;
						// existingObj.tileindex = 1 ;
					}
				}
			}

			// console.log(__calledBy, layer, addr_1, newVRAM_entry);

		}
	}
	else if(layerType=="SPRITE"){
		// Set to the specified spriteNum index in SPRITES.
		newVRAM_entry.index_VRAM   = flags.spriteIndex;
		newVRAM_entry.index_SPRITE = undefined;
		core.GRAPHICS.DATA.SPRITES[layer][flags.spriteIndex]=newVRAM_entry;

		// console.log(__calledBy, layer, flags.spriteIndex, newVRAM_entry);
	}

}
//
core.GRAPHICS.FUNCS.addTileFlagChangesToQueue = function(imgData, newVRAM_entry, hash){
	// Create the object.
	let newObj = {
		"imgData_buffer" : imgData.data.buffer.slice(0) ,
		"newVRAM_entry"  : newVRAM_entry
	};

	// Add the object to the queue.
	core.GRAPHICS.WORKERS.w_colorswaps.queue.push(newObj);
};
//
core.GRAPHICS.FUNCS.runTileFlagChangesQueue   = function(){
	return new Promise(function(res,rej){
		let workers = [
		];

		//
		for(let i=0; i<window.navigator.hardwareConcurrency; i+=1){
			workers.push( core.GRAPHICS.WORKERS.w_colorswaps.worker[i] );
		}

		let proms = [];

		let num_per_worker = core.GRAPHICS.WORKERS.w_colorswaps.queue.length / window.navigator.hardwareConcurrency;
		let curIndex=0;
		workers.forEach(function(d, workerNum){
			proms.push(
				new Promise(function(res_inner, rej_inner){
					let worker = d;
					let img_buffers_arr = [] ;
					let newVRAM_entries = [] ;
					let transferList    = [] ;

					worker.onmessage = function(){
						switch( event.data.function ){
							// imgData manipulation for color swaps.
							case "colorswaps" : {
								let imgDatas=event.data.finished_img_buffers_arr;
								let newVRAMs=event.data.finished_newVRAM_entries;

								for(let i=0; i<newVRAMs.length; i+=1){
									// Convert the imgData back into an imgData object.
									let img_buff = imgDatas[i] ;
									let img_view = new Uint8ClampedArray(img_buff) ;
									let newVRAM  = newVRAMs[i] ;
									let flags    = newVRAMs[i].flags ;

									// Create the src canvas from the imgData.
									let src_canvas    = document.createElement("canvas");  ;
									src_canvas.width  = newVRAM.w ;
									src_canvas.height = newVRAM.h ;
									JSGAME.SHARED.setpixelated(src_canvas);
									let src_ctx     = src_canvas.getContext("2d") ;
									src_ctx.putImageData(
										new ImageData(img_view, src_canvas.width, src_canvas.height) ,
										0,
										0
									);
									let newX=0;
									let newY=0;

									// Create the destination canvas.
									let dst_canvas    = document.createElement("canvas");  ;
									dst_canvas.width  = src_canvas.width ;
									dst_canvas.height = src_canvas.height ;
									JSGAME.SHARED.setpixelated(dst_canvas);
									let dst_ctx     = dst_canvas.getContext("2d") ;

									if(flags.ROT !== false || flags.FLIP_X || flags.FLIP_Y){
										if( flags.ROT ){
											let size = Math.max(src_canvas.width, src_canvas.height);
											dst_canvas.width   = size ;
											dst_canvas.height  = size ;

											dst_ctx.translate(src_canvas.width/2, src_canvas.height/2);
											dst_ctx.rotate(flags.ROT * Math.PI/180);
											dst_ctx.translate(-src_canvas.width/2, -src_canvas.height/2);
										}

										// FLIP_X and/or FLIP_Y?
										if( flags.FLIP_X || flags.FLIP_Y ){
											let scaleH = flags.FLIP_X ? -1                     : 1; // Set horizontal scale to -1 if flip horizontal
											let scaleV = flags.FLIP_Y ? -1                     : 1; // Set verical scale to -1 if flip vertical
											newX       = flags.FLIP_X ? src_canvas.width  * -1 : 0; // Set x position to -100% if flip horizontal
											newY       = flags.FLIP_Y ? src_canvas.height * -1 : 0; // Set y position to -100% if flip vertical
											dst_ctx.scale(scaleH, scaleV);             // Set scale to flip the image
										}
									}

									// Draw the src_canvas to the dst_canvas.
									dst_ctx.drawImage(src_canvas,newX,newY);

									newVRAM.canvas         = dst_canvas ;
									// newVRAM.canvas         = src_canvas ;
									newVRAM.imgData        = undefined ;
									newVRAM.flags.drawThis = true ;
									core.GRAPHICS.DATA.FLAGS[newVRAM.layer].UPDATE=true;

									core.GRAPHICS.FUNCS.placeTile({
										"mapWidth"      : (newVRAM.canvas.width   / _CS.TILE_WIDTH ) << 0 ,
										"mapHeight"     : (newVRAM.canvas.height  / _CS.TILE_HEIGHT) << 0 ,
										"newVRAM_entry" : newVRAM ,
									});
								}

								// setTimeout(function(){
									res_inner();
								// },100);

								break;
							}

							// Unmatched function.
							default     : { break; }
						}
					};

					//
					let cnt=0;
					let len = core.GRAPHICS.WORKERS.w_colorswaps.queue.length;
					for(let i=curIndex; i<len; i+=1){
						// if( (cnt==num_per_worker) ) { console.log(cnt, num_per_worker); break; }

						// Add data.
						let rec = core.GRAPHICS.WORKERS.w_colorswaps.queue[i];
						img_buffers_arr.push( rec.imgData_buffer );
						newVRAM_entries.push( rec.newVRAM_entry  );

						// Add the data to the transfer list as a copy.
						// transferList.push( rec.imgData_buffer );

						//
						curIndex=i;
						// cnt+=1;
					}

					let msg = {
						"function"          : "colorswaps"      ,
						"img_buffers_arr"   : img_buffers_arr   ,
						"newVRAM_entries"   : newVRAM_entries   ,
					};

					console.log("workerNum:", workerNum, "gets curIndex of:", len);

					// Send the data to the worker.
					worker.postMessage(
						msg ,
						transferList
					);

				})
			);
		});

		Promise.all(proms).then(
			function(data){
				// Clear the onmessage listener.
				for(let i=0; i<window.navigator.hardwareConcurrency; i+=1){
					// workers[i].onmessage=null;
				}

				// Clear the queue.
				core.GRAPHICS.WORKERS.w_colorswaps.queue=[];


				// Resolve the outer promise.
				res();
			},
			function(err){
				console.log("err:", err);
			}
		);
		// Clear the queue.
		// core.GRAPHICS.WORKERS.w_colorswaps.queue=[];
	});
}
//
core.GRAPHICS.FUNCS.colorSwaps = function(imgData, newVRAM_entry){
	// We will need the imgData version of the canvas.

	// Get a handle to our worker.
	let worker      = core.GRAPHICS.WORKERS.w_colorswaps.worker;
	let activeCount = core.GRAPHICS.WORKERS.w_colorswaps.activeCount;

	// Send the data to the worker.
	worker.postMessage(
		{
			"function"      : "colorswaps"        ,
			"imgData"       : imgData.data.buffer ,
			"imgData_w"     : imgData.width       ,
			"imgData_h"     : imgData.height      ,
			"activeCount"   : activeCount         ,
			"newVRAM_entry" : newVRAM_entry       ,
		},
		[
			imgData.data.buffer
		]
		);

	//
	core.GRAPHICS.WORKERS.w_colorswaps.done[activeCount]=false;

	// Adjust the worker active usage count.
	core.GRAPHICS.WORKERS.w_colorswaps.activeCount += 1;
};

/*
https://www.diffnow.com
*/