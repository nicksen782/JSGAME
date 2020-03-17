// ====================================
// ==== FILE START: soundMode_A.js ====
// ====================================

'use strict';

/*
TO DO:

https://github.com/g200kg/webaudio-tinysynth
core.FUNCS.audio.TODO_resumeAllSounds
core.FUNCS.audio.TODO_pauseAllSounds

*/

/**
 * Audio lookup to the audio elements and some extra data.
 * @summary Audio lookup to the audio elements and some extra data.
 * @global
*/
core.ASSETS.audio     = {} ; //

/**
 * Functions for audio.
 * @summary Functions for audio.
 * @namespace core.FUNCS.audio
*/
core.FUNCS.audio      = {} ; //

/**
 * Audio elements and some extra data.
 * @summary Audio elements and some extra data.
 * @global
*/
core.AUDIO            = {} ; //

/**
 * Synths used by TinySynth.
 * @summary Synths used by TinySynth.
 * @global
*/
core.AUDIO.midiSynths = {} ; //

/**
 * MIDI data used by TinySynth.
 * @summary MIDI data used by TinySynth
 * @global
*/
core.AUDIO.midiData   = {} ; //

// *** Init conversion functions - Removed after use. ***
core.FUNCS.audio.init = function(){

	return new Promise(function(audio_init_resolve, audio_init_reject){
		JSGAME.SHARED.PERFORMANCE.stamp("SOUND_INIT_ALL","START");
		// Take performance metrics.

		let sounds_mp3 = {
			soundsSetup_mp3  : function(){
				return new Promise(function(res_soundsSetup_mp3, rej_soundsSetup_mp3){
					JSGAME.SHARED.PERFORMANCE.stamp("SOUND_INIT_soundsSetup_mp3","START");

					// let gamedir     = parentPath + JSGAME.PRELOAD.gameselected_json['gamedir'].replace("../", "");
					let audio_proms = [];
					let TEMP_keys = Object.keys(JSGAME.TEMP);
					core.AUDIO.elems          = {};
					core.ASSETS.audio.lookups = {};

					let mp3_files_len = JSGAME.PRELOAD.gamesettings_json.mp3_files.length;
					for(let i=0; i<mp3_files_len; i+=1){
						// let d = JSGAME.PRELOAD.gamesettings_json.mp3_files[i];
						let d = JSGAME.PRELOAD.gamesettings_json.mp3_files[i];
						let rel_url = JSGAME.PRELOAD.gameselected_json.gamedir + "/"+ d.fileurl;
						// console.log("+--------- mp3 file:", rel_url, JSGAME.PRELOAD.gameselected_json['gamedir'], d);

						// Add entry to the lookup table.
						d.names.forEach(function(dd){
							let audioLookup = {
								"key"  : d.key  ,
								"type" : d.type ,
							};
							core.ASSETS.audio.lookups[ dd ] = audioLookup;
						});

						// Get the audio file as-is.
						let audioElem = document.createElement("audio");
						audioElem.setAttribute("preload", "auto");

						// audioElem.load();
						// https://developer.mozilla.org/en-US/docs/Web/Guide/Events/Media_events
						// audioElem.oncanplay = function(){ audioElem.oncanplay=null; this.pause(); this.currentTime=0; };

						// Add this to the audio proms array.
						audio_proms.push(
							new Promise(function(res_in, rej_in){
								if( TEMP_keys.indexOf( d.fileurl ) != -1){
									audioElem.oncanplaythrough = function(dat){
										audioElem.oncanplaythrough = null;
										URL.revokeObjectURL( JSGAME.TEMP[d.fileurl] ) ;
										delete JSGAME.TEMP[d.fileurl] ;
										res_in();
									};

									// Create an object url on the arraybuffer converted to blob and set it as the src of the audio element. (faster.)
									audioElem.src = JSGAME.TEMP[d.fileurl] ;
								}
								else{
									JSGAME.SHARED.getFile_fromUrl( rel_url, true, "blob" )
									.then(
										function(res){
											// OLD WAY
											// audioElem.src = gamedir + "/" + d['fileurl'];

											let d_url = URL.createObjectURL( res );

											audioElem.oncanplaythrough = function(){
												audioElem.oncanplaythrough = null;
												URL.revokeObjectURL(audioElem.src) ;
												res_in();
											};

											// Create an object url on the arraybuffer converted to blob and set it as the src of the audio element. (faster.)
											// audioElem.src = URL.createObjectURL( res );
											audioElem.src = d_url ;
											res_in();

										},
										function(err){
											rej_in();

											let str = ["rej_in: ", JSON.stringify(err)];
											throw Error(str);
										}
									);
								}

							})
						);

						// audioElem.src = gamedir + "/" + d['fileurl'];
						core.AUDIO.elems[ d.key ] = audioElem;
					}

					Promise.all(audio_proms)
						.then(
							function(){
								JSGAME.SHARED.PERFORMANCE.stamp("SOUND_INIT_soundsSetup_mp3","END");
								res_soundsSetup_mp3("RESOLVED: soundsSetup_mp3");
							},
							function(err){
								console.error("ERROR: Some promises may not have resolved. ", err);
								JSGAME.SHARED.PERFORMANCE.stamp("SOUND_INIT_soundsSetup_mp3","END");
								rej_soundsSetup_mp3("REJECTED: soundsSetup_mp3");

								let str = ["rej_soundsSetup_mp3: ", JSON.stringify(err)];
								throw Error(str);
							}
						)
						.finally(function(){ } )
					;

				});
			},
		};

		let sounds_midi = {};
		// Parse the MIDI binary.
		sounds_midi.parse_midi_bin = function(bin){
			return new Promise(function(res_parse_midi_bin, rej_parse_midi_bin){
				JSGAME.SHARED.PERFORMANCE.stamp("SOUND_INIT_parse_midi_bin"   , "START");

				// Offset.
				let offset = 0;

				// *** TOP BINARY PORTION ***

				// Create views for the received ArrayBuffer.
				let bin_view8  = new Uint8Array (bin) ;
				let bin_view16 = new Uint16Array(bin) ;
				let bin_view32 = new Uint32Array(bin) ;

				// Bytes 0-1
				let numSongs        = bin_view16[0] ;
				let RESERVED        = bin_view16[1] ;

				// Bytes 2-4
				let headerOffset    = bin_view32[1] ;
				let filenamesOffset = bin_view32[2] ;
				let dataOffset      = bin_view32[3] ;

				// *** READ FILENAMES FROM BINARY FILE ***

				// Expected length for filename entries.
				let filename_length = 20;
				// Expected length for filetype entries.
				let filetype_length = 7;
				// Hold the parsed filename/filetype data.
				let filename_data = [];
				// Reset the offset value.
				offset = 0;
				// Go through (for each song index) and get each entry for filename and filetype.
				for(let i=0; i<numSongs; i+=1){
					// Strings to hold our key and type.
					let name  = "";
					let type = "";

					// Read through the bytes and add them to the name string. (Decode from char code to char.)
					for(let i2=0; i2<filename_length; i2+=1){
						let test = bin_view8[offset+filenamesOffset+i2];
						name += String.fromCharCode(test);
					}
					// Adjust the offset by the expected filename length.
					offset+=filename_length;

					// Read through the bytes and add them to the type string. (Decode from char code to char.)
					for(let i3=0; i3<filetype_length; i3+=1){
						let test = bin_view8[offset+filenamesOffset+i3];
						type += String.fromCharCode(test);
					}
					// Adjust the offset by the expected filetype length.
					offset+=filetype_length;

					// Add the new key, type to filename_data. Use "trim()" on each string.
					filename_data.push({
						"key"  : name.trim() ,
						"type" : type.trim() ,
					});
				}

				// *** READ HEADER DATA FROM BINARY FILE ***

				// Hold the parsed header data.
				let header_data = [];
				// Set the offset value to the header offset.
				offset = headerOffset;
				// Go through (for each song index) and get each entry for start and end.
				for(let i=0; i<numSongs; i+=1){
					// Add the new start, end to the header data.
					header_data.push({
						"start" : bin_view32[ (offset/4)+0 ] ,
						"end"   : bin_view32[ (offset/4)+1 ] ,
					});

					// Go to the next entry by adjusting the offset by the byteLength of start and end.
					offset+=8;
				}

				// *** CREATE THE MUSIC DATA OBJECT ***

				// Hold the retrieved song data(s).
				let musicData = {};
				// Go through (for each song index) and get the song data(s).
				for(let i=0; i<numSongs; i+=1){
					// Copy the range of bytes for this entry.
					let songData = bin_view8.slice(
						dataOffset + header_data[i].start,
						dataOffset + header_data[i].end
					);

					// Create the musicData object for this song.
					musicData[ filename_data[i].key ] = {
						"key" : filename_data[i].key  ,
						"type": filename_data[i].type ,
						"data": songData              ,
					};
				}

				// Save the parsed MIDI data.
				core.AUDIO.midiData=musicData;

				JSGAME.SHARED.PERFORMANCE.stamp("SOUND_INIT_parse_midi_bin"   , "END");

				res_parse_midi_bin();

				// rej_parse_midi_bin();
			});
		};
		// Get the MIDI binary.
		sounds_midi.load_midi_bin    = function(){
			return new Promise(function(res_load_midi_bin, rej_load_midi_bin){
				JSGAME.SHARED.PERFORMANCE.stamp("SOUND_INIT_load_midi_bin"   , "START");

				// Determine the relative filepath to the file.
				let filename = JSGAME.PRELOAD.gamesettings_json.midi_bin;
				let rel_url = JSGAME.PRELOAD.gameselected_json.gamedir + "/"+ filename;

				// Each file download is a promise. Keep an array of the promises.
				let proms = [];
				let TEMP_keys = Object.keys(JSGAME.TEMP);

				if( TEMP_keys.indexOf( filename ) != -1){
					proms.push(
						new Promise(function(res,rej){
							res(JSGAME.TEMP[filename]);
							delete JSGAME.TEMP[filename] ;
						})
					);
				}
				else{
					// Start file download.
					proms.push( JSGAME.SHARED.getFile_fromUrl( rel_url, true, "arraybuffer" ) );
				}

				// When all file downloads have completed then parse the binary data.
				Promise.all(proms).then(
					function(res1){
						JSGAME.SHARED.PERFORMANCE.stamp("SOUND_INIT_load_midi_bin"   , "END");

						// One file should have been received. Parse it out.
						sounds_midi.parse_midi_bin( res1[0] ).then(
							function(res){
								res_load_midi_bin();
							},
							function(err){
								let str = ["1: rej_load_midi_bin: ", JSON.stringify(err)];
								throw Error(str);
							}
						)
						.finally(function(){  });
					},
					function(err){
						rej_load_midi_bin();

						let str = ["2: rej_load_midi_bin: ", JSON.stringify(err)];
						throw Error(str);
					})
				;
			});
		};
		// Get the Webaudio TinySynth library.
		sounds_midi.import_tinysynth = function(){
			return new Promise(function(res_import_tinysynth, rej_import_tinysynth){
				JSGAME.SHARED.PERFORMANCE.stamp("SOUND_INIT_import_tinysynth", "START");

				// Create the script element.
				let script = document.createElement("script");

				// Do this when the script has completed load.
				script.onload=function(){
					script.onload=null;

					JSGAME.SHARED.PERFORMANCE.stamp("SOUND_INIT_import_tinysynth", "END");

					res_import_tinysynth();
					// rej_import_tinysynth();
				};

				// Set the source of the script.
				script.src="libs/webaudio-tinysynth.min.js"; // Minified
				// script.src="libs/webaudio-tinysynth.js";     // Not minified.

				// Add the element to the document body.
				document.body.appendChild(script);
			});
		};
		// Setup the synths.
		sounds_midi.setup_tinysynth  = function(){
			return new Promise(function(res_setup_tinysynth, rej_setup_tinysynth){
				JSGAME.SHARED.PERFORMANCE.stamp("SOUND_INIT_setup_tinysynth" , "START");

				// Tiny Synth outputs to the console when starting and when a synth is created.
				// This will temporarily remove the console.log function until the Tiny Synth setup is complete.
				let old = console.log;
				console.log = function(){};

				// Will contain a list of synths made by Tiny Synth. They are also promises.
				let proms = [];

				let midi_synths;

				if(JSGAME.PRELOAD.gamesettings_json.midi_synths){ midi_synths = Object.keys( JSGAME.PRELOAD.gamesettings_json.midi_synths ); }
				else{ midi_synths = []; }

				// new WebAudioTinySynth( { "quality":0, "useReverb":false, "voices":16 } ) ;

				// Create the synths for MIDI.
				for(let i=0; i<midi_synths.length; i+=1){
					proms.push(
						new Promise(function(midi_resolve, midi_reject){
							// Get the key.
							let key = midi_synths[i];
							// Get the record.
							let rec = JSGAME.PRELOAD.gamesettings_json.midi_synths[key];
							// Get the used value.
							let used = rec.used;
							// Will this be used or skipped?
							if(!used){ midi_resolve(); return; }
							// Get the record synthOptions.
							let synthOptions = rec.synthOptions;
							// Get the record options.
							let options = rec.synthOptions;

							// Create synth with the specified settings.
							JSGAME.SHARED.PERFORMANCE.stamp("SOUND_INIT_setup_tinysynth_"+i+"_"+key,"START");
							core.AUDIO.midiSynths[key] = new WebAudioTinySynth( synthOptions );
							JSGAME.SHARED.PERFORMANCE.stamp("SOUND_INIT_setup_tinysynth_"+i+"_"+key,"END");

							// Loop?
							if(options.loop){ core.AUDIO.midiSynths[key].setLoop(false); }
							else            { core.AUDIO.midiSynths[key].setLoop(false); }

							// Master volume?
							core.AUDIO.midiSynths[key].setMasterVol( (100 * JSGAME.SHARED.masterVolume/100)/100 );

							// Reverb level?
							if(options.reverbLev){ core.AUDIO.midiSynths[key].setReverbLev(options.reverbLev); }

							let intervalTimer = setInterval(function(){
								// Is the synth ready?
								if( core.AUDIO.midiSynths[key].isReady ){ clearInterval(intervalTimer); midi_resolve(); }
							}, 5);

						})
					);
				}

				// Wait for all the synths to become ready.
				Promise.all(proms).then(
					function(res){
						// Restore the console.log functionality.
						console.log = old;

						JSGAME.SHARED.PERFORMANCE.stamp("SOUND_INIT_setup_tinysynth" , "END");

						// Resolve the outer Promise.
						res_setup_tinysynth();
					},
					function(err){
						rej_setup_tinysynth();

						let str = ["rej_setup_tinysynth: ", JSON.stringify(err)];
						throw Error(str);
					}
				);
			});
		};
		//
		sounds_midi.soundsSetup_midi = function(){
			return new Promise(function(res_soundsSetup_midi, rej_soundsSetup_midi){
				JSGAME.SHARED.PERFORMANCE.stamp("SOUND_INIT_soundsSetup_midi_ALL","START");

				let soundsSetup_midi_proms = [
					// Get the MIDI binary.
					sounds_midi.load_midi_bin()    ,
					// Get the Webaudio TinySynth library.
					sounds_midi.import_tinysynth() ,
				];

				// Set up the synths.
				Promise.all(soundsSetup_midi_proms)
				.then(
					function(res){
						sounds_midi.setup_tinysynth().then(
							function(res){
								res_soundsSetup_midi("RESOLVED: soundsSetup_midi");
							},
							function(err){
								let str = ["rej_soundsSetup_midi: ", JSON.stringify(err)];
								throw Error(str);
							}
						);

					}
					// ,function(err){ console.log("ERROR:", err); audio_init_reject("REJECTED: audio_init"); }
					)
					.catch  ( function(catchErr){
						console.log("CATCH:", catchErr);
						rej_soundsSetup_midi("REJECTED: soundsSetup_midi" + ", " + catchErr);
						JSGAME.SHARED.PERFORMANCE.stamp("SOUND_INIT_soundsSetup_midi_ALL","END");

						let str = ["rej_soundsSetup_midi: ", JSON.stringify(err)];
						throw Error(str);
					} )
					.finally( function(){
						// console.log("F soundsSetup_midi_ALL");
					} )
				;
				//

			});
		};

		let outerProms = [];
		if( JSGAME.PRELOAD.gamesettings_json.mp3_files ){ outerProms.push( sounds_mp3 .soundsSetup_mp3 () ); }
		if( JSGAME.PRELOAD.gamesettings_json.midi_bin  ){ outerProms.push( sounds_midi.soundsSetup_midi() ); }

		Promise.all(outerProms)
		.then(
			function(res){
				JSGAME.SHARED.PERFORMANCE.stamp("SOUND_INIT_ALL","END");
				audio_init_resolve();
				// audio_init_reject();
			}
			// ,function(err){ console.log("ERROR:", err); audio_init_reject("REJECTED: audio_init"); }
			)
			.catch  ( function(catchErr){
				audio_init_reject("REJECTED: audio_init" + ", " + catchErr);
				JSGAME.SHARED.PERFORMANCE.stamp("SOUND_INIT_ALL","END");

				let str = ["audio_init_reject: ", JSON.stringify(catchErr)];
				throw Error(str);
			} )
			.finally( function(){
				// console.log("F SOUND_INIT_ALL");
			} )
			;
	});

};

