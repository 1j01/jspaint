import { webkit } from 'playwright';

async function captureDialogs() {
  const browser = await webkit.launch({ headless: true });

  // Capture React Save As dialog
  const reactPage = await browser.newPage();
  await reactPage.goto('http://localhost:1999/new/');
  await reactPage.waitForSelector('.canvas-area');

  // Click File menu
  await reactPage.click('text="File"');
  await reactPage.waitForTimeout(200);

  // Click Save As
  await reactPage.click('text="Save As"');
  await reactPage.waitForTimeout(300);

  // Wait for dialog and capture it
  const reactDialog = await reactPage.locator('.save-as');
  if (await reactDialog.isVisible()) {
    await reactDialog.screenshot({ path: '/tmp/react-save-as.png' });
    console.log('React Save As dialog captured: /tmp/react-save-as.png');

    // Also capture the HTML structure
    const html = await reactDialog.innerHTML();
    console.log('\n--- React dialog HTML ---');
    console.log(html);
  } else {
    console.log('React Save As dialog not found');
    await reactPage.screenshot({ path: '/tmp/react-page.png' });
    console.log('Full page screenshot: /tmp/react-page.png');
  }

  await reactPage.close();

  // Capture jQuery Save As dialog
  const jqueryPage = await browser.newPage();
  await jqueryPage.goto('http://localhost:1999/old/');
  await jqueryPage.waitForSelector('.canvas-area');

  // Click File menu
  await jqueryPage.click('text="File"');
  await jqueryPage.waitForTimeout(200);

  // Click Save As
  await jqueryPage.click('text="Save As"');
  await jqueryPage.waitForTimeout(300);

  // Wait for dialog and capture it
  const jqueryDialog = await jqueryPage.locator('.save-as');
  if (await jqueryDialog.isVisible()) {
    await jqueryDialog.screenshot({ path: '/tmp/jquery-save-as.png' });
    console.log('\njQuery Save As dialog captured: /tmp/jquery-save-as.png');

    // Also capture the HTML structure
    const html = await jqueryDialog.innerHTML();
    console.log('\n--- jQuery dialog HTML ---');
    console.log(html);
  } else {
    console.log('jQuery Save As dialog not found');
    await jqueryPage.screenshot({ path: '/tmp/jquery-page.png' });
    console.log('Full page screenshot: /tmp/jquery-page.png');
  }

  await browser.close();
}

captureDialogs().catch(console.error);
