const fs = require('fs');
const path = require('path'); 
// const sqlite3 = require('sqlite3').verbose();
// const sqlite3 = require('sqlite3');
const { performance } = require('perf_hooks');

// https://inloop.github.io/sqlite-viewer/

var server     ;// = require('https').createServer();
const express    = require('express');
const app        = express();

let _APP = null;
let modName = null;

let _MOD = {
    moduleLoaded: false,

    module_init: async function(parent, name){
        return new Promise(async (resolve,reject)=>{
            if(!_MOD.moduleLoaded){
                // Save reference to the parent module.
                _APP = parent;

                // Save module name.
                modName = name;

                // Save the app and express references.
                _APP.app = app;
                _APP.express = express;

                // Run activateServer function.
                // await this.activateServer();

                // Add routes.
                _APP.consolelog(`addRoutes: ${name}`, 2);
                _MOD.addRoutes(_APP.app, _APP.express);

                // Set the moduleLoaded flag.
                _MOD.moduleLoaded = true;
                resolve();
            }
            else{
                resolve();
            }
        });
    },
    // Adds routes for this module.
    addRoutes: async function(app, express){
        // Generate routes from file. 
        await require(_APP.config.node.routes.req)(_APP);
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
    getRoutePaths : function(type="manual"){
        let routes;
        // if(type=="both" || type=="express"){
            //    routes = app     ._router.stack.filter(r => r.route).map(r => r.route).map(function(r){
            //    routes = _APP.app._router.stack.filter(r => r.route).map(r => r.route).map(function(r){
            // //    routes = app._router.stack.filter(r => r.route).map(r => r.route).map(function(r){
            //         let methods = [];
            //         for(let m in r.methods){
            //             methods.push(m);
            //         }
            //         return {
            //             method: methods.join(" "),
            //             path: r.path,
            //         };
            //     });
        // }

        switch(type){
            case "manual" : 
                return {
                    manual: _APP.routeList,
                };
                break; 

            // case "express": 
            //     return {
            //         express: routes,
            //     };
            //     break; 

            // case "both"   : 
            //     // TODO: unmatched
            //     return {
            //         manual   : _APP.routeList,
            //         express : routes,
            //         unmatched: [],
            //     };
            //     break; 

            default: break; 
        }

        if(type=="manual"){
        }
    },
    printRoutes : function(_APP){
        // let routes = this.getRoutePaths("manual").manual;
        let routes = _APP.m_webServer.getRoutePaths("manual").manual;

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
                        `MOD: ${  (filename  ).padEnd(maxes.filename, " ")}` + " || " + 
                        `METHOD: ${(rec.method).padEnd(maxes.method  , " ")}` + " || " + 
                        `PATH: ${  (rec.path  ).padEnd(maxes.path    , " ")}` + " || " + 
                        `DESC: ${  (rec.desc  )}`+
                        ``, 0);
                }
            }	
        };

        // WS routes.
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
                        `MOD: ${  ( filename           ).padEnd(maxes.filename, " ")}` + " || " + 
                        `METHOD: ${( rec.method         ).padEnd(maxes.method  , " ")}` + " || " + 
                        `PATH: ${  ( rec.path           ).padEnd(maxes.path    , " ")}` + " || " + 
                        `ARGS: ${  ( rec.args.join(",") ).padEnd(maxes.args    , " ")}` + " || " + 
                        `DESC: ${  ( rec.desc  )}`+
                        ``, 0);
                }
            }	
        };
    },    

    activateServer: async function(){
        return new Promise(async(resolve,reject)=>{
            let conf = _APP.config.node.http;
    
            // Use HTTPS?
            if(conf.useHttps){
                // TODO: Adjust for using a non-self-signed cert.
                // Get the keys. 
                const key  = fs.readFileSync("localhost-key.pem", "utf-8");
                const cert = fs.readFileSync("localhost.pem", "utf-8");
    
                if(key && cert){
                    // TODO: Adjust for using a non-self-signed cert.
                    // The cert is configured for "localhost". 0.0.0.0 or 127.0.0.1 will not work.
                    if(_APP.config.node.debug != true){ 
                        conf.host = "localhost";
                    }
                    server = require('https').createServer(  { key, cert }, app );
                }
            }

            // Use HTTP.
            else{
                server = require('http').createServer();
                server.on('request', app);
            }
    
            // Set the server to listen for and handle new connections. 
            await server.listen(conf, async ()=>{
                console.log("");
                let str = `** WEB SERVER READY: "audioFileAnalyze" ${conf.useHttps ? "https" : "http"}://${conf.host}:${conf.port} **`;
                console.log("*".repeat(str.length));
                console.log(str);
                console.log("*".repeat(str.length));
                console.log("");
                resolve();
            });
        });
        
    },
};

module.exports = _MOD;