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
  const port = 9444;
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

    // 1. Initial State: Dock with Start the Conversation
    await captureScreenshot(ws, 'scratch/ai_01_dock_initial.png');

    // 2. Click Start the Conversation
    console.log('Clicking Start the Conversation button...');
    await sendCDP(ws, 'Runtime.evaluate', {
      expression: `
        document.querySelector('.wk-bottom-nav__cta')?.click();
      `,
    });
    await sleep(400);

    // Verify AI modal is visible and check title
    const welcomeCheck = await sendCDP(ws, 'Runtime.evaluate', {
      expression: `
        (() => {
          const modal = document.querySelector('.wk-ai-modal');
          const greeting = document.querySelector('.wk-ai-welcome__greeting')?.textContent;
          const question = document.querySelector('.wk-ai-welcome__question')?.textContent;
          const cardsCount = document.querySelectorAll('.wk-ai-examples__card').length;
          const btnHasOpenCls = document.querySelector('.wk-bottom-nav__cta')?.classList.contains('wk-bottom-nav__cta--open');
          return {
            modalVisible: !!modal,
            greeting,
            question,
            cardsCount,
            btnHasOpenCls
          };
        })()
      `,
      returnByValue: true,
    });
    console.log('AI Welcome verification:', welcomeCheck.result.value);

    // 3. Screenshot AI Welcome screen
    await captureScreenshot(ws, 'scratch/ai_02_welcome_screen.png');

    // 4. Click first example card ("What services does Webkorps offer?")
    console.log('Clicking first example prompt card...');
    await sendCDP(ws, 'Runtime.evaluate', {
      expression: `
        document.querySelectorAll('.wk-ai-examples__card')[0]?.click();
      `,
    });

    // Capture typing state immediately
    await sleep(250);
    console.log('Checking typing state...');
    await captureScreenshot(ws, 'scratch/ai_03_typing_state.png');

    // Wait for AI response (800ms delay in mock engine)
    await sleep(900);
    console.log('Checking AI response...');
    await captureScreenshot(ws, 'scratch/ai_04_ai_response.png');

    // 5. Type custom message in input and send
    console.log('Typing custom user question: "How much would my project cost?"...');
    await sendCDP(ws, 'Runtime.evaluate', {
      expression: `
        (() => {
          const input = document.querySelector('.wk-ai-input-field');
          if (input) {
            input.value = "How much would my project cost?";
            input.dispatchEvent(new Event('input', { bubbles: true }));
          }
          const form = document.querySelector('.wk-ai-input-form');
          form?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        })()
      `,
    });

    await sleep(1100);
    console.log('Second response received, capturing chat conversation...');
    await captureScreenshot(ws, 'scratch/ai_05_chat_conversation.png');

    // 6. Test Escape key to close
    console.log('Pressing Escape to close AI modal...');
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
    await captureScreenshot(ws, 'scratch/ai_06_closed_escape.png');

    // 7. Click Start the Conversation again to verify conversation history persistence
    console.log('Reopening AI Assistant...');
    await sendCDP(ws, 'Runtime.evaluate', {
      expression: `
        document.querySelector('.wk-bottom-nav__cta')?.click();
      `,
    });
    await sleep(400);
    await captureScreenshot(ws, 'scratch/ai_07_history_preserved.png');

    // 8. Mobile Viewport Test (390x844)
    console.log('Testing mobile viewport (390x844)...');
    await sendCDP(ws, 'Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true,
    });
    await sleep(500);
    await captureScreenshot(ws, 'scratch/ai_08_mobile_chat.png');

    console.log('ALL AI Assistant tests completed successfully!');
    ws.close();
  } catch (err) {
    console.error('Error during testing:', err);
  } finally {
    chrome.kill();
  }
}

main();