// *** Sound/audio control (MP3) ***

/**
 * @summary  (MP3) Cancel all sounds (stop the sound and reset the currentTime value.)
 * @memberof core.FUNCS.audio
 * @param    {string} type
 *
 * @example _CFA.cancelAllSounds_mp3('all');
 * @example _CFA.cancelAllSounds_mp3('mp3_sfx');
 * @example _CFA.cancelAllSounds_mp3('mp3_bgm');
*/
core.FUNCS.audio.cancelAllSounds_mp3 = function(type){
	// Make sure a valid type was specified.
	if(type==undefined || ['mp3_sfx', 'mp3_bgm', 'all'].indexOf(type) == -1){
		console.log("ERROR in cancelAllSounds_mp3: A type was not specified.");
		return ;
	}

	let keys = Object.keys( core.AUDIO.elems );

	let d;
	let len = keys.length;

	for(let i=0; i<len; i+=1){
		d=keys[i];

		// Turn off either the specified type or all depending on what was specified.
		if(d.type==type || type=="all"){
			// Abort if the sound was never used ...
			if(core.AUDIO.elems[d].elem==undefined){ return; }

			// Pause the sound.
			core.AUDIO.elems[d].pause();

			// Reset the time index.
			core.AUDIO.elems[d].elem.currentTime=0;
		}
	}

};

