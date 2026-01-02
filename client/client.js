// let restaurants = [aragorn, legolas, frodo];

let restaurants = []

// Global variables to track current state
let currRestaurant = null;
let currOrder = {};

let TAX_RATE = 0.1;

// When the page loads, set everything up
function initializePage() {

    let xhttp = new XMLHttpRequest();
	xhttp.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200){
			restaurants = JSON.parse(xhttp.responseText);
	        populateDropdown();
		}
	}
    xhttp.open("GET", "/api/restaurants");
	xhttp.send();
	
	// Listen for when user changes restaurant
	let dropdown = document.getElementById('restaurant-select');
	dropdown.addEventListener('change', onRestaurantChange);
}

// Fill the dropdown with restaurant options
function populateDropdown() {
	let dropdown = document.getElementById('restaurant-select');
	
	for (let i = 0; i < restaurants.length; i++) {
		let option = document.createElement('option');
		option.value = restaurants[i].id;
		option.textContent = restaurants[i].name;
		dropdown.appendChild(option);
	}
}

// When user selects a different restaurant
function onRestaurantChange(event) {
	let selectedIndex = event.target.value;
	
	// If they picked the placeholder option
	if (selectedIndex === "") {
		return;
	}
	
	// Check if there's items in the current order
	if (hasOrderItems()) {
		let confirmClear = confirm("Changing restaurants will clear your current order. Do you want to continue?");
		
		if (!confirmClear) {
			// User said no, so reset dropdown to previous restaurant
			if (currRestaurant !== null) {
				for (let i = 0; i < restaurants.length; i++) {
					if (restaurants[i].id === currRestaurant.id) {
						event.target.value = restaurants[i].id;
						break;
					}
				}
			} else {
				event.target.value = "";
			}
			return;
		}
	}
	
	// Clear the order and display new restaurant
	currOrder = {};
    let xhttp = new XMLHttpRequest();
	xhttp.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200){
			currRestaurant = JSON.parse(xhttp.responseText);
			console.log(currRestaurant)
            displayRestaurant(currRestaurant);
		}
	}
    xhttp.open("GET", "/api/restaurants/"+selectedIndex);
	xhttp.send();
}

// Check if order has any items
function hasOrderItems() {
	for (let itemId in currOrder) {
		if (currOrder[itemId] > 0) {
			return true;
		}
	}
	return false;
}

// Display the selected restaurant on the page
function displayRestaurant(restaurant) {
	// Show restaurant info
	document.getElementById('restaurant-name').textContent = restaurant.name;
	document.getElementById('min-order').textContent = formatCurrency(restaurant.min_order);
	document.getElementById('delivery-fee').textContent = formatCurrency(restaurant.delivery_fee);
	document.getElementById('restaurant-info').style.display = 'block';
	
	// Show the main content area
	document.getElementById('content-container').style.display = 'block';
	
	// Render the menu
	let menuContainer = document.getElementById('menu-container');
	menuContainer.innerHTML = '';
	
	// Loop through each category
	for (let categoryName in restaurant.menu) {
		let categorySection = createCategorySection(categoryName, restaurant.menu[categoryName]);
		menuContainer.appendChild(categorySection);
	}
	
	// Create category links
	let categories = [];
	if (currRestaurant) {
		for (let categoryName in currRestaurant.menu) {
			categories.push(categoryName);
		}
	}
	let linksList = document.getElementById('category-list');
	linksList.innerHTML = '';
	
	for (let i = 0; i < categories.length; i++) {
		let li = document.createElement('li');
		let link = document.createElement('a');
		link.href = '#category-' + categories[i].replaceAll(' ', '-');
		link.textContent = categories[i];
		li.appendChild(link);
		linksList.appendChild(li);
	}
	
	// Update order summary
	renderOrderSummary();
}

