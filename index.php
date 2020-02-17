<!DOCTYPE html>
<html lang="en">

<head>
	<meta http-equiv="X-UA-Compatible" content="IE=edge">
	<meta charset="UTF-8">

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
					<div class="reload" id="btn_reload"></div>
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
							<span class="navbutton_label">Game Info</span>
							<span class="navbutton_caret_down"></span>
						</div>
						<div class="navbutton_content" id="gamelinks">
							<!-- Built-in Links -->
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
		<div id="debug_container">
		</div>
		<!-- </div> -->
	</div>
	</div>

	<!-- Init via PHP : gameslist.json, gamesettings.json -->
	<!-- Also includes the window.onload function. -->
	<script>
		(function(){
			let indicator_preGame = document.getElementById("indicator_preGame");
			indicator_preGame.classList.add("show");
			indicator_preGame.innerText="... STARTING ...";

			// Parses the queryString in the url and returns the data as an object of key:value pairs.
			let getQueryStringAsObj              = function() {
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
			};

			let addScript = function(src){
				return new Promise(function(res,rej){
					let script = document.createElement("script");
					script.onload=function(){
						script.onload=null;
						res();
					};
					script.src = src;
					document.body.appendChild(script);
				});
			};

			let qs = getQueryStringAsObj();
			let url = "index_p.php/?o=init&qs="+JSON.stringify(qs);

			addScript( url );
		})();
	</script>

	<!-- INLINE PHP VERSION -->
	<!-- Init via PHP : gameslist.json, gamesettings.json -->
	<!-- Also includes the window.onload function. -->
	<!-- <script src='index_p.php/?o=init&qs=<?php // echo htmlentities(json_encode(($_GET))); ?>'></script> -->

</body>

</html>