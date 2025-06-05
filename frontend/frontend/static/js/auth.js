/**
 * Authentication functionality for login and register pages
 */

// Login page elements
const loginForm = document.getElementById('loginForm');
const loginBtn = document.getElementById('loginBtn');
const loginBtnText = document.getElementById('loginBtnText');
const loginSpinner = document.getElementById('loginSpinner');
const loginError = document.getElementById('loginError');
const registrationSuccess = document.getElementById('registrationSuccess');

// Register page elements
const registerForm = document.getElementById('registerForm');
const emailReg = document.getElementById('emailReg');
const passwordReg = document.getElementById('passwordReg');
const confirmPassword = document.getElementById('confirmPassword');
const emailError = document.getElementById('emailError');
const passwordError = document.getElementById('passwordError');
const confirmError = document.getElementById('confirmError');
const registerError = document.getElementById('registerError');
const registerBtn = document.getElementById('registerBtn');
const registerBtnText = document.getElementById('registerBtnText');
const registerSpinner = document.getElementById('registerSpinner');

/**
 * Initialize auth functionality
 */
document.addEventListener('DOMContentLoaded', () => {
  // Check if we're on login page with a registration success parameter
  checkRegistrationSuccess();
  
  // Setup login form
  setupLoginForm();
  
  // Setup register form
  setupRegisterForm();
  
  // Check if we're on a protected page
  checkRedirectAfterLogin();
});

/**
 * Check if we need to show registration success message
 */
function checkRegistrationSuccess() {
  if (!registrationSuccess) return;
  
  const params = getQueryParams();
  
  if (params.registered === 'true') {
    registrationSuccess.classList.remove('hidden');
  }
}

/**
 * Setup login form submission
 */
function setupLoginForm() {
  if (!loginForm) return;
  
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Get form values
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    
    // Validate inputs
    if (!email || !password) {
      if (loginError) {
        loginError.textContent = 'Por favor, completa todos los campos';
        loginError.classList.remove('hidden');
      }
      return;
    }
    
    // Hide previous errors
    if (loginError) {
      loginError.classList.add('hidden');
    }
    
    // Disable form while submitting
    if (loginBtn) loginBtn.disabled = true;
    if (loginBtnText) loginBtnText.textContent = 'Iniciando sesión...';
    if (loginSpinner) loginSpinner.classList.remove('hidden');
    
    try {
      // Send login request
      const response = await apiPost('/auth/login', { email, password });
      
      if (response.ok) {
        // Successful login
        const redirectTo = getRedirectUrl() || 'profile.html';
        window.location.href = redirectTo;
      } else {
        // Failed login
        if (loginError) {
          loginError.textContent = 'Credenciales inválidas. Inténtalo de nuevo.';
          loginError.classList.remove('hidden');
        }
        
        // Re-enable form
        if (loginBtn) loginBtn.disabled = false;
        if (loginBtnText) loginBtnText.textContent = 'Entrar';
        if (loginSpinner) loginSpinner.classList.add('hidden');
      }
    } catch (error) {
      console.error('Login error:', error);
      
      // Show error message
      if (loginError) {
        loginError.textContent = 'Error al iniciar sesión. Inténtalo de nuevo.';
        loginError.classList.remove('hidden');
      }
      
      // Re-enable form
      if (loginBtn) loginBtn.disabled = false;
      if (loginBtnText) loginBtnText.textContent = 'Entrar';
      if (loginSpinner) loginSpinner.classList.add('hidden');
    }
  });
}

/**
 * Setup register form submission with validation
 */