// Create HTML for one category section
function createCategorySection(categoryName, items) {
	let section = document.createElement('div');
	section.className = 'menu-category';
	section.id = 'category-' + categoryName.replaceAll(` `, '-');
	
	let heading = document.createElement('h2');
	heading.textContent = categoryName;
	section.appendChild(heading);
	
	let itemsList = document.createElement('ul');
	itemsList.className = 'menu-items';
	
	// Loop through each item in this category
	for (let itemId in items) {
		let menuItem = createMenuItem(itemId, items[itemId]);
		itemsList.appendChild(menuItem);
	}
	
	section.appendChild(itemsList);
	return section;
}

// Create HTML for one menu item
function createMenuItem(itemId, itemData) {
	let li = document.createElement('li');
	li.className = 'menu-item';
	
	let details = document.createElement('div');
	details.className = 'item-details';
	
	let name = document.createElement('div');
	name.className = 'item-name';
	name.textContent = itemData.name;
	details.appendChild(name);
	
	let description = document.createElement('div');
	description.className = 'item-description';
	description.textContent = itemData.description;
	details.appendChild(description);
	
	let price = document.createElement('div');
	price.className = 'item-price';
	price.textContent = '$' + formatCurrency(itemData.price);
	details.appendChild(price);
	
	li.appendChild(details);
	
	// Add button with image
	let addBtn = document.createElement('img');
	addBtn.src = 'img/add.png';
	addBtn.className = 'add-button';
	addBtn.alt = 'Add to order';
	addBtn.addEventListener('click', function() {
		addItemToOrder(itemId);
	});
	li.appendChild(addBtn);
	
	return li;
}

// Add an item to the order
function addItemToOrder(itemId) {
	if (currOrder[itemId]) {
		currOrder[itemId]++;
	} else {
		currOrder[itemId] = 1;
	}
	renderOrderSummary();
}

// Remove an item from the order
function removeItemFromOrder(itemId) {
	if (currOrder[itemId]) {
		currOrder[itemId]--;
		if (currOrder[itemId] <= 0) {
			delete currOrder[itemId];
		}
	}
	renderOrderSummary();
}

// Display the order summary
function renderOrderSummary() {
	let orderList = document.getElementById('order-items');
	orderList.innerHTML = '';
	
	// Loop through items in order
	for (let itemId in currOrder) {
		let quantity = currOrder[itemId];
		if (quantity > 0) {
			let itemData = getItemById(itemId);
			if (itemData) {
				let orderItem = createOrderLineItem(itemId, itemData, quantity);
				orderList.appendChild(orderItem);
			}
		}
	}
	
	// Update totals
	let subtotal = calculateSubtotal();
	let deliveryFee = currRestaurant ? currRestaurant.delivery_fee : 0;
	let tax = calculateTax();
	
	let total = calculateTotal();
	
	document.getElementById('subtotal').textContent = formatCurrency(subtotal);
	document.getElementById('delivery-total').textContent = formatCurrency(deliveryFee);
	document.getElementById('tax').textContent = formatCurrency(tax);
	document.getElementById('total').textContent = formatCurrency(total);
	
	// Show submit button or minimum message
	let submitBtn = document.getElementById('submit-button');
	let minMessage = document.getElementById('minimum-message');
	
	if (meetsMinimumOrder()) {
		submitBtn.style.display = 'block';
		minMessage.textContent = '';
	} else {
		submitBtn.style.display = 'none';
		let amountNeeded = calculateAmountNeeded();
		if (amountNeeded > 0) {
			minMessage.textContent = 'You must add $' + formatCurrency(amountNeeded) + ' more to your order before submitting.';
		} else {
			minMessage.textContent = '';
		}
	}
}

