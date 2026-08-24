# GitHub Par Kaise Daalain (Roman Urdu Guide)

## Zaroori Baat

GitHub sirf aap ka **code store** karta hai — jaise Google Drive files store karta hai. Sirf code paste karne se app **khud nahi bun'ti**. Lekin is folder mein maine ek `.github/workflows/android-build.yml` file bana di hai — ye GitHub ko batati hai ke jab bhi aap code push karo, GitHub apne khud ke server par aap ka APK **automatically build** kar de.

Matlab: aap ko apne computer par Android Studio install karne ki zaroorat nahi — GitHub khud APK bana ke de dega.

---

## Step 1: GitHub Par Naya Repository Banayein

1. https://github.com par jayein aur login karein (account nahi hai to free bana lein).
2. Top-right par **"+"** → **"New repository"** par click karein.
3. Naam dein: `civicfix-pakistan`
4. **Private** ya **Public** — jo chahein (Private behtar hai kyunke isme admin password waghera hain).
5. **"Create repository"** par click karein. Ab ek khaali repo ban jayegi, aur GitHub aap ko kuch commands dikhayega — unhein ignore karein, neeche wale steps follow karein.

## Step 2: Apne Computer Par Git Se Push Karein

Terminal (Mac/Linux) ya Git Bash (Windows) kholein, phir is folder ke andar jayein jahan aap ne zip extract ki hai:

```bash
cd civicfix-android
git init
git add .
git commit -m "CivicFix Pakistan - initial commit"
git branch -M main
git remote add origin https://github.com/AAPKA-USERNAME/civicfix-pakistan.git
git push -u origin main
```

(`AAPKA-USERNAME` ki jagah apna GitHub username likhein — ye link aap ko repo page par bhi mil jayega, "Quick setup" ke neeche.)

Agar Git nahi install hai to: https://git-scm.com/downloads se install karein (ya GitHub Desktop app use karein — https://desktop.github.com — wo bina command line ke bhi kaam kar deta hai, "Add local repository" se ye folder select kar dein).

## Step 3: Automatic Build Dekhein

1. Push hone ke baad, GitHub par apni repo kholein.
2. Upar **"Actions"** tab par click karein.
3. "Build Android APK" naam ka workflow chalta hua nazar aayega (2-4 minute lagte hain).
4. Jab hara ✅ tick aa jaye, us run par click karein.
5. Neeche **"Artifacts"** section mein **"civicfix-debug-apk"** milega — download kar lein.
6. Ye `.apk` file seedha kisi bhi Android phone par install ho sakti hai (testing ke liye) — bas phone mein "Install from unknown sources" allow karna hoga.

---

## Ye Debug APK Hai, Play Store Ke Liye Nahi

GitHub Actions se jo APK banega wo **testing ke liye** hai — chalti poori hai, lekin Play Store par upload karne ke liye **signed release .aab** chahiye (ek keystore/signing key ke sath). Uske steps `README-BUILD.md` mein "Sign the release build" section mein hain.

Agar chahein to main ek dusra GitHub Actions workflow bhi bana sakta hoon jo signed `.aab` khud bana de (aap ko sirf apni keystore ko GitHub "Secrets" mein aik dafa save karni hogi) — bata dein to wo bhi kar deta hoon.
