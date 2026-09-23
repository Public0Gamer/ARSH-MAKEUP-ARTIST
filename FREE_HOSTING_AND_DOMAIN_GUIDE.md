# 🚀 Free Hosting & Custom Domain Setup Guide (₹0 Cost)
### ARSH MAKEUP ARTIST DELHI

Yeh guide aapko step-by-step batayegi ki bina 1 rupiya kharch kiye is website aur admin panel ko **Render.com** par **100% Lifetime Free** kaise live karein aur apna personal domain kaise jodein.

---

## 💎 Kyun Render.com Best Hai?
1. **₹0 Hosting Cost**: Node.js web services ke liye free tier available hai.
2. **Free Custom Domain**: Aapka apna domain (e.g., `yourbrand.com`) connect karne ka koi charge nahi hai.
3. **Free Automatic SSL (HTTPS)**: Security padlock (https://) automatic lagta hai bina kisi extra renewal cost ke.
4. **Cloudinary Integration Ready**: Images Cloudinary par jaati hain isliye hosting storage ki koi limit problem nahi aayegi.

---

## 🛠️ Step 1: Project ko GitHub par Upload Karna (2 Minutes)

Agar aapke paas GitHub account nahi hai to [github.com](https://github.com) par free account bana lijiye.

1. GitHub par jakar **"New repository"** click karein.
2. Repository ka naam rakhein: `arsh-makeup-artist`.
3. Private ya Public select karein aur **"Create repository"** dabayein.
4. Apne computer ke terminal/powershell me project folder me jakar yeh commands chalayein:

```bash
cd "C:\Users\at781\.gemini\antigravity\scratch\arsh-makeup-artist"
git init
git add .
git commit -m "Official Arsh Makeup Artist Delhi Release with Cloudinary and Real Admin"
git branch -M main
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/arsh-makeup-artist.git
git push -u origin main
```

*(Note: `.gitignore` file already bana di gayi hai taaki faltu files upload na ho).*

---

## 🌐 Step 2: Render.com par 1-Click Free Hosting (2 Minutes)

1. [render.com](https://render.com) par jayein aur **"Sign Up"** karein (GitHub se login karna sabse aasan hai).
2. Dashboard par upar **"New +"** button dabayein aur **"Web Service"** chunein.
3. **"Build and deploy from a Git repository"** select karke apni `arsh-makeup-artist` repository choose karein.
4. Settings me yeh details bharein:
   - **Name**: `arsh-makeup-artist-delhi`
   - **Region**: Singapore ya Frankfurt (jo paas ho)
   - **Branch**: `main`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Instance Type**: **Free ($0/month)**
5. Click **"Deploy Web Service"**!
6. 1 se 2 minute me aapki website live ho jayegi aur aapko ek free link mil jayega jaise:
   `https://arsh-makeup-artist-delhi.onrender.com`

---

## 🔗 Step 3: Apna Custom Domain Connect Karna (₹0 Cost)

Aapne domain jahan se bhi khareeda hai (GoDaddy, Hostinger, Namecheap, BigRock):

1. **Render Dashboard** me apni service par click karein.
2. Left menu me **"Settings"** par jayein aur scroll karke **"Custom Domains"** par click karein.
3. **"Add Custom Domain"** par click karein aur apna domain dalein:
   - Jaise: `www.arshmakeupartist.com` (apna real domain)
   - Aur: `arshmakeupartist.com`
4. Render aapko **DNS Values** dikhayega:
   - **Type**: `CNAME`
   - **Name**: `www`
   - **Value**: `arsh-makeup-artist-delhi.onrender.com`
   - **Type**: `A` record (for root domain)
5. **Apne Domain Provider (GoDaddy/Hostinger) ke DNS Management me jayein**:
   - "DNS Records" ya "Manage DNS" kholein.
   - Render ki batayi hui CNAME aur A record add kar dein.
6. **Bas ho gaya!** 10-15 minute ke andar Render automatically aapke domain par **Free SSL (Padlock)** active kar dega aur aapki website aapke custom domain par open hone lagegi!

---

## 🔑 Production Environment Checklist

Live karne ke baad:
1. **Admin Portal**: `https://yourdomain.com/admin`
2. **Default Password**: `arsh@2026`
3. **Change Password**: Admin portal me login karke **"Password & Security"** tab se turant apna confidential password set kar lein.
4. **Cloudinary**: Images `gdkzinnv` Cloudinary par directly live upload aur manage hoti rahengi.
