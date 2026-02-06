async function loadListings() {
    try {
        const response = await fetch('airbnb_sf_listings_500.json');
        const allData = await response.json();

        // Shorten to 50 listings
        const listings = allData.slice(0, 50);

        let maxValScore = -Infinity;
        let minValScore = Infinity;

        listings.forEach(item => {
            // Ended up having to use Regex -> remove dollar signs to cast to value
            const priceVal = parseFloat(item.price.replace(/[$,]/g, ''));
            const rating = item.review_scores_rating || 0; 
            
            if (priceVal > 0 && rating > 0) {
                const score = rating / priceVal;
                item.valScore = score;
                if (score > maxValScore) maxValScore = score;
                if (score < minValScore) minValScore = score;
            } else {
                item.valScore = 0;
            }
            // Store clean price for display later
            item.cleanPrice = priceVal;
        });

        // Remove temporary loading text
        const container = document.getElementById('listings-container');
        container.innerHTML = '';

        // Making the listings
        listings.forEach(listing => {
            // Assign color on scale of green to red based on
            // "quality", rating over price
            // could change to rating squared
            let normalized = 0;
            if (maxValScore !== minValScore) {
                normalized = (listing.valScore - minValScore) / (maxValScore - minValScore);
            }
            
            const hue = normalized * 150; 
            const dollarColor = `hsl(${hue}, 100%, 40%)`;
            
            // Parse bang for buck score tooltip
            // E.g. "Score: 0.048 (4.8 stars / $100)"
            const rating = listing.review_scores_rating || 0;
            const tooltipText = `Score: ${listing.valScore.toFixed(5)} \nCalculation: ${rating} stars / $${listing.cleanPrice}`;

            // Parse amentities
            let amenitiesList = "No amenities";
            try {
                const parsedAmenities = JSON.parse(listing.amenities);
                amenitiesList = parsedAmenities.slice(0, 3).join(', ') + (parsedAmenities.length > 4 ? '...' : '');
            } catch (e) {
                console.warn("Failed to parse amenities", e);
            }

            // Listing Card
            const card = document.createElement('div');
            card.className = 'card';
            
            card.innerHTML = `
                <img src="${listing.picture_url}" alt="${listing.name}" class="thumbnail" onerror="this.src='IMG_NA.png'; this.removeAttribute('alt');">
                <div class="price-tag">${listing.price}</div>
                <div class="value-indicator" style="color: ${dollarColor}" title="${tooltipText}">$</div>
                
                <div class="card-content">
                    <div class="listing-name">${listing.name}</div>
                    <div class="description">${listing.description}</div>
                    <div class="amenities"><strong>Amenities:</strong> ${amenitiesList}</div>
                    
                    <div class="host-info">
                        <img src="${listing.host_picture_url}" alt="${listing.host_name}" class="host-photo" onerror="this.src='IMG_NA.png'">
                        <span class="host-name">Hosted by ${listing.host_name}</span>
                    </div>
                </div>
            `;
            container.appendChild(card);
        });

    } catch (error) {
        console.error('Error loading listings:', error);
        document.getElementById('listings-container').innerText = 'Failed to load listings. Please ensure the JSON file is available.';
    }
}

loadListings();
