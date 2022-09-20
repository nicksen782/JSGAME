const fs       = require('fs');
const path     = require('path'); 
const { performance } = require('perf_hooks');

let _APP = null;

let _MOD = {
    moduleLoaded: false,

    // Init this module.
    module_init: async function(parent){
        return new Promise(async function(resolve,reject){
            if(!_MOD.moduleLoaded){
                // Save reference to _APP.
                _APP = parent;
                
                // Add routes.
                _APP.consolelog("addRoutes", 2);
                _MOD.addRoutes(_APP.app, _APP.express);

                // Set the moduleLoaded flag.
                _MOD.moduleLoaded = true;
            }
            resolve();
        });
    },

    // Adds routes for this module.
    addRoutes: function(app, express){
    },

    initDb_queries:{
        "structure": [
            // Table: Users
            {
                "sql" : `
                    CREATE TABLE 'users' (
                        'userId'       INTEGER PRIMARY KEY AUTOINCREMENT,
                        'name'         VARCHAR,
                        'username'     VARCHAR,
                        'dbPass'       VARCHAR,
                        'salt'         VARCHAR,
                        'notes'        VARCHAR,
                        'rights'       VARCHAR
                    );`.replace(/\t/g, " ").replace(/  +/g, "  "),
                "params" : [],
                "type": "",
            },
        ],
        "seed": [
        ]
    },

    //
    db_init: async function(){
        let structure = async function(){
            if(_MOD.initDb_queries.structure.length){
                _APP.consolelog(`CREATING DATABASE TABLE STRUCTURE`,4);
            }
            return new Promise(async function(resolve,reject){
                let q;
                
                // TABLES AND STRUCTURE.
                for(let i = 0; i < _MOD.initDb_queries.structure.length; i += 1){
                    q = _MOD.initDb_queries.structure[i];   
                    await _APP.m_db.query(q.sql, q.params, q.type);
                }

                resolve();
            });
        };
        let seed = async function(){
            if(_MOD.initDb_queries.seed.length){
                _APP.consolelog(`CREATING INITIAL TEST RECORDS`,4);
            }
            return new Promise(async function(resolve,reject){
                let q;
                
                // INITIAL COMMANDS.
                for(let i = 0; i < _MOD.initDb_queries.seed.length; i += 1){
                    q = _MOD.initDb_queries.seed[i];   
                    await _APP.m_db.query(q.sql, q.params, q.type);
                }

                resolve();
            });
        };
        let imports = async function(){
            // Loop through the file. 
            return new Promise(async function(resolve,reject){
                // File needs two names because checking for the file and importing it require different paths.
                let importFile_rel = "./backend/db/db_init_importFile.js";
                let importFile_req = "../db/db_init_importFile.js";

                // Does the file exist?
                if(!fs.existsSync(importFile_rel)){ console.log("No import file at:", importFile_rel); resolve(); return; }

                // Yes.
                _APP.consolelog(`RUNNING QUERIES FROM IMPORT FILE`,4);
                
                // Read in the file. 
                let array = require(importFile_req);
                _APP.consolelog(`QUERIES TO RUN: ${array.length}`,6);

                // Loop through the array and run each query.
                let proms = [];
                for(let i=0; i<array.length; i+=1){
                    let linePartA = `QUERY: ${i+1} of ${array.length}:`.padEnd(16, " ");
                    _APP.consolelog(`${linePartA} ${array[i].name}`,8);
                    let q = {
                        "sql" : array[i].query.replace(/\t/g, " ").replace(/  +/g, "  "),
                        "params" : {},
                        "type": "INSERT",
                    }
                    proms.push( new Promise(async function(res,rej){ await _APP.m_db.query(q.sql, q.params, q.type); res(); } ) );
                }

                await Promise.all(proms);
                _APP.consolelog(`IMPORT IS COMPLETE`,6);
                resolve();
            });
        };
        
        await structure();
        await seed();
        await imports();
    },
};

let routed = {};

_MOD.routed = routed;

module.exports = _MOD;