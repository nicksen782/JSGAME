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
		ctx.mozImageSmoothingEnabled    = false; //
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
	getUserInputs : function( arrayRef ){
		if(arrayRef==undefined){ console.log("ERROR: getUserInputs: arrayRef was not defined."); return; }

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

		// Gamepad #3
		if(arrayRef.btnHeld3 != undefined){
			arrayRef.btnPrev3     = arrayRef.btnHeld3;
			arrayRef.btnHeld3     = JSGAME.SHARED.LASTINPUT_P3;
			arrayRef.btnPressed3  = arrayRef.btnHeld3 & (arrayRef.btnHeld3 ^ arrayRef.btnPrev3);
			arrayRef.btnReleased3 = arrayRef.btnPrev3 & (arrayRef.btnHeld3 ^ arrayRef.btnPrev3);
		}

		// Gamepad #4
		if(arrayRef.btnHeld4 != undefined){
			arrayRef.btnPrev4     = arrayRef.btnHeld4;
			arrayRef.btnHeld4     = JSGAME.SHARED.LASTINPUT_P4;
			arrayRef.btnPressed4  = arrayRef.btnHeld4 & (arrayRef.btnHeld4 ^ arrayRef.btnPrev4);
			arrayRef.btnReleased4 = arrayRef.btnPrev4 & (arrayRef.btnHeld4 ^ arrayRef.btnPrev4);
		}
	},
	// Convenience function for checking button state.
	checkButton : function(btnConst1, btnConst2){
		if( JSGAME.consts[btnConst1] & game.buttons[btnConst2] ){ return true; }
		return false;
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
	LASTINPUT_P1 : 0 ,
	LASTINPUT_P2 : 0 ,
	LASTINPUT_P3 : 0 ,
	LASTINPUT_P4 : 0 ,

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

	//
	raf_id : null , // requestAnimationFrame( app.game.gameloop );

	//
	masterVolume : 75 ,

	//
	hasUserInteractionRestriction : false ,
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
		}
	},
	// Configures JSGAME GUI for use and then starts the game code.
	__LOADJSGAME : function() {
		console.log("LOADING JSGAME...");
		// JSGAME.GUI.showPanel_internal("panel_loadingGame"  );

		// Gamepad buttons
		JSGAME.consts["BTN_SR"]     = 2048 ; // 1 << 11
		JSGAME.consts["BTN_SL"]     = 1024 ; // 1 << 10
		JSGAME.consts["BTN_X"]      = 512  ; // 1 << 9
		JSGAME.consts["BTN_A"]      = 256  ; // 1 << 8
		JSGAME.consts["BTN_RIGHT"]  = 128  ; // 1 << 7
		JSGAME.consts["BTN_LEFT"]   = 64   ; // 1 << 6
		JSGAME.consts["BTN_DOWN"]   = 32   ; // 1 << 5
		JSGAME.consts["BTN_UP"]     = 16   ; // 1 << 4
		JSGAME.consts["BTN_START"]  = 8    ; // 1 << 3
		JSGAME.consts["BTN_SELECT"] = 4    ; // 1 << 2
		JSGAME.consts["BTN_Y"]      = 2    ; // 1 << 1
		JSGAME.consts["BTN_B"]      = 1    ; // 0 << 1

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
		JSGAME.DOM["btn_reloadGame"]       = document.getElementById  ("btn_reloadGame");

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
		JSGAME.DOM["btn_reloadGame"]       .addEventListener("click"    , JSGAME.GUI.reloadGame      , false);
		JSGAME.DOM["btn_reloadGame"].classList.remove("hide");

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

		// Fix the gamepad attributes/text and get the available buttons/keys.
		JSGAME.consts.allowedKeys    = [];
		JSGAME.consts.allowedButtons = [];
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
					if( JSGAME.consts.allowedKeys   .indexOf(kb)    == -1 ) { JSGAME.consts.allowedKeys   .push(kb); }
					if( JSGAME.consts.allowedButtons.indexOf(button)== -1 ) { JSGAME.consts.allowedButtons.push(button); }

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
	// Gamepad/keyboard button listeners.
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
	// Used for user input when clicking on the gamepad buttonsws.
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
		else{
			console.log("Invalid button!");
		}

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
