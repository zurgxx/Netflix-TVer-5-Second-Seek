(() => {
  const SEEK_SECONDS = 5;
  let netflixBridgeInjected = false;

  function isNetflix() {
    return window.location.hostname === "www.netflix.com";
  }

  function isEditableTarget(element) {
    if (!(element instanceof Element)) {
      return false;
    }

    if (element.closest("input, textarea, select, [contenteditable=''], [contenteditable='true']")) {
      return true;
    }

    return element.isContentEditable;
  }

  function isLikelyActiveVideo(video) {
    if (!(video instanceof HTMLVideoElement)) {
      return false;
    }

    const rect = video.getBoundingClientRect();
    const style = window.getComputedStyle(video);

    if (rect.width < 100 || rect.height < 100) {
      return false;
    }

    if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0) {
      return false;
    }

    return true;
  }

  function getVideoScore(video) {
    const rect = video.getBoundingClientRect();
    let score = rect.width * rect.height;

    if (!video.paused) {
      score += 1_000_000_000;
    }

    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      score += 10_000_000;
    }

    if (video.currentTime > 0) {
      score += 1_000_000;
    }

    return score;
  }

  function getActiveVideo() {
    const videos = Array.from(document.querySelectorAll("video"));
    if (videos.length === 0) {
      return null;
    }

    const candidates = videos.filter(isLikelyActiveVideo);
    const pool = candidates.length > 0 ? candidates : videos;

    pool.sort((a, b) => getVideoScore(b) - getVideoScore(a));
    return pool[0] || null;
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function seekWithVideoElement(seconds) {
    const video = getActiveVideo();
    if (!video) {
      return false;
    }

    const duration = Number.isFinite(video.duration) ? video.duration : Number.MAX_SAFE_INTEGER;
    const nextTime = clamp(video.currentTime + seconds, 0, duration);

    if (nextTime === video.currentTime) {
      return false;
    }

    video.currentTime = nextTime;
    return true;
  }

  function injectNetflixBridge() {
    if (!isNetflix() || netflixBridgeInjected) {
      return;
    }

    const script = document.createElement("script");
    script.src = chrome.runtime.getURL("netflix-page.js");
    script.dataset.source = "netflix-5s-seek";
    script.dataset.seekSeconds = String(SEEK_SECONDS);
    script.onload = () => {
      script.remove();
    };
    (document.head || document.documentElement).appendChild(script);
    netflixBridgeInjected = true;
  }

  function shouldIgnoreKeydown(event) {
    if (event.defaultPrevented) {
      return true;
    }

    if (event.isComposing || event.keyCode === 229) {
      return true;
    }

    if (event.ctrlKey || event.altKey || event.metaKey) {
      return true;
    }

    if (event.repeat) {
      return true;
    }

    return isEditableTarget(event.target) || isEditableTarget(document.activeElement);
  }

  function stopNativeSeek(event) {
    // サイト側の既定ショートカットによる二重シークを抑止する。
    event.preventDefault();
    event.stopImmediatePropagation();
    event.stopPropagation();
  }

  function handleKeydown(event) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
      return;
    }

    if (shouldIgnoreKeydown(event)) {
      return;
    }

    const delta = event.key === "ArrowLeft" ? -SEEK_SECONDS : SEEK_SECONDS;

    if (isNetflix()) {
      return;
    }

    const didSeek = seekWithVideoElement(delta);
    if (!didSeek) {
      return;
    }

    stopNativeSeek(event);
  }
  if (isNetflix()) {
    injectNetflixBridge();
  }

  window.addEventListener("keydown", handleKeydown, true);
})();
