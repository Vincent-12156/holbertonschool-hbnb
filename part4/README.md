# HBnB Simple Web Client

## Overview

This project is a frontend web client for the HBnB application. It interacts with a backend API to allow users to browse places, view details, and manage reviews.

## Features

### Authentication

* Users can log in using email and password
* JWT token is stored in cookies
* Authentication state dynamically updates UI

### View Places

* Fetch and display a list of places from the API
* Filter places by:

  * Price
  * Rating (interactive star system)
* Displays average rating and number of reviews

### Place Details

* View full details of a place:

  * Title, description, price
  * Amenities (with icons)
  * Owner information
* Displays all reviews

### Reviews

* Logged-in users can:

  * Add a review
  * Edit their own reviews
  * Delete their reviews
* Users cannot:

  * Review their own place
  * Review the same place twice



## How to Test

### 1. Start Backend API

Ensure the backend is running at:

```
http://127.0.0.1:5000
```

---

### 2. Open the Frontend

Open `index.html` in your browser.

---

### 3. Login

* Click **Login**
* Enter valid credentials
* You will be redirected to the homepage

---

### 4. Browse Places

* View list of places
* Apply filters (price / rating)

---

### 5. View Details

* Click **View Details**
* See place information and reviews

---

### 6. Add Review

* Click **Add Review**
* Fill form:

  * Text (required)
  * Rating (1–5 stars)
* Submit review

---

### 7. Edit / Delete Review

* Available only for:

  * Review owner
  * Admin
* Use buttons on each review

---

## Project Structure

```
frontend/
│── css/
│   └── style.css
│
│── js/
│   ├── scripts.js
│   ├── utils.js
│   ├── add_review.js
│   └── review-actions.js
│
│── components/
│   ├── header.html
│   └── footer.html
│
│── index.html
│── place.html
│── add_review.html
│── login.html
```

---

## Technologies Used

* HTML5
* CSS3 (Flexbox)
* JavaScript (ES6 modules)
* REST API (Fetch)


## Author

RENAUD Vincent
