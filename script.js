const trains = [
  {
    id: "12728",
    name: "Godavari Express (Demo)",
    from: "Hyderabad",
    to: "Visakhapatnam",
    time: "17:30",
    fare: 420,
    seats: 1,
  },
  {
    id: "12760",
    name: "Charminar Express (Demo)",
    from: "Hyderabad",
    to: "Chennai",
    time: "18:10",
    fare: 510,
    seats: 1,
  },
  {
    id: "17210",
    name: "Coastal Express (Demo)",
    from: "Vijayawada",
    to: "Visakhapatnam",
    time: "08:45",
    fare: 280,
    seats: 0,
  },
  {
    id: "12622",
    name: "Southern Express (Demo)",
    from: "Chennai",
    to: "Hyderabad",
    time: "21:00",
    fare: 560,
    seats: 0,
  },
  {
    id: "12864",
    name: "Eastern Express (Demo)",
    from: "Visakhapatnam",
    to: "Vijayawada",
    time: "06:15",
    fare: 310,
    seats: 0,
  },
  {
    id: "12714",
    name: "Deccan Express (Demo)",
    from: "Vijayawada",
    to: "Hyderabad",
    time: "14:20",
    fare: 350,
    seats: 0,
  },
];

const key = "irrs_railvista_bookings_v1";
let bookings = [];

try {
  bookings = JSON.parse(localStorage.getItem(key) || "[]");
  if (!Array.isArray(bookings)) bookings = [];
} catch (e) {
  bookings = [];
}

const $ = (id) => document.getElementById(id);

const safe = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[c],
  );

const save = () => localStorage.setItem(key, JSON.stringify(bookings));

const active = (b) => b.status === "CONFIRMED";

// Waiting-list tickets do not occupy confirmed seats.
const available = (t, date, travelClass) =>
  t.seats -
  bookings.filter(
    (b) =>
      b.trainId === t.id &&
      b.status === "CONFIRMED" &&
      (!date || b.date === date) &&
      (!travelClass || b.travelClass === travelClass),
  ).length;

const money = (n) => "₹" + Number(n).toLocaleString("en-IN");

// Navigation
function go(page) {
  document
    .querySelectorAll(".section")
    .forEach((e) => e.classList.toggle("active", e.id === page));

  document
    .querySelectorAll(".nav")
    .forEach((e) => e.classList.toggle("active", e.dataset.page === page));

  $("heading").textContent = {
    overview: "Dashboard Overview",
    trains: "Search Trains",
    book: "Ticket Booking",
    bookings: "Booking History",
    pnr: "PNR Enquiry",
  }[page];

  render();
  window.scrollTo(0, 0);
}

document
  .querySelectorAll(".nav")
  .forEach((b) => b.addEventListener("click", () => go(b.dataset.page)));

// Populate station dropdowns
const stations = [...new Set(trains.flatMap((t) => [t.from, t.to]))].sort();

for (const id of ["searchFrom", "searchTo"]) {
  $(id).innerHTML =
    '<option value="">All stations</option>' +
    stations
      .map((s) => `<option value="${safe(s)}">${safe(s)}</option>`)
      .join("");
}

// Render dashboard
function render() {
  const confirmed = bookings.filter(active);

  $("trainCount").textContent = trains.length;
  $("totalBookings").textContent = bookings.length;
  $("confirmedCount").textContent = confirmed.length;

  const selectedDate = $("journeyDate")?.value;
  const selectedClass = $("travelClass")?.value;

  $("seatCount").textContent = trains.reduce(
    (n, t) => n + available(t, selectedDate, selectedClass),
    0,
  );

  $("routes").innerHTML = trains
    .slice(0, 4)
    .map(
      (t) => `
        <div class="route">
          <div>
            <b>${safe(t.from)} → ${safe(t.to)}</b><br>
            <small>${safe(t.name)}</small>
          </div>
          <span class="tag">
            ${available(t, selectedDate, selectedClass)} seats
          </span>
        </div>
      `,
    )
    .join("");

  const previousTrain = $("bookTrain").value;

  $("bookTrain").innerHTML = trains
    .map(
      (t) => `
        <option value="${t.id}">
          ${safe(t.name)} · ${safe(t.from)} → ${safe(t.to)}
        </option>
      `,
    )
    .join("");

  if (trains.some((t) => t.id === previousTrain)) {
    $("bookTrain").value = previousTrain;
  }

  renderTrains(trains);
  renderBookings();
  updateFare();
}

