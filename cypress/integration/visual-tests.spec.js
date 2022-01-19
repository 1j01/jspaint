/// <reference types="Cypress" />

context('visual tests', () => {

	const withTextCompareOptions = {
		failureThreshold: 0.05,
		failureThresholdType: 'percent' // not actually percent - fraction
	};
	const withMuchTextCompareOptions = {
		failureThreshold: 0.08,
		failureThresholdType: 'percent' // not actually percent - fraction
	};
	const toolboxCompareOptions = {
		failureThreshold: 40,
		failureThresholdType: 'pixel'
	};

	const closeMenus = () => {
		cy.get(".status-text").click({ force: true }); // force because a menu may be covering the status bar / part of it
	};
	const clickMenuButton = (label) => {
		// cy.contains(".menu-button", label).click();
		cy.contains(".menu-button", label)
			.trigger('pointerdown', { which: 1 })
			.trigger('pointerup', { force: true });
	};
	const clickMenuItem = (label) => {
		// cy.contains(".menu-item", label).click();
		cy.contains(".menu-item", label)
			.trigger('pointerdown', { which: 1 })
			.trigger('pointerup', { force: true });
	};
	const selectTheme = (themeName) => {
		clickMenuButton("Extras");
		clickMenuItem("Theme");
		clickMenuItem(themeName);
		closeMenus();
		cy.wait(1000); // give a bit of time for theme to load
	};

	it('main screenshot', () => {
		cy.visit('/');
		cy.setResolution([760, 490]);
		cy.window().should('have.property', 'get_tool_by_id'); // wait for app to be loaded
		cy.matchImageSnapshot(withTextCompareOptions);
	});

	it('brush selected', () => {
		cy.get('.tool[title="Brush"]').click();
		cy.get('.tools-component').matchImageSnapshot(toolboxCompareOptions);
	});
	it('select selected', () => {
		cy.get('.tool[title="Select"]').click();
		cy.get('.tools-component').matchImageSnapshot(toolboxCompareOptions);
	});
	it('magnifier selected', () => {
		cy.get('.tool[title="Magnifier"]').click();
		cy.get('.tools-component').matchImageSnapshot(toolboxCompareOptions);
	});
	it('airbrush selected', () => {
		cy.get('.tool[title="Airbrush"]').click();
		cy.get('.tools-component').matchImageSnapshot(toolboxCompareOptions);
	});
	it('eraser selected', () => {
		cy.get('.tool[title="Eraser/Color Eraser"]').click();
		cy.get('.tools-component').matchImageSnapshot(toolboxCompareOptions);
	});
	it('line selected', () => {
		cy.get('.tool[title="Line"]').click();
		cy.get('.tools-component').matchImageSnapshot(toolboxCompareOptions);
	});
	it('rectangle selected', () => {
		cy.get('.tool[title="Rectangle"]').click();
		cy.get('.tools-component').matchImageSnapshot(toolboxCompareOptions);
	});

	beforeEach(() => {
		if (Cypress.$('.window:visible')[0]) {
			cy.get('.window:visible .window-close-button').click();
			cy.get('.window').should('not.be.visible');
		}
	});

	it('image attributes window', () => {
		cy.get('body').type('{ctrl}e');
		cy.get('.window:visible').matchImageSnapshot(withMuchTextCompareOptions);
	});

	it('flip and rotate window', () => {
		// @TODO: make menus more testable, with IDs
		cy.get('.menu-button[id^="menu-button-&Image"]').click();
		cy.get('.menu-popup[aria-labelledby^="menu-button-&Image"] tr:nth-child(1)').click();
		cy.get('.window:visible').matchImageSnapshot(withMuchTextCompareOptions);
	});

	it('stretch and skew window', () => {
		// @TODO: make menus more testable, with IDs
		cy.get('.menu-button[id^="menu-button-&Image"]').click();
		cy.get('.menu-popup[aria-labelledby^="menu-button-&Image"] tr:nth-child(2)').click();
		// @TODO: wait for images to load and include images?
		cy.get('.window:visible').matchImageSnapshot(Object.assign({}, withTextCompareOptions, { blackout: ["img"] }));
	});

	it('help window', () => {
		// @TODO: make menus more testable, with IDs
		cy.get('.menu-button[id^="menu-button-&Help"]').click();
		cy.get('.menu-popup[aria-labelledby^="menu-button-&Help"] tr:nth-child(1)').click();
		cy.get('.window:visible .folder', { timeout: 10000 }); // wait for sidebar contents to load
		// @TODO: wait for iframe to load
		cy.get('.window:visible').matchImageSnapshot(Object.assign({}, withTextCompareOptions, { blackout: ["iframe"] }));
	});

	it('about window', () => {
		// @TODO: make menus more testable, with IDs
		cy.get('.menu-button[id^="menu-button-&Help"]').click();
		cy.get('.menu-popup[aria-labelledby^="menu-button-&Help"] tr:nth-child(3)').click();
		cy.get('.window:visible').matchImageSnapshot(Object.assign({}, withMuchTextCompareOptions, { blackout: ["img", "#maybe-outdated-line"] }));
	});

	it('eye gaze mode', () => {
		cy.get('.tool[title="Select"]').click();
		clickMenuButton("Extras");
		clickMenuItem("Eye Gaze Mode");
		cy.wait(100);
		// clickMenuButton("View");
		// cy.get("body").trigger("pointermove", { clientX: 200, clientY: 150 });
		closeMenus();
		cy.wait(100);
		cy.get(".eye-gaze-mode-undo-button").should('exist');
		cy.matchImageSnapshot(withTextCompareOptions);
	});

	it('modern theme eye gaze mode', () => {
		cy.get(".eye-gaze-mode-undo-button").should('exist');
		selectTheme("Modern");
		// clickMenuButton("View");
		// cy.get("body").trigger("pointermove", { clientX: 200, clientY: 150 });
		cy.wait(100);
		cy.matchImageSnapshot(withTextCompareOptions);
	});

	it('exit eye gaze mode', () => {
		// this acts as teardown for the eye gaze mode tests
		clickMenuButton("Extras");
		clickMenuItem("Eye Gaze Mode");
		cy.get(".eye-gaze-mode-undo-button").should('not.exist');
	});

	it('modern theme', () => {
		cy.wait(100);
		// clickMenuButton("View");
		// cy.get("body").trigger("pointermove", { clientX: 200, clientY: 150 });
		closeMenus();
		cy.wait(100);
		cy.matchImageSnapshot(withTextCompareOptions);
	});

	const test_edit_colors_dialog = (expand = true) => {
		clickMenuButton("Colors");
		clickMenuItem("Edit Colors");
		cy.wait(100);
		if (expand) {
			cy.contains("button", "Define Custom Colors >>").click();
		}
		cy.get('.window:visible').matchImageSnapshot(Object.assign({}, withTextCompareOptions));
	};
	it('modern theme edit colors dialog (expanded)', test_edit_colors_dialog);

	it('winter theme', () => {
		selectTheme("Winter");
		// clickMenuButton("View");
		// cy.get("body").trigger("pointermove", { clientX: 200, clientY: 150 });
		cy.wait(100);
		cy.matchImageSnapshot(withTextCompareOptions);
	});

	it('winter theme edit colors dialog (expanded)', test_edit_colors_dialog);

	it('winter theme vertical color box', () => {
		cy.wait(500);
		clickMenuButton("Extras");
		clickMenuItem("Vertical Color Box");
		cy.wait(500);
		closeMenus();
		cy.wait(100);
		cy.matchImageSnapshot(withTextCompareOptions);
	});

	it('classic theme vertical color box', () => {
		selectTheme("Classic");
		cy.matchImageSnapshot(withTextCompareOptions);
	});

	it('classic theme edit colors dialog', () => {
		test_edit_colors_dialog(false);
	});

	it('modern theme vertical color box', () => {
		selectTheme("Modern");
		cy.matchImageSnapshot(withTextCompareOptions);
	});

});
