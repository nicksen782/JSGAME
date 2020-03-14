// ====================================
// ==== FILE START: videoMode_A.js ====
// ====================================

'use strict';


// Graphics assets.
core.ASSETS.graphics = {
	tilesetNames  : []   , // Name of each tileset.
	ramtiles      : []   , // RAM-tiles are stored here.
	tiles         : []   , // Normal tiles are stored here.
	tilemaps      : []   , // Tilemaps for all tilesets are stored here.
} ; // Unchanging assets.

core.GRAPHICS        = {
	FADER         : {} , //
	debug         : {} , //
	fonts         : {} , //
	activeTileset : {
		BG     : null , // String of the tileset used for this layer.
		BG2    : null , // String of the tileset used for this layer.
		SPRITE : null , // String of the tileset used for this layer.
		TEXT   : null , // String of the tileset used for this layer.
		FADE   : null , // String of the tileset used for this layer.
	} , //

	// PERFORMANCE MONITORING
	performance   : {
		BG      : [ 0, 0, 0, 0, 0 ] , //
		BG2     : [ 0, 0, 0, 0, 0 ] , //
		SPRITE  : [ 0, 0, 0, 0, 0 ] , //
		TEXT    : [ 0, 0, 0, 0, 0 ] , //
		FADE    : [ 0, 0, 0, 0, 0 ] , //
		OUTPUT  : [ 0, 0, 0, 0, 0 ] , //
	} , //
	tiles         : {} , //
	ramtiles      : {} , //
	spritebanks   : [] , // Max of 4 indexes.
	tiles_flipped           : {     // Flipped versions of previously flipped sprite tiles.
		// EXAMPLE:
		// "tilesetName" :{
		// 	149 : {
		// 		X  : "canvas" ,
		// 		Y  : "canvas" ,
		// 		XY : "canvas" ,
		// 	}
		// },
	},

	// Font settings.
	fontSettings : {
		fontmap   : "" , // Takes the string of a fontmap.
		tileset   : "" , // Takes the string of the tileset used for the fontmap.
	},

	// CANVAS
	canvas : {} , // Canvas elems.
	ctx    : {} , // Canvas contexts.

	// VRAM
	VRAM1          : [] , // VRAM1, tiles (current)
	VRAM1_TO_WRITE : [] , // What needs to be drawn on the current frame.
	VRAM2          : [] , // VRAM2, text (current)
	VRAM2_TO_WRITE : [] , // What needs to be drawn on the current frame.
	VRAM3          : [] , // VRAM3, BG2 (current)
	VRAM3_TO_WRITE : [] , // What needs to be drawn on the current frame.

	// TRACKED TILES THAT HAVE TRANSPARENCY
	trackedTransparentTiles : {},

	// FLAGS - A change has been specified.
	flags : {
		BG     : false , // Draw layer.
		BG2    : false , // Draw layer.
		SPRITE : false , // Draw layer.
		TEXT   : false , // Draw layer.
		FADE   : false , // Draw layer.
		OUTPUT : false , // Draw output.
		INLAYERUPDATE : false , //
		BG_force     : false , // Forcing the drawing even if it normally would not draw.
		BG2_force    : false , // Forcing the drawing even if it normally would not draw.
		SPRITE_force : false , // Forcing the drawing even if it normally would not draw.
		TEXT_force   : false , // Forcing the drawing even if it normally would not draw.
		// FADE_force   : false , // Forcing the drawing even if it normally would not draw.
		OUTPUT_force : false , // Forcing the drawing even if it normally would not draw.
	},

	// Sprites
	sprites : [
		// x         , // x pixel position.
		// y         , // y pixel position.
		// tileIndex , // tile index used by this sprite.
		// flags     , // flags in use by this sprite (binary.)
		// hash        // "hash" of the data for this sprite.
	] ,
	sprites_prev : [
		// x         , // x pixel position.
		// y         , // y pixel position.
		// tileIndex , // tile index used by this sprite.
		// flags     , // flags in use by this sprite (binary.)
		// hash        // "hash" of the data for this sprite.
	] ,
	sprites_toClear : [] ,
};

core.CONSTS          = {
	// Sprites (constants used with bitmasks.)
	SPRITE_FLIP_X : 1    , //             (B 00000001)
	SPRITE_FLIP_Y : 2    , //             (B 00000010)
	SPRITE_OFF    : 4    , //             (B 00000100)
	SPRITE_RAM    : 8    , //             (B 00001000)
	SPRITE_BANK0  : 0<<6 , // 0<<6 is 0   (B 00000000)
	SPRITE_BANK1  : 1<<6 , // 1<<6 is 64  (B 01000000)
	SPRITE_BANK2  : 2<<6 , // 2<<6 is 128 (B 10000000)
	SPRITE_BANK3  : 3<<6 , // 3<<6 is 192 (B 11000000)

	// Other constants:
	OffscreenCanvas_supported : undefined ,
};

