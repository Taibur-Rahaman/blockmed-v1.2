# 🚀 Copy & Paste Instructions - Easiest Method!

## ✅ Super Easy - Just 3 Steps!

### Step 1: Open Elementor Editor
1. Go to your WordPress admin
2. Edit any page with Elementor
3. Click **Edit with Elementor**

### Step 2: Add HTML Widget
1. In Elementor, drag and drop an **HTML** widget from the left panel
2. Place it where you want the mystery box section

### Step 3: Copy & Paste
1. Open the file: `mystery-box-elementor-copy-paste.html`
2. **Select ALL** (Ctrl+A or Cmd+A)
3. **Copy** (Ctrl+C or Cmd+C)
4. **Paste** into the HTML widget in Elementor
5. Click **Update/Publish**

## 🎉 Done! That's it!

No file uploads, no code editing, no functions.php changes needed!

## ✏️ Customization

### Change Contact Info
Find and replace in the HTML:
- `01601677122` → Your phone number
- `www.dokanxpress.com` → Your website

### Change Prices
Find and replace:
- `199.00` → Your price
- `399.00` → Your price
- `799.00` → Your price

### Change Product Titles
Find and replace:
- `DX-199 TK Mystery Box` → Your title
- `DX- 399 TK Mystery Box` → Your title
- `DX- 799 TK Mystery Box` → Your title

### Change Hero Text
Find and replace:
- `Discover Amazing Surprises!` → Your headline
- `Unbox the unexpected with our premium mystery boxes` → Your subtitle

## 🛒 Connect Add to Cart

The "Add to Cart" buttons currently show an alert. To connect to WooCommerce:

1. Find all instances of:
   ```html
   onclick="alert('Add to cart functionality - connect to your cart system');"
   ```

2. Replace with your WooCommerce add to cart code, for example:
   ```html
   onclick="jQuery.post('<?php echo admin_url('admin-ajax.php'); ?>', {action: 'woocommerce_add_to_cart', product_id: 123}, function() { location.href = '/cart/'; });"
   ```

Or use a WooCommerce shortcode button instead.

## 📱 Responsive

The design is fully responsive and works on:
- ✅ Desktop
- ✅ Tablet  
- ✅ Mobile

## 🎨 Styling

All styles are inline in the `<style>` tag. You can modify colors, fonts, sizes directly in the HTML.

## ⚠️ Important Notes

- Make sure jQuery is loaded (Elementor includes it by default)
- The code uses localStorage for wishlist (works without backend)
- All animations and interactions are included
- No external dependencies needed

---

**That's it! Just copy, paste, and publish!** 🎊
