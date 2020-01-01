<?php
// This is the only place this flag is set. It is checked everywhere else insuring that all processes start here.
$securityLoadedFrom_indexp = true;

// Configure error reporting
$appName='JSGAME';
error_reporting(E_ALL & ~E_NOTICE & ~E_STRICT);
ini_set('error_log', getcwd() . '/'.$appName.'-error.txt');
ini_set("log_errors", 1);
ini_set("display_errors", 1);
ini_set('register_argc_argv', 1);
set_time_limit(60);

// Configure timezone.
define('TIMEZONE', 'America/Detroit');
date_default_timezone_set(TIMEZONE);

chdir(__DIR__);
$_appdir        = getcwd().''              ;

$devServer=false;
if      ( strpos($_SERVER['SERVER_NAME'], "dev2.nicksen782.net" ) !== false ) { $devServer=true; }

// Was a request received? Process it.
if     ( $_POST['o'] ){ API_REQUEST( $_POST['o'], 'post' ); }
else if( $_GET ['o'] ){ API_REQUEST( $_GET ['o'], 'get'  ); }
// else{ exit( $stats ); }
else{ }

function API_REQUEST( $api, $type ){
	$stats = array(
		'error'      => false ,
		'error_text' => ""    ,
	);

	// Rights.
	$public      = 1 ; // No rights required.

	$o_values=array();

	// APIs
	$o_values["init"]              = [ "p"=>( ( $public ) ? 1 : 0 ), 'get'=>1, 'post'=>0, 'cmd'=>0,] ;
	$o_values["combineFiles"]      = [ "p"=>( ( $public ) ? 1 : 0 ), 'get'=>1, 'post'=>0, 'cmd'=>0,] ;

	// DETERMINE IF THE API IS AVAILABLE TO THE USER.

	// Is this a known API?
	if( ! isset( $o_values[ $api] ) ){
		$stats['error']=true;
		$stats['error_text']="Unhandled API";
	}

	// Is the API allowed to be called this way?
	else if( ! $o_values[ $api ][ $type ] ){
		$stats['error']=true;
		$stats['error_text']="Invalid access type";
	}

	// Does the user have sufficient permissions?
	else if( ! $o_values[ $api ]['p'] ){
		$stats['error']=true;
		$stats['error_text']="API auth error";
	}

	// Can the function be run?
	if(! $stats['error']){
		// GOOD! Allow the API call.
		call_user_func_array( $api, array() );
	}

	// Was there an error?
	else{
		echo json_encode( $stats );
		exit();
	}

}

function combineFiles(){
	global $_appdir;
	$output="";
	$filelist=[];

	$game           = $_GET["game"]              ? $_GET["game"] : ""    ;
	$filelistonly   = $_GET["filelistonly"] == 1 ? true          : false ;
	$get_jsgame     = $_GET["jsgame"]       == 1 ? true          : false ;
	$get_video      = $_GET["video"]        == 1 ? true          : false ;
	$get_audio      = $_GET["audio"]        == 1 ? true          : false ;
	$get_gamejs     = $_GET["gamejs"]       == 1 ? true          : false ;

	// $get_debug_js   = $_GET["debug_js"]     == 1 ? true : false ;
	// $get_midi_bin   = $_GET["midi_bin"]     == 1 ? true : false ;
	// $get_graphics   = $_GET["graphics"]     == 1 ? true : false ;
	// $get_mp3        = $_GET["mp3"]          == 1 ? true : false ;

	// Add JSGAME core files.
	if($get_jsgame){
		array_push($filelist, $_appdir . "/cores/JSGAME_core/FLAGS.js"   );
		array_push($filelist, $_appdir . "/cores/JSGAME_core/SHARED.js"  );
		array_push($filelist, $_appdir . "/cores/JSGAME_core/DOM.js"     );
		array_push($filelist, $_appdir . "/cores/JSGAME_core/INIT.js"    );
		array_push($filelist, $_appdir . "/cores/JSGAME_core/GUI.js"     );
		array_push($filelist, $_appdir . "/cores/JSGAME_core/GAMEPADS.js");
	}

	// If a game was not specified then don't try to load game files.
	if($_GET["game"]){
		// Get gamelist.json.
		$gamelist  = json_decode(file_get_contents("gamelist.json"), true)['games'];
		$gamekey   = array_search($_GET["game"], array_column($gamelist, 'header_gameChoice'));
		$gamedir   = realpath($gamelist[$gamekey]['gamedir']);

		// Get gamesettings.json.
		$gamesettings = json_decode(file_get_contents($gamedir."/gamesettings.json"), true);

		// Add video core.
		if($get_video){
			$file = realpath( $_appdir . "/" . $gamesettings["videokernel"] );
			if($file !== false){ array_push($filelist, $file); }
		}

		// Add sound core.
		if($get_audio){
			$file = realpath( $_appdir . "/" . $gamesettings["soundkernel"] );
			if($file !== false){ array_push($filelist, $file); }
		}

		// Add game js files.
		if($get_gamejs){
			for($i=0; $i<sizeof($gamesettings["js_files"]); $i+=1){
				$file = realpath( $gamedir . "/" . $gamesettings["js_files"][$i] );
				if($file !== false){ array_push($filelist, $file); }
			}
		}

		// ?? debug js
		// ?? midi_bin
		// ?? graphics_files
		// ?? mp3_files
		// ?? onscreen gamepads
	}

	// Make sure there are files.
	if(!sizeof($filelist)){ return ""; }

	// Combine the files.
	for($i=0; $i<sizeof($filelist); $i+=1){
		$file = $filelist[$i];

		if (strpos($file, '..') !== false) { exit( "NOT ALLOWED!" ); }

		$output .= file_get_contents($file) . "\n\n\n" ;
	}

	if($filelistonly){ echo json_encode($filelist); }
	else             { echo $output;                }
}

