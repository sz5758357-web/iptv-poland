document.addEventListener("DOMContentLoaded", () => {
    const video = document.getElementById("video");
    const channelsDiv = document.getElementById("channels");
    const search = document.getElementById("search");
    const epg = document.getElementById("epg");

    let hls;
    let channels = [];
    let currentGroup = "Wszystkie";

    const favorites = JSON.parse(localStorage.getItem("favorites")) || [];

    // Pobieranie i parsowanie pliku m3u
    fetch("channels.m3u")
    .then(r => r.text())
    .then(text => {
        const lines = text.split("\n");

        for (let i = 0; i < lines.length; i++) {
            if (lines[i].startsWith("#EXTINF")) {
                const info = lines[i];

                const group = info.match(/group-title="([^"]+)"/)?.[1] || "Inne";
                const name = info.split(",").pop().trim();
                const url = lines[i + 1]?.trim();

                if (url && url.startsWith("http")) {
                    channels.push({
                        name,
                        group,
                        url,
                        logo: "logo/" + name.toLowerCase()
                            .replace(/ /g, "")
                            .replace(/\+/g, "plus")
                            .replace(/\./g, "")
                            + ".png"
                    });
                }
            }
        }

        render();
    })
    .catch(err => console.error("Błąd ładowania listy kanałów:", err));

    function render() {
        if (!channelsDiv) return;
        channelsDiv.innerHTML = "";

        const text = search ? search.value.toLowerCase() : "";

        channels
        .filter(ch => {
            const okName = ch.name.toLowerCase().includes(text);
            const okGroup = currentGroup === "Wszystkie" ||
            (currentGroup === "Ulubione"
                ? favorites.includes(ch.name)
                : ch.group === currentGroup);

            return okName && okGroup;
        })
        .forEach(ch => {
            const card = document.createElement("div");
            card.className = "channel";

            const fav = favorites.includes(ch.name);

            card.innerHTML = `
                <img src="${ch.logo}" onerror="this.src='logo/default.png'">
                <div class="channel-info">
                    <div class="channel-name">${ch.name}</div>
                    <div class="channel-group">${ch.group}</div>
                </div>
                <div class="favorite ${fav ? "active" : ""}">★</div>
            `;

            card.onclick = () => {
                play(ch);
                // Na telefonie po kliknięciu w kanał automatycznie przełącz widok na odtwarzacz
                if (window.innerWidth <= 768) {
                    switchMobileTab('player');
                }
            };

            card.querySelector(".favorite").onclick = (e) => {
                e.stopPropagation();

                if (favorites.includes(ch.name)) {
                    favorites.splice(favorites.indexOf(ch.name), 1);
                } else {
                    favorites.push(ch.name);
                }

                localStorage.setItem("favorites", JSON.stringify(favorites));
                render();
            };

            channelsDiv.appendChild(card);
        });
    }

    function play(channel) {
        if (!video) return;
        if (hls) {
            hls.destroy();
        }

        if (Hls.isSupported()) {
            hls = new Hls();
            hls.loadSource(channel.url);
            hls.attachMedia(video);
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = channel.url;
        } else {
            video.src = channel.url;
        }

        video.play().catch(e => console.log("Autoplay zablokowany:", e));

        if (epg) {
            epg.innerHTML = `
                <b>${channel.name}</b><br><br>
                20:00 Program telewizyjny / Transmisja<br>
                21:00 Pasmo wieczorne<br>
                22:30 Wydarzenia dnia
            `;
        }
    }

    if (search) {
        search.oninput = render;
    }

    // Obsługa kategorii
    document.querySelectorAll(".category").forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll(".category").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            currentGroup = btn.dataset.group;
            render();

            // Na telefonie po wybraniu kategorii przejdź automatycznie do listy kanałów
            if (window.innerWidth <= 768) {
                switchMobileTab('channels');
            }
        };
    });

    // Funkcja zarządzająca zakładkami mobilnymi
    window.switchMobileTab = function(target) {
        const content = document.getElementById("content-view");
        const channelsView = document.getElementById("channels-view");
        const sidebar = document.getElementById("sidebar");
        const mobBtns = document.querySelectorAll(".mob-btn");

        if (!content || !channelsView || !sidebar) return;

        content.classList.remove("mobile-active");
        channelsView.classList.remove("mobile-active");
        sidebar.classList.remove("mobile-active");

        mobBtns.forEach(b => b.classList.remove("active"));

        if (target === 'player') {
            content.classList.add("mobile-active");
            mobBtns[0]?.classList.add("active");
        } else if (target === 'channels') {
            channelsView.classList.add("mobile-active");
            mobBtns[1]?.classList.add("active");
        } else if (target === 'categories') {
            sidebar.classList.add("mobile-active");
            mobBtns[2]?.classList.add("active");
        }
    };

    // Podpięcie przycisków dolnego paska mobilnego
    document.querySelectorAll(".mob-btn").forEach(btn => {
        btn.onclick = () => {
            const target = btn.dataset.target;
            switchMobileTab(target);
        };
    });

    // Inicjalizacja domyślnego widoku na telefonie
    if (window.innerWidth <= 768) {
        switchMobileTab('player');
    }
});