core.GRAPHICS.FADER = {
	FUNCS  : {
		// *** FADE update functions. ***

		// Processes the fade.
		ProcessFading : function(ctx){
			return new Promise(function(res,rej){
					let drawStart_FADE;
					if(JSGAME.FLAGS.debug)       { drawStart_FADE   = performance.now();      _CG.performance.FADE.shift();   }

					let lastIndex = _CGF.CONSTS.FADER_STEPS -1 ;

					//
					let COMPLETED = function(){
						// If there was a fadeOut and the stayDark flag is set then draw a black screen.
						if(_CGF.stayDark){
							ctx.fillStyle = "#000022";
							ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
						}

						if(JSGAME.FLAGS.debug)       { _CG.performance.FADE.push(performance.now()-drawStart_FADE);           }

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
						_CG.flags.OUTPUT = true ;

						// Just draw what already exists for the FADE layer.
						ctx.drawImage(_CG.canvas.FADE, 0,0);
						_CG.ctx.FADE.drawImage(ctx.canvas, 0,0);

						_CGF.stayDark=true;
						_CGF.fadeActive=false;

						if(_CGF.blockAfterFade){ _CGF.blocking = true  ; }
						else                                  { _CGF.blocking = false ; }

						COMPLETED();
						return;

					};
					//
					let fadeInHasCompleted  = function(){
						// Make sure that OUTPUT is true.
						_CG.flags.OUTPUT = true ;

						// No changes. No change in the passed canvas.
						// Fading is done!
						_CGF.stayDark=false;
						_CGF.fadeActive=false;

						if(_CGF.blockAfterFade){ _CGF.blocking = true  ; }
						else                                  { _CGF.blocking = false ; }

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
							_CG.ctx.FADE.putImageData(imgData, 0,0);

							// Copy the image to the passed ctx.
							ctx.putImageData(imgData, 0,0);

							// Reset the counter.
							_CGF.currFadeFrame=_CGF.fadeSpeed;

							// Record previous fade step.
							_CGF.prevFadeStep = fadeStep ;

							// Is this the end of a fadeOut?
							if      ( _CGF.fadeDir == -1 && _CGF.fadeStep==0         ){ fadeOutHasCompleted(); }

							// Is this the end of a fadeIn?
							else if ( _CGF.fadeDir ==  1 && _CGF.fadeStep==lastIndex ){ fadeInHasCompleted(); }

							// Fade steps still remain!
							else{
								// Adjust to the new fade index.
								_CGF.fadeStep += _CGF.fadeDir ;

								COMPLETED();

								return;
							}

						};

						core.WORKERS.VIDEO   .postMessage(
							{
								"func"     : "fade",
								"maxRed"   : _CGF.CONSTS.fader[fadeStep].r ,
								"maxGreen" : _CGF.CONSTS.fader[fadeStep].g ,
								"maxBlue"  : _CGF.CONSTS.fader[fadeStep].b ,
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
					};
					//
					let addExistingFade    = function(){
						let BG     = _CG.flags.BG     ;
						let BG2;
						if(JSGAME.PRELOAD.PHP_VARS.useBG2){ BG2 = _CG.flags.BG2 ; }
						else                              { BG2 = false ; }
						let SPRITE = _CG.flags.SPRITE ;
						let TEXT   = _CG.flags.TEXT   ;
						// let FADE   = _CG.flags.FADE   ;
						// let OUTPUT = _CG.flags.OUTPUT ;

						// If the BG, SPRITE, and TEXT layers have NOT changed then we can just redraw from cache.
						if( !BG && !BG2 && !SPRITE && !TEXT ){
							// Update the passed ctx with the cached layer.
							ctx.drawImage(_CG.canvas.FADE, 0,0);
							COMPLETED();
							return;
						}

						// Otherwise, a new fade must be calculated.
						else{
							// doNewFade( _CGF.fadeStep );

							if( _CC.OffscreenCanvas_supported ){ doNewFade_withOffscreenCanvas( _CGF.fadeStep ); }
							else                               { doNewFade( _CGF.fadeStep ); }

							return;
						}

					};

					// Is the fader active?
					if(_CGF.fadeActive==false){ fadeIsInactive(); return; }
					// Yes the fader is active.
					else{
						// Shortened variables (don't use these to update with.)
						let fadeStep     = _CGF.fadeStep    ;
						let prevFadeStep = _CGF.prevFadeStep;

						// Will an adjustment need to be done? (Checking for a change in fadeStep.)
						if( prevFadeStep != fadeStep ){
							// Are we ready for the next fade frame?
							if(_CGF.currFadeFrame == 0){
								// Do the fade.
								// doNewFade(fadeStep);
								if( _CC.OffscreenCanvas_supported ){ doNewFade_withOffscreenCanvas( fadeStep ); }
								else                               { doNewFade( fadeStep ); }

								return;
							}

							// No? Decrement the counter.
							else{
								_CGF.currFadeFrame -= 1;

								// Can we send the existing FADE canvas or do we need to update first?
								if(_CG.flags.OUTPUT){ addExistingFade(); return; }
							}
						}
						else{ addExistingFade(); return; }

					}

			});
		},
		// Starts the fade.
		doFade        : function(speed, blocking, blockAfterFade){
			if(blockAfterFade==undefined){ blockAfterFade=false; }

			_CGF.fadeIn_complete  = false;
			_CGF.fadeOut_complete = false;

			_CGF.stayDark      = false;

			_CGF.blockAfterFade = blockAfterFade;

			_CGF.fadeActive    = true     ;
			_CGF.currFadeFrame = 0        ; //
			_CGF.fadeSpeed     = speed    ;
			_CGF.blocking      = blocking ;
		},
		// Sets up a fade out.
		FadeIn        : function(speed, blocking, blockAfterFade){
			if(blockAfterFade==undefined){ blockAfterFade=false; }

			_CGF.prevFadeStep = 99;
			_CGF.fadeStep     = 0;
			_CGF.fadeDir      = 1;
			_CGFF.doFade(speed, blocking, blockAfterFade);
		},
		// Sets up a fade in.
		FadeOut       : function(speed, blocking, blockAfterFade){
			if(blockAfterFade==undefined){ blockAfterFade=false; }

			_CGF.prevFadeStep = 99;
			_CGF.fadeStep     = _CGF.CONSTS.FADER_STEPS-1;
			_CGF.fadeDir      = -1;
			_CGFF.doFade(speed, blocking, blockAfterFade);
		},
		// Logic blockers for fades.
		blockLogic    : function(newValue){
			_CGF.blocking       = newValue;
			_CGF.blockAfterFade = newValue;
		},
	} ,
	CONSTS : {
		// *** FADER *** tim1724
		// Modified for JavaScript by nicksen782.
		FADER_STEPS : 13 , // Number of steps in a fade.
		fader : [
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
			{ b: 100, g: 100 , r: 100 } , // 12    11 111 111  3 7 7  , 255 , 0xFF
		], // The rgb values for each fade level.
	} ,
	prevFadeStep   : 0     , // Previous frame step.
	fadeStep       : 0     , // Current frame step.
	fadeSpeed      : 0     , // Speed between fader array index changes.
	currFadeFrame  : 0     , // Current index into the fader array.
	fadeDir        : 1     , // Direction of fade (1 is up, -1 is down.)
	fadeActive     : false , // Fade is active.
	blocking       : false , // Do not allow further game logic updates if true.
	blockAfterFade : false , //
	stayDark       : false , // Stay dark after fade completes.
};

/**
 * DRAW FUNCTIONS. (1)
 * @summary   ACCESSIBLE DRAW FUNCTIONS. (2)
 * @namespace core.FUNCS.graphics
*/
core.FUNCS.graphics = {
	/**
	 * USER-ACCESSIBLE DRAW FUNCTIONS.(1)
	 * @summary   USER-ACCESSIBLE DRAW FUNCTIONS. (2)
	 * @namespace core.FUNCS.graphics.USER
	*/
	USER : {
		/**
		 * testfunction1 (1)
		 * @summary   testfunction1 (2)
		 * @memberof core.FUNCS.graphics.USER
		 *
		 * @example _CGFU.testfunction1();
		*/
		testfunction1 : function(){

		},

		/**
		 * testfunction2 (1)
		 * @summary   testfunction2 (2)
		 * @memberof core.FUNCS.graphics.USER
		 *
		 * @example _CGFU.testfunction2();
		*/
		testfunction2 : function(){

		},

	},

	/**
	 * INTERNAL-ACCESSIBLE DRAW FUNCTIONS.(1)
	 * @summary   INTERNAL-ACCESSIBLE DRAW FUNCTIONS. (2)
	 * @namespace core.FUNCS.graphics.INTERNAL
	*/
	INTERNAL : {
	},

	// *** Helper functions ***

	// Clears each canvas.
	clearAllCanvases       : function(){
		console.log("what up?");
		// BG layer
		if(_CG.ctx.BG    ){
			// _CG.ctx.BG.fillStyle = "rgba(0, 0, 0, 1.0)";
			// _CG.ctx.BG.fillRect(0, 0, _CG.ctx.BG.canvas.width, _CG.ctx.BG.canvas.height);
			_CG.ctx.BG.clearRect(0, 0, _CG.ctx.BG    .canvas.width, _CG.ctx.BG    .canvas.height);
		}

		// BG2 layer
		if(_CG.ctx.BG2    ){
			// _CG.ctx.BG2.fillStyle = "rgba(0, 0, 0, 1.0)";
			// _CG.ctx.BG2.fillRect(0, 0, _CG.ctx.BG2.canvas.width, _CG.ctx.BG2.canvas.height);
			_CG.ctx.BG2.clearRect(0, 0, _CG.ctx.BG2    .canvas.width, _CG.ctx.BG2    .canvas.height);
		}

		// SPRITE layer
		if(_CG.ctx.SPRITE){
			_CG.ctx.SPRITE.clearRect(0, 0, _CG.ctx.SPRITE.canvas.width, _CG.ctx.SPRITE.canvas.height);
		}

		// TEXT layer
		if(_CG.ctx.TEXT  ){
			_CG.ctx.TEXT  .clearRect(0, 0, _CG.ctx.TEXT  .canvas.width, _CG.ctx.TEXT  .canvas.height);
		}

		// FADE layer
		if(_CG.ctx.FADE  ){
			_CG.ctx.FADE  .clearRect(0, 0, _CG.ctx.FADE  .canvas.width, _CG.ctx.FADE  .canvas.height);
		}

		// OUTPUT canvas
		if(_CG.ctx.OUTPUT){
			_CG.ctx.OUTPUT.fillStyle = "rgba(0, 0, 0, 1.0)";
			_CG.ctx.OUTPUT.fillRect(0, 0, _CG.ctx.OUTPUT.canvas.width, _CG.ctx.OUTPUT.canvas.height);
			// _CG.ctx.OUTPUT.clearRect(0, 0, _CG.ctx.OUTPUT.canvas.width, _CG.ctx.OUTPUT.canvas.height);
		}

		_CFG.ClearVram();
		_CFG.clearSprites();

		// Set the draw flags.
		_CG.flags.BG     = true ;
		if(JSGAME.PRELOAD.PHP_VARS.useBG2){ _CG.flags.BG2    = true ; }
		else { _CG.flags.BG2=false; }
		_CG.flags.SPRITE = true ;
		_CG.flags.TEXT   = true ;
		_CG.flags.FADE   = true ;
		_CG.flags.OUTPUT = true ;

		// Set the force draw flags.
		// _CG.flags.BG_force     = true ;
		// _CG.flags.TEXT_force   = true ;
		_CG.flags.OUTPUT_force = true ;
	},
	// Add to the cache of flipped canvas files (X, Y, XY)
	AddFlippedTileToCache  : function(tilesetname, tileIndex, FLIP_X, FLIP_Y, canvas){
		let flipKey = "";
		if     (FLIP_X && FLIP_Y){ flipKey="XY"; }
		else if(FLIP_X          ){ flipKey="X"; }
		else if(FLIP_Y          ){ flipKey="Y"; }

		// Does the tilesetname key NOT exist in _CG.tiles_flipped?
		if(_CG.tiles_flipped[tilesetname]==undefined){ _CG.tiles_flipped[tilesetname] = {}; }

		// Does the tile key NOT exist ?
		if(_CG.tiles_flipped[tilesetname][tileIndex]==undefined){ _CG.tiles_flipped[tilesetname][tileIndex] = {}; }

		// Does the flip key NOT exist ?
		if(_CG.tiles_flipped[tilesetname][tileIndex][flipKey]==undefined){ _CG.tiles_flipped[tilesetname][tileIndex][flipKey] = canvas; }
	},
	// Retrieve a cached flipped canvas tile (X, Y, XY)
	findFlippedTileInCache : function(tilesetname, tileIndex, FLIP_X, FLIP_Y){
		let canvas;
		let flipKey = "";
		if     (FLIP_X == _CC.SPRITE_FLIP_X && FLIP_Y == _CC.SPRITE_FLIP_Y ){ flipKey="XY"; }
		else if(FLIP_X == _CC.SPRITE_FLIP_X                                        ){ flipKey="X";  }
		else if(FLIP_Y == _CC.SPRITE_FLIP_Y                                        ){ flipKey="Y";  }
		else {
			console.error("invalid flipKey!");
		}

		// Check if the cached tile exists. Will throw and exception if it is does exist.
		try{
			canvas = _CG.tiles_flipped[tilesetname][tileIndex][flipKey];
			if(canvas==undefined){
				let str = ["findFlippedTileInCache: Flipped canvas not found.", JSON.stringify([])];
				// console.error(str);
				throw Error(str);
			}
			// console.log("Cached copy found!", canvas, tilesetname, tileIndex, FLIP_X, FLIP_Y, "flipKey:", flipKey, _CG.tiles_flipped[tilesetname][tileIndex], _CG.tiles_flipped[tilesetname][tileIndex][flipKey]);

			// Return the cached tile.
			return canvas;
		}

		// Exception thrown. Handle it by just returning false.
		catch(e){
			// console.log("Cached copy NOT found!", canvas, tilesetname, tileIndex, FLIP_X, FLIP_Y, "flipKey:", flipKey);
			return false;
		}

	},
	// Copies (by value) each object in the _CG.sprites array into _CG.sprites_prev.
	update_sprites_prev    : function(){
		// Clear _CG.sprites_prev.
		// _CG.sprites_prev.length=0;
		_CG.sprites_prev=[];

		// Get length of _CG.sprites array.
		let len = _CG.sprites.length;

		// Set all values in _CG.sprites into _CG.sprites_prev.
		for(let i=0; i<len; i+=1){
			let flags     = _CG.sprites[i].flags    ;
			let hash      = _CG.sprites[i].hash     ;
			let tileIndex = _CG.sprites[i].tileIndex;
			let x         = _CG.sprites[i].x << 0   ;
			let y         = _CG.sprites[i].y << 0   ;

			// Add the data.
			_CG.sprites_prev[i] = {
				"flags"     : flags     ,
				"hash"      : hash      ,
				"tileIndex" : tileIndex ,
				"x"         : x         ,
				"y"         : y         ,
				"spriteNum" : i         ,
			};
		}
	},
	// Axis-Aligned Bounding Box collision check. Checks for overlap of the two specified rectangles.
	rectCollisionDetection : function(src_rect1, src_rect2){
		// Needs to be passed: x, y, w, h.

		// https://developer.mozilla.org/en-US/docs/Games/Techniques/2D_collision_detection
		let r1 = { "x": src_rect1.x , "y": src_rect1.y , "w": src_rect1.w, "h": src_rect1.h };
		let r2 = { "x": src_rect2.x , "y": src_rect2.y , "w": src_rect2.w, "h": src_rect2.h };

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
	},
	// Determine which sprites are to be cleared and/or drawn.
	getSpriteChanges       : function(){
		// Any sprite set to clear will have any sprites that may have overlapped the same region drawn again.

		// Detect a change in curr vs prev.
		let curr_hashes = _CG.sprites     .map( (d) => { return d.hash; } );
		let prev_hashes = _CG.sprites_prev.map( (d) => { return d.hash; } );

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
			let len1 = _CG.sprites_prev.length;
			for(let i=0; i<len1; i+=1){
				retval.clear.push( {
					"flags"     : _CG.sprites_prev[i].flags     ,
					"tileIndex" : _CG.sprites_prev[i].tileIndex ,
					"x"         : _CG.sprites_prev[i].x << 0    ,
					"y"         : _CG.sprites_prev[i].y << 0    ,
					"spriteNum" : _CG.sprites_prev[i].spriteNum ,
				} );
			}

			// To DRAW
			let len2 = _CG.sprites.length;
			for(let i=0; i<len2; i+=1){
				// Detect sprites that are set to (empty) instead of being an object.
				if(_CG.sprites[i] == null){
					// If the value is null then provide SPRITE_OFF data in it's place.
					_CG.sprites[i] = {
						"x"         : 0                         ,
						"y"         : 0                         ,
						"tileIndex" : 0                         ,
						"flags"     : _CC.SPRITE_OFF  ,
						"hash"      : "",
						"spriteNum" : i ,
					};
					// console.error("value was null at:", i);
				}

				// Push the sprite data.
				retval.draw.push( {
					"flags"     : _CG.sprites[i].flags     ,
					"tileIndex" : _CG.sprites[i].tileIndex ,
					"x"         : _CG.sprites[i].x << 0    ,
					"y"         : _CG.sprites[i].y << 0    ,
					"spriteNum" : _CG.sprites[i].spriteNum ,
				} );
			}

			retval.changeDetected = true;
		}
		else{
			let len = curr_hashes.length;

			// Both hash lists should be the same length.
			for(let i=0; i<len; i+=1){
				// curr_hashes
				let curr_hash = curr_hashes[i];
				let prev_hash = prev_hashes[i];

				// CLEAR
				if(curr_hashes.indexOf(prev_hash) == -1 ){
					retval.clear.push( {
						"flags"     : _CG.sprites_prev[i].flags     ,
						"tileIndex" : _CG.sprites_prev[i].tileIndex ,
						"x"         : _CG.sprites_prev[i].x << 0    ,
						"y"         : _CG.sprites_prev[i].y << 0    ,
						"spriteNum" : _CG.sprites_prev[i].spriteNum ,
					} );

					// Check if this previous sprite was at least partially overlapping a current sprite.
					// Does this cleared sprite share its region with any existing sprites?
					for(let ii=0; ii<len; ii+=1){
						let aabb = _CFG.rectCollisionDetection(
							{
								"x" : _CG.sprites[ii].x ,
								"y" : _CG.sprites[ii].y ,
								"w" : _CS.TILE_WIDTH    ,
								"h" : _CS.TILE_HEIGHT   ,
							},
							{
								"x" : _CG.sprites_prev[i].x,
								"y" : _CG.sprites_prev[i].y,
								"w" : _CS.TILE_WIDTH       ,
								"h" : _CS.TILE_HEIGHT      ,
							}
						);
						if(aabb && overlapped.indexOf( _CG.sprites[ii].hash ) == -1){
						// if(aabb ){
							retval.draw.push( {
								"flags"     : _CG.sprites[ii].flags     ,
								"tileIndex" : _CG.sprites[ii].tileIndex ,
								"x"         : _CG.sprites[ii].x << 0    ,
								"y"         : _CG.sprites[ii].y << 0    ,
								"spriteNum" : _CG.sprites[ii].spriteNum ,
							} );

							// Add to the overlapped array. Make sure not to draw this one twice.
							overlapped.push( _CG.sprites[ii].hash );
						}
					}
				}

				// DRAW
				if(prev_hashes.indexOf(curr_hash) == -1 ){
					if(overlapped.indexOf(curr_hash) == -1){
						retval.draw.push( {
							"flags"     : _CG.sprites[i].flags     ,
							"tileIndex" : _CG.sprites[i].tileIndex ,
							"x"         : _CG.sprites[i].x << 0    ,
							"y"         : _CG.sprites[i].y << 0    ,
							"spriteNum" : _CG.sprites[i].spriteNum ,
						} );
					}
				}

				// IGNORE
				//

				retval.changeDetected = true;
			}
		}

		// Re-order the retval.draw. Lower spriteNums first.
		retval.clear.sort((a, b) => a.spriteNum - b.spriteNum);
		retval.draw .sort((a, b) => a.spriteNum - b.spriteNum);

		return retval;
	},

	// *** Layer update functions ***

	// Read through VRAM1 and update any tiles that have changed.
	update_layer_BG     : function(){
		return new Promise(function(res,rej){
			let drawStart_BG;
			if(JSGAME.FLAGS.debug)       { drawStart_BG     = performance.now();      _CG.performance.BG.shift();     }

			let canvasLayer = _CG.ctx.BG;
			let len ;
			let transparentTiles = [
				// "tileid" : 0 //
				// "x"      : 0 //
				// "y"      : 0 //
			];
			let force = _CG.flags.BG_force;
			let y ;
			let x ;
			let thisTile;
			let i;
			let coord;
			let previd;
			let activeTileset = _CG.activeTileset.BG;
			if(!activeTileset){ let str="ERROR: update_layer_BG: Missing activeTileset!"; rej(str); return; }

			// Draws the tiles that have transparencies. Used AFTER the rest of the tiles have been drawn.
			let drawTransparentTiles = function(tiles){
				for(let t=0; t<tiles.length; t+=1){
					// Write the tile data to the tempCanvas.
					let rec = tiles[t];
					let tileid = rec.tileid;
					let x      = rec.x << 0;
					let y      = rec.y << 0;
					canvasLayer.drawImage(_CG.tiles[ activeTileset ][ tileid ], x, y );
				}
			};

			// Will this layer have an update?
			if(_CG.flags.BG || _CG.flags.BG_force) {
				// Set the OUTPUT flag.
				_CG.flags.OUTPUT = true;

				// STEP 1: Find the transparent tiles in VRAM1.
				y = 0 ;
				x = 0 ;
				len = _CG.VRAM1.length;
				for(i=0; i<len; i+=1){
					// VRAM BOUNDS CHECKING AND ROW INCREMENTING.
					if(x>=_CS.VRAM_TILES_H){ x=0; y+=1; }
					if(y>=_CS.VRAM_TILES_V){ break;     }

					// Get the tile id at this region of the vram.
					thisTile = _CG.VRAM1[i];

					// Is this id one of the tiles with transparencies? Add it to the list.
					if(
						_CG.trackedTransparentTiles[activeTileset] &&
						_CG.trackedTransparentTiles[activeTileset].indexOf(thisTile) != -1
					){
						transparentTiles.push({
							// "canvas" : _CG.tiles[ activeTileset ][ thisTile ],
							"tileid" : thisTile ,
							"x"      : (x*_CS.TILE_WIDTH)  << 0,
							"y"      : (y*_CS.TILE_HEIGHT) << 0,
							}
						);
					}

					// Increment x.
					x+=1;
				}

				// STEP 2: If force then draw EVERYTHING in VRAM1.
				if(force){
					y = 0 ;
					x = 0 ;
					len = _CG.VRAM1.length;
					for(i=0; i<len; i+=1){
						// VRAM BOUNDS CHECKING AND ROW INCREMENTING.
						if(x>=_CS.VRAM_TILES_H){ x=0; y+=1; }
						if(y>=_CS.VRAM_TILES_V){ break;     }

						// Get the tile id at this region of the vram.
						thisTile = _CG.VRAM1[i];

						// Write the tile data to the tempCanvas.
						try{
							canvasLayer.drawImage(
								_CG.tiles[ activeTileset ][ thisTile ],
								(x*_CS.TILE_WIDTH)  << 0,
								(y*_CS.TILE_HEIGHT) << 0
							);
						}
						catch(e){
							console.error(
								e,
								"\n"+"canvas  :", _CG.tiles[ activeTileset ][ thisTile ],
								"\n"+"x       :", (x) << 0,
								"\n"+"y       :", (y) << 0,
								"\n"+"thisTile:", thisTile
							);
						}

						// Increment x.
						x+=1;
					}
				}

				// STEP 3: Now draw what needs to be drawn in VRAM1_TO_WRITE.
				len = _CG.VRAM1_TO_WRITE.length;
				if(len){
					for(i=0; i<len; i+=1){
						coord    = _CG.VRAM1_TO_WRITE[i] ;
						thisTile = coord.id ;
						x        = coord.x << 0  ;
						y        = coord.y << 0  ;
						previd   = coord.previd ;

						// Is the new tile a tile with transparency? Write the previous tile instead (new tile will be written later. )
						if(
							transparentTiles.length &&
							_CG.trackedTransparentTiles[activeTileset] &&
							_CG.trackedTransparentTiles[activeTileset].indexOf(thisTile) != -1
						){
							// Write the previous tile data to the tempCanvas.
							try{
								canvasLayer.drawImage(
									_CG.tiles[ activeTileset ][ previd ],
									(x*_CS.TILE_WIDTH)  << 0,
									(y*_CS.TILE_HEIGHT) << 0
								);
							}
							catch(e){
								console.error(
									e,
									"\n"+"canvas:", _CG.tiles[ activeTileset ][ previd ],
									"\n"+"previd:", previd
								);
							}
						}
						// Write the new tile.
						else{
							// Write the tile data to the tempCanvas.
							try{
								canvasLayer.drawImage(
									_CG.tiles[ activeTileset ][ thisTile ],
									(x*_CS.TILE_WIDTH)  << 0,
									(y*_CS.TILE_HEIGHT) << 0
								);
							}
							catch(e){
								console.error(
									e,
									"\n"+"canvas:", _CG.tiles[ activeTileset ][ thisTile ],
									"\n"+"thisTile:", thisTile
								);
							}
						}
					}

				}

				// STEP 4: Now do the second layer tiles...
				if(transparentTiles.length){ drawTransparentTiles(transparentTiles); }

				// Reset VRAM1_TO_WRITE since everything has been written.
				_CG.VRAM1_TO_WRITE=[];

				_CG.flags.OUTPUT = true;
			}

			if(JSGAME.FLAGS.debug)       { _CG.performance.BG.push(performance.now()-drawStart_BG);                   }

			res();
		});
	},
	// Read through VRAM3 and update any tiles that have changed.
	update_layer_BG2    : function(){
		// Very similar to update_layer_BG.
		// Pre-clears the tile.
		// Will not draw the transparent tile.

		return new Promise(function(res,rej){
			let drawStart_BG2;
			if(JSGAME.FLAGS.debug)       { drawStart_BG2     = performance.now();      _CG.performance.BG2.shift();     }

			let canvasLayer = _CG.ctx.BG2;
			let len ;
			let transparentTiles = [
				// "tileid" : 0 //
				// "x"      : 0 //
				// "y"      : 0 //
			];
			let force = _CG.flags.BG2_force;
			let y ;
			let x ;
			let thisTile;
			let i;
			let coord;
			let previd;
			let activeTileset = _CG.activeTileset.BG2;
			if(!activeTileset){ let str="ERROR: update_layer_BG2: Missing activeTileset!"; rej(str); return; }

			// Draws the tiles that have transparencies. Used AFTER the rest of the tiles have been drawn.
			let drawTransparentTiles = function(tiles){
				for(let t=0; t<tiles.length; t+=1){
					// Write the tile data to the tempCanvas.
					let rec = tiles[t];
					let tileid = rec.tileid;
					let x      = rec.x;
					let y      = rec.y;
					canvasLayer.drawImage(_CG.tiles[ activeTileset ][ tileid ], x, y );
				}
			};

			// Will this layer have an update?
			if(_CG.flags.BG2 || _CG.flags.BG2_force) {
				// Set the OUTPUT flag.
				_CG.flags.OUTPUT = true;

				// STEP 1: Find the transparent tiles in VRAM1.
				y = 0 ;
				x = 0 ;
				len = _CG.VRAM3.length;
				for(i=0; i<len; i+=1){
					// VRAM BOUNDS CHECKING AND ROW INCREMENTING.
					if(x>=_CS.VRAM_TILES_H){ x=0; y+=1; }
					if(y>=_CS.VRAM_TILES_V){ break;     }

					// Get the tile id at this region of the vram.
					thisTile = _CG.VRAM3[i];

					// Is this id one of the tiles with transparencies? Add it to the list.
					if(
						_CG.trackedTransparentTiles[activeTileset] &&
						_CG.trackedTransparentTiles[activeTileset].indexOf(thisTile) != -1
					){
						transparentTiles.push({
							// "canvas" : _CG.tiles[ activeTileset ][ thisTile ],
							"tileid" : thisTile ,
							"x"      : (x*_CS.TILE_WIDTH)  << 0,
							"y"      : (y*_CS.TILE_HEIGHT) << 0,
							}
						);
					}

					// Increment x.
					x+=1;
				}

				// STEP 2: If force then draw EVERYTHING in VRAM1.
				if(force){
					y = 0 ;
					x = 0 ;
					len = _CG.VRAM3.length;
					for(i=0; i<len; i+=1){
						// VRAM BOUNDS CHECKING AND ROW INCREMENTING.
						if(x>=_CS.VRAM_TILES_H){ x=0; y+=1; }
						if(y>=_CS.VRAM_TILES_V){ break;     }

						// Get the tile id at this region of the vram.
						thisTile = _CG.VRAM3[i];

						// Write the tile data to the tempCanvas.
						try{
							// Clear the tile destination first.
							canvasLayer.clearRect(
								(x*_CS.TILE_WIDTH)  << 0,
								(y*_CS.TILE_HEIGHT) << 0,
								_CS.TILE_WIDTH,
								_CS.TILE_HEIGHT
							);

							if(thisTile != core.ASSETS.graphics.tilemaps.transparentTile[2]){
								canvasLayer.drawImage(
									_CG.tiles[ activeTileset ][ thisTile ],
									(x*_CS.TILE_WIDTH)  << 0,
									(y*_CS.TILE_HEIGHT) << 0
								);
							}
						}
						catch(e){
							console.error(
								e,
								"\n"+"canvas  :", _CG.tiles[ activeTileset ][ thisTile ],
								"\n"+"x       :", (x) << 0,
								"\n"+"y       :", (y) << 0,
								"\n"+"thisTile:", thisTile
							);
						}

						// Increment x.
						x+=1;
					}
				}

				// STEP 3: Now draw what needs to be drawn in VRAM1_TO_WRITE.
				len = _CG.VRAM3_TO_WRITE.length;
				if(len){
					for(i=0; i<len; i+=1){
						coord    = _CG.VRAM3_TO_WRITE[i] ;
						thisTile = coord.id ;
						x        = coord.x << 0  ;
						y        = coord.y << 0  ;
						previd   = coord.previd ;

						// Is the new tile a tile with transparency? Write the previous tile instead (new tile will be written later. )
						if(
							transparentTiles.length &&
							_CG.trackedTransparentTiles[activeTileset] &&
							_CG.trackedTransparentTiles[activeTileset].indexOf(thisTile) != -1
						){
							// Write the previous tile data to the tempCanvas.
							try{
								// Clear the tile destination first.
								canvasLayer.clearRect(
									(x*_CS.TILE_WIDTH)  << 0,
									(y*_CS.TILE_HEIGHT) << 0,
									_CS.TILE_WIDTH,
									_CS.TILE_HEIGHT
								);

								if(thisTile != core.ASSETS.graphics.tilemaps.transparentTile[2]){
									canvasLayer.drawImage(
										_CG.tiles[ activeTileset ][ previd ],
										(x*_CS.TILE_WIDTH)  << 0,
										(y*_CS.TILE_HEIGHT) << 0
									);
								}
							}
							catch(e){
								console.error(
									e,
									"\n"+"canvas:", _CG.tiles[ activeTileset ][ previd ],
									"\n"+"previd:", previd
								);
							}
						}
						// Write the new tile.
						else{
							// Write the tile data to the tempCanvas.
							try{
								// Clear the tile destination first.
								canvasLayer.clearRect(
									(x*_CS.TILE_WIDTH)  << 0,
									(y*_CS.TILE_HEIGHT) << 0,
									_CS.TILE_WIDTH,
									_CS.TILE_HEIGHT
								);
								if(thisTile != core.ASSETS.graphics.tilemaps.transparentTile[2]){
									canvasLayer.drawImage(
										_CG.tiles[ activeTileset ][ thisTile ],
										(x*_CS.TILE_WIDTH)  << 0,
										(y*_CS.TILE_HEIGHT) << 0
									);
								}
							}
							catch(e){
								console.error(
									e,
									"\n"+"canvas:", _CG.tiles[ activeTileset ][ thisTile ],
									"\n"+"thisTile:", thisTile
								);
							}
						}
					}

				}

				// STEP 4: Now do the second layer tiles...
				if(transparentTiles.length){ drawTransparentTiles(transparentTiles); }

				// Reset VRAM1_TO_WRITE since everything has been written.
				_CG.VRAM3_TO_WRITE=[];

				_CG.flags.OUTPUT = true;
			}

			if(JSGAME.FLAGS.debug)       { _CG.performance.BG2.push(performance.now()-drawStart_BG2);                   }

			res();
		});
	},
	// Read through _CG.sprites and update any sprites tiles that have changed.
	update_layer_SPRITE : function(){
		return new Promise(function(res,rej){
			let drawStart_SPRITE;
			if(JSGAME.FLAGS.debug)       { drawStart_SPRITE = performance.now();      _CG.performance.SPRITE.shift(); }

			//
			if(_CG.flags.SPRITE) {
				let canvasLayer = _CG.ctx.SPRITE;
				let changes     = _CFG.getSpriteChanges();

				// Have there been any sprite changes?
				if(changes.changeDetected){
					// CLEAR
					let len1 = changes.clear.length;
					for(let i=0; i<len1; i+=1){
						canvasLayer.clearRect(
							(changes.clear[i].x) ,
							(changes.clear[i].y) ,
							_CS.TILE_WIDTH,
							_CS.TILE_HEIGHT
						);
					}

					// DRAW
					let len2 = changes.draw.length;
					for(let i=0; i<len2; i+=1){
						// Get local copies of the sprite values and flags.
						let thisSprite = _CFG.getSpriteData( changes.draw[i] );

						// If this sprite is off then clear the sprite's area and skip drawing it.
						if(thisSprite.SPRITE_OFF){
							canvasLayer.clearRect(
								(thisSprite.x) ,
								(thisSprite.y) ,
								_CS.TILE_WIDTH,
								_CS.TILE_HEIGHT
							);
							continue;
						}

						// If the tileset name was not available, skip this sprite.
						if(!thisSprite.tilesetname){
							console.log("Missing tileset name (and the sprite was ON.)", thisSprite);
							continue;
						}

						// Get the canvas for this tile.
						let spriteTileData = _CG.tiles[ thisSprite.tilesetname ][ thisSprite.tileIndex ];

						// Does the indicated tileIndex exist in the indicated tileset?
						if(!spriteTileData){
							console.error(
								"update_layer_SPRITE: spriteTileData false.",
								"\n\t"+"spriteTileData:", spriteTileData,
								"\n\t"+"thisSprite    :", thisSprite,
								"\n\t"+"c/p           :", "_CG.tiles['"+thisSprite.tilesetname+"']["+thisSprite.tileIndex+"]" ,
								""
							);
							continue;
						}
						// The tile is good.
						else{
							// Does the 'spriteTileData' need to be flipped?
							if(thisSprite.SPRITE_FLIP_X || thisSprite.SPRITE_FLIP_Y){
								let cachedCanvas = false;

								// Check for a cached copy of this flipped tile.
								cachedCanvas = _CFG.findFlippedTileInCache(
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
									spriteTileData = _CFG.flipImage_canvas(
										spriteTileData                     , // Flip this imageData.
										(thisSprite.SPRITE_FLIP_X) ? 1 : 0 , // Flip on X?
										(thisSprite.SPRITE_FLIP_Y) ? 1 : 0   // Flip on Y?
										);

									// Cache the tile.
									_CFG.AddFlippedTileToCache(
										thisSprite.tilesetname   ,
										thisSprite.tileIndex     ,
										thisSprite.SPRITE_FLIP_X ,
										thisSprite.SPRITE_FLIP_Y ,
										spriteTileData
									);

								}
							}

							// Is this a real tile?
							if(!spriteTileData){
								console.error(
									"update_layer_SPRITE: spriteTileData false. (AFTER FLIP)",
									"\n\t"+"spriteTileData:", spriteTileData,
									"\n\t"+"thisSprite    :", thisSprite,
									"\n\t"+"c/p           :", "_CG.tiles['"+thisSprite.tilesetname+"']["+thisSprite.tileIndex+"]" ,
									""
								);
							}
							else{
								// Draw the tile.
								canvasLayer.drawImage(
									spriteTileData,
									(thisSprite.x) << 0,
									(thisSprite.y) << 0
								);
							}

						}
					}

					// Update sprites_prev.
					_CFG.update_sprites_prev();

					_CG.flags.OUTPUT = true;
				}

			}
			//

			if(JSGAME.FLAGS.debug)       { _CG.performance.SPRITE.push(performance.now()-drawStart_SPRITE);           }

			res();
		});
	},
	// Read through VRAM2 and update any tiles that have changed.
	update_layer_TEXT   : function(){
		return new Promise(function(res,rej){
			let drawStart_TEXT;

			let canvasLayer = _CG.ctx.TEXT;
			let force = _CG.flags.TEXT_force;
			let y = 0 ;
			let x = 0 ;
			let thisTile;
			let i;
			let len;
			let coord;
			let id;
			let activeTileset = _CG.fontSettings.tileset;
			if(!activeTileset){ console.error("ERROR: update_layer_TEXT: Missing activeTileset!"); rej(); return; }

			if(JSGAME.FLAGS.debug)       { drawStart_TEXT   = performance.now();      _CG.performance.TEXT.shift();   }

			if(_CG.flags.TEXT || _CG.flags.TEXT_force){
				_CG.flags.OUTPUT = true;

				// If force then draw EVERYTHING in VRAM2.
				if(force){
					// Go through each vram index.
					len = _CG.VRAM2.length;
					y = 0 ;
					x = 0 ;
					for(i=0; i<len; i+=1){
						// VRAM BOUNDS CHECKING AND ROW INCREMENTING.
						if(x>=_CS.VRAM_TILES_H){ x=0; y+=1; }
						if(y>=_CS.VRAM_TILES_V){ return;    }

						// Get the tile id at this region of the vram.
						thisTile      = _CG.VRAM2[i];

						// Clear the tile destination first.
						canvasLayer.clearRect(
							(x*_CS.TILE_WIDTH)  << 0,
							(y*_CS.TILE_HEIGHT) << 0,
							_CS.TILE_WIDTH,
							_CS.TILE_HEIGHT
						);

						// Write the tile data to the tempCanvas.
						try{
							canvasLayer.drawImage(
								_CG.tiles[ activeTileset ][ thisTile ],
								(x*_CS.TILE_WIDTH)  << 0,
								(y*_CS.TILE_HEIGHT) << 0
							);
						}
						catch(e){
							console.error(
								e,
								"\n"+"canvas  :", _CG.tiles[ activeTileset ][ thisTile ],
								"\n"+"x       :", x << 0,
								"\n"+"y       :", y << 0,
								"\n"+"thisTile:", thisTile
							);
						}

						// Increment x.
						x+=1;
					}
				}
				// Otherwise, draw what needs to be drawn in VRAM2_TO_WRITE.
				else{
					len = _CG.VRAM2_TO_WRITE.length;
					for(i=0; i<len; i+=1){
						coord = _CG.VRAM2_TO_WRITE[i] ;
						x     = coord.x  ;
						y     = coord.y  ;
						id    = coord.id ;

						// Clear the tile destination first.
						canvasLayer.clearRect(
							(x*_CS.TILE_WIDTH)  << 0,
							(y*_CS.TILE_HEIGHT) << 0,
							_CS.TILE_WIDTH,
							_CS.TILE_HEIGHT
						);

						// Write the tile data to the tempCanvas.
						try{
							canvasLayer.drawImage(
								_CG.tiles[ activeTileset ][ id ],
								(x*_CS.TILE_WIDTH)  << 0,
								(y*_CS.TILE_HEIGHT) << 0
							);
						}
						catch(e){
							console.error(
								e,
								"\n"+"canvas:", _CG.tiles[ activeTileset ][ id ],
								"\n"+"id:", id
							);
						}

					}

				}

				// Reset VRAM2_TO_WRITE since everything has been written.
				_CG.VRAM2_TO_WRITE=[];

				_CG.flags.OUTPUT = true;
			}

			if(JSGAME.FLAGS.debug)       { _CG.performance.TEXT.push(performance.now()-drawStart_TEXT);               }

			res();
		});
	},
	// Combine each layer and then draw to the output canvas.
	update_layer_OUTPUT : function(){
		// Combine all layers into output and then draw the attached DOM canvas.

		return new Promise(function(res,rej){
			let drawStart_OUTPUT;
			if(JSGAME.FLAGS.debug)       { drawStart_OUTPUT = performance.now();      _CG.performance.OUTPUT.shift(); }
			let COMPLETED = function(){
				if(JSGAME.FLAGS.debug)       { _CG.performance.OUTPUT.push(performance.now()-drawStart_OUTPUT);           }

				// Clear the draw flags.
				_CG.flags.BG     = false ;
				if(JSGAME.PRELOAD.PHP_VARS.useBG2){ _CG.flags.BG2    = false ; }
				_CG.flags.SPRITE = false ;
				_CG.flags.TEXT   = false ;
				_CG.flags.FADE   = false ;
				_CG.flags.OUTPUT = false ;

				// Clear the force flags.
				_CG.flags.BG_force     = false ;
				if(JSGAME.PRELOAD.PHP_VARS.useBG2){ _CG.flags.BG2_force    = false ; }
				_CG.flags.SPRITE_force = false ;
				_CG.flags.TEXT_force   = false ;
				_CG.flags.OUTPUT_force = false ;

				res();
			};

			// Force the output flag if the fader is active.
			if(_CGF.fadeActive){ _CG.flags.OUTPUT=true; }

			if(_CG.flags.OUTPUT || _CG.flags.OUTPUT_force){
				// Create the temp output.
				let tempOutput     = document.createElement("canvas");
				JSGAME.SHARED.setpixelated(tempOutput);
				let tempOutput_ctx = tempOutput.getContext('2d', { alpha: true });
				tempOutput.width   = _CG.canvas.OUTPUT.width;
				tempOutput.height  = _CG.canvas.OUTPUT.height;

				// Combine the individual layers.
				tempOutput_ctx.drawImage( _CG.canvas.BG    , 0, 0) ; // BG
				if(JSGAME.PRELOAD.PHP_VARS.useBG2){ tempOutput_ctx.drawImage( _CG.canvas.BG2   , 0, 0) ; } // BG2
				tempOutput_ctx.drawImage( _CG.canvas.SPRITE, 0, 0) ; // SPRITE
				tempOutput_ctx.drawImage( _CG.canvas.TEXT  , 0, 0) ; // TEXT

				// Change the composite settings for the temp canvas from this point on. (default is "source-over": Draws new shapes on top of the existing canvas content.)
				// https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/globalCompositeOperation
				let prev_globalCompositeOperation = tempOutput_ctx.globalCompositeOperation ;
				// tempOutput_ctx.globalCompositeOperation = "copy";                        // Only the new shape is shown.

				// Process the tempOutput further before writing it?
				_CGFF.ProcessFading(tempOutput_ctx)

				// Additional full-screen modifications from the game code?
				.then ( function() {
					tempOutput_ctx.globalCompositeOperation = prev_globalCompositeOperation;
					return core.EXTERNAL.GRAPHICS(tempOutput_ctx) ;
				} )

				// Draw to the output canvas.
				.then(
					function(){
						// Combine the layers into the temp output.
						// _CG.ctx.OUTPUT.clearRect(0, 0, tempOutput.width, tempOutput.height);
						_CG.ctx.OUTPUT.drawImage(tempOutput,0,0); // OUTPUT
						COMPLETED();
					},
					function(err){
						let str = ["update_layer_OUTPUT: ", JSON.stringify(err)];
						throw Error(str);
					}
				);
			}
			else{
				COMPLETED();
			}

		});

	},
	//
	update_allLayers    : function(){
		// While this flag is set, main will not run the logic loop or another graphics loop.
		_CG.flags.INLAYERUPDATE=true;

		// Make sure the draw flags match if the corresponding force flag is set.
		if(_CG.flags.BG_force)     { _CG.flags.BG     = true ; }
		if(JSGAME.PRELOAD.PHP_VARS.useBG2){
			if(_CG.flags.BG2_force)    { _CG.flags.BG2    = true ; }
		}
		if(_CG.flags.SPRITE_force) { _CG.flags.SPRITE = true ; }
		if(_CG.flags.TEXT_force)   { _CG.flags.TEXT   = true ; }
		if(_CG.flags.OUTPUT_force) { _CG.flags.OUTPUT = true ; }

		// If an update is not needed then the promise will resolve right away.
		let proms = [
			_CFG.update_layer_BG()     , // BG layer 1
			_CFG.update_layer_SPRITE() , // Sprite layer 1
			_CFG.update_layer_TEXT()   , // Text layer 1
		];
		if(JSGAME.PRELOAD.PHP_VARS.useBG2){
			proms.push(_CFG.update_layer_BG2() );    // BG layer 2
		}

		// Wait for the promises to resolve and then...
		Promise.all(proms).then(
			// Success? Write the OUTPUT layer.
			function(){
				_CFG.update_layer_OUTPUT().then(
					// Success? Clear INLAYERUPDATE.
					function(){
						// Allowing another game loop.
						_CG.flags.INLAYERUPDATE=false;
					},
					// Failure? Throw error.
					function(err){
						let str = ["ERR: update_allLayers: failed in update_layer_OUTPUT: ", JSON.stringify(err)];
						// console.error(str);
						throw Error(str);
					}
				);
			},
			// Failure of at least one promise in the array? Throw error.
			function(err){
				let str = ["ERR: update_allLayers: failed promise in layer draws: ", JSON.stringify(err)];
				console.error(str, proms);
				throw Error(str);

			}
		);

	},

	// *** VRAM functions.

	// Sets the tileset to use when drawing bg tiles.
	SetTileTable        : function(tileset, layer){
		// NOTE: layer can be something like "BG" or "BG2".

		// Make sure that the tileset is actually available.
		if(core.ASSETS.graphics.tilesetNames.indexOf(tileset) != -1){
			// Adjust the tileset for the specified layer.
			_CG.activeTileset[layer] = tileset ;

			// Indicate that a background draw is needed for that layer.
			_CG.flags[layer]         = true;
		}
		else                                                        {
			let str = ["INVALID TILE TABLE NAME! : ", JSON.stringify(tileset)];
			// console.error(str);
			throw Error(str);
		}

	},
	// Sets all values in the specified VRAM to 0.
	ClearVram           : function(vram_str){
		// vram_str can be 'VRAM1' or 'VRAM2' or 'VRAM3'
		// If neither is specified then both will be cleared.

		let doAll = false;

		// Was vram NOT specified?
		if( vram_str == undefined ){ doAll = true; }

		if(vram_str=='VRAM1' || doAll==true){
			// Clear VRAM1 and VRAM1_TO_WRITE.
			_CG.VRAM1_TO_WRITE=[];
			for(let y=0; y<_CS.VRAM_TILES_V; y+=1){
				for(let x=0; x<_CS.VRAM_TILES_H; x+=1){
					_CFG.SetTile(x,y,0,"VRAM1");
				}
			}

			// Indicate that a draw is required for this layer.
			_CG.flags.BG       = true;
			_CG.flags.BG_force = true;
		}
		if(vram_str=='VRAM2' || doAll==true){
			// Clear VRAM2 and VRAM2_TO_WRITE.
			_CG.VRAM2_TO_WRITE=[];
			for(let y=0; y<_CS.VRAM_TILES_V; y+=1){
				for(let x=0; x<_CS.VRAM_TILES_H; x+=1){
					_CFG.SetTile(x,y,0,"VRAM2");
				}
			}

			// Indicate that a draw is required for this layer.
			_CG.flags.TEXT       = true;
			_CG.flags.TEXT_force = true;
		}
		if(vram_str=='VRAM3' || doAll==true){
			// The transparent tile needs to be defined as a tilemap.
			let transparentTile;
			let canContinue=false;

			// Does the transparentTile map exist?
			try {
				transparentTile = core.ASSETS.graphics.tilemaps.transparentTile[2];
				canContinue     = true;
				if(!JSGAME.PRELOAD.PHP_VARS.useBG2){
					let str = ["useBG2 was false : ", JSON.stringify([])];
					// console.error(str);
					throw Error(str);
				}
			}
			catch(e) { canContinue=false; }

			// Only progress if the transparentTile is defined.
			if(canContinue){
				// Clear VRAM3 and VRAM3_TO_WRITE.
				_CG.VRAM3_TO_WRITE=[];
				for(let y=0; y<_CS.VRAM_TILES_V; y+=1){
					for(let x=0; x<_CS.VRAM_TILES_H; x+=1){
						_CFG.SetTile(x, y, transparentTile, "VRAM3");
					}
				}

				// Indicate that a draw is required for this layer.
				_CG.flags.BG2       = true;
				_CG.flags.BG2_force = true;
			}
		}

		// Force output. (unneeded?)
		// _CG.flags.OUTPUT_force = true ;
		// _CG.flags.OUTPUT       = true ;
	},
	// Draws a bg tile to the specified location.
	SetTile             : function(x, y, id, vram_str){
		// vram_str can be 'VRAM1' or 'VRAM2' or 'VRAM3'
		if( vram_str==undefined ){ vram_str = 'VRAM1'; }

		if(vram_str=="VRAM3" && !JSGAME.PRELOAD.PHP_VARS.useBG2){
			// This should not happen.
			console.error("ERROR: Tried to set tile to VRAM3 but useBG2 was false.");
			return;
		}

		// Determine the VRAM index.
		let addr = ( y * _CS.VRAM_TILES_H ) + x ;

		// Update VRAMx_TO_WRITE.
		core.GRAPHICS[vram_str+"_TO_WRITE"].push({
			"x"      : x  ,
			"y"      : y  ,
			"id"     : id ,
			"previd" : core.GRAPHICS[vram_str][ addr ] ,
		});

		// Make the change.
		core.GRAPHICS[vram_str][ addr ] = id;

		// Indicate that a background draw is needed.
		if     (vram_str=='VRAM1'){ _CG.flags.BG   = true; }
		else if(vram_str=='VRAM2'){ _CG.flags.TEXT = true; }
		else if(vram_str=='VRAM3'){
			if(JSGAME.PRELOAD.PHP_VARS.useBG2){
				_CG.flags.BG2    = true ;
			}
		}
	},
	// Draws a tile map to the specified location.
	DrawMap2            : function(x, y, map, vram_str){
		// Draw a tilemap to the specified VRAM.

		// vram_str can be 'VRAM1' or 'VRAM2' or 'VRAM3'
		if( vram_str==undefined ){ vram_str = 'VRAM1'; }

		// Width and height should be the first values in a tilemap.
		let mapWidth  = map[0] ;
		let mapHeight = map[1] ;

		// Set the tiles.
		for(let dy = 0; dy < mapHeight; dy++){
			for(let dx = 0; dx < mapWidth; dx++){
				// This bounds check will force the drawn image to wrap.
				// if(x+dx >= _CS.VRAM_TILES_H){ x=0; }
				// if(y+dy >= _CS.VRAM_TILES_V){ y=0; }

				_CFG.SetTile(x + dx, y + dy, map[ (dy * mapWidth) + dx + 2 ], vram_str);
			}
		}
	},
	// Fills a region with a tile based on map dimensions.
	FillMap             : function(x, y, map, vram_str, tileid){
		// vram_str can be 'VRAM1' or 'VRAM2' or 'VRAM3'
		_CFG.Fill(x, y, map[0], map[1], tileid, vram_str );
	},
	// Fills a rectangular region with the specified tile id.
	Fill                : function(xpos, ypos, w, h, tileid, vram_str){
		// vram_str can be 'VRAM1' or 'VRAM2' or 'VRAM3'
		if( vram_str == undefined ){ vram_str='VRAM1'; }

		for(let y=0; y<h; y+=1){
			for(let x=0; x<w; x+=1){
				// Update VRAM
				_CFG.SetTile(x+xpos, y+ypos, tileid, vram_str);
			}
		}
	},
	// Gets the tile id value at the specified coordinates from the specified vram.
	GetTile             : function(x, y, vram_str){
		// vram_str can be 'VRAM1' or 'VRAM2' or 'VRAM3'
		if( vram_str==undefined){ vram_str = 'VRAM1'; }
		return core.GRAPHICS[vram_str][ ( y * _CS.VRAM_TILES_H ) + x ] ;
	},
	// Return a the specified tilemap.
	getTilemap          : function(tilemap_str, vram_str){
		// vram_str can be 'VRAM1' or 'VRAM2' or 'VRAM3'
		if( vram_str==undefined ){ vram_str='VRAM1'; }
		let tilemap = core.ASSETS.graphics.tilemaps[tilemap_str];
		if(tilemap){ return tilemap; }
		else{ return new Uint8ClampedArray([0,0]); }
	},
	// Return a tilemap of the specified region of VRAM.
	vramRegionToTilemap : function(startx, starty, w, h, vram_str){
		// vram_str can be 'VRAM1' or 'VRAM2' or 'VRAM3'

		// Give the width and height to the new tilemap.
		let tilemap = [w,h];

		// Get the tiles.
		for(    let y=0; y<h; y+=1){
			for(let x=0; x<w; x+=1){
				tilemap.push(
					_CFG.GetTile(x+startx,y+starty, vram_str)
				);
			}
		}

		// Return the tilemap.
		return tilemap;
	},

	// *** SPRITE update functions. ***

	// Clears the _CG.sprites array.
	clearSprite        : function(spriteNum){
		// NOTE: This does NOT remove the sprite tile from the canvas.

		// Set the sprite to defaults and SPRITE_OFF.
		_CG.sprites[spriteNum] = {
			"x"         : 0                         ,
			"y"         : 0                         ,
			"tileIndex" : 0                         ,
			"flags"     : _CC.SPRITE_OFF  ,
			"hash"      : "CLEARED",
			"spriteNum" : spriteNum
		};

		// Set the force draw flag on the sprites.
		_CG.flags.SPRITE = true ;
		// _CG.flags.SPRITE_force = true ;

		// Clear the canvas layer for sprites.
		// if(_CG.ctx.SPRITE){
		// 	_CG.ctx.SPRITE.clearRect(0, 0, _CG.ctx.SPRITE.canvas.width, _CG.ctx.SPRITE.canvas.height);
		// }
	},
	// Clears the _CG.sprites array.
	clearSprites       : function(){
		// Set all existing sprites to be SPRITE_OFF.
		// _CG.sprites=[];
		let len = _CG.sprites.length;
		for(let i=0; i<len; i+=1){
			_CFG.clearSprite(i);
		}

		// Blank out sprites_prev.
		_CG.sprites_prev=[];

		// Set the force draw flag on the sprites.
		_CG.flags.SPRITE = true ;
		_CG.flags.SPRITE_force = true ;

		_CG.flags.OUTPUT = true ;
		_CG.flags.OUTPUT_force = true ;

		// Clear the canvas layer for sprites.
		if(_CG.ctx.SPRITE){
			_CG.ctx.SPRITE.clearRect(0, 0, _CG.ctx.SPRITE.canvas.width, _CG.ctx.SPRITE.canvas.height);
		}
	},
	// Sets the tileset for the specified sprite bank.
	SetSpritesTileBank : function(bank, tileset){
		// Make sure that the tileset is actually available.
		if(core.ASSETS.graphics.tilesetNames.indexOf(tileset) != -1){
			_CG.spritebanks[bank] = tileset;
		}
		else{
			let str = ["INVALID TILE TABLE NAME! : ", JSON.stringify(tileset)];
			// console.error(str);
			throw Error(str);
		}

		// Indicate that a sprite draw is needed.
		_CG.flags.SPRITE  = true ;
	},
	// Returns hash of parts of the provide object (should be a sprite.)
	hashSprite         : function(obj){
		// NOTE: If any of these values are NaN, null, or undefined then this function will fail.

		let toReturn = "";

		// Try the normal way.
		try{
			toReturn =  "X:"         + (obj.x         .toString()) + "_" +
						"Y:"         + (obj.y         .toString()) + "_" +
						"TILEINDEX:" + (obj.tileIndex .toString()) + "_" +
						"FLAGS:"     + (obj.flags     .toString()) + "_" +
						"SPRITENUM:" + (obj.spriteNum .toString())
			;
		}

		// Error somewhere.
		catch(e){
			toReturn =  "X:"         + (obj.x         + '') + "_" +
						"Y:"         + (obj.y         + '') + "_" +
						"TILEINDEX:" + (obj.tileIndex + '') + "_" +
						"FLAGS:"     + (obj.flags     + '') + "_" +
						"SPRITENUM:" + (obj.spriteNum + '')
			;
			console.error("ERROR: hashSprite: ", e, obj);
		}

		return toReturn ;
	},
	// Adds the tiles of a sprite map to the sprites array.
	MapSprite2         : function(startSprite, map, spriteFlags){
		// Make sure that a map was actually passed.
		if(map==undefined){
			// console.error( "startSprite, map, spriteFlags:", startSprite, map, spriteFlags );
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
		if(spriteFlags & _CC.SPRITE_FLIP_X){
			x  = (mapWidth-1);
			dx = -1;
		}
		else{
			x  = 0;
			dx = 1;
		}

		// Flip on Y?
		if(spriteFlags & _CC.SPRITE_FLIP_Y){
			y  = (mapHeight-1);
			dy = -1;
		}
		else{
			y  = 0;
			dy = 1;
		}

		for(let i=0; i<numSprites; i+=1){
			_CG.sprites[startSprite+i] = {
				"x"         : 0 ,
				"y"         : 0 ,
				"tileIndex" : 0 ,
				"flags"     : 0 ,
				"hash"      : "INIT",
				"spriteNum" : startSprite+i
			};
		}

		// Place the sprite tile ids in order.
		for(let cy=0;cy<mapHeight;cy++){
			for(let cx=0;cx<mapWidth;cx++){
				t=map[(y*mapWidth)+x+2];
				_CG.sprites[startSprite].tileIndex = t           ;
				_CG.sprites[startSprite].flags     = spriteFlags ;
				x += dx;

				// Create the hash for this sprite.
				_CG.sprites[startSprite].hash = _CFG.hashSprite( _CG.sprites[startSprite] );

				// Increment the start sprite number.
				startSprite++;
			}
			y += dy;
			x = (spriteFlags & _CC.SPRITE_FLIP_X) ? (mapWidth-1) : 0 ;
		}

		// Indicate that a sprite draw is needed.
		_CG.flags.SPRITE=true;
	},
	// Updates the sprites of an already allocated sprite map in the sprites array.
	MoveSprite         : function(startSprite, x, y, width, height){
		let dy;
		let dx;

		for (dy = 0; dy < height; dy++){
			for (dx = 0; dx < width; dx++){
				_CG.sprites[startSprite].x = (x + (_CS.TILE_WIDTH  * dx)) << 0;
				_CG.sprites[startSprite].y = (y + (_CS.TILE_HEIGHT * dy)) << 0;

				// Create/update the hash for this sprite.
				_CG.sprites[startSprite].hash = _CFG.hashSprite( _CG.sprites[startSprite] );

				// Increment the start sprite number.
				startSprite++;
			}
		}

		// Indicate that a sprite draw is needed.
		_CG.flags.SPRITE=true;
	},
	// Accepts new flags for a sprite and then re-maps and moves it.
	changeSpriteFlags  : function(spriteNum, newFlags){
		// Get handle to the specified sprite.
		let sprite=_CG.sprites[spriteNum];

		// Map the sprite again (single sprite at a time.)
		_CFG.MapSprite2(spriteNum, [1,1,sprite.tileIndex], newFlags);

		// Move the sprite to update it on screen.
		_CFG.MoveSprite(spriteNum, sprite.x, sprite.y, 1, 1);

		// Redundant.
		// _CG.flags.SPRITE=true;
	},
	// USED BY: update_layer_SPRITE.
	getSpriteData      : function(thisSprite){
		// Get local copies of the sprite values and flags.
		let x           = thisSprite.x         ;
		let y           = thisSprite.y         ;
		let tileIndex   = thisSprite.tileIndex ;
		let flags       = thisSprite.flags     ;

		// Determine what the sprite flags have been set to.
		let SPRITE_OFF        = (_CC.SPRITE_OFF  & flags) == _CC.SPRITE_OFF    ? 1 : 0 ;

		let SPRITE_FLIP_X = flags & _CC.SPRITE_FLIP_X  ;
		let SPRITE_FLIP_Y = flags & _CC.SPRITE_FLIP_Y  ;

		// Determine what the sprite flags have been set to.
		let SPRITE_RAM        = (_CC.SPRITE_RAM    & flags) == _CC.SPRITE_RAM    ? 1 : 0 ;

		// Determine the sprite bank in use for this sprite. (Start with the highest value first.)
		let tilesetname="";

		// Get the flags for the active sprite bank.
		let SPRITE_BANK0 = ( (0b11000000 & flags) ) == _CC.SPRITE_BANK0  ; // 0b11000000 is the bitmask for the bank bits.
		let SPRITE_BANK1 = ( (0b11000000 & flags) ) == _CC.SPRITE_BANK1 ; // 0b11000000 is the bitmask for the bank bits.
		let SPRITE_BANK2 = ( (0b11000000 & flags) ) == _CC.SPRITE_BANK2 ; // 0b11000000 is the bitmask for the bank bits.
		let SPRITE_BANK3 = ( (0b11000000 & flags) ) == _CC.SPRITE_BANK3 ; // 0b11000000 is the bitmask for the bank bits.

		// Based on which sprite bank was true, set the tileset name for this sprite.
		if     ( SPRITE_BANK0 ){ tilesetname = _CG.spritebanks[0] ; }
		else if( SPRITE_BANK1 ){ tilesetname = _CG.spritebanks[1] ; }
		else if( SPRITE_BANK2 ){ tilesetname = _CG.spritebanks[2] ; }
		else if( SPRITE_BANK3 ){ tilesetname = _CG.spritebanks[3] ; }

		// Return the data as an object.
		let output = {
			"tilesetname"   : tilesetname   ,
			"x"             : x             ,
			"y"             : y             ,
			"tileIndex"     : tileIndex     ,
			"flags"         : flags         ,

			"SPRITE_RAM"    : SPRITE_RAM    ,
			"SPRITE_OFF"    : SPRITE_OFF    ,
			"SPRITE_FLIP_X" : SPRITE_FLIP_X ,
			"SPRITE_FLIP_Y" : SPRITE_FLIP_Y ,
		};

		if(JSGAME.FLAGS.debug){
			output._DEBUG_fullFlags = {
				"_FLAGS_BINARY" : flags.toString(2).padStart(8, "0"),
				"_tilesetname"   : tilesetname   ,
				"_x"             : x             ,
				"_y"             : y             ,
				"_tileIndex"     : tileIndex     ,
				"_flags"         : flags         ,
				"SPRITE_OFF"    : SPRITE_OFF    ,
				"SPRITE_FLIP_X" : SPRITE_FLIP_X ,
				"SPRITE_FLIP_Y" : SPRITE_FLIP_Y ,
				"SPRITE_RAM"    : SPRITE_RAM    ,
				"SPRITE_BANK0"  : SPRITE_BANK0  ,
				"SPRITE_BANK1"  : SPRITE_BANK1  ,
				"SPRITE_BANK2"  : SPRITE_BANK2  ,
				"SPRITE_BANK3"  : SPRITE_BANK3  ,
			};
		}

		// console.log(output.tilesetname, output.tileIndex, output._DEBUG_fullFlags);

		return output;
	},
	// Flips a canvas on X and/or Y.
	flipImage_canvas   : function (srcCanvas, flipH, flipV) {
		// Accepts a canvas, creates a new temp canvas to do the flip then returns the new canvas.
		// Originally based on work from: yong: http://jsfiddle.net/yong/ZJQX5/

		// Test to make sure a srcCanvas is there.
		if(undefined == srcCanvas){
			console.log("srcCanvas was undefined.", srcCanvas);
			return srcCanvas;
		}

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
	},

	/**
	 * @summary   Update a value using a bit mask. (Per call can only turn "ON" or "OFF" bits. Not both.)
	 * @memberof core.FUNCS.graphics
	 * @param    {number} originalValue
	 * @param    {string} flagStr
	 * @param    {string} newState (string or boolean)
	 *
	 * @example core.FUNCS.graphics.setSpriteFlag(0b00111111, "SPRITE_BANK1", "ON");
	 * @example core.FUNCS.graphics.setSpriteFlag(0b00111111, "SPRITE_BANK1", 1);
	*/
	setSpriteFlag : function(originalValue, flagStr, newState){
		// Pre-clear all spritebank bits if this is a sprite_bank flag. (That type of flag takes 2 bits.)
		if(["SPRITE_BANK0","SPRITE_BANK1","SPRITE_BANK2","SPRITE_BANK3"].indexOf(flagStr) != -1){
			// Clear the bits. (Clear the MSB and leave the other bits as they are.)
			originalValue &= 0b00111111 ;
		}

		// Replace the bits.
		if     (newState=="ON"  || newState==1){ originalValue |=  (core.CONSTS[flagStr]); }
		else if(newState=="OFF" || newState==0){ originalValue &= ~(core.CONSTS[flagStr]); }
		else                    { console.log("setSpriteFlag: newState not 0 or 1."); }

		// Return the modified value.
		return originalValue;
	},

	// *** TEXT update functions. ***

	// Prints a line of text at the specified location.
	Print           : function(x, y, string, vram_str, fontsetname){
		// Example usage:
		// _CFG.Print(0,0, "HELLO", "VRAM2", "fonts1");

		let tileid;

		// Allow for the fontset to be temporarily switched.
		let fontmap ;
		if( fontsetname && core.ASSETS.graphics.tilemaps[fontsetname] ){
			fontmap = core.ASSETS.graphics.tilemaps[fontsetname];
		}
		else{
			fontmap = core.ASSETS.graphics.tilemaps[_CG.fontSettings.fontmap];
		}

		// Make sure that only a whole number makes it through.
		x = (x) << 0;
		y = (y) << 0;
		let startx = x;

		if( vram_str==undefined ){ vram_str='VRAM2'; }

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
			tileid = d.toUpperCase().charCodeAt() - 32;

			// Make sure this is a valid tile in the font map (bounds-check.)
			if(tileid < fontmap_len){ _CFG.SetTile(x, y, fontmap[ tileid+2 ], vram_str ); }

			// If it is out of bounds, (such as the "|" character) print a space.
			else {
				tileid = " ".toUpperCase().charCodeAt() - 32;
				_CFG.SetTile(x, y, fontmap[ tileid+2 ], vram_str );
			}

			// Move the "cursor" over one to the right.
			x+=1;

			// Wrapping?
			if(x>=_CS.VRAM_TILES_H-0){ x=0; y+=1; }
			if(y>=_CS.VRAM_TILES_V-0){ x=0; y=0;  }
		});
	},
	// Prints a line of text at the specified location (accepts an object with text and font settings for each char.)
	Print_multiFont : function(x, y, data, vram_str){
		// Example usage:
		// _CFG.Print_multiFont(
		// 	0, 0,
		// 	{
		// 		"text"  : "This is a test." ,
		// 		"font"  : "010101010101010".split("").map(function(d){ return parseInt(d,10); }) ,
		// 		"fonts" : [ "fonts1", "fonts2" ]
		// 	},
		// 	"VRAM2"
		// );

		let tileid;

		// Make sure that only a whole number makes it through.
		x = (x) << 0;
		y = (y) << 0;
		let startx = x;

		if( vram_str==undefined ){ vram_str='VRAM2'; }

		// This assumes that the correct tileset and tilemap for the fonts have already been set.
		// Font tiles are expected to be in the following order in the fontmap:
		//    !  "  #  $  %  &  '  (  )  *  +  ,  -  .  /
		// 0  1  2  3  4  5  6  7  8  9  :  ;  <  =  >  ?
		// @  A  B  C  D  E  F  G  H  I  J  K  L  M  N  O
		// P  Q  R  S  T  U  V  W  X  Y  Z  [  c  ]  ^  _

		// Turn the string into an iterable array.
		Array.from( data.text ).forEach(function(d,i){
			// Move down a line if a line break is found.
			if(d=="\n"){ x=startx; y+=1; return; }

			// Determine which fontmap will be used.
			let fontmap = core.ASSETS.graphics.tilemaps[ data.fonts[ data.font[i] ] ];

			// If fontmap isn't set then use the current global font.
			if(!fontmap){ fontmap = fontmap = core.ASSETS.graphics.tilemaps[_CG.fontSettings.fontmap]; }

			// NOTE: Fontsets should all be the same length.
			let fontmap_len = fontmap.length -2 ; // -2 is for skipping the first two indexes.)

			// Get the tileid for this character.
			tileid = d.toUpperCase().charCodeAt() - 32;

			// Make sure this is a valid tile in the font map (bounds-check.)
			if(tileid < fontmap_len){
				_CFG.SetTile(x, y, fontmap[ tileid+2 ], vram_str, fontmap );
			}

			// If it is out of bounds, (such as the "|" character) print a space.
			else {
				tileid = " ".toUpperCase().charCodeAt() - 32;
				_CFG.SetTile(x, y, fontmap[ tileid+2 ], vram_str, fontmap );
			}

			// Move the "cursor" over one to the right.
			x+=1;

			// Wrapping?
			if(x>=_CS.VRAM_TILES_H-0){ x=0; y+=1; }
			if(y>=_CS.VRAM_TILES_V-0){ x=0; y=0;  }
		});
	},
	// Set the font to use.
	SetFont         : function(fontmap){
		let font = _CG.fonts[fontmap];
		if(!font){ console.error("Font name was NOT found."); return ; }

		// Updates the tileset that will be used for the fonts.
		_CG.activeTileset.TEXT  = _CG.fonts[fontmap].tileset   ;
		_CG.fontSettings.tileset   = _CG.fonts[fontmap].tileset   ;

		// Updates the tilemap that will be used for the fonts.
		_CG.fontSettings.fontmap   = _CG.fonts[fontmap].fontmap   ;
	},


	// Allows for repeating a tilemap over a larger surface.
	DrawMap_customDimensions : function(sx, sy, nw, nh, map, vram_str){
		// EXAMPLES:
		// _CFG.DrawMap_customDimensions(1,1,28,28, vars.tilemaps[ "main_bg_pattern1" ] , "VRAM1");

		let mapWidth  = map[0] ;
		let mapHeight = map[1] ;

		for(let y=0; y<nh; y+=mapHeight){
			for(let x=0; x<nw; x+=mapWidth){
				_CFG.DrawMap2(x+sx, y+sy, map, vram_str);
			}
		}
	},

} ; // Functions for handling graphics.

