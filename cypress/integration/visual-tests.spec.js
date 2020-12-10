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

	const selectTheme = (themeName) => {
		cy.contains(".menu-button", "Extras").click();
		cy.contains(".menu-item", "Theme").click();
		cy.contains(".menu-item", themeName).click();
		cy.get(".status-text").click(); // close menu (@TODO: menus should probably always be closed when you select a menu item)
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

	beforeEach(()=> {
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
		cy.get('.menus > .menu-container:nth-child(4) > .menu-button > .menu-hotkey').click();
		cy.get('.menus > .menu-container:nth-child(4) > .menu-popup > table > tr:nth-child(1)').click();
		cy.get('.window:visible').matchImageSnapshot(withMuchTextCompareOptions);
	});

	it('stretch and skew window', () => {
		// @TODO: make menus more testable, with IDs
		cy.get('.menus > .menu-container:nth-child(4) > .menu-button > .menu-hotkey').click();
		cy.get('.menus > .menu-container:nth-child(4) > .menu-popup > table > tr:nth-child(2)').click();
		// @TODO: wait for images to load and include images?
		cy.get('.window:visible').matchImageSnapshot(Object.assign({}, withTextCompareOptions, { blackout: ["img"] }));
	});

	it('help window', () => {
		// @TODO: make menus more testable, with IDs
		cy.get('.menus > .menu-container:nth-child(6) > .menu-button > .menu-hotkey').click();
		cy.get('.menus > .menu-container:nth-child(6) > .menu-popup > table > tr:nth-child(1)').click();
		cy.get('.window:visible .folder', {timeout: 10000}); // wait for sidebar contents to load
		// @TODO: wait for iframe to load
		cy.get('.window:visible').matchImageSnapshot(Object.assign({}, withTextCompareOptions, { blackout: ["iframe"] }));
	});

	it('about window', () => {
		// @TODO: make menus more testable, with IDs
		cy.get('.menus > .menu-container:nth-child(6) > .menu-button > .menu-hotkey').click();
		cy.get('.menus > .menu-container:nth-child(6) > .menu-popup > table > tr:nth-child(3)').click();
		cy.get('.window:visible').matchImageSnapshot(Object.assign({}, withMuchTextCompareOptions, { blackout: ["img", "#maybe-outdated-line"] }));
	});

	it('eye gaze mode', () => {
		cy.get('.tool[title="Select"]').click();
		cy.contains(".menu-button", "Extras").click();
		cy.contains(".menu-item", "Eye Gaze Mode").click();
		cy.wait(100);
		// cy.contains(".menu-button", "View").click();
		// cy.get("body").trigger("pointermove", { clientX: 200, clientY: 150 });
		cy.get(".status-text").click();
		cy.wait(100);
		cy.matchImageSnapshot(withTextCompareOptions);
	});

	it('modern theme eye gaze mode', () => {
		selectTheme("Modern");
		// cy.contains(".menu-button", "View").click();
		// cy.get("body").trigger("pointermove", { clientX: 200, clientY: 150 });
		cy.wait(100);
		cy.matchImageSnapshot(withTextCompareOptions);
	});

	it('modern theme', () => {
		cy.contains(".menu-button", "Extras").click();
		cy.contains(".menu-item", "Eye Gaze Mode").click();
		cy.wait(100);
		// cy.contains(".menu-button", "View").click();
		// cy.get("body").trigger("pointermove", { clientX: 200, clientY: 150 });
		cy.get(".status-text").click();
		cy.wait(100);
		cy.matchImageSnapshot(withTextCompareOptions);
	});

	const test_edit_colors_dialog = (expand=true) => {
		cy.contains(".menu-button", "Colors").click();
		cy.contains(".menu-item", "Edit Colors").click();
		cy.wait(100);
		if (expand) {
			cy.contains("button", "Define Custom Colors >>").click();
		}
		cy.get('.window:visible').matchImageSnapshot(Object.assign({}, withTextCompareOptions));
	};
	it('modern theme edit colors dialog (expanded)', test_edit_colors_dialog);

	it('winter theme', () => {
		selectTheme("Winter");
		// cy.contains(".menu-button", "View").click();
		// cy.get("body").trigger("pointermove", { clientX: 200, clientY: 150 });
		cy.wait(100);
		cy.matchImageSnapshot(withTextCompareOptions);
	});

	it('winter theme edit colors dialog (expanded)', test_edit_colors_dialog);

	it('winter theme vertical color box', () => {
		cy.wait(500);
		cy.contains(".menu-button", "Extras").click();
		cy.contains(".menu-item", "Vertical Color Box").click();
		cy.wait(500);
		cy.get(".status-text").click();
		cy.wait(100);
		cy.matchImageSnapshot(withTextCompareOptions);
	});

	it('classic theme vertical color box', () => {
		selectTheme("Classic");
		cy.matchImageSnapshot(withTextCompareOptions);
	});

	it('classic theme edit colors dialog', ()=> {
		test_edit_colors_dialog(false);
	});

	it('modern theme vertical color box', () => {
		selectTheme("Modern");
		cy.matchImageSnapshot(withTextCompareOptions);
	});

});
