// Take care of vendor prefixes.
self.postMessage = self.postMessage || self.webkitPostMessage;

self.onmessage = function(event) {
	switch( event.data.function ){
		// imgData manipulation for color swaps.
		case "colorswaps" : { colorswaps(event); break; }

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

		//  Create a view.
		let img_buff = event.data.img_buffers_arr[img] ;
		let img_view = new Uint8ClampedArray(img_buff) ;

		// Only operate if there are colorSwaps to do.
		if(flags.colorSwaps.length){
			// Get the number of bytes to read through.
			let numBytes = (VRAM_entry.w * VRAM_entry.h) * 4;

			// Go through the bytes of the view.
			for(let i=0; i<numBytes; i+=4){
				// Get the RGB values for this pixel.
				let red   = img_view[i+0];
				let green = img_view[i+1];
				let blue  = img_view[i+2];
				let alpha = img_view[i+3];

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
						img_view[i+0]=replaceWith_red  ;
						img_view[i+1]=replaceWith_green;
						img_view[i+2]=replaceWith_blue ;
						img_view[i+3]=replaceWith_alpha;

						// After a match on this pixel any further matching would over-write the pixel.
						break;
					}

					// Not a match? Draw the original pixel values.
					else{
						img_view[i+0]=red  ;
						img_view[i+1]=green;
						img_view[i+2]=blue ;
						img_view[i+3]=alpha;
					}
				}

			}

			//
			finished_img_buffers_arr.push(img_buff);
			finished_newVRAM_entries.push(VRAM_entry);
			transferList            .push(img_buff);
		}
		else{
			finished_img_buffers_arr.push(img_buff);
			finished_newVRAM_entries.push(VRAM_entry);
			transferList            .push(img_buff);
		}

	}

	let msg = {
		"function"          : "colorswaps"      ,
		"finished_img_buffers_arr" : finished_img_buffers_arr ,
		"finished_newVRAM_entries" : finished_newVRAM_entries ,
		"length"                   : event.data.img_buffers_arr.length ,
	};

	// Return the data.
	// self.postMessage(msg, []);
	self.postMessage(msg, transferList);
};
