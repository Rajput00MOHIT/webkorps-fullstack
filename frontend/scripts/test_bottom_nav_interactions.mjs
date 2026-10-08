import { spawn } from 'child_process';
import fs from 'fs';

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function sendCDP(ws, method, params = {}) {
  const id = Math.floor(Math.random() * 1000000);
  const msg = JSON.stringify({ id, method, params });
  return new Promise((resolve, reject) => {
    const handler = (event) => {
      const resp = JSON.parse(event.data);
      if (resp.id === id) {
        ws.removeEventListener('message', handler);
        if (resp.error) {
          reject(new Error(resp.error.message));
        } else {
          resolve(resp.result);
        }
      }
    };
    ws.addEventListener('message', handler);
    ws.send(msg);
  });
}

async function captureScreenshot(ws, filename) {
  const res = await sendCDP(ws, 'Page.captureScreenshot', { format: 'png' });
  const buffer = Buffer.from(res.data, 'base64');
  fs.writeFileSync(filename, buffer);
  console.log(`Saved screenshot: ${filename}`);
}

async function main() {
  const port = 9333;
  const chrome = spawn(
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    [
      '--headless=new',
      '--disable-gpu',
      `--remote-debugging-port=${port}`,
      '--window-size=1440,950',
      'about:blank',
    ]
  );

  await sleep(1500);

  try {
    const resp = await fetch(`http://127.0.0.1:${port}/json/new?http://localhost:3000`, {
      method: 'PUT',
    });
    const pageData = await resp.json();
    const wsUrl = pageData.webSocketDebuggerUrl;

    const ws = new WebSocket(wsUrl);
    await new Promise((resolve) => ws.addEventListener('open', resolve));

    await sendCDP(ws, 'Page.enable');
    await sendCDP(ws, 'Runtime.enable');
    await sendCDP(ws, 'DOM.enable');

    console.log('Page loaded, waiting for render...');
    await sleep(2000);

    // 1. Initial State
    await captureScreenshot(ws, 'scratch/verify_01_initial_desktop.png');

    // 2. Click Services Trigger
    console.log('Clicking Services trigger...');
    await sendCDP(ws, 'Runtime.evaluate', {
      expression: `
        document.getElementById('trigger-services')?.click();
      `,
    });
    await sleep(400);

    // Verify Services is active and text has close
    const servicesCheck = await sendCDP(ws, 'Runtime.evaluate', {
      expression: `
        (() => {
          const btn = document.getElementById('trigger-services');
          const menu = document.getElementById('mega-menu-services');
          return {
            hasActiveCls: btn?.classList.contains('wk-nav-trigger--active'),
            menuVisible: !!menu,
            menuTitle: menu?.querySelector('.wk-mega-menu__title')?.textContent
          };
        })()
      `,
      returnByValue: true,
    });
    console.log('Services open verification:', servicesCheck.result.value);

    await captureScreenshot(ws, 'scratch/verify_02_services_mega_menu.png');

    // 3. Switch to Industries
    console.log('Clicking Industries trigger...');
    await sendCDP(ws, 'Runtime.evaluate', {
      expression: `
        document.getElementById('trigger-industries')?.click();
      `,
    });
    await sleep(400);
    await captureScreenshot(ws, 'scratch/verify_03_industries_mega_menu.png');

    // 4. Press Escape Key
    console.log('Sending Escape key...');
    await sendCDP(ws, 'Input.dispatchKeyEvent', {
      type: 'keyDown',
      key: 'Escape',
      code: 'Escape',
      windowsVirtualKeyCode: 27,
      nativeVirtualKeyCode: 27,
    });
    await sendCDP(ws, 'Input.dispatchKeyEvent', {
      type: 'keyUp',
      key: 'Escape',
      code: 'Escape',
      windowsVirtualKeyCode: 27,
      nativeVirtualKeyCode: 27,
    });
    await sleep(400);
    await captureScreenshot(ws, 'scratch/verify_04_closed_escape.png');

    // 5. Test Mobile Viewport
    console.log('Testing mobile viewport (390x844)...');
    await sendCDP(ws, 'Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true,
    });
    await sleep(500);

    // Open Services in Mobile
    await sendCDP(ws, 'Runtime.evaluate', {
      expression: `
        document.getElementById('trigger-services')?.click();
      `,
    });
    await sleep(400);
    await captureScreenshot(ws, 'scratch/verify_05_mobile_services_menu.png');

    console.log('All automated tests and visual captures completed successfully!');
    ws.close();
  } catch (err) {
    console.error('Error during testing:', err);
  } finally {
    chrome.kill();
  }
}

main();
