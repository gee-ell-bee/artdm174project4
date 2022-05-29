import { Locat } from "./locat.js"; // import API keys
import { caCities } from "./ca-cities-json.js"; // import cities data
import { allStatesData } from "./geojson.js"; // geoJSON data

// blank array for new states data collection
let otherStates = new StateCollection();

// filter out CA from states data
for (let i = 0; i < allStatesData.features.length; i++) {
    let state = allStatesData.features[i];
    if (state.properties.name !== "California") {
        // place in new states data array
        otherStates.features.push(state);
    };
};

// create global vars
 //onLoad animation html elem
 const curtain = document.getElementById("curtain");

 // offsetting spacing for header
 var header = document.querySelector("header").offsetHeight;
 let main = document.querySelector("#main").style;
 let docHtml = document.querySelector("html").style;

 //for HTML Form
 const searchButton = document.getElementById("button");
 const searchField = document.getElementById("search");
 const url = "";
 const errors = document.getElementById("err");

 //for parks
 //park list html elem
 let list = document.getElementById("parkList");
 //convert cities import data to constant
 const caCitiesData = caCities;
 //vars for place info use
 let placeElem = document.getElementById("placeName");
 var placeName = "Alamo";
 var placeLat = 37.85020000;
 var placeLon = -122.03218000;
 var place = {
    name: placeName,
    nameUniversal: placeName.toUpperCase(),
    lat: placeLat,
    lon: placeLon,
    id: "ca111093",

    top: function(lat) {
        return lat + 0.51;
    },
    left: function(lon) {
        return lon - 0.51;
    },
    btm: function(lat) {
        return lat - 0.51;
    },
    right: function(lon) {
        return lon + 0.51;
    }
 };

// ************* INIT MAP ******************************
// max map bounds vars
 const topRightBounds = L.latLng(45.565931, -96.724056);
 const btmLeftBounds = L.latLng(29.710447, -143.349077);
 const latLngBounds = L.latLngBounds(btmLeftBounds, topRightBounds);

//  // handler for button link to map event
//  L.LinkToMap = L.Handler.extend({
//     addHooks: function(e) {
//         let target = e.target;
//         L.DomEvent.on(target, "click dbclick", this._highlight, this);
//     },

//     removeHooks: function(e) {
//         let target = e.target;
//         L.DomEvent.off(target, "click", this._highlight, this);
//     },

//     _highlight: function(e) {
//        let marker = get(`m${e}`);
//        this._marker.popupopen;
//     }
// });

// L.Map.addInitHook('addHandler', 'highlight', L.LinkToMap);

 let map = L.map("map", {maxBounds: latLngBounds, highlight: true}).setView([place.lat, place.lon], 10);
 L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}{r}.png", {
    attribution: "&copy; <a href='https://www.openstreetmap.org/copyright'>OSM</a> contributors &copy; <a href='https://carto.com/attributions'>CARTO</a>",
    subdomains: "abcd",
    minZoom: 5,
    maxZoom: 20})
    .addTo(map);

// deaccentuate other states w/ GeoJSON
L.geoJson(otherStates).setStyle({
        stroke: false,
        fillColor: "#a3a3a3",
        fillOpacity: .7,
        interactive: false
    })
    .addTo(map);

// create layer group for all parks in place range
 let parksLayer = L.layerGroup([]).addTo(map);

// init You Are Here Marker
 let youreHereMarker = L.circleMarker([place.lat, place.lon], {
    opacity: .7,
    radius: 7,
    fillOpacity: .3,
    title: place.name,
    alt: "Originating Place"
 })
    .on("move", function() { //event listener: rename marker when place name changes
        youreHereMarker.setPopupContent(`<h2>${place.name}</h2>`);
    })
    .addTo(map)
    .bindPopup(`<h2>${place.name}</h2>`)
 ;

 // create custom icon, coded & designed by Alex Maddux
  //for park markers in filterParks()
 var mapIcon = L.icon({
    iconUrl: 'images/pin.png',
    iconSize: [48, 50], // size of the icon
 });

