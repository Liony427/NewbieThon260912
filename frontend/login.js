const API_BASE_URL = "http://127.0.0.1:8000";


const emailInput = document.getElementById("emailInput");
const passwordInput = document.getElementById("passwordInput");

const loginButton = document.getElementById("loginButton");
const loginButtonText = document.getElementById("loginButtonText");

const signupButton = document.getElementById("signupButton");
const findPasswordButton = document.getElementById("findPasswordButton");


async function login() {

  const email = emailInput.value.trim();
  const password = passwordInput.value;


  // 이메일 입력 확인
  if (!email) {
    alert("이메일을 입력해주세요.");
    emailInput.focus();
    return;
  }


  // 비밀번호 입력 확인
  if (!password) {
    alert("비밀번호를 입력해주세요.");
    passwordInput.focus();
    return;
  }


  // 중복 클릭 방지
  loginButton.disabled = true;


  try {

    const response = await fetch(
      `${API_BASE_URL}/auth/login`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          email: email,
          password: password,
        }),
      }
    );


    // 로그인 실패
    if (!response.ok) {

      if (response.status === 401) {
        alert("이메일 또는 비밀번호가 올바르지 않습니다.");
      }

      else if (response.status === 422) {
        alert("입력한 이메일 형식을 확인해주세요.");
      }

      else {
        alert(
          `로그인에 실패했습니다. (${response.status})`
        );
      }

      return;
    }


    // 백엔드 응답
    const data = await response.json();

    // 실제 사용자 정보
    const user = data.user;


    console.log(
      "로그인 성공:",
      user
    );


    // 로그인한 사용자 정보 저장
    localStorage.setItem(
      "userId",
      String(user.id)
    );

    localStorage.setItem(
      "userName",
      user.name
    );

    localStorage.setItem(
      "userEmail",
      user.email
    );


    alert(
      `${user.name}님, 로그인되었습니다!`
    );


    // 로그인 후 메인 페이지 이동
    window.location.href = "main.html";

  }

  catch (error) {

    console.error(
      "로그인 요청 오류:",
      error
    );

    alert(
      "서버에 연결할 수 없습니다.\n" +
      "백엔드 서버가 실행 중인지 확인해주세요."
    );

  }

  finally {

    loginButton.disabled = false;

  }

}


// 실제 로그인 버튼
loginButton.addEventListener(
  "click",
  login
);


// 화면에 보이는 로그인 글자
loginButtonText.addEventListener(
  "click",
  login
);


// 비밀번호 입력 후 Enter
passwordInput.addEventListener(
  "keydown",
  function (event) {

    if (event.key === "Enter") {
      login();
    }

  }
);


// 이메일 입력 후 Enter
emailInput.addEventListener(
  "keydown",
  function (event) {

    if (event.key === "Enter") {
      passwordInput.focus();
    }

  }
);


// 회원가입
signupButton.addEventListener(
  "click",
  function () {

    /*
      회원가입 페이지가 정해지면
      여기에 페이지 경로를 연결한다.

      예:
      window.location.href = "signup.html";
    */

    alert(
      "회원가입 페이지 연결이 필요합니다."
    );

  }
);


// 비밀번호 찾기
findPasswordButton.addEventListener(
  "click",
  function () {

    alert(
      "비밀번호 찾기는 현재 준비 중입니다."
    );

  }
);