/**
 * @summary  (MP3) Plays Sound FX and Music.
 * @memberof core.FUNCS.audio
 * @param    {string} soundKey
 * @param    {boolean} retrigger
 * @param    {number} volume
 *
 * @example _CFA.playSound_mp3("payfee1", true, 1.0);
 */
core.FUNCS.audio.playSound_mp3 = function(soundKey, retrigger, volume){
	// core.FUNCS.audio.playSound_mp3("payfee1", true, 1.0);

	// If volume or retrigger where not specified then provide default values.
	if(volume    == undefined){ volume=1.0;     }
	if(retrigger == undefined){ retrigger=true; }

	// Actual audio elements are found here:
	// core.AUDIO.elems

	// Available sounds are setup here: core.ASSETS.audio.lookups.
	// This function uses different names that are unlikely to change in the code.
	// Easier to change where each sound points to via here.

	let playSound = function(soundKey, retrigger, volume){
		// Get the src value.
		let elem = core.AUDIO.elems[soundKey];

		// If the src is invalid, bail out.
		if(!elem) {
			// Invalid soundKey was specified.
			console.log("ERROR in playSound_mp3, cancelAllSound: A valid soundKey was not specified.");
			return ;
		}

		// Play the sound.

		// Reset the time index if specified.
		if(retrigger){ elem.currentTime=0; }

		// Adjust volume.
		elem.volume = volume;

		// Adjust the volume against the master volume value.
		try     { elem.volume = (100 * JSGAME.SHARED.masterVolume/100)/100 ; }
		catch(e){ console.warn("WARNING: playSound_mp3 : playSound: Unable to read the master volume."); }

		// Play the sound.
		let prom = elem.play().then(
			function(){},
			function(res){ console.error("PLAY ERROR:", res, elem); }
		);

	};

	// Make sure the specified sound exists.
	let keys;
	try{ keys = Object.keys(core.ASSETS.audio.lookups); } catch(e){ keys = []; }

	if( keys.indexOf( soundKey) !=-1) {
		// Based on what soundKey is specified, determine what sound to play.
		let sound = core.ASSETS.audio.lookups[soundKey].key;

		// If the sound is not set then just return.
		if(sound==""){ return ; }

		// Good, the sound was found. Play it.
		playSound(sound , retrigger, volume);
	}
	else{
		// Invalid soundKey was specified.
		console.log("Invalid soundKey was specified:", soundKey, core.ASSETS.audio.lookups);
		return;
	}

};



