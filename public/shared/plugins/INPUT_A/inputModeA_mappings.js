_INPUT.gamepadMappings = {
    "keyboard": {
        "p1": [
            { "button":"BTN_SR"    , "code":"KeyX"       },
            { "button":"BTN_SL"    , "code":"KeyZ"       },
            { "button":"BTN_X"     , "code":"KeyW"       },
            { "button":"BTN_A"     , "code":"KeyS"       },
            { "button":"BTN_RIGHT" , "code":"ArrowRight" },
            { "button":"BTN_LEFT"  , "code":"ArrowLeft"  },
            { "button":"BTN_DOWN"  , "code":"ArrowDown"  },
            { "button":"BTN_UP"    , "code":"ArrowUp"    },
            { "button":"BTN_START" , "code":"Enter"      },
            { "button":"BTN_SELECT", "code":"Space"      },
            { "button":"BTN_Y"     , "code":"KeyQ"       },
            { "button":"BTN_B"     , "code":"KeyA"       },
        ],
        "p2": [
            { "button":"BTN_SR"    , "code":"Period"       },
            { "button":"BTN_SL"    , "code":"Comma"        },
            { "button":"BTN_X"     , "code":"KeyO"         },
            { "button":"BTN_A"     , "code":"KeyL"         },
            { "button":"BTN_RIGHT" , "code":"Numpad6"      },
            { "button":"BTN_LEFT"  , "code":"Numpad4"      },
            { "button":"BTN_DOWN"  , "code":"Numpad5"      },
            { "button":"BTN_UP"    , "code":"Numpad8"      },
            { "button":"BTN_START" , "code":"BracketRight" },
            { "button":"BTN_SELECT", "code":"BracketLeft"  },
            { "button":"BTN_Y"     , "code":"KeyI"         },
            { "button":"BTN_B"     , "code":"KeyK"         },
        ],
    },
    "internal": {
        "ids": [
            { "genName":"(N:Gamepad):(A:4):(B:17):(V:05ac):(P:111d)"                      , "active": true, "mapKey": "standard_xinput" },
            { "genName":"(N:Xbox 360 Controller (XInput STANDARD GAMEPAD)):(A:4):(B:17)"  , "active": true, "mapKey": "standard_xinput" },
            { "genName":"(N:xinput):(A:4):(B:17)"                                         , "active": true, "mapKey": "standard_xinput" },
        ],
        "maps":{
            "standard_xinput": {
                "BTN_SR"    : "B:5:1"  ,
                "BTN_SL"    : "B:4:1"  ,
                "BTN_X"     : "B:3:1"  ,
                "BTN_A"     : "B:1:1"  ,
                "BTN_RIGHT" : "A:0:1"  ,
                "BTN_LEFT"  : "A:0:-1" ,
                "BTN_DOWN"  : "A:1:1"  ,
                "BTN_UP"    : "A:1:-1" ,
                "BTN_START" : "B:9:1"  ,
                "BTN_SELECT": "B:8:1"  ,
                "BTN_Y"     : "B:2:1"  ,
                "BTN_B"     : "B:0:1"  ,
            },
            "standard_xinput_dpad_remap1": {
                "BTN_SR"    : "B:5:1"  ,
                "BTN_SL"    : "B:4:1"  ,
                "BTN_X"     : "B:3:1"  ,
                "BTN_A"     : "B:1:1"  ,
                "BTN_RIGHT" : "B:15:1" ,
                "BTN_LEFT"  : "B:14:1" ,
                "BTN_DOWN"  : "B:13:1" ,
                "BTN_UP"    : "B:12:1" ,
                "BTN_START" : "B:9:1"  ,
                "BTN_SELECT": "B:8:1"  ,
                "BTN_Y"     : "B:2:1"  ,
                "BTN_B"     : "B:0:1"  ,
            },
        }
    },
    "user":{
        "ids":[],
        "maps":{},
    },
}
