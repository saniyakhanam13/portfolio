document.addEventListener('DOMContentLoaded', () => {
  initMobileNav();
  initContactForm();
});

/**
 * Mobile Navigation Drawer Accessibility
 */
function initMobileNav() {
  const toggleBtn = document.querySelector('.nav-toggle');
  const navMenu = document.querySelector('.nav-menu');

  if (!toggleBtn || !navMenu) return;

  // Toggle nav drawer on click
  toggleBtn.addEventListener('click', () => {
    const isExpanded = toggleBtn.getAttribute('aria-expanded') === 'true';
    toggleMenu(!isExpanded);
  });

  // Close nav on clicking outside of it
  document.addEventListener('click', (e) => {
    if (navMenu.classList.contains('active') && !navMenu.contains(e.target) && !toggleBtn.contains(e.target)) {
      toggleMenu(false);
    }
  });

  // Handle keyboard events (Escape key to close, Tab to trap focus)
  document.addEventListener('keydown', (e) => {
    if (!navMenu.classList.contains('active')) return;

    // Close on Escape
    if (e.key === 'Escape') {
      toggleMenu(false);
      toggleBtn.focus();
      return;
    }

    // Trap focus inside menu when viewport is mobile size
    if (e.key === 'Tab' && window.innerWidth <= 768) {
      const focusableEls = navMenu.querySelectorAll('a[href], button');
      const firstFocusable = focusableEls[0];
      const lastFocusable = focusableEls[focusableEls.length - 1];

      if (e.shiftKey) { // Shift + Tab
        if (document.activeElement === firstFocusable) {
          lastFocusable.focus();
          e.preventDefault();
        }
      } else { // Tab
        if (document.activeElement === lastFocusable) {
          firstFocusable.focus();
          e.preventDefault();
        }
      }
    }
  });

  function toggleMenu(open) {
    if (open) {
      navMenu.classList.add('active');
      toggleBtn.setAttribute('aria-expanded', 'true');
      // Set focus to the first link inside menu after drawer transition
      setTimeout(() => {
        const firstLink = navMenu.querySelector('.nav-link');
        if (firstLink) firstLink.focus();
      }, 100);
    } else {
      navMenu.classList.remove('active');
      toggleBtn.setAttribute('aria-expanded', 'false');
    }
  }
}

/**
 * Accessible Contact Form Validation and Submission
 */
function initContactForm() {
  const form = document.querySelector('.contact-form');
  const statusBanner = document.getElementById('form-status');

  if (!form) return;

  const inputs = form.querySelectorAll('.form-input, .form-textarea');

  // Input events for real-time validation on blur and input
  inputs.forEach(input => {
    input.addEventListener('blur', () => validateField(input));
    input.addEventListener('input', () => {
      // If field was invalid, re-validate on input to clear errors faster
      if (input.getAttribute('aria-invalid') === 'true') {
        validateField(input);
      }
    });
  });

  // Handle form submission
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let isFormValid = true;
    let firstInvalidInput = null;

    // Validate all fields
    inputs.forEach(input => {
      const isValid = validateField(input);
      if (!isValid) {
        isFormValid = false;
        if (!firstInvalidInput) {
          firstInvalidInput = input;
        }
      }
    });

    if (!isFormValid) {
      // Focus on the first invalid field for screen reader and keyboard accessibility
      if (firstInvalidInput) {
        firstInvalidInput.focus();
      }
      showStatusBanner('Please correct the highlighted errors before submitting.', 'error');
    } else {
      // Form is valid - mock submission success
      submitMockForm(form);
    }
  });

  function validateField(input) {
    const errorEl = document.getElementById(`${input.id}-error`);
    let isValid = true;
    let errorMessage = '';

    // Required check
    if (input.hasAttribute('required') && !input.value.trim()) {
      isValid = false;
      errorMessage = `${getLabelText(input)} is required.`;
    } 
    // Email check
    else if (input.type === 'email' && input.value.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(input.value.trim())) {
        isValid = false;
        errorMessage = 'Please enter a valid email address.';
      }
    }

    // Update ARIA attributes and error UI
    if (!isValid) {
      input.setAttribute('aria-invalid', 'true');
      if (errorEl) {
        errorEl.textContent = errorMessage;
        errorEl.setAttribute('aria-hidden', 'false');
      }
    } else {
      input.setAttribute('aria-invalid', 'false');
      if (errorEl) {
        errorEl.textContent = '';
        errorEl.setAttribute('aria-hidden', 'true');
      }
    }

    return isValid;
  }

  function getLabelText(input) {
    const label = document.querySelector(`label[for="${input.id}"]`);
    return label ? label.textContent.replace('*', '').trim() : 'This field';
  }

  function showStatusBanner(message, type) {
    if (!statusBanner) return;

    statusBanner.textContent = message;
    statusBanner.className = `form-status ${type}`;
    statusBanner.removeAttribute('hidden');
    
    // Smooth scroll status banner into view if offscreen
    statusBanner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function submitMockForm(formElement) {
    const submitBtn = formElement.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.textContent;
    
    // Disable button to prevent double submits and set loading state
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending Message...';
    submitBtn.setAttribute('aria-busy', 'true');

    // Simulate server request delay
    setTimeout(() => {
      submitBtn.disabled = false;
      submitBtn.textContent = originalBtnText;
      submitBtn.removeAttribute('aria-busy');

      // Clear all fields
      formElement.reset();
      inputs.forEach(input => {
        input.setAttribute('aria-invalid', 'false');
        const errorEl = document.getElementById(`${input.id}-error`);
        if (errorEl) {
          errorEl.textContent = '';
          errorEl.setAttribute('aria-hidden', 'true');
        }
      });

      // Display success message announced by aria-live
      showStatusBanner('Thank you! Your message has been successfully sent. I will get back to you shortly.', 'success');
    }, 1500);
  }
}
