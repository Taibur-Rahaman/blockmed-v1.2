/**
 * DokanXpress Mystery Box - Elementor Compatible JavaScript
 * All selectors prefixed with mystery-box- to avoid conflicts
 */

(function($) {
    'use strict';

    // Initialize when DOM is ready
    $(document).ready(function() {
        initMysteryBoxFeatures();
    });

    // Initialize all features
    function initMysteryBoxFeatures() {
        initWishlist();
        initAddToCart();
        initProductAnimations();
        initShopNowButtons();
    }

    // Wishlist functionality
    function initWishlist() {
        $('.mystery-box-wishlist-btn').on('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            var $btn = $(this);
            var $heartIcon = $btn.find('.mystery-box-heart-icon');
            var isActive = $btn.hasClass('active');
            var $wishlistText = $btn.siblings('.mystery-box-wishlist-text');
            
            if (isActive) {
                // Remove from wishlist
                $btn.removeClass('active');
                $heartIcon.css({
                    'fill': 'none',
                    'stroke': 'currentColor'
                });
                $btn.css('border-color', '#666');
                $wishlistText.text('Add to wishlist').css('color', '#666');
                showNotification('Removed from wishlist', 'info');
            } else {
                // Add to wishlist
                $btn.addClass('active');
                $heartIcon.css({
                    'fill': '#DC143C',
                    'stroke': '#DC143C'
                });
                $btn.css('border-color', '#DC143C');
                $wishlistText.text('Added to wishlist').css('color', '#DC143C');
                animateHeart($btn);
                showNotification('Added to wishlist!', 'success');
            }
            
            // Save to localStorage
            var productId = $btn.data('product');
            saveWishlistState(productId, !isActive);
        });
        
        // Load saved wishlist states
        loadWishlistStates();
    }

    // Save wishlist state to localStorage
    function saveWishlistState(productId, isActive) {
        var wishlist = JSON.parse(localStorage.getItem('dokanxpress_wishlist') || '{}');
        wishlist[productId] = isActive;
        localStorage.setItem('dokanxpress_wishlist', JSON.stringify(wishlist));
    }

    // Load wishlist states from localStorage
    function loadWishlistStates() {
        var wishlist = JSON.parse(localStorage.getItem('dokanxpress_wishlist') || '{}');
        
        $('.mystery-box-wishlist-btn').each(function() {
            var $btn = $(this);
            var productId = $btn.data('product');
            
            if (wishlist[productId]) {
                $btn.addClass('active');
                var $heartIcon = $btn.find('.mystery-box-heart-icon');
                $heartIcon.css({
                    'fill': '#DC143C',
                    'stroke': '#DC143C'
                });
                $btn.css('border-color', '#DC143C');
                
                var $wishlistText = $btn.siblings('.mystery-box-wishlist-text');
                $wishlistText.text('Added to wishlist').css('color', '#DC143C');
            }
        });
    }

    // Animate heart icon
    function animateHeart($button) {
        $button.css('transform', 'scale(1.3)');
        setTimeout(function() {
            $button.css('transform', 'scale(1)');
        }, 300);
    }

    // Add to cart functionality
    function initAddToCart() {
        $('.mystery-box-add-to-cart-btn').on('click', function(e) {
            e.preventDefault();
            
            var $btn = $(this);
            var $productCard = $btn.closest('.mystery-box-product-card');
            var productTitle = $productCard.find('.mystery-box-product-title').text();
            var productPrice = $productCard.find('.mystery-box-price-amount').text();
            var productId = $btn.data('product-id');
            var price = $btn.data('price');
            
            // Add to cart animation
            addToCartAnimation($btn);
            
            // Check if WooCommerce is active
            if (typeof dokanxpressMysteryBox !== 'undefined' && dokanxpressMysteryBox.woocommerce_active) {
                // WooCommerce AJAX add to cart
                $.ajax({
                    url: dokanxpressMysteryBox.ajax_url,
                    type: 'POST',
                    data: {
                        action: 'dokanxpress_add_to_cart',
                        nonce: dokanxpressMysteryBox.nonce,
                        product_id: productId,
                        price: price
                    },
                    success: function(response) {
                        if (response.success) {
                            showNotification(productTitle + ' added to cart!', 'success');
                            // Update cart count if cart icon exists
                            if (typeof wc_add_to_cart_params !== 'undefined') {
                                $(document.body).trigger('added_to_cart', [response.data.fragments, response.data.cart_hash]);
                            }
                        } else {
                            showNotification('Failed to add product to cart', 'error');
                        }
                    },
                    error: function() {
                        showNotification('Error adding product to cart', 'error');
                    }
                });
            } else {
                // Fallback: localStorage cart
                addItemToCart({
                    title: productTitle,
                    price: productPrice,
                    id: productId || generateProductId(productTitle)
                });
                showNotification(productTitle + ' added to cart!', 'success');
            }
        });
    }

    // Add item to cart storage (fallback)
    function addItemToCart(item) {
        var cart = JSON.parse(localStorage.getItem('dokanxpress_cart') || '[]');
        
        // Check if item already exists
        var existingItem = cart.find(function(cartItem) {
            return cartItem.id === item.id;
        });
        
        if (existingItem) {
            existingItem.quantity = (existingItem.quantity || 1) + 1;
        } else {
            item.quantity = 1;
            cart.push(item);
        }
        
        localStorage.setItem('dokanxpress_cart', JSON.stringify(cart));
    }

    // Generate product ID from title
    function generateProductId(title) {
        return title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    }

    // Add to cart button animation
    function addToCartAnimation($button) {
        var originalText = $button.text();
        $button.text('Added!').css('background', '#28A745').prop('disabled', true);
        
        setTimeout(function() {
            $button.text(originalText).css('background', '').prop('disabled', false);
        }, 1500);
    }

    // Product card animations on scroll
    function initProductAnimations() {
        if (typeof IntersectionObserver !== 'undefined') {
            var observerOptions = {
                threshold: 0.1,
                rootMargin: '0px 0px -50px 0px'
            };
            
            var observer = new IntersectionObserver(function(entries) {
                entries.forEach(function(entry) {
                    if (entry.isIntersecting) {
                        $(entry.target).css({
                            'opacity': '1',
                            'transform': 'translateY(0)'
                        });
                    }
                });
            }, observerOptions);
            
            // Add animation to product cards
            $('.mystery-box-product-card').each(function(index) {
                var $card = $(this);
                $card.css({
                    'opacity': '0',
                    'transform': 'translateY(30px)',
                    'transition': 'opacity 0.6s ease ' + (index * 0.1) + 's, transform 0.6s ease ' + (index * 0.1) + 's'
                });
                observer.observe(this);
            });
        }
    }

    // Shop Now button functionality
    function initShopNowButtons() {
        $('.mystery-box-shop-now-btn').on('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            var $btn = $(this);
            var $productCard = $btn.closest('.mystery-box-product-card');
            var $addToCartBtn = $productCard.find('.mystery-box-add-to-cart-btn');
            
            // Scroll to product info section
            $('html, body').animate({
                scrollTop: $productCard.offset().top - 100
            }, 500);
            
            // Highlight the add to cart button
            setTimeout(function() {
                $addToCartBtn.css({
                    'transform': 'scale(1.05)',
                    'box-shadow': '0 6px 12px rgba(220, 20, 60, 0.4)'
                });
                
                setTimeout(function() {
                    $addToCartBtn.css({
                        'transform': '',
                        'box-shadow': ''
                    });
                }, 1000);
            }, 500);
        });
    }

    // Enhanced product burst animations on hover
    $('.mystery-box-product-card').on('mouseenter', function() {
        var $productItems = $(this).find('.mystery-box-product-item');
        $productItems.each(function(index) {
            var randomX = (Math.random() - 0.5) * 20;
            var randomY = (Math.random() - 0.5) * 20;
            $(this).css({
                '--tx': randomX + 'px',
                '--ty': randomY + 'px',
                'animation-delay': (index * 0.1) + 's'
            });
        });
    });

    // Notification system
    function showNotification(message, type) {
        type = type || 'info';
        
        // Remove existing notification if any
        $('.dokanxpress-notification').remove();
        
        var bgColor = type === 'success' ? '#28A745' : type === 'error' ? '#DC3545' : '#17A2B8';
        
        // Create notification element
        var $notification = $('<div>')
            .addClass('dokanxpress-notification dokanxpress-notification-' + type)
            .text(message)
            .css({
                'position': 'fixed',
                'top': '100px',
                'right': '20px',
                'background': bgColor,
                'color': 'white',
                'padding': '1rem 1.5rem',
                'border-radius': '8px',
                'box-shadow': '0 4px 12px rgba(0,0,0,0.15)',
                'z-index': '10000',
                'animation': 'dokanxpress-slideIn 0.3s ease',
                'font-weight': '500',
                'max-width': '300px'
            });
        
        // Add animation styles if not already present
        if (!$('#dokanxpress-notification-styles').length) {
            $('<style>')
                .attr('id', 'dokanxpress-notification-styles')
                .text('@keyframes dokanxpress-slideIn { from { transform: translateX(400px); opacity: 0; } to { transform: translateX(0); opacity: 1; } } @keyframes dokanxpress-slideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(400px); opacity: 0; } }')
                .appendTo('head');
        }
        
        $('body').append($notification);
        
        // Remove notification after 3 seconds
        setTimeout(function() {
            $notification.css('animation', 'dokanxpress-slideOut 0.3s ease');
            setTimeout(function() {
                $notification.remove();
            }, 300);
        }, 3000);
    }

    // Product image hover effects
    $('.mystery-box-product-image').on('mouseenter', function() {
        $(this).css({
            'transform': 'scale(1.05)',
            'transition': 'transform 0.3s ease'
        });
    }).on('mouseleave', function() {
        $(this).css({
            'transform': 'scale(1)',
            'transition': 'transform 0.3s ease'
        });
    });

})(jQuery);