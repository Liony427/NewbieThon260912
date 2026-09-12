"use strict";

(() => {
  // 화면 확인용 예시 데이터입니다.
  // 실제 연동 시 백엔드 응답으로 교체합니다.
  //
  // 이동 거리(distance)와 반납 허용 반경(radius)은
  // 서로 다른 값이므로 별도 필드로 관리합니다.
  const recommendations = [
    {
      id: 0,
      name: "안암역 방향",
      reward: "+173원",
      distance: "420m",
      radius: "300m",
      time: "2분"
    },
    {
      id: 1,
      name: "고려대역 방향",
      reward: "+378원",
      distance: "650m",
      radius: "300m",
      time: "3분"
    },
    {
      id: 2,
      name: "월곡역 방향",
      reward: "+594원",
      distance: "1.5km",
      radius: "300m",
      time: "10분"
    }
  ];

  const page = document.body.dataset.page;

  const params = new URLSearchParams(
    window.location.search
  );

  const rawChoice = params.get("choice");

  const choice = /^[0-2]$/.test(rawChoice || "")
    ? Number(rawChoice)
    : null;

  // 3페이지: 취소 후 돌아왔을 때 기존 선택을 복원합니다.
  if (page === "recommend") {
    const form = document.getElementById(
      "recommendation-form"
    );

    if (choice !== null) {
      const selectedInput = form.querySelector(
        `input[name="choice"][value="${choice}"]`
      );

      if (selectedInput) {
        selectedInput.checked = true;
      }
    }

    // 추천 보기 버튼은 HTML form의 action으로
    // return_confirm.html?choice=선택번호 에 이동합니다.
  }

  // 4페이지: 선택한 추천 정보 표시 및 버튼 연결
  if (page === "confirm") {
    const confirmButton = document.getElementById(
      "confirm-button"
    );

    const cancelLink = document.getElementById(
      "cancel-link"
    );

    const errorMessage = document.getElementById(
      "selection-error"
    );

    if (choice === null) {
      errorMessage.hidden = false;
      confirmButton.disabled = true;
      return;
    }

    const selectedRecommendation = recommendations[choice];

    document.querySelectorAll("[data-value]").forEach(
      (element) => {
        const field = element.dataset.value;

        element.textContent =
          selectedRecommendation[field] ?? "—";
      }
    );

    // 취소 → 3페이지로 이동하며 선택값 유지
    cancelLink.href =
      `return_recommend.html?choice=${choice}`;

    confirmButton.disabled = false;

    // 확인 → 5페이지
    // 현재는 화면 이동만 합니다.
    // 실제 연동 시 반납 요청 API 성공 후 이동해야 합니다.
    confirmButton.addEventListener("click", () => {
      window.location.href =
        `return_route.html?choice=${choice}`;
    });
  }

  // 5페이지: 6페이지를 확인하기 위한 미리보기 링크
  if (page === "route") {
    const previewLink = document.getElementById(
      "complete-preview-link"
    );

    if (choice !== null) {
      previewLink.href =
        `return_complete.html?choice=${choice}`;
    }
  }
})();