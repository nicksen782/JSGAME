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
	$o_values["combineFiles"] = [ "p"=>( ( $public ) ? 1 : 0 ), 'get'=>1, 'post'=>0, 'cmd'=>0,] ;

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
	$filelist=[];
	$output="";

	switch( $_GET["arg"] ){
		case "JSGAMECORE" : {
			array_push($filelist, "cores/JSGAME_core/FLAGS.js"   );
			array_push($filelist, "cores/JSGAME_core/SHARED.js"  );
			array_push($filelist, "cores/JSGAME_core/DOM.js"     );
			array_push($filelist, "cores/JSGAME_core/INIT.js"    );
			array_push($filelist, "cores/JSGAME_core/GUI.js"     );
			array_push($filelist, "cores/JSGAME_core/GAMEPADS.js");
			break;
		}
		default : { break; }
	};

	if(!sizeof($filelist)){ exit(); }

	for($i=0; $i<sizeof($filelist); $i+=1){
		$file = $filelist[$i];

		if (strpos($file, '..') !== false) { exit( "NOT ALLOWED!" ); }
		$output .= file_get_contents($_appdir."/".$file) . "\n\n" ;
	}

	echo $output;

}
?>