'use strict';

/**
 * @summary Holds the canvas elements.
 * @global
*/
core.GRAPHICS.canvas       = {} ;

/**
 * @summary Holds the canvas contexts.
 * @global
*/
core.GRAPHICS.ctx          = {} ;

/**
 * @summary Holds the ImageData form for some layer(s).
 * @global
*/
core.GRAPHICS.imgData      = {
	pre_OUTPUT : {
		"whole":null,
		"slices":[],
	}
} ;

/**
 * @summary Holds data such as FLAGS, VRAM, SPRITES, lookups.
 * @global
*/
core.GRAPHICS.DATA         = {
	FLAGS   : {
		OUTPUT : {
			"x_offset" : 0 , // Specifies the drawing x offset for the final OUTPUT layer draw.
			"y_offset" : 0 , // Specifies the drawing y offset for the final OUTPUT layer draw.
		}
	},
	// Holds tile objects for each vram layer.
	VRAM    : {},
	// Holds tile objects for each sprite layer.
	SPRITES : {},
	// Holds a table for color lookups/comparisons
	lookups : {},
} ;

/**
 * @summary Holds tileset and tilemap assets.
 * @global
*/
core.GRAPHICS.ASSETS       = {
	"tilesets"       : {}, // All tiles, separated by their tileset name. (Tiles are canvas images.)
	"tilemaps"       : {}, // All tilemaps, separated by their tileset name. (Tilemaps are complete images.)
	"_original_data" : {}  // Original Uzebox format tilesets/tilemaps. (Tiles as raw Uzebox data, tilemaps as tileset indexes.)
} ;

/**
 * @summary Web workers.
 * @global
*/
core.GRAPHICS.WORKERS      = {
	// An array of workers. (Quantity set during init.)
	"WORKERS" : [],

	// Shared error callback for workers.
	"error_CALLBACK" : function(event){
		console.log("something has went wrong with a webworker.", event);
	},

	// Shared finishing function for workers.
	"CALLBACK" : function(event){
		return new Promise(function(callback_res, callback_rej){

			switch( event.data.function ){
				// ImageDate manipulation for color swaps.
				case "colorswaps" : {
					let imgDatas=event.data.finished_img_buffers_arr;
					let newVRAMs=event.data.finished_newVRAM_entries;

					// Go through each of the newVRAM entries.
					for(let i=0; i<newVRAMs.length; i+=1){
						// Convert the imgData back into an imgData object.
						let img_buff = imgDatas[i] ;
						let img_view = new Uint8ClampedArray(img_buff) ;
						let newVRAM  = newVRAMs[i] ;
						let flags    = newVRAMs[i].flags ;

						// Create the src canvas from the imgData.
						let src_canvas    = document.createElement("canvas");
						src_canvas.width  = newVRAM.w ;
						src_canvas.height = newVRAM.h ;
						JSGAME.SHARED.setpixelated(src_canvas);
						let src_ctx     = src_canvas.getContext("2d") ;
						src_ctx.putImageData(
							new ImageData(img_view, src_canvas.width, src_canvas.height) ,
							0,
							0
						);

						// Rotation? FLIP_X? FLIP_Y? (or none of those.)
						let obj = core.GRAPHICS.FUNCS.INTERNAL.ROT_FLIPX_FLIPY(src_canvas, newVRAM);
						let dst_canvas = obj.canvas;
						let dst_ctx    = obj.ctx   ;
						let newX       = obj.newX  ;
						let newY       = obj.newY  ;

						// Make sure the canvases are pixelated.
						JSGAME.SHARED.setpixelated(src_canvas);
						JSGAME.SHARED.setpixelated(dst_canvas);

						// *** Draw the src_canvas to the dst_canvas. ***

						// Adjust the source image if the destination container was rotated.
						if( (flags.ROT !== false && flags.ROT !== 0) ){
							dst_ctx.drawImage(
								src_canvas,
								newX+newVRAM.x_offset,
								newY+newVRAM.y_offset
							);
						}
						// Draw the source image as-is.
						else{
							dst_ctx.drawImage(src_canvas, newX, newY);
						}

						// Save the new canvas to the canvas key in the newVRAM object.
						newVRAM.canvas         = dst_canvas ;
						newVRAM.imgData        = undefined ;

						// Place the tile.
						core.GRAPHICS.FUNCS.INTERNAL.placeTile({
							"mapWidth"      : (newVRAM.canvas.width   / _CS.TILE_WIDTH ) << 0 ,
							"mapHeight"     : (newVRAM.canvas.height  / _CS.TILE_HEIGHT) << 0 ,
							"newVRAM_entry" : newVRAM ,
						});
					}

					// Resolve.
					if(1){ callback_res(); }
					else { callback_rej(); }

					break;
				}

				// Whole-screen fade effect.
				case "fade" : {
					// Get values from the worker.
					let x              = event.data.x              ;
					let y              = event.data.y              ;
					let w              = event.data.w              ;
					let h              = event.data.h              ;
					let imgData_buffer = event.data.finished_img_buff ;

					// Convert the arraybuffer to ImageData.
					let imgData_view8  = new Uint8ClampedArray(imgData_buffer) ;
					let imgData        = new ImageData(imgData_view8, w, h) ;

					// Use putImageData on the pre_OUTPUT.
					let tempOutput_ctx = core.GRAPHICS.ctx.pre_OUTPUT;
					tempOutput_ctx.putImageData( imgData , x, y );

					// Resolve.
					if(1){ callback_res(); }
					else { callback_rej(); }

					break;
				}

				// Unmatched function.
				default     : { break; }
			}

		});
	},

	// Object for controlling canvas image color-swaps.
	"w_colorswaps" :{
		"queue"       : [] , // An array of arrays. Each outer array is for the same indexed worker.
		"queuedCount" : 0  ,
	},

	// Object for controlling whole-screen fades.
	"w_fade" :{
		"fadeTable_fullOff"      : 0     , // Index into fadeTable for full off.
		"fadeTable_fullOn"       : 13    , // Index into fadeTable for full on.
		"fadeLevel_min"          : 1     , // Min usable index into fadeTable.
		"fadeLevel_max"          : 12    , // Max usable index into fadeTable.

		"fadeLevel"              : 13    , // Index into fadeTable.

		"msBeforeChange"         : 0       , // performance.now() milliseconds before the next change.
		"lastChange"             : 0       , // performance.now() timestamp of the last change.

		"fadeDirection"          : 1     , // 1 means go up fadeLevels. -1 means go down fadeLevels.
		"stayBlack"              : false , // If true then on a fade down the output will remain black until cleared.

		// The rgb values for each fade level.
		"fadeTable": [
			//                               INDEX BB GGG RRR  B G R    DEC   HEX
			{ b: 0  , g: 0   , r: 0   } , // 0     00 000 000  0 0 0  , 0   , 0x00
			{ b: 0  , g: 0   , r: 0   } , // 1     00 000 000  0 0 0  , 0   , 0x00

			{ b: 33 , g: 0   , r: 0   } , // 2     01 000 000  1 0 0  , 64  , 0x40
			{ b: 66 , g: 14  , r: 0   } , // 3     10 001 000  2 1 0  , 136 , 0x88
			{ b: 66 , g: 28  , r: 14  } , // 4     10 010 001  2 2 1  , 145 , 0x91
			{ b: 100, g: 28  , r: 28  } , // 5     11 010 010  3 2 2  , 210 , 0xD2
			{ b: 100, g: 57  , r: 57  } , // 6     11 100 100  3 4 4  , 228 , 0xE4
			{ b: 66 , g: 71  , r: 71  } , // 7     10 101 101  2 5 5  , 173 , 0xAD
			{ b: 66 , g: 85  , r: 71  } , // 8     10 110 101  2 6 5  , 181 , 0xB5
			{ b: 66 , g: 85  , r: 85  } , // 9     10 110 110  2 6 6  , 182 , 0xB6
			{ b: 66 , g: 100 , r: 85  } , // 10    10 111 110  2 7 6  , 190 , 0xBE
			{ b: 66 , g: 100 , r: 100 } , // 11    10 111 111  2 7 7  , 191 , 0xBF

			{ b: 100, g: 100 , r: 100 } , // 12    11 111 111  3 7 7  , 255 , 0xFF
			{ b: 100, g: 100 , r: 100 } , // 13    11 111 111  3 7 7  , 255 , 0xFF
		],
	}
};

/**
 * @summary PERFORMANCE MONITORING (layer draw timings, etc.)
 * @global
*/
core.GRAPHICS.performance  = {
	// Declared/defined by GRAPHICS.init.
	"LAYERS" : {
		// BG1  : [ 0, 0, 0, 0, 0 ] , //
		// BG2  : [ 0, 0, 0, 0, 0 ] , //
		// TEXT : [ 0, 0, 0, 0, 0 ] , //
		// SP1  : [ 0, 0, 0, 0, 0 ] , //
	},

	//
	"gfx_timings"     : [] ,
	"doColorSwapping" : [] ,
	"update_layers"   : [] ,
	"layer_combines"  : [] ,
	"fade_timings"    : [] ,
	"output_timings"  : [] ,
};

