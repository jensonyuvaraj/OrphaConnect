function fetchDataAndCreateContainers() {
    var postcontainer = document.querySelector(".post-container");
    postcontainer.innerHTML = ''; // Clear existing content
    
    fetch('data.json')
        .then(response => response.json())
        .then(data => {            
            data.forEach(item => {
                var postContent = document.createElement('div');
                postContent.className = 'post-content';

                var itemName = item.foodType ? item.foodType : item.productItem;

                var itemSpan = document.createElement('span');
                itemSpan.className = 'item-name';
                itemSpan.textContent = itemName;
                postContent.appendChild(itemSpan);

                var imageContainer = document.createElement('div');
                imageContainer.className = 'image-container';
                var image = document.createElement('img');
                var defaultImagePath = item.foodType ? 'images/Food.jpg' : 'images/Product.jpeg';
                var imagePath = item.image || defaultImagePath;
                image.src = imagePath;
                image.alt = 'Item Image';
                imageContainer.appendChild(image);
                postContent.appendChild(imageContainer);

                var locationPara = document.createElement('p');
                var locationWrapper = document.createElement('div'); // Wrap location and sub-container
                locationPara.className = 'location';
                locationPara.innerHTML = '<b>Location: </b>' + item.location;
                locationPara.addEventListener('mouseover', showSubContainer);
                locationPara.addEventListener('mouseout', hideSubContainer);
                locationWrapper.appendChild(locationPara);

                var subContainer = document.createElement('div');
                subContainer.className = 'sub-container';
                subContainer.addEventListener('mouseover', showSubContainer);
                subContainer.addEventListener('mouseout', hideSubContainer);
                subContainer.innerHTML = `
                    <ul>
                        <li>Copy Location</li>
                        <li>Redirect to Map</li>
                    </ul>
                `;

                var copyLocationButton = subContainer.querySelector('li:nth-child(1)');
                copyLocationButton.addEventListener('click', function() {
                    copyLocation(item.location);
                });

                var redirectToMapButton = subContainer.querySelector('li:nth-child(2)');
                redirectToMapButton.addEventListener('click', function() {
                    redirectToMap(item.location);
                });

                locationWrapper.appendChild(subContainer);

                postContent.appendChild(locationWrapper);

                var deliveryPara = document.createElement('p');
                deliveryPara.className = 'delivery-mode';
                deliveryPara.innerHTML = '<b>Delivery:</b> ' + item.delivery;
                postContent.appendChild(deliveryPara);

                var contactDetails = document.createElement('div');
                contactDetails.className = 'contact-details';
                var contactPara = document.createElement('p');
                contactPara.title = 'Click to copy';
                contactPara.innerHTML = '<b>Contact:</b> <em onclick="copyToClipboard(this)">' + item.contact + '</em>';
                contactDetails.appendChild(contactPara);

                var editBtn = document.createElement('button');
                editBtn.className = 'edit-btn';
                editBtn.textContent = "Edit";
                editBtn.addEventListener('click', function() { 
                    editModal(item.charityType, item.foodType, item.productItem, item.productDesc, item.location, item.contact, item.delivery, item.id);
                });
                contactDetails.appendChild(editBtn);
                postContent.appendChild(contactDetails);

                postcontainer.appendChild(postContent);
            });
        })
        .catch(error => {
            console.error('Error fetching JSON:', error);
        });
}

    function editModal(charityType, foodType, productItem, productDesc, location, contact, delivery, id) {
        var modalId;

        if (charityType.toLowerCase() === "food") {
            modalId = '#editModal1';
            document.querySelector(modalId+' .mySelect').value = foodType;
        } else {
            modalId = '#editModal2';
            document.querySelector(modalId+' .product').value = productItem;
            document.querySelector(modalId+' .prod-describe').value = productDesc;
        }
        document.querySelector(modalId+' .location').value = location;
        document.querySelector(modalId+' .contact-number').value = contact;
        document.querySelector(modalId+' .delivery-type').value = delivery;
        
        document.querySelector(modalId+' .charity-type').setAttribute("data-hidden-info", charityType);
        document.querySelector(modalId+' .id-num').setAttribute("data-hidden-info", id);
        
        document.querySelector(modalId).style.display = 'flex';
    }



function copyLocation(location) {
    navigator.clipboard.writeText(location);
    alert('Location copied to clipboard: ' + location);
}

function copyToClipboard(element) {
    var contact = element.textContent;
    const el = document.createElement('textarea');
    el.value = contact;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    alert('Contact copied to clipboard: ' + contact);
}

function redirectToMap(location) {
    // Encode the location string for the URL
    var encodedLocation = encodeURIComponent(location);

    // Construct the Google Maps URL for directions
    var mapsUrl = 'https://www.google.com/maps/dir/?api=1&destination=' + encodedLocation;

    // Redirect to the Google Maps URL
    window.location.href = mapsUrl;
}

function showSubContainer(event) {
    var subContainer = event.currentTarget.parentElement.querySelector('.sub-container');
    subContainer.style.display = "block";
}

function hideSubContainer(event) {
    var subContainer = event.currentTarget.parentElement.querySelector('.sub-container');
    subContainer.style.display = "none";
}
