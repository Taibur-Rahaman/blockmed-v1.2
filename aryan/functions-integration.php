<?php
/**
 * New Year Party Booking - WordPress Functions Integration
 * Add this code to your theme's functions.php file
 * Version: 1.0.0
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Register AJAX handlers for seat booking
 */
add_action('wp_ajax_ny_save_booking_data', 'ny_save_booking_data');
add_action('wp_ajax_nopriv_ny_save_booking_data', 'ny_save_booking_data');

add_action('wp_ajax_ny_get_occupied_seats', 'ny_get_occupied_seats');
add_action('wp_ajax_nopriv_ny_get_occupied_seats', 'ny_get_occupied_seats');

/**
 * Save booking data before Tickera checkout
 */
function ny_save_booking_data() {
    check_ajax_referer('ny_party_booking_nonce', 'nonce');
    
    $seats = isset($_POST['seats']) ? json_decode(stripslashes($_POST['seats']), true) : array();
    $total = isset($_POST['total']) ? floatval($_POST['total']) : 0;
    $event_id = isset($_POST['event_id']) ? intval($_POST['event_id']) : 0;
    
    if (empty($seats)) {
        wp_send_json_error(array('message' => 'No seats selected'));
        return;
    }
    
    // Generate unique booking ID
    $booking_id = 'NY-' . time() . '-' . wp_generate_password(6, false);
    
    // Store booking data in session or transient
    $booking_data = array(
        'booking_id' => $booking_id,
        'seats' => $seats,
        'total' => $total,
        'event_id' => $event_id,
        'user_id' => get_current_user_id(),
        'timestamp' => current_time('mysql'),
        'ip_address' => $_SERVER['REMOTE_ADDR']
    );
    
    // Store in transient for 1 hour (3600 seconds)
    set_transient('ny_booking_' . $booking_id, $booking_data, 3600);
    
    // Also store in session if available
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
    $_SESSION['ny_booking_data'] = $booking_data;
    
    // Optionally save to database (create custom table or use post meta)
    // ny_save_booking_to_database($booking_data);
    
    wp_send_json_success(array(
        'booking_id' => $booking_id,
        'message' => 'Booking data saved successfully'
    ));
}

/**
 * Get occupied/booked seats
 */
function ny_get_occupied_seats() {
    check_ajax_referer('ny_party_booking_nonce', 'nonce');
    
    // Get occupied seats from Tickera orders
    $occupied_seats = array();
    
    // Method 1: Get from Tickera orders if available
    if (function_exists('tc_get_event_orders')) {
        $event_id = get_option('ny_party_tickera_event_id', '');
        if (!empty($event_id)) {
            $orders = tc_get_event_orders($event_id);
            foreach ($orders as $order) {
                // Extract seat data from order meta
                $seat_data = get_post_meta($order->ID, 'ny_selected_seats', true);
                if (!empty($seat_data) && is_array($seat_data)) {
                    foreach ($seat_data as $seat) {
                        if (isset($seat['id'])) {
                            $occupied_seats[] = $seat['id'];
                        }
                    }
                }
            }
        }
    }
    
    // Method 2: Get from custom database table (if you create one)
    // $occupied_seats = ny_get_occupied_seats_from_db();
    
    // Method 3: Get from transients (temporary bookings)
    // This is a simple approach for demo purposes
    global $wpdb;
    $transients = $wpdb->get_col(
        "SELECT option_name FROM {$wpdb->options} 
         WHERE option_name LIKE '_transient_ny_booking_%' 
         AND option_value LIKE '%\"seats\"%'"
    );
    
    foreach ($transients as $transient_name) {
        $transient_key = str_replace('_transient_', '', $transient_name);
        $booking_data = get_transient($transient_key);
        if ($booking_data && isset($booking_data['seats'])) {
            foreach ($booking_data['seats'] as $seat) {
                if (isset($seat['id'])) {
                    $occupied_seats[] = $seat['id'];
                }
            }
        }
    }
    
    // Remove duplicates
    $occupied_seats = array_unique($occupied_seats);
    
    wp_send_json_success($occupied_seats);
}

/**
 * Hook into Tickera order completion to save seat data
 */
add_action('tc_order_paid', 'ny_save_seats_to_tickera_order', 10, 1);

function ny_save_seats_to_tickera_order($order_id) {
    // Get booking data from session
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
    
    if (isset($_SESSION['ny_booking_data'])) {
        $booking_data = $_SESSION['ny_booking_data'];
        
        // Save seat data to order meta
        update_post_meta($order_id, 'ny_selected_seats', $booking_data['seats']);
        update_post_meta($order_id, 'ny_booking_id', $booking_data['booking_id']);
        update_post_meta($order_id, 'ny_booking_total', $booking_data['total']);
        
        // Clear session
        unset($_SESSION['ny_booking_data']);
    }
}

/**
 * Add admin setting for Tickera Event ID
 */
add_action('admin_init', 'ny_register_settings');

function ny_register_settings() {
    register_setting('ny_party_settings', 'ny_party_tickera_event_id');
    register_setting('ny_party_settings', 'ny_party_service_fee_rate');
    register_setting('ny_party_settings', 'ny_party_max_seats_per_booking');
}

