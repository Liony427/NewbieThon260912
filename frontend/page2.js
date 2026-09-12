const API_BASE_URL = "http://127.0.0.1:8000";


const reservationAddress =
  document.getElementById("reservationAddress");

const reservationRadius =
  document.getElementById("reservationRadius");

const reservationDuration =
  document.getElementById("reservationDuration");

const totalPrice =
  document.getElementById("totalPrice");

const paymentButton =
  document.getElementById("paymentButton");

const backButton =
  document.getElementById("backButton");

const termCheckboxes =
  document.querySelectorAll(".term-checkbox");


// -------------------------
// 로그인 사용자 확인
// -------------------------

const userId =
  Number(
    localStorage.getItem("userId")
  );


if (!userId) {

  alert("로그인이 필요합니다.");

  window.location.href =
    "index.html";

}


// -------------------------
// page1 예약 정보 가져오기
// -------------------------

const draftString =
  sessionStorage.getItem(
    "reservationDraft"
  );


if (!draftString) {

  alert(
    "예약 정보가 없습니다.\n예약 정보를 다시 선택해주세요."
  );

  window.location.href =
    "page1.html";

}


const reservationDraft =
  JSON.parse(draftString);


// -------------------------
// 화면 표시
// -------------------------

reservationAddress.textContent =
  reservationDraft.address;

reservationRadius.textContent =
  `${reservationDraft.radius}m`;


if (reservationDraft.duration === 60) {

  reservationDuration.textContent =
    "1시간";

}
else {

  reservationDuration.textContent =
    `${reservationDraft.duration}분`;

}


// -------------------------
// 시간 계산
// -------------------------

function formatTime(date) {

  const hours =
    String(
      date.getHours()
    ).padStart(2, "0");

  const minutes =
    String(
      date.getMinutes()
    ).padStart(2, "0");


  return `${hours}:${minutes}`;

}


function calculateReservationTime() {

  const start =
    new Date();

  const end =
    new Date(
      start.getTime()
      +
      reservationDraft.duration
      * 60
      * 1000
    );


  return {

    startTime:
      formatTime(start),

    endTime:
      formatTime(end)

  };

}


// -------------------------
// 가격 조회
// -------------------------

let reservationPrice = null;


async function loadPrice() {

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
                reservationDraft.radius
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


    totalPrice.textContent =
      `${reservationPrice.toLocaleString()}원`;

  }

  catch (error) {

    console.error(
      "가격 조회 오류:",
      error
    );


    totalPrice.textContent =
      "가격 조회 실패";


    alert(
      "예약 가격을 불러오지 못했습니다."
    );

  }

}


loadPrice();


// -------------------------
// 약관 체크
// -------------------------

termCheckboxes.forEach(
  function (checkbox) {

    checkbox.dataset.checked =
      "false";


    checkbox.addEventListener(
      "click",
      function () {

        const checked =
          checkbox.dataset.checked
          ===
          "true";


        checkbox.dataset.checked =
          String(!checked);


        if (!checked) {

          checkbox.classList.add(
            "checked"
          );

        }
        else {

          checkbox.classList.remove(
            "checked"
          );

        }

      }
    );

  }
);


function allTermsChecked() {

  return Array.from(
    termCheckboxes
  ).every(
    function (checkbox) {

      return (
        checkbox.dataset.checked
        ===
        "true"
      );

    }
  );

}


// -------------------------
// 돌아가기
// -------------------------

backButton.addEventListener(
  "click",
  function () {

    window.location.href =
      "page1.html";

  }
);


// -------------------------
// 예약 생성
// -------------------------

async function createReservation() {

  if (!allTermsChecked()) {

    alert(
      "필수 약관에 모두 동의해주세요."
    );

    return;

  }


  if (reservationPrice === null) {

    alert(
      "가격 정보를 불러오는 중입니다."
    );

    return;

  }


  const reservationTime =
    calculateReservationTime();


  const requestBody = {

    user_id:
      userId,

    address:
      reservationDraft.address,

    latitude:
      reservationDraft.latitude,

    longitude:
      reservationDraft.longitude,

    radius:
      reservationDraft.radius,

    start_time:
      reservationTime.startTime,

    end_time:
      reservationTime.endTime

  };


  console.log(
    "예약 생성 요청:",
    requestBody
  );


  paymentButton.style.pointerEvents =
    "none";


  try {

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

      throw new Error(
        `예약 생성 실패: ${response.status}`
      );

    }


    const reservation =
      await response.json();


    console.log(
      "예약 생성 성공:",
      reservation
    );


    // 이후 예약중 화면에서 사용
    sessionStorage.setItem(
      "currentReservationId",
      String(reservation.id)
    );


    // 임시 예약 정보도 저장
    sessionStorage.setItem(
      "currentReservation",
      JSON.stringify(
        reservation
      )
    );


    alert(
      "예약이 완료되었습니다!"
    );


    /*
      다음 단계에서
      예약중 화면으로 이동하도록 연결할 예정.

      예:
      window.location.href =
        "reservationWaiting.html";
    */

  }

  catch (error) {

    console.error(
      "예약 생성 오류:",
      error
    );


    alert(
      "예약에 실패했습니다.\n다시 시도해주세요."
    );

  }

  finally {

    paymentButton.style.pointerEvents =
      "auto";

  }

}


paymentButton.addEventListener(
  "click",
  createReservation
);