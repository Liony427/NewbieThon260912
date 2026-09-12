"use strict";

const API_BASE_URL = "http://127.0.0.1:8000";

const page = document.body.dataset.page;
const params = new URLSearchParams(window.location.search);

const allowedRadii = [100, 300, 500];
const allowedDurations = [15, 30, 60];


function allowedNumber(value, allowed, fallback) {
  const number = Number(value);

  return allowed.includes(number)
    ? number
    : fallback;
}


// =============================
// 현재 예약 정보
// =============================

const reservation = {
  location:
    (params.get("location") || "").slice(0, 100),

  latitude:
    Number(params.get("latitude")),

  longitude:
    Number(params.get("longitude")),

  radius:
    allowedNumber(
      params.get("radius"),
      allowedRadii,
      300
    ),

  duration:
    allowedNumber(
      params.get("duration"),
      allowedDurations,
      15
    )
};


// =============================
// URL 생성
// =============================

function reservationUrl(
  target,
  data = reservation
) {

  const query =
    new URLSearchParams({
      location: data.location,
      latitude: String(data.latitude),
      longitude: String(data.longitude),
      radius: String(data.radius),
      duration: String(data.duration)
    });

  return `${target}?${query.toString()}`;
}


// =============================
// 알림 메시지
// =============================

function announce(message) {

  const status =
    document.getElementById("status");

  if (!status) {
    return;
  }

  status.textContent = message;
  status.hidden = false;
}


// =============================
// 예약 정보 화면 표시
// =============================

document
  .querySelectorAll("[data-field]")
  .forEach((element) => {

    const field =
      element.dataset.field;


    if (field === "location") {

      element.textContent =
        reservation.location
        ||
        "위치 미선택";

    }


    if (field === "radius") {

      element.textContent =
        `${reservation.radius}m`;

    }


    if (field === "duration") {

      element.textContent =
        reservation.duration === 60
          ? "1시간"
          : `${reservation.duration}분`;

    }

  });


// =============================
// 돌아가기
// =============================

for (
  const id of [
    "back-link",
    "cancel-link"
  ]
) {

  const link =
    document.getElementById(id);

  if (link) {

    link.href =
      reservationUrl(
        "reservation_confirm.html"
      );

  }

}


// =============================
// 다른 결제 수단
// =============================

const otherPayment =
  document.getElementById(
    "other-payment"
  );


if (otherPayment) {

  otherPayment.addEventListener(
    "click",
    () => {

      announce(
        "현재는 Kakao Pay만 지원합니다."
      );

    }
  );

}


// =============================
// 가격 조회
// =============================

let reservationPrice = null;


async function loadReservationPrice() {

  const priceElement =
    document.getElementById(
      "reservation-price"
    );


  if (!priceElement) {
    return;
  }


  try {

    const response =
      await fetch(
        `${API_BASE_URL}/reservations/price`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body:
            JSON.stringify({
              radius:
                reservation.radius
            })
        }
      );


    if (!response.ok) {

      throw new Error(
        `가격 조회 실패: ${response.status}`
      );

    }


    const data =
      await response.json();


    reservationPrice =
      data.price;


    priceElement.textContent =
      `${reservationPrice.toLocaleString()}원`;

  }

  catch (error) {

    console.error(
      "가격 조회 오류:",
      error
    );


    priceElement.textContent =
      "조회 실패";


    announce(
      "예약 가격을 불러오지 못했습니다."
    );

  }

}


// =============================
// 예약 시간 생성
// =============================

function makeReservationTimes() {

  const start =
    new Date();


  const end =
    new Date(
      start.getTime()
      +
      reservation.duration
      * 60
      * 1000
    );


  // 현재 백엔드가 문자열을 받으므로
  // ISO 문자열로 저장
  return {
    startTime:
      start.toISOString(),

    endTime:
      end.toISOString()
  };

}


// =============================
// 실제 예약 생성
// =============================

