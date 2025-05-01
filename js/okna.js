$(document).ready(function() {
    function loadContent(page) {
        $('#content-section').load(page, function() {
            console.log("Załadowano " + page);

            const modals = document.querySelectorAll('.modal');
            M.Modal.init(modals);

            const tabs = document.querySelectorAll('.tabs');
            tabs.forEach(tab => {
                M.Tabs.init(tab);
            });
        });
    }

    $('#Okna_aluplast').on('click', function() {
        loadContent('Okna_aluplast.html');
        setActiveTab('Okna_aluplast');
    });

    $('#Okna_rehau').on('click', function() {
        loadContent('Okna_rehau.html');
        setActiveTab('Okna_rehau');
    });

    $('#Okna_wital').on('click', function() {
        loadContent('Okna_wital.html');
        setActiveTab('Okna_wital');
    });

    function setActiveTab(tabId) {
        $('.prod_tabs li a').removeClass('active');
        $('#' + tabId).addClass('active');
    }

    // Domyślnie załaduj Aluplast
    loadContent('Okna_aluplast.html');
});

