window.onload=function(){
	console.log( JSGAME.PRELOAD );
	window.onload=null;

	let debug_cf_override = JSGAME.PRELOAD.PHP_VARS.debug_cf_override     ;
	let cf_overrides      = JSGAME.PRELOAD.PHP_VARS.cf_overrides     ;
	let js_files          = JSGAME.PRELOAD.PHP_VARS.js_files         ;
	let relative_gamedir  = JSGAME.PRELOAD.PHP_VARS.relative_gamedir ;
	let jsgamefiles       = JSGAME.PRELOAD.PHP_VARS.jsgamefiles      ;
	let gamename          = JSGAME.PRELOAD.PHP_VARS.gamename         ;
	let debug             = JSGAME.PRELOAD.PHP_VARS.debug  ;
	let gamepads          = JSGAME.PRELOAD.PHP_VARS.gamepads  ;

	let gameSelector    = document.getElementById("gameSelector");
	let gameinfolinks   = document.getElementById("gameinfolinks");
	let gameControls    = document.getElementById("gameControls");
	let debug_container = document.getElementById("debug_container");

	// Add games to the game select menu.
	let frag = document.createDocumentFragment();
	for(let i=0; i<JSGAME.PRELOAD.gamelist_json.length; i+=1){
		let rec = JSGAME.PRELOAD.gamelist_json[i];
		let AVAILABLE         = rec.AVAILABLE         ;

		// Do not display this option if the game is set as not available.
		if(!AVAILABLE){ continue; }

		// Create the option.
		let option = document.createElement("option");
		option.text=rec.gamename;
		option.setAttribute("value"   ,rec.header_gameChoice);
		option.setAttribute("gamename",rec.gamename         );
		option.setAttribute("author"  ,rec.author           );
		option.setAttribute("gamedesc",rec.gamedesc         );

		// Does this option match the game?
		if( rec.header_gameChoice == gamename){ option.selected = true; }

		frag.appendChild(option);
	}
	gameSelector.appendChild(frag);

	// Add links.
	if(gamename){
		frag = document.createDocumentFragment();
		for(let i=0; i<JSGAME.PRELOAD.PHP_VARS.links.length; i+=1){
			let rec = JSGAME.PRELOAD.PHP_VARS.links[i];
			let link = document.createElement("a");
			let span = document.createElement("span");
			span.innerText   = " "            ;
			link.innerText   = "["+rec.text+"]"            ;
			link.setAttribute("target",rec.target)     ;

			// Relative path to the game dir?
			if(rec.href.indexOf("://") == -1){
				link.setAttribute("href",(relative_gamedir +"/"+ rec.href)) ;
			}
			// Absolute path?
			else{
				link.setAttribute("href",rec.href) ;
			}

			frag.appendChild(link);
			frag.appendChild(span);

		}
		gameinfolinks.appendChild(frag);
	}

	// Add gamepad HTML/SVG.
	if(gamename){
		// #gameControls
	}

	let proms = [];

	// JSGAME / VIDEO / SOUND / GAME JS
	let addScript = function(src){
		return new Promise(function(res,rej){
			let script = document.createElement("script");
			script.onload=function(){ script.onload=null; res(); };
			script.src = src;
			document.body.appendChild(script);
		});
	};
	let addCSS = function(src){
		return new Promise(function(res,rej){
			let css = document.createElement("link");
			css.rel = 'stylesheet';
			css.type = 'text/css';
			css.href = src;
			css.onload=function(){ css.onload=null; res(); };
			css.src = src;
			document.body.appendChild(css);
		});
	};
	let addHTML = function(src, elem){
		return new Promise(function(res,rej){
			var finished = function(data) {
				// finished=null;
				// error=null;
				let resp = this.responseText ;
				elem.innerHTML=resp;
				res( resp );
			};
			var error    = function(data) {
				// finished=null;
				// error=null;
				console.log("getFile_fromUrl: error:", this, data);
				rej({
					type: data.type,
					xhr: xhr
				});
			};
			var xhr = new XMLHttpRequest();
			xhr.responseType = "text"
			xhr.addEventListener("load", finished);
			xhr.addEventListener("error", error);
			xhr.open(
				"GET", // Type of method (GET/POST)
				src    // Destination
			, true);
			xhr.send();
		});
	};

	// Individual script loading(s)?
	if(cf_overrides.jsg == 0){
		for(let i=0; i<jsgamefiles.length; i+=1){
			proms.push(addScript(jsgamefiles[i])    );
		}
	}
	// Do these if a game was selected.
	if(gamename && cf_overrides.v   == 0){
		proms.push(addScript(JSGAME.PRELOAD.PHP_VARS["videokernel"]) );
	}
	if(gamename && cf_overrides.a   == 0){
		proms.push(addScript(JSGAME.PRELOAD.PHP_VARS["soundkernel"]) );
	}
	if(gamename && cf_overrides.gjs == 0){
		// These need to be in order.
		proms.push(
			new Promise(function(res,rej){
				let srcs = [];
				for(let i=0; i<js_files.length; i+=1){
					srcs.push(relative_gamedir+"/"+js_files[i]);
				}

				let i=0;

				let iterate = function(){
					if(i>=srcs.length){ res(); }
					else{
						let prom = addScript(srcs[i]) ;
						prom.then(
							function(){
								i+=1;
								iterate();
							},
							function(err){ console.log("err:", err); }
						);

					}
				};
				iterate();
			})
		);
	}
	// Add debug panel.
	if(debug && gamename && cf_overrides.debug == 0){
		// #debug_container

		// CSS
		proms.push(addCSS( relative_gamedir +"/DEBUG/" + "debug.css"   ));

		// JS
		proms.push(addScript( relative_gamedir +"/DEBUG/" + "debug.js"   ));

		// PHP
		proms.push(addHTML( relative_gamedir +"/DEBUG/" + "debug.php", debug_container ));
	}

	// NOTE: If there were some combined files then they would already have been included.

	Promise.all(proms).then(
		function(res){
			// DEBUG AND GAMEPAD FLAGS

			// DEBUG
			if(debug)   { JSGAME.FLAGS.debug=true ; }
			else        { JSGAME.FLAGS.debug=false; }

			// GAMEPADS off?
			if(gamepads){ JSGAME.SHARED.gamepads=true ; }
			else        { JSGAME.SHARED.gamepads=false; }

			console.log(debug, gamepads);
			console.log(JSGAME.FLAGS.debug, JSGAME.SHARED.gamepads);

			// START JS GAME
			JSGAME.INIT.__PRE_INIT();
		},
		function(err){ console.log("ERR:", err); }
	);
};