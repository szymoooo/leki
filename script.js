// Definicje globalnych zmiennych
let leki = [];
let archiwum = [];
let temperatureReadings = []; // [{ value: 36.5, timestamp: '2024-04-27T14:30:00' }, ...]
let pressureReadings = [];     // [{ value: '120/80', timestamp: '2024-04-27T14:35:00' }, ...]
let saturationReadings = [];   // [{ value: 95, timestamp: '2024-04-27T14:40:00' }, ...]
let editingIndex = null;
let editingListId = null;

// Zmienne paginacji, ustawione na 1 (pierwsza strona)
let lekPage = 1;
let archiwumPage = 1;
let temperaturePage = 1;
let pressurePage = 1;
let saturationPage = 1;

const itemsPerPage = 4; // Liczba elementów na stronie

// Mapowanie listId do klas elementów listy
const listItemClasses = {
    'lek-lista-container': 'item', // Ujednolicona klasa
    'lek-archiwum-container': 'item',
    'temperature-list': 'item',
    'pressure-list': 'item',
    'saturation-list': 'item'
};

// Mapowanie listId do identyfikatorów przycisków paginacji
const paginationButtons = {
    'lek-lista-container': { prev: 'lek-prev-btn', next: 'lek-next-btn' },
    'lek-archiwum-container': { prev: 'archiwum-prev-btn', next: 'archiwum-next-btn' },
    'temperature-list': { prev: 'temperature-prev-btn', next: 'temperature-next-btn' },
    'pressure-list': { prev: 'pressure-prev-btn', next: 'pressure-next-btn' },
    'saturation-list': { prev: 'saturation-prev-btn', next: 'saturation-next-btn' }
};

// Funkcja zapisywania danych do localStorage
function saveData() {
    localStorage.setItem('leki', JSON.stringify(leki));
    localStorage.setItem('archiwum', JSON.stringify(archiwum));
    localStorage.setItem('temperatureReadings', JSON.stringify(temperatureReadings));
    localStorage.setItem('pressureReadings', JSON.stringify(pressureReadings));
    localStorage.setItem('saturationReadings', JSON.stringify(saturationReadings));
}

// Funkcja ładowania danych z localStorage
function loadData() {
    try {
        const savedLeki = localStorage.getItem('leki');
        const savedArchiwum = localStorage.getItem('archiwum');
        const savedTemperatureReadings = localStorage.getItem('temperatureReadings');
        const savedPressureReadings = localStorage.getItem('pressureReadings');
        const savedSaturationReadings = localStorage.getItem('saturationReadings');

        leki = savedLeki ? JSON.parse(savedLeki) : [];
        archiwum = savedArchiwum ? JSON.parse(savedArchiwum) : [];
        temperatureReadings = savedTemperatureReadings ? JSON.parse(savedTemperatureReadings) : [];
        pressureReadings = savedPressureReadings ? JSON.parse(savedPressureReadings) : [];
        saturationReadings = savedSaturationReadings ? JSON.parse(savedSaturationReadings) : [];
    } catch (error) {
        console.error("Błąd podczas ładowania danych z localStorage:", error);
        // Inicjalizacja pustych tablic w przypadku błędu
        leki = [];
        archiwum = [];
        temperatureReadings = [];
        pressureReadings = [];
        saturationReadings = [];
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadData(); // Ładowanie danych przed renderowaniem
    // Początkowe wyświetlenie list
    renderLekList();
    renderArchiwumList();
    renderMeasurements("temperature-list", temperatureReadings);
    renderMeasurements("pressure-list", pressureReadings);
    renderMeasurements("saturation-list", saturationReadings);
    
    // Aktualizacja widoku paginacji
    updateList('lek-lista-container', lekPage);
    updateList('lek-archiwum-container', archiwumPage);
    updateList('temperature-list', temperaturePage);
    updateList('pressure-list', pressurePage);
    updateList('saturation-list', saturationPage);

    // Ukryj wszystkie kontenery dawki na starcie
    toggleFields();
});

// Resetowanie widoczności modali po załadowaniu strony
document.querySelectorAll('.modal').forEach(modal => {
    modal.style.display = 'none'; // Ukryj wszystkie modale na starcie
});

