// Packages for THIS module.
const fs   = require('fs');
const os   = require('os');
const path = require('path'); 

// Modules saved within THIS module.
const m_modules = [
    './m_config.js', // Must be first!
    './m_websocket_node.js',
];
const rpbp = require( './removeprocess.js' ).run;

// Main app.
let _APP = {
    // Express variables.
    app      : null,
    express  : null,
    server   : null,

    // startupWarnings
    startupWarnings: [],

    // Manual route list. (Emulates something like route annotations.)
    routeList: {}, 

    // ROUTED: Outputs a list of registered routes.
    getRoutePaths : function(type = "manual", app = _APP){
        let routes = app._router.stack.filter(r => r.route).map(r => r.route).map(function(r){
            let methods = [];
            for(let m in r.methods){
                methods.push(m);
            }
            return {
                method: methods.join(" "),
                path: r.path,
            };
        });

        switch(type){
            case "manual" : 
                return {
                    manual: _APP.routeList,
                };
                break; 

            case "express": 
                return {
                    express: routes,
                };
                break; 

            case "both"   : 
                // TODO: unmatched
                return {
                    manual   : _APP.routeList,
                    express : routes,
                    unmatched: [],
                };
                break; 

            default: break; 
        }

        if(type=="manual"){
        }
    },

    // Adds a manual route entry to the routeList.
    addToRouteList : function(obj){
        let file = path.basename(obj.file);
        if(!_APP.routeList[file]){ _APP.routeList[file] = []; }
        _APP.routeList[file].push({
            path  : obj.path, 
            method: obj.method, 
            args  : obj.args,
            desc  : obj.desc,
        });
    },

    // Adds routes for this module.
    addRoutes: function(app, express){
        // Outputs a list of registered routes.
        _APP.addToRouteList({ path: "/getRoutePaths", method: "get", args: ['type'], file: __filename, desc: "Outputs a list of manually registered routes." });
        app.get('/getRoutePaths'    ,express.json(), async (req, res) => {
            let resp = _APP.getRoutePaths(req.query.type, app); 
            res.json(resp);
        });
    },

    // MODULES (_APP will have access to all the modules.)
    rpbp         : rpbp ,

    // Init this module.
    module_init: function(){
        return new Promise(async function(resolve,reject){
            let key = path.basename(__filename, '.js');
            _APP.consolelog(".".repeat(54), 0);
            _APP.consolelog(`START: module_init: ${key} :`, 0);
            _APP.timeIt(`${key}`, "s", __filename); 
            
            // Add each module (does not run module_init yet.)
            _APP.consolelog("add modules", 2);
            for(let i=0; i<m_modules.length; i+=1){
                let key = path.basename(m_modules[i], '.js');
                _APP[key] = require( m_modules[i] );
                _APP.consolelog(`Added: ${key}`, 4);
            }

            // Add routes.
            _APP.consolelog("addRoutes", 2);
            _APP.addRoutes(_APP.app, _APP.express);

            _APP.timeIt(`${key}`, "e", __filename);
            _APP.consolelog(`END  : INIT TIME: ${_APP.timeIt(`${key}`, "t", __filename).toFixed(3).padStart(9, " ")} ms`, 0);
            _APP.consolelog(".".repeat(54), 0);
            _APP.consolelog("", 0);

            resolve();
        });
    },

    // Add the _APP object to each required object.
    module_inits: function(){
        return new Promise(async function(resolve,reject){
            // MODULE INITS.
            for(let i=0; i<m_modules.length; i+=1){
                let key = path.basename(m_modules[i], '.js');
                if(!_APP[key].moduleLoaded){
                    _APP.consolelog(".".repeat(54), 0);
                    let line1 = `START: module_init: ` + " ".repeat(4);
                    line1+= `${key.toUpperCase()}`.padEnd(20, " ");
                    line1+= ` : `;
                    line1+= `(${ (i+1) + "/" + m_modules.length })`.padStart(7, " ");
                    _APP.consolelog(line1, 0);
                    _APP.timeIt(`${key}`, "s", __filename); await _APP[key].module_init(_APP, key); _APP.timeIt(`${key}`, "e", __filename);
                    _APP.consolelog(`END  : INIT TIME: ${_APP.timeIt(`${key}`, "t", __filename).toFixed(3).padStart(9, " ")} ms`, 0);
                    _APP.consolelog(".".repeat(54), 0);
                    _APP.consolelog("");
                }
            }

            resolve();
        });
    },

    // ** SHARED
    
    // DEBUG: Used to measure how long something takes.
    timeIt_timings : { },
    timeIt_timings_prev : { },
    timeIt: function(key, type, subKey="NOT_DEFINED"){
        subKey = path.basename(subKey);
        
        // Is this a timeIt 'start'?
        if(type == "s"){
            // Create the subkey if it doesn't exist.
            if(!_APP.timeIt_timings     [subKey]){ _APP.timeIt_timings     [subKey] = {}; }

            // Create the prev subkey if it doesn't exist.
            if(!_APP.timeIt_timings_prev[subKey]){ _APP.timeIt_timings_prev[subKey] = {}; }

            // Create the prev entry key if it does not exist.
            if(!_APP.timeIt_timings_prev[subKey][key]){ _APP.timeIt_timings_prev[subKey][key] = {}; }

            // Create the entry.
            _APP.timeIt_timings         [subKey][key] = { s: performance.now(), e: 0, t: 0, }; 
        }
        // Is this a timeIt 'end'?
        else if(type == "e"){
            if(_APP.timeIt_timings[subKey][key]){
                // Set the end entry.
                _APP.timeIt_timings[subKey][key].e = performance.now();

                // Calculate the total entry and format.
                _APP.timeIt_timings[subKey][key].t = parseFloat((_APP.timeIt_timings[subKey][key].e - _APP.timeIt_timings[subKey][key].s).toFixed(2));

                // Add to prev
                _APP.timeIt_timings_prev[subKey][key] = { t: _APP.timeIt_timings[subKey][key].t };
            }
        }
        // Is this just a request for the total time?
        else if(type == "t"){
            try{
                // Return the value if it exists.
                if(_APP.timeIt_timings[subKey][key]){
                    return _APP.timeIt_timings[subKey][key].t;
                }

                // Return -1 if the value does not exist.
                return -1;
            }
            catch(e){
                console.log("Error in timeIt:", e);
                return -1;
            }
        }
    },

    removeProcessByPort : function(ports, display=false){
        // Remove any potential duplicates in the ports list. 
        ports = [...new Set(ports)] ;
    
        // _APP.consolelog(`Removing processes using ports: ${ports}`, 2);
    
        //
        let closed = [];
        return new Promise(async function(resolve,reject){
            // Add promises for each removal.
            let proms = [];
            let responses = [];
            for(let i=0; i<ports.length; i+=1){
                proms.push(
                    new Promise(function(res,rej){
                        let resp; 
                        let port = ports[i];
                        try{ 
                            resp = _APP.rpbp(port).catch( (e)=>{throw e;});
                            resp.then(function(data){
                                // Add to the removed ports.
                                if(data.removed){ closed.push(port); }

                                // Normal run? 
                                if(data.success){
                                    if(data.removed){ 
                                        if(closed.length){
                                            if(display){ 
                                                // _APP.consolelog(`${data.text}`, 2); 
                                                responses.push(data.text);
                                            } 
                                        }
                                    }
                                }
                                
                                // Error.
                                else{ 
                                    // _APP.consolelog(`ERROR: ${data}`, 4); 
                                    responses.push(data);
                                }
                                res(data);
                            });
                        } 
                        catch(e){ 
                            resp = e; 
                            console.log("   ERROR:", e);
                            rej(resp);
                        } 
                    })
                );
            }

            // Wait for all promises to resolve.
            await Promise.all(proms);

            // Output the results. 
            if(closed.length){
                // _APP.consolelog(`Processes were removed on these ports: ${closed}`, 2);
                resolve(responses);
            }
            else{
                // _APP.consolelog(`No matching processes were found.`, 2);
                resolve(responses);
            }

            // resolve();
        })
    },

    consolelog: function(str, indent=2){
        // m_config isn't loaded yet. Print the message anyway.
        let prefix = "[LOG]  :";

        if(!_APP.m_config ){ 
            console.log(`${prefix}${" ".repeat(indent)}`, str);
            return; 
        }
        // m_config is loaded but not inited yet. Print the message anyway.
        else if(_APP.m_config.config && !_APP.m_config.config.toggles){ 
            console.log(`${prefix}${" ".repeat(indent)}`, str);
            return; 
        }
        // Do the normal checks. 
        else{
            try{
                if(_APP.m_config.config.toggles.show_APP_consolelog){
                    prefix = "[LOG] ::";
                    console.log(`${prefix}${" ".repeat(indent)}`, str);
                }
            }
            catch(e){
                console.log(e);
                // console.log(`${prefix}${" ".repeat(indent)}`, str);
            }
        }
    },
    
    // Displays system data (using during application init.)
    displaySysData_init: function(){
        // Display system data.
        _APP.consolelog(".".repeat(54), 0);
        _APP.consolelog(`START: sysData :`, 0);
        _APP.timeIt(`sysData`, "s", __filename); 
        let sysData = _APP.getSysData();
        for(let key in sysData){
            let line1;
            if( key=="cpus" && Array.isArray(sysData[key]) ){
                let cpusLines = "";
                let tabSpacer = "\t\t\t\t";
                for(let cpusLine_i=0; cpusLine_i<sysData[key].length; cpusLine_i+=1){
                    cpusLines += ``+
                        `${cpusLine_i!=0?tabSpacer:""}`+
                        `${sysData[key][cpusLine_i].model}, `+
                        `( ${sysData[key][cpusLine_i].speed} )`+
                        `\n`;
                }
                line1 = `${key.toUpperCase()}`.padEnd(12, " ") +": "+ `${cpusLines}`;
            }
            else if(key=="network"){
                let networkLines = "";
                let tabSpacer = "\t\t\t\t";
                for(let netLine_i=0; netLine_i<sysData[key].length; netLine_i+=1){
                    networkLines += ``+
                        `${netLine_i!=0?tabSpacer:""}`+
                        `${sysData[key][netLine_i].cidr.toString().padEnd(16, " ")}, `+
                        `( ${sysData[key][netLine_i].iface} )`+
                        `\n`;
                }
                line1 = `${key.toUpperCase()}`.padEnd(12, " ") +": "+ `${networkLines}`;
            }
            else{
                line1 = `${key.toUpperCase()}`.padEnd(12, " ") +": "+ `${JSON.stringify(sysData[key],null,0)}`;
            }
            _APP.consolelog(line1, 2);
        }
        _APP.timeIt(`sysData`, "e", __filename); 
        _APP.consolelog(`END  : TIME: ${_APP.timeIt(`sysData`, "t", __filename).toFixed(3).padStart(9, " ")} ms`, 0);
        _APP.consolelog(".".repeat(54), 0);
        _APP.consolelog("");
    },

    // Returns system data.
    getSysData :function(){ 
        return {
            platform  : os.platform(),
            type      : os.type(),
            release   : os.release(),
            arch      : os.arch(),
            // cpus      : os.cpus().map( d=> { return {model: d.model, speed: d.speed }; } ) ,
            cpus      : os.cpus().map( d=> { return {model: d.model, speed: d.speed }; } ).length ,
            endianness: (()=>{
                let endianness = os.endianness();
                switch(endianness){
                    case "LE": return `${endianness} (Little Endian)`  ; break;
                    case "BE": return `${endianness} (Big Endian)`  ; break;
                    default  : return endianness; break;
                }
                
            })(),
            memory    : { freemem: os.freemem().toLocaleString(), totalmem: os.totalmem().toLocaleString() },
            userInfo  : (()=>{
                let data = os.userInfo();
                return {"username": data.username, "homedir": data.homedir, "shell": data.shell} ;
            })(),
            cwd       : process.cwd(),
            tmpdir    : os.tmpdir(),
            network   : (()=>{
                let data = os.networkInterfaces();
                let resp = [];
                for(let key in data){
                    for(let key2 in data[key]){
                        let rec = data[key][key2];
                        if(!rec.internal && rec.family == "IPv4"){ resp.push({"iface": key, "cidr": rec.cidr}); }
                    }
                }
                return resp;
            })(), 
        };
    },
    
};

// Save app and express to _APP and then return _APP.
module.exports = async function(app, express, server){
    // Set these into _APP.
    _APP.app     = app;
    _APP.express = express;
    _APP.server  = server;

    // Return a reference to _APP.
    return _APP;
};