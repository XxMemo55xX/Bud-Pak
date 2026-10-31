document.addEventListener('DOMContentLoaded', function () {
    // Popupy i zakładki obecne od razu w HTML (drzwi, bramy, akcesoria).
    // Zawartość katalogu okien jest doładowywana i inicjalizowana w okna.js.
    // Powiększanie zdjęć obsługuje js/lightbox.js, menu boczne inicjuje js/init.js
    // (przycisk X ma klasę sidenav-close, więc zamyka menu bez dodatkowego kodu).
    if (window.BudPakCatalog) {
        window.BudPakCatalog.enhance(document);
    }
});
