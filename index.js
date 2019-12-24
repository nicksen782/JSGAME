var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame ||
							window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
var cancelAnimationFrame = window.cancelAnimationFrame || window.mozCancelAnimationFrame;

// JSGAME.PRELOAD={
// };

JSGAME.FLAGS={
	windowIsFocused : true  ,
	paused          : false ,
	manuallyPaused  : false ,
	gameReady       : false ,
};

JSGAME.SHARED={
	// Function for handling time testing.
	PERFORMANCE : {
		//
		stamps_start : {
		},
		//
		stamps_end : {
		},
		//
		key_times : {
		},

		// Clear all stamps.
		clearAll : function(){
			this.stamps_start = {};
			this.stamps_end   = {};
			this.key_times    = {};
		},
		//
		stamp : function(key, startOrEnd){
			if     (startOrEnd=="START"){
				this.stamps_start[key] = performance.now();
			}
			else if(startOrEnd=="END"  ){
				this.stamps_end[key] = performance.now();
				this.key_times[key]  = this.stamps_end[key] - this.stamps_start[key];
			}
		},
		//
		isUpperCase : function (str) { return str === str.toUpperCase(); },
		//
		output : function(keyArray){
			let _TOTALTIME = 0;
			let perf={ "INDIVIDUAL":{}, "GROUP":{}, "GROUP_ALL":0 };
			let keys;

			//
			if(keyArray=="ALL_KEYS" || !keyArray){ keys = Object.keys(JSGAME.SHARED.PERFORMANCE.key_times); keys.sort(); }
			else                    { keys = keyArray; }

			// Determine longest key name.
			let pad_len_key = 0;
			for(let i=0; i<keys.length; i+=1){
				let key = keys[i];
				if(key.length > pad_len_key){ pad_len_key = key.length; }
			}

			//
			for(let i=0; i<keys.length; i+=1){
				let key = keys[i];

				//
				if( this.isUpperCase(key) ){
					_TOTALTIME += this.key_times[ key ];
					perf.GROUP[key.padEnd(pad_len_key, " ") ] = (this.key_times[ key ].toFixed(3));
				}
				//
				else{
					perf.INDIVIDUAL[key.padEnd(pad_len_key, " ") ] = (this.key_times[ key ].toFixed(3));
				}
			}

			// Determine the longest time length (as string of the time.)
			let pad_len_timestring = 0;
			keys2 = Object.keys(perf.GROUP);
			keys3 = Object.keys(perf.INDIVIDUAL);
			for(let i=0; i<keys2.length; i+=1){
				let key = keys2[i];
				if(perf.GROUP[key].length > pad_len_timestring){ pad_len_timestring = perf.GROUP[key].length; }
			}
			for(let i=0; i<keys2.length; i+=1){
				let key = keys2[i];
				perf.GROUP[key] = perf.GROUP[key].padStart(pad_len_timestring, " ");
			}
			for(let i=0; i<keys3.length; i+=1){
				let key = keys3[i];
				if(perf.INDIVIDUAL[key].length > pad_len_timestring){ pad_len_timestring = perf.INDIVIDUAL[key].length; }
			}
			for(let i=0; i<keys3.length; i+=1){
				let key = keys3[i];
				perf.INDIVIDUAL[key] = perf.INDIVIDUAL[key].padStart(pad_len_timestring, " ");
			}

			perf.GROUP_ALL = _TOTALTIME.toFixed(3).padStart(pad_len_timestring, " ");

			console.log(
				"PERFORMANCE VALUES:",
				"\n  GROUP_ALL  : ", JSON.stringify(perf.GROUP_ALL , null,2) ,
				"\n  GROUP      : ", JSON.stringify(perf.GROUP     , null,2) ,
				"\n  INDIVIDUAL : ", JSON.stringify(perf.INDIVIDUAL, null,2) ,
				""
			);

		},

		__test : function(){
			JSGAME.SHARED.PERFORMANCE.stamp("__test1","START");
			JSGAME.SHARED.PERFORMANCE.stamp("__test222","START");

			setTimeout(function(){
				JSGAME.SHARED.PERFORMANCE.stamp("__test1","END");
				JSGAME.SHARED.PERFORMANCE.stamp("__test222","END");

				// JSGAME.SHARED.PERFORMANCE.output("");
				// JSGAME.SHARED.PERFORMANCE.output([]);
				// JSGAME.SHARED.PERFORMANCE.output("ALL_KEYS");
				// JSGAME.SHARED.PERFORMANCE.output( ["__test222", "__test1"] );
			}, 500);
		},
	},

	// Set the pixelated settings for a canvas.
	setpixelated       : function(canvas){
		// https://stackoverflow.com/a/13294650
		let ctx = canvas.getContext("2d");
		// ctx.mozImageSmoothingEnabled    = false; // Depreciated. Use imageSmoothingEnabled instead.
		ctx.imageSmoothingEnabled       = false; //
		ctx.oImageSmoothingEnabled      = false; //
		ctx.webkitImageSmoothingEnabled = false; //
		ctx.msImageSmoothingEnabled     = false; //

		// image-rendering: crisp-edges;
		// image-rendering: -moz-crisp-edges;
		// image-rendering: -webkit-optimize-contrast;
		// -ms-interpolation-mode: nearest-neighbor;
	},
	// Get a file as-is via a url (optional compression.)
	getFile_fromUrl                  : function(url, useGzip, responseType){
		// console.log("getFile_fromUrl:", url, useGzip, responseType)
		// return;

		let method = "GET";

		// The production host has a bug and this is the only way I know to fix it right now.
		if(
			window.location.origin.indexOf("//www.nicksen782.net") !=-1
			||
			window.location.origin.indexOf("//nicksen782.net") !=-1
		){
			useGzip=false;
		}

		return new Promise(function(resolve, reject) {
			var finished = function(data) {

				let resp;
				switch( this.responseType ){
					case    'text'        : { resp = this.responseText ; break; }
					case    'arraybuffer' : { resp = this.response     ; break; }
					case    'blob'        : { resp = this.response     ; break; }
					case    'json'        : { resp = this.response     ; break; }
					default               : { resp = this.responseText ; break; }
				}

				resolve( resp );
			};
			var error    = function(data) {
				console.log("getFile_fromUrl: error:", this, data);
				reject({
					type: data.type,
					xhr: xhr
				});
			};

			var xhr = new XMLHttpRequest();

			xhr.addEventListener("load", finished);
			xhr.addEventListener("error", error);

			// Ask the server to use gzencode for this file instead of just retrieving it directly?
			if(useGzip){
				method="POST";

				// Create the form.
				var fd = new FormData();
				var o = "gzip_getFile";
				var filename = url;
				fd.append("o" , o );
				fd.append("filename" , filename );

				url = "index_p.php"   +
					"?o="       + o   +
					"&filename="+ url +
					"&r="       + (new Date()).getTime()
				;
			}
			else{
				method="GET";
			}

			xhr.open(
				method,  // Type of method (GET/POST)
				url      // Destination
			, true);

			// Set the responseType.
			switch( responseType ){
				case    'text'        : { xhr.responseType = "text"       ; break; }
				case    'arraybuffer' : { xhr.responseType = "arraybuffer"; break; }
				case    'blob'        : { xhr.responseType = "blob"       ; break; }
				case    'json'        : { xhr.responseType = "json"       ; break; }
				default               : { xhr.responseType = "text"       ; break; }
			}

			xhr.send();

		});
	},
	getFile_url_arraybuffer          : function(url){
		return new Promise(function(resolve,reject){
			if(!url) { return; }
			var xhr=new XMLHttpRequest();
			xhr.open("GET",url,true);
			xhr.responseType="arraybuffer";
			xhr.onload=function(e){
				if(this.status==200){ resolve(this.response);}
				else{ reject(this); }
			};
			xhr.send();
		});
	},
	//
	getUserInputs : function(){
		let arrayRef = JSGAME.SHARED.buttons;

		// JSGAME only stores the last input value. Prev, Held, Pressed, and Released are stored within the passed array.
		if(arrayRef==undefined){ console.log("ERROR: getUserInputs: arrayRef was not defined."); return; }

		// Output the button state to the DOM if the gamepad config panel is open.
		if(JSGAME.DOM["panel_config_gamepads"].classList.contains("show")){
			//
		}

		// Gamepads?
		JSGAME.GAMEPADS.handleInputs();

		// Update the gamepad inputs.

		// Gamepad #1
		if(arrayRef.btnHeld1 != undefined){
			arrayRef.btnPrev1     = arrayRef.btnHeld1 ;
			arrayRef.btnHeld1     = JSGAME.SHARED.LASTINPUT_P1;
			arrayRef.btnPressed1  = arrayRef.btnHeld1 & (arrayRef.btnHeld1 ^ arrayRef.btnPrev1);
			arrayRef.btnReleased1 = arrayRef.btnPrev1 & (arrayRef.btnHeld1 ^ arrayRef.btnPrev1);
		}

		// Gamepad #2
		if(arrayRef.btnHeld2 != undefined){
			arrayRef.btnPrev2     = arrayRef.btnHeld2;
			arrayRef.btnHeld2     = JSGAME.SHARED.LASTINPUT_P2;
			arrayRef.btnPressed2  = arrayRef.btnHeld2 & (arrayRef.btnHeld2 ^ arrayRef.btnPrev2);
			arrayRef.btnReleased2 = arrayRef.btnPrev2 & (arrayRef.btnHeld2 ^ arrayRef.btnPrev2);
		}

	},
	// Convenience function for checking button state.
	checkButton : function(btnConst1, btnConst2){
		// EXAMPLE USAGE: if     ( game.chkBtn("BTN_UP"    , "btnPressed1") ) {}

		return JSGAME.consts[btnConst1] & JSGAME.SHARED.buttons[btnConst2] ? true : false ;
	},
	// Holds the button states for the gamepads. (Current)
	// JSGAME.SHARED.buttons
	buttons : {
		btnPrev1 : 0 , btnHeld1 : 0 , btnPressed1 : 0 , btnReleased1 : 0 ,
		btnPrev2 : 0 , btnHeld2 : 0 , btnPressed2 : 0 , btnReleased2 : 0 ,
	},
	// Changes the dimensions of the containing DIV for the game canvas (Canvas has CSS dims at 100%.)
	canvasResize : function(scale){
		let canvas_width  = core.GRAPHICS.canvas.OUTPUT.width  ;
		let canvas_height = core.GRAPHICS.canvas.OUTPUT.height ;

		let new_cont_width  = canvas_width  * scale ;
		let new_cont_height = canvas_height * scale ;

		core.DOM['gameCanvas_DIV'].style.width  = new_cont_width  + "px" ;
		core.DOM['gameCanvas_DIV'].style.height = new_cont_height + "px" ;

		JSGAME.DOM["canvasScaleSlider"].title=scale;
	},

	// Last input states as read by JS Game.
	LASTINPUT_P1 : 0 , // 0000000000000000
	LASTINPUT_P2 : 0 , // 0000000000000000

	// Flag indicating if the debug mode is on.
	debug : false ,

	// Sets a new Frame Rate per Second value.
	timing :{
		delta    : 0 ,
		interval : 0 ,
		now      : 0 ,
		_then    : 0 ,

		adjust : function(newFPS){
			// https://codetheory.in/controlling-the-frame-rate-with-requestanimationframe/

			// If FPS is 60 (max) then there is no time between frames (blocks anything that is outside of the main game loop.)
			if(newFPS >= 60){ newFPS=59; }

			core.SETTINGS.fps = newFPS ;

			JSGAME.SHARED.timing.now      = null                   ;
			JSGAME.SHARED.timing._then    = performance.now()      ;
			JSGAME.SHARED.timing.interval = 1000/core.SETTINGS.fps ; // 1000/30 == 33.333, 1000/60 == 16.666
			JSGAME.SHARED.timing.delta    = null

			JSGAME.SHARED.fps._sample_   = []   ;
			JSGAME.SHARED.fps._index_    = 0    ;
			JSGAME.SHARED.fps._lastTick_ = false;
		}
	},

	//
	fps : {
		// colxi: https://stackoverflow.com/a/55644176/2731377
		sampleSize : 60    ,
		value      : 0     ,
		_sample_   : []    ,
		_index_    : 0     ,
		_lastTick_ : false ,
		tick: function() {
			// if is first tick, just set tick timestamp and return
			if (!this._lastTick_) {
				this._lastTick_ = performance.now();
				return 0;
			}
			// calculate necessary values to obtain current tick FPS
			let now = performance.now();
			let delta = (now - this._lastTick_) / 1000;
			let fps = 1 / delta;
			// add to fps samples, current tick fps value
			this._sample_[this._index_] = Math.round(fps);

			// iterate samples to obtain the average
			let average = 0;
			for (let i = 0; i < this._sample_.length; i++) average += this._sample_[i];

			average = Math.round(average / this._sample_.length);

			// set new FPS
			this.value = average;
			// store current timestamp
			this._lastTick_ = now;
			// increase sample index counter, and reset it
			// to 0 if exceded maximum sampleSize limit
			this._index_++;
			if (this._index_ === this.sampleSize) this._index_ = 0;
			return this.value;
		}
	},

	//
	curFPS : 0 ,

	// Keeps the requestAnimationFrame id of the currently requested animation frame. Used for pause.
	raf_id : null , // requestAnimationFrame( app.game.gameloop );

	//
	masterVolume : 75 ,

	//
	hasUserInteractionRestriction : false ,

	// JSGAME.SHARED.support_gamepadAPI
	support_gamepadAPI : ('GamepadEvent' in window) && typeof navigator.getGamepads == "function",
};