// Search and display trains
function renderTrains(list) {
  $("trainRows").innerHTML = list.length
    ? list
        .map((t) => {
          const seats = available(
            t,
            $("journeyDate").value,
            $("travelClass").value,
          );

          return `
            <tr>
              <td>
                <b>${safe(t.name)}</b><br>
                <span class="muted">#${safe(t.id)}</span>
              </td>
              <td>${safe(t.from)} → ${safe(t.to)}</td>
              <td>${safe(t.time)}</td>
              <td>${money(t.fare)}</td>
              <td>
                <span class="tag">
                  ${seats > 0 ? `${seats} left` : "WL available"}
                </span>
              </td>
              <td>
                <button class="secondary"
                  onclick="chooseTrain('${t.id}')">
                  Book
                </button>
              </td>
            </tr>
          `;
        })
        .join("")
    : '<tr><td colspan="6">No matching demo trains found.</td></tr>';
}

function searchTrains() {
  renderTrains(
    trains.filter(
      (t) =>
        (!$("searchFrom").value || t.from === $("searchFrom").value) &&
        (!$("searchTo").value || t.to === $("searchTo").value),
    ),
  );
}

function resetSearch() {
  $("searchFrom").value = "";
  $("searchTo").value = "";
  renderTrains(trains);
}

function chooseTrain(id) {
  go("book");
  $("bookTrain").value = id;
  updateFare();
}

// Fare calculation
function updateFare() {
  const t = trains.find((t) => t.id === $("bookTrain").value);

  $("fareEstimate").value = t
    ? money(t.fare * ($("travelClass").value === "3A" ? 2 : 1))
    : "—";
}

$("bookTrain").addEventListener("change", updateFare);
$("travelClass").addEventListener("change", () => {
  updateFare();
  renderTrains(trains);
});

// Journey date defaults
const today = new Date();
const yyyy = today.getFullYear();
const mm = String(today.getMonth() + 1).padStart(2, "0");
const dd = String(today.getDate()).padStart(2, "0");

$("journeyDate").min = `${yyyy}-${mm}-${dd}`;

if (!$("journeyDate").value || $("journeyDate").value < $("journeyDate").min) {
  $("journeyDate").value = $("journeyDate").min;
}

$("journeyDate").addEventListener("change", () => {
  renderTrains(trains);
  updateFare();
});

// Display messages
function notice(id, msg, error = false) {
  const el = $(id);
  el.textContent = msg;
  el.className = "notice" + (error ? " error" : "");
  el.style.display = "block";
}

// Generate a unique PNR
function generatePNR() {
  let pnr;

  do {
    pnr = String(Math.floor(1000000000 + Math.random() * 9000000000));
  } while (bookings.some((b) => b.pnr === pnr));

  return pnr;
}

// BOOK TICKET: CONFIRMED OR WAITING LIST
function bookTicket() {
  const name = $("passenger").value.trim();
  const age = Number($("age").value);
  const date = $("journeyDate").value;
  const travelClass = $("travelClass").value;

  const t = trains.find((t) => t.id === $("bookTrain").value);

  if (
    !name ||
    name.length < 2 ||
    !Number.isInteger(age) ||
    age < 1 ||
    age > 120 ||
    !date ||
    date < $("journeyDate").min ||
    !t
  ) {
    notice(
      "bookNotice",
      "Please enter a valid name, age and future journey date.",
      true,
    );
    return;
  }

  // Check seats for this train, date and class.
  const seatsLeft = available(t, date, travelClass);

  // Find the current waiting-list count.
  const waitingCount = bookings.filter(
    (b) =>
      b.trainId === t.id &&
      b.date === date &&
      b.travelClass === travelClass &&
      b.status.startsWith("WL"),
  ).length;

  // Allocate confirmed status or waiting-list status.
  const status = seatsLeft > 0 ? "CONFIRMED" : `WL${waitingCount + 1}`;

  const pnr = generatePNR();

  const booking = {
    pnr,
    name,
    age,
    trainId: t.id,
    date,
    travelClass,
    fare: t.fare * (travelClass === "3A" ? 2 : 1),
    status,
  };

  bookings.unshift(booking);
  save();

  if (status === "CONFIRMED") {
    notice("bookNotice", `Booking confirmed! PNR: ${pnr}. Status: CONFIRMED.`);
  } else {
    notice(
      "bookNotice",
      `No confirmed seats available. Your ticket is ${status}. PNR: ${pnr}.`,
    );
  }

  $("passenger").value = "";
  $("age").value = "";

  render();
}

