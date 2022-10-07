// ==============================
// ==== FILE START: index.js ====
// ==============================

'use strict';

window.onload = function(){
	window.onload=null;

	(async function(){
		let indicator_preGame = document.getElementById("indicator_preGame");

		indicator_preGame.classList.add("show");
		indicator_preGame.innerText="... WELCOME ...";

		// This will be filled based on the code below which is for adding files and setting settings.
		let proms = [];
		//
		let addFile = function(rec, obj){
			return new Promise(function(res, rej){

				let filename = rec.location;
				let key = rec.key;
				let data = rec.data;

				// JavaScript
				if     (rec.type=="js"){
					if(rec.deliverAs=="xhr"){
						// Add JavaScript from xhr.
						let script    = document.createElement('script');
						script.onload = function(){ script.onload=null; res( {"filename":filename, "script":script, "key":key} ); };
						script.setAttribute("filename", filename);
						document.body.appendChild(script);
						script.src    = data;
					}
					else{
						// Add JavaScript from blob.
						let blob      = new Blob( [data], { type: 'application/javascript' } );
						let script    = document.createElement('script');
						script.onload = function(){ script.onload=null; res( {"filename":filename, "script":script, "key":key} ); };
						script.setAttribute("filename", filename);
						document.body.appendChild(script);
						let d_url     = URL.createObjectURL(blob);
						script.src    = d_url;
						URL.revokeObjectURL(d_url);
					}
				}

				// CSS
				else if(rec.type=="css"){
					if(rec.deliverAs=="xhr"){
						// Add CSS from xhr.
						let css    = document.createElement("link");
						css.onload = function(){ css.onload=null; res( {"filename":filename, "css":css, "key":key} ); };
						css.setAttribute("filename", filename);
						css.rel    = 'stylesheet';
						css.type   = 'text/css';
						document.body.appendChild(css);
						css.href   = data;
					}
					else{
						// Add CSS from blob.
						let blob   = new Blob([data], { type: 'text/css;charset=utf-8' });
						let css    = document.createElement("link");
						css.onload = function(){ css.onload=null; res( {"filename":filename, "css":css, "key":key} ); };
						css.setAttribute("filename", filename);
						css.rel    = 'stylesheet';
						css.type   = 'text/css';
						document.body.appendChild(css);
						let d_url  = URL.createObjectURL(blob);
						css.href   = d_url;
						URL.revokeObjectURL(d_url);
					}

				}

				// HTML
				else if(rec.type=="html"){
					// obj.destDomId;
					let elem = document.getElementById(obj.html_dest_id);
					elem.innerHTML = rec.data;
					res();
				}

				// mp3
				else if(rec.type=="mp3"){
					if     (rec.deliverAs=="xhr"){
						res();
					}
					else if(rec.deliverAs=="base64"){
						// Convert to ArrayBuffer from base64.
						let tmpdata = Uint8Array.from(atob(rec.data), function(c) {return c.charCodeAt(0);}).buffer;

						// Create to blob from ArrayBuffer.
						tmpdata = new Blob( [ tmpdata ], { type: 'audio/mpeg;charset=utf-8' } );

						// Create Object URL.
						JSGAME.TEMP[ rec.location ] = URL.createObjectURL( tmpdata );

						res();
					}
				}

				// midi_bin
				else if(rec.type=="midi_bin"){
					if     (rec.deliverAs=="xhr"){
						res();
					}
					else if(rec.deliverAs=="base64"){
						// Convert to ArrayBuffer from base64.
						JSGAME.TEMP[ rec.location ] = Uint8Array.from(atob(rec.data), function(c) {return c.charCodeAt(0);}).buffer;
						res();
					}
				}

				// Images
				else if(rec.type=="img"){
					JSGAME.TEMP[ rec.location ] = rec.data ;
					res();
				}

				// Graphics .inc files.
				else if(rec.type=="inc"){
					if(rec.deliverAs=="xhr"){
						res();
					}
					else{
						// Create a blob objectURL and save it to TEMP.
						let blob = new Blob( [ rec.data ], { type: 'text/plain;charset=utf-8' } );
						JSGAME.TEMP[rec.location] = blob;
						res();
					}
				}
			});
		};
		let addScript = function (data, key, filename){
			return new Promise(function(res, rej){
				// let blob      = new Blob( [data], { type: 'text/javascript;charset=utf-8' } );
				let blob      = new Blob( [data], { type: 'application/javascript' } );
				let script    = document.createElement('script');
				script.onload = function(){ script.onload=null; res( {"filename":filename, "script":script, "key":key} ); };
				script.setAttribute("filename", filename);
				document.body.appendChild(script);
				let d_url     = URL.createObjectURL(blob);
				script.src    = d_url;
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

			/* // EXAMPLE OUTPUT:
				obj = {
					"game"  : "videoModeC_TESTS",
					"debug" : "true",
				};
			*/

			// Finally, return the object.
			return obj;
		};
		let attachResources = function( json, key ){
			if     (key=="jsgameCore")  {
				return new Promise(function(res,rej){
					//
					let jsgameCore_proms = [] ;

					//
					let keys = Object.keys( json[key] ) ;

					//
					for(let i=0; i<keys.length; i+=1){
						let rec = json[key][ keys[i] ] ;
						jsgameCore_proms.push(
							addScript( rec.data, (key+"_"+rec.name), rec.name )
						);
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
					// Add all PHP_VARS to JSGAME.PRELOAD.PHP_VARS.
					JSGAME.PRELOAD.PHP_VARS      = json[key];

					// Add the gamelist json to JSGAME.PRELOAD.
					JSGAME.PRELOAD.gamelist_json = JSON.parse( json.gamelist_json ) ;
					res(key);
				});
			}
			else if(key=="flagsAndJson"){
				//
				return new Promise(function(res,rej){
					try{
						// Add the gamesettings json to JSGAME.PRELOAD.
						JSGAME.PRELOAD.gamesettings_json  = JSON.parse( json.gamesettings_json ) ;

						// Add the gameselected json to JSGAME.PRELOAD.
						JSGAME.PRELOAD.gameselected_json  = JSON.parse( json.gameselected_json ) ;

						// Set flags as applicable.
						JSGAME.FLAGS.debug                = json.PHP_VARS.debug     ;
						JSGAME.PRELOAD.PHP_VARS.game      = json.PHP_VARS.game      ;
						JSGAME.PRELOAD.PHP_VARS.hidden    = json.PHP_VARS.hidden    ;
						JSGAME.PRELOAD.PHP_VARS.gamepads  = json.PHP_VARS.gamepads  ;
						JSGAME.PRELOAD.PHP_VARS.mastervol = json.PHP_VARS.mastervol ;

						// Add the on-screen gamepad data to JSGAME.PRELOAD.PHP_VARS.
						JSGAME.PRELOAD.PHP_VARS.onscreengamepads = json.onscreengamepads;

						// Done! Resolve.
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

					if(keys[i]=="sounds"  ){ console.log("Skipping: "+keys[i]+"... handled differently now.", rec); continue; }
					if(keys[i]=="graphics"){ console.log("Skipping: "+keys[i]+"... handled differently now.", rec); continue; }

					switch(keys[i]){
						case "filelist"  : {
							for(let f=0; f<rec.length; f+=1){
								let thisKey = rec[f].key ;
								let obj = {};

								// Only add the debug_files if the debug mode is on.
								if     ( thisKey == "debug_files" && ! JSGAME.FLAGS.debug ){ continue; }
								else                                                       { obj={ "html_dest_id" : "debug_container", }; }

								proms.push( addFile(rec[f], obj) );
							}

							break;
						}

						case "videomode"   : {
							for(let f=0; f<rec.length; f+=1){
								// Workers are added differently.
								if( rec[f].type=="js" && rec[f].worker ){
									let blob = new Blob( [ rec[f].data ], { type: 'text/javascript;charset=utf-8' } );
									JSGAME.TEMP[rec[f].name] = URL.createObjectURL( blob ) ;
								}
								else{
									if(rec[f].type=="js"){ proms.push( addScript( rec[f].data, key+"_"+rec[f].name, rec[f].name ) ); }
								}
							}
							break;
						}
						case "soundmode"   : {
							for(let f=0; f<rec.length; f+=1){
								// Workers are added differently.
								if( rec[f].type=="js" && rec[f].worker ){
									let blob = new Blob( [ rec[f].data ], { type: 'text/javascript;charset=utf-8' } );
									JSGAME.TEMP[rec[f].name] = URL.createObjectURL( blob ) ;
								}
								else{
									if(rec[f].type=="js"){ proms.push( addScript( rec[f].data, key+"_"+rec[f].name, rec[f].name ) ); }
								}
							}

							break;
						}
						// case "graphics" : {
						// 	for(let f=0; f<rec.length; f+=1){
						// 		if(rec[f].type=="inc"){
						// 			// Create a blob objectURL and save it to TEMP.
						// 			let blob = new Blob( [ rec[f].data ], { type: 'text/plain;charset=utf-8' } );
						// 			JSGAME.TEMP[rec[f].fullname] = blob;
						// 		}
						// 	}
						// 	break;
						// }
						// case "sounds" : {
						// 	for(let f=0; f<rec.length; f+=1){
						// 		// console.log(rec[f]);
						// 		// let thisKey = rec[f].key ;
						// 		proms.push( addFile(rec[f], {}) );
						// 	}
						// 	break;
						// }

						default : { console.log("????", keys[i]); break; }
					}

				}
			}
		};

		// Get the values from the queryString.
		let qs = getQueryStringAsObj();

		// Act upon the "hidden" key if it exists.
		if(qs.hidden){ document.body.style.visibility="hidden" ; }
		else         { document.body.style.visibility="visible"; }

		// Act upon the "debug" key if it exists.
		if(qs.debug) { document.getElementById("sideDiv").classList.remove("hide"); }
		else         { document.getElementById("sideDiv").classList.add   ("hide"); }

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
			// console.log("2:", performance.now());
			xhr.onload=null;
			let json = xhr.response;

			// If there were minifications performed then list then in the dev console.
			if(json._MINIFICATIONS.length){
				console.log(json._MINIFICATIONS.length + " minifications performed:", json._MINIFICATIONS, "\n");
				console.log("Minification time:", (json._TOTALMINTIME).toFixed(3) + " seconds", "\n\n");
			}

			// Add the JSGAME core...
			indicator_preGame.innerText="... ADDING JSGAME CORE ...";
			try{ await attachResources( json, "jsgameCore"   ); } catch(err){ console.log("Failure on jsgameCore   : " , err); }

			// Add values from PHP_VARS...
			indicator_preGame.innerText="... CONFIGURING SETTINGS ...";
			try{ await attachResources( json, "PHP_VARS"     ); } catch(err){ console.log("Failure on PHP_VARS     : " , err); }

			// If a game has been selected then load those files...
			if(JSGAME.PRELOAD.PHP_VARS.file_lastUpdate_name2){
				indicator_preGame.innerText="... CONFIGURING FLAGS ...";
				try{ await attachResources( json, "flagsAndJson" ); } catch(err){ console.log("Failure on flagsAndJson : " , err); }

				indicator_preGame.innerText="... ADDING GAME FILES ...";
				attachResources( json, "game_files"        ) ;
			}

			// Once all promises resolve... start JSGAME.
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
		// xhr.responseType = "ArrayBuffer";
		xhr.send(fd);
	})();
};

// ============================
// ==== FILE END: index.js ====
// ============================
