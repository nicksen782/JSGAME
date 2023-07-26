const fs = require('fs');
const path = require('path'); 

let _APP;

let _MOD = {
    funcs: {
        test: function(){ console.log("***************hi"); }, 
    },
    defaultRoutes: function(_APP){
        let app     = _APP.app;
        let express = _APP.express;

        // Default routes:
        app.use('/'            , express.static(path.join(process.cwd(), './public')));
        app.use('/GAMES'       , express.static(path.join(process.cwd(), './GAMES')));
        app.use('/SHARED'      , express.static(path.join(process.cwd(), './SHARED')));
        app.use('/libs'        , express.static(path.join(process.cwd(), './node_modules')));
    },
    routes: [
        {
            "mod": "m_webServer",
            "path": "/getRoutePaths", "method": "get",
            "desc": "Outputs a list of manually registered routes.",
            "args": ["type"],
            "func": async (req,res)=>{
                let result = _APP.m_webServer.getRoutePaths("manual");
                res.json( result );
            }
        },
    ],
};

module.exports = async function(parent){
    _APP = parent;

    // Add default routes and middleware.
    _MOD.defaultRoutes(_APP);

    // Add custom routes.
    for(let i=0; i<_MOD.routes.length; i+=1){
        let rec = _MOD.routes[i];
        _APP.m_webServer.addToRouteList({ path: rec.path, method: rec.method, args: rec.args, desc: rec.desc, file: rec.mod });
        _APP.app[rec.method](rec.path, _APP.express.json(), rec.func);
    }
};