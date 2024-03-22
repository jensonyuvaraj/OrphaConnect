const apiKey = 'AIzaSyDkaHR7AEGMvaLN26kcF7azLgfPVxnGxd8';
        let map;
        let marker;

        function initMap() {
            map = new google.maps.Map(document.getElementById('map'), {
                center: { lat: 0, lng: 0 },
                zoom: 10
            });

            map.addListener('click', function (event) {
                placeMarker(event.latLng);
            });
        }

        function placeMarker(location) {
            if (marker && marker.setMap) {
                marker.setMap(null);
            }

            marker = new google.maps.Marker({
                position: location,
                map: map,
                draggable: true
            });

            document.getElementById('address').innerText = location.lat() + ', ' + location.lng();

            reverseGeocode(location.lat(), location.lng());
        }

        function reverseGeocode(lat, lng) {
            const geocoder = new google.maps.Geocoder();
            const latLng = new google.maps.LatLng(lat, lng);

            geocoder.geocode({ 'location': latLng }, function (results, status) {
                if (status === 'OK') {
                    if (results[0]) {
                        const formattedAddress = results[0].formatted_address;
                        console.log('Formatted Address: ' + formattedAddress);

                        document.getElementById('address').value += ' \n' + formattedAddress;
                    } else {
                        console.log('No results found');
                    }
                } else {
                    console.log('Geocoder failed due to: ' + status);
                }
            });
        }