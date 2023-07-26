"use strict";

{
// Running as stand-alone.
var _JSG = {}; 
var _APP = {
    standAlone : true,
    usingJSGAME: false,
    usingJSGAME_INPUT: false,
}; 
_APP.relPath = _APP.usingJSGAME ? `./games/${_APP.configObj.gameConfig.appRelPath}` : `.`;

(
    async function(){
        return;
        let loading = document.getElementById("loading");
        let wrapper = document.getElementById("wrapper");
        wrapper.style.display = "none";

        // Get the game.js file and run it's init function.
        let ts1S = performance.now();
        new Promise(async (res,rej)=>{
            let url = "js/GAME/game.js";
            let script = document.createElement('script');
            script.setAttribute("name", url); 
            script.defer=true;
            script.onload = async function () { 
                script.onload = null; 

                // Get the appConfigs.js file. (Populates _APP.configObj.)
                await _APP.utility.addFile( { f:"appConfigs.js"  , t:"js"  }, _APP.relPath); 
                
                await _APP.init_standAlone(); 
                // loading.style.display = "none";
                // wrapper.style.display = "";
                let ts1E = performance.now() - ts1S;
                console.log(`${_APP.configObj.gameConfig.appNameText} (Stand-Alone version) load time: ${ts1E.toFixed(2)}ms`);
                // alert(`${_APP.configObj.gameConfig.appNameText} (Stand-Alone version) load time: ${ts1E.toFixed(2)}ms`);

                // Start the game loop.
                setTimeout(()=>{ 
                    loading.style.display = "none";
                    wrapper.style.display = "";
                    _APP.game.gameLoop.loop_start(); 
                    if(_APP.debugActive && ('_DEBUG' in window) && ('toggleButtons1' in _DEBUG)){_DEBUG.toggleButtons1.setCurrentStates(); }
                }, 250);

                res(); 
            };
            script.onerror = function (err) { 
                script.onload = null; 
                console.log("index addFile: js: FAILURE:", url);
                rej(err); 
            };
            document.head.appendChild(script);
            script.src = url;
        });
    }
)();
}