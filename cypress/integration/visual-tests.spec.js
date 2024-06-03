/// <reference types="Cypress" />

context("visual tests", () => {

	// These tests are not really cross-platform or even cross-computer,
	// since they depend on pixel-exact text and SVG rendering, as well as browser-specific built-in styles and layout.
	// Unfortunately, increasing the threshold to a point where the tests pass on all systems would introduce RIDICULOUS false negatives,
	// like changing the entire icon set wasn't even detected as a change, in Eye Gaze Mode, where the icons are HUGE!
	// And again unfortunately, decreasing the threshold to the point where it detects most changes that matter,
	// it produces RIDICULOUS false positives, like the window title bar gradient and all text being said to be different,
	// even on the same machine! In short, the image comparison is unusable.
	// I suspect it treats a difference between 254 and 255 (white and white) the same as a difference between 0 and 255 (black and white),
	// and if it just summed the differences instead of counting the number of pixels that differ, it would be much more useful,
	// although still not cross-device due to font rendering differences etc.
	// For now, I've removed the thresholds so it will always detect changes;
	// that way I can at least use it to view the diffs, occasionally, if not automatically check for changes.
	const withTextCompareOptions = {
		// failureThreshold: 0.05, // masks HUGE differences
		// failureThresholdType: "percent" // not actually percent - fraction
		failureThreshold: 0,
		failureThresholdType: "pixel",
	};
	const withMuchTextCompareOptions = {
		// failureThreshold: 0.08, // masks HUGE differences
		// failureThresholdType: "percent" // not actually percent - fraction
		failureThreshold: 0,
		failureThresholdType: "pixel",
	};
	const toolboxCompareOptions = {
		// failureThreshold: 40,
		// failureThresholdType: "pixel"
		failureThreshold: 0,
		failureThresholdType: "pixel",
	};

	const escapeRegExp = (string) =>
		string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string

	// Menus need pointer events currently.
	// These "click*" functions are used to interact with menus, and don't trigger click events.
	const clickElementWithExactText = (selector, text) => {
		cy.contains(selector, new RegExp(`^${escapeRegExp(text)}$`))
			// .click();
			.trigger("pointerdown", { which: 1 })
			.trigger("pointerup", { force: true });
	};
	const closeMenus = () => {
		cy.get(".status-text").click({ force: true }); // force because a menu may be covering the status bar / part of it
	};
	const clickMenuButton = (label) => {
		clickElementWithExactText(".menu-button", label);
	};
	const clickMenuItem = (label) => {
		clickElementWithExactText(".menu-item-label", label);
	};
	const selectTheme = (themeName) => {
		clickMenuButton("Extras");
		clickMenuItem("Themes");
		clickMenuItem(themeName);
		closeMenus();
		cy.wait(1000); // give a bit of time for theme to load
	};
	// `intercept` requires Cypress 6+
	// cypress-image-snapshot@4.0.1 has a peer dependency on cypress@"^4.5.0",
	// although I believe it works with v9, and only really has problems on v10.
	// That said, this didn't work! So. No point in upgrading just yet.
	// I'll upgrade when I'm ready to replace the visual testing framework.
	// const waitForRequest = (urlPattern, callback) => {
	// 	// intercept without changing or stubbing response
	// 	cy.intercept(urlPattern).as("urlPattern");
	// 	cy.wait("@urlPattern").then(callback);
	// };
	const waitForImage = (selector) => {
		// should automatically retries
		// checking visibility first ensures we're testing at least one image, theoretically
		cy.get(selector).should("be.visible");
		cy.get(selector).should(($imgs) => {
			for (const img of $imgs) {
				expect(img.naturalWidth).to.be.greaterThan(0);
				expect(img.naturalHeight).to.be.greaterThan(0);
			}
		});
	};

	before(() => {
		// Hides the news indicator, which shouldn't affect the visual tests.
		// If by the year 3000 AI doesn't automatically find and fix stupid code like this, humanity will have already been doomed.
		cy.clock(32503698000000);

		cy.visit("/");
		cy.setResolution([760, 490]);
		cy.window().should("have.property", "api_for_cypress_tests"); // wait for app to be loaded

		// Needed, given `cy.clock` is used, for `requestAnimationFrame` in `update_$swatch`,
		// so the color palette is rendered correctly.
		cy.tick(100);
	});

	it("main screenshot", () => {
		cy.matchImageSnapshot(withTextCompareOptions);
	});

	it("brush selected", () => {
		cy.get('.tool[title="Brush"]').click();
		cy.get(".tools-component").matchImageSnapshot(toolboxCompareOptions);
	});
	it("select selected", () => {
		cy.get('.tool[title="Select"]').click();
		cy.get(".tools-component").matchImageSnapshot(toolboxCompareOptions);
	});
	it("magnifier selected", () => {
		cy.get('.tool[title="Magnifier"]').click();
		cy.get(".tools-component").matchImageSnapshot(toolboxCompareOptions);
	});
	it("airbrush selected", () => {
		cy.get('.tool[title="Airbrush"]').click();
		cy.get(".tools-component").matchImageSnapshot(toolboxCompareOptions);
	});
	it("eraser selected", () => {
		cy.get('.tool[title="Eraser/Color Eraser"]').click();
		cy.get(".tools-component").matchImageSnapshot(toolboxCompareOptions);
	});
	it("line selected", () => {
		cy.get('.tool[title="Line"]').click();
		cy.get(".tools-component").matchImageSnapshot(toolboxCompareOptions);
	});
	it("rectangle selected", () => {
		cy.get('.tool[title="Rectangle"]').click();
		cy.get(".tools-component").matchImageSnapshot(toolboxCompareOptions);
	});

	beforeEach(() => {
		if (Cypress.$(".window:visible")[0]) {
			cy.get(".window:visible .window-close-button").click();
			cy.get(".window").should("not.be.visible");
		}
	});

	it("image attributes window", () => {
		cy.get("body").type("{ctrl}e");
		cy.get(".window:visible").matchImageSnapshot(withMuchTextCompareOptions);
	});

	it("modern dark theme -- image attributes window", () => {
		selectTheme("Modern Dark");
		cy.get("body").type("{ctrl}e");
		cy.get(".window:visible").matchImageSnapshot(withMuchTextCompareOptions);
	});

	it("modern dark theme -- custom zoom window", () => {
		clickMenuButton("View");
		clickMenuItem("Zoom");
		clickMenuItem("Custom...");
		cy.get(".window:visible").matchImageSnapshot(withMuchTextCompareOptions);
	});

	it("bubblegum theme - custom zoom window", () => {
		// selectTheme("Bubblegum"); // not released yet
		cy.window().then((win) => {
			win.api_for_cypress_tests.set_theme("bubblegum.css");
		});
		clickMenuButton("View");
		clickMenuItem("Zoom");
		clickMenuItem("Custom...");
		cy.get(".window:visible").matchImageSnapshot(withMuchTextCompareOptions);
	});

	it("custom zoom window", () => {
		selectTheme("Classic Light");
		clickMenuButton("View");
		clickMenuItem("Zoom");
		clickMenuItem("Custom...");
		cy.get(".window:visible").matchImageSnapshot(withMuchTextCompareOptions);
	});

	it("flip and rotate window", () => {
		clickMenuButton("Image");
		clickMenuItem("Flip/Rotate");
		cy.get(".window:visible").matchImageSnapshot(withMuchTextCompareOptions);
	});

	it("stretch and skew window", () => {
		clickMenuButton("Image");
		clickMenuItem("Stretch/Skew");
		waitForImage(".window:visible img");
		cy.get(".window:visible").matchImageSnapshot(withTextCompareOptions);
	});

	it("help window", () => {
		clickMenuButton("Help");
		clickMenuItem("Help Topics");
		cy.get(".window:visible .folder", { timeout: 10000 }); // wait for sidebar contents to load
		// @TODO: wait for iframe to load
		cy.get(".window:visible").matchImageSnapshot(Object.assign({}, withTextCompareOptions, { blackout: ["iframe"] }));
	});

	it("about window", () => {
		clickMenuButton("Help");
		clickMenuItem("About Paint");
		waitForImage("#about-paint-icon");
		cy.get(".window:visible").matchImageSnapshot(Object.assign({}, withMuchTextCompareOptions, { blackout: ["#maybe-outdated-line", "#jspaint-version"] }));
	});

	it("eye gaze mode", () => {
		cy.get('.tool[title="Select"]').click();
		clickMenuButton("Extras");
		clickMenuItem("Eye Gaze Mode");
		cy.wait(100);
		// clickMenuButton("View");
		// cy.get("body").trigger("pointermove", { clientX: 200, clientY: 150 });
		closeMenus();
		cy.wait(100);
		cy.get(".eye-gaze-mode-undo-button").should("exist");
		cy.matchImageSnapshot(withTextCompareOptions);
	});

	it("bubblegum theme -- eye gaze mode", () => {
		cy.get(".eye-gaze-mode-undo-button").should("exist");
		// selectTheme("Bubblegum"); // not released yet
		cy.window().then((win) => {
			win.api_for_cypress_tests.set_theme("bubblegum.css");
		});
		// clickMenuButton("View");
		// cy.get("body").trigger("pointermove", { clientX: 200, clientY: 150 });
		cy.wait(100);
		cy.matchImageSnapshot(withTextCompareOptions);
	});

	it("modern light theme -- eye gaze mode", () => {
		cy.get(".eye-gaze-mode-undo-button").should("exist");
		selectTheme("Modern Light");
		// clickMenuButton("View");
		// cy.get("body").trigger("pointermove", { clientX: 200, clientY: 150 });
		cy.wait(100);
		cy.matchImageSnapshot(withTextCompareOptions);
	});

	it("exit eye gaze mode", () => {
		// this acts as teardown for the eye gaze mode tests
		clickMenuButton("Extras");
		clickMenuItem("Eye Gaze Mode");
		cy.get(".eye-gaze-mode-undo-button").should("not.exist");
	});

	it("modern light theme -- main screenshot", () => {
		cy.wait(100);
		// clickMenuButton("View");
		// cy.get("body").trigger("pointermove", { clientX: 200, clientY: 150 });
		closeMenus();
		cy.wait(100);
		cy.matchImageSnapshot(withTextCompareOptions);
	});

	const test_edit_colors_dialog = (expand = true) => {
		clickMenuButton("Colors");
		clickMenuItem("Edit Colors...");
		cy.wait(100);
		if (expand) {
			cy.contains("button", "Define Custom Colors >>").click();
		}
		cy.get(".window:visible").matchImageSnapshot(Object.assign({}, withTextCompareOptions));
	};
	it("modern light theme -- edit colors dialog (expanded)", () => {
		test_edit_colors_dialog(true);
	});

	it("bubblegum theme -- main screenshot", () => {
		// selectTheme("Bubblegum"); // not released yet
		cy.window().then((win) => {
			win.api_for_cypress_tests.set_theme("bubblegum.css");
		});
		// clickMenuButton("View");
		// cy.get("body").trigger("pointermove", { clientX: 200, clientY: 150 });
		cy.wait(100);
		cy.matchImageSnapshot(withTextCompareOptions);
	});

	it("bubblegum theme -- about window", () => {
		clickMenuButton("Help");
		clickMenuItem("About Paint");
		// waitForImage("#about-paint-icon"); // it's actually replaced with a background image in this theme
		// waitForRequest("/images/bubblegum/bubblegum-paint-128x128.png", () => { // not working
		// waitForRequest("**/bubblegum-paint-*.png", () => { // not working
		cy.wait(1000); // wait and hope it's loaded
		cy.get(".window:visible").matchImageSnapshot(Object.assign({}, withMuchTextCompareOptions, { blackout: ["#maybe-outdated-line", "#jspaint-version"] }));
		// });
	});

	it("winter theme -- main screenshot", () => {
		selectTheme("Winter");
		// clickMenuButton("View");
		// cy.get("body").trigger("pointermove", { clientX: 200, clientY: 150 });
		cy.wait(100);
		cy.matchImageSnapshot(withTextCompareOptions);
	});

	it("winter theme -- edit colors dialog (expanded)", () => {
		test_edit_colors_dialog(true);
	});

	it("winter theme -- vertical color box", () => {
		cy.wait(500);
		clickMenuButton("Extras");
		clickMenuItem("Vertical Color Box");
		cy.wait(500);
		closeMenus();
		cy.wait(100);
		cy.matchImageSnapshot(withTextCompareOptions);
	});

	it("vertical color box", () => {
		selectTheme("Classic Light");
		cy.matchImageSnapshot(withTextCompareOptions);
	});

	it("edit colors dialog", () => {
		test_edit_colors_dialog(false);
	});

	it("modern light theme -- vertical color box", () => {
		selectTheme("Modern Light");
		cy.matchImageSnapshot(withTextCompareOptions);
	});

	it("about window during pride month", () => {
		// TODO: DRY with other about window tests and the app loading in the `before` hook,
		// maybe enable test isolation even though it's slower to load the app every time

		// June 19, 3000
		cy.clock(32518299600000);

		cy.visit("/");
		cy.setResolution([760, 490]);
		cy.window().should("have.property", "api_for_cypress_tests"); // wait for app to be loaded

		// Needed, given `cy.clock` is used, for `requestAnimationFrame` in `update_$swatch`,
		// so the color palette is rendered correctly.
		// (Doesn't apply to this test.)
		cy.tick(100);

		clickMenuButton("Help");
		clickMenuItem("About Paint");
		waitForImage("#about-paint-icon");
		cy.get(".window:visible").matchImageSnapshot(Object.assign({}, withMuchTextCompareOptions, { blackout: ["#maybe-outdated-line", "#jspaint-version"] }));
	});

});
