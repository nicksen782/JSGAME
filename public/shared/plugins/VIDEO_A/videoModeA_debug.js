// INTERNAL/DEBUG: Tests, etc.
_GFX._debug = {
    // TESTS:
    // _GFX._debug.run_drawTest();
    // _GFX._debug.drawMethodTests();

    // draw.tiles function tests.
    run_drawTest: async function(){
        let waitAfterTests = 1000;

        for(let i=0; i<2; i+=1){
            _GFX.VRAM.clearVram();
            this.drawTest_setTile(i+1);
            await new Promise((resolve,reject)=>{ setTimeout(()=>{ resolve(); }, waitAfterTests); });
            
            _GFX.VRAM.clearVram();
            this.drawTest_fillTile(i+1);
            await new Promise((resolve,reject)=>{ setTimeout(()=>{ resolve(); }, waitAfterTests); });
            
            _GFX.VRAM.clearVram();
            this.drawTest_print(i+1);
            await new Promise((resolve,reject)=>{ setTimeout(()=>{ resolve(); }, waitAfterTests); });
            
            _GFX.VRAM.clearVram();
            this.drawTest_drawTilemap(i+1);
            await new Promise((resolve,reject)=>{ setTimeout(()=>{ resolve(); }, waitAfterTests); });
            
            _GFX.VRAM.clearVram();
            this.drawTest_drawTilemap_custom(i+1);
            await new Promise((resolve,reject)=>{ setTimeout(()=>{ resolve(); }, waitAfterTests); });

            _GFX.VRAM.clearVram();
            _GFX.VRAM.draw();
        }
    },
    drawTest_setTile: function(type){
        // TEST: setTile:
        // setTile : function(tileId, x, y, tilesetIndex, layerIndex)
        let dimensions = _JSG.loadedConfig.meta.dimensions;

        let x=0;
        let y=0;
        for(let ts=0; ts < _JSG.loadedConfig.meta.tilesets.length; ts+=1){
            x=0;
            for(let tid=0; tid<dimensions.cols-1; tid+=1){
                if     (type==1){ _GFX.draw.tiles.setTile(tid,  x, y,  ts, 0); }
                else if(type==2){ _GFX.util.tiles.setTile({ tid:tid, x:x, y:y, tsi:ts, li:0 }); }
                x+=1;
            }
            y+=1;
            if(y >= dimensions.rows){ break; }
        }

        if     (type==1) { _GFX.draw.tiles.print("T:1 1/5: setTile", 0, 27, 2, 0); }
        else if(type==2) { _GFX.util.tiles.print({ str:"T:2 1/5: setTile", x:0, y:27, tsi:2, li:0 }); } 

        // Draw from VRAM:
        _GFX.VRAM.draw();
    },
    drawTest_fillTile: function(type){
        // TEST: fillTile:
        // fillTile : function(tileId=" ", x, y, w, h, tilesetIndex, layerIndex)
        if     (type==1){ _GFX.draw.tiles.fillTile(10,  19, 0,  8, 5,  2, 2); } 
        else if(type==2){ _GFX.util.tiles.fillTile({ tid:10, x:19, y:0, w:8, h:5, tsi:2, li:2 }); }

        if     (type==1) { _GFX.draw.tiles.print("T:1 2/5: fillTile", 0, 27, 2, 0); }
        else if(type==2) { _GFX.util.tiles.print({ str:"T:2 2/5: fillTile", x:0, y:27, tsi:2, li:0 }); }
        
        // Draw from VRAM:
        _GFX.VRAM.draw();
    },
    drawTest_print: function(type){
        // TEST: print:
        // print : function(str="", x, y, tilesetIndex, layerIndex)
        _GFX.draw.tiles.print("Test of VideoModeA",  0, 1,  2, 0);

        // TEST: print:
        let testStrings = [
            " !\"#$%&'()*+,-,/",
            "0123456789",
            ":;<=>?@",
            "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
            "[\\]^_`",
            "abcdefghijklmnopqrstuvwxyz",
            "{|}~",
        ];
        let x=0; 
        let y=3;
        for(let i=0; i<testStrings.length; i+=1){
            if     (type==1){
                // tilesTX1 
                _GFX.draw.tiles.print(testStrings[i], x, y, 2, 2);
    
                // tilesTX2
                _GFX.draw.tiles.print(testStrings[i], x, y+8, 3, 2);
            }
            else if(type==2){
                // tilesTX1 
                _GFX.util.tiles.print({ str:testStrings[i], x:x, y:y, tsi:2, li:2 })

                // tilesTX2
                _GFX.util.tiles.print({ str:testStrings[i], x:x, y:y+8, tsi:3, li:2 })
            }
            y+=1;
        }

        if     (type==1) { _GFX.draw.tiles.print("T:1 3/5: print", 0, 27, 2, 0); }
        else if(type==2) { _GFX.util.tiles.print({ str:"T:2 3/5: print", x:0, y:27, tsi:2, li:0 }); } 
        
        // Draw from VRAM:
        _GFX.VRAM.draw();
    },
    drawTest_drawTilemap: function(type){
        // TEST: drawTilemap:
        // drawTilemap : function(tilemapName, x, y, tilesetIndex, layerIndex, rotationIndex=0)
        if     (type==1){
            _GFX.draw.tiles.drawTilemap("dpad_all_off", 0, 15, 0, 2);
            _GFX.draw.tiles.drawTilemap("n782_text_f1", 20, 9, 0, 2);
        }
        else if(type==2){
            _GFX.util.tiles.drawTilemap({ tmn:"dpad_all_off", x:0, y:15, tsi:0, li:0, ri:0 } );
            _GFX.util.tiles.drawTilemap({ tmn:"n782_text_f1", x:20, y:9, tsi:0, li:0, ri:0 } );
        }
        if     (type==1) { _GFX.draw.tiles.print("T:1 4/5: drawTilemap", 0, 27, 2, 0); }
        else if(type==2) { _GFX.util.tiles.print({ str:"T:2 4/5: drawTilemap", x:0, y:27, tsi:2, li:0 }); } 

        // Draw from VRAM:
        _GFX.VRAM.draw();
    },
    drawTest_drawTilemap_custom: function(type){
        let lines = [
            { x:0, y:1, tsi:3, li:2, str:"drawTilemap_custom: font1" },
            { x:0, y:2, tsi:2, li:2, str:"drawTilemap_custom: font2" },
            { x:2, y:3, tsi:3, li:2, str:"Another line." },
            { x:0, y:4, tsi:0, li:2, str:" !\"#$%&'() Not a fontset" },
            { x:0, y:5, tsi:1, li:2, str:" !\"#$%&'() Not a fontset" },
            { x:2, y:7, tsi:2, li:2, str:"End of test!" },
        ];
        for(let i=0; i<lines.length; i+=1){
            if     (type==1){
                let customTileMap = _GFX.draw.tiles.customTilemapFromTextString(lines[i].str, lines[i].tsi ); 
                _GFX.draw.tiles.drawTilemap_custom(lines[i].x, lines[i].y, lines[i].tsi, lines[i].li, customTileMap ); 
            }
            else if(type==2){
                let customTileMap = _GFX.util.tiles.customTilemapFromTextString({ str:lines[i].str, tsi:lines[i].tsi }); 
                _GFX.util.tiles.drawTilemap_custom({ x:lines[i].x, y:lines[i].y, tsi:lines[i].tsi, li:lines[i].li, tm:customTileMap }); 
            }
        }

        if     (type==1) { _GFX.draw.tiles.print("T:1 5/5: drawTilemap_custom", 0, 27, 2, 0); }
        else if(type==2) { _GFX.util.tiles.print({ str:"T:2 5/5: drawTilemap_custom", x:0, y:27, tsi:2, li:0 });  }

        // Draw from VRAM:
        _GFX.VRAM.draw();
    },

    // VRAM draw Speed tests for each VRAM.draw "method".
    drawMethodTests: {
        // EXAMPLE USAGE: _GFX._debug.drawMethodTests.run();

        // Holds the timings of each draw run. 
        times: {
            method1:[], //  16.11 ms : Draw changes directly to the destination. 
            method2:[], // 379.92 ms : Draw changes to a temp canvas then draw to the destination. 
            method3:[], //  23.97 ms : Draw changes to a full temp canvas then draw the full temp canvas to the destination.
        },
        test: async function(totalRuns, method, key){
            for(let i=0; i<totalRuns; i+=1){
                await new Promise( async(res,rej)=>{
                    window.requestAnimationFrame( async ()=> {
                        let ts = performance.now();
                        _GFX.VRAM.clearVram();
                        _GFX.draw.tiles.print(`k: ${key}, m: ${method}, ${i+1}/${totalRuns}`.padEnd(28," "),  0, 0,  2, 0);
                        // _GFX._debug.drawTest_print(); 
                        await _GFX.VRAM.draw(method);
                        let te = performance.now();
                        if(te-ts != 0){ this.times[key].push(te-ts); }
                        res();
                    });
                });
            }
            
            let avg = this.times[key].reduce((a,b)=>a+b)/this.times[key].length;
            console.log(`  key: ${key}, totalRuns: ${totalRuns}, method: ${method}, avg: ${avg.toFixed(2)} ms`);
        },

        // Run this to run the tests.
        run: async function(){
            // Clear the time records. 
            this.times.method1 = [];
            this.times.method2 = [];
            this.times.method3 = [];

            // Specify how many times to run each test.
            let testRuns = 3;
            let innerTestRuns = 10;

            let keys = Object.keys(this.times);
            for(let t=0; t<testRuns; t+=1){
                console.log(`Run ${t+1} of ${testRuns}`);
                for(let i=0; i<keys.length; i+=1){
                    let method = i+1;
                    let key = keys[i];
                    await _GFX._debug.drawMethodTests.test(innerTestRuns, method, key);
                }
            }
        },
    },
};