(function () {
  const currentScript = document.currentScript;
  const seekSeconds = Number(currentScript && currentScript.dataset.seekSeconds) || 5;

  function isEditableTarget(element) {
    if (!(element instanceof Element)) {
      return false;
    }

    if (element.closest("input, textarea, select, [contenteditable=''], [contenteditable='true']")) {
      return true;
    }

    return element.isContentEditable;
  }

  function getNetflixVideoPlayer() {
    try {
      const appContext = window.netflix && window.netflix.appContext;
      const playerApp = appContext && appContext.state && appContext.state.playerApp;
      const api = playerApp && typeof playerApp.getAPI === "function" ? playerApp.getAPI() : null;
      const videoPlayer = api && api.videoPlayer;
      const sessionIds = videoPlayer && typeof videoPlayer.getAllPlayerSessionIds === "function"
        ? videoPlayer.getAllPlayerSessionIds()
        : null;

      if (!sessionIds || sessionIds.length === 0) {
        return null;
      }

      return videoPlayer.getVideoPlayerBySessionId(sessionIds[0]);
    } catch (_error) {
      return null;
    }
  }

  function seek(seconds) {
    const player = getNetflixVideoPlayer();
    if (!player || typeof player.getCurrentTime !== "function" || typeof player.seek !== "function") {
      return false;
    }

    try {
      const currentTimeMs = Number(player.getCurrentTime());
      const durationMs = typeof player.getDuration === "function" ? Number(player.getDuration()) : Number.NaN;
      const maxTimeMs = Number.isFinite(durationMs) ? durationMs : Number.MAX_SAFE_INTEGER;
      const nextTimeMs = Math.min(Math.max(currentTimeMs + seconds * 1000, 0), maxTimeMs);

      if (nextTimeMs === currentTimeMs) {
        return false;
      }

      player.seek(nextTimeMs);
      return true;
    } catch (_error) {
      return false;
    }
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

  function handleKeydown(event) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
      return;
    }

    if (shouldIgnoreKeydown(event)) {
      return;
    }

    const delta = event.key === "ArrowLeft" ? -seekSeconds : seekSeconds;
    const didSeek = seek(delta);

    if (!didSeek) {
      return;
    }

    event.preventDefault();
    event.stopImmediatePropagation();
    event.stopPropagation();
  }

  window.addEventListener("keydown", handleKeydown, true);
})();
