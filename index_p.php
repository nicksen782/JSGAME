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
	$o_values["gzip_getFile"]    = [ "p"=>( ( $public ) ? true : false ), 'get'=>1, 'post'=>1, 'cmd'=>0 ] ;
	$o_values["init2"]           = [ "p"=>( ( $public ) ? true : false ), 'get'=>1, 'post'=>1, 'cmd'=>0 ] ;

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

function getLastUpdate($path){
	// http://man7.org/linux/man-pages/man1/find.1.html

	global $_appdir;

	$skipThese = "" .
	"-not -name '*.min.js*' "        .
	"-not -name 'JSGAME-error.txt' " .
	"-not -path '*/test.php' "       .
	"-not -path '*/\.git*'  "        .
	"-not -path '*/\docs**' "        .
	"";

	$latestVersion = trim( shell_exec(" find " . $path . " -type f ".$skipThese." -printf '%CY-%Cm-%Cd %CH:%CM:%CS (%CZ) %p\n'| sort -n | tail -n1 ") );
	// 2020-02-28 19:21:00 (EST) ./index_p.php

	$data = explode(" ", $latestVersion);
	$date     = trim( $data[0] ) ;
	$time     = trim( $data[1] ) ;
	$time     = explode(".", $time)[0] ;
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
		"file_lastUpdate"      => trim($file_lastUpdate)                                ,
		"file_lastUpdate_name" => trim(str_replace($path, ".", $file_lastUpdate_name) ) ,
		"age"                  => trim($age)                                            ,
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
	// http://man7.org/linux/man-pages/man1/find.1.html

	global $_appdir;

	$oldFile = $file;

	$skipThese = "" .
	"-not -name 'combined.min.js.map' " .
	"-not -name 'JSGAME-error.txt'    " .
	"-not -path '*/test.php' "          .
	"-not -path '*/\.git*'   "          .
	"-not -path '*/\docs**'  "          .
	"";

	if($skip){ $skip = "-not -path '*/".$skip."'"; }

	$cmd = " find " . ($path . $file)            . " -type f ".$skipThese." ".$skip." -printf '%CY-%Cm-%Cd %CH:%CM:%CS (%CZ) %p\n'| sort -n | tail -n1 ";

	$latestVersion = trim( shell_exec($cmd) );

	$data       = explode(" ", $latestVersion);
	$date       = trim( $data[0] ) ;
	$time       = trim( $data[1] ) ;
	$time       = explode(".", $time)[0] ;
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

	return [
		"file_lastUpdate_unix" => strtotime($file_lastUpdate)            ,
		"file_lastUpdate"      => trim     ($file_lastUpdate)            ,
		"file_lastUpdate_name" => basename (trim($file_lastUpdate_name)) ,
		"age"                  => trim     ($age)                        ,
	];

};

function minifiy_file2($orgFile, $minFile, $sourceMappingURL, $sourcesURL, $mapsURL, $appstart){
	// Minifies the specified files. Stores the results in a "min" directory.
	global $_appdir;

	// Start the command.
	$cmd = " cd " . ($appstart) . " && terser " . " " ;

	// NORMAL USAGE
	// Create the "minified" directory if it does not already exist.
	$newPath = $appstart . '/cores/minified' ;

	if(! file_exists($newPath) ) {
		$oldmask = umask(0);
		mkdir($newPath, 0777);
		chmod($newPath, 0777);
		umask($oldmask);
	}

	// Add the files to the command.
	$cmd .= str_replace( $_appdir.'/', "", $orgFile ) . " ";

	// Finish the command (adding in the output file value.)
	$cmd .= ""            .
	" --compress "        .                            // Enable compressor
	" --mangle "          .                            // Mangle names
	" --keep-classnames " .                            // Do not mangle/drop class names.
	" --keep-fnames "     .                            // Do not mangle/drop function names.
	" --output "          . $minFile .                 // Output file
	" --source-map "      .                            // Enable source map
	"\"" .
	" root='"             . $sourcesURL ."'," .        // Source map settings
	" url='"              . $sourceMappingURL  ."' " . // Source map settings
	"\"" . "" ;
	$cmd .= " 2>&1" ;

	// Run the command.
	$oldmask = umask(0);
	$exec_cmd=$cmd;
	$exec_res = exec($exec_cmd, $exec_out, $exec_ret);

	$js_output  = ( dirname($minFile) . '/' . basename($minFile) );
	$map_output = ( dirname($minFile) . '/' . basename($minFile) ) . ".map";

	// Change the permissions on the new minified file.
	if( ! @chmod( $js_output , 0777) ){
		echo "ERROR WITH CHMOD AND MINIFIED OUTPUT\n";
		print_r($exec_out); echo "\n";
		echo $exec_ret; echo "\n";
		exit();
	}
	// Change the permissions on the new source map file.
	if( ! @chmod( $map_output, 0777) ){
		echo "ERROR WITH CHMOD AND MINIFIED OUTPUT MAP\n";
		print_r($exec_out); echo "\n";
		echo $exec_ret; echo "\n";
		exit();
	}
	umask($oldmask);

	return $cmd;
}

