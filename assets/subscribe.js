/**
 * Mission-Driven Momentum - Subscription Forms
 * Handles inline forms AND floating widget
 */

(function() {
  'use strict';

  // Zoho Configuration
  const ZOHO = {
    action: 'https://anrcr-zgpvh.maillist-manage.net/weboptin.zc',
    zx: '135bffd9e',
    zcld: '1156b347af4ac1ecc',
    zctd: '1156b347af4ab4f79',
    formIx: '3z606547c807e73d591ee2257ae111273fb52a630e4f2af059e5578f64657ab320'
  };

  // Float widget settings
  const FLOAT_DELAY = 3000; // Show after 3 seconds
  const DISMISS_DAYS = 7;   // Don't show again for 7 days after dismiss

  document.addEventListener('DOMContentLoaded', function() {
    initSubscribeForms();
    initFloatingWidget();
  });

  // =====================
  // INLINE FORMS
  // =====================
  function initSubscribeForms() {
    document.querySelectorAll('.subscribe-form-container').forEach(container => {
      const trigger = container.querySelector('.subscribe-trigger');
      const cancelBtn = container.querySelector('.subscribe-cancel');
      const form = container.querySelector('.zoho-subscribe-form');
      const initialDiv = container.querySelector('.subscribe-initial');
      const formDiv = container.querySelector('.subscribe-form');
      const messageDiv = container.querySelector('.subscribe-message');

      if (trigger) {
        trigger.addEventListener('click', () => {
          initialDiv.classList.add('hidden');
          formDiv.classList.remove('hidden');
          const firstInput = form.querySelector('input');
          if (firstInput) firstInput.focus();
        });
      }

      if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
          formDiv.classList.add('hidden');
          initialDiv.classList.remove('hidden');
          messageDiv.classList.add('hidden');
          form.classList.remove('hidden');
          form.reset();
        });
      }

      if (form) {
        form.addEventListener('submit', (e) => handleSubmit(e, container));
      }
    });
  }

  // =====================
  // FLOATING WIDGET
  // =====================
  function initFloatingWidget() {
    // Check if dismissed recently
    if (isDismissed()) return;

    // Create the floating widget
    const widget = createFloatWidget();
    document.body.appendChild(widget);

    // Show after delay
    setTimeout(() => {
      widget.classList.add('visible');
    }, FLOAT_DELAY);

    // Set up interactions
    const btn = widget.querySelector('.subscribe-float-btn');
    const panel = widget.querySelector('.subscribe-float-panel');
    const closeBtn = widget.querySelector('.subscribe-float-close');
    const form = widget.querySelector('.zoho-subscribe-form');

    btn.addEventListener('click', () => {
      btn.classList.add('hidden');
      panel.classList.add('active');
      const firstInput = form.querySelector('input');
      if (firstInput) firstInput.focus();
    });

    closeBtn.addEventListener('click', () => {
      panel.classList.remove('active');
      btn.classList.remove('hidden');
    });

    // Dismiss completely on X with shift key or after subscribe
    closeBtn.addEventListener('click', (e) => {
      if (e.shiftKey) {
        dismissWidget(widget);
      }
    });

    form.addEventListener('submit', (e) => {
      handleSubmit(e, widget.querySelector('.subscribe-float-panel'), () => {
        // After successful subscribe, hide widget after a moment
        setTimeout(() => {
          dismissWidget(widget);
          setDismissed();
        }, 3000);
      });
    });
  }

  function createFloatWidget() {
    const widget = document.createElement('div');
    widget.className = 'subscribe-float';
    widget.innerHTML = `
      <button type="button" class="subscribe-float-btn">
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
        </svg>
        <span>Never Miss a Mission-Driven Update</span>
      </button>
      <div class="subscribe-float-panel">
        <div class="subscribe-float-header">
          <h4>Stay in the Loop</h4>
          <button type="button" class="subscribe-float-close">&times;</button>
        </div>
        <p>Weekly insights for mission-driven leaders.</p>
        <form class="zoho-subscribe-form">
          <div class="form-row">
            <input type="text" name="FIRSTNAME" placeholder="First Name">
            <input type="text" name="LASTNAME" placeholder="Last Name">
          </div>
          <input type="email" name="CONTACT_EMAIL" placeholder="Email Address" required>
          <div class="form-buttons">
            <button type="submit" class="button">Subscribe</button>
          </div>
        </form>
        <div class="subscribe-message hidden"></div>
      </div>
    `;
    return widget;
  }

  function dismissWidget(widget) {
    widget.classList.remove('visible');
    setTimeout(() => widget.remove(), 400);
  }

  function isDismissed() {
    const dismissed = localStorage.getItem('mdm_subscribe_dismissed');
    if (!dismissed) return false;
    const dismissedDate = new Date(parseInt(dismissed));
    const now = new Date();
    const daysDiff = (now - dismissedDate) / (1000 * 60 * 60 * 24);
    return daysDiff < DISMISS_DAYS;
  }

  function setDismissed() {
    localStorage.setItem('mdm_subscribe_dismissed', Date.now().toString());
  }

  // =====================
  // FORM SUBMISSION
  // =====================
  function handleSubmit(e, container, onSuccess) {
    e.preventDefault();
    
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const messageDiv = container.querySelector('.subscribe-message');
    
    const formData = new FormData(form);
    const email = formData.get('CONTACT_EMAIL');
    const firstName = formData.get('FIRSTNAME') || '';
    const lastName = formData.get('LASTNAME') || '';

    if (!email || !isValidEmail(email)) {
      showMessage(messageDiv, 'Please enter a valid email address.', 'error');
      return;
    }

    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Joining...';
    submitBtn.disabled = true;

    // Create hidden iframe
    const iframeName = 'zcSignup_' + Date.now();
    const iframe = document.createElement('iframe');
    iframe.name = iframeName;
    iframe.style.display = 'none';
    document.body.appendChild(iframe);

    // Create form with all Zoho required fields
    const hiddenForm = document.createElement('form');
    hiddenForm.method = 'POST';
    hiddenForm.action = ZOHO.action;
    hiddenForm.target = iframeName;
    hiddenForm.style.display = 'none';

    const fields = {
      'CONTACT_EMAIL': email,
      'FIRSTNAME': firstName,
      'LASTNAME': lastName,
      'submitType': 'optinCustomView',
      'emailReportId': '',
      'formType': 'QuickForm',
      'zx': ZOHO.zx,
      'zcvers': '3.0',
      'oldListIds': '',
      'mode': 'OptinCreateView',
      'zcld': ZOHO.zcld,
      'zctd': ZOHO.zctd,
      'zc_trackCode': 'ZCFORMVIEW',
      'zc_formIx': ZOHO.formIx,
      'viewFrom': 'URL_ACTION'
    };

    for (const [key, value] of Object.entries(fields)) {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = value;
      hiddenForm.appendChild(input);
    }

    document.body.appendChild(hiddenForm);
    hiddenForm.submit();

    // Show success
    setTimeout(() => {
      if (iframe.parentNode) iframe.remove();
      if (hiddenForm.parentNode) hiddenForm.remove();
      form.classList.add('hidden');
      showMessage(messageDiv, "You're on the list! Welcome to the community.", 'success');
      form.reset();
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
      
      // Mark as subscribed so widget doesn't show again
      setDismissed();
      
      if (typeof onSuccess === 'function') onSuccess();
    }, 2000);
  }

  function showMessage(messageDiv, text, type) {
    messageDiv.innerHTML = '<p>' + text + '</p>';
    messageDiv.className = 'subscribe-message ' + type;
    messageDiv.classList.remove('hidden');
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

})();