const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Paths
const rootDir = __dirname;
const frontendDir = path.join(rootDir, 'frontend');
const backendDir = path.join(rootDir, 'backend');
const backendPublicDir = path.join(backendDir, 'public');

console.log("🚀 Starting Hostinger Deployment Preparation...");

// 1. Build Frontend
console.log("\n📦 Building Frontend...");
try {
    execSync('npm install', { cwd: frontendDir, stdio: 'inherit' });
    execSync('npm run build', { cwd: frontendDir, stdio: 'inherit' });
} catch (err) {
    console.error("❌ Failed to build frontend:", err.message);
    process.exit(1);
}

// 2. Setup Backend Public Folder
console.log("\n📂 Setting up Backend Public Folder...");
if (fs.existsSync(backendPublicDir)) {
    console.log("   - Cleaning existing public folder...");
    fs.rmSync(backendPublicDir, { recursive: true, force: true });
}
fs.mkdirSync(backendPublicDir);

// 3. Copy Build Files
console.log("   - Copying build files to backend/public...");
const distDir = path.join(frontendDir, 'dist');

if (!fs.existsSync(distDir)) {
    console.error("❌ 'dist' folder not found! Build failed?");
    process.exit(1);
}

// Recursive copy function
function copyRecursiveSync(src, dest) {
    const exists = fs.existsSync(src);
    const stats = exists && fs.statSync(src);
    const isDirectory = exists && stats.isDirectory();
    if (isDirectory) {
        if (!fs.existsSync(dest)) fs.mkdirSync(dest);
        fs.readdirSync(src).forEach((childItemName) => {
            copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
        });
    } else {
        fs.copyFileSync(src, dest);
    }
}

copyRecursiveSync(distDir, backendPublicDir);
console.log("✅ Frontend Copied Successfully!");

// 4. Instructions
console.log("\n=======================================================");
console.log("🎉 DEPLOYMENT PREPARATION COMPLETE!");
console.log("=======================================================");
console.log("You can now upload the 'backend' folder to your Hostinger server.");
console.log("Ensure you upload:");
console.log("  - users database.sqlite (if you want to keep data)");
console.log("  - .env file (configure it for production)");
console.log("  - The 'public' folder inside backend (contains the frontend)");
console.log("  - node_modules (or run 'npm install' on the server)");
console.log("\nStart command on Hostinger: 'npm start' (which runs 'node server.js')");
console.log("=======================================================");
