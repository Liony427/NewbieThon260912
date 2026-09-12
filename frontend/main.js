const logoutButton = document.getElementById("logoutButton");

logoutButton.addEventListener("click", () => {
  // 로그인 정보 삭제
  ["userId", "userName", "userEmail"].forEach((key) => {
    localStorage.removeItem(key);
  });

  // 이전 사용자의 예약·반납 임시 정보 삭제
  [
    "currentReservationId",
    "currentReservation",
    "selectedReturnReservation",
    "currentMatch",
    "returnResult",
  ].forEach((key) => {
    sessionStorage.removeItem(key);
  });

  // 로그인 페이지로 이동
  window.location.replace("index.html");
});

// 로그아웃 후 뒤로가기로 메인 화면에 돌아오는 경우 처리
window.addEventListener("pageshow", () => {
  if (!localStorage.getItem("userId")) {
    window.location.replace("index.html");
  }
});