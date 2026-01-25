# New Year Party Seat Booking System - Setup Guide

A complete WordPress page template for New Year private party seat booking with Tickera Premium integration.

## 📋 Table of Contents

- [Features](#features)
- [Requirements](#requirements)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Customization](#customization)
- [Troubleshooting](#troubleshooting)

## ✨ Features

- **Interactive Seat Map**: Visual seat selection with VIP, Standard, and Economy sections
- **Real-time Availability**: Shows occupied seats in real-time
- **Booking Summary**: Live calculation of subtotal, service fee, and total
- **Tickera Premium Integration**: Seamless integration with Tickera Premium plugin
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile devices
- **Beautiful UI**: Modern, festive design with animations and gradients
- **AJAX-powered**: Smooth, no-page-refresh booking experience

## 🔧 Requirements

1. **WordPress** 5.0 or higher
2. **Tickera Premium** plugin (Version 3.5.1.5 or higher)
3. **PHP** 7.4 or higher
4. **jQuery** (usually included with WordPress)

## 📦 Installation

### Step 1: Upload Files

1. Upload the following files to your WordPress theme directory:
   - `new-year-party-booking-template.php` → Upload to your active theme's root directory
   - `new-year-party-booking.css` → Upload to `/wp-content/themes/your-theme/css/` (create the `css` folder if it doesn't exist)
   - `new-year-party-booking.js` → Upload to `/wp-content/themes/your-theme/js/` (create the `js` folder if it doesn't exist)

### Step 2: Add Functions Integration

1. Open your theme's `functions.php` file
2. Add the code from `functions-integration.php` at the end of the file
3. Save the file

**Important**: Make sure to add this code properly. If you're not comfortable editing `functions.php`, consider using a child theme.

### Step 3: Create the Page

1. Go to **WordPress Admin** → **Pages** → **Add New**
2. Enter page title: "New Year Party Booking" (or your preferred title)
3. In the **Page Attributes** meta box, select **Template**: "New Year Party Seat Booking"
4. Click **Publish**

### Step 4: Create Tickera Event

1. Go to **Tickera** → **Events** → **Add New**
2. Create your New Year party event
3. Note down the **Event ID** (you'll need this in the next step)

### Step 5: Configure Settings

1. Go to **WordPress Admin** → **Settings** → **NY Party Booking**
2. Enter your **Tickera Event ID**
3. Set **Service Fee Rate** (e.g., 0.10 for 10%)
4. Set **Max Seats Per Booking** (default: 10)
5. Click **Save Changes**

## ⚙️ Configuration

### Update File Paths in Template

If your CSS and JS files are in different locations, update the paths in `new-year-party-booking-template.php`:

```php
// Line ~150-151
wp_enqueue_style('ny-party-booking-style', get_template_directory_uri() . '/css/new-year-party-booking.css', array(), '1.0.0');
wp_enqueue_script('ny-party-booking-script', get_template_directory_uri() . '/js/new-year-party-booking.js', array('jquery'), '1.0.0', true);
```

### Customize Seat Layout

Edit the seat generation code in `new-year-party-booking-template.php`:

```php
// VIP Section (around line 50)
for ($row = 1; $row <= 2; $row++) {
    for ($seat = 1; $seat <= 8; $seat++) {
        // Adjust rows and seats as needed
    }
}
```

### Adjust Pricing

Update the `data-price` attributes in the seat grid sections:

```php
// Line ~45
<div class="ny-seat-grid" data-section="vip" data-price="150">
<div class="ny-seat-grid" data-section="standard" data-price="75">
<div class="ny-seat-grid" data-section="economy" data-price="45">
```

### Modify Service Fee

Update in two places:

1. **JavaScript** (`new-year-party-booking.js` line ~10):
   ```javascript
   serviceFeeRate: 0.10, // 10% service fee
   ```

2. **WordPress Admin** → **Settings** → **NY Party Booking**

## 🎨 Customization

### Change Colors

Edit `new-year-party-booking.css`:

```css
/* Main gradient background */
.ny-party-booking-container {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

/* VIP seats */
.ny-seat-vip {
    background: linear-gradient(135deg, #feca57 0%, #ff9ff3 100%);
}

/* Standard seats */
.ny-seat-standard {
    background: linear-gradient(135deg, #48dbfb 0%, #0abde3 100%);
}

/* Economy seats */
.ny-seat-economy {
    background: linear-gradient(135deg, #55efc4 0%, #00b894 100%);
}
```

### Change Party Details

Edit the party details section in `new-year-party-booking-template.php` (around line 120):

```php
<div class="ny-detail-card">
    <div class="ny-detail-icon">🎵</div>
    <h4>Live Music</h4>
    <p>Top DJs and live performances</p>
</div>
```

### Update Date and Time

Edit the header section (around line 15):

```php
<span class="ny-date-text">December 31, 2024 | 8:00 PM - 2:00 AM</span>
```

## 🔌 Tickera Integration

### Basic Integration

The template automatically displays Tickera checkout when you:
1. Set the Event ID in settings
2. User clicks "Proceed to Checkout"

### Advanced Integration

For custom ticket types based on seat sections, modify `integrateWithTickera()` function in `new-year-party-booking.js`:

```javascript
integrateWithTickera: function() {
    const bookingData = JSON.parse(sessionStorage.getItem('ny_booking_data') || '{}');
    
    // Map seats to ticket types
    bookingData.seats.forEach(seat => {
        if (seat.section === 'vip') {
            // Set VIP ticket quantity
        } else if (seat.section === 'standard') {
            // Set Standard ticket quantity
        } else if (seat.section === 'economy') {
            // Set Economy ticket quantity
        }
    });
}
```

### Using Tickera Shortcode

If automatic integration doesn't work, you can manually add the Tickera shortcode in the template:

```php
// Replace line ~95 in the template
echo do_shortcode('[tc_event id="YOUR_EVENT_ID"]');
```

## 🗄️ Database (Optional)

For persistent booking storage, uncomment and use the database functions:

1. Run `ny_create_booking_table()` once (add to plugin activation or run manually)
2. Uncomment `ny_save_booking_to_database()` call in `ny_save_booking_data()`
3. Update `ny_get_occupied_seats()` to use `ny_get_occupied_seats_from_db()`

## 🐛 Troubleshooting

### Seats Not Showing

- Check that CSS and JS files are properly enqueued
- Verify file paths in the template
- Check browser console for JavaScript errors

### Tickera Not Loading

- Verify Tickera Premium is installed and activated
- Check that Event ID is correctly set in settings
- Ensure Tickera shortcode works on a regular page first

### AJAX Errors

- Check that nonce is properly set
- Verify `functions-integration.php` code is added to `functions.php`
- Check WordPress debug log for PHP errors

### Occupied Seats Not Updating

- Clear transients: `wp transient delete --all` (via WP-CLI)
- Or manually clear in database: `DELETE FROM wp_options WHERE option_name LIKE '_transient_ny_booking_%'`
- Check that `ny_get_occupied_seats()` function is working

### Styling Issues

- Clear browser cache
- Check that CSS file is loading (view page source)
- Verify no theme conflicts (try switching to default theme temporarily)

## 📝 File Structure

```
your-theme/
├── new-year-party-booking-template.php
├── functions.php (add integration code)
├── css/
│   └── new-year-party-booking.css
└── js/
    └── new-year-party-booking.js
```

## 🔐 Security Notes

- All AJAX requests are protected with nonces
- User input is sanitized and validated
- SQL queries use prepared statements (in database functions)
- Session data is cleared after order completion

## 📞 Support

For issues or questions:
1. Check browser console for JavaScript errors
2. Enable WordPress debug mode: `define('WP_DEBUG', true);` in `wp-config.php`
3. Check Tickera documentation for plugin-specific issues

## 📄 License

This code is provided as-is for use with WordPress and Tickera Premium.

## 🎉 Enjoy Your New Year Party Booking System!

If you need any modifications or have questions, feel free to customize the code to fit your specific needs.

---

**Version**: 1.0.0  
**Last Updated**: December 2024  
**Compatible with**: Tickera Premium 3.5.1.5+
