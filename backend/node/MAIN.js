const fs              = require('fs');
const path            = require('path');
// import {readdir} from 'node:fs/promises'
const { performance } = require('perf_hooks');

let _APP = {
    // SHARED
    // Manual route list. (Emulates something like route annotations.)
    routeList: {}, 
    consolelog: function(str, indent=2){
        let prefix = "[DEBUG]";
        try{
            if(_APP.config.toggles.show_APP_consolelog){
                console.log(`${prefix}${" ".repeat(indent)}`, str);
            }
        }
        catch(e){
            console.log(e);
            console.log(`${prefix}${" ".repeat(indent)}`, str);
        }
    },

    // Config
    config : {},

    // Modules
    // m_fileSystem: require('./m_fileSystem'),
    // m_datetime  : require('./m_datetime'),
    // m_imports   : require('./m_imports'),
    // m_db        : require('./m_db'),
    // m_dbInit    : require('./m_dbInit'),
    m_webServer : require('./m_webServer'),
    // m_data      : require('./m_data'),

    // MODULE INITS
    app_init: async function(){
        // Make sure that certain directories and files exist.
        if(!fs.existsSync("backend/config.json")){ console.log(`Created missing file from example: "config.json"`);fs.copyFileSync("backend/config.example.json", "backend/config.json"); }

        // Bring in the config. 
        this.config = JSON.parse( fs.readFileSync("backend/config.json") );

        // Perform the module inits.
        let moduleInits = [
            {"mod": this.m_webServer , arg: "m_webServer" },
            // {"mod": this.m_dbInit    , arg: "m_dbInit" },
            // {"mod": this.m_db        , arg: "m_db" },
            // {"mod": this.m_imports   , arg: "m_imports" },
            // {"mod": this.m_datetime  , arg: "m_datetime" },
            // {"mod": this.m_fileSystem, arg: "m_fileSystem" },
            // {"mod": this.m_data      , arg: "m_data" },
        ];
        for(let i=0; i<moduleInits.length; i+=1){
            _APP.consolelog(`INIT:: ${moduleInits[i].arg}`, 0);
            await moduleInits[i].mod.module_init(this, moduleInits[i].arg);
        }
        _APP.consolelog("INIT complete", 0);
        
        // Show the list of routes.
        this.m_webServer.printRoutes(_APP);

        // Run activateServer function.
        await this.m_webServer.activateServer();
    },
};

(
    async function(){
        await _APP.app_init();

        // Do the import.
        // await _APP.m_imports.doImport([]);
        
        return;
    }
)();