// Obsługa modalnych okien
window.openModal = function (modalId)  {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = "flex"; // Otwórz modal
        console.log(`Modal '${modalId}' opened.`);
    } else {
        console.warn(`Modal '${modalId}' nie został znaleziony.`);
    }
};

window.closeModal = function (modalId)  {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = "none"; // Zamknij modal
        console.log(`Modal '${modalId}' zamknięty.`);
    } else {
        console.warn(`Modal '${modalId}' nie został znaleziony.`);
    }
    editingIndex = null; // Reset trybu edycji po zamknięciu modala
    editingListId = null;
    
    // Resetowanie formularza w modalu
    const form = modal.querySelector('form');
    if (form) {
        form.reset();
        // Usunięcie stylu display z kontenerów dawki
        document.getElementById("dawka-tabletki-container").style.display = "none";
        document.getElementById("dawka-ml-container").style.display = "none";
    }
};

// Funkcja przełączania pól w zależności od typu leku
window.toggleFields = () => {
    const typ = document.getElementById("typ").value;
    const dawkaTabletkiContainer = document.getElementById("dawka-tabletki-container");
    const dawkaMlContainer = document.getElementById("dawka-ml-container");

    // Ukryj oba kontenery
    dawkaTabletkiContainer.style.display = "none";
    dawkaMlContainer.style.display = "none";

    // Wyświetl odpowiedni kontener
    if (typ === "tabletka") {
        dawkaTabletkiContainer.style.display = "block";
    } else if (typ === "syrop") {
        dawkaMlContainer.style.display = "block";
    }
};

// Funkcja formatowania daty w formacie DD.MM.YYYY
function formatDate(dateObj) {
    const day = dateObj.getDate().toString().padStart(2, '0');
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const year = dateObj.getFullYear();
    return `${day}.${month}.${year}`;
}

// Funkcja formatowania czasu w formacie HH:MM
function formatTime(dateObj) {
    const hours = dateObj.getHours().toString().padStart(2, '0');
    const minutes = dateObj.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
}

// Funkcja konwertująca date z formatu DD.MM.YYYY do YYYY-MM-DD
function convertDateToISO(dateStr) {
    const parts = dateStr.split('.');
    if (parts.length !== 3) {
        console.warn(`Nieprawidłowy format daty: ${dateStr}`);
        return new Date().toISOString().split('T')[0]; // Fallback to today's date
    }
    const [day, month, year] = parts;
    return `${year}-${month}-${day}`;
}

// Funkcja do określenia poprawnej formy słowa "tabletka"
function getTabletkaForma(ilosc) {
    const number = parseFloat(ilosc);
    if (number === 1) {
        return 'tabletka';
    } else if ([0.25, 0.5, 0.75].includes(number)) {
        return 'tabletki';
    } else if (number > 1) {
        return 'tabletki';
    } else {
        return 'tabletki'; // Default
    }
}

