'use strict';

// Take care of vendor prefixes.
self.postMessage = self.postMessage || self.webkitPostMessage;

self.onmessage = function(event) {
	switch( event.data.func ){
		// Called by: core.GRAPHICS.FADER.FUNCS.ProcessFading -> doNewFade.
		case "fade"                     : { fade(event);                     break; }

		// Unmatched function.
		default     : { break; }
	}
};

// Fade effect for when OffscreenCanvas IS NOT available.
function fade(event){
	// Get the passed ArrayBuffer.
	let img_view8  = new Uint8ClampedArray( event.data.buf );
	let img_view32 = new Uint32Array(event.data.buf);

	// Get the passed ArrayBuffer length.
	let len = img_view8.byteLength;

	// Get the max for red, green, and blue from the passed fade_record.
	let maxRed   = event.data.maxRed   / 100;
	let maxGreen = event.data.maxGreen / 100;
	let maxBlue  = event.data.maxBlue  / 100;

	// Adjust all pixels to be no higher than the max for that color.
	let i_32 = 0;
	for(let i=0; i<len; i+=4){
		// Any fully transparent pixel can be skipped.
		let alpha = img_view8[i+3];
		if(alpha==0){ i_32+=1; continue; }

		let replaceWith_blue  = ((img_view8[i+2] * (maxBlue ) ) | 0) ;
		let replaceWith_green = ((img_view8[i+1] * (maxGreen) ) | 0) ;
		let replaceWith_red   = ((img_view8[i+0] * (maxRed  ) ) | 0) ;

		// Replace colors (8-bit)
		// img_view8[i+2] = replaceWith_blue  ;
		// img_view8[i+1] = replaceWith_green ;
		// img_view8[i+0] = replaceWith_red   ;

		// Replace colors (32-bit)
		img_view32[i_32] =
			(alpha              << 24) | // alpha
			(replaceWith_blue   << 16) | // blue
			(replaceWith_green  <<  8) | // green
			replaceWith_red              // red
		;

		//
		i_32+=1;
	}

	// Return the data.
	self.postMessage(
		{ "modbuf"     : event.data.buf },
		[ event.data.buf ]
	);
}