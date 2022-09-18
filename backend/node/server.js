
let funcs_useOnce = {
    printRoutes : function(_APP){
        let routes = _APP.getRoutePaths("manual", app).manual;
        
        // REST routes.
        _APP.consolelog(`ROUTES: (REST)`, 0);
        let maxes = { "filename" : 0, "method" : 0, "path" : 0 };
        for(filename in routes){ { if(maxes.filename < filename.length){ maxes.filename = filename.length; } } }
        for(filename in routes){ 
            for(rec of routes[filename]){
                if(rec.method != "ws"){
                    if(rec.method.length > maxes.method ){ maxes.method = rec.method.length; } 
                    if(rec.path.length   > maxes.path   ){ maxes.path   = rec.path.length; } 
                }
            }
        }
        for(filename in routes){
            for(rec of routes[filename]){
                if(rec.method != "ws"){
                    _APP.consolelog(
                        `  ` +
                        `FILE: ${  (filename  ).padEnd(maxes.filename, " ")}` + " || " + 
                        `METHOD: ${(rec.method).padEnd(maxes.method  , " ")}` + " || " + 
                        `PATH: ${  (rec.path  ).padEnd(maxes.path    , " ")}` + " || " + 
                        `DESC: ${  (rec.desc  )}`+
                        ``, 0);
                }
            }	
        };

        // WS routes.
        _APP.consolelog("\n", 0);
        _APP.consolelog(`ROUTES: (WEBSOCKET)`, 0);
        maxes = { "filename" : 0, "method" : 0, "path" : 0, "args": 0 };
        for(filename in routes){ { if(maxes.filename < filename.length){ maxes.filename = filename.length; } } }
        for(filename in routes){ 
            for(rec of routes[filename]){
                if(rec.method == "ws"){
                    if(rec.method.length > maxes.method ){ maxes.method = rec.method.length; } 
                    if(rec.path.length   > maxes.path   ){ maxes.path   = rec.path.length; } 
                    if(rec.args.length){
                        rec.args.forEach(function(d){
                            if(d.length   > maxes.args   ){ maxes.args   = d.length; } 
                        });
                    }
                }
            }
        }
        for(filename in routes){
            for(rec of routes[filename]){
                if(rec.method == "ws"){
                    _APP.consolelog(
                        `  ` +
                        `FILE: ${  ( filename           ).padEnd(maxes.filename, " ")}` + " || " + 
                        `METHOD: ${( rec.method         ).padEnd(maxes.method  , " ")}` + " || " + 
                        `PATH: ${  ( rec.path           ).padEnd(maxes.path    , " ")}` + " || " + 
                        `ARGS: ${  ( rec.args.join(",") ).padEnd(maxes.args    , " ")}` + " || " + 
                        `DESC: ${  ( rec.desc  )}`+
                        ``, 0);
                }
            }	
        };
    },

    missingWsRoutes_check : function(_APP){
        // Get a list of the manual routes for "ws".
        let manualWsRoutes = [];
        for(let file in _APP.routeList){
            for(let rec of _APP.routeList[file]){
                if(rec.method == "ws"){ manualWsRoutes.push(rec.path); }
            }
        }
        // Get a list of the WS routes from ws_event_handlers.
        let expectedWsRoutes = [];
        
        try{
            let keys = Object.keys(_APP.m_websocket_node.ws_event_handlers);
            // For each key ("JSON", "TEXT") within ws_event_handlers...
            for(let key0 of keys){
                // For each key within ("JSON", "TEXT")...
                for(let key1 in _APP.m_websocket_node.ws_event_handlers[key0]){
                    // For each entry within the subkey...
                    for(let key2 in _APP.m_websocket_node.ws_event_handlers[key0][key1]){
                        // expectedWsRoutes.push(`type: ${key0}: key: ${key1}: func: ${key2}`);
                        expectedWsRoutes.push({ 
                            key0:key0, 
                            key1:key1, 
                            key2:key2 
                        });

                    }
                }
            }

            // Determine the paddings for the strings.
            let paddings = { key0:0, key1:0, key2:0 };
            for(let i=0; i<expectedWsRoutes.length; i+=1){
                if(expectedWsRoutes[i].key0.length > paddings.key0){ paddings.key0 = expectedWsRoutes[i].key0.length; }
                if(expectedWsRoutes[i].key1.length > paddings.key1){ paddings.key1 = expectedWsRoutes[i].key1.length; }
                if(expectedWsRoutes[i].key2.length > paddings.key2){ paddings.key2 = expectedWsRoutes[i].key2.length; }
            }

            // If any routes are in expected routes but not the manual routes then add them to the warn list. 
            for(let i=0; i<expectedWsRoutes.length; i+=1){
                let rec = expectedWsRoutes[i];
                if(manualWsRoutes.indexOf(rec.key2) == -1){
                    _APP.startupWarnings.push(
                        `WARN: Manual Websockets route missing for: ` +
                        `(type) ${rec.key0.padEnd(paddings.key0, " ")}, `+
                        `(key) ${rec.key1.padEnd(paddings.key1, " ")}, `+
                        `(func) ${rec.key2.padEnd(paddings.key2, " ")}`+
                        ``
                    );
                }
            }
        }
        catch(e){
            console.log("missingWsRoutes_check:", e);
        }
    },

    getConfig : async function(){
        let config_filename        = "public/shared/config.json";
        let configExample_filename = "public/shared/config.json.example";

        // If the config.json file does not exist then make a copy from the example file. 
        if(!fs.existsSync(config_filename)){
            console.log(`${config_filename} is missing. Recreating from ${configExample_filename}.`);
            fs.copyFileSync(configExample_filename, config_filename);
        }
        // Read/Store the JSON. 
        let config = JSON.parse( fs.readFileSync(config_filename, 'utf8') );
        return config;
    },

    startMessage: function(){
        // DEBUG - Not needed for production.
        let waitTill = new Date(new Date().getTime() + 1 * 1000);
        while(waitTill > new Date()){}
        
        // LOADING MESSAGE.
        let lines = [
            "-".repeat(42)  ,
            " . . . L O A D I N G :  J S G A M E . . . " ,
            "-".repeat(42)  ,
        ];
        // console.log("\n");
        for(let i=0; i<lines.length; i+=1){
            console.log("\x1b[40m" + "\x1b[1;31m" + lines[i].padEnd(42, " ") + "\x1b[0m");
        }
        console.log("");
    },
};
funcs_useOnce.startMessage();

