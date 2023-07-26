_GFX.DEBUG = {
    navBar1: {
        // Holds the DOM for the nav buttons and nav views.
        DOM: {
            colorFinder    : { tab: "gfx_navTab_colorFinder" , view: "gfx_navView_colorFinder" , extraClasses: { cont: [""]  }, onShow: null, onHide: null },
            drawTimings    : { tab: "gfx_navTab_drawTimings" , view: "gfx_navView_drawTimings" , extraClasses: { cont: [""]  }, onShow: null, onHide: null },
            globalFade     : { tab: "gfx_navTab_globalFade"  , view: "gfx_navView_globalFade"  , extraClasses: { cont: [""]  }, onShow: null, onHide: null },
            hashCache      : { tab: "gfx_navTab_hashCache"   , view: "gfx_navView_hashCache"   , extraClasses: { cont: [""]  }, onShow: null, onHide: null },
            layerObjects   : { tab: "gfx_navTab_layerObjects", view: "gfx_navView_layerObjects", extraClasses: { cont: [""]  }, onShow: null, onHide: null },
        },
        tabsContainer : "gfx_mainNavMenu_ul",
        viewsContainer: "gfx_mainNavMenuViews",
        activeView: "",
        checkValidity: _APP.navBarMAIN.checkValidity,
        hideAll      : _APP.navBarMAIN.hideAll,
        showOne      : _APP.navBarMAIN.showOne,
        init         : _APP.navBarMAIN.init,
    },
    util: {
        parseDOMStrings: function(DOM){
            // Populate the DOM cache
            for (let key in DOM) {
                // Skip DOM that has already been processed.
                if(typeof DOM[key] != "string"){ 
                    // console.log("Already processed:", DOM[key]); 
                    continue; 
                }

                // Get the DOM elements.
                let elem  = document.getElementById(DOM[key]) ;
                
                // If the elem exists then set the DOM value.
                if(elem){
                    // Save the DOM value.
                    DOM[key]  = elem;
                }
            }
        },
    },

    statsControls: {
        progressBars:{
            DOM: {
                progressBar_canvas: "gfx_debug_statsControls_timingsCanvas",
            },
            ctx: null,
            last_debugTime: 0,
            last_loopTime : 0,
            last_drawTime : 0,
    
            // Positions of each drawing on the canvas. 
            positions: {
                "container"   : { w:874, h:44 },
                
                "debugBar"    : { x:10 , y:25, w:205, h:12 },
                "LoopBar"     : { x:225, y:25, w:205, h:12 },
                "renderBar"   : { x:440, y:25, w:205, h:12 },
                "GfxBar"      : { x:655, y:25, w:205, h:12 },
    
                "DEBUG_label" : { x:10 , y:12, text: "DEBUG:" },
                "LOOP_label"  : { x:225, y:12, text: "LOOP:" },
                "RENDER_label": { x:440, y:12, text: "RENDER:" },
                "DRAW_label"  : { x:655, y:12, text: "DRAW:" },
            },
    
            // UTIL
            calcPercentOfFrameTime: function(value){
                // Convert to percent of gameloop frame.
                let percent = 100 * (value / _APP.game.gameLoop.msFrame)
    
                // Keep the new value in the range of 0 - 100.
                // percent = Math.max(0, Math.min(100, percent));
    
                // Return the completed value.
                return percent;
            },
            mapToWidth: function(value, maxWidth) {
                let canvasWidth = maxWidth; // this.ctx.canvas.width;
    
                // Make sure the value is clamped between 0 and 100
                value = Math.max(0, Math.min(100, value));
    
                // Map the value to the width of the canvas
                return ((value / 100) * canvasWidth) << 0;
            },
            drawSeparators: function(pos){
                this.ctx.strokeStyle = '#fff';
    
                // Set the line style to dotted
                this.ctx.setLineDash([3, 3]);
                
                // Array of percentages for the lines
                let percentages = [18, 36, 54, 72, 90];
                
                // Draw the lines
                for(let i = 0; i < percentages.length; i++) {
                    let xPosition = pos.x + (percentages[i]/100) * pos.w;
                
                    this.ctx.beginPath();
                    this.ctx.moveTo(xPosition, pos.y+1);
                    this.ctx.lineTo(xPosition, pos.y + pos.h-1);
                    this.ctx.stroke();
                }
                
                // Reset the line style to solid
                this.ctx.setLineDash([]);
            },
    
            // DISPLAY
            updateOneBar: function(barKey, newValue, newValue2){
                // Get the bar dimensions/position.
                let pos = this.positions[barKey];
    
                // Map the newValue to fit the bar. 
                let newWidth = this.mapToWidth(newValue, pos.w);
    
                // Clear this bar.
                this.ctx.clearRect(pos.x-2, pos.y-2, pos.w+4, pos.h+4);
                
                // Draw the outer rectangle.
                this.ctx.strokeStyle = '#000';
                this.ctx.strokeRect(pos.x-2, pos.y-2, pos.w+4, pos.h+4);
    
                // Draw the inner filled rectangle. (full)
                this.ctx.fillStyle = '#b0c4de';
                this.ctx.fillRect(pos.x, pos.y, pos.w, pos.h);
    
                // Draw the inner filled rectangle. (partial)
                if     (newValue < 18){ this.ctx.fillStyle = '#18a521'; }
                else if(newValue < 36){ this.ctx.fillStyle = '#1a3cac'; }
                else if(newValue < 54){ this.ctx.fillStyle = '#a89922'; }
                else if(newValue < 72){ this.ctx.fillStyle = '#df9e2f'; }
                else if(newValue < 90){ this.ctx.fillStyle = '#fa3131'; }
                else                  { this.ctx.fillStyle = '#ff0000'; }
                this.ctx.fillRect(pos.x, pos.y, newWidth, pos.h);
    
                // Draw the separation of ranges.
                this.drawSeparators(pos);
    
                // Draw the newValue and newValue2 in the center of the bar.
                this.ctx.font = '15px Courier New, monospace';
                this.ctx.textAlign = "left";     
                newValue  = newValue .toFixed(0).padStart(5, " ") + "%"
                newValue2 = newValue2.toFixed(1).padStart(5, " ") + "ms"
                let combinedText = `${newValue} / ${newValue2}`;
                let textWidth = Math.ceil(this.ctx.measureText(combinedText).width);
    
                // Write text region.
                let subtractX = 35;
                let text_x1 = (25+pos.x + (pos.w / 2))-subtractX;
                let text_y1 = (pos.y-15+2);
    
                // Clear text region.
                let text_x2 = (text_x1)-subtractX;
                let text_y2 = text_y1-10;
                let text_w2 = textWidth;
                let text_h2 = 16;
                this.ctx.fillStyle = '#a9a9a9'; // darkgray
                this.ctx.fillRect(text_x2, text_y2, text_w2, text_h2);
    
                this.ctx.fillStyle = '#000';
                this.ctx.fillText(combinedText, text_x1-35, text_y1);
            },
            
            // DISPLAY ALL (requested only.)
            updateDisplay: function(obj){
                // Update all bars included in the object.
                for(let key in obj){
                    this.updateOneBar(obj[key].barKey, this.calcPercentOfFrameTime(obj[key].data ?? 0), obj[key].data ?? 0);
                }
            },
    
            // INIT
            init: function(){
                _GFX.DEBUG.util.parseDOMStrings(this.DOM);
    
                // CANVAS SETUP
                // Get device pixel ratio
                let dpr = window.devicePixelRatio || 1;
    
                // Set the canvas initial width/height.
                this.DOM.progressBar_canvas.width  = this.positions.container.w;
                this.DOM.progressBar_canvas.height = this.positions.container.h;
    
                // Set the size of the canvas in pixels, taking into account the device pixel ratio
                this.DOM.progressBar_canvas.width  = this.DOM.progressBar_canvas.width  * dpr;
                this.DOM.progressBar_canvas.height = this.DOM.progressBar_canvas.height * dpr;
    
                // Set the size of the canvas in CSS pixels
                this.DOM.progressBar_canvas.style.width  = (this.DOM.progressBar_canvas.width  / dpr) + "px";
                this.DOM.progressBar_canvas.style.height = (this.DOM.progressBar_canvas.height / dpr) + "px";
    
                // CONTEXT
                // this.ctx = this.DOM.progressBar_canvas.getContext("2d", { alpha: true } );
                this.ctx = this.DOM.progressBar_canvas.getContext("2d", { alpha: false } );
    
                // SCALE
                this.ctx.scale(dpr, dpr);
                this.ctx.translate(0.5, 0.5);
    
                // CLEAR
                this.ctx.fillStyle = '#a9a9a9'; // darkgray
                this.ctx.fillRect(0, 0, this.DOM.progressBar_canvas.width / dpr, this.DOM.progressBar_canvas.height / dpr);
    
                // LABELS
                this.ctx.fillStyle = '#000';
                this.ctx.font = 'bold 15px Courier New, monospace';
                this.ctx.textAlign = "left";     // 
                this.ctx.textBaseline = "middle";  // Center the text vertically
                this.ctx.fillText(this.positions.DEBUG_label.text, this.positions.DEBUG_label.x, this.positions.DEBUG_label.y);
                this.ctx.fillText(this.positions.LOOP_label.text , this.positions.LOOP_label.x , this.positions.LOOP_label.y);
                this.ctx.fillText(this.positions.RENDER_label.text , this.positions.RENDER_label.x , this.positions.RENDER_label.y);
                this.ctx.fillText(this.positions.DRAW_label.text , this.positions.DRAW_label.x , this.positions.DRAW_label.y);
    
                // DRAW THE INITIAL DISPLAY.
                this.updateOneBar("debugBar" , 0, 0);
                this.updateOneBar("LoopBar"  , 0, 0);
                this.updateOneBar("renderBar", 0, 0);
                this.updateOneBar("GfxBar"   , 0, 0);
            },
        },
        controlButtons:{
            DOM: {
                loop      : "gfx_debug_statsControls_loop",
                logic     : "gfx_debug_statsControls_logic",
                awaitDraw : "gfx_debug_statsControls_awaitDraw",
                debug_all : "gfx_debug_statsControls_debug_all",
                debug_game: "gfx_debug_statsControls_debug_game",
                hashcache : "gfx_debug_statsControls_hashcache",
                grid      : "gfx_debug_statsControls_grid",
            },
            states: {
                loop       : [ "LOOP: OFF"      , "LOOP: ON "       ],
                logic      : [ "LOGIC: OFF"     , "LOGIC: ON "      ],
                awaitDraw  : [ "AWAIT_DRAW: OFF", "AWAIT_DRAW: ON " ],
                debug_all  : [ "DEBUG_ALL: OFF" , "DEBUG_ALL: ON "  ],
                debug_game : [ "DEBUG_GAME: OFF", "DEBUG_GAME: ON " ],
                hashcache  : [ "HASHCACHE: OFF" , "HASHCACHE: ON "  ],
                grid       : [ "GRID: OFF"      , "GRID: ON "       ],
            },
            initialStatesSet: false,
            setAllButtonStates: function(){
                let checks = [
                    { check: (_APP.game.gameLoop.running)            , elem: this.DOM.loop      , states: this.states.loop       },
                    { check: (!_APP.game.gameLoop.skipLogic)         , elem: this.DOM.logic     , states: this.states.logic      },
                    { check: (_APP.configObj.awaitDraw)              , elem: this.DOM.awaitDraw , states: this.states.awaitDraw  },
                    { check: (_APP.debugActive)                      , elem: this.DOM.debug_all , states: this.states.debug_all  },
                    { check: (_APP.configObj.gameConfig .debug)      , elem: this.DOM.debug_game, states: this.states.debug_game },
                    { check: (!_APP.configObj.gfxConfig.disableCache), elem: this.DOM.hashcache , states: this.states.hashcache  },
                    { check: (this.parent.gridCanvas.isActive)       , elem: this.DOM.grid      , states: this.states.grid       },
                ];

                for(let rec of checks){
                    // Is the setting active?
                    if(rec.check){
                        this.changeButtonDisplay(rec.elem, true, rec.states);
                    }
                    else{
                        this.changeButtonDisplay(rec.elem, false, rec.states);
                    }
                }
            },
            changeButtonDisplay: function(elem, state, states=["ON", "OFF"]){
                if     (state == false){
                    elem.classList.remove("gfx_debug_bgColor_on");
                    elem.classList.add("gfx_debug_bgColor_off");
                    elem.innerText = states[0];
                }
                else if(state == true){
                    elem.classList.remove("gfx_debug_bgColor_off");
                    elem.classList.add("gfx_debug_bgColor_on");
                    elem.innerText = states[1];
                }
            },
            init: function(parent){
                this.parent = parent;
                _GFX.DEBUG.util.parseDOMStrings(this.DOM);

                // Event listeners.

                // GAMELOOP
                this.DOM.loop .addEventListener("click", ()=>{ 
                    if(_APP.game.gameLoop.running){
                        this.changeButtonDisplay(this.DOM.loop, false, this.states.loop);
                        _APP.game.gameLoop.loop_stop(); 
                    } 
                    else {
                        this.changeButtonDisplay(this.DOM.loop, true, this.states.loop);
                        _APP.game.gameLoop.loop_start(); 
                    } 
                }, false);

                // LOGIC
                this.DOM.logic .addEventListener("click", ()=>{ 
                    _APP.game.gameLoop.skipLogic = !_APP.game.gameLoop.skipLogic;
                    if(_APP.game.gameLoop.skipLogic){
                        this.changeButtonDisplay(this.DOM.logic, false, this.states.logic);
                    }
                    else {
                        this.changeButtonDisplay(this.DOM.logic, true, this.states.logic);
                    }
                }, false);

                // AWAIT DRAW
                this.DOM.awaitDraw .addEventListener("click", ()=>{ 
                    _APP.configObj.gfxConfig.awaitDraw = !_APP.configObj.gfxConfig.awaitDraw;
                    if(!_APP.configObj.gfxConfig.awaitDraw){
                        this.changeButtonDisplay(this.DOM.awaitDraw, false, this.states.awaitDraw);
                    }
                    else {
                        this.changeButtonDisplay(this.DOM.awaitDraw, true, this.states.awaitDraw);
                    }
                }, false);

                // DEBUG
                let debug_inToggle = false;
                this.DOM.debug_all.addEventListener("click", ()=>{ 
                    // Do not allow further toggles until this flag is false again.
                    if(debug_inToggle){ 
                        // console.log("ALREADY IN DEBUG TOGGLE");
                        return; 
                    }

                    // Set the toggle flag to true. 
                    debug_inToggle = true;

                    // Save the current running state for the gameloop and then pause the gameloop.
                    let wasRunning = _APP.game.gameLoop.running;
                    _APP.game.gameLoop.loop_stop(); 

                    // Wait before completing the task.
                    setTimeout(async ()=>{
                        // Toggle the setting locally.
                        _APP.debugActive = !_APP.debugActive;
                        
                        // Adjust the display of the toggle button.
                        if(_APP.debugActive){
                            this.changeButtonDisplay(this.DOM.debug_all, true, this.states.debug_all);
                        } 
                        else {
                            this.changeButtonDisplay(this.DOM.debug_all, false, this.states.debug_all);
                        } 

                        // Request and await the result.
                        await _WEBW_V.SEND("_DEBUG.toggleDebugFlag", { 
                            data: { debugActive: _APP.debugActive }, 
                            refs:[]
                        }, true, false);

                        // Start the gameloop after a delay.
                        if(wasRunning){
                            setTimeout(()=>{
                                // Start the loop.
                                _APP.game.gameLoop.loop_start(); 

                                // Clear the toggle flag.
                                debug_inToggle = false;
                            }, 1 * _APP.game.gameLoop.msFrame);
                        }

                        // Just clear the toggle flag.
                        else{
                            // Clear the toggle flag.
                            debug_inToggle = false;
                        }
                    }, 4 * _APP.game.gameLoop.msFrame);
                }, false);

                // DEBUG2 (game debug)
                let debug2_inToggle = false;
                this.DOM.debug_game.addEventListener("click", ()=>{ 
                    // Do not allow further toggles until this flag is false again.
                    if(debug2_inToggle){ 
                        // console.log("ALREADY IN DEBUG TOGGLE");
                        return; 
                    }

                    // Set the toggle flag to true. 
                    debug2_inToggle = true;

                    // Toggle the setting locally.
                    _APP.configObj.gameConfig .debug = !_APP.configObj.gameConfig .debug;
                    
                    // Adjust the display of the toggle button.
                    if(_APP.configObj.gameConfig .debug){
                        this.changeButtonDisplay(this.DOM.debug_game, true, this.states.debug_game);
                    } 
                    else {
                        this.changeButtonDisplay(this.DOM.debug_game, false, this.states.debug_game);
                    } 

                    // Clear the toggle flag.
                    debug2_inToggle = false;
                }, false);

                // HASH CACHE
                let hashCache_inToggle = false;
                this.DOM.hashcache.addEventListener("click", async ()=>{ 
                    // Do not allow further toggles until this flag is false again.
                    if(hashCache_inToggle){ 
                        // console.log("ALREADY IN HASHCACHE TOGGLE");
                        return; 
                    }

                    // Set the toggle flag to true. 
                    hashCache_inToggle = true;

                    // Save the current running state for the gameloop and then pause the gameloop.
                    let wasRunning = _APP.game.gameLoop.running;
                    _APP.game.gameLoop.loop_stop(); 

                    // Wait before completing the task.
                    setTimeout(async ()=>{
                        // Toggle the setting locally.
                        _APP.configObj.gfxConfig.disableCache = !_APP.configObj.gfxConfig.disableCache;

                        // Adjust the display of the toggle button.
                        if(_APP.configObj.gfxConfig.disableCache){
                            // this.DOM.hashcache.classList.remove("debug_bgColor_on");
                            // this.DOM.hashcache.classList.add("debug_bgColor_off");
                            // this.DOM.hashcache.innerText = "OFF";
                            this.changeButtonDisplay(this.DOM.hashcache, false, this.states.hashcache);
                        } 
                        else {
                            // this.DOM.hashcache.classList.remove("debug_bgColor_off");
                            // this.DOM.hashcache.classList.add("debug_bgColor_on");
                            // this.DOM.hashcache.innerText = "ON";
                            this.changeButtonDisplay(this.DOM.hashcache, true, this.states.hashcache);
                        }

                        // Request and await the result.
                        await _WEBW_V.SEND("_DEBUG.toggleCacheFlag", { 
                            data: { disableCache: _APP.configObj.gfxConfig.disableCache }, 
                            refs:[]
                        }, true, false);

                        // Start the gameloop after a delay.
                        if(wasRunning){
                            setTimeout(()=>{
                                // Start the loop.
                                _APP.game.gameLoop.loop_start(); 

                                // Clear the toggle flag.
                                hashCache_inToggle = false;
                            }, 1 * _APP.game.gameLoop.msFrame);
                        }
                        // Just clear the toggle flag.
                        else{
                            // Clear the toggle flag.
                            hashCache_inToggle = false;
                        }
                    }, 4 * _APP.game.gameLoop.msFrame);

                }, false);

                // SHOW GRID
                this.DOM.grid.addEventListener("click", ()=>{
                    let home = this.parent.gridCanvas;
                    if(home.isActive){
                        this.changeButtonDisplay(this.DOM.grid, false, this.states.grid);

                        let canvasLayers = document.querySelectorAll(`#${_APP.configObj.gfxConfig.outputDiv} .canvasLayer`);
                        for(let elem of canvasLayers){ 
                            elem.classList.remove("fixFitAndMouseCoords"); 
                        }
                        
                        home.canvas.classList.add("displayNone");
                        home.canvas2.classList.add("displayNone");
                        home.isActive = false;
                    }
                    else{
                        this.changeButtonDisplay(this.DOM.grid, true, this.states.grid);
                        let canvasLayers = document.querySelectorAll(`#${_APP.configObj.gfxConfig.outputDiv} .canvasLayer`);
                        for(let elem of canvasLayers){ 
                            elem.classList.add("fixFitAndMouseCoords"); 
                        }
                        
                        home.canvas.classList.remove("displayNone");
                        home.canvas2.classList.remove("displayNone");
                        home.isActive = true;
                    }
                }, false);

                this.setAllButtonStates();
            },
        },
        // Displays a canvas on top of all canvases with a grid drawn to it.
        gridCanvas: {
            isActive: false,
            canvas:null,
            ctx:null,
            canvas2:null,
            ctx2:null,
            hover1_last_regionX: 0,
            hover1_last_regionY: 0,
            hover1: function(event){
                const regionWidth  = 8;
                const regionHeight = 8;

                const rect = this.canvas2.getBoundingClientRect();
                const scaleX = this.canvas2.width / rect.width;
                const scaleY = this.canvas2.height / rect.height;
                // const scaleX = rect.width / rect.width;  // equals 1
                // const scaleY = rect.height / rect.height; // equals 1
        
                // Calculate the scaled mouse position.
                const mouseX = ((event.clientX - rect.left) * scaleX);
                const mouseY = ((event.clientY - rect.top)  * scaleY);
        
                // Calculate the 8x8px region under the mouse cursor
                const regionX = (Math.floor(mouseX / regionWidth)  * regionWidth);
                const regionY = (Math.floor(mouseY / regionHeight) * regionHeight);
                
                // Determine if we should continue.
                if( this.hover1_last_regionX == regionX && this.hover1_last_regionY == regionY ) { return; }
                this.hover1_last_regionX = regionX; 
                this.hover1_last_regionY = regionY;
        
                // console.log(`regionX: ${regionX}, regionY: ${regionY}`); return; 

                // Clear the highlight canvas.
                this.ctx2.clearRect(0, 0, this.canvas2.width|0, this.canvas2.height|0);
                
                // Draw the coordinate data.
                this.ctx2.lineWidth = 1;

                // Create x, y, w, h.
                let x = regionX;
                let y = regionY;
                let w = regionWidth;
                let h = regionHeight;

                let tX = regionX      / _APP.configObj.gfxConfig.dimensions.tileWidth ;
                let tY = regionY      / _APP.configObj.gfxConfig.dimensions.tileHeight;
                let tW = regionWidth  / _APP.configObj.gfxConfig.dimensions.tileWidth ;
                let tH = regionHeight / _APP.configObj.gfxConfig.dimensions.tileHeight;

                let text = `tX:${tX.toString().padStart(2, " ")},tY: ${tY.toString().padStart(2, " ")}, X:${x.toString().padStart(3, " ")},Y: ${y.toString().padStart(3, " ")}`;
                let fontSize = 12;
                this.ctx2.font=`${fontSize}px Courier New`;
                let textWidth = Math.round(this.ctx2.measureText(text).width);
                let textHeight = fontSize;
                // Define rectangle properties based on text dimensions
                let padding = 3;
                let rectWidth  = Math.round(textWidth  + (2 * padding));
                let rectHeight = Math.round(textHeight + (2 * padding));
                let rectX = Math.round( (this.canvas2.width  / 2) - (rectWidth / 2) );
                let rectY = Math.round( (this.canvas2.height / 2) - (rectHeight / 2) );
                
                // Draw a semi-transparent rectangle
                this.ctx2.fillStyle = "rgba(0, 128, 255, 0.80)";
                this.ctx2.fillRect(rectX, rectY, rectWidth, rectHeight);
                
                // Draw text on top of the rectangle
                this.ctx2.fillStyle = "rgba(0, 0, 0, 0.90)";
                this.ctx2.textAlign = "center"; // Center the text horizontally
                this.ctx2.textBaseline = "middle"; // Center the text vertically
                this.ctx2.fillText(
                    text, 
                    Math.round( this.canvas2.width  / 2), 
                    Math.round( this.canvas2.height / 2)
                );

                
                // Draw a highlight marker to clearly identify the tile that is being hovered over.
                // Square (fits in the grid square.)
                this.ctx2.fillStyle="rgba(248, 200, 200, 1)";
                this.ctx2.fillRect( x+1, y+1, w-1, h-1 );
                
                // Square (fits in the above square.)
                this.ctx2.fillStyle="rgba(244, 67, 54, 0.60)";
                this.ctx2.fillRect( x+2, y+2, w-3, h-3 );
            },
            canvasAntiBlur: function(canvas, ctx) {
                // Get device pixel ratio
                // let dpr = window.devicePixelRatio || 1;

                // Get the size of the canvas that was set when creating it
                // let width = canvas.width;
                // let height = canvas.height;

                // Set the size of the canvas in pixels, taking into account the device pixel ratio
                // canvas.width  = width  * dpr;
                // canvas.height = height * dpr;
            
                // Scale all drawing operations by the dpr
                // ctx.scale(dpr, dpr);
            
                // The translate(0.5, 0.5) part is often used to make pixel-perfect lines, 
                // it might not be needed depending on what you are drawing
                // ctx.translate(0.5, 0.5);
            },
            init: function(){
                // Copy the dimensions of the first canvas. 
                const canvas_src = document.querySelector(`#${_APP.configObj.gfxConfig.outputDiv} .canvasLayer`);
                
                // Create a canvas for this layer.
                this.canvas = document.createElement("canvas");
                this.canvas.width  = canvas_src.width;
                this.canvas.height = canvas_src.height;
                this.canvas.id = "debug_grid_canvas";
                this.canvas.style["z-index"] = "310";
                this.ctx = this.canvas.getContext('2d');

                // Create a canvas for the highlight layer.
                this.canvas2 = document.createElement("canvas");
                this.canvas2.width  = canvas_src.width;
                this.canvas2.height = canvas_src.height;
                this.canvas2.id = "debug_grid_canvas2";
                this.canvas2.style["z-index"] = "320";
                this.ctx2 = this.canvas2.getContext('2d');
                this.ctx2.imageSmoothingEnabled = false;

                // Add the class.
                this.canvas.classList.add("canvasLayer");
                this.canvas.classList.add("displayNone");
                this.canvas2.classList.add("canvasLayer");
                this.canvas2.classList.add("displayNone");

                // Add the highlight on hover function for this.canvas2.
                this.canvas2.addEventListener("mousemove", (event) => this.hover1(event), false);
                // this.canvas2.addEventListener("mousemove", (event) => this.OLDhover1(event), false);
                this.canvas2.addEventListener("mouseleave", () => { this.ctx2.clearRect(0, 0, this.canvas2.width|0, this.canvas2.height|0); }, false);

                // Add the new canvas to the output div.
                let outputDiv = document.getElementById(_APP.configObj.gfxConfig.outputDiv);
                outputDiv.append(this.canvas);
                outputDiv.append(this.canvas2);

                // Apply anti-blur but delay until the next frame.
                requestAnimationFrame(() => {
                    // this.canvasAntiBlur(this.canvas,  this.ctx);
                    // this.canvasAntiBlur(this.canvas2, this.ctx2);
                    // this.ctx .translate(0.5, 0.5);
                    // this.ctx2.translate(0.5, 0.5);

                    // Draw a grid pattern.
                    const gridSize = 8;
                    const offset = 0.5; // Use 0.5 to align lines with pixel grid
                    this.ctx.lineWidth = 1;

                    // Begin the path for grid lines
                    this.ctx.beginPath();

                    // Draw vertical lines
                    for (let x = 0; x <= this.canvas.width; x += gridSize) {
                        this.ctx.moveTo(x + offset, 0);
                        this.ctx.lineTo(x + offset, this.canvas.height);
                    }

                    // Draw horizontal lines
                    for (let y = 0; y <= this.canvas.height; y += gridSize) {
                        this.ctx.moveTo(0, y + offset);
                        this.ctx.lineTo(this.canvas.width, y + offset);
                    }

                    // Stroke the grid lines
                    this.ctx.strokeStyle = 'rgba(128, 128, 128, 0.75)';
                    this.ctx.stroke();

                    // Add a marker to every 5th square.
                    this.ctx.fillStyle = 'rgba(200,200,200, 0.75)';
                    for (let x = 0; x <= this.canvas.width; x += gridSize * 5) {
                        for (let y = 0; y <= this.canvas.height; y += gridSize * 5) {
                            // Apply correction to rectangle position and size
                            this.ctx.fillRect(
                                Math.round(x + 2.5 -1), 
                                Math.round(y + 2.5 -1), 
                                Math.round(gridSize - 3), 
                                Math.round(gridSize - 3)
                            );
                        }
                    }
                });
            },
        },
        init: function(){
            this.progressBars.init();
            this.controlButtons.init(this);
            this.gridCanvas.init();
        },
    },
    colorFinder :{
        DOM: {
            // Copy buttons container. 
            "copyButtons": "debug_test_colorFinder_copyButtons",

            // Copy and Zoom canvases.
            "zoomCanvas" : "debug_colorFinder_zoomCanvas",
            "copyCanvas" : "debug_colorFinder_copyCanvas",
            "pixelRGBA"  : "debug_colorFinder_pixelRGBA",
        },
        // Source canvas layers.
        canvasLayerElems : [],

        replaceCopyCanvas: function(canvas_src, copyCanvasCtx){
            copyCanvasCtx.clearRect(0, 0, copyCanvasCtx.canvas.width, copyCanvasCtx.canvas.height);
            copyCanvasCtx.drawImage(canvas_src, 0, 0);
        },
        copyAll : function(copyCanvasCtx){
            copyCanvasCtx.clearRect(0, 0, copyCanvasCtx.canvas.width, copyCanvasCtx.canvas.height);

            for(let canvasLayerElem of this.canvasLayerElems){
                copyCanvasCtx.drawImage(canvasLayerElem, 0, 0);
            }
        },
        last_regionX:null,
        last_regionY:null,
        hover1: function(event, copyCanvasCtx, zoomCanvasCtx){
            const regionWidth  = 8;
            const regionHeight = 8;

            const rect = this.DOM.copyCanvas.getBoundingClientRect();
            const scaleX = this.DOM.copyCanvas.width / rect.width;
            const scaleY = this.DOM.copyCanvas.height / rect.height;
    
            // Calculate the scaled mouse position.
            const mouseX = (event.clientX - rect.left) * scaleX;
            const mouseY = (event.clientY - rect.top) * scaleY;
    
            // Calculate the 8x8px region under the mouse cursor
            const regionX = Math.floor(mouseX / regionWidth ) * regionWidth;
            const regionY = Math.floor(mouseY / regionHeight) * regionHeight;
            
            // Determine if we should continue.
            if( this.last_regionX == regionX && this.last_regionY == regionY ) { return; }
            this.last_regionX = regionX; 
            this.last_regionY = regionY;
    
            // Extract the ImageData of the region from the main canvas
            const regionImageData = copyCanvasCtx.getImageData(regionX, regionY, regionWidth, regionHeight);
    
            // Clear the zoom canvas
            zoomCanvasCtx.clearRect(0, 0, this.DOM.zoomCanvas.width, this.DOM.zoomCanvas.height);
            
            // Draw the extracted ImageData on the zoom canvas
            zoomCanvasCtx.putImageData(regionImageData, 0, 0);
    
            // Display pixel values rgba as hex.
            let text = "";
            for(let i=0; i<regionImageData.data.length; i+=4){
                if(i%(8*4)==0 && i!=0){ text += `\n`; }
                let r = regionImageData.data[i+0];
                let g = regionImageData.data[i+1];
                let b = regionImageData.data[i+2];
                let a = regionImageData.data[i+3];
                text += `` +
                `[#` +
                    `${r.toString(16).padStart(2, "0").toUpperCase()}` +
                    `${g.toString(16).padStart(2, "0").toUpperCase()}` +
                    `${b.toString(16).padStart(2, "0").toUpperCase()}` +
                    `${a.toString(16).padStart(2, "0").toUpperCase()}` +
                `] ` ;
            }
            this.DOM.pixelRGBA.innerText = text;
        },

        init: async function(){ 
            _GFX.DEBUG.util.parseDOMStrings(this.DOM);

            // Get the list of layer names.
            let layerNames = _APP.configObj.gfxConfig.layers.map(d=>d.name);

            // Get the source canvas layer elements and store them.
            this.canvasLayerElems = [];
            for(let layerName of layerNames){
                this.DOM[`canvas_src_${layerName}`] = document.querySelector(`.canvasLayer[name='${layerName}']`);
                this.canvasLayerElems.push(this.DOM[`canvas_src_${layerName}`]);
            }

            // Copy canvas.
            this.DOM.copyCanvas.width  = this.canvasLayerElems[0].width;
            this.DOM.copyCanvas.height = this.canvasLayerElems[0].height;
            let copyCanvasCtx = this.DOM.copyCanvas.getContext("2d", { willReadFrequently: true } );

            // Zoom canvas.
            let zoomCanvasCtx = this.DOM.zoomCanvas.getContext("2d");
            this.DOM.copyCanvas.addEventListener('mousemove', (event) => this.hover1(event, copyCanvasCtx, zoomCanvasCtx), false);

            // Need to create a copy button for each layer and a copy all layers button.
            for(let layerName of layerNames){
                // Create the button. 
                let copyButton = document.createElement("button");
                copyButton.classList.add("debug_test_colorFinder_copyButtons");
                copyButton.id = `debug_colorFinder_copyButton_${layerName}`;
                copyButton.innerText = `Copy: ${layerName}`;

                // Add the event listener.
                copyButton.addEventListener("click", ()=>this.replaceCopyCanvas(this.DOM[`canvas_src_${layerName}`], copyCanvasCtx), false);

                // Add to the copyButtons container.
                this.DOM.copyButtons.append(copyButton);
            }
            
            // Create the copy all button. 
            {
                // Create the button. 
                let copyButton = document.createElement("button");
                copyButton.classList.add("debug_test_colorFinder_copyButtons");
                copyButton.id = `debug_colorFinder_copyButton_ALL`;
                copyButton.innerText = `Copy: ALL`;

                // Add the event listener.
                copyButton.addEventListener("click", ()=>this.copyAll(copyCanvasCtx), false);

                // Add to the copyButtons container.
                this.DOM.copyButtons.append(copyButton);
            }
        },
    },
    drawTimings :{
        DOM: {
            // Copy and Zoom canvases.
            "table_counts1": "gfx_debug_drawTimings_counts1",
            "table_timings": "gfx_debug_drawTimings_timings",
            "table_FPS"    : "gfx_debug_drawTimings_FPS",

            // Counts 1 (td elems will be created dynamically and stored here.)
            // counts1_ALL_changes
            // counts1_ALL_removals
            // counts1_ALL_tilemaps
            // counts1_L1_clearType
            // counts1_L1_changes
            // counts1_L1_removals
            // counts1_L1_tilemaps
            // counts1_L2_clearType
            // counts1_L2_changes
            // counts1_L2_removals
            // counts1_L2_tilemaps
            // counts1_L3_clearType
            // counts1_L3_changes
            // counts1_L3_removals
            // counts1_L3_tilemaps
            // counts1_L4_clearType
            // counts1_L4_changes
            // counts1_L4_removals
            // counts1_L4_tilemaps

            // Timings.
            // timings_ALL__A_clearLayer
            // timings_ALL__B_clearRemovedData
            // timings_ALL__C_checkChanges
            // timings_ALL__D_createTilemaps
            // timings_ALL__E_updateBgColor
            // timings_ALL__F_drawFromDataCache
            // timings_ALL__G_drawImgDataCache
            // timings_L1__A_clearLayer
            // timings_L1__B_clearRemovedData
            // timings_L1__C_checkChanges
            // timings_L1__D_createTilemaps
            // timings_L1__E_updateBgColor
            // timings_L1__F_drawFromDataCache
            // timings_L1__G_drawImgDataCache
            // timings_L2__A_clearLayer
            // timings_L2__B_clearRemovedData
            // timings_L2__C_checkChanges
            // timings_L2__D_createTilemaps
            // timings_L2__E_updateBgColor
            // timings_L2__F_drawFromDataCache
            // timings_L2__G_drawImgDataCache
            // timings_L3__A_clearLayer
            // timings_L3__B_clearRemovedData
            // timings_L3__C_checkChanges
            // timings_L3__D_createTilemaps
            // timings_L3__E_updateBgColor
            // timings_L3__F_drawFromDataCache
            // timings_L3__G_drawImgDataCache
            // timings_L4__A_clearLayer
            // timings_L4__B_clearRemovedData
            // timings_L4__C_checkChanges
            // timings_L4__D_createTilemaps
            // timings_L4__E_updateBgColor
            // timings_L4__F_drawFromDataCache
            // timings_L4__G_drawImgDataCache
            // timings_ALL____TOTAL
            // timings_L1____TOTAL
            // timings_L2____TOTAL
            // timings_L3____TOTAL
            // timings_L4____TOTAL

            // FPS
            // fps_fps
            // fps_msFrame
            // fps_deltaFrame
            // fps_framesProcessed
            // fps_framesDrawn
        },
        dataCacheTimings: {},
        dataCacheFPS: {},
        dataCacheCounts2: {},

        refresh: function(){ console.log("drawTimings:refresh"); },
        init: async function(){ 
            _GFX.DEBUG.util.parseDOMStrings(this.DOM);

            // Need to "ask" for the data keys. These will determine some of the elements that need to be created.
            let data = await _WEBW_V.SEND("_DEBUG.getDrawTimingsObject", {
                data: {} 
            }, true, true);
            data = data.data;

            // Get the list of layer names.
            let layerNames = _APP.configObj.gfxConfig.layers.map(d=>d.name);

            // Init the dataCacheTimings.
            for(let name of layerNames){ this.dataCacheTimings[name] = {}; }
            this.dataCacheTimings["ALL"] = {};

            let createTable_counts1 = (layerNames)=>{
                // Get the table.
                let table = this.DOM.table_counts1;
                let tr, td;
                
                // Header row.
                tr = table.insertRow(-1);
                td = tr.insertCell(); td.classList.add("header"); td.innerText = "";
                td = tr.insertCell(); td.classList.add("header", "center"); td.innerText = "ALL"; 
                for(let name of layerNames){ td = tr.insertCell(); td.classList.add("header", "center"); td.innerText = name; }
                
                // Data row: tilemaps
                tr = table.insertRow(-1);
                td = tr.insertCell(); td.classList.add("header"); td.innerText = "LAYER OBJECTS";
                td = tr.insertCell(); td.classList.add("data", "center"); td.innerText = ""; this.DOM.counts1_ALL_tilemaps = td;
                for(let name of layerNames){ td = tr.insertCell(); td.classList.add("data"); td.innerText = ""; this.DOM[`counts1_${name}_tilemaps`] = td; }
                
                // Data row: changes
                tr = table.insertRow(-1);
                td = tr.insertCell(); td.classList.add("header"); td.innerText = "CHANGES";
                td = tr.insertCell(); td.classList.add("data", "center"); td.innerText = ""; this.DOM.counts1_ALL_changes = td;
                for(let name of layerNames){ td = tr.insertCell(); td.classList.add("data"); td.innerText = ""; this.DOM[`counts1_${name}_changes`] = td; }
                
                // Data row: removals
                tr = table.insertRow(-1);
                td = tr.insertCell(); td.classList.add("header"); td.innerText = "REMOVALS";
                td = tr.insertCell(); td.classList.add("data", "center"); td.innerText = ""; this.DOM.counts1_ALL_removals = td;
                for(let name of layerNames){ td = tr.insertCell(); td.classList.add("data"); td.innerText = ""; this.DOM[`counts1_${name}_removals`] = td; }
                
                // Data row: clearType
                tr = table.insertRow(-1);
                td = tr.insertCell(); td.classList.add("header"); td.innerText = "CLEARTYPE";
                td = tr.insertCell(); td.classList.add("data", "center"); td.innerText = "--";
                for(let name of layerNames){ td = tr.insertCell(); td.classList.add("data"); td.innerText = ""; this.DOM[`counts1_${name}_clearType`] = td; }
            };
            let createTable_timings = ()=>{
                let skipTheseKeys = new Set([
                    "___TOTAL",
                    "tilemaps",
                    "removals",
                    "changes",
                    "clearType",
                ]);

                // Get the table.
                let table = this.DOM.table_timings;
                let tr, td;
                
                // Header row.
                tr = table.insertRow(-1);
                td = tr.insertCell(); td.classList.add("header"); td.innerText = "*";
                td = tr.insertCell(); td.classList.add("header", "center"); td.innerText = "ALL"; 
                for(let name of layerNames){ td = tr.insertCell(); td.classList.add("header", "center"); td.innerText = name; }

                let timerKeys = Object.keys(data.ALL).filter(d=>!skipTheseKeys.has(d));

                for(let key of timerKeys){ 
                    // New row.
                    tr = table.insertRow(-1);

                    // Header Column.
                    td = tr.insertCell(); td.classList.add("header"); td.innerText = key;
                    
                    // Data row: ALL.
                    td = tr.insertCell(); td.classList.add("data", "center"); td.innerText = ""; //data.ALL[key];
                    this.DOM[`timings_ALL_${key}`] = td;
                    
                    for(let name of layerNames){
                        // Data row.
                        td = tr.insertCell(); td.classList.add("data", "center" ); td.innerText = ""; // data[name][key];
                        this.DOM[`timings_${name}_${key}`] = td;
                    }
                }

                // Total: ALL and Individual layers.
                tr = table.insertRow(-1);
                td = tr.insertCell(); td.classList.add("header"); td.innerText = "TOTAL PER LAYER";
                td = tr.insertCell(); td.classList.add("data", "center"); td.innerText = "--";
                for(let name of layerNames){
                    td = tr.insertCell(); td.classList.add("data", "center"); td.innerText = "";
                    this.DOM[`timings_${name}____TOTAL`] = td;
                }
                
                // Total: Total time for this frame.
                tr = table.insertRow(-1);
                td = tr.insertCell(); td.classList.add("header"); td.innerText = "TOTAL ALL LAYERS";
                td = tr.insertCell(); td.classList.add("data", "center"); td.innerText = ""; td.setAttribute("colspan", 1+layerNames.length);
                this.DOM[`timings_ALL____TOTAL`] = td;

            };
            let createTable_fps     = ()=>{
                // Get the table.
                let table = this.DOM.table_FPS;
                let tr, td;

                // Header row.
                tr = table.insertRow(-1);
                td = tr.insertCell(); td.classList.add("header", "center"); td.innerText = "Avg FPS";
                td = tr.insertCell(); td.classList.add("header", "center"); td.innerText = "Avg ms/frame";
                td = tr.insertCell(); td.classList.add("header", "center"); td.innerText = "Avg delta/frame";
                td = tr.insertCell(); td.classList.add("header", "center"); td.innerText = "Frames Processed";
                td = tr.insertCell(); td.classList.add("header", "center"); td.innerText = "Frames NOT Drawn";
                
                // Data row.
                tr = table.insertRow(-1);
                td = tr.insertCell(); td.classList.add("data"); td.innerText = 0; this.DOM.fps_fps = td;
                td = tr.insertCell(); td.classList.add("data"); td.innerText = 0; this.DOM.fps_msFrame = td;
                td = tr.insertCell(); td.classList.add("data"); td.innerText = 0; this.DOM.fps_deltaFrame = td;
                td = tr.insertCell(); td.classList.add("data"); td.innerText = "0.0k"; this.DOM.fps_framesProcessed = td;
                td = tr.insertCell(); td.classList.add("data"); td.innerText = "0.0k"; this.DOM.fps_framesDrawn = td;
            };

            createTable_counts1(layerNames);
            createTable_timings(layerNames);
            createTable_fps();
        },

        // Display tilemap, changes, and removals counts for each layer (and combined totals too.)
        updateTable_counts1: function(data, layerNames){
            // Update the counts for ALL.
            let elemDest, newVal;
            elemDest = this.DOM.counts1_ALL_tilemaps; newVal = data["ALL"].tilemaps; 
            if(newVal == 0){ elemDest .innerText = "";  } else { elemDest .innerText = newVal;  }

            elemDest = this.DOM.counts1_ALL_changes;  newVal = data["ALL"].changes;  
            if(newVal == 0){ elemDest .innerText = "";  } else { elemDest .innerText = newVal;  }

            elemDest = this.DOM.counts1_ALL_removals; newVal = data["ALL"].removals; 
            if(newVal == 0){ elemDest .innerText = "";  } else { elemDest .innerText = newVal;  }

    
            // Update the counts for each layer.
            for(let name of layerNames){ 
                if(data[name].tilemaps  != this.dataCacheTimings[name].tilemaps) { 
                    elemDest = this.DOM[`counts1_${name}_tilemaps`]; newVal = data[name].tilemaps;
                    if(newVal == 0){ elemDest .innerText = "";  } else { elemDest .innerText = newVal;  }
                }
                if(data[name].changes   != this.dataCacheTimings[name].changes ) { 
                    elemDest = this.DOM[`counts1_${name}_changes`]; newVal = data[name].changes;
                    if(newVal == 0){ elemDest .innerText = "";  } else { elemDest .innerText = newVal;  }
                }
                if(data[name].removals  != this.dataCacheTimings[name].removals) { 
                    elemDest = this.DOM[`counts1_${name}_removals`]; newVal = data[name].removals;
                    if(newVal == 0){ elemDest .innerText = "";  } else { elemDest .innerText = newVal;  }
                }
                if(data[name].clearType != this.dataCacheTimings[name].clearType){ 
                    elemDest = this.DOM[`counts1_${name}_clearType`]; newVal = data[name].clearType;
                    if(newVal == 0){ elemDest .innerText = "";  } else { elemDest .innerText = newVal;  }
                }
            }
        },

        // Displays the timings for each graphics operation.
        updateTable_timings: function(data, layerNames){
            let skipTheseKeys = new Set([
                "___TOTAL",
                "tilemaps",
                "removals",
                "changes",
                "clearType",
            ]);
            let timerKeys = Object.keys(data.ALL).filter(d=>!skipTheseKeys.has(d));

            let destElem, newValue, prevValue;
            for(let key of timerKeys){ 
                // Individual layers.
                for(let name of layerNames){ 
                    destElem  = this.DOM[`timings_${name}_${key}`];
                    prevValue = (this.dataCacheTimings[name][key] ?? 0).toFixed(1);
                    newValue  = (data[name][key] ?? 0).toFixed(1);
                    if(prevValue != newValue){
                        if(newValue == 0){ destElem .innerText = "";  } else { destElem .innerText = newValue;  }
                    }
                }
                
                // ALL.
                destElem  = this.DOM[`timings_ALL_${key}`];
                prevValue = (this.dataCacheTimings["ALL"][key] ?? 0).toFixed(1);
                newValue  = (data["ALL"][key] ?? 0).toFixed(1);
                if(prevValue != newValue){
                    if(newValue == 0){ destElem .innerText = "";  } else { destElem .innerText = newValue;  }
                }
            }
            
            // Total: Individual layers.
            for(let name of layerNames){ 
                destElem  = this.DOM[`timings_${name}____TOTAL`];
                prevValue = (this.dataCacheTimings[name][["___TOTAL"]] ?? 0).toFixed(1);
                newValue  = (data[name]["___TOTAL"] ?? 0).toFixed(1);
                if(prevValue != newValue){
                    if(newValue == 0){ destElem .innerText = "";  } else { destElem .innerText = newValue;  }
                }
            }
            
            // Total: Total time for this frame.
            destElem  = this.DOM[`timings_ALL____TOTAL`];
            prevValue = (this.dataCacheTimings["ALL"]["___TOTAL"] ?? 0).toFixed(1);
            newValue  = (data["ALL"]["___TOTAL"] ?? 0).toFixed(1);
            if(prevValue != newValue){ destElem .innerText = newValue + " ms"; }
        },

        // Display the current FPS data.
        updateTable_fps    : function(){
            let new_average          = _APP.game.gameLoop.fpsCalc.average.toFixed(0) ?? 0;
            let new_avgMsPerFrame    = _APP.game.gameLoop.fpsCalc.avgMsPerFrame.toFixed(1) ?? 0;
            let msDiff               = (_APP.game.gameLoop.fpsCalc.avgMsPerFrame - _APP.game.gameLoop.msFrame).toFixed(1);
            
            let new_frameCounter     = (_APP.game.gameLoop.frameCounter    /1000).toFixed(1)+"k";
            // let new_frameCounter     = (_APP.game.gameLoop.frameCounter    );
            
            let new_frameDrawCounter = (_APP.game.gameLoop.frameCounter -_APP.game.gameLoop.frameDrawCounter); // Frames NOT drawn.
            // let new_frameDrawCounter = (_APP.game.gameLoop.frameDrawCounter/1000).toFixed(1)+"k"; // Frames drawn.
            // let new_frameDrawCounter = (_APP.game.gameLoop.frameDrawCounter); // Frames drawn.

            if(new_average          != this.dataCacheFPS.fps)                { this.DOM.fps_fps              .innerText = new_average;           this.dataCacheFPS.fps                  = new_average;          }
            if(new_avgMsPerFrame    != this.dataCacheFPS.msFrame)            { this.DOM.fps_msFrame          .innerText = new_avgMsPerFrame;     this.dataCacheFPS.msFrame              = new_avgMsPerFrame;    }
            if(msDiff               != this.dataCacheFPS.deltaFrame)         { this.DOM.fps_deltaFrame       .innerText = msDiff;                this.dataCacheFPS.deltaFrame           = msDiff;               }
            if(new_frameCounter     != this.dataCacheCounts2.framesProcessed){ this.DOM.fps_framesProcessed .innerText   = new_frameCounter;     this.dataCacheCounts2.framesProcessed  = new_frameCounter;     }
            if(new_frameDrawCounter != this.dataCacheCounts2.framesDrawn)    { this.DOM.fps_framesDrawn     .innerText   = new_frameDrawCounter; this.dataCacheCounts2.framesDrawn      = new_frameDrawCounter; }
        },
        update: function(data){
            let layerNames = _APP.configObj.gfxConfig.layers.map(d=>d.name);

            this.updateTable_counts1(data, layerNames);
            this.updateTable_timings(data, layerNames);
            this.updateTable_fps();

            // Update the dataCacheTimings for future compares.
            this.dataCacheTimings = data;
        },
    },
    globalFade  :{
        refresh: function(){ console.log("globalFade:refresh"); },
        init: async function(){ 
        },
    },
    hashCache   :{
        refresh: function(){ console.log("hashCache:refresh"); },
        init: async function(){ 
        },
    },
    layerObjects:{
        refresh: function(){ console.log("layerObjects:refresh"); },
        init: async function(){ 
        },
    },

    debugRunDelays: {
        // main: runDebug_waitFrames: The absolute speed governor. 
        // Main's runDebug_waitFrames is the max speed for updates.
        // Nothing can run faster than main's runDebug_waitFrames. 
        // Any number lower than main's runDebug_waitFrames would only effectively run at main's runDebug_waitFrames.
        main: {
            runDebug_waitFrames: 5,  // Number of frames to wait between debug runs.
            runDebug_wait: null    ,  // Set in init (with: _APP.game.gameLoop.msFrame * this.debugRunDelays.main.runDebug_waitFrames.);
            runDebug_last: 0       ,  // The timestamp for the last debug run.
            runDebug_lastDuration: 0, // The last duration for the debug display.
        },
        // colorFinder: Nothing to live update here.
        colorFinder: {
            enabled: false,
            runDebug_waitFrames: 0, 
            runDebug_wait: null    , 
            runDebug_last: 0       , 
            runDebug_lastDuration: 0,
        },
        drawTimings: {
            enabled: true,
            runDebug_waitFrames: 0, 
            runDebug_wait: null    , 
            runDebug_last: performance.now()       , 
            runDebug_lastDuration: 0,
        },
        globalFade: {
            enabled: true,
            runDebug_waitFrames: 0, 
            runDebug_wait: null    , 
            runDebug_last: 0       , 
            runDebug_lastDuration: 0,
        },
        hashCache: {
            enabled: true,
            runDebug_waitFrames: 0, 
            runDebug_wait: null    , 
            runDebug_last: 0       , 
            runDebug_lastDuration: 0,
        },
        layerObjects: {
            enabled: true,
            runDebug_waitFrames: 0, 
            runDebug_wait: null    , 
            runDebug_last: 0       , 
            runDebug_lastDuration: 0,
        },
    },
    updateDebugDisplays: function(data){
        // Don't run debug until it is time. 
        let debugCanRun = (performance.now() - this.debugRunDelays.main.runDebug_last) > this.debugRunDelays.main.runDebug_wait;
        if( !debugCanRun ){ return; }

        // Store the timestamp for this debug display run.
        let debug_ts = performance.now();

        if(!this.statsControls.controlButtons.initialStatesSet){
            this.statsControls.controlButtons.setAllButtonStates();
            this.statsControls.controlButtons.initialStatesSet = true;
        }

        if(_APP.navBarMAIN.activeView == "gfx"){
            // Update the active view.
            switch(_GFX.DEBUG.navBar1.activeView){
                case "colorFinder" : {
                    if(!this.debugRunDelays.drawTimings.colorFinder){ break; }
                    let debugCanRun2 = (performance.now() - this.debugRunDelays.colorFinder.runDebug_last) > this.debugRunDelays.colorFinder.runDebug_wait;
                    if( debugCanRun2 ){ 
                        let debug_ts2 = performance.now();
                        // this.colorFinder.update(data.layerDrawTimings); 
                        this.debugRunDelays.colorFinder.runDebug_lastDuration = performance.now() - debug_ts2;
                        this.debugRunDelays.colorFinder.runDebug_last = performance.now();
                    }
                    break; 
                }
                case "drawTimings" : { 
                    if(!this.debugRunDelays.drawTimings.enabled){ break; }
                    let debugCanRun2 = (performance.now() - this.debugRunDelays.drawTimings.runDebug_last) > this.debugRunDelays.drawTimings.runDebug_wait;
                    if( debugCanRun2 ){ 
                        let debug_ts2 = performance.now();
                        this.drawTimings.update(data.layerDrawTimings); 
                        this.debugRunDelays.drawTimings.runDebug_lastDuration = performance.now() - debug_ts2;
                        this.debugRunDelays.drawTimings.runDebug_last = performance.now();
                    }
                    break; 
                }
                case "globalFade"  : { 
                    if(!this.debugRunDelays.globalFade.enabled){ break; }
                    let debugCanRun2 = (performance.now() - this.debugRunDelays.globalFade.runDebug_last) > this.debugRunDelays.globalFade.runDebug_wait;
                    if( debugCanRun2 ){ 
                        let debug_ts2 = performance.now();
                        // this.globalFade.update(data.layerDrawTimings); 
                        this.debugRunDelays.globalFade.runDebug_lastDuration = performance.now() - debug_ts2;
                        this.debugRunDelays.globalFade.runDebug_last = performance.now();
                    }
                    break; 
                }
                case "hashCache"   : { 
                    if(!this.debugRunDelays.hashCache.enabled){ break; }
                    let debugCanRun2 = (performance.now() - this.debugRunDelays.hashCache.runDebug_last) > this.debugRunDelays.hashCache.runDebug_wait;
                    if( debugCanRun2 ){ 
                        let debug_ts2 = performance.now();
                        // this.hashCache.update(data.layerDrawTimings); 
                        this.debugRunDelays.hashCache.runDebug_lastDuration = performance.now() - debug_ts2;
                        this.debugRunDelays.hashCache.runDebug_last = performance.now();
                    }
                    break; 
                }
                case "layerObjects": { 
                    if(!this.debugRunDelays.layerObjects.enabled){ break; }
                    let debugCanRun2 = (performance.now() - this.debugRunDelays.layerObjects.runDebug_last) > this.debugRunDelays.layerObjects.runDebug_wait;
                    if( debugCanRun2 ){ 
                        let debug_ts2 = performance.now();
                        // this.layerObjects.update(data.layerDrawTimings); 
                        this.debugRunDelays.layerObjects.runDebug_lastDuration = performance.now() - debug_ts2;
                        this.debugRunDelays.layerObjects.runDebug_last = performance.now();
                    }
                    break; 
                }
            };

            // Update the progress bars in statsControls.
            // if(!this.debugRunDelays.drawTimings.colorFinder){ break; }
            // let debugCanRun2 = (performance.now() - this.debugRunDelays.colorFinder.runDebug_last) > this.debugRunDelays.colorFinder.runDebug_wait;
            // if( debugCanRun2 ){ 
            //     let debug_ts2 = performance.now();
                let obj = {
                    debug : {"barKey": "debugBar" , "data": this.debugRunDelays.main.runDebug_lastDuration  },
                    loop  : {"barKey": "LoopBar"  , "data":  _APP.utility.timeIt("loop_total", "get") },
                    render: {"barKey": "renderBar", "data": _APP.utility.timeIt("render_total", "get") },
                    draw  : {"barKey": "GfxBar"   , "data":  _GFX.DEBUG.drawTimings.dataCacheTimings.ALL.___TOTAL },
                };
                this.statsControls.progressBars.updateDisplay(obj); 
            //     this.debugRunDelays.colorFinder.runDebug_lastDuration = performance.now() - debug_ts2;
            //     this.debugRunDelays.colorFinder.runDebug_last = performance.now();
            // }

            //
            // this.debugRunDelays.main.runDebug_lastDuration = performance.now() - debug_ts;
            // this.debugRunDelays.main.runDebug_last = performance.now();
        }

        // DONE WITH DEBUG. 
        this.debugRunDelays.main.runDebug_lastDuration = performance.now() - debug_ts;
        this.debugRunDelays.main.runDebug_last = performance.now();
    },

    init: async function(){
        let createTabs_main = async function(){
            let tabConfig = _APP.configObj.gfxConfig.tabConfig;

            let destTabs  = document.getElementById(tabConfig.destTabs );
            let destViews = document.getElementById(tabConfig.destViews);
    
            // Create the DEBUG tab for the main menu bar.
            let tab2 = document.createElement("li");
            tab2.id = "navTab_gfx_debug"; 
            tab2.innerText = "DEBUG: GRAPHICS";
            destTabs.append(tab2);
    
            // Create the DEBUG view for the main menu bar.
            let view2 = document.createElement("div");
            view2.id = "navView_gfx_debug"; 
            view2.classList.add("navView");
            view2.setAttribute("tabindex", 0);
            destViews.append(view2);

             // Create the DOM entry for the main menu bar.
             _APP.navBarMAIN.DOM["gfx"] = { 
                tab : "navTab_gfx_debug", 
                view: "navView_gfx_debug", 
                extraClasses: { 
                    cont: ["gfxDebugWide"]
                }, 
                onShow: null, 
                onHide: null 
            };

            // Get the remaining debug files. Populate the view with the HTML files(s).
            let key = "gfxConfig";
            if(_APP.configObj[key].debugFiles2 && _APP.configObj[key].debugFiles2.length){
                for(let rec of _APP.configObj[key].debugFiles2){ 
                    let data = await _APP.utility.addFile( rec, _APP.relPath); 
                    if(rec.t == "html" && rec.destId){ document.getElementById(rec.destId).innerHTML = data;}
                }
            }

            // Init the sub menu.
            _GFX.DEBUG.navBar1.init();
        };
        
        // Create the main tabs (add to the main bar and create the first sub menu.
        await createTabs_main();
        
        // Init the debug plugins.
        await this.statsControls.init(); // Load the statsControls.
        await this.colorFinder  .init(); // Load the colorFinder.
        await this.drawTimings  .init(); // Load the drawTimings.
        await this.globalFade   .init(); // Load the globalFade.
        await this.hashCache    .init(); // Load the hashCache.
        await this.layerObjects .init(); // Load the layerObjects.
        
        // Display the default tab (Main sub menu.)
        // _GFX.DEBUG.navBar1.showOne("colorFinder");
        _GFX.DEBUG.navBar1.showOne("drawTimings");
        // _GFX.DEBUG.navBar1.showOne("globalFade");
        // _GFX.DEBUG.navBar1.showOne("hashCache");
        // _GFX.DEBUG.navBar1.showOne("layerObjects");

        // Display the default tab. (Sub sub menus.)
        //

        // Calculate the runDebug_wait for the  main debug loop and for each plugin.
        this.debugRunDelays.main        .runDebug_wait = (_APP.game.gameLoop.msFrame * this.debugRunDelays.main        .runDebug_waitFrames) | 0;
        this.debugRunDelays.colorFinder .runDebug_wait = (_APP.game.gameLoop.msFrame * this.debugRunDelays.colorFinder .runDebug_waitFrames) | 0;
        this.debugRunDelays.drawTimings .runDebug_wait = (_APP.game.gameLoop.msFrame * this.debugRunDelays.drawTimings .runDebug_waitFrames) | 0;
        this.debugRunDelays.globalFade  .runDebug_wait = (_APP.game.gameLoop.msFrame * this.debugRunDelays.globalFade  .runDebug_waitFrames) | 0;
        this.debugRunDelays.hashCache   .runDebug_wait = (_APP.game.gameLoop.msFrame * this.debugRunDelays.hashCache   .runDebug_waitFrames) | 0;
        this.debugRunDelays.layerObjects.runDebug_wait = (_APP.game.gameLoop.msFrame * this.debugRunDelays.layerObjects.runDebug_waitFrames) | 0;
    }

    /* 
     */
};