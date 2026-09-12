const reservationButton =
  document.getElementById("reservationButton");

const returnButton =
  document.getElementById("returnButton");


const userId =
  localStorage.getItem("userId");

const userName =
  localStorage.getItem("userName");


// 로그인 정보가 없으면 로그인 화면으로 이동
if (!userId) {

  alert("로그인이 필요합니다.");

  window.location.href = "index.html";

}


// 예약하기
reservationButton.addEventListener(
  "click",
  function () {

    window.location.href = "page1.html";

  }
);


// 반납하기
returnButton.addEventListener(
  "click",
  function () {

    window.location.href = "page2.html";

  }
);


console.log(
  "현재 로그인 사용자:",
  {
    userId,
    userName
  }
);