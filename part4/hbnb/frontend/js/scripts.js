import { showEditReviewModal, deleteReview } from './review-actions.js';
import { getCookie, getAuthHeaders } from './utils.js';

// Load reusable HTML components
async function loadComponent(id, file) {
	try {
		const response = await fetch(file);
		const data = await response.text();
		document.getElementById(id).innerHTML = data;
	} catch (error) {
		console.error('Error loading component:', error);
	}
}

// Check authentication and show/hide login link
function checkAuthentication() {
	const token = getCookie('token');
	const loginLink = document.getElementById('login-link');
	const logoutLink = document.getElementById('logout-link');
	const placesList = document.getElementById('places-list');
	const filterSection = document.getElementById('filter');

	if (loginLink) {
		loginLink.style.display = token ? 'none' : 'block';
	}

	if (logoutLink) {
		logoutLink.style.display = token ? 'block' : 'none';
	}

	if (filterSection) {
		filterSection.style.display = token ? 'flex' : 'none';
	}

	if (placesList) {
		if (token) {
			fetchPlaces(token);
		} else {
			placesList.innerHTML = `
				<div class="empty-state">
				<img src="/images/logo.png" alt="Logo">
					<p class="login-message">
						You need to log in to view places.
					</p>
				</div>
			`;

		}
	}
}

// Logout logic
const logoutLink = document.getElementById('logout-link');
if (logoutLink) {
	logoutLink.addEventListener('click', (e) => {
		e.preventDefault();
		document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
		window.location.href = "index.html";
	});
}

// Fetch all places with details
async function fetchPlaces(token) {
	try {
		const response = await fetch('http://127.0.0.1:5000/api/v1/places/', {
			headers: getAuthHeaders()
		});
		if (!response.ok) throw new Error('Failed to fetch places');

		const places = await response.json();

		const detailedPlaces = await Promise.all(
			places.map(async (p) => {
				const res = await fetch(`http://127.0.0.1:5000/api/v1/places/${p.id}`, {
					headers: getAuthHeaders()
				});
				if (!res.ok) {
					console.warn(`Failed to fetch details for place ${p.id} (${res.status})`);
					return { id: p.id, title: p.title || "Unknown", error: true };
				}
				return await res.json();
			})
		);
		console.log('All fetched detailed places:', detailedPlaces);
		const validPlaces = detailedPlaces.filter(p => p !== null);
		displayPlaces(validPlaces);

	} catch (error) {
		console.error('Error fetching places:', error);
	}
}

// Display list of places
function displayPlaces(places) {
	const placesList = document.getElementById('places-list');
	if (!placesList) return;

	if (!places || places.length === 0) {
		placesList.innerHTML = '<p>No places available.</p>';
		return;
	}

	placesList.innerHTML = '';

	places.forEach(place => {
		if (!place) return;

		const placeDiv = document.createElement('div');
		placeDiv.className = 'place-card';
		placeDiv.dataset.price = place.price ?? 0;
		console.log(place.title, place.price);

		let ratingText = "No reviews yet";
		let avg = 0;
		if (place.reviews && place.reviews.length > 0) {
			const total = place.reviews.reduce((sum, r) => sum + r.rating, 0);
			avg = (total / place.reviews.length);
			const nbReviews = place.reviews.length;
			ratingText =
				`<p><strong>Rating: </strong>${renderStars(avg)} </p> 
				<p>(${avg.toFixed(1)} on ${nbReviews} review${nbReviews > 1 ? "s" : ""})</p>`;
		}

		placeDiv.dataset.rating = avg;

		placeDiv.innerHTML = `
            <h2>${place.title || 'No Title'}</h2>
            <p>Price per night: $${place.price || 0}</p>
            <a href="place.html?id=${place.id}" class="details-button">View Details</a>
            <p>${ratingText}</p>
        `;
		const reviewsSafe = place.reviews || [];
		placesList.appendChild(placeDiv);
	});

	updatePlacesCount(places.length, places.length);
}

// Reusable function to render stars based on rating
function renderStars(rating) {
	const full = Math.floor(rating);
	const hasHalf = rating - full >= 0.5;

	let stars = '';

	for (let i = 0; i < full; i++) {
		stars += `<span class="star-full">★</span>`;
	}

	if (hasHalf) {
		stars += `<span class="star-half">★</span>`;
	}

	const emptyCount = 5 - full - (hasHalf ? 1 : 0);
	for (let i = 0; i < emptyCount; i++) {
		stars += `<span class="star-empty">★</span>`;
	}

	return stars;
}