/**
 * Add admin menu for settings
 */
add_action('admin_menu', 'ny_add_admin_menu');

function ny_add_admin_menu() {
    add_options_page(
        'New Year Party Booking Settings',
        'NY Party Booking',
        'manage_options',
        'ny-party-booking',
        'ny_settings_page'
    );
}

/**
 * Settings page callback
 */
function ny_settings_page() {
    if (!current_user_can('manage_options')) {
        return;
    }
    
    if (isset($_POST['submit'])) {
        check_admin_referer('ny_settings_nonce');
        update_option('ny_party_tickera_event_id', intval($_POST['ny_party_tickera_event_id']));
        update_option('ny_party_service_fee_rate', floatval($_POST['ny_party_service_fee_rate']));
        update_option('ny_party_max_seats_per_booking', intval($_POST['ny_party_max_seats_per_booking']));
        echo '<div class="notice notice-success"><p>Settings saved!</p></div>';
    }
    
    $event_id = get_option('ny_party_tickera_event_id', '');
    $service_fee = get_option('ny_party_service_fee_rate', '0.10');
    $max_seats = get_option('ny_party_max_seats_per_booking', '10');
    ?>
    <div class="wrap">
        <h1>New Year Party Booking Settings</h1>
        <form method="post" action="">
            <?php wp_nonce_field('ny_settings_nonce'); ?>
            <table class="form-table">
                <tr>
                    <th scope="row">
                        <label for="ny_party_tickera_event_id">Tickera Event ID</label>
                    </th>
                    <td>
                        <input type="number" 
                               id="ny_party_tickera_event_id" 
                               name="ny_party_tickera_event_id" 
                               value="<?php echo esc_attr($event_id); ?>" 
                               class="regular-text" />
                        <p class="description">Enter the Tickera Event ID for your New Year party event.</p>
                    </td>
                </tr>
                <tr>
                    <th scope="row">
                        <label for="ny_party_service_fee_rate">Service Fee Rate</label>
                    </th>
                    <td>
                        <input type="number" 
                               id="ny_party_service_fee_rate" 
                               name="ny_party_service_fee_rate" 
                               value="<?php echo esc_attr($service_fee); ?>" 
                               step="0.01" 
                               min="0" 
                               max="1" 
                               class="regular-text" />
                        <p class="description">Service fee as decimal (e.g., 0.10 for 10%).</p>
                    </td>
                </tr>
                <tr>
                    <th scope="row">
                        <label for="ny_party_max_seats_per_booking">Max Seats Per Booking</label>
                    </th>
                    <td>
                        <input type="number" 
                               id="ny_party_max_seats_per_booking" 
                               name="ny_party_max_seats_per_booking" 
                               value="<?php echo esc_attr($max_seats); ?>" 
                               min="1" 
                               class="regular-text" />
                        <p class="description">Maximum number of seats a customer can book in one transaction.</p>
                    </td>
                </tr>
            </table>
            <?php submit_button(); ?>
        </form>
    </div>
    <?php
}

/**
 * Create custom database table for bookings (optional)
 * Run this once - you can add it to a plugin activation hook
 */
function ny_create_booking_table() {
    global $wpdb;
    $table_name = $wpdb->prefix . 'ny_party_bookings';
    $charset_collate = $wpdb->get_charset_collate();
    
    $sql = "CREATE TABLE IF NOT EXISTS $table_name (
        id bigint(20) NOT NULL AUTO_INCREMENT,
        booking_id varchar(50) NOT NULL,
        order_id bigint(20) DEFAULT NULL,
        user_id bigint(20) DEFAULT NULL,
        seats longtext NOT NULL,
        total decimal(10,2) NOT NULL,
        status varchar(20) DEFAULT 'pending',
        created_at datetime DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY booking_id (booking_id),
        KEY order_id (order_id),
        KEY user_id (user_id)
    ) $charset_collate;";
    
    require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
    dbDelta($sql);
}

/**
 * Save booking to database (if using custom table)
 */
function ny_save_booking_to_database($booking_data) {
    global $wpdb;
    $table_name = $wpdb->prefix . 'ny_party_bookings';
    
    $wpdb->insert(
        $table_name,
        array(
            'booking_id' => $booking_data['booking_id'],
            'user_id' => $booking_data['user_id'],
            'seats' => json_encode($booking_data['seats']),
            'total' => $booking_data['total'],
            'status' => 'pending'
        ),
        array('%s', '%d', '%s', '%f', '%s')
    );
}

/**
 * Get occupied seats from database
 */
function ny_get_occupied_seats_from_db() {
    global $wpdb;
    $table_name = $wpdb->prefix . 'ny_party_bookings';
    
    $bookings = $wpdb->get_results(
        "SELECT seats FROM $table_name WHERE status = 'confirmed'"
    );
    
    $occupied_seats = array();
    foreach ($bookings as $booking) {
        $seats = json_decode($booking->seats, true);
        if (is_array($seats)) {
            foreach ($seats as $seat) {
                if (isset($seat['id'])) {
                    $occupied_seats[] = $seat['id'];
                }
            }
        }
    }
    
    return array_unique($occupied_seats);
}
