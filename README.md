# PhotoPrint MVP (Windows 10)

This is a local prototype for QR-based photo ordering and studio order management.

## Requirements
- Windows 10
- Node.js LTS (install from https://nodejs.org/)
- Epson printer driver installed and printer connected by USB

## Run locally
1. Extract this folder.
2. Open the folder in VS Code.
3. Open Terminal in VS Code.
4. Run:
   ```bash
   npm install
   npm start
   ```
5. Open `http://localhost:3000` for the customer ordering page.
6. Open `http://localhost:3000/admin.html` for the studio dashboard.
7. Demo admin key: `change-this-admin-key`.

## QR code
For local testing, open the customer page on the studio computer. For customer phones to access it, the app must be deployed to HTTPS hosting and a permanent QR code generated from that public URL. Do not print a QR code for localhost.

## Important prototype limitations
- Payment gateway is NOT connected. Orders are stored as UNPAID. Admin status changes are for local testing only; never mark a real order paid without verifying payment.
- Epson auto-print is NOT connected yet. This prototype collects orders and shows photos in the dashboard. The exact printer model and paper sizes must be confirmed before building the Windows print agent.
- This prototype stores uploaded photos in the local `uploads` folder and order data in `orders.json`. It is not production-hardened, does not include customer accounts, encryption-at-rest, automatic photo deletion, or cloud backup.
- Change the admin key using the `ADMIN_KEY` environment variable before exposing this app to any network. Do not expose this prototype directly to the public internet.
- Set upload limits, retention policy, HTTPS, rate limiting, proper authentication, verified payment webhooks, and secure object storage before production launch.
