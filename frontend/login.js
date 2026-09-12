const API_BASE_URL = "http://127.0.0.1:8000";

const emailInput = document.getElementById("emailInput");
const passwordInput = document.getElementById("passwordInput");
const loginButton = document.getElementById("loginButton");

async function login() {
  const email = emailInput.value.trim();
  const password = passwordInput.value;

  // 입력값 확인
  if (!email) {
    alert("이메일을 입력해주세요.");
    emailInput.focus();
    return;
  }

  if (!password) {
    alert("비밀번호를 입력해주세요.");
    passwordInput.focus();
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        email: email,
        password: password,
      }),
    });

    // 로그인 실패
    if (!response.ok) {
      if (response.status === 401) {
        alert("이메일 또는 비밀번호가 올바르지 않습니다.");
      } else {
        alert(`로그인에 실패했습니다. (${response.status})`);
      }

      return;
    }

    // 로그인 성공
    const user = await response.json();

    console.log("로그인 성공:", user);

    // 로그인한 사용자 정보 저장
    localStorage.setItem("userId", user.id);
    localStorage.setItem("userName", user.name);
    localStorage.setItem("userEmail", user.email);

    alert(`${user.name}님, 로그인되었습니다!`);

    window.location.href = "main.html"; 

  } catch (error) {
    console.error("로그인 요청 오류:", error);

    alert(
      "서버에 연결할 수 없습니다.\n백엔드 서버가 실행 중인지 확인해주세요."
    );
  }
}

// 로그인 버튼 클릭
loginButton.addEventListener("click", login);

// 비밀번호 입력창에서 Enter
passwordInput.addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    login();
  }
});