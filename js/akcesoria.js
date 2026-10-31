/* Filtr akcesoriów: Wszystko / Do okien / Do drzwi / Do bram. Adres strony może wskazywać filtr (#okna, #drzwi, #bramy). */
(function () {
    'use strict';

    var filter = document.getElementById('acc-filter');
    var grid = document.getElementById('acc-grid');
    var status = document.getElementById('acc-status');
    if (!filter || !grid) { return; }

    var buttons = Array.prototype.slice.call(filter.querySelectorAll('button'));
    var cards = Array.prototype.slice.call(grid.querySelectorAll('.acc-card'));

    var HASH_TO_FILTER = { okna: 'okien', drzwi: 'drzwi', bramy: 'bram' };
    var FILTER_TO_HASH = { okien: 'okna', drzwi: 'drzwi', bram: 'bramy' };
    var LABEL = { all: 'wszystkie akcesoria', okien: 'akcesoria do okien', drzwi: 'akcesoria do drzwi', bram: 'akcesoria do bram' };

    function apply(value) {
        var shown = 0;
        cards.forEach(function (card) {
            var targets = (card.getAttribute('data-for') || '').split(' ');
            var visible = value === 'all' || targets.indexOf(value) !== -1;
            card.hidden = !visible;
            if (visible) { shown += 1; }
        });
        buttons.forEach(function (b) {
            b.setAttribute('aria-pressed', b.getAttribute('data-filter') === value ? 'true' : 'false');
        });
        if (status) {
            status.textContent = 'Filtr: ' + LABEL[value] + '.';
        }
    }

    buttons.forEach(function (b) {
        b.addEventListener('click', function () {
            var value = b.getAttribute('data-filter');
            apply(value);
            if (window.history && window.history.replaceState) {
                var hash = FILTER_TO_HASH[value];
                window.history.replaceState(null, '', hash ? '#' + hash : window.location.pathname);
            }
        });
    });

    function fromHash() {
        return HASH_TO_FILTER[(window.location.hash || '').replace('#', '')] || 'all';
    }

    window.addEventListener('hashchange', function () { apply(fromHash()); });
    apply(fromHash());
})();
