/**
 * Authentication scripts
 * Handles login and registration
 */

document.addEventListener('DOMContentLoaded', () => {
  // Setup mobile menu toggle
  const menuBtn = document.getElementById('mobileMenuBtn');
  const navMenu = document.getElementById('navMenu');
  
  if (menuBtn && navMenu) {
    menuBtn.addEventListener('click', () => {
      navMenu.classList.toggle('active');
    });
  }

  // Initialize login form if exists
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    setupLoginForm();
    
    // Check for registration success message
    const params = new URLSearchParams(window.location.search);
    if (params.get('registered') === 'true') {
      showAlert('Registro exitoso. Ahora inicia sesión.', 'success');
    }
  }

  // Initialize register form if exists
  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    setupRegisterForm();
  }

  // Set active navigation item
  setActiveNavItem();
});

/**
 * Setup login form
 */
function setupLoginForm() {
  const loginForm = document.getElementById('loginForm');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const loginBtn = document.getElementById('loginBtn');

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Validate form
    if (!validateLoginForm()) return;

    // Disable button and show loading
    loginBtn.disabled = true;
    loginBtn.innerHTML = '<span class="spinner"></span> Procesando...';

    try {
      const response = await apiPost('/auth/login/', {
        email: emailInput.value.trim(),
        password: passwordInput.value
      });

      if (response.ok) {
        // Redirect to profile page
        window.location.href = 'profile.html';
      } else {
        const error = await response.json();
        showAlert(error.error || 'Credenciales inválidas. Inténtalo de nuevo.', 'error');
        
        // Focus password field
        passwordInput.focus();
      }
    } catch (error) {
      console.error('Error:', error);
      showAlert('Error al iniciar sesión. Inténtalo de nuevo.', 'error');
    } finally {
      // Re-enable button
      loginBtn.disabled = false;
      loginBtn.textContent = 'Entrar';
    }
  });
}

/**
 * Validate login form
 * @returns {boolean} - Whether form is valid
 */
function validateLoginForm() {
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const emailError = document.getElementById('emailError');
  const passwordError = document.getElementById('passwordError');
  
  let isValid = true;

  // Reset errors
  emailError.textContent = '';
  passwordError.textContent = '';
  emailInput.classList.remove('is-invalid');
  passwordInput.classList.remove('is-invalid');

  // Validate email
  if (!emailInput.value.trim()) {
    emailError.textContent = 'El correo electrónico es obligatorio';
    emailInput.classList.add('is-invalid');
    isValid = false;
  } else if (!isValidEmail(emailInput.value.trim())) {
    emailError.textContent = 'Introduce un correo electrónico válido';
    emailInput.classList.add('is-invalid');
    isValid = false;
  }

  // Validate password
  if (!passwordInput.value) {
    passwordError.textContent = 'La contraseña es obligatoria';
    passwordInput.classList.add('is-invalid');
    isValid = false;
  }

  return isValid;
}

/**
 * Setup register form
 */
function setupRegisterForm() {
  const registerForm = document.getElementById('registerForm');
  const emailInput = document.getElementById('emailReg');
  const passwordInput = document.getElementById('passwordReg');
  const confirmPasswordInput = document.getElementById('confirmPassword');
  const nombreInput = document.getElementById('nombreReg');
  const apellidosInput = document.getElementById('apellidosReg');
  const registerBtn = document.getElementById('registerBtn');

  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Validate form
    if (!validateRegisterForm()) return;

    // Disable button and show loading
    registerBtn.disabled = true;
    registerBtn.innerHTML = '<span class="spinner"></span> Procesando...';

    try {
      const response = await apiPost('/auth/register/', {
        email: emailInput.value.trim(),
        password: passwordInput.value,
        nombre: nombreInput.value.trim(),
        apellidos: apellidosInput.value.trim()
      });

      if (response.ok) {
        // Redirect to login page with success message
        window.location.href = 'login.html?registered=true';
      } else {
        const error = await response.json();
        
        if (response.status === 409) {
          showAlert('Correo ya registrado. Usa otro.', 'error');
          emailInput.classList.add('is-invalid');
          emailInput.focus();
        } else {
          showAlert(error.error || 'Error al registrarse.', 'error');
        }
      }
    } catch (error) {
      console.error('Error:', error);
      showAlert('Error al registrarse. Inténtalo de nuevo.', 'error');
    } finally {
      // Re-enable button
      registerBtn.disabled = false;
      registerBtn.textContent = 'Registrarse';
    }
  });
}

/**
 * Validate registration form
 * @returns {boolean} - Whether form is valid
 */
function validateRegisterForm() {
  const emailInput = document.getElementById('emailReg');
  const passwordInput = document.getElementById('passwordReg');
  const confirmPasswordInput = document.getElementById('confirmPassword');
  const emailError = document.getElementById('emailRegError');
  const passwordError = document.getElementById('passwordRegError');
  const confirmPasswordError = document.getElementById('confirmPasswordError');
  
  let isValid = true;

  // Reset errors
  emailError.textContent = '';
  passwordError.textContent = '';
  confirmPasswordError.textContent = '';
  emailInput.classList.remove('is-invalid');
  passwordInput.classList.remove('is-invalid');
  confirmPasswordInput.classList.remove('is-invalid');

  // Validate email
  if (!emailInput.value.trim()) {
    emailError.textContent = 'El correo electrónico es obligatorio';
    emailInput.classList.add('is-invalid');
    isValid = false;
  } else if (!isValidEmail(emailInput.value.trim())) {
    emailError.textContent = 'Introduce un correo electrónico válido';
    emailInput.classList.add('is-invalid');
    isValid = false;
  }

  // Validate password
  if (!passwordInput.value) {
    passwordError.textContent = 'La contraseña es obligatoria';
    passwordInput.classList.add('is-invalid');
    isValid = false;
  } else if (passwordInput.value.length < 8) {
    passwordError.textContent = 'La contraseña debe tener al menos 8 caracteres';
    passwordInput.classList.add('is-invalid');
    isValid = false;
  }

  // Validate confirm password
  if (!confirmPasswordInput.value) {
    confirmPasswordError.textContent = 'Confirma tu contraseña';
    confirmPasswordInput.classList.add('is-invalid');
    isValid = false;
  } else if (confirmPasswordInput.value !== passwordInput.value) {
    confirmPasswordError.textContent = 'Las contraseñas no coinciden';
    confirmPasswordInput.classList.add('is-invalid');
    isValid = false;
  }

  return isValid;
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} - Whether email is valid
 */
function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

/**
 * Set active navigation item based on current page
 */
function setActiveNavItem() {
  const currentPage = window.location.pathname.split('/').pop();
  const navLinks = document.querySelectorAll('nav a');
  
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if ((currentPage === 'login.html' && href === 'login.html') || 
        (currentPage === 'register.html' && href === 'register.html')) {
      link.classList.add('active');
    }
  });
}