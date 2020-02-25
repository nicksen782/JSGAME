// Take care of vendor prefixes.
self.postMessage = self.postMessage || self.webkitPostMessage;

self.onmessage = function(event) {
	switch( event.data.function ){
		// imgData manipulation for color swaps of the provided array buffer (Image Data.)
		case "colorswaps" : { colorswaps(event); break; }

		// Handles fading of the provided array buffer (Image Data.)
		case "fade"       : { fade(event); break; }

		// Unmatched function.
		default     : { break; }
	}
}

function colorswaps(event){
	//
	let finished_img_buffers_arr = [];
	let finished_newVRAM_entries = [];
	let transferList = [];

	for(let img=0; img<event.data.img_buffers_arr.length; img+=1){
		let VRAM_entry = event.data.newVRAM_entries[img] ;
		let flags      = VRAM_entry.flags ;

		// Only operate if there are colorSwaps to do.
		if(flags.colorSwaps.length){
			//  Get handle to the provided image buffer.
			let img_buff = event.data.img_buffers_arr[img] ;

			//  Create views.
			let img_view8  = new Uint8ClampedArray(img_buff) ;
			var img_view32 = new Uint32Array(img_buff);

			// Get the number of bytes to read through.
			let len = (VRAM_entry.w * VRAM_entry.h) * 4;

			// Go through the bytes of the view.
			let i_32=0;
			for(let i=0; i<len; i+=4){
				// Get the RGB values for this pixel.
				let red   = img_view8[i+0];
				let green = img_view8[i+1];
				let blue  = img_view8[i+2];
				let alpha = img_view8[i+3];

				// Go through the colorSwaps and look for matches.
				for(let j=0; j<flags.colorSwaps.length; j+=1){
					// Determine the colors that we are looking for.
					let lookFor       = flags.colorSwaps[j][0] ;
					let lookFor_red   = parseInt(lookFor.substring(1,3),16) ;
					let lookFor_green = parseInt(lookFor.substring(3,5),16) ;
					let lookFor_blue  = parseInt(lookFor.substring(5,7),16) ;
					let lookFor_alpha = 255 ;

					// Color match?
					let match = (
						red      == lookFor_red
						&& green == lookFor_green
						&& blue  == lookFor_blue
						&& alpha == lookFor_alpha
					) ? true : false;

					// Act upon matches.
					if(match){
						// Determine the replacement colors.
						let replaceWith       = flags.colorSwaps[j][1] ;
						let replaceWith_red   = parseInt(replaceWith.substring(1,3),16) ;
						let replaceWith_green = parseInt(replaceWith.substring(3,5),16) ;
						let replaceWith_blue  = parseInt(replaceWith.substring(5,7),16) ;
						let replaceWith_alpha = 255 ;

						// Replace the colors.
						// img_view8[i+0]=replaceWith_red  ;
						// img_view8[i+1]=replaceWith_green;
						// img_view8[i+2]=replaceWith_blue ;
						// img_view8[i+3]=replaceWith_alpha;

						// Replace the colors.
						img_view32[i_32] =
							(replaceWith_alpha  << 24) | // alpha
							(replaceWith_blue   << 16) | // blue
							(replaceWith_green  <<  8) | // green
							replaceWith_red              // red
						;

						// After a match on this pixel any further matching would over-write the pixel.
						break;
					}

					// Not a match?
					else{
						// Draw the original pixel values.
						// img_view8[i+0]=red  ;
						// img_view8[i+1]=green;
						// img_view8[i+2]=blue ;
						// img_view8[i+3]=alpha;

						// Draw the original pixel values.
						img_view32[i_32] =
						(alpha  << 24) | // alpha
						(blue   << 16) | // blue
						(green  <<  8) | // green
						red              // red
						;
					}
				}

				//
				i_32+=1;
			}

			//
			finished_img_buffers_arr.push(img_buff);
			finished_newVRAM_entries.push(VRAM_entry);
			transferList            .push(img_buff);
		}

		// Otherwise just write the pixels as they are.
		else{
			finished_img_buffers_arr.push( event.data.img_buffers_arr[img] );
			finished_newVRAM_entries.push( event.data.newVRAM_entries[img] );
			transferList            .push( event.data.img_buffers_arr[img] );
		}
	}

	let msg = {
		"function"                 : "colorswaps"             ,
		"finished_img_buffers_arr" : finished_img_buffers_arr ,
		"finished_newVRAM_entries" : finished_newVRAM_entries ,
		"length"                   : event.data.img_buffers_arr.length ,
	};

	// Return the data.
	self.postMessage(msg, transferList);
};

function testFunction(){
	setInterval(function(){
		if(core.GRAPHICS.WORKERS.w_fade.fadeDirection==1){
			core.GRAPHICS.WORKERS.w_fade.fadeLevel=12;
			core.GRAPHICS.WORKERS.w_fade.fadeDirection = -1;
		}
		else{
			core.GRAPHICS.WORKERS.w_fade.fadeLevel=1;
			core.GRAPHICS.WORKERS.w_fade.fadeDirection = 1;
		}
	}, 3000);
}

function fade(event){
	// Get the dimensions.
	let x = event.data.x ;
	let y = event.data.y ;
	let w = event.data.w ;
	let h = event.data.h ;

	// Get the max for red, green, and blue from the passed fade_record.
	let maxRed   = event.data["maxRed"];
	let maxGreen = event.data["maxGreen"];
	let maxBlue  = event.data["maxBlue"];

	// console.log(event.data);

	//  Get handle to the provided image buffer.
	let img_buff = event.data.img_buff ;

	//  Create views.
	let img_view8  = new Uint8ClampedArray(img_buff) ;
	var img_view32 = new Uint32Array(img_buff);

	// Get the number of bytes to read through.
	let len = (w * h) * 4;

	let i_32=0;
	for(let i=0; i<len; i+=4){
		// Get the new color values for this pixel.
		let new_red   = (img_view8[i+0] * (maxRed   / 100) ) << 0 ;
		let new_green = (img_view8[i+1] * (maxGreen / 100) ) << 0 ;
		let new_blue  = (img_view8[i+2] * (maxBlue  / 100) ) << 0 ;
		let new_alpha = (img_view8[i+3]) ;

		// Replace the colors. (8-bit) (slower)
		// img_view8[i+0] = new_red   ;
		// img_view8[i+1] = new_green ;
		// img_view8[i+2] = new_blue  ;
		// img_view8[i+3] = new_alpha ;

		// Replace the colors. (32-bit) (faster)
		img_view32[i_32] =
			(new_alpha  << 24) | // alpha
			(new_blue   << 16) | // blue
			(new_green  <<  8) | // green
			(new_red         )   // red
		;

		//
		i_32+=1;
	}

	let msg = {
		"function"          : "fade"   ,
		"finished_img_buff" : img_buff ,
		"x"                 : x ,
		"y"                 : y ,
		"w"                 : w ,
		"h"                 : h ,
	};

	// console.log(
		// "\n function" , "fade"   ,
		// "\n x"        , x        ,
		// "\n y"        , y        ,
		// "\n w"        , w        ,
		// "\n h"        , h        ,
		// "\n maxRed"   , maxRed   ,
		// "\n maxGreen" , maxGreen ,
		// "\n maxBlue"  , maxBlue  ,
	// );

	let transferList = [];
	// let transferList = [img_buff];
	// let transferList = img_buff;

	// Return the data.
	self.postMessage(msg, transferList);

};