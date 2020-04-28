import { addMatchImageSnapshotCommand } from 'cypress-image-snapshot/command';
addMatchImageSnapshotCommand({
	failureThreshold: 13,
	failureThresholdType: 'pixel',
	customDiffConfig: { threshold: 0.2 },
	capture: 'viewport',
});
Cypress.Commands.add("setResolution", (size) => {
	if (Cypress._.isArray(size)) {
		cy.viewport(size[0], size[1]);
	} else {
		cy.viewport(size);
	}
})