// Funkcja renderująca listę leków w sekcji Planowanie
function renderLekList() {
    const container = document.getElementById("lek-lista-container");
    container.innerHTML = ""; // Wyczyść zawartość listy

    if (leki.length === 0) {
        // Komunikat pustego stanu dla Planowania
        container.innerHTML = `
            <p class="empty-state">
                Twój plan na dziś jest pusty! Dodaj nowe leki, aby zaplanować swoją codzienną rutynę.
            </p>`;
        return;
    }

    // Sortowanie leków według najbliższego czasu podania
    leki.sort((a, b) => {
        const lekTimeA = new Date(convertDateToISO(a.date) + "T" + a.time);
        const lekTimeB = new Date(convertDateToISO(b.date) + "T" + b.time);
        return lekTimeA - lekTimeB;
    });

    leki.forEach((lek, index) => {
        const item = document.createElement("div");
        item.className = "item"; // Ujednolicona klasa

        // Formatowanie daty i czasu
        const lekTime = new Date(convertDateToISO(lek.date) + "T" + lek.time);
        const formattedDate = formatDate(lekTime);
        const formattedTime = formatTime(lekTime);

        // Określenie jednostki i odmiany
        let jednostka = '';
        let dawkaForma = '';
        if (lek.typ === 'tabletka') {
            dawkaForma = getTabletkaForma(lek.dawka);
            jednostka = dawkaForma;
        } else if (lek.typ === 'syrop') {
            jednostka = 'ml syropu';
        }

        // Tworzenie elementów do wyświetlenia
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.onchange = () => archiveLek('leki', index);

        const header = document.createElement("div");
        header.className = "measurement-header";

        // Struktura HTML zgodnie z wymaganiami
        header.innerHTML = `
            <strong>${formattedDate} ${formattedTime}</strong> - Lek: <strong>${lek.nazwa}</strong>, Dawka: <strong>${lek.dawka} ${jednostka}</strong>
        `;

        const editBtn = document.createElement("button");
        editBtn.innerHTML = "✏️";
        editBtn.className = "edit-btn";
        editBtn.onclick = () => openEditModal('lek-lista-container', index);

        // Dodanie elementów do listy
        item.appendChild(checkbox);
        item.appendChild(header);
        item.appendChild(editBtn);

        container.appendChild(item); // Dodaj element do listy
    });

    console.log(`Lek list: rendered ${leki.length} items.`);
    saveData(); // Zapisanie danych do localStorage
}

// Funkcja renderująca listę leków w sekcji Archiwum
function renderArchiwumList() {
    const container = document.getElementById("lek-archiwum-container");
    container.innerHTML = ""; // Wyczyść zawartość archiwum

    if (archiwum.length === 0) {
        container.innerHTML = `
            <p class="empty-state">
                Brak zapisanych danych w archiwum.
            </p>`;
        return;
    }

    // Sortowanie archiwum według daty i czasu (najstarsze na górze)
    archiwum.sort((a, b) => {
        const lekTimeA = new Date(convertDateToISO(a.date) + "T" + a.time);
        const lekTimeB = new Date(convertDateToISO(b.date) + "T" + b.time);
        return lekTimeA - lekTimeB;
    });

    archiwum.forEach((lek, index) => {
        const item = document.createElement("div");
        item.className = "item"; // Ujednolicona klasa

        // Formatowanie daty i czasu
        const lekTime = new Date(convertDateToISO(lek.date) + "T" + lek.time);
        const formattedDate = formatDate(lekTime);
        const formattedTime = formatTime(lekTime);

        // Określenie jednostki i odmiany
        let jednostka = '';
        let dawkaForma = '';
        if (lek.typ === 'tabletka') {
            dawkaForma = getTabletkaForma(lek.dawka);
            jednostka = dawkaForma;
        } else if (lek.typ === 'syrop') {
            jednostka = 'syropu';
        }

        // Tworzenie elementów do wyświetlenia
        const header = document.createElement("div");
        header.className = "measurement-header";

        // Struktura HTML zgodnie z wymaganiami
        header.innerHTML = `
            <strong>${formattedDate} ${formattedTime}</strong> - Lek: <strong>${lek.nazwa}</strong>, Dawka: <strong>${lek.dawka} ${jednostka}</strong>
        `;

        // Przycisk edycji został usunięty dla Archiwum

        // Dodanie elementów do listy
        item.appendChild(header);
        // Jeśli chcesz dodać inne elementy do Archiwum, możesz to zrobić tutaj

        container.appendChild(item); // Dodaj element do listy
    });

    console.log(`Archiwum list: rendered ${archiwum.length} items.`);
    saveData(); // Zapisanie danych do localStorage
}

// Funkcja generująca opis dla temperatury
function getTemperatureDescription(value) {
    if (value >= 36 && value <= 37) {
        return "Normalna temperatura";
    } else if (value >= 37.1 && value <= 38) {
        return "Stan podgorączkowy";
    } else if (value >= 38.1 && value <= 39) {
        return "Gorączka umiarkowana";
    } else if (value > 39 && value <= 41.1) {
        return "Gorączka wysoka";
    } else if (value > 41.1) {
        return "Hiperpireksja";
    } else {
        return "Nieprawidłowa wartość temperatury.";
    }
}

