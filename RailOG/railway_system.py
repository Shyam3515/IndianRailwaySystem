"""RailOG - Educational Railway Reservation System with Waiting List.

This is a local learning/demo project, not an official IRCTC system.
Run with: python railway_system.py
"""

from __future__ import annotations

import json
import uuid
from dataclasses import asdict, dataclass
from datetime import date
from pathlib import Path
from threading import RLock


@dataclass(frozen=True)
class Train:
    number: str
    name: str
    source: str
    destination: str
    seats: int
    fare: int


@dataclass
class Booking:
    pnr: str
    train_number: str
    passenger: str
    age: int
    journey_date: str
    status: str = "CONFIRMED"


class RailwaySystem:
    def __init__(self, path: str = "bookings.json") -> None:
        self.path = Path(path)
        self.lock = RLock()
        self.trains = {
            train.number: train
            for train in [
                Train("12727", "Godavari Express", "VISAKHAPATNAM", "HYDERABAD", 4, 850),
                Train("12760", "Charminar Express", "HYDERABAD", "CHENNAI", 4, 780),
                Train("12839", "Chennai Mail", "CHENNAI", "HOWRAH", 2, 1100),
                Train("12622", "Tamil Nadu Express", "NEW DELHI", "CHENNAI", 3, 1450),
            ]
        }
        self.bookings: dict[str, Booking] = {}
        self._load()

    def _load(self) -> None:
        """Load saved bookings if the JSON file already exists."""
        if not self.path.exists():
            return

        try:
            data = json.loads(self.path.read_text(encoding="utf-8"))
            self.bookings = {
                item["pnr"]: Booking(**item)
                for item in data
            }
        except (json.JSONDecodeError, KeyError, TypeError) as exc:
            raise RuntimeError(
                f"Could not read {self.path}. Check that it contains valid booking JSON."
            ) from exc

    def _save(self) -> None:
        """Save bookings safely using a temporary file before replacing the old one."""
        self.path.parent.mkdir(parents=True, exist_ok=True)
        temp_path = self.path.with_suffix(self.path.suffix + ".tmp")
        temp_path.write_text(
            json.dumps(
                [asdict(booking) for booking in self.bookings.values()],
                indent=2,
            ),
            encoding="utf-8",
        )
        temp_path.replace(self.path)

    def search(self, source: str = "", destination: str = "") -> list[Train]:
        source = source.strip().upper()
        destination = destination.strip().upper()
        return [
            train
            for train in self.trains.values()
            if (not source or train.source == source)
            and (not destination or train.destination == destination)
        ]

    def available(self, train_number: str, journey_date: str) -> int:
        """Return remaining confirmed seats for a train on the selected date."""
        train = self.trains.get(train_number)
        if train is None:
            raise ValueError("Train not found.")

        used = sum(
            booking.train_number == train_number
            and booking.journey_date == journey_date
            and booking.status == "CONFIRMED"
            for booking in self.bookings.values()
        )
        return max(0, train.seats - used)

    def _next_waiting_number(self, train_number: str, journey_date: str) -> int:
        numbers = []
        for booking in self.bookings.values():
            if (
                booking.train_number == train_number
                and booking.journey_date == journey_date
                and booking.status.startswith("WL")
            ):
                try:
                    numbers.append(int(booking.status[2:]))
                except ValueError:
                    continue
        return max(numbers, default=0) + 1

    def book(
        self,
        train_number: str,
        passenger: str,
        age: int,
        journey_date: str,
    ) -> Booking:
        """Create a confirmed booking or add the passenger to the waiting list."""
        if train_number not in self.trains:
            raise ValueError("Train not found.")
        if not passenger.strip():
            raise ValueError("Passenger name cannot be empty.")
        if not 1 <= age <= 120:
            raise ValueError("Age must be between 1 and 120.")

        try:
            travel_day = date.fromisoformat(journey_date)
        except ValueError as exc:
            raise ValueError("Date must be in YYYY-MM-DD format.") from exc

        if travel_day < date.today():
            raise ValueError("Journey date cannot be in the past.")

        with self.lock:
            if self.available(train_number, journey_date) > 0:
                status = "CONFIRMED"
            else:
                status = f"WL{self._next_waiting_number(train_number, journey_date)}"

            booking = Booking(
                pnr=uuid.uuid4().hex[:12].upper(),
                train_number=train_number,
                passenger=passenger.strip(),
                age=age,
                journey_date=journey_date,
                status=status,
            )
            self.bookings[booking.pnr] = booking
            try:
                self._save()
            except OSError:
                self.bookings.pop(booking.pnr, None)
                raise
            return booking

    def _promote_waiting_list(self, train_number: str, journey_date: str) -> Booking | None:
        """Promote the earliest waiting passenger and renumber the remaining queue."""
        waiting = [
            booking
            for booking in self.bookings.values()
            if booking.train_number == train_number
            and booking.journey_date == journey_date
            and booking.status.startswith("WL")
        ]
        waiting.sort(key=lambda booking: int(booking.status[2:]))
        if not waiting:
            return None

        promoted = waiting[0]
        promoted.status = "CONFIRMED"
        for position, booking in enumerate(waiting[1:], start=1):
            booking.status = f"WL{position}"
        return promoted

    def cancel(self, pnr: str) -> Booking:
        """Cancel a confirmed or waiting-list booking; promote WL1 if a seat opens."""
        with self.lock:
            booking = self.bookings.get(pnr.strip().upper())
            if booking is None:
                raise ValueError("PNR not found.")
            if booking.status == "CANCELLED":
                raise ValueError("This booking is already cancelled.")

            old_statuses = {
                item.pnr: item.status for item in self.bookings.values()
            }
            was_confirmed = booking.status == "CONFIRMED"
            booking.status = "CANCELLED"

            promoted = None
            if was_confirmed:
                promoted = self._promote_waiting_list(
                    booking.train_number, booking.journey_date
                )

            try:
                self._save()
            except OSError:
                for item in self.bookings.values():
                    if item.pnr in old_statuses:
                        item.status = old_statuses[item.pnr]
                raise

            if promoted:
                print(
                    f"Waiting-list promotion: {promoted.passenger} "
                    f"({promoted.pnr}) is now CONFIRMED."
                )
            return booking

    def get_booking(self, pnr: str) -> Booking | None:
        return self.bookings.get(pnr.strip().upper())

    def list_bookings(self) -> list[Booking]:
        return sorted(
            self.bookings.values(),
            key=lambda booking: (booking.journey_date, booking.pnr),
        )


