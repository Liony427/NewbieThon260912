"use strict";


const API_BASE_URL =
  "http://127.0.0.1:8000";


const page =
  document.body.dataset.page;


// ========================================
// 거리 표시
// ========================================

function formatDistance(distance) {

  if (distance < 1000) {

    return `${Math.round(distance)}m`;

  }

  return `${(
    distance / 1000
  ).toFixed(1)}km`;

}


// ========================================
// 예상 이동 시간
// MVP: 자전거 약 250m/분 가정
// ========================================

function estimateMinutes(distance) {

  return Math.max(
    1,
    Math.ceil(distance / 250)
  );

}


// ========================================
// 반납 추천 화면
// ========================================

if (page === "recommend") {

  const list =
    document.getElementById(
      "recommendation-list"
    );

  const statusText =
    document.getElementById(
      "recommend-status"
    );

  const refreshButton =
    document.getElementById(
      "refresh-recommendations"
    );

  const mapContainer =
    document.getElementById(
      "return-map"
    );


  let map = null;
  let userMarker = null;
  let reservationMarkers = [];
  let reservationCircles = [];

  // ------------------------------------
  // 지도 초기화
  // ------------------------------------

  function createMap(
    latitude,
    longitude
  ) {

    const position =
      new kakao.maps.LatLng(
        latitude,
        longitude
      );


    if (!map) {

      map =
        new kakao.maps.Map(
          mapContainer,
          {
            center: position,
            level: 4
          }
        );


      userMarker =
        new kakao.maps.Marker({
          position
        });


      userMarker.setMap(map);

    }

    else {

      map.setCenter(position);

      userMarker.setPosition(
        position
      );

    }

  }


  // ------------------------------------
  // 기존 예약 마커 삭제
  // ------------------------------------

  function clearReservationMarkers() {

  reservationMarkers.forEach(
    function (marker) {

      marker.setMap(null);

    }
  );

  reservationMarkers = [];


  reservationCircles.forEach(
    function (circle) {

      circle.setMap(null);

    }
  );

  reservationCircles = [];

}


  // ------------------------------------
  // 예약 위치 마커 표시
  // ------------------------------------

  function showReservationMarkers(
  reservations
) {

  clearReservationMarkers();


  reservations.forEach(
    function (reservation) {

      const position =
        new kakao.maps.LatLng(
          reservation.latitude,
          reservation.longitude
        );


      // 예약 위치 중심 마커
      const marker =
        new kakao.maps.Marker({
          position
        });

      marker.setMap(map);

      reservationMarkers.push(
        marker
      );


      // 예약자가 지정한 반납 가능 영역
      const circle =
        new kakao.maps.Circle({
          center: position,

          // DB의 radius 값 그대로 사용
          radius: reservation.radius,

          strokeWeight: 2,
          strokeColor: "#10bb89",
          strokeOpacity: 0.9,
          strokeStyle: "solid",

          fillColor: "#10bb89",
          fillOpacity: 0.18
        });


      circle.setMap(map);


      reservationCircles.push(
        circle
      );

    }
  );

}


  // ------------------------------------
  // 추천 카드 생성
  // ------------------------------------

  function renderReservations(
    reservations
  ) {

    list.innerHTML = "";


    if (reservations.length === 0) {

      statusText.textContent =
        "현재 주변에 반납 요청이 없어요.";

      return;

    }


    statusText.textContent =
      "지금 반납하면 받을 수 있는 추가 보상이에요!";


    reservations.forEach(
      function (reservation) {

        const distanceText =
          formatDistance(
            reservation.distance
          );


        const minutes =
          estimateMinutes(
            reservation.distance
          );


        const link =
          document.createElement(
            "a"
          );


        link.className =
          "recommendation";


        const query =
          new URLSearchParams({
            reservation_id:
              String(
                reservation.id
              ),

            address:
              reservation.address,

            latitude:
              String(
                reservation.latitude
              ),

            longitude:
              String(
                reservation.longitude
              ),

            radius:
              String(
                reservation.radius
              ),

            price:
              String(
                reservation.price
              ),

            distance:
              String(
                reservation.distance
              )
          });


        link.href =
          `return_confirm.html?${query.toString()}`;


        link.innerHTML = `
          <span class="badge small">
            <svg
              class="icon"
              viewBox="0 0 32 32"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path
                d="M16 2C9 2 4 7 4 14c0 9 12 17 12 17s12-8 12-17C28 7 23 2 16 2Z"
                fill="currentColor"
                stroke="white"
              ></path>

              <circle
                cx="16"
                cy="13"
                r="5"
                fill="#d9d9d9"
                stroke="white"
              ></circle>
            </svg>
          </span>


          <span class="destination">

            <strong>
              ${reservation.address}
            </strong>

            <span>
              약 ${distanceText}
              ·
              ${minutes}분 거리
            </span>

          </span>


          <strong class="reward">
            +${reservation.price}원
          </strong>

          <span
            class="chevron"
            aria-hidden="true"
          ></span>
        `;


        list.appendChild(link);

      }
    );

  }


  // ------------------------------------
  // API 호출
  // ------------------------------------

  async function loadNearbyReservations(
    latitude,
    longitude
  ) {

    statusText.textContent =
      "주변 반납 요청을 찾고 있어요.";


    try {

      const query =
        new URLSearchParams({
          latitude:
            String(latitude),

          longitude:
            String(longitude),

          max_distance:
            "2000"
        });


      const response =
        await fetch(
          `${API_BASE_URL}/reservations/nearby?${query.toString()}`
        );


      if (!response.ok) {

        throw new Error(
          `주변 예약 조회 실패: ${response.status}`
        );

      }


      const reservations =
        await response.json();


      console.log(
        "주변 예약:",
        reservations
      );


      renderReservations(
        reservations
      );


      showReservationMarkers(
        reservations
      );

    }

    catch (error) {

      console.error(
        "주변 예약 조회 오류:",
        error
      );


      statusText.textContent =
        "주변 요청을 불러오지 못했습니다.";

    }

  }


  // ------------------------------------
  // 현재 위치 가져오기
  // ------------------------------------

  function findNearby() {

    if (
      !navigator.geolocation
    ) {

      statusText.textContent =
        "이 브라우저에서는 위치 기능을 사용할 수 없습니다.";

      return;

    }


    statusText.textContent =
      "현재 위치를 확인하고 있어요.";


    navigator.geolocation.getCurrentPosition(

      function (position) {

        const latitude =
          position.coords.latitude;

        const longitude =
          position.coords.longitude;


        console.log(
          "현재 위치:",
          latitude,
          longitude
        );


        createMap(
          latitude,
          longitude
        );


        loadNearbyReservations(
          latitude,
          longitude
        );

      },


      function (error) {

        console.error(
          "GPS 오류:",
          error
        );


        statusText.textContent =
          "현재 위치를 가져올 수 없습니다.";

      },


      {
        enableHighAccuracy: true,

        timeout: 10000,

        maximumAge: 30000
      }

    );

  }


  refreshButton.addEventListener(
    "click",
    findNearby
  );


  // 페이지 진입 즉시 실행
  findNearby();

}


