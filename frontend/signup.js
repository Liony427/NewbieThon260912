const API_BASE_URL = "http://127.0.0.1:8000";
const form = document.getElementById("signupForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const confirmInput = document.getElementById("passwordConfirm");
const button = document.getElementById("signupButton");
const errorMessage = document.getElementById("signupError");

function validateConfirmation() {
  confirmInput.setCustomValidity(
    confirmInput.value && passwordInput.value !== confirmInput.value
      ? "비밀번호가 일치하지 않습니다." : ""
  );
}
passwordInput.addEventListener("input", validateConfirmation);
confirmInput.addEventListener("input", validateConfirmation);

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (button.disabled) return;
  validateConfirmation();
  if (!form.reportValidity()) return;
  errorMessage.hidden = true;
  button.disabled = true;
  button.textContent = "가입 중…";
  try {
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: emailInput.value.trim(), password: passwordInput.value }),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(response.status === 409 ? "이미 가입된 이메일입니다. 로그인해주세요."
        : response.status === 422 ? "이메일 형식과 비밀번호 길이(8~20자)를 확인해주세요."
        : typeof data.detail === "string" ? data.detail : "회원가입에 실패했습니다. 잠시 후 다시 시도해주세요.");
    }
    form.reset();
    form.hidden = true;
    document.getElementById("signupSuccess").hidden = false;
    document.querySelector(".login-button").focus();
  } catch (error) {
    errorMessage.textContent = error instanceof TypeError
      ? "서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요." : error.message;
    errorMessage.hidden = false;
  } finally {
    button.disabled = false;
    button.textContent = "회원가입";
  }
});
