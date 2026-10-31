/*
 * Bud-Pak catalogue helpers shared by the product pages (okna, drzwi, bramy, akcesoria).
 *
 * BudPakCatalog.enhance(root)  - initialises Materialize popups and tabs inside `root`,
 *                                adds the missing ARIA roles and enables the image zoom.
 * BudPakCatalog.destroy()      - removes popups created by enhance() (used before the okna
 *                                catalogue swaps one producer for another).
 * BudPakCatalog.openModal(id)  - opens a popup by id.
 */
(function () {
    'use strict';

    var instances = [];

    function each(list, fn) { Array.prototype.forEach.call(list, fn); }

    function ensureId(el, prefix) {
        if (!el.id) {
            ensureId.counter = (ensureId.counter || 0) + 1;
            el.id = prefix + '-' + ensureId.counter;
        }
        return el.id;
    }

    function tabsAria(list) {
        if (list.getAttribute('data-bp-aria') === '1') { return; }
        list.setAttribute('data-bp-aria', '1');
        list.setAttribute('role', 'tablist');

        var links = list.querySelectorAll('.tab a');
        each(links, function (a) {
            a.parentNode.setAttribute('role', 'presentation');
            a.setAttribute('role', 'tab');
            ensureId(a, 'bp-tab');

            var href = a.getAttribute('href') || '';
            if (href.charAt(0) === '#' && href.length > 1) {
                var panel = document.getElementById(href.slice(1));
                if (panel) {
                    panel.setAttribute('role', 'tabpanel');
                    panel.setAttribute('aria-labelledby', a.id);
                    a.setAttribute('aria-controls', panel.id);
                }
            }
            a.setAttribute('aria-selected', a.classList.contains('active') ? 'true' : 'false');
            a.addEventListener('click', function () { setTimeout(sync, 0); });
        });

        function sync() {
            each(links, function (l) {
                l.setAttribute('aria-selected', l.classList.contains('active') ? 'true' : 'false');
            });
        }
    }

    function initTab(list) {
        if (!M.Tabs.getInstance(list)) { M.Tabs.init(list); }
        tabsAria(list);
    }

    function initTabs(scope) {
        each(scope.querySelectorAll('.tabs'), initTab);
    }

    // A popup always opens on its first tab (Cechy), not on the one used last time.
    function resetTabs(modal) {
        each(modal.querySelectorAll('.tabs'), function (list) {
            var inst = M.Tabs.getInstance(list);
            var first = list.querySelector('.tab a');
            if (!first) { return; }
            if (inst && first.hash) { inst.select(first.hash.slice(1)); }
            each(list.querySelectorAll('.tab a'), function (l) {
                l.setAttribute('aria-selected', l === first ? 'true' : 'false');
            });
        });
        var content = modal.querySelector('.modal-content');
        if (content) { content.scrollTop = 0; }
        modal.scrollTop = 0;
    }

    // Links like <a href="#" class="modal-close"> must not change the page address
    // (it used to switch the okna catalogue back to the first producer).
    document.addEventListener('click', function (e) {
        var a = e.target.closest && e.target.closest('a[href="#"]');
        if (a) { e.preventDefault(); }
    });

    function enhance(root) {
        var scope = root || document;

        var modals = scope.querySelectorAll('.modal:not([data-bp-modal])');
        each(modals, function (modal) {
            modal.setAttribute('data-bp-modal', '1');
            modal.setAttribute('role', 'dialog');
            modal.setAttribute('aria-modal', 'true');
            var heading = modal.querySelector('h5');
            if (heading) {
                heading.id = heading.id || modal.id + '-title';
                modal.setAttribute('aria-labelledby', heading.id);
            }
            instances.push(M.Modal.init(modal, {
                onOpenStart: function (el) { resetTabs(el); },
                onOpenEnd: function (el) { initTabs(el); },
                onCloseEnd: function (el) { resetTabs(el); },
                preventScrolling: true
            }));
        });

        // popups open with their first tab visible; prepare the tabs lazily when opened,
        // but give the ones already on the page their ARIA roles now
        each(scope.querySelectorAll('.tabs'), function (list) {
            if (!list.closest('.modal')) { initTab(list); }
        });

        if (window.BudPakLightbox) { window.BudPakLightbox.enhance(scope); }
    }

    function destroy() {
        instances.forEach(function (inst) {
            try { inst.destroy(); } catch (err) { /* already gone */ }
        });
        instances = [];
    }

    function openModal(id) {
        var el = document.getElementById(id);
        if (!el) { return false; }
        var inst = M.Modal.getInstance(el);
        if (!inst) { return false; }
        inst.open();
        return true;
    }

    window.BudPakCatalog = { enhance: enhance, destroy: destroy, openModal: openModal };
})();
