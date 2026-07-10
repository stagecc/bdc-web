/**
 * getRecaptchaToken
 *
 * Wraps the reCAPTCHA v3 grecaptcha.execute() call in a clean async function
 * so DynamicForm's onSubmit handler doesn't need to deal with the
 * grecaptcha.ready() callback pattern directly.
 *
 * reCAPTCHA v3 flow:
 *   1. The reCAPTCHA script is loaded in Base.astro when enableRecaptcha={true}
 *   2. The script attaches grecaptcha to window
 *   3. grecaptcha.ready() ensures the script has fully initialized before executing
 *   4. grecaptcha.execute() returns a token string
 *   5. The token is included in the form payload as recaptcha_token
 *   6. The Lambda proxy verifies the token with Google before forwarding to Freshdesk
 *
 * The action string identifies the form submission context in Google's reCAPTCHA
 * dashboard — useful for distinguishing between different forms in analytics.
 * It must match [a-zA-Z/_] with no spaces.
 *
 * Why not use the @types/grecaptcha package?
 *   We declare the minimal grecaptcha interface we need directly in getRecaptchaToken.ts
 *   rather than pulling in a full type package. This keeps dependencies minimal
 *   and avoids version drift with the actual reCAPTCHA API.
 */

/**
 * Gets a reCAPTCHA v3 token for the given site key and action.
 *
 * @param siteKey - The reCAPTCHA site key (PUBLIC_RECAPTCHA_SITE_KEY).
 *   This is the public key — safe to expose in the browser.
 * @param action - Identifies this submission context in reCAPTCHA analytics.
 *   Defaults to 'submit'. Override per form if you want distinct tracking
 *   (e.g. 'cloud_credits_submit', 'join_submit').
 * @returns A reCAPTCHA token string to include in the payload as recaptcha_token.
 * @throws If grecaptcha is not available (script not loaded) or execute fails.
 */

declare global {
  interface Window {
    grecaptcha: {
      execute: (
        siteKey: string,
        options: { action: string },
      ) => Promise<string>;
      ready: (callback: () => void) => void;
    };
  }
}

export function getRecaptchaToken(
  siteKey: string,
  action: string = 'submit',
): Promise<string> {
  return new Promise((resolve, reject) => {
    // grecaptcha.ready defers execution until the reCAPTCHA script has fully
    // loaded and initialized. Calling execute() before ready() can fail silently.
    window.grecaptcha.ready(async () => {
      try {
        const token = await window.grecaptcha.execute(siteKey, { action });
        resolve(token);
      } catch (err) {
        reject(err);
      }
    });
  });
}
