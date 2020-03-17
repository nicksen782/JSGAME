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
	// $o_values["init"]            = [ "p"=>( ( $public ) ? true : false ), 'get'=>1, 'post'=>1, 'cmd'=>0 ] ;
	$o_values["gzip_getFile"]    = [ "p"=>( ( $public ) ? true : false ), 'get'=>1, 'post'=>1, 'cmd'=>0 ] ;
	$o_values["init2"]           = [ "p"=>( ( $public ) ? true : false ), 'get'=>1, 'post'=>1, 'cmd'=>0 ] ;
	// $o_values["preFlightCheck2"] = [ "p"=>( ( $public ) ? true : false ), 'get'=>1, 'post'=>1, 'cmd'=>0 ] ;

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
	// http://man7.org/linux/man-pages/man1/find.1.html

	global $_appdir;

	$skipThese = "" .
	"-not -name '*.min.js*' " .
	"-not -path '*/test.php' "          .
	"-not -path '*/\.git*'    "         .
	"-not -path '*/\docs**'   "         .
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
	// http://man7.org/linux/man-pages/man1/find.1.html

	global $_appdir;

	$oldFile = $file;

	$skipThese = "" .
	"-not -name 'combined.min.js.map' " .
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

	//
	return [
		"file_lastUpdate_unix" => strtotime($file_lastUpdate)             ,
		"file_lastUpdate"      => trim($file_lastUpdate)                  ,
		"file_lastUpdate_name" => basename( trim($file_lastUpdate_name) ) ,
		"age"                  => trim($age)                              ,
	];
};
function minifiy_files($files, $newFile, $newBasepath){
	// Minifies the specified files. Stores the results in a "min" directory.

	global $_appdir;

	// Start the command.
	$cmd = " cd $_appdir && terser " . " " ;

	// Create the "min" directory if it does not already exist.
	$newPath = $_appdir . "/" . $newBasepath . "/min";
	if(! file_exists( $newPath ) ) {
		$oldmask = umask(0);
		mkdir($newPath, 0777);
		chmod($newPath, 0777);
		umask($oldmask);
	}

	// Add the files to the command.
	foreach($files as $k => $v){ $cmd .= ( $newBasepath . basename($files[$k]) ) . " "; }

	// Finish the command (adding in the output file value.)
	$referer       = explode("?", $_SERVER['HTTP_REFERER'])[0];
	$sourcemapRoot = $referer ;
	$sourcemapUrl  = $referer . ( $newBasepath . "min/" . basename($newFile) ) . ".map";
	$output        = ( $newBasepath . "min/" . basename($newFile) ) ;

	$cmd .= ""            .                                                  //
	" --compress "        .                                                  // Enable compressor
	" --mangle "          .                                                  // Mangle names
	" --keep-classnames " .                                                  // Do not mangle/drop class names.
	" --keep-fnames "     .                                                  // Do not mangle/drop function names.
	" --output "          . $output .                                        // Output file
	" --source-map \"root='".$sourcemapRoot."',url='".$sourcemapUrl."'\" " . // Enable source map
	" 2>&1" ;

	// Run the command.
	$oldmask = umask(0);
	$exec_cmd=$cmd;
	$exec_res = exec($exec_cmd, $exec_out, $exec_ret);

	$js_output  = realpath($output);
	$map_output = realpath($output) . ".map";

	if( ! @chmod( $js_output , 0777) ){
		echo 'pwd   : ' . getcwd()  . "\n";
		echo '_appdir   : ' . $_appdir  . "\n";
		echo 'output   : ' . $output  . "\n";
		echo 'js_output   : ' . $js_output  . "\n";
		echo 'map_output  : ' . $map_output . "\n";
		echo 'cmd         : ' . $cmd . "\n";
		echo "files       : "; print_r($files); echo "\n";
		echo "newFile     : " . $newFile     . "\n";
		echo "newBasepath : " . $newBasepath . "\n";
		echo "\n";
		echo "exec_res:" ; print_r($exec_res); echo "\n";
		echo "exec_cmd:" ; print_r($exec_cmd); echo "\n";
		echo "exec_out:" ; print_r($exec_out); echo "\n";
		echo "exec_ret:" ; print_r($exec_ret); echo "\n";

		exit();
	}
	if( ! @chmod( $map_output, 0777) ){
		echo 'pwd   : ' . getcwd()  . "\n";
		echo '_appdir   : ' . $_appdir  . "\n";
		echo 'output   : ' . $output  . "\n";
		echo 'js_output   : ' . $js_output  . "\n";
		echo 'map_output  : ' . $map_output . "\n";
		echo 'cmd         : ' . $cmd . "\n";
		echo "files       : "; print_r($files); echo "\n";
		echo "newFile     : " . $newFile     . "\n";
		echo "newBasepath : " . $newBasepath . "\n";
		echo "\n";
		echo "exec_res:" ; print_r($exec_res); echo "\n";
		echo "exec_cmd:" ; print_r($exec_cmd); echo "\n";
		echo "exec_out:" ; print_r($exec_out); echo "\n";
		echo "exec_ret:" ; print_r($exec_ret); echo "\n";
		exit();
	}

	umask($oldmask);

	return $cmd;
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
			"PRESETUP.js"    => [ "key"=>"jsgameCore", "web_srcPath"=>"cores/JSGAME_core/", "server_srcPath"=>($_appdir . "/cores/JSGAME_core/"), "minFile"=>"PRESETUP.min.js"   , "orgFile"=>"PRESETUP.js"    ] ,
			"PRE_INIT.js"    => [ "key"=>"jsgameCore", "web_srcPath"=>"cores/JSGAME_core/", "server_srcPath"=>($_appdir . "/cores/JSGAME_core/"), "minFile"=>"PRE_INIT.min.js"   , "orgFile"=>"PRE_INIT.js"    ] ,
			"INIT.js"        => [ "key"=>"jsgameCore", "web_srcPath"=>"cores/JSGAME_core/", "server_srcPath"=>($_appdir . "/cores/JSGAME_core/"), "minFile"=>"INIT.min.js"       , "orgFile"=>"INIT.js"        ] ,
			"DOM.js"         => [ "key"=>"jsgameCore", "web_srcPath"=>"cores/JSGAME_core/", "server_srcPath"=>($_appdir . "/cores/JSGAME_core/"), "minFile"=>"DOM.min.js"        , "orgFile"=>"DOM.js"         ] ,
			"FLAGS.js"       => [ "key"=>"jsgameCore", "web_srcPath"=>"cores/JSGAME_core/", "server_srcPath"=>($_appdir . "/cores/JSGAME_core/"), "minFile"=>"FLAGS.min.js"      , "orgFile"=>"FLAGS.js"       ] ,
			"GAMEPADS.js"    => [ "key"=>"jsgameCore", "web_srcPath"=>"cores/JSGAME_core/", "server_srcPath"=>($_appdir . "/cores/JSGAME_core/"), "minFile"=>"GAMEPADS.min.js"   , "orgFile"=>"GAMEPADS.js"    ] ,
			"GUI.js"         => [ "key"=>"jsgameCore", "web_srcPath"=>"cores/JSGAME_core/", "server_srcPath"=>($_appdir . "/cores/JSGAME_core/"), "minFile"=>"GUI.min.js"        , "orgFile"=>"GUI.js"         ] ,
			"SHARED.js"      => [ "key"=>"jsgameCore", "web_srcPath"=>"cores/JSGAME_core/", "server_srcPath"=>($_appdir . "/cores/JSGAME_core/"), "minFile"=>"SHARED.min.js"     , "orgFile"=>"SHARED.js"      ] ,

			// SOUND A MODE FILES
			"soundMode_A.js"           => [ "key"=>"soundMode_A.js", "web_srcPath"=>"cores/soundMode_A/", "server_srcPath"=>($_appdir . "/cores/soundMode_A/"), "minFile"=>"soundMode_A.min.js"          , "orgFile"=>"soundMode_A.js"           ] ,

			// SOUND B MODE FILES
			"soundMode_B.js"           => [ "key"=>"soundMode_B.js", "web_srcPath"=>"cores/soundMode_B/", "server_srcPath"=>($_appdir . "/cores/soundMode_B/"), "minFile"=>"soundMode_B.min.js"          , "orgFile"=>"soundMode_B.js"           ] ,

			// VIDEO A MODE FILES
			"videoMode_A.js"           => [ "key"=>"videoMode_A.js", "web_srcPath"=>"cores/videoMode_A/", "server_srcPath"=>($_appdir . "/cores/videoMode_A/"), "minFile"=>"videoMode_A.min.js"          , "orgFile"=>"videoMode_A.js"           ] ,
			"videoMode_A_webworker.js" => [ "key"=>"videoMode_A.js", "web_srcPath"=>"cores/videoMode_A/", "server_srcPath"=>($_appdir . "/cores/videoMode_A/"), "minFile"=>"videoMode_A_webworker.min.js", "orgFile"=>"videoMode_A_webworker.js" ] ,

			// VIDEO B MODE FILES
			"videoMode_B.js"           => [ "key"=>"videoMode_B.js", "web_srcPath"=>"cores/videoMode_B/", "server_srcPath"=>($_appdir . "/cores/videoMode_B/"), "minFile"=>"videoMode_B.min.js"          , "orgFile"=>"videoMode_B.js"           ] ,

			// VIDEO C MODE FILES
			"videoMode_C.js"           => [ "key"=>"videoMode_C.js", "web_srcPath"=>"cores/videoMode_C/", "server_srcPath"=>($_appdir . "/cores/videoMode_C/"), "minFile"=>"videoMode_C.min.js"          , "orgFile"=>"videoMode_C.js"           ] ,
			"videoMode_C_webworker.js" => [ "key"=>"videoMode_C.js", "web_srcPath"=>"cores/videoMode_C/", "server_srcPath"=>($_appdir . "/cores/videoMode_C/"), "minFile"=>"videoMode_C_webworker.min.js", "orgFile"=>"videoMode_C_webworker.js" ] ,
		];
	}

	$_MINIFICATIONS = [];
	// $_FILES         = [];

	$_TOTALMINTIME_time_start = microtime(true);
	foreach($input as $k => $v){
		$rec            = $input[$k]             ;
		$server_srcPath = $rec["server_srcPath"] ;
		$web_srcPath    = $rec["web_srcPath"]    ;
		$orgFile        = $rec["orgFile"]        ;
		$minFile        = $rec["minFile"]        ;
		$key            = $rec["key"]            ;

		// Skip the file if it does not exist.
		$fullOrgFilePath = $server_srcPath . $orgFile ;
		if( ! file_exists( $fullOrgFilePath ) ) { continue; }

		$data_org = getLastUpdate2( $server_srcPath, $orgFile, false ) ;
		$data_min = getLastUpdate2( $server_srcPath, "/min/" . $minFile, false ) ;

		$lastUpdate_data_org = $data_org['file_lastUpdate_unix'] ;
		$lastUpdate_data_min = $data_min['file_lastUpdate_unix'] ;

		// Create the array key in $output if the key does not already exist.
		if( !is_array( $output[$key] ) ) { $output[$key] = [] ; }

		// Is the original file newer than the minified version?
		if( $alwaysReMinify || ($lastUpdate_data_org > $lastUpdate_data_min) ){
			$arg1 = [$server_srcPath . $orgFile] ; // $files
			$arg2 =  $server_srcPath . $minFile  ; // $newFile
			$arg3 =  $web_srcPath                ; // $newBasepath

			$time_start = microtime(true);
			$cmd = minifiy_files($arg1, $arg2, $arg3);
			$time_end = microtime(true);
			$time = $time_end - $time_start;

			array_push($_MINIFICATIONS, [
				"orgFile"            => $orgFile  ,
				"minificationTime"   => floatval( number_format($time, 3, '.', '') ) ,
				"lastUpdate_data_org"=> $data_org ,
				"lastUpdate_data_min"=> $data_min ,
				"cmd"                => $cmd      ,
			]);
		}

		// Add the data to the $output.
		$output[$key][$orgFile] =  $server_srcPath . 'min/' . $minFile;

		// array_push($_FILES, [
		// 	"orgFile"            => $orgFile  ,
		// 	"lastUpdate_data_org"=> $data_org ,
		// ]);

	}
	$_TOTALMINTIME_time_end = microtime(true);
	$_TOTALMINTIME = $_TOTALMINTIME_time_end - $_TOTALMINTIME_time_start;

	$output["_TOTALMINTIME"]  = $_TOTALMINTIME  ;
	$output["_MINIFICATIONS"] = $_MINIFICATIONS ;
	// $output["_FILES"]         = $_FILES         ;

	return $output;
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

			//
			"sounds"        => [] ,

			//
			"graphics"      => [] ,
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
			foreach($combinedFiles_jsgame[$key2] as $k => $v){
				$filename = $combinedFiles_jsgame[$key2][$k];
				$arr = [ "type" => "js", "name" => $k, "data" => file_get_contents( $combinedFiles_jsgame[$key2][$k] ) ];
				if(strpos(basename($filename), "webworker") !==false){ $arr['worker'] = true  ; }
				else                                                 { $arr['worker'] = false ; }
				array_push( $output['game_files'][$key], $arr );
			}
			// Get the graphics files.
			if     ($key2=="videoMode_A.js"){ $files = $gamesettings['graphics_files']; }
			else if($key2=="videoMode_C.js"){ $files = $gamesettings['graphics']['inputTilesetData']; }
			foreach($files as $k => $v){
				array_push($output['game_files']['graphics'] , [
					"type" => pathinfo(basename($v), PATHINFO_EXTENSION),
					"name" => basename($v),
					"fullname" => $v,
					"data" => file_get_contents($gamedir . "/" . $v),
				]);
			}

			// Get the sound core.
			$key = "soundmode";
			$key2 = basename($gamesettings['soundkernel']);
			foreach($combinedFiles_jsgame[$key2] as $k => $v){
				$filename = $combinedFiles_jsgame[$key2][$k];
				$arr = [ "type" => "js", "name" => $k, "data" => file_get_contents( $combinedFiles_jsgame[$key2][$k] ) ];
				if(strpos(basename($filename), "webworker") !==false){ $arr['worker'] = true  ; }
				else                                                 { $arr['worker'] = false ; }
				array_push( $output['game_files'][$key], $arr );
			}
			// Get the audio files.
			if     ($key2=="soundMode_A.js"){ $files1 = $gamesettings['mp3_files']; $files2 = $gamesettings['midi_bin']; }
			foreach($files1 as $k => $v){
				array_push($output['game_files']['sounds'] , [
					"type" => pathinfo(basename($v['fileurl']), PATHINFO_EXTENSION),
					"name" => basename($v['fileurl']),
					"fullname" => $v['fileurl'],
					"data" => base64_encode(file_get_contents($gamedir . "/" . $v['fileurl'])),
					"extra"=>[
						"key"     => $v['key']     ,
						"fileurl" => $v['fileurl'] ,
						"type"    => $v['type']    ,
						"names"   => $v['names']   ,
					]
				]);
			}
			foreach([$files2] as $k => $v){
				array_push($output['game_files']['sounds'] , [
					"type" => pathinfo(basename($v), PATHINFO_EXTENSION),
					"name" => basename($v),
					"fullname" => $v,
					"data" => base64_encode(file_get_contents($gamedir . "/" . $v)),
				]);
			}

			// Get the game code and support files.
			$keys=["js_files", "debug_files", "game_files" ];
			for($i=0; $i<count($keys); $i+=1){
				$key = $keys[$i];

				// Do not include the game's debug files if debug is not on.
				if($key=="debug_files" && !$debug){ continue; }

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
		// echo gzencode( json_encode($output) ) ;
		echo gzencode( json_encode($output,JSON_PRETTY_PRINT) ) ;
	}
	// Or just send the data.
	else{
		// Send the data.
		// echo json_encode($output);
		echo json_encode($output, JSON_PRETTY_PRINT);
	}
}

?>