// *** Sound/audio control (MIDI) ***

// (MIDI)
/**
 * @summary  (MIDI) Resumes the MIDI on the specified synth.
 * @memberof core.FUNCS.audio
 * @param    {string} synthKey
 *
 * @example  _CFA.resume_midi("BGM1");
 */
core.FUNCS.audio.resume_midi = function(synthKey){
	if(synthKey==""){ return; }

	let synth = core.AUDIO.midiSynths[synthKey];
	if(! synth.getPlayStatus().play ){ synth.playMIDI(); }
};

// (MIDI)
/**
 * @summary  (MIDI) Stops/pauses the MIDI on the specified synth. Can also reset the play position.
 * @memberof core.FUNCS.audio
 * @param    {string} synthKey
 * @param    {boolean} resetPosition
 *
 * @example _CFA.stop_midi("BGM1", true);
 * @example _CFA.stop_midi("BGM1", false);
 */
core.FUNCS.audio.stop_midi = function(synthKey, resetPosition){
	if(synthKey==""){ return; }

	let synth = core.AUDIO.midiSynths[synthKey];
	if( synth.getPlayStatus().play ){
		if(resetPosition){ synth.locateMIDI(0); }
		synth.stopMIDI();
	}
};

// (MIDI)
/**
 * @summary  (MIDI) Start playing a MIDI key.
 * @memberof core.FUNCS.audio
 * @param    {string} synthKey
 * @param    {string} soundKey
 * @param    {boolean} loop
 * @param    {number} vol
 *
 * @example  _CFA.play_midi("BGM1", "A_THEME_MID", true, 1.0);
 */
