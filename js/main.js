// Locations of good places to eat in Midtown Atlanta, GA.
let places = [
    {
        "name": "The Vortex Bar and Grill",
        "location": {
            "lat": 33.7790465,
            "lng": -84.3866265
        },
        "address": "878 Peachtree St NE, Atlanta, GA 30309"
    },
    {
        "name": "Five Guys",
        "location": {
            "lat": 33.778124,
            "lng": -84.3867867
        },
        "address": "860 Peachtree St NE, Atlanta, GA 30308"
    },
    {
        "name": "Escorpion",
        "location": {
            "lat": 33.7763668,
            "lng": -84.3870253
        },
        "address": "800 Peachtree St NE Ste. F, Atlanta, GA 30308"
    },
    {
        "name": "Baraonda Ristorante & Bar",
        "location": {
            "lat": 33.7763668,
            "lng": -84.3870253
        },
        "address": "710 Peachtree St NE, Atlanta, GA 30308"
    },
    {
        "name": "Papi's Cuban & Caribbean Grill",
        "location": {
            "lat": 33.7730966,
            "lng": -84.3841004
        },
        "address": "216 Ponce De Leon Ave NE, Atlanta, GA 30308"
    },
    {
        "name": "Takorea",
        "location": {
            "lat": 33.7790774,
            "lng": -84.3843003
        },
        "address": "818 Juniper St NE, Atlanta, GA 30308"
    }
];

let map;
let infoWindow;
let bounds;

function initGoogleMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 13,
        center: {
            lat: 33.776417,
            lng: -84.383734
        },
        mapTypeControl: false
    });

    infoWindow = new google.maps.InfoWindow();
    bounds = new google.maps.LatLngBounds();
    ko.applyBindings(new ViewModel());
}

let markerLoc = function(data) {
    let that = this;

    this.name = data.name;
    this.position = data.location;
    this.street = '',
    this.city = '',
    this.visible = ko.observable(true);

    // Set the colors of the marker icon variable when clicked or not clicked here (nice early Christmas colors)
    let greenIcon = makeMarkerIcon('05B23C');
    let redIcon = makeMarkerIcon('F01507');

    // Set the Foursquare ID and Secret to variables
    let fsID = 'I5ZITZA3CLQTN5AZPPSZPDTNEOD0NAFLGOEIZN5HRR5UTRQ0';
    let fsSecret = 'GNOJABSFXAG24MGAIX2WHWXVUZBQGERB2SIGBYAFC2I1NX0Y';

    // Make call to Foursquare api to get results
    $.ajax({
        type: 'GET',
        dataType: "json",
        data: {
            client_id: fsID,
            client_secret: fsSecret,
            query: this.name,
            ll: this.position.lat + ',' + this.position.lng,
            v: 20190419
        },
        url: 'https://api.foursquare.com/v2/venues/search',

    }).done(function (data) {
        let results = data.response.venues[0];
        that.street = results.location.address ? results.location.address : 'N/A';
        that.city = results.location.city ? results.location.city : 'N/A';
        that.state = results.location.state ? results.location.state : 'N/A';
        that.postalCode = results.location.postalCode ? results.location.postalCode : 'N/A';
    }).fail(function (error) {
        alert('Could not connect to API. Please refresh page and try again.');
    });

    // Create an array for each marker and the detail of its location
    this.marker = new google.maps.Marker({
        position: this.position,
        name: this.name,
        animation: google.maps.Animation.DROP,
        icon: greenIcon
    });

    that.filterMarkers = ko.computed(function() {
        if (that.visible() === true) {
            that.marker.setMap(map);
            bounds.extend(that.marker.position);
            map.fitBounds(bounds);
        } else {
            that.marker.setMap(null);
        }
    });

    // Click listener to show infowindow and details when marker is clicked
    this.marker.addListener('click', function() {
        infoWindowDetails(this, that.street, that.city, that.state, that.postalCode, infoWindow);
        toggleMarkerAnimation(this);
        map.panTo(this.getPosition());
    });

    // Make marker bounce when clicked
    this.bounce = function(place) {
        google.maps.event.trigger(that.marker, 'click');
    };

    // Mouseover and Mouseout listeners to change color of marker dynamically
    this.marker.addListener('mouseover', function() {
        this.setIcon(redIcon);
    });
    this.marker.addListener('mouseout', function() {
        this.setIcon(greenIcon);
    });

    // Click listener to show details of marker when clicked
    this.show = function(location) {
        google.maps.event.trigger(that.marker, 'click');
    };
};

/* View Model */
let ViewModel = function() {
    let that = this;

    // Set input and list vars
    this.input = ko.observable('');
    this.list = ko.observableArray([]);

    // Drops a marker for each location
    places.forEach(function(loc) {
        that.list.push(new markerLoc(loc));
    });

    this.locationList = ko.computed(function() {
        let inputFilter = that.input().toLowerCase();
        if (inputFilter) {
            return ko.utils.arrayFilter(that.list(), function(loc) {
                let str = loc.name.toLowerCase();
                let res = str.includes(inputFilter);
                loc.visible(res);
                return res;
            });
        }
        that.list().forEach(function(location) {
            location.visible(true);
        });
        return that.list();
    }, that);
};

// Function to set details format of the infowindow
function infoWindowDetails(marker, street, city, state, postalCode, infowindow) {
        infowindow.marker = marker;

        // Add click event to close out infowindow manually
        infowindow.addListener('closeclick', function() {
            infowindow.marker = null;
        });

        // Set content of the infowindow
        let infoWindowContents = '<h4>' + marker.name + '</h4>' +
            '<p>' + street + "<br>" + city + ", " + state + " " + postalCode + "</p>";

        infowindow.setContent(infoWindowContents);
        infowindow.open(map, marker);
}

// Will start animation if marker is clicked.
function toggleMarkerAnimation(marker) {
    if (marker.getAnimation() !== null) {
        marker.setAnimation(null);
    } else {
        marker.setAnimation(google.maps.Animation.BOUNCE);
        // Stop marker bounce soon after it starts automatically
        setTimeout(function(){
            marker.setAnimation(null);
        },1100);
    }
}

/*
Used code from Udacity ud864 Project 9 tutorial
 */
function makeMarkerIcon(markerColor) {
    let markerImage = new google.maps.MarkerImage(
        'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|' + markerColor +
        '|40|_|%E2%80%A2',
        new google.maps.Size(21, 34),
        new google.maps.Point(0, 0),
        new google.maps.Point(10, 34),
        new google.maps.Size(21, 34));
    return markerImage;
}

// Notifies when any error has occurred
function googleError() {
    alert('Something went wrong with Google Maps. Reload your page and try again.');
}