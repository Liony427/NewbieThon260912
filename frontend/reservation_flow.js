"use strict";


// ==========================================
// 기본 설정
// ==========================================

const API_BASE_URL =
  "http://127.0.0.1:8000";


const page =
  document.body.dataset.page;


const params =
  new URLSearchParams(
    window.location.search
  );


const allowedRadii =
  [100, 300, 500];


const allowedDurations =
  [15, 30, 60];


// ==========================================
// 값 검증
// ==========================================

function allowedNumber(
  value,
  allowed,
  fallback
) {

  const number =
    Number(value);


  return allowed.includes(number)
    ? number
    : fallback;

}


// ==========================================
// URL에서 예약 정보 읽기
// ==========================================

const reservation = {

  location:
    (params.get("location") || "")
      .slice(0, 100),

  latitude:
    Number(
      params.get("latitude")
    ),

  longitude:
    Number(
      params.get("longitude")
    ),

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


// ==========================================
// 예약 정보가 포함된 URL 생성
// ==========================================

function reservationUrl(
  target,
  data = reservation
) {

  const query =
    new URLSearchParams({
      location:
        data.location || "",

      latitude:
        String(data.latitude),

      longitude:
        String(data.longitude),

      radius:
        String(data.radius),

      duration:
        String(data.duration)
    });


  return `${target}?${query.toString()}`;

}


// ==========================================
// 하단 토스트 메시지
// ==========================================

function announce(message) {

  const status =
    document.getElementById(
      "status"
    );


  if (!status) {
    return;
  }


  status.textContent =
    message;


  status.hidden =
    false;

}


// ==========================================
// 화면에 예약 정보 표시
// ==========================================

document
  .querySelectorAll(
    "[data-field]"
  )
  .forEach(
    function (element) {

      const field =
        element.dataset.field;


      if (
        field === "location"
      ) {

        element.textContent =
          reservation.location
          ||
          "위치 미선택";

      }


      if (
        field === "radius"
      ) {

        element.textContent =
          `${reservation.radius}m`;

      }


      if (
        field === "duration"
      ) {

        element.textContent =
          reservation.duration === 60
            ? "1시간"
            : `${reservation.duration}분`;

      }

    }
  );


// ==========================================
// 돌아가기 / 취소 링크
// ==========================================

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


// ==========================================
// 결제 화면
// ==========================================

let reservationPrice =
  null;


// ------------------------------------------
// 가격 조회
// ------------------------------------------

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


// ------------------------------------------
// 다른 결제 수단
// ------------------------------------------

const otherPayment =
  document.getElementById(
    "other-payment"
  );


if (otherPayment) {

  otherPayment.addEventListener(
    "click",
    function () {

      announce(
        "현재는 Kakao Pay만 지원합니다."
      );

    }
  );

}


// ------------------------------------------
// 예약 시작/종료 시간 생성
// ------------------------------------------

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


  return {

    startTime:
      start.toISOString(),

    endTime:
      end.toISOString()

  };

}


// ------------------------------------------
// 실제 예약 생성
// ------------------------------------------

async function createReservation() {

  const userId =
    Number(
      localStorage.getItem(
        "userId"
      )
    );


  if (!userId) {

    alert(
      "로그인이 필요합니다."
    );


    window.location.href =
      "index.html";


    return null;

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


    return null;

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


// ------------------------------------------
// 결제 버튼
// ------------------------------------------

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
    async function (event) {

      event.preventDefault();


      // 필수 약관 확인
      if (
        !paymentForm.reportValidity()
      ) {
        return;
      }


      // 가격 조회가 끝나지 않은 경우
      if (
        reservationPrice === null
      ) {

        alert(
          "결제 금액을 불러오는 중입니다."
        );

        return;

      }


      payButton.disabled =
        true;


      payButton.textContent =
        "처리 중...";


      try {

        const createdReservation =
          await createReservation();


        if (!createdReservation) {
          return;
        }


        console.log(
          "예약 생성 성공:",
          createdReservation
        );


        // 현재 예약 ID 저장
        sessionStorage.setItem(
          "currentReservationId",
          String(
            createdReservation.id
          )
        );


        // 예약 데이터도 저장
        sessionStorage.setItem(
          "currentReservation",
          JSON.stringify(
            createdReservation
          )
        );


        // 대기 화면 이동
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


        payButton.disabled =
          false;


        payButton.textContent =
          "결제하기";

      }

    }
  );

}


// payment 화면 진입 시 가격 조회

if (
  page === "payment"
) {

  loadReservationPrice();

}


// ==========================================
// 예약 시간 표시
// ==========================================

function formatReservationTime(
  startTime,
  endTime
) {

  if (
    !startTime
    ||
    !endTime
  ) {

    return "시간 정보 없음";

  }


  const start =
    new Date(startTime);


  const end =
    new Date(endTime);


  const format =
    new Intl.DateTimeFormat(
      "ko-KR",
      {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      }
    );


  return (
    `${format.format(start)} ~ ${format.format(end)}`
  );

}


