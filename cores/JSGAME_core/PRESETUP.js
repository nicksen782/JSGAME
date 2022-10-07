// =================================
// ==== FILE START: PRESETUP.js ====
// =================================

'use strict';

function STARTJSGAME(){
	let relative_gamedir = JSGAME.PRELOAD.PHP_VARS.relative_gamedir ;
	let gamename         = JSGAME.PRELOAD.PHP_VARS.game             ;
	let debug            = JSGAME.PRELOAD.PHP_VARS.debug            ;
	let hidden           = JSGAME.PRELOAD.PHP_VARS.hidden           ;
	let gamepads         = JSGAME.PRELOAD.PHP_VARS.gamepads         ;

	let proms = [];

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
	JSGAME.GUI.preGame_indicator("... FILLING GAME LIST ..."        , "ON");
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
	JSGAME.GUI.preGame_indicator("... ADDING LINKS ..."             , "ON");
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
	JSGAME.GUI.preGame_indicator("... ADDING ON-SCREEN GAMEPAD ..." , "ON");
	if(gamename){
		let numGamepads  = JSGAME.PRELOAD.PHP_VARS.numGamepads;
		let typeGamepads = JSGAME.PRELOAD.PHP_VARS.typeGamepads;
		let gameControls = document.getElementById("gameControls");

		if(typeGamepads=="snes" && numGamepads > 0){
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

			let svg  = JSGAME.PRELOAD.PHP_VARS.onscreengamepads.svg  ;
			let html = JSGAME.PRELOAD.PHP_VARS.onscreengamepads.html ;
			div.innerHTML += svg;
			frag.appendChild(div);

			// Clone the node if a second gamepad has been specified.
			for(let i=1; i<numGamepads; i+=1){
				let pad = div.cloneNode(true);
				pad.setAttribute("pad", i+1);
				frag.appendChild(pad);
			}

			// Output.
			gameControls.appendChild(frag);

			gameControls.innerHTML += html;
		}

	}

	// Add the author information:
	JSGAME.GUI.preGame_indicator("... ADDING AUTHOR INFORMATION ...", "ON");
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

	// Wait for all promises to complete before running the JSGAME __PRE_INIT.
	Promise.all(proms).then(
		function(res){
			JSGAME.GUI.preGame_indicator("... PRESETUP IS COMPLETE ...", "ON");
			// DEBUG AND GAMEPAD FLAGS

			// DEBUG
			if(debug)   {
				JSGAME.FLAGS.debug=true ;
				document.getElementById("debug_container").classList.remove("hide");
			}
			else        {
				JSGAME.FLAGS.debug=false;
				document.getElementById("debug_container").classList.add("hide");
			}

			// GAMEPADS off?
			if(gamepads){ JSGAME.SHARED.gamepads=true ; }
			else        { JSGAME.SHARED.gamepads=false; }

			// START JS GAME
			JSGAME.INIT.__PRE_INIT();
		},
		function(err){ console.log("ERR:", err); }
	);

}

// ===============================
// ==== FILE END: PRESETUP.js ====
// ===============================
