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
else{ exit( $stats ); }

function API_REQUEST( $api, $type ){
	$stats = array(
		'error'      => false ,
		'error_text' => ""    ,
	);

	// Rights.
	$public      = 1 ; // No rights required.

	$o_values=array();

	// APIs
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

	$filelistonly   = $_GET["filelistonly"] == 1 ? true : false ;

	$get_jsgame     = $_GET["jsgame"]       == 1 ? true : false ;
	$get_video      = $_GET["video"]        == 1 ? true : false ;
	$get_audio      = $_GET["audio"]        == 1 ? true : false ;
	$get_gamejs     = $_GET["gamejs"]       == 1 ? true : false ;

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
	if(!sizeof($filelist)){ exit(); }

	// Combine the files.
	for($i=0; $i<sizeof($filelist); $i+=1){
		$file = $filelist[$i];

		if (strpos($file, '..') !== false) { exit( "NOT ALLOWED!" ); }

		$output .= file_get_contents($file) . "\n\n\n" ;
	}

	if($filelistonly){ echo json_encode($filelist); }
	else             { echo $output;                }
}

?>