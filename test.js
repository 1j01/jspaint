
var fs = require('fs');
var phantomcss = require('phantomcss');

casper.test.begin( 'jspaint visual tests', function ( test ) {

	phantomcss.init( {
		rebase: casper.cli.get( "rebase" ),
		// SlimerJS needs explicit knowledge of this Casper, and lots of absolute paths
		casper: casper,
		libraryRoot: fs.absolute( fs.workingDirectory + '/node_modules/phantomcss' ), //module._getFilename('phantomcss'), //require.resolve('phantomcss'),
		screenshotRoot: fs.absolute( fs.workingDirectory + '/screenshots' ),
		failedComparisonsRoot: fs.absolute( fs.workingDirectory + '/screenshots/failures' ),
		addLabelToFailedImage: false,
		/*
		fileNameGetter: function overide_file_naming(){},
		onPass: function passCallback(){},
		onFail: function failCallback(){},
		onTimeout: function timeoutCallback(){},
		onComplete: function completeCallback(){},
		hideElements: '#thing.selector',
		addLabelToFailedImage: true,
		outputSettings: {
			errorColor: {
				red: 255,
				green: 255,
				blue: 0
			},
			errorType: 'movement',
			transparency: 0.3
		}*/
	} );

	casper.on( 'remote.message', function ( msg ) {
		this.echo( "[page] " + msg );
	} );

	casper.on( 'error', function ( err ) {
		this.die( "PhantomJS has errored: " + err );
	} );

	casper.on( 'resource.error', function ( err ) {
		casper.log( 'Resource load error: ' + err, 'warning' );
	} );
	/*
		The test scenario
	*/

	casper.start( 'http://localhost:11822' );

	casper.viewport( 1024, 768 );
	
	casper.then( function () {
		phantomcss.screenshot( '.jspaint', 'app screen initial' );
		phantomcss.screenshot( '.jspaint-menus', 'menu bar initial' );
		phantomcss.screenshot( '.jspaint-Tools-component', 'toolbox initial' );
		phantomcss.screenshot( '.jspaint-Colors-component', 'color box initial' );
	} );
	
	casper.then( function () {
		// casper.sendKeys( 'body', 'e', { modifiers: 'ctrl' } )
		// casper.sendKeys( '.jspaint', 'e', { modifiers: 'ctrl' } )
		
		var after = function(ms, fn){ setTimeout(fn, ms); };
		
		// casper.clickLabel("Edit");
		// casper.click(".jspaint-edit-menu"); // if we merge newer changes, this could simplify the selector, but...
		
		casper.evaluate(function() {
			image_attributes();
		});
		// casper.waitUntilVisible( ".jspaint-menu-container:nth-child(4) .jspaint-menu-button", function () {
		// 	// after(50, function(){
		// 		casper.click( '.jspaint-menu-container:nth-child(4) .jspaint-menu-button' );
		// 		// casper.waitUntilVisible( ".jspaint-menu-popup", function () {
		// 		casper.waitUntilVisible( ".jspaint-menu-container:nth-child(4) .jspaint-menu-row:nth-child(4)", function () {
		// 			// after(50, function(){
		// 				casper.click( '.jspaint-menu-container:nth-child(4) .jspaint-menu-row:nth-child(4)' );
						
						var window_title = "Attributes";
						// var selector = {
						// 	type: "xpath",
						// 	path: "//div[contains(concat(' ', normalize-space(@class), ' '), ' jspaint-window ')][//span[contains(concat(' ', normalize-space(@class), ' '), ' jspaint-window-title ')][.='" + window_title + "']]"
						// };
						var selector = ".jspaint-window:not([style*='display: none'])";
						
						// casper.waitForSelector( '.jspaint-window:not([style*="display: none"])',
						// casper.waitUntilVisible( '.jspaint-window',
						casper.waitUntilVisible( selector,
							function success() {
								// phantomcss.screenshot( '.jspaint-window', 'attributes window' );
								// phantomcss.screenshot( '.jspaint-window:not([style*="display: none"])', 'attributes window' );
								phantomcss.screenshot( selector, 'attributes window' );
								
							}//,
							// function timeout() {
							// 	casper.test.fail( 'Window not found'- );
							// }
						);
		// 			// } );
		// 		} );
		// 	// } );
		// } );
	} );
	
	casper.then( function now_check_the_screenshots() {
		// compare screenshots
		phantomcss.compareAll();
	} );

	/*
	Casper runs tests
	*/
	casper.run( function () {
		console.log( '\nTHE END.' );
		// phantomcss.getExitStatus() // pass or fail?
		casper.test.done();
	} );
} );
