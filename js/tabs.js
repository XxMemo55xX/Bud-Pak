document.addEventListener('DOMContentLoaded', function () {
    // Inicjalizacja modalów
    const modals = document.querySelectorAll('.modal');
    M.Modal.init(modals, {
        onOpenEnd: function (modalElement) {
            const tabList = modalElement.querySelectorAll('.tabs');
            tabList.forEach(tab => M.Tabs.init(tab));
        }
    });

    // Powiększanie zdjęcia
    const largeImageModal = document.getElementById('largeImageModal');
    const largeImage = document.getElementById('largeImage');
    const closeLargeImageBtn = document.querySelector('#largeImageModal .close');

    document.querySelectorAll('.modal-image').forEach(image => {
        image.addEventListener('click', function () {
            largeImage.src = this.src;
            largeImageModal.style.display = 'flex';
        });
    });

    if (closeLargeImageBtn) {
        closeLargeImageBtn.addEventListener('click', () => {
            largeImageModal.style.display = 'none';
        });
    }

    window.addEventListener('click', function (event) {
        if (event.target === largeImageModal) {
            largeImageModal.style.display = 'none';
        }
    });

    // Sidenav
    const sidenav = M.Sidenav.init(document.querySelectorAll('.sidenav'));

    document.querySelectorAll('.sidenav .close-btn').forEach(btn => {
        btn.addEventListener('click', () => sidenav.close());
    });
});
