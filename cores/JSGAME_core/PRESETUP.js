// =================================
// ==== FILE START: PRESETUP.js ====
// =================================

'use strict';

window.onload=function(){
	window.onload=null;

	(function(){
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
				let finished = function(data) {
					finished=null;
					error=null;
					let resp = this.responseText ;
					elem.innerHTML+=resp;
					res( resp );
				};
				let error    = function(data) {
					finished=null;
					error=null;
					console.log("getFile_fromUrl: error:", this, data);
					rej({
						type: data.type,
						xhr: xhr
					});
				};
				let xhr = new XMLHttpRequest();
				xhr.responseType = "text";
				xhr.addEventListener("load", finished);
				xhr.addEventListener("error", error);
				xhr.open(
					"GET", // Type of method (GET/POST)
					src,    // Destination
					true);
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
		let hidden           = JSGAME.PRELOAD.PHP_VARS.hidden           ;
		let gamepads         = JSGAME.PRELOAD.PHP_VARS.gamepads         ;

		let proms = [];
		let presetup_div = document.getElementById("presetup_div");

		let debug_mode   = document.getElementById("debug_mode");
		debug_mode.checked  = debug  ? true : false;

		// Handle the default hidden mode state if applicable.
		let hidden_mode  = document.getElementById("hidden_mode");
		hidden_mode.checked = hidden ? true : false;
		if(hidden_mode.checked){ document.body.style.visibility="hidden"; }
		else                   { document.body.style.visibility="visible"; }

		// Listener on the debug_mode checkbox row.
		debug_mode.closest(".navrow").addEventListener("click", function(){
			debug_mode.checked = !debug_mode.checked;
			debug_mode.dispatchEvent( new Event('change') );
		}, false);

		// Listener on the hidden_mode checkbox row.
		hidden_mode.closest(".navrow").addEventListener("click", function(){
			hidden_mode.checked = !hidden_mode.checked;
		}, false);

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
			if( rec.header_gameChoice == gamename){
				option.selected = true;

				let topBar_line1_gamename = document.getElementById("topBar_line1_gamename") ;
				topBar_line1_gamename.innerText=rec.gamename;
				topBar_line1_gamename.setAttribute("author", "Author: "+rec.author);
			}

			frag.appendChild(option);
		}
		gameSelector.appendChild(frag);

		// Add links.
		if(gamename){
			let gameinfolinks    = document.getElementById("gamelinks");
			frag = document.createDocumentFragment();
			for(let i=0; i<JSGAME.PRELOAD.PHP_VARS.links.length; i+=1){
				// Get a handle to this record.
				let rec = JSGAME.PRELOAD.PHP_VARS.links[i];

				// Set the description text.
				let targetText;
				if(rec.target == "_blank"){ targetText = "(Opens in new tab)" ; }
				else                      { targetText = "(Opens in "+rec.target+" tab)" ; }

				// Create the row.
				let navrow_div       = document.createElement("div");
				navrow_div.classList.add("navrow");
				navrow_div.setAttribute("target",rec.target) ;
				navrow_div.setAttribute("href",rec.href)     ;
				// navrow_div.setAttribute("text",rec.text)     ;
				navrow_div.onclick=function(){
					let href   = this.getAttribute("href");
					let target = this.getAttribute("target");
					console.log(href, target);
					window.open(href, target);
				};

				// Create the left column (title)
				let navrow_left_div  = document.createElement("div");
				navrow_left_div.classList.add("navrow_left");
				navrow_left_div.innerText=rec.text;

				// Create the right column (description)
				let navrow_right_div = document.createElement("div");
				navrow_right_div.classList.add("navrow_right");

				// Edit "href" link. Relative path to the game dir?
				if(rec.href.indexOf("://") == -1){
					navrow_div.setAttribute("href",(relative_gamedir +"/"+ rec.href)) ;
					navrow_right_div.innerText=targetText;
				}
				// Edit "href" link. Absolute path?
				else                             {
					navrow_div.setAttribute("href",rec.href) ;
					navrow_right_div.innerText=targetText;
				}

				// Add the left and right to the row and then the row to the frag.
				navrow_div.appendChild(navrow_left_div);
				navrow_div.appendChild(navrow_right_div);
				frag.appendChild(navrow_div);

			}

			// Add the completed frag to the game links.
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

		// Add the author information:
		if( JSGAME.PRELOAD.PHP_VARS.authors ){
			let bot_authors = document.querySelector("#bot_authors table");
			let frag=document.createDocumentFragment();
			// console.log( JSGAME.PRELOAD.PHP_VARS["authors"] );
			for(let i=0; i<JSGAME.PRELOAD.PHP_VARS.authors.length; i+=1){
				let rec = JSGAME.PRELOAD.PHP_VARS.authors[i];
				if(!rec.show){ continue; }
				let tr=document.createElement("tr");
				let td0=document.createElement("td"); tr.appendChild(td0);
				let td1=document.createElement("td"); tr.appendChild(td1);
				let td2=document.createElement("td"); tr.appendChild(td2);
				let td3=document.createElement("td"); tr.appendChild(td3);

				td0.innerHTML = "GAME"   ;
				td1.innerText = rec.author_name   ;
				td2.innerText = "(" + rec.author_handle+ ")" ;
				td3.innerText = "Role:" + rec.role          ;

				frag.appendChild(tr);
			}
			bot_authors.appendChild(frag);
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
			proms.push(addScript(JSGAME.PRELOAD.PHP_VARS.videokernel) );
		}
		if(gamename && combine.a   == 0){
			proms.push(addScript(JSGAME.PRELOAD.PHP_VARS.soundkernel) );
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
					case "html" : {
						proms.push(addHTML  (url, debug_container) ); break;
					}
					case "php"  : {
						proms.push(addHTML  (url, debug_container) ); break;
					}
					default     : { break; }
				}
			}
		}

		// Wait for all promises to complete before running the JSGAME __PRE_INIT.
		Promise.all(proms).then(
			function(res){
				// changeHTML("READY !", presetup_div);
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

	})();
};

// ===============================
// ==== FILE END: PRESETUP.js ====
// ===============================