// Express/server requires.
const path       = require('path'); 
const server     = require('http').createServer();
const express    = require('express');
const session    = require('express-session');
const MemoryStore= require('memorystore')(session);
const app        = express();
const fs         = require('fs');
const zlib       = require('zlib');
const compression = require('compression');
const shouldCompress = (req, res) => {
	if (req.headers['x-no-compression']) { return false }
	return compression.filter(req, res);
}
const compressionObj = {
    filter    : shouldCompress,
    memLevel  : zlib.constants.Z_DEFAULT_MEMLEVEL,
    level     : zlib.constants.Z_DEFAULT_COMPRESSION,
    chunkSize : zlib.constants.Z_DEFAULT_CHUNK,
    strategy  : zlib.constants.Z_DEFAULT_STRATEGY,
    threshold : 0,
    windowBits: zlib.constants.Z_DEFAULT_WINDOWBITS,
};

// Modules (routes are added per module via their module_init method.)

(async function APP_LOAD(){
    let _APP;

    // Set the error handlers.
    let setErrorHandlers = function(){
        // Created after reading this: https://blog.heroku.com/best-practices-nodejs-errors
        let cleanUpHasRan = false;
    
        let cleanUp = function(byWhat){
            // Only run once. 
            if(cleanUpHasRan){ return; }
    
            let funcs = [
            ];
            
            for(let i=0; i<funcs.length; i+=1){ funcs[i](); }
    
            // Set the cleanUpHasRan flag.
            cleanUpHasRan = true;
        };
    
        process.on('beforeExit', code => {
            // Can make asynchronous calls
            console.log("\n");
            console.log("\nHANDLER: beforeExit");
            cleanUp("beforeExit");
            // setTimeout(() => {
                console.log(`  Process will exit with code: ${code}`);
                process.exit(code)
            // }, 100)
        })
    
        process.on('exit', code => {
            // Only synchronous calls
            console.log("\n");
            console.log("\nHANDLER: exit");
            cleanUp("exit");
            console.log(`  Process exited with code: ${code}`);
        })
    
        process.on('SIGTERM', signal => {
            console.log("\n");
            console.log("\nHANDLER: SIGTERM");
            cleanUp("SIGTERM");
            console.log(`  Process ${process.pid} received a SIGTERM signal`);
            process.exit(0)
        })
    
        process.on('SIGINT', signal => {
            console.log("\n");
            console.log("\nHANDLER: SIGINT");
            cleanUp("SIGINT");
            console.log(`  Process ${process.pid} has been interrupted`)
            process.exit(0)
        })
    
        process.on('uncaughtException', err => {
            console.log("\n");
            console.log("\nHANDLER: uncaughtException");
            cleanUp("uncaughtException");
            console.log(`  Uncaught Exception:`, err);
            process.exit(1)
        })
        
        process.on('unhandledRejection', (reason, promise) => {
            console.log("\n");
            console.log("\nHANDLER: unhandledRejection");
            cleanUp("unhandledRejection");
            console.log('  Unhandled rejection at ', promise, `reason: `, reason);
            process.exit(1)
        })	
    };

    // Set the error handlers.
    setErrorHandlers();

    // Get the config.json file. 
    let config = await funcs_useOnce.getConfig();

    // Create _APP.
    _APP = await require(path.join(process.cwd(), './backend/node/M_main.js'))(app, express, server, config);
    
    //
    _APP.timeIt("FULL_STARTUP", "s", __filename);

    // Add compression.
    app.use( compression(compressionObj) );

	_APP.memStore = new MemoryStore({checkPeriod: 86400000 }); // prune expired entries every 24h;
	_APP.session = session({
		// store: sessionStore,
		store: _APP.memStore,
		name: "JSGAMEv2",
		secret: _APP.uuidv4(),// .toUpperCase(), 
		resave: false,
		saveUninitialized: false,
		unset: "destroy",
		// cookie: { secure: true },
		// cookie: { secure: false },
	});
    app.use( _APP.session );
    app.use( _APP.m_sessions.eachConnection );
    // app.use( _APP.loginCheck );

    // Default routes:
    app.use('/'    , express.static(path.join(process.cwd(), './public')));
    app.use('/libs', express.static(path.join(process.cwd(), './node_modules')));

    // Init _APP.
    _APP.module_init(_APP);

    // Init the modules.
    await _APP.module_inits();

    // Start the web server.
    let conf = {
        host: _APP.m_config.config.node.http.host, 
        port: _APP.m_config.config.node.http.port
    };

    _APP.consolelog(".".repeat(54), 0);
    _APP.timeIt("expressServerStart", "s", __filename);   
    _APP.consolelog("START: expressServerStart:", 0);
    
    // Remove the process if it already exists.
    let responses = await _APP.removeProcessByPort( [ _APP.m_config.config.node.http.port ], true );
    for(let i=0; i<responses.length; i+=1){ _APP.consolelog(responses[i], 4); }
    
    // Server start
    server.on('request', app);
    
    (async function startServer(){
        _APP.consolelog("listen", 2);
        server.listen(conf, async function () {
            _APP.timeIt("expressServerStart", "e", __filename);
            _APP.consolelog(`END  : INIT TIME: ${_APP.timeIt("expressServerStart", "t", __filename).toFixed(3).padStart(9, " ")} ms`, 0);
            _APP.consolelog(".".repeat(54), 0);
            _APP.consolelog("");
            
            // Display system data (and time it.)
            if(_APP.m_config.config.toggles.show_sysDataAtStartup){
                _APP.displaySysData_init();
            }

            let appTitle = "JSGAMEv2";
            process.title = appTitle;
            
            let repeatLen = ` STARTDIR: ${process.cwd()} `.length;
            let lines = [
                "-".repeat(repeatLen)                                                                              ,
                // ` NAME    : ${appTitle} `                                                                   ,
                ` STARTDIR: ${process.cwd()} `                                                              ,
                ` SERVER  : ${_APP.m_config.config.node.http.host}:${_APP.m_config.config.node.http.port} ` ,
                "-".repeat(repeatLen)                                                                              ,
            ];
            // https://gist.github.com/JBlond/2fea43a3049b38287e5e9cefc87b2124
            console.log("\n");
            for(let i=0; i<lines.length; i+=1){
                console.log("\x1b[40m" + "\x1b[1;93m" + lines[i].padEnd(repeatLen, " ") + "\x1b[0m");
            }
            console.log("\n");

            // ROUTES
            funcs_useOnce.printRoutes(_APP); 
            
            _APP.timeIt("FULL_STARTUP", "e", __filename);
            
            // Display missing routes and/or other startup warnings. 
            funcs_useOnce.missingWsRoutes_check(_APP);
            if(_APP.startupWarnings.length){
                _APP.consolelog("\n", 0);
                _APP.consolelog("STARTUPWARNINGS:", 0);
                _APP.consolelog(_APP.startupWarnings, 0);
            }

            lines = [
                "-".repeat(36)                                                                          ,
                ` READY (STARTUP TIME: ${_APP.timeIt("FULL_STARTUP", "t", __filename).toFixed(3).padStart(9, " ")} ms) ` ,
                "-".repeat(36)                                                                          ,
            ];
            console.log("\n");
            for(let i=0; i<lines.length; i+=1){
                console.log("\x1b[40m" + "\x1b[1;92m" + lines[i].padEnd(36, " ") + "\x1b[0m");
            }
            console.log("\n");

            // READY
            funcs_useOnce=null;
        });
    })();
})();