core.FUNCS.audio.play_midi = function(synthKey, soundKey, loop, vol){
	if(synthKey==""){ return; }
	if(soundKey==""){ return; }
	if(loop == undefined){ loop = false; }
	if(vol  == undefined){ vol  = 1.0; }

	let synth    = core.AUDIO.midiSynths[synthKey];
	let midiData = core.AUDIO.midiData[soundKey].data;

	synth.masterVol=vol;
	synth.setLoop(loop);
	synth.loadMIDI( midiData );
	synth.playMIDI();
};

/**
 * @summary  (MIDI) Cancel all sounds (can also reset the position to 0.)
 * @memberof core.FUNCS.audio
 * @param    {boolean} resetPosition
 *
 * @example  _CFA.stopAllSounds_midi(true);
 * @example  _CFA.stopAllSounds_midi(false);
 */
core.FUNCS.audio.stopAllSounds_midi = function(resetPosition){
	// Do a pause on all synths and then reset their song position to 0.

	// Get the synth keys.
	let keys1 = Object.keys(core.AUDIO.midiSynths);

	// Synths for MIDI.
	for(let i=0; i<keys1.length; i+=1){
		let synthKey = keys1[i];
		let synth    = core.AUDIO.midiSynths[synthKey];
		let status   = synth.getPlayStatus();
		if( status.play ){
			if(resetPosition){ synth.locateMIDI(0); }
			synth.stopMIDI();
		}
	}
};

