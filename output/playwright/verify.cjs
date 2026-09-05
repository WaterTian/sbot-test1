async page => {
  await page.reload();
  await page.waitForFunction(() => document.documentElement.dataset.viewerState === 'ready');
  await page.getByRole('button', {name:'暂停自转',exact:true}).click();
  for (const name of ['正面','侧面','透视']) {
    const button = page.getByRole('button',{name,exact:true});
    await button.click();
    if (await button.getAttribute('aria-pressed') !== 'true') throw new Error(name + ' state');
    await page.waitForTimeout(500);
  }
  for (const part of ['solar','frame','equipment']) {
    const button = page.locator('[data-part="'+part+'"]');
    await button.click();
    if (await button.getAttribute('aria-pressed') !== 'true') throw new Error('part selection');
    await button.click();
    if (await button.getAttribute('aria-pressed') !== 'false') throw new Error('part clear');
  }
  await page.getByRole('button',{name:'放大模型'}).click();
  await page.getByRole('button',{name:'缩小模型'}).click();
  await page.locator('#exposure').fill('120');
  if (await page.locator('#exposureValue').textContent() !== '120%') throw new Error('exposure');
  await page.locator('#exposure').fill('100');
  await page.getByRole('checkbox',{name:'辅助网格'}).uncheck();
  if (await page.locator('#stageGrid').isVisible()) throw new Error('grid hidden');
  await page.getByRole('checkbox',{name:'辅助网格'}).check();
  await page.getByRole('button',{name:'全屏',exact:true}).click();
  await page.waitForFunction(() => !!document.fullscreenElement);
  await page.getByRole('button',{name:'退出全屏',exact:true}).click();
  await page.waitForFunction(() => !document.fullscreenElement);
  await page.locator('#canvas').focus();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Home');
  for (const width of [320,390,768,1440]) {
    await page.setViewportSize({width,height:1000});
    await page.waitForTimeout(500);
    if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw new Error('overflow '+width);
  }
  await page.getByRole('button',{name:'透视',exact:true}).click();
  await page.waitForTimeout(600);
  await page.screenshot({path:'output/playwright/viewer-desktop.png',fullPage:true});
  await page.setViewportSize({width:390,height:844});
  await page.waitForTimeout(600);
  await page.screenshot({path:'output/playwright/viewer-mobile.png',fullPage:true});
  await page.route('**/app.js*', route => route.abort());
  await page.reload();
  await page.waitForFunction(() => document.documentElement.dataset.viewerState === 'error');
  if (!(await page.getByRole('button',{name:'重新加载'}).isVisible())) throw new Error('retry missing');
  await page.screenshot({path:'output/playwright/viewer-error.png',fullPage:true});
  await page.unroute('**/app.js*');
  await page.getByRole('button',{name:'重新加载'}).click();
  await page.waitForFunction(() => document.documentElement.dataset.viewerState === 'ready');
  await page.route('**/app.js*', async route => { await page.waitForTimeout(2000); await route.continue(); });
  await page.reload({waitUntil:'domcontentloaded'});
  if (await page.evaluate(() => document.documentElement.dataset.viewerState) !== 'loading') throw new Error('loading state');
  if (!(await page.getByRole('button',{name:'正面',exact:true}).isDisabled())) throw new Error('loading controls');
  await page.screenshot({path:'output/playwright/viewer-loading.png',fullPage:true});
  await page.waitForFunction(() => document.documentElement.dataset.viewerState === 'ready');
  await page.unroute('**/app.js*');
  await page.evaluate(() => document.querySelector('canvas').dispatchEvent(new Event('webglcontextlost',{cancelable:true})));
  if (!(await page.getByRole('button',{name:'重新加载'}).isVisible())) throw new Error('context loss');
  await page.reload();
  await page.waitForFunction(() => document.documentElement.dataset.viewerState === 'ready');
}
