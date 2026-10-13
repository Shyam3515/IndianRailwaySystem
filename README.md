# RailVista — Indian Railway Reservation System Dashboard

## Run in your project demonstration

1. Unzip the project.
2. Double-click `index.html` in Chrome, Edge, or Firefox. No installation, Python server, or internet required.
3. On **Search Trains**, filter a route.
4. On **Book Ticket**, enter a passenger name, age, journey date and class; click **Confirm Demo Booking**.
5. Copy the 10-digit demo PNR and use **PNR Enquiry** to display the ticket.
6. Open **My Bookings**, cancel the booking, and demonstrate that a seat is released.
7. Return to **Overview** to show live dashboard counts.

## Important scope

This is a self-contained front-end demonstration, separate from the earlier Python CLI project. All six trains, fares and seat counts are fictional. Bookings are saved in the browser's `localStorage`, not a shared database. No real payments, IRCTC connection, live train information, authentication or server-side multiuser concurrency is provided. For the Python-specific six-component defence, use the earlier Python source code as well.

## Suggested defence explanation

"This is our user-facing prototype. It supports train search, ticket booking, unique demo PNR generation, ticket enquiry, cancellation and dashboard statistics. Data is stored locally for demonstration. The Python backend project separately illustrates object-oriented design, concurrency and automated testing."