// ========================================
// 반납 요청 확인 화면
// ========================================

if (page === "confirm") {

  const params =
    new URLSearchParams(
      window.location.search
    );


  const reservationId =
    params.get(
      "reservation_id"
    );

  const address =
    params.get(
      "address"
    );

  const latitude =
    Number(
      params.get("latitude")
    );

  const longitude =
    Number(
      params.get("longitude")
    );

  const radius =
    Number(
      params.get("radius")
    );

  const price =
    Number(
      params.get("price")
    );

  const distance =
    Number(
      params.get("distance")
    );


  // ----------------------------
  // 필요한 예약 정보가 없으면
  // ----------------------------

  if (!reservationId) {

    alert(
      "선택한 반납 요청 정보를 찾을 수 없습니다."
    );

    window.location.href =
      "return_recommend.html";

  }


  // ----------------------------
  // 추가 할인
  // ----------------------------

  const rewardElement =
    document.querySelector(
      '[data-value="reward"]'
    );

  if (rewardElement) {

    rewardElement.textContent =
      `+${price.toLocaleString()}원`;

  }


  // ----------------------------
  // 반납 허용 반경
  // ----------------------------

  const radiusElement =
    document.querySelector(
      '[data-value="radius"]'
    );

  if (radiusElement) {

    radiusElement.textContent =
      `${radius}m`;

  }


  // ----------------------------
  // 예상 추가 시간
  // ----------------------------

  const timeElement =
    document.querySelector(
      '[data-value="time"]'
    );

  if (timeElement) {

    const minutes =
      Math.max(
        1,
        Math.ceil(
          distance / 250
        )
      );


    timeElement.textContent =
      `약 ${minutes}분`;

  }


  // ----------------------------
  // 선택한 예약 정보 저장
  // ----------------------------

  const selectedReservation = {

    reservationId:
      Number(reservationId),

    address:
      address,

    latitude:
      latitude,

    longitude:
      longitude,

    radius:
      radius,

    price:
      price,

    distance:
      distance

  };


  sessionStorage.setItem(
    "selectedReturnReservation",
    JSON.stringify(
      selectedReservation
    )
  );


  // ----------------------------
  // 다음 페이지에도 정보 전달
  // ----------------------------

  // ----------------------------
// 확인 → 실제 매칭 생성
// ----------------------------

const confirmButton =
  document.getElementById(
    "confirm-link"
  );


if (confirmButton) {

  confirmButton.addEventListener(
    "click",
    async function () {

      const returnUserId =
        Number(
          localStorage.getItem(
            "userId"
          )
        );


      if (!returnUserId) {

        alert(
          "로그인이 필요합니다."
        );

        window.location.href =
          "index.html";

        return;
      }


      confirmButton.disabled = true;
      confirmButton.textContent =
        "매칭 중...";


      try {

        const response =
          await fetch(
            `${API_BASE_URL}/matching`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json"
              },

              body:
                JSON.stringify({
                  reservation_id:
                    Number(reservationId),

                  return_user_id:
                    returnUserId,

                  // MVP에서는 자전거 1번으로 임시 고정
                  bike_id: 1
                })
            }
          );


        if (!response.ok) {

          const errorData =
            await response.json();


          if (response.status === 409) {

            alert(
              "이미 다른 사용자가 선택한 요청입니다."
            );

            window.location.href =
              "return_recommend.html";

            return;
          }


          throw new Error(
            errorData.detail
            ||
            `매칭 실패: ${response.status}`
          );

        }


        const match =
          await response.json();


        console.log(
          "매칭 성공:",
          match
        );


        // 다음 화면에서 사용
        sessionStorage.setItem(
          "currentMatch",
          JSON.stringify(match)
        );


        // 실제 경로 안내 화면으로 이동
        window.location.href =
          `return_route.html?${params.toString()}`;

      }

      catch (error) {

        console.error(
          "매칭 생성 오류:",
          error
        );


        alert(
          "매칭 처리에 실패했습니다."
        );


        confirmButton.disabled = false;
        confirmButton.textContent =
          "확인";

      }

    }
  );

}

}

