"use strict";

// Frontend preview only: replace sample values with the backend response.
// Payment amounts and matching status must be confirmed by the server.
const page = document.body.dataset.page;
const params = new URLSearchParams(window.location.search);
const allowedRadii = [100, 300, 500];
const allowedDurations = [15, 30, 60];

function allowedNumber(value, allowed, fallback) {
  const number = Number(value);
  return allowed.includes(number) ? number : fallback;
}

const reservation = {
  location: (params.get("location") || "").slice(0, 100),
  radius: allowedNumber(params.get("radius"), allowedRadii, page === "waiting" ? 100 : 300),
  duration: allowedNumber(params.get("duration"), allowedDurations, page === "payment" ? 30 : 15)
};

function reservationUrl(target, data = reservation) {
  const query = new URLSearchParams({
    location: data.location,
    radius: String(data.radius),
    duration: String(data.duration)
  });
  return `${target}?${query.toString()}`;
}

function announce(message) {
  const status = document.getElementById("status");
  status.textContent = message;
  status.hidden = false;
}

// textContent keeps address text from being interpreted as HTML.
document.querySelectorAll("[data-field]").forEach((element) => {
  const field = element.dataset.field;
  if (field === "radius") element.textContent = `${reservation.radius}m`;
  if (field === "duration") {
    element.textContent = reservation.duration === 60 ? "1시간" : `${reservation.duration}분`;
  }
  if (field === "location" && params.has("location")) {
    element.textContent = reservation.location || "위치 미선택";
  }
});

const reservationForm = document.getElementById("reservation-form");
if (reservationForm) {
  reservationForm.elements.location.value = reservation.location;
  reservationForm.elements.radius.value = String(reservation.radius);
  reservationForm.elements.duration.value = String(reservation.duration);

  reservationForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(reservationForm);
    const selection = {
      location: String(data.get("location")).trim(),
      radius: allowedNumber(data.get("radius"), allowedRadii, 300),
      duration: allowedNumber(data.get("duration"), allowedDurations, 15)
    };
    window.location.href = reservationUrl("reservation_payment.html", selection);
  });
}

for (const id of ["back-link", "cancel-link"]) {
  const link = document.getElementById(id);
  if (link) link.href = reservationUrl("reservation_confirm.html");
}

const otherPayment = document.getElementById("other-payment");
if (otherPayment) {
  otherPayment.addEventListener("click", () => {
    announce("현재는 Kakao Pay 예시 화면입니다. 다른 결제 수단은 아직 연결되지 않았어요.");
  });
}

const paymentForm = document.getElementById("payment-form");
if (paymentForm) {
  const preview = document.getElementById("payment-preview");
  paymentForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (paymentForm.reportValidity()) preview.showModal();
  });
  document.getElementById("close-preview").addEventListener("click", () => {
    preview.close();
  });
  document.getElementById("preview-next").addEventListener("click", () => {
    window.location.href = reservationUrl("reservation_waiting.html");
  });
}

const continueWaiting = document.getElementById("continue-waiting");
if (continueWaiting) {
  continueWaiting.addEventListener("click", () => {
    announce("대기 화면을 유지합니다. 실제 매칭 알림은 백엔드 연결 후 받을 수 있어요.");
  });
}

const viewLocation = document.getElementById("view-location");
if (viewLocation) {
  const matched = document.querySelector(".matched");
  const locationPreview = document.getElementById("location-preview");
  const closeLocation = document.getElementById("close-location");

  viewLocation.addEventListener("click", () => {
    matched.hidden = true;
    locationPreview.hidden = false;
    closeLocation.focus();
  });
  closeLocation.addEventListener("click", () => {
    matched.hidden = false;
    locationPreview.hidden = true;
    viewLocation.focus();
  });
}