/**
 * @summary   Holds the core functions to this video mode.
 * @namespace "core.GRAPHICS.FUNCS"
*/
core.GRAPHICS.FUNCS        = {
	/**
	 * USER-ACCESSIBLE DRAW FUNCTIONS.
	 * @summary   USER-ACCESSIBLE DRAW FUNCTIONS.
	 * @namespace "core.GRAPHICS.FUNCS.USER"
	*/
	USER : {
		/**
		 * @summary   Used to specify the draw position coords on the OUTPUT canvas.
		 * @memberof "core.GRAPHICS.FUNCS.USER"
		 * @param    {number} x_offset Offset the drawing x position by this many pixels.
		 * @param    {number} y_offset Offset the drawing y position by this many pixels.
		 *
		 * @example _CGFU.adjustOutputOffsets(8,8);   // Draw the OUTPUT down and to the right by 8 pixels.
		 * @example _CGFU.adjustOutputOffsets(0,0);   // Return offsets to the default position.
		 * @example _CGFU.adjustOutputOffsets(-8,-8); // Draw the OUTPUT up and to the left by 8 pixels.
		 */
		adjustOutputOffsets : function(x_offset, y_offset){
			core.GRAPHICS.DATA.FLAGS.OUTPUT.x_offset = x_offset ;
			core.GRAPHICS.DATA.FLAGS.OUTPUT.y_offset = y_offset ;
		},

		/**
		 * @summary  Clears the SPRITE data and clears the existing canvas layers.
		 * @memberof "core.GRAPHICS.FUNCS.USER"
		 * @param    {string} layer Specify the layer to clear.
		 *
		 * @example _CGFU.ClearSprites("BG1"); // Clear one layer.
		 * @example _CGFU.ClearSprites();      // Clear all layers.
		 */
		ClearSprites     : function(layer){
			let layersToClear=[];

			// If a layer was not specifed then clear all layers.
			if(layer==undefined){
				let layers = Object.keys(core.SETTINGS.layers);
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

				core.GRAPHICS.DATA.SPRITES[layer].length=0;

				// Set this layer to update. (Needed?)
				core.GRAPHICS.DATA.FLAGS[layer].UPDATE=true;
				core.GRAPHICS.DATA.FLAGS[layer].REDRAW=true;

				// Clear the canvas.
				ctx.clearRect(0,0,w,h); // Full transparent.
			}
		},

		/**
		 * @summary  Clears the VRAM data and clears the existing canvas layers.
		 * @memberof "core.GRAPHICS.FUNCS.USER"
		 * @param    {string} layer
		 *
		 * @example _CGFU.ClearVram("BG1"); // Clear one layer.
		 * @example _CGFU.ClearVram();      // Clear all layers.
		 */
		ClearVram        : function(layer){
			let layersToClear=[];

			// If a layer was not specifed then clear all layers.
			if(layer==undefined){
				let layers = Object.keys(core.SETTINGS.layers);
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
				// let canvas = core.GRAPHICS.canvas[layer];
				// let ctx    = core.GRAPHICS.ctx[layer];
				// let w      = canvas.width;
				// let h      = canvas.height;

				// Determine how to clear the region.
				let clearWith = core.GRAPHICS.DATA.FLAGS[layer].clearWith       ;

				if     (clearWith=="black")      {
					if     (core.GRAPHICS.DATA.FLAGS[layer].type=="VRAM")  {
						let y=0;
						let x=0;
						for(let i=0; i<core.GRAPHICS.DATA.VRAM[layer].length; i+=1){
							if(x>=core.SETTINGS.VRAM_TILES_H){ x=0; y+=1; }
							if(y>=core.SETTINGS.VRAM_TILES_V){ break;     }
							core.GRAPHICS.DATA.VRAM[layer][i] = core.GRAPHICS.FUNCS.INTERNAL.returnNewTile_obj();

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
							core.GRAPHICS.DATA.VRAM[layer][i] = core.GRAPHICS.FUNCS.INTERNAL.returnNewTile_obj();

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
				_CGFU.ClearSprites();

				// Clear the output canvas.
				_CGFU.ClearOUTPUT();
			}
		},

		/**
		 * @summary  Clear the OUTPUT canvas.
		 * @memberof "core.GRAPHICS.FUNCS.USER"
		 *
		 * @example _CGFU.ClearOUTPUT();
		 */
		ClearOUTPUT      : function(){
			let canvas = core.GRAPHICS.canvas.OUTPUT;
			core.GRAPHICS.ctx.OUTPUT.clearRect(0,0,canvas.w,canvas.h);
		},

		/**
		 * @summary  Clear all canvas layers and their data.
		 * @memberof "core.GRAPHICS.FUNCS.USER"
		 *
		 * @example _CGFU.clearAllCanvases();
		 */
		clearAllCanvases : function(){
			// Clear the VRAM, SPRITE, and OUTPUT layers and DATA.
			_CGFU.ClearSprites();
			_CGFU.ClearVram();
			_CGFU.ClearOUTPUT();

			// Clear each canvas.
			let layers = Object.keys(core.SETTINGS.layers);
			for(let i=0; i<layers.length; i+=1){
				let canvas = core.GRAPHICS.canvas[layers[i]];
				let ctx    = core.GRAPHICS.ctx[layers[i]];
				ctx.clearRect(0,0,canvas.w,canvas.h);
			}
		},

		/**
		 * @summary  Draws a canvas tile to the indicated area.
		 * @memberof "core.GRAPHICS.FUNCS.USER"
		 * @param    {number} x
		 * @param    {number} y
		 * @param    {string} tileset
		 * @param    {number} tileindex
		 * @param    {string} layer
		 * @param    {object} flags
		 *
		 * @example _CGFU.DrawTile(1, 0, "tilesBG1", 2, "BG1" , {} );
		 */
		DrawTile         : function(x, y, tileset, tileindex, layer, flags){
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

			core.GRAPHICS.FUNCS.INTERNAL.Adjust_NewTile_obj({
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
		},

		/**
		 * @summary  Draws a canvas tilemap to the indicated area.
		 * @memberof "core.GRAPHICS.FUNCS.USER"
		 * @param    {number} x
		 * @param    {number} y
		 * @param    {string} tileset
		 * @param    {string} tilemap
		 * @param    {string} layer
		 * @param    {object} flags
		 *
		 * @example _CGFU.DrawMap(7, 0, "tilesBG1", "main_bg_pattern2", "BG1" , {} );
		 */
		DrawMap          : function(x, y, tileset, tilemap , layer, flags){
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
			core.GRAPHICS.FUNCS.INTERNAL.Adjust_NewTile_obj({
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
		},

		/**
		 * @summary  Fill a region with a tile.
		 * @memberof "core.GRAPHICS.FUNCS.USER"
		 * @param    {number} x
		 * @param    {number} y
		 * @param    {number} w
		 * @param    {number} h
		 * @param    {string} tileset
		 * @param    {number} tileindex
		 * @param    {string} layer
		 * @param    {object} flags
		 *
		 * @example _CGFU.TileFill(4, 0, 2, 2, "tilesBG1", 1, "BG1" , {} );
		 */
		TileFill         : function(x, y, w, h, tileset, tileindex, layer, flags){
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
			let layerType      = core.GRAPHICS.DATA.FLAGS[layer].type;
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
						_CGFU.DrawTile(x+xpos, y+ypos, tileset, tileindex, layer, flags);
					}
				}
			}

		},

		/**
		 * @summary  Draw a tilemap to cover a region of varying dimensions. (Each dimension being a multiple of w and h.)
		 * @memberof "core.GRAPHICS.FUNCS.USER"
		 * @param    {number} sx
		 * @param    {number} sy
		 * @param    {number} nw
		 * @param    {number} nh
		 * @param    {string} tileset
		 * @param    {string} tilemap
		 * @param    {string} layer
		 * @param    {object} flags
		 *
		 * @example _CGFU.MapFill(28, 0 , 4 , 2 , "tilesBG1", "main_bg_pattern2", "BG1" , {}   );
		 */
		MapFill          : function(sx, sy, nw, nh, tileset, tilemap, layer, flags){
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
					_CGFU.DrawMap( (x+sx), (y+sy), tileset, tilemap, layer, flags);
				}
			}

		},

		/**
		 * @summary  Draw a text string to the screen (one tile at a time.)
		 * @memberof "core.GRAPHICS.FUNCS.USER"
		 * @param    {number} x
		 * @param    {number} y
		 * @param    {string} string
		 * @param    {string} tileset
		 * @param    {string} tilemap
		 * @param    {string} layer
		 * @param    {string} flags
		 *
		 * @example // Print a line of test. (Includes color swaps.)
			* _CGFU.Print(4, 11, "FONT TEST 0 ABCD1234.", "tilesTX1", "font1", "TEXT", { "colorSwaps":[ ["#FFFFFF", "#FF2400"] ] }  );
		 * @example // Print a line of test.
			* _CGFU.Print(4, 12, "FONT TEST 1 ABCD1234.", "tilesTX1", "font1", "TEXT", { }  );
		 */
		Print            : function(x, y, string, tileset, tilemap, layer, flags){
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
			Array.from( string ).forEach(function(d){
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
						_CGFU.DrawTile(x, y, tileset, tileindex, layer, flags);
					}
				}

				// If it is out of bounds, (such as the "|" character) print a space.
				else {
					let tileindex = " ".toUpperCase().charCodeAt() - 32;
					_CGFU.DrawTile(x, y, tileset, tileindex, layer, flags);
				}

				// Move the "cursor" over one to the right.
				x+=1;

				// No wrapping allowed.
				if(x>=_CS.VRAM_TILES_H-0){ return; }
				if(y>=_CS.VRAM_TILES_V-0){ return; }
			});
		},

		/**
		 * @summary  Draw a text string to the screen (using multiple fonts.) (one tile at a time.)
		 * @memberof "core.GRAPHICS.FUNCS.USER"
		 * @param    {object} data
		 *
		 * @example	// Pass in a completed object.
			* _CGFU.Print_multiFont(data) ;
		 * @example // Pass an object inline.
			* _CGFU.Print_multiFont(
			* {
			*	"x"       : 4,
			*	"y"       : 16,
			*	"text"    : "MULTI FONT TEST 5 1234." ,
			*	"font"    : "01010101010101010101010".split("").map(function(d){ return parseInt(d,10); }) ,
			*	"maps"    : [
			*		{ "tileset":"tilesTX1", "font":"font1", "flags":{ "colorSwaps":[ ["#484891", "#999999"] ] } },
			*		{ "tileset":"tilesTX1", "font":"font1", "flags":{ "colorSwaps":[ ["#484891", "#444444"] ] } },
			*	],
			*	"layer"   : "TEXT",
			* }
			* );
		 */
		Print_multiFont  : function(data){
			// Font maps should be 64 characters (plus 2 for the width/height of the map.)
			// Font tiles are expected to be in the following order in the fontmap:
			//    !  "  #  $  %  &  '  (  )  *  +  ,  -  .  /
			// 0  1  2  3  4  5  6  7  8  9  :  ;  <  =  >  ?
			// @  A  B  C  D  E  F  G  H  I  J  K  L  M  N  O
			// P  Q  R  S  T  U  V  W  X  Y  Z  [  c  ]  ^  _

			// Make sure that the specified tileset, tilemap, and layer exist.
			data.maps.forEach(function(d){
				let map = d.font;
				let tileset = d.tileset;

				// Valid tileset?
				if(!_CGA.tilesets[tileset]){
					let str = ["=E= Print_multiFont: Tilemap not valid: ", tileset, map ];
					throw Error(str);
				}

				// Valid tilemap?
				if(!_CGA._original_data.tilemaps[tileset][map]){
					let str = ["=E= Print_multiFont: Map not valid: ", tileset, map ];
					throw Error(str);
				}
			});
			if(data.layer             == undefined){ let str = ["=E= Print_multiFont: layer is undefined." ]; throw Error(str); }
			if(_CS.layers[data.layer] == undefined){ let str = ["=E= Print_multiFont: layer is invalid."   ]; throw Error(str); }

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
				let map_obj = data.maps[ data.font[i] ] ;
				let flags   = map_obj.flags ;
				let tileset = map_obj.tileset ;
				let fontmap = core.GRAPHICS.ASSETS._original_data.tilemaps [tileset] [ data.maps[ data.font[i] ].font ] ;
				if(flags   == undefined){ flags={}; }

				// NOTE: Fontsets should all be the same length.
				let fontmap_len = fontmap.length -2 ; // -2 is for skipping the first two indexes.)

				// Get the tileid for this character.
				let tileid = d.toUpperCase().charCodeAt() - 32;

				// Make sure this is a valid tile in the font map (bounds-check.)
				if(tileid < fontmap_len){
					let tileindex = fontmap[ tileid+2 ];
					_CGFU.DrawTile(x, y, tileset, tileindex, data.layer, flags);
				}

				// If it is out of bounds, (such as the "|" character) print a space.
				else {
					let tileindex = " ".toUpperCase().charCodeAt() - 32;
					_CGFU.DrawTile(x, y, tileset, tileindex, data.layer, flags);
				}

				// Move the "cursor" over one to the right.
				x+=1;

				// No wrapping allowed.
				if(x>=core.SETTINGS.VRAM_TILES_H-0){ return; }
				if(y>=core.SETTINGS.VRAM_TILES_V-0){ return; }
			});
		},

		/**
		 * @summary  Allows a full fade in or full fade out of the OUTPUT screen.
		 * @memberof "core.GRAPHICS.FUNCS.USER"
		 * @param    {string} fadeDirection
		 * @param    {number} speed
		 * @param    {boolean} stayBlack
		 *
		 * @example // Fade up from black to full color.
			 * _CGFU.chainFade('UP'  , 0, false);
		 * @example // Fade down from full color to black. (Once completed, immediately restore color.)
			 * _CGFU.chainFade('DOWN', 0, false);
		 * @example // Fade down from full color to black. (Once completed, remain at full black.)
			 * _CGFU.chainFade('DOWN', 0, true );
		*/
		chainFade : function(fadeDirection, speed, stayBlack){
			// _CGFU.chainFade("UP", 0, false);
			// _CGFU.chainFade("DOWN", 0, true);

			// Confirm that all arguments were provided.
			if(fadeDirection == undefined){ let str = ["=E= chainFade: fadeDirection is undefined.",fadeDirection ]; throw Error(str); }
			if(speed         == undefined){ let str = ["=E= chainFade: speed is undefined."        ,speed         ]; throw Error(str); }
			if(stayBlack     == undefined){ let str = ["=E= chainFade: stayBlack is undefined."    ,stayBlack     ]; throw Error(str); }

			// Confirm that the speed is valid.
			// if( [0,1,2].indexOf(speed) === -1 ){
			if( typeof speed !== "number" ){
				let str = ["=E= chainFade: speed is invalid.", speed ]; throw Error(str);
			}

			// Confirm that the stayBlack is valid.
			if( [true, false].indexOf(stayBlack) === -1 ){
				let str = ["=E= chainFade: stayBlack is invalid.", stayBlack ]; throw Error(str);
			}

			// Confirm that the fadeDirection is valid.
			if( ["UP", "DOWN"].indexOf(fadeDirection) === -1 ){
				let str = ["=E= chainFade: fadeDirection is invalid.", fadeDirection ]; throw Error(str);
			}

			// Convert the fadeDirection string to a number.
			if     (fadeDirection=="UP"  ){ fadeDirection =  1 ; }
			else if(fadeDirection=="DOWN"){ fadeDirection = -1 ; }
			else{
				// Fade direction is invalid. This is not allowed with chainFade.
				let str = ["=E= chainFade: fadeDirection is invalid.", fadeDirection ]; throw Error(str);
			}
			// Set the fade direction to the specifed value.
			core.GRAPHICS.WORKERS.w_fade.fadeDirection=fadeDirection;

			// Fade direction up?
			let newFadeLevel;
			if     (core.GRAPHICS.WORKERS.w_fade.fadeDirection ==  1){
				// Set the fade level to the default value for this fade direction.
				core.GRAPHICS.WORKERS.w_fade.fadeLevel=core.GRAPHICS.WORKERS.w_fade.fadeLevel_min;
				newFadeLevel=core.GRAPHICS.WORKERS.w_fade.fadeLevel;
			}
			// Fade direction down?
			else if(core.GRAPHICS.WORKERS.w_fade.fadeDirection == -1){
				// Set the fade level to the default value for this fade direction.
				core.GRAPHICS.WORKERS.w_fade.fadeLevel=core.GRAPHICS.WORKERS.w_fade.fadeLevel_max;
				newFadeLevel=core.GRAPHICS.WORKERS.w_fade.fadeLevel;
			}

			// Set stayBlack with the specified value.
			core.GRAPHICS.WORKERS.w_fade.stayBlack=stayBlack;

			// Set the new speed value.
			core.GRAPHICS.WORKERS.w_fade.msBeforeChange=speed;
			core.GRAPHICS.WORKERS.w_fade.lastChange=performance.now();

			// Set new value for the active state of the fade.
			let fadeTable_fullOff = core.GRAPHICS.WORKERS.w_fade.fadeTable_fullOff ;
			let fadeTable_fullOn  = core.GRAPHICS.WORKERS.w_fade.fadeTable_fullOn  ;
			core.GRAPHICS.WORKERS.w_fade.fadeActive = (newFadeLevel!== fadeTable_fullOn) && (newFadeLevel != fadeTable_fullOff) ;
		},

		/**
		 * @summary  Applies the specified fade level to the OUTPUT.
		 * @memberof "core.GRAPHICS.FUNCS.USER"
		 * @param    {number} fadeLevel
		 *
		 * @example // Set to full off (black) and remain.
			* _CGFU.setFade(0 );
		 * @example // Set to roughly half on and remain.
			* _CGFU.setFade(6);
		 * @example // Set to full on and remain.
			* _CGFU.setFade(13);
		 */
		setFade   : function(fadeLevel){
			// _CGFU.setFade(6);

			// Confirm that all arguments were provided.
			if(fadeLevel == undefined){ let str = ["=E= setFade: fadeLevel is undefined.", fadeLevel ]; throw Error(str); }

			// Confirm that the fadeLevel is valid.
			// let fadeLevel_min     = core.GRAPHICS.WORKERS.w_fade.fadeLevel_min     ;
			// let fadeLevel_max     = core.GRAPHICS.WORKERS.w_fade.fadeLevel_max     ;
			let fadeTable_fullOff = core.GRAPHICS.WORKERS.w_fade.fadeTable_fullOff ;
			let fadeTable_fullOn  = core.GRAPHICS.WORKERS.w_fade.fadeTable_fullOn  ;

			// Is the new fadeLevel valid?
			if(
				// Setting to value within range?
				(! (fadeLevel >= fadeTable_fullOff && fadeLevel <= fadeTable_fullOn) )
			){
				let str = ["=E= setFade: fadeLevel is invalid.", fadeLevel ]; throw Error(str);
			}

			// Set the fade direction as to not be affected by the normal chain fading.
			core.GRAPHICS.WORKERS.w_fade.fadeDirection=0;

			// Set the fade level to the specified value.
			core.GRAPHICS.WORKERS.w_fade.fadeLevel=fadeLevel;

			// Will stayBlack be set?
			if(fadeLevel==fadeTable_fullOff || fadeLevel == 0 || fadeLevel == 1){
				// Set stayBlack.
				core.GRAPHICS.WORKERS.w_fade.stayBlack=true;
			}
			else{
				// Clear stayBlack.
				core.GRAPHICS.WORKERS.w_fade.stayBlack=false;
			}

			// Set the new speed value.
			core.GRAPHICS.WORKERS.w_fade.msBeforeChange=0;
			core.GRAPHICS.WORKERS.w_fade.lastChange=performance.now();

			// Set new value for the active state of the fade.
			core.GRAPHICS.WORKERS.w_fade.fadeActive = (fadeLevel!== fadeTable_fullOn) && (fadeLevel != fadeTable_fullOff) ;
		},

		/**
		 * @summary  Handles all graphical updates ot the OUTPUT canvas.
		 * @memberof "core.GRAPHICS.FUNCS.USER"
		 *
		 * @example _CGFU.graphicsUpdate();
		 */
		graphicsUpdate       : function(){

			return new Promise(function(res_updateAllLayers, rej_updateAllLayers){
				let gfx_start ;
				if(JSGAME.FLAGS.debug) { gfx_start = performance.now(); }

				let errorHandler=function(name, err){
					let str = ["=E= graphicsUpdate: ("+name+") rejected promise.", err ];
					console.error("err: "+name+": ", err);
					throw Error(str);
				};

				// Get fade values.
				// let WORKERS_OBJ  = core.GRAPHICS.WORKERS  ;
				// let fadeLevel         = WORKERS_OBJ.w_fade.fadeLevel ;

				let fade = core.GRAPHICS.WORKERS.w_fade.fadeActive ;
				// core.GRAPHICS.WORKERS.w_fade.fadeLevel

				// Perform color swaps.
				let doColorSwapping_start ;
				if(JSGAME.FLAGS.debug) { doColorSwapping_start = performance.now(); }
				core.GRAPHICS.FUNCS.INTERNAL.doColorSwapping().then(
					function(){
						if(JSGAME.FLAGS.debug) { if(_CGP.doColorSwapping.length >=5){ _CGP.doColorSwapping.shift(); } _CGP.doColorSwapping.push(performance.now() - doColorSwapping_start); }

						// Update layers.
						let update_layers_timings_start ;
						if(JSGAME.FLAGS.debug) { update_layers_timings_start = performance.now(); }
						_CGFI.update_layers().then(
							function(drawOutput){
								if(JSGAME.FLAGS.debug) { if(_CGP.update_layers.length >=5){ _CGP.update_layers.shift(); } _CGP.update_layers.push(performance.now() - update_layers_timings_start); }

								// Do we draw?
								if(drawOutput || fade){
									// Combine layers.
									let layer_combines_start ;
									if(JSGAME.FLAGS.debug) { layer_combines_start = performance.now(); }
									_CGFI.update_layer_COMBINE().then(
										function(){
											if(JSGAME.FLAGS.debug) { if(_CGP.layer_combines.length >=5){ _CGP.layer_combines.shift(); } _CGP.layer_combines.push(performance.now() - layer_combines_start); }

											// Fade?
											let fade_timings_start;
											if(JSGAME.FLAGS.debug) { fade_timings_start = performance.now(); }
											_CGFI.update_layer_FADE().then(
												function(){
													if(JSGAME.FLAGS.debug) { if(_CGP.fade_timings.length >=5){ _CGP.fade_timings.shift(); } _CGP.fade_timings.push(performance.now() - fade_timings_start); }

													// Final output.
													let output_timings_start;
													if(JSGAME.FLAGS.debug) { output_timings_start = performance.now(); }
													_CGFI.update_layer_OUTPUT().then(
														function(){
															if(JSGAME.FLAGS.debug) { if(_CGP.output_timings.length >=5){ _CGP.output_timings.shift(); } _CGP.output_timings.push(performance.now() - output_timings_start); }
															if(JSGAME.FLAGS.debug) { if(_CGP.gfx_timings.length >=5){ _CGP.gfx_timings.shift(); } _CGP.gfx_timings.push(performance.now() - gfx_start); }

															if(1) { res_updateAllLayers(); }
															else  { rej_updateAllLayers(); }
															return;
														},
														function(err){ errorHandler("update_layer_OUTPUT", err); }
													);
												},
												function(err){ errorHandler("update_layer_FADE", err); }
											);
										},
										function(err){ errorHandler("update_layer_COMBINE", err); }
									);
								}
								else{
									res_updateAllLayers();
									return;
								}

							},
							function(err){ errorHandler("update_layers", err); }
						);
					},
					function(err){ errorHandler("doColorSwapping", err); }
				);
			});

		},
	},

	/**
	 * FUNCTIONS USED INTERNALLY
	 * @summary   FUNCTIONS USED INTERNALLY.
	 * @namespace "core.GRAPHICS.FUNCS.INTERNAL"
	*/
	INTERNAL : {
		// FUNCTIONS USED BY THE USER FUNCTIONS INTERNALLY.

		/**
		 * @summary  Returns a new VRAM tile object with default settings.
		 * @memberof "core.GRAPHICS.FUNCS.INTERNAL"
		 * @returns  object
		 *
		 * @example _CGFI.returnNewTile_obj();
		 */
		returnNewTile_obj   : function(){
			let output = 	{
				// Position and Dimension
				"x"               : 0                 , // Pixel-aligned x position.
				"y"               : 0                 , // Pixel-aligned y position.
				"w"               : _CS.TILE_WIDTH    , // Width in pixels.
				"h"               : _CS.TILE_HEIGHT   , // Height in pixels.

				"x_offset"        : 0 , // Used with rotated canvases to correct positioning.
				"y_offset"        : 0 , // Used with rotated canvases to correct positioning.

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
		},

		/**
		 * @summary  Used by DrawTile and DrawMap to draw.
		 * @memberof "core.GRAPHICS.FUNCS.INTERNAL"
		 * @param    {object} data
		 *
		 * @example _CGFI.Adjust_NewTile_obj(data);
		 */
		Adjust_NewTile_obj  : function(data){
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
			let layerType      = core.GRAPHICS.DATA.FLAGS[layer].type;

			// Determine grid-alignment based on layer type.
			if     (layerType == "VRAM"   ){ useGrid=true;  }
			else if(layerType == "SPRITE" ){ useGrid=false; }
			else{
				let str = ["=E= Adjust_NewTile_obj: ("+__calledBy+") layer type is invalid."];
				throw Error(str);
			}

			// All sprites need a sprite index.
			if( layerType == "SPRITE" && ( flags.spriteIndex==undefined ) ){
				let str = ["=E= Adjust_NewTile_obj: ("+__calledBy+") spriteIndex or useGrid is invalid."];
				throw Error(str);
			}

			// Get a new default tileObj.
			let newVRAM_entry = core.GRAPHICS.FUNCS.INTERNAL.returnNewTile_obj();

			// Set the tileset, tileindex, layer values.
			newVRAM_entry.tileset   = tileset   ;
			newVRAM_entry.layer     = layer     ;
			newVRAM_entry.layerType = layerType ;
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
			if( (flags.ROT !== false && flags.ROT !== 0) || flags.FLIP_X || flags.FLIP_Y || flags.colorSwaps.length){
				// Custom canvases will not have the tilemap or tileindex set.
				newVRAM_entry.tileindex = "";
				newVRAM_entry.tilemap   = "";
				newVRAM_entry.w         = imgObj.canvas.width  ;
				newVRAM_entry.h         = imgObj.canvas.height ;

				// Add to colorSwap queue?
				if(flags.colorSwaps.length){
					core.GRAPHICS.FUNCS.INTERNAL.addColorSwapToQueue(imgObj.imgData.data.buffer.slice(0), newVRAM_entry);
				}
				// No colorswap, just rotation and/or flipping?
				else if ( (flags.ROT !== false && flags.ROT !== 0) || flags.FLIP_X || flags.FLIP_Y ){

					// Rotation? FLIP_X? FLIP_Y?
					let obj = core.GRAPHICS.FUNCS.INTERNAL.ROT_FLIPX_FLIPY(imgObj.canvas, newVRAM_entry);
					let dst_canvas = obj.canvas;
					let dst_ctx    = obj.ctx   ;
					let newX       = obj.newX  ;
					let newY       = obj.newY  ;

					if( (flags.ROT !== false && flags.ROT !== 0) ){
						dst_ctx.drawImage(imgObj.canvas, newX+newVRAM_entry.x_offset, newY+newVRAM_entry.y_offset);
					}
					else{
						newVRAM_entry.w         = dst_canvas.width  ;
						newVRAM_entry.h         = dst_canvas.height ;
						dst_ctx.drawImage(imgObj.canvas, newX, newY);
					}

					// Set drawThis.
					// newVRAM_entry.flags.drawThis=true;

					// Set the UPDATE flag for this layer.
					// core.GRAPHICS.DATA.FLAGS[layer].UPDATE=true;

					newVRAM_entry.canvas         = dst_canvas ;
					// newVRAM_entry.canvas         = imgObj.canvas ;
					newVRAM_entry.imgData        = undefined ;

					// Place the tile.
					core.GRAPHICS.FUNCS.INTERNAL.placeTile({
						"mapWidth"      : (newVRAM_entry.w / _CS.TILE_WIDTH ) << 0 ,
						"mapHeight"     : (newVRAM_entry.h / _CS.TILE_HEIGHT) << 0 ,
						"newVRAM_entry" : newVRAM_entry ,
					});
				}
			}
			// No changes. Just draw as-is.
			else{
				// Set w, h values.
				newVRAM_entry.w = imgObj.canvas.width ;
				newVRAM_entry.h = imgObj.canvas.height ;

				newVRAM_entry.x_offset = 0 ;
				newVRAM_entry.y_offset = 0 ;

				newVRAM_entry.canvas  = undefined ;
				newVRAM_entry.imgData = undefined ;

				// Set drawThis.
				// newVRAM_entry.flags.drawThis=true;

				// Set the UPDATE flag for this layer.
				// core.GRAPHICS.DATA.FLAGS[layer].UPDATE=true;

				// Place the tile.
				_CGFI.placeTile({
					"mapWidth"      : (imgObj.canvas.width   / _CS.TILE_WIDTH ) << 0 ,
					"mapHeight"     : (imgObj.canvas.height  / _CS.TILE_HEIGHT) << 0 ,
					"newVRAM_entry" : newVRAM_entry ,
				});
			}
		},

		/**
		 * @summary  Reads from the colorswapping queue and performs the colorswaps with webworkers. Draws image AFTER colorswaps complete.
		 * @memberof "core.GRAPHICS.FUNCS.INTERNAL"
		 *
		 * @example _CGFI.doColorSwapping();
		 */
		doColorSwapping     : function(){
			return new Promise(function(res,rej){
				// res(); return;
				// Early exit?
				if(!core.GRAPHICS.WORKERS.w_colorswaps.queuedCount){ res(); return; }

				// Each for each queue.
				let workers = core.GRAPHICS.WORKERS.WORKERS ;
				let queues  = core.GRAPHICS.WORKERS.w_colorswaps.queue ;

				let proms=[];

				for(let queueNum=0; queueNum<queues.length; queueNum+=1){

					proms.push(
						new Promise(
							function(res_inner, rej_inner){
								let thisQueue       = queues[queueNum]  ;
								let worker          = workers[queueNum] ;
								let img_buffers_arr = []                ;
								let newVRAM_entries = []                ;
								let transferList    = []                ;

								let queueLen=thisQueue.length;
								for(let i=0; i<queueLen; i+=1){
									let rec = thisQueue[i];

									// Only colorswap items should be part of this queue.
									if(rec.newVRAM_entry.flags.colorSwaps.length){
										// Add data.
										img_buffers_arr.push( rec.imgData_buffer );
										newVRAM_entries.push( rec.newVRAM_entry  );
										transferList   .push( rec.imgData_buffer );
									}
								}

								// Only send a message to the worker if there is something for it to do.
								if(img_buffers_arr.length){
									// Define onmessage callback.
									worker.onmessage = function(e){
										// console.log("Worker #"+queueNum, "response:", e.data);
										let prom = core.GRAPHICS.WORKERS.CALLBACK(e);
										prom.then(
											function(){
												// Reduce the queuedCount based on the number of items.
												core.GRAPHICS.WORKERS.w_colorswaps.queuedCount -= img_buffers_arr.length;

												res_inner();
											},
											function(err) { console.log("err:", err);   rej_inner(); }
										);
									};

									let msg = {
										"function"          : "colorswaps"    ,
										"img_buffers_arr"   : img_buffers_arr ,
										"newVRAM_entries"   : newVRAM_entries ,
									};

									// console.log("Sending " + img_buffers_arr.length + " items to worker #"+queueNum);

									// Send the data to the worker.
									worker.postMessage( msg , transferList );
								}
								else{
									res_inner();
								}
							}
						)
					);

				}

				Promise.all(proms).then(
					function(){
						// Clear the queue and workers.
						for(let queueNum=0; queueNum<core.GRAPHICS.WORKERS.w_colorswaps.queue.length; queueNum+=1){
							// queues[queueNum].length = 0;
							// core.GRAPHICS.WORKERS.w_colorswaps.queue[queueNum]=[];
							core.GRAPHICS.WORKERS.w_colorswaps.queue[queueNum].length=0;
							core.GRAPHICS.WORKERS.WORKERS[queueNum].onmessage = null;
						}

						// Resolve the outer promise.
						if(1) { res(); }
						else  { rej(); }

					},
					function(err){
						console.log("err:", err);
					}
				);
			});
		},

		/**
		 * @summary  Rotates, and/or Flips (X and or Y) a tile.
		 * @memberof "core.GRAPHICS.FUNCS.INTERNAL"
		 * @param    {canvas} imgObj_canvas
		 * @param    {object} newVRAM_entry
		 * @returns  {object}
		 *
		 * @example _CGFI.ROT_FLIPX_FLIPY(imgObj_canvas, newVRAM_entry);
		 */
		ROT_FLIPX_FLIPY     : function(imgObj_canvas, newVRAM_entry){
			// Create the src canvas as a copy of the provided canvas.
			let src_canvas    = document.createElement("canvas");
			src_canvas.width  = newVRAM_entry.w ;
			src_canvas.height = newVRAM_entry.h ;
			JSGAME.SHARED.setpixelated(src_canvas);
			let src_ctx       = src_canvas.getContext("2d") ;
			src_ctx.drawImage(imgObj_canvas, 0, 0);

			// Create the destination canvas.
			let newX=0;
			let newY=0;
			let dst_canvas    = document.createElement("canvas");
			dst_canvas.width  = newVRAM_entry.w ;
			dst_canvas.height = newVRAM_entry.h ;
			JSGAME.SHARED.setpixelated(dst_canvas);
			let dst_ctx       = dst_canvas.getContext("2d") ;

			// Rotate if indicated.
			let flags = newVRAM_entry.flags;
			if( (flags.ROT !== false && flags.ROT !== 0) ){
				// Determine the diagonal length of the image.
				let diag = Math.floor(Math.sqrt( Math.pow(dst_canvas.width,2) + Math.pow(dst_canvas.height,2) ));

				// Adjust the width and height for the dst_canvas and setpixelated.
				dst_canvas.width  = diag ;
				dst_canvas.height = diag ;
				JSGAME.SHARED.setpixelated(dst_canvas);

				// Update the width and height for the newVRAM_entry.
				newVRAM_entry.w   = diag;
				newVRAM_entry.h   = diag;

				// Calcuate and store the x and y offset (needed to correct positioning due to rotation.)
				newVRAM_entry.x_offset = (dst_canvas.width  - src_canvas.width)  /2 ;
				newVRAM_entry.y_offset = (dst_canvas.height - src_canvas.height) /2 ;

				// Translate position, rotate, un-translate position.
				dst_ctx.translate(diag/2, diag/2);
				dst_ctx.rotate(flags.ROT * Math.PI/180);
				dst_ctx.translate((-1*diag)/2, (-1*diag)/2);
			}

			// FLIP_X and/or FLIP_Y if indicated.
			if( flags.FLIP_X || flags.FLIP_Y ){
				// Make sure there are values for both FLIP_X and FLIP_Y.
				flags.FLIP_X = flags.FLIP_X ? true : false ;
				flags.FLIP_Y = flags.FLIP_Y ? true : false ;

				// Scale (this performs the flipping.)
				let scaleH = flags.FLIP_X ? -1                     : 1; // Set horizontal scale to -1 if flip horizontal
				let scaleV = flags.FLIP_Y ? -1                     : 1; // Set verical scale to -1 if flip vertical
				newX       = flags.FLIP_X ? dst_canvas.width  * -1 : 0; // Set x position to -100% if flip horizontal
				newY       = flags.FLIP_Y ? dst_canvas.height * -1 : 0; // Set y position to -100% if flip vertical
				dst_ctx.scale(scaleH, scaleV);                          // Set scale to flip the image
			}

			// JSGAME.SHARED.setpixelated(dst_canvas);

			// Return the finished canvas.
			return {
				"canvas" : dst_canvas ,
				"ctx"    : dst_ctx    ,
				"newX"   : newX       ,
				"newY"   : newY       ,
			};

		},

		/**
		 * @summary  Queues the drawing of an image that has colorswaps specified in the flags.
		 * @memberof "core.GRAPHICS.FUNCS.INTERNAL"
		 * @param    {ImageData} imgData
		 * @param    {object} newVRAM_entry
		 *
		 * @example _CGFI.addColorSwapToQueue(imgData, newVRAM_entry);
		 */
		addColorSwapToQueue : function(imgData, newVRAM_entry){
			// Create the object.
			let newObj = {
				"imgData_buffer" : imgData ,
				"newVRAM_entry"  : newVRAM_entry
			};

			// Determine which worker's queue to add this change into.
			let queues = core.GRAPHICS.WORKERS.w_colorswaps.queue ;
			let queueLengths=[];

			// Each for each queue.
			for(let queueNum=0; queueNum<queues.length; queueNum+=1){
				// Save the number of items in the queue.
				// queueLengths.push(queues[queueNum].length);

				try{
					queueLengths.push(queues[queueNum].length);
				}
				catch(e){
					console.log(
						"\n queues          : ", queues,
						"\n queueNum        : ", queueNum,
						"\n queues[queueNum]: ", queues[queueNum],
						"\n e:", e
					);
					return;
				}
			}
			// let destinationQueue = queueLengths.indexOf(Math.min.apply(null,queueLengths)) ;
			let destinationQueue = queueLengths.indexOf(Math.min(...queueLengths)) ;

			// Add the object to the queue.
			core.GRAPHICS.WORKERS.w_colorswaps.queue[destinationQueue].push(newObj);

			//
			core.GRAPHICS.WORKERS.w_colorswaps.queuedCount+=1;
		},

		/**
		 * @summary  Final function that places a tile in the VRAM/SPRITE array.
		 * @memberof "core.GRAPHICS.FUNCS.INTERNAL"
		 * @param    {object} data
		 *
		 * @example _CGFI.placeTile();
		 */
		placeTile           : function(data){
			let newVRAM_entry = data.newVRAM_entry       ;
			let layerType     = newVRAM_entry.layerType  ;
			let __calledBy    = newVRAM_entry.__calledBy ;
			let layer         = newVRAM_entry.layer      ;
			let flags         = newVRAM_entry.flags      ;
			let addr ;

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

			// Set the draw and layer update flags.
			// newVRAM_entry.YESIEXIST = true ; // REMOVE THIS
			newVRAM_entry.flags.drawThis = true ;
			core.GRAPHICS.DATA.FLAGS[newVRAM_entry.layer].UPDATE=true;
		},

		// LAYER UPDATING FUNCTIONS.

		/**
		 * @summary  Handles drawing of VRAM and SPRITE layers.
		 * @memberof "core.GRAPHICS.FUNCS.INTERNAL"
		 *
		 * @example _CGFI.update_layers();
		 */
		update_layers        : function(){
			return new Promise(function(res,rej){
				let drawOutput=false;

				let layers = Object.keys(core.SETTINGS.layers);
				for(let i=0; i<layers.length; i+=1){
					// Get draw start time.
					let drawStart = performance.now();

					// Get layer variables.
					let layer           = layers[i];
					let UPDATE          = core.GRAPHICS.DATA.FLAGS[layer].UPDATE          ;
					let REDRAW          = core.GRAPHICS.DATA.FLAGS[layer].REDRAW          ;

					// Get layer variables.
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
							let str = ["=E= update_layers: invalid layer type.", JSON.stringify(VRAM[t],null,1)];
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
								// let w = VRAM[t].w ;
								// let h = VRAM[t].h ;
								let flags = VRAM[t].flags ;

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
									let str = ["=E= update_layers: (drawThis) invalid data.", JSON.stringify(VRAM[t],null,1)];
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
								if( (flags.ROT !== false && flags.ROT !== 0) ){
									if(VRAM[t].x_offset){ x -= VRAM[t].x_offset ; }
									if(VRAM[t].y_offset){ y -= VRAM[t].y_offset ; }
								}
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
					if(JSGAME.FLAGS.debug) {
						if(core.GRAPHICS.performance.LAYERS[layer].length >=5){ core.GRAPHICS.performance.LAYERS[layer].shift(); }
						core.GRAPHICS.performance.LAYERS[layer].push(performance.now() - drawStart);                   }
				}

				// Done! Resolve.
				if(1) { res(drawOutput); }
				else  { rej(); }
			});
		},

		/**
		 * @summary  Combines the individual layers into the pre_OUTPUT.
		 * @memberof "core.GRAPHICS.FUNCS.INTERNAL"
		 *
		 * @example _CGFI.update_layer_COMBINE();
		 */
		update_layer_COMBINE : function(){
			return new Promise(function(res,rej){
				// Get a handle to the temp output.
				let tempOutput     = core.GRAPHICS.canvas.pre_OUTPUT;
				let tempOutput_ctx = core.GRAPHICS.ctx.pre_OUTPUT;
				tempOutput_ctx.clearRect( 0,0, tempOutput.width, tempOutput.height );

				// Draw each layer to the OUTPUT in the order specified by the gamesettings.json file.
				for(let i=0; i<core.SETTINGS.layerDrawOrder.length; i+=1){
					let layerName = core.SETTINGS.layerDrawOrder[i];
					let canvas = core.GRAPHICS.canvas[layerName];
					tempOutput_ctx.drawImage( canvas, 0, 0) ;
				}

				// // Get fade values.
				// let WORKERS_OBJ       = core.GRAPHICS.WORKERS  ;
				// let fadeLevel         = WORKERS_OBJ.w_fade.fadeLevel ;
				// let fadeTable_fullOn  = WORKERS_OBJ.w_fade.fadeTable_fullOn ;
				// let fadeTable_fullOff = WORKERS_OBJ.w_fade.fadeTable_fullOff ;
				// let fade = (fadeLevel!== fadeTable_fullOn) && (fadeLevel != fadeTable_fullOff) ;

				// if(fade){
				// 	core.GRAPHICS.imgData.pre_OUTPUT.whole = tempOutput_ctx.getImageData(0, 0, tempOutput.width, tempOutput.height);
				// }

				// Done! Resolve.
				if(1) { res(); }
				else  { rej(); }
			});

		},

		/**
		 * @summary  Writes the pre_OUTPUT to the OUTPUT canvas.
		 * @memberof "core.GRAPHICS.FUNCS.INTERNAL"
		 *
		 * @example _CGFI.update_layer_OUTPUT();
		 */
		update_layer_OUTPUT  : function(){
			return new Promise(function(res,rej){
				// Get a handle to the temp output.
				let tempOutput     = core.GRAPHICS.canvas.pre_OUTPUT;

				// Clear the OUTPUT canvas.
				core.GRAPHICS.ctx.OUTPUT.clearRect( 0,0, core.GRAPHICS.canvas.OUTPUT.width, core.GRAPHICS.canvas.OUTPUT.height );

				// Draw to the OUTPUT canvas.
				let x_offset = core.GRAPHICS.DATA.FLAGS.OUTPUT.x_offset;
				let y_offset = core.GRAPHICS.DATA.FLAGS.OUTPUT.y_offset;
				core.GRAPHICS.ctx.OUTPUT.drawImage(
					tempOutput,
					0 + x_offset,
					0 + y_offset
				);

				// Done! Resolve.
				if(1) { res(); }
				else  { rej(); }
			});
		},

		/**
		 * @summary  Performs the OUTPUT layer fade using webworkers.
		 * @memberof "core.GRAPHICS.FUNCS.INTERNAL"
		 *
		 * @example _CGFI.update_layer_FADE();
		 */
		update_layer_FADE    : function(){
			return new Promise(function(res,rej){
				// core.GRAPHICS.WORKERS
				let WORKERS_OBJ  = core.GRAPHICS.WORKERS  ;
				let WORKERS      = core.GRAPHICS.WORKERS.WORKERS  ;
				// let CALLBACK     = core.GRAPHICS.WORKERS.CALLBACK ;
				let key = "w_fade";

				// core.GRAPHICS.WORKERS.w_fade
				let fadeLevel_min          = WORKERS_OBJ[key].fadeLevel_min          ;
				let fadeLevel_max          = WORKERS_OBJ[key].fadeLevel_max          ;
				let fadeDirection          = WORKERS_OBJ[key].fadeDirection          ;
				let fadeLevel              = WORKERS_OBJ[key].fadeLevel              ;
				let fadeTable_fullOff      = WORKERS_OBJ[key].fadeTable_fullOff      ;
				let fadeTable_fullOn       = WORKERS_OBJ[key].fadeTable_fullOn       ;
				let levelChangeLatency     = WORKERS_OBJ[key].levelChangeLatency     ;
				let levelChangeLatency_cnt = WORKERS_OBJ[key].levelChangeLatency_cnt ;
				let stayBlack              = WORKERS_OBJ[key].stayBlack              ;

				let msBeforeChange         = WORKERS_OBJ[key].msBeforeChange         ;
				let lastChange             = WORKERS_OBJ[key].lastChange             ;
				let now                    = performance.now()                       ;

				// If there is not a fade to do then resolve and return.
				if(fadeLevel == fadeTable_fullOff || fadeLevel == fadeTable_fullOn){
					if(fadeLevel == fadeTable_fullOff && stayBlack){
						// This fade level is straight black. No need to do calculations on it to get all black.
						// console.log("A: Skipping fade and just filling with black.");

						// Get a handle to the temp output.
						let tempOutput     = core.GRAPHICS.canvas.pre_OUTPUT;
						let tempOutput_ctx = core.GRAPHICS.ctx.pre_OUTPUT;
						tempOutput_ctx.fillStyle = "rgba(0, 0, 0, 1.0)";      // Black
						tempOutput_ctx.fillRect(0, 0, tempOutput.width, tempOutput.height);

						// Done! Resolve.
						res();
						return;
					}
					else{
						// Done! Resolve.
						res();
						return;
					}
				}

				// Does the fadeLevel need to change?
				if(fadeDirection != 0){
					if(now-lastChange >= msBeforeChange){
						WORKERS_OBJ[key].lastChange=now;

						// Increment?
						if     (fadeDirection ==  1){
							// Is it already at max level?
							if(fadeLevel == fadeLevel_max){
								WORKERS_OBJ[key].fadeLevel=fadeTable_fullOn;
							}

							// Adjust fadeLevel index.
							else{ WORKERS_OBJ[key].fadeLevel += fadeDirection; }
						}

						// Decrement?
						else if(fadeDirection == -1){
							// Is it already at min level?
							if(fadeLevel == fadeLevel_min){
								WORKERS_OBJ[key].fadeLevel=fadeTable_fullOff;
							}

							// Adjust fadeLevel index.
							else{ WORKERS_OBJ[key].fadeLevel += fadeDirection; }
						}
					}
					// No change.
					else{
					}
				}

				if(fadeLevel == 1){
					// This fade level is straight black. No need to do calculations on it to get all black.
					// console.log("B: Skipping fade and just filling with black.");

					// Get a handle to the temp output.
					let tempOutput     = core.GRAPHICS.canvas.pre_OUTPUT;
					let tempOutput_ctx = core.GRAPHICS.ctx.pre_OUTPUT;
					tempOutput_ctx.fillStyle = "rgba(0, 0, 0, 1.0)";      // Black
					tempOutput_ctx.fillRect(0, 0, tempOutput.width, tempOutput.height);

					// Done! Resolve.
					res();
					return;
				}

				// core.GRAPHICS.WORKERS.w_fade.fadeTable
				let maxBlue  = WORKERS_OBJ[key].fadeTable[fadeLevel].b ;
				let maxGreen = WORKERS_OBJ[key].fadeTable[fadeLevel].g ;
				let maxRed   = WORKERS_OBJ[key].fadeTable[fadeLevel].r ;

				// Number of workers available. (assumes they are available.)
				// let numWorkers = WORKERS.length;
				let numWorkers = 1;

				// Get a handle to the temp output.
				let tempOutput     = core.GRAPHICS.canvas.pre_OUTPUT;
				let tempOutput_ctx = core.GRAPHICS.ctx.pre_OUTPUT;

				let width = tempOutput.width;
				let height = Math.ceil( (tempOutput.height/numWorkers) );
				let x=0;
				let y;

				// Make ImageData of the combined canvas here.
				core.GRAPHICS.imgData.pre_OUTPUT.whole = tempOutput_ctx.getImageData(0, 0, tempOutput.width, tempOutput.height);

				// Slice up the full image.
				let full_imgData_buf = core.GRAPHICS.imgData.pre_OUTPUT.whole.data.buffer ;
				let blockSize        = Math.ceil(full_imgData_buf.byteLength / numWorkers);
				// for(let w=0; w<numWorkers; w+=1){
				// 	core.GRAPHICS.imgData.pre_OUTPUT.slices[w] =
				// 		full_imgData_buf.slice(
				// 			( blockSize * w ),
				// 			( blockSize + (blockSize * w))
				// 		)
				// 	;
				// }
				core.GRAPHICS.imgData.pre_OUTPUT.slices[0] = core.GRAPHICS.imgData.pre_OUTPUT.whole.data.buffer;
				let slices = core.GRAPHICS.imgData.pre_OUTPUT.slices;

				let proms=[];
				let transferList = [];
				for(let w=0; w<numWorkers; w+=1){
					let worker       = WORKERS[w] ;
					proms.push(
						new Promise(
							function(res_inner, rej_inner){
								// Get start point for y.
								y=height*w;

								let img_buff = slices[w];
								transferList[0] = img_buff;

								let msg = {
									"function" : "fade" ,
									"img_buff" : img_buff     ,
									"x"        : x            ,
									"y"        : y            ,
									"w"        : width        ,
									"h"        : height       ,
									"maxRed"   : maxRed       ,
									"maxGreen" : maxGreen     ,
									"maxBlue"  : maxBlue      ,
								};

								worker.onmessage = function(e){
									// console.log(e.data.time);
									let prom = core.GRAPHICS.WORKERS.CALLBACK(e);
									prom.then(
										function(){ res_inner(); },
										function(err) { console.log("err:", err);   rej_inner(); }
									);
								};

								// Send the data.
								try{
									worker.postMessage(msg, transferList);
								}
								catch(e){
									console.log(e, msg, transferList);
									throw "";
								}
							}
						)
					);
				}

				Promise.all(proms).then(
					function(){
						// Clear the slices array.
						core.GRAPHICS.imgData.pre_OUTPUT.slices.length=0;
						core.GRAPHICS.imgData.pre_OUTPUT.whole=null;

						// Set new value for the active state of the fade.
						core.GRAPHICS.WORKERS.w_fade.fadeActive = (fadeLevel!== fadeTable_fullOn) && (fadeLevel != fadeTable_fullOff) ;

						// Done! Resolve.
						if(1) { res(); }
						else  { rej(); }
					},
					function(err){
						console.log("err:", err);
					}
				);

			});
		},

	},
};