function preFlightCheck3( ){
	// Updates the minified versions of files as needed.
	// Also returns the filenames of each minified file.

	global $_appdir;

	$alwaysReMinify=false;
	// $alwaysReMinify=true;

	$output=[];

	// Use the built-in input array.
	$referrer = explode("?", $_SERVER['HTTP_REFERER'])[0];
	$input = [
		// "force"      // Force minification of this file.
		// "key"        // Output key.
		// "appstart"   // Path that other paths should be relative to.
		// "orgFile"    // Server path to the original file.
		// "minFile"    // Server path to the minified file.
		// "sourcesURL" //
		// "mapFile"    // Web absolute path to the source map.
		// "mapsURL"    //

		// JSGAME CORE FILES
		"PRESETUP.js"              => [ "force"=>false, "key"=>"jsgameCore"    , "appstart"=>$_appdir, "orgFile"=>$_appdir  . "/cores/JSGAME_core/PRESETUP.js"             , "minFile"=>$_appdir . "/cores/minified/PRESETUP.min.js"             , "sourcesURL"=>$referrer, "mapFile"=>$referrer . "cores/minified/PRESETUP.min.js.map",              "mapsURL"=>$referrer . "cores/minified/", ] ,
		"PRE_INIT.js"              => [ "force"=>false, "key"=>"jsgameCore"    , "appstart"=>$_appdir, "orgFile"=>$_appdir  . "/cores/JSGAME_core/PRE_INIT.js"             , "minFile"=>$_appdir . "/cores/minified/PRE_INIT.min.js"             , "sourcesURL"=>$referrer, "mapFile"=>$referrer . "cores/minified/PRE_INIT.min.js.map",              "mapsURL"=>$referrer . "cores/minified/", ] ,
		"INIT.js"                  => [ "force"=>false, "key"=>"jsgameCore"    , "appstart"=>$_appdir, "orgFile"=>$_appdir  . "/cores/JSGAME_core/INIT.js"                 , "minFile"=>$_appdir . "/cores/minified/INIT.min.js"                 , "sourcesURL"=>$referrer, "mapFile"=>$referrer . "cores/minified/INIT.min.js.map",                  "mapsURL"=>$referrer . "cores/minified/", ] ,
		"DOM.js"                   => [ "force"=>false, "key"=>"jsgameCore"    , "appstart"=>$_appdir, "orgFile"=>$_appdir  . "/cores/JSGAME_core/DOM.js"                  , "minFile"=>$_appdir . "/cores/minified/DOM.min.js"                  , "sourcesURL"=>$referrer, "mapFile"=>$referrer . "cores/minified/DOM.min.js.map",                   "mapsURL"=>$referrer . "cores/minified/", ] ,
		"FLAGS.js"                 => [ "force"=>false, "key"=>"jsgameCore"    , "appstart"=>$_appdir, "orgFile"=>$_appdir  . "/cores/JSGAME_core/FLAGS.js"                , "minFile"=>$_appdir . "/cores/minified/FLAGS.min.js"                , "sourcesURL"=>$referrer, "mapFile"=>$referrer . "cores/minified/FLAGS.min.js.map",                 "mapsURL"=>$referrer . "cores/minified/", ] ,
		"GAMEPADS.js"              => [ "force"=>false, "key"=>"jsgameCore"    , "appstart"=>$_appdir, "orgFile"=>$_appdir  . "/cores/JSGAME_core/GAMEPADS.js"             , "minFile"=>$_appdir . "/cores/minified/GAMEPADS.min.js"             , "sourcesURL"=>$referrer, "mapFile"=>$referrer . "cores/minified/GAMEPADS.min.js.map",              "mapsURL"=>$referrer . "cores/minified/", ] ,
		"GUI.js"                   => [ "force"=>false, "key"=>"jsgameCore"    , "appstart"=>$_appdir, "orgFile"=>$_appdir  . "/cores/JSGAME_core/GUI.js"                  , "minFile"=>$_appdir . "/cores/minified/GUI.min.js"                  , "sourcesURL"=>$referrer, "mapFile"=>$referrer . "cores/minified/GUI.min.js.map",                   "mapsURL"=>$referrer . "cores/minified/", ] ,
		"SHARED.js"                => [ "force"=>false, "key"=>"jsgameCore"    , "appstart"=>$_appdir, "orgFile"=>$_appdir  . "/cores/JSGAME_core/SHARED.js"               , "minFile"=>$_appdir . "/cores/minified/SHARED.min.js"               , "sourcesURL"=>$referrer, "mapFile"=>$referrer . "cores/minified/SHARED.min.js.map",                "mapsURL"=>$referrer . "cores/minified/", ] ,
		// SOUND A MODE FILES
		"soundMode_A.js"           => [ "force"=>false, "key"=>"soundMode_A.js", "appstart"=>$_appdir, "orgFile"=>$_appdir  . "/cores/soundMode_A/soundMode_A.js"          , "minFile"=>$_appdir . "/cores/minified/soundMode_A.min.js"          , "sourcesURL"=>$referrer, "mapFile"=>$referrer . "cores/minified/soundMode_A.min.js.map",           "mapsURL"=>$referrer . "cores/minified/", ] ,
		// SOUND B MODE FILES
		"soundMode_B.js"           => [ "force"=>false, "key"=>"soundMode_B.js", "appstart"=>$_appdir, "orgFile"=>$_appdir  . "/cores/soundMode_B/soundMode_B.js"          , "minFile"=>$_appdir . "/cores/minified/soundMode_B.min.js"          , "sourcesURL"=>$referrer, "mapFile"=>$referrer . "cores/minified/soundMode_B.min.js.map",           "mapsURL"=>$referrer . "cores/minified/", ] ,
		// VIDEO A MODE FILES
		"videoMode_A.js"           => [ "force"=>false, "key"=>"videoMode_A.js", "appstart"=>$_appdir, "orgFile"=>$_appdir  . "/cores/videoMode_A/videoMode_A.js"          , "minFile"=>$_appdir . "/cores/minified/videoMode_A.min.js"          , "sourcesURL"=>$referrer, "mapFile"=>$referrer . "cores/minified/videoMode_A.min.js.map",           "mapsURL"=>$referrer . "cores/minified/", ] ,
		"videoMode_A_webworker.js" => [ "force"=>false, "key"=>"videoMode_A.js", "appstart"=>$_appdir, "orgFile"=>$_appdir  . "/cores/videoMode_A/videoMode_A_webworker.js", "minFile"=>$_appdir . "/cores/minified/videoMode_A_webworker.min.js", "sourcesURL"=>$referrer, "mapFile"=>$referrer . "cores/minified/videoMode_A_webworker.min.js.map", "mapsURL"=>$referrer . "cores/minified/", ] ,
		// VIDEO B MODE FILES
		"videoMode_B.js"           => [ "force"=>false, "key"=>"videoMode_B.js", "appstart"=>$_appdir, "orgFile"=>$_appdir  . "/cores/videoMode_B/videoMode_B.js"          , "minFile"=>$_appdir . "/cores/minified/videoMode_B.min.js"          , "sourcesURL"=>$referrer, "mapFile"=>$referrer . "cores/minified/videoMode_B.min.js.map",           "mapsURL"=>$referrer . "cores/minified/", ] ,
		// VIDEO C MODE FILES
		"videoMode_C.js"           => [ "force"=>false, "key"=>"videoMode_C.js", "appstart"=>$_appdir, "orgFile"=>$_appdir  . "/cores/videoMode_C/videoMode_C.js"          , "minFile"=>$_appdir . "/cores/minified/videoMode_C.min.js"          , "sourcesURL"=>$referrer, "mapFile"=>$referrer . "cores/minified/videoMode_C.min.js.map",           "mapsURL"=>$referrer . "cores/minified/", ] ,
		"videoMode_C_webworker.js" => [ "force"=>false, "key"=>"videoMode_C.js", "appstart"=>$_appdir, "orgFile"=>$_appdir  . "/cores/videoMode_C/videoMode_C_webworker.js", "minFile"=>$_appdir . "/cores/minified/videoMode_C_webworker.min.js", "sourcesURL"=>$referrer, "mapFile"=>$referrer . "cores/minified/videoMode_C_webworker.min.js.map", "mapsURL"=>$referrer . "cores/minified/", ] ,
	];

	$_MINIFICATIONS = [];

	$_TOTALMINTIME_time_start = microtime(true);
	foreach($input as $k => $v){
		$rec        = $input[$k]         ;
		$force      = $rec["force"]      ;
		$key        = $rec["key"]        ;
		$orgFile    = $rec["orgFile"]    ;
		$minFile    = $rec["minFile"]    ;
		$mapFile    = $rec["mapFile"]    ;
		$sourcesURL = $rec["sourcesURL"] ;
		$mapsURL    = $rec["mapsURL"]    ;
		$appstart   = $rec["appstart"]   ;

		// Skip the file if it does not exist.
		if( ! file_exists( $orgFile ) ) { continue; }

		$data_org = getLastUpdate2( dirname($orgFile).'/', basename($orgFile), false ) ;
		$data_min = getLastUpdate2( dirname($minFile).'/', basename($minFile), false ) ;

		// If the minified version does not exist then the 'file_lastUpdate' value will be blank.
		// This means the minified version is missing and must be created.
		$createMissingMinifiedFile = false;
		if( !$data_min['file_lastUpdate'] ){ $createMissingMinifiedFile = true; }

		//
		$lastUpdate_data_org = $data_org['file_lastUpdate_unix'] ;
		$lastUpdate_data_min = $data_min['file_lastUpdate_unix'] ;

		// Create the array key in $output if the key does not already exist.
		$basename   = basename($orgFile) ;
		if( !is_array( $output[$key] ) ) { $output[$key] = [] ; }
		if( !is_array( $output[$key][$basename] ) ) { $output[$key][$basename] = [] ; }

		// Is the original file newer than the minified version?
		if(
			($alwaysReMinify      || $createMissingMinifiedFile) ||
			($lastUpdate_data_org >  $lastUpdate_data_min) ||
			$force==true
		){
			$arg1 = $orgFile    ; //
			$arg2 = $minFile    ; //
			$arg3 = $mapFile    ; //
			$arg4 = $sourcesURL ; //
			$arg5 = $mapsURL    ; //
			$arg6 = $appstart   ; //

			$time_start = microtime(true);
			$cmd        = minifiy_file2($arg1, $arg2, $arg3, $arg4, $arg5, $arg6);
			$time_end   = microtime(true);
			$time       = $time_end - $time_start;

			// Create the new record.
			$newRecord = [
				"orgFile"            => basename($orgFile)  ,
				"minificationTime"   => floatval( number_format($time, 3, '.', '') ) ,
				"lastUpdate_data_org"=> $data_org ,
				"lastUpdate_data_min"=> $data_min ,
			];

			// Add the minifiy command if this is the devServer.
			if($devServer){ $newRecord['cmd'] = $cmd; }

			// Add the record.
			array_push($_MINIFICATIONS, $newRecord);

			// Clear the temporary record.
			unset($newRecord);
		}

		// Add the data to the $output.
		$output[$key][ basename($orgFile) ] = $minFile;
	}
	$_TOTALMINTIME_time_end = microtime(true);
	$_TOTALMINTIME = $_TOTALMINTIME_time_end - $_TOTALMINTIME_time_start;

	$output["_TOTALMINTIME"]  = $_TOTALMINTIME  ;
	$output["_MINIFICATIONS"] = $_MINIFICATIONS ;
	$output["_referrer"]      = $referrer ;

	return $output;
}