// Shorthand methods.

let _CG   = core.GRAPHICS;
let _CGF  = core.GRAPHICS.FADER;
let _CGFF = core.GRAPHICS.FADER.FUNCS;
let _CC   = core.CONSTS;
let _CS   = core.SETTINGS;
let _CFG  = core.FUNCS.graphics;
// let _CFGU  = core.FUNCS.graphics.USER;
// let _CFGI  = core.FUNCS.graphics.INTERNAL;

// JS GAME logo for this video mode.
_CFG.logo = function(){
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
				let output  = _CG.ctx.OUTPUT;
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
				// setTimeout( res , 1000);
				setTimeout( res , 750);
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

_CFG.init = function(){
	return new Promise(function(res_VIDEO_INIT, rej_VIDEO_INIT){
		JSGAME.SHARED.PERFORMANCE.stamp("VIDEO_INIT_ALL"                   , "START");

		// Copy some PRELOAD settings into _CS.
		let settingsSetup = function(){
			return new Promise(function(res_settingsSetup, rej_settingsSetup){
				JSGAME.SHARED.PERFORMANCE.stamp("VIDEO_INIT_settingsSetup"                    , "START");

				// Set the game settings and game consts.
				_CS.RAM_TILES_COUNT   = JSGAME.PRELOAD.gamesettings_json.RAM_TILES_COUNT  ;
				_CS.TILE_HEIGHT       = JSGAME.PRELOAD.gamesettings_json.TILE_HEIGHT      ;
				_CS.TILE_WIDTH        = JSGAME.PRELOAD.gamesettings_json.TILE_WIDTH       ;
				_CS.TRANSLUCENT_COLOR = JSGAME.PRELOAD.gamesettings_json.TRANSLUCENT_COLOR;
				_CS.VRAM_TILES_H      = JSGAME.PRELOAD.gamesettings_json.VRAM_TILES_H     ;
				_CS.VRAM_TILES_V      = JSGAME.PRELOAD.gamesettings_json.VRAM_TILES_V     ;
				_CS.INTRO_LOGO        = JSGAME.PRELOAD.gamesettings_json.INTRO_LOGO       ;
				_CS.fps               = JSGAME.PRELOAD.gamesettings_json.fps              ;

				// Convert the TRANSLUCENT_COLOR string to integer. (Should be specifed in HEX in RGB332 format.)
				_CS.TRANSLUCENT_COLOR = parseInt(_CS.TRANSLUCENT_COLOR, 16);

				// Get the canvas alpha settings.
				try{
					if(JSGAME.PRELOAD.gamesettings_json.canvas_alphaSettings != undefined){
						JSGAME.PRELOAD.gamesettings_json.BG_alpha     = JSGAME.PRELOAD.gamesettings_json.canvas_alphaSettings.BG_alpha     ;
						if(JSGAME.PRELOAD.PHP_VARS.useBG2){
							JSGAME.PRELOAD.gamesettings_json.BG2_alpha    = JSGAME.PRELOAD.gamesettings_jsoncanvas_alphaSettings.BG2_alpha    ;
						}
						JSGAME.PRELOAD.gamesettings_json.SPRITE_alpha = JSGAME.PRELOAD.gamesettings_json.canvas_alphaSettings.SPRITE_alpha ;
						JSGAME.PRELOAD.gamesettings_json.TEXT_alpha   = JSGAME.PRELOAD.gamesettings_json.canvas_alphaSettings.TEXT_alpha   ;
						JSGAME.PRELOAD.gamesettings_json.FADE_alpha   = JSGAME.PRELOAD.gamesettings_json.canvas_alphaSettings.FADE_alpha   ;
						JSGAME.PRELOAD.gamesettings_json.OUTPUT_alpha = JSGAME.PRELOAD.gamesettings_json.canvas_alphaSettings.OUTPUT_alpha ;
					}
					else{
						let str = ["canvas_alphaSettings was undefined. Using default values. : ", JSON.stringify([])];
						// console.error(str);
						// throw Error(str);
					}
				}
				catch(e){
					console.log("WARNING:", e);
					// Use the default alpha settings.
					JSGAME.PRELOAD.gamesettings_json.BG_alpha     = false ;
					if(JSGAME.PRELOAD.PHP_VARS.useBG2){
						JSGAME.PRELOAD.gamesettings_json.BG2_alpha    = true ;
					}
					JSGAME.PRELOAD.gamesettings_json.SPRITE_alpha = true  ;
					JSGAME.PRELOAD.gamesettings_json.TEXT_alpha   = true  ;
					JSGAME.PRELOAD.gamesettings_json.FADE_alpha   = false ;
					JSGAME.PRELOAD.gamesettings_json.OUTPUT_alpha = false ;
				}

				// These will be added in graphicsSetup.
				// _CG.tilesetNames = [] ;
				// _CG.ramtiles     = [] ;
				// _CG.tiles        = [] ;
				// _CG.tilemaps     = [] ;

				JSGAME.SHARED.PERFORMANCE.stamp("VIDEO_INIT_settingsSetup"                    , "END");

				res_settingsSetup();
			});
		};
		// Copies some DOM into the core DOM cache.
		let DOMSetup    = function(){
			return new Promise(function(res_DOMSetup, rej_DOMSetup){
				JSGAME.SHARED.PERFORMANCE.stamp("VIDEO_INIT_DOMSetup"                         , "START");

					// DOM cache (GAME ELEMENTS ONLY.)
					core.DOM.gameCanvas_DIV = document.getElementById("gameCanvas_DIV");

				JSGAME.SHARED.PERFORMANCE.stamp("VIDEO_INIT_DOMSetup"                         , "END");
				res_DOMSetup();
			});
		};
		// Configure canvases for the video mode.
		let canvasSetup = function(){
			return new Promise(function(res_canvasSetup, rej_canvasSetup){
				JSGAME.SHARED.PERFORMANCE.stamp("VIDEO_INIT_canvasSetup"                      , "START");

				// Configure the canvas(es)

				// This video mode supports 4 or 5 layer canvases and 1 output layer.

				// CANVAS
				_CG.canvas.BG     = document.createElement('canvas'); // BG1 tiles     - Tile grid-aligned.  (Default: no   alpha.)
				_CG.canvas.SPRITE = document.createElement('canvas'); // Sprite tiles  - Tile pixel-aligned. (Default: with alpha.)
				_CG.canvas.TEXT   = document.createElement('canvas'); // Text tiles    - Tile grid-aligned.  (Default: with alpha.)
				_CG.canvas.FADE   = document.createElement('canvas'); // Fade layer    - Used for Fading. General purpose bitmap canvas. (Default: no   alpha.)
				_CG.canvas.OUTPUT = document.createElement('canvas'); // Output canvas - Combination of the other 4 layers. (Default: no   alpha.)

				// Canvas alpha values.
				let BG_alpha     = JSGAME.PRELOAD.gamesettings_json.BG_alpha     ? true : false;
				let SPRITE_alpha = JSGAME.PRELOAD.gamesettings_json.SPRITE_alpha ? true : false;
				let TEXT_alpha   = JSGAME.PRELOAD.gamesettings_json.TEXT_alpha   ? true : false;
				let FADE_alpha   = JSGAME.PRELOAD.gamesettings_json.FADE_alpha   ? true : false;
				let OUTPUT_alpha = JSGAME.PRELOAD.gamesettings_json.OUTPUT_alpha ? true : false;

				// CANVAS CTX
				_CG.ctx.BG     = _CG.canvas.BG    .getContext('2d', { alpha: BG_alpha     });
				_CG.ctx.SPRITE = _CG.canvas.SPRITE.getContext('2d', { alpha: SPRITE_alpha });
				_CG.ctx.TEXT   = _CG.canvas.TEXT  .getContext('2d', { alpha: TEXT_alpha   });
				_CG.ctx.FADE   = _CG.canvas.FADE  .getContext('2d', { alpha: FADE_alpha   });
				_CG.ctx.OUTPUT = _CG.canvas.OUTPUT.getContext('2d', { alpha: OUTPUT_alpha });

				// CANVAS ARRAY (temp.)
				let canvases = [
					_CG.canvas.BG     ,
					_CG.canvas.SPRITE ,
					_CG.canvas.TEXT   ,
					_CG.canvas.FADE   ,
					_CG.canvas.OUTPUT ,
				];

				if(JSGAME.PRELOAD.PHP_VARS.useBG2){
					// BG2 tiles     - Tile grid-aligned.  (Default: with alpha.)
					_CG.canvas.BG2 = document.createElement('canvas');
					let BG2_alpha            = JSGAME.PRELOAD.gamesettings_json.BG2_alpha    ? true : false;
					_CG.ctx.BG2    = _CG.canvas.BG2   .getContext('2d', { alpha: BG2_alpha    });
					canvases.push( _CG.canvas.BG2 );
				}

				// Set the dimensions of each canvas.
				let width  = _CS.VRAM_TILES_H * _CS.TILE_WIDTH;
				let height = _CS.VRAM_TILES_V * _CS.TILE_HEIGHT;
				canvases.forEach(function(d){
					d.width  = width  ; d.height = height ;
					JSGAME.SHARED.setpixelated(d);                         // This may not be necessary.
					// d.getContext('2d').clearRect(0, 0, d.width, d.height); // This may not be necessary.
				});

				// Set an id on the canvas_OUTPUT.
				_CG.canvas.OUTPUT.id="canvas_OUTPUT";

				// Attach the canvas_OUTPUT to gameCanvas_DIV.
				core.DOM.gameCanvas_DIV.appendChild(_CG.canvas.OUTPUT);

				JSGAME.SHARED.PERFORMANCE.stamp("VIDEO_INIT_canvasSetup"                      , "END");

				res_canvasSetup();
			});
		};
		// Create VRAM arrays.
		let vramSetup   = function(){
			return new Promise(function(res_vramSetup, rej_vramSetup){
				JSGAME.SHARED.PERFORMANCE.stamp("VIDEO_INIT_vramSetup"                        , "START");

				let VRAM_ADDR_SIZE = JSGAME.PRELOAD.PHP_VARS.VRAM_ADDR_SIZE;

				// Get the number of tiles for VRAM.
				let screen_wh   = (_CS.VRAM_TILES_H * _CS.VRAM_TILES_V);

				// VRAM can use up to 256 unique tile indexes.
				if(VRAM_ADDR_SIZE==1){
					_CG.VRAM1 = new Uint8Array ( screen_wh ); // VRAM1 (BG layer.) (Set all to tile id 0.)
					_CG.VRAM2 = new Uint8Array ( screen_wh ); // VRAM2 (TEXT layer.) (Set all to tile id 0.)
					if(JSGAME.PRELOAD.PHP_VARS.useBG2){
						_CG.VRAM3 = new Uint8Array ( screen_wh ); // VRAM3 (BG2 layer.) (Set all to tile id 0.)
					}
				}
				// VRAM can use up to 65535 unique tile indexes.
				else if(VRAM_ADDR_SIZE==2){
					_CG.VRAM1 = new Uint16Array ( screen_wh ); // VRAM1 (BG layer.) (Set all to tile id 0.)
					_CG.VRAM2 = new Uint16Array ( screen_wh ); // VRAM2 (TEXT layer.) (Set all to tile id 0.)
					if(JSGAME.PRELOAD.PHP_VARS.useBG2){
						_CG.VRAM3 = new Uint16Array ( screen_wh ); // VRAM3 (BG2 layer.) (Set all to tile id 0.)
					}
				}
				else{
					// Invalid VRAM size was specified.
					let str = ["INVALID VRAM SIZE WAS SPECIFIED : ", JSON.stringify([])];
					// console.error(str);
					throw Error(str);
				}

				JSGAME.SHARED.PERFORMANCE.stamp("VIDEO_INIT_vramSetup"                        , "END");

				res_vramSetup();
			});
		};
		// Preload and pre-convert all graphics.
		let graphicsSetup = function(){
			// Download and convert the source graphics (first convert.)
			return new Promise(function(res_graphicsSetup, rej_graphicsSetup){
				JSGAME.SHARED.PERFORMANCE.stamp("VIDEO_INIT_graphicsSetup"                    , "START");

				let gamedir = parentPath + JSGAME.PRELOAD.gameselected_json.gamedir;
				gamedir = gamedir.replace("../", "");

				function graphicsConvert(res){
					// Manipulate the string to something easier to manage.
					// NOTE: If this is done to the files PRIOR to this then the file download will be smaller.
					let data = res
						.replace(/\\r\\n/g                           , "\n"  ) // Normalize to Unix line endings.
						.replace(/^\s*[\r\n]/gm                      , ''    ) // Blank lines.
						.replace(/const char/gm                      , ''    ) // Remove const char
						.replace(/const int/gm                       , ''    ) // Remove const int
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
					let arrayNames       = [] ;
					let tilemapNames     = [] ;
					let tilesetNames     = [] ;
					let thisArrayName    = "" ;
					let bin_tilesetData  = [] ;
					let bin_tilemapData  = [] ;

					let start ;
					let end   ;
					let values;

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

				JSGAME.PRELOAD.gamesettings_json.graphics_files.forEach(function(d){
					let rel_url = JSGAME.PRELOAD.gameselected_json.gamedir + "/"+ d;
					proms_gfx.push(
						JSGAME.SHARED.getFile_fromUrl(rel_url, true, "text")
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
						let canvasObj_ctx = canvasObj.getContext("bitmaprenderer");
						let offscreen = new OffscreenCanvas(8, 8);
						let twod = offscreen.getContext("2d");
						// let gl = offscreen.getContext("webgl");
						let bitmap = offscreen.transferToImageBitmap();
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
		_CC.OffscreenCanvas_supported = featureDetect_OffscreenCanvas();

		// DEBUG:
		if(JSGAME.FLAGS.debug) { console.log("MAIN: OffscreenCanvas support: ", _CC.OffscreenCanvas_supported); }

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
				let rgb_decode332                   = function(RGB332, method, handleTransparency) {
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
					// let nB = ((((RGB332 >> 5) & 6) * (255 / 7))); // blue
					// let nB = ((((RGB332 >> 5) & 6) * (255 / 6))); // blue

					if(handleTransparency){
						if(RGB332 == _CS.TRANSLUCENT_COLOR){
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
						let str = ["ERROR: rgb_decode332: UNKNOWN METHOD. ", JSON.stringify(method)];
						// console.error(str);
						throw Error(str);
					}
				};
				// Converts Uzebox tiles to Canvas. Respects transparency if indicated.
				let convertUzeboxTilesToCanvasTiles = function(inputTileset, inputTilesetName, newTilesetKey, handleTransparency, outputType, trackTransparent){
					let curTileId;
					let vramdata_rgb_332;
					let tile_width = _CS.TILE_WIDTH;
					let tile_height = _CS.TILE_HEIGHT;
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
					let convertedPixel;
					try{
						len = inputTileset.length / tile_size;
					}
					catch(e){
						let str = ["convertUzeboxTilesToCanvasTiles", JSON.stringify([inputTileset]), JSON.stringify([tile_size])];
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
						else if(outputType=="imageData"){
							// Store the imageData.
							arr[curTileId]=vramdata_rgb32;
						}

						// vramdata_rgb32=null;
					}

					_CG.tiles[newTilesetKey] = arr ;
					// arr=null;

					return transparencies;
				};
				// Graphics conversions.
				let post_graphicsConversion         = function(){
					// Get the length of canvases in gamesettings.
					let len = JSGAME.PRELOAD.PHP_VARS.graphics_conversionSettings.length;

					// Go through each of those canvases...
					for(let i=0; i<len; i+=1){
						// Convert from the Uzebox format to canvas format and handle transparent pixels.
						let thisCanvas       = JSGAME.PRELOAD.PHP_VARS.graphics_conversionSettings[i] ;
						let tilesSource      = core.ASSETS.graphics.tiles[ thisCanvas.tileset ] ;
						let trackTransparent = thisCanvas.trackTransparent ;

						if(!tilesSource){
							console.error(
								"Tile not found! WE ARE GOING TO HAVE AN ERROR!",
								"\n thisCanvas                 : ", thisCanvas,
								"\n tilesSource                : ", tilesSource,
								"\n core.ASSETS.graphics.tiles : ", core.ASSETS.graphics.tiles,
								"\n thisCanvas.tileset         : ", thisCanvas.tileset
							);
						}

						//
						let returnValue = convertUzeboxTilesToCanvasTiles(
							tilesSource,
							thisCanvas.tileset ,
							thisCanvas.tileset ,
							thisCanvas.handleTransparency,
							thisCanvas.type,
							thisCanvas.trackTransparent
						);

						// With the BG canvas, tiles can be fully solid or have transparent pixels.
						if(trackTransparent && returnValue.length){
							_CG.trackedTransparentTiles[thisCanvas.tileset] = returnValue;
						}
					}
				};
				// Apply font settings. (Adds the font data from PRELOAD into _CG.fonts.)
				let applyFontSettings               = function(){
					let keys = Object.keys(JSGAME.PRELOAD.PHP_VARS.fonts);
					let len  = keys.length;

					// Add all values.
					for(let i=0; i<len; i+=1){
						let key = keys[i];
						let rec = JSGAME.PRELOAD.PHP_VARS.fonts[key];

						_CG.fonts[key] = {
							"tileset"   : rec.tileset  ,
							"fontmap"   : key          ,
						};
					}

				};

				// Convert core.ASSETS.graphics.tiles to an array of canvases.
				JSGAME.SHARED.PERFORMANCE.stamp("VIDEO_INIT_post_graphicsConversion" , "START");
				post_graphicsConversion();
				JSGAME.SHARED.PERFORMANCE.stamp("VIDEO_INIT_post_graphicsConversion" , "END");

				// Add the font data from PRELOAD into _CG.fonts.
				JSGAME.SHARED.PERFORMANCE.stamp("VIDEO_INIT_applyFontSettings"       , "START");
				applyFontSettings();
				JSGAME.SHARED.PERFORMANCE.stamp("VIDEO_INIT_applyFontSettings"       , "END");

				// Make sure all canvases are cleared.
				JSGAME.SHARED.PERFORMANCE.stamp("VIDEO_INIT_clearAllCanvases"        , "START");
				_CFG.clearAllCanvases();
				JSGAME.SHARED.PERFORMANCE.stamp("VIDEO_INIT_clearAllCanvases"        , "END");

				// TOTAL VIDEO INIT PERFORMANCE:
				JSGAME.SHARED.PERFORMANCE.stamp("VIDEO_INIT_ALL"                   , "END");

				res_VIDEO_INIT();
			},
			function(err){
				rej_VIDEO_INIT();
				let str = ["_CFG.init part 1", JSON.stringify(err)];
				// console.error(str);
				throw Error(str);
			}
		);

	});
};

// ==================================
// ==== FILE END: videoMode_A.js ====
// ==================================
