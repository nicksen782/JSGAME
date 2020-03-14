<?php
// This is the only place this flag is set. It is checked within every included file. Ensuring that all processes start here.
$securityLoadedFrom_indexp = true;

// Change to the directory this script is in.
chdir(__DIR__);

// Set the app dir.
$_appdir = getcwd() ;

// Set the games dir.
$_gamesdir = realpath($_appdir . "/../JS_GAMES");

// Determine if this server is the dev server.
$devServer=false;
if( strpos($_SERVER['SERVER_NAME'], "dev2.nicksen782.net" ) !== false ) { $devServer=true; }

// Configure PHP settings.
$appName='JSGAME';
error_reporting(E_ALL & ~E_NOTICE & ~E_STRICT);
ini_set('error_log', getcwd() . '/'.$appName.'-error.txt');
ini_set("log_errors", 1);
ini_set("display_errors", 1);
ini_set('register_argc_argv', 1);
setlocale(LC_ALL,'en_US.UTF-8');
set_time_limit(60);
define('TIMEZONE', 'America/Detroit');
date_default_timezone_set(TIMEZONE);

// Was a request received? Process it.
if     ( isset($_POST['o']) ){ API_REQUEST( $_POST['o'], 'post' ); }
else if( isset($_GET ['o']) ){ API_REQUEST( $_GET ['o'], 'get'  ); }
else{ }

