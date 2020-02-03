// These functions can be used by JSGAME, the cores, and the game.
JSGAME.SHARED={
	// *** PERFORMANCE ***

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
	// Sets a new Frame Rate per Second value. Also calculates the average frames per second.
	timing :{
		delta    : 0 ,
		interval : 0 ,
		now      : 0 ,
		_then    : 0 ,

		adjust : function(newFPS){
			// https://codetheory.in/controlling-the-frame-rate-with-requestanimationframe/

			// If FPS is 60 (max) then there is no time between frames which will block anything that is outside of the main game loop such as debug.)
			if(newFPS >= 60){ newFPS=59; }

			core.SETTINGS.fps = newFPS ;
			JSGAME.SHARED.fps._sample_   = []   ;
			JSGAME.SHARED.fps._index_    = 0    ;
			JSGAME.SHARED.fps._lastTick_ = false;

			JSGAME.SHARED.timing.now      = null                   ;
			JSGAME.SHARED.timing._then    = performance.now()      ;
			JSGAME.SHARED.timing.interval = 1000/core.SETTINGS.fps ; // 1000/30 == 33.333, 1000/60 == 16.666
			JSGAME.SHARED.timing.delta    = null
		}
	},
	// Calculates the average frames per second.
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
	// Holds the value for the game-specified frames per second.
	curFPS : 0 ,
	// Keeps the requestAnimationFrame id of the currently requested animation frame.
	raf_id : null ,

	// Parses the queryString in the url and returns the data as an object of key:value pairs.
	getQueryStringAsObj              : function() {
		// Nickolas Andersen (nicksen782)
		// NOTE: May fail for values that are JSON encoded and/or also include "=" or "&" in the value.

		let str = window.location.search ;
		let obj = {} ;
		let key ;
		let val ;
		let i ;

		// Work with the string if there was one.
		if(str=="" || str==null || str==undefined){ return {}; }

		// Take off the "?".
		str = str.slice(1);

		// Split on "&".
		str = str.split("&");

		// Go through all the key=value and split them on "=".
		for(i=0; i<str.length; i+=1){
			// Split on "=" to get the key and the value.
			key = str[i].split("=")[0];
			val = str[i].replace(key+"=", "");

			// Add this to the return object.
			obj[key] = decodeURIComponent(val);
		}

		// Finally, return the object.
		return obj;
	},

	// *** DISPLAY AND FILES ***

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
		return new Promise(function(resolve, reject) {
			var finished = function(data) {

				let resp;
				switch( this.responseType ){
					case    ''            : { resp = this.responseText ; break; }
					case    'text'        : { resp = this.responseText ; break; }
					case    'arraybuffer' : { resp = this.response     ; break; }
					case    'blob'        : { resp = this.response     ; break; }
					case    'json'        : { resp = this.response     ; break; }
					default               : { resp = this.response     ; break; }
				}

				resolve( resp );
			};
			var error    = function(data) {
				console.log("getFile_fromUrl: error:", "\nthis:", this, "\ndata", data);
				reject({
					type: data.type,
					xhr: xhr
				});
			};

			let method = "GET";
			var xhr = new XMLHttpRequest();

			xhr.addEventListener("load", finished);
			xhr.addEventListener("error", error);

			// Ask the server to use gzencode for this file instead of just retrieving it directly?
			if(useGzip){
				method="POST";
				// console.log("using gzip");

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
				case    ''            : { xhr.responseType = "text"       ; break; }
				case    'text'        : { xhr.responseType = "text"       ; break; }
				case    'arraybuffer' : { xhr.responseType = "arraybuffer"; break; }
				case    'blob'        : { xhr.responseType = "blob"       ; break; }
				case    'json'        : { xhr.responseType = "json"       ; break; }
				default               : { xhr.responseType = "text"       ; break; }
			}

			xhr.send();

		});
	},
	// Converts an array buffer to data uri.
	arrayBufferToBase64_datauri : function( buffer, type, callback ) {
		// Works as a promise or with a callback function.
		return new Promise(function(res,rej){
			var blob = new Blob([buffer],{type:type});
			var reader = new FileReader();
			reader.onload = function(evt){
				var dataurl = evt.target.result;
				// console.log(dataurl);
				res(dataurl);
				if(callback){ callback(dataurl); }
			};
			reader.readAsDataURL(blob);
		});
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

	// Global Error Handler
	// GlobalErrorHandler : function(msg, url, lineNo, columnNo, error){
	GlobalErrorHandler : function(event, msg, url, lineNo, columnNo, error){
		// Try to do the normal error output.
		try{
			let link = event.filename+":"+event.lineno+":"+event.colno;

			str="";
			// TOP
			str+="\n"+"=".repeat(55);
			str+="\n"+"-".repeat(55);
			str+="\nGLOBAL ERROR HANDLER: event.type: " + event.type;
			str+="\n"+"-".repeat(55);

			// ERROR INSTANCEOF
			if( (event instanceof ErrorEvent    ) ){ str+="\n -=> instanceof : ErrorEvent    "; }
			if( (event instanceof EvalError     ) ){ str+="\n -=> instanceof : EvalError     "; }
			if( (event instanceof RangeError    ) ){ str+="\n -=> instanceof : RangeError    "; }
			if( (event instanceof ReferenceError) ){ str+="\n -=> instanceof : ReferenceError"; }
			if( (event instanceof SyntaxError   ) ){ str+="\n -=> instanceof : SyntaxError   "; }
			if( (event instanceof TypeError     ) ){ str+="\n -=> instanceof : TypeError     "; }
			if( (event instanceof URIError      ) ){ str+="\n -=> instanceof : URIError      "; }

			// MAIN INFO
			str+="\n -=> message    : " + event.message;
			str+="\n -=> link       : " + link;
			str+="\n -=> lineno     : " + event.lineno;
			str+="\n -=> colno      : " + event.colno;

			// STACK (if available.)
			if( event.error.stack   ) {
				str+="\n -=> stack      : ";
				let arr = event.error.stack.split("\n");
				let cnt=0;
				let max_left_len = 0;
				let stackLines = [];

				// Get the max length for the left part of each line (other than the first.)
				for(let line of arr){
					line=line.trim();
					if(cnt==0){
						stackLines.push(line);
					}
					else{
						let parts = line.split(" ");
						if(parts.length==3){
							// Get max length of left.
							let left   = parts[0].trim() ; // at
							let middle = parts[1].trim() ; // function
							let right  = parts[2].trim() ; // url to fix

							// Remove the "(" and ")" from the right. (first and last chars.)
							right=right.substring(1, right.length-1);

							let len = left.length + middle.length

							// Update the max length.
							if(len >= max_left_len){ max_left_len = len; }

							// Recombine the string.
							stackLines.push(left + " " + middle + "" + "_DELIMITER_"+ right);
						}
					}
					cnt+=1;
				}

				cnt=0;
				for(let line of stackLines){
					line=line.trim();
					// First line:
					if(cnt==0){
						str+="\n\t" + line + "";
					}
					// Other lines:
					else{
						let parts = line.split("_DELIMITER_");
						if(parts.length==2){
							let left  = parts[0];
							let right = parts[1];

							left = left.padEnd(max_left_len+0, " ");

							str+="\n\t\t" + (left +"\t  "+ right) + "";
						}
						else{
							console.log("parts the wrong length!", parts);
						}
					}
					cnt+=1;
				}

			}
			str+="\n\t "+"-".repeat(55-5);

			// BOTTOM
			str+="\n"+"=".repeat(55);
			str+="\n";

			// MAIN ERROR
			console.error(
				"\nPARSED ERROR:\n", str,
				"\nevent       :\n", event
			);

			// Additional information that may have been added by the game.
			if(game && game.extraDataForGlobalErrorHandler){
				console.error(
					"EXTRA DATA FROM THE GAME:\n",
					game.extraDataForGlobalErrorHandler()
				);
			}

		}
		// Something above has failed. Provide a generic error output.
		catch(e){
			console.error(
				"\n"+"=".repeat(55),
				"\n"+"-".repeat(55),
				"\nGLOBAL ERROR HANDLER: (error in handler)",
				"\n"+"-".repeat(55),
				"\n\t -=> EVENT             :", event,
				"\n\t "+"-".repeat(55-5),
				"\n\t -=> e                 :", e,
				"\n\t "+"-".repeat(55-5),
				"\n"+"=".repeat(55)
			);
		}

		// At this point the game needs to pause so as not to rack up tons of identical errors.
		JSGAME.SHARED.stopGameAndshowErrorNotification();

		// Prevent the default actions.
		event.preventDefault();
	},

	stopGameAndshowErrorNotification : function(){
		console.error("\nTHE GAME WAS STOPPED DUE TO ERROR!");

		// At this point the game needs to pause so as not to rack up tons of identical errors.
		JSGAME.FLAGS.paused         = true;
		JSGAME.FLAGS.manuallyPaused = true;
		window.cancelAnimationFrame( JSGAME.SHARED.raf_id );
		JSGAME.SHARED.raf_id=null;
		JSGAME.DOM["indicator"].classList.add("show");
		JSGAME.DOM["indicator"].innerText="-- ERROR DETECTED --";
		JSGAME.DOM["indicator"].style["background-color"] = "rgba(255, 69, 0, 0.9)";
		// throw "JSGAME.SHARED.stopGameAndshowErrorNotification();";
	},

	// Prevent certain keys from shifting the window view.
	preventScroll : function(e){
		if(e.target==document.body){
			switch(e.keyCode){
				case 32 : { e.preventDefault(); break; } // Space bar.
				case 37 : { e.preventDefault(); break; } // Left arrow
				case 38 : { e.preventDefault(); break; } // Up arrow
				case 39 : { e.preventDefault(); break; } // Right arrow
				case 40 : { e.preventDefault(); break; } // Down arrow
			};
		}
	},

	// *** INPUT ***

	// Last input states as read by JS Game.
	LASTINPUT_P1 : 0 , // 0000000000000000
	LASTINPUT_P2 : 0 , // 0000000000000000
	// Updates the real gamepads, and the onscreen/keyboard keypads.
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
		// EXAMPLE USAGE: if( game.chkBtn              ("BTN_UP" , "btnPressed1") ) {}
		// EXAMPLE USAGE: if( game.chkBtn              ("ANY"    , "btnPressed1") ) {}
		// EXAMPLE USAGE: if( JSGAME.SHARED.checkButton("BTN_UP" , "btnPressed1") ) {}
		// EXAMPLE USAGE: if( JSGAME.SHARED.checkButton("ANY"    , "btnPressed1") ) {}

		// Check for match on specific button.
		if(btnConst1 != "ANY"){
			return JSGAME.consts[btnConst1] & JSGAME.SHARED.buttons[btnConst2] ? true : false ;
		}
		// If ANY button matches btnConst2.
		else{
			return JSGAME.SHARED.buttons[btnConst2] ? true : false ;
		}
	},
	// Holds the current button states for the gamepads.
	buttons : {
		// JSGAME.SHARED.buttons.btnHeld1
		btnPrev1 : 0 , btnHeld1 : 0 , btnPressed1 : 0 , btnReleased1 : 0 ,
		btnPrev2 : 0 , btnHeld2 : 0 , btnPressed2 : 0 , btnReleased2 : 0 ,
	},

	// *** UTILITY FUNCTIONS ***

	// Accepts seconds (decimal or int). Returns number of frames for that quanity of seconds (rounded up) .
	secondsToFrames : function(seconds, rounding){
		if(!rounding){ rounding="up"; }
		if     (rounding=="up")  { return Math.ceil((core.SETTINGS.fps) * seconds); }
		else if(rounding=="down"){ return Math.ceil((core.SETTINGS.fps) * seconds); }

	},
	// Get a random integer in the specified range.
	getRandomInt_inRange : function (min, max) {
		min = (min << 0);
		max = (max << 0);
		return ((Math.random() * (max - min + 1)) + min) << 0;
	},

	// Update a value using a bit mask. (Per call can only turn "ON" or "OFF" bits. Not both.)
	get_new_bitMask : function(src, mask, value){
		// Example usage:
		//  # To set an updated flags value (SPRITE_OFF set) for a sprite:
		//  let spriteNum = 0;
		//  let newFlags = JSGAME.SHARED.get_new_bitMask(core.GRAPHICS.sprites[d].flags, core.CONSTS["SPRITE_OFF"], 1);
		//  core.FUNCS.graphics.changeSpriteFlags(spriteNum, newFlags);

		let newValue;
		if     (value==1){ newValue = src |  (mask); }
		else if(value==0){ newValue = src & ~(mask); }
		else             { console.log("applyMask: not 0 or 1."); }

		return newValue;
	},

	// *** MISC ***

	// This is the highest volume allowed.
	masterVolume : 75 ,
};