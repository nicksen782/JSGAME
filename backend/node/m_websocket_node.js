const fs = require('fs');
// const path = require('path');
const os   = require('os');
const WSServer = require('ws').WebSocketServer;

let _APP = null;

let _MOD = {
    moduleLoaded: false,

    ws:null,
    subscriptionKeys: [
        "TEST"
    ],

     // Init this module.
     module_init: async function(parent){
        return new Promise(async function(resolve,reject){
            if(!_MOD.moduleLoaded){
                // Save reference to the parent module.
                _APP = parent;
        
                _APP.consolelog("WebSockets Server", 2);
                if(_APP.m_config.config.toggles.isActive_nodeWsServer){
                    // _APP.consolelog("Create Server", 4);
                    // _MOD.createWebSocketsServer();

                    // _APP.consolelog("Init Server", 4);
                    // _MOD.initWss();
                }
                else{
                    _APP.consolelog("DISABLED IN CONFIG", 2);
                    _MOD.ws = null;
                }

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
        // ********************
        // Websockets "routes".
        // ********************

        // _APP.addToRouteList({ path: "SUBSCRIBE"                  , method: "ws", args: [], file: __filename, desc: "JSON: subscriptions    : Subscribe to event." });
        // _APP.addToRouteList({ path: "UNSUBSCRIBE"                , method: "ws", args: [], file: __filename, desc: "JSON: subscriptions    : Unsubscribe from event." });
        // _APP.addToRouteList({ path: "GET_SUBSCRIPTIONS"          , method: "ws", args: [], file: __filename, desc: "TEXT: subscriptions    : Get list of active subscriptions." });

        
        // _APP.addToRouteList({ path: "PROCESS_EXIT"               , method: "ws", args: [], file: __filename, desc: "TEXT: general          : Tells node to exit (will restart with PM2.)" });
        // _APP.addToRouteList({ path: "CONNECTIVITY_STATUS_UPDATE" , method: "ws", args: [], file: __filename, desc: "TEXT: general          : Get connectivity statuses." });

        // ************
        // HTTP routes. 
        // ************

    },

    // **********
    createWebSocketsServer: function(){
        _MOD.ws = new WSServer({ server: _APP.server }); 
    },

};

module.exports = _MOD;