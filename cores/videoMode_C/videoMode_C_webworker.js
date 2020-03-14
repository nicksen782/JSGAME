'use strict';

// Take care of vendor prefixes.
self.postMessage = self.postMessage || self.webkitPostMessage;

self.onmessage = function(event) {
	switch( event.data.function ){
		// ImageData manipulation for color swaps of the provided array buffer(s)
		case "colorswaps" : { colorswaps(event); break; }

		// Unmatched function.
		default     : { break; }
	}
};

function colorswaps(event){
	//
	let finished_img_buffers_arr = [];
	let finished_newVRAM_entries = [];
	let transferList             = [];

	// Go through the array of image buffers.
	for(let img=0; img<event.data.img_buffers_arr.length; img+=1){
		// Get handles to the VRAM_entry and the flags.
		let VRAM_entry = event.data.newVRAM_entries[img] ;
		let flags      = VRAM_entry.flags ;

		//  Get handle to the provided image buffer.
		let img_buff   = event.data.img_buffers_arr[img] ;

		//  Create views.
		let img_view8  = new Uint8ClampedArray(img_buff) ;
		let img_view32 = new Uint32Array(img_buff);

		// Get the number of bytes to read through.
		let len = img_view8.byteLength;

		// Set all colorSwap strings to uppercase.
		for(let j=0; j<flags.colorSwaps.length; j+=1){
			flags.colorSwaps[j][0] = flags.colorSwaps[j][0].toUpperCase();
			flags.colorSwaps[j][1] = flags.colorSwaps[j][1].toUpperCase();
		}

		// Go through the bytes of the view.
		let i_32=0;
		for(let i=0; i<len; i+=4){
			// Get the RGB values for this pixel.
			let red   = img_view8[i+0];
			let green = img_view8[i+1];
			let blue  = img_view8[i+2];
			let alpha = img_view8[i+3];

			// Any fully transparent pixel can be skipped since the alpha value is not part of the color swaps.
			if(alpha==0){ i_32+=1; continue; }

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
					red   == lookFor_red &&
					green == lookFor_green &&
					blue  == lookFor_blue  &&
					alpha == lookFor_alpha
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
			}

			//
			i_32+=1;
		}

		//
		finished_img_buffers_arr.push( img_buff   );
		finished_newVRAM_entries.push( VRAM_entry );
		transferList            .push( img_buff   );
	}

	// Create the return message.
	let msg = {
		"function"                 : "colorswaps"             ,
		"finished_img_buffers_arr" : finished_img_buffers_arr ,
		"finished_newVRAM_entries" : finished_newVRAM_entries ,
		"length"                   : event.data.img_buffers_arr.length ,
		// "startTime"                : event.data.startTime ,
		"workerIndex"              : event.data.workerIndex ,
	};

	// Return the data.
	self.postMessage(msg, transferList);
}