// Funkcja generująca opis dla ciśnienia
function getPressureDescription(value) {
    if (typeof value !== 'string') {
        console.warn(`Nieprawidłowy format wartości ciśnienia: ${value}`);
        return "Nieprawidłowy format ciśnienia.";
    }

    const parts = value.split('/');
    if (parts.length !== 2) {
        console.warn(`Nieprawidłowy format wartości ciśnienia: ${value}`);
        return "Nieprawidłowy format ciśnienia.";
    }

    const systolic = parseInt(parts[0]);
    const diastolic = parseInt(parts[1]);

    if (isNaN(systolic) || isNaN(diastolic)) {
        console.warn(`Nieprawidłowe wartości ciśnienia: systolic=${parts[0]}, diastolic=${parts[1]}`);
        return "Nieprawidłowe wartości ciśnienia.";
    }

    // Sprawdzenie najpierw na izolowane nadciśnienie skurczowe
    if (systolic >= 140 && diastolic < 90) {
        return "Izolowane nadciśnienie skurczowe";
    }

    if (systolic < 120 && diastolic < 80) {
        return "Optymalne ciśnienie";
    } else if ((systolic >= 120 && systolic <= 129) || (diastolic >= 80 && diastolic <= 84)) {
        return "Prawidłowe ciśnienie";
    } else if ((systolic >= 130 && systolic <= 139) || (diastolic >= 85 && diastolic <= 89)) {
        return "Wysokie prawidłowe ciśnienie";
    } else if ((systolic >= 140 && systolic <= 159) || (diastolic >= 90 && diastolic <= 99)) {
        return "Nadciśnienie 1. stopnia";
    } else if ((systolic >= 160 && systolic <= 179) || (diastolic >= 100 && diastolic <= 109)) {
        return "Nadciśnienie 2. stopnia";
    } else if (systolic >= 180 || diastolic >= 110) {
        return "Nadciśnienie 3. stopnia";
    } else {
        return "Nieprawidłowa wartość ciśnienia.";
    }
}

// Funkcja generująca opis dla saturacji
function getSaturationDescription(value) {
    if (value >= 95 && value <= 100) {
        return "Normalny poziom";
    } else if (value >= 91 && value <= 94) {
        return "Poniżej normalnego";
    } else if (value < 90) {
        return "Zalecany kontakt z lekarzem";
    } else {
        return "Nieprawidłowa wartość saturacji.";
    }
}

// Funkcja renderująca listy pomiarów
function renderMeasurements(listId, measurements) {
    const container = document.getElementById(listId);
    container.innerHTML = "";

    if (measurements.length === 0) {
        container.innerHTML = `
            <p class="empty-state">
                Brak zapisanych pomiarów. Kliknij ikonę i dodaj.
            </p>`;
        return;
    }

    // Sortowanie pomiarów: najnowsze na górze
    measurements.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    measurements.forEach((measurement, index) => {
        console.log(`Rendering measurement ${index} in ${listId}:`, measurement);
        if (measurement.value === undefined || measurement.value === null) {
            console.warn(`Pominięto pomiar ${index} w ${listId} z powodu braku wartości.`);
            return; // Pomiń ten pomiar
        }

        const item = document.createElement("div");
        item.className = "item"; // Ujednolicona klasa

        // Formatowanie daty i czasu
        const date = new Date(measurement.timestamp);
        const formattedDate = formatDate(date);
        const formattedTime = formatTime(date);

        // Określenie jednostki i opisu
        let unit = '';
        let description = '';

        if (listId === "temperature-list") {
            unit = '°C';
            description = getTemperatureDescription(measurement.value);
        } else if (listId === "pressure-list") {
            unit = 'mmHg';
            description = getPressureDescription(measurement.value);
        } else if (listId === "saturation-list") {
            unit = '%';
            description = getSaturationDescription(measurement.value);
        }

        // Tworzenie elementów do wyświetlenia
        const firstLine = document.createElement("div");
        firstLine.className = "measurement-first-line";
        firstLine.innerHTML = `<strong>${formattedDate} ${formattedTime} - wynik: ${measurement.value}${unit}</strong>`;

        const secondLine = document.createElement("div");
        secondLine.className = "measurement-second-line";
        secondLine.textContent = description;

        // Dodanie elementów do listy
        item.appendChild(firstLine);
        item.appendChild(secondLine);

        container.appendChild(item);
    });

    console.log(`Measurement list (${listId}): rendered ${measurements.length} items.`);
    saveData(); // Zapisanie danych do localStorage
}

