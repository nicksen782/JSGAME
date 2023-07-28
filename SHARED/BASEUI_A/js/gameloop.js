_APP.game = {
    // Gamestate 1 values.
    gs1: "",                    // Current gamestate 1.
    changeGs1_triggered: false, // Flag: gamestate 1 change triggered.
    gs1_new: "",                // The new scheduled gamestate 1.
    gs1_prev: "",               // The previous gamestate 1.
    
    // Gamestate 1 values.
    gs2: "",                    // Current gamestate 2.
    changeGs2_triggered: false, // Flag: gamestate 2 change triggered.
    gs2_new: "",                // The new scheduled gamestate 2.
    gs2_prev: "",               // The previous gamestate 2.

    // Schedules a gamestate 1 change.
    changeGs1: function(new_gs1){
        // Make sure that this is a valid gamestate 1.
        if(this.gamestates_list.indexOf(new_gs1) == -1){
            throw `changesGs1: Unknown gamestate for new_gs1: ${new_gs1}.`;
        }

        // Set the gamestate change trigger.
        this.changeGs1_triggered = true; 

        // Set the previous gamestate.
        this.gs1_prev = this.gs1; 
        
        // Set the new gamestate.
        this.gs1_new = new_gs1; 
    },
    // Changes the gamestate 1.
    _changeGs1: function(){
        // Unset the gamestate change trigger.
        this.changeGs1_triggered = false; 
        
        // Set the new gamestate.
        this.gs1 = this.gs1_new;
        
        // Clear gamestate 2.
        // this.gs2 = "";
        
        // Reset the inited flag for this gamestate.
        if(this.gs1 == ""){ return; }
        _APP.game.gamestates[this.gs1].inited = false;

        // console.log(`gs1 has changed from '${this.gs1_prev}' to '${this.gs1_new}'`);
    },

    // Schedules a gamestate 2 change.
    changeGs2: function(new_gs2){
        // Set the gamestate change trigger.
        this.changeGs2_triggered = true; 

        // Set the previous gamestate.
        this.gs2_prev = this.gs2; 
        
        // Set the new gamestate.
        this.gs2_new = new_gs2; 
    },
    // Changes the gamestate 2.
    _changeGs2: function(){
        // Unset the gamestate change trigger.
        this.changeGs2_triggered = false; 
        
        // Set the new gamestate.
        this.gs2 = this.gs2_new;

        // console.log(`gs2 has changed from '${this.gs2_prev}' to '${this.gs2_new}'`);
    },

    // Gamestate code will be placed here by each gamestate.
    gamestates: {},

    // A list of available gamestates for gs1.
    gamestates_list: {},

    // Code for running the gameloop.
    gameLoop: {
        frameCounter    : 0,         // Count of every game loop iteration.
        frameDrawCounter: 0,         // Count of every draw update.
        loopType        : "raf",     // Can be "raf" for requestAnimationFrame or "to" for setTimeout.
        raf_id          : null,      // Used for stopping the game loop. 
        running         : false,     // The game loop will only run if this is set to true.
        fps             : 60,        // The target Frames Per Second value. (Max of 60.)
        msFrame         : null,      // Calculated value of the duration of one frame in milliseconds.
        lastLoopRun     : 0,         // Timestamp for when the last game loop began.
        delta           : undefined, // The difference between now and the lastLoopRun
        fadeIsBlocking  : false,     // TODO: Flag indicating if a fadeIn or fadeOut is logic-blocking while in progress.
        skipLogic       : false,
        lastLoop_timestamp   : 0,

        // Starts the game loop after stopping it if it is running. Schedules the next frame.
        loop_start: function(){
            // Stop the next scheduled gameLoop if the gameLoop is running.
            if(this.running){ this.loop_stop(); }
            
            // Start the gameLoop.
            this.running = true; 
        
            // Schedule the next gameloop run.
            this.loop_schedule_nextRun();
        },

        // Stops the game loop (Cancels the next frame.)
        loop_stop: function(){
            // Set the gameLoop.running to false. 
            this.running = false;

            // Cancel the next scheduled animation frame. 
            if     (this.loopType == "raf"){ window.cancelAnimationFrame(this.raf_id);  }
            else if(this.loopType == "to") { window.clearTimeout(this.raf_id); }
            else{ console.error("Invalid loopType:", this.loopType); }
        },

        // Requests the next game loop iteration.
        loop_schedule_nextRun: function(){
            if     (this.loopType == "raf"){ this.raf_id = window.requestAnimationFrame( (ts)=>{ this.loop( ts ); } ); }
            else if(this.loopType == "to") { this.raf_id = setTimeout(                   (  )=>{ this.loop( performance.now() ); }, 0 ); }
            else{ console.error("Invalid loopType:", this.loopType); }
        },

        // Runs at the end of every game loop iteration. 
        endOfLoopTasks: async function(timestamp){
            // Update the 
            if(timestamp){
                // GAMESTATE CHANGES
                if(_APP.game.changeGs2_triggered){ _APP.game._changeGs2(); } 
                if(_APP.game.changeGs1_triggered){ _APP.game._changeGs1(); } 
            }

            // Run queued functions.
            if(_APP.utility.funcQueue.funcs.length){
                while(_APP.utility.funcQueue.funcs.length){
                    // if(_APP.utility.funcQueue.funcs.length != 1){
                        // console.log(`_APP.utility.funcQueue: RUNNING: '${_APP.utility.funcQueue.funcs[0].name}', REMAINING FUNCTIONS: ${_APP.utility.funcQueue.funcs.length}` );
                    // }
                    // console.log(`_APP.utility.funcQueue: RUNNING: '${_APP.utility.funcQueue.funcs[0].name}', REMAINING FUNCTIONS: ${_APP.utility.funcQueue.funcs.length}` );
                    _APP.utility.funcQueue.runNext();
                }
            }

            // Request the next frame.
            this.loop_schedule_nextRun();
        },

        // Game loop init.
        init: async function(){
            // Calculate the ms required per frame.
            this.msFrame = 1000 / this.fps;
        
            // Init the fps object.
            this.fpsCalc.init(this.fps);
        
            // Generate all graphics on the WebWorker.
            if(_APP.configObj.gfxConfig.generateCoreImageDataAssets){
                await _APP.utility.generateCoreImageDataAssets();
            }

            // Give default values to avoid "jumpy values" at start.
            _APP.game.gameLoop.fpsCalc.average = this.fps;
            _APP.game.gameLoop.fpsCalc.avgMsPerFrame = _APP.game.gameLoop.msFrame;
            _APP.game.gameLoop.lastLoopRun = performance.now() - _APP.game.gameLoop.msFrame;
        
            // Get initial input states.
            if(_APP.configObj.inputConfig.enabled){
                await _INPUT.util.getStatesForPlayers();
            }
        
            // Get a list of the gamestates. 
            _APP.game.gamestates_list = Object.keys(_APP.game.gamestates);
        
            // Set the first gamestate.
            if(_APP.configObj.gameConfig.firstGamestate1 || _APP.configObj.gameConfig.firstGamestate2){
                if(_APP.configObj.gameConfig.firstGamestate1){ _APP.game.changeGs1( _APP.configObj.gameConfig.firstGamestate1 ); }
                if(_APP.configObj.gameConfig.firstGamestate2){ _APP.game.changeGs1( _APP.configObj.gameConfig.firstGamestate2 ); }
            }
            else{
                _APP.game.changeGs1("gs_JSG");
            }
        
            // Change to the set gamestate.
            _APP.game._changeGs1();

            // Populate the repo data.
            if(_APP.configObj.gameInfo){ await this.createInfoTab(); }
        },

        // TODO: Perhaps this could be in an init gamestate1 instead?
        createInfoTab: async function(){
            // // INFO: _APP.game
            // gameInfo: {
            //     "repo":{
            //         "author_title" : "videoModeB_tests",
            //         "author_C"     : true,
            //         "author_year"  : "2023",
            //         "author_name"  : "Nickolas Andersen",
            //         "author_handle": "(nicksen782)",
            //         "repoType"     : "Github",
            //         "repoHref"     : "https://github.com/nicksen782/JSGAME_videoModeB_tests/tree/v2",
            //         "repoText"     : "nicksen782/JSGAME_videoModeB_tests/tree/v2"
            //     },
            // }

            // let MENUBUTTON = document.getElementById("navTab_MENUBUTTON");
            let navTab_gameName = document.getElementById("navTab_gameName");
            let destTabs  = document.getElementById(_APP.navBarMAIN.tabsContainer);
            let destViews = document.getElementById(_APP.navBarMAIN.viewsContainer);

            // Create the "Info" tab for the main menu bar.
            let tab2 = document.createElement("li");
            tab2.id = "navTab_info"; 
            tab2.innerText = "INFO";
            destTabs.insertBefore(tab2, navTab_gameName.nextSibling);
            // destTabs.insertBefore(tab2, MENUBUTTON.nextSibling);
            
            // Create the "Info" view for the main menu bar.
            let view2 = document.createElement("div");
            view2.id = "navView_info"; 
            view2.classList.add("navView");
            destViews.append(view2);
            
            // Create DOM entry for the main menu bar.
            _APP.navBarMAIN.DOM["info"] = { 
                tab : "navTab_info", 
                view: "navView_info", 
                extraClasses: { 
                    cont: ["infoWide"]
                }, 
                onShow: null, 
                onHide: null 
            };

            if(_APP.configObj.gameInfo.repo){
                view2.style["white-space"] = "pre";
                view2.innerHTML = JSON.stringify(_APP.configObj.gameInfo.repo, null, 1);
            }
        },

        // Calculates the average frames per second.
        fpsCalc: {
            // colxi: https://stackoverflow.com/a/55644176/2731377
            sampleSize   : undefined,
            _sample_     : undefined,
            average      : undefined,
            avgMsPerFrame: undefined,
            _index_      : undefined,
            _lastTick_   : undefined,

            // Internal within tick.
            __delta_     : undefined,
            __fps_       : undefined,
            __average_   : undefined,
            __average_i_ : undefined,

            tick : function tick(now){
                // if is first tick, just set tick timestamp and return
                if( !this._lastTick_ ){ this._lastTick_ = now; return 0; }

                // Determine the fps for this tick. 
                this.__delta_ = (now - this._lastTick_) / 1000;
                this.__fps_ = (1 / this.__delta_) << 0; // Round down fps.
                
                // Add to fps samples the current tick fps value.
                this._sample_[ this._index_ ] = this.__fps_;
                
                // Get the fps average by summing all samples and dividing by the sample count. 
                this.__average_ = 0;
                this.__average_i_ = this._sample_.length; 
                while (this.__average_i_--) { this.__average_ += this._sample_[this.__average_i_]; } 
                this.__average_ = ( this.__average_ / this._sample_.length);

                // Set the new FPS average.
                this.average = this.__average_;
                this.avgMsPerFrame = 1000 / this.__average_;

                // Store current timestamp
                this._lastTick_ = now;

                // Increase the sample index counter
                this._index_ += 1;

                // Reset the sample index counter if it excedes the maximum sampleSize limit
                if( this._index_ == this.sampleSize) this._index_ = 0;
                
                return this.average;
            },
            init: function init(sampleSize){
                // Set initial values.
                this.sampleSize = sampleSize;
                this._index_    = 0 ;
                this.average    = 0 ;
                this.avgMsPerFrame = 0 ;
                this._lastTick_ = 0 ;

                // Create new samples Uint8Array and fill with the default value.
                this._sample_ = new Uint8Array( new ArrayBuffer(this.sampleSize) );
                // this._sample_.fill(0);
                // this._sample_.fill(30);
                this._sample_.fill(sampleSize);
            },
        },

        // THE GAME LOOP FUNCTION.
        loop: async function loop(timestamp){
            // Is the loop active?
            if(this.running){
                // Calculate the time difference between the new timestamp and the lastLoopRun. 
                this.delta = timestamp - this.lastLoopRun;

                // Skip the loop if the audio is not enabled yet?
                if(_APP.configObj.soundConfig.blockLoopIfSoundNotLoaded && !_SND.audioStarted){
                    // End the loop and run any end of loop tasks.
                    this.endOfLoopTasks(false);
                    return;
                }

                // Is it time to run the next loop?
                if( (this.delta >= this.msFrame) ){
                    // Track performance.
                    this.fpsCalc.tick(timestamp - (this.delta % this.msFrame));
                    this.lastLoopRun = timestamp - (this.delta % this.msFrame);
                    this.frameCounter += 1;

                    _APP.utility.timeIt("loop_total", "reset");
                    _APP.utility.timeIt("draw_total", "reset");
                    _APP.utility.timeIt("render_total", "reset");

                    _APP.utility.timeIt("loop_total", "start");
                    let lastLoop_timestamp = performance.now();

                    // _APP.utility.timeIt("draw_total", "start");
                    // _APP.utility.timeIt("draw_total", "stop");

                    // Do not run the logic loop if the gamestate value is "".
                    if(_APP.game.gs1 != ""){
                        // Do not run the logic loop if the skipLogic value is true.
                        if(!this.skipLogic){
                            // -- NETWORK --
                            //

                            // -- INPUT --
                            if(_APP.configObj.inputConfig.enabled){
                                await _INPUT.util.getStatesForPlayers();
                                if(typeof _INPUT.customized.updateLiveGamepadDisplay != "undefined"){
                                    _INPUT.customized.updateLiveGamepadDisplay();
                                }
                            }

                            // -- LOGIC --
                            _APP.game.gamestates[_APP.game.gs1].main();
                            
                            // -- RENDER --

                            _APP.utility.timeIt("render_total", "start");
                            // Render using the _GFX.layerObjs.render function if the current gamestate does not have a separate render function.
                            if( !_APP.game.gamestates[_APP.game.gs1].render){ _GFX.layerObjs.render(_APP.game.gs1); }
                            
                            // Render using the gamestate's render function.
                            else                                            { _APP.game.gamestates[_APP.game.gs1].render(); }
                            _APP.utility.timeIt("render_total", "stop");

                            // -- DRAW --
                            
                            _APP.utility.timeIt("draw_total", "start");

                            // Send the graphics updates without waiting. (This could be a problem where there are many graphics updates.)
                            // awaitDraw is false.
                            if(!_APP.configObj.gfxConfig.awaitDraw){ _GFX.funcs.sendGfxUpdates(false); }
                            
                            // Synchronize the gameLoop with the rendering.
                            // awaitDraw is true.
                            else                                   { await _GFX.funcs.sendGfxUpdates(true); }

                            this.frameDrawCounter += 1;
                            
                            _APP.utility.timeIt("draw_total", "stop");
                        }
                    }
                    
                    _APP.utility.timeIt("loop_total", "stop");
                    this.lastLoop_timestamp = performance.now() - lastLoop_timestamp;
                    
                    // End the loop and run any end of loop tasks.
                    this.endOfLoopTasks(timestamp);
                }
                else{
                    // console.log("THE LOOP DID NOT RUN THIS TIME:", new Date());
                    // End the loop and run any end of loop tasks.
                    this.endOfLoopTasks(false);
                }
            }
            // No. 
            else{
                // console.log("gameLoop is not running.");
            }
        },
    }, 
};
