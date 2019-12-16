<!DOCTYPE html>
<html lang="en">

<head>
	<meta http-equiv="X-UA-Compatible" content="IE=edge">
	<meta charset="UTF-8">

	<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate"/>
	<meta http-equiv="Pragma" content="no-cache"/>
	<meta http-equiv="Expires" content="0"/>

	<link rel="icon" href="data:;base64,iVBORw0KGgo=">

	<title>JS GAME</title>

	<!-- JS GAME styling -->
	<link rel="stylesheet" type="text/css" href="index.css">

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
		};
		var game={};

		JSGAME.PRELOAD.PHP_VARS = {
			"gamelist_json"     : null ,
			"gamesettings_json" : null ,
			"gameSelected"      : null ,
			"typeGamepads"      : null ,
			"numGamepads"       : null ,
			"fps"               : null ,
			"videokernel"       : null ,
			"queryString"       : <?php echo json_encode($_GET); ?> ,
			"CANLOADGAME"       : null ,
		};

		JSGAME.PRELOAD.gamelist_json     = null ;
		JSGAME.PRELOAD.gameselected_json = null ;
		JSGAME.PRELOAD.gamesettings_json = null ;

		<?php
			if($_GET['debug']=="true"){ $debug=true;  }
			else                      { $debug=false; }

			// Gamepads are off by default.
			if( $_GET['gamepads'] ){ $gamepads= $_GET['gamepads']=="true" ? true : false;  }
			else                   { $gamepads=false; }

			$outputText = "";
			$outputText_errors = "";

			// These values will be determined here and later copied to JavaScript.
			$PHP_VARS["gamelist_json"]     = null  ; // Was gamelist.json found?
			$PHP_VARS["gamesettings_json"] = null  ; // Was gamesettings.json found?
			$PHP_VARS["gameSelected"]      = null  ; // Was a game selected?
			$PHP_VARS["typeGamepads"]      = null  ; //
			$PHP_VARS["numGamepads"]       = null  ; //
			$PHP_VARS["fps"]               = null  ; //
			$PHP_VARS["videokernel"]       = null  ; //
			// $PHP_VARS["queryString"]       = $_GET ; //
			$PHP_VARS["CANLOADGAME"]       = null  ; //

			// ***************************************
			//  FIND AND LOAD THE gamelist.json FILE.
			// ***************************************

			// Look for the gamelist.json file. Save to JavaScript if found.
			$gamelist_json = [];

			// Not there? Use the built-in blank one.
			$gamelistjson_file = "gamelist.json";
			if( ! file_exists ($gamelistjson_file) ) {
				// Create the gamelist file from the template.
				// Make sure that other users can write to it.
				$oldmask = umask(0);
				$src     = "template_gamelist.json" ;
				$dest    = "gamelist.json" ;
				copy( $src , $dest );
				chmod($dest, 0666);
				umask($oldmask);
				// file_put_contents("gamelist.json", file_get_contents("template_gamelist.json"));
			}

			if( file_exists ($gamelistjson_file) )     {
				// Set the flag indicating the $gamelistjson_file file was found.
				$PHP_VARS['gamelist_json']=true;

				// Get a handle on the 'games' key in the $gamelistjson_file file.
				$games=json_decode(file_get_contents($gamelistjson_file), true)['games'];

				// Output as JavaScript variable.
				$outputText .= "\nJSGAME.PRELOAD.gamelist_json = " . json_encode($games, JSON_PRETTY_PRINT) . ";" ;
				$outputText .= "\n";
			}
			else                                    {
				$outputText_errors .= 'NO GAMELIST.JSON' . "\n";
			}

			// Was the $gamelistjson_file file found AND was a game selected?
			// If so, start loading the assets for the game.
			if( $PHP_VARS['gamelist_json'] && isset($_GET['game']) ){
				// Find this entry in the gamelist_json.
				$thisgame = array_filter($games, function($entry){
					return $entry['header_gameChoice'] == $_GET['game'] ;
				} );

				// Array filter returns an array with the original index values. Fix!
				$thisgame = array_values($thisgame)[0];

				// Handle invalid game title:
				//

				// With the gamesettings we should be able to get the path to the game.
				$path = $thisgame['gamedir'];

				// gamesettings.json
				if( file_exists ($path . '/gamesettings.json') ) {
					$PHP_VARS['gamesettings_json']=true;
					$PHP_VARS['gameSelected']=true;

					$gamesettings=json_decode(file_get_contents($path . '/gamesettings.json'),true) ;

					// Fix the path for gamesettings.
					//

					// Gamepads:
					$PHP_VARS['typeGamepads'] = $gamesettings["typeGamepads"] ; // : "nes",
					$PHP_VARS['numGamepads']  = $gamesettings["numGamepads"]  ; // : 1,

					// FPS:
					$PHP_VARS['fps']          = $gamesettings["fps"]          ; // : 30,

					// Video kernel:
					$PHP_VARS['videokernel']  = $gamesettings["videokernel"]  ; // : "",
					$videokernel = file_get_contents( $PHP_VARS['videokernel'] );

					// Fonts:
					$PHP_VARS['fonts']        = $gamesettings["fonts"]  ; // : "",

					// Sounds/Music?
					$PHP_VARS['soundkernel']      = $gamesettings["soundkernel"]  ; // : "",
					$soundkernel                  = file_get_contents( $PHP_VARS['soundkernel'] );

					// MP3
					$PHP_VARS['mp3_files'] = [] ;
					if( $gamesettings["mp3_files"] ) { $PHP_VARS['mp3_files'] = $gamesettings["mp3_files"]; }

					// MIDI
					$PHP_VARS['midi_bin'] = [] ;
					if( $gamesettings["midi_bin"] ) { $PHP_VARS['midi_bin'] = $gamesettings["midi_bin"]; }

					// MIDI
					$PHP_VARS['midi_synths'] = [] ;
					if( $gamesettings["midi_synths"] ) { $PHP_VARS['midi_synths'] = $gamesettings["midi_synths"]; }

					// Graphics assets.
					$PHP_VARS['graphics_conversionSettings'] = $gamesettings["graphics_conversionSettings"];

					// Links:
					$PHP_VARS['links'] = $gamesettings["links"];

					// Canvas scale factor
					$PHP_VARS['canvas_scaleFactor'] = $gamesettings["canvas_scaleFactor"];

					// JavaScript files for the game:
					$PHP_VARS['js_files'] = $gamesettings["js_files"];

					// Output as JavaScript variable.
					$outputText .= "JSGAME.PRELOAD.gamesettings_json = " . json_encode($gamesettings, JSON_PRETTY_PRINT) . ";" ;
					$outputText .= "\n";
					$outputText .= "\n";
					$outputText .= "\nJSGAME.PRELOAD.gameselected_json = " . json_encode($thisgame, JSON_PRETTY_PRINT) . "; \n\n";

					// Set the game can load flag.
					$PHP_VARS['CANLOADGAME']  = true;
				}
				else                                    {
					echo "console.log('PATH:', '".$path."' );" . "\n";
					echo "// no gamesettings.json " . "\n";
				}
			}
			else{
				$outputText_errors .= 'GAME HAS NOT BEEN SELECTED' . "\n";
			}

			// END: Output the PHP vars as JavaScript vars.
			echo "\n";
			foreach($PHP_VARS as $k => $v){
				// echo "$k ";
				if( is_array($PHP_VARS[$k]) ) {
					$outputText .= "JSGAME.PRELOAD.PHP_VARS['$k'] = "  . json_encode($PHP_VARS[$k]) . "; // \n";
				}
				else if( is_string($PHP_VARS[$k]) ) {
					$outputText .= "JSGAME.PRELOAD.PHP_VARS['$k'] = '" . $PHP_VARS[$k] . "'; // \n";
				}
				else if(is_null($PHP_VARS[$k])){
					$outputText .= "JSGAME.PRELOAD.PHP_VARS['$k'] = null; // \n"  ;
				}
				else{
					$outputText .= "JSGAME.PRELOAD.PHP_VARS['$k'] = "  . $PHP_VARS[$k] . "; // \n"  ;
				}
			}

			// Output the $outputText.
			echo trim($outputText);

			// Output the error status(es).
			if($outputText_errors != ""){
				echo "\n\n// ERRORS: \n";
				echo "/*\n";
				echo trim($outputText_errors);
				echo "\n*/\n\n";
				echo 'console.log("ERRORS:");' . "\n";
				echo 'console.log('.json_encode(trim($outputText_errors)) . ')';
				// echo "\n";
			}
		?>

	</script>

	<!-- LOAD DEBUG (IF ACTIVE) -->
	<?php
		if($PHP_VARS['CANLOADGAME'] && $debug){
			echo "\n";
			if( file_exists ($path . '/DEBUG/debug.css') && $debug) {
				echo '<link rel="stylesheet" type="text/css" href="'.$path . '/DEBUG/debug.css'.'">'."\n";
				echo "\n";
			}

			echo "\n";
			if( file_exists ($path . '/DEBUG/debug.js')  && $debug) {
				echo '<script src="'.$path . '/DEBUG/debug.js'.'">'."</script>\n";
				echo "\n";
			}
		}
	?>

	<!--Initializes data and readies the game for play.-->
	<script src="index.js"></script>

	<!-- DEBUG AND GAMEPAD FLAGS -->
	<?php
		echo "<script>";
		// DEBUG
		if($PHP_VARS['CANLOADGAME'] && $debug)   { echo "JSGAME.SHARED.debug=true ; \n";    }
		else                                     { echo "JSGAME.SHARED.debug=false; \n";    }

		// GAMEPADS off?
		if($PHP_VARS['CANLOADGAME'] && $gamepads){ echo "JSGAME.SHARED.gamepads=true ; \n"; }
		else                                     { echo "JSGAME.SHARED.gamepads=false; \n"; }
		echo "</script>";
	?>

	<!-- VIDEO -->
	<script purpose="video">
		<?php
			if($PHP_VARS['CANLOADGAME']){
				echo "\n";
				echo trim($videokernel) ;
				echo "\n";
				echo "\n";
			}
		?>
	</script>

	<!-- SOUND -->
	<script purpose="sound">
		<?php
			if($PHP_VARS['CANLOADGAME']){
				echo "\n";
				echo trim($soundkernel) ;
				echo "\n";
				echo "\n";
			}
		?>
	</script>

	<!-- LOADED GAME JS FILES -->
	<?php
		if($PHP_VARS['CANLOADGAME']){
			foreach($PHP_VARS['js_files'] as $k => $v){
				// if $debug, add random string to .js file??
				echo '<script file="'.$k.'" src="'.$path.'/'.$v.'" purpose="GAME"></script>' . "\n";
			}
		}
	?>

	<!-- START JS GAME -->
	<script purpose="INIT">
		window.onload=function(){
			window.onload=null;
			JSGAME.INIT.__PRE_INIT();
		};
	</script>

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
								<?php
									foreach($games as $k => $v){
										if($v['AVAILABLE']==1){
											echo '<option ' . "\n" .
												'value   ="'.$v["header_gameChoice"] . '" ' . "\n" .
												'gamename="'.$v["gamename"]          . '" ' . "\n" .
												'author  ="'.$v["author"]            . '" ' . "\n" .
												'gamedesc="'.$v["gamedesc"]          . '" ' . "\n" .
												($v["header_gameChoice"]==$_GET['game'] ? "selected" : "") . "\n" .
											">" . "\n" .
											$v['gamename'] . "\n".
											'</option>' . "\n";
										}
									}
								?>
							</select>
						</td>
					</tr>
				</table>
			</div>

			<table class="titleBar_table">
				<!-- LINKS -->
				<tr>
					<td>Links:</td>
					<td colspan="4">
						<?php
							if($PHP_VARS['CANLOADGAME']){

								foreach($PHP_VARS['links'] as $k => $v){
									// Is this an absolute path?
									if (preg_match('/:\/\//', $v["href"])) {
										echo '<a href="'.$v["href"].'" target="_blank">['.$v["text"].']</a>' . "\n";
									}
									// It is a relative path.
									else{
										echo '<a href="'.$path."/".$v["href"].'" target="_blank">['.$v["text"].']</a>' . "\n";
									}
								}
							}
						?>
					</td>
				</tr>

				<!-- GAME CONFIG -->
				<tr>
					<td>OPTIONS:</td>
					<td colspan="4">
						<button id="btn_toggleGamepads">Gamepads</button>
						<button id="btn_togglePause">Pause</button>
						<button id="btn_toggleFullscreen">Fullscreen</button>
						<button id="btn_reloadGame" class="hide">RELOAD</button>
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
				</div>

				<!-- GAME CONTROLS -->
				<!-- <div id="gameControls_br">
					<br>
				</div> -->

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

		</div>

		<!-- BAR AT THE BOTTOM -->
		<div id="bottomBar">
			(c) 2019 Nickolas Andersen (nicksen782)<br>
			<!--  -->
			<div id="debug1">
				<?php
					if($PHP_VARS['CANLOADGAME']){
						//
					}
				?>
				<!-- -->
				DEBUG: <input type="checkbox" id="debug_mode" <?php echo ($debug ? "checked" : "") ?>>
				<button onclick="JSGAME.GUI.reloadGame();">RELOAD</button>

				<!-- QUICK DEBUG BUTTONS -->
				VIEWS:
				<button class="debug_navButtons" panel="panel_nogame"        title='nogame'        onclick='JSGAME.GUI.showPanel("panel_nogame"       ,this);'>UNLOADED</button>
				<button class="debug_navButtons" panel="panel_loadingGame"   title='loadingGame'   onclick='JSGAME.GUI.showPanel("panel_loadingGame"  ,this);'>LOAD</button>
				<button class="debug_navButtons" panel="panel_game"          title='game'          onclick='JSGAME.GUI.showPanel("panel_game"         ,this);'>GAME</button>
				<button class="debug_navButtons" panel="panel_gestureNeeded" title='gestureNeeded' onclick='JSGAME.GUI.showPanel("panel_gestureNeeded",this);'>GESTURE</button>
				<button class="debug_navButtons" panel="panel_gamelistEmpty" title='gamelistEmpty' onclick='JSGAME.GUI.showPanel("panel_gamelistEmpty",this);'>NO GAMES</button>

			</div>
		</div>
	</div>

	<div id="sideDiv" class="hide">
		<div id="gameControls" class="hide">
			<?php
				// Only do this if the game can load.
				if($PHP_VARS['CANLOADGAME']){
					if($PHP_VARS['typeGamepads']=="nes" && $PHP_VARS['numGamepads'] > 0){
						// Output the SVG.
						for($i=0; $i<$PHP_VARS['numGamepads']; $i+=1){
							$class="";
							if($debug){ $class = "twoGamepads";}
							else{
								if     ($PHP_VARS['numGamepads']==1){ $class="oneGamepad"; }
								else if($PHP_VARS['numGamepads']==2){ $class="twoGamepads"; }
							}

							echo "<div class='".$class." gamepad gamepad_nes noSelect2' pad='".($i+1)."'>";
							require "gamepadconfigs/gamepad_nes.svg";
							echo "</div>";
							// echo "<br>";

							// Output the keyboard keys.
							//
						}
					}
					else if($PHP_VARS['typeGamepads']=="snes" && $PHP_VARS['numGamepads'] > 0){
						// Output the SVG.
						for($i=0; $i<$PHP_VARS['numGamepads']; $i+=1){
							$class="";
							if($debug){ $class = "twoGamepads";}
							else{
								if     ($PHP_VARS['numGamepads']==1){ $class="oneGamepad"; }
								else if($PHP_VARS['numGamepads']==2){ $class="twoGamepads"; }
							}

							echo "<div class='".$class." gamepad gamepad_snes noSelect2' pad='".($i+1)."'>";
							require "gamepadconfigs/gamepad_snes.svg";
							echo "</div>";
							// echo "<br>";

							// Output the keyboard keys.
							//
						}
					}
					else{
						// No gamepads?
						echo "\n" . '<!-- NO GAMEPADS ???-->' . "\n";
					}
				}
			?>
		</div>

		<?php
			if($PHP_VARS['CANLOADGAME'] && $debug){
				echo "\n";
				if( file_exists ($path . '/DEBUG/debug.php') && $debug) {
					require $path . '/DEBUG/debug.php';
					echo "\n";
				}
			}
		?>
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
			<br>

			<button class="hiddenOpacityButtons" id="O_0_150" onclick='opacityAdjust(0.150, this);'>O :: 0.150</button><br>
			<button class="hiddenOpacityButtons" id="O_0_200" onclick='opacityAdjust(0.200, this);'>O :: 0.200</button><br>
			<button class="hiddenOpacityButtons" id="O_0_250" onclick='opacityAdjust(0.250, this);'>O :: 0.250</button><br>
			<button class="hiddenOpacityButtons" id="O_0_500" onclick='opacityAdjust(0.500, this);'>O :: 0.500</button><br>
			<button class="hiddenOpacityButtons" id="O_0_750" onclick='opacityAdjust(0.750, this);'>O :: 0.750</button><br>
			<br>

			<button class="hiddenOpacityButtons" id="O_1_000" onclick='opacityAdjust(1.000, this);'>O :: 1.000</button><br>
		</div>

		<script>
			function opacityAdjust(opacity, elem){
				document.getElementById("siteContainerDiv").style="opacity:"+opacity;
				// document.getElementById("DEBUG_DIV")       .style="opacity:"+opacity;
				document.getElementById("sideDiv")         .style="opacity:"+opacity;

				let buttons = document.querySelectorAll(".hiddenOpacityButtons");
				buttons.forEach(function(d){
					d.classList.remove("active");
				});
				elem.classList.add("active");
			}
			opacityAdjust(0.000, document.getElementById("O_0_000"));
			// opacityAdjust(0.025, document.getElementById("O_0_025"));
		</script>

		<?php
		}
	?>

</body>

</html>