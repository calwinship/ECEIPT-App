# ECEIPT App

This is a concept for a digital receipt app. At the till, the receipt data is converted to a QR code, using the [QR Converter](https://github.com/calwinship/QR-Code-Generator). Then, the customer opens the app, navigates to the camera, and the receipt gets automatically stored. 

Watch a short demo: https://www.youtube.com/shorts/wbuF6r3xPM8

## 📝 How to use

Use [`expo-router`](https://expo.github.io/router) to build native navigation using files in the `app/` directory.

Clone the repository to your machine. Then run the command: 
```sh
npx create-expo-app -e with-router
```
## 🚀 Future Work

- Build a backend 
- Explore NFC as an alternative to QR code
