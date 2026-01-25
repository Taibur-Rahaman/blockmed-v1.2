# Quick Start Guide - New Year Party Booking

## 🚀 5-Minute Setup

### Step 1: Upload Files (2 minutes)

1. **Copy these files to your WordPress theme:**
   - `new-year-party-booking-template.php` → Theme root folder
   - `new-year-party-booking.css` → `wp-content/themes/your-theme/css/`
   - `new-year-party-booking.js` → `wp-content/themes/your-theme/js/`

   **Note:** Create `css` and `js` folders if they don't exist.

### Step 2: Add Functions Code (1 minute)

1. Open your theme's `functions.php`
2. Copy ALL code from `functions-integration.php`
3. Paste at the END of `functions.php`
4. Save

### Step 3: Create Page (1 minute)

1. WordPress Admin → **Pages** → **Add New**
2. Title: "New Year Party Booking"
3. **Page Attributes** → **Template**: Select "New Year Party Seat Booking"
4. **Publish**

### Step 4: Configure Tickera (1 minute)

1. **Tickera** → **Events** → Create your event
2. Note the **Event ID**
3. **WordPress Admin** → **Settings** → **NY Party Booking**
4. Enter Event ID
5. **Save Changes**

## ✅ Done!

Visit your page and test the seat booking system.

## 🔧 If Files Are in Different Locations

If your CSS/JS are in different folders, edit line 8-9 in `new-year-party-booking-template.php`:

```php
wp_enqueue_style('ny-party-booking-style', get_template_directory_uri() . '/YOUR-CSS-PATH/new-year-party-booking.css', ...);
wp_enqueue_script('ny-party-booking-script', get_template_directory_uri() . '/YOUR-JS-PATH/new-year-party-booking.js', ...);
```

## 📋 Checklist

- [ ] Files uploaded to correct locations
- [ ] Functions code added to `functions.php`
- [ ] Page created with correct template
- [ ] Tickera event created
- [ ] Event ID configured in settings
- [ ] Test booking on frontend

## 🆘 Quick Fixes

**Seats not showing?**
- Check browser console (F12) for errors
- Verify CSS/JS file paths are correct

**Tickera not working?**
- Verify Tickera Premium is activated
- Check Event ID is correct
- Test Tickera shortcode on regular page first

**AJAX errors?**
- Ensure `functions-integration.php` code is in `functions.php`
- Check WordPress debug log

---

For detailed instructions, see `README-SETUP.md`