JSGAME.DOM={
};

JSGAME.INIT={
	// Detects little or big endianness for the browser.
	endianness : {
		isBigEndian    : new Uint8Array(new Uint32Array([0x12345678]).buffer)[0] === 0x12 ? true : false,
		isLittleEndian : new Uint8Array(new Uint32Array([0x12345678]).buffer)[0] === 0x78 ? true : false,
	},
	// Parses the queryString in the url and returns the data as an object of key:value pairs.
	getQueryStringAsObj              : function() {
		// Nickolas Andersen (nicksen782)

		let str = window.location.search ;
		let obj = {} ;
		let part ;
		let i ;

		if(str=="" || str==null || str==undefined){ return {}; }

		// Work with the string if there was one.

		// Take off the "?".
		str = str.slice(1);

		// Split on "&".
		str = str.split("&");

		// Go through all the key=value and split them on "=".
		for(i=0; i<str.length; i+=1){
			// Split on "=".
			part = str[i].split("=");

			// Add this to the return object.
			obj[ part[0] ] = part[1];
		}

		// Finally, return the object.
		return obj;
	},
	// Detects if the user has performed actions capable of allowing audio autoplay.
	detectUserInteraction : function(){
		return new Promise(function(resolve,reject){
			var audio = document.createElement("audio");
			audio.src="snd/tick.mp3";
			audio.volume=0.0;

			audio.load();

			var promise = audio.play();
			if (promise !== undefined) {
				promise.then(res => {
					// console.log("AUDIO AUTOPLAY AVAILABLE:", res);
					resolve();
				}).catch(error => {
					// console.log("AUDIO AUTOPLAY *NOT* AVAILABLE:", error);
					reject();
				});
			}
			else{
				console.error("ERROR: A promise was not returned from .play()");
			}
		});
	},
	// Add wait until user gesture restriction is removed.
	addUserInteractionRestriction : function(){
		JSGAME.GUI.showPanel_internal("panel_gestureNeeded");
		JSGAME.SHARED.hasUserInteractionRestriction=true;
		console.log("USER MUST INTERACT WITH THE WINDOW...");

		JSGAME.SHARED.gestureEvents = {
			"keydown"   : false ,
			"keyup"     : false ,
			"mousedown" : false ,
			"mouseup"   : false ,
			"touchstart": false ,
			"touchend"  : false ,
		};

		// Add the user interaction event listeners. (removed upon detected user interaction with the browser window.)
		document.addEventListener('keydown'    , JSGAME.INIT.removeUserInteractionRestriction);
		document.addEventListener('keyup'      , JSGAME.INIT.removeUserInteractionRestriction);
		document.addEventListener('mousedown'  , JSGAME.INIT.removeUserInteractionRestriction);
		document.addEventListener('mouseup'    , JSGAME.INIT.removeUserInteractionRestriction);
		document.addEventListener('touchstart' , JSGAME.INIT.removeUserInteractionRestriction);
		document.addEventListener('touchend'   , JSGAME.INIT.removeUserInteractionRestriction);
	},
	// Remove wait-until-gesture restriction.
	removeUserInteractionRestriction : function(e){
		if(!JSGAME.SHARED.hasUserInteractionRestriction){ return; }

		// Check if related events have both occurred (pairs.)
		if(e.type=="keydown"    || e.type=="keyup")    {
			JSGAME.SHARED.gestureEvents[e.type]=true;
			if( ! (JSGAME.SHARED.gestureEvents.keydown && JSGAME.SHARED.gestureEvents.keyup) ){ return ;}
		}
		if(e.type=="mousedown"  || e.type=="mouseup")  {
			JSGAME.SHARED.gestureEvents[e.type]=true;
			if( ! (JSGAME.SHARED.gestureEvents.mousedown && JSGAME.SHARED.gestureEvents.mouseup) ){ return ;}
		}
		if(e.type=="touchstart" || e.type=="touchend") {
			JSGAME.SHARED.gestureEvents[e.type]=true;
			if( ! (JSGAME.SHARED.gestureEvents.touchstart && JSGAME.SHARED.gestureEvents.touchend) ){ return ;}
		}

		// Perform the test again just to make sure.
		JSGAME.INIT.detectUserInteraction()
		.then(
			function(res){
				// Ignore the shift, ctrl, and alt keys.
				if(
					e.shiftKey || // shift
					e.ctrlKey  || // ctrl
					e.altKey   || // alt
					e.metaKey     // command/windows (meta) key
					) {
						return;
					}

				// Remove the listener and load js game.
				else{
					console.log("(DOUBLE-CHECKED) Removing user interaction restriction...", "(DETECTED: ", e.type, ")");
					JSGAME.SHARED.hasUserInteractionRestriction=false;

					document.removeEventListener('keydown'    , JSGAME.INIT.removeUserInteractionRestriction);
					document.removeEventListener('keyup'      , JSGAME.INIT.removeUserInteractionRestriction);
					document.removeEventListener('mousedown'  , JSGAME.INIT.removeUserInteractionRestriction);
					document.removeEventListener('mouseup'    , JSGAME.INIT.removeUserInteractionRestriction);
					document.removeEventListener('touchstart' , JSGAME.INIT.removeUserInteractionRestriction);
					document.removeEventListener('touchend'   , JSGAME.INIT.removeUserInteractionRestriction);

					// delete JSGAME.SHARED.gestureEvents ;
					setTimeout(function(){
						JSGAME.INIT.__LOADJSGAME();
					}, 100);
				}
			},
			function(err){
				// Game cannot load yet.
				console.error("SECOND CHECK FOR USER GESTURES FAILED!");
			}
		);

	},
	// Check endianness, canloadgame, autoplay availability, provide some basic feedback on errors.
	__PRE_INIT : function(){
		console.log("\n");
		console.log("*************");
		console.log("JS Game -- __PRE_INIT");

		// Make sure this environment is Little Endian.
		if(! JSGAME.INIT.endianness.isLittleEndian ){
			let str="ERROR:  This game requires a computer that uses Little Endian.";
			alert(str);
			throw str;
			return;
		}

		// DOM cache.
		JSGAME.DOM["gameSelector"]     = document.getElementById  ("gameSelector");
		JSGAME.DOM["gameControls"]     = document.getElementById  ("gameControls");
		JSGAME.DOM["gameControls_br"]  = document.getElementById  ("gameControls_br");
		JSGAME.DOM["siteContainerDiv"] = document.getElementById  ("siteContainerDiv");
		JSGAME.DOM["sideDiv"]          = document.getElementById  ("sideDiv");
		JSGAME.DOM["debug_mode"]       = document.getElementById  ("debug_mode");
		JSGAME.DOM["panel_config_gamepads"]       = document.getElementById  ("panel_config_gamepads");

		if(JSGAME.DOM["debug_mode"].checked){
			let debug_navButtons = document.getElementById("debug_navButtons");
			debug_navButtons.classList.remove("hidden");
		}

		// Set the available buttons/keys.
		JSGAME.consts.allowedKeys    = [ "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"     , "Enter"    , "KeyA" , "KeyS" , "ShiftLeft", "ShiftRight", "KeyQ" , "KeyW" , ];
		JSGAME.consts.allowedButtons = [ "BTN_UP" , "BTN_DOWN" , "BTN_LEFT" , "BTN_RIGHT" , "BTN_SELECT", "BTN_START", "BTN_B", "BTN_A", "BTN_SL"   , "BTN_SR"    , "BTN_Y", "BTN_X", ];

		// Can we load the game?
		if(JSGAME.PRELOAD.PHP_VARS.CANLOADGAME){
			// Does a gesture need to occur still?
			JSGAME.INIT.detectUserInteraction()
				.then(
					function(res){
						// Game can load.
						// console.log("Can load");
						JSGAME.INIT.__LOADJSGAME();
					},
					function(err){
						// Game cannot load yet.
						// console.log("Can NOT load yet");
						JSGAME.INIT.addUserInteractionRestriction();
					}
				);
			return;
		}
		// Game not loaded.
		else{
			let numGames = JSGAME.DOM["gameSelector"].options.length -1;

			// Are there entries in the game selector drop-down?
			if(!numGames){
				JSGAME.GUI.showPanel_internal("panel_gamelistEmpty");
				console.log("The gamelist file was empty.");
			}
			// Yes, but a game was not selected?
			else{
				JSGAME.GUI.showPanel_internal("panel_nogame");
				console.log("NO GAME SELECTED");
			}

			// Run the special gamepads init.
			if(!JSGAME.GAMEPADS.CONFIG.initDone){
				// Run the special gamepads init.
				JSGAME.GAMEPADS.CONFIG.init();
			};

		}
	},
	// Configures JSGAME GUI for use and then starts the game code.
	__LOADJSGAME : function() {
		console.log("LOADING JSGAME...");
		// JSGAME.GUI.showPanel_internal("panel_loadingGame"  );

		// Gamepad buttons
		JSGAME.consts["BTN_NOBUTTONS"] = 0    ; // NOBUTTONS  decimal: 0   , binary: 0000000000000000, HEX: 0x0000, bitWise:  0 << 0
		JSGAME.consts["BTN_B"]         = 1    ; // BTN_B      decimal: 1   , binary: 0000000000000001, HEX: 0x0001, bitWise:  1 << 0
		JSGAME.consts["BTN_Y"]         = 2    ; // BTN_Y      decimal: 2   , binary: 0000000000000010, HEX: 0x0002, bitWise:  1 << 1
		JSGAME.consts["BTN_SELECT"]    = 4    ; // BTN_SELECT decimal: 4   , binary: 0000000000000100, HEX: 0x0004, bitWise:  1 << 2
		JSGAME.consts["BTN_START"]     = 8    ; // BTN_START  decimal: 8   , binary: 0000000000001000, HEX: 0x0008, bitWise:  1 << 3
		JSGAME.consts["BTN_UP"]        = 16   ; // BTN_UP     decimal: 16  , binary: 0000000000010000, HEX: 0x0010, bitWise:  1 << 4
		JSGAME.consts["BTN_DOWN"]      = 32   ; // BTN_DOWN   decimal: 32  , binary: 0000000000100000, HEX: 0x0020, bitWise:  1 << 5
		JSGAME.consts["BTN_LEFT"]      = 64   ; // BTN_LEFT   decimal: 64  , binary: 0000000001000000, HEX: 0x0040, bitWise:  1 << 6
		JSGAME.consts["BTN_RIGHT"]     = 128  ; // BTN_RIGHT  decimal: 128 , binary: 0000000010000000, HEX: 0x0080, bitWise:  1 << 7
		JSGAME.consts["BTN_A"]         = 256  ; // BTN_A      decimal: 256 , binary: 0000000100000000, HEX: 0x0100, bitWise:  1 << 8
		JSGAME.consts["BTN_X"]         = 512  ; // BTN_X      decimal: 512 , binary: 0000001000000000, HEX: 0x0200, bitWise:  1 << 9
		JSGAME.consts["BTN_SL"]        = 1024 ; // BTN_SL     decimal: 1024, binary: 0000010000000000, HEX: 0x0400, bitWise:  1 << 10
		JSGAME.consts["BTN_SR"]        = 2048 ; // BTN_SR     decimal: 2048, binary: 0000100000000000, HEX: 0x0800, bitWise:  1 << 11

		// DOM cache.
		JSGAME.DOM["gamepads"]             = document.querySelectorAll("#gameControls .gamepad");
		JSGAME.DOM["gamepads_svg"]         = document.querySelectorAll("#gameControls .gamepad svg");

		JSGAME.DOM["masterVolumeSlider_td1"]= document.getElementById  ("masterVolumeSlider_td1");
		JSGAME.DOM["masterVolumeSlider_td2"]= document.getElementById  ("masterVolumeSlider_td2");

		JSGAME.DOM["masterVolumeSlider"]   = document.getElementById  ("masterVolumeSlider");
		JSGAME.DOM["canvasScaleSlider"]    = document.getElementById  ("canvasScaleSlider");

		JSGAME.DOM["gameCanvas_DIV"]       = document.getElementById  ("gameCanvas_DIV");
		JSGAME.DOM["indicator"]            = document.getElementById  ("indicator");

		JSGAME.DOM["btn_toggleGamepads"]   = document.getElementById  ("btn_toggleGamepads");
		JSGAME.DOM["btn_togglePause"]      = document.getElementById  ("btn_togglePause");
		JSGAME.DOM["btn_toggleFullscreen"] = document.getElementById  ("btn_toggleFullscreen");

		// *** DOM init (event listeners, etc.) ***

		// If the volume change function is availble then show the volume controls.
		if(core.FUNCS.audio.changeMasterVolume){
			JSGAME.DOM["masterVolumeSlider_td1"].classList.remove("hide");
			JSGAME.DOM["masterVolumeSlider_td2"].classList.remove("hide");

			JSGAME.DOM["masterVolumeSlider"].addEventListener("input", function(){
				core.FUNCS.audio.changeMasterVolume(this.value);
			}, false);
		}
		// Otherwise hide the volume controls.
		else{
			JSGAME.DOM["masterVolumeSlider_td1"].classList.add("hide");
			JSGAME.DOM["masterVolumeSlider_td2"].classList.add("hide");
		}

		// Configure the canvas resize slider.
		JSGAME.DOM["canvasScaleSlider"]     .addEventListener("input", function(){
			JSGAME.SHARED.canvasResize(this.value);
		}, false);

		JSGAME.DOM["btn_togglePause"]      .addEventListener("click"    , JSGAME.GUI.togglePause     , false);
		JSGAME.DOM["btn_toggleFullscreen"] .addEventListener("click"    , JSGAME.GUI.togglefullscreen, false);
		JSGAME.DOM["gameCanvas_DIV"]       .addEventListener("dblclick" , JSGAME.GUI.togglefullscreen, true );
		JSGAME.DOM["btn_toggleGamepads"]   .addEventListener("click"    , JSGAME.GUI.toggleGamepads  , false);

		// DETECT WINDOW FOCUS/UNFOCUS
		// If available, add the event listener for visibility change.
		if( document['hidden'] !== undefined ){
			// Add the event listener for visibility change.
			document.addEventListener("visibilitychange", JSGAME.GUI.visibilityChange, false);

			// Set some flags here.
			if( document['hidden'] == false ){
				JSGAME.FLAGS.windowIsFocused = true;
				JSGAME.FLAGS.paused          = false;
				// JSGAME.FLAGS.manuallyPaused  = false;
			}
			else                             {
				JSGAME.FLAGS.windowIsFocused = false;
				JSGAME.FLAGS.paused          = true;
				// JSGAME.FLAGS.manuallyPaused  = true;
			}
		}
		// Otherwise just assume is always visible.
		else{
			JSGAME.FLAGS.windowIsFocused = true;
			JSGAME.FLAGS.paused          = false;
			// JSGAME.FLAGS.manuallyPaused  = false;
		}

		// Fix the gamepad attributes/text
		JSGAME.DOM["gamepads"].forEach(
			function(d){
				// Get DOM handles.
				let pad  = d.getAttribute("pad");
				let svg  = d.querySelector("svg");
				let text = svg.querySelector("text");

				// Change the pad number on each button on this gamepad.
				let buttons = svg.querySelectorAll("[pad]");
				buttons.forEach(function(dd){
					// Get the attributes for this button.
					let kb     = dd.getAttribute("kb");
					let button = dd.getAttribute("button");

					// Save the unique key and button values.
					// if( JSGAME.consts.allowedKeys   .indexOf(kb)    == -1 ) { JSGAME.consts.allowedKeys   .push(kb); }
					// if( JSGAME.consts.allowedButtons.indexOf(button)== -1 ) { JSGAME.consts.allowedButtons.push(button); }

					// Set the "pad" attribute on the button.
					dd.setAttribute("pad", pad);
				});

				// Change the text label for this gamepad.
				text.innerHTML="Player " + pad;
			}
		);

		// Add the listeners for gamepad and keyboard input.
		JSGAME.GUI.gameInputListeners();

		// Hidden gamepads?
		if(JSGAME.SHARED.gamepads==true){ JSGAME.GUI.toggleGamepads(); }
		else{}

		// When done.
		JSGAME.INIT.__GAMESTART();
	},
	// Start the game.
	__GAMESTART : function(){
		console.log("LOADING GAME...");
		JSGAME.GUI.showPanel_internal("panel_loadingGame"  );

		// Real gamepads? Run the special gamepads init.
		if(JSGAME.GAMEPADS.CONFIG.initDone){
			// Run the special gamepads init.
			JSGAME.GAMEPADS.CONFIG.init();
			console.log("gamepad poller is not supposed to be on!");
			alert("gamepad poller is not supposed to be on!");
			throw "gamepad poller is not supposed to be on!" ;

			return;
		}
		else{
			JSGAME.GAMEPADS.CONFIG.DOM_init();
		}

		// Run the game's runOnce function.
		game.runOnce().then(
			function(){
				// Game ready to start.
				JSGAME.GUI.showPanel_internal("panel_game"         );

				// Run the first game loop. (Inits the video, sound, and game code.)
				game.firstLoop().then(
					function( gamestartFunction){
						console.log("GAME CORES ARE READY");

						if(JSGAME.SHARED.debug)       {
							JSGAME.SHARED.PERFORMANCE.output();
							JSGAME.SHARED.PERFORMANCE.clearAll();
						}

						// Display the JS GAME logo then start the game.
						setTimeout(function(){
							core.FUNCS.graphics.logo().then( function(){ gamestartFunction(); } );
						},125);
					},
					function(err){ console.error("ERROR: ", err); }
				);
			}
		);

	},

};

