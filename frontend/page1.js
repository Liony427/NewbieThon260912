const mapContainer =
  document.getElementById("map");

const selectedAddressElement =
  document.getElementById("selectedAddress");

const radiusOptions =
  document.querySelectorAll(".radius-option");

const durationOptions =
  document.querySelectorAll(".duration-option");

const nextButton =
  document.getElementById("nextButton");


// -------------------------
// 예약 선택값
// -------------------------

let selectedRadius = 300;
let selectedDuration = 30;

let selectedLatitude = null;
let selectedLongitude = null;
let selectedAddress = null;


// -------------------------
// 카카오 지도 생성
// -------------------------

const mapOption = {

  center:
    new kakao.maps.LatLng(
      37.586,
      127.029
    ),

  level: 3

};


const map =
  new kakao.maps.Map(
    mapContainer,
    mapOption
  );


const marker =
  new kakao.maps.Marker();


marker.setMap(map);


const geocoder =
  new kakao.maps.services.Geocoder();


// -------------------------
// 지도 클릭 → 위치 선택
// -------------------------

kakao.maps.event.addListener(
  map,
  "click",
  function (mouseEvent) {

    const latlng =
      mouseEvent.latLng;


    selectedLatitude =
      latlng.getLat();

    selectedLongitude =
      latlng.getLng();


    marker.setPosition(
      latlng
    );


    geocoder.coord2Address(
      selectedLongitude,
      selectedLatitude,

      function (
        result,
        status
      ) {

        if (
          status ===
          kakao.maps.services.Status.OK
        ) {

          const address =
            result[0].road_address?.address_name
            ||
            result[0].address.address_name;


          selectedAddress =
            address;


          selectedAddressElement.textContent =
            address;


          console.log(
            "선택 위치:",
            {
              address:
                selectedAddress,

              latitude:
                selectedLatitude,

              longitude:
                selectedLongitude
            }
          );

        }

      }
    );

  }
);


// -------------------------
// 선택 UI 변경 함수
// -------------------------

function updateOptionUI(
  options,
  selectedOption
) {

  options.forEach(
    function (option) {

      const background =
        option.querySelector(
          ".rectangle-3, .rectangle-4"
        );

      const text =
        option.querySelector(
          ".text-wrapper-3, " +
          ".text-wrapper-4, " +
          ".text-wrapper-6, " +
          ".text-wrapper-7, " +
          ".text-wrapper-8"
        );


      if (option === selectedOption) {

        if (background) {
          background.style.backgroundColor =
            "#18BA86";
        }

        if (text) {
          text.style.color =
            "#ffffff";
        }

      }

      else {

        if (background) {
          background.style.backgroundColor =
            "#f6f8f9";
        }

        if (text) {
          text.style.color =
            "#00000073";
        }

      }

    }
  );

}


// -------------------------
// 반경 선택
// -------------------------

radiusOptions.forEach(
  function (option) {

    option.addEventListener(
      "click",
      function () {

        selectedRadius =
          Number(
            option.dataset.radius
          );


        updateOptionUI(
          radiusOptions,
          option
        );


        console.log(
          "선택 반경:",
          selectedRadius
        );

      }
    );

  }
);


// -------------------------
// 유지시간 선택
// -------------------------

durationOptions.forEach(
  function (option) {

    option.addEventListener(
      "click",
      function () {

        selectedDuration =
          Number(
            option.dataset.duration
          );


        updateOptionUI(
          durationOptions,
          option
        );


        console.log(
          "선택 유지시간:",
          selectedDuration
        );

      }
    );

  }
);


// -------------------------
// 초기 선택 UI
// -------------------------

const initialRadius =
  document.querySelector(
    '.radius-option[data-radius="300"]'
  );

const initialDuration =
  document.querySelector(
    '.duration-option[data-duration="30"]'
  );


updateOptionUI(
  radiusOptions,
  initialRadius
);


updateOptionUI(
  durationOptions,
  initialDuration
);


// -------------------------
// 다음
// -------------------------

nextButton.addEventListener(
  "click",
  function () {

    if (
      selectedLatitude === null ||
      selectedLongitude === null ||
      !selectedAddress
    ) {

      alert(
        "지도에서 원하는 위치를 선택해주세요."
      );

      return;

    }


    const reservationDraft = {

      address:
        selectedAddress,

      latitude:
        selectedLatitude,

      longitude:
        selectedLongitude,

      radius:
        selectedRadius,

      duration:
        selectedDuration

    };


    sessionStorage.setItem(
      "reservationDraft",
      JSON.stringify(
        reservationDraft
      )
    );


    console.log(
      "예약 임시 정보:",
      reservationDraft
    );


    window.location.href =
      "page2.html";

  }
);