//  **************** ACTUAL SCRIPTS RUN ON PAGE ********************************
        // add initial data & search button functionality
        document.addEventListener("DOMContentLoaded", init);

        window.addEventListener("resize", () => {
            var header = document.querySelector("header").offsetHeight;
            docHtml = header + "px";
        });



        // attach curtain animation to document
        document.onLoad = onFirstLoad();

// **************** FUNCTIONS ***************************************************
function init() {
    // find initial scroll offset
    main.marginTop = header + "px";
    docHtml.scrollPaddingTop = header + "px";

    // show data
        // update placeholder & title text to match initial
        updateHTMLElem();
        // show parsed parks data points
        connectIds();

    // event listener to implement searchbar
     searchButton.addEventListener("click", search);
};

// NOT CURRENTLY IN USE
function searchInput(e) { // update recommended places list as user types
    // get search input
     let value = e.target.value;
    // check value
     console.log(value);
};

async function search(e) { // final search function; connector of all search asyncs
    try {
        // prevent page reload
        e.preventDefault();

        // wait for content to refresh
        await searchCities();
        onLaterLoad();
        await removeParks();
        await filterParks();
        await connectIds();
        
        // then update entire page
        refreshWholeApp();

    } catch(err) {
        console.log("Search Error:", err);
    };
};

    async function removeParks() { // clear previous data
        // remove old park markers
        parksLayer.clearLayers();

        // remove old park list items
        list.innerHTML = "";
    };

    function getSearch() { // get search input from searchbar
        // identify search input
        let searchValue = searchField.value.toUpperCase();
        searchField.value = "";
        return searchValue;
    };

    async function searchCities() { // compare search input to cities data
        try {
            let newPlace = await getSearch();
            if(errors.innerHTML !== "") {
                errors.innerHTML = "";
            };

            if(newPlace == "") {
                throw "Enter a place in California for new results";
            };

            if(newPlace == place.nameUniversal) {
                throw `&#8220;<span class="universal">${newPlace}</span>&#8221; results are already displayed below`;};

            let exists = false;
            // for loop to scan through cities
            for (let i = 0; i < caCitiesData.length; i++) {
                // labeling for clarity: as if wrote "forEach((caCity) =>)"
                let caCity = caCitiesData[i];
                // specifying the city data object
                let cityData = caCity.city;
                // if search name matches the city name
                if(newPlace == cityData.nameUniversal) {
                    exists = true;
                    // then replace old map place data with new place's data
                    place.name = cityData.name;
                    place.nameUniversal = cityData.nameUniversal;
                    place.lat = Number(cityData.lat);
                    place.lon = Number(cityData.lon);
                    place.id = cityData.id;
                    return place;
                };
            };
            if (exists == false) {
                throw `&#8220;<span class="universal">${newPlace}</span>&#8221; is not in the database`;
            };
        } catch(err) {
            errors.innerHTML = `<p><strong>Search Error:</strong> ${err}</p>`;
        };
    };

async function refreshWholeApp() { // updates elements that weren't cleared out with the new data
    // update placeholder & title to match new place
     updateHTMLElem();
    // update map data
     refreshMap();
};

    function updateHTMLElem() {
        // update placeholder & title to match new place
        updatePlaceholder();
        updateTitle();
    };

        function updatePlaceholder() {
            // change placeholder text to currently search place
            searchField.placeholder = place.name;
        };

        function updateTitle() {
            // update title span contents
            placeElem.innerHTML = `${place.name}`;
        };

    async function refreshMap() {
        // update map elem
        map.setView([place.lat, place.lon]);
        // update You Are Here Marker
        youreHereMarker.setLatLng([place.lat, place.lon]);
    };