// Handles calls to this script.
function API_REQUEST( $api, $type ){
	$stats = array(
		'error'      => false ,
		'error_text' => ""    ,
	);

	// Rights.
	$public   = 1  ; // No rights required.

	$o_values = [] ;

	// APIs
	$o_values["init"]         = [ "p"=>( ( $public ) ? true : false ), 'get'=>1, 'post'=>1, 'cmd'=>0 ] ;
	$o_values["gzip_getFile"] = [ "p"=>( ( $public ) ? true : false ), 'get'=>1, 'post'=>1, 'cmd'=>0 ] ;
	$o_values["init2"]        = [ "p"=>( ( $public ) ? true : false ), 'get'=>1, 'post'=>1, 'cmd'=>0 ] ;

	// DETERMINE IF THE API IS AVAILABLE TO THE USER.

	// Is this a known API?
	if( ! isset( $o_values[ $api ] ) ){
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

// Can return a file list or file data based on the keys provided.
function combineFiles_typeByKey($keys){
	global $_appdir;

	$output=[
		"js"    => "" ,
		"css"   => "" ,
		"php"   => "" ,
		"html"  => "" ,
	];

	$filesByExt=[
		"js"   => [] ,
		"css"  => [] ,
		"php"  => [] ,
		"html" => [] ,
	];

	$filesToGet=[
	];

	$game         = $keys["game"]         ? $keys["game"] : "" ;
	$filelistonly = $keys["filelistonly"] ? 1             : 0  ;
	$get_jsgame   = $keys["jsgame"]       ? 1             : 0  ;
	$get_video    = $keys["video"]        ? 1             : 0  ;
	$get_audio    = $keys["audio"]        ? 1             : 0  ;
	$get_gamejs   = $keys["gamejs"]       ? 1             : 0  ;
	$get_debug    = $keys["debug"]        ? 1             : 0  ;

	// Add JSGAME core files.
	if($get_jsgame){
		// array_push($filesToGet, $_appdir . "/cores/JSGAME_core/PRESETUP.js"   );
		array_push($filesToGet, $_appdir . "/cores/JSGAME_core/FLAGS.js"   );
		array_push($filesToGet, $_appdir . "/cores/JSGAME_core/SHARED.js"  );
		array_push($filesToGet, $_appdir . "/cores/JSGAME_core/DOM.js"     );
		array_push($filesToGet, $_appdir . "/cores/JSGAME_core/INIT.js"    );
		array_push($filesToGet, $_appdir . "/cores/JSGAME_core/GUI.js"     );
		array_push($filesToGet, $_appdir . "/cores/JSGAME_core/GAMEPADS.js");
	}

	// If a game was specified then try to load game files.
	if($game){
		// Get gamelist.json.
		$gamelist = json_decode(file_get_contents("gamelist.json"), true)['games'];
		$gamekey  = array_search($game, array_column($gamelist, 'header_gameChoice'));
		$gamedir  = realpath($gamelist[$gamekey]['gamedir']);

		// Get gamesettings.json.
		$gamesettings = json_decode(file_get_contents($gamedir."/gamesettings.json"), true);

		// Add video core.
		if($get_video){
			if(isset($gamesettings["videokernel"])){
				$file = realpath( $_appdir . "/" . $gamesettings["videokernel"] );
				if($file !== false){ array_push($filesToGet, $file); }
				// else { exit("file not found: " . $file); }
			}
		}

		// Add sound core.
		if($get_audio){
			if(isset($gamesettings["soundkernel"])){
				$file = realpath( $_appdir . "/" . $gamesettings["soundkernel"] );
				if($file !== false){ array_push($filesToGet, $file); }
				// else { exit("file not found: " . $file); }
			}
		}

		// Add game js files.
		if($get_gamejs){
			if(isset($gamesettings["js_files"])){
				for($i=0; $i<sizeof($gamesettings["js_files"]); $i+=1){
					$file = realpath( $gamedir . "/" . $gamesettings["js_files"][$i] );
					if($file !== false){ array_push($filesToGet, $file); }
					// else { exit("file not found: " . $file); }
				}
			}
		}

		// Maybe later?
		// midi_bin
		// graphics_files
		// mp3_files

		// Add the debug files (do not use yet.)
		// if($get_debug){
		// 	if(isset($gamesettings["debug_files"])){
		// 		for($i=0; $i<sizeof($gamesettings["debug_files"]); $i+=1){
		// 			$file = realpath( $gamedir . "/" . $gamesettings["debug_files"][$i] );
		// 			if($file !== false){ array_push($filesToGet, $file); }
		// 			// else { exit("file not found: " . $file); }
		// 		}
		// 	}
		// }

	}

	// Make sure there are files.
	if(!sizeof($filesToGet)){ return ""; }

	// Combine the files.
	for($i=0; $i<sizeof($filesToGet); $i+=1){
		// Get this file.
		$file = $filesToGet[$i];

		// Block invalid paths.
		if (strpos($file, '..') !== false) { exit( "NOT ALLOWED!" ); }

		// Get the extension.
		$ext = pathinfo($file, PATHINFO_EXTENSION);

		// Add the file to $filesByExt[$ext].
		if($filelistonly){
			// Create the extension key if it does not exist.
			if( ! isset($filesByExt[$ext]) ){ $filesByExt[$ext] = []; }
			array_push($filesByExt[$ext], $file);
		}

		// Add the data to $output[$ext] key.
		else{
			// Create the extension key if it does not exist.
			if( ! isset($output[$ext])     ){ $output[$ext] = ""; }
			$output[$ext] .= file_get_contents($file) . "\n\n\n" ;
		}
	}

	// Return the data.
	if($filelistonly){ return $filesByExt; }
	else             { return $output;     }
}

function getLastUpdate($path){
	global $_appdir;

	$skipThese = "" .
	"-not -name '*.min.js*' " .
	"-not -path '*/test.php' "          .
	"-not -path '*/\.git*'    "         .
	"-not -path '*/\docs**'   "         .
	"";

	$latestVersion = trim( shell_exec(" find " . $path . " -type f ".$skipThese." -printf '%CY-%Cm-%Cd %CH:%CM:00 (%CZ) %p\n'| sort -n | tail -n1 ") );
	// 2020-02-28 19:21:00 (EST) ./index_p.php

	$data = explode(" ", $latestVersion);
	$date     = trim( $data[0] ) ;
	$time     = trim( $data[1] ) ;
	$tz       = trim( $data[2] ) ;
	$file     = trim( $data[3] ) ;
	$datetime = ($date . " " . $time) ;
	$today      = date_create( date("Y-m-d H:i:s") );
	$lastUpdate = date_create( date("Y-m-d H:i:s", strtotime( $datetime )) );

	$file_lastUpdate      = $date . " " . $time . " " . $tz;
	$file_lastUpdate_name = $file ;

	$age=date_diff($today, $lastUpdate);
	$age =
		( ($age->y !=0) ? ($age->y . " Years, "  ) : "") .
		( ($age->m !=0) ? ($age->m . " Months, " ) : "") .
		( ($age->d !=0) ? ($age->d . " Days, "   ) : "") .
		( ($age->h !=0) ? ($age->h . " Hours, "  ) : "") .
		( ($age->i !=0) ? ($age->i . " Minutes, ") : "") .
		( ($age->s !=0) ? ($age->s . " Seconds"  ) : "")
	;

	//
	return [
		"file_lastUpdate"      => trim($file_lastUpdate)                             ,
		"file_lastUpdate_name" => trim(str_replace($path, ".", $file_lastUpdate_name) ) ,
		// "file_lastUpdate_name" => trim($file_lastUpdate_name) ,
		"age"                  => trim($age)                             ,
	];
};


// Utility to correct data types (used by: init).
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

// Retrieves a file. Allows for optional gzip compression.
function gzip_getFile(){
	global $_appdir;
	global $_gamesdir;

	// Get the specified filename (can include a path with the path is within JSGAME.)
	$file = "";
	if     ( isset($_GET ['filename']) ){ $file = $_GET ['filename']; }
	else if( isset($_POST['filename']) ){ $file = $_POST['filename']; }
	else{}

	// Was a file specified?
	if( $file == "" ){ exit ( "NO FILE SPECIFIED." ); }

	// Get the full server path to the file.
	$realpath = realpath($file);

	// Stop the request if there are ".." in the path. (security)
	if (strpos($file, '..') !== false) {
		// However, allow it if it is within JS_GAME or JS_GAMES
		if(
			strpos($realpath, $_appdir) === false
			&&
			strpos($realpath, $_gamesdir) === false
		){
			exit( "PATH IS NOT ALLOWED!");
			// exit( "PATH IS NOT ALLOWED!" .
				// "\nfile     : " . $file .
				// "\nrealpath : " . $realpath .
				// "\n_appdir  : " . $_appdir .
				// "\n_gamesdir: " . $_gamesdir
			// );
		}
	}

	// Check if the file exists.
	if( $realpath === false || !file_exists($realpath) ) {
		exit("FILE NOT AVAILABLE!");
	}

	// Compress and then send the data.
	if (function_exists('gzencode')) {
		// Set the headers.
		header('Content-Encoding: gzip');
		// header("Content-type: plain/text");
		echo gzencode( file_get_contents( $realpath ) ) ;
	}
	// Or just send the data.
	else{
		echo ( file_get_contents( $realpath  ) ) ;
	}
}

function getLastUpdate2($path, $file, $skip){
	global $_appdir;

	$oldFile = $file;

	$skipThese = "" .
	"-not -name 'combined.min.js.map' " .
	"-not -path '*/test.php' "          .
	"-not -path '*/\.git*'   "          .
	"-not -path '*/\docs**'  "          .
	"";

	if($skip){ $skip = "-not -path '*/".$skip."'"; }

	$cmd = " find " . ($path . $file)            . " -type f ".$skipThese." ".$skip." -printf '%CY-%Cm-%Cd %CH:%CM:00 (%CZ) %p\n'| sort -n | tail -n1 ";

	$latestVersion = trim( shell_exec($cmd) );

	$data       = explode(" ", $latestVersion);
	$date       = trim( $data[0] ) ;
	$time       = trim( $data[1] ) ;
	$tz         = trim( $data[2] ) ;
	$file       = trim( $data[3] ) ;
	$datetime   = ($date . " " . $time) ;
	$today      = date_create( date("Y-m-d H:i:s") );
	$lastUpdate = date_create( date("Y-m-d H:i:s", strtotime( $datetime )) );
	$file_lastUpdate      = $date . " " . $time . " " . $tz;
	$file_lastUpdate_name = $file ;

	$age=date_diff($today, $lastUpdate);
	$age =
		( ($age->y !=0) ? ($age->y . " Years, "  ) : "") .
		( ($age->m !=0) ? ($age->m . " Months, " ) : "") .
		( ($age->d !=0) ? ($age->d . " Days, "   ) : "") .
		( ($age->h !=0) ? ($age->h . " Hours, "  ) : "") .
		( ($age->i !=0) ? ($age->i . " Minutes, ") : "") .
		( ($age->s !=0) ? ($age->s . " Seconds"  ) : "")
	;

	//
	return [
		"file_lastUpdate_unix" => strtotime(trim($file_lastUpdate))       ,
		"file_lastUpdate"      => trim($file_lastUpdate)                  ,
		"file_lastUpdate_name" => basename( trim($file_lastUpdate_name) ) ,
		"age"                  => trim($age)                              ,
	];
};
function minifiy_files($files, $newFile, $newBasepath){
	// Minifies the specified files. Stores the results in a "min" directory.

	global $_appdir;

	//
	$oldmask = umask(0);

	// Start the command.
	$cmd = " terser " . " " ;

	// Add the files to the command.
	foreach($files as $k => $v){ $cmd .= ( $newBasepath . basename($files[$k]) ) . " "; }

	// Finish the command (adding in the output file value.)
	$referer       = explode("?", $_SERVER['HTTP_REFERER'])[0];
	$sourcemapRoot = $referer ;
	$sourcemapUrl  = $referer . ( $newBasepath . "min/" . basename($newFile) ) . ".map";
	$output        = ( $newBasepath . "min/" . basename($newFile) ) ;

	$cmd .= ""       .
	"  -c "          .
	"  --verbose "   .
	"  -m "          .
	" --source-map \"root='".$sourcemapRoot."',url='".$sourcemapUrl."'\" " .
	"  -o "          . $output ;

	// Run the command.
	shell_exec($cmd);

	$js_output  = realpath($output);
	$map_output = realpath($output) . ".map";

	if( ! @chmod( $js_output , 0666) ){
		echo 'js_output   : ' . $js_output  . "\n";
		echo 'map_output  : ' . $map_output . "\n";
		echo 'cmd         : ' . $cmd . "\n";
		echo "files       : "; print_r($files); echo "\n";
		echo "newFile     : " . $newFile     . "\n";
		echo "newBasepath : " . $newBasepath . "\n";
		exit();
	}
	if( ! @chmod( $map_output, 0666) ){
		echo 'js_output   : ' . $js_output  . "\n";
		echo 'map_output  : ' . $map_output . "\n";
		echo 'cmd         : ' . $cmd . "\n";
		echo "files       : "; print_r($files); echo "\n";
		echo "newFile     : " . $newFile     . "\n";
		echo "newBasepath : " . $newBasepath . "\n";
		exit();
	}

	umask($oldmask);
}
function preFlightCheck2( $input=[] ){
	// Updates the minified versions of files as needed.
	// Also returns the filenames of each minified file.

	global $_appdir;

	$alwaysReMinify=false;
	// $alwaysReMinify=true;

	$output=[];

	// If an input array was specified then use it. Otherwise, use the built-in input array.
	if( ! (is_array($input) && count($input)) ){
		$input = [
			// JSGAME CORE FILES
			"PRESETUP.js"    => [ "web_srcPath"=>"cores/JSGAME_core/", "server_srcPath"=>($_appdir . "/cores/JSGAME_core/"), "minFile"=>"PRESETUP.min.js"   , "orgFile"=>"PRESETUP.js"    ] ,
			"PRE_INIT.js"    => [ "web_srcPath"=>"cores/JSGAME_core/", "server_srcPath"=>($_appdir . "/cores/JSGAME_core/"), "minFile"=>"PRE_INIT.min.js"   , "orgFile"=>"PRE_INIT.js"    ] ,
			"INIT.js"        => [ "web_srcPath"=>"cores/JSGAME_core/", "server_srcPath"=>($_appdir . "/cores/JSGAME_core/"), "minFile"=>"INIT.min.js"       , "orgFile"=>"INIT.js"        ] ,
			"DOM.js"         => [ "web_srcPath"=>"cores/JSGAME_core/", "server_srcPath"=>($_appdir . "/cores/JSGAME_core/"), "minFile"=>"DOM.min.js"        , "orgFile"=>"DOM.js"         ] ,
			"FLAGS.js"       => [ "web_srcPath"=>"cores/JSGAME_core/", "server_srcPath"=>($_appdir . "/cores/JSGAME_core/"), "minFile"=>"FLAGS.min.js"      , "orgFile"=>"FLAGS.js"       ] ,
			"GAMEPADS.js"    => [ "web_srcPath"=>"cores/JSGAME_core/", "server_srcPath"=>($_appdir . "/cores/JSGAME_core/"), "minFile"=>"GAMEPADS.min.js"   , "orgFile"=>"GAMEPADS.js"    ] ,
			"GUI.js"         => [ "web_srcPath"=>"cores/JSGAME_core/", "server_srcPath"=>($_appdir . "/cores/JSGAME_core/"), "minFile"=>"GUI.min.js"        , "orgFile"=>"GUI.js"         ] ,
			"SHARED.js"      => [ "web_srcPath"=>"cores/JSGAME_core/", "server_srcPath"=>($_appdir . "/cores/JSGAME_core/"), "minFile"=>"SHARED.min.js"     , "orgFile"=>"SHARED.js"      ] ,

			// SOUND A MODE FILES
			"soundMode_A.js" => [ "web_srcPath"=>"cores/soundMode_A/", "server_srcPath"=>($_appdir . "/cores/soundMode_A/"), "minFile"=>"soundMode_A.min.js", "orgFile"=>"soundMode_A.js" ] ,

			// SOUND B MODE FILES
			"soundMode_B.js" => [ "web_srcPath"=>"cores/soundMode_B/", "server_srcPath"=>($_appdir . "/cores/soundMode_B/"), "minFile"=>"soundMode_B.min.js", "orgFile"=>"soundMode_B.js" ] ,

			// VIDEO A MODE FILES
			"videoMode_A.js" => [ "web_srcPath"=>"cores/videoMode_A/", "server_srcPath"=>($_appdir . "/cores/videoMode_A/"), "minFile"=>"videoMode_A.min.js", "orgFile"=>"videoMode_A.js" ] ,

			// VIDEO B MODE FILES
			"videoMode_B.js" => [ "web_srcPath"=>"cores/videoMode_B/", "server_srcPath"=>($_appdir . "/cores/videoMode_B/"), "minFile"=>"videoMode_B.min.js", "orgFile"=>"videoMode_B.js" ] ,

			// VIDEO C MODE FILES
			"videoMode_C.js" => [ "web_srcPath"=>"cores/videoMode_C/", "server_srcPath"=>($_appdir . "/cores/videoMode_C/"), "minFile"=>"videoMode_C.min.js", "orgFile"=>"videoMode_C.js" ] ,
		];
	}

	$_MINIFICATIONS = [];
	$_FILES         = [];

	$_TOTALMINTIME_time_start = microtime(true);
	foreach($input as $k => $v){
		$rec            = $input[$k]             ;
		$server_srcPath = $rec["server_srcPath"] ;
		$web_srcPath    = $rec["web_srcPath"]    ;
		$orgFile        = $rec["orgFile"]        ;
		$minFile        = $rec["minFile"]        ;

		$data_org = getLastUpdate2( $server_srcPath, $orgFile, false ) ;
		$data_min = getLastUpdate2( $server_srcPath, "/min/" . $minFile, false ) ;

		$lastUpdate_data_org = $data_org['file_lastUpdate_unix'] ;
		$lastUpdate_data_min = $data_min['file_lastUpdate_unix'] ;

		// Is the original file newer than the minified version?
		if( $alwaysReMinify || ($lastUpdate_data_org >= $lastUpdate_data_min) ){
			$arg1 = [$server_srcPath . $orgFile] ; // $files
			$arg2 =  $server_srcPath . $minFile  ; // $newFile
			$arg3 =  $web_srcPath                ; // $newBasepath

			$time_start = microtime(true);
			minifiy_files($arg1, $arg2, $arg3);
			$time_end = microtime(true);
			$time = $time_end - $time_start;

			array_push($_MINIFICATIONS, [
				"orgFile"            => $orgFile  ,
				"minTime"            => $time     ,
				"lastUpdate_data_org"=> $data_org ,
				"lastUpdate_data_min"=> $data_min ,
			]);
		}

		array_push($_FILES, [
			"orgFile"            => $orgFile  ,
			"lastUpdate_data_org"=> $data_org ,
		]);
	}
	$_TOTALMINTIME_time_end = microtime(true);
	$_TOTALMINTIME = $_TOTALMINTIME_time_end - $_TOTALMINTIME_time_start;

	return [
		"jsgameCore"     => [
			'PRESETUP.js' => $input['PRESETUP.js']   ['server_srcPath'] . '/min/' . $input['PRESETUP.js']   ['minFile'] ,
			'PRE_INIT.js' => $input['PRE_INIT.js']   ['server_srcPath'] . '/min/' . $input['PRE_INIT.js']   ['minFile'] ,
			'INIT.js'     => $input['INIT.js']       ['server_srcPath'] . '/min/' . $input['INIT.js']       ['minFile'] ,
			'DOM.js'      => $input['DOM.js']        ['server_srcPath'] . '/min/' . $input['DOM.js']        ['minFile'] ,
			'FLAGS.js'    => $input['FLAGS.js']      ['server_srcPath'] . '/min/' . $input['FLAGS.js']      ['minFile'] ,
			'GAMEPADS.js' => $input['GAMEPADS.js']   ['server_srcPath'] . '/min/' . $input['GAMEPADS.js']   ['minFile'] ,
			'GUI.js'      => $input['GUI.js']        ['server_srcPath'] . '/min/' . $input['GUI.js']        ['minFile'] ,
			'SHARED.js'   => $input['SHARED.js']     ['server_srcPath'] . '/min/' . $input['SHARED.js']     ['minFile'] ,
		],
		"soundMode_A.js"  => $input['soundMode_A.js']['server_srcPath'] . '/min/' . $input['soundMode_A.js']['minFile'] ,
		"soundMode_B.js"  => $input['soundMode_B.js']['server_srcPath'] . '/min/' . $input['soundMode_B.js']['minFile'] ,
		"videoMode_A.js"  => $input['videoMode_A.js']['server_srcPath'] . '/min/' . $input['videoMode_A.js']['minFile'] ,
		"videoMode_B.js"  => $input['videoMode_B.js']['server_srcPath'] . '/min/' . $input['videoMode_B.js']['minFile'] ,
		"videoMode_C.js"  => $input['videoMode_C.js']['server_srcPath'] . '/min/' . $input['videoMode_C.js']['minFile'] ,

		// Debug stuff.
		"_TOTALMINTIME"  => $_TOTALMINTIME  ,
		"_MINIFICATIONS" => $_MINIFICATIONS ,
		"_FILES"         => $_FILES         ,
	];
}

function init2(){
	global $_appdir;

	$combinedFiles_jsgame = preFlightCheck2();

	$output   = [
		// JSGAME core.
		"jsgameCore"        => [] ,

		// Game list.
		"gamelist_json"     => [] ,

		// Game settings.
		"gamesettings_json" => [] ,

		// Selected game (from the game list.)
		"gameselected_json" => [] ,

		// Files specific to the game. (Can also use JSGAME core resources such as video and sound modes.)
		"game_files" => [
			// Game's JavaScript.
			"js_files"      => [] ,

			// Game's Debug files.
			"debug_files"   => [] ,

			// Game's other files.
			"game_files"    => [] ,

			// Selected video mode.
			"videomode"     => [] ,

			// Selected sound mode.
			"soundmode"     => [] ,
		] ,

		"onscreengamepads" => [
			"svg"  => "" ,
			"html" => "" ,
		],

		// Various game settings.
		"PHP_VARS"       => [],

		// Debug stuff.
		"_TOTALMINTIME"  => $combinedFiles_jsgame['_TOTALMINTIME'],
		"_MINIFICATIONS" => $combinedFiles_jsgame['_MINIFICATIONS'],
		"_FILES"         => $combinedFiles_jsgame['_FILES'],
	];

	$PHP_VARS = [];

	// **************
	// gameslist.json
	// **************

	// Is there a gamelist.json file? If not then use the built-in blank one.
	$gamelistjson_file = "gamelist.json";
	if( ! file_exists ($gamelistjson_file) ) {
		// Create the gamelist file from the template.
		$oldmask = umask(0);
		$src     = "template_gamelist.json" ;
		$dest    = "gamelist.json" ;
		copy( $src , $dest ); // Copy the template file into a new file.
		chmod($dest, 0666);   // Make sure that other users can write to it.
		umask($oldmask);
	}
	// Was the gamelist.json file found? Get it and json_decode it.
	if( file_exists ($gamelistjson_file) )   {
		// Set the flag indicating the gamelist.json file was found.
		$PHP_VARS['gamelist_json']=true;

		// Get a handle on the 'games' key in the gamelist.json file.
		$games=json_decode(file_get_contents($gamelistjson_file), true)['games'];

		// Output as JavaScript variable.
		$output['gamelist_json'] = json_encode($games) ;
	}
	// This is likely to be impossible.
	else{
		exit("missing gamelist.json file!");
	}

	// Fix the flags.
	if( isset($_POST['game'])     ){ $game      = correctDataTypes($_POST['game']);      } else { $game      = false ; }
	if( isset($_POST['hidden'])   ){ $hidden    = correctDataTypes($_POST['hidden']);    } else { $hidden    = false ; }
	if( isset($_POST['debug'])    ){ $debug     = correctDataTypes($_POST['debug']);     } else { $debug     = false ; }
	if( isset($_POST['gamepads']) ){ $gamepads  = correctDataTypes($_POST['gamepads']);  } else { $gamepads  = false ; }
	if( isset($_POST['mastervol'])){ $mastervol = correctDataTypes($_POST['mastervol']); } else { $mastervol = 75    ; }

	// Save the flags.
	$PHP_VARS['game']      = $game     ;
	$PHP_VARS['hidden']    = $hidden   ;
	$PHP_VARS['debug']     = $debug    ;
	$PHP_VARS['gamepads']  = $gamepads ;
	$PHP_VARS['mastervol'] = $mastervol;

	$data1 = getLastUpdate($_appdir);
	$PHP_VARS['file_lastUpdate1']      = $data1["file_lastUpdate"]      ;
	$PHP_VARS['file_lastUpdate_name1'] = $data1["file_lastUpdate_name"] ;
	$PHP_VARS['age1']                  = $data1["age"]                  ;

	// Add the JSGAME core files.
	foreach($combinedFiles_jsgame['jsgameCore'] as $k => $v){
		array_push( $output['jsgameCore'], [ "type" => "js", "name" => $k, "data" => file_get_contents( $combinedFiles_jsgame['jsgameCore'][$k] ) ] ) ;
	}

	// Now get the game's files and the video/sound core files (if a game was specified.)
	if($game){
		// Get the gamesettings.json file for the selected game.

		// Get game dir.
		$gamekey          = array_search($game, array_column($games, 'header_gameChoice'));
		$thisgame         = $games[$gamekey];
		$gamedir          = realpath($games[$gamekey]['gamedir']);
		$relative_gamedir = $games[$gamekey]['gamedir'];

		// Get gamesettings.json.
		$gamesettings = json_decode(file_get_contents($gamedir."/gamesettings.json"), true);

		// Set the PHP_VARS flags.
		$PHP_VARS['gamesettings_json'] = true ;
		$PHP_VARS['gameSelected']      = true ;
		$PHP_VARS['relative_gamedir']  = $relative_gamedir ;
		$PHP_VARS['gamepads']          = $gamepads ? true : false ;

		// Set the default settings for PHP_VARS
		$PHP_VARS['typeGamepads']                = "nes";
		$PHP_VARS['numGamepads']                 = 1    ;
		$PHP_VARS['fps']                         = 30   ;
		$PHP_VARS['videokernel']                 = "cores/videoMode_A/videoMode_A.js"   ;
		$PHP_VARS['soundkernel']                 = "cores/soundMode_A/soundMode_A.js"   ;
		$PHP_VARS['fonts']                       = []   ;
		$PHP_VARS['mp3_files']                   = []   ;
		$PHP_VARS['midi_bin']                    = []   ;
		$PHP_VARS['midi_synths']                 = []   ;
		$PHP_VARS['graphics_conversionSettings'] = []   ;
		$PHP_VARS['links']                       = []   ;
		$PHP_VARS['canvas_scaleFactor']          = 2.0  ;
		$PHP_VARS['js_files']                    = []   ;
		$PHP_VARS['debug_files']                 = []   ;
		$PHP_VARS['INTRO_LOGO']                  = 1    ;
		$PHP_VARS['VRAM_ADDR_SIZE']              = 1    ;
		$PHP_VARS['useBG2']                      = false;

		// Override the default settings with values from gamesettings.json.
		if( isset($gamesettings["typeGamepads"])                ) { $PHP_VARS['typeGamepads']                = $gamesettings["typeGamepads"];                }
		if( isset($gamesettings["numGamepads"])                 ) { $PHP_VARS['numGamepads']                 = $gamesettings["numGamepads"];                 }
		if( isset($gamesettings["fps"])                         ) { $PHP_VARS['fps']                         = $gamesettings["fps"];                         }
		if( isset($gamesettings["videokernel"])                 ) { $PHP_VARS['videokernel']                 = $gamesettings["videokernel"];                 }
		if( isset($gamesettings["soundkernel"])                 ) { $PHP_VARS['soundkernel']                 = $gamesettings["soundkernel"];                 }
		if( isset($gamesettings["fonts"])                       ) { $PHP_VARS['fonts']                       = $gamesettings["fonts"];                       }
		if( isset($gamesettings["mp3_files"])                   ) { $PHP_VARS['mp3_files']                   = $gamesettings["mp3_files"];                   }
		if( isset($gamesettings["midi_bin"])                    ) { $PHP_VARS['midi_bin']                    = $gamesettings["midi_bin"];                    }
		if( isset($gamesettings["midi_synths"])                 ) { $PHP_VARS['midi_synths']                 = $gamesettings["midi_synths"];                 }
		if( isset($gamesettings["graphics_conversionSettings"]) ) { $PHP_VARS['graphics_conversionSettings'] = $gamesettings["graphics_conversionSettings"]; }
		if( isset($gamesettings["links"])                       ) { $PHP_VARS['links']                       = $gamesettings["links"];                       }
		if( isset($gamesettings["canvas_scaleFactor"])          ) { $PHP_VARS['canvas_scaleFactor']          = $gamesettings["canvas_scaleFactor"];          }
		if( isset($gamesettings["js_files"])                    ) { $PHP_VARS['js_files']                    = $gamesettings["js_files"];                    }
		if( isset($gamesettings["debug_files"])                 ) { $PHP_VARS['debug_files']                 = $gamesettings["debug_files"];                 }
		if( isset($gamesettings["INTRO_LOGO"])                  ) { $PHP_VARS['INTRO_LOGO']                  = $gamesettings["INTRO_LOGO"];                  }
		if( isset($gamesettings["VRAM_ADDR_SIZE"])              ) { $PHP_VARS['VRAM_ADDR_SIZE']              = $gamesettings["VRAM_ADDR_SIZE"];              }
		if( isset($gamesettings["useBG2"])                      ) { $PHP_VARS['useBG2']                      = $gamesettings["useBG2"];                      }
		if( isset($gamesettings["authors"])                     ) { $PHP_VARS['authors']                     = $gamesettings["authors"];                     }

		// Start-up logo: Get the files from PHP as base64.
		switch( $PHP_VARS['INTRO_LOGO'] ){
			case    0 : { $img_filename = '';                                                             break; }
			case    1 : { $img_filename = 'img/jsgamelogo1.png'; $PHP_VARS['INTRO_LOGO_STRETCH'] = true;  break; }
			case    2 : { $img_filename = 'img/jsgamelogo1.png'; $PHP_VARS['INTRO_LOGO_STRETCH'] = false; break; }
			default   : { $img_filename = 'img/jsgamelogo1.png'; $PHP_VARS['INTRO_LOGO_STRETCH'] = true;  break; }
		};
		if($img_filename){
			$image     = file_get_contents($img_filename);
			$imageData = base64_encode($image);
			$src       = 'data:'.mime_content_type($img_filename).';base64,'.$imageData;
			$PHP_VARS['INTRO_LOGO_IMGB64'] = $src;
		}

		// Save these to the output.
		$output['gamesettings_json'] = json_encode($gamesettings) ;
		$output['gameselected_json'] = json_encode($thisgame)     ;

		// Set the game can load flag.
		$PHP_VARS['CANLOADGAME']  = true;

		// If the game can be loaded...
		if($PHP_VARS['CANLOADGAME']){
			// Last update to the selected game.
			$data2 = getLastUpdate($gamedir);
			$PHP_VARS['file_lastUpdate2']      = $data2["file_lastUpdate"]      ;
			$PHP_VARS['file_lastUpdate_name2'] = $data2["file_lastUpdate_name"] ;
			$PHP_VARS['age2']                  = $data2["age"]                  ;

			// Get the video core.
			$key = "videomode";
			$key2 = basename($gamesettings['videokernel']);
			$output['game_files'][$key] = [ "type" => "js", "name"=>$key2, "data" => file_get_contents( $combinedFiles_jsgame[$key2] ) ];

			// Get the sound core.
			$key = "soundmode";
			$key2 = basename($gamesettings['soundkernel']);
			$output['game_files'][$key] = [ "type" => "js", "name"=>$key2, "data" => file_get_contents( $combinedFiles_jsgame[$key2] ) ];

			// Get the game code and support files.
			$keys=["js_files", "debug_files", "game_files"];
			for($i=0; $i<count($keys); $i+=1){
				$key = $keys[$i];
				if(isset($gamesettings[$key])){
					foreach($gamesettings[$key] as $k => $v){
						array_push($output['game_files'][$key] , [
							"type" => $gamesettings[$key][$k]["type"],
							"name" => basename($gamesettings[$key][$k]["location"]),
							"data" => file_get_contents($gamedir . "/" . $gamesettings[$key][$k]["location"]),
						]);
					}
				}
			}

			// Gamepads.
			if(isset($gamesettings["typeGamepads"])){
				if     ($gamesettings["typeGamepads"]=="nes" ){
					$output['onscreengamepads']=[
						"svg"  => file_get_contents("gamepadconfigs/gamepad_nes.svg"  ) ,
						"html" => file_get_contents("gamepadconfigs/keyboard_nes.html") ,
					];
				}
				else if($gamesettings["typeGamepads"]=="snes"){
					$output['onscreengamepads']=[
						"svg"  => file_get_contents("gamepadconfigs/gamepad_snes.svg"  ) ,
						"html" => file_get_contents("gamepadconfigs/keyboard_snes.html") ,
					];
				}
			}
		}
	}
	else{
		// echo "NOOOOOOOOOOOOOOOOOOOOOOOOOO " . $game . "\n\n";
	}

	//
	$output['PHP_VARS'] = $PHP_VARS;

	// Compress and then send the data.
	if (function_exists('gzencode')) {
		// Set the headers.
		header('Content-Encoding: gzip');

		// Send the data.
		echo gzencode( json_encode($output) ) ;
	}
	// Or just send the data.
	else{
		// Send the data.
		echo json_encode($output);
	}
}

// OLD CODE
// Used when JSGAME loads.
function init(){
	global $_appdir;

	// Create variables for the output and the error output.
	$outputText        = "";
	$outputText_errors = "";

	$outputText .= "'use strict'; \n";

	// Get the data for the last updated file.
	// $data = getLastUpdate(".");
	$data = getLastUpdate($_appdir);
	$file_lastUpdate      = $data["file_lastUpdate"] ;
	$file_lastUpdate_name = $data["file_lastUpdate_name"];
	$age                  = $data["age"] ;

	$outputText .= "// ******************************************** \n";
	$outputText .= "// -------------------------------------------- \n";
	$outputText .= "\n";

	// Parse the passed querystring.
	$qs = json_decode($_GET['qs'],true);

	// Was the debug key set? (Debug is off by default.)
	if($qs['debug']=="true"){ $debug=true;  }
	else                    { $debug=false; }

	// Was the hidden key set? (Hidden is off by default.)
	if($qs['hidden']=="true"){ $hidden=true;  }
	else                     { $hidden=false; }

	// Was the gamepads key set? (Gamepads are off by default.)
	if( isset($qs['gamepads']) ){ $gamepads = $qs['gamepads']=="true" ? true : false; }
	else                        { $gamepads=false; }

	//
	$combine = [];

	// Is the combine key set? If so json_decode it then fix it if needed.
	if(isset($qs['combine'])){
		$qs['combine'] = json_decode($qs['combine'], true);

		// If debug normalize the combine flags.
		if($debug){
			// Set combine. Set qs.
			$combine['jsg'] = $qs['combine']['jsg'] ? 1 : 0; $qs['combine']['jsg'] = $combine['jsg'] ;
			$combine['v']   = $qs['combine']['v']   ? 1 : 0; $qs['combine']['v']   = $combine['v']   ;
			$combine['a']   = $qs['combine']['a']   ? 1 : 0; $qs['combine']['a']   = $combine['a']   ;
			$combine['gjs'] = $qs['combine']['gjs'] ? 1 : 0; $qs['combine']['gjs'] = $combine['gjs'] ;
			$outputText .= ""."JSGAME.PRELOAD_PRE_COMBINE_TYPE0 = 'DEBUG, COMBINE USED IF/AS INDICATED.';\n";

		}
		else{
			// Set combine. Set qs.
			$combine['jsg'] = 1; $qs['combine']['jsg'] = $combine['jsg'] ;
			$combine['v']   = 1; $qs['combine']['v']   = $combine['v']   ;
			$combine['a']   = 1; $qs['combine']['a']   = $combine['a']   ;
			$combine['gjs'] = 1; $qs['combine']['gjs'] = $combine['gjs'] ;
			$outputText .= ""."JSGAME.PRELOAD_PRE_COMBINE_TYPE0 = 'NORMAL, COMBINE SET TO 1.';\n";
		}
	}
	// Combine key was NOT set? Set it with default values.
	else{
		if($debug){
			// Set combine. Set qs.
			$combine['jsg'] = 0; $qs['combine']['jsg'] = $combine['jsg'] ;
			$combine['v']   = 0; $qs['combine']['v']   = $combine['v']   ;
			$combine['a']   = 0; $qs['combine']['a']   = $combine['a']   ;
			$combine['gjs'] = 0; $qs['combine']['gjs'] = $combine['gjs'] ;
			$outputText .= ""."JSGAME.PRELOAD_PRE_COMBINE_TYPE0 = 'DEBUG, COMBINE CREATED AND SET TO 0.';\n";
		}
		else{
			// Set combine. Set qs.
			$combine['jsg'] = 1; $qs['combine']['jsg'] = $combine['jsg'] ;
			$combine['v']   = 1; $qs['combine']['v']   = $combine['v']   ;
			$combine['a']   = 1; $qs['combine']['a']   = $combine['a']   ;
			$combine['gjs'] = 1; $qs['combine']['gjs'] = $combine['gjs'] ;
			$outputText .= ""."JSGAME.PRELOAD_PRE_COMBINE_TYPE0 = 'NORMAL, COMBINE CREATED AND SET TO 1.';\n";
		}
	}

	// Correct the data types within the querystring.
	foreach($qs as $k => $v){ $qs[$k] = correctDataTypes($qs[$k]); }

	// These values will be copied to JavaScript. (There will be more.)
	$PHP_VARS["queryString"]  = $qs                    ; // The query string provided.
	$PHP_VARS['gamename']     = $qs['game']            ;
	$PHP_VARS['debug']        = $debug  ? true : false ;
	$PHP_VARS['hidden']       = $hidden ? true : false ;
	$PHP_VARS['combine']      = $combine               ;

	// Last update to the files of JSGAME.
	$PHP_VARS['file_lastUpdate']      = $data["file_lastUpdate"]      ;
	$PHP_VARS['file_lastUpdate_name'] = $data["file_lastUpdate_name"] ;
	$PHP_VARS['age']                  = $data["age"]                  ;


	// ***************************************
	//  FIND AND LOAD THE gamelist.json FILE.
	// ***************************************

	// gamelist.json file.
	$gamelist_json = [];

	// Is there a gamelist.json file? If not then use the built-in blank one.
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

	// **********************************
	//  Load the gamesettings.json file.
	// **********************************

	// Was the gamelist.json file found? Get it and json_decode it.
	if( file_exists ($gamelistjson_file) )   {

		// Set the flag indicating the gamelist.json file was found.
		$PHP_VARS['gamelist_json']=true;

		// Get a handle on the 'games' key in the gamelist.json file.
		$games=json_decode(file_get_contents($gamelistjson_file), true)['games'];

		// Output as JavaScript variable.
		$outputText .= "JSGAME.PRELOAD.gamelist_json = " . json_encode($games) . ";\n" ;
	}
	// No gamelist.json? (Should never happen.)
	else                                     {
		$outputText .= "JSGAME.PRELOAD.gamelist_json = " . json_encode([])     . ";\n" ;
		$outputText_errors .= 'NO GAMELIST.JSON' . "\n";
	}

	// *******************************************
	//  Read and load the gamesettings.json file.
	// *******************************************

	// Was the $gamelistjson_file file found AND was a game selected?
	// If so, get the game's gamesettings.json file and use it to start loading the values for the game.
	if( $PHP_VARS['gamelist_json'] && ($PHP_VARS['gamename']) ){
		// Get game dir.
		$gamekey          = array_search($qs["game"], array_column($games, 'header_gameChoice'));
		$thisgame         = $games[$gamekey];
		$gamedir          = realpath($games[$gamekey]['gamedir']);
		$relative_gamedir = $games[$gamekey]['gamedir'];

		// Get gamesettings.json.
		$gamesettings = json_decode(file_get_contents($gamedir."/gamesettings.json"), true);

		// With the gamesettings we should be able to get the path to the game.

		// Does the gamesettings.json file exist?
		if( file_exists ($gamedir . '/gamesettings.json') ) {
			$gamesettings = json_decode(file_get_contents($gamedir."/gamesettings.json"), true);

			// Last update to the selected game.
			$data2 = getLastUpdate($gamedir);

			$PHP_VARS['file_lastUpdate2']      = $data2["file_lastUpdate"]      ;
			$PHP_VARS['file_lastUpdate_name2'] = $data2["file_lastUpdate_name"] ;
			$PHP_VARS['age2']                  = $data2["age"]                  ;

			$PHP_VARS['gamesettings_json'] = true ;
			$PHP_VARS['gameSelected']      = true ;
			$PHP_VARS['gamedir']           = $gamedir ;
			$PHP_VARS['relative_gamedir']  = $relative_gamedir ;
			$PHP_VARS['gamepads']          = $gamepads ? true : false ;

			// Fix the path for gamesettings.
			//

			// Set the default settings.
			$PHP_VARS['typeGamepads']                = "nes";
			$PHP_VARS['numGamepads']                 = 1    ;
			$PHP_VARS['fps']                         = 30   ;
			$PHP_VARS['videokernel']                 = "cores/videoMode_A/videoMode_A.js"   ;
			$PHP_VARS['soundkernel']                 = "cores/soundMode_A/soundMode_A.js"   ;
			$PHP_VARS['fonts']                       = []   ;
			$PHP_VARS['mp3_files']                   = []   ;
			$PHP_VARS['midi_bin']                    = []   ;
			$PHP_VARS['midi_synths']                 = []   ;
			$PHP_VARS['graphics_conversionSettings'] = []   ;
			$PHP_VARS['links']                       = []   ;
			$PHP_VARS['canvas_scaleFactor']          = 2.0  ;
			$PHP_VARS['js_files']                    = []   ;
			$PHP_VARS['debug_files']                 = []   ;
			$PHP_VARS['INTRO_LOGO']                  = 1    ;
			$PHP_VARS['VRAM_ADDR_SIZE']              = 1    ;
			$PHP_VARS['useBG2']                      = false;

			// Override the default settings with values from gamesettings.json.
			if( isset($gamesettings["typeGamepads"])                ) { $PHP_VARS['typeGamepads']                = $gamesettings["typeGamepads"];                }
			if( isset($gamesettings["numGamepads"])                 ) { $PHP_VARS['numGamepads']                 = $gamesettings["numGamepads"];                 }
			if( isset($gamesettings["fps"])                         ) { $PHP_VARS['fps']                         = $gamesettings["fps"];                         }
			if( isset($gamesettings["videokernel"])                 ) { $PHP_VARS['videokernel']                 = $gamesettings["videokernel"];                 }
			if( isset($gamesettings["soundkernel"])                 ) { $PHP_VARS['soundkernel']                 = $gamesettings["soundkernel"];                 }
			if( isset($gamesettings["fonts"])                       ) { $PHP_VARS['fonts']                       = $gamesettings["fonts"];                       }
			if( isset($gamesettings["mp3_files"])                   ) { $PHP_VARS['mp3_files']                   = $gamesettings["mp3_files"];                   }
			if( isset($gamesettings["midi_bin"])                    ) { $PHP_VARS['midi_bin']                    = $gamesettings["midi_bin"];                    }
			if( isset($gamesettings["midi_synths"])                 ) { $PHP_VARS['midi_synths']                 = $gamesettings["midi_synths"];                 }
			if( isset($gamesettings["graphics_conversionSettings"]) ) { $PHP_VARS['graphics_conversionSettings'] = $gamesettings["graphics_conversionSettings"]; }
			if( isset($gamesettings["links"])                       ) { $PHP_VARS['links']                       = $gamesettings["links"];                       }
			if( isset($gamesettings["canvas_scaleFactor"])          ) { $PHP_VARS['canvas_scaleFactor']          = $gamesettings["canvas_scaleFactor"];          }
			if( isset($gamesettings["js_files"])                    ) { $PHP_VARS['js_files']                    = $gamesettings["js_files"];                    }
			if( isset($gamesettings["debug_files"])                 ) { $PHP_VARS['debug_files']                 = $gamesettings["debug_files"];                 }
			if( isset($gamesettings["INTRO_LOGO"])                  ) { $PHP_VARS['INTRO_LOGO']                  = $gamesettings["INTRO_LOGO"];                  }
			if( isset($gamesettings["VRAM_ADDR_SIZE"])              ) { $PHP_VARS['VRAM_ADDR_SIZE']              = $gamesettings["VRAM_ADDR_SIZE"];              }
			if( isset($gamesettings["useBG2"])                      ) { $PHP_VARS['useBG2']                      = $gamesettings["useBG2"];                      }
			if( isset($gamesettings["authors"])                     ) { $PHP_VARS['authors']                     = $gamesettings["authors"];                     }

			// Start-up logo: Get the files from PHP as base64.
			switch( $PHP_VARS['INTRO_LOGO'] ){
				case    0 : { $img_filename = '';                                                             break; }
				case    1 : { $img_filename = 'img/jsgamelogo1.png'; $PHP_VARS['INTRO_LOGO_STRETCH'] = true;  break; }
				case    2 : { $img_filename = 'img/jsgamelogo1.png'; $PHP_VARS['INTRO_LOGO_STRETCH'] = false; break; }
				default   : { $img_filename = 'img/jsgamelogo1.png'; $PHP_VARS['INTRO_LOGO_STRETCH'] = true;  break; }
			};
			if($img_filename){
				$image     = file_get_contents($img_filename);
				$imageData = base64_encode($image);
				$src       = 'data:'.mime_content_type($img_filename).';base64,'.$imageData;
				$PHP_VARS['INTRO_LOGO_IMGB64'] = $src;
			}

			// Output as JavaScript variables.
			$outputText .= "JSGAME.PRELOAD.gamesettings_json = " . json_encode($gamesettings) . ";\n" ;
			$outputText .= "JSGAME.PRELOAD.gameselected_json = " . json_encode($thisgame)     . ";\n";
			$outputText .= "\n";

			// Set the game can load flag.
			$PHP_VARS['CANLOADGAME']  = true;
		}
		else                                    {
			$outputText        .= "console.log('gamedir:', '".$gamedir."' );" . "\n";
			$outputText_errors .= "// no gamesettings.json " . "\n";
		}
	}
	else{
		$outputText_errors .= 'GAME HAS NOT BEEN SELECTED' . "\n";
	}

	// *** File loading ***

	// If the game can be loaded...
	if($PHP_VARS['CANLOADGAME']){
		// Download files combined if specified.
		if($debug){
			// Get the list of JSGAME core files?
			if($combine['jsg'] == 0){
				$keys = [
					"game"         => $PHP_VARS['gamename'],
					"filelistonly" => 1 ,
					"jsgame"       => 1 ,
					"video"        => 0 ,
					"audio"        => 0 ,
					"gamejs"       => 0 ,
					"debug"        => 0 ,
				];
				$outputText .= ""."JSGAME.PRELOAD_TYPE='DEBUG, game. keys: ".json_encode($keys)."';"."\n\n";
				$combined = combineFiles_typeByKey($keys);

				foreach($combined as $k => $v){
					for($i=0; $i<sizeof($combined[$k]); $i+=1){
						$combined[$k][$i] = str_replace($_appdir."/", "", $combined[$k][$i]);
					}
				}

				$PHP_VARS['jsgamefiles'] = $combined['js'] ;
			}

			// Get the rest of the files.
			$keys = [
				"game"         => $PHP_VARS['gamename'],
				"filelistonly" => 0 ,
				"jsgame"       => $combine['jsg'] ,
				"video"        => $combine['v']   ,
				"audio"        => $combine['a']   ,
				"gamejs"       => $combine['gjs'] ,
				"debug"        => 0 , // Debug currently cannot be combined because of the varying file types.
			];
			$outputText .= ""."JSGAME.PRELOAD_TYPE='DEBUG, game specified. keys: ".json_encode($keys)."';"."\n\n";
			$combined = combineFiles_typeByKey($keys);
			if( isset($combined['js']) ){ $outputText .= $combined['js']; }
		}
		// Download all files combined.
		else{
			// Only get the JSGAME files. (combined.)
			$keys = [
				"game"         => $PHP_VARS['gamename'],
				"filelistonly" => 0 ,
				"jsgame"       => $combine['jsg'] , // 1 ,
				"video"        => $combine['v']   , // 0 ,
				"audio"        => $combine['a']   , // 0 ,
				"gamejs"       => $combine['gjs'] , // 0 ,
				"debug"        => 0 ,
			];
			$outputText .= ""."JSGAME.PRELOAD_TYPE='(1) Normal, game specified. keys: ".json_encode($keys)."';"."\n\n";
			$combined = combineFiles_typeByKey($keys);
			if( isset($combined['js']) ){ $outputText .= $combined['js']; }
		}
	}
	// If a game has not been specified...
	else{
		// Download files combined if specified.
		if($debug){
			// Get the list of JSGAME core files?
			if($debug && $combine['jsg'] == 0){
				$keys = [
					"game"         => "", // No game so the video,audio,gamejs,debug will be ignored.
					"filelistonly" => 1 ,
					"jsgame"       => 1 ,
					"video"        => 0 ,
					"audio"        => 0 ,
					"gamejs"       => 0 ,
					"debug"        => 0 ,
				];
				$outputText .= ""."JSGAME.PRELOAD_TYPE='DEBUG, no game specified. keys: ".json_encode($keys)."';"."\n\n";
				$combined = combineFiles_typeByKey($keys);

				foreach($combined as $k => $v){
					for($i=0; $i<sizeof($combined[$k]); $i+=1){
						$combined[$k][$i] = str_replace($_appdir."/", "", $combined[$k][$i]);
					}
				}

				if( isset($combined['js']) ){ $PHP_VARS['jsgamefiles'] = $combined['js'] ; }
			}

			// Get the rest of the files.
			$keys = [
				"game"         => "", // No game so the video,audio,gamejs,debug will be ignored.
				"filelistonly" => 0 ,
				"jsgame"       => $combine['jsg'] ,
				"video"        => $combine['v']   ,
				"audio"        => $combine['a']   ,
				"gamejs"       => $combine['gjs'] ,
				"debug"        => 0 ,
			];
			$outputText .= ""."JSGAME.PRELOAD_TYPE='NORMAL, no game specified. keys: ".json_encode($keys)."';"."\n\n";
			$combined = combineFiles_typeByKey($keys);
			if( isset($combined['js']) ){ $outputText .= $combined['js']; }
		}
		// Download all files combined.
		else{
			// Only get the JSGAME files. (combined.)
			$keys = [
				"game"         => "", // No game so the video,audio,gamejs,debug will be ignored.
				"filelistonly" => 0 ,
				"jsgame"       => 1 ,
				"video"        => 0 ,
				"audio"        => 0 ,
				"gamejs"       => 0 ,
				"debug"        => 0 ,
			];
			$outputText .= ""."JSGAME.PRELOAD_TYPE='(2) No game specified. keys: ".json_encode($keys)."';"."\n\n";
			$combined = combineFiles_typeByKey($keys);
			if( isset($combined['js']) ){ $outputText .= $combined['js']; }
		}
	}

	$vars = [
		"array"   => [] ,
		"string"  => [] ,
		"null"    => [] ,
		"numeric" => [] ,
		"true"    => [] ,
		"false"   => [] ,
		"other"   => [] ,
	];

	// Add each PHP_VARS value to $vars.
	foreach($PHP_VARS as $k => $v){
		if     ( is_array  ($PHP_VARS[$k]) ) { $vars['array'  ][$k] = $PHP_VARS[$k]; }
		else if( is_string ($PHP_VARS[$k]) ) { $vars['string' ][$k] = $PHP_VARS[$k]; }
		else if( is_null   ($PHP_VARS[$k]) ) { $vars['null'   ][$k] = $PHP_VARS[$k]; }
		else if( is_numeric($PHP_VARS[$k]) ) { $vars['numeric'][$k] = $PHP_VARS[$k]; }
		else{
			// Make sure that specifically true or false values are not written as 1 or zero.
			if     ($PHP_VARS[$k]===true) { $vars['true'][$k] = $PHP_VARS[$k];  }
			else if($PHP_VARS[$k]===false){ $vars['false'][$k] = $PHP_VARS[$k]; }
			// Other values.
			else                          { $vars['other'][$k] = $PHP_VARS[$k]; }
		}
	}

	// Output and correct the $vars. Use string padding to neaten the output.
	foreach($vars["array"]   as $k => $v){
		$js_key = str_pad('JSGAME.PRELOAD.PHP_VARS["'.$k.'"]', 54, " ", STR_PAD_RIGHT);
		$outputText .= "" . $js_key . " = "  . json_encode($PHP_VARS[$k]) . " ;\n";
	}
	foreach($vars["string"]  as $k => $v){
		$js_key = str_pad('JSGAME.PRELOAD.PHP_VARS["'.$k.'"]', 54, " ", STR_PAD_RIGHT);
		$outputText .= "" . $js_key . " = '" . $PHP_VARS[$k] . "' ;\n";
	}
	foreach($vars["null"]    as $k => $v){
		$js_key = str_pad('JSGAME.PRELOAD.PHP_VARS["'.$k.'"]', 54, " ", STR_PAD_RIGHT);
		$outputText .= "" . $js_key . " = null ;\n"  ;
	}
	foreach($vars["numeric"] as $k => $v){
		$js_key = str_pad('JSGAME.PRELOAD.PHP_VARS["'.$k.'"]', 54, " ", STR_PAD_RIGHT);
		$outputText .= "" . $js_key . " = " . $PHP_VARS[$k] . " ;\n";
	}
	foreach($vars["true"]    as $k => $v){
		$js_key = str_pad('JSGAME.PRELOAD.PHP_VARS["'.$k.'"]', 54, " ", STR_PAD_RIGHT);
		$outputText .= "" . $js_key . " = true ;\n";
	}
	foreach($vars["false"]   as $k => $v){
		$js_key = str_pad('JSGAME.PRELOAD.PHP_VARS["'.$k.'"]', 54, " ", STR_PAD_RIGHT);
		$outputText .= "" . $js_key . " = false ;\n";
	}
	foreach($vars["other"]   as $k => $v){
		$js_key = str_pad('JSGAME.PRELOAD.PHP_VARS["'.$k.'"]', 54, " ", STR_PAD_RIGHT);
		$outputText .= "/*(OTHER)*/ " . $js_key . " = " . $PHP_VARS[$k] . " ;\n";
	}

	// END: Output the PHP vars as JavaScript vars.
	$outputText .= "\n";
	$outputText .= "// ******************************************** \n";
	$outputText .= "// -------------------------------------------- \n";
	$outputText .= "\n";

	// Include the PRESETUP.JS
	$PRESETUP = file_get_contents("cores/JSGAME_core/PRESETUP.js");

	// Include the PRE_INIT.JS
	$PRE_INIT = file_get_contents("cores/JSGAME_core/PRE_INIT.js");

	$outputText = $PRE_INIT . $PRESETUP . $outputText;

	// $outputText = file_get_contents("cores/JSGAME_core/PRESETUP.js") . $outputText;
	// $outputText = file_get_contents("cores/JSGAME_core/PRE_INIT.js") . $outputText;

	//
	$outputText .= "\n";

	// Add the error status(es).
	if($outputText_errors != ""){
		$outputText .= "\n\n// ERRORS: \n";
		$outputText .= "/*\n";
		$outputText .= trim($outputText_errors);
		$outputText .= "\n*/\n\n";
		$outputText .= 'console.log("ERRORS:");' . "\n";
		$outputText .= 'console.log('.json_encode(($outputText_errors)) . ')';
		$outputText .= "\n";
	}

	// If gzencode is availble then use it to compress and send the data.
	// This may be redundant because Apache does this by default on text files.
	if (function_exists('gzencode')) {
		// Set the headers.
		header('Content-Encoding: gzip');
		// header("Content-type: plain/text");
		echo gzencode( $outputText ) ;
	}
	// Or just send the data.
	else{
		echo $outputText  ;
	}

}

function preFlightCheck(){
	global $_appdir;

	$alwaysReMinify=false;
	// $alwaysReMinify=true;

	// JSGAME core files.
	$jsgameCoreFiles                = [
		$_appdir . "/cores/JSGAME_core/" . "PRESETUP.js" ,
		$_appdir . "/cores/JSGAME_core/" . "PRE_INIT.js" ,
		$_appdir . "/cores/JSGAME_core/" . "INIT.js"     ,
		$_appdir . "/cores/JSGAME_core/" . "DOM.js"      ,
		$_appdir . "/cores/JSGAME_core/" . "FLAGS.js"    ,
		$_appdir . "/cores/JSGAME_core/" . "GAMEPADS.js" ,
		$_appdir . "/cores/JSGAME_core/" . "GUI.js"      ,
		$_appdir . "/cores/JSGAME_core/" . "SHARED.js"   ,
	];
	$jsgameCoreCombinedFile         = $_appdir . "/cores/JSGAME_core/core_combined.min.js";
	$jsgame_CoreCombinedFile_newest = strtotime(getLastUpdate2( dirname($jsgameCoreCombinedFile)      .'/', basename($jsgameCoreCombinedFile)      , false )['file_lastUpdate']);
	foreach($jsgameCoreFiles       as $k => $v){
		$data       = getLastUpdate2( dirname($v).'/', basename($v), false ) ;
		$lastUpdate = strtotime($data['file_lastUpdate']);
		if($alwaysReMinify || $lastUpdate >= $jsgame_CoreCombinedFile_newest){
			minifiy_files($jsgameCoreFiles , $jsgameCoreCombinedFile, "cores/JSGAME_core/");
			break;
		}
	}

	// JSGAME: soundMode_A
	$soundMode_A_CoreFiles               = [$_appdir . "/cores/soundMode_A/" . "soundMode_A.js" ] ;
	$soundMode_A_CoreCombinedFile        = $_appdir . "/cores/soundMode_A/soundMode_A_combined.min.js" ;
	$soundMode_A_CoreCombinedFile_newest = strtotime(getLastUpdate2( dirname($soundMode_A_CoreCombinedFile).'/', basename($soundMode_A_CoreCombinedFile), false )['file_lastUpdate']);
	foreach($soundMode_A_CoreFiles as $k => $v){
		$data       = getLastUpdate2( dirname($v).'/', basename($v), false ) ;
		$lastUpdate = strtotime($data['file_lastUpdate']);
		if($alwaysReMinify || $lastUpdate >= $soundMode_A_CoreCombinedFile_newest){
			minifiy_files($soundMode_A_CoreFiles , $soundMode_A_CoreCombinedFile, "cores/soundMode_A/");
			break;
		}
	}

	// JSGAME: soundMode_B
	$soundMode_B_CoreFiles        = [$_appdir . "/cores/soundMode_B/" . "soundMode_B.js" ] ;
	$soundMode_B_CoreCombinedFile = $_appdir . "/cores/soundMode_B/soundMode_B_combined.min.js" ;
	$soundMode_B_CoreCombinedFile_newest = strtotime(getLastUpdate2( dirname($soundMode_B_CoreCombinedFile).'/', basename($soundMode_B_CoreCombinedFile), false )['file_lastUpdate']);
	foreach($soundMode_B_CoreFiles as $k => $v){
		$data       = getLastUpdate2( dirname($v).'/', basename($v), false ) ;
		$lastUpdate = strtotime($data['file_lastUpdate']);
		if($alwaysReMinify || $lastUpdate >= $soundMode_B_CoreCombinedFile_newest){
			minifiy_files($soundMode_B_CoreFiles , $soundMode_B_CoreCombinedFile, "cores/soundMode_B/");
			break;
		}
	}

	// JSGAME: videoMode_A
	$videoMode_A_CoreFiles        = [$_appdir . "/cores/videoMode_A/" . "videoMode_A.js" ] ;
	$videoMode_A_CoreCombinedFile = $_appdir . "/cores/videoMode_A/videoMode_A_combined.min.js" ;
	$videoMode_A_CoreCombinedFile_newest = strtotime(getLastUpdate2( dirname($videoMode_A_CoreCombinedFile).'/', basename($videoMode_A_CoreCombinedFile), false )['file_lastUpdate']);
	foreach($videoMode_A_CoreFiles as $k => $v){
		$data       = getLastUpdate2( dirname($v).'/', basename($v), false ) ;
		$lastUpdate = strtotime($data['file_lastUpdate']);
		if($alwaysReMinify || $lastUpdate >= $videoMode_A_CoreCombinedFile_newest){
			minifiy_files($videoMode_A_CoreFiles , $videoMode_A_CoreCombinedFile, "cores/videoMode_A/");
			break;
		}
	}

	// JSGAME: videoMode_B
	$videoMode_B_CoreFiles        = [$_appdir . "/cores/videoMode_B/" . "videoMode_B.js" ] ;
	$videoMode_B_CoreCombinedFile = $_appdir . "/cores/videoMode_B/videoMode_B_combined.min.js" ;
	$videoMode_B_CoreCombinedFile_newest = strtotime(getLastUpdate2( dirname($videoMode_B_CoreCombinedFile).'/', basename($videoMode_B_CoreCombinedFile), false )['file_lastUpdate']);
	foreach($videoMode_B_CoreFiles as $k => $v){
		$data       = getLastUpdate2( dirname($v).'/', basename($v), false ) ;
		$lastUpdate = strtotime($data['file_lastUpdate']);
		if($alwaysReMinify || $lastUpdate >= $videoMode_B_CoreCombinedFile_newest){
			minifiy_files($videoMode_B_CoreFiles , $videoMode_B_CoreCombinedFile, "cores/videoMode_B/");
			break;
		}
	}

	// JSGAME: videoMode_C
	$videoMode_C_CoreFiles        = [$_appdir . "/cores/videoMode_C/" . "videoMode_C.js" ] ;
	$videoMode_C_CoreCombinedFile = $_appdir . "/cores/videoMode_C/videoMode_C_combined.min.js" ;
	$videoMode_C_CoreCombinedFile_newest = strtotime(getLastUpdate2( dirname($videoMode_C_CoreCombinedFile).'/', basename($videoMode_C_CoreCombinedFile), false )['file_lastUpdate']);
	foreach($videoMode_C_CoreFiles as $k => $v){
		$data       = getLastUpdate2( dirname($v).'/', basename($v), false ) ;
		$lastUpdate = strtotime($data['file_lastUpdate']);
		if($alwaysReMinify || $lastUpdate >= $videoMode_C_CoreCombinedFile_newest){
			minifiy_files($videoMode_C_CoreFiles , $videoMode_C_CoreCombinedFile, "cores/videoMode_C/");
			break;
		}
	}

	return [
		"jsgameCore"     => $jsgameCoreCombinedFile       ,
		"soundMode_A.js" => $soundMode_A_CoreCombinedFile ,
		"soundMode_B.js" => $soundMode_B_CoreCombinedFile ,
		"videoMode_A.js" => $videoMode_A_CoreCombinedFile ,
		"videoMode_B.js" => $videoMode_B_CoreCombinedFile ,
		"videoMode_C.js" => $videoMode_C_CoreCombinedFile ,
	];
};



?>