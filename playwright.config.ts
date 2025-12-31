import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright configuration for MCPaint React testing
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
	testDir: "./tests",
	/* Run tests in files in parallel */
	fullyParallel: true,
	/* Fail the build on CI if you accidentally left test.only in the source code. */
	forbidOnly: !!process.env.CI,
	/* Retry on CI only */
	retries: process.env.CI ? 2 : 0,
	/* Opt out of parallel tests on CI. */
	workers: process.env.CI ? 1 : undefined,
	/* Reporter to use. See https://playwright.dev/docs/test-reporters */
	reporter: [["html", { open: "never" }], ["list"]],
	/* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
	use: {
		/* Base URL to use in actions like `await page.goto('/')`. */
		baseURL: "http://localhost:11822/new/",

		/* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
		trace: "on-first-retry",

		/* Capture screenshot on failure */
		screenshot: "only-on-failure",

		/* Video recording on failure */
		video: "retain-on-failure",
	},

	/* Configure projects for major browsers */
	projects: [
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] },
		},
	],

	/* Run your local dev server before starting the tests */
	webServer: {
		command: "npm run test:start-server",
		url: "http://localhost:11822/new/index.html",
		reuseExistingServer: true,
		timeout: 120 * 1000,
	},

	/* Test timeout */
	timeout: 30000,

	/* Expect timeout */
	expect: {
		timeout: 10000,
		/* Snapshot comparison options */
		toHaveScreenshot: {
			maxDiffPixels: 100,
		},
		toMatchSnapshot: {
			maxDiffPixelRatio: 0.01,
		},
	},

	/* Output folder for test artifacts */
	outputDir: "test-results/",

	/* Folder for test snapshots */
	snapshotDir: "tests/snapshots",
});
