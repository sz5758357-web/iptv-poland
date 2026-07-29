const video = document.getElementById("video");
const channelsDiv = document.getElementById("channels");
const search = document.getElementById("search");
const epg = document.getElementById("epg");

let hls;
let channels = [];
let currentGroup = "Wszystkie";

const favorites = JSON.parse(localStorage.getItem("favorites")) || [];

fetch("channels.m3u")
.then(r => r.text())
.then(text => {

    const lines = text.split("\n");

    for(let i=0;i<lines.length;i++){

        if(lines[i].startsWith("#EXTINF")){

            const info = lines[i];

            const group =
                info.match(/group-title="([^"]+)"/)?.[1] || "Inne";

            const name =
                info.split(",").pop().trim();

            const url = lines[i+1]?.trim();

            if(url && url.startsWith("http")){

                channels.push({

                    name,
                    group,
                    url,
                    logo:"logo/"+name.toLowerCase()
                        .replace(/ /g,"")
                        .replace(/\+/g,"plus")
                        .replace(/\./g,"")
                        +".png"

                });

            }

        }

    }

    render();

});

function render(){

    channelsDiv.innerHTML="";

    const text = search.value.toLowerCase();

    channels
    .filter(ch=>{

        const okName =
        ch.name.toLowerCase().includes(text);

        const okGroup =
        currentGroup==="Wszystkie" ||
        (currentGroup==="Ulubione"
            ? favorites.includes(ch.name)
            : ch.group===currentGroup);

        return okName && okGroup;

    })
    .forEach(ch=>{

        const card=document.createElement("div");
        card.className="channel";

        const fav=favorites.includes(ch.name);

        card.innerHTML=`

            <img src="${ch.logo}"
            onerror="this.src='logo/default.png'">

            <div class="channel-info">

                <div class="channel-name">
                    ${ch.name}
                </div>

                <div class="channel-group">
                    ${ch.group}
                </div>

            </div>

            <div class="favorite ${fav?"active":""}">
                ★
            </div>

        `;

        card.onclick=()=>play(ch);

        card.querySelector(".favorite")
        .onclick=(e)=>{

            e.stopPropagation();

            if(favorites.includes(ch.name)){

                favorites.splice(
                    favorites.indexOf(ch.name),1
                );

            }else{

                favorites.push(ch.name);

            }

            localStorage.setItem(
                "favorites",
                JSON.stringify(favorites)
            );

            render();

        };

        channelsDiv.appendChild(card);

    });

}

function play(channel){

    if(hls){

        hls.destroy();

    }

    if(Hls.isSupported()){

        hls=new Hls();

        hls.loadSource(channel.url);

        hls.attachMedia(video);

    }else{

        video.src=channel.url;

    }

    epg.innerHTML=`

    <b>${channel.name}</b><br><br>

    20:00 Program 1<br>
    20:30 Program 2<br>
    21:00 Program 3<br>
    22:00 Program 4

    `;

}

search.oninput=render;

document.querySelectorAll(".category")
.forEach(btn=>{

    btn.onclick=()=>{

        document
        .querySelectorAll(".category")
        .forEach(b=>b.classList.remove("active"));

        btn.classList.add("active");

        currentGroup=btn.dataset.group;

        render();

    };

});