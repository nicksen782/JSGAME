# JS GAME V2 - Video Mode A

Video Mode A supports the following:
- Multiple tilesets.
- Drawing of individual tiles or drawing a tilemap.
- The graphics state is held in memory. Only graphics changes are written to the output canvas.
- Canvases be configured to be tile-grid-aligned. Easiest to work with.
- Canvases can also be configured to have non-tile-grid-aligned tiles. This is for sprites.

Video Mode A takes its input from JSON.
- This file can be created by using GconvertJS
  - https://nicksen782.net/UAM/APP_gconvert
- The most important keys/arrays in the file are:
  tilesetName: The name of the tileset. Used internally to differentiate tilesets. 
  - config: (object)
    - "pointersSize": Either 8 or 16. Used to determine the type of typed array to use for VRAM.
    - "tileHeight": Height in pixels of tiles in the tileset. 
    - "tileWidth": Width in pixels of tiles in the tileset. ,
    - "translucent_color": During conversion if this pixel color is seen then it will be written 100% transparent. 
  - tilemaps: (object)
    - Each key is a tilemap name. The data is in the format of width in tiles, height in tiles, ... tileIds used to create the tilemap.
    - Conversion process will decode the stringified tilemap array.
  - tileset: (array)
    - Each entry in the array consists of RGB332 values. One byte for each pixel. (Similar to Uzebox.)
      - The conversion process will take this data and convert it to RGB32 for canvas use.
    - Conversion process will decode the stringified tile array.

How to use GconvertJS to create the input JSON file.
  - GconvertJs: https://nicksen782.net/UAM/APP_gconvert
  - You will need a source graphic for your tileset(s) and also an XML file that will indicate what tiles are used and where the tilemaps are defined.
    - Below the top section (INPUT AND VALIDATION) there are two links:
      - "Download IMG sample"
      - "Download XML template"
    - Use these to begin.
      - You can edit the XML file within Gconvert but the text can be easily copy/pasted into the editor of your choice.
      - The "INPUT IMG" can be easily updated. First, copy your source graphic then double-click the "INPUT IMG" image. Paste with CTRL+V and the new image will display.
  - Next, click "Load into the Map Editor".
  - From here you can see the list of tilemaps, a preview, and a scrollable copy of the source image. 
  - You can set the L, T, W, H values manually and/or you can just double-click on the image to automatically set the coordinates. 
    - There is a hover preview box to help you lock in the correct coordinates.
  - After you have created your tilemap entries it would be wise to click the "Update xml/json text (above)" button. This will update the source XML. You can copy/paste it somewhere else to save it.
  - Next, click "PROCESS".
  - Processing will analyze all tiles used by tilemaps and determine if any are duplicates. Duplicate tiles will be remapped to their original and not saved. This reduces file size and tile count. 
  - You can see which tiles are used on the left "MARKED DUPES" canvas.
  - You can see the final tileset in the "TILESET" canvas.
  - Finally, at the right you will see "COMBINED OUTPUT". This is where the text-based output will be saved.
  - You can copy the completed JSON from here and save it to your app directory.