function init(){
	global $_appdir;

	$qs = json_decode($_GET['qs'],true);
	if(isset($qs['cf_overrides'])){
		$qs['cf_overrides'] = json_decode($qs['cf_overrides'], true);
	}

	foreach($qs as $k => $v){
		// echo $k . " " . $qs[$k] . " ";
		$qs[$k] = correctDataTypes($qs[$k]);
		// echo " \n";
	}

	$devServer=false;
	if      ( strpos($_SERVER['SERVER_NAME'], "dev2.nicksen782.net" ) !== false ) { $devServer=true; }

	if($qs['debug']==true){ $debug=true;  }
	else                    { $debug=false; }

	if($debug && isset($qs["cf_overrides"])){
		$cf_overrides = $qs["cf_overrides"];

		// cf_overrides were not specified or it was invalid JSON.
		if(!$cf_overrides){
			$cf_overrides['jsg']   = 0;
			$cf_overrides['v']     = 0;
			$cf_overrides['a']     = 0;
			$cf_overrides['gjs']   = 0;
			$cf_overrides['debug'] = 0;
			$debug_cf_override=false;
		}
		// Was specified. Normalize the values.
		else{
			$cf_overrides['jsg']   == 1 ? 1 : 0;
			$cf_overrides['v']     == 1 ? 1 : 0;
			$cf_overrides['a']     == 1 ? 1 : 0;
			$cf_overrides['gjs']   == 1 ? 1 : 0;
			$cf_overrides['debug'] == 1 ? 1 : 0;
			$debug_cf_override=true;
		}
	}
	else{
		$cf_overrides = [
			'jsg'   => 0 ,
			'v'     => 0 ,
			'a'     => 0 ,
			'gjs'   => 0 ,
			'debug' => 0 ,
		];
		$debug_cf_override=false;
	}

	// Gamepads are off by default.
	if( isset($qs['gamepads']) ){ $gamepads = $qs['gamepads']==true ? true : false;  }
	else                        { $gamepads=false; }

	$outputText = "";
	$outputText_errors = "";

	$outputText .= "// ******************************************** \n";
	$outputText .= "// -------------------------------------------- \n";
	$outputText .= "\n";

	// These values will be determined here and later copied to JavaScript.
	$PHP_VARS["gamelist_json"]     = null  ; // Was gamelist.json found?
	$PHP_VARS["gamesettings_json"] = null  ; // Was gamesettings.json found?
	$PHP_VARS["gameSelected"]      = null  ; // Was a game selected?
	$PHP_VARS["typeGamepads"]      = null  ; //
	$PHP_VARS["numGamepads"]       = null  ; //
	$PHP_VARS["fps"]               = null  ; //
	$PHP_VARS["videokernel"]       = null  ; //
	$PHP_VARS["queryString"]       = $qs ; //
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

	// NEEDED FOR PRESETUP.js
	$PHP_VARS['debug_cf_override']  = $debug_cf_override ;
	$PHP_VARS['cf_overrides']       = $cf_overrides ;
	if($PHP_VARS['cf_overrides']['jsg']==0){
		$_GET["game"]         = "";
		$_GET["filelistonly"] = 1 ;
		$_GET["jsgame"]       = 1 ;
		$_GET["video"]        = 0 ;
		$_GET["audio"]        = 0 ;
		$_GET["gamejs"]       = 0 ;

		ob_start();
		$combined = combineFiles();
		$combined = ob_get_contents();
		ob_end_clean();

		$combined = json_decode($combined,true);
		for($i=0; $i<sizeof($combined); $i+=1){
			$combined[$i] = str_replace($_appdir."/", "", $combined[$i]);
		}

		$PHP_VARS['jsgamefiles'] = $combined ;
	}
	$PHP_VARS['gamename'] = $qs['game'];

	// Was the $gamelistjson_file file found AND was a game selected?
	// If so, start loading the assets for the game.
	if( $PHP_VARS['gamelist_json'] && ($qs['game']) ){
		// Get game dir.
		$gamekey   = array_search($qs["game"], array_column($games, 'header_gameChoice'));
		$thisgame = $games[$gamekey];
		$gamedir   = realpath($games[$gamekey]['gamedir']);
		$relative_gamedir   = $games[$gamekey]['gamedir'];

		// Get gamesettings.json.
		$gamesettings = json_decode(file_get_contents($gamedir."/gamesettings.json"), true);

		// With the gamesettings we should be able to get the path to the game.

		// gamesettings.json
		if( file_exists ($gamedir . '/gamesettings.json') ) {
			$PHP_VARS['gamesettings_json'] = true ;
			$PHP_VARS['gameSelected']      = true ;

			$gamesettings = json_decode(file_get_contents($gamedir."/gamesettings.json"), true);

			// Fix the path for gamesettings.
			//

			// Gamepads:
			$PHP_VARS['typeGamepads'] = $gamesettings["typeGamepads"] ; // : "nes",
			$PHP_VARS['numGamepads']  = $gamesettings["numGamepads"]  ; // : 1,

			// FPS:
			$PHP_VARS['fps']          = $gamesettings["fps"]          ; // : 30,

			// Video kernel:
			$PHP_VARS['videokernel']  = $gamesettings["videokernel"]  ; // : "",

			// Fonts:
			$PHP_VARS['fonts']        = $gamesettings["fonts"]  ; // : "",

			// Sounds/Music?
			$PHP_VARS['soundkernel']  = $gamesettings["soundkernel"]  ; // : "",

			// MP3
			$PHP_VARS['mp3_files']    = [] ;
			if( $gamesettings["mp3_files"] ) { $PHP_VARS['mp3_files'] = $gamesettings["mp3_files"]; }

			// MIDI
			$PHP_VARS['midi_bin']     = [] ;
			if( $gamesettings["midi_bin"] ) { $PHP_VARS['midi_bin'] = $gamesettings["midi_bin"]; }

			// MIDI
			$PHP_VARS['midi_synths']  = [] ;
			if( $gamesettings["midi_synths"] ) { $PHP_VARS['midi_synths'] = $gamesettings["midi_synths"]; }

			// Graphics assets.
			$PHP_VARS['graphics_conversionSettings'] = $gamesettings["graphics_conversionSettings"];

			// Links:
			$PHP_VARS['links'] = $gamesettings["links"];

			// Canvas scale factor
			$PHP_VARS['canvas_scaleFactor'] = $gamesettings["canvas_scaleFactor"];

			// JavaScript files for the game:
			$PHP_VARS['js_files'] = $gamesettings["js_files"];

			// Start-up logo (on by default.)
			if( isSet($gamesettings["INTRO_LOGO"]) )         { $PHP_VARS['INTRO_LOGO'] = $gamesettings["INTRO_LOGO"]; }
			else                                             { $PHP_VARS['INTRO_LOGO'] = 1 ;                          }
			// Start-up logo: Get the files from PHP as base64.
			switch( $PHP_VARS['INTRO_LOGO'] ){
				case    0 : { $img_filename = '';                                                             break; }
				case    1 : { $img_filename = 'img/jsgamelogo1.png'; $PHP_VARS['INTRO_LOGO_STRETCH'] = true;  break; }
				case    2 : { $img_filename = 'img/jsgamelogo1.png'; $PHP_VARS['INTRO_LOGO_STRETCH'] = false; break; }
				default   : { $img_filename = 'img/jsgamelogo1.png'; $PHP_VARS['INTRO_LOGO_STRETCH'] = true;  break; }
			};
			if($img_filename){
				$image        = file_get_contents($img_filename);
				$imageData    = base64_encode($image);
				$src          = 'data:'.mime_content_type($img_filename).';base64,'.$imageData;
				$PHP_VARS['INTRO_LOGO_IMGB64'] = $src;
			}

			$PHP_VARS['gamedir']            = $gamedir ;
			$PHP_VARS['relative_gamedir']   = $relative_gamedir ;

			$PHP_VARS['debug']    = $debug    ? true : false ;
			$PHP_VARS['gamepads'] = $gamepads ? true : false ;

			// Output as JavaScript variable.
			$outputText .= "JSGAME.PRELOAD.gamesettings_json = " . json_encode($gamesettings, JSON_PRETTY_PRINT) . ";" ;
			$outputText .= "\n";
			$outputText .= "\n";
			$outputText .= "\nJSGAME.PRELOAD.gameselected_json = " . json_encode($thisgame, JSON_PRETTY_PRINT) . "; \n\n";

			// Set the game can load flag.
			$PHP_VARS['CANLOADGAME']  = true;
		}
		else                                    {
			echo "console.log('gamedir:', '".$gamedir."' );" . "\n";
			echo "// no gamesettings.json " . "\n";
		}
	}
	else{
		$outputText_errors .= 'GAME HAS NOT BEEN SELECTED' . "\n";
	}

	foreach($PHP_VARS as $k => $v){
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
			// Make sure that specifically true or false values are not written as 1 or zero.
			if     ($PHP_VARS[$k]===true) { $outputText .= "JSGAME.PRELOAD.PHP_VARS['$k'] = true  ; "; }
			else if($PHP_VARS[$k]===false){ $outputText .= "JSGAME.PRELOAD.PHP_VARS['$k'] = false ; "; }
			// Other values.
			else                          { $outputText .= "JSGAME.PRELOAD.PHP_VARS['$k'] = " . $PHP_VARS[$k] . ";"; }
			$outputText .= "\n";
		}
	}

	// END: Output the PHP vars as JavaScript vars.
	$outputText .= "\n";
	$outputText .= "// ******************************************** \n";
	$outputText .= "// -------------------------------------------- \n";
	$outputText .= "\n";
	$outputText .= "\n";

	// File loading
	// **************************************
	// **************************************
	// **************************************
	// THE PROBLEM IS THAT THE PHP VARIABLES ARE NOT AVAILABLE TO INDEX.PHP.
	// SOLVE THAT PROBLEM AND YOU ARE NEARLY DONE!
	// **************************************
	// **************************************
	// **************************************

	// If the game can be loaded...
	if($PHP_VARS['CANLOADGAME']){
		// Download all files combined.
		if(!$debug){
			$_GET["game"]         = $qs['game'];
			$_GET["filelistonly"] = 0;
			$_GET["jsgame"] = 1 ;
			$_GET["video"]  = 1 ;
			$_GET["audio"]  = 1 ;
			$_GET["gamejs"] = 1 ;
			$combined = combineFiles();
			$outputText .= $combined;
		}
		// If debug and debug_cf_override is set then download some files individually and/or some combined.
		else if($debug && $debug_cf_override){
			$_GET["game"]         = $qs['game'];
			$_GET["filelistonly"] = 0;
			$_GET["jsgame"] = $qs['jsgame'] ;
			$_GET["video"]  = $qs['video']  ;
			$_GET["audio"]  = $qs['audio']  ;
			$_GET["gamejs"] = $qs['gamejs'] ;
			$combined = combineFiles();
			$outputText .= $combined;
		}
		// If just debug then all files should be downloaded individually via JS.
		else {
		}
	}
	// If a game has not been specified...
	else{
		$_GET["game"]         = "";
		$_GET["filelistonly"] = 0;
		$_GET["jsgame"]       = 1 ;
		$_GET["video"]        = 0 ;
		$_GET["audio"]        = 0 ;
		$_GET["gamejs"]       = 0 ;
		$combined = combineFiles();
		$outputText .= $combined;
	}

	// Output the $outputText.
	echo "\n";
	echo trim($outputText);
	echo "\n";

	// Include the PRESETUP.JS
	echo file_get_contents("cores/JSGAME_core/PRESETUP.js");

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
}

function correctDataTypes($data){
	$output;
	$type;

	// Make sure that specifically true or false values are not written as 1 or zero.
	if     ( $data   == "false"   ) { $type = "(false) "     ; $output = false     ; }
	else if( $data   == "true"    ) { $type = "(true) "      ; $output = true      ; }
	else if( is_numeric($data   ) ) { $type = "(is_numeric) "; $output = 0 + $data ; }
	else if( is_string ($data   ) ) { $type = "(is_string) " ; $output = $data     ; }
	else if( is_array  ($data   ) ) { $type = "(is_array) "  ; $output = $data     ; }
	else if( is_null   ($data   ) ) { $type = "(is_null) "   ; $output = null      ; }
	else                            { $type = "(other) "     ; $output = $data     ; }

	// echo $type . " " . $data . " " . $output . "\n";
	return $output;
}

?>