/** TapTap 的展示 Promise 只确认打开，奖励必须等关闭回调的完整观看标记。 */
export function createRewardedAd(adUnitId, getPlatform = () => globalThis.tap, timeoutMs = 120_000) {
  let busy = false;
  let quarantined = false;

  function available() {
    return Boolean(adUnitId && !busy && !quarantined
      && typeof getPlatform()?.createRewardedVideoAd === 'function');
  }

  async function watch(signal) {
    if (!available() || signal?.aborted) return 'unavailable';
    busy = true;
    return new Promise(resolve => {
      let ad;
      let settled = false;
      let requestedShow = false;
      const timer = setTimeout(() => finish('timeout'), timeoutMs);

      function finish(result) {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        signal?.removeEventListener('abort', cancelled);
        // 宿主可能复用单例。状态不明时本页暂停再次请求，避免旧视频回调串到下一次奖励。
        if (result === 'timeout' || result === 'aborted') quarantined = true;
        try { ad?.offClose(closed); } catch { /* 迟到回调仍受 settled 拦截。 */ }
        try { ad?.offError(failed); } catch { /* 同上。 */ }
        try { ad?.destroy(); } catch { quarantined = true; }
        busy = false;
        resolve(result);
      }

      function closed(result) {
        if (requestedShow) finish(result?.isEnded === true ? 'completed' : 'skipped');
      }
      function failed() { finish('unavailable'); }
      function cancelled() { finish('aborted'); }

      async function show() {
        if (settled) return;
        requestedShow = true;
        try {
          await ad.show();
        } catch {
          if (settled) return;
          requestedShow = false;
          // 素材尚未就绪时最多补载一次。
          await ad.load();
          if (settled) return;
          requestedShow = true;
          await ad.show();
        }
      }

      try {
        signal?.addEventListener('abort', cancelled, { once: true });
        ad = getPlatform().createRewardedVideoAd({ adUnitId });
        ad.onClose(closed);
        ad.onError(failed);
        show().catch(failed);
      } catch {
        failed();
      }
    });
  }

  return { available, watch };
}
