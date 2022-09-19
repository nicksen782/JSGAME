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
        
                // Get and store the config file.
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
            let username     = req.body.username;
            let passwordHash = req.body.passwordHash;
            let loadedAppKey = req.body.loadedAppKey;

            // Make sure that a username and a passwordHash were sent.
            if ( !(username && passwordHash) ) {
                let obj = {
                    "success"   : false,
                    "resultType": "ERROR_LOGIN_MISSING_VALUES",
                    "data"      : "Missing username or passwordhash.",
                };
                console.log(obj);
                resolve(obj);
                return; 
            }
            
            // TODO: Temporary! For testing.
            let dumbDatabase = [
                { "username":"nicksen782", "salt":"", "dbPass":"", userId:1, "name":"Nick Andersen" },
                { "username":"nicksen782B", "salt":"", "dbPass":"", userId:2, "name":"Nick AndersenB" },
                { "username":"nicksen782C", "salt":"", "dbPass":"", userId:3, "name":"Nick AndersenC" },
                { "username":"nicksen782D", "salt":"", "dbPass":"", userId:4, "name":"Nick AndersenD" },
            ];
            
            // Get the requested username and data.
            let results = dumbDatabase.filter(d=>d.username == username);
            
            // Does the username exist? 
            if(results.length){
                // There should only be one result. Take it.
                results = results[0];
                
                // Regenerate the existing session there is already an active login. 
                if(req.session && req.session.loggedIn){
                    try{ await _MOD.regenerateSession(req); } catch(e){
                        let obj = {
                            "success"   : false,
                            "resultType": "SESSION_GENERATION_ERROR",
                            "data"      : "Session generation error.",
                        };
                        console.log(obj);
                        console.log(e);
                        resolve(obj);
                        return; 

                    }
                }

                // TODO: Temporary! For testing.
                // Disabled user check.
                if(0){
                    let obj = {
                        "success"   : false,
                        "resultType": "ACCOUNT_DISABLED",
                        "data"      : "Account is disabled.",
                    };
                    console.log(obj);
                    resolve(obj);
                    return; 
                }

                // TODO: Temporary! For testing.
                // Password check.
                let dbPass = "";
                if(dbPass != results.dbPass){
                    let obj = {
                        "success"   : false,
                        "resultType": "ERROR_LOGIN_NO_MATCH",
                        "data"      : "Unmatched credentials.",
                    };
                    console.log(obj);
                    resolve(obj);
                    return; 
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
                resolve(obj);
                return;
            }
            else{
                let obj = {
                    "success"   : false,
                    "resultType": "ERROR_UNKNOWN_USER",
                    "data"      : "User not found.",
                };
                console.log(obj);
                resolve(obj);
                return; 
            }

        });
        
        return new Promise(async function(resolve,reject){
            // Make sure that both the username and the passwordHash were specified. 
            if (username && passwordHash) {
                // Get the data for the requested user.
                let q = {
                    "sql" : `SELECT * FROM users WHERE username = :username;`
                        .replace(/\t/g, " ").replace(/  +/g, "  "), 
                    "params" : { ":username"    : username },
                    "type": "SELECT",
                };
                let results = await _APP.db.query(q.sql, q.params, q.type);
                if(results.err){ reject(results.err); return; }
                results = results.rows;

                // Match?
                if(results.length){
                    // Use only the first result (there should only be one result.)
                    results = results[0];

                    // Regenerate existing session if already logged in.
                    if(req.session && req.session.loggedIn){
                        await _APP.regenerateSession(req);
                    }

                    // Check if this is a disabled user or a user with no rights set.
                    if( _APP.checkRight("DISABLED", results['rights']) || results['rights'] == 0){
                        resolve({
                            // "errorText" :"Incorrect Username and/or Password!",
                            "resultType":"ACCOUNT_DISABLED",
                            "redirect"  : "login.html?msg=ACCOUNT_DISABLED",
                        });
                        return;
                    }
                    
                    // Now, hash the values and check for a match.
                    let dbPass       = sha256(passwordHash + results.salt);
                    if(dbPass != results.passwordHash){
                        // User exists but the password was incorrect.
                        resolve({
                            // "errorText" :"Incorrect Username and/or Password!",
                            "resultType":"ERROR_LOGIN_NO_MATCH",
                            "redirect"  : "login.html?msg=ERROR_LOGIN_NO_MATCH",
                        });
                        return;
                    }

                    // Authenticate the user
                    req.session.loggedIn = true;
                    req.session['userId']      = results['userId'];
                    req.session['name']        = results['name'];
                    req.session['username']    = results['username'];
                    req.session['rightsValue'] = results['rights'];
                    req.session['rights']      = _APP.convertRightsToArray(results['rights']);
                    req.session['_sessionID']  = req.sessionID;
                    // req.session['_sessionID']  = req.session.id;

                    resolve({
                        // "errorText" :"Successful login",
                        "resultType":"SUCCESS_LOGIN",
                        "redirect"  : "index.html",
                    });
                    return;
                }
                
                // No match?
                else{
                    // User doesn't exist but don't tell the client that.
                    resolve({
                        // "errorText" :"Incorrect Username and/or Password!",
                        "resultType":"ERROR_LOGIN_NO_MATCH",
                        "redirect"  : "login.html?msg=ERROR_LOGIN_NO_MATCH",
                    });
                    return;
                }
            }
            // Missing username and/or passwordHash.
            else{
                resolve({
                    // "errorText" :"Please enter Username and Password!",
                    "resultType":"ERROR_LOGIN_MISSING_DATA",
                    "redirect"  : "login.html?msg=ERROR_LOGIN_MISSING_DATA",
                });
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
                // console.log(obj);
                resolve(obj);
                return; 
            }

            if(!req.session.loggedIn){
                let obj = {
                    "success"   : false,
                    "resultType": "ERROR_NOT_LOGGED_IN",
                    "data"      : "Not logged in",
                };
                // console.log(obj);
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
            // console.log(obj);
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
                console.log(obj);
                resolve(obj);
                return; 
            }
            if(!req.session.loggedIn) {
                let obj = {
                    "success"   : false,
                    "resultType": "ERROR_NOT_LOGGED_IN",
                    "data"      : "Not logged in",
                };
                console.log(obj);
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
                    // console.log(obj);
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