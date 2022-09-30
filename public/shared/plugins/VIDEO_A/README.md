# Video Mode A for JSGAME v2
> An indexed Video RAM graphics libray for JSGAME v2.
---

## FEATURES
- VRAM is a 1-dimensional typed array.
  - Either `Uint8Array` or `Uint16Array`.
  - Set `meta.dimensions.pointersSize` to `8` or `16` to select the type of array.
  - Typed arrays reserve their block of memory, cannot be resized, and can be faster than normal arrays.
  - `Uint8Array` allows for up to 255 tiles per tileset. `Uint16Array` supports up to 65535.
    - The difference is the memory used per index. Uint16Array takes up twice as much as Uint8Array.
    - Unless you have a tilemap having more than 255 unique tileIds you should probably choose Uint8Array.
- Tiles can have transparency in them.
- Multiple "layers".
  - Layers can be thought of as "tile draw order." Layer 0 is written first, then layer 1, etc.
  - The layer concept supports tile transparency but this is only between layers.
  - Only one tile at one x,y coordinate on the same layer can exist. 
    - EXAMPLE: Writing a second one would overwrite the first before it is drawn.
- Tilesets are not locked to a layer. (Can write any tile of any tileset to any layer(s).)
- Can draw individual tiles, a tilemap, or text as tiles.
- Outputs to a single canvas for display.
- Minimizes full-canvas drawing updates. 

## OVERVIEW:

- All JSON tilesets must have the same setting for meta.dimensions.pointersSize (either 8 or 16).
- Both the canvas and the ctx need to be defined in _APP as _APP.canvas and _APP.ctx.
- Output is to a single canvas although it can have multiple logical "layers".
- The state of each tile on each layer is stored in a flat VRAM array. 
- Each each y,x coordinate has two bytes per layer indicating the layerIndex and tileId for the layer.
  - Ex:     L T   L T  L T
  - Ex: ... 0,0,  0,0  0,0 ...
- Each update to VRAM via VRAM.updateVram (which is called by VRAM.draw.setTile) will update VRAM._VRAM_view and VRAM.changes.
- When running VRAM.draw, VRAM.changes determines where to draw tiles. 
- VRAM.draw uses VRAM._VRAM_view for the actual tilesetIndex and tileId values to be drawn.
- Only changed tiles (in VRAM.changes) will be updated on the destination canvas. 
- After VRAM.draw completes, VRAM.changes is cleared.
- Your gameloop will need to call VRAM.draw. 

## SETUP:

Requires the following values in your appConfig.json file:

ADD THE PLUG-IN.

`
"jsgame_shared_plugins":[
    { "f":"shared/plugins/VIDEO_A/videoModeA.js", "t": "js", "n":"videoModeA", "o":{} }
]
`

These values are needed for converting and drawing graphics. (EXAMPLE)

```
    "dimensions":{
        "tileWidth" : 8,
        "tileHeight": 8,
        "rows":28, 
        "cols":28
    },
    "layers":[
        "BG1",
        "SP1",
        "TEXT"
    ], 
    "tilesets":[
        "tilesBG1",
        "tilesSP1",
        "tilesTX1",
        "tilesTX2"
    ]
```

## USAGE:

### Example: Draw one tile:
``` 
// Function signature: setTile : function(tileId, x, y, tilesetIndex, layerIndex) 
_GFX.draw.tiles.setTile(1,  0, 0,  3, 0); 
```
---
### Example: Fill a rectangular region with a tile:
``` 
// Function signature: fillTile : function(tileId=" ", x, y, w, h, tilesetIndex, layerIndex)
_GFX.draw.tiles.fillTile(1,  10, 10,  5, 5,  2, 2); 
```
---
### Example: Print a line of text tiles:
```
// Function signature: print : function(str="", x, y, tilesetIndex, layerIndex)
_GFX.draw.tiles.print("Test of VideoModeA",  0, 1,  2, 0); 
```
---
### Example: Draw a tilemap: 
```
// Function signature: drawTilemap : function(tilemapName, x, y, tilesetIndex, layerIndex, rotationIndex=0)
_GFX.draw.tiles.drawTilemap("n782_text_f1", 0, 22, 0, 2); 
```
---

Look to _GFX._debug drawTest_ functions for more basic examples of how to use the drawing functions. 

---

## GENERATING GRAPHICS INPUT

Video Mode A takes its input from JSON file(s).
- This file can be created by using GconvertJS
  - [GconvertJS web link](https://nicksen782.net/UAM/APP_gconvert)
  - [GconvertJS on Github](https://github.com/nicksen782/OnlineGconvertJS)
- The most important keys/arrays in the file are:
  tilesetName: The name of the tileset. Used internally to differentiate tilesets. 
  - `config`: (object)
    - `pointersSize`: Either `8` or `16`. Used to determine the type of typed array to use for VRAM.
    - `tileHeight`: Height in pixels of tiles in the tileset. 
    - `tileWidth`: Width in pixels of tiles in the tileset. ,
    - `translucent_color`: During conversion if this pixel color is seen then it will be written 100% transparent. 
  - `tilemaps`: (object)
    - Each key is a tilemap name. The data is in the format of width in tiles, height in tiles, ... tileIds used to create the tilemap.
    - Conversion process will decode the stringified tilemap array.
  - `tileset`: (array)
    - Each entry in the array consists of `RGB332` values. One byte for each pixel. (Similar to Uzebox.)
      - The conversion process will take this data and convert it to `RGB32` for canvas use.
    - Conversion process will decode the stringified tile array.

How to use GconvertJS to create the input JSON file.
  - GconvertJs: https://nicksen782.net/UAM/APP_gconvert
  - You will need a source graphic for your tileset(s) and also an XML file that will indicate what tiles are used and where the tilemaps are defined.
    - Below the top section (__INPUT AND VALIDATION__) there are two links:
      - "__Download IMG sample__"
      - "__Download XML template__"
    - Use these to begin.
      - You can edit the XML file within Gconvert but the text can be easily copy/pasted into the editor of your choice.
      - The "__INPUT IMG__" can be easily updated. 
        - First, copy your source graphic.
        - Double-click the "INPUT IMG" image. 
        - Paste with CTRL+V and the new image will display.
  - Next, click "__Load into the Map Editor__".
  - From here you can see the list of tilemaps, a preview, and a scrollable copy of the source image. 
  - You can set the L, T, W, H values manually and/or you can just double-click on the image to automatically set the coordinates. 
    - There is a hover preview box to help you lock in the correct coordinates.
  - After you have created your tilemap entries it would be wise to click the "__Update xml/json text (above)__" button. This will update the source XML. You can copy/paste it somewhere else to save it.
  - Next, click "__PROCESS__".
  - Processing will analyze all tiles used by tilemaps and determine if any are duplicates. Duplicate tiles will be remapped to their original and not saved. This reduces file size and tile count. 
  - You can see which tiles are used on the left "__MARKED DUPES__" canvas.
  - You can see the final tileset in the "__TILESET__" canvas.
  - Finally, at the right you will see "__COMBINED OUTPUT__". This is where the text-based output will be saved.
  - You can copy the completed JSON from here and save it to your app directory.
