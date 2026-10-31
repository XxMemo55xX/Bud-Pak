$(document).ready(function() {
    // Producenci w katalogu okien. Adres strony może wskazywać producenta (#rehau)
    // albo od razu popup produktu (#wital:CASSONETTO).
    var PRODUCERS = {
        Okna_aluplast: { file: 'Okna_aluplast.html', hash: 'aluplast' },
        Okna_rehau:    { file: 'Okna_rehau.html',    hash: 'rehau' },
        Okna_wital:    { file: 'Okna_wital.html',    hash: 'wital' }
    };
    var DEFAULT_KEY = 'Okna_aluplast';

    var $section = $('#content-section');
    var cache = {};
    var requestId = 0;

    function keyFromHash(hash) {
        var name = (hash || '').replace('#', '').split(':')[0].toLowerCase();
        var found = DEFAULT_KEY;
        Object.keys(PRODUCERS).forEach(function(key) {
            if (PRODUCERS[key].hash === name) { found = key; }
        });
        return found;
    }

    function modalFromHash(hash) {
        var parts = (hash || '').replace('#', '').split(':');
        return parts.length > 1 ? parts[1] : null;
    }

    function setActiveTab(key) {
        var $tabs = $('.prod_tabs li a');
        $tabs.removeClass('active').attr('aria-selected', 'false');
        $('#' + key).addClass('active').attr('aria-selected', 'true');
        $section.attr('aria-labelledby', key);
    }

    function render(key, html, openId) {
        if (window.BudPakCatalog) { window.BudPakCatalog.destroy(); }
        $section.html(html).attr('aria-busy', 'false');
        if (window.BudPakCatalog) {
            window.BudPakCatalog.enhance($section[0]);
            if (openId) { window.BudPakCatalog.openModal(openId); }
        }
    }

    function loadContent(key, openId) {
        var producer = PRODUCERS[key];
        var thisRequest = ++requestId;
        setActiveTab(key);

        if (cache[key]) {
            render(key, cache[key], openId);
            return;
        }

        $section.attr('aria-busy', 'true')
            .html('<p class="catalog-status" role="status">Ładowanie katalogu…</p>');

        $.ajax({ url: producer.file, dataType: 'html' })
            .done(function(html) {
                cache[key] = html;
                if (thisRequest === requestId) { render(key, html, openId); }
            })
            .fail(function() {
                if (thisRequest !== requestId) { return; }
                $section.attr('aria-busy', 'false').html(
                    '<div class="catalog-status catalog-status--error" role="alert">' +
                    '<p>Nie udało się wczytać katalogu. Odśwież stronę lub napisz do nas: ' +
                    '<a href="mailto:pk.budpak@gmail.com">pk.budpak@gmail.com</a>, ' +
                    'tel. <a href="tel:+48606490282">+48 606 490 282</a>.</p></div>'
                );
            });
    }

    // Zakładki producentów: dostępność (ARIA) i obsługa kliknięcia
    $('.prod_tabs').attr('role', 'tablist');
    $('.prod_tabs li').attr('role', 'presentation');
    $section.attr({ role: 'tabpanel', 'aria-live': 'polite' });

    $('.prod_tabs li a').each(function() {
        $(this).attr({ role: 'tab', 'aria-controls': 'content-section' });
    });

    Object.keys(PRODUCERS).forEach(function(key) {
        $('#' + key).on('click', function(event) {
            event.preventDefault();
            loadContent(key);
            if (window.history && window.history.replaceState) {
                window.history.replaceState(null, '', '#' + PRODUCERS[key].hash);
            }
        });
    });

    window.addEventListener('hashchange', function() {
        var name = (window.location.hash || '').replace('#', '').split(':')[0].toLowerCase();
        var known = Object.keys(PRODUCERS).some(function(k) { return PRODUCERS[k].hash === name; });
        if (!known) { return; } // e.g. href="#" or an anchor inside a popup: keep the current producer
        loadContent(keyFromHash(window.location.hash), modalFromHash(window.location.hash));
    });

    // Start: producent z adresu strony albo Aluplast
    loadContent(keyFromHash(window.location.hash), modalFromHash(window.location.hash));
});

