# RailOG — Railway Reservation System

A small educational Python CLI project demonstrating train search, booking, PNR lookup,
cancellation, persistent JSON storage, and waiting-list promotion.

## Requirements
- Python 3.10 or newer
- No third-party packages required

## Run in VS Code
1. Extract/open this `RailOG` folder in VS Code.
2. Open Terminal → New Terminal.
3. Run:

   ```bash
   python railway_system.py
   ```

   On Windows, `py railway_system.py` also works if `python` is not on PATH.

## Files
- `railway_system.py`: complete application.
- `bookings.json`: created automatically when the first booking is saved. It stores booking data between runs.

## Demo behavior
- Each train has a small number of seats for easy testing.
- If seats are available, a booking is `CONFIRMED`.
- When all seats for that train and date are filled, new bookings receive `WL1`, `WL2`, and so on.
- Cancelling a confirmed ticket promotes the earliest waiting-list passenger to `CONFIRMED`.
- Remaining waiting-list passengers are renumbered.
- Cancelling a waiting-list booking does not free a confirmed seat.

This is a teaching demo, not an official railway booking system. Its simplified logic does not model real IRCTC quotas, coaches, RAC, chart preparation, or production-grade concurrent booking.
