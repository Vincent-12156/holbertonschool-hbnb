import { getCookie, getAuthHeaders } from './utils.js';
import { submitReview } from './review-actions.js';
import { initHeader, loadComponent, displayHeaderUser } from './scripts.js';


// Extract place ID from URL
function getPlaceIdFromURL() {
	const params = new URLSearchParams(window.location.search);
	return params.get('place_id') || params.get('id');
}

// Check authentication and redirect if not logged in
function checkAuthentication() {
	const token = getCookie('token');
	if (!token) {
		window.location.href = 'index.html';
	}
	return token;
}

// Parse JWT to get user info
function parseJwt(token) {
	return JSON.parse(atob(token.split('.')[1]));
}

// Show current user name
async function displayCurrentUser(token) {
	const decoded = parseJwt(token);
	const userId = decoded.sub || decoded.identity;

	const res = await fetch(`http://127.0.0.1:5000/api/v1/users/${userId}`, {
		headers: {
			'Content-Type': 'application/json'
		}
	});

	if (!res.ok) {
		console.error("Failed to fetch user");
		return;
	}
	const user = await res.json();

	document.getElementById('user-info').textContent =
		`Logged in as: ${user.first_name} ${user.last_name}`;
}

// Initialize the DOM content and load components
document.addEventListener('DOMContentLoaded', async () => {
	if (typeof initHeader === 'function') {
		await initHeader();
	} else {
		console.warn('initHeader not found!');
	}

	await loadComponent('footer', 'footer.html');
	displayHeaderUser();

	// Auth & user info
	const token = checkAuthentication();
	if (token) displayCurrentUser(token);
	const placeId = getPlaceIdFromURL();
	console.log(placeId)
	if (!placeId) {
		document.body.innerHTML = "<h2>Error: No place selected</h2>";
		return;
	}

	// Review form handling
	const reviewForm = document.getElementById('review-form');
	if (!reviewForm) return;

	const stars = document.querySelectorAll('#star-rating span');
	const ratingInput = document.getElementById('rating');

	stars.forEach(star => {
		star.addEventListener('click', () => {
			const value = parseInt(star.dataset.value, 10);
			ratingInput.value = value;

			stars.forEach(s => {
				const starValue = parseInt(s.dataset.value, 10);
				s.style.color = starValue <= value ? 'gold' : 'gray';
			});
		});
	});

	reviewForm.addEventListener('submit', (event) => {
		event.preventDefault();

		const reviewText = document.getElementById('review').value.trim();
		const rating = document.getElementById('rating').value;

		if (!reviewText) {
			alert('Please enter a review.');
			return;
		}

		if (!rating || rating < 1 || rating > 5) {
			alert('Please select a rating between 1 and 5.');
			return;
		}

		submitReview(token, placeId, reviewText, rating);
	});
});

