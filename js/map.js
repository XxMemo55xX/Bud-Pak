// Inicjalizacja mapy
var map = L.map('map').setView([52.10758457210322, 21.25901819595561], 14); // Ustawienie współrzędnych (Warszawa)

// Dodanie warstwy mapy OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Dodanie pinezki na mapie
var marker = L.marker([52.10758457210322, 21.25901819595561]).addTo(map);
marker.bindPopup("<b>To jest nasza lokalizacja!</b>").openPopup();