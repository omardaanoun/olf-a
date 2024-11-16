function getUserLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {
            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;

            const apiKey = '49d3ed2bac634b169aa80945715736d4';
            const url = `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=${apiKey}`;

            fetch(url)
                .then(response => response.json())
                .then(data => {
                    if (data.results && data.results.length > 0) {
                        const cityName = data.results[0].components.city || data.results[0].components.town || "City not found";
                        document.getElementById('city-name').textContent = cityName;
                    } else {
                        document.getElementById('city-name').textContent = "Location not found";
                    }
                })
                .catch(error => {
                    console.error("Error fetching city name:", error);
                    document.getElementById('city-name').textContent = "Error fetching location";
                });
        });
    } else {
        document.getElementById('city-name').textContent = "Geolocation not supported";
    }
}

getUserLocation();

// xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
let currentDate = new Date();

async function fetchPrayerTimes(latitude, longitude, date) {
    const formattedDate = date.toISOString().split('T')[0];
    const url = `http://api.aladhan.com/v1/timings/${formattedDate}?latitude=${latitude}&longitude=${longitude}&method=2`;
    const response = await fetch(url);
    const data = await response.json();
    const timings = data.data.timings;

    function adjustTime(prayerTime) {
        const prayerDate = new Date(`1970-01-01T${prayerTime}Z`);
        prayerDate.setHours(prayerDate.getHours() + 1);
        return prayerDate.toISOString().substring(11, 19);
    }

    return {
        Fajr: adjustTime(timings.Fajr),
        Sunrise: adjustTime(timings.Sunrise),
        Dhuhr: adjustTime(timings.Dhuhr),
        Asr: adjustTime(timings.Asr),
        Maghrib: adjustTime(timings.Maghrib),
        Isha: adjustTime(timings.Isha),
    };
}

async function updatePrayerInfo(date) {
    const latitude = 34.0209;
    const longitude = 6.7987;

    const prayerTimes = await fetchPrayerTimes(latitude, longitude, date);
    const hijriDate = new Date(date).toLocaleDateString('ar-SA-u-ca-islamic');
    const gregorianDate = new Date(date).toLocaleDateString('en-US');

    document.getElementById('hijri-date').textContent = hijriDate;
    document.getElementById('gregorian-date').textContent = gregorianDate;

    document.getElementById('fajr-time').textContent = prayerTimes.Fajr;
    document.getElementById('chourouq-time').textContent = prayerTimes.Sunrise;
    document.getElementById('dhuhr-time').textContent = prayerTimes.Dhuhr;
    document.getElementById('asr-time').textContent = prayerTimes.Asr;
    document.getElementById('maghrib-time').textContent = prayerTimes.Maghrib;
    document.getElementById('ishaa-time').textContent = prayerTimes.Isha;

    let currentPrayer = getNextPrayer(prayerTimes, new Date());
    updateCurrentPrayerDisplay(currentPrayer, prayerTimes);

    const countdownInterval = setInterval(() => {
        const now = new Date();
        const nextPrayer = getNextPrayer(prayerTimes, now);

        if (nextPrayer !== currentPrayer) {
            currentPrayer = nextPrayer;
            updateCurrentPrayerDisplay(currentPrayer, prayerTimes);
        }

        if (!currentPrayer) {
            clearInterval(countdownInterval);
            document.getElementById('remaining-time').textContent = "";
            return;
        }

        const updatedRemainingTime = getRemainingTime(prayerTimes[currentPrayer]);
        document.getElementById('remaining-time').textContent = updatedRemainingTime;
    }, 1000);
}

function getNextPrayer(prayerTimes, now) {
    for (const prayer in prayerTimes) {
        const prayerTime = prayerTimes[prayer];
        const prayerDate = new Date(now.toDateString() + ' ' + prayerTime);
        if (now < prayerDate) {
            return prayer;
        }
    }
    return null;
}

function updateCurrentPrayerDisplay(currentPrayer, prayerTimes) {
    const prayerNameElement = document.getElementById('prayer-name');
    const remainingTimeElement = document.getElementById('remaining-time');

    const prayerBoxes = document.querySelectorAll('.prayer-time-box');
    prayerBoxes.forEach(box => box.classList.remove('prayer-time-selected'));

    if (currentPrayer) {
        prayerNameElement.textContent = currentPrayer.charAt(0).toUpperCase() + currentPrayer.slice(1);
        remainingTimeElement.textContent = getRemainingTime(prayerTimes[currentPrayer]);

        const currentPrayerBox = Array.from(prayerBoxes).find(box => {
            const prayerLabel = box.querySelector('span').textContent.trim().toLowerCase();
            return prayerLabel === currentPrayer.toLowerCase();
        });

        if (currentPrayerBox) {
            currentPrayerBox.classList.add('prayer-time-selected');
        }
    } else {
        prayerNameElement.textContent = "No more prayers today";
        remainingTimeElement.textContent = "";
    }
}


function getRemainingTime(prayerTime) {
    const now = new Date();
    const prayerDate = new Date(now.toDateString() + ' ' + prayerTime);
    const timeDiff = prayerDate - now;

    if (timeDiff < 0) return "Prayer has passed today";

    const hoursLeft = Math.floor(timeDiff / (1000 * 60 * 60));
    const minutesLeft = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    const secondsLeft = Math.floor((timeDiff % (1000 * 60)) / 1000);
    return `${hoursLeft}:${minutesLeft < 10 ? '0' + minutesLeft : minutesLeft}:${secondsLeft < 10 ? '0' + secondsLeft : secondsLeft}`;
}

function changeDate(days) {
    const newDate = new Date(currentDate.getTime() + days * 86400000);
    currentDate = newDate;
    updatePrayerInfo(currentDate);
}

updatePrayerInfo(currentDate);