// Create HTML for one order line
function createOrderLineItem(itemId, itemData, quantity) {
	let li = document.createElement('li');
	li.className = 'order-item';
	
	let info = document.createElement('div');
	info.className = 'order-item-info';
	
	let name = document.createElement('div');
	name.className = 'order-item-name';
	name.textContent = itemData.name;
	info.appendChild(name);
	
	let qty = document.createElement('div');
	qty.className = 'order-item-quantity';
	qty.textContent = 'Quantity: ' + quantity;
	info.appendChild(qty);
	
	li.appendChild(info);
	
	let itemTotal = itemData.price * quantity;
	let priceSpan = document.createElement('span');
	priceSpan.className = 'order-item-price';
	priceSpan.textContent = '$' + formatCurrency(itemTotal);
	li.appendChild(priceSpan);
	
	// Remove button
	let removeBtn = document.createElement('img');
	removeBtn.src = 'img/remove.png';
	removeBtn.className = 'remove-button';
	removeBtn.alt = 'Remove from order';
	removeBtn.addEventListener('click', function() {
		removeItemFromOrder(itemId);
	});
	li.appendChild(removeBtn);
	
	return li;
}

// Calculate subtotal
function calculateSubtotal() {
	let subtotal = 0;
	for (let itemId in currOrder) {
		let itemData = getItemById(itemId);
		if (itemData) {
			subtotal += itemData.price * currOrder[itemId];
		}
	}
	return subtotal;
}

// Calculate tax
function calculateTax() {
	let subtotal = calculateSubtotal();
	return subtotal * TAX_RATE;
}

// Calculate total
function calculateTotal() {
	let subtotal = calculateSubtotal();
	let deliveryFee = currRestaurant ? currRestaurant.delivery_fee : 0;
	let tax = calculateTax();
	return subtotal + deliveryFee + tax;
}

// Check if order meets minimum
function meetsMinimumOrder() {
	if (!currRestaurant) {
		return false;
	}
	let subtotal = calculateSubtotal();
	return subtotal >= currRestaurant.min_order;
}

// Calculate amount still needed
function calculateAmountNeeded() {
	if (!currRestaurant) {
		return 0;
	}
	let subtotal = calculateSubtotal();
	let needed = currRestaurant.min_order - subtotal;
	return needed > 0 ? needed : 0;
}

// Submit the order
function submitOrder() {
	
	let total = calculateTotal();
	let subtotal = calculateSubtotal();
	let tax = calculateTax();

	let formatedOrder = {}
	for(let item in Object.keys(currOrder)){
		let itemName;
		for (const category of Object.values(currRestaurant.menu)) {
			for (const [id, name] of Object.entries(category)) {
				if (id === item) {
					itemName = name.name;
				}
			}
		}
		console.log(itemName)
		formatedOrder[item] = {quantity: currOrder[item], name: itemName}
	}

    let toPost = {
        id: currRestaurant.id,
		restaurantName: currRestaurant.name,
		subtotal: subtotal,
        total: total,
		deliveryFee: currRestaurant.delivery_fee,
		tax: tax,
        items: formatedOrder
    };

    fetch("/api/order", {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(toPost)
    }).then(response => {
		if (!response.ok)
		{
			throw new Error('Order Submission failed');
		}
		return response.json();
	})
    .then(data => {
	    alert('Order submitted successfully!');
		currOrder = {};
        currRestaurant = null;
        document.getElementById('restaurant-select').value = "";
        document.getElementById('restaurant-info').style.display = 'none';
        document.getElementById('content-container').style.display = 'none';
    }).catch(error => {
		alert('Error:' + error);
	});
}

// Get item data by ID
function getItemById(itemId) {
	if (!currRestaurant) {
		return null;
	}
	
	for (let categoryName in currRestaurant.menu) {
		let category = currRestaurant.menu[categoryName];
		if (category[itemId]) {
			return category[itemId];
		}
	}
	return null;
}

// Format number as currency
function formatCurrency(amount) {
	return amount.toFixed(2);
}

// Set up submit button listener
document.getElementById('submit-button').addEventListener('click', submitOrder);

// Start the page
document.addEventListener('DOMContentLoaded', initializePage);