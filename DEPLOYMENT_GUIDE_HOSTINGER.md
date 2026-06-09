# 🚀 Simple Hostinger Deployment Guide

This guide explains how to deploy your **Varashree Nursery** application (Frontend + Backend) to Hostinger as a single easy-to-manage website.

---

## **Step 1: Check Your Files (Local Computer)**

I have already automated the hard work for you!
1.  Open your project folder.
2.  Go inside the **`backend`** folder.
3.  Check if you see a folder named **`public`**.
    *   *If yes*: Great! This `public` folder contains your entire visible website (frontend).
    *   *If no*: Run this command in your terminal first:
        ```bash
        node prepare_deployment.js
        ```

---

## **Step 2: Upload to Hostinger**

1.  Log in to your **Hostinger Control Panel**.
2.  Go to **Files > File Manager**.
3.  Open the **`public_html`** folder (or the specific folder for your domain).
4.  **Delete** any default files (like `default.php`) if this is a fresh site.
5.  **Upload the contents** of your local **`backend`** folder here.

**⚠️ Make sure you upload these critical files/folders:**
*   📁 `public` (The folder containing the frontend)
*   📁 `routes`
*   📁 `models`
*   📁 `config`
*   📄 `server.js`
*   📄 `package.json`
*   📄 `database.sqlite` (This is your database with all data!)
*   📄 `.env` (Create this if it's missing, see Step 4)

---

## **Step 3: Setup Node.js on Hostinger**

1.  In Hostinger Dashboard, go to **Advanced > Node.js Application**.
2.  **Create Application**:
    *   **Node.js Version**: Select **18.x.x** or higher.
    *   **Application Mode**: Production.
    *   **Application Root**: `public_html/` (or wherever you uploaded files).
    *   **Application Startup File**: `server.js`
3.  Click **Create**.

---

## **Step 4: Install Dependencies**

1.  Once created, clicking "Create" usually isn't enough. You need to install libraries.
2.  Look for a button that says **"NPM Install"** or **"Run NPM Install"** in the Node.js settings page and click it.
    *   *Wait for it to finish successfully.*

---

## **Step 5: Start the Website**

1.  Click the **Restart** or **Start** button in the Node.js section.
2.  Open your website URL in a browser.
3.  **Done!** Your App should be live. 🥳

---

## **❓ Common Issues & Fixes**

*   **"Internal Server Error" / "App Crashed"**:
    *   Make sure you uploaded `.env`.
    *   Open `.env` on Hostinger and make sure `PORT` is NOT set (Hostinger sets it automatically) or set to `3000`.
*   **"Page Not Found"** when refreshing:
    *   This is fixed automatically by the code I added to `server.js`, but ensure the `public` folder exists.
*   **Database is empty?**
    *   Did you upload your local `database.sqlite` file? If not, the server created a brand new empty one. Upload yours to overwrite it if needed.
