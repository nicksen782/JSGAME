var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame ||
							window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
var cancelAnimationFrame = window.cancelAnimationFrame || window.mozCancelAnimationFrame;

//
JSGAME.INIT={
	// Detects little or big endianness for the browser.
	endianness : {
		isBigEndian    : new Uint8Array(new Uint32Array([0x12345678]).buffer)[0] === 0x12 ? true : false,
		isLittleEndian : new Uint8Array(new Uint32Array([0x12345678]).buffer)[0] === 0x78 ? true : false,
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
		JSGAME.FLAGS.hasUserInteractionRestriction=true;
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
		if(!JSGAME.FLAGS.hasUserInteractionRestriction){ return; }

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
					console.log("Removing user interaction restriction...", "\n\t(TYPE DETECTED: ", e.type, ")");
					JSGAME.FLAGS.hasUserInteractionRestriction=false;

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
				// console.error("CHECK FOR USER GESTURES FAILED!");
			}
		);

	},
	// Check endianness, canloadgame, autoplay availability, provide some basic feedback on errors.
	__PRE_INIT : function(){
		console.log("\n=======================================");
		console.log("INIT JS GAME...");

		// Handle errors (centralized.)
		window.addEventListener('error'             , function(event){
			JSGAME.SHARED.GlobalErrorHandler(event);
			return false;
		}, false);

		// window.addEventListener('error'             , JSGAME.SHARED.GlobalErrorHandler, false);
		// window.addEventListener('unhandledrejection', JSGAME.SHARED.GlobalErrorHandler, false);
		// window.addEventListener('rejectionhandled'  , JSGAME.SHARED.GlobalErrorHandler, false);
		// window.onerror = JSGAME.SHARED.GlobalErrorHandler;

		// window.onerror = function (msg, url, lineNo, columnNo, error) {
		// 	console.log("**********************");
		// 	JSGAME.SHARED.GlobalErrorHandler({}, msg, url, lineNo, columnNo, error);

		// 	return false;
		// 	// return true;
		// }

		// Make sure this environment is Little Endian.
		if(! JSGAME.INIT.endianness.isLittleEndian ){
			let str="ERROR:  This game requires a computer that uses Little Endian.";
			alert(str);
			throw str;
			return;
		}

		// Prevent certain keys from shifting the window view.
		window.onkeydown = JSGAME.SHARED.preventScroll;
		window.onkeyup   = JSGAME.SHARED.preventScroll;

		// DOM cache.
		JSGAME.DOM["gameSelector"]          = document.getElementById("gameSelector")         ;
		JSGAME.DOM["gameControls"]          = document.getElementById("gameControls")         ;
		JSGAME.DOM["gameControls_br"]       = document.getElementById("gameControls_br")      ;
		JSGAME.DOM["siteContainerDiv"]      = document.getElementById("siteContainerDiv")     ;
		JSGAME.DOM["sideDiv"]               = document.getElementById("sideDiv")              ;
		JSGAME.DOM["debug_mode"]            = document.getElementById("debug_mode")           ;
		JSGAME.DOM["panel_config_gamepads"] = document.getElementById("panel_config_gamepads");

		if(JSGAME.DOM["debug_mode"].checked){
			let debug_navButtons = document.getElementById("debug_navButtons");
			debug_navButtons.classList.remove("hidden");
		}

		// Set the available buttons/keys.
		JSGAME.consts.allowedKeys    = [ "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"     , "Enter"    , "KeyA" , "KeyS" , "ShiftLeft", "ShiftRight", "KeyQ" , "KeyW" , ];
		JSGAME.consts.allowedButtons = [ "BTN_UP" , "BTN_DOWN" , "BTN_LEFT" , "BTN_RIGHT" , "BTN_SELECT", "BTN_START", "BTN_B", "BTN_A", "BTN_SL"   , "BTN_SR"    , "BTN_Y", "BTN_X", ];

		// Add the listeners for real gamepads.
		JSGAME.GAMEPADS.CONFIG.init();

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
		JSGAME.DOM["gamepads"]               = document.querySelectorAll("#gameControls .gamepad");
		JSGAME.DOM["gamepads_svg"]           = document.querySelectorAll("#gameControls .gamepad svg");

		JSGAME.DOM["masterVolumeSlider_td1"] = document.getElementById  ("masterVolumeSlider_td1");
		JSGAME.DOM["masterVolumeSlider_td2"] = document.getElementById  ("masterVolumeSlider_td2");

		JSGAME.DOM["masterVolumeSlider"]     = document.getElementById  ("masterVolumeSlider");
		JSGAME.DOM["canvasScaleSlider"]      = document.getElementById  ("canvasScaleSlider");

		JSGAME.DOM["gameCanvas_DIV"]         = document.getElementById  ("gameCanvas_DIV");
		JSGAME.DOM["indicator"]              = document.getElementById  ("indicator");

		JSGAME.DOM["btn_toggleGamepads"]     = document.getElementById  ("btn_toggleGamepads");
		JSGAME.DOM["btn_togglePause"]        = document.getElementById  ("btn_togglePause");
		JSGAME.DOM["btn_toggleFullscreen"]   = document.getElementById  ("btn_toggleFullscreen");

		// *** DOM init (event listeners, etc.) ***

		// If the volume change function is available then show the volume controls.
		if(core.FUNCS.audio && core.FUNCS.audio.changeMasterVolume){
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

		//
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

		// Fix the onscreen gamepad attributes/text
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

		// Add the listeners for the on-screen gamepad and keyboard input.
		JSGAME.GUI.gameInputListeners();

		// Show or hide the onscreen gamepads?
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
						// console.log("GAME CORES ARE READY");
						console.log("STARTING GAME...");

						// Show the performance/timing data if in debug mode.
						if(JSGAME.FLAGS.debug)       {
							JSGAME.SHARED.PERFORMANCE.output();
							JSGAME.SHARED.PERFORMANCE.clearAll();
						}

						// Display the JS GAME logo then start the game.
						setTimeout(function(){
							core.FUNCS.graphics.logo().then( function(){
								console.log("=======================================\n\n");
								gamestartFunction();
							} );
						},125);
					},
					function(err){ console.error("ERROR: ", err); }
				);
			}
		);

	},

};
