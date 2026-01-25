<?php
/**
 * Plugin Name: DokanXpress Mystery Box Landing Page
 * Description: Shortcode for mystery box landing page compatible with Elementor
 * Version: 1.0.0
 * Author: DokanXpress
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Enqueue styles and scripts
function dokanxpress_mystery_box_enqueue_assets() {
    // Get the directory path where this file is located
    $plugin_url = plugin_dir_url(__FILE__);
    $plugin_path = plugin_dir_path(__FILE__);
    
    // Always load CSS/JS if shortcode might be used, or in Elementor editor
    $is_elementor_editor = (isset($_GET['elementor-preview']) || (is_admin() && isset($_GET['action']) && $_GET['action'] === 'elementor'));
    
    // Check if shortcode is used on current page or in Elementor editor
    global $post;
    $should_load = false;
    
    if ($is_elementor_editor) {
        $should_load = true;
    } elseif ($post && has_shortcode($post->post_content, 'dokanxpress_mystery_box')) {
        $should_load = true;
    } elseif (is_admin()) {
        $should_load = false; // Don't load on regular admin pages
    }
    
    // Also check if Elementor is being used (widget might have shortcode)
    if (!$should_load && function_exists('\Elementor\Plugin')) {
        $elementor = \Elementor\Plugin::$instance;
        if ($elementor->editor->is_edit_mode() || $elementor->preview->is_preview_mode()) {
            $should_load = true;
        }
    }
    
    if ($should_load) {
        // Check if files exist, fallback to theme directory if plugin structure is different
        $css_file = $plugin_path . 'mystery-box-elementor.css';
        $js_file = $plugin_path . 'mystery-box-elementor.js';
        
        // If files don't exist in plugin directory, try theme directory
        if (!file_exists($css_file)) {
            $css_url = get_template_directory_uri() . '/mystery-box-elementor.css';
        } else {
            $css_url = $plugin_url . 'mystery-box-elementor.css';
        }
        
        if (!file_exists($js_file)) {
            $js_url = get_template_directory_uri() . '/mystery-box-elementor.js';
        } else {
            $js_url = $plugin_url . 'mystery-box-elementor.js';
        }
        
        wp_enqueue_style(
            'dokanxpress-mystery-box-css',
            $css_url,
            array(),
            '1.0.0'
        );
        
        wp_enqueue_script(
            'dokanxpress-mystery-box-js',
            $js_url,
            array('jquery'),
            '1.0.0',
            true
        );
    }
}
add_action('wp_enqueue_scripts', 'dokanxpress_mystery_box_enqueue_assets');
add_action('elementor/frontend/after_enqueue_styles', 'dokanxpress_mystery_box_enqueue_assets');
add_action('elementor/editor/before_enqueue_scripts', 'dokanxpress_mystery_box_enqueue_assets');

// Shortcode: [dokanxpress_mystery_box]
function dokanxpress_mystery_box_shortcode($atts) {
    // Parse shortcode attributes
    $atts = shortcode_atts(array(
        'title' => 'Choose Your Mystery Box',
        'phone' => '01601677122',
        'website' => 'www.dokanxpress.com',
        'show_header' => 'true',
        'show_footer' => 'true',
    ), $atts, 'dokanxpress_mystery_box');
    
    ob_start();
    ?>
    
    <div class="dokanxpress-mystery-box-wrapper">
        <?php if ($atts['show_header'] === 'true'): ?>
        <!-- Hero Section -->
        <section class="mystery-box-hero-section">
            <div class="mystery-box-container">
                <h1 class="mystery-box-hero-title">Discover Amazing Surprises!</h1>
                <p class="mystery-box-hero-subtitle">Unbox the unexpected with our premium mystery boxes</p>
            </div>
        </section>
        <?php endif; ?>

        <!-- Products Section -->
        <section class="mystery-box-products-section">
            <div class="mystery-box-container">
                <h2 class="mystery-box-section-title"><?php echo esc_html($atts['title']); ?></h2>
                <div class="mystery-box-products-grid">
                    
                    <!-- Product Card 1: 199 TK -->
                    <?php echo dokanxpress_mystery_box_card('199', '199.00', 'DX-199 TK Mystery Box', 'mystery-box-199', $atts); ?>
                    
                    <!-- Product Card 2: 399 TK -->
                    <?php echo dokanxpress_mystery_box_card('399', '399.00', 'DX- 399 TK Mystery Box', 'mystery-box-399', $atts); ?>
                    
                    <!-- Product Card 3: 799 TK -->
                    <?php echo dokanxpress_mystery_box_card('799', '799.00', 'DX- 799 TK Mystery Box', 'mystery-box-799', $atts); ?>
                    
                </div>
            </div>
        </section>

        <?php if ($atts['show_footer'] === 'true'): ?>
        <!-- Footer -->
        <footer class="mystery-box-footer">
            <div class="mystery-box-container">
                <div class="mystery-box-footer-content">
                    <div class="mystery-box-footer-section">
                        <h4>Contact Us</h4>
                        <p>Phone: <?php echo esc_html($atts['phone']); ?></p>
                        <p>Website: <?php echo esc_html($atts['website']); ?></p>
                    </div>
                    <div class="mystery-box-footer-section">
                        <h4>Follow Us</h4>
                        <div class="mystery-box-social-links">
                            <a href="#" class="mystery-box-social-link">Facebook</a>
                            <a href="#" class="mystery-box-social-link">Instagram</a>
                            <a href="#" class="mystery-box-social-link">Twitter</a>
                        </div>
                    </div>
                </div>
                <div class="mystery-box-footer-bottom">
                    <p>&copy; <?php echo date('Y'); ?> DokanXpress. All rights reserved.</p>
                </div>
            </div>
        </footer>
        <?php endif; ?>
    </div>
    
    <?php
    return ob_get_clean();
}
add_shortcode('dokanxpress_mystery_box', 'dokanxpress_mystery_box_shortcode');

// Function to generate product card HTML
function dokanxpress_mystery_box_card($price_id, $price_amount, $title, $product_id, $atts) {
    ob_start();
    ?>
    <div class="mystery-box-product-card">
        <div class="mystery-box-wishlist-section">
            <button class="mystery-box-wishlist-btn" data-product="<?php echo esc_attr($product_id); ?>">
                <svg class="mystery-box-heart-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
            </button>
            <span class="mystery-box-wishlist-text">Add to wishlist</span>
        </div>
        
        <div class="mystery-box-product-image-wrapper">
            <div class="mystery-box-product-image mystery-box-image">
                <div class="mystery-box-image-overlay">
                    <div class="mystery-box-curtains">
                        <div class="mystery-box-curtain-left"></div>
                        <div class="mystery-box-curtain-right"></div>
                    </div>
                    <div class="mystery-box-logo-badge">দোকান</div>
                    <div class="mystery-box-mystery-banner">MYSTERY BOX</div>
                    <div class="mystery-box-gift-box-container">
                        <div class="mystery-box-glowing-gift-box">
                            <div class="mystery-box-gift-box"></div>
                            <div class="mystery-box-gift-lid"></div>
                            <div class="mystery-box-gift-glow"></div>
                        </div>
                        <div class="mystery-box-products-burst">
                            <div class="mystery-box-product-item mystery-box-product-tv"></div>
                            <div class="mystery-box-product-item mystery-box-product-laptop"></div>
                            <div class="mystery-box-product-item mystery-box-product-gpu"></div>
                            <div class="mystery-box-product-item mystery-box-product-shoes"></div>
                            <div class="mystery-box-product-item mystery-box-product-phone"></div>
                            <div class="mystery-box-product-item mystery-box-product-lipstick"></div>
                        </div>
                    </div>
                    <button class="mystery-box-shop-now-btn">SHOP NOW</button>
                    <div class="mystery-box-contact-info">
                        <div class="mystery-box-contact-item">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                            </svg>
                            <span><?php echo esc_html($atts['phone']); ?></span>
                        </div>
                        <div class="mystery-box-contact-item">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                            </svg>
                            <span><?php echo esc_html($atts['website']); ?></span>
                        </div>
                        <div class="mystery-box-contact-item">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                            </svg>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="mystery-box-product-info">
            <h3 class="mystery-box-product-title"><?php echo esc_html($title); ?></h3>
            <div class="mystery-box-product-price">
                <span class="mystery-box-price-amount"><?php echo esc_html($price_amount); ?></span>
                <span class="mystery-box-currency">৳</span>
            </div>
            <?php if (class_exists('WooCommerce')): ?>
                <button class="mystery-box-add-to-cart-btn" data-product-id="<?php echo esc_attr($price_id); ?>" data-price="<?php echo esc_attr($price_amount); ?>">
                    Add to Cart
                </button>
            <?php else: ?>
                <button class="mystery-box-add-to-cart-btn" onclick="alert('WooCommerce not installed. Please install WooCommerce to enable cart functionality.');">
                    Add to Cart
                </button>
            <?php endif; ?>
        </div>
    </div>
    <?php
    return ob_get_clean();
}

// WooCommerce Integration (if WooCommerce is active)
function dokanxpress_mystery_box_add_to_cart_ajax() {
    if (!class_exists('WooCommerce')) {
        wp_send_json_error('WooCommerce is not installed');
        return;
    }
    
    check_ajax_referer('dokanxpress_mystery_box_nonce', 'nonce');
    
    $product_id = isset($_POST['product_id']) ? intval($_POST['product_id']) : 0;
    $price = isset($_POST['price']) ? floatval($_POST['price']) : 0;
    
    if (!$product_id || !$price) {
        wp_send_json_error('Invalid product data');
        return;
    }
    
    // Add to WooCommerce cart
    $cart_item_key = WC()->cart->add_to_cart($product_id, 1);
    
    if ($cart_item_key) {
        wp_send_json_success(array(
            'message' => 'Product added to cart successfully',
            'cart_count' => WC()->cart->get_cart_contents_count()
        ));
    } else {
        wp_send_json_error('Failed to add product to cart');
    }
}
add_action('wp_ajax_dokanxpress_add_to_cart', 'dokanxpress_mystery_box_add_to_cart_ajax');
add_action('wp_ajax_nopriv_dokanxpress_add_to_cart', 'dokanxpress_mystery_box_add_to_cart_ajax');

// Localize script with AJAX URL
function dokanxpress_mystery_box_localize_script() {
    wp_localize_script('dokanxpress-mystery-box-js', 'dokanxpressMysteryBox', array(
        'ajax_url' => admin_url('admin-ajax.php'),
        'nonce' => wp_create_nonce('dokanxpress_mystery_box_nonce'),
        'woocommerce_active' => class_exists('WooCommerce'),
    ));
}
add_action('wp_enqueue_scripts', 'dokanxpress_mystery_box_localize_script');