// ==========================================
// 예약 상태 확인
//
// WAITING
// → MATCHED
// → COMPLETED
// ==========================================

let reservationStatusTimer =
  null;


// ------------------------------------------
// 예약 완료 화면으로 변경
// ------------------------------------------

function showReservationCompleted() {

  if (
    reservationStatusTimer
  ) {

    clearInterval(
      reservationStatusTimer
    );

  }


  const matchedPanel =
    document.getElementById(
      "matched-panel"
    );


  const waitingPanel =
    document.getElementById(
      "reservation-status-panel"
    );


  const panel =
    matchedPanel
    ||
    waitingPanel;


  if (!panel) {
    return;
  }


  panel.innerHTML = `

    <span class="badge">

      <svg
        class="icon"
        viewBox="0 0 32 32"
        fill="none"
        stroke="currentColor"
        stroke-width="4"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >

        <path
          d="M7 16l6 6L25 8"
        ></path>

      </svg>

    </span>


    <h2>
      자전거 반납 완료!
    </h2>


    <p class="subtitle">
      요청한 반납 구역에 자전거가 도착했습니다.
    </p>


    <a
      class="primary"
      href="main.html"
    >
      확인
    </a>

  `;

}


// ------------------------------------------
// 서버에서 현재 예약 상태 조회
// ------------------------------------------

async function checkReservationStatus() {

  if (
    page !== "waiting"
    &&
    page !== "matched"
  ) {

    return;

  }


  const reservationId =
    sessionStorage.getItem(
      "currentReservationId"
    );


  if (!reservationId) {

    console.error(
      "currentReservationId가 없습니다."
    );


    return;

  }


  try {

    const response =
      await fetch(
        `${API_BASE_URL}/reservations/${reservationId}`
      );


    if (!response.ok) {

      throw new Error(
        `예약 조회 실패: ${response.status}`
      );

    }


    const data =
      await response.json();


    console.log(
      "현재 예약 상태:",
      data.status
    );


    // 항상 최신 예약 데이터 저장
    sessionStorage.setItem(
      "currentReservation",
      JSON.stringify(data)
    );


    // ======================================
    // waiting 화면 정보 갱신
    // ======================================

    if (
      page === "waiting"
    ) {

      const radiusElement =
        document.querySelector(
          '[data-field="radius"]'
        );


      if (
        radiusElement
      ) {

        radiusElement.textContent =
          `${data.radius}m`;

      }


      const timeElement =
        document.getElementById(
          "reservation-time"
        );


      if (
        timeElement
      ) {

        timeElement.textContent =
          formatReservationTime(
            data.start_time,
            data.end_time
          );

      }

    }


    // ======================================
    // COMPLETED
    // 반납자가 실제 반납 완료
    // ======================================

    if (
      data.status === "COMPLETED"
    ) {

      showReservationCompleted();

      return;

    }


    // ======================================
    // WAITING → MATCHED
    // ======================================

    if (
      page === "waiting"
      &&
      data.status === "MATCHED"
    ) {

      if (
        reservationStatusTimer
      ) {

        clearInterval(
          reservationStatusTimer
        );

      }


      const query =
        new URLSearchParams({

          reservation_id:
            String(data.id),

          location:
            data.address,

          latitude:
            String(
              data.latitude
            ),

          longitude:
            String(
              data.longitude
            ),

          radius:
            String(
              data.radius
            ),

          duration:
            String(
              reservation.duration
            )

        });


      window.location.href =
        `reservation_matched.html?${query.toString()}`;

    }

  }

  catch (error) {

    console.error(
      "예약 상태 확인 오류:",
      error
    );

  }

}


// ------------------------------------------
// waiting / matched에서는 3초마다 조회
// ------------------------------------------

if (
  page === "waiting"
  ||
  page === "matched"
) {

  // 화면 진입 즉시 한 번
  checkReservationStatus();


  // 이후 3초마다
  reservationStatusTimer =
    setInterval(
      checkReservationStatus,
      3000
    );

}


// ==========================================
// 대기 계속 버튼
// ==========================================

const continueWaiting =
  document.getElementById(
    "continue-waiting"
  );


if (
  continueWaiting
) {

  continueWaiting.addEventListener(
    "click",
    function () {

      announce(
        "현재 예약이 매칭을 기다리고 있습니다."
      );

    }
  );

}


// ==========================================
// 매칭 완료 화면
// 위치 확인 / 돌아가기
// ==========================================

const viewLocation =
  document.getElementById(
    "view-location"
  );


if (
  viewLocation
) {

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


  if (
    matched
    &&
    locationPreview
    &&
    closeLocation
  ) {

    viewLocation.addEventListener(
      "click",
      function () {

        matched.hidden =
          true;


        locationPreview.hidden =
          false;


        closeLocation.focus();

      }
    );


    closeLocation.addEventListener(
      "click",
      function () {

        matched.hidden =
          false;


        locationPreview.hidden =
          true;


        viewLocation.focus();

      }
    );

  }

}