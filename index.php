<!DOCTYPE html>
<html lang="en">

<head>
	<meta http-equiv="X-UA-Compatible" content="IE=edge">
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<meta name="description" content="Gaming with JavaScript and Canvas.">
	<meta name="author" content="Nickolas Andersen (nicksen782)">

	<!-- <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" /> -->
	<!-- <meta http-equiv="Pragma" content="no-cache" /> -->
	<!-- <meta http-equiv="Expires" content="0" /> -->

	<link rel="icon"
		href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACAQMAAABIeJ9nAAAABlBMVEVfoL9WVlZrUZ6mAAAADElEQVQI12NwYGgAAAFEAMHrWQMJAAAAAElFTkSuQmCC">

	<title>JS GAME</title>

	<!-- JS GAME styling -->
	<link rel="stylesheet" type="text/css" href="index.css">

</head>

<body class="">

	<div style="display:inline-block">

	<!-- Holds the main container and the side div. -->
	<div id="siteContainerDiv1">
		<!-- MODALS - HIDDEN BY DEFAULT -->
		<div id="entireBodyDiv" class="modals" onclick=""></div>
		<div class="modals verticalCenter" id="panel_config_gamepads">
			<div id="gamepad_outerControls" class="">
				<!-- <button onclick='JSGAME.GUI.showModal("panel_config_gamepads", null);'>SKIP</button> -->
				<div id="gamepad_outerControls_title">GAMEPAD CONFIGURATION</div>
				<div class="gui_hidePanels" onclick='JSGAME.GUI.hideModals();'>X</div>
			</div>

			<!-- Remove this screen -->
			<div id="gamepad_askForConnection" class="oneLineVH_center">
				<div>To use your gamepad, connect it and then press a button.</div>
			</div>

			<!-- Main gamepad config. -->
			<div id="gamepad_ConnectionFound" class="hide">
				<!--GAMEPAD 1 CONFIG  -->
				<div id="gamepads_gp1_all">
					<!-- Connection status indicator -->
					<div id="gamepads_connectedStatus1">
						<div id="gamepadIcon_container_p1" class="gamepadIcon_container2 gamepadsStatus neverConnected">
							<!-- <div class="gamepadIcon smaller"></div> -->
							<div id="p1_gamepad_status"  class="p_gamepad_status">Player 1</div>
							<div id="p1_gamepad_status2" class="p_gamepad_status2"></div>
						</div>

						<!-- Live feed of button/axes states -->
						<div id="gamepad_buttonStatus1">
						</div>

						<!-- Configuration of buttons -->
						<div id="gamepads_buttonConfig1"></div>

					</div>
				</div>
				<!--GAMEPAD 2 CONFIG  -->
				<div id="gamepads_gp2_all">
					<!-- Connection status indicator -->
					<div id="gamepads_connectedStatus2">
						<div id="gamepadIcon_container_p2" class="gamepadIcon_container2 gamepadsStatus neverConnected">
							<!-- <div class="gamepadIcon smaller"></div> -->
							<div id="p2_gamepad_status"  class="p_gamepad_status">Player 2</div>
							<div id="p2_gamepad_status2" class="p_gamepad_status2"></div>
						</div>
					</div>

						<!-- Live feed of button/axes states -->
						<div id="gamepad_buttonStatus2">
						</div>

						<!-- Configuration of buttons -->
						<div id="gamepads_buttonConfig2"></div>
				</div>
			</div>

		</div>
		<!-- MODALS - HIDDEN BY DEFAULT -->

		<!-- BAR AT THE TOP -->
		<div id="topBar">
			<!-- JSGAME TITLE - (GAME NAME) -->
			<div id="topBar_line1">
				<span id="topBar_line1_jsgame">JS GAME</span>
				<span id="topBar_line1_gamename"></span>
				<div id="topBar_line1_buttons">
					<div class="reload" onclick="window.location.reload();" id="btn_reload"></div>
					<div class="pause" id="btn_togglePause"></div>
				</div>
			</div>

			<!-- DROP-MENU OPTIONS -->
			<div id="topBar_line2">

				<div class="navbar">
					<!-- Options -->
					<div class="navcol">
						<div class="navbutton">
							<span class="navbutton_label">Game Options</span>
							<span class="navbutton_caret_down"></span>
						</div>
						<div class="navbutton_content">
							<!-- CHANGE GAME -->
							<div class="navrow">
								<div class="navrow_left">CHANGE GAME</div>
								<div class="navrow_right">
									<select id="gameSelector" onchange="JSGAME.GUI.changeGame(this.value);">
										<option value="">... Choose a Game ...</option>
									</select>
								</div>
							</div>

							<!-- VOLUME -->
							<div class="navrow" id="masterVolumeSlider_row">
								<div class="navrow_left">VOLUME</div>
								<div class="navrow_right">
									<input id="masterVolumeSlider" title="1" step="1" type="range" min="0" max="100"
										value="0">
								</div>
							</div>

							<!-- SIZE -->
							<div class="navrow" id="canvasScaleSlider_row">
								<div class="navrow_left">SIZE</div>
								<div class="navrow_right">
									<input id="canvasScaleSlider" title="3" step="0.1" type="range" min="1"
										max="3.2" value="1">
								</div>
							</div>

							<!-- ON-SCREEN GAMEPADS -->
							<div class="navrow" id="btn_toggleGamepads">
								<div class="navrow_left">Gamepads (on-screen)</div>
								<div class="navrow_right">
									Toggles the on-screen gamepads.
								</div>
							</div>

							<!-- GAMEPAD CONFIG -->
							<div class="navrow" onclick='JSGAME.GUI.showModal("panel_config_gamepads", null); JSGAME.GAMEPADS.CONFIG.scan();'>
								<div class="navrow_left">Gamepads (real)</div>
								<div class="navrow_right">
									Displays the Gamepad Configuration menu.
								</div>
							</div>

							<!-- FULLSCREEN -->
							<div class="navrow" id="btn_toggleFullscreen">
								<div class="navrow_left">Full Screen Mode</div>
								<div class="navrow_right">
									Toggles the Full Screen Mode.
								</div>
							</div>

							<!-- RELOAD WINDOW -->
							<div class="navrow" onclick="JSGAME.GUI.reloadGame();">
								<div class="navrow_left">Reload Window</div>
								<div class="navrow_right">
									Reloads the window.
								</div>
							</div>

							<!-- RESTART GAME -->
							<!-- <div class="navrow" onclick="JSGAME.GUI.reloadGame();">
								<div class="navrow_left">Restart Game</div>
								<div class="navrow_right">
									Restarts the selected game.
								</div>
							</div> -->

						</div>
					</div>

					<!-- Links -->
					<div class="navcol">
						<div class="navbutton">
							<span class="navbutton_label">Information</span>
							<span class="navbutton_caret_down"></span>
						</div>
						<div class="navbutton_content" id="gamelinks">
							<!-- Built-in Links -->
							<div class="navrow" target="_blank" href="docs" onclick="window.open( this.getAttribute('href'), this.getAttribute('target') );">
								<div class="navrow_left">JS GAME (API Docs)</div>
								<div class="navrow_right">(Opens in new tab)</div>
							</div>

							<div class="navrow" target="_blank" href="https://github.com/nicksen782/JSGAME" onclick="window.open( this.getAttribute('href'), this.getAttribute('target') );">
								<div class="navrow_left">JS GAME (Github)</div>
								<div class="navrow_right">(Opens in new tab)</div>
							</div>

							<!-- Links from the game's gamesettings.json file.  -->
							<!--  -->
						</div>
					</div>

					<!-- DEBUG -->
					<div class="navcol">
						<div class="navbutton">
							<span class="navbutton_label">DEBUG</span>
							<span class="navbutton_caret_down"></span>
						</div>
						<div class="navbutton_content">
							<!-- DEBUG TOGGLE -->
							<div class="navrow">
								<div class="navrow_left">DEBUG <input id="debug_mode" type="checkbox"></div>
								<div class="navrow_right">
									Toggles the game's debug mode.
								</div>
							</div>

							<!-- HIDDEN TOGGLE -->
							<div class="navrow">
								<div class="navrow_left">
									HIDDEN
									<input id="hidden_mode" type="checkbox">
								</div>
								<div class="navrow_right">
									Hide document body on mouse leave.
								</div>
							</div>

							<!-- BLINKERS -->
							<!-- <div class="navrow"> -->
								<!-- <div class="navrow_left"> -->
									<!-- BLINKERS -->
									<!-- <span id="gp_blinker1_status">&nbsp;</span> -->
									<!-- <span id="gp_blinker2_status">&nbsp;</span> -->
								<!-- </div> -->
								<!-- <div class="navrow_right"> -->
									<!-- Indicators for real gamepads. -->
								<!-- </div> -->
							<!-- </div> -->

						</div>
					</div>

				</div>
			</div>

			<!-- Holds the on-screen gamepad controls. -->
			<div id="topBar_line3" class="hide">
				<div id="gameControls" class="hide">
				</div>
			</div>
		</div>

		<!-- MAIN DISPLAY -->
		<div id="mainCenter">
			<!-- GAME -->
			<div id="gameCanvas_DIV" class="">

				<!-- Main game canvas output.  -->
				<!-- <canvas width="256" height="256" id="canvas_OUTPUT"></canvas> -->

				<!-- INDICATOR (for errors) -->
				<div id="indicator"></div>
				<div id="indicator_extraText"></div>

				<!-- INDICATOR (for pre-game statuses) -->
				<div id="indicator_preGame">Starting JS GAME</div>

			</div>

		</div>

		<!-- BAR AT THE BOTTOM -->
		<div id="botBar">

			<div id="bot_authors">
				<table>
					<tr>
						<td>JSGAME:</td>
						<td>(c) 2019 Nickolas Andersen</td>
						<td>(nicksen782)</td>
						<td></td>
					</tr>
					<!-- Additional rows will be added by the PRESETUP.js -->
					<!-- <tr> <td>GAME:</td>  <td>(c) 2019 Nickolas Andersen (nicksen782)</td> </tr> -->
				</table>
			</div>

			<div
				title="Gamepads found! Click here to configure."
				id="bottom_bar_gamepadDetected"
				onclick='JSGAME.GUI.showModal("panel_config_gamepads", null); JSGAME.GAMEPADS.CONFIG.scan();'
			>
			</div>

		</div>

	</div>

	</div>

	<!--  -->
	<div style="display:inline-block">

	<div id="sideDiv" class="hide">
		<div id="debug_container"></div>
		<!-- </div> -->
	</div>
	</div>

	<!-- Init via PHP : gameslist.json, gamesettings.json -->
	<!-- Also includes the window.onload function. -->
	<script>
		window.onload = function(){
			window.onload=null;

			(async function(){
				'use strict';
				let indicator_preGame = document.getElementById("indicator_preGame");

				indicator_preGame.classList.add("show");
				indicator_preGame.innerText="... WELCOME ...";

				//
				let addScript = function (data, key, filename){
					return new Promise(function(res, rej){
						let blob      = new Blob( [data], { type: 'text/javascript;charset=utf-8' } );
						let script    = document.createElement('script');
						script.onload = function(){ script.onload=null; res( {"filename":filename, "script":script, "key":key} ) };
						script.setAttribute("filename", filename);
						document.body.appendChild(script);
						let d_url     = URL.createObjectURL(blob);
						script.src    = d_url;
						URL.revokeObjectURL(d_url);
					});
				};
				//
				let addCss    = function (data, key, filename){
					return new Promise(function(res, rej){
						// console.log(key, filename);

						// OPTION #0
						// let css = document.createElement("link");
						// css.setAttribute("filename", filename);
						// css.rel = 'stylesheet';
						// css.type = 'text/css';
						// css.textContent=data;
						// document.body.appendChild(css);
						// res( {"filename":filename, "css":css, "key":key} );

						// OPTION #0.1
						let blob = new Blob([data], { type: 'text/css;charset=utf-8' });
						let css = document.createElement("link");
						css.onload=null; res( {"filename":filename, "css":css, "key":key} );
						css.setAttribute("filename", filename);
						css.rel = 'stylesheet';
						css.type = 'text/css';
						document.body.appendChild(css);

						// OPTION #1
						// let reader = new FileReader();
						// reader.onload=function(){
						// 	reader.onload=null;
						// 	// css.src = reader.result;
						// 	css.href = reader.result;
						// };
						// reader.onerror=function(){
						// 	console.log("error");
						// };
						// reader.readAsDataURL(blob);

						// OPTION #2
						let d_url = URL.createObjectURL(blob);
						css.href = d_url;
						URL.revokeObjectURL(d_url);
					});
				};
				// Parses the queryString in the url and returns the data as an object of key:value pairs.
				let getQueryStringAsObj = function() {
					// Nickolas Andersen (nicksen782)
					// NOTE: May fail for values that are JSON encoded and/or also include "=" or "&" in the value.

					let str = window.location.search ; // ?game=videoModeC_TESTS&debug=true
					let obj = {} ;
					let key ;
					let val ;
					let i ;

					// Work with the string if there was one.
					if(str=="" || str==null || str==undefined){ return {}; }

					// Take off the "?".
					str = str.slice(1); // game=videoModeC_TESTS&debug=true

					// Split on "&".
					str = str.split("&"); // [ "game=videoModeC_TESTS" , "debug=true" ]

					// Go through all the key=value and split them on "=".
					for(i=0; i<str.length; i+=1){
						// Split on "=" to get the key and the value.
						key = str[i].split("=")[0];        // First iteration: [ 0: "game" , 1: "videoModeC_TESTS" ]
												           // 2nd   iteration: [ 0: "debug" , 1: "true" ]
						val = str[i].replace(key+"=", ""); // First iteration: [ 0: "videoModeC_TESTS" ]
												           // 2nd   iteration: [ 0: "true" ]

						// Add this to the return object.
						obj[key] = decodeURIComponent(val);
					}

					/*
						obj = {
							"game"  : "videoModeC_TESTS",
							"debug" : "true",
						};
					*/

					// Finally, return the object.
					return obj;
				};

				// Get the values from the queryString.
				let qs = getQueryStringAsObj();

				// Create a new form. Add all values from the queryString.
				let fd = new FormData();
				let o  = "init2";
				fd.append("o" , o );
				fd.append("r" , (new Date()).getTime() );
				for(let k in qs){ fd.append(k , qs[k] ); }

				// Submit the form.
				let url = "index_p.php" + "?o=" + o ;
				let xhr = new XMLHttpRequest();

				// Do this after the data is received.
				xhr.onload= async function(){
					xhr.onload=null;
					let json = xhr.response;

					// If there were minifications performed then list then in the dev console.
					if(json._MINIFICATIONS.length){ console.log("Minifications performed:", json._MINIFICATIONS, "\n\n"); }

					// This will be filled based on the code below which is for adding files and setting settings.
					let proms = [];

					function attachResources( json, key ){
						if     (key=="jsgameCore")  {
							return new Promise(function(res,rej){
								let jsgameCore_proms = [] ;

								//
								let keys = Object.keys( json[key] ) ;

								//
								for(let i=0; i<keys.length; i+=1){
									let rec = json[key][ keys[i] ] ;
									jsgameCore_proms.push(
										addScript( rec.data, key+"_"+rec.name, rec.name )
									)
								}

								//
								Promise.all( jsgameCore_proms ) .then(
									function(success){ res(key);                 },
									function(err)    { console.log("err:", err); }
								);
							});

						}
						else if(key=="PHP_VARS")    {
							//
							return new Promise(function(res,rej){
								JSGAME.PRELOAD.PHP_VARS = json[key];
								JSGAME.PRELOAD.gamelist_json      = JSON.parse( json.gamelist_json )     ;
								res(key);
							});
						}
						else if(key=="flagsAndJson"){
							//
							return new Promise(function(res,rej){
								try{
									JSGAME.PRELOAD.gamesettings_json  = JSON.parse( json.gamesettings_json ) ;
									JSGAME.PRELOAD.gameselected_json  = JSON.parse( json.gameselected_json ) ;
									JSGAME.FLAGS.debug                = json.PHP_VARS.debug     ;
									JSGAME.PRELOAD.PHP_VARS.game      = json.PHP_VARS.game      ;
									JSGAME.PRELOAD.PHP_VARS.hidden    = json.PHP_VARS.hidden    ;
									JSGAME.PRELOAD.PHP_VARS.gamepads  = json.PHP_VARS.gamepads  ;
									JSGAME.PRELOAD.PHP_VARS.mastervol = json.PHP_VARS.mastervol ;

									JSGAME.PRELOAD.PHP_VARS.onscreengamepads = json.onscreengamepads;

									res(key);
								}
								catch(err){ rej(key); }

							});
						}
						else if(key=="game_files")  {
							// The data varies.
							let keys = Object.keys( json[key] );
							for(let i=0; i<keys.length; i+=1){
								let rec = json[key][ keys[i] ];

								switch(keys[i]){
									case "js_files"    : {
										for(let f=0; f<rec.length; f+=1){
											if(rec[f].type=="js"){ proms.push( addScript( rec[f].data, key+"_"+rec[f].name, rec[f].name ) ); }
										}
										break;
									}
									case "debug_files" : {
										for(let f=0; f<rec.length; f+=1){
											if     (rec[f].type=="js"  ){ proms.push( addScript( rec[f].data, key+"_"+rec[f].name, rec[f].name ) ); }
											else if(rec[f].type=="css" ){ proms.push( addCss   ( rec[f].data, key+"_"+rec[f].name, rec[f].name ) ); }
											else if(rec[f].type=="html"){
												let debug_container  = document.getElementById("debug_container");
												debug_container.innerHTML = "<!-- hello --> " + rec[f].data;
											}
										}
										break;
									}
									case "game_files"  : {
										for(let f=0; f<rec.length; f+=1){
											if(rec[f].type=="js"){ proms.push( addScript( rec[f].data, key+"_"+rec[f].name, rec[f].name ) ); }
											// else{
											// 	console.log(rec[f].name, rec[f].data);
											// }
										}
										break;
									}
									case "videomode"   : {
										proms.push( addScript( rec.data, key, rec.name ) );
										break;
									}
									case "soundmode"   : {
										proms.push( addScript( rec.data, key, rec.name ) );
										break;
									}
									default : { console.log("????"); break; }
								}

							}
						}
					};

					indicator_preGame.innerText="... ADDING JSGAME CORE ...";
					try{ await attachResources( json, "jsgameCore"   ); } catch(err){ console.log("Failure on jsgameCore   : " , err); }  ;

					indicator_preGame.innerText="... CONFIGURING SETTINGS ...";
					try{ await attachResources( json, "PHP_VARS"     ); } catch(err){ console.log("Failure on PHP_VARS     : " , err); }  ;

					if(JSGAME.PRELOAD.PHP_VARS.file_lastUpdate_name2){
						indicator_preGame.innerText="... CONFIGURING FLAGS ...";
						try{ await attachResources( json, "flagsAndJson" ); } catch(err){ console.log("Failure on flagsAndJson : " , err); }  ;

						indicator_preGame.innerText="... ADDING GAME FILES ...";
						attachResources( json, "game_files"        ) ;
					}

					//
					Promise.all( proms ).then(
						function(success){
							indicator_preGame.innerText="... STARTING JSGAME ...";

							// Start JSGAME.
							STARTJSGAME();
						},
						function(err)    { console.log("err:", err, proms); }
					);
				};

				xhr.open( "POST", url, true );
				xhr.responseType = "json";
				xhr.send(fd);
			})();
		}

	</script>
</body>

</html>