// Mystery Box Landing Page - Interactive Features

// Smooth scrolling for navigation links
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all interactive features
    initWishlist();
    initAddToCart();
    initSmoothScroll();
    initProductAnimations();
    initShopNowButtons();
});

// Wishlist functionality
function initWishlist() {
    const wishlistButtons = document.querySelectorAll('.wishlist-btn');
    
    wishlistButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const heartIcon = this.querySelector('.heart-icon');
            const isActive = this.classList.contains('active');
            
            if (isActive) {
                // Remove from wishlist
                this.classList.remove('active');
                heartIcon.style.fill = 'none';
                heartIcon.style.stroke = 'currentColor';
                this.style.borderColor = '#666';
                
                // Update wishlist text
                const wishlistText = this.parentElement.querySelector('.wishlist-text');
                wishlistText.textContent = 'Add to wishlist';
                
                // Show notification
                showNotification('Removed from wishlist', 'info');
            } else {
                // Add to wishlist
                this.classList.add('active');
                heartIcon.style.fill = '#DC143C';
                heartIcon.style.stroke = '#DC143C';
                this.style.borderColor = '#DC143C';
                
                // Update wishlist text
                const wishlistText = this.parentElement.querySelector('.wishlist-text');
                wishlistText.textContent = 'Added to wishlist';
                wishlistText.style.color = '#DC143C';
                
                // Animate heart
                animateHeart(this);
                
                // Show notification
                showNotification('Added to wishlist!', 'success');
            }
            
            // Save to localStorage
            const productId = this.getAttribute('data-product');
            saveWishlistState(productId, !isActive);
        });
    });
    
    // Load saved wishlist states
    loadWishlistStates();
}

// Save wishlist state to localStorage
function saveWishlistState(productId, isActive) {
    const wishlist = JSON.parse(localStorage.getItem('wishlist') || '{}');
    wishlist[productId] = isActive;
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
}

// Load wishlist states from localStorage
function loadWishlistStates() {
    const wishlist = JSON.parse(localStorage.getItem('wishlist') || '{}');
    
    document.querySelectorAll('.wishlist-btn').forEach(button => {
        const productId = button.getAttribute('data-product');
        if (wishlist[productId]) {
            button.classList.add('active');
            const heartIcon = button.querySelector('.heart-icon');
            heartIcon.style.fill = '#DC143C';
            heartIcon.style.stroke = '#DC143C';
            button.style.borderColor = '#DC143C';
            
            const wishlistText = button.parentElement.querySelector('.wishlist-text');
            wishlistText.textContent = 'Added to wishlist';
            wishlistText.style.color = '#DC143C';
        }
    });
}

// Animate heart icon
function animateHeart(button) {
    button.style.transform = 'scale(1.3)';
    setTimeout(() => {
        button.style.transform = 'scale(1)';
    }, 300);
}

// Add to cart functionality
function initAddToCart() {
    const addToCartButtons = document.querySelectorAll('.add-to-cart-btn');
    
    addToCartButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            const productCard = this.closest('.product-card');
            const productTitle = productCard.querySelector('.product-title').textContent;
            const productPrice = productCard.querySelector('.price-amount').textContent;
            
            // Add to cart animation
            addToCartAnimation(this);
            
            // Add item to cart (you can integrate with your cart system here)
            addItemToCart({
                title: productTitle,
                price: productPrice,
                id: generateProductId(productTitle)
            });
            
            // Show notification
            showNotification(`${productTitle} added to cart!`, 'success');
            
            // Update cart count (if you have a cart counter)
            updateCartCount();
        });
    });
}

// Add item to cart storage
function addItemToCart(item) {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    
    // Check if item already exists
    const existingItem = cart.find(cartItem => cartItem.id === item.id);
    
    if (existingItem) {
        existingItem.quantity = (existingItem.quantity || 1) + 1;
    } else {
        item.quantity = 1;
        cart.push(item);
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
}

// Generate product ID from title
function generateProductId(title) {
    return title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

// Add to cart button animation
function addToCartAnimation(button) {
    const originalText = button.textContent;
    button.textContent = 'Added!';
    button.style.background = '#28A745';
    button.disabled = true;
    
    setTimeout(() => {
        button.textContent = originalText;
        button.style.background = '';
        button.disabled = false;
    }, 1500);
}

// Update cart count
function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    
    // If you have a cart counter element, update it here
    const cartCounter = document.querySelector('.cart-count');
    if (cartCounter) {
        cartCounter.textContent = totalItems;
        cartCounter.style.display = totalItems > 0 ? 'block' : 'none';
    }
}

// Smooth scroll for navigation links
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            
            if (target) {
                const headerOffset = 80;
                const elementPosition = target.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                
                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Product card animations on scroll
function initProductAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // Add animation to product cards
    document.querySelectorAll('.product-card').forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
        observer.observe(card);
    });
}

// Shop Now button functionality
function initShopNowButtons() {
    const shopNowButtons = document.querySelectorAll('.shop-now-btn');
    
    shopNowButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // Get the product card
            const productCard = this.closest('.product-card');
            const addToCartBtn = productCard.querySelector('.add-to-cart-btn');
            
            // Scroll to product info section
            productCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // Highlight the add to cart button
            setTimeout(() => {
                addToCartBtn.style.transform = 'scale(1.05)';
                addToCartBtn.style.boxShadow = '0 6px 12px rgba(220, 20, 60, 0.4)';
                
                setTimeout(() => {
                    addToCartBtn.style.transform = '';
                    addToCartBtn.style.boxShadow = '';
                }, 1000);
            }, 500);
        });
    });
}

// Notification system
function showNotification(message, type = 'info') {
    // Remove existing notification if any
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${type === 'success' ? '#28A745' : '#17A2B8'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        animation: slideIn 0.3s ease;
        font-weight: 500;
        max-width: 300px;
    `;
    
    // Add animation keyframes if not already present
    if (!document.querySelector('#notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            @keyframes slideIn {
                from {
                    transform: translateX(400px);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            @keyframes slideOut {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(400px);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Header scroll effect
window.addEventListener('scroll', function() {
    const header = document.querySelector('.header');
    if (window.scrollY > 100) {
        header.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
        header.style.backgroundColor = 'rgba(255,255,255,0.98)';
    } else {
        header.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
        header.style.backgroundColor = '#FFFFFF';
    }
});

// Product image hover effects
document.querySelectorAll('.product-image').forEach(image => {
    image.addEventListener('mouseenter', function() {
        this.style.transform = 'scale(1.05)';
        this.style.transition = 'transform 0.3s ease';
    });
    
    image.addEventListener('mouseleave', function() {
        this.style.transform = 'scale(1)';
    });
});

// Enhanced product burst animations on hover
document.querySelectorAll('.product-card').forEach(card => {
    card.addEventListener('mouseenter', function() {
        const productItems = this.querySelectorAll('.product-item');
        productItems.forEach((item, index) => {
            const randomX = (Math.random() - 0.5) * 20;
            const randomY = (Math.random() - 0.5) * 20;
            item.style.setProperty('--tx', `${randomX}px`);
            item.style.setProperty('--ty', `${randomY}px`);
            item.style.animationDelay = `${index * 0.1}s`;
        });
    });
});