window.onload=function(){
	window.onload=null;

	let addScript = function(src){
		return new Promise(function(res,rej){
			let script = document.createElement("script");
			script.onload=function(){
				script.onload=null;
				res();
			};
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
			css.onload=function(){
				css.onload=null;
				res();
			};
			css.src = src;
			document.body.appendChild(css);
		});
	};
	let addHTML = function(src, elem){
		return new Promise(function(res,rej){
			var finished = function(data) {
				finished=null;
				error=null;
				let resp = this.responseText ;
				elem.innerHTML+=resp;
				res( resp );
			};
			var error    = function(data) {
				finished=null;
				error=null;
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
	let changeHTML = function(str, elem){
		elem.innerHTML = str;
	};

	let combine          = JSGAME.PRELOAD.PHP_VARS.combine          ;
	let js_files         = JSGAME.PRELOAD.PHP_VARS.js_files         ;
	let debug_files      = JSGAME.PRELOAD.PHP_VARS.debug_files      ;
	let relative_gamedir = JSGAME.PRELOAD.PHP_VARS.relative_gamedir ;
	let jsgamefiles      = JSGAME.PRELOAD.PHP_VARS.jsgamefiles      ;
	let gamename         = JSGAME.PRELOAD.PHP_VARS.gamename         ;
	let debug            = JSGAME.PRELOAD.PHP_VARS.debug            ;
	let gamepads         = JSGAME.PRELOAD.PHP_VARS.gamepads         ;

	let proms = [];
	let presetup_div = document.getElementById("presetup_div");
	let debug_mode = document.getElementById("debug_mode");
	debug_mode.checked= debug ? true : false;

	// Add games to the game select menu.
	let gameSelector     = document.getElementById("gameSelector");
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
		let gameinfolinks    = document.getElementById("gameinfolinks");
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
		let numGamepads  = JSGAME.PRELOAD.PHP_VARS.numGamepads;
		let typeGamepads = JSGAME.PRELOAD.PHP_VARS.typeGamepads;
		let gameControls     = document.getElementById("gameControls");

		if     (typeGamepads=="nes" && numGamepads > 0){
			// Create the first gamepad.
			let css_class="";
			if(debug){ css_class = "twoGamepads"; }
			else{
				if     (numGamepads==1){ css_class="oneGamepad"; }
				else if(numGamepads==2){ css_class="twoGamepads"; }
			}
			let div = document.createElement("div");
			div.classList.add( css_class );
			div.classList.add( "gamepad"     );
			div.classList.add( "gamepad_nes" );
			div.classList.add( "noSelect2"   );
			div.setAttribute("pad", 1);
			let prom = addHTML  ("gamepadconfigs/gamepad_nes.svg", div) ;
			proms.push(prom);
			prom.then(
				function(){
					frag.appendChild(div);

					// Clone the node if a second gamepad has been specified.
					for(let i=1; i<numGamepads; i+=1){
						let pad = div.cloneNode(true);
						pad.setAttribute("pad", i+1);
						frag.appendChild(pad);
					}
					// Output.
					gameControls.appendChild(frag);

					// Output the keyboard keys.
					proms.push(addHTML  ("gamepadconfigs/keyboard_nes.html", gameControls) );
				},
				function(err){ console.log("ERR:", err); }
			);
		}
		else if(typeGamepads=="snes" && numGamepads > 0){
			// Create the first gamepad.
			let css_class="";
			if(debug){ css_class = "twoGamepads"; }
			else{
				if     (numGamepads==1){ css_class="oneGamepad"; }
				else if(numGamepads==2){ css_class="twoGamepads"; }
			}
			let div = document.createElement("div");
			div.classList.add( css_class );
			div.classList.add( "gamepad"     );
			div.classList.add( "gamepad_snes" );
			div.classList.add( "noSelect2"   );
			div.setAttribute("pad", 1);

			let prom = addHTML  ("gamepadconfigs/gamepad_snes.svg", div) ;
			proms.push(prom);
			prom.then(
				function(){
					frag.appendChild(div);

					// Clone the node if a second gamepad has been specified.
					for(let i=1; i<numGamepads; i+=1){
						let pad = div.cloneNode(true);
						pad.setAttribute("pad", i+1);
						frag.appendChild(pad);
					}
					// Output.
					gameControls.appendChild(frag);

					// Output the keyboard keys.
					proms.push(addHTML  ("gamepadconfigs/keyboard_snes.html", gameControls) );
				},
				function(err){ console.log("ERR:", err); }
			);
		}
	}

	// JSGAME / VIDEO / SOUND / GAME JS
	// if(debug){
	// 	if(            combine.jsg == 0){ console.log("jsgame  : POST LOAD ..."); } else{ console.log("jsgame  : PRE  LOAD ..."); }
	// 	if(gamename && combine.v   == 0){ console.log("video   : POST LOAD ..."); } else{ console.log("video   : PRE  LOAD ..."); }
	// 	if(gamename && combine.a   == 0){ console.log("sound   : POST LOAD ..."); } else{ console.log("sound   : PRE  LOAD ..."); }
	// 	if(gamename && combine.gjs == 0){ console.log("game js : POST LOAD ..."); } else{ console.log("game js : PRE  LOAD ..."); }
	// 	if(gamename && debug           ){ console.log("debug   : POST LOAD ..."); } else{ console.log("debug   : PRE  LOAD ..."); }
	// }

	// Individual script loading(s)?
	// NOTE: If there were some combined files then they would already have been included.
	if(combine.jsg == 0){
		for(let i=0; i<jsgamefiles.length; i+=1){
			proms.push(addScript(jsgamefiles[i])    );
		}
	}
	// Do these if a game was selected.
	if(gamename && combine.v   == 0){
		proms.push(addScript(JSGAME.PRELOAD.PHP_VARS["videokernel"]) );
	}
	if(gamename && combine.a   == 0){
		proms.push(addScript(JSGAME.PRELOAD.PHP_VARS["soundkernel"]) );
	}
	if(gamename && combine.gjs == 0){
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
	if(debug && gamename ){
		let debug_container  = document.getElementById("debug_container");
		for(let i=0; i<debug_files.length; i+=1){
			let file  = debug_files[i];
			let split = file.split(".");
			let ext   = split[split.length-1];
			let url   = relative_gamedir +"/" + file;

			switch(ext){
				case "css"  : {
					proms.push(addCSS   (url) ); break;
				}
				case "js"   : {
					proms.push(addScript(url) ); break;
				}
				case "php"  : {
					proms.push(addHTML  (url, debug_container) ); break;
				}
				case "html" : {
					proms.push(addHTML  (url, debug_container) ); break;
				}
				default     : { break; }
			};
		}
	}

	// Wait for all promises to complete before running the JSGAME __PRE_INIT.
	Promise.all(proms).then(
		function(res){
			changeHTML("READY !", presetup_div);
			// DEBUG AND GAMEPAD FLAGS

			// DEBUG
			if(debug)   { JSGAME.FLAGS.debug=true ; }
			else        { JSGAME.FLAGS.debug=false; }

			// GAMEPADS off?
			if(gamepads){ JSGAME.SHARED.gamepads=true ; }
			else        { JSGAME.SHARED.gamepads=false; }

			// START JS GAME
			setTimeout(function(){
				JSGAME.INIT.__PRE_INIT();
			}, 200);
		},
		function(err){ console.log("ERR:", err); }
	);
};