JSGAME.GUI={
	// *** GUI NAV ***

	// Show the indicated panel and select the indicated debug button.
	showPanel : function(panel_id, elem){
		// EXAMPLES:
		// JSGAME.GUI.showPanel("panel_nogame"       , this);
		// JSGAME.GUI.showPanel("panel_loadingGame"  , this);
		// JSGAME.GUI.showPanel("panel_game"         , this);
		// JSGAME.GUI.showPanel("panel_gestureNeeded", this);
		// JSGAME.GUI.showPanel("panel_gamelistEmpty", this);

		// JSGAME.GUI.showPanel("panel_config_main"     , this);
		// JSGAME.GUI.showPanel("panel_config_gamepads" , this);
		// JSGAME.GUI.showPanel("panel_config_settings" , this);

		// Get list of panel ids.
		let panels = document.querySelectorAll('.panels');
		let found=false;

		// Attempt to get a DOM handle to the specified panel.
		let specifiedPanel = document.getElementById(panel_id);

		// Was it found? Show it.
		if(specifiedPanel){
			// Hide all first.
			JSGAME.GUI.hidePanels();

			// Show this panel.
			specifiedPanel.classList.add("show");

			// Set the clicked button as active.
			if(elem){ elem.classList.add("active"); }
		}
		// Not found? Error!
		else{
			console.log("panel not found!");
		}
	},
	// Show the indicated panel by panel_id only.
	showPanel_internal : function(panel_id){
		let debug_navButtons = document.querySelectorAll('.debug_navButtons');
		for(let i=0; i<debug_navButtons.length; i+=1){
			if(debug_navButtons[i].getAttribute("panel")==panel_id){
				JSGAME.GUI.showPanel(panel_id, debug_navButtons[i]);
			}
		}
	},
	// Hide all panels and deselect the debug buttons.
	hidePanels : function(){
		// Hide panels.
		let panels = document.querySelectorAll('.panels');
		for(let i=0; i<panels.length; i+=1){
			panels[i].classList.remove("show");
		}

		// Remove the active class from the buttons.
		let debug_navButtons = document.querySelectorAll('.debug_navButtons');
		for(let i=0; i<debug_navButtons.length; i+=1){
			debug_navButtons[i].classList.remove("active");
		}
	},
	// Change the game.Pfold
	changeGame : function(gamestring){
		// Is the debug mode on?

		let extraUrl = "";
		let debug    = document.getElementById("debug_mode").checked ? true : false;
		let gamepads = ! JSGAME.DOM["gameControls"].classList.contains("hide") ;

		if(!gamestring){
			extraUrl = ""
			+ (debug    ? "?debug=true"    : "")
			+ (gamepads ? "&gamepads=true" : "&gamepads=false")
			// + (hidden   ? "&hidden=true"   : "&hidden=false")
			;
		}
		else{
			extraUrl = "?game=" + gamestring
			+ (debug    ? "&debug=true"    : "")
			+ (gamepads ? "&gamepads=true" : "&gamepads=false")
			// + (hidden   ? "&hidden=true"   : "&hidden=false")
			;
		}

		// Redirect to the new game URL.
		window.location.href = window.location.origin + window.location.pathname + extraUrl;

	},
	// Reload the game (whole page.)
	reloadGame : function(){
		JSGAME.GUI.changeGame( JSGAME.DOM["gameSelector"].value );
	},

	// *** USER GAME INPUT ***

	//
	toggleGamepads      : function(){
		// The gameControls.
		let gameControls_hidden = JSGAME.DOM["gameControls"].classList.contains("hide") ;
		let DEBUG_DIV           = document.getElementById("DEBUG_DIV");

		JSGAME.DOM["gameControls"].classList.add("top");

		// Are the game controls hidden?
		if(gameControls_hidden){
			// console.log("showing gamepads");
			// Make sure the inline_block class is applied to the site container.
			JSGAME.DOM["siteContainerDiv"].classList.add("inline_block");

			// Show the game controls.
			JSGAME.DOM["gameControls"].classList.remove("hide");

			// Show the side div
			JSGAME.DOM["sideDiv"].classList.remove("hide");

		}
		// Are the game controls visible?
		else         {
			// console.log("HIDING gamepads");
			// Do we remove the inline_block class from the site container?
			if(!DEBUG_DIV){ JSGAME.DOM["siteContainerDiv"].classList.remove("inline_block"); }

			// Hide the game controls.
			JSGAME.DOM["gameControls"].classList.add("hide");

			// Do we hide the side div?
			if(!DEBUG_DIV){ JSGAME.DOM["sideDiv"].classList.add("hide"); }
		}

	},
	// On-screen gamepad/keyboard button listeners.
	gameInputListeners  : function(){
		// JSGAME.DOM["gamepads"]

		// Add a listener for each gamepad button.
		JSGAME.DOM["gamepads_svg"].forEach(
			function(d){
				// Get DOM handles.
				let buttons = d.querySelectorAll(".hover_group");

				buttons.forEach(function(dd){
					let elem = dd;
					let pad  = elem.getAttribute("pad");
					let btn  = elem.getAttribute("button");
					let kb   = elem.getAttribute("kb");

					// console.log("pad:",pad, "btn:", btn, "kb:", kb);

					elem.addEventListener("mousedown" , function() { JSGAME.GUI.userInput("keydown", btn , pad); }, false);
					elem.addEventListener("mouseleave", function() { JSGAME.GUI.userInput("keyup"  , btn , pad); }, false);
					elem.addEventListener("mouseup"   , function() { JSGAME.GUI.userInput("keyup"  , btn , pad); }, false);
					elem.addEventListener("touchstart", function() { JSGAME.GUI.userInput("keydown", btn , pad); }, false);
					elem.addEventListener("touchend"  , function() { JSGAME.GUI.userInput("keyup"  , btn , pad); }, false);
				});
			}
		);

		// Add listener for the document (keyboard-based user input.)
		document.addEventListener('keydown', JSGAME.GUI.document_keydown          , false);
		document.addEventListener('keyup'  , JSGAME.GUI.document_keyup            , false);

		// For mobile devices, convert touchend to click. (This will disable the double-tap to zoom feature.)
		JSGAME.DOM["gameControls"].addEventListener("touchend", function(e){ e.preventDefault(); this.click(); }, true) ;

	},
	// Used for user input when clicking on the gamepad buttons.
	userInput           : function( type, btn, pad ){
		let thisButton;

		// Determine which key was specifed and create an event for it.
		if(JSGAME.consts.allowedButtons.indexOf(btn) !=-1){
			thisButton = JSGAME.consts[btn];

			// Get a handle to the specified button.
			let button = document.querySelector("#gameControls .gamepad[pad='"+pad+"'] svg [button='"+btn+"']");

			if     (type=="keydown" ){
				// Show the button press/release.
				button.classList.add("active");

				// Update the buttons state.
				JSGAME.SHARED["LASTINPUT_P"+pad] |=  thisButton ;
			}
			else if(type=="keyup")   {
				// Show the button press/release.
				button.classList.remove("active");

				// Update the buttons state.
				JSGAME.SHARED["LASTINPUT_P"+pad] &= ~thisButton ;
			}
		}
		// else{
		// 	console.log("Invalid button!");
		// }

	},
	// Listen for a key to be pressed.
	document_keydown    : function(e){
		let index = JSGAME.consts.allowedKeys.indexOf(e.code) ;
		// let index = JSGAME.consts.allowedKeys.indexOf(e.key) ;
		if( index == -1){ return; }
		else{
			JSGAME.GUI.userInput("keydown", JSGAME.consts.allowedButtons[index] , 1);
		}
	},
	// Listen for a key to be released.
	document_keyup      : function(e){
		let index = JSGAME.consts.allowedKeys.indexOf(e.code) ;
		if( index == -1){ return; }
		else{
			JSGAME.GUI.userInput("keyup", JSGAME.consts.allowedButtons[index] , 1);
		}
	},

	// *** PAUSING ***

	// Used to pause the game logic and drawing when the browser tab loses the focus.
	visibilityChange    : function(){
		//
		// BUG: If paused and then switched from tab... This doesn't unpause.
		//

		// This should not fire until the game is ready. This is a guard.
		if(!JSGAME.FLAGS.gameReady){ return ; }

		// Window is longer hidden.
		if( document['hidden'] == false ){
			// Run the normal gameloop (It should have been cancelled on pause.
			// if(JSGAME.SHARED.raf_id == null && !JSGAME.FLAGS.manuallyPaused){
			if(JSGAME.SHARED.raf_id == null){
				setTimeout(function(){
					document.title = document.title.replace(/\(P\) /g, "");
					JSGAME.FLAGS.windowIsFocused = true;
					JSGAME.FLAGS.paused=false;
					JSGAME.DOM["indicator"].classList.remove("show");
					JSGAME.DOM["indicator"].innerText="";
					game.gameloop();
				}, 500);
			}
		}

		// Window is now hidden.
		else if( document['hidden'] == true ){
			// if(JSGAME.FLAGS.paused){ return; }

			// Cancel the current requestAnimationFrame.
			if(JSGAME.SHARED.raf_id != null){
				JSGAME.FLAGS.windowIsFocused = false;
				JSGAME.FLAGS.paused=true;
				JSGAME.DOM["indicator"].classList.add("show");
				JSGAME.DOM["indicator"].innerText="PAUSED";
				let title = document.title.replace(/\(P\) /g, "");
				document.title = "(P) " + title;

				window.cancelAnimationFrame( JSGAME.SHARED.raf_id );
				JSGAME.SHARED.raf_id=null;
			}
		}

	},
	// Sets the app.GUI.settings.manuallyPaused flag and cancels the requestAnimationFrame... or it restarts the game loop.
	togglePause         : function(){
		// Pause if unpaused.
		if(JSGAME.FLAGS.manuallyPaused==false){
			JSGAME.FLAGS.paused         = true;
			JSGAME.FLAGS.manuallyPaused = true;

			// Cancel the current requestAnimationFrame.
			window.cancelAnimationFrame( JSGAME.SHARED.raf_id );
			JSGAME.SHARED.raf_id=null;

			JSGAME.DOM["indicator"].classList.add("show");
			JSGAME.DOM["indicator"].innerText="PAUSED";

			// if( app.GUI.settings.debug ){
				// app.game.code._DEBUG_.populateDebugData_funcs.displayVars();
				// }
			}

		// Unpause if paused.
		else if(JSGAME.FLAGS.manuallyPaused==true){
			JSGAME.FLAGS.paused         = false;
			JSGAME.FLAGS.manuallyPaused = false;

			JSGAME.DOM["indicator"].classList.remove("show");
			JSGAME.DOM["indicator"].innerText="";

			// Run the normal gameloop.
			game.gameloop();
		}
	},

	// *** FULLSCREEN ***

	// Toggles full screen.
	togglefullscreen    : function(){
		// The Emscripten way.

		// The standard way.
		// var canvas = JSGAME.DOM["canvas_OUTPUT"];
		// var canvas = document.getElementById("gameCanvas_DIV");
		let canvas = core.DOM['gameCanvas_DIV'];

		// Go to fullscreen.
		if(!(
			   document.fullscreen              // Chrome
			|| document.fullscreenElement       // Chrome
			|| document.webkitFullscreenElement // Chrome
			|| window  .fullScreen              // Firefox
			|| document.mozFullScreenElement    // Firefox
			|| document.msFullscreenElement     // Edge
		))
		{
			if      (canvas.requestFullscreen      ) { canvas.requestFullscreen();       } // Standard
			else if (canvas.webkitRequestFullscreen) { canvas.webkitRequestFullscreen(); } // Chrome
			else if (canvas.mozRequestFullScreen   ) { canvas.mozRequestFullScreen();    } // Firefox
			else if (canvas.msRequestFullscreen    ) { canvas.msRequestFullscreen();     } // IE11
		}

		// Exit fullscreen.
		else{
			if     (document.exitFullscreen     )  {document.exitFullscreen();       } // Standard
			else if(document.webkitExitFullscreen) {document.webkitExitFullscreen(); } // Chrome
			else if(document.mozCancelFullScreen)  {document.mozCancelFullScreen();  } // Firefox
			else if(document.msExitFullscreen)     {document.msExitFullscreen();     } // IE11
		}
	},

};

