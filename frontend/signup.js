"use strict";


// ==========================================
// 기본 설정
// ==========================================

const API_BASE_URL =
  "http://127.0.0.1:8000";


const form =
  document.getElementById(
    "signupForm"
  );


const nameInput =
  document.getElementById(
    "name"
  );


const emailInput =
  document.getElementById(
    "email"
  );


const passwordInput =
  document.getElementById(
    "password"
  );


const confirmInput =
  document.getElementById(
    "passwordConfirm"
  );


const button =
  document.getElementById(
    "signupButton"
  );


const errorMessage =
  document.getElementById(
    "signupError"
  );


const successMessage =
  document.getElementById(
    "signupSuccess"
  );


// ==========================================
// 비밀번호 확인
// ==========================================

function validateConfirmation() {

  if (
    confirmInput.value
    &&
    passwordInput.value
      !== confirmInput.value
  ) {

    confirmInput.setCustomValidity(
      "비밀번호가 일치하지 않습니다."
    );

  }

  else {

    confirmInput.setCustomValidity(
      ""
    );

  }

}


passwordInput.addEventListener(
  "input",
  validateConfirmation
);


confirmInput.addEventListener(
  "input",
  validateConfirmation
);


// ==========================================
// 회원가입
// ==========================================

form.addEventListener(
  "submit",
  async function (event) {

    event.preventDefault();


    if (
      button.disabled
    ) {
      return;
    }


    validateConfirmation();


    if (
      !form.reportValidity()
    ) {
      return;
    }


    errorMessage.hidden =
      true;


    button.disabled =
      true;


    button.textContent =
      "가입 중…";


    // ======================================
    // 서버로 보낼 회원가입 정보
    // ======================================

    const signupData = {

      name:
        nameInput.value.trim(),

      email:
        emailInput.value.trim(),

      password:
        passwordInput.value

    };


    console.log(
      "회원가입 요청:",
      {
        name:
          signupData.name,

        email:
          signupData.email

        // 비밀번호는 콘솔에 출력하지 않음
      }
    );


    try {

      const response =
        await fetch(
          `${API_BASE_URL}/auth/signup`,
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            body:
              JSON.stringify(
                signupData
              )
          }
        );


      // ====================================
      // 실패 응답
      // ====================================

      if (
        !response.ok
      ) {

        const data =
          await response
            .json()
            .catch(
              () => ({})
            );


        console.error(
          "회원가입 실패:",
          response.status,
          data
        );


        if (
          response.status === 409
        ) {

          throw new Error(
            "이미 가입된 이메일입니다. 로그인해주세요."
          );

        }


        if (
          response.status === 422
        ) {

          console.error(
            "422 상세 내용:",
            data.detail
          );


          throw new Error(
            "입력한 회원정보를 다시 확인해주세요."
          );

        }


        if (
          typeof data.detail
          === "string"
        ) {

          throw new Error(
            data.detail
          );

        }


        throw new Error(
          "회원가입에 실패했습니다. 잠시 후 다시 시도해주세요."
        );

      }


      // ====================================
      // 성공
      // ====================================

      const data =
        await response.json();


      console.log(
        "회원가입 성공:",
        data
      );


      form.reset();


      form.hidden =
        true;


      successMessage.hidden =
        false;


      const loginButton =
        document.querySelector(
          ".login-button"
        );


      if (
        loginButton
      ) {

        loginButton.focus();

      }

    }


    // ======================================
    // 오류
    // ======================================

    catch (error) {

      console.error(
        "회원가입 오류:",
        error
      );


      if (
        error instanceof TypeError
      ) {

        errorMessage.textContent =
          "서버에 연결할 수 없습니다. 백엔드 서버가 실행 중인지 확인해주세요.";

      }

      else {

        errorMessage.textContent =
          error.message;

      }


      errorMessage.hidden =
        false;

    }


    finally {

      button.disabled =
        false;


      button.textContent =
        "회원가입";

    }

  }
);