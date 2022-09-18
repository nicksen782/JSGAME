_APP.configObjs = {
    // WebSockets object.
    ws: {
        // ws DOM.
        DOM: {
            "main"        : "net_ws_status" ,
            "statusSquare": "net_ws_status_square",
            "statusText"  : "net_ws_status_text", 
            "connect"     : "net_ws_status_connect",
            "disconnect"  : "net_ws_status_disconnect",
        }
    },
    // Lobby object.
    lobby:{
        // Lobby navigation config.
        nav: {
            // Default deplayed tab/view.
            defaultTabKey: "login",

            // nav DOM.
            tabs: {
                login    : "lobby_nav_tab_login",
                profile  : "lobby_nav_tab_profile",
                lobby    : "lobby_nav_tab_lobby",
                room     : "lobby_nav_tab_room",
                dm       : "lobby_nav_tab_dm",
                settings : "lobby_nav_tab_settings",
                debug    : "lobby_nav_tab_debug",
            },
            // nav DOM.
            views: {
                login    : "lobby_nav_view_login",
                profile  : "lobby_nav_view_profile",
                lobby    : "lobby_nav_view_lobby",
                room     : "lobby_nav_view_room",
                dm       : "lobby_nav_view_dm",
                settings : "lobby_nav_view_settings",
                debug    : "lobby_nav_view_debug",
            },
        },
        // Lobby login config.
        login: {
            // login DOM.
            DOM: {
                "username"  : "lobby_username",
                "password"  : "lobby_password",
                "login"     : "lobby_login",
                "logout"    : "lobby_logout",
                "showLogin" : "lobby_showLogin",
                "showLogout": "lobby_showLogout",
                "showLogout_username": "lobby_showLogout_username",
                "showLogout_handle"  : "lobby_showLogout_handle",
            }
        },
        // Lobby profile config.
        profile:{
            // profile DOM.
            DOM: {
                "lobby_handle"       : "lobby_handle",
                "lobby_name"         : "lobby_name",
                "lobby_detailsUpdate": "lobby_detailsUpdate",
            }
        },
        // Lobby lobby config.
        lobby:{
            // lobby DOM.
            DOM: {
                "lobby_chat_messages": "lobby_debugOutput2",
                "lobby_chat_send"    : "lobby_chat_send",
            }
        },
        // Lobby debug config.
        debug:{
            // Debug DOM.
            DOM: {
                "table_connections": "lobby_debugTable_connections",
            }
        },
    },
};