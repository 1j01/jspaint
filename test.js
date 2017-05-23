
var fs = require('fs');
var phantomcss = require('phantomcss');

casper.test.begin('jspaint visual tests', function(test){
	
	phantomcss.init({
		rebase: casper.cli.get('rebase'),
		// SlimerJS needs explicit knowledge of this Casper, and lots of absolute paths
		casper: casper,
		libraryRoot: fs.absolute(fs.workingDirectory + '/node_modules/phantomcss'), //module._getFilename('phantomcss'), //require.resolve('phantomcss'),
		screenshotRoot: fs.absolute(fs.workingDirectory + '/screenshots'),
		failedComparisonsRoot: fs.absolute(fs.workingDirectory + '/screenshots/failures'),
		addLabelToFailedImage: false,
		/*
		fileNameGetter: function overide_file_naming(){},
		onPass: function pass_callback(){},
		onFail: function fail_callback(){},
		onTimeout: function timeout_callback(){},
		onComplete: function complete_callback(){},
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
	});
	
	casper.on('remote.message', function(msg){
		this.echo("[page] " + msg);
	});
	
	casper.on('error', function(err){
		this.die("PhantomJS has errored: " + err);
	});
	
	casper.on('resource.error', function(err){
		casper.log('Resource load error: ' + err, 'warning');
	});
	/*
		The test scenario
	*/
	
	casper.start('http://localhost:11822');
	
	casper.viewport(1024, 768);
	
	casper.then(function(){
		phantomcss.screenshot('.jspaint', 'app screen initial');
		phantomcss.screenshot('.menus', 'menu bar initial');
		phantomcss.screenshot('.Tools-component', 'toolbox initial');
		phantomcss.screenshot('.Colors-component', 'color box initial');
	});
	
	var screenshot_and_close_window = function(screenshot_name){
		// var window_title = "Attributes";
		// var selector = {
		// 	type: "xpath",
		// 	path: "//div[contains(concat(' ', normalize-space(@class), ' '), ' window ')][//span[contains(concat(' ', normalize-space(@class), ' '), ' window-title ')][.='" + window_title + "']]"
		// };
		var selector = ".window:not([style*='display: none'])";
		
		casper.then(function(){
			casper.waitUntilVisible(selector,
				function success(){
					phantomcss.screenshot(selector, screenshot_name);
				}
			);
		});
		// casper.thenEvaluate(function(selector){
		// 	$(selector).find(".window-close-button").click();
		// }, selector);
		casper.then(function close_the_window(){
			casper.click(selector + " .window-close-button");
		});
	};
	
	casper.thenEvaluate(function(){
		image_attributes();
	});
	screenshot_and_close_window('attributes window');
	
	casper.thenEvaluate(function(){
		image_flip_and_rotate();
	});
	screenshot_and_close_window('flip and rotate window');
	
	casper.thenEvaluate(function(){
		image_stretch_and_skew();
	});
	screenshot_and_close_window('stretch and skew window');
	
	casper.thenEvaluate(function(){
		show_help();
	});
	screenshot_and_close_window('help window');
	
	casper.then(function now_check_the_screenshots(){
		phantomcss.compareAll();
	});
	
	casper.run(function(){
		console.log('\nTHE END.');
		// phantomcss.getExitStatus() // pass or fail?
		casper.test.done();
	});
});
