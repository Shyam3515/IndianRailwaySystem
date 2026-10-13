const trains = [
  {
    id: "12728",
    name: "Godavari Express (Demo)",
    from: "Hyderabad",
    to: "Visakhapatnam",
    time: "17:30",
    fare: 420,
    seats: 24,
  },
  {
    id: "12760",
    name: "Charminar Express (Demo)",
    from: "Hyderabad",
    to: "Chennai",
    time: "18:10",
    fare: 510,
    seats: 18,
  },
  {
    id: "17210",
    name: "Coastal Express (Demo)",
    from: "Vijayawada",
    to: "Visakhapatnam",
    time: "08:45",
    fare: 280,
    seats: 30,
  },
  {
    id: "12622",
    name: "Southern Express (Demo)",
    from: "Chennai",
    to: "Hyderabad",
    time: "21:00",
    fare: 560,
    seats: 16,
  },
  {
    id: "12864",
    name: "Eastern Express (Demo)",
    from: "Visakhapatnam",
    to: "Vijayawada",
    time: "06:15",
    fare: 310,
    seats: 22,
  },
  {
    id: "12714",
    name: "Deccan Express (Demo)",
    from: "Vijayawada",
    to: "Hyderabad",
    time: "14:20",
    fare: 350,
    seats: 20,
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
const available = (t) =>
  t.seats - bookings.filter((b) => b.trainId === t.id && active(b)).length;
const money = (n) => "₹" + Number(n).toLocaleString("en-IN");
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
const stations = [...new Set(trains.flatMap((t) => [t.from, t.to]))].sort();
for (const id of ["searchFrom", "searchTo"]) {
  $(id).innerHTML =
    '<option value="">All stations</option>' +
    stations.map((s) => `<option>${s}</option>`).join("");
}
function render() {
  const confirmed = bookings.filter(active);
  $("trainCount").textContent = trains.length;
  $("totalBookings").textContent = bookings.length;
  $("confirmedCount").textContent = confirmed.length;
  $("seatCount").textContent = trains.reduce((n, t) => n + available(t), 0);
  $("routes").innerHTML = trains
    .slice(0, 4)
    .map(
      (t) =>
        `<div class="route"><div><b>${safe(t.from)} → ${safe(t.to)}</b><br><small>${safe(t.name)}</small></div><span class="tag">${available(t)} seats</span></div>`,
    )
    .join("");
  $("bookTrain").innerHTML = trains
    .map(
      (t) =>
        `<option value="${t.id}">${safe(t.name)} · ${safe(t.from)} → ${safe(t.to)}</option>`,
    )
    .join("");
  renderTrains(trains);
  renderBookings();
  updateFare();
}
function renderTrains(list) {
  $("trainRows").innerHTML = list.length
    ? list
        .map(
          (t) =>
            `<tr><td><b>${safe(t.name)}</b><br><span class="muted">#${t.id}</span></td><td>${safe(t.from)} → ${safe(t.to)}</td><td>${t.time}</td><td>${money(t.fare)}</td><td><span class="tag">${available(t)} left</span></td><td><button class="secondary" onclick="chooseTrain('${t.id}')">Book</button></td></tr>`,
        )
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
function updateFare() {
  const t = trains.find((t) => t.id === $("bookTrain").value);
  $("fareEstimate").value = t
    ? money(t.fare * ($("travelClass").value === "3A" ? 2 : 1))
    : "—";
}
$("bookTrain").addEventListener("change", updateFare);
$("travelClass").addEventListener("change", updateFare);
const today = new Date();
const yyyy = today.getFullYear(),
  mm = String(today.getMonth() + 1).padStart(2, "0"),
  dd = String(today.getDate()).padStart(2, "0");
$("journeyDate").min = `${yyyy}-${mm}-${dd}`;
$("journeyDate").value = $("journeyDate").min;
function notice(id, msg, error = false) {
  const el = $(id);
  el.textContent = msg;
  el.className = "notice" + (error ? " error" : "");
  el.style.display = "block";
}
function bookTicket() {
  const name = $("passenger").value.trim(),
    age = Number($("age").value),
    date = $("journeyDate").value,
    t = trains.find((t) => t.id === $("bookTrain").value);
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
  if (available(t) <= 0) {
    notice("bookNotice", "No seats are available on this demo train.", true);
    return;
  }
  let pnr;
  do {
    pnr = String(Math.floor(1000000000 + Math.random() * 9000000000));
  } while (bookings.some((b) => b.pnr === pnr));
  bookings.unshift({
    pnr,
    name,
    age,
    trainId: t.id,
    date,
    travelClass: $("travelClass").value,
    fare: t.fare * ($("travelClass").value === "3A" ? 2 : 1),
    status: "CONFIRMED",
  });
  save();
  notice(
    "bookNotice",
    `Booking confirmed! Demo PNR: ${pnr}. Open My Bookings to view your ticket.`,
  );
  $("passenger").value = "";
  $("age").value = "";
  render();
}
function renderBookings() {
  $("bookingRows").innerHTML = bookings.length
    ? bookings
        .map((b) => {
          const t = trains.find((t) => t.id === b.trainId);
          return `<tr><td><b>${safe(b.pnr)}</b></td><td>${safe(b.name)}</td><td>${safe(t?.name || b.trainId)}</td><td>${safe(b.date)}</td><td>${money(b.fare)}</td><td><span class="tag ${active(b) ? "" : "cancelled"}">${b.status}</span></td><td>${active(b) ? `<button class="danger" onclick="cancelTicket('${b.pnr}')">Cancel</button>` : "—"}</td></tr>`;
        })
        .join("")
    : '<tr><td colspan="7">No bookings yet. Create your first demo ticket.</td></tr>';
}
function cancelTicket(pnr) {
  const b = bookings.find((b) => b.pnr === pnr);
  if (!b || !active(b)) return;
  if (!confirm(`Cancel demo booking ${pnr}?`)) return;
  b.status = "CANCELLED";
  save();
  render();
  notice("cancelNotice", `Demo booking ${pnr} cancelled. Seat released.`);
}
function checkPNR() {
  const pnr = $("pnrInput").value.trim(),
    b = bookings.find((b) => b.pnr === pnr);
  if (!b) {
    $("pnrResult").innerHTML =
      '<p class="muted">No demo booking found for that PNR.</p>';
    return;
  }
  const t = trains.find((t) => t.id === b.trainId);
  $("pnrResult").innerHTML =
    `<div class="panel" style="background:#f7fafc"><h3>Ticket ${safe(b.pnr)} <span class="tag ${active(b) ? "" : "cancelled"}">${b.status}</span></h3><p><b>Passenger:</b> ${safe(b.name)} (${b.age})</p><p><b>Train:</b> ${safe(t?.name || b.trainId)}</p><p><b>Route:</b> ${safe(t?.from || "")} → ${safe(t?.to || "")}</p><p><b>Journey:</b> ${safe(b.date)} · ${safe(b.travelClass)}</p><p><b>Fare:</b> ${money(b.fare)}</p></div>`;
}
render();
