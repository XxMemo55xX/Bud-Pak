$(document).ready(function() {
    function loadContent(page) {
        $('#content-section').load(page, function() {
            // Ponowna inicjalizacja Materialize
            $('.modal').modal();  // Re-inicjalizacja modalów
            $('.prod_tabs').tabs();  // Re-inicjalizacja zakładek
        });
    }

    $('#Okna_aluplast-tab').on('click', function() {
        loadContent('Okna_aluplast.html');
        setActiveTab('Okna_aluplast-tab');
    });

    $('#Okna_rehau-tab').on('click', function() {
        loadContent('Okna_rehau.html');
        setActiveTab('Okna_rehau-tab');
    });

    function setActiveTab(tabId) {
        $('.prod_tabs li a').removeClass('active');
        $('#' + tabId).addClass('active');
    }

    loadContent('Okna_aluplast.html'); // Domyślnie załaduj Aluplast
});

