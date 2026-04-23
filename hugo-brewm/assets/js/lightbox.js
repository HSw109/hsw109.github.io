// Lightbox: click any content image to view full resolution
(function () {
    'use strict';

    let overlay, imgEl, isOpen = false;

    function create() {
        overlay = document.createElement('div');
        overlay.id = 'lightbox-overlay';
        imgEl = document.createElement('img');
        overlay.appendChild(imgEl);
        document.body.appendChild(overlay);

        overlay.addEventListener('click', close);
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && isOpen) close();
        });
    }

    function open(src) {
        imgEl.src = src;
        overlay.classList.add('active');
        isOpen = true;
    }

    function close() {
        overlay.classList.remove('active');
        isOpen = false;
    }

    document.addEventListener('DOMContentLoaded', function () {
        create();
        var content = document.getElementById('content');
        if (!content) return;
        content.addEventListener('click', function (e) {
            var img = e.target.closest('img');
            if (!img) return;
            e.preventDefault();
            open(img.src);
        });
    });
})();
