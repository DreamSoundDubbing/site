(() => {
    'use strict';

    const frameSelector = '#playerContainer iframe[data-kinescope-player]';
    let expandedFrame = null;
    let orientationFrame = null;
    let lockRequest = 0;

    function unlockOrientation() {
        try {
            window.screen?.orientation?.unlock?.();
        } catch {
            // Некоторые браузеры не поддерживают управление ориентацией.
        }
    }

    function releaseOrientation() {
        if (!orientationFrame) return;
        orientationFrame = null;
        lockRequest++;
        unlockOrientation();
    }

    function useLandscape(frame) {
        if (orientationFrame === frame) return;
        orientationFrame = frame;
        const request = ++lockRequest;
        try {
            const orientation = window.screen?.orientation;
            if (typeof orientation?.lock !== 'function') return;
            Promise.resolve(orientation.lock('landscape')).then(() => {
                // Выход мог произойти раньше завершения асинхронной блокировки.
                if (request !== lockRequest && !orientationFrame) unlockOrientation();
            }).catch(() => {
                // Отказ браузера не должен мешать просмотру или выходу из плеера.
            });
        } catch {
            // На неподдерживаемых устройствах остаётся обычный поворот телефона.
        }
    }

    function closeExpandedPlayer() {
        expandedFrame?.classList.remove('kinescope-expanded');
        expandedFrame = null;
        document.documentElement.classList.remove('kinescope-expanded');
        document.body.classList.remove('kinescope-expanded');
        releaseOrientation();
    }

    // Документированное событие псевдополноэкранного режима Kinescope для iOS.
    // Принимаем его только от текущего плеера, проверяя и домен, и окно-источник.
    window.addEventListener('message', event => {
        if (event.origin !== 'https://kinescope.io' ||
            event.data?.type !== 'KINESCOPE_PLAYER_FULLSCREEN_CHANGE' ||
            typeof event.data.value !== 'boolean') return;
        const frame = document.querySelector(frameSelector);
        if (!frame || event.source !== frame.contentWindow) return;

        if (event.data.value) {
            expandedFrame = frame;
            frame.classList.add('kinescope-expanded');
            document.documentElement.classList.add('kinescope-expanded');
            document.body.classList.add('kinescope-expanded');
            useLandscape(frame);
        } else {
            closeExpandedPlayer();
        }
    });

    function onFullscreenChange() {
        if (expandedFrame) return;
        const frame = document.querySelector(frameSelector);
        const fullscreen = document.fullscreenElement || document.webkitFullscreenElement;
        if (frame && fullscreen && (fullscreen === frame || fullscreen.contains(frame))) {
            useLandscape(frame);
        } else {
            releaseOrientation();
        }
    }

    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('webkitfullscreenchange', onFullscreenChange);
    window.addEventListener('pagehide', closeExpandedPlayer);

    // Смена серии/перерисовка карточки не должна оставлять страницу заблокированной.
    new MutationObserver(() => {
        if ((expandedFrame && !expandedFrame.isConnected) ||
            (orientationFrame && !orientationFrame.isConnected)) closeExpandedPlayer();
    }).observe(document.body, { childList: true, subtree: true });
})();