function setupRegisterForm() {
  if (!registerForm) return;
  
  // Add input validation
  if (emailReg) {
    emailReg.addEventListener('blur', validateEmail);
  }
  
  if (passwordReg) {
    passwordReg.addEventListener('blur', validatePassword);
  }
  
  if (confirmPassword) {
    confirmPassword.addEventListener('blur', validateConfirmPassword);
  }
  
  // Form submission
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Validate all fields
    const isEmailValid = validateEmail();
    const isPasswordValid = validatePassword();
    const isConfirmValid = validateConfirmPassword();
    
    if (!isEmailValid || !isPasswordValid || !isConfirmValid) {
      return;
    }
    
    // Get form values
    const email = emailReg.value.trim();
    const password = passwordReg.value;
    const nombre = document.getElementById('nombreReg')?.value.trim() || '';
    const apellidos = document.getElementById('apellidosReg')?.value.trim() || '';
    
    // Hide previous errors
    if (registerError) {
      registerError.classList.add('hidden');
    }
    
    // Disable form while submitting
    if (registerBtn) registerBtn.disabled = true;
    if (registerBtnText) registerBtnText.textContent = 'Registrando...';
    if (registerSpinner) registerSpinner.classList.remove('hidden');
    
    try {
      // Send registration request
      const response = await apiPost('/auth/register', { 
        email, 
        password,
        nombre,
        apellidos
      });
      
      if (response.status === 201) {
        // Successful registration
        window.location.href = 'login.html?registered=true';
      } else if (response.status === 409) {
        // Email already exists
        if (registerError) {
          registerError.textContent = 'Correo ya registrado. Usa otro.';
          registerError.classList.remove('hidden');
        }
        
        // Re-enable form
        if (registerBtn) registerBtn.disabled = false;
        if (registerBtnText) registerBtnText.textContent = 'Registrarse';
        if (registerSpinner) registerSpinner.classList.add('hidden');
      } else {
        // Other error
        if (registerError) {
          registerError.textContent = 'Error al registrarse. Inténtalo de nuevo.';
          registerError.classList.remove('hidden');
        }
        
        // Re-enable form
        if (registerBtn) registerBtn.disabled = false;
        if (registerBtnText) registerBtnText.textContent = 'Registrarse';
        if (registerSpinner) registerSpinner.classList.add('hidden');
      }
    } catch (error) {
      console.error('Registration error:', error);
      
      // Show error message
      if (registerError) {
        registerError.textContent = 'Error al registrarse. Inténtalo de nuevo.';
        registerError.classList.remove('hidden');
      }
      
      // Re-enable form
      if (registerBtn) registerBtn.disabled = false;
      if (registerBtnText) registerBtnText.textContent = 'Registrarse';
      if (registerSpinner) registerSpinner.classList.add('hidden');
    }
  });
}

/**
 * Validate email input
 * @returns {boolean} - True if valid
 */
function validateEmail() {
  if (!emailReg || !emailError) return true;
  
  const email = emailReg.value.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!email) {
    emailError.textContent = 'El correo electrónico es obligatorio';
    emailError.classList.remove('hidden');
    emailReg.classList.add('error');
    return false;
  }
  
  if (!emailRegex.test(email)) {
    emailError.textContent = 'Introduce un correo electrónico válido';
    emailError.classList.remove('hidden');
    emailReg.classList.add('error');
    return false;
  }
  
  emailError.classList.add('hidden');
  emailReg.classList.remove('error');
  return true;
}

/**
 * Validate password input
 * @returns {boolean} - True if valid
 */
function validatePassword() {
  if (!passwordReg || !passwordError) return true;
  
  const password = passwordReg.value;
  
  if (!password) {
    passwordError.textContent = 'La contraseña es obligatoria';
    passwordError.classList.remove('hidden');
    passwordReg.classList.add('error');
    return false;
  }
  
  if (password.length < 8) {
    passwordError.textContent = 'La contraseña debe tener al menos 8 caracteres';
    passwordError.classList.remove('hidden');
    passwordReg.classList.add('error');
    return false;
  }
  
  passwordError.classList.add('hidden');
  passwordReg.classList.remove('error');
  return true;
}

/**
 * Validate confirm password input
 * @returns {boolean} - True if valid
 */
function validateConfirmPassword() {
  if (!confirmPassword || !confirmError || !passwordReg) return true;
  
  const password = passwordReg.value;
  const confirm = confirmPassword.value;
  
  if (!confirm) {
    confirmError.textContent = 'Debes confirmar la contraseña';
    confirmError.classList.remove('hidden');
    confirmPassword.classList.add('error');
    return false;
  }
  
  if (password !== confirm) {
    confirmError.textContent = 'Las contraseñas no coinciden';
    confirmError.classList.remove('hidden');
    confirmPassword.classList.add('error');
    return false;
  }
  
  confirmError.classList.add('hidden');
  confirmPassword.classList.remove('error');
  return true;
}

/**
 * Get redirect URL from query parameters
 * @returns {string|null} - Redirect URL or null
 */
function getRedirectUrl() {
  const params = getQueryParams();
  return params.next || null;
}

/**
 * Check if we should redirect after login
 */
function checkRedirectAfterLogin() {
  const redirectUrl = getRedirectUrl();
  
  if (redirectUrl) {
    // Update the login form to show the redirect destination
    const loginHeading = document.querySelector('.auth-form-container h1');
    
    if (loginHeading) {
      loginHeading.textContent = 'Iniciar Sesión para continuar';
    }
  }
}