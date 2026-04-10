# Mmeli Global - Full Backend Development

## Setup Instructions

### 1. Create a new GitHub repository
- Name it `mmeliglobal-backend-dev`
- Upload all these files

### 2. Deploy to Netlify (staging)
- Connect your GitHub repo to Netlify
- Netlify will give you a random URL like `https://random-name.netlify.app`
- Test everything there

### 3. Set up Supabase
- Go to your Supabase project
- Open SQL Editor
- Copy and run the entire `supabase-setup.sql` script

### 4. Test features
- Browse products
- Add to cart, checkout (order saves to Supabase)
- Admin login: `admin` / `admin123`
- Add a promotion in Marketing card
- Create a shipment in Shipping card
- View Shipping Records

### 5. Migrate to production
- Once fully tested, replace files in your live repository with these
- Redeploy to Netlify/Cloudflare

## Admin Credentials
- Username: `admin`
- Password: `admin123`
