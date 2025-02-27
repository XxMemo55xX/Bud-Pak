// $(document).ready(function() {
//     // Inicjalizacja główna modalów
//     $('.modal').modal({
//         onOpenEnd: function(modal) {
//             // Inicjalizuj zakładki WEWNĄTRZ bieżącego modala
//             const instance = M.Tabs.init(modal.querySelector('.tabs'), {});
//             instance.select('cechy' + modal.id); // Automatyczne przejście do pierwszej zakładki
//         }
//     });
// });

$(document).ready(function() {
    // Inicjalizacja modalów z opcjami
    $('.modal').modal({
        onOpenStart: function() {
            // Resetuj wszystkie zakładki przed otwarciem modala
            $('.tabs-content').hide();
        },
        onOpenEnd: function(modal) {
            // Inicjalizacja zakładek z wyłączoną animacją
            const tabsElement = modal.querySelector('.tabs');
            const instance = M.Tabs.init(tabsElement, {
                duration: 0 // Wyłącza animację przejścia
            });

            // Natychmiastowe przejście do pierwszej zakładki bez opóźnienia
            instance.select(0); // Używamy indexu zamiast ID

            // Dodatkowe zabezpieczenie - ręczne ukrycie innych zakładek
            $(modal).find('.tabs-content').not(':first').hide();
        }
    });

    // ============

    // Dodany fragment do powiększenia obrazu
    const largeImageModal = document.getElementById('largeImageModal');
    const largeImage = document.getElementById('largeImage');
    const closeLargeImageBtn = document.querySelector('#largeImageModal .close');

    // Obsługuje kliknięcia na obrazy w modalach z klasą 'modal-image'
    $('.modal-image').on('click', function() {
        const smallImage = this; // 'this' to element, na który kliknięto (obrazek)
        largeImage.src = smallImage.src; // Ustawiamy ścieżkę do powiększonego obrazu
        largeImageModal.style.display = 'flex'; // Pokazujemy powiększony obraz
    });

    // Zamknięcie powiększonego obrazu
    if (closeLargeImageBtn) {
        closeLargeImageBtn.addEventListener('click', function() {
            largeImageModal.style.display = 'none'; // Ukrywamy powiększony obraz
        });
    }

    // Zamknięcie powiększonego obrazu po kliknięciu poza obrazem
    window.addEventListener('click', function(event) {
        if (event.target === largeImageModal) {
            largeImageModal.style.display = 'none'; // Ukrywamy powiększony obraz
        }
    });

    // ============

    // Inicjalizacja Sidenav
    var sidenav = M.Sidenav.init($('.sidenav'), {});

    // Dodanie obsługi kliknięcia na przycisk X w Sidenav
    $('.sidenav .close-btn').on('click', function() {
        sidenav.close();  // Zamyka menu po kliknięciu w X
    });

    // Zamknięcie Sidenav po kliknięciu na overlay (sidenav-overlay)
    $('.sidenav-overlay').on('click', function() {
        sidenav.close();  // Zamyka menu po kliknięciu na overlay
    });
    // ============

});

