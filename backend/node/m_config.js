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
    apps              : {},

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
                console.log("Route: /get_configs:", e);
                res.json(e);
            }
        });

        //
        _APP.addToRouteList({ path: "/rebuildAppsJson_file", method: "post", args: [], file: __filename, desc: "Update apps.json" });
        app.post('/rebuildAppsJson_file', express.json(), async (req, res) => {
            try{ 

                // let result = {
                //     config : JSON.parse( fs.readFileSync(_MOD.config_filename, 'utf8') ),
                //     apps   : JSON.parse( fs.readFileSync(_MOD.apps_filename, 'utf8') ),
                // };
                let result = await _MOD.rebuildAppsJson_file();
                res.json(result);
            }
            catch(e){
                res.json(e);
            }
        });

    },

    // Reads through each game dir in the games director and uses each appRecord.json to rebuild apps.json.
    rebuildAppsJson_file: async function(){
        return new Promise(async function(resolve,reject){
            // Set the baseRelPath for all files. 
            let baseRelPath = "public/games";

            // Get the list of directories in the baseRelPath.
            let filesInDir = fs.readdirSync(baseRelPath, { withFileTypes: true })
                .filter(d=>d.isDirectory())
                .map(d=> path.resolve(path.join(baseRelPath, d.name)) );

            // Temp apps.json variable.
            let appsJson = {};

            // Look for a appRecord.json file in each directory.
            for(let i=0; i<filesInDir.length; i+=1){
                // Get handle to the record. 
                let rec = filesInDir[i];

                // Check if the appRecord.json file exists. 
                let exists = fs.existsSync(path.join(rec, "appRecord.json"));
                if(!exists){ continue; }

                // Read in the appRecord.json file.
                let appRecord = fs.readFileSync(path.join(rec, "appRecord.json"), 'utf8');

                // Make sure that the json is valid.
                try{ appRecord = JSON.parse(appRecord); }
                catch(e){ console.log("Invalid JSON: ", path.join(rec, "appRecord.json")); }

                // Make sure the appKey is valid.
                if(!appRecord.appKey){ console.log("Invalid appKey:", appRecord.appKey, appRecord); continue; }

                // Store the appRecord as an entry into the temp variable. 
                appsJson[appRecord.appKey] = appRecord;
            }

            // Update the local apps.json file.
            fs.writeFileSync(_MOD.apps_filename, JSON.stringify(appsJson,null,2), function(err){
                if (err) { console.log("ERROR: ", err); reject(err); return; }
            });

            // Return the completed apps.json.
            resolve( appsJson );
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
            try{
                _MOD.apps = JSON.parse( fs.readFileSync(_MOD.apps_filename, 'utf8') );
            }
            catch(e){
                _APP.consolelog("Error parsing apps.json", 4);
                _MOD.apps = {};
            }

            resolve();
        });
    },

};

module.exports = _MOD;