// Login functionality
document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  const loginError = document.getElementById('login-error');

  // Check if already logged in, redirect to home
  if (sessionStorage.getItem('isLoggedIn') === 'true') {
    window.location.href = '/';
  }

  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    // Validate credentials
    if (username === 'admin' && password === 'Abc123@#!') {
      // Set session
      sessionStorage.setItem('isLoggedIn', 'true');
      sessionStorage.setItem('username', username);
      
      // Redirect to home page
      window.location.href = '/';
    } else {
      // Show error
      loginError.textContent = 'Tên đăng nhập hoặc mật khẩu không đúng';
      loginError.style.display = 'block';
      
      // Clear password field
      document.getElementById('password').value = '';
    }
  });
});
