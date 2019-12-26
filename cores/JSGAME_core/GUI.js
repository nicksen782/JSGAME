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