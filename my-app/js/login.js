document.getElementById('login-form').addEventListener('submit', function(e) {
  e.preventDefault();
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  // Example: Replace with your actual authentication logic
  if (username === 'admin' && password === '1234') {
    // Set a (fake) JWT in localStorage to indicate authenticated state.
    // Replace with real token-handling after integrating a backend auth service.
    try { localStorage.setItem('jwt', 'demo-token'); } catch (e) { /* ignore */ }
    // Redirect back to original page if present, otherwise to root
    const dest = localStorage.getItem('postLoginRedirect') || '/';
    try { localStorage.removeItem('postLoginRedirect'); } catch (e) { }
    window.location.href = dest;
  } else {
    document.getElementById('login-error').textContent = 'Invalid username or password.';
    document.getElementById('login-error').style.display = 'block';
  }
});
