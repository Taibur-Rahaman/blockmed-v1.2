/**
 * New Year Party Seat Booking - JavaScript
 * Version: 1.0.0
 */

(function($) {
    'use strict';

    // Global state
    const NYBooking = {
        selectedSeats: [],
        serviceFeeRate: 0.10, // 10% service fee
        occupiedSeats: [], // Will be populated from server
        maxSeatsPerBooking: 10,
        
        init: function() {
            this.bindEvents();
            this.loadOccupiedSeats();
            this.updateSummary();
        },

        bindEvents: function() {
            // Seat selection
            $(document).on('click', '.ny-seat:not(.ny-seat-occupied)', this.handleSeatClick.bind(this));
            
            // Remove seat
            $(document).on('click', '.ny-seat-item-remove', this.handleRemoveSeat.bind(this));
            
            // Proceed to checkout
            $(document).on('click', '#ny-proceed-booking', this.handleProceedToCheckout.bind(this));
            
            // Prevent default form submission
            $('#ny-seat-booking-form').on('submit', function(e) {
                e.preventDefault();
            });
        },

        handleSeatClick: function(e) {
            const $seat = $(e.currentTarget);
            const seatId = $seat.data('seat-id');
            const section = $seat.closest('.ny-seat-grid').data('section');
            const price = parseFloat($seat.closest('.ny-seat-grid').data('price'));
            
            // Check if already selected
            const existingIndex = this.selectedSeats.findIndex(seat => seat.id === seatId);
            
            if (existingIndex > -1) {
                // Deselect seat
                this.removeSeat(seatId);
            } else {
                // Check max seats limit
                if (this.selectedSeats.length >= this.maxSeatsPerBooking) {
                    this.showMessage('You can select a maximum of ' + this.maxSeatsPerBooking + ' seats per booking.', 'error');
                    return;
                }
                
                // Check if seat is occupied
                if (this.occupiedSeats.includes(seatId)) {
                    this.showMessage('This seat is already booked. Please select another seat.', 'error');
                    return;
                }
                
                // Add seat
                this.addSeat({
                    id: seatId,
                    section: section,
                    price: price,
                    row: $seat.data('row'),
                    number: $seat.data('number')
                });
            }
        },

        addSeat: function(seatData) {
            this.selectedSeats.push(seatData);
            this.updateSeatDisplay(seatData.id, 'selected');
            this.updateSummary();
            this.updateProceedButton();
        },

        removeSeat: function(seatId) {
            this.selectedSeats = this.selectedSeats.filter(seat => seat.id !== seatId);
            this.updateSeatDisplay(seatId, 'available');
            this.updateSummary();
            this.updateProceedButton();
        },

        handleRemoveSeat: function(e) {
            e.stopPropagation();
            const seatId = $(e.currentTarget).data('seat-id');
            this.removeSeat(seatId);
        },

        updateSeatDisplay: function(seatId, state) {
            const $seat = $('.ny-seat[data-seat-id="' + seatId + '"]');
            
            $seat.removeClass('ny-seat-selected ny-seat-occupied');
            
            if (state === 'selected') {
                $seat.addClass('ny-seat-selected');
            } else if (state === 'occupied') {
                $seat.addClass('ny-seat-occupied');
            }
        },

        updateSummary: function() {
            const $summaryContainer = $('#ny-selected-seats');
            const $noSeats = $summaryContainer.find('.ny-no-seats');
            
            // Clear existing items
            $summaryContainer.find('.ny-seat-item').remove();
            
            if (this.selectedSeats.length === 0) {
                if ($noSeats.length === 0) {
                    $summaryContainer.html('<p class="ny-no-seats">No seats selected yet</p>');
                }
            } else {
                $noSeats.remove();
                
                // Add selected seats
                this.selectedSeats.forEach(seat => {
                    const $seatItem = $('<div>').addClass('ny-seat-item');
                    const $info = $('<div>').addClass('ny-seat-item-info');
                    const $id = $('<div>').addClass('ny-seat-item-id').text(seat.id);
                    const $section = $('<div>').addClass('ny-seat-item-section').text(seat.section.toUpperCase());
                    const $price = $('<span>').addClass('ny-seat-item-price').text('$' + seat.price.toFixed(2));
                    const $remove = $('<button>')
                        .addClass('ny-seat-item-remove')
                        .attr('data-seat-id', seat.id)
                        .text('Remove');
                    
                    $info.append($id).append($section);
                    $seatItem.append($info).append($price).append($remove);
                    $summaryContainer.append($seatItem);
                });
            }
            
            // Update totals
            this.updateTotals();
        },

        updateTotals: function() {
            const subtotal = this.selectedSeats.reduce((sum, seat) => sum + seat.price, 0);
            const serviceFee = subtotal * this.serviceFeeRate;
            const total = subtotal + serviceFee;
            
            $('#ny-subtotal').text('$' + subtotal.toFixed(2));
            $('#ny-service-fee').text('$' + serviceFee.toFixed(2));
            $('#ny-total').text('$' + total.toFixed(2));
            
            // Update hidden form fields
            $('#ny-selected-seats-data').val(JSON.stringify(this.selectedSeats));
            $('#ny-total-amount-data').val(total.toFixed(2));
        },

        updateProceedButton: function() {
            const $button = $('#ny-proceed-booking');
            
            if (this.selectedSeats.length > 0) {
                $button.prop('disabled', false);
            } else {
                $button.prop('disabled', true);
            }
        },

        handleProceedToCheckout: function(e) {
            e.preventDefault();
            
            if (this.selectedSeats.length === 0) {
                this.showMessage('Please select at least one seat before proceeding.', 'error');
                return;
            }
            
            // Show loading state
            const $button = $('#ny-proceed-booking');
            const originalText = $button.html();
            $button.prop('disabled', true).html('<span class="ny-loading"></span> Processing...');
            
            // Prepare booking data
            const bookingData = {
                action: 'ny_save_booking_data',
                nonce: nyPartyBooking.nonce,
                seats: this.selectedSeats,
                total: this.calculateTotal(),
                event_id: nyPartyBooking.tickera_event_id
            };
            
            // Save booking data via AJAX
            $.ajax({
                url: nyPartyBooking.ajax_url,
                type: 'POST',
                data: bookingData,
                success: (response) => {
                    if (response.success) {
                        // Show Tickera checkout
                        this.showTickeraCheckout(response.data);
                        
                        // Scroll to checkout
                        $('html, body').animate({
                            scrollTop: $('#ny-tickera-checkout').offset().top - 100
                        }, 500);
                    } else {
                        this.showMessage(response.data.message || 'An error occurred. Please try again.', 'error');
                        $button.prop('disabled', false).html(originalText);
                    }
                },
                error: () => {
                    this.showMessage('Network error. Please check your connection and try again.', 'error');
                    $button.prop('disabled', false).html(originalText);
                }
            });
        },

        showTickeraCheckout: function(data) {
            const $checkout = $('#ny-tickera-checkout');
            
            // Store booking data in sessionStorage for Tickera integration
            sessionStorage.setItem('ny_booking_data', JSON.stringify({
                seats: this.selectedSeats,
                total: this.calculateTotal(),
                booking_id: data.booking_id || null
            }));
            
            // Show checkout section
            $checkout.slideDown(300);
            
            // If Tickera event ID is set, trigger ticket selection
            if (nyPartyBooking.tickera_event_id) {
                this.triggerTickeraBooking();
            }
        },

        triggerTickeraBooking: function() {
            // This function integrates with Tickera Premium
            // It will be called when Tickera loads to pass seat data
            
            // Wait for Tickera to be ready
            if (typeof window.tc !== 'undefined') {
                // Tickera is loaded, you can interact with it
                this.integrateWithTickera();
            } else {
                // Wait for Tickera to load
                let attempts = 0;
                const checkTickera = setInterval(() => {
                    attempts++;
                    if (typeof window.tc !== 'undefined') {
                        clearInterval(checkTickera);
                        this.integrateWithTickera();
                    } else if (attempts > 50) {
                        clearInterval(checkTickera);
                        console.warn('Tickera not loaded after timeout');
                    }
                }, 100);
            }
        },

        integrateWithTickera: function() {
            // Custom integration with Tickera Premium
            // This is a placeholder - adjust based on your Tickera Premium API
            
            const bookingData = JSON.parse(sessionStorage.getItem('ny_booking_data') || '{}');
            
            // You can customize ticket quantities based on selected seats
            // For example, if you have different ticket types for different sections:
            
            // VIP seats -> VIP ticket type
            // Standard seats -> Standard ticket type
            // Economy seats -> Economy ticket type
            
            // Example: Set ticket quantities
            if (bookingData.seats) {
                bookingData.seats.forEach(seat => {
                    // Map seat section to ticket type
                    // This depends on how you've set up your Tickera event
                    console.log('Seat booked:', seat.id, 'Section:', seat.section);
                });
            }
            
            // Trigger custom event for Tickera integration
            $(document).trigger('ny_booking_ready', [bookingData]);
        },

        calculateTotal: function() {
            const subtotal = this.selectedSeats.reduce((sum, seat) => sum + seat.price, 0);
            const serviceFee = subtotal * this.serviceFeeRate;
            return subtotal + serviceFee;
        },

        loadOccupiedSeats: function() {
            // Load already booked seats from server
            $.ajax({
                url: nyPartyBooking.ajax_url,
                type: 'POST',
                data: {
                    action: 'ny_get_occupied_seats',
                    nonce: nyPartyBooking.nonce
                },
                success: (response) => {
                    if (response.success && response.data) {
                        this.occupiedSeats = response.data;
                        this.markOccupiedSeats();
                    }
                },
                error: () => {
                    console.warn('Could not load occupied seats');
                }
            });
        },

        markOccupiedSeats: function() {
            this.occupiedSeats.forEach(seatId => {
                this.updateSeatDisplay(seatId, 'occupied');
            });
        },

        showMessage: function(message, type) {
            type = type || 'info';
            const $message = $('<div>')
                .addClass('ny-' + type + '-message')
                .text(message);
            
            // Remove existing messages
            $('.ny-success-message, .ny-error-message').remove();
            
            // Insert message
            $('.ny-booking-summary').prepend($message);
            
            // Auto-remove after 5 seconds
            setTimeout(() => {
                $message.fadeOut(300, function() {
                    $(this).remove();
                });
            }, 5000);
        }
    };

    // Initialize on document ready
    $(document).ready(function() {
        NYBooking.init();
    });

    // Expose to global scope for external access
    window.NYBooking = NYBooking;

})(jQuery);