// Reusable function to update places count display
function updatePlacesCount(visible, total) {
	const countElement = document.getElementById('places-count');
	if (!countElement) return;

	if (visible === total) {
		countElement.textContent = `${visible} Available Place${visible > 1 ? 's' : ''}`;
	} else {
		countElement.textContent =
			`${visible} Available Place${visible > 1 ? 's' : ''}`;
	}
}

// Reusable function to apply filters
function applyFilters() {
	const priceFilter = document.getElementById('price-filter');
	const ratingFilter = document.getElementById('rating-filter');

	const priceValue = priceFilter?.value || "";
	const ratingValue = ratingFilter?.dataset.selected || "";

	const places = document.querySelectorAll('.place-card');
	const totalCount = places.length;
	const placesList = document.getElementById('places-list');

	let visibleCount = 0;

	places.forEach(place => {
		const price = parseFloat(place.dataset.price);
		const rating = parseFloat(place.dataset.rating || 0);

		let visible = true;

		if (priceValue !== "" && !isNaN(price)) {
			visible = price <= parseFloat(priceValue);
		}

		if (visible && ratingValue !== "") {
			visible = rating >= parseFloat(ratingValue);
		}

		place.style.display = visible ? 'block' : 'none';

		if (visible) visibleCount++;
	});

	let noResultMsg = document.getElementById('no-results');

	if (visibleCount === 0) {
		if (!noResultMsg) {
			noResultMsg = document.createElement('p');
			noResultMsg.id = 'no-results';
			noResultMsg.textContent = 'No place available';
			placesList.appendChild(noResultMsg);
		}

		const priceNum = parseFloat(priceValue);
		const ratingNum = parseFloat(ratingValue);

		const priceText = !isNaN(priceNum)
			? `under $${priceNum}`
			: '';

		const ratingText = !isNaN(ratingNum)
			? `with minimum ${renderStars(ratingNum)}`
			: '';

		let message = 'No places available';

		if (priceText || ratingText) {
			message = `No places available ${[priceText, ratingText].filter(Boolean).join(' ')}.`;
		}

		noResultMsg.innerHTML = `${message}`;

	} else {
		if (noResultMsg) noResultMsg.remove();
	}
	updatePlacesCount(visibleCount, totalCount);
}

// Filter places by price and rating
function setupPriceFilter() {
	const priceFilter = document.getElementById('price-filter');
	const ratingFilter = document.getElementById('rating-filter');
	const resetBtn = document.getElementById('reset-filters');

	if (resetBtn) {
		resetBtn.addEventListener('click', () => {
			const priceFilter = document.getElementById('price-filter');
			const ratingFilter = document.getElementById('rating-filter');

			if (priceFilter) priceFilter.value = "";

			if (ratingFilter) {
				ratingFilter.dataset.selected = "";

				const stars = ratingFilter.querySelectorAll('span[data-value]');
				stars.forEach(s => s.classList.remove('active'));
			}

			applyFilters();
		});
	}

	if (priceFilter) {
		priceFilter.value = "";
		priceFilter.addEventListener('change', applyFilters);
	}

	if (ratingFilter) {
		const stars = ratingFilter.querySelectorAll('span[data-value]');
		let selectedRating = "";

		stars.forEach(star => {
			star.addEventListener('click', () => {
				selectedRating = star.dataset.value;

				stars.forEach(s => s.classList.remove('active'));

				if (selectedRating !== "") {
					stars.forEach(s => {
						if (parseInt(s.dataset.value) <= selectedRating) {
							s.classList.add('active');
						}
					});
				}

				ratingFilter.dataset.selected = selectedRating;

				applyFilters();
			});
		});
	}
}

// Extract place ID from URL
function getPlaceIdFromURL() {
	const params = new URLSearchParams(window.location.search);
	return params.get('id');
}

// Fetch details for a specific place
async function fetchPlaceDetails(token, placeId) {
	try {
		const response = await fetch(`http://127.0.0.1:5000/api/v1/places/${placeId}`, {
			headers: getAuthHeaders()
		});
		if (!response.ok) throw new Error('Failed to fetch place details');

		const place = await response.json();
		displayPlaceDetails(place);

	} catch (error) {
		console.error('Error fetching place details:', error);
	}
}