// *** Sound/audio control (SHARED) ***

// Change the master volume (affects all sounds.)
/**
 * @summary  (MP3/MIDI) Controls the master volume.
 * @memberof core.FUNCS.audio
 * @param    {number} newVol
 *
 * @example  _CFA.changeMasterVolume(80);
 */
core.FUNCS.audio.changeMasterVolume = function(newVol){
	// Change the master volume value.
	JSGAME.SHARED.masterVolume=newVol;
	JSGAME.DOM.masterVolumeSlider.value=newVol;
	JSGAME.DOM.masterVolumeSlider.title=newVol;

	// MP3 volume is already handled whenever a sound is started.

	// Midi volume is controlled per synth.
	let keys1 = Object.keys(core.AUDIO.midiSynths);
	for(let i=0; i<keys1.length; i+=1){
		let synthKey = keys1[i];
		let synth    = core.AUDIO.midiSynths[synthKey];

		try     { synth.setMasterVol( (100 * JSGAME.SHARED.masterVolume/100)/100 ) ;  }
		catch(e){ console.warn("WARNING: changeMasterVolume: Unable to read the master volume."); }
	}
};

// Pause all sounds (mp3, midi)
core.FUNCS.audio.TODO_pauseAllSounds = function(){
	// MIDI
	core.FUNCS.audio.stopAllSounds_midi(false);

	// MP3
	let keys2 = Object.keys(core.AUDIO.elems);
	for(let i=0; i<keys2.length; i+=1){
		let elem = core.AUDIO.elems[ keys2[i] ];
		// core.AUDIO.elems.tick.readyState
		// core.AUDIO.elems.tick.duration
		// core.AUDIO.elems.tick.currentTime
		// core.AUDIO.elems.tick.paused
	}

};

