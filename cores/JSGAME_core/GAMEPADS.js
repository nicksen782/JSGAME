// =================================
// ==== FILE START: GAMEPADS.js ====
// =================================

'use strict';

JSGAME.GAMEPADS = {
	// *** CONFIG MENU FUNCTIONS ***

	CONFIG : {
		// gp_blinker1_status : false,
		// gp_blinker2_status : false,

		// Keeps the requestAnimationFrame id of the currently requested animation frame. Used for gamepad setup when there is no game.
		raf_id_noGame : null,

		initDone      : false,

		// DOM CACHE. POPULATED BY INIT.
		DOM_elems     : {},

		// When using the "setAllButtonMappings" this will keep track of the already used buttons on the gamepad.
		set_all_alreadyUsedButtons : [],

		// These buttons will be ignored during config.
		ignoredGamepadInputs : {
			"p1": [] ,
			"p2": [] ,
		},
		updateButtonStatus : function(){
			// Do not update if the gamepad config screen is not active.
			if( ! (JSGAME.GAMEPADS.CONFIG.DOM_elems.panel_config_gamepads.classList.contains("show")) ){
				// console.log("config window is not active.");
				return;
			}

			// let gamepads = JSGAME.GAMEPADS.gamepads;
			let gamepads = JSGAME.GAMEPADS.getSrcGamepads();
			let html ;
			// console.log("hi");

			for(let i1=0; i1<gamepads.length; i1+=1){
				// Only two gamepads are supported.
				if(i1==2){ break; }

				html = "";
				html+="<br>";

				// let thisPad = gamepads[i1].gamepad;
				let thisPad = gamepads[i1];

				// html+="AXES:<br>";
				for(let i2=0; i2<thisPad.axes.length; i2+=1){
					if(i2%2==0 && i2!=0){ html+="<br>"; }

					let name = "A:"+i2;
					let value = thisPad.axes[i2].toFixed(0);
					let sign = Math.sign( thisPad.axes[i2] );
					if(sign!=-1){ value = "+"+value; }

					// console.log(value, sign);

					let cssclass = "gamepad_buttonStatus ";

					let key = "p"+(i1+1);

					if     ( JSGAME.GAMEPADS.CONFIG.ignoredGamepadInputs[key].indexOf(name) != -1 ){
						cssclass += "ignored";
					}
					else if(value == 0){ cssclass += "inactive"; }
					else               { cssclass += "active";   }

					html+="<span padNum=\""+(i1+1)+"\" name=\""+name+"\" class=\""+cssclass+"\">A:"+i2+":"+(value).toString() + "</span>";
				}
				html+="<br>";
				html+="<br>";

				// html+="BUTTONS:<br>";
				for(let i3=0; i3<thisPad.buttons.length; i3+=1){
					if(i3%2==0 && i3!=0){ html+="<br>"; }

					let name = "B:"+i3;
					let value = (
						thisPad.buttons[i3].pressed ||
						thisPad.buttons[i3].touched ||
						thisPad.buttons[i3].value
					) ? 1 : 0;

					let cssclass = "gamepad_buttonStatus ";

					let key = "p"+(i1+1);

					if     ( JSGAME.GAMEPADS.CONFIG.ignoredGamepadInputs[key].indexOf(name) != -1 ){
						cssclass += "ignored";
					}
					else if(value == 0){ cssclass += "inactive"; }
					else               { cssclass += "active";   }

					html+="<span padNum=\""+(i1+1)+"\" name=\""+name+"\" class=\""+cssclass+"\">B:"+i3+":"+(value) + "</span>";
				}

				if     (i1==0){ JSGAME.GAMEPADS.CONFIG.DOM_elems.gamepad_buttonStatus1.innerHTML=html; }
				else if(i1==1){ JSGAME.GAMEPADS.CONFIG.DOM_elems.gamepad_buttonStatus2.innerHTML=html; }
			}
		},
		openview      : function(){
		},
		closeview     : function(){
		},
		set_ButtonAction:function(elem){
			return new Promise(function(res,rej){

				// Get some values (using the button.)
				let padnum = elem.getAttribute("padnum");
				let label  = elem.getAttribute("button");
				let button = elem.getAttribute("button");
				let tr     = elem.closest("tr");
				// let select = tr.querySelector("select");

				// Did the user click 'OK'?
				if(1){
					// Stop the next scan if one is scheduled.
					cancelAnimationFrame( JSGAME.GAMEPADS.CONFIG.raf_id_noGame );

					// Do a scan (will continue afterwards.)
					JSGAME.GAMEPADS.CONFIG.scan().then(function(data){
						// console.log(data);
						// Were no buttons pressed?
						if(data.length==0){
							res( { "msg":"NO_BUTTON", "btn":null } );
							return;
						}

						// Was more than one button pressed?
						else if(data.length>1){
							res( { "msg":"MULTIPLE_BUTTONS", "btn":null } );
							return;
						}

						// Only 1 button was pressed. (GOOD)
						else if(data.length==1){
							// select.value=data[0].text;
							res( { "msg":"ONE_BUTTON", "btn":data[0].text } );
						}
					});
				}
				else{ res( { "msg":"USER_CANCEL", "btn":null } ) ; }

			});

		},
		// Start the process of mapping ALL buttons to gamepad inputs.
		setAllButtonMappings : function(padNum){
			let conf = confirm("About to set ALL buttons for gamepad "+padNum+"\n\nClick 'OK' to continue.");
			if(!conf){ return; }

			//
			let section;
			if     (padNum==1){ section=JSGAME.GAMEPADS.CONFIG.DOM_elems.gamepads_buttonConfig1; }
			else if(padNum==2){ section=JSGAME.GAMEPADS.CONFIG.DOM_elems.gamepads_buttonConfig2; }
			else{ return; }

			// Get list of clickable buttons for this gamepad.
			let btns = section.querySelectorAll( "button[padnum='"+padNum+"']" );

			// JSGAME.GAMEPADS.CONFIG.determineIgnoredInputs(padNum);

			JSGAME.GAMEPADS.CONFIG.set_all_alreadyUsedButtons=[];

			let keys = Object.keys(btns);
			let i = 0;
			let len = keys.length;

			function iterate(){
				// Done? - It is done after i reaches the last button in the list.
				if( i >= len ){
					// console.log("We are done!");
					JSGAME.GAMEPADS.CONFIG.set_all_alreadyUsedButtons=[];
					return;
				}
				else{
					let btn = btns[i];

					// Add the CSS class of "yellowHighlight" to this button to indicate that it is the current button being set.
					btn.classList.add("yellowHighlight");

					// btn.onclick();
					let prom = JSGAME.GAMEPADS.CONFIG.set_ButtonAction( btn );
					prom.then(
						// If resolved.
						function(data){
							switch(data.msg){
								case "ONE_BUTTON"       : {
									// Only advance if this button has not already been used.
									if( JSGAME.GAMEPADS.CONFIG.set_all_alreadyUsedButtons.indexOf(data.btn) == -1 ){
										// Add to the list of used buttons.
										JSGAME.GAMEPADS.CONFIG.set_all_alreadyUsedButtons.push( data.btn );

										// Get a DOM handle onto this buttons's row's select.
										// Put the value into the select.
										let select = btn.closest("tr").querySelector("select");
										select.value=data.btn;

										// Remove the yellow highlight.
										btn.classList.remove("yellowHighlight");

										// Increment up to the next button.
										i+=1;

										// Request the next iteration.
										setTimeout(function(){
											requestAnimationFrame(iterate);
										}, 25);
									}
									else{
										requestAnimationFrame(iterate);
									}

									break;
								}
								case "NO_BUTTON"        : {                                                 requestAnimationFrame(iterate); break; }
								case "MULTIPLE_BUTTONS" : {                                                 requestAnimationFrame(iterate); break; }
								case "USER_CANCEL"      : { btn.classList.remove("yellowHighlight"); i=len; requestAnimationFrame(iterate); break; }
							};
						},

						// If rejected.
						function(data){ console.log("ERR:", data); }
					);
				}
			};
			iterate();
		},
		// (SAVE) Add button mappings for a gamepad.
		saveButtonMappings : function(padNum){
			let section;
			if     (padNum==1){ section=JSGAME.GAMEPADS.CONFIG.DOM_elems.gamepads_buttonConfig1; }
			else if(padNum==2){ section=JSGAME.GAMEPADS.CONFIG.DOM_elems.gamepads_buttonConfig2; }
			else{ return; }

			let data = {};
			let getData = function(label){
				let select = section.querySelector("table select[button='"+label+"']");
				let padNum = select.getAttribute("padnum");
				let button = select.getAttribute("button");
				let value = select.value;

				if(value=="NOT SET"){
					data[label] = {
						// "label" : label   ,
						"type"  : null    ,
						"index" : null    ,
						"true"  : null    ,
						"sign"  : null    ,
					};

					return;
				}

				let value_arr = value.split(":");
				// console.log(label, value);

				// "type": "buttons", "index": 1 , "true": 1 , "sign": "+"

				let type = value_arr[0];
				if     (type=="A"){ type = "axes" ; }
				else if(type=="B"){ type = "buttons" ; }
				else              { alert("An error has occurred." + value + label); return; }

				let index   = parseInt(value_arr[1],10)                 ;
				let trueVal = parseInt(value_arr[2],10)                 ;
				let sign    = Math.sign(value_arr[2]) == 1 ? "+" : "-"  ;

				data[label] = {
					// "label" : label   ,
					"type"  : type    ,
					"index" : index   ,
					"true"  : trueVal ,
					"sign"  : sign    ,
				};
			};

			getData("BTN_B")     ;
			getData("BTN_Y")     ;
			getData("BTN_START") ;
			getData("BTN_SELECT");
			getData("BTN_UP")    ;
			getData("BTN_DOWN")  ;
			getData("BTN_LEFT")  ;
			getData("BTN_RIGHT") ;
			getData("BTN_A")     ;
			getData("BTN_X")     ;
			getData("BTN_SL")    ;
			getData("BTN_SR")    ;

			// TO TEST/FIX: The padNum-1 might return the wrong index if gamepads are turned off and on.
			let mapkey=JSGAME.GAMEPADS.generateGamepadKey( navigator.getGamepads()[padNum-1]);

			let newObj = {
				"name":mapkey.name,
				"btnMap":data ,
			}

			// Update the in-RAM copy.
			JSGAME.GAMEPADS.gp_config_mappings[mapkey.map_key] = newObj ;

			// Update the H5LS copy.
			localStorage.setItem("JSGAME_gp_config_mappings", JSON.stringify(JSGAME.GAMEPADS.gp_config_mappings));

			// let conf = confirm("Are you sure that you want to clear the gamepad mappings that are stored in local storage?\n\nNOTE: The settings will remain in RAM until you refresh the browser window.");
			// if(conf){ localStorage.removeItem("JSGAME_gp_config_mappings"); }

			alert("Gamepad mappings saved to RAM and to H5LS!");

		},
		// Load additional button mappings from H5LS
		loadMappingsFromH5LS : function(){
			// Read the button mapping JSON from H5LS.
			let newJSON = JSON.parse( localStorage.getItem("JSGAME_gp_config_mappings") );
			if(!newJSON) { return; }

			// Get a list of all top-level keys in that JSON.
			let keys = Object.keys(newJSON);

			// Add the data to the in-RAM gp mappings.
			for(let i=0; i<keys.length; i+=1){
				// Get the key.
				var key = keys[i];

				// Set that key (overwrite if it already exists) with the new data.
				JSGAME.GAMEPADS.gp_config_mappings[key] = newJSON[key];
			}

			//
		},
		determineIgnoredInputs : function(padNum){
			// Get the key.
			let key = "p"+padNum;

			// Clear the array.
			JSGAME.GAMEPADS.CONFIG.ignoredGamepadInputs[key]=[];

			// Find all pressed buttons.
			let padButtons = document.querySelectorAll(".gamepad_buttonStatus[padNum='"+padNum+"'].active");

			// Add those pressed buttons to the ignore list.
			padButtons.forEach(function(d){
				JSGAME.GAMEPADS.CONFIG.ignoredGamepadInputs[key].push( d.getAttribute('name') );
			});

		},
		// USED???
		determineActiveButton : function(padNum){
			// JSGAME.GAMEPADS.CONFIG.determineActiveButton();

			// Get the key.
			// let key = "p"+padNum;

			// Clear the array.
			// JSGAME.GAMEPADS.CONFIG.ignoredGamepadInputs[key]=[];

			// Find all pressed buttons.
			let padButtons = document.querySelectorAll(".gamepad_buttonStatus[padNum='"+padNum+"'].active");

			// Add those pressed buttons to the ignore list.
			// padButtons.forEach(function(d){
			// 	JSGAME.GAMEPADS.CONFIG.ignoredGamepadInputs[key].push( d.getAttribute('name') );
			// });

			return padButtons;
		},

		// Called by requestAnimationFrame. Polls the gamepads for updates.
		scan          : function(){
			return new Promise(function(res,rej){

				// If gamepads were connected, hide the askForConnection and show the ConnectionFound.
				if( JSGAME.GAMEPADS.getSrcGamepads().length ){
					// If the connection found is not already showing (meaning: doesn't contain "hide".)
					if( JSGAME.GAMEPADS.CONFIG.DOM_elems.ConnectionFound.classList.contains("hide")){
						console.log("showing config screen.");

						// Hide the "ask for connection".
						JSGAME.GAMEPADS.CONFIG.DOM_elems.askForConnection.classList.add("hide");

						// Show the "Connection found".
						JSGAME.GAMEPADS.CONFIG.DOM_elems.ConnectionFound .classList.remove("hide");
					}
				}
				// Otherwise, show the askForConnection and hide the ConnectionFound.
				else{
					// If the connection found is already showing (meaning: contains "hide".)
					if( !JSGAME.GAMEPADS.CONFIG.DOM_elems.ConnectionFound.classList.contains("hide")){
						console.log("hiding config screen.");

						// Show the "ask for connection".
						JSGAME.GAMEPADS.CONFIG.DOM_elems.askForConnection.classList.remove("hide");

						// Hide the "Connection found".
						JSGAME.GAMEPADS.CONFIG.DOM_elems.ConnectionFound .classList.add("hide");
					}
				}

				// Look for new gamepads and adjust input.
				// JSGAME.GAMEPADS.handleInputs();

				// Request another animation frame only if the gamepad config screen is open.
				if(JSGAME.GAMEPADS.CONFIG.DOM_elems.panel_config_gamepads.classList.contains("show")){
					//
					JSGAME.GAMEPADS.CONFIG.updateButtonStatus();

					// let buttons = document.querySelectorAll(".gamepad_buttonStatus[padNum='1'].active");
					let buttons = document.querySelectorAll(".gamepad_buttonStatus.active");
					let arr = [];

					buttons.forEach(function(d){
						arr.push( {
							"padnum" : d.getAttribute("padnum") ,
							"name"   : d.getAttribute("name")   ,
							"text"   : d.innerText              ,
						})
					});

					res( arr );

					setTimeout(function(){
						JSGAME.GAMEPADS.CONFIG.raf_id_noGame = requestAnimationFrame( JSGAME.GAMEPADS.CONFIG.scan );
					}, 100);
				}
			});

			// JSGAME.GAMEPADS.CONFIG.raf_id_noGame = requestAnimationFrame( JSGAME.GAMEPADS.CONFIG.scan );
			// cancelAnimationFrame( JSGAME.GAMEPADS.CONFIG.raf_id_noGame );
		},
		//
		DOM_init : function(){
			if(JSGAME.GAMEPADS.CONFIG.initDone){ return ; }

			// Init the DOM CACHE.
			// JSGAME.GAMEPADS.CONFIG.DOM_elems.gp_blinker1_status       = document.getElementById("gp_blinker1_status");
			// JSGAME.GAMEPADS.CONFIG.DOM_elems.gp_blinker2_status       = document.getElementById("gp_blinker2_status");

			JSGAME.GAMEPADS.CONFIG.DOM_elems.panel_config_gamepads    = document.getElementById("panel_config_gamepads");

			JSGAME.GAMEPADS.CONFIG.DOM_elems.askForConnection         = document.getElementById("gamepad_askForConnection");
			JSGAME.GAMEPADS.CONFIG.DOM_elems.ConnectionFound          = document.getElementById("gamepad_ConnectionFound");

			JSGAME.GAMEPADS.CONFIG.DOM_elems.gamepad_buttonStatus1    = document.getElementById("gamepad_buttonStatus1");
			JSGAME.GAMEPADS.CONFIG.DOM_elems.gamepad_buttonStatus2    = document.getElementById("gamepad_buttonStatus2");

			JSGAME.GAMEPADS.CONFIG.DOM_elems.gamepads_buttonConfig1   = document.getElementById("gamepads_buttonConfig1");
			JSGAME.GAMEPADS.CONFIG.DOM_elems.gamepads_buttonConfig2   = document.getElementById("gamepads_buttonConfig2");

			JSGAME.GAMEPADS.CONFIG.DOM_elems.gamepadIcon_container_p1 = document.getElementById("gamepadIcon_container_p1");
			JSGAME.GAMEPADS.CONFIG.DOM_elems.gamepadIcon_container_p2 = document.getElementById("gamepadIcon_container_p2");

			JSGAME.GAMEPADS.CONFIG.DOM_elems.gamepads_gp1_all  = document.getElementById("gamepads_gp1_all");
			JSGAME.GAMEPADS.CONFIG.DOM_elems.gamepads_gp2_all  = document.getElementById("gamepads_gp2_all");

			// console.log( "JSGAME.GAMEPADS.CONFIG.DOM_elems:", JSGAME.GAMEPADS.CONFIG.DOM_elems);

			function createTable(padNum){
				let btn_strings = [
					"BTN_UP"     ,
					"BTN_DOWN"   ,
					"BTN_LEFT"   ,
					"BTN_RIGHT"  ,
					"BTN_A"      ,
					"BTN_B"      ,
					"BTN_Y"      ,
					"BTN_X"      ,
					"BTN_SL"     ,
					"BTN_SR"     ,
					"BTN_SELECT" ,
					"BTN_START"  ,
				];

				let gp_input_strings = [
					// UNSET
					"NOT SET",

					// 8 Axes. Activated is either -1 or 1.
					"A:0:+1"  , "A:0:-1"  ,
					"A:1:+1"  , "A:1:-1"  ,
					"A:2:+1"  , "A:2:-1"  ,
					"A:3:+1"  , "A:3:-1"  ,
					"A:4:+1"  , "A:4:-1"  ,
					"A:5:+1"  , "A:5:-1"  ,
					"A:6:+1"  , "A:6:-1"  ,
					"A:7:+1"  , "A:7:-1"  ,
					"A:8:+1"  , "A:8:-1"  ,
					"A:9:+1"  , "A:9:-1"  ,
					"A:10:+1" , "A:10:-1" ,

					// 16 buttons. Activated is 1.
					"B:0:1"   , "B:1:1"  ,
					"B:2:1"   , "B:3:1"  ,
					"B:4:1"   , "B:5:1"  ,
					"B:6:1"   , "B:7:1"  ,
					"B:8:1"   , "B:9:1"  ,
					"B:10:1"  , "B:11:1" ,
					"B:12:1"  , "B:13:1" ,
					"B:14:1"  , "B:15:1" ,
				];

				function createSelect(label, tr){
					let select = document.createElement("select");
					select.setAttribute("padNum", padNum);
					select.setAttribute("button", label);

					let frag = document.createDocumentFragment();

					for(let i=0; i<gp_input_strings.length; i+=1){
						let option = document.createElement("option");
						option.value = gp_input_strings[i];
						option.text  = gp_input_strings[i];
						option.setAttribute("padNum", padNum);
						option.setAttribute("button", label);
						frag.appendChild(option);
					}

					select.appendChild(frag);

					return select;
				}
				function createActionButton(label, tr){
					let button = document.createElement("button");

					// button.innerText="SET ("+label+")";
					button.innerText="SET";
					button.setAttribute("padNum", padNum);
					button.setAttribute("button", label);
					button.onclick=function(){
						// Add the yellow highlight.
						button.classList.add("yellowHighlight");

						// The timeout is needed to have the screen actually reflect the yellow highlighting.
						setTimeout(function(){
							// Ask the user.
							let cnfrm = confirm(
								"SETTING: '" + label + "'" + " ON PAD: " + padNum +
								"\n\nHold the '" + label + "' button on the gamepad " + padNum + " while clicking 'OK'."
								);

							if(cnfrm){
								JSGAME.GAMEPADS.CONFIG.set_ButtonAction(button).then(
									function(data){
										let select=button.closest("tr").querySelector("select");
										select.value=data.btn;
										button.classList.remove("yellowHighlight");
									},
									function(data){ console.log("data", data); }
								);
							}
							else{ button.classList.remove("yellowHighlight"); }
						}, 100);

					};
					// button.onclick=function(){ JSGAME.GAMEPADS.CONFIG.set_ButtonAction(button); };
					return button;

					// button.onclick=function(){
					// 	// return new Promise(function(res,rej){
					// 		let cnfrm = confirm(
					// 			"SETTING: '" + label + "'" + " ON PAD: " + padNum +
					// 			"\n\nHold the '" + label + "' button on the gamepad " + padNum + " while clicking 'OK'."
					// 		);

					// 		if(cnfrm){
					// 			// Stop the next scan if one is scheduled.
					// 			cancelAnimationFrame( JSGAME.GAMEPADS.CONFIG.raf_id_noGame );
					// 			// JSGAME.GAMEPADS.CONFIG.raf_id_noGame = requestAnimationFrame( JSGAME.GAMEPADS.CONFIG.scan );

					// 			// Do a scan (will continue afterwards.)
					// 			JSGAME.GAMEPADS.CONFIG.scan().then(function(res){
					// 				// console.log(res.length, "YAY!", res, label, tr, tr.querySelector("select") );

					// 				// Were no buttons pressed?
					// 				if(res.length==0){ return;  }

					// 				// Was more than one button pressed?
					// 				else if(res.length>1){ return; }

					// 				// GOOD.
					// 				else{ tr.querySelector("select").value=res[0].text; }

					// 			});

					// 		}
					// 		else{}

					// 	// });
					// };

					// return button;
				};

				let table = document.createElement("table");
				table.setAttribute("padNum", padNum);
				let frag  = document.createDocumentFragment();

				// Create header row.
				for(let i=0; i<1; i+=1){
					var temp_tr   = document.createElement("tr");
					var temp_th1  = document.createElement("th"); temp_tr.appendChild(temp_th1); //
					var temp_th2  = document.createElement("th"); temp_tr.appendChild(temp_th2); //
					var temp_th3  = document.createElement("th"); temp_tr.appendChild(temp_th3); //

					temp_th1.innerHTML="BUTTON";
					temp_th2.innerHTML="ACTION";
					temp_th3.innerHTML="VALUE" ;

					frag.appendChild(temp_tr);
				}

				// Create button rows.
				for(let i=0; i<btn_strings.length; i+=1){
					var temp_tr   = document.createElement("tr");
					var temp_td1  = document.createElement("td"); temp_tr.appendChild(temp_td1); //
					var temp_td2  = document.createElement("td"); temp_tr.appendChild(temp_td2); //
					var temp_td3  = document.createElement("td"); temp_tr.appendChild(temp_td3); //

					temp_td1.innerHTML=btn_strings[i].split("_")[1];
					temp_td2.appendChild( createActionButton( btn_strings[i], temp_tr ) ) ;
					temp_td3.appendChild( createSelect( btn_strings[i], temp_tr ) ) ;

					frag.appendChild(temp_tr);
				}

				table.appendChild(frag);

				return table;
			}
			function createControls(padNum){
				// Create control rows.
				let div = document.createElement("div");
				div.setAttribute("id"   , "gamepads_buttonControls_"+padNum);
				div.setAttribute("class", "gamepads_buttonControls");

				let frag = document.createDocumentFragment();
				let btn;

				// Ignored inputs.
				btn = document.createElement("button");
				btn.innerText="FILTER";
				btn.title="Use this if buttons appear to be *stuck* when there is no input.";
				btn.onclick=function(){ JSGAME.GAMEPADS.CONFIG.determineIgnoredInputs(padNum); };
				frag.appendChild(btn);

				// Save.
				btn = document.createElement("button");
				btn.innerText="SAVE";
				btn.title="Save the changes to RAM and to H5LS.";
				btn.onclick=function(){ JSGAME.GAMEPADS.CONFIG.saveButtonMappings(padNum); };
				frag.appendChild(btn);

				// Set all.
				btn = document.createElement("button");
				btn.innerText="SET ALL";
				btn.title="Set all buttons in order.";
				btn.onclick=function(){ JSGAME.GAMEPADS.CONFIG.setAllButtonMappings(padNum); };
				frag.appendChild(btn);

				div.appendChild(frag);

				return div;
			}

			let table1    = createTable(1)   ;
			let controls1 = createControls(1);
			let table2    = createTable(2)   ;
			let controls2 = createControls(2);

			JSGAME.GAMEPADS.CONFIG.DOM_elems.gamepads_buttonConfig1.appendChild(table1);
			JSGAME.GAMEPADS.CONFIG.DOM_elems.gamepads_gp1_all.appendChild(controls1);

			JSGAME.GAMEPADS.CONFIG.DOM_elems.gamepads_buttonConfig2.appendChild(table2);
			JSGAME.GAMEPADS.CONFIG.DOM_elems.gamepads_gp2_all.appendChild(controls2);
		},

		// INIT: USE JUST ONCE AND DESTROY.
		// JSGAME.GAMEPADS.init
		init          : function(){
			// return;
			// Bail if there is not gamepad support.
			if(!JSGAME.FLAGS.support_gamepadAPI){ return; }

			// Only allow the init to run one time.
			if(!JSGAME.GAMEPADS.CONFIG.initDone){
				// Load mappings from H5LS.
				JSGAME.GAMEPADS.CONFIG.loadMappingsFromH5LS();

				let DOM_listeners=function(){
					// Init the DOM EVENT LISTENERS
				}

				JSGAME.GAMEPADS.CONFIG.DOM_init();
				DOM_listeners();

				// Set the init flag.
				JSGAME.GAMEPADS.CONFIG.initDone=true;
				// JSGAME.GAMEPADS.CONFIG.initDone=false;

				// DELETE THIS INIT FUNCTION.
				delete JSGAME.GAMEPADS.CONFIG.init ;
				delete JSGAME.GAMEPADS.CONFIG.DOM_init ;

				// console.log("running first gamepad scan...");
				JSGAME.GAMEPADS.CONFIG.raf_id_noGame = requestAnimationFrame( JSGAME.GAMEPADS.CONFIG.scan );

				// console.log("GAMEPAD INIT DONE. 1");
			}
			else{ console.log("********************************** gamepad init already done!"); }
			// console.log("GAMEPAD INIT DONE. 2");

		},

	},

	// *** CORE ***

	gamepads              : []    , // An array of parsed gamepad objects.
	swapGamepads          : false , // Not implemented yet.
	p1_needs_mapping      : false , //
	p2_needs_mapping      : false , //
	gamepad_p1_isSet      : false , //
	gamepad_p2_isSet      : false , //
	totalNumGamepadsReady : 0     , //

	// * Used in translation of Uzebox buttons to their bit position and the key the browser needs to send to get that button pressed in CUzeBox.
	uzeBox_gamepad_mapping : {
                                                            // NOBUTTONS  decimal: 0   , binary: 0000000000000000, HEX: 0x0000, bitWise:  0 << 0
		"BTN_B"      : { "key":"key_A"     , "bitPos":0  }, // BTN_B      decimal: 1   , binary: 0000000000000001, HEX: 0x0001, bitWise:  1 << 0
		"BTN_Y"      : { "key":"key_Q"     , "bitPos":1  }, // BTN_Y      decimal: 2   , binary: 0000000000000010, HEX: 0x0002, bitWise:  1 << 1
		"BTN_SELECT" : { "key":"key_SPACE" , "bitPos":2  }, // BTN_SELECT decimal: 4   , binary: 0000000000000100, HEX: 0x0004, bitWise:  1 << 2
		"BTN_START"  : { "key":"key_ENTER" , "bitPos":3  }, // BTN_START  decimal: 8   , binary: 0000000000001000, HEX: 0x0008, bitWise:  1 << 3
		"BTN_UP"     : { "key":"key_UP"    , "bitPos":4  }, // BTN_UP     decimal: 16  , binary: 0000000000010000, HEX: 0x0010, bitWise:  1 << 4
		"BTN_DOWN"   : { "key":"key_DOWN"  , "bitPos":5  }, // BTN_DOWN   decimal: 32  , binary: 0000000000100000, HEX: 0x0020, bitWise:  1 << 5
		"BTN_LEFT"   : { "key":"key_LEFT"  , "bitPos":6  }, // BTN_LEFT   decimal: 64  , binary: 0000000001000000, HEX: 0x0040, bitWise:  1 << 6
		"BTN_RIGHT"  : { "key":"key_RIGHT" , "bitPos":7  }, // BTN_RIGHT  decimal: 128 , binary: 0000000010000000, HEX: 0x0080, bitWise:  1 << 7
		"BTN_A"      : { "key":"key_S"     , "bitPos":8  }, // BTN_A      decimal: 256 , binary: 0000000100000000, HEX: 0x0100, bitWise:  1 << 8
		"BTN_X"      : { "key":"key_W"     , "bitPos":9  }, // BTN_X      decimal: 512 , binary: 0000001000000000, HEX: 0x0200, bitWise:  1 << 9
		"BTN_SL"     : { "key":"key_RSHIFT", "bitPos":10 }, // BTN_SL     decimal: 1024, binary: 0000010000000000, HEX: 0x0400, bitWise:  1 << 10
		"BTN_SR"     : { "key":"key_LSHIFT", "bitPos":11 }, // BTN_SR     decimal: 2048, binary: 0000100000000000, HEX: 0x0800, bitWise:  1 << 11
	},

	// Built-in gamepad mappings.
	// 2820:0009 : SNES30 v 2.68 (bluetooth)
	// 2dc8:ab20 : SNES30 v 4.20 (wired)
	// 05ac:111d : Gamepad (bluetooth)
	// 2dc8:2840 : SNES30 v 4.20 (bluetooth)

	// Firefox/Chrome/Opera on Linux/Windows : Can parse the id and get vendor and device ids as keys.
	// Chrome/Opera on Android               : The id is the name of the controller. Vendor and device ids are unavailable.

	gp_config_mappings     : {
		"2dc8:2840:8Bitdo SNES30 GamePad" : {
			"name" : "8Bitdo SNES30 GamePad",
			"btnMap" : {
				"BTN_B"      : { "type" : "buttons" , "index" : 1  , "true" : 1  , "sign" : "+" } ,
				"BTN_Y"      : { "type" : "buttons" , "index" : 4  , "true" : 1  , "sign" : "+" } ,
				"BTN_START"  : { "type" : "buttons" , "index" : 11 , "true" : 1  , "sign" : "+" } ,
				"BTN_SELECT" : { "type" : "buttons" , "index" : 10 , "true" : 1  , "sign" : "+" } ,
				"BTN_UP"     : { "type" : "axes"    , "index" : 1  , "true" : -1 , "sign" : "-" } ,
				"BTN_DOWN"   : { "type" : "axes"    , "index" : 1  , "true" : 1  , "sign" : "+" } ,
				"BTN_LEFT"   : { "type" : "axes"    , "index" : 0  , "true" : -1 , "sign" : "-" } ,
				"BTN_RIGHT"  : { "type" : "axes"    , "index" : 0  , "true" : 1  , "sign" : "+" } ,
				"BTN_A"      : { "type" : "buttons" , "index" : 0  , "true" : 1  , "sign" : "+" } ,
				"BTN_X"      : { "type" : "buttons" , "index" : 3  , "true" : 1  , "sign" : "+" } ,
				"BTN_SL"     : { "type" : "buttons" , "index" : 6  , "true" : 1  , "sign" : "+" } ,
				"BTN_SR"     : { "type" : "buttons" , "index" : 7  , "true" : 1  , "sign" : "+" }
			}
		},
		"::8Bitdo SNES30 GamePad" : {
			"name" : "8Bitdo SNES30 GamePad",
			"btnMap" : {
				"BTN_B"      : { "type" : "buttons" , "index" : 1  , "true" : 1  , "sign" : "+" } ,
				"BTN_Y"      : { "type" : "buttons" , "index" : 3  , "true" : 1  , "sign" : "+" } ,
				"BTN_START"  : { "type" : "buttons" , "index" : 9  , "true" : 1  , "sign" : "+" } ,
				"BTN_SELECT" : { "type" : "buttons" , "index" : 8  , "true" : 1  , "sign" : "+" } ,
				"BTN_UP"     : { "type" : "axes"    , "index" : 1  , "true" : -1 , "sign" : "-" } ,
				"BTN_DOWN"   : { "type" : "axes"    , "index" : 1  , "true" : 1  , "sign" : "+" } ,
				"BTN_LEFT"   : { "type" : "axes"    , "index" : 0  , "true" : -1 , "sign" : "-" } ,
				"BTN_RIGHT"  : { "type" : "axes"    , "index" : 0  , "true" : 1  , "sign" : "+" } ,
				"BTN_A"      : { "type" : "buttons" , "index" : 0  , "true" : 1  , "sign" : "+" } ,
				"BTN_X"      : { "type" : "buttons" , "index" : 2  , "true" : 1  , "sign" : "+" } ,
				"BTN_SL"     : { "type" : "buttons" , "index" : 4  , "true" : 1  , "sign" : "+" } ,
				"BTN_SR"     : { "type" : "buttons" , "index" : 5  , "true" : 1  , "sign" : "+" }
			}
		} ,
		"05ac:111d:Gamepad" : {
			"name" : "Gamepad",
			"btnMap" : {
				"BTN_B"      : { "type" : "buttons" , "index" : 0  , "true" : 1  , "sign" : "+" } ,
				"BTN_Y"      : { "type" : "buttons" , "index" : 3  , "true" : 1  , "sign" : "+" } ,
				"BTN_START"  : { "type" : "buttons" , "index" : 11 , "true" : 1  , "sign" : "+" } ,
				"BTN_SELECT" : { "type" : "buttons" , "index" : 10 , "true" : 1  , "sign" : "+" } ,
				"BTN_UP"     : { "type" : "axes"    , "index" : 7  , "true" : -1 , "sign" : "-" } ,
				"BTN_DOWN"   : { "type" : "axes"    , "index" : 7  , "true" : 1  , "sign" : "+" } ,
				"BTN_LEFT"   : { "type" : "axes"    , "index" : 6  , "true" : -1 , "sign" : "-" } ,
				"BTN_RIGHT"  : { "type" : "axes"    , "index" : 6  , "true" : 1  , "sign" : "+" } ,
				"BTN_A"      : { "type" : "buttons" , "index" : 1  , "true" : 1  , "sign" : "+" } ,
				"BTN_X"      : { "type" : "buttons" , "index" : 4  , "true" : 1  , "sign" : "+" } ,
				"BTN_SL"     : { "type" : "buttons" , "index" : 6  , "true" : 1  , "sign" : "+" } ,
				"BTN_SR"     : { "type" : "buttons" , "index" : 7  , "true" : 1  , "sign" : "+" }
			}
		}
	},

	// gp_config_mappings     :{},

	//
	utility : {
		// * Used with .filter (after .map) to remove undefined arrays from .map.
		removeUndefines       : function(d) {
			if( d != undefined ) { return true;  }
			else                 { return false; }
		},
		// Returns all keys or the specified key within gp_config_mappings. Also, option to download as JSON text.
		getFormatted_gp_mappings : function(downloadFile, specifiedKey){
			// EXAMPLE USAGE:
			// Return one key.               JSGAME.GAMEPADS.utility.getFormatted_gp_mappings(false, "2820:0009");
			// Return and download one key.  JSGAME.GAMEPADS.utility.getFormatted_gp_mappings(true, "2820:0009");
			// Return and download all keys. JSGAME.GAMEPADS.utility.getFormatted_gp_mappings(true);
			// Return all keys.              JSGAME.GAMEPADS.utility.getFormatted_gp_mappings(false);

			let keys1 ;

			// Was a specific key specified?
			if(specifiedKey && JSGAME.GAMEPADS.gp_config_mappings[specifiedKey]){ keys1 = [specifiedKey] ; }
			else                                                                { keys1 = Object.keys(JSGAME.GAMEPADS.gp_config_mappings); }

			let output = "";
			output += "{\n\n";

			for(let i=0; i<keys1.length; i+=1){
				let key1 = keys1[i];
				let mapping = JSGAME.GAMEPADS.gp_config_mappings[key1];
				let name = mapping.name;
				let keys2 = Object.keys(mapping.btnMap);
				output += "\t" + '"'+key1+'" : {\n' ;
				output += "\t\t" + '"name" : "'+name+'",\n' ;
				output += "\t\t" + '"btnMap" : {\n' ;

				for(let i2=0; i2<keys2.length; i2+=1){
					let key2 = keys2[i2];
					let thisButtonMap = mapping.btnMap[key2];
					let prop_type  = '"type" : '  + '"' + thisButtonMap["type"]  + '"' ; // 14
					let prop_index = '"index" : ' + ''  + thisButtonMap["index"] + ' ' ; // 10
					let prop_true  = '"true" : '  + ''  + thisButtonMap["true"]  + ' ' ; // 9
					let prop_sign  = '"sign" : '  + '"' + thisButtonMap["sign"]  + '"' ; // 8

					output += "\t\t\t"+'"'+key2+'" '+( ''.padEnd(10-key2.length, ' '))+': { ' ;
					output += prop_type .padEnd(19, ' ' )  + ", ";
					output += prop_index.padEnd(13, ' ' )  + ", ";
					output += prop_true .padEnd(12, ' ' )  + ", ";
					output += prop_sign .padEnd(12, ' ' )   + " " ;
					if((i2+1)==keys2.length){ output += "}\n\t\t}\n"; }
					else                    { output += "} ,\n";}
				}
				if((i+1)==keys1.length) { output += "\t} \n"; }
				else                    { output += "\t},\n"; }

			}

			output += "\n}";

			// Was download specified?
			if(downloadFile){
				let finish = function(){
					// Create the data blob.
					var blob3 = new Blob(  [output]  , {type: "text/plain;charset=utf-8"});

					// Send the file to the user.
					saveAs(blob3, "gp_mappings_json.json");
				};

				// Is FileSaver available?
				if( typeof saveAs=="undefined" ){
					let script = document.createElement("script");
					script.onload = function(){ script.onload=null; finish(); };
					script.src = "libs/FileSaver.min.js";
					document.body.appendChild(script);
				}
				// Yes, it is available. Use it to download the file.
				else{ finish(); }
			}
			console.log(output.length);
			console.log(JSON.stringify(output,null,0).length);

			// Return the text output.
			return output;
		},
	},

	// * Returns an object with the unique identifiers for a specified gamepad instance.
	generateGamepadKey : function(thisPad){
		// Get the vendor and product id.
		let ff_id = thisPad.id.split("-").map(function(d,i,a){ return d.trim();} );
		let cr_id = thisPad.id.split(":").map(function(d,i,a){ return d.trim();} );
		let vendor  = "";
		let product = "";
		let name    = "";
		let map_key = "";

		// Is this a Firefox id string?
		if(ff_id.length==3){
			vendor  = ff_id[0].trim();
			product = ff_id[1].trim();
			name    = ff_id[2].trim();

			// Put together what the mapping key would be for this controller.
			map_key = vendor+":"+product+":"+name;
		}
		// Is this a Chrome id string?
		else if(cr_id.length==3){
			// Need to clean up the string first.
			name    = cr_id[0].split("(")[0].trim();
			vendor  = cr_id[1].split(" Product")[0].trim();
			product = cr_id[2].split(")")[0].trim();

			// Put together what the mapping key would be for this controller.
			map_key = vendor+":"+product+":"+name;
		}
		// Android and Chrome/Opera with bluetooth gamepad? The id is the full name of the gamepad.
		else {
			// Need to clean up the string first.
			name    = thisPad.id ;
			vendor  = "" ;
			product = "" ;

			// Put together what the mapping key would be for this controller.
			map_key = vendor+":"+product+":"+name;
		}

		return {
			"name"   :name   ,
			"vendor" :vendor ,
			"product":product,
			"map_key":map_key,
		};

	},
	// * Gets a raw copy of navigator.gamepads() and strips out any null or blank values.
	getSrcGamepads      : function(){
		// Get the gamepad info. There are many different ways. Use the first one that returns data.
		let raw_gamepads = navigator.getGamepads ? navigator.getGamepads() : [] ;

		// Create blank array for the src_gamepads.
		let src_gamepads=[];

		// Copy the raw_gamepads into src_gamepads.
		for(let i=0; i<raw_gamepads.length; i+=1){
			// Is this actually a gamepad object? If not then don't add it.
			// console.log("typeof raw_gamepads[i]:", typeof raw_gamepads[i], raw_gamepads[i], !raw_gamepads[i]);
			if     ("undefined"     == typeof raw_gamepads[i]){ continue; }
			else if(raw_gamepads[i] == null                  ){ continue; }
			else if(!raw_gamepads[i]                         ){ continue; }

			// Add the gamepad. Use the same index value as indicated by the gamepad data.
			// console.log("adding:", raw_gamepads[i], raw_gamepads[i].index);
			if(raw_gamepads[i]) { src_gamepads[ raw_gamepads[i].index ] = raw_gamepads[i] ; }
		}

		// Any empty indexes can mess us up. Return the array WITHOUT empty indexes.
		src_gamepads = src_gamepads.map(function(d,i,a){ return d; }).filter( JSGAME.GAMEPADS.utility.removeUndefines );
		return src_gamepads;
	},
	// * Send the specified key from the specified player gamepad.
	sendNewKey : function(i, btnPressed, btnReleased){
		// If the button was pressed or held then send a keydown event.
		// If the button was released then send a keyup event.

		if     ( btnPressed  & JSGAME.consts.BTN_B     ) { JSGAME.GUI.userInput("keydown", "BTN_B"      , i+1); }
		else if( btnReleased & JSGAME.consts.BTN_B     ) { JSGAME.GUI.userInput("keyup"  , "BTN_B"      , i+1); }

		if     ( btnPressed  & JSGAME.consts.BTN_A     ) { JSGAME.GUI.userInput("keydown", "BTN_A"      , i+1); }
		else if( btnReleased & JSGAME.consts.BTN_A     ) { JSGAME.GUI.userInput("keyup"  , "BTN_A"      , i+1); }

		if     ( btnPressed  & JSGAME.consts.BTN_Y     ) { JSGAME.GUI.userInput("keydown", "BTN_Y"      , i+1); }
		else if( btnReleased & JSGAME.consts.BTN_Y     ) { JSGAME.GUI.userInput("keyup"  , "BTN_Y"      , i+1); }

		if     ( btnPressed  & JSGAME.consts.BTN_X     ) { JSGAME.GUI.userInput("keydown", "BTN_X"      , i+1); }
		else if( btnReleased & JSGAME.consts.BTN_X     ) { JSGAME.GUI.userInput("keyup"  , "BTN_X"      , i+1); }

		if     ( btnPressed  & JSGAME.consts.BTN_SL    ) { JSGAME.GUI.userInput("keydown", "BTN_SL"     , i+1); }
		else if( btnReleased & JSGAME.consts.BTN_SL    ) { JSGAME.GUI.userInput("keyup"  , "BTN_SL"     , i+1); }

		if     ( btnPressed  & JSGAME.consts.BTN_SR    ) { JSGAME.GUI.userInput("keydown", "BTN_SR"     , i+1); }
		else if( btnReleased & JSGAME.consts.BTN_SR    ) { JSGAME.GUI.userInput("keyup"  , "BTN_SR"     , i+1); }

		if     ( btnPressed  & JSGAME.consts.BTN_SELECT) { JSGAME.GUI.userInput("keydown", "BTN_SELECT" , i+1); }
		else if( btnReleased & JSGAME.consts.BTN_SELECT) { JSGAME.GUI.userInput("keyup"  , "BTN_SELECT" , i+1); }

		if     ( btnPressed  & JSGAME.consts.BTN_START ) { JSGAME.GUI.userInput("keydown", "BTN_START"  , i+1); }
		else if( btnReleased & JSGAME.consts.BTN_START ) { JSGAME.GUI.userInput("keyup"  , "BTN_START"  , i+1); }

		if     ( btnPressed  & JSGAME.consts.BTN_RIGHT ) { JSGAME.GUI.userInput("keydown", "BTN_RIGHT"  , i+1); }
		else if( btnReleased & JSGAME.consts.BTN_RIGHT ) { JSGAME.GUI.userInput("keyup"  , "BTN_RIGHT"  , i+1); }

		if     ( btnPressed  & JSGAME.consts.BTN_LEFT  ) { JSGAME.GUI.userInput("keydown", "BTN_LEFT"   , i+1); }
		else if( btnReleased & JSGAME.consts.BTN_LEFT  ) { JSGAME.GUI.userInput("keyup"  , "BTN_LEFT"   , i+1); }

		if     ( btnPressed  & JSGAME.consts.BTN_DOWN  ) { JSGAME.GUI.userInput("keydown", "BTN_DOWN"   , i+1); }
		else if( btnReleased & JSGAME.consts.BTN_DOWN  ) { JSGAME.GUI.userInput("keyup"  , "BTN_DOWN"   , i+1); }

		if     ( btnPressed  & JSGAME.consts.BTN_UP    ) { JSGAME.GUI.userInput("keydown", "BTN_UP"     , i+1); }
		else if( btnReleased & JSGAME.consts.BTN_UP    ) { JSGAME.GUI.userInput("keyup"  , "BTN_UP"     , i+1); }
	},
	// * Update the local cache of gamepad objects.
	getNewGamepadStates : function(){
		let src_gamepads = JSGAME.GAMEPADS.getSrcGamepads();

		// Clear the "active" flag on each of the known gamepads.
		for(let i=0; i<JSGAME.GAMEPADS.gamepads.length; i+=1){
			let thisPad=JSGAME.GAMEPADS.gamepads[i];
			if( thisPad     == undefined     ) { continue; }
			if( "undefined" == typeof thisPad) { continue; }
			if( thisPad     == null          ) { continue; }
			if(!thisPad                      ) { continue; }
			thisPad.active=0;
		}

		// Do we swap the gamepad read order?
		if(JSGAME.GAMEPADS.swapGamepads==1){ src_gamepads = src_gamepads.reverse(); }

		// Create the data for new gamepads or update the gamepad key on the known gamepads.
		for(let i=0; i<src_gamepads.length; i+=1){
			let thisPad = src_gamepads[i];

			// Make sure that the gamepad is actually there.
			try{ thisPad.index; }
			catch(e){ console.log(i, "ERROR:", e); continue;}

			// NEW GAMEPAD: Is this an unconfigured gamepad? Configure it.
			if(
				!JSGAME.GAMEPADS.gamepads[thisPad.index] && // No data entry at this index.
				thisPad.id                               // And the src has data.
			){
				let newMapping=undefined;
				let map_obj  = JSGAME.GAMEPADS.generateGamepadKey(thisPad);
				let map_key  = map_obj.map_key;
				let map_name = map_obj.name;

				// Find the gamepad mapping:
				if( JSGAME.GAMEPADS.gp_config_mappings.hasOwnProperty(map_key) != -1){
					// Assign the map.
					newMapping=JSGAME.GAMEPADS.gp_config_mappings[map_key];
				}

				// We don't already have a mapping for this gamepad. Did the user load a mapping?
				if(newMapping==undefined){
					// Cannot use this gamepad. A map must be created for it first.

					// Which gamepad would this be?
					let p1=JSGAME.GAMEPADS.gamepads.filter(function(d,i,a){ return d.player==1; });
					let p2=JSGAME.GAMEPADS.gamepads.filter(function(d,i,a){ return d.player==2; });

					// console.log(
					// 	"p1 found:", p1.length?"true ":"false",
					// 	"p2 found:", p2.length?"true ":"false",
					// );

					if   (!p1.length && JSGAME.GAMEPADS.p1_needs_mapping==false){
						// console.log("Player 1 gamepad needs mapping.");
						JSGAME.GAMEPADS.p1_needs_mapping=true;
						JSGAME.GAMEPADS.CONFIG.DOM_elems.gamepadIcon_container_p1.classList.remove("neverConnected");
						JSGAME.GAMEPADS.CONFIG.DOM_elems.gamepadIcon_container_p1.classList.add("known");
						JSGAME.GAMEPADS.CONFIG.DOM_elems.gamepadIcon_container_p1.classList.add("unconfigured");
						JSGAME.GAMEPADS.CONFIG.DOM_elems.gamepadIcon_container_p1.classList.remove("connected");
					}
					// else if(thisPad.index==1){
					if(!p2.length && JSGAME.GAMEPADS.p2_needs_mapping==false){
						// console.log("Player 2 gamepad needs mapping.");
						JSGAME.GAMEPADS.p2_needs_mapping=true;
						JSGAME.GAMEPADS.CONFIG.DOM_elems.gamepadIcon_container_p2.classList.remove("neverConnected");
						JSGAME.GAMEPADS.CONFIG.DOM_elems.gamepadIcon_container_p2.classList.add("known");
						JSGAME.GAMEPADS.CONFIG.DOM_elems.gamepadIcon_container_p2.classList.add("unconfigured");
						JSGAME.GAMEPADS.CONFIG.DOM_elems.gamepadIcon_container_p2.classList.remove("connected");
					}

					// Visually indicate this is unconfigured.
					// gamepadIcon_container_p1 .classList.add("unconfigured");
				}
				else{
					// Add the new gamepad.
					JSGAME.GAMEPADS.gamepads[ thisPad.index ] = {
						"gamepad"       : thisPad   ,
						"btnMap"        : newMapping,
						"btnPrev"       : 0         ,
						"lastTimestamp" : 0         ,
						"active"        : 1         ,
						"prevActive"    : 1         ,
					};

					let newPlayerNumber = undefined;

					// Configure the displayed gamepad statuses.
					if      (JSGAME.GAMEPADS.totalNumGamepadsReady==0){
						JSGAME.GAMEPADS.gamepad_p1_isSet=1;
						JSGAME.GAMEPADS.gamepads[ thisPad.index ].player=0;
						JSGAME.GAMEPADS.totalNumGamepadsReady++;
						newPlayerNumber=1;
						JSGAME.GAMEPADS.p1_needs_mapping=false;
						JSGAME.GAMEPADS.CONFIG.DOM_elems.gamepadIcon_container_p1.title = map_name + " ("+map_key+", Index:"+thisPad.index+", Player "+newPlayerNumber+")";
						JSGAME.GAMEPADS.CONFIG.DOM_elems.gamepadIcon_container_p1.classList.remove("neverConnected");
						JSGAME.GAMEPADS.CONFIG.DOM_elems.gamepadIcon_container_p1.classList.add("known");
						JSGAME.GAMEPADS.CONFIG.DOM_elems.gamepadIcon_container_p1.classList.remove("unconfigured");
						JSGAME.GAMEPADS.CONFIG.DOM_elems.gamepadIcon_container_p1.classList.add("connected");
					}
					else if (JSGAME.GAMEPADS.totalNumGamepadsReady==1){
						JSGAME.GAMEPADS.gamepad_p2_isSet=1;
						JSGAME.GAMEPADS.gamepads[ thisPad.index ].player=1;
						JSGAME.GAMEPADS.totalNumGamepadsReady++;
						newPlayerNumber=2;
						JSGAME.GAMEPADS.p2_needs_mapping=false;
						JSGAME.GAMEPADS.CONFIG.DOM_elems.gamepadIcon_container_p2.title = map_name + " ("+map_key+", Index:"+thisPad.index+", Player "+newPlayerNumber+")";
						JSGAME.GAMEPADS.CONFIG.DOM_elems.gamepadIcon_container_p2.classList.remove("neverConnected");
						JSGAME.GAMEPADS.CONFIG.DOM_elems.gamepadIcon_container_p2.classList.add("known");
						JSGAME.GAMEPADS.CONFIG.DOM_elems.gamepadIcon_container_p2.classList.remove("unconfigured");
						JSGAME.GAMEPADS.CONFIG.DOM_elems.gamepadIcon_container_p2.classList.add("connected");
					}

					console.log(
						"Gamepad found!",
						"||| Index:"  , thisPad.index   ,
						"||| Player:" , newPlayerNumber ,
						"||| id:"     , thisPad.id      ,
						"||| map_key:", map_key         ,
						" |||"
					);

				}
			}

			// UPDATE GAMEPAD: Existing gamepad: Update the gamepad data key and make sure that the cached data already exists.
			// else if( JSGAME.GAMEPADS.gamepads[thisPad.id]){
			else if( JSGAME.GAMEPADS.gamepads[thisPad.index] ){
				// console.log("Updating existing gamepad!", JSGAME.GAMEPADS.gamepads[i].btnPrev);
				JSGAME.GAMEPADS.gamepads[ thisPad.index ].gamepad = src_gamepads[i];

				// console.log("setting as active!");
				JSGAME.GAMEPADS.gamepads[ thisPad.index ].active = 1;
				JSGAME.GAMEPADS.gamepads[ thisPad.index ].prevActive = 1;

				// Configure the displayed gamepad statuses.
				// if   (JSGAME.GAMEPADS.gamepads[ thisPad.index ].gamepad==0){
				if   (JSGAME.GAMEPADS.gamepads[ thisPad.index ].player==0){
				// if   (thisPad.index==0){
					JSGAME.GAMEPADS.CONFIG.DOM_elems.gamepadIcon_container_p1.classList.remove("neverConnected");
					JSGAME.GAMEPADS.CONFIG.DOM_elems.gamepadIcon_container_p1.classList.add("known");
					JSGAME.GAMEPADS.CONFIG.DOM_elems.gamepadIcon_container_p1.classList.remove("unconfigured");
					JSGAME.GAMEPADS.CONFIG.DOM_elems.gamepadIcon_container_p1.classList.add("connected");
				}
				// if   (JSGAME.GAMEPADS.gamepads[ thisPad.index ].gamepad==1){
				if   (JSGAME.GAMEPADS.gamepads[ thisPad.index ].player==1){
				// else if(thisPad.index==1){
					JSGAME.GAMEPADS.CONFIG.DOM_elems.gamepadIcon_container_p1.classList.remove("neverConnected");
					JSGAME.GAMEPADS.CONFIG.DOM_elems.gamepadIcon_container_p1.classList.add("known");
					JSGAME.GAMEPADS.CONFIG.DOM_elems.gamepadIcon_container_p1.classList.remove("unconfigured");
					JSGAME.GAMEPADS.CONFIG.DOM_elems.gamepadIcon_container_p1.classList.add("connected");
				}

			}

		}

		// Find the known gamepads that are still set as active=0.
		for(let i=0; i<JSGAME.GAMEPADS.gamepads.length; i+=1){

			let thisPad=JSGAME.GAMEPADS.gamepads[i];

			if(thisPad==undefined)         { continue; }
			if("undefined"==typeof thisPad){ continue; }
			if(thisPad==null)              { continue; }
			if(!thisPad)                   { continue; }

			// console.log("thisPad:", "index:", thisPad.gamepad.index, "active:", thisPad.active);

			// Is this pad still active=0? It probably disconnected.
			if( thisPad.prevActive && thisPad.active==0 ){
			// if( thisPad.active==0 ){
				// console.log("gamepad active 0");
				// Configure the displayed gamepad statuses.
				// if   (thisPad.gamepad.index==0){
				// console.log(thisPad.player+1);
				if   (thisPad.player==0){
					// Put on standby status.
					console.log("Player 1 gamepad has disconnected!");
					JSGAME.GAMEPADS.CONFIG.DOM_elems.gamepadIcon_container_p1.classList.remove("neverConnected");
					JSGAME.GAMEPADS.CONFIG.DOM_elems.gamepadIcon_container_p1.classList.add("known");
					JSGAME.GAMEPADS.CONFIG.DOM_elems.gamepadIcon_container_p1.classList.remove("unconfigured");
					JSGAME.GAMEPADS.CONFIG.DOM_elems.gamepadIcon_container_p1.classList.remove("connected");
					thisPad.prevActive=0;
				}
				// else if(thisPad.gamepad.index==1){
				else if(thisPad.player==1){
					// Put on standby status.
					console.log("Player 2 gamepad has disconnected!");
					JSGAME.GAMEPADS.CONFIG.DOM_elems.gamepadIcon_container_p2.classList.remove("neverConnected");
					JSGAME.GAMEPADS.CONFIG.DOM_elems.gamepadIcon_container_p2.classList.add("known");
					JSGAME.GAMEPADS.CONFIG.DOM_elems.gamepadIcon_container_p2.classList.remove("unconfigured");
					JSGAME.GAMEPADS.CONFIG.DOM_elems.gamepadIcon_container_p2.classList.remove("connected");
					thisPad.prevActive=0;
				}
			}
		}
	},
	//
	analogToDigital_withDeadzone : function(number, deadzone){
		let sign       = Math.sign(number) ; // Will be -1, 0, or 1.
		let abs        = Math.abs(number) ;
		let inDeadzone = ! (0 + abs > deadzone) ? true : false ;

		// No value or value within the deadzone?
		if( abs==0 || inDeadzone){ return 0; }

		// Value and outside of the deadzone.
		else{ return sign; }
	},
	// * Reads gamepad instance. Uses the specified gamepad mapping and returns an Uzebox-compatible value for the gamepad button state.
	findGpButtonsViaMapping : function(gp_obj){
		// gp_obj provides the custom values as well as the gamepad state.
		let map     = gp_obj.btnMap.btnMap;
		let axes    = gp_obj.gamepad.axes;
		let buttons = gp_obj.gamepad.buttons.map(function(d){ return d.value });

		// Return these after populating them.
		let uzeBin      = 0;
		let uzeKeys     = [];
		let browserKeys = [];

		// Look through the axes/buttons mappings. (Restrict to available buttons.)
		let map_keys     = Object.keys(map).filter(function(d){ return JSGAME.consts.allowedButtons.indexOf(d) != -1 ; });
		let map_keys_len = map_keys.length;

		for(let i=0; i<map_keys_len; i+=1){
			let d          = map_keys[i]           ;
			let btn_value  = buttons[map[d].index] ;
			let axes_value = axes[map[d].index]    ;

			if     (map[d].type=="buttons"){
				// Is the button at the specified button array index true?
				// ??? Look for what the "index" is.
				if(btn_value==1){
					// Get the key for that button.
					let key = map_keys[i];
					// Use the key to get the associated Uzebox gamepad key and the Uzebox bitPos.
					let uzeBtn = JSGAME.GAMEPADS.uzeBox_gamepad_mapping[key];
					let kb_key = uzeBtn.key;
					let bitPos = uzeBtn.bitPos;

					uzeBin |= (1<<bitPos);
					uzeKeys.push(key);
					browserKeys.push(kb_key);
				}
			}
			else if (map[d].type=="axes"){
				// Is the button at the specified button array index true?
				// ??? Look for what the "index" is.

				// A "deadzone" is needed for the axes.
				axes_value = JSGAME.GAMEPADS.analogToDigital_withDeadzone(axes_value, 0.2);

				if( axes_value != 0 ){
					// Does the sign of the value match the designated sign for this button?
					let value_sign = Math.sign(axes_value) == -1 ? "-" : "+";
					let req_sign   = map[d].sign;

					// console.log();
					if(value_sign == req_sign){

						// Get the key for that button.
						let key = map_keys[i];

						// Use the key to get the associated Uzebox gamepad key and the Uzebox bitPos.
						let uzeBtn = JSGAME.GAMEPADS.uzeBox_gamepad_mapping[key];
						let kb_key = uzeBtn.key;
						let bitPos = uzeBtn.bitPos;

						uzeBin |= (1<<bitPos);
						uzeKeys.push(key);
						browserKeys.push(kb_key);
					}

				}

			}
		}

		return {
			"uzeBin"      : uzeBin                               , //
			"uzeKeys"     : uzeKeys                              , //
			"browserKeys" : browserKeys                          , //
		};

	},
	// * Handles updating the local gamepad cache, determining pressed buttons, sending keyboard events.
	handleInputs        : function(){
		// Bail if there is not gamepad support.
		if(!JSGAME.FLAGS.support_gamepadAPI){ return; }

		// Show the indicator.
		// if(JSGAME.FLAGS.debug)       {
		// 	if(JSGAME.GAMEPADS.CONFIG.gp_blinker2_status){
		// 		JSGAME.GAMEPADS.CONFIG.DOM_elems.gp_blinker2_status.style.visibility="visible";
		// 	}
		// 	else                                        {
		// 		JSGAME.GAMEPADS.CONFIG.DOM_elems.gp_blinker2_status.style.visibility="hidden";
		// 	}
		// 	JSGAME.GAMEPADS.CONFIG.gp_blinker2_status = !JSGAME.GAMEPADS.CONFIG.gp_blinker2_status;
		// }

		// Read the source gamepad data, add to local cache if defined and not null and found button mapping.
		JSGAME.GAMEPADS.getNewGamepadStates();

		// Control the visible gamepad indicator.
		let srcGamepads = JSGAME.GAMEPADS.getSrcGamepads();

		// Show/hide the gamepad config button based on the presence of a real gamepad.
		if(srcGamepads.length){
			if(! JSGAME.DOM["bottom_bar_gamepadDetected"].classList.contains("show")){
				// console.log("system sees a gamepad!");
				JSGAME.DOM["bottom_bar_gamepadDetected"].classList.add("show");
			}
		}
		else{
			if(JSGAME.DOM["bottom_bar_gamepadDetected"].classList.contains("show")){
				// console.log("system does not see a gamepad!");
				JSGAME.DOM["bottom_bar_gamepadDetected"].classList.remove("show");
			}
		}

		// Go through the gamepad list.
		for(let i=0; i<JSGAME.GAMEPADS.gamepads.length; i+=1){
			// Is this gamepad in a valid and connected state? If not, then skip it.
			if( "undefined" == typeof JSGAME.GAMEPADS.gamepads[i]) { continue; }
			if( JSGAME.GAMEPADS.gamepads[i]==null                ) { continue; }
			if(!JSGAME.GAMEPADS.gamepads[i]                      ) { continue; }

			// Get a handle to this gamepad.
			let padIndex = JSGAME.GAMEPADS.gamepads[i].gamepad.index;
			let thisPad  = JSGAME.GAMEPADS.gamepads[ padIndex ] ;

			// Which player uses this gamepad?
			let playerNumber = thisPad.player;

			// Only two players are supported.
			if( [0, 1].indexOf(playerNumber) == -1 ){ continue; }

			// First, is the timestamp the same? If so, there has been no new input. Skip!
			if( thisPad.gamepad.timestamp == thisPad.lastTimestamp ){ continue; }

			// Decipher the input into Uzebox binary.
			let input = JSGAME.GAMEPADS.findGpButtonsViaMapping( thisPad );
			// console.log("input:", input);
			// Determine what buttons have changed.
			// Compare old data to new data.

			let btnPrev     = thisPad.btnPrev;               // The buttons held at the last poll.
			let btnHeld     = input.uzeBin;                  // The buttons held at THIS poll.
			let btnPressed  = btnHeld & (btnHeld ^ btnPrev); // The new buttons pressed at THIS poll.
			let btnReleased = btnPrev & (btnHeld ^ btnPrev); // The buttons released at THIS poll.

			// Save the last timestamp.
			thisPad.lastTimestamp=thisPad.gamepad.timestamp;

			// Save the prevBtn state for the next poll.
			thisPad.btnPrev=btnHeld;

			// Send the keys that the user pressed on the the gamepad.
			JSGAME.GAMEPADS.sendNewKey(playerNumber, btnPressed, btnReleased);
		}

	},

};

// ===============================
// ==== FILE END: GAMEPADS.js ====
// ===============================
