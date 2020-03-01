// ===============================
// ==== FILE START: SHARED.js ====
// ===============================

'use strict';

/**
 * JSGAME SHARED.
 * @summary JSGAME SHARED.
 * @namespace JSGAME.SHARED
*/

// These functions can be used by JSGAME, the cores, and the game.
JSGAME.SHARED={
	// Holds the current button states for the gamepads.
	buttons : {
		// JSGAME.SHARED.buttons.btnHeld1
		btnPrev1 : 0 , btnHeld1 : 0 , btnPressed1 : 0 , btnReleased1 : 0 ,
		btnPrev2 : 0 , btnHeld2 : 0 , btnPressed2 : 0 , btnReleased2 : 0 ,
	},

	masterVolume : 75 , // This is the highest volume allowed.

	// Last input states as read by JS Game.
	LASTINPUT_P1 : 0 , // 0000000000000000
	LASTINPUT_P2 : 0 , // 0000000000000000

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
			let keys2;
			let keys3;

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
			JSGAME.SHARED.timing.delta    = null;
		}
	},

	// Calculates the average frames per second.
	fps : {
		// colxi: https://stackoverflow.com/a/55644176/2731377
		sampleSize : 20    ,
		value      : 0     ,
		_sample_   : []    ,
		_index_    : 0     ,
		_lastTick_ : false ,

		tick : function() {
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
			let sampleLength = this._sample_.length;
			for (let i = 0; i < sampleLength; i++) { average += this._sample_[i]; }
			average = Math.round(average / sampleLength);

			// set new FPS
			this.value = average;

			// store current timestamp
			this._lastTick_ = now;

			// increase sample index counter, and reset it
			// to 0 if exceded maximum sampleSize limit
			this._index_++;
			if (this._index_ === this.sampleSize) { this._index_ = 0; }
			return this.value;
		}
	},

	// Keeps the requestAnimationFrame id of the currently requested animation frame.
	raf_id : null ,

	/**
	 * @summary   Parses the queryString in the url and returns the data as an object of key:value pairs.
	 * @memberof JSGAME.SHARED
	 *
	 * @example JSGAME.SHARED.getQueryStringAsObj();
	*/
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

	/**
	 * @summary   Set the pixelated settings for a canvas.
	 * @memberof JSGAME.SHARED
	 * @param    {canvas} canvas
	 *
	 * @example JSGAME.SHARED.setpixelated(canvas);
	*/
	setpixelated       : function(canvas){
		// https://stackoverflow.com/a/13294650
		// https://stackoverflow.com/a/32798277

		let ctx = canvas.getContext("2d");
		// ctx['mozImageSmoothingEnabled']    = false; // Depreciated. Use imageSmoothingEnabled instead.
		ctx.imageSmoothingEnabled       = false; //
		ctx.oImageSmoothingEnabled      = false; //
		ctx.webkitImageSmoothingEnabled = false; //
		ctx.msImageSmoothingEnabled     = false; //

		// image-rendering: crisp-edges;
		// image-rendering: -moz-crisp-edges;
		// image-rendering: -webkit-optimize-contrast;
		// -ms-interpolation-mode: nearest-neighbor;
	},

	/**
	 * @summary   Get a file as-is via a url (optional compression.)
	 * @memberof JSGAME.SHARED
	 * @param    {string} url
	 * @param    {boolean} useGzip
	 * @param    {string} responseType
	 *
	 * @example JSGAME.SHARED.getFile_fromUrl(url, useGzip, responseType);
	*/
	getFile_fromUrl                  : function(url, useGzip, responseType){
		return new Promise(function(resolve, reject) {
			let finished = function(data) {

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
			let error    = function(data) {
				console.log("getFile_fromUrl: error:", "\nthis:", this, "\ndata", data);
				reject({
					type: data.type,
					xhr: xhr
				});
			};

			let method = "GET";
			let xhr = new XMLHttpRequest();

			xhr.addEventListener("load", finished);
			xhr.addEventListener("error", error);

			// Ask the server to use gzencode for this file instead of just retrieving it directly?
			if(useGzip){
				method="POST";
				// console.log("using gzip");

				// Create the form.
				let fd = new FormData();
				let o = "gzip_getFile";
				let filename = url;
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
				url   ,   // Destination
				true
			);

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

	/**
	 * @summary   Converts an array buffer to data uri.
	 * @memberof JSGAME.SHARED
	 * @param    {*} buffer
	 * @param    {*} type
	 * @param    {*} callback
	 *
	 * @example JSGAME.SHARED.arrayBufferToBase64_datauri(buffer, type, callback);
	*/
	arrayBufferToBase64_datauri : function( buffer, type, callback ) {
		// Works as a promise or with a callback function.
		return new Promise(function(res,rej){
			let blob = new Blob([buffer],{type:type});
			let reader = new FileReader();
			reader.onload = function(evt){
				let dataurl = evt.target.result;
				// console.log(dataurl);
				res(dataurl);
				if(callback){ callback(dataurl); }
			};
			reader.readAsDataURL(blob);
		});
	},

	/**
	 * @summary   Changes the dimensions of the containing DIV for the game canvas (Canvas has CSS dims at 100%.)
	 * @memberof JSGAME.SHARED
	 * @param    {*} scale
	 *
	 * @example JSGAME.SHARED.canvasResize(scale);
	*/
	canvasResize : function(scale){
		// Get the dimensions of the canvas.
		let canvas_width  = core.GRAPHICS.canvas.OUTPUT.width  ;
		let canvas_height = core.GRAPHICS.canvas.OUTPUT.height ;

		// Scale those dimensions.
		let new_cont_width  = (canvas_width  * scale) << 0 ;
		let new_cont_height = (canvas_height * scale) << 0 ;

		// Set the new dimensions to the container.
		core.DOM.gameCanvas_DIV.style.width  = new_cont_width  + "px" ;
		core.DOM.gameCanvas_DIV.style.height = new_cont_height + "px" ;

		// Set the new dimensions to the container.
		// JSGAME.DOM.mainCenter.style.width  = new_cont_width  + "px" ;
		// JSGAME.DOM.mainCenter.style.height = new_cont_height + "px" ;

		// Adjust the hover title on the scale slider.
		JSGAME.DOM.canvasScaleSlider.title=scale;
	},

	/**
	 * @summary   Uses the canvas to establish aspect ratio, resizes the gameCanvas_DIV to fit mainCenter.
	 * @memberof JSGAME.SHARED
	 *
	 * @example JSGAME.SHARED.canvasResize_autofit();
	*/
	canvasResize_autofit : function(){
		let dims1 = {
			"siteContainerDiv" : JSGAME.DOM.siteContainerDiv.getBoundingClientRect() ,
			"topBar"           : JSGAME.DOM.topBar          .getBoundingClientRect() ,
			"mainCenter"       : JSGAME.DOM.mainCenter      .getBoundingClientRect() ,
			"botBar"           : JSGAME.DOM.botBar          .getBoundingClientRect() ,
		};

		let dimsA = window.getComputedStyle(JSGAME.DOM.siteContainerDiv, null) ;
		let dimsB = window.getComputedStyle(JSGAME.DOM.topBar          , null) ;
		let dimsC = window.getComputedStyle(JSGAME.DOM.mainCenter      , null) ;
		let dimsD = window.getComputedStyle(JSGAME.DOM.botBar          , null) ;

		let test = {
			"siteContainerDiv" : { width:parseInt(dimsA.width,10), height:parseInt(dimsA.height,10) } ,
			"topBar"           : { width:parseInt(dimsB.width,10), height:parseInt(dimsB.height,10) } ,
			"mainCenter"       : { width:parseInt(dimsC.width,10), height:parseInt(dimsC.height,10) } ,
			"botBar"           : { width:parseInt(dimsD.width,10), height:parseInt(dimsD.height,10) } ,

		};

		let total_w = (dims1.siteContainerDiv.width) << 0;

		let total_h = (dims1.siteContainerDiv.height) << 0;
		total_h -= (dims1.topBar.height) << 0;
		total_h -= (dims1.botBar.height) << 0;

		let size = Math.min(total_w, total_h);

		// Get the dimensions of the canvas.
		let canvas_width  = core.GRAPHICS.canvas.OUTPUT.width  ;
		let canvas_height = core.GRAPHICS.canvas.OUTPUT.height ;

		// Scale those dimensions.
		let new_cont_width  = ((canvas_width * size) / canvas_height ) << 0;
		let new_cont_height = (size )                                  << 0;

		let reduced_new_cont_width  = ( (new_cont_width)  - (new_cont_width *0.05) ) << 0;
		let reduced_new_cont_height = ( (new_cont_height) - (new_cont_height*0.05) ) << 0;

		// Set the new dimensions to the container.
		core.DOM.gameCanvas_DIV.style.width  = reduced_new_cont_width  + "px" ;
		core.DOM.gameCanvas_DIV.style.height = reduced_new_cont_height + "px" ;
	},

	/**
	 * @summary   --
	 * @memberof JSGAME.SHARED
	 *
	 * @example JSGAME.SHARED.canvasResize_autofit_onFullscreenResize();
	*/
	canvasResize_autofit_onFullscreenResize : function(){
		if(!JSGAME.FLAGS.autoAdjustVerticalCenter_throttled){
			let timeout = 250;

			// Only do this if currently in full screen mode.
			if((
				document.fullscreen              || // Chrome
				document.fullscreenElement       || // Chrome
				document.webkitFullscreenElement || // Chrome
				document.msFullscreenElement     || // Edge/IE
				document.mozFullScreenElement    || // Firefox
				window  .fullScreen                 // Firefox
			))
			{
				// Add a delay for doing the change.
				setTimeout(function(){
					// Set the "throttled" flag.
					JSGAME.FLAGS.autoAdjustVerticalCenter_throttled = true;

					// Set a timeout to clear the "throttled" flag.
					setTimeout(function() { JSGAME.FLAGS.autoAdjustVerticalCenter_throttled = false; }, timeout);

					JSGAME.SHARED.canvasResize_autofit();
				},timeout/2);
			}
		}
	},

	/**
	 * @summary   Shows or hides the document based on mouseenter/mouseleave and the hidden setting.
	 * @memberof JSGAME.SHARED
	 * @param    {*} e
	 *
	 * @example JSGAME.SHARED.toggleDocumentHidden(e);
	*/
	toggleDocumentHidden : function(e){
		// Get the event type.
		let type = e.type;

		// Get a DOM handle to the hidden_mode checkbox.
		let hidden_mode = JSGAME.DOM.hidden_mode;

		// Act only if the checkbox is checked.
		if(hidden_mode.checked){
			if     (type=="mouseleave"){ document.body.style.visibility="hidden"; }
			else if(type=="mouseenter"){ document.body.style.visibility="visible"; }
		}
	},

	/**
	 * @summary   Global Error Handler - listener function.
	 * @memberof JSGAME.SHARED
	 * @param    {*} event
	 *
	 * @example JSGAME.SHARED.listenerFunction(event);
	*/
	listenerFunction(event){
		console.log("event.type:", event.type);
		if(!JSGAME.FLAGS.errorThrown_stopReporting){
			JSGAME.SHARED.GlobalErrorHandler(event);
			JSGAME.FLAGS.errorThrown_stopReporting=true;
		}
		return false;
	},

	/**
	 * @summary   Global Error Handler
	 * @memberof JSGAME.SHARED
	 * @param    {*} event
	 * @param    {*} msg
	 * @param    {*} url
	 * @param    {*} lineNo
	 * @param    {*} columnNo
	 * @param    {*} error
	 *
	 * @example JSGAME.SHARED.GlobalErrorHandler(event, msg, url, lineNo, columnNo, error);
	*/
	GlobalErrorHandler : function(event, msg, url, lineNo, columnNo, error){
		// console.log(
		// 	"\n event   :", event    ,
		// 	"\n msg     :", msg      ,
		// 	"\n url     :", url      ,
		// 	"\n lineNo  :", lineNo   ,
		// 	"\n columnNo:", columnNo ,
		// 	"\n error   :", error    ,
		// 	""
		// );

		// console.log("event.type:", event.type);

		let extraText="NOTE: View the dev console for more detail.";
		let str;
		// Try to do the normal error output.
		try{
			let link = (event.filename || "")+":"+(event.lineno || "")+":"+(event.colno || "");

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
			if(event.type=="unhandledrejection"){
				if(event.reason.message){ str+="\n -=> message    : " + event.reason.message; } else { str+="\n -=> message    : " + "<UNAVAILABLE>"; }
				if(link.length>5){ str+="\n -=> link       : " + link;                        } else { str+="\n -=> link       : " + "<UNAVAILABLE>"; }
				if(event.lineno) { str+="\n -=> lineno     : " + event.lineno;                } else { str+="\n -=> lineno     : " + "<UNAVAILABLE>"; }
				if(event.colno)  { str+="\n -=> colno      : " + event.colno;                 } else { str+="\n -=> colno      : " + "<UNAVAILABLE>"; }
			}
			else {
				if(event.message){ str+="\n -=> message    : " + event.message; } else { str+="\n -=> message    : " + "<UNAVAILABLE>"; }
				if(link.length>5){ str+="\n -=> link       : " + link;          } else { str+="\n -=> link       : " + "<UNAVAILABLE>"; }
				if(event.lineno) { str+="\n -=> lineno     : " + event.lineno;  } else { str+="\n -=> lineno     : " + "<UNAVAILABLE>"; }
				if(event.colno)  { str+="\n -=> colno      : " + event.colno;   } else { str+="\n -=> colno      : " + "<UNAVAILABLE>"; }
			}

			// STACK (if available.)
			let stack;
			if     ( event && event.error  && event.error.stack  ) { stack = event.error.stack ; }
			else if( event && event.reason && event.reason.stack ) {
				stack = event.reason.stack.replace("at ", "-----");
			}
			else{ console.error(".stack was not available."); }

			if( stack ) {
				str+="\n -=> stack      : ";
				let arr = stack.split("\n");
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

							let len = left.length + middle.length;

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

				// Add text to display on the screen?
				if(stackLines[0]){
					// Get the first line.
					try     { extraText=stackLines[0].split("=E=")[1].trim(); }
					catch(e){ extraText=stackLines[0].trim(); }

					// Shorten the first line.
					let maxLen=450;
					if(extraText.length>maxLen){ extraText = extraText.substring(0, maxLen-16) + " ... (truncated)"; }
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
			// extraText="";
		}

		// At this point the game needs to pause so as not to rack up tons of identical errors.
		JSGAME.SHARED.stopGameAndshowErrorNotification(extraText);

		// Prevent the default actions.
		event.preventDefault();
	},

	/**
	 * @summary   Global Error Handler
	 * @memberof JSGAME.SHARED
	 * @param    {*} extraText
	 *
	 * @example JSGAME.SHARED.stopGameAndshowErrorNotification(extraText);
	*/
	stopGameAndshowErrorNotification : function(extraText){
		console.error("\nTHE GAME WAS STOPPED DUE TO ERROR!");

		// At this point the game needs to pause so as not to rack up tons of identical errors.
		JSGAME.FLAGS.paused         = true;
		JSGAME.FLAGS.manuallyPaused = true;
		JSGAME.SHARED.cancel_gameloop();

		// Show the error indicator.
		JSGAME.DOM.indicator.classList.add("show");
		JSGAME.DOM.indicator.innerText="-- ERROR DETECTED --";

		// Show the extra error text if it has been set.
		if(extraText){
			JSGAME.DOM.indicator_extraText.classList.add("show");
			JSGAME.DOM.indicator_extraText.innerText=""+""+extraText;
		}

		// Turn the preGame indicator off in case it is on since it overlaps the error indicator.
		JSGAME.GUI.preGame_indicator("", "OFF");
	},

	/**
	 * @summary   Prevent certain keys from shifting the window view.
	 * @memberof JSGAME.SHARED
	 * @param    {*} e
	 *
	 * @example JSGAME.SHARED.preventScroll(e);
	*/
	preventScroll : function(e){
		if(e.target==document.body){
			switch(e.keyCode){
				case 32 : { e.preventDefault(); break; } // Space bar.
				case 37 : { e.preventDefault(); break; } // Left arrow
				case 38 : { e.preventDefault(); break; } // Up arrow
				case 39 : { e.preventDefault(); break; } // Right arrow
				case 40 : { e.preventDefault(); break; } // Down arrow
			}
		}
	},

	/**
	 * @summary   Updates the real gamepads, and the onscreen/keyboard keypads.
	 * @memberof JSGAME.SHARED
	 *
	 * @example JSGAME.SHARED.getUserInputs();
	*/
	getUserInputs : function(){
		let arrayRef = JSGAME.SHARED.buttons;

		// JSGAME only stores the last input value. Prev, Held, Pressed, and Released are stored within the passed array.
		if(arrayRef==undefined){ console.log("ERROR: getUserInputs: arrayRef was not defined."); return; }

		// Output the button state to the DOM if the gamepad config panel is open.
		// if(JSGAME.DOM["panel_config_gamepads"].classList.contains("show")){
			//
		// }

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

	/**
	 * @summary   Convenience function for checking button state.
	 * @memberof JSGAME.SHARED
	 * @param    {*} btnConst1
	 * @param    {*} btnConst2
	 *
	 * @example JSGAME.SHARED.checkButton(btnConst1, btnConst2);
	*/
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

	// *** UTILITY FUNCTIONS ***

	/**
	 * @summary   Accepts seconds (decimal or int). Returns number of frames for that quanity of seconds (rounded up) .
	 * @memberof JSGAME.SHARED
	 * @param    {*} seconds
	 * @param    {*} rounding
	 *
	 * @example JSGAME.SHARED.secondsToFrames(seconds, rounding);
	*/
	secondsToFrames : function(seconds, rounding){
		if(!rounding){ rounding="up"; }
		if     (rounding=="up")  { return Math.ceil((core.SETTINGS.fps) * seconds); }
		else if(rounding=="down"){ return Math.ceil((core.SETTINGS.fps) * seconds); }

	},

	/**
	 * @summary   Get a random integer in the specified range.
	 * @memberof JSGAME.SHARED
	 * @param    {*} min
	 * @param    {*} max
	 *
	 * @example JSGAME.SHARED.getRandomInt_inRange(min, max);
	*/
	getRandomInt_inRange : function (min, max) {
		min = (min << 0);
		max = (max << 0);
		return ((Math.random() * (max - min + 1)) + min) << 0;
	},

	/**
	 * @summary   Update a value using a bit mask. (Per call can only turn "ON" or "OFF" bits. Not both.)
	 * @memberof JSGAME.SHARED
	 * @param    {*} src
	 * @param    {*} mask
	 * @param    {*} value
	 *
	 * @example JSGAME.SHARED.get_new_bitMask(src, mask, value);
	*/
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

	/**
	 * @summary   Map number in one range into another range.
	 * @memberof JSGAME.SHARED
	 * @param    {*} in_num
	 * @param    {*} in_min
	 * @param    {*} in_max
	 * @param    {*} out_min
	 * @param    {*} out_max
	 *
	 * @example JSGAME.SHARED.map_range(in_num, in_min, in_max, out_min, out_max);
	*/
	map_range : function(in_num, in_min, in_max, out_min, out_max) {
		// https://gist.github.com/xposedbones/75ebaef3c10060a3ee3b246166caab56

		// Example: range #1 is 0-100 and range #2 is 0-200.
		// Example: map_range(50, 0, 100, 0, 200);
		// A 50 from range #1 should be a 100 in range #2.
		// NOTE: This might not return an integer.

		return (in_num - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
	},

	/**
	 * @summary   --
	 * @memberof JSGAME.SHARED
	 *
	 * @example JSGAME.SHARED.cancel_gameloop();
	*/
	cancel_gameloop   : function(){
		// JSGAME.SHARED.cancel_gameloop();

		window.cancelAnimationFrame( JSGAME.SHARED.raf_id );
		JSGAME.SHARED.raf_id=null;
	},

	/**
	 * @summary   --
	 * @memberof JSGAME.SHARED
	 *
	 * @example JSGAME.SHARED.schedule_gameloop();
	*/
	schedule_gameloop : function(){
		// JSGAME.SHARED.schedule_gameloop();

		JSGAME.SHARED.raf_id = requestAnimationFrame( game.gameloop );
	},
};

// =============================
// ==== FILE END: SHARED.js ====
// =============================
