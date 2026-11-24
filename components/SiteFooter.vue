<script setup lang="ts">
import { FACEBOOK_URL, INSTAGRAM_URL, TIKTOK_URL } from '../data/products'

const newsletterEmail = ref('')
const subscribed = ref(false)

function onSubscribe() {
  if (!newsletterEmail.value) return
  subscribed.value = true
  setTimeout(() => {
    newsletterEmail.value = ''
    subscribed.value = false
  }, 4000)
}
</script>

<template>
  <footer class="studio-footer" aria-label="AAROH Studio Footer">
    <div class="studio-footer__wrap">
      <!-- Top Grid: Newsletter + 4 Link Columns -->
      <div class="studio-footer__top">
        <!-- Newsletter Signup -->
        <div class="studio-footer__newsletter">
          <p class="studio-footer__nl-title">
            GET UPDATES AND EXCLUSIVE STUDIO DROPS. JOIN NOW!
          </p>

          <form class="studio-footer__form" @submit.prevent="onSubscribe">
            <input
              v-model="newsletterEmail"
              type="email"
              placeholder="Email address"
              required
              class="studio-footer__input"
              aria-label="Email address for studio drops"
            />
            <button type="submit" class="studio-footer__btn">
              {{ subscribed ? 'JOINED!' : 'SIGN UP' }}
            </button>
          </form>
        </div>

        <!-- 4 Columns -->
        <div class="studio-footer__cols">
          <div class="studio-footer__col">
            <h3 class="studio-footer__col-title">Policies</h3>
            <ul class="studio-footer__list">
              <li><NuxtLink to="/story">Privacy Policy</NuxtLink></li>
              <li><NuxtLink to="/story">Refund Policy</NuxtLink></li>
              <li><NuxtLink to="/story">Support Policy</NuxtLink></li>
              <li><NuxtLink to="/story">Terms of Services</NuxtLink></li>
            </ul>
          </div>

          <div class="studio-footer__col">
            <h3 class="studio-footer__col-title">Pages</h3>
            <ul class="studio-footer__list">
              <li><NuxtLink to="/story">about</NuxtLink></li>
              <li><NuxtLink to="/#campaign">Documentation</NuxtLink></li>
              <li><NuxtLink to="/#ready-to-wear">Tutorials</NuxtLink></li>
              <li><NuxtLink to="/story">Contact</NuxtLink></li>
            </ul>
          </div>

          <div class="studio-footer__col">
            <h3 class="studio-footer__col-title">Themes & Sections</h3>
            <ul class="studio-footer__list">
              <li><NuxtLink to="/#ready-to-wear">sections</NuxtLink></li>
              <li><NuxtLink to="/shop">Themes</NuxtLink></li>
              <li><NuxtLink to="/shop">All collections</NuxtLink></li>
            </ul>
          </div>

          <div class="studio-footer__col">
            <h3 class="studio-footer__col-title">Earn With Us</h3>
            <ul class="studio-footer__list">
              <li><NuxtLink to="/story">Affiliate Program</NuxtLink></li>
              <li><NuxtLink to="/story">Work with us</NuxtLink></li>
              <li><NuxtLink to="/story">Become a Partner</NuxtLink></li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Giant Wordmark Section -->
      <div class="studio-footer__wordmark-wrap">
        <h2 class="studio-footer__wordmark">Aaroh Studio</h2>
      </div>

      <!-- Bottom Bar: Legal + Social Icons -->
      <div class="studio-footer__bottom">
        <div class="studio-footer__legal">
          <span>© 2026 Aaroh Store, Powered by AAROH</span>
          <span class="studio-footer__divider"></span>
          <NuxtLink to="/story">Terms and Policies</NuxtLink>
        </div>

        <div class="studio-footer__socials" aria-label="Social media channels">
          <!-- Facebook -->
          <a :href="FACEBOOK_URL" target="_blank" rel="noopener" aria-label="Facebook">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
            </svg>
          </a>

          <!-- Instagram -->
          <a :href="INSTAGRAM_URL" target="_blank" rel="noopener" aria-label="Instagram">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
            </svg>
          </a>

          <!-- YouTube -->
          <a href="https://youtube.com" target="_blank" rel="noopener" aria-label="YouTube">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
          </a>

          <!-- TikTok -->
          <a :href="TIKTOK_URL" target="_blank" rel="noopener" aria-label="TikTok">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.82 4.49 6.27 6.27 0 0 0 1.94-4.49V8.6a8.28 8.28 0 0 0 4.83 1.54V6.69z" />
            </svg>
          </a>

          <!-- X / Twitter -->
          <a href="https://x.com" target="_blank" rel="noopener" aria-label="X (formerly Twitter)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.studio-footer {
  background: #ffffff;
  color: #111111;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  padding: clamp(3.5rem, 6vw, 6rem) var(--gutter) clamp(1.8rem, 3vw, 2.5rem);
  overflow: hidden;
}

