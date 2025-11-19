// Authentication redirect
// Check if user is logged in, redirect to login if not
(function() {
  // Don't redirect if we're already on the login page
  if (window.location.pathname.includes('login.html')) {
    return;
  }

  // Check if user is logged in
  if (sessionStorage.getItem('isLoggedIn') !== 'true') {
    window.location.href = '/login.html';
  }
})();
