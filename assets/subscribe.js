/**
 * Mission-Driven Momentum - Inline Subscription Form Handler
 * Handles newsletter subscription without page reload
 * 
 * SETUP OPTIONS:
 * 
 * Option 1: Formspree (Recommended - matches your contact form setup)
 * - Create a new form at formspree.io
 * - Update FORMSPREE_ENDPOINT below with your form URL
 * - Optionally connect Formspree to Zoho via Zapier
 * 
 * Option 2: Direct Zoho Campaigns
 * - Set USE_ZOHO to true
 * - Update ZOHO_FORM_URL with your Zoho signup form action URL
 * - Get this from Zoho Campaigns: Contacts → Signup Forms → Get Embed Code
 */

(function() {
  'use strict';

  const USE_ZOHO = true;
  const ZOHO_FORM_URL = 'https://campaigns.zoho.com/api/v1.1/addlistsubscribersjson';
  const ZOHO_LIST_KEY = '3z83479fe57211af2bba42e53828790972631ce42dde6689f2f7fc2ee54310e93a';
  
  document.addEventListener('DOMContentLoaded', initSubscribeForms);

  function initSubscribeForms() {
    const containers = document.querySelectorAll('.subscribe-form-container');
    
    containers.forEach(container => {
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
          resetForm(container);
        });
      }

      if (form) {
        form.addEventListener('submit', (e) => handleSubmit(e, container));
      }
    });
  }

  async function handleSubmit(e, container) {
    e.preventDefault();
    
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const messageDiv = container.querySelector('.subscribe-message');
    
    const formData = new FormData(form);
    const data = {
      firstName: formData.get('FIRSTNAME') || '',
      lastName: formData.get('LASTNAME') || '',
      email: formData.get('CONTACT_EMAIL')
    };

    if (!data.email || !isValidEmail(data.email)) {
      showMessage(messageDiv, 'Please enter a valid email address.', 'error');
      return;
    }

    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Subscribing...';
    submitBtn.disabled = true;

    try {
      if (USE_ZOHO) {
        await submitToZoho(data);
      } else {
        await submitToFormspree(data);
      }
      
      form.classList.add('hidden');
      showMessage(messageDiv, 'Welcome to the community! Check your inbox to confirm your subscription.', 'success');
      form.reset();
      
    } catch (error) {
      console.error('Subscription error:', error);
      showMessage(messageDiv, 'Something went wrong. Please try again or contact us directly.', 'error');
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }
  }

  async function submitToFormspree(data) {
    const response = await fetch(FORMSPREE_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        _subject: 'New Newsletter Subscriber',
        source: 'MDM Website Subscription Form'
      })
    });

    if (!response.ok) {
      throw new Error('Formspree submission failed');
    }
    
    return response.json();
  }

  function submitToZoho(data) {
    return new Promise((resolve, reject) => {
      const iframeName = 'zoho_frame_' + Date.now();
      const iframe = document.createElement('iframe');
      iframe.name = iframeName;
      iframe.style.display = 'none';
      document.body.appendChild(iframe);

      const hiddenForm = document.createElement('form');
      hiddenForm.method = 'POST';
      hiddenForm.target = iframeName;
      hiddenForm.action = ZOHO_FORM_URL;
      
      const fields = {
        'CONTACT_EMAIL': data.email,
        'FIRSTNAME': data.firstName,
        'LASTNAME': data.lastName,
        'listkey': ZOHO_LIST_KEY
      };

      for (const [key, value] of Object.entries(fields)) {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = value;
        hiddenForm.appendChild(input);
      }

      document.body.appendChild(hiddenForm);

      iframe.onload = () => {
        setTimeout(() => {
          document.body.removeChild(iframe);
          document.body.removeChild(hiddenForm);
        }, 100);
        resolve();
      };

      hiddenForm.submit();
      setTimeout(resolve, 3000);
    });
  }

  function resetForm(container) {
    const form = container.querySelector('.zoho-subscribe-form');
    const initialDiv = container.querySelector('.subscribe-initial');
    const formDiv = container.querySelector('.subscribe-form');
    const messageDiv = container.querySelector('.subscribe-message');
    
    formDiv.classList.add('hidden');
    initialDiv.classList.remove('hidden');
    messageDiv.classList.add('hidden');
    if (form) {
      form.classList.remove('hidden');
      form.reset();
    }
  }

  function showMessage(messageDiv, text, type) {
    messageDiv.innerHTML = `<p>${text}</p>`;
    messageDiv.className = `subscribe-message ${type}`;
    messageDiv.classList.remove('hidden');
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

})();