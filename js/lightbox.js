/*
 * Bud-Pak image viewer with zoom ("lupka").
 *
 * Opens on click / Enter / Space on any <img class="modal-image"> or <img data-zoom>.
 * Optional attributes on the image:
 *   data-zoom-src  - larger version loaded inside the viewer (the thumbnail is shown while it loads)
 *   data-caption   - caption text (defaults to the alt text)
 *
 * Controls: buttons (+ / - / fit / close), mouse wheel, click or double tap to toggle zoom,
 * drag to pan, pinch on touch screens, keyboard (+ - 0, arrow keys, Esc).
 * Public API: window.BudPakLightbox = { open(img), close(), enhance(root) }
 */
(function () {
    'use strict';

    var MIN_SCALE = 1;
    var MAX_SCALE = 6;
    var BUTTON_STEP = 1.4;
    var CLICK_ZOOM = 2.5;
    var DRAG_TOLERANCE = 6; // px of movement that still counts as a click

    var SELECTOR = 'img.modal-image, img[data-zoom]';

    var viewer, stage, image, captionEl, levelEl, spinner;
    var btnIn, btnOut, btnFit, btnClose;
    var lastFocus = null;
    var isOpen = false;

    var scale = 1, tx = 0, ty = 0;
    var pointers = {};
    var gesture = null;

    var ICONS = {
        zoomIn: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14zm2.5-4h-2v2H9v-2H7V9h2V7h1v2h2v1z"/></svg>',
        zoomOut: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14zM7 9h5v1H7z"/></svg>',
        fit: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M5 5h5v2H7v3H5V5zm9 0h5v5h-2V7h-3V5zM5 14h2v3h3v2H5v-5zm12 0h2v5h-5v-2h3v-3z"/></svg>',
        close: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>',
        hint: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14zm2.5-4h-2v2H9v-2H7V9h2V7h1v2h2v1z"/></svg>'
    };

    function button(label, icon, onClick) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'bp-lb__btn';
        b.setAttribute('aria-label', label);
        b.title = label;
        b.innerHTML = icon;
        b.addEventListener('click', onClick);
        return b;
    }

    function build() {
        if (viewer) { return; }

        viewer = document.createElement('div');
        viewer.className = 'bp-lb';
        viewer.setAttribute('role', 'dialog');
        viewer.setAttribute('aria-modal', 'true');
        viewer.setAttribute('aria-label', 'Powiększenie zdjęcia');
        viewer.hidden = true;

        var bar = document.createElement('div');
        bar.className = 'bp-lb__bar';

        captionEl = document.createElement('p');
        captionEl.className = 'bp-lb__caption';

        var tools = document.createElement('div');
        tools.className = 'bp-lb__tools';

        levelEl = document.createElement('span');
        levelEl.className = 'bp-lb__level';
        levelEl.setAttribute('aria-live', 'polite');

        btnOut = button('Pomniejsz', ICONS.zoomOut, function () { zoomBy(1 / BUTTON_STEP); });
        btnIn = button('Powiększ', ICONS.zoomIn, function () { zoomBy(BUTTON_STEP); });
        btnFit = button('Dopasuj do ekranu', ICONS.fit, reset);
        btnClose = button('Zamknij podgląd (Esc)', ICONS.close, close);

        tools.appendChild(levelEl);
        tools.appendChild(btnOut);
        tools.appendChild(btnIn);
        tools.appendChild(btnFit);
        tools.appendChild(btnClose);

        bar.appendChild(captionEl);
        bar.appendChild(tools);

        stage = document.createElement('div');
        stage.className = 'bp-lb__stage';

        image = document.createElement('img');
        image.className = 'bp-lb__img';
        image.alt = '';
        image.draggable = false;

        spinner = document.createElement('div');
        spinner.className = 'bp-lb__spinner';
        spinner.setAttribute('role', 'status');
        spinner.textContent = 'Ładowanie…';

        var help = document.createElement('p');
        help.className = 'bp-lb__help visually-hidden';
        help.textContent = 'Kliknij zdjęcie, aby przybliżyć. Przeciągnij, aby przesunąć. Kółko myszy lub dwa palce zmieniają powiększenie.';

        stage.appendChild(image);
        stage.appendChild(spinner);
        viewer.appendChild(bar);
        viewer.appendChild(stage);
        viewer.appendChild(help);
        document.body.appendChild(viewer);

        stage.addEventListener('pointerdown', onPointerDown);
        stage.addEventListener('pointermove', onPointerMove);
        stage.addEventListener('pointerup', onPointerUp);
        stage.addEventListener('pointercancel', onPointerUp);
        stage.addEventListener('wheel', onWheel, { passive: false });
        window.addEventListener('resize', function () { if (isOpen) { apply(); } });
    }

    /* ---------- geometry ---------- */

    function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }

    function limits() {
        var sw = stage.clientWidth, sh = stage.clientHeight;
        var dw = image.offsetWidth * scale, dh = image.offsetHeight * scale;
        return {
            x: Math.max(0, (dw - sw) / 2),
            y: Math.max(0, (dh - sh) / 2)
        };
    }

    function apply(animate) {
        var lim = limits();
        tx = clamp(tx, -lim.x, lim.x);
        ty = clamp(ty, -lim.y, lim.y);
        image.style.transition = animate ? 'transform .18s ease-out' : 'none';
        image.style.transform = 'translate(' + tx + 'px,' + ty + 'px) scale(' + scale + ')';
        levelEl.textContent = Math.round(scale * 100) + '%';
        btnOut.disabled = scale <= MIN_SCALE + 0.001;
        btnIn.disabled = scale >= MAX_SCALE - 0.001;
        btnFit.disabled = scale <= MIN_SCALE + 0.001 && tx === 0 && ty === 0;
        viewer.classList.toggle('is-zoomed', scale > MIN_SCALE + 0.001);
    }

    // Zoom keeping the point (cx, cy), given relative to the stage centre, fixed on screen.
    function zoomAt(newScale, cx, cy, animate) {
        newScale = clamp(newScale, MIN_SCALE, MAX_SCALE);
        var ratio = newScale / scale;
        tx = cx - (cx - tx) * ratio;
        ty = cy - (cy - ty) * ratio;
        scale = newScale;
        if (scale <= MIN_SCALE + 0.001) { tx = 0; ty = 0; }
        apply(animate);
    }

    function zoomBy(factor) { zoomAt(scale * factor, 0, 0, true); }

    function reset() {
        scale = 1; tx = 0; ty = 0;
        apply(true);
    }

    function centreOf(clientX, clientY) {
        var r = stage.getBoundingClientRect();
        return { x: clientX - (r.left + r.width / 2), y: clientY - (r.top + r.height / 2) };
    }

    /* ---------- pointer handling ---------- */

    function pointerList() {
        return Object.keys(pointers).map(function (k) { return pointers[k]; });
    }

    function onPointerDown(e) {
        if (e.button !== undefined && e.button !== 0 && e.pointerType === 'mouse') { return; }
        stage.setPointerCapture(e.pointerId);
        pointers[e.pointerId] = { x: e.clientX, y: e.clientY };
        var list = pointerList();
        if (list.length === 1) {
            gesture = { type: 'pan', sx: e.clientX, sy: e.clientY, tx: tx, ty: ty, moved: false, onImage: e.target === image };
        } else if (list.length === 2) {
            var a = list[0], b = list[1];
            var mid = centreOf((a.x + b.x) / 2, (a.y + b.y) / 2);
            gesture = {
                type: 'pinch',
                dist: Math.hypot(a.x - b.x, a.y - b.y),
                scale: scale, tx: tx, ty: ty, mid: mid, moved: true
            };
        }
        viewer.classList.add('is-dragging');
    }

    function onPointerMove(e) {
        if (!pointers[e.pointerId] || !gesture) { return; }
        pointers[e.pointerId] = { x: e.clientX, y: e.clientY };
        var list = pointerList();

        if (gesture.type === 'pan' && list.length === 1) {
            var dx = e.clientX - gesture.sx, dy = e.clientY - gesture.sy;
            if (Math.abs(dx) + Math.abs(dy) > DRAG_TOLERANCE) { gesture.moved = true; }
            if (scale > MIN_SCALE) {
                tx = gesture.tx + dx;
                ty = gesture.ty + dy;
                apply(false);
            }
        } else if (gesture.type === 'pinch' && list.length >= 2) {
            var a = list[0], b = list[1];
            var dist = Math.hypot(a.x - b.x, a.y - b.y);
            var target = clamp(gesture.scale * (dist / gesture.dist), MIN_SCALE, MAX_SCALE);
            var ratio = target / gesture.scale;
            tx = gesture.mid.x - (gesture.mid.x - gesture.tx) * ratio;
            ty = gesture.mid.y - (gesture.mid.y - gesture.ty) * ratio;
            scale = target;
            if (scale <= MIN_SCALE + 0.001) { tx = 0; ty = 0; }
            apply(false);
        }
    }

    function onPointerUp(e) {
        var wasGesture = gesture;
        delete pointers[e.pointerId];
        var remaining = pointerList();

        if (remaining.length === 0) {
            viewer.classList.remove('is-dragging');
            gesture = null;
            if (e.type === 'pointerup' && wasGesture && wasGesture.type === 'pan' && !wasGesture.moved) {
                if (wasGesture.onImage) {
                    // a click on the picture toggles between "fit" and a close-up at the click point
                    if (scale > MIN_SCALE + 0.001) {
                        reset();
                    } else {
                        var c = centreOf(e.clientX, e.clientY);
                        zoomAt(CLICK_ZOOM, c.x, c.y, true);
                    }
                } else {
                    close(); // click on the dark background
                }
            }
        } else if (remaining.length === 1) {
            // continue as a pan after one finger of a pinch is lifted
            gesture = { type: 'pan', sx: remaining[0].x, sy: remaining[0].y, tx: tx, ty: ty, moved: true, onImage: true };
        }
    }

    function onWheel(e) {
        e.preventDefault();
        var c = centreOf(e.clientX, e.clientY);
        var factor = Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0018));
        zoomAt(scale * factor, c.x, c.y, false);
    }

    /* ---------- keyboard ---------- */

    function onKeydown(e) {
        if (!isOpen) { return; }
        var key = e.key;
        var handled = true;

        if (key === 'Escape' || key === 'Esc') {
            close();
        } else if (key === '+' || key === '=') {
            zoomBy(BUTTON_STEP);
        } else if (key === '-' || key === '_') {
            zoomBy(1 / BUTTON_STEP);
        } else if (key === '0') {
            reset();
        } else if (key === 'ArrowLeft' && scale > MIN_SCALE) {
            tx += 60; apply(true);
        } else if (key === 'ArrowRight' && scale > MIN_SCALE) {
            tx -= 60; apply(true);
        } else if (key === 'ArrowUp' && scale > MIN_SCALE) {
            ty += 60; apply(true);
        } else if (key === 'ArrowDown' && scale > MIN_SCALE) {
            ty -= 60; apply(true);
        } else if (key === 'Tab') {
            trapFocus(e);
            return;
        } else {
            handled = false;
        }

        if (handled) {
            e.preventDefault();
            e.stopImmediatePropagation(); // keep Esc from also closing a catalogue popup underneath
        }
    }

    function trapFocus(e) {
        var items = [btnOut, btnIn, btnFit, btnClose].filter(function (b) { return !b.disabled; });
        if (!items.length) { e.preventDefault(); return; }
        var first = items[0], last = items[items.length - 1];
        var active = document.activeElement;
        if (e.shiftKey && (active === first || items.indexOf(active) === -1)) {
            e.preventDefault(); last.focus();
        } else if (!e.shiftKey && (active === last || items.indexOf(active) === -1)) {
            e.preventDefault(); first.focus();
        }
    }

    /* ---------- open / close ---------- */

    function open(source) {
        if (!source) { return; }
        build();

        lastFocus = document.activeElement;
        var thumbSrc = source.currentSrc || source.src;
        var fullSrc = source.getAttribute('data-zoom-src') || thumbSrc;
        var text = source.getAttribute('data-caption') || source.alt || '';

        captionEl.textContent = text;
        viewer.setAttribute('aria-label', text ? 'Powiększenie zdjęcia: ' + text : 'Powiększenie zdjęcia');
        image.alt = text;
        scale = 1; tx = 0; ty = 0;
        pointers = {}; gesture = null;

        image.onload = function () { apply(false); };
        image.src = thumbSrc;
        viewer.classList.remove('is-error');

        if (fullSrc !== thumbSrc) {
            spinner.hidden = false;
            var hi = new Image();
            hi.onload = function () {
                if (!isOpen || image.getAttribute('data-requested') !== fullSrc) { return; }
                image.src = fullSrc;
                spinner.hidden = true;
            };
            hi.onerror = function () { spinner.hidden = true; };
            image.setAttribute('data-requested', fullSrc);
            hi.src = fullSrc;
        } else {
            spinner.hidden = true;
            image.removeAttribute('data-requested');
        }

        viewer.hidden = false;
        document.documentElement.classList.add('bp-lb-open');
        isOpen = true;
        apply(false);
        btnClose.focus();
    }

    function close() {
        if (!isOpen) { return; }
        isOpen = false;
        viewer.hidden = true;
        image.removeAttribute('src');
        document.documentElement.classList.remove('bp-lb-open');
        if (lastFocus && typeof lastFocus.focus === 'function' && document.contains(lastFocus)) {
            lastFocus.focus();
        }
    }

    /* ---------- page integration ---------- */

    function enhance(root) {
        var scope = root || document;
        var images = scope.querySelectorAll(SELECTOR);
        Array.prototype.forEach.call(images, function (img) {
            if (img.getAttribute('data-bp-zoom') === '1') { return; }
            img.setAttribute('data-bp-zoom', '1');
            img.setAttribute('tabindex', '0');
            img.setAttribute('role', 'button');
            img.setAttribute('aria-haspopup', 'dialog');
            img.setAttribute('aria-label', 'Powiększ zdjęcie' + (img.alt ? ': ' + img.alt : ''));
            img.classList.add('is-zoomable');

            var holder = img.parentNode;
            if (holder && holder.classList.contains('modal-image-container') && !holder.querySelector('.zoom-hint')) {
                var hint = document.createElement('span');
                hint.className = 'zoom-hint';
                hint.setAttribute('aria-hidden', 'true');
                hint.innerHTML = ICONS.hint;
                holder.appendChild(hint);
            }
        });
    }

    document.addEventListener('click', function (e) {
        var img = e.target && e.target.closest ? e.target.closest(SELECTOR) : null;
        if (img && !viewer_contains(img)) {
            e.preventDefault();
            open(img);
        }
    });

    document.addEventListener('keydown', function (e) {
        if (isOpen) { return; }
        if ((e.key === 'Enter' || e.key === ' ') && e.target && e.target.matches && e.target.matches(SELECTOR)) {
            e.preventDefault();
            open(e.target);
        }
    });

    // capture phase so the viewer sees keys before Materialize modals do
    document.addEventListener('keydown', onKeydown, true);

    function viewer_contains(el) { return viewer && viewer.contains(el); }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () { enhance(document); });
    } else {
        enhance(document);
    }

    window.BudPakLightbox = { open: open, close: close, enhance: enhance };
})();