function removeCommentsFromFile( $filepath ){
	// Regex patterns.
	$regex = [
		// (pattern                            , replace)
		[ '/\r\n/'                             , "\n"   ] , // Normalize to Unix line endings.
		[ '/  +/'                              , ""     ] , // Multiple spaces (to become 0 spaces)
		[ '/^\s+|\s+$/'                        , ""     ] , // Strip leading and trailing spaces
		[ '/\t/'                               , ""     ] , // Remove tabs.
		['#^\s*//.+$#m'                        , ""     ] , // Single-line comments ( // )   // https://stackoverflow.com/a/5419241/2731377
		[ '/\/\*[\s\S]*?\*\/|([^:]|^)\/\/.*$/' , ""     ] , // Multi-line comments ( /* */ ) // https://www.regextester.com/94246
		[ '/^\s*[\r\n]/m'                      , ""     ] , // Blank lines.
	];

	// Text of the output file.
	$file_text="";

	// File list.
	$filesIn = [ $filepath ] ;

	// Operate on each file in the list.
	for($i=0; $i<sizeof($filesIn); $i+=1){
		// Bring file in.
		$data = file_get_contents($filesIn[$i]);

		// Do the regex.
		for($r=0; $r<sizeof($regex); $r+=1){
			// $data = preg_replace($patterns[$p], $replace[$p], $data);
			$data = preg_replace($regex[$r][0], $regex[$r][1], $data);
			$data = trim($data);
		}

		// Add this text to the combined text.
		$file_text .= $data . "\n";
	}

	// Return the file_text.
	return $file_text;
}