// Resume all sounds (mp3, midi)
core.FUNCS.audio.TODO_resumeAllSounds = function(){
	// core.FUNCS.audio.stopAllSounds_midi(false);

	// Get the MIDI synth keys.
	let keys1 = Object.keys(core.AUDIO.midiSynths);
	for(let i=0; i<keys1.length; i+=1){
		let synthKey = keys1[i];
		let synth    = core.AUDIO.midiSynths[synthKey];
		let status   = synth.getPlayStatus();
		if( !status.play && synth.playTick){
			if(synth.playTick){ core.FUNCS.audio.resume_midi(synth); }
		}
	}

	// MP3
	let keys2 = Object.keys(core.AUDIO.elems);
	for(let i=0; i<keys2.length; i+=1){
		let elem = core.AUDIO.elems[ keys2[i] ];
		// core.AUDIO.elems.tick.readyState
		// core.AUDIO.elems.tick.duration
		// core.AUDIO.elems.tick.currentTime
		// core.AUDIO.elems.tick.paused
	}
};

// *** SHORTHAND METHODS ***

/**
 * @summary Shortened way to access core.FUNCS.audio.
 * @global
*/
let _CFA   =core.FUNCS.audio;

// ==================================
// ==== FILE END: soundMode_A.js ====
// ==================================