async function getParks() { // get tomtom parks data
    try {
        let response = await fetch(`https://api.tomtom.com/search/2/poiSearch/dog+park.json?key=${Locat.tom.pass}&limit=100&ofs=0&countryset=US&lat=${place.lat}&lon=${place.lon}&topLeft=${place.top(place.lat)},${place.left(place.lon)}&btmRight=${place.btm(place.lat)},${place.right(place.lon)}&language=en-US&categoryset=9362&relatedpois=all`);
        let baseData = await response.json();
        let data = baseData.results;
        return data;
    } catch(err) {
        console.log("Parks Fetch Error:", err);
    };
};

function getParkMarker(marker) {
    parkMarker = document.getElementById(marker);
    parkMarker.togglePopup();
};

async function filterParks() {
    try {
        // get park data from getParks f(x)
        let fullList = await getParks();
        // clear existing content
        list.innerHTML = "";
        // iterate through parks
        fullList.forEach((park) => {
            // filter to parks within limit range
            if(park.position.lon < place.right(place.lon)
                && park.position.lon > place.left(place.lon)) {
                if(park.position.lat > place.btm(place.lat)
                && park.position.lat < place.top(place.lat)) {
                    // create a Park object for each park
                     var parkContent = new Park(park.id, park.position.lat, park.position.lon, park.poi.name, park.address.freeformAddress);
                        
                        // LIST ITEM for each park
                            // create list item
                            let newLI = new DocumentFragment;
                            let newListItem = document.createElement("LI");
                            newListItem.classList.add("park");
                            // add identifier
                            newListItem.id = `p${parkContent.id}`;
                            // populate list item
                            newListItem.innerHTML = `<h1>${parkContent.name}</h1>
                                <p class="address">${parkContent.address}</p>
                                <div class="marker links">
                                    <a class="toMap" href="#m${park.id}">View on Map</a>
                                    <a class="googleMap" target="_blank" href="https://www.google.com/maps/search/${parkContent.nameUrl}/@${parkContent.lat},${parkContent.lon}">Directions</a>
                                </div>`;
                            // append list item to list
                            newLI.appendChild(newListItem);
                            list.appendChild(newLI);
                            
                        // PLOT POINT for park
                             var parkMarker = L.marker(
                                [park.position.lat, park.position.lon], {icon: mapIcon, title: park.poi.name, alt: `Park marker for ${park.poi.name}`}).addTo(parksLayer)
                             // create pop-up with basic info
                              .bindPopup(`<h1>${park.poi.name}</h1>
                                <p><a href="${url}#p${parkContent.id}">Details</a></p>`)
                             // event listener to open popup
                             ;
                            
                            // add id for plot point
                             parkMarker.getElement().id = `m${park.id}`;
                };
            };
        });
    } catch(err) {
        console.log("Parks Filter Error:", err)
    };
};

async function connectIds() {
    await filterParks();
    // html element for handler
    var newLinkList = document.querySelectorAll(".toMap");
    console.log(newLinkList);
    newLinkList.forEach(link => {
        const id = link.id;
        const marker = document.getElementById(`m${id}`);
        console.log(marker);
    });
}


// *********************** CONSTRUCTORS *********************************
// park constructor
function Park(id, lat, lon, name, address) {
    // server-side info
     this.id = id; // for linking html elem from map marker
     this.lat = lat;
     this.lon = lon;
     this.nameUrl = name.replaceAll(" ", "+");

    // client-side info
     this.name = name;
     this.address = address;
     this.favorite = false; // for caching
};

function StateCollection() {
    this.features = [];
    this.type = "FeatureCollection";
}

// onLoad Curtain
function onFirstLoad() { // initial curtain function
    curtain.addEventListener("animationend", toggleAfterClass);
    openCurtains();
};

    function toggleAfterClass() { // remove "after" class
        curtain.classList.toggle("after");
    };

function onLaterLoad() { // reload page (after searching places) curtain function
    curtain.classList.toggle("opened");
    openCurtains();
};

function openCurtains() { // start curtain animation
    // on start animation
    curtain.classList.toggle("opened");
};