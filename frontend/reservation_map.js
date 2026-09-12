"use strict";


// =============================
// 예약 상태
// =============================

let selectedLocation = null;
let selectedRadius = 300;
let selectedDuration = 15;


// =============================
// HTML 요소
// =============================

const addressElement =
  document.getElementById("selected-address");

const radiusButtons =
  document.querySelectorAll("[data-radius]");

const durationButtons =
  document.querySelectorAll("[data-duration]");

const nextButton =
  document.getElementById("reservation-next");


// =============================
// 카카오 지도
// =============================

// 고려대학교 근처를 기본 위치로 사용
const initialPosition =
  new kakao.maps.LatLng(
    37.5865,
    127.0290
  );


const mapContainer =
  document.getElementById(
    "reservation-map"
  );


const map =
  new kakao.maps.Map(
    mapContainer,
    {
      center: initialPosition,
      level: 4
    }
  );


const marker =
  new kakao.maps.Marker({
    position: initialPosition
  });


marker.setMap(map);


const geocoder =
  new kakao.maps.services.Geocoder();


// =============================
// 위치 선택
// =============================

function selectLocation(latlng) {

  const latitude =
    latlng.getLat();

  const longitude =
    latlng.getLng();


  marker.setPosition(latlng);


  selectedLocation = {
    latitude,
    longitude,
    address: ""
  };


  // 좌표 → 주소
  geocoder.coord2Address(
    longitude,
    latitude,
    function (result, status) {

      if (
        status ===
        kakao.maps.services.Status.OK
      ) {

        const address =
          result[0].road_address?.address_name
          ||
          result[0].address.address_name;


        selectedLocation.address =
          address;


        addressElement.textContent =
          address;

      }

      else {

        selectedLocation.address =
          `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;


        addressElement.textContent =
          selectedLocation.address;

      }

    }
  );

}


// 지도 클릭
kakao.maps.event.addListener(
  map,
  "click",
  function (mouseEvent) {

    selectLocation(
      mouseEvent.latLng
    );

  }
);


// =============================
// 반경 선택
// =============================

radiusButtons.forEach(
  function (button) {

    button.addEventListener(
      "click",
      function () {

        selectedRadius =
          Number(
            button.dataset.radius
          );


        radiusButtons.forEach(
          function (item) {

            item.classList.remove(
              "selected"
            );

          }
        );


        button.classList.add(
          "selected"
        );

      }
    );

  }
);


// =============================
// 유지 시간 선택
// =============================

durationButtons.forEach(
  function (button) {

    button.addEventListener(
      "click",
      function () {

        selectedDuration =
          Number(
            button.dataset.duration
          );


        durationButtons.forEach(
          function (item) {

            item.classList.remove(
              "selected"
            );

          }
        );


        button.classList.add(
          "selected"
        );

      }
    );

  }
);


// =============================
// 다음 버튼
// =============================

nextButton.addEventListener(
  "click",
  function () {

    if (!selectedLocation) {

      alert(
        "지도에서 예약 위치를 선택해주세요."
      );

      return;

    }


    const params =
      new URLSearchParams({
        location:
          selectedLocation.address,

        latitude:
          String(
            selectedLocation.latitude
          ),

        longitude:
          String(
            selectedLocation.longitude
          ),

        radius:
          String(
            selectedRadius
          ),

        duration:
          String(
            selectedDuration
          )
      });


    window.location.href =
      `reservation_payment.html?${params.toString()}`;

  }
);