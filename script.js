// Element References
const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const togglePasswordBtn = document.getElementById('togglePassword');
const alertBox = document.getElementById('alertBox');
const submitBtn = document.getElementById('submitBtn');

// 1. Toggle Password Visibility
togglePasswordBtn.addEventListener('click', () => {
  const isPassword = passwordInput.getAttribute('type') === 'password';
  passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
  togglePasswordBtn.textContent = isPassword ? 'Hide' : 'Show';
});

// 2. Helper to display alerts
function showAlert(message, type = 'error') {
  alertBox.textContent = message;
  alertBox.className = `alert ${type}`;
  alertBox.style.display = 'block';
}

function clearAlert() {
  alertBox.textContent = '';
  alertBox.className = 'alert';
  alertBox.style.display = 'none';
}

// 3. Form Submission & Validation
loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  clearAlert();

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  // Basic Validation
  if (!email) {
    showAlert('Please enter your email or username.');
    emailInput.focus();
    return;
  }

  if (!password) {
    showAlert('Please enter your password.');
    passwordInput.focus();
    return;
  }

  if (password.length < 6) {
    showAlert('Password must be at least 6 characters long.');
    passwordInput.focus();
    return;
  }

  // Simulate login request / loading state
  submitBtn.disabled = true;
  submitBtn.textContent = 'Signing in...';

  setTimeout(() => {
    // Demo credential check
    if (email === 'admin@example.com' && password === 'password123') {
      showAlert('Login successful! Redirecting...', 'success');
      setTimeout(() => {
        alert('Welcome back, Admin!');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Sign In';
      }, 1000);
    } else {
      showAlert('Invalid email or password. Use demo credentials below.');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Sign In';
    }
  }, 800);
});