function init2(){
	global $_appdir;

	$combinedFiles_jsgame = preFlightCheck3();
	$referrer = $combinedFiles_jsgame['_referrer'] ;

	// if(1){
	if(!count($combinedFiles_jsgame)){
		echo "something went wrong.\n";
		print_r($combinedFiles_jsgame);
		exit();
	}

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
			// Game's Debug files.
			// Game's sound files.
			// Game's grx inc files.
			// Game's img files.
			"filelist"      => [] ,

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
		// "_FILES"         => $combinedFiles_jsgame['_FILES'],
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

		// Strip out all comments.
		// Get a handle on the 'games' key in the gamelist.json file.
		$games=json_decode(
			removeCommentsFromFile( $gamelistjson_file ),
			true
		)['games'];

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

	// Determine the last update within the JS_GAME directory.
	$data1 = getLastUpdate($_appdir);
	$PHP_VARS['file_lastUpdate1']      = $data1["file_lastUpdate"]      ;
	$PHP_VARS['file_lastUpdate_name1'] = $data1["file_lastUpdate_name"] ;
	$PHP_VARS['age1']                  = $data1["age"]                  ;

	// Add the JSGAME core files.
	foreach($combinedFiles_jsgame['jsgameCore'] as $k => $v){
		$filename_org = $k;
		$filename_min = $combinedFiles_jsgame['jsgameCore'][$k];
		$data = file_get_contents( $filename_min );

		array_push(
			$output['jsgameCore'],
			[
				"type" => "js",
				"name" => $filename_org,
				"data" => $data
			]
		) ;
	}
	unset($data);

	// Now get the game's files and the video/sound core files (if a game was specified.)
	if($game){
		// Get the gamesettings.json file for the selected game.

		// Get game dir.
		$gamekey          = array_search($game, array_column($games, 'header_gameChoice'));
		$thisgame         = $games[$gamekey];
		$gamedir          = realpath($games[$gamekey]['gamedir']);
		$relative_gamedir = $games[$gamekey]['gamedir'];

		// Get gamesettings.json.
		$gamesettings = json_decode(removeCommentsFromFile( $gamedir."/gamesettings.json" ), true);

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

			// Get the core video and core sound file(s).
			$soundAndVideoKeys = [
				["videomode", basename($gamesettings['videokernel'])],
				["soundmode", basename($gamesettings['soundkernel'])],
			];
			for($arrKey=0; $arrKey<count($soundAndVideoKeys); $arrKey+=1){
				$key  = $soundAndVideoKeys[$arrKey][0]; // "videomode";
				$key2 = $soundAndVideoKeys[$arrKey][1]; // basename($gamesettings['videokernel']);

				foreach($combinedFiles_jsgame[$key2] as $k => $v){
					$filename_org = $k;
					$filename_min = $combinedFiles_jsgame[$key2][$k];
					$data = file_get_contents( $filename_min );

					// Create the new record.
					$arr = [
						"type" => "js",
						"name" => $filename_org,
						"data" => $data
					];

					// Add a key to the record if this is a webworker file.
					if(strpos(basename($filename_org), "webworker") !==false){ $arr['worker'] = true  ; }
					else                                                     { $arr['worker'] = false ; }

					// Add the data.
					array_push( $output['game_files'][$key], $arr );

					unset($data);
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

			// Get the files from the filelist.
			if(isset($gamesettings['filelist'])){
				$combinedjs        = "" ;
				$numcombinedjs     = 0  ;
				$filesInCombinedJs = [] ;

				foreach($gamesettings['filelist'] as $k => $v){
					$rec    = $gamesettings['filelist'][$k];

					// Do not include the game's debug files if debug is not on.
					if($rec["key"]=="debug_files" && ! $debug){ continue; }

					// If debug is off and deliverAs is "xhr" and type is "js" then override it to be "combinedjs".
					if(!$debug && $rec["deliverAs"]=="xhr" && $rec["type"]=="js"){ $rec["deliverAs"]="combinedjs"; }

					// Is this deliverAs "combinedjs"?
					if( $rec["deliverAs"]=="combinedjs" ){
						// Add the data to combinedjs.
						$combinedjs .= file_get_contents($gamedir . "/" . $gamesettings['filelist'][$k]["location"]) . "\n\n";

						// Add the filename to the filesInCombinedJs list.
						array_push($filesInCombinedJs, $gamesettings['filelist'][$k]["location"]);

						// Increment the count of number of combined files.
						$numcombinedjs += 1;

						// Nothing left to do for this iteration.
						continue;
					}

					// Add this way:
					else{
						$data="";

						// Data will be base64 encoded.
						if     ( $rec["deliverAs"] == "base64"){ $data = base64_encode( file_get_contents( $gamedir . "/" . $rec["location"] )); }

						// Data will be the web url to download the file (on the front-end.)
						else if( $rec["deliverAs"] == "xhr"   ){ $data = $thisgame['gamedir'] . '/' . $rec["location"] ; }

						// Data will be text-based.
						else                                   { $data = file_get_contents( $gamedir . "/" . $rec["location"] ); }

						// Create the new record.
						$newRecord = [
							"key"       => $rec["key"]       ,
							"type"      => $rec["type"]      ,
							"deliverAs" => $rec["deliverAs"] ,
							"location"  => $rec["location"]  ,
							"name"      => basename( $rec["location"] ) ,
							"data"      => $data ,
						];

						// Add the new record.
						array_push($output['game_files']['filelist'] , $newRecord);

						unset($data);
					}
				}

				// Add the combinedjs.
				if($numcombinedjs){
					array_push($output['game_files']['filelist'] , [
						"key"               => "combinedjs"   ,
						"type"              => "js"           ,
						"deliverAs"         => "combinedjs"   ,
						"location"          => "combinedjs"   ,
						"name"              => "combinedjs"   ,
						"data"              => $combinedjs    ,
						"filesInCombinedJs" => $filesInCombinedJs ,
					]);
				}
			}

		}
	}

	// Add the PHP_VARS to the output.
	$output['PHP_VARS'] = $PHP_VARS;

	// Add some debug to the output.
	if($debug){
		$output['__DEBUG']  = [
			"combinedFiles_jsgame" => $combinedFiles_jsgame ,
			"_appdir"              => $_appdir              ,
			"referrer"             => $referrer             ,
		];
	}

	// Compress and then send the data.
	if (function_exists('gzencode')) {
		// Set the headers.
		header('Content-Encoding: gzip');

		// Send the data.
		echo gzencode( json_encode($output,JSON_PRETTY_PRINT) ) ;
	}
	// Or just send the data if the gzencode function does not exist.
	else{
		// Send the data.
		echo json_encode($output, JSON_PRETTY_PRINT);
	}
}

?>