.studio-footer__wrap {
  max-width: var(--max);
  margin-inline: auto;
  display: flex;
  flex-direction: column;
}

/* Top Section: Newsletter + 4 Columns */
.studio-footer__top {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 2fr);
  align-items: start;
  gap: clamp(2rem, 5vw, 6rem);
}

.studio-footer__newsletter {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.studio-footer__nl-title {
  font-family: var(--font-mono), 'Space Mono', monospace;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  line-height: 1.5;
  color: #111111;
  max-width: 28ch;
  margin: 0;
}

.studio-footer__form {
  display: flex;
  align-items: center;
  gap: 0;
}

.studio-footer__input {
  background: transparent;
  border: 1px solid #d4d4d4;
  border-right: none;
  padding: 10px 14px;
  font-family: var(--font-mono), 'Space Mono', monospace;
  font-size: 0.78rem;
  color: #111111;
  outline: none;
  width: min(100%, 220px);
  border-radius: 0;
  transition: border-color 0.2s;
}

.studio-footer__input:focus {
  border-color: #000000;
}

.studio-footer__btn {
  background: #000000;
  color: #ffffff;
  border: 1px solid #000000;
  padding: 10px 16px;
  font-family: var(--font-mono), 'Space Mono', monospace;
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  cursor: pointer;
  border-radius: 0;
  white-space: nowrap;
  transition: background 0.2s ease;
}

.studio-footer__btn:hover {
  background: #2b2b2b;
}

/* 4 Columns */
.studio-footer__cols {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: clamp(1rem, 2.5vw, 2.5rem);
}

.studio-footer__col-title {
  font-family: var(--font-mono), 'Space Mono', monospace;
  font-size: 0.74rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: #111111;
  margin: 0 0 16px;
}

.studio-footer__list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.studio-footer__list a {
  font-family: var(--font-mono), 'Space Mono', monospace;
  font-size: 0.72rem;
  color: #444444;
  text-decoration: none;
  transition: color 0.15s ease;
}

.studio-footer__list a:hover {
  color: #000000;
  text-decoration: underline;
}

/* Giant Wordmark */
.studio-footer__wordmark-wrap {
  width: 100%;
  margin: clamp(2.5rem, 6vw, 5rem) 0 clamp(1.5rem, 3.5vw, 3rem);
  overflow: hidden;
}

.studio-footer__wordmark {
  font-family: var(--font-logo), 'Space Grotesk', -apple-system, sans-serif;
  font-size: clamp(3.6rem, 15vw, 15.5rem);
  font-weight: 550;
  line-height: 0.86;
  letter-spacing: -0.055em;
  color: #111111;
  margin: 0;
  white-space: nowrap;
  user-select: none;
}

/* Bottom Bar */
.studio-footer__bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
}

.studio-footer__legal {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 14px;
  font-family: var(--font-mono), 'Space Mono', monospace;
  font-size: 0.7rem;
  color: #666666;
}

.studio-footer__legal a {
  color: #666666;
  text-decoration: none;
}

.studio-footer__legal a:hover {
  color: #000000;
  text-decoration: underline;
}

.studio-footer__socials {
  display: flex;
  align-items: center;
  gap: 16px;
  color: #111111;
}

.studio-footer__socials a {
  color: #111111;
  display: inline-flex;
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.studio-footer__socials a:hover {
  opacity: 0.6;
  transform: translateY(-1px);
}

/* Responsive */
@media (max-width: 900px) {
  .studio-footer__top {
    grid-template-columns: 1fr;
    gap: 2.5rem;
  }

  .studio-footer__cols {
    grid-template-columns: repeat(2, 1fr);
    gap: 2rem;
  }
}

@media (max-width: 600px) {
  .studio-footer__cols {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .studio-footer__bottom {
    flex-direction: column;
    align-items: flex-start;
    gap: 1.25rem;
  }
}
</style>
