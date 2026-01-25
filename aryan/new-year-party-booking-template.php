<?php
/**
 * Template Name: New Year Party Seat Booking
 * Description: Custom page template for New Year private party seat booking with Tickera Premium
 * Version: 1.0
 */

// Enqueue scripts and styles
wp_enqueue_style('ny-party-booking-style', get_template_directory_uri() . '/css/new-year-party-booking.css', array(), '1.0.0');
wp_enqueue_script('ny-party-booking-script', get_template_directory_uri() . '/js/new-year-party-booking.js', array('jquery'), '1.0.0', true);

// Localize script for AJAX
wp_localize_script('ny-party-booking-script', 'nyPartyBooking', array(
    'ajax_url' => admin_url('admin-ajax.php'),
    'nonce' => wp_create_nonce('ny_party_booking_nonce'),
    'tickera_event_id' => get_option('ny_party_tickera_event_id', ''),
));

get_header(); ?>

<div class="ny-party-booking-container">
    <div class="ny-party-header">
        <div class="ny-party-title-wrapper">
            <h1 class="ny-party-title">🎉 New Year Private Party 2025 🎉</h1>
            <p class="ny-party-subtitle">Reserve Your Exclusive Seat</p>
            <div class="ny-party-date">
                <span class="ny-date-icon">📅</span>
                <span class="ny-date-text">December 31, 2024 | 8:00 PM - 2:00 AM</span>
            </div>
        </div>
    </div>

    <div class="ny-booking-wrapper">
        <div class="ny-seat-selection-section">
            <h2 class="ny-section-title">Select Your Seat</h2>
            <p class="ny-section-description">Choose your preferred seating area for the ultimate New Year celebration experience.</p>
            
            <!-- Seat Map Container -->
            <div class="ny-seat-map-container">
                <div class="ny-stage-indicator">
                    <div class="ny-stage-label">STAGE</div>
                </div>
                
                <!-- Premium VIP Section -->
                <div class="ny-seat-section ny-vip-section">
                    <h3 class="ny-section-name">VIP Premium</h3>
                    <div class="ny-seat-grid" data-section="vip" data-price="150">
                        <?php
                        // Generate VIP seats (2 rows x 8 seats = 16 seats)
                        for ($row = 1; $row <= 2; $row++) {
                            for ($seat = 1; $seat <= 8; $seat++) {
                                $seat_id = 'V' . $row . '-' . str_pad($seat, 2, '0', STR_PAD_LEFT);
                                echo '<div class="ny-seat ny-seat-vip" data-seat-id="' . esc_attr($seat_id) . '" data-row="' . $row . '" data-number="' . $seat . '">';
                                echo '<span class="ny-seat-label">' . esc_html($seat_id) . '</span>';
                                echo '</div>';
                            }
                        }
                        ?>
                    </div>
                    <div class="ny-section-price">$150 per seat</div>
                </div>

                <!-- Standard Section -->
                <div class="ny-seat-section ny-standard-section">
                    <h3 class="ny-section-name">Standard</h3>
                    <div class="ny-seat-grid" data-section="standard" data-price="75">
                        <?php
                        // Generate Standard seats (4 rows x 10 seats = 40 seats)
                        for ($row = 1; $row <= 4; $row++) {
                            for ($seat = 1; $seat <= 10; $seat++) {
                                $seat_id = 'S' . $row . '-' . str_pad($seat, 2, '0', STR_PAD_LEFT);
                                echo '<div class="ny-seat ny-seat-standard" data-seat-id="' . esc_attr($seat_id) . '" data-row="' . $row . '" data-number="' . $seat . '">';
                                echo '<span class="ny-seat-label">' . esc_html($seat_id) . '</span>';
                                echo '</div>';
                            }
                        }
                        ?>
                    </div>
                    <div class="ny-section-price">$75 per seat</div>
                </div>

                <!-- Economy Section -->
                <div class="ny-seat-section ny-economy-section">
                    <h3 class="ny-section-name">Economy</h3>
                    <div class="ny-seat-grid" data-section="economy" data-price="45">
                        <?php
                        // Generate Economy seats (3 rows x 12 seats = 36 seats)
                        for ($row = 1; $row <= 3; $row++) {
                            for ($seat = 1; $seat <= 12; $seat++) {
                                $seat_id = 'E' . $row . '-' . str_pad($seat, 2, '0', STR_PAD_LEFT);
                                echo '<div class="ny-seat ny-seat-economy" data-seat-id="' . esc_attr($seat_id) . '" data-row="' . $row . '" data-number="' . $seat . '">';
                                echo '<span class="ny-seat-label">' . esc_html($seat_id) . '</span>';
                                echo '</div>';
                            }
                        }
                        ?>
                    </div>
                    <div class="ny-section-price">$45 per seat</div>
                </div>
            </div>

            <!-- Legend -->
            <div class="ny-seat-legend">
                <div class="ny-legend-item">
                    <div class="ny-seat ny-seat-vip ny-legend-seat"></div>
                    <span>VIP Premium - $150</span>
                </div>
                <div class="ny-legend-item">
                    <div class="ny-seat ny-seat-standard ny-legend-seat"></div>
                    <span>Standard - $75</span>
                </div>
                <div class="ny-legend-item">
                    <div class="ny-seat ny-seat-economy ny-legend-seat"></div>
                    <span>Economy - $45</span>
                </div>
                <div class="ny-legend-item">
                    <div class="ny-seat ny-seat-selected ny-legend-seat"></div>
                    <span>Selected</span>
                </div>
                <div class="ny-legend-item">
                    <div class="ny-seat ny-seat-occupied ny-legend-seat"></div>
                    <span>Occupied</span>
                </div>
            </div>
        </div>

        <!-- Booking Summary Sidebar -->
        <div class="ny-booking-sidebar">
            <div class="ny-booking-summary">
                <h3 class="ny-summary-title">Booking Summary</h3>
                <div class="ny-selected-seats-list" id="ny-selected-seats">
                    <p class="ny-no-seats">No seats selected yet</p>
                </div>
                <div class="ny-booking-totals">
                    <div class="ny-total-item">
                        <span class="ny-total-label">Subtotal:</span>
                        <span class="ny-total-value" id="ny-subtotal">$0.00</span>
                    </div>
                    <div class="ny-total-item">
                        <span class="ny-total-label">Service Fee:</span>
                        <span class="ny-total-value" id="ny-service-fee">$0.00</span>
                    </div>
                    <div class="ny-total-item ny-total-final">
                        <span class="ny-total-label">Total:</span>
                        <span class="ny-total-value" id="ny-total">$0.00</span>
                    </div>
                </div>
                <button class="ny-proceed-btn" id="ny-proceed-booking" disabled>
                    Proceed to Checkout
                </button>
            </div>

            <!-- Tickera Integration -->
            <div class="ny-tickera-checkout" id="ny-tickera-checkout" style="display: none;">
                <?php
                // Tickera Premium Integration
                // Make sure you have created an event in Tickera with the event ID
                $tickera_event_id = get_option('ny_party_tickera_event_id', ''); // Set this in WordPress admin
                
                if (!empty($tickera_event_id) && function_exists('tc_get_event')) {
                    // Display Tickera ticket selection
                    echo do_shortcode('[tc_event id="' . esc_attr($tickera_event_id) . '"]');
                } else {
                    // Fallback: Manual Tickera shortcode
                    // Replace 'YOUR_EVENT_ID' with your actual Tickera event ID
                    echo '<div class="ny-tickera-notice">';
                    echo '<p>Please configure your Tickera event ID in WordPress admin settings.</p>';
                    echo '<p>Or use this shortcode: <code>[tc_event id="YOUR_EVENT_ID"]</code></p>';
                    echo '</div>';
                }
                ?>
            </div>
        </div>
    </div>

    <!-- Party Details Section -->
    <div class="ny-party-details">
        <div class="ny-details-grid">
            <div class="ny-detail-card">
                <div class="ny-detail-icon">🎵</div>
                <h4>Live Music</h4>
                <p>Top DJs and live performances</p>
            </div>
            <div class="ny-detail-card">
                <div class="ny-detail-icon">🍾</div>
                <h4>Premium Bar</h4>
                <p>Open bar with premium drinks</p>
            </div>
            <div class="ny-detail-card">
                <div class="ny-detail-icon">🍽️</div>
                <h4>Gourmet Buffet</h4>
                <p>Delicious food throughout the night</p>
            </div>
            <div class="ny-detail-card">
                <div class="ny-detail-icon">🎆</div>
                <h4>Midnight Countdown</h4>
                <p>Special celebration at midnight</p>
            </div>
        </div>
    </div>
</div>

<!-- Hidden form to store selected seats data -->
<form id="ny-seat-booking-form" style="display: none;">
    <input type="hidden" name="selected_seats" id="ny-selected-seats-data" value="">
    <input type="hidden" name="total_amount" id="ny-total-amount-data" value="0">
    <input type="hidden" name="booking_type" value="new_year_party">
</form>

<?php get_footer(); ?>