// Funkcja edycji leku
function openEditModal(listId, index) {
    editingListId = listId;
    editingIndex = index;
    let lek;
    if (listId === 'lek-lista-container') {
        lek = leki[index];
    } else if (listId === 'lek-archiwum-container') {
        lek = archiwum[index];
    } else {
        console.warn(`Nieznany listId: ${listId}`);
        return;
    }

    const form = document.getElementById("lekForm");
    if (form) {
        form.nazwa.value = lek.nazwa;
        form.typ.value = lek.typ;

        if (lek.typ === "tabletka") { // Wypełnienie dawki dla tabletki
            form.dawkaTabletki.value = parseFloat(lek.dawka);
            document.getElementById("dawka-tabletki-container").style.display = "block";
            document.getElementById("dawka-ml-container").style.display = "none";
        } else { // Wypełnienie dawki dla syropu
            form.dawkaMl.value = parseInt(lek.dawka);
            document.getElementById("dawka-ml-container").style.display = "block";
            document.getElementById("dawka-tabletki-container").style.display = "none";
        }

        // Ustawienie długości zażywania i częstotliwości
        form.lengthDays.value = lek.lengthDays;
        form.frequencyHours.value = lek.frequencyHours;

        // Ustawienie godziny pierwszej dawki
        form['pierwsza-dawka'].value = lek.time;
    }

    openModal("lekModal"); // Otwórz modal edycji
}

// Obsługa formularza dodawania/edycji leków
document.getElementById("lekForm").addEventListener("submit", (event) => {
    event.preventDefault();

    const nazwa = document.getElementById("nazwa").value.trim();
    const typ = document.getElementById("typ").value;
    const dawka = typ === "tabletka" ? document.getElementById("dawkaTabletki").value.trim() : document.getElementById("dawkaMl").value.trim();
    const pierwszaDawka = document.getElementById("pierwsza-dawka").value;
    const lengthDays = parseInt(document.getElementById("lengthDays").value);
    const frequencyHours = parseInt(document.getElementById("frequencyHours").value);

    // Debugging: Log wartości pól
    console.log("Form Submission:");
    console.log("nazwa:", nazwa);
    console.log("typ:", typ);
    console.log("dawka:", dawka);
    console.log("pierwszaDawka:", pierwszaDawka);
    console.log("lengthDays:", lengthDays);
    console.log("frequencyHours:", frequencyHours);

    if (!nazwa || !typ || !dawka || !pierwszaDawka || isNaN(lengthDays) || isNaN(frequencyHours)) {
        alert("Proszę wypełnić wszystkie wymagane pola.");
        return;
    }

    if (editingIndex !== null && editingListId !== null) {
        let lek;
        if (editingListId === 'lek-lista-container') {
            lek = leki[editingIndex];
            leki[editingIndex] = { 
                ...lek, 
                nazwa, 
                typ, 
                dawka, 
                date: formatDate(new Date()), // Ustawienie daty na bieżącą
                time: pierwszaDawka,
                lengthDays,
                frequencyHours
            };
            console.log(`Lek z indeksem ${editingIndex} został zaktualizowany w Planowanie.`);
        } else if (editingListId === 'lek-archiwum-container') {
            lek = archiwum[editingIndex];
            archiwum[editingIndex] = { 
                ...lek, 
                nazwa, 
                typ, 
                dawka, 
                date: formatDate(new Date()), // Ustawienie daty na bieżącą
                time: pierwszaDawka,
                lengthDays,
                frequencyHours
            };
            console.log(`Lek z indeksem ${editingIndex} został zaktualizowany w Archiwum.`);
        }
        editingIndex = null; // Reset trybu edycji
        editingListId = null;
    } else {
        // Dodanie nowego leku z wieloma rekordami na podstawie długości i częstotliwości
        const now = new Date();
        const startTime = new Date(`${now.toISOString().split('T')[0]}T${pierwszaDawka}`);
        
        for (let day = 0; day < lengthDays; day++) {
            for (let freq = 0; freq < Math.floor(24 / frequencyHours); freq++) {
                const scheduledTime = new Date(startTime.getTime() + day * 24 * 60 * 60 * 1000 + freq * frequencyHours * 60 * 60 * 1000);
                const formattedDate = formatDate(scheduledTime);
                const formattedTime = formatTime(scheduledTime);

                leki.push({
                    nazwa,
                    typ,
                    dawka,
                    date: formattedDate, // Store formatted date for display
                    time: formattedTime, // Store formatted time for display
                    lengthDays,
                    frequencyHours
                });
            }
        }
        console.log(`Dodano nowe leki: ${nazwa}`);
    }

    // Aktualizacja paginacji po dodaniu lub edycji leku
    const totalPages = Math.ceil(leki.length / itemsPerPage) || 1;
    lekPage = totalPages; // Przejście na ostatnią stronę, aby pokazać nowy lek

    renderLekList(); // Odświeżenie listy leków
    updateList('lek-lista-container', lekPage); // Aktualizacja widoku paginacji
    closeModal("lekModal"); // Zamknięcie modala
    saveData(); // Zapisanie danych do localStorage
});