// ========================================
// 반납 경로 화면
// ========================================

if (page === "route") {

  const params =
    new URLSearchParams(
      window.location.search
    );


  const reservationId =
    Number(
      params.get("reservation_id")
    );

  const reservationLatitude =
    Number(
      params.get("latitude")
    );

  const reservationLongitude =
    Number(
      params.get("longitude")
    );

  const reservationRadius =
    Number(
      params.get("radius")
    );

  const reservationPrice =
    Number(
      params.get("price")
    );


  const mapContainer =
    document.getElementById(
      "route-map"
    );

  const distanceElement =
    document.getElementById(
      "distance-to-boundary"
    );

  const timeElement =
    document.getElementById(
      "route-time"
    );

  const statusElement =
    document.getElementById(
      "location-status"
    );

  const returnButton =
    document.getElementById(
      "return-button"
    );


  let map = null;

  let currentMarker = null;

  let reservationMarker = null;

  let reservationCircle = null;

  let latestLatitude = null;

  let latestLongitude = null;


  // ------------------------------------
  // 지도 초기화
  // ------------------------------------

  function initializeRouteMap() {

    const reservationPosition =
      new kakao.maps.LatLng(
        reservationLatitude,
        reservationLongitude
      );


    map =
      new kakao.maps.Map(
        mapContainer,
        {
          center:
            reservationPosition,

          level: 4
        }
      );


    // 예약 위치 중심
    reservationMarker =
      new kakao.maps.Marker({
        position:
          reservationPosition
      });


    reservationMarker.setMap(
      map
    );


    // 실제 반납 가능 영역
    reservationCircle =
      new kakao.maps.Circle({

        center:
          reservationPosition,

        radius:
          reservationRadius,

        strokeWeight: 2,

        strokeColor:
          "#10bb89",

        strokeOpacity:
          0.9,

        strokeStyle:
          "solid",

        fillColor:
          "#10bb89",

        fillOpacity:
          0.18

      });


    reservationCircle.setMap(
      map
    );

  }


  // ------------------------------------
  // 현재 위치 마커
  // ------------------------------------

  function updateCurrentMarker(
    latitude,
    longitude
  ) {

    const currentPosition =
      new kakao.maps.LatLng(
        latitude,
        longitude
      );


    if (!currentMarker) {

      currentMarker =
        new kakao.maps.Marker({
          position:
            currentPosition
        });


      currentMarker.setMap(
        map
      );

    }

    else {

      currentMarker.setPosition(
        currentPosition
      );

    }

  }


  // ------------------------------------
  // 실제 서버에 위치 확인
  // ------------------------------------

  async function checkCurrentLocation(
    latitude,
    longitude
  ) {

    try {

      const response =
        await fetch(
          `${API_BASE_URL}/matching/check-location`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            body:
              JSON.stringify({
                reservation_id:
                  reservationId,

                latitude:
                  latitude,

                longitude:
                  longitude
              })
          }
        );


      if (!response.ok) {

        throw new Error(
          `위치 확인 실패: ${response.status}`
        );

      }


      const data =
        await response.json();


      console.log(
        "위치 확인 결과:",
        data
      );


      // 중심점까지 실제 거리
      const centerDistance =
        data.distance;


      // 반납 바운더리까지 남은 거리
      const distanceToBoundary =
        Math.max(
          0,
          centerDistance
          - reservationRadius
        );


      if (data.inside) {

        distanceElement.textContent =
          "도착";

        timeElement.textContent =
          "0분";

        statusElement.textContent =
          "반납 가능 구역에 도착했습니다.";

        returnButton.disabled =
          false;

        returnButton.textContent =
          `반납하기 (+${reservationPrice}원 할인)`;

      }

      else {

        const roundedDistance =
          Math.round(
            distanceToBoundary
          );


        distanceElement.textContent =
          `${roundedDistance}m`;


        const minutes =
          Math.max(
            1,
            Math.ceil(
              distanceToBoundary
              / 250
            )
          );


        timeElement.textContent =
          `약 ${minutes}분`;


        statusElement.textContent =
          "초록색 반납 가능 구역 안으로 이동해주세요.";


        returnButton.disabled =
          true;


        returnButton.textContent =
          "반납 구역에 도착하면 활성화됩니다";

      }

    }

    catch (error) {

      console.error(
        "위치 확인 오류:",
        error
      );


      statusElement.textContent =
        "현재 위치를 확인하지 못했습니다.";

    }

  }


  // ------------------------------------
  // GPS 위치 업데이트
  // ------------------------------------

  function handlePosition(
    position
  ) {

    latestLatitude =
      position.coords.latitude;

    latestLongitude =
      position.coords.longitude;


    console.log(
      "현재 GPS:",
      latestLatitude,
      latestLongitude
    );


    updateCurrentMarker(
      latestLatitude,
      latestLongitude
    );


    checkCurrentLocation(
      latestLatitude,
      latestLongitude
    );

  }


  function handlePositionError(
    error
  ) {

    console.error(
      "GPS 오류:",
      error
    );


    statusElement.textContent =
      "현재 위치를 가져올 수 없습니다.";

  }


  // ------------------------------------
  // 실제 반납 처리
  // ------------------------------------

  returnButton.addEventListener(
    "click",
    async function () {

      if (
        latestLatitude === null
        ||
        latestLongitude === null
      ) {

        alert(
          "현재 위치를 확인할 수 없습니다."
        );

        return;
      }


      returnButton.disabled =
        true;

      returnButton.textContent =
        "반납 처리 중...";


      try {

        const response =
          await fetch(
            `${API_BASE_URL}/returns`,
            {
              method:
                "POST",

              headers: {
                "Content-Type":
                  "application/json"
              },

              body:
                JSON.stringify({
                  reservation_id:
                    reservationId,

                  latitude:
                    latestLatitude,

                  longitude:
                    latestLongitude
                })
            }
          );


        if (!response.ok) {

          const errorData =
            await response.json();


          throw new Error(
            errorData.detail
            ||
            `반납 실패: ${response.status}`
          );

        }


        const result =
          await response.json();


        console.log(
          "반납 성공:",
          result
        );


        sessionStorage.setItem(
          "returnResult",
          JSON.stringify(
            result
          )
        );


        window.location.href =
          "return_complete.html";

      }

      catch (error) {

        console.error(
          "반납 처리 오류:",
          error
        );


        alert(
          error.message
        );


        returnButton.disabled =
          false;

        returnButton.textContent =
          "반납하기";

      }

    }
  );


  // ------------------------------------
  // 실행
  // ------------------------------------

  if (
    !reservationId
    ||
    !Number.isFinite(
      reservationLatitude
    )
    ||
    !Number.isFinite(
      reservationLongitude
    )
    ||
    !Number.isFinite(
      reservationRadius
    )
  ) {

    alert(
      "반납 요청 정보를 찾을 수 없습니다."
    );

    window.location.href =
      "return_recommend.html";

  }

  else {

    initializeRouteMap();


    if (
      !navigator.geolocation
    ) {

      statusElement.textContent =
        "이 브라우저에서는 위치 기능을 사용할 수 없습니다.";

    }

    else {

      // 계속 위치 추적
      navigator.geolocation.watchPosition(
        handlePosition,
        handlePositionError,
        {
          enableHighAccuracy:
            true,

          timeout:
            10000,

          maximumAge:
            5000
        }
      );

    }

  }

}