// Average rating
function calculateAverageRating(reviews) {
	if (!reviews || reviews.length === 0) return 0;

	const total = reviews.reduce((sum, r) => sum + r.rating, 0);
	return (total / reviews.length).toFixed(1);
}

// Get user info from JWT token
function getUserFromToken() {
	const token = getCookie('token');
	if (!token) return null;

	const decoded = JSON.parse(atob(token.split('.')[1]));
	return {
		id: decoded.sub || decoded.identity,
		isAdmin: decoded.is_admin || false
	};
}

function getAmenityIcon(amenityName) {
	const name = amenityName.toLowerCase();

	if (name.includes('wifi')) return 'images/icon_wifi.png';
	if (name.includes('bed')) return 'images/icon_bed.png';
	if (name.includes('bath')) return 'images/icon_bath.png';

	return 'images/icon.png';
}

// Display details for a specific place
function displayPlaceDetails(place) {
	const title_Element = document.getElementById('place-title');
	if (!title_Element) return;

	title_Element.textContent = place.title || 'No Title';

	const amenitiesHTML = place.amenities && place.amenities.length > 0
		? place.amenities.map(a => {
			const name = a.name || a;
			const icon = getAmenityIcon(name);

			return `
			<div class="amenity">
				<img src="${icon}" alt="${name}" title="${name}" class="amenity-icon">
				<span>${name}</span>
			</div>
		`;
		}).join('')
		: '<p>None</p>';

	const ownerName = place.owner
		? `${place.owner.first_name} ${place.owner.last_name}`
		: 'Unknown';

	const avgRating = parseFloat(calculateAverageRating(place.reviews));

	document.getElementById('place-info').innerHTML = `
    <p><strong>Host:</strong> ${ownerName}</p>
    <p><strong>Price per night:</strong> $${place.price || 0}</p>
    <p><strong>Description:</strong> ${place.description || ''}</p>
    <p><strong>Location:</strong> (${place.latitude || 0}, ${place.longitude || 0})</p>
    <div>
			<strong>Amenities:</strong>
			<div class="amenities-container">
				${amenitiesHTML}
			</div>
		</div>
		<p><strong>Average Rating:</strong> ${renderStars(avgRating)}</p>
		
  `;

	const reviewsList = document.getElementById('reviews-list');
	reviewsList.innerHTML = '';


	if (place.reviews && place.reviews.length > 0) {
		const currentUser = getUserFromToken();

		place.reviews.forEach(review => {
			const reviewDiv = document.createElement('div');
			reviewDiv.className = 'review-card';

			reviewDiv.innerHTML = `
				<div class="review-container">
					<div>
						<p><strong> ${review.user_name}</strong></p>
						<p>${review.text}</p>
						<p>${renderStars(review.rating)}</p>
					</div>
					<div class="review-dates">
							<p><em>Posted:</em> ${new Date(review.created_at).toLocaleString()}</p>
							<p><em>Updated:</em> ${new Date(review.updated_at).toLocaleString()}</p>
						</div>
				</div>
			`;

			if (currentUser &&
				(review.user_id === currentUser.id || currentUser.isAdmin)) {
				reviewDiv.innerHTML += `
						<div class="edit_delete_container">
							<button class="edit-btn">
								<i class="fa-solid fa-pen">Edit</i>
							</button>

							<button class="delete-btn">
								<i class="fa-solid fa-trash">Delete</i>
							</button>
						</div>
        `;

				reviewDiv.querySelector('.edit-btn').addEventListener('click', () => {
					showEditReviewModal(review);
				});

				reviewDiv.querySelector('.delete-btn').addEventListener('click', () => {
					deleteReview(review.id);
				});
			}

			reviewsList.appendChild(reviewDiv);
		});
	} else {
		const reviewDiv = document.createElement('div');
		reviewDiv.className = 'review-card';

		reviewDiv.innerHTML = `
        <p>No review yet.</p>
    `;

		reviewsList.appendChild(reviewDiv);
	}

	const reviewLink = document.getElementById('add-review-link');
	if (reviewLink) {
		const currentUser = getUserFromToken();

		let canReview = true;
		if (!currentUser) {
			canReview = false;
		}

		if (place.owner && currentUser && place.owner.id === currentUser.id) {
			canReview = false;
		}

		if (place.reviews && currentUser) {
			const alreadyReviewed = place.reviews.some(
				r => r.user_id === currentUser.id
			);
			if (alreadyReviewed) {
				canReview = false;
			}
		}

		if (canReview) {
			reviewLink.href = `add_review.html?place_id=${place.id}`;
			reviewLink.style.display = "inline-block";
		} else {
			reviewLink.style.display = "none";
		}
	}
}