def print_trains(trains: list[Train], system: RailwaySystem, journey_date: str) -> None:
    if not trains:
        print("No trains found for that route.")
        return

    print("\nTRAIN DETAILS")
    print("-" * 90)
    for train in trains:
        remaining = system.available(train.number, journey_date)
        print(
            f"{train.number} | {train.name} | {train.source} -> {train.destination} "
            f"| Seats left: {remaining}/{train.seats} | Fare: Rs. {train.fare}"
        )


def main() -> None:
    system = RailwaySystem()
    print("Welcome to RailOG - Educational Railway Reservation System")

    while True:
        print(
            "\n===== RAILOG RESERVATION SYSTEM =====\n"
            "1. Search trains\n"
            "2. Book ticket\n"
            "3. Check PNR status\n"
            "4. Cancel ticket\n"
            "5. View all bookings\n"
            "6. Exit"
        )
        choice = input("Enter your choice (1-6): ").strip()

        try:
            if choice == "1":
                source = input("Source station (leave blank for any): ")
                destination = input("Destination station (leave blank for any): ")
                journey_date = input("Journey date (YYYY-MM-DD): ").strip()
                date.fromisoformat(journey_date)
                print_trains(system.search(source, destination), system, journey_date)

            elif choice == "2":
                print("\nAvailable trains:")
                for train in system.trains.values():
                    print(
                        f"{train.number} - {train.name}: "
                        f"{train.source} -> {train.destination} | Fare Rs. {train.fare}"
                    )
                train_number = input("Enter train number: ").strip()
                passenger = input("Passenger name: ").strip()
                age = int(input("Passenger age: ").strip())
                journey_date = input("Journey date (YYYY-MM-DD): ").strip()

                booking = system.book(train_number, passenger, age, journey_date)
                print("\nBooking created successfully.")
                print(f"PNR: {booking.pnr}")
                print(f"Passenger: {booking.passenger}")
                print(f"Train: {system.trains[booking.train_number].name}")
                print(f"Journey date: {booking.journey_date}")
                print(f"Status: {booking.status}")
                if booking.status.startswith("WL"):
                    print("No confirmed seats were available; you are on the waiting list.")

            elif choice == "3":
                pnr = input("Enter PNR: ").strip()
                booking = system.get_booking(pnr)
                if booking:
                    train = system.trains[booking.train_number]
                    print(
                        f"PNR: {booking.pnr} | Passenger: {booking.passenger} "
                        f"| Train: {train.name} | Date: {booking.journey_date} "
                        f"| Status: {booking.status}"
                    )
                else:
                    print("PNR not found.")

            elif choice == "4":
                pnr = input("Enter PNR to cancel: ").strip()
                booking = system.cancel(pnr)
                print(f"Booking {booking.pnr} cancelled successfully.")

            elif choice == "5":
                bookings = system.list_bookings()
                if not bookings:
                    print("No bookings saved yet.")
                else:
                    for booking in bookings:
                        print(
                            f"{booking.pnr} | {booking.passenger} | "
                            f"{system.trains[booking.train_number].name} | "
                            f"{booking.journey_date} | {booking.status}"
                        )

            elif choice == "6":
                print("Thank you for using RailOG.")
                break

            else:
                print("Invalid choice. Please enter a number from 1 to 6.")

        except (ValueError, OSError) as exc:
            print(f"Error: {exc}")


if __name__ == "__main__":
    main()