// Funkcja archiwizacji leku
function archiveLek(listId, index) {
    let lek;
    if (listId === 'leki') {
        lek = leki.splice(index, 1)[0]; // Przeniesienie leku do archiwum
    } else {
        console.warn(`Nieznany listId do archiwizacji: ${listId}`);
        return;
    }
    archiwum.push(lek);
    console.log(`Archiwizowano lek: ${lek.nazwa}`);

    // Aktualizacja paginacji po archiwizacji leku
    const totalPages = Math.ceil(leki.length / itemsPerPage) || 1;
    lekPage = lekPage > totalPages ? (totalPages > 0 ? totalPages : 1) : lekPage;

    renderLekList(); // Odświeżenie listy leków
    updateList('lek-lista-container', lekPage); // Aktualizacja widoku paginacji
    renderArchiwumList(); // Odświeżenie listy archiwum
    updateList('lek-archiwum-container', archiwumPage); // Aktualizacja widoku paginacji archiwum
    saveData(); // Zapisanie danych do localStorage
}

// Funkcja do zmiany strony w paginacji
function previousPage(listId) {
    if (listId === 'lek-lista-container' && lekPage > 1) {
        lekPage--;
        updateList(listId, lekPage);
    } else if (listId === 'lek-archiwum-container' && archiwumPage > 1) {
        archiwumPage--;
        updateList(listId, archiwumPage);
    } else if (listId === 'temperature-list' && temperaturePage > 1) {
        temperaturePage--;
        updateList(listId, temperaturePage);
    } else if (listId === 'pressure-list' && pressurePage > 1) {
        pressurePage--;
        updateList(listId, pressurePage);
    } else if (listId === 'saturation-list' && saturationPage > 1) {
        saturationPage--;
        updateList(listId, saturationPage);
    }
}

function nextPage(listId) {
    let totalItems;
    let currentPage;
    switch (listId) {
        case 'lek-lista-container':
            totalItems = leki.length;
            currentPage = lekPage;
            break;
        case 'lek-archiwum-container':
            totalItems = archiwum.length;
            currentPage = archiwumPage;
            break;
        case 'temperature-list':
            totalItems = temperatureReadings.length;
            currentPage = temperaturePage;
            break;
        case 'pressure-list':
            totalItems = pressureReadings.length;
            currentPage = pressurePage;
            break;
        case 'saturation-list':
            totalItems = saturationReadings.length;
            currentPage = saturationPage;
            break;
        default:
            return;
    }

    const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
    if (listId === 'lek-lista-container') {
        if (lekPage < totalPages) {
            lekPage++;
            updateList(listId, lekPage);
        }
    } else if (listId === 'lek-archiwum-container') {
        if (archiwumPage < totalPages) {
            archiwumPage++;
            updateList(listId, archiwumPage);
        }
    } else if (listId === 'temperature-list') {
        if (temperaturePage < totalPages) {
            temperaturePage++;
            updateList(listId, temperaturePage);
        }
    } else if (listId === 'pressure-list') {
        if (pressurePage < totalPages) {
            pressurePage++;
            updateList(listId, pressurePage);
        }
    } else if (listId === 'saturation-list') {
        if (saturationPage < totalPages) {
            saturationPage++;
            updateList(listId, saturationPage);
        }
    }
}

