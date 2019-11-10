/// <reference types="Cypress" />

context('visual tests', () => {
	it('main screenshot', () => {
		cy.visit('/');
		cy.setResolution([760, 490]);
		cy.matchImageSnapshot();
	});

	it('brush selected', () => {
		cy.get('.tool[title="Brush"]').click();
		cy.get('.Tools-component').matchImageSnapshot();
	});
	it('select selected', () => {
		cy.get('.tool[title="Select"]').click();
		cy.get('.Tools-component').matchImageSnapshot();
	});
	it('magnifier selected', () => {
		cy.get('.tool[title="Magnifier"]').click();
		cy.get('.Tools-component').matchImageSnapshot();
	});
	it('airbrush selected', () => {
		cy.get('.tool[title="Airbrush"]').click();
		cy.get('.Tools-component').matchImageSnapshot();
	});
	it('eraser selected', () => {
		cy.get('.tool[title="Eraser/Color Eraser"]').click();
		cy.get('.Tools-component').matchImageSnapshot();
	});
	it('line selected', () => {
		cy.get('.tool[title="Line"]').click();
		cy.get('.Tools-component').matchImageSnapshot();
	});
	it('rectangle selected', () => {
		cy.get('.tool[title="Rectangle"]').click();
		cy.get('.Tools-component').matchImageSnapshot();
	});

	beforeEach(()=> {
		if (Cypress.$('.window:visible')[0]) {
			cy.get('.window:visible .window-close-button').click();
			cy.get('.window').should('not.be.visible');
		}
	});

	it('image attributes window', () => {
		cy.get('body').type('{ctrl}e');
		cy.get('.window:visible').matchImageSnapshot();
	});

	it('flip and rotate window', () => {
		// TODO: make menus more testable, with IDs
		cy.get('.menus > .menu-container:nth-child(4) > .menu-button > .menu-hotkey').click();
		cy.get('.menus > .menu-container:nth-child(4) > .menu-popup > table > tr:nth-child(1)').click();
		cy.get('.window:visible').matchImageSnapshot();
	});

	it('stretch and skew window', () => {
		// TODO: make menus more testable, with IDs
		cy.get('.menus > .menu-container:nth-child(4) > .menu-button > .menu-hotkey').click();
		cy.get('.menus > .menu-container:nth-child(4) > .menu-popup > table > tr:nth-child(2)').click();
		// TODO: wait for images to load and include images?
		cy.get('.window:visible').matchImageSnapshot({ blackout: ["img"] });
	});

	it('help window', () => {
		// TODO: make menus more testable, with IDs
		cy.get('.menus > .menu-container:nth-child(6) > .menu-button > .menu-hotkey').click();
		cy.get('.menus > .menu-container:nth-child(6) > .menu-popup > table > tr:nth-child(1)').click();
		cy.get('.window:visible .folder', {timeout: 10000}); // wait for sidebar contents to load
		// TODO: wait for iframe to load
		cy.get('.window:visible').matchImageSnapshot({ blackout: ["iframe"] });
	});

	it('about window', () => {
		// TODO: make menus more testable, with IDs
		cy.get('.menus > .menu-container:nth-child(6) > .menu-button > .menu-hotkey').click();
		cy.get('.menus > .menu-container:nth-child(6) > .menu-popup > table > tr:nth-child(3)').click();
		cy.get('.window:visible').matchImageSnapshot({ blackout: ["img"] });
	});
});
