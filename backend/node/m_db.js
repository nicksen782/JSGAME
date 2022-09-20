const fs = require('fs');
const path = require('path'); 
// const sqlite3 = require('sqlite3').verbose();
const sqlite3 = require('sqlite3');
const { performance } = require('perf_hooks');

// https://inloop.github.io/sqlite-viewer/

let _APP = null;

let _MOD = {
    moduleLoaded: false,

    module_init: function(parent){
        return new Promise(async function(resolve,reject){
            if(!_MOD.moduleLoaded){
                // Save reference to the parent module.
                _APP = parent;
                
                // Start the database.
                _APP.consolelog("db_start", 2);
                await _MOD.db_start(_APP.m_config.config.db.type, _APP.m_config.config.db.file);

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

    // Holds the connection to the database.
    db: null,

    // DB flags
    dbFlagLookup : {
        "READONLY":  0x00000001,
        "READWRITE": 0x00000002, // DEFAULT
        "CREATE":    0x00000004, // DEFAULT
    },

    // Start the database connect and do db_init if needed.
    db_start: async function(type, db_filepath){
        return new Promise(async function(resolve,reject){
            // File-based database.
            if(type == "file"){
                _APP.consolelog(`Database type: ${type}, "${db_filepath}"`, 4);

                // If the file does not exist...
                if (!fs.existsSync(db_filepath)) {
                    _APP.consolelog(`Database file not found. Creating and initing.`, 4);

                    // Create/Open it.
                    await _MOD.open(db_filepath);
                    
                    // Do a db_init.
                    await _APP.m_dbInit.db_init();

                    resolve(); return;
                }
                else{
                    _APP.consolelog(`Database file found.`, 4);

                    // Open it.
                    await _MOD.open(db_filepath);

                    resolve(); return;
                }
            }

            // Memory-based database.
            // If type is memory then open it as memory and do a db_init. 
            else if(type == "memory"){
                db_filepath = ":memory:";

                _APP.consolelog(`Database type: ${type}, "${db_filepath}"`, 4);
                _APP.consolelog(`NOTE: The in-memory database will NOT persist if you restart the server.`, 4);
                
                // Open and init the in-memory database.
                await _MOD.open(db_filepath);
                await _APP.m_dbInit.db_init();

                resolve(); return;

            }
        });
    },
        
    // Opens a database.
    open : function(filename = ":memory:", mode = (sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE), callback = null){
        return new Promise(function(resolve,reject){
            let flags = [];
            let modeValue = mode;
            let keys = Object.keys(_MOD.dbFlagLookup).reverse();
            for(let key of keys){
                if(modeValue - _MOD.dbFlagLookup[key] >= 0){ modeValue -= _MOD.dbFlagLookup[key]; flags.push(key); }
            }

            _APP.consolelog(`OPENING DATABASE: "${filename}", FLAGS: (${flags.join(", ")})`,4);
            
            _MOD.db = new sqlite3.Database(filename, mode, (err) => {
                if (err) {
                    console.error(err.message);
                    reject(err);
                    throw err.message;
                }
                else{
                    _APP.consolelog(`DATABASE IS OPEN`,4);
                    
                    resolve(true);
                }
            });
        });
    },

    // Queries the database.
    query : function(sql, params, type){
        // EXAMPLE USAGE:
        /*
            // Example select query object:
            let q = {
                "sql" : `SELECT * FFOM users WHERE userId = :userId;`, ;`, 
                "params" : { ":userId": 100 },
                "type": "SELECT",
            };
            let results1 = await _APP.db.query(q.sql, q.params, q.type);
            
            // For UPDATE, INSERT, etc, change the type. (optional)
            let q = {
                "sql" : `DELETE FROM users WHERE userId = :userId;`, 
                "params" : { ":userId": 100 },
                "type": "DELETE",
            };
            let results1 = await _APP.db.query(q.sql, q.params, q.type);
        */
        
        return new Promise(function(resolve,reject){
            // Check that the DB is not null.
            if(! _MOD.db){
                reject("ERROR: (db query) Database is not open.");
                return; 
            }

            // Determine the db function to use. 
            let func;
            if(type=="SELECT"){ func = "all"; }
            else              { func = "run"; }
    
            // Run the db function and return any results. 
            _MOD.db[func](sql, params, function(err, rows){
                if(err){ 
                    console.log(
                        `ERROR: db.query:` + 
                        `\nfunc     : ${func}`,
                        `\ndb       : ${JSON.stringify(_MOD.db)}` +
                        `\nrows     : ${rows || []}`,
                        `\nlastID   : ${this.lastID}`,
                        `\nsql      : \n${sql}`,
                        `\nparams   : \n${JSON.stringify(params)}`,
                        `\nparamsLen: \n${Object.keys(params).length}`,
                        `\nerr      : ${err}`,
                        ``
                    );

                    reject({
                        func   : func,
                        err    : err,
                        rows   : rows || [],
                        db     : _MOD.db,
                        lastID : this.lastID,
                    });
                    throw "ERROR IN " + func;
                }
                else{
                    // console.log(func, " qb.query: data:", rows);
                    resolve({
                        func   : func,
                        err    : err,
                        rows   : rows || [],
                        db     : _MOD.db,
                        lastID : this.lastID,
                    });
                }
            });
        });
    },

    // Closes the database.
    close : function(){
        return new Promise(function(resolve,reject){
            // Attempts to close a null db will fail. Catch it here.
            if(! _MOD.db){
                resolve(true);
                return; 
            }

            _MOD.db.close((err) => {
                if (err) {
                    reject( console.error(err.message) );
                }
                else{
                    _MOD.db = null;
                    resolve(true);
                }
            });
        });
    },

    // VACUUM
    VACUUM : function(){
        // _APP.db.VACUUM();
        return new Promise(async function(resolve,reject){
            // Check that the DB is not null.
            if(! _MOD.db){
                reject("ERROR: (db vacuum) Database is not open.");
                return; 
            }

            q = {
                "sql" : `VACUUM;`, 
                "params" : {},
                "type": "VACUUM",
            };
            let results1 = await _APP.db.query(q.sql, q.params, q.type);
            if(results1.err){ reject(results1.err); return; }
            resolve();
        });
    },

};

module.exports = _MOD;