// Initialize header
async function initHeader() {
	await loadComponent("header", "header.html");
	checkAuthentication();
	await displayHeaderUser();

	const logoutLink = document.getElementById('logout-link');
	if (logoutLink) {
		logoutLink.addEventListener('click', (e) => {
			e.preventDefault();
			document.cookie = "token=; path=/; SameSite=Lax; expires=Thu, 01 Jan 1970 00:00:00 GMT";
			window.location.href = "index.html";
		});
	}
	const trigger = document.getElementById("user-trigger");

	trigger?.addEventListener("click", () => {
		dropdown.classList.toggle("hidden");
	});

	document.addEventListener("click", (e) => {
		if (trigger && !trigger.contains(e.target)) {
			dropdown.classList.add("hidden");
		}
	});
}

// Initialize the DOM content and load components
document.addEventListener('DOMContentLoaded', async () => {
	await initHeader();
	await loadComponent("footer", "footer.html");

	const token = getCookie('token');
	const placeId = getPlaceIdFromURL();

	if (placeId) {
		if (token)
			fetchPlaceDetails(token, placeId);
		else
			console.warn('User not authenticated');
		return;
	}
	checkAuthentication();
	setupPriceFilter();

	// Login form handling
	const loginForm = document.getElementById('login-form');
	const errorMessage = document.getElementById('error-message');

	if (loginForm) {
		loginForm.addEventListener('submit', async (event) => {
			event.preventDefault();

			const email = document.getElementById('email').value;
			const password = document.getElementById('password').value;

			if (errorMessage) errorMessage.textContent = '';

			try {
				console.log("LOGIN DATA:", email, password);
				const response = await fetch('http://127.0.0.1:5000/api/v1/auth/login', {
					method: 'POST',
					headers: getAuthHeaders(),
					body: JSON.stringify({ email, password })
				});

				if (response.ok) {
					const data = await response.json();
					const expire_time = new Date(Date.now() + 60 * 60 * 1000).toUTCString();
					document.cookie = `token=${encodeURIComponent(data.access_token)}; path=/; SameSite=Lax; expires=${expire_time}`;
					window.location.href = 'index.html';
				} else {
					const errorData = await response.json();
					const message = 'Login failed: ' + (errorData.error || 'Unknown error');
					if (errorMessage) errorMessage.textContent = message;
					else alert(message);
				}

			} catch (error) {
				console.error('Error:', error);
				const message = 'Something went wrong. Check API.';
				if (errorMessage) errorMessage.textContent = message;
				else alert(message);
			}
		});
	}
});

// Display logged-in user in header
async function displayHeaderUser() {
	const token = getCookie('token');

	const avatar = document.getElementById('user-avatar');
	const name = document.getElementById('user-name');
	const menu = document.getElementById('user-menu');
	const loginLink = document.getElementById('login-link');
	const dropdown = document.getElementById("dropdown");

	if (avatar) avatar.textContent = '';
	if (name) name.textContent = '';
	menu?.classList.add('hidden');
	loginLink?.classList.remove('hidden');
	dropdown?.classList.add('hidden');
	if (!token) return;

	const decoded = JSON.parse(atob(token.split('.')[1]));
	const userId = decoded.sub || decoded.identity;

	try {
		const res = await fetch(`http://127.0.0.1:5000/api/v1/users/${userId}`, {
			headers: getAuthHeaders()
		});
		if (!res.ok) return;

		const user = await res.json();

		if (avatar && name && menu) {
			avatar.textContent = user.first_name.charAt(0).toUpperCase();
			name.textContent = user.first_name;
			menu.classList.remove('hidden');
			loginLink?.classList.add('hidden');
		}
	} catch (err) {
		console.error("Error displaying header user:", err);
	}
}


export { initHeader, loadComponent, displayHeaderUser };