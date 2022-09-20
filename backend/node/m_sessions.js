// const fs = require('fs');
// const path = require('path');
// const os   = require('os');

let _APP = null;

let _MOD = {
    moduleLoaded: false,

    sessions: {},

    // Init this module.
    module_init: async function(parent){
        return new Promise(async function(resolve,reject){
            if(!_MOD.moduleLoaded){
                // Save reference to the parent module.
                _APP = parent;
        
                // Store reference to sha256.
                _APP.consolelog("Store reference to sha256", 2);
                _MOD.sha256 = require('js-sha256').sha256;

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
        //
        // _APP.addToRouteList({ path: "/get_configs", method: "post", args: [], file: __filename, desc: "Get config.json" });
        app.post('/login', express.json(), async (req, res) => {
            // console.log("/login");
            // Capture input fields.
            // let username     = req.body.username;
            // let passwordHash = req.body.passwordHash;
            // let loadedAppKey = req.body.loadedAppKey;
            let resp = await _MOD.login(req);

            res.json(resp);
        });
        app.post('/loginCheck', express.json(), async (req, res) => {
            // console.log("/loginCheck");
            let resp = await _MOD.loginCheck(req);
            
            res.json(resp);
        });
        app.post('/logout', express.json(), async (req, res) => {
            // console.log("/logout");
            let resp = await _MOD.logout(req);
    
            res.json(resp);
        });

    },

    // Handles the login process.
    login: async function(req){
        return new Promise(async function(resolve,reject){
            let username     = req.body.username.toLowerCase();
            let passwordHash = req.body.passwordHash;
            let loadedAppKey = req.body.loadedAppKey;

            // Make sure that a username and a passwordHash were sent.
            if ( !(username && passwordHash) ) {
                let obj = {
                    "success"   : false,
                    "resultType": "ERROR_LOGIN_MISSING_VALUES",
                    "data"      : "Missing username or password.",
                };
                console.log("LOGIN :", obj);
                resolve(obj);
                return; 
            }
            
            // TODO: Temporary! For testing.
            // let dumbDatabase = [
            //     { "username":"nicksen782", "salt":"", "dbPass":"", userId:1, "name":"Nick Andersen" },
            //     { "username":"nicksen782B", "salt":"", "dbPass":"", userId:2, "name":"Nick AndersenB" },
            //     { "username":"nicksen782C", "salt":"", "dbPass":"", userId:3, "name":"Nick AndersenC" },
            //     { "username":"nicksen782D", "salt":"", "dbPass":"", userId:4, "name":"Nick AndersenD" },
            // ];
            // let results = dumbDatabase.filter(d=>d.username == username);

             // Get the data for the requested user.
             let q = {
                "sql" : `SELECT * FROM users WHERE username = :username;`
                    .replace(/\t/g, " ").replace(/  +/g, "  "), 
                "params" : { ":username"    : username },
                "type": "SELECT",
            };
            let results = await _APP.m_db.query(q.sql, q.params, q.type);
            if(results.err){ reject(results.err); return; }
            results = results.rows;
            
            // Does the username exist? 
            if(results.length){
                // There should only be one result. Take it.
                results = results[0];
                
                // Disabled user check.
                // if( _APP.checkRight("DISABLED", results['rights']) || results['rights'] == 0){
                if(0){
                    let obj = {
                        "success"   : false,
                        "resultType": "ERROR_ACCOUNT_DISABLED",
                        "data"      : "Account is disabled.",
                    };
                    console.log("LOGIN :", obj);
                    resolve(obj);
                    return; 
                }

                // Now, hash the values and check for a match.
                let dbPass       = _MOD.sha256(passwordHash + results.salt);
                if(dbPass != results.dbPass){
                    let obj = {
                        "success"   : false,
                        "resultType": "ERROR_LOGIN_NO_MATCH",
                        "data"      : "Invalid credentials.",
                    };
                    console.log("LOGIN :", obj);
                    resolve(obj);
                    return; 
                }

                // Regenerate the existing session there is already an active login. 
                if(req.session && req.session.loggedIn){
                    try{ await _MOD.regenerateSession(req); } catch(e){
                        let obj = {
                            "success"   : false,
                            "resultType": "ERROR_SESSION_GENERATION",
                            "data"      : "Session generation error.",
                        };
                        console.log("LOGIN :", obj);
                        console.log("LOGIN :", e);
                        resolve(obj);
                        return; 

                    }
                }

                // This data is intended only for session management.
                req.session['started']    = true; 
                req.session['loggedIn']   = true; 
                req.session['_sessionID'] = req.sessionID;
                
                // This data is expected for use throughout the program. 
                req.session['data']       = {
                    "uuid"        : _APP.uuidv4().toUpperCase(),
                    "userId"      : results['userId'],
                    "username"    : results['username'],
                    "name"        : results['name'],
                    "loadedAppKey": loadedAppKey,
                }; 

                let obj = {
                    "success"   : true,
                    "resultType": "SUCCESSFUL_LOGIN",
                    "data"      : {
                        session: req.session.data
                    }
                };
                // console.log(obj);
                console.log(`LOGIN : ${obj.resultType}: username: ${req.session.data.username}, uuid: ${req.session.data.uuid}, loadedAppKey: ${req.session.data.loadedAppKey || "<none>"}`);
                resolve(obj);
                return;
            }
            else{
                let obj_debug = {
                    // DEBUG. (NOTE: Sending this to the client can help the hackers determine valid usernames.)
                    "success"   : false,
                    "resultType": "ERROR_UNKNOWN_USER",
                    "data"      : "User not found.",
                };
                let obj_normal = {
                    // Only reveal that the credentials are invalid. The client should not be informed of valid usernames.
                    "success"   : false,
                    "resultType": "ERROR_LOGIN_NO_MATCH",
                    "data"      : "Invalid credentials.",
                };

                // Console gets the true error. 
                console.log("LOGIN :", obj_debug);

                // Client gets the generic error.
                resolve(obj_normal);
                return; 
            }

        });
    },
    // Checks if you are logged in and returns some session data if you are logged in.
    loginCheck: async function(req){
        return new Promise(async function(resolve,reject){
            // console.log(req.body);
            if(!req.session){
                let obj = {
                    "success"   : false,
                    "resultType": "ERROR_NO_SESSION",
                    "data"      : "No session.",
                };
                // console.log("LOGIN: ", obj);
                resolve(obj);
                return; 
            }

            if(!req.session.loggedIn){
                let obj = {
                    "success"   : false,
                    "resultType": "ERROR_NOT_LOGGED_IN",
                    "data"      : "Not logged in",
                };
                // console.log("LOGIN: ", obj);
                resolve(obj);
                return; 
            }
            
            // Update the loadedAppKey in the session.
            req.session.data.loadedAppKey = req.body.loadedAppKey;
            let obj = {
                "success"   : true,
                "resultType": "LOGGED_IN",
                "data"      : {
                    session: req.session.data
                }
            };
            // console.log("LOGIN: ", obj);
            resolve(obj);
            return; 
        });
    },
    // Regenerates the existing session.
    regenerateSession: async function(req){
        return new Promise(async function(resolve,reject){
            req.session.regenerate(err => {
                if (err) {
                    reject(err);
                    return;
                } 
                else {
                    resolve();
                    return;
                }
            });
        });
    },
    // Handles the logout process.
    logout: async function(req){
        return new Promise(async function(resolve,reject){
            if (!req.session){
                let obj = {
                    "success"   : false,
                    "resultType": "ERROR_NO_SESSION",
                    "data"      : "No session.",
                };
                console.log("LOGIN: ", obj);
                resolve(obj);
                return; 
            }
            if(!req.session.loggedIn) {
                let obj = {
                    "success"   : false,
                    "resultType": "ERROR_NOT_LOGGED_IN",
                    "data"      : "Not logged in",
                };
                console.log("LOGIN: ", obj);
                resolve(obj);
                return; 
            }

            // Clear this UUID from userTrack.
            _APP.m_websocket_node.userTrack.removeData(req.session.data.username, req.session.data.uuid);

            // Remove the server's session.
            req.session.destroy(err => {
                if (err) {
                    let obj = {
                        "success"   : false,
                        "resultType": "ERROR_LOGOUT",
                        "data"      : "Error in logout.",
                    };
                    console.log(obj);
                    resolve(obj);
                    return; 
                } 
                else {
                    let obj = {
                        "success"   : true,
                        "resultType": "SUCCESS_LOGOUT",
                        "data"      : "Successful logout.",
                    };
                    // console.log("LOGIN: ", obj);
                    resolve(obj);
                    return; 
                }
            });
        });
    },

    // MIDDLEWARE
    eachConnection: function(req, res, next){
        // A session automatically starts on webpage connect.
        // This will run on every web server request.
        // Set these values only once (check "started".)
        if(!req.session.started){ 
            req.session.started  = true; 
            req.session.loggedIn = false; 
            req.session.data = {}; 
        }
        next();
    }
};

module.exports = _MOD;