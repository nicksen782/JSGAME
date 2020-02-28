// ============================
// ==== FILE START: GUI.js ====
// ============================

'use strict';

JSGAME.GUI={
	// *** GUI NAV ***

	// Show the indicated panel and select the indicated debug button.
	showModal : function(panel_id, elem){
		// Attempt to get a DOM handle to the specified panel.
		let specifiedPanel = document.getElementById(panel_id);

		// Was it found? Show it.
		if(specifiedPanel){
			// Hide all first.
			JSGAME.GUI.hideModals();

			// Show this panel.
			specifiedPanel.classList.add("show");

			// Dim the background.
			JSGAME.DOM["entireBodyDiv"].classList.add("show");

			// Set the clicked button as active.
			if(elem){ elem.classList.add("active"); }
		}
		// Not found? Error!
		else{
			console.log("panel not found!");
		}
	},
	// Hide all panels and deselect the debug buttons.
	hideModals : function(){
		// Undim the background.
		JSGAME.DOM["entireBodyDiv"].classList.remove("show");

		// Hide panels.
		let modals = document.querySelectorAll('.modals');
		for(let i=0; i<modals.length; i+=1){
			modals[i].classList.remove("show");
		}

		// // Remove the active class from the buttons.
		// let debug_navButtons = document.querySelectorAll('.debug_navButtons');
		// for(let i=0; i<debug_navButtons.length; i+=1){
		// 	debug_navButtons[i].classList.remove("active");
		// }
	},
	// Change the game.
	changeGame : function(gamestring){
		// Read in some values from RAM/DOM.
		let gamepads  = ! JSGAME.DOM["gameControls"].classList.contains("hide") ;
		let debug     = document.getElementById("debug_mode").checked ? true : false;
		let qsFromPHP = JSGAME.PRELOAD.PHP_VARS.queryString;

		let vals = {
			"game"      : gamestring ? gamestring : "" ,
			"gamepads"  : gamepads   ? gamepads   : "" ,
			"debug"     : debug      ? debug      : "" ,
			"hidden"    : debug && [undefined, "undefined"].indexOf(qsFromPHP.hidden)    == -1 ? qsFromPHP.hidden                         : "" ,
			"mastervol" : debug && [undefined, "undefined"].indexOf(qsFromPHP.mastervol) == -1 ? qsFromPHP.mastervol                      : "" ,
			"combine"   : debug && [undefined, "undefined"].indexOf(qsFromPHP.combine)   == -1 ? JSON.stringify(qsFromPHP.combine,null,0) : "" ,
		};
		keys = Object.keys(vals);

		// Create the querystring.
		let qs="";
		let firstKey=true;
		for(let i=0; i<keys.length; i+=1){
			let key = keys[i];
			let val = vals[key];

			if(val!=""){
				if(firstKey==true){ qs+="?"; firstKey=false; }
				else              { qs+="&"; }
				qs+=key+"="+val;
			}
		}

		// Redirect to the new game URL.
		window.location.href = window.location.origin + window.location.pathname + qs;
	},
	// Reload the game (whole page.)
	reloadGame : function(){
		JSGAME.GUI.changeGame( JSGAME.DOM["gameSelector"].value );
	},

	// *** USER GAME INPUT ***

	// Show/hide the on-screen gamepads.
	toggleGamepads      : function(){
		// The gameControls.
		let gameControls_hidden = JSGAME.DOM["gameControls"].classList.contains("hide") ;
		let DEBUG_DIV           = document.getElementById("DEBUG_DIV");

		JSGAME.DOM["gameControls"].classList.add("top");

		// Are the game controls hidden?
		if(gameControls_hidden){
			// Make sure the inline_block class is applied to the site container.
			JSGAME.DOM["siteContainerDiv"].classList.add("inline_block");

			// Remove the vertical alignment of the body.
			// document.body.classList.remove("verticalCenter");

			// Show the game controls.
			JSGAME.DOM["gameControls"].classList.remove("hide");

			// Show the side div
			JSGAME.DOM["sideDiv"].classList.remove("hide");

		}
		// Are the game controls visible?
		else         {
			// Do we remove the inline_block class from the site container?
			if(!DEBUG_DIV){ JSGAME.DOM["siteContainerDiv"].classList.remove("inline_block"); }

			// Add the vertical alignment of the body.
			// document.body.classList.add("verticalCenter");

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
					// let kb   = elem.getAttribute("kb");

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
				try{ button.classList.add("active"); }
				catch(e){}

				// Update the buttons state.
				JSGAME.SHARED["LASTINPUT_P"+pad] |=  thisButton ;
			}
			else if(type=="keyup")   {
				// Show the button press/release.
				try{ button.classList.remove("active"); }
				catch(e){}

				// Update the buttons state.
				JSGAME.SHARED["LASTINPUT_P"+pad] &= ~thisButton ;
			}
		}

	},
	// Listen for a key to be pressed.
	document_keydown    : function(e){
		let index = JSGAME.consts.allowedKeys.indexOf(e.code) ;
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
					JSGAME.DOM["indicator_extraText"].classList.remove("show");
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
				JSGAME.DOM["indicator_extraText"].classList.remove("show");
				JSGAME.DOM["indicator"].innerText="PAUSED";
				let title = document.title.replace(/\(P\) /g, "");
				document.title = "(P) " + title;

				JSGAME.SHARED.cancel_gameloop();
			}
		}
	},

	preGame_indicator : function(msgKey, newState){
		// JSGAME.GUI.preGame_indicator("jsgamesetup"  , "ON");
		// JSGAME.GUI.preGame_indicator("nogame"       , "ON");
		// JSGAME.GUI.preGame_indicator("loadingGame"  , "ON");
		// JSGAME.GUI.preGame_indicator("gestureNeeded", "ON");
		// JSGAME.GUI.preGame_indicator("gamelistEmpty", "ON");

		let textObj = {
			"jsgamesetup"        : "Starting JS GAME" ,
			"nogame"             : "A game has not been selected.\nPlease select a game." ,
			"loadingGame"        : "Loading game." ,
			"gestureNeeded"      : "Please click/touch anywhere\nin this window to continue." ,
			"gestureNeeded_done" : "Gesture detected." ,
			"gamelistEmpty"      : "No games are installed.\n\nYou will need to install games and\nupdate the gamelist.json file.\n" ,
		};

		if(newState=="OFF"){
			JSGAME.DOM["indicator_preGame"].classList.remove("show");
			JSGAME.DOM["indicator_preGame"].innerText="";

		}
		if(newState=="ON"){
			JSGAME.DOM["indicator_preGame"].classList.add("show");
			JSGAME.DOM["indicator_preGame"].innerText=textObj[msgKey];
		}

	},

	// Sets the app.GUI.settings.manuallyPaused flag and cancels the requestAnimationFrame... or it restarts the game loop.
	togglePause         : function(){
		// Pause if unpaused.
		if(JSGAME.FLAGS.manuallyPaused==false){
			JSGAME.FLAGS.paused         = true;
			JSGAME.FLAGS.manuallyPaused = true;

			// Cancel the current requestAnimationFrame.
			JSGAME.SHARED.cancel_gameloop();

			JSGAME.DOM["indicator"].classList.add("show");
			JSGAME.DOM["indicator_extraText"].classList.remove("show");
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
			JSGAME.DOM["indicator_extraText"].classList.remove("show");
			JSGAME.DOM["indicator"].innerText="";

			// Run the normal gameloop.
			game.gameloop();
		}
	},

	// *** FULLSCREEN ***

	// Toggles full screen.
	togglefullscreen    : function(){
		let elem;

		// Choose the output canvas to display fullscreen. If it is not available then use the gameCanvas_DIV.
		try{
			elem = JSGAME.DOM["siteContainerDiv"];
			// elem = core.DOM['gameCanvas_DIV'];
			// elem = core.GRAPHICS.canvas.OUTPUT;
			if(!elem){ elem = core.DOM['gameCanvas_DIV']; }
		}
		catch(e){ elem = core.DOM['gameCanvas_DIV']; }

		// Go to fullscreen.
		if(!(
			   document.fullscreen              // Chrome
			|| document.fullscreenElement       // Chrome
			|| document.webkitFullscreenElement // Chrome
			|| document.msFullscreenElement     // Edge/IE
			|| document.mozFullScreenElement    // Firefox
			|| window  .fullScreen              // Firefox
		))
		{
			let prom_res=function(res){
				setTimeout(function(){
					// console.log("full screen complete. Now running autofit.");
					JSGAME.SHARED.canvasResize_autofit();
				},75);
			};
			let prom_err=function(err){
				let str = ["=E= togglefullscreen: (to full).", JSON.stringify(err)];
				console.error("str:", str, "\n err:", err);
				throw Error(str);
			};

			if      (elem.requestFullscreen      ) { elem.requestFullscreen()      .then( prom_res, prom_err );       ; } // Standard
			else if (elem.webkitRequestFullscreen) { elem.webkitRequestFullscreen().then( prom_res, prom_err ); ; } // Chrome
			else if (elem.mozRequestFullScreen   ) { elem.mozRequestFullScreen()   .then( prom_res, prom_err );    ; } // Firefox
			else if (elem.msRequestFullscreen    ) { elem.msRequestFullscreen()    .then( prom_res, prom_err );     ; } // IE11
		}

		// Exit fullscreen.
		else{
			let prom_res=function(res){
				setTimeout(function(){
					console.log("full screen complete. Now returning canvas scale.")
					JSGAME.SHARED.canvasResize( JSGAME.DOM["canvasScaleSlider"].value );
				},75);
			};
			let prom_err=function(err){
				let str = ["=E= togglefullscreen: (from full).", JSON.stringify(err)];
				console.error("str:", str, "\n err:", err);
				throw Error(str);
			};

			if     (document.exitFullscreen     )  { document.exitFullscreen()      .then( prom_res, prom_err ); } // Standard
			else if(document.webkitExitFullscreen) { document.webkitExitFullscreen().then( prom_res, prom_err ); } // Chrome
			else if(document.mozCancelFullScreen)  { document.mozCancelFullScreen() .then( prom_res, prom_err ); } // Firefox
			else if(document.msExitFullscreen)     { document.msExitFullscreen()    .then( prom_res, prom_err ); } // IE11
		}
	},

};

// ==========================
// ==== FILE END: GUI.js ====
// ==========================
