const fs = require('fs');
const path = require('path');
const os   = require('os');

let _APP = null;

let _MOD = {
    moduleLoaded: false,

    // File names:
    apps_filename          : "public/shared/apps.json",
    appsExample_filename   : "public/shared/apps.json.example",
    
    // Data"
    config            : {},

    // Init this module.
    module_init: async function(parent){
        return new Promise(async function(resolve,reject){
            if(!_MOD.moduleLoaded){
                // Save reference to the parent module.
                _APP = parent;
        
                // Get and store the config file.
                _APP.consolelog("get_configs", 2);
                await _MOD.get_configs(_APP);
                
                // Add routes.
                _APP.consolelog("addRouteddds", 2);
                _MOD.addRoutes(_APP.app, _APP.express);

                // Set the moduleLoaded flag.
                _MOD.moduleLoaded = true;
            }
            resolve();
        });
    },

    // Adds routes for this module.
    addRoutes: function(app, express){
        //
        _APP.addToRouteList({ path: "/get_configs", method: "post", args: [], file: __filename, desc: "Get config.json" });
        app.post('/get_configs', express.json(), async (req, res) => {
            try{ 
                let result = {
                    config : JSON.parse( fs.readFileSync(_MOD.config_filename, 'utf8') ),
                    apps   : JSON.parse( fs.readFileSync(_MOD.apps_filename, 'utf8') ),
                };

                res.json(result);
            }
            catch(e){
                res.json(e);
            }
        });

    },

    get_configs: async function(parent){
        return new Promise(async function(resolve,reject){
            // If the apps.json file does not exist then make a copy from the example file. 
            if(!fs.existsSync(_MOD.apps_filename)){
                console.log(`${_MOD.apps_filename} is missing. Recreating from ${_MOD.appsExample_filename}.`);
                fs.copyFileSync(_MOD.appsExample_filename, _MOD.apps_filename);
            }
            // Read/Store the JSON. 
            _MOD.apps = JSON.parse( fs.readFileSync(_MOD.apps_filename, 'utf8') );

            resolve();
        });
    },

};

module.exports = _MOD;