//
//

JSGAME.GAMEPADS = {
	// *** CONFIG MENU FUNCTIONS ***
	// JSGAME.GAMEPADS.CONFIG
	CONFIG : {
		buttons : {
		},
		// JSGAME.SHARED.buttons['btnPrev1']     = 0 ;
		// JSGAME.SHARED.buttons['btnHeld1']     = 0 ;
		// JSGAME.SHARED.buttons['btnPressed1']  = 0 ;
		// JSGAME.SHARED.buttons['btnReleased1'] = 0 ;

		// JSGAME.GAMEPADS.CONFIG.buttons['btnPrev1']     = 0 ;
		// JSGAME.GAMEPADS.CONFIG.buttons['btnHeld1']     = 0 ;
		// JSGAME.GAMEPADS.CONFIG.buttons['btnPressed1']  = 0 ;
		// JSGAME.GAMEPADS.CONFIG.buttons['btnReleased1'] = 0 ;

		// Button states ONLY used by CONFIG.
		buttons       : {
			btnPrev1 : 0 , btnHeld1 : 0 , btnPressed1 : 0 , btnReleased1 : 0 ,
			btnPrev2 : 0 , btnHeld2 : 0 , btnPressed2 : 0 , btnReleased2 : 0 ,
		},

		// Keeps the requestAnimationFrame id of the currently requested animation frame. Used for gamepad setup when there is no game.
		raf_id_noGame : null,

		initDone      : false,

		// DOM CACHE. POPULATED BY INIT.
		DOM_elems     : {},

		ignoredGamepadInputs : {
			"p1": [] ,
			"p2": [] ,
			"p1_set":false,
			"p2_set":false,
		},
		updateButtonStatus : function(){
			// let gamepads = JSGAME.GAMEPADS.gamepads;
			let gamepads = JSGAME.GAMEPADS.getSrcGamepads();
			let html ;
			// console.log("hi");

			for(let i1=0; i1<gamepads.length; i1+=1){
				// Only two gamepads are supported.
				if(i1==2){ break; }

				html = "";
				html+="<br>";

				// let thisPad = gamepads[i1].gamepad;
				let thisPad = gamepads[i1];

				// html+="AXES:<br>";
				for(let i2=0; i2<thisPad.axes.length; i2+=1){
					if(i2%2==0 && i2!=0){ html+="<br>"; }

					let name = "A:"+i2;
					let value = thisPad.axes[i2].toFixed(0);
					let sign = Math.sign( thisPad.axes[i2] );
					if(sign!=-1){ value = "+"+value; }

					// console.log(value, sign);

					let cssclass = "gamepad_buttonStatus ";

					let key = "p"+(i1+1);

					if     ( JSGAME.GAMEPADS.CONFIG.ignoredGamepadInputs[key].indexOf(name) != -1 ){
						// JSGAME.GAMEPADS.CONFIG.determineIgnoredInputs()
						// JSGAME.GAMEPADS.CONFIG.ignoredGamepadInputs
						cssclass += "ignored";
					}
					else if(value == 0){ cssclass += "inactive"; }
					else               { cssclass += "active";   }

					html+="<span padNum=\""+(i1+1)+"\" name=\""+name+"\" class=\""+cssclass+"\">A:"+i2+":"+(value).toString() + "</span>";
				}
				html+="<br>";
				html+="<br>";

				// html+="BUTTONS:<br>";
				for(let i3=0; i3<thisPad.buttons.length; i3+=1){
					if(i3%2==0 && i3!=0){ html+="<br>"; }

					let name = "B:"+i3;
					let value = (
						thisPad.buttons[i3].pressed ||
						thisPad.buttons[i3].touched ||
						thisPad.buttons[i3].value
					) ? 1 : 0;

					let cssclass = "gamepad_buttonStatus ";

					let key = "p"+(i1+1);

					if     ( JSGAME.GAMEPADS.CONFIG.ignoredGamepadInputs[key].indexOf(name) != -1 ){
						// JSGAME.GAMEPADS.CONFIG.determineIgnoredInputs()
						// JSGAME.GAMEPADS.CONFIG.ignoredGamepadInputs
						cssclass += "ignored";
					}
					else if(value == 0){ cssclass += "inactive"; }
					else               { cssclass += "active";   }

					html+="<span padNum=\""+(i1+1)+"\" name=\""+name+"\" class=\""+cssclass+"\">B:"+i3+":"+(value) + "</span>";
				}

				if     (i1==0){ JSGAME.GAMEPADS.CONFIG.DOM_elems.gamepad_buttonStatus1.innerHTML=html; }
				else if(i1==1){ JSGAME.GAMEPADS.CONFIG.DOM_elems.gamepad_buttonStatus2.innerHTML=html; }
			}
		},
		openview      : function(){
		},
		closeview     : function(){
		},

		setAllButtonMappings : function(padNum){
			// For each
			let section;
			if     (padNum==1){ section=JSGAME.GAMEPADS.CONFIG.DOM_elems.gamepads_buttonConfig1; }
			else if(padNum==2){ section=JSGAME.GAMEPADS.CONFIG.DOM_elems.gamepads_buttonConfig2; }
			else{ return; }

			let btns = section.querySelectorAll("button[padnum='"+padNum+"']");

			// console.log(btns);

			JSGAME.GAMEPADS.CONFIG.determineIgnoredInputs(padNum);

			let keys = Object.keys(btns);
			let i = 0;
			let len = keys.length;

			function iterate(){
				// Done?
				if( i >= len ){
					// console.log("We are done!");
					return;
				}
				else{
					let btn = btns[i];
					btn.onclick();
					i+=1;
					requestAnimationFrame(iterate);
				}
			};
			iterate();
		},
		// Add button mappings for a gamepad. (SAVE)
		saveButtonMappings : function(padNum){
			// JSGAME.GAMEPADS.CONFIG.saveButtonMappings(1);
			// Find the gamepad mapping:
			// if( JSGAME.GAMEPADS.gp_config_mappings.hasOwnProperty(map_key) != -1){
			// 	// Assign the map.
			// 	newMapping=JSGAME.GAMEPADS.gp_config_mappings[map_key];
			// }
			let section;
			if     (padNum==1){ section=JSGAME.GAMEPADS.CONFIG.DOM_elems.gamepads_buttonConfig1; }
			else if(padNum==2){ section=JSGAME.GAMEPADS.CONFIG.DOM_elems.gamepads_buttonConfig2; }
			else{ return; }

			let data = {};
			let getData = function(label){
				let select = section.querySelector("table select[button='"+label+"']");
				let padNum = select.getAttribute("padnum");
				let button = select.getAttribute("button");
				let value = select.value;

				if(value=="NOT SET"){
					data[label] = {
						// "label" : label   ,
						"type"  : null    ,
						"index" : null    ,
						"true"  : null    ,
						"sign"  : null    ,
					};

					return;
				}

				let value_arr = value.split(":");
				// console.log(label, value);

				// "type": "buttons", "index": 1 , "true": 1 , "sign": "+"

				let type = value_arr[0];
				if     (type=="A"){ type = "axes" ; }
				else if(type=="B"){ type = "buttons" ; }
				else              { alert("An error has occurred." + value + label); return; }

				let index   = parseInt(value_arr[1],10)                 ;
				let trueVal = parseInt(value_arr[2],10)                 ;
				let sign    = Math.sign(value_arr[2]) == 1 ? "+" : "-"  ;

				data[label] = {
					// "label" : label   ,
					"type"  : type    ,
					"index" : index   ,
					"true"  : trueVal ,
					"sign"  : sign    ,
				};
			};

			getData("BTN_B")     ;
			getData("BTN_Y")     ;
			getData("BTN_START") ;
			getData("BTN_SELECT");
			getData("BTN_UP")    ;
			getData("BTN_DOWN")  ;
			getData("BTN_LEFT")  ;
			getData("BTN_RIGHT") ;
			getData("BTN_A")     ;
			getData("BTN_X")     ;
			getData("BTN_SL")    ;
			getData("BTN_SR")    ;

			// TO FIX: The padNum-1 may return the wrong index.
			let mapkey=JSGAME.GAMEPADS.generateGamepadKey( navigator.getGamepads()[padNum-1]);

			let newObj = {
				"name":mapkey.name,
				"btnMap":data ,
			}

			JSGAME.GAMEPADS.gp_config_mappings[mapkey.map_key] = newObj ;
		},
		determineIgnoredInputs : function(padNum){
			// JSGAME.GAMEPADS.CONFIG.determineIgnoredInputs();

			// Get the key.
			let key = "p"+padNum;

			// Clear the array.
			JSGAME.GAMEPADS.CONFIG.ignoredGamepadInputs[key]=[];

			// Find all pressed buttons.
			let padButtons = document.querySelectorAll(".gamepad_buttonStatus[padNum='"+padNum+"'].active");

			// Add those pressed buttons to the ignore list.
			padButtons.forEach(function(d){
				JSGAME.GAMEPADS.CONFIG.ignoredGamepadInputs[key].push( d.getAttribute('name') );
			});

			// JSGAME.GAMEPADS.CONFIG.determineIgnoredInputs(1);
			// JSGAME.GAMEPADS.CONFIG.determineIgnoredInputs(2);
			// console.log(JSGAME.GAMEPADS.CONFIG.ignoredGamepadInputs["p1"]);
			// console.log(JSGAME.GAMEPADS.CONFIG.ignoredGamepadInputs["p2"]);
		},
		// USED???
		determineActiveButton : function(padNum){
			// JSGAME.GAMEPADS.CONFIG.determineActiveButton();

			// Get the key.
			// let key = "p"+padNum;

			// Clear the array.
			// JSGAME.GAMEPADS.CONFIG.ignoredGamepadInputs[key]=[];

			// Find all pressed buttons.
			let padButtons = document.querySelectorAll(".gamepad_buttonStatus[padNum='"+padNum+"'].active");

			// Add those pressed buttons to the ignore list.
			// padButtons.forEach(function(d){
			// 	JSGAME.GAMEPADS.CONFIG.ignoredGamepadInputs[key].push( d.getAttribute('name') );
			// });
			// JSGAME.GAMEPADS.CONFIG.determineIgnoredInputs(1);
			// JSGAME.GAMEPADS.CONFIG.determineIgnoredInputs(2);
			// console.log(JSGAME.GAMEPADS.CONFIG.ignoredGamepadInputs["p1"]);
			// console.log(JSGAME.GAMEPADS.CONFIG.ignoredGamepadInputs["p2"]);

			return padButtons;
		},

		// Called by requestAnimationFrame. Polls the gamepads for updates.
		scan          : function(){
			return new Promise(function(res,rej){

				// If gamepads were connected, hide the askForConnection and show the ConnectionFound.
				if( JSGAME.GAMEPADS.getSrcGamepads().length ){
					JSGAME.GAMEPADS.CONFIG.DOM_elems.askForConnection.classList.add("hide");
					JSGAME.GAMEPADS.CONFIG.DOM_elems.ConnectionFound .classList.remove("hide");
				}
				// Otherwise, show the askForConnection and hide the ConnectionFound.
				else{
					JSGAME.GAMEPADS.CONFIG.DOM_elems.ConnectionFound .classList.add("hide");
					JSGAME.GAMEPADS.CONFIG.DOM_elems.askForConnection.classList.remove("hide");
				}

				// Look for new gamepads and adjust input.
				// JSGAME.GAMEPADS.handleInputs();

				JSGAME.GAMEPADS.CONFIG.updateButtonStatus();

				// Request another animation frame only if the game has not loaded.
				if(!JSGAME.FLAGS.gameReady){
					// let buttons = document.querySelectorAll(".gamepad_buttonStatus[padNum='1'].active");
					let buttons = document.querySelectorAll(".gamepad_buttonStatus.active");
					let arr = [];

					buttons.forEach(function(d){
						arr.push( {
							"padnum" : d.getAttribute("padnum") ,
							"name"   : d.getAttribute("name")   ,
							"text"   : d.innerText              ,
						})
					});

					res( arr );

					setTimeout(function(){
						JSGAME.GAMEPADS.CONFIG.raf_id_noGame = requestAnimationFrame( JSGAME.GAMEPADS.CONFIG.scan );
					}, 100);
				}
			});
			// JSGAME.GAMEPADS.CONFIG.raf_id_noGame = requestAnimationFrame( JSGAME.GAMEPADS.CONFIG.scan );
			// cancelAnimationFrame( JSGAME.GAMEPADS.CONFIG.raf_id_noGame );
		},
		//
		DOM_init : function(){
			if(JSGAME.GAMEPADS.CONFIG.initDone){ return ; }

			// Init the DOM CACHE.
			JSGAME.GAMEPADS.CONFIG.DOM_elems.askForConnection = document.getElementById("gamepad_askForConnection");
			JSGAME.GAMEPADS.CONFIG.DOM_elems.ConnectionFound  = document.getElementById("gamepad_ConnectionFound");

			JSGAME.GAMEPADS.CONFIG.DOM_elems.gamepad_buttonStatus1  = document.getElementById("gamepad_buttonStatus1");
			JSGAME.GAMEPADS.CONFIG.DOM_elems.gamepad_buttonStatus2  = document.getElementById("gamepad_buttonStatus2");

			JSGAME.GAMEPADS.CONFIG.DOM_elems.gamepads_buttonConfig1  = document.getElementById("gamepads_buttonConfig1");
			JSGAME.GAMEPADS.CONFIG.DOM_elems.gamepads_buttonConfig2  = document.getElementById("gamepads_buttonConfig2");

			JSGAME.GAMEPADS.CONFIG.DOM_elems.gamepadIcon_container_p1  = document.getElementById("gamepadIcon_container_p1");
			JSGAME.GAMEPADS.CONFIG.DOM_elems.gamepadIcon_container_p2  = document.getElementById("gamepadIcon_container_p2");

			JSGAME.GAMEPADS.CONFIG.DOM_elems.gamepads_gp1_all  = document.getElementById("gamepads_gp1_all");
			JSGAME.GAMEPADS.CONFIG.DOM_elems.gamepads_gp2_all  = document.getElementById("gamepads_gp2_all");

			function createTable(padNum){
				let btn_strings = [
					"BTN_UP"     ,
					"BTN_DOWN"   ,
					"BTN_LEFT"   ,
					"BTN_RIGHT"  ,
					"BTN_A"      ,
					"BTN_B"      ,
					"BTN_X"      ,
					"BTN_Y"      ,
					"BTN_SL"     ,
					"BTN_SR"     ,
					"BTN_SELECT" ,
					"BTN_START"  ,
				];

				let gp_input_strings = [
					// UNSET
					"NOT SET",

					// 8 Axes. Activated is either -1 or 1.
					"A:0:+1"  , "A:0:-1"  ,
					"A:1:+1"  , "A:1:-1"  ,
					"A:2:+1"  , "A:2:-1"  ,
					"A:3:+1"  , "A:3:-1"  ,
					"A:4:+1"  , "A:4:-1"  ,
					"A:5:+1"  , "A:5:-1"  ,
					"A:6:+1"  , "A:6:-1"  ,
					"A:7:+1"  , "A:7:-1"  ,
					"A:8:+1"  , "A:8:-1"  ,
					"A:9:+1"  , "A:9:-1"  ,
					"A:10:+1" , "A:10:-1" ,

					// 16 buttons. Activated is 1.
					"B:0:1"   , "B:1:1"  ,
					"B:2:1"   , "B:3:1"  ,
					"B:4:1"   , "B:5:1"  ,
					"B:6:1"   , "B:7:1"  ,
					"B:8:1"   , "B:9:1"  ,
					"B:10:1"  , "B:11:1" ,
					"B:12:1"  , "B:13:1" ,
					"B:14:1"  , "B:15:1" ,
				];

				function createSelect(label, tr){
					let select = document.createElement("select");
					select.setAttribute("padNum", padNum);
					select.setAttribute("button", label);

					let frag = document.createDocumentFragment();

					for(let i=0; i<gp_input_strings.length; i+=1){
						let option = document.createElement("option");
						option.value = gp_input_strings[i];
						option.text  = gp_input_strings[i];
						option.setAttribute("padNum", padNum);
						option.setAttribute("button", label);
						frag.appendChild(option);
					}

					select.appendChild(frag);

					return select;
				}
				function createActionButton(label, tr){
					let button = document.createElement("button");

					// button.innerText="SET ("+label+")";
					button.innerText="SET";
					button.setAttribute("padNum", padNum);
					button.setAttribute("button", label);
					button.onclick=function(){
						// return new Promise(function(res,rej){
							let cnfrm = confirm(
								"SETTING: '" + label + "'" + " ON PAD: " + padNum +
								"\n\nHold the '" + label + "' button on the gamepad " + padNum + " while clicking 'OK'."
							);

							if(cnfrm){
								// Stop the next scan if one is scheduled.
								cancelAnimationFrame( JSGAME.GAMEPADS.CONFIG.raf_id_noGame );
								// JSGAME.GAMEPADS.CONFIG.raf_id_noGame = requestAnimationFrame( JSGAME.GAMEPADS.CONFIG.scan );

								// Do a scan (will continue afterwards.)
								JSGAME.GAMEPADS.CONFIG.scan().then(function(res){
									// console.log(res.length, "YAY!", res, label, tr, tr.querySelector("select") );

									// Were no buttons pressed?
									if(res.length==0){ return;  }

									// Was more than one button pressed?
									else if(res.length>1){ return; }

									// GOOD.
									else{ tr.querySelector("select").value=res[0].text; }

								});

							}
							else{}

						// });
					};

					return button;
				};

				let table = document.createElement("table");
				table.setAttribute("padNum", padNum);
				let frag  = document.createDocumentFragment();

				// Create header row.
				for(let i=0; i<1; i+=1){
					var temp_tr   = document.createElement("tr");
					var temp_th1  = document.createElement("th"); temp_tr.appendChild(temp_th1); //
					var temp_th2  = document.createElement("th"); temp_tr.appendChild(temp_th2); //
					var temp_th3  = document.createElement("th"); temp_tr.appendChild(temp_th3); //

					temp_th1.innerHTML="BUTTON";
					temp_th2.innerHTML="ACTION";
					temp_th3.innerHTML="VALUE" ;

					frag.appendChild(temp_tr);
				}

				// Create button rows.
				for(let i=0; i<btn_strings.length; i+=1){
					var temp_tr   = document.createElement("tr");
					var temp_td1  = document.createElement("td"); temp_tr.appendChild(temp_td1); //
					var temp_td2  = document.createElement("td"); temp_tr.appendChild(temp_td2); //
					var temp_td3  = document.createElement("td"); temp_tr.appendChild(temp_td3); //

					temp_td1.innerHTML=btn_strings[i].split("_")[1];
					temp_td2.appendChild( createActionButton( btn_strings[i], temp_tr ) ) ;
					temp_td3.appendChild( createSelect( btn_strings[i], temp_tr ) ) ;

					frag.appendChild(temp_tr);
				}

				table.appendChild(frag);

				return table;
			}
			function createControls(padNum){
				// Create control rows.
				let div = document.createElement("div");
				div.setAttribute("id"   , "gamepads_buttonControls_"+padNum);
				div.setAttribute("class", "gamepads_buttonControls");

				let frag = document.createDocumentFragment();
				let btn;

				// Ignored inputs.
				btn = document.createElement("button");
				btn.innerText="FILTER";
				btn.title="Use this if buttons appear to be *stuck* when there is no input.";
				btn.onclick=function(){ JSGAME.GAMEPADS.CONFIG.determineIgnoredInputs(padNum); };
				frag.appendChild(btn);

				// Save.
				btn = document.createElement("button");
				btn.innerText="SAVE";
				btn.title="Save the changes to RAM and to H5LS.";
				btn.onclick=function(){ JSGAME.GAMEPADS.CONFIG.saveButtonMappings(padNum); };
				frag.appendChild(btn);

				// Set all.
				btn = document.createElement("button");
				btn.innerText="SET ALL";
				btn.title="Set all buttons in order.";
				btn.onclick=function(){ JSGAME.GAMEPADS.CONFIG.setAllButtonMappings(padNum); };
				frag.appendChild(btn);

				div.appendChild(frag);

				return div;
			}

			let table1    = createTable(1)   ;
			let controls1 = createControls(1);
			let table2    = createTable(2)   ;
			let controls2 = createControls(2);

			JSGAME.GAMEPADS.CONFIG.DOM_elems.gamepads_buttonConfig1.appendChild(table1);
			JSGAME.GAMEPADS.CONFIG.DOM_elems.gamepads_gp1_all.appendChild(controls1);

			JSGAME.GAMEPADS.CONFIG.DOM_elems.gamepads_buttonConfig2.appendChild(table2);
			JSGAME.GAMEPADS.CONFIG.DOM_elems.gamepads_gp2_all.appendChild(controls2);
		},

		// INIT: USE JUST ONCE AND DESTROY.
		// JSGAME.GAMEPADS.init
		init          : function(){
			// Only allow the init to run one time.
			if(!JSGAME.GAMEPADS.CONFIG.initDone){

				let DOM_listeners=function(){
					// Init the DOM EVENT LISTENERS
				}

				JSGAME.GAMEPADS.CONFIG.DOM_init();
				DOM_listeners();

				// Set the init flag.
				JSGAME.GAMEPADS.CONFIG.initDone=true;
				// JSGAME.GAMEPADS.CONFIG.initDone=false;

				// DELETE THIS INIT FUNCTION.
				delete JSGAME.GAMEPADS.CONFIG.init ;
				delete JSGAME.GAMEPADS.CONFIG.DOM_init ;

				JSGAME.GAMEPADS.CONFIG.raf_id_noGame = requestAnimationFrame( JSGAME.GAMEPADS.CONFIG.scan );

				// console.log("GAMEPAD INIT DONE. 1");
			}
			// console.log("GAMEPAD INIT DONE. 2");

		},

	},

	// *** CORE ***

	gamepads              : []    , // An array of parsed gamepad objects.
	swapGamepads          : false , // Not implemented yet.
	p1_needs_mapping      : false , //
	p2_needs_mapping      : false , //
	gamepad_p1_isSet      : false , //
	gamepad_p2_isSet      : false , //
	totalNumGamepadsReady : 0     , //

	// NEEDED????
	// * Used in translation of Uzebox buttons to their bit position and the key the browser needs to send to get that button pressed in CUzeBox.
	uzeBox_gamepad_mapping : {
                                                            // NOBUTTONS  decimal: 0   , binary: 0000000000000000, HEX: 0x0000, bitWise:  0 << 0
		"BTN_B"      : { "key":"key_A"     , "bitPos":0  }, // BTN_B      decimal: 1   , binary: 0000000000000001, HEX: 0x0001, bitWise:  1 << 0
		"BTN_Y"      : { "key":"key_Q"     , "bitPos":1  }, // BTN_Y      decimal: 2   , binary: 0000000000000010, HEX: 0x0002, bitWise:  1 << 1
		"BTN_SELECT" : { "key":"key_SPACE" , "bitPos":2  }, // BTN_SELECT decimal: 4   , binary: 0000000000000100, HEX: 0x0004, bitWise:  1 << 2
		"BTN_START"  : { "key":"key_ENTER" , "bitPos":3  }, // BTN_START  decimal: 8   , binary: 0000000000001000, HEX: 0x0008, bitWise:  1 << 3
		"BTN_UP"     : { "key":"key_UP"    , "bitPos":4  }, // BTN_UP     decimal: 16  , binary: 0000000000010000, HEX: 0x0010, bitWise:  1 << 4
		"BTN_DOWN"   : { "key":"key_DOWN"  , "bitPos":5  }, // BTN_DOWN   decimal: 32  , binary: 0000000000100000, HEX: 0x0020, bitWise:  1 << 5
		"BTN_LEFT"   : { "key":"key_LEFT"  , "bitPos":6  }, // BTN_LEFT   decimal: 64  , binary: 0000000001000000, HEX: 0x0040, bitWise:  1 << 6
		"BTN_RIGHT"  : { "key":"key_RIGHT" , "bitPos":7  }, // BTN_RIGHT  decimal: 128 , binary: 0000000010000000, HEX: 0x0080, bitWise:  1 << 7
		"BTN_A"      : { "key":"key_S"     , "bitPos":8  }, // BTN_A      decimal: 256 , binary: 0000000100000000, HEX: 0x0100, bitWise:  1 << 8
		"BTN_X"      : { "key":"key_W"     , "bitPos":9  }, // BTN_X      decimal: 512 , binary: 0000001000000000, HEX: 0x0200, bitWise:  1 << 9
		"BTN_SL"     : { "key":"key_RSHIFT", "bitPos":10 }, // BTN_SL     decimal: 1024, binary: 0000010000000000, HEX: 0x0400, bitWise:  1 << 10
		"BTN_SR"     : { "key":"key_LSHIFT", "bitPos":11 }, // BTN_SR     decimal: 2048, binary: 0000100000000000, HEX: 0x0800, bitWise:  1 << 11
	},

	// Built-in gamepad mappings.
	gp_config_mappings     : {
		// SNES30 v 2.68 (bluetooth)
		"2820:0009" : {
			"name":"8Bitdo SNES30 GamePad**2820**0009",
			"btnMap":{
				"BTN_B"      : { "type":"buttons" , "index":1 , "true":1 , "sign":"+" },
				"BTN_Y"      : { "type":"buttons" , "index":4 , "true":1 , "sign":"+" },
				"BTN_START"  : { "type":"buttons" , "index":11, "true":1 , "sign":"+" },
				"BTN_SELECT" : { "type":"buttons" , "index":10, "true":1 , "sign":"+" },
				"BTN_UP"     : { "type":"axes"    , "index":1 , "true":-1, "sign":"-" },
				"BTN_DOWN"   : { "type":"axes"    , "index":1 , "true":1 , "sign":"+" },
				"BTN_LEFT"   : { "type":"axes"    , "index":0 , "true":-1, "sign":"-" },
				"BTN_RIGHT"  : { "type":"axes"    , "index":0 , "true":1 , "sign":"+" },
				"BTN_A"      : { "type":"buttons" , "index":0 , "true":1 , "sign":"+" },
				"BTN_X"      : { "type":"buttons" , "index":3 , "true":1 , "sign":"+" },
				"BTN_SL"     : { "type":"buttons" , "index":6 , "true":1 , "sign":"+" },
				"BTN_SR"     : { "type":"buttons" , "index":7 , "true":1 , "sign":"+" },
			}
		},
		//
		"05ac:111d" : {
			"name":"Gamepad**05ac**111d",
			"btnMap":{
				"BTN_B"      : { "type":"buttons" , "index":0 , "true":1 , "sign":"+" },
				"BTN_Y"      : { "type":"buttons" , "index":3 , "true":1 , "sign":"+" },
				"BTN_START"  : { "type":"buttons" , "index":11, "true":1 , "sign":"+" },
				"BTN_SELECT" : { "type":"buttons" , "index":10, "true":1 , "sign":"+" },
				"BTN_UP"     : { "type":"axes"    , "index":7 , "true":-1, "sign":"-" },
				"BTN_DOWN"   : { "type":"axes"    , "index":7 , "true":1 , "sign":"+" },
				"BTN_LEFT"   : { "type":"axes"    , "index":6 , "true":-1, "sign":"-" },
				"BTN_RIGHT"  : { "type":"axes"    , "index":6 , "true":1 , "sign":"+" },
				"BTN_A"      : { "type":"buttons" , "index":1 , "true":1 , "sign":"+" },
				"BTN_X"      : { "type":"buttons" , "index":4 , "true":1 , "sign":"+" },
				"BTN_SL"     : { "type":"buttons" , "index":6 , "true":1 , "sign":"+" },
				"BTN_SR"     : { "type":"buttons" , "index":7 , "true":1 , "sign":"+" },
			}
		},
		// SNES30 v 4.20 (wired)
		// https://usb-ids.gowdy.us/read/UD/2dc8/ab20
		"2dc8:ab20": {
			"name": "SNES30 Joy**2dc8**ab20",
			"btnMap": {
				"BTN_B"     : { "type": "buttons", "index": 1 , "true": 1 , "sign": "+" },
				"BTN_Y"     : { "type": "buttons", "index": 4 , "true": 1 , "sign": "+" },
				"BTN_START" : { "type": "buttons", "index": 11, "true": 1 , "sign": "+" },
				"BTN_SELECT": { "type": "buttons", "index": 10, "true": 1 , "sign": "+" },

				"BTN_UP"    : { "type": "axes"   , "index": 1 , "true": -1, "sign": "-" },
				"BTN_DOWN"  : { "type": "axes"   , "index": 1 , "true": 1 , "sign": "+" },
				"BTN_LEFT"  : { "type": "axes"   , "index": 0 , "true": -1, "sign": "-" },
				"BTN_RIGHT" : { "type": "axes"   , "index": 0 , "true": 1 , "sign": "+" },

				"BTN_A"     : { "type": "buttons", "index": 0 , "true": 1 , "sign": "+" },
				"BTN_X"     : { "type": "buttons", "index": 3 , "true": 1 , "sign": "+" },
				"BTN_SL"    : { "type": "buttons", "index": 6 , "true": 1 , "sign": "+" },
				"BTN_SR"    : { "type": "buttons", "index": 7 , "true": 1 , "sign": "+" }
			}
		},
		// SNES30 v 4.20 (bluetooth)
		// https://usb-ids.gowdy.us/read/UD/2dc8
		"2dc8:2840": {
			"name": "SNES30 Joy**2dc8**2840",
			"btnMap": {
				"BTN_A"     : { "type": "buttons", "index": 0 , "true": 1 , "sign": "+" },
				"BTN_B"     : { "type": "buttons", "index": 1 , "true": 1 , "sign": "+" },
				"BTN_DOWN"  : { "type": "axes"   , "index": 1 , "true": 1 , "sign": "+" },
				"BTN_LEFT"  : { "type": "axes"   , "index": 0 , "true": -1, "sign": "-" },
				"BTN_RIGHT" : { "type": "axes"   , "index": 0 , "true": 1 , "sign": "+" },
				"BTN_SELECT": { "type": "buttons", "index": 10, "true": 1 , "sign": "+" },
				"BTN_SL"    : { "type": "buttons", "index": 6 , "true": 1 , "sign": "+" },
				"BTN_SR"    : { "type": "buttons", "index": 7 , "true": 1 , "sign": "+" },
				"BTN_START" : { "type": "buttons", "index": 11, "true": 1 , "sign": "+" },
				"BTN_UP"    : { "type": "axes"   , "index": 1 , "true": -1, "sign": "-" },
				"BTN_X"     : { "type": "buttons", "index": 3 , "true": 1 , "sign": "+" },
				"BTN_Y"     : { "type": "buttons", "index": 4 , "true": 1 , "sign": "+" },
			}
		}

		// "1234:bead" : {
		// 	"name":"vJoy - Virtual Joystick**1234**bead)",
		// 	"btnMap":{
		// 		"BTN_B"      : { "type":"buttons" , "index":0  , "true":1 , "sign":"+" },
		// 		"BTN_Y"      : { "type":"buttons" , "index":1  , "true":1 , "sign":"+" },
		// 		"BTN_START"  : { "type":"buttons" , "index":2  , "true":1 , "sign":"+" },
		// 		"BTN_SELECT" : { "type":"buttons" , "index":3  , "true":1 , "sign":"+" },
		// 		"BTN_UP"     : { "type":"buttons" , "index":4  , "true":1 , "sign":"+" },
		// 		"BTN_DOWN"   : { "type":"buttons" , "index":5  , "true":1 , "sign":"+" },
		// 		"BTN_LEFT"   : { "type":"buttons" , "index":6  , "true":1 , "sign":"+" },
		// 		"BTN_RIGHT"  : { "type":"buttons" , "index":7  , "true":1 , "sign":"+" },
		// 		"BTN_A"      : { "type":"buttons" , "index":8  , "true":1 , "sign":"+" },
		// 		"BTN_X"      : { "type":"buttons" , "index":9  , "true":1 , "sign":"+" },
		// 		"BTN_SL"     : { "type":"buttons" , "index":10 , "true":1 , "sign":"+" },
		// 		"BTN_SR"     : { "type":"buttons" , "index":11 , "true":1 , "sign":"+" },
		// 	}
		// }
	},

	// gp_config_mappings     :{},

	//
	utility : {
		// * Used with .filter (after .map) to remove undefined arrays from .map.
		removeUndefines       : function(d) {
			if( d != undefined ) { return true;  }
			else                 { return false; }
		},
	},

	// * Returns an object with the unique identifiers for a specified gamepad instance.
	generateGamepadKey : function(thisPad){
		// Get the vendor and product id.
		let ff_id = thisPad.id.split("-").map(function(d,i,a){ return d.trim();} );
		let cr_id = thisPad.id.split(":").map(function(d,i,a){ return d.trim();} );
		let vendor  = "";
		let product = "";
		let name    = "";
		let map_key = "";
		// let newMapping=undefined;

		// Is this a Firefox id string?
		if(ff_id.length==3){
			vendor  = ff_id[0].trim();
			product = ff_id[1].trim();
			name    = ff_id[2].trim();
		}
		// Is this a Chrome id string?
		else if(cr_id.length==3){
			// Need to clean up the string first.
			name    = cr_id[0].split("(")[0].trim();
			vendor  = cr_id[1].split(" Product")[0].trim();
			product = cr_id[2].split(")")[0].trim();
		}

		// Put together what the mapping key would be for this controller.
		map_key = vendor+":"+product;

		return {
			"name"   :name   ,
			"vendor" :vendor ,
			"product":product,
			"map_key":map_key,
		};

	},
	// * Gets a raw copy of navigator.gamepads() and strips out any null or blank values.
	getSrcGamepads      : function(){
		// Get the gamepad info. There are many different ways. Use the first one that returns data.
		let raw_gamepads = navigator.getGamepads ? navigator.getGamepads() : [] ;

		// Create blank array for the src_gamepads.
		let src_gamepads=[];

		// Copy the raw_gamepads into src_gamepads.
		for(let i=0; i<raw_gamepads.length; i+=1){
			// Is this actually a gamepad object? If not then don't add it.
			// console.log("typeof raw_gamepads[i]:", typeof raw_gamepads[i], raw_gamepads[i], !raw_gamepads[i]);
			if     ("undefined"     == typeof raw_gamepads[i]){ continue; }
			else if(raw_gamepads[i] == null                  ){ continue; }
			else if(!raw_gamepads[i]                         ){ continue; }

			// Add the gamepad. Use the same index value as indicated by the gamepad data.
			// console.log("adding:", raw_gamepads[i], raw_gamepads[i].index);
			if(raw_gamepads[i]) { src_gamepads[ raw_gamepads[i].index ] = raw_gamepads[i] ; }
		}

		// Any empty indexes can mess us up. Return the array WITHOUT empty indexes.
		src_gamepads = src_gamepads.map(function(d,i,a){ return d; }).filter( JSGAME.GAMEPADS.utility.removeUndefines );
		return src_gamepads;
	},
	// * Send the specified key from the specified player gamepad.
	sendNewKey : function(i, btnPressed, btnReleased){
		// If the button was pressed or held then send a keydown event.
		// If the button was released then send a keyup event.

		if     ( btnPressed  & JSGAME.consts.BTN_B     ) { JSGAME.GUI.userInput("keydown", "BTN_B"      , i+1); }
		else if( btnReleased & JSGAME.consts.BTN_B     ) { JSGAME.GUI.userInput("keyup"  , "BTN_B"      , i+1); }
		if     ( btnPressed  & JSGAME.consts.BTN_A     ) { JSGAME.GUI.userInput("keydown", "BTN_A"      , i+1); }
		else if( btnReleased & JSGAME.consts.BTN_A     ) { JSGAME.GUI.userInput("keyup"  , "BTN_A"      , i+1); }
		if     ( btnPressed  & JSGAME.consts.BTN_Y     ) { JSGAME.GUI.userInput("keydown", "BTN_Y"      , i+1); }
		else if( btnReleased & JSGAME.consts.BTN_Y     ) { JSGAME.GUI.userInput("keyup"  , "BTN_Y"      , i+1); }
		if     ( btnPressed  & JSGAME.consts.BTN_X     ) { JSGAME.GUI.userInput("keydown", "BTN_X"      , i+1); }
		else if( btnReleased & JSGAME.consts.BTN_X     ) { JSGAME.GUI.userInput("keyup"  , "BTN_X"      , i+1); }
		if     ( btnPressed  & JSGAME.consts.BTN_SL    ) { JSGAME.GUI.userInput("keydown", "BTN_SL"     , i+1); }
		else if( btnReleased & JSGAME.consts.BTN_SL    ) { JSGAME.GUI.userInput("keyup"  , "BTN_SL"     , i+1); }
		if     ( btnPressed  & JSGAME.consts.BTN_SR    ) { JSGAME.GUI.userInput("keydown", "BTN_SR"     , i+1); }
		else if( btnReleased & JSGAME.consts.BTN_SR    ) { JSGAME.GUI.userInput("keyup"  , "BTN_SR"     , i+1); }
		if     ( btnPressed  & JSGAME.consts.BTN_SELECT) { JSGAME.GUI.userInput("keydown", "BTN_SELECT" , i+1); }
		else if( btnReleased & JSGAME.consts.BTN_SELECT) { JSGAME.GUI.userInput("keyup"  , "BTN_SELECT" , i+1); }
		if     ( btnPressed  & JSGAME.consts.BTN_START ) { JSGAME.GUI.userInput("keydown", "BTN_START"  , i+1); }
		else if( btnReleased & JSGAME.consts.BTN_START ) { JSGAME.GUI.userInput("keyup"  , "BTN_START"  , i+1); }
		if     ( btnPressed  & JSGAME.consts.BTN_RIGHT ) { JSGAME.GUI.userInput("keydown", "BTN_RIGHT"  , i+1); }
		else if( btnReleased & JSGAME.consts.BTN_RIGHT ) { JSGAME.GUI.userInput("keyup"  , "BTN_RIGHT"  , i+1); }
		if     ( btnPressed  & JSGAME.consts.BTN_LEFT  ) { JSGAME.GUI.userInput("keydown", "BTN_LEFT"   , i+1); }
		else if( btnReleased & JSGAME.consts.BTN_LEFT  ) { JSGAME.GUI.userInput("keyup"  , "BTN_LEFT"   , i+1); }
		if     ( btnPressed  & JSGAME.consts.BTN_DOWN  ) { JSGAME.GUI.userInput("keydown", "BTN_DOWN"   , i+1); }
		else if( btnReleased & JSGAME.consts.BTN_DOWN  ) { JSGAME.GUI.userInput("keyup"  , "BTN_DOWN"   , i+1); }
		if     ( btnPressed  & JSGAME.consts.BTN_UP    ) { JSGAME.GUI.userInput("keydown", "BTN_UP"     , i+1); }
		else if( btnReleased & JSGAME.consts.BTN_UP    ) { JSGAME.GUI.userInput("keyup"  , "BTN_UP"     , i+1); }
	},
	// * Update the local cache of gamepad objects.
	getNewGamepadStates : function(){
		let src_gamepads = JSGAME.GAMEPADS.getSrcGamepads();

		// Clear the "active" flag on each of the known gamepads.
		for(let i=0; i<JSGAME.GAMEPADS.gamepads.length; i+=1){
			let thisPad=JSGAME.GAMEPADS.gamepads[i];
			if( thisPad     == undefined     ) { continue; }
			if( "undefined" == typeof thisPad) { continue; }
			if( thisPad     == null          ) { continue; }
			if(!thisPad                      ) { continue; }
			thisPad.active=0;
		}

		// Do we swap the gamepad read order?
		if(JSGAME.GAMEPADS.swapGamepads==1){ src_gamepads = src_gamepads.reverse(); }

		// Create the data for new gamepads or update the gamepad key on the known gamepads.
		for(let i=0; i<src_gamepads.length; i+=1){
			let thisPad = src_gamepads[i];

			// Make sure that the gamepad is actually there.
			try{ thisPad.index; }
			catch(e){ console.log(i, "ERROR:", e); continue;}

			// NEW GAMEPAD: Is this an unconfigured gamepad? Configure it.
			if(
				!JSGAME.GAMEPADS.gamepads[thisPad.index] && // No data entry at this index.
				thisPad.id                               // And the src has data.
			){
				let newMapping=undefined;
				let map_obj  = JSGAME.GAMEPADS.generateGamepadKey(thisPad);
				let map_key  = map_obj.map_key;
				let map_name = map_obj.name;

				// Find the gamepad mapping:
				if( JSGAME.GAMEPADS.gp_config_mappings.hasOwnProperty(map_key) != -1){
					// Assign the map.
					newMapping=JSGAME.GAMEPADS.gp_config_mappings[map_key];
				}

				// We don't already have a mapping for this gamepad. Did the user load a mapping?
				if(newMapping==undefined){
					// Cannot use this gamepad. A map must be created for it first.

					// Which gamepad would this be?
					let p1=JSGAME.GAMEPADS.gamepads.filter(function(d,i,a){ return d.player==1; });
					let p2=JSGAME.GAMEPADS.gamepads.filter(function(d,i,a){ return d.player==2; });

					// console.log(
					// 	"p1 found:", p1.length?"true ":"false",
					// 	"p2 found:", p2.length?"true ":"false",
					// );

					if   (!p1.length && JSGAME.GAMEPADS.p1_needs_mapping==false){
						// console.log("Player 1 gamepad needs mapping.");
						JSGAME.GAMEPADS.p1_needs_mapping=true;
						JSGAME.GAMEPADS.CONFIG.DOM_elems.gamepadIcon_container_p1.classList.remove("neverConnected");
						JSGAME.GAMEPADS.CONFIG.DOM_elems.gamepadIcon_container_p1.classList.add("known");
						JSGAME.GAMEPADS.CONFIG.DOM_elems.gamepadIcon_container_p1.classList.add("unconfigured");
						JSGAME.GAMEPADS.CONFIG.DOM_elems.gamepadIcon_container_p1.classList.remove("connected");
					}
					// else if(thisPad.index==1){
					if(!p2.length && JSGAME.GAMEPADS.p2_needs_mapping==false){
						// console.log("Player 2 gamepad needs mapping.");
						JSGAME.GAMEPADS.p2_needs_mapping=true;
						JSGAME.GAMEPADS.CONFIG.DOM_elems.gamepadIcon_container_p2.classList.remove("neverConnected");
						JSGAME.GAMEPADS.CONFIG.DOM_elems.gamepadIcon_container_p2.classList.add("known");
						JSGAME.GAMEPADS.CONFIG.DOM_elems.gamepadIcon_container_p2.classList.add("unconfigured");
						JSGAME.GAMEPADS.CONFIG.DOM_elems.gamepadIcon_container_p2.classList.remove("connected");
					}

					// Visually indicate this is unconfigured.
					// gamepadIcon_container_p1 .classList.add("unconfigured");
				}
				else{
					// Add the new gamepad.
					JSGAME.GAMEPADS.gamepads[ thisPad.index ] = {
						"gamepad"       : thisPad   ,
						"btnMap"        : newMapping,
						"btnPrev"       : 0         ,
						"lastTimestamp" : 0         ,
						"active"        : 1         ,
						"prevActive"    : 1         ,
					};

					let newPlayerNumber = undefined;

					// Configure the displayed gamepad statuses.
					if      (JSGAME.GAMEPADS.totalNumGamepadsReady==0){
						JSGAME.GAMEPADS.gamepad_p1_isSet=1;
						JSGAME.GAMEPADS.gamepads[ thisPad.index ].player=0;
						JSGAME.GAMEPADS.totalNumGamepadsReady++;
						newPlayerNumber=1;
						JSGAME.GAMEPADS.p1_needs_mapping=false;
						JSGAME.GAMEPADS.CONFIG.DOM_elems.gamepadIcon_container_p1.title = map_name + " ("+map_key+", Index:"+thisPad.index+", Player "+newPlayerNumber+")";
						JSGAME.GAMEPADS.CONFIG.DOM_elems.gamepadIcon_container_p1.classList.remove("neverConnected");
						JSGAME.GAMEPADS.CONFIG.DOM_elems.gamepadIcon_container_p1.classList.add("known");
						JSGAME.GAMEPADS.CONFIG.DOM_elems.gamepadIcon_container_p1.classList.remove("unconfigured");
						JSGAME.GAMEPADS.CONFIG.DOM_elems.gamepadIcon_container_p1.classList.add("connected");
					}
					else if (JSGAME.GAMEPADS.totalNumGamepadsReady==1){
						JSGAME.GAMEPADS.gamepad_p2_isSet=1;
						JSGAME.GAMEPADS.gamepads[ thisPad.index ].player=1;
						JSGAME.GAMEPADS.totalNumGamepadsReady++;
						newPlayerNumber=2;
						JSGAME.GAMEPADS.p2_needs_mapping=false;
						JSGAME.GAMEPADS.CONFIG.DOM_elems.gamepadIcon_container_p2.title = map_name + " ("+map_key+", Index:"+thisPad.index+", Player "+newPlayerNumber+")";
						JSGAME.GAMEPADS.CONFIG.DOM_elems.gamepadIcon_container_p2.classList.remove("neverConnected");
						JSGAME.GAMEPADS.CONFIG.DOM_elems.gamepadIcon_container_p2.classList.add("known");
						JSGAME.GAMEPADS.CONFIG.DOM_elems.gamepadIcon_container_p2.classList.remove("unconfigured");
						JSGAME.GAMEPADS.CONFIG.DOM_elems.gamepadIcon_container_p2.classList.add("connected");
					}

					console.log(
						"Gamepad found!",
						"||| Index:"  , thisPad.index   ,
						"||| Player:" , newPlayerNumber ,
						"||| id:"     , thisPad.id      ,
						"||| map_key:", map_key         ,
						" |||"
					);

				}
			}

			// UPDATE GAMEPAD: Existing gamepad: Update the gamepad data key and make sure that the cached data already exists.
			// else if( JSGAME.GAMEPADS.gamepads[thisPad.id]){
			else if( JSGAME.GAMEPADS.gamepads[thisPad.index] ){
				// console.log("Updating existing gamepad!", JSGAME.GAMEPADS.gamepads[i].btnPrev);
				JSGAME.GAMEPADS.gamepads[ thisPad.index ].gamepad = src_gamepads[i];

				// console.log("setting as active!");
				JSGAME.GAMEPADS.gamepads[ thisPad.index ].active = 1;
				JSGAME.GAMEPADS.gamepads[ thisPad.index ].prevActive = 1;

				// Configure the displayed gamepad statuses.
				// if   (JSGAME.GAMEPADS.gamepads[ thisPad.index ].gamepad==0){
				if   (JSGAME.GAMEPADS.gamepads[ thisPad.index ].player==0){
				// if   (thisPad.index==0){
					JSGAME.GAMEPADS.CONFIG.DOM_elems.gamepadIcon_container_p1.classList.remove("neverConnected");
					JSGAME.GAMEPADS.CONFIG.DOM_elems.gamepadIcon_container_p1.classList.add("known");
					JSGAME.GAMEPADS.CONFIG.DOM_elems.gamepadIcon_container_p1.classList.remove("unconfigured");
					JSGAME.GAMEPADS.CONFIG.DOM_elems.gamepadIcon_container_p1.classList.add("connected");
				}
				// if   (JSGAME.GAMEPADS.gamepads[ thisPad.index ].gamepad==1){
				if   (JSGAME.GAMEPADS.gamepads[ thisPad.index ].player==1){
				// else if(thisPad.index==1){
					JSGAME.GAMEPADS.CONFIG.DOM_elems.gamepadIcon_container_p1.classList.remove("neverConnected");
					JSGAME.GAMEPADS.CONFIG.DOM_elems.gamepadIcon_container_p1.classList.add("known");
					JSGAME.GAMEPADS.CONFIG.DOM_elems.gamepadIcon_container_p1.classList.remove("unconfigured");
					JSGAME.GAMEPADS.CONFIG.DOM_elems.gamepadIcon_container_p1.classList.add("connected");
				}

			}

		}

		// Find the known gamepads that are still set as active=0.
		for(let i=0; i<JSGAME.GAMEPADS.gamepads.length; i+=1){

			let thisPad=JSGAME.GAMEPADS.gamepads[i];

			if(thisPad==undefined)         { continue; }
			if("undefined"==typeof thisPad){ continue; }
			if(thisPad==null)              { continue; }
			if(!thisPad)                   { continue; }

			// console.log("thisPad:", "index:", thisPad.gamepad.index, "active:", thisPad.active);

			// Is this pad still active=0? It probably disconnected.
			if( thisPad.prevActive && thisPad.active==0 ){
			// if( thisPad.active==0 ){
				// console.log("gamepad active 0");
				// Configure the displayed gamepad statuses.
				// if   (thisPad.gamepad.index==0){
				// console.log(thisPad.player+1);
				if   (thisPad.player==0){
					// Put on standby status.
					console.log("Player 1 gamepad has disconnected!");
					JSGAME.GAMEPADS.CONFIG.DOM_elems.gamepadIcon_container_p1.classList.remove("neverConnected");
					JSGAME.GAMEPADS.CONFIG.DOM_elems.gamepadIcon_container_p1.classList.add("known");
					JSGAME.GAMEPADS.CONFIG.DOM_elems.gamepadIcon_container_p1.classList.remove("unconfigured");
					JSGAME.GAMEPADS.CONFIG.DOM_elems.gamepadIcon_container_p1.classList.remove("connected");
					thisPad.prevActive=0;
				}
				// else if(thisPad.gamepad.index==1){
				else if(thisPad.player==1){
					// Put on standby status.
					console.log("Player 2 gamepad has disconnected!");
					JSGAME.GAMEPADS.CONFIG.DOM_elems.gamepadIcon_container_p2.classList.remove("neverConnected");
					JSGAME.GAMEPADS.CONFIG.DOM_elems.gamepadIcon_container_p2.classList.add("known");
					JSGAME.GAMEPADS.CONFIG.DOM_elems.gamepadIcon_container_p2.classList.remove("unconfigured");
					JSGAME.GAMEPADS.CONFIG.DOM_elems.gamepadIcon_container_p2.classList.remove("connected");
					thisPad.prevActive=0;
				}
			}
		}
	},
	//
	analogToDigital_withDeadzone : function(number, deadzone){
		let sign       = Math.sign(number) ; // Will be -1, 0, or 1.
		let abs        = Math.abs(number) ;
		let inDeadzone = ! (0 + abs > deadzone) ? true : false ;

		// No value or value within the deadzone?
		if( abs==0 || inDeadzone){ return 0; }

		// Value and outside of the deadzone.
		else{ return sign; }
	},
	// * Reads gamepad instance. Uses the specified gamepad mapping and returns an Uzebox-compatible value for the gamepad button state.
	findGpButtonsViaMapping : function(gp_obj){
		// gp_obj provides the custom values as well as the gamepad state.
		let map     = gp_obj.btnMap.btnMap;
		let axes    = gp_obj.gamepad.axes;
		let buttons = gp_obj.gamepad.buttons.map(function(d){ return d.value });

		// Return these after populating them.
		let uzeBin      = 0;
		let uzeKeys     = [];
		let browserKeys = [];

		// Look through the axes/buttons mappings. (Restrict to available buttons.)
		let map_keys     = Object.keys(map).filter(function(d){ return JSGAME.consts.allowedButtons.indexOf(d) != -1 ; });
		let map_keys_len = map_keys.length;

		for(let i=0; i<map_keys_len; i+=1){
			let d          = map_keys[i]           ;
			let btn_value  = buttons[map[d].index] ;
			let axes_value = axes[map[d].index]    ;

			if     (map[d].type=="buttons"){
				// Is the button at the specified button array index true?
				// ??? Look for what the "index" is.
				if(btn_value==1){
					// Get the key for that button.
					let key = map_keys[i];
					// Use the key to get the associated Uzebox gamepad key and the Uzebox bitPos.
					let uzeBtn = JSGAME.GAMEPADS.uzeBox_gamepad_mapping[key];
					let kb_key = uzeBtn.key;
					let bitPos = uzeBtn.bitPos;

					uzeBin |= (1<<bitPos);
					uzeKeys.push(key);
					browserKeys.push(kb_key);
				}
			}
			else if (map[d].type=="axes"){
				// Is the button at the specified button array index true?
				// ??? Look for what the "index" is.

				// A "deadzone" is needed for the axes.
				axes_value = JSGAME.GAMEPADS.analogToDigital_withDeadzone(axes_value, 0.2);

				if( axes_value != 0 ){
					// Does the sign of the value match the designated sign for this button?
					let value_sign = Math.sign(axes_value) == -1 ? "-" : "+";
					let req_sign   = map[d].sign;

					// console.log();
					if(value_sign == req_sign){

						// Get the key for that button.
						let key = map_keys[i];

						// Use the key to get the associated Uzebox gamepad key and the Uzebox bitPos.
						let uzeBtn = JSGAME.GAMEPADS.uzeBox_gamepad_mapping[key];
						let kb_key = uzeBtn.key;
						let bitPos = uzeBtn.bitPos;

						uzeBin |= (1<<bitPos);
						uzeKeys.push(key);
						browserKeys.push(kb_key);
					}

				}

			}
		}

		return {
			"uzeBin"      : uzeBin                               , //
			"uzeKeys"     : uzeKeys                              , //
			"browserKeys" : browserKeys                          , //
		};

	},
	// * Handles updating the local gamepad cache, determining pressed buttons, sending keyboard events.
	handleInputs        : function(){
		// Bail if there is not gamepad support.
		if(!JSGAME.SHARED.support_gamepadAPI){ return; }

		// Read the source gamepad data, add to local cache if defined and not null and found button mapping.
		JSGAME.GAMEPADS.getNewGamepadStates();

		// Go through the gamepad list.
		for(let i=0; i<JSGAME.GAMEPADS.gamepads.length; i+=1){
			// Is this gamepad in a valid and connected state? If not, then skip it.
			if( "undefined" == typeof JSGAME.GAMEPADS.gamepads[i]) { continue; }
			if( JSGAME.GAMEPADS.gamepads[i]==null                ) { continue; }
			if(!JSGAME.GAMEPADS.gamepads[i]                      ) { continue; }

			// Get a handle to this gamepad.
			let padIndex = JSGAME.GAMEPADS.gamepads[i].gamepad.index;
			let thisPad  = JSGAME.GAMEPADS.gamepads[ padIndex ] ;

			// Which player uses this gamepad?
			let playerNumber = thisPad.player;

			// Only two players are supported.
			if( [0, 1].indexOf(playerNumber) == -1 ){ continue; }

			// First, is the timestamp the same? If so, there has been no new input. Skip!
			if( thisPad.gamepad.timestamp == thisPad.lastTimestamp ){ continue; }

			// Decipher the input into Uzebox binary.
			let input = JSGAME.GAMEPADS.findGpButtonsViaMapping( thisPad );
			// console.log("input:", input);
			// Determine what buttons have changed.
			// Compare old data to new data.

			let btnPrev     = thisPad.btnPrev;               // The buttons held at the last poll.
			let btnHeld     = input.uzeBin;                  // The buttons held at THIS poll.
			let btnPressed  = btnHeld & (btnHeld ^ btnPrev); // The new buttons pressed at THIS poll.
			let btnReleased = btnPrev & (btnHeld ^ btnPrev); // The buttons released at THIS poll.

			// Save the last timestamp.
			thisPad.lastTimestamp=thisPad.gamepad.timestamp;

			// Save the prevBtn state for the next poll.
			thisPad.btnPrev=btnHeld;

			// Send the keys that the user pressed on the the gamepad.
			JSGAME.GAMEPADS.sendNewKey(playerNumber, btnPressed, btnReleased);
		}

	},

};