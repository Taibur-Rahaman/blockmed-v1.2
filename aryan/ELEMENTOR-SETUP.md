# DokanXpress Mystery Box - Elementor Setup Guide

Complete guide to integrate the Mystery Box landing page into your dokanxpress.com website using Elementor.

## 📋 Requirements

- WordPress 5.0 or higher
- Elementor (Free or Pro)
- WooCommerce (optional, for cart functionality)

## 🚀 Installation Methods

### Method 1: Using Shortcode (Recommended for Elementor)

This is the easiest method to use with Elementor.

#### Step 1: Upload Files to Your Theme

1. **Upload these files to your active theme directory** (`wp-content/themes/your-theme/`):
   - `mystery-box-elementor-shortcode.php`
   - `mystery-box-elementor.css`
   - `mystery-box-elementor.js`

   **OR** create a custom plugin folder:
   ```
   wp-content/plugins/dokanxpress-mystery-box/
   ├── mystery-box-elementor-shortcode.php
   ├── mystery-box-elementor.css
   └── mystery-box-elementor.js
   ```

#### Step 2: Activate the Plugin/Code

**Option A: As a Plugin** (if you put files in plugins folder)
1. Go to **WordPress Admin** → **Plugins**
2. Activate "DokanXpress Mystery Box"

**Option B: Add to functions.php** (if using theme directory)
1. Open your theme's `functions.php`
2. Add this line at the top:
   ```php
   require_once get_template_directory() . '/mystery-box-elementor-shortcode.php';
   ```
3. Save the file

#### Step 3: Use in Elementor

1. **Create a new page** or edit an existing page with Elementor
2. **Add a "Shortcode" widget** (drag from left panel)
3. **Insert the shortcode**: `[dokanxpress_mystery_box]`
4. **Customize with attributes** (optional):
   ```
   [dokanxpress_mystery_box title="Choose Your Mystery Box" phone="01601677122" website="www.dokanxpress.com" show_header="true" show_footer="true"]
   ```

### Method 2: Using HTML Widget

If you prefer more control, use the HTML widget:

1. In Elementor, add an **HTML widget**
2. Copy the HTML from `mystery-box-landing.html` (adapt it to use prefixed classes)
3. Paste into the HTML widget
4. Make sure CSS and JS files are enqueued (they should load automatically if shortcode file is active)

## ⚙️ Shortcode Parameters

The `[dokanxpress_mystery_box]` shortcode accepts these parameters:

| Parameter | Default | Description |
|-----------|---------|-------------|
| `title` | "Choose Your Mystery Box" | Section title above products |
| `phone` | "01601677122" | Contact phone number |
| `website` | "www.dokanxpress.com" | Website URL for footer |
| `show_header` | "true" | Show/hide hero section |
| `show_footer` | "true" | Show/hide footer section |

### Examples:

**Basic usage:**
```
[dokanxpress_mystery_box]
```

**With custom title:**
```
[dokanxpress_mystery_box title="Unbox Amazing Surprises!"]
```

**Without header and footer:**
```
[dokanxpress_mystery_box show_header="false" show_footer="false"]
```

**Full customization:**
```
[dokanxpress_mystery_box title="Special Mystery Boxes" phone="01987654321" website="www.yoursite.com"]
```

## 🎨 Styling Customization

### Option 1: Custom CSS in Elementor

1. Edit your page in Elementor
2. Click the **Page Settings** (gear icon) in bottom left
3. Go to **Advanced** → **Custom CSS**
4. Add your custom CSS (all classes are prefixed with `mystery-box-`)

**Example:**
```css
.mystery-box-hero-title {
    font-size: 4rem !important;
    color: #ff0000 !important;
}
```

### Option 2: Theme's Customizer

1. Go to **Appearance** → **Customize** → **Additional CSS**
2. Add your custom styles there

### Option 3: Edit the CSS File

Edit `mystery-box-elementor.css` directly to change default styles.

## 🛒 WooCommerce Integration

If you have WooCommerce installed, the "Add to Cart" buttons will automatically integrate with WooCommerce.

**To set up WooCommerce products:**

1. Create WooCommerce products for each mystery box (199 TK, 399 TK, 799 TK)
2. Note the Product IDs
3. Update the shortcode PHP file to map the mystery boxes to WooCommerce product IDs

Or manually edit the shortcode output in `mystery-box-elementor-shortcode.php` around line 120 where it says `data-product-id`.

## 📱 Responsive Design

The landing page is fully responsive and works on:
- ✅ Desktop (1200px+)
- ✅ Tablet (768px - 1199px)
- ✅ Mobile (below 768px)

## 🔧 Troubleshooting

### Styles Not Loading?

1. **Clear cache**: Clear Elementor cache (Elementor → Tools → Regenerate CSS)
2. **Clear browser cache**: Hard refresh (Ctrl+F5 or Cmd+Shift+R)
3. **Check file paths**: Make sure CSS/JS files are in the correct location
4. **Check permissions**: Ensure files are readable by WordPress

### JavaScript Not Working?

1. **Check console**: Open browser console (F12) and look for errors
2. **jQuery conflict**: Make sure jQuery is loaded (Elementor includes it)
3. **Check file path**: Verify JS file is loading in browser Network tab

### Shortcode Not Displaying?

1. **Check if code is active**: Verify the PHP file is included in functions.php or activated as plugin
2. **Check shortcode syntax**: Make sure there are no typos
3. **Check Elementor preview**: Try viewing in Elementor preview mode

### Products Not Showing?

1. **Check CSS conflicts**: Some theme CSS might be overriding styles
2. **Inspect elements**: Use browser inspector to check if HTML is present
3. **Check z-index**: Some Elementor elements might be overlapping

## 🎯 Best Practices

1. **Use Full-Width Section**: Set the section containing the shortcode to full-width in Elementor
2. **Remove Padding**: Adjust section padding to 0 for full-width effect
3. **Background Colors**: Set section background color to match (`#F5F5F5` for products section)
4. **Test on Mobile**: Always preview on mobile devices before publishing

## 📂 File Structure

After installation, your file structure should look like:

```
wp-content/
├── themes/
│   └── your-theme/
│       ├── functions.php (with require_once line)
│       ├── mystery-box-elementor-shortcode.php
│       ├── mystery-box-elementor.css
│       └── mystery-box-elementor.js
```

**OR** (if using as plugin):

```
wp-content/
└── plugins/
    └── dokanxpress-mystery-box/
        ├── mystery-box-elementor-shortcode.php
        ├── mystery-box-elementor.css
        └── mystery-box-elementor.js
```

## ✅ Quick Checklist

- [ ] Files uploaded to correct location
- [ ] PHP code activated (plugin or functions.php)
- [ ] Page created/edited in Elementor
- [ ] Shortcode widget added with `[dokanxpress_mystery_box]`
- [ ] CSS and JS files loading (check browser Network tab)
- [ ] Tested on desktop
- [ ] Tested on mobile
- [ ] WooCommerce integration (if using)

## 🆘 Need Help?

If you encounter any issues:
1. Check browser console for JavaScript errors
2. Check WordPress debug log
3. Verify all file paths are correct
4. Ensure Elementor is updated to latest version

---

**Created for:** dokanxpress.com  
**Version:** 1.0.0  
**Compatible with:** Elementor Free & Pro, WordPress 5.0+
