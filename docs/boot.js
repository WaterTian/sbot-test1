(() => {
  const overlay = document.querySelector('#loading');
  const title = overlay.querySelector('b');
  const detail = overlay.querySelector('small');
  const retry = document.querySelector('#retry');
  const buttons = [...document.querySelectorAll('.controls button, .controls input')];
  buttons.forEach(button => button.disabled = true);
  let timeout;
  window.viewerFailure = (message) => {
    clearTimeout(timeout);
    overlay.classList.remove('done');
    overlay.classList.add('failed');
    title.textContent = '三维展示暂时无法启动';
    detail.textContent = message;
    retry.hidden = false;
    overlay.querySelector('.spinner').hidden = true;
    buttons.forEach(button => button.disabled = true);
    document.documentElement.dataset.viewerState = 'error';
    document.querySelector('#viewerStatus').textContent = '展品暂不可用';
  };
  retry.addEventListener('click', () => location.reload());
  window.viewerReady = () => {
    clearTimeout(timeout);
    overlay.classList.add('done');
    buttons.forEach(button => button.disabled = false);
    document.documentElement.dataset.viewerState = 'ready';
    document.querySelector('#viewerStatus').textContent = '展品已就绪';
  };
  document.documentElement.dataset.viewerState = 'loading';
  timeout = setTimeout(() => window.viewerFailure('加载时间过长，请检查网络后重试。'), 20000);
  // Let the browser paint the loading state before loading and assembling the scene.
  requestAnimationFrame(() => requestAnimationFrame(() => {
    title.textContent = '正在装配模型';
    detail.textContent = '加载太阳能电池阵列与外露结构';
    import('./app.js').catch(error => {
      console.error(error);
      window.viewerFailure('请检查网络与浏览器三维加速支持，然后重试。');
    });
  }));
})();
