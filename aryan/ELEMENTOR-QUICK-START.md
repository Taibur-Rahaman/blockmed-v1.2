# Elementor Quick Start Guide - Mystery Box Landing Page

## 🚀 Fastest Setup (5 Minutes)

### Step 1: Add to functions.php (2 minutes)

1. Open your theme's `functions.php` file
2. Add this at the **END** of the file:
   ```php
   require_once get_template_directory() . '/mystery-box-elementor-shortcode.php';
   ```
3. Save the file

### Step 2: Upload Files (2 minutes)

Upload these 3 files to your theme root directory (`wp-content/themes/your-theme/`):
- `mystery-box-elementor-shortcode.php`
- `mystery-box-elementor.css`
- `mystery-box-elementor.js`

### Step 3: Use in Elementor (1 minute)

1. Open Elementor editor on any page
2. Add a **Shortcode** widget
3. Paste: `[dokanxpress_mystery_box]`
4. Click **Update/Publish**

## ✅ Done!

Your mystery box landing page is now live!

## 🎨 Customization

### Change Title
```
[dokanxpress_mystery_box title="Your Custom Title Here"]
```

### Change Contact Info
```
[dokanxpress_mystery_box phone="01987654321" website="www.yoursite.com"]
```

### Hide Header/Footer
```
[dokanxpress_mystery_box show_header="false" show_footer="false"]
```

## 🛠️ Alternative: As Plugin

If you prefer to use it as a plugin:

1. Create folder: `wp-content/plugins/dokanxpress-mystery-box/`
2. Upload all 3 files there
3. Activate plugin from WordPress Admin → Plugins
4. Use shortcode in Elementor

## 📞 Support

For detailed setup, see `ELEMENTOR-SETUP.md`