// Booking history
function renderBookings() {
  $("bookingRows").innerHTML = bookings.length
    ? bookings
        .map((b) => {
          const t = trains.find((t) => t.id === b.trainId);

          const isConfirmed = b.status === "CONFIRMED";
          const isWaiting = b.status.startsWith("WL");

          const statusClass = isConfirmed
            ? ""
            : isWaiting
              ? "waiting"
              : "cancelled";

          return `
            <tr>
              <td><b>${safe(b.pnr)}</b></td>
              <td>${safe(b.name)}</td>
              <td>${safe(t?.name || b.trainId)}</td>
              <td>${safe(b.date)}</td>
              <td>${money(b.fare)}</td>
              <td>
                <span class="tag ${statusClass}">
                  ${safe(b.status)}
                </span>
              </td>
              <td>
                ${
                  isConfirmed || isWaiting
                    ? `<button class="danger"
                        onclick="cancelTicket('${b.pnr}')">
                        Cancel
                      </button>`
                    : "—"
                }
              </td>
            </tr>
          `;
        })
        .join("")
    : '<tr><td colspan="7">No bookings yet. Create your first demo ticket.</td></tr>';
}

// Cancellation and waiting-list promotion
function cancelTicket(pnr) {
  const b = bookings.find((b) => b.pnr === pnr);

  if (!b || (!active(b) && !b.status.startsWith("WL"))) {
    return;
  }

  if (!confirm(`Cancel demo booking ${pnr}?`)) {
    return;
  }

  const wasConfirmed = b.status === "CONFIRMED";

  b.status = "CANCELLED";
  save();

  // Promote the earliest waiting-list passenger
  // if a confirmed seat was released.
  if (wasConfirmed) {
    promoteWaitingList(b.trainId, b.date, b.travelClass);
  }

  save();
  render();

  notice(
    "cancelNotice",
    wasConfirmed
      ? `Booking ${pnr} cancelled. The next eligible waiting-list passenger has been promoted if available.`
      : `Waiting-list booking ${pnr} cancelled.`,
  );
}

function promoteWaitingList(trainId, date, travelClass) {
  const nextWaiting = bookings
    .filter(
      (b) =>
        b.trainId === trainId &&
        b.date === date &&
        b.travelClass === travelClass &&
        b.status.startsWith("WL"),
    )
    .sort((a, b) => {
      const aNumber = Number(a.status.slice(2));
      const bNumber = Number(b.status.slice(2));
      return aNumber - bNumber;
    })[0];

  if (nextWaiting) {
    nextWaiting.status = "CONFIRMED";
  }
}

// PNR enquiry
function checkPNR() {
  const pnr = $("pnrInput").value.trim();

  const b = bookings.find((b) => b.pnr === pnr);

  if (!b) {
    $("pnrResult").innerHTML =
      '<p class="muted">No demo booking found for that PNR.</p>';
    return;
  }

  const t = trains.find((t) => t.id === b.trainId);

  const statusClass =
    b.status === "CONFIRMED"
      ? ""
      : b.status.startsWith("WL")
        ? "waiting"
        : "cancelled";

  $("pnrResult").innerHTML = `
    <div class="panel" style="background:#f7fafc">
      <h3>
        Ticket ${safe(b.pnr)}
        <span class="tag ${statusClass}">
          ${safe(b.status)}
        </span>
      </h3>
      <p><b>Passenger:</b> ${safe(b.name)} (${b.age})</p>
      <p><b>Train:</b> ${safe(t?.name || b.trainId)}</p>
      <p><b>Route:</b> ${safe(t?.from || "")} → ${safe(t?.to || "")}</p>
      <p><b>Journey:</b> ${safe(b.date)} · ${safe(b.travelClass)}</p>
      <p><b>Fare:</b> ${money(b.fare)}</p>
      <p><b>Status:</b> ${safe(b.status)}</p>
    </div>
  `;
}

// Initial page render
render();