async function createReservation() {

  const userId =
    Number(
      localStorage.getItem("userId")
    );


  if (!userId) {

    alert(
      "로그인이 필요합니다."
    );

    window.location.href =
      "index.html";

    return;
  }


  if (
    !reservation.location
    ||
    !Number.isFinite(
      reservation.latitude
    )
    ||
    !Number.isFinite(
      reservation.longitude
    )
  ) {

    alert(
      "예약 위치 정보가 없습니다.\n위치를 다시 선택해주세요."
    );

    window.location.href =
      "reservation_confirm.html";

    return;
  }


  const times =
    makeReservationTimes();


  const requestBody = {

    user_id:
      userId,

    address:
      reservation.location,

    latitude:
      reservation.latitude,

    longitude:
      reservation.longitude,

    radius:
      reservation.radius,

    start_time:
      times.startTime,

    end_time:
      times.endTime

  };


  console.log(
    "예약 생성 요청:",
    requestBody
  );


  const response =
    await fetch(
      `${API_BASE_URL}/reservations`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json"
        },

        body:
          JSON.stringify(
            requestBody
          )
      }
    );


  if (!response.ok) {

    const errorText =
      await response.text();


    console.error(
      "예약 생성 실패:",
      response.status,
      errorText
    );


    throw new Error(
      `예약 생성 실패: ${response.status}`
    );

  }


  return await response.json();
}


// =============================
// 결제하기
// =============================

const paymentForm =
  document.getElementById(
    "payment-form"
  );


if (paymentForm) {

  const payButton =
    paymentForm.querySelector(
      'button[type="submit"]'
    );


  paymentForm.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();


      // required 체크박스 검사
      if (
        !paymentForm.reportValidity()
      ) {
        return;
      }


      if (
        reservationPrice === null
      ) {

        alert(
          "결제 금액을 불러오는 중입니다."
        );

        return;
      }


      payButton.disabled = true;
      payButton.textContent =
        "처리 중...";


      try {

        const createdReservation =
          await createReservation();


        console.log(
          "예약 생성 성공:",
          createdReservation
        );


        // 이후 대기 화면에서 사용
        sessionStorage.setItem(
          "currentReservationId",
          String(
            createdReservation.id
          )
        );


        sessionStorage.setItem(
          "currentReservation",
          JSON.stringify(
            createdReservation
          )
        );


        // 결제 성공으로 가정
        window.location.href =
          reservationUrl(
            "reservation_waiting.html"
          );

      }

      catch (error) {

        console.error(
          "예약 처리 오류:",
          error
        );


        alert(
          "예약 처리에 실패했습니다."
        );


        payButton.disabled = false;
        payButton.textContent =
          "결제하기";

      }

    }
  );

}


// =============================
// Payment 페이지에서 가격 조회
// =============================

if (page === "payment") {

  loadReservationPrice();

}


// =============================
// 대기 화면
// =============================

const continueWaiting =
  document.getElementById(
    "continue-waiting"
  );


if (continueWaiting) {

  continueWaiting.addEventListener(
    "click",
    () => {

      announce(
        "현재 예약이 매칭을 기다리고 있습니다."
      );

    }
  );

}


// =============================
// 매칭 완료 화면의 위치 보기
// =============================

const viewLocation =
  document.getElementById(
    "view-location"
  );


if (viewLocation) {

  const matched =
    document.querySelector(
      ".matched"
    );

  const locationPreview =
    document.getElementById(
      "location-preview"
    );

  const closeLocation =
    document.getElementById(
      "close-location"
    );


  viewLocation.addEventListener(
    "click",
    () => {

      matched.hidden = true;
      locationPreview.hidden = false;

      closeLocation.focus();

    }
  );


  closeLocation.addEventListener(
    "click",
    () => {

      matched.hidden = false;
      locationPreview.hidden = true;

      viewLocation.focus();

    }
  );

}