<!DOCTYPE html>
<html lang="en">

<head>
	<meta http-equiv="X-UA-Compatible" content="IE=edge">
	<meta charset="UTF-8">

	<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate"/>
	<meta http-equiv="Pragma" content="no-cache"/>
	<meta http-equiv="Expires" content="0"/>

	<link rel="icon" href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACAQMAAABIeJ9nAAAABlBMVEVfoL9WVlZrUZ6mAAAADElEQVQI12NwYGgAAAFEAMHrWQMJAAAAAElFTkSuQmCC">

	<title>JS GAME</title>

	<!-- JS GAME styling -->
	<link rel="stylesheet" type="text/css" href="index.css">

</head>

<body>
	<div id="siteContainerDiv">
		<!-- BAR AT THE TOP -->
		<div id="titleBar">
			<div id="titleBar_logo_div">
				<!--TITLE-->
				<div class="titleBar_logo_div_title">JS GAME</div>

				<table>
					<!-- GAME SELECTOR -->
					<tr colspan="1">
							<select id="gameSelector" onchange="JSGAME.GUI.changeGame(this.value);">
								<option value="">... Choose a Game ...</option>
							</select>
						</td>
					</tr>
				</table>
			</div>

			<table class="titleBar_table">
				<!-- LINKS -->
				<tr>
					<td>Links:</td>
					<td colspan="4" id="gameinfolinks"></td>
				</tr>

				<!-- GAME CONFIG -->
				<tr>
					<td>OPTIONS1:</td>
					<td colspan="4">
						<button id="btn_toggleGamepads"  >GAMEPADS</button>
						<button id="btn_togglePause"     >PAUSE</button>
						<button id="btn_toggleFullscreen">FULLSCREEN</button>
					</td>
				</tr>

				<tr>
					<td>OPTIONS2:</td>
					<td colspan="4">
						<button onclick="JSGAME.GUI.reloadGame();">RELOAD</button>
						<button id="btn_config" onclick='JSGAME.GUI.showPanel_internal("panel_config_main");'>CONFIG</button>
					</td>
				</tr>

				<!-- ADDITIONAL CONTROLS.  -->
				<tr>
					<td id="masterVolumeSlider_td1" class="hide">
						VOL :
					</td>
					<td id="masterVolumeSlider_td2" class="hide">
						<input id="masterVolumeSlider" title="0" step="1" type="range" min="0" max="100" value="0">
					</td>
					<td>
						SIZE:
					</td>
					<td>
						<input id="canvasScaleSlider" title="1" step="0.1" type="range" min="1" max="3.0" value="1">
					</td>
				</tr>
			</table>
		</div>

		<!-- MAIN DISPLAY -->
		<div id="mainCenter">
			<div id="panel_jsgamesetup" class="panels show">
				<div class="oneLineVH_center" id="presetup_div">
					Starting JS GAME
				</div>
			</div>

			<div id="panel_nogame" class="panels">
				<div class="oneLineVH_center">
					A game has not been selected.
					<br>
					Please select a game.
				</div>
			</div>

			<div id="panel_loadingGame" class="panels">
				<div class="oneLineVH_center">
					Loading
					game.
				</div>
			</div>

			<div id="panel_game" class="panels">
				<!-- GAME -->
				<div id="gameCanvas_DIV">
					<!-- INDICATOR -->
					<div id="indicator"></div>
					<div id="indicator_extraText"></div>
				</div>

			</div>

			<div id="panel_gestureNeeded" class="panels">
				<div class="oneLineVH_center">
					Please click/touch anywhere
					<br>
					in this window to continue.
				</div>
			</div>

			<div id="panel_gamelistEmpty" class="panels">
				<div class="oneLineVH_center">
					No games are installed.
					<br>
					<br>
					You will need to install games and
					<br>
					update the gamelist.json file.
					<br>
				</div>
			</div>

			<!-- CONFIGURATION MAIN MENU -->
			<div id="panel_config_main" class="panels panels_config">
				<!-- <div class="oneLineVH_center"> -->
					panel_config_main
					<button class="debug_navButtons" panel="panel_config_main"     title='config_main'     onclick='JSGAME.GUI.showPanel("panel_config_main"    ,this);'>config_main</button>
					<button class="debug_navButtons" panel="panel_config_gamepads" title='config_gamepads' onclick='JSGAME.GUI.showPanel("panel_config_gamepads",this);JSGAME.GAMEPADS.CONFIG.scan();'>config_gamepads</button>
					<button class="debug_navButtons" panel="panel_config_settings" title='config_settings' onclick='JSGAME.GUI.showPanel("panel_config_settings",this);'>config_settings</button>
					<button class="debug_navButtons" panel="panel_game"            title='game'            onclick='JSGAME.GUI.showPanel("panel_game"         ,this);'>GAME</button>
				<!-- </div> -->
			</div>

			<!-- CONFIGURATION GAMEPADS -->
			<div id="panel_config_gamepads" class="panels panels_config">
				<!-- Appears if no gamepad has been found yet.  -->
				<div id="gamepad_askForConnection" class="oneLineVH_center hide">
					<div>To use your gamepad, connect it and then press a button.</div>
				</div>

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
					</div>

					<!-- Live feed of button/axes states -->
					<div id="gamepad_buttonStatus1">
					</div>

					<!-- Configuration of buttons -->
					<div id="gamepads_buttonConfig1"></div>
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

			<!-- CONFIGURATION SETTINGS -->
			<div id="panel_config_settings" class="panels panels_config">
				<!-- <div class="oneLineVH_center"> -->
				panel_config_settings
				<!-- </div> -->
			</div>

		</div>

		<!-- BAR AT THE BOTTOM -->
		<div id="bottomBar">
			(c) 2019 Nickolas Andersen (nicksen782)<br>
			<!--  -->
			<div id="debug1">
				<!-- -->
				DEBUG ON: <input type="checkbox" id="debug_mode">
				<span id="gp_blinker1_status" style="width:1em; height:1em; background-color:yellow; display:inline-block;visibility:hidden; ">&nbsp;</span>
				<span id="gp_blinker2_status" style="width:1em; height:1em; display:inline-block;visibility:hidden; background-image: url('data:image/gif;base64,R0lGODlhEAAQAPAAAJYcHAAAACH5BAwUAAAAIf8LTkVUU0NBUEUyLjADAQAAACwAAAAAEAAQAAACDoSPqcvtD6OctNqLsz4FACH5BA0UAAAAIf8LSW1hZ2VNYWdpY2sOZ2FtbWE9MC40NTQ1NDUALAAAAAAQABAAgAAAAAAAAAIOhI+py+0Po5y02ouzPgUAOw==')   ">&nbsp;</span>

				<!-- QUICK DEBUG BUTTONS -->
				<div id="debug_navButtons" class="hidden">
					VIEWS:<br>
					<button class="debug_navButtons" panel="panel_nogame"        title='nogame'                   onclick='JSGAME.GUI.showPanel("panel_nogame"         ,this);'>UNLOADED</button>
					<button class="debug_navButtons" panel="panel_jsgamesetup"   title='panel_jsgamesetup active' onclick='JSGAME.GUI.showPanel("panel_jsgamesetup"    ,this);'>INIT</button>
					<button class="debug_navButtons" panel="panel_loadingGame"   title='loadingGame'              onclick='JSGAME.GUI.showPanel("panel_loadingGame"    ,this);'>LOAD</button>
					<button class="debug_navButtons" panel="panel_game"          title='game'                     onclick='JSGAME.GUI.showPanel("panel_game"           ,this);'>GAME</button>
					<button class="debug_navButtons" panel="panel_gestureNeeded" title='gestureNeeded'            onclick='JSGAME.GUI.showPanel("panel_gestureNeeded"  ,this);'>GESTURE</button>
					<button class="debug_navButtons" panel="panel_gamelistEmpty" title='gamelistEmpty'            onclick='JSGAME.GUI.showPanel("panel_gamelistEmpty"  ,this);'>NO GAMES</button>
					<br>
					<button class="debug_navButtons" panel="panel_config_main"     title='config_main'            onclick='JSGAME.GUI.showPanel("panel_config_main"    ,this);'>config_main</button>
					<button class="debug_navButtons" panel="panel_config_gamepads" title='config_gamepads'        onclick='JSGAME.GUI.showPanel("panel_config_gamepads",this);'>config_gamepads</button>
					<button class="debug_navButtons" panel="panel_config_settings" title='config_settings'        onclick='JSGAME.GUI.showPanel("panel_config_settings",this);'>config_settings</button>
					<br>
				</div>
			</div>
		</div>
	</div>

	<div id="sideDiv" class="hide">
		<div id="gameControls" class="hide">
		</div>

		<div id="debug_container">
		</div>
	</div>

	<?php
		if($_GET["hidden"]=="true"){
		?>
		<style>
			.hiddenOpacityButtons{ opacity: 0.25; }
			.hiddenOpacityButtons.active{ background-color:gold; }
		</style>

		<div style="position: absolute; top: 0px; left: 0px; ">
			<button class="hiddenOpacityButtons" id="O_0_000" onclick='opacityAdjust(0.000, this);'>O :: 0.000</button><br>
			<br>

			<button class="hiddenOpacityButtons" id="O_0_025" onclick='opacityAdjust(0.025, this);'>O :: 0.025</button><br>
			<button class="hiddenOpacityButtons" id="O_0_050" onclick='opacityAdjust(0.050, this);'>O :: 0.050</button><br>
			<button class="hiddenOpacityButtons" id="O_0_100" onclick='opacityAdjust(0.100, this);'>O :: 0.100</button><br>
			<button class="hiddenOpacityButtons" id="O_0_250" onclick='opacityAdjust(0.250, this);'>O :: 0.250</button><br>
			<br>

			<button class="hiddenOpacityButtons" id="O_1_000" onclick='opacityAdjust(1.000, this);'>O :: 1.000</button><br>

			<br>
			<button class="hiddenOpacityButtons" onclick='showOnlySideDiv();'>showOnlySideDiv</button><br>
			<br>
			<button class="hiddenOpacityButtons" onclick='JSGAME.GUI.reloadGame();'>RELOAD</button><br>

		</div>

		<script>
			function showOnlySideDiv(){
				document.getElementById("siteContainerDiv").style.opacity = 0.00;
				document.getElementById("sideDiv")         .style.opacity = 1.00;
			}
			function opacityAdjust(opacity, elem){
				document.getElementById("siteContainerDiv").style.opacity = opacity;
				document.getElementById("sideDiv")         .style.opacity = opacity;

				let buttons = document.querySelectorAll(".hiddenOpacityButtons");
				buttons.forEach(function(d){
					d.classList.remove("active");
				});
				elem.classList.add("active");
			}
			opacityAdjust(0.000, document.getElementById("O_0_000"));
		</script>
	<?php
		}
	?>

	<!-- gameslist.json and main PHP setup portion. -->
	<script>
		// window.location.origin
		var thisPath   = window.location.pathname;
		var parentPath = thisPath.split("/");
		parentPath.pop(); parentPath.pop();
		parentPath = window.location.origin + (parentPath.join("/")) + "/" ;
		// console.log( parentPath );

		var app = {};
		var JSGAME={
			PRELOAD    : {} ,
			FLAGS      : {} ,
			SHARED     : {} ,
			DOM        : {} ,
			INIT       : {} ,
			GUI        : {} ,
			GAMEPADS   : {} ,
			consts     : {} , //
			CORE_SETUP_PERFORMANCE : {
				"starts" : {} ,
				"ends"   : {} ,
				"times"  : {} ,
			},
		};
		var core = {
			SETTINGS   : {} , // Core kernel settings.
			DOM        : {} , // DOM cache.
			debug      : {} , // Holds DOM specific to debugging.
			ASSETS     : {} , // Populated by Populated by game init code.
			AUDIO      : {} , // Populated by game init code.
			GRAPHICS   : {} , // Populated by game init code.
			CONSTS     : {} , // Populated by video/audio kernels.
			FUNCS      : {} , // Populated by video/audio kernels.
			EXTERNAL   : {} , // The game can add to this. The cores determine the default contents.
		};
		core.FUNCS.graphics = {};

		var game={};

		JSGAME.PRELOAD.PHP_VARS = {
			"gamelist_json"     : null ,
			"gamesettings_json" : null ,
			"gameSelected"      : null ,
			"typeGamepads"      : null ,
			"numGamepads"       : null ,
			"fps"               : null ,
			"videokernel"       : null ,
			"queryString"       : null ,
			"CANLOADGAME"       : null ,
		};

		JSGAME.PRELOAD.gamelist_json     = null ;
		JSGAME.PRELOAD.gameselected_json = null ;
		JSGAME.PRELOAD.gamesettings_json = null ;
	</script>

	<!-- Init via PHP : gameslist.json, gamesettings.json -->
	<!-- Also includes the window.onload function. -->
	<script src='index_p.php/?o=init&qs=<?php echo htmlentities(json_encode(($_GET))); ?>'></script>

</body>

</html>