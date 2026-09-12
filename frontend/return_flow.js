"use strict";

// 화면 확인용 임시 데이터입니다.
// 실제 위치 확인, 자전거 잠금, 할인 API는 호출하지 않습니다.
const choices = [
  {
    reward: "+173원",
    distance: "420m",
    time: "2분"
  },
  {
    reward: "+378원",
    distance: "650m",
    time: "3분"
  },
  {
    reward: "+594원",
    distance: "1.5km",
    time: "10분"
  }
];

// URL에서 선택한 추천 번호를 읽습니다.
// 예: return_confirm.html?choice=0
const rawChoice = new URLSearchParams(location.search).get("choice");

// 0, 1, 2만 유효한 선택으로 처리합니다.
const choice = /^[0-2]$/.test(rawChoice || "")
  ? Number(rawChoice)
  : null;

if (choice !== null) {
  // 확인 화면에 선택한 추천 정보를 표시합니다.
  document.querySelectorAll("[data-value]").forEach((element) => {
    element.textContent = choices[choice][element.dataset.value];
  });

  // 경로 화면에도 선택한 추천 번호를 전달합니다.
  const link = document.getElementById("confirm-link");

  if (link) {
    link.href = `return_route.html?choice=${choice}`;
  }
}