// Funkcja do pokazania odpowiednich elementów w zależności od strony
function updateList(listId, page) {
    console.log(`updateList called for listId: ${listId}, page: ${page}`);
    const listContainer = document.getElementById(listId);
    const itemClass = listItemClasses[listId];
    if (!itemClass) {
        console.warn(`Brak definicji klasy dla listy o ID: ${listId}`);
        return;
    }

    const items = listContainer.querySelectorAll(`.${itemClass}`);
    console.log(`Found ${items.length} items in listId: ${listId}`);
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = page * itemsPerPage;

    items.forEach((item, index) => {
        if (index >= startIndex && index < endIndex) {
            item.style.display = 'flex'; // Używaj 'flex' zamiast 'block'
            // Upewnij się, że flex-direction jest ustawione w CSS
            item.style.alignItems = 'center'; // Wyśrodkowanie elementów
            item.style.justifyContent = 'space-between'; // Rozłożenie elementów
        } else {
            item.style.display = 'none';
        }
    });

    // Zarządzanie widocznością przycisków
    const pagination = paginationButtons[listId];
    if (pagination) {
        const prevBtnId = pagination.prev;
        const nextBtnId = pagination.next;
        const prevBtn = document.getElementById(prevBtnId);
        const nextBtn = document.getElementById(nextBtnId);

        if (prevBtn && nextBtn) {
            prevBtn.disabled = page === 1;
            nextBtn.disabled = endIndex >= items.length;
            console.log(`Pagination buttons for ${listId} updated: prevBtn disabled=${prevBtn.disabled}, nextBtn disabled=${nextBtn.disabled}`);
        } else {
            console.warn(`Pagination buttons dla ${listId} nie zostały znalezione.`);
        }
    } else {
        console.warn(`Brak definicji przycisków paginacji dla listy o ID: ${listId}`);
    }

    // Aktualizacja numerów stron
    const listBaseId = listId.split('-')[0]; // np. 'lek', 'temperature'
    const currentPageSpan = document.getElementById(`${listBaseId}-current-page`);
    const totalPagesSpan = document.getElementById(`${listBaseId}-total-pages`);
    if (currentPageSpan && totalPagesSpan) {
        const totalPages = Math.ceil(items.length / itemsPerPage) || 1;
        currentPageSpan.textContent = page;
        totalPagesSpan.textContent = totalPages;
    }
}

// Funkcja zapisywania temperatury
window.saveTemperature = () => {
    const value = parseFloat(document.getElementById("temperature-value").value);
    console.log("saveTemperature called with value:", value);
    if (value >= 35 && value <= 42) {
        const timestamp = new Date().toISOString(); // Pobranie bieżącej daty i czasu
        temperatureReadings.push({ value, timestamp }); // Dodanie obiektu pomiaru
        console.log("temperatureReadings:", temperatureReadings);
        renderMeasurements("temperature-list", temperatureReadings); // Wyświetlenie odczytów
        updateList('temperature-list', temperaturePage); // Aktualizacja widoku paginacji
        closeModal("temperature-modal"); // Zamknięcie modala
        console.log("temperature-modal closed.");
        saveData(); // Zapisanie danych do localStorage
    } else {
        alert("Nieprawidłowa wartość temperatury.");
    }
};

// Funkcja zapisywania ciśnienia
window.savePressure = () => {
    const systolicInput = document.getElementById("pressure-systolic");
    const diastolicInput = document.getElementById("pressure-diastolic");

    if (!systolicInput || !diastolicInput) {
        console.error("Nie znaleziono elementów wejściowych dla ciśnienia.");
        alert("Wystąpił problem z formularzem ciśnienia. Spróbuj ponownie.");
        return;
    }

    const systolic = parseInt(systolicInput.value);
    const diastolic = parseInt(diastolicInput.value);

    console.log("savePressure called with systolic:", systolic, "diastolic:", diastolic);

    if (isNaN(systolic) || isNaN(diastolic)) {
        alert("Proszę wprowadzić prawidłowe wartości ciśnienia.");
        return;
    }

    if (systolic > 0 && diastolic > 0) {
        const value = `${systolic}/${diastolic}`;
        const timestamp = new Date().toISOString();
        const newMeasurement = { value, timestamp };
        pressureReadings.push(newMeasurement);
        console.log("Dodano pomiar ciśnienia:", newMeasurement);
        console.log("Aktualne pressureReadings:", pressureReadings);
        renderMeasurements("pressure-list", pressureReadings); // Wyświetlenie odczytów
        updateList('pressure-list', pressurePage); // Aktualizacja widoku paginacji
        closeModal("pressure-modal"); // Zamknięcie modala
        console.log("pressure-modal closed.");
        saveData(); // Zapisanie danych do localStorage
    } else {
        alert("Nieprawidłowe wartości ciśnienia.");
    }
};

// Funkcja zapisywania saturacji
window.saveSaturation = () => {
    const value = parseInt(document.getElementById("saturation-value").value);
    console.log("saveSaturation called with value:", value);
    if (value >= 70 && value <= 100) {
        const timestamp = new Date().toISOString();
        saturationReadings.push({ value, timestamp });
        console.log("saturationReadings:", saturationReadings);
        renderMeasurements("saturation-list", saturationReadings);
        updateList('saturation-list', saturationPage); // Aktualizacja widoku paginacji
        closeModal("saturation-modal"); // Zamknięcie modala
        console.log("saturation-modal closed.");
        saveData(); // Zapisanie danych do localStorage
    } else {
        alert("Nieprawidłowa wartość saturacji.");
    }
};

// Funkcja do załadowania danych z pliku RL.json
function loadDrugsFromFile() {
    fetch('json/RL.json') // Upewnij się, że plik RL.json jest w tej samej lokalizacji co strona
        .then(response => response.json())
        .then(data => {
            leki = data; // Przypisz dane do tablicy leki
        })
        .catch(error => console.error('Błąd wczytywania pliku RL.json:', error));
}

// Wywołanie funkcji podczas ładowania strony
document.addEventListener('DOMContentLoaded', () => {
    loadDrugsFromFile();
});

// Funkcja filtrowania leków
function filterDrugs(query) {
    return leki.filter(drug =>
        drug.nazwa.toLowerCase().includes(query.toLowerCase())
    );
}

// Renderowanie sugestii
function renderSuggestions(suggestions) {
    suggestionsContainer.innerHTML = "";
    suggestions.forEach(suggestion => {
        const suggestionDiv = document.createElement("div");
        suggestionDiv.className = "suggestion";
        suggestionDiv.textContent = suggestion.nazwa;
        suggestionDiv.addEventListener("click", () => {
            nazwaInput.value = suggestion.nazwa;
            suggestionsContainer.innerHTML = "";
        });
        suggestionsContainer.appendChild(suggestionDiv);
    });
}

// Obsługa pola nazwa
const nazwaInput = document.getElementById("nazwa");
const suggestionsContainer = document.getElementById("suggestionsContainer");

nazwaInput.addEventListener("input", (event) => {
    const query = event.target.value.toLowerCase();

    if (query.length >= 4) { // Zmienione na 4 znaki
        const filteredLeki = filterDrugs(query); // Filtruj leki na podstawie zapytania
        renderSuggestions(filteredLeki.slice(0, 10)); // Wyświetl maksymalnie 10 sugestii
    } else {
        suggestionsContainer.innerHTML = ""; // Wyczyść sugestie, jeśli zapytanie jest za krótkie
    }
});
