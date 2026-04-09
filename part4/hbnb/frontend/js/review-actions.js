import { getCookie, getAuthHeaders } from './utils.js';

// Show modal for editing a review
export function showEditReviewModal(review) {
  const modal = document.createElement('div');
  modal.className = 'modal';

  // Insert the review id into the Save button as data attribute
  modal.innerHTML = `
    <div class="modal-content">
      <span class="close">&times;</span>
      <h3>Edit Review</h3>
      <textarea id="review-textarea">${review.text}</textarea>
      <label>Rating (1-5): 
        <input type="number" id="review-rating" min="1" max="5" value="${review.rating}">
      </label>
      <button id="save-review" class="modal-button" data-review-id="${review.id}">Save</button>
    </div>
  `;

  document.body.appendChild(modal);

  // Close modal
  modal.querySelector('.close').addEventListener('click', () => modal.remove());

  // Save handler
  modal.querySelector('#save-review').addEventListener('click', async function () {
    const reviewId = this.getAttribute('data-review-id');
    const newText = document.getElementById('review-textarea').value;
    const newRating = parseInt(document.getElementById('review-rating').value);

    if (!newRating || newRating < 1 || newRating > 5) {
      alert('Invalid rating.');
      return;
    }

    const token = getCookie('token');
    if (!token) {
      alert('You must be logged in to edit.');
      return;
    }

    try {
      const response = await fetch(`http://127.0.0.1:5000/api/v1/reviews/${reviewId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ text: newText, rating: newRating })
      });

      if (response.ok) {
        alert('Review updated successfully!');
        location.reload();
      } else {
        const data = await response.json();
        alert('Failed to update review: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      console.error(err);
      alert('Something went wrong while updating the review.');
    }
  });
}

// Delete review
export async function deleteReview(reviewId) {
  if (!confirm("Are you sure you want to delete this review?")) return;

  const token = getCookie('token');
  if (!token) {
    alert("You must be logged in to delete.");
    return;
  }

  try {
    const response = await fetch(`http://127.0.0.1:5000/api/v1/reviews/${reviewId}`, {
      method: "DELETE",
      headers: getAuthHeaders()
    });

    if (response.ok) {
      alert("Review deleted successfully!");
      location.reload();
    } else {
      const data = await response.json();
      alert("Failed to delete review: " + (data.error || "Unknown error"));
    }
  } catch (err) {
    console.error(err);
    alert("Something went wrong while deleting the review.");
  }
}

// Submit new review
export async function submitReview(token, placeId, reviewText, rating) {
  if (!token) {
    alert('You must be logged in.');
    return;
  }
  try {
    const response = await fetch('http://127.0.0.1:5000/api/v1/reviews/', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        text: reviewText,
        rating: parseInt(rating),
        place_id: placeId,
      })
    });

    if (response.ok) {
      alert('Review submitted successfully!');
      window.location.href = `place.html?id=${placeId}`;
    } else {
      const data = await response.json();
      alert('Failed to submit review: ' + (data.error || 'Unknown error'));
    }
  } catch (error) {
    console.error('Error submitting review:', error);
    alert('Something went wrong. Check API.');
  }
}