// *** LOGO FUNCTIONS.  ***

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
		else{
			if(1) { res(); }
			else  { rej(); }
		}
	});
};

// *** INIT FUNCTIONS.  ***

// One-time-use init function for the graphics.
core.GRAPHICS.init = {
	init : function(){
		return new Promise(function(res_VIDEO_INIT, rej_VIDEO_INIT){
			JSGAME.SHARED.PERFORMANCE.stamp("VIDEO_INIT_ALL"                   , "START");

			let errorLevel = function(err, level){
				let str = ["=E= _CGFU.init level "+level];
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
			};

			// First layer of functions. (Settings, DOM, Canvas setup.)
			let proms1 = [
				core.GRAPHICS.init.getSettings()     ,
				core.GRAPHICS.init.dom_setup()       ,
				core.GRAPHICS.init.canvas_setup()    ,
			];

			Promise.all(proms1).then(
				function(){
					// Second layer of functions. (Download and first conversion of graphics. )
					let proms2 = [
						core.GRAPHICS.init.graphics1_setup() ,
					];
					Promise.all(proms2).then(
						function(){
							// Third layer of functions. (Second conversion of graphics.)
							let proms3 = [
								core.GRAPHICS.init.graphics2_setup() ,
							];
							Promise.all(proms3).then(
								function(){
									// Last layer function.
									core.GRAPHICS.init.cleanup().then(
										function(){
											JSGAME.SHARED.PERFORMANCE.stamp("VIDEO_INIT_ALL"                   , "END");

											// Done! Resolve.
											res_VIDEO_INIT();
										},
										function(err){ errorLevel(err, 4); }
									);
								},
								function(err){ errorLevel(err, 3); }
							);
						},
						function(err){ errorLevel(err, 2); }
					);
				},
				function(err){ errorLevel(err, 1); }
			);

		});
	},

	// Init: Phase #1 of 4.
	getSettings : function(){ return new Promise(function(res1, rej1){
		let _perf_name = "VIDEO_INIT_"+"getSettings";
		try{
			JSGAME.SHARED.PERFORMANCE.stamp(_perf_name , "START");

			// Core, Low-level settings.
			core.SETTINGS.TRANSLUCENT_COLOR = JSGAME.PRELOAD.gamesettings_json.graphics.core.TRANSLUCENT_COLOR ;
			core.SETTINGS.TILE_WIDTH        = JSGAME.PRELOAD.gamesettings_json.graphics.core.TILE_WIDTH        ;
			core.SETTINGS.TILE_HEIGHT       = JSGAME.PRELOAD.gamesettings_json.graphics.core.TILE_HEIGHT       ;
			core.SETTINGS.VRAM_TILES_H      = JSGAME.PRELOAD.gamesettings_json.graphics.core.VRAM_TILES_H      ;
			core.SETTINGS.VRAM_TILES_V      = JSGAME.PRELOAD.gamesettings_json.graphics.core.VRAM_TILES_V      ;
			core.SETTINGS.INTRO_LOGO        = JSGAME.PRELOAD.gamesettings_json.graphics.core.INTRO_LOGO        ;
			core.SETTINGS.FPS               = JSGAME.PRELOAD.gamesettings_json.graphics.core.FPS               ;
			core.SETTINGS.fps               = JSGAME.PRELOAD.gamesettings_json.graphics.core.FPS               ;
			core.SETTINGS.SCALE             = JSGAME.PRELOAD.gamesettings_json.graphics.core.SCALE             ;

			// Tileset/Tilemap data.
			core.SETTINGS.inputTilesetData = JSGAME.PRELOAD.gamesettings_json.graphics.inputTilesetData   ;
			core.SETTINGS.tilesets         = JSGAME.PRELOAD.gamesettings_json.graphics.tilesets           ;

			// Layer data.
			core.SETTINGS.layers         = JSGAME.PRELOAD.gamesettings_json.graphics.layers   ;
			core.SETTINGS.layerDrawOrder = JSGAME.PRELOAD.gamesettings_json.graphics.layerDrawOrder   ;

			// Fix some values.
			core.SETTINGS.TRANSLUCENT_COLOR = parseInt(core.SETTINGS.TRANSLUCENT_COLOR, 16)   ;

			JSGAME.SHARED.PERFORMANCE.stamp(_perf_name , "END");

			// Done! Resolve.
			res1();
		}
		catch(e){ rej1({_perf_name, e}); }
	});},
	dom_setup : function(){ return new Promise(function(res1, rej1){
		let _perf_name = "VIDEO_INIT_"+"dom_setup";
		try{
			JSGAME.SHARED.PERFORMANCE.stamp(_perf_name , "START");

			// Get a handle to gameCanvas_DIV.
			core.DOM.gameCanvas_DIV = document.getElementById("gameCanvas_DIV");

			JSGAME.SHARED.PERFORMANCE.stamp(_perf_name , "END");

			// Done! Resolve.
			res1();
		}
		catch(e){ rej1({_perf_name, e}); }
	});},
	canvas_setup : function(){ return new Promise(function(res1, rej1){
		let _perf_name = "VIDEO_INIT_"+"canvas_setup";
		try{
			JSGAME.SHARED.PERFORMANCE.stamp(_perf_name , "START");

			// Create the layers, save some flag values too.
			for(let layer in core.SETTINGS.layers){
				// Get flags.
				let clearWith       = core.SETTINGS.layers[layer].clearWith       ; // Saved to core.GRAPHICS.FLAGS[layer]
				let clearCanvasBeforeUpdate = core.SETTINGS.layers[layer].clearCanvasBeforeUpdate ; // Saved to core.GRAPHICS.FLAGS[layer]
				let alpha           = core.SETTINGS.layers[layer].alpha           ; // Used once here.
				let type            = core.SETTINGS.layers[layer].type            ;

				// Create canvas.
				let newCanvas = document.createElement('canvas'); //

				// Set dimensions of canvas.
				newCanvas.width  = ( core.SETTINGS.VRAM_TILES_H * core.SETTINGS.TILE_WIDTH  ) ;
				newCanvas.height = ( core.SETTINGS.VRAM_TILES_V * core.SETTINGS.TILE_HEIGHT ) ;

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
				// core.GRAPHICS.performance.LAYERS[layer] = [ 0, 0, 0, 0, 0 ] ; //
				core.GRAPHICS.performance.LAYERS[layer] = [ ] ; //
			}

			// Create the OUTPUT canvas. (Primary output canvas.)
			core.GRAPHICS.canvas.OUTPUT        = document.createElement('canvas'); //
			core.GRAPHICS.ctx.OUTPUT           = core.GRAPHICS.canvas.OUTPUT.getContext("2d", { alpha : true } ); //
			core.GRAPHICS.canvas.OUTPUT.width  = ( core.SETTINGS.VRAM_TILES_H * core.SETTINGS.TILE_WIDTH  ) ;
			core.GRAPHICS.canvas.OUTPUT.height = ( core.SETTINGS.VRAM_TILES_V * core.SETTINGS.TILE_HEIGHT ) ;
			core.GRAPHICS.canvas.OUTPUT.id     = "canvas_OUTPUT";
			JSGAME.SHARED.setpixelated(core.GRAPHICS.canvas.OUTPUT);

			// Create the pre_OUTPUT canvas. (Used to combine layers before writing to the primary output canvas.)
			core.GRAPHICS.canvas.pre_OUTPUT        = document.createElement('canvas'); //
			core.GRAPHICS.ctx.pre_OUTPUT           = core.GRAPHICS.canvas.pre_OUTPUT.getContext("2d", { alpha : true } ); //
			core.GRAPHICS.canvas.pre_OUTPUT.width  = ( core.SETTINGS.VRAM_TILES_H * core.SETTINGS.TILE_WIDTH  ) ;
			core.GRAPHICS.canvas.pre_OUTPUT.height = ( core.SETTINGS.VRAM_TILES_V * core.SETTINGS.TILE_HEIGHT ) ;
			core.GRAPHICS.canvas.pre_OUTPUT.id     = "canvas_pre_OUTPUT";
			JSGAME.SHARED.setpixelated(core.GRAPHICS.canvas.pre_OUTPUT);

			// Attach the canvas_OUTPUT to gameCanvas_DIV.
			core.DOM.gameCanvas_DIV.appendChild(core.GRAPHICS.canvas.OUTPUT);

			JSGAME.SHARED.PERFORMANCE.stamp(_perf_name , "END");

			// Done! Resolve.
			res1();
		}
		catch(e){ rej1({_perf_name, e}); }
	});},

	// Init: Phase #2 of 4.
	graphics1_setup : function(){ return new Promise(function(res1, rej1){
		let _perf_name = "VIDEO_INIT_"+"graphics1_setup";
		try{
			JSGAME.SHARED.PERFORMANCE.stamp(_perf_name , "START");

			// Get gamedir data.
			let gamedir = parentPath + JSGAME.PRELOAD.gameselected_json.gamedir;
			gamedir = gamedir.replace("../", "");

			// Download the files.
			let proms_gfx = [];
			core.SETTINGS.inputTilesetData.forEach(function(d){
				let rel_url = JSGAME.PRELOAD.gameselected_json.gamedir + "/"+ d;
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
						let converted = core.GRAPHICS.init.graphicsConvert( r[i] );

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
	});},
	graphicsConvert : function(res){
		// Manipulate the string to something easier to manage.
		// NOTE: If this is done to the files PRIOR to this then the file download will be smaller.
		let data = res
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
		let thisArrayName    = "" ;

		let start ;
		let end   ;
		let values;

		// Split on \n
		data = data.split("\n");

		// CURRENT TILESET:
		let currentTileset = "_INVALID_";
		// let lines = [];
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

				if(! retData.tilesets ) { retData.tilesets = {} ; }
				retData.tilesets[currentTileset] = values;
			}
			// This is a tilemap within the existing tileset.
			else{
				let mapValues = values.map(function(d){ return parseInt(d, 10); });
				if(! retData.tilemaps )                 { retData.tilemaps = {} ; }
				if(! retData.tilemaps[currentTileset] ) { retData.tilemaps[currentTileset] = {} ; }

				retData.tilemaps[currentTileset][thisArrayName] = mapValues ;
			}

			// Return the new string.
			return d;
		});

		// Return the data
		return  retData;

	},

	// Init: Phase #3 of 4.
	graphics2_setup : function(){ return new Promise(function(res1, rej1){
		let _perf_name = "VIDEO_INIT_"+"graphics2_setup";
		try{
			core.GRAPHICS.init.post_graphicsConversion();
			core.GRAPHICS.init.post_graphicsConversion2();
			core.GRAPHICS.init.createVRAMs();
			core.GRAPHICS.init.createColorConversionTable();
			core.GRAPHICS.init.createDefaultTileset();

			// JSGAME.SHARED.PERFORMANCE.stamp(_perf_name , "END");
			// Done! Resolve.
			res1();
		}
		catch(e){ console.info("============", {_perf_name, e} ); rej1({_perf_name, e}); }
	});},
	rgb_decode332                   : function(RGB332, method, convertTransparent) {
		// Converts one RGB332 pixel to another data type.

		if(convertTransparent==undefined){ convertTransparent=false;}

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
		nR = ( ((RGB332 >> 0) & 0b00000111) * (255 / 7) ) << 0; // red
		nG = ( ((RGB332 >> 3) & 0b00000111) * (255 / 7) ) << 0; // green
		nB = ( ((RGB332 >> 6) & 0b00000011) * (255 / 3) ) << 0; // blue

		if(convertTransparent){
			if(RGB332 == core.SETTINGS.TRANSLUCENT_COLOR){
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

	},
	convertUzeboxTilesToCanvasTiles : function(inputTileset, convertTransparent){
		let curTileId;
		let vramdata_rgb_332;
		let tile_width  = core.SETTINGS.TILE_WIDTH;
		let tile_height = core.SETTINGS.TILE_HEIGHT;
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
				convertedPixel     = core.GRAPHICS.init.rgb_decode332( pixel, "arraybuffer_32", convertTransparent ) ;
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
	},
	post_graphicsConversion         : function(){
		let _perf_name = "VIDEO_INIT_"+"post_graphicsConversion";
		JSGAME.SHARED.PERFORMANCE.stamp(_perf_name , "START");

		// Get the number of tilesets.
		let len = core.SETTINGS.tilesets.length;

		// Convert all tilesets from the Uzebox format.
		for(let i=0; i<len; i+=1){
			let tilesetName        = core.SETTINGS.tilesets[i].tileset ;
			let convertTransparent = core.SETTINGS.tilesets[i].convertTransparent ;
			let tilesetData        = core.GRAPHICS.ASSETS._original_data.tilesets[tilesetName] ;
			let numTiles           = tilesetData.length / (core.SETTINGS.TILE_WIDTH * core.SETTINGS.TILE_HEIGHT) ;
			let imgData;

			core.GRAPHICS.ASSETS.tilesets[tilesetName] = {};

			let arrayOfCanvases  = [] ;

			// Add the data to the tile object.
			arrayOfCanvases = core.GRAPHICS.init.convertUzeboxTilesToCanvasTiles(
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
				imgData = ctx.getImageData(0, 0, handle.canvas.width, handle.canvas.height);
				handle.imgData = imgData ;

				// Store the ctx for the canvas.
				handle.ctx = ctx ;

				// Tile usage count (DEBUG.)
				handle.numUsed = 0 ;
			}

		}

		JSGAME.SHARED.PERFORMANCE.stamp(_perf_name , "END");

	},
	post_graphicsConversion2        : function(){
		// We have a converted tileset. Now we must create images for each tilemap.

		let _perf_name = "VIDEO_INIT_"+"post_graphicsConversion2";
		JSGAME.SHARED.PERFORMANCE.stamp(_perf_name , "START");

		let tile_w = core.SETTINGS.TILE_WIDTH;
		let tile_h = core.SETTINGS.TILE_HEIGHT;

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
				};

			}

		}

		JSGAME.SHARED.PERFORMANCE.stamp(_perf_name , "END");
	},
	createVRAMs                     : function(){
		let layers = Object.keys(core.SETTINGS.layers);
		for(let i=0; i<layers.length; i+=1){
			let layer = layers[i];
			let layerFlags = core.GRAPHICS.DATA.FLAGS[layer];
			if     (layerFlags.type=="VRAM"  ){
				core.GRAPHICS.DATA.VRAM  [layer] = [];
				let numIndexes = core.SETTINGS.VRAM_TILES_H*core.SETTINGS.VRAM_TILES_V;

				let y=0;
				let x=0;
				for(let i=0; i<numIndexes; i+=1){
					if(x>=core.SETTINGS.VRAM_TILES_H){ x=0; y+=1; }
					if(y>=core.SETTINGS.VRAM_TILES_V){ break;     }

					core.GRAPHICS.DATA.VRAM[layer][i] = core.GRAPHICS.FUNCS.INTERNAL.returnNewTile_obj();

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
	},
	createColorConversionTable      : function(){
		// 256 colors, 0x00 - 0xFF.
		// let str="";
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
			let rgba     = core.GRAPHICS.init.rgb_decode332(i, "object"        , false) ;
			let r32_hex =
				"#" +
				( (rgba.r).toString(16).padStart(2, "0").toUpperCase() ) +
				( (rgba.g).toString(16).padStart(2, "0").toUpperCase() ) +
				( (rgba.b).toString(16).padStart(2, "0").toUpperCase() )
				// + ( (rgba.a).toString(16).padStart(2, "0").toUpperCase() )
			;

			obj.r32_hex[r32_hex]={
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
	},
	createDefaultTileset            : function(){
		// Create default tileset.
		core.GRAPHICS.ASSETS.tilesets.default_tileset=[];

		// Create black tile and add to the default tileset.
		let canvas;
		let imgData;
		let ctx;
		canvas=document.createElement("canvas");
		canvas.width  = core.SETTINGS.TILE_WIDTH;
		canvas.height = core.SETTINGS.TILE_HEIGHT;
		JSGAME.SHARED.setpixelated(canvas);
		ctx=canvas.getContext("2d");
		ctx.fillStyle = "rgba(0, 0, 0, 1.0)";      // Black
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		imgData = ctx.getImageData(0,0,canvas.width, canvas.height);
		core.GRAPHICS.ASSETS.tilesets.default_tileset.push({
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
		core.GRAPHICS.ASSETS.tilesets.default_tileset.push({
			"canvas"  : canvas ,
			"imgData" : imgData ,
			"numUsed" : 0 ,
		});


		/*
		// Create a tile for each available color in the color conversion table.
		let keys = Object.keys(core.GRAPHICS.DATA.lookups.colors.r32_hex);
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

			core.GRAPHICS.ASSETS.tilesets.default_tileset.push({
				"canvas"  : canvas ,
				"imgData" : imgData ,
				"numUsed" : 0 ,
				"r32_hex" : key ,
				"uze_dec" : parseInt(uze_dec,10) ,
			});
		}
		*/

		// core.GRAPHICS.DATA.lookups.colors


	},

	// Init: Phase #4 of 4.
	cleanup : function(){ return new Promise(function(res1, rej1){
		let _perf_name = "VIDEO_INIT_"+"cleanup";
		try{
			// Create web workers.
			JSGAME.SHARED.PERFORMANCE.stamp(_perf_name+"_createWebworkers" , "START");
			if( window.navigator.hardwareConcurrency >= 2){
				// Force failure.
				// let coresToUse = 0;
				// if(!coresToUse || !window.navigator.hardwareConcurrency ){
				// 	rej1("web worker setup") ;
				// 	throw "web worker setup" ;
				// 	return;
				// }

				// Use specified number of cores.
				// let coresToUse = 1 ; // Works on my phone.
				// let coresToUse = 2 ; // Works on my phone.
				// let coresToUse = 3 ; // Works on my phone.
				// let coresToUse = 4 ; // Works on my phone.

				// let coresToUse = 5  ; // Does NOT work on my phone.
				// let coresToUse = 6  ; // Does NOT work on my phone.
				// let coresToUse = 7  ; // Does NOT work on my phone.
				// let coresToUse = 8  ; // Does NOT work on my phone.
				// let coresToUse = 16 ; // Does NOT work on my phone.

				// Use half the max number of web workers.
				// let coresToUse = (window.navigator.hardwareConcurrency /2 ) << 0;

				// Use all available cores for web workers.
				let coresToUse = (window.navigator.hardwareConcurrency) || 1;

				// console.log("For web workers: Using " + coresToUse + " of " + window.navigator.hardwareConcurrency + ".");
				for(let i=0; i<coresToUse; i+=1){
					// Create a worker.
					let worker = new Worker('cores/videoMode_C/videoMode_C_webworker.js') ;

					// Add the worker to the worker array.
					core.GRAPHICS.WORKERS.WORKERS[i] = worker ;

					// Add the shared onmessage callback to the worker.
					// worker.onmessage=core.GRAPHICS.WORKERS.CALLBACK;

					// Add the shared error callback to the worker.
					worker.onerror=core.GRAPHICS.WORKERS.error_CALLBACK;

					// Add a queue to w_colorswaps.
					core.GRAPHICS.WORKERS.w_colorswaps.queue [i] = [] ;

					// Add a queue to (NEW_QUEUE_HERE).
					// core.GRAPHICS.WORKERS.NEW_QUEUE_HERE.queue [i] = [] ;
				}
			}
			JSGAME.SHARED.PERFORMANCE.stamp(_perf_name+"_createWebworkers" , "END");

			// Clear all canvases and data.
			JSGAME.SHARED.PERFORMANCE.stamp(_perf_name+"_clearAllCanvases" , "START");
			_CGFU.clearAllCanvases();
			JSGAME.SHARED.PERFORMANCE.stamp(_perf_name+"_clearAllCanvases" , "END");

			// Set the OUTPUT canvas CSS background-color to black.
			JSGAME.SHARED.PERFORMANCE.stamp(_perf_name+"_OUTPUTcanvasToBlack" , "START");
			core.GRAPHICS.canvas.OUTPUT.style["background-color"]="black";
			JSGAME.SHARED.PERFORMANCE.stamp(_perf_name+"_OUTPUTcanvasToBlack" , "END");

			// Done! Resolve.
			res1();
		}
		catch(e){ rej1({_perf_name, e}); }
	});},

};

// *** SHORTHAND METHODS ***

// _DOC_ | _CGF | Shortened way to access core.GRAPHICS.FUNCS
let _CGF  = core.GRAPHICS.FUNCS;

// _DOC_ | _CGF | Shortened way to access core.GRAPHICS.FUNCS.USER
let _CGFU = _CGF.USER;

// _DOC_ | _CGFI | Shortened way to access _CGF.INTERNAL.
let _CGFI = _CGF.INTERNAL;

// _DOC_ | _CGA | Shortened way to access core.ASSETS.
let _CGA  = core.GRAPHICS.ASSETS;

// _DOC_ | _CGP | Shortened way to access core.GRAPHICS.performance.
let _CGP  = core.GRAPHICS.performance;

// _DOC_ | _CS | Shortened way to access core.SETTINGS.
let _CS   = core.SETTINGS;


