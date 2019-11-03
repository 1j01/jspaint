// This function is called when a project is opened or re-opened (e.g. due to
// the project's config changing)

const {
	addMatchImageSnapshotPlugin,
} = require("cypress-image-snapshot/plugin");
module.exports = (on, config) => {
	// `on` is used to hook into various events Cypress emits
	// `config` is the resolved Cypress config
	addMatchImageSnapshotPlugin(on, config);
};
