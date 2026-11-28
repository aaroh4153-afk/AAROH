<script setup lang="ts">
import { FACEBOOK_URL, INSTAGRAM_URL, TIKTOK_URL } from '../data/products'

function backToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<template>
  <footer class="site-footer" aria-label="AAROH. footer">
    <div class="site-footer__wrap">
      <!-- Top Section -->
      <div class="site-footer__top">
        <div class="site-footer__brand">
          <NuxtLink class="site-footer__logo" to="/">AAROH.</NuxtLink>
          <p class="site-footer__tagline">Everyday essentials, made to be worn.</p>

          <a class="site-footer__cta" :href="INSTAGRAM_URL" target="_blank" rel="noopener">
            Become a founding member →
          </a>
        </div>

        <!-- 3 Columns -->
        <div class="site-footer__columns">
          <!-- EXPLORE -->
          <div class="site-footer__col">
            <h3 class="site-footer__heading">EXPLORE</h3>
            <ul class="site-footer__links">
              <li><NuxtLink to="/">Home</NuxtLink></li>
              <li><NuxtLink to="/shop">Shop</NuxtLink></li>
              <li><NuxtLink to="/#ready-to-wear">Categories</NuxtLink></li>
              <li><NuxtLink to="/#campaign">Campaign</NuxtLink></li>
              <li><NuxtLink to="/dashboard">Brand dashboard</NuxtLink></li>
              <li><NuxtLink to="/admin">Admin console</NuxtLink></li>
            </ul>
          </div>

          <!-- BENEFITS -->
          <div class="site-footer__col">
            <h3 class="site-footer__heading">BENEFITS</h3>
            <ul class="site-footer__links">
              <li><NuxtLink to="/#ready-to-wear">Core collection</NuxtLink></li>
              <li><NuxtLink to="/shop">New season</NuxtLink></li>
              <li><NuxtLink to="/story">Our story</NuxtLink></li>
              <li><button type="button" class="site-footer__link-btn" @click="backToTop">Back to top</button></li>
            </ul>
          </div>

          <!-- CONTACT -->
          <div class="site-footer__col">
            <h3 class="site-footer__heading">CONTACT</h3>
            <ul class="site-footer__links">
              <li><a href="mailto:hello@aaroh.in">aaroh4153@gmail.com</a></li>
              <li><a :href="INSTAGRAM_URL" target="_blank" rel="noopener">Instagram</a></li>
              <li><a :href="FACEBOOK_URL" target="_blank" rel="noopener">Facebook</a></li>
              <li><a :href="TIKTOK_URL" target="_blank" rel="noopener">Tik Tok</a></li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Bottom Bar -->
      <div class="site-footer__bottom">
        <span>© 2026 AAROH. All rights reserved.</span>
        <div class="site-footer__legal">
          <NuxtLink to="/story">Privacy</NuxtLink>
          <span class="site-footer__sep">·</span>
          <NuxtLink to="/story">Terms</NuxtLink>
        </div>
        <span>Made with intent in India.</span>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.site-footer {
  background: #ffffff;
  color: #111111;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  padding: clamp(3.5rem, 6vw, 6rem) var(--gutter) clamp(1.8rem, 3vw, 2.5rem);
  overflow: hidden;
}

.site-footer__wrap {
  max-width: var(--max);
  margin-inline: auto;
  display: flex;
  flex-direction: column;
  gap: clamp(2.5rem, 5vw, 4.5rem);
}

.site-footer__top {
  display: grid;
  grid-template-columns: minmax(0, 1.3fr) minmax(0, 2fr);
  gap: clamp(2rem, 5vw, 5rem);
  align-items: start;
}

.site-footer__brand {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 14px;
}

.site-footer__logo {
  font-family: var(--font-logo), 'Space Grotesk', -apple-system, sans-serif;
  font-size: clamp(2rem, 3.2vw, 2.8rem);
  font-weight: 700;
  letter-spacing: -0.04em;
  color: #111111;
  text-decoration: none;
  line-height: 1;
}

.site-footer__tagline {
  font-family: var(--font-mono), 'Space Mono', monospace;
  font-size: 0.85rem;
  color: #444444;
  margin: 0;
  max-width: 26ch;
  line-height: 1.5;
}

.site-footer__cta {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #000000;
  color: #ffffff;
  font-family: var(--font-mono), 'Space Mono', monospace;
  font-size: 0.78rem;
  font-weight: 700;
  padding: 11px 20px;
  text-decoration: none;
  margin-top: 8px;
  transition: background 0.2s ease, transform 0.2s ease;
}

.site-footer__cta:hover {
  background: #0012db;
  transform: translateY(-1px);
}

.site-footer__columns {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: clamp(1.5rem, 3vw, 3rem);
}

.site-footer__heading {
  font-family: var(--font-mono), 'Space Mono', monospace;
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: #111111;
  text-transform: uppercase;
  margin: 0 0 16px;
}

.site-footer__links {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.site-footer__links a,
.site-footer__link-btn {
  font-family: var(--font-mono), 'Space Mono', monospace;
  font-size: 0.78rem;
  color: #444444;
  text-decoration: none;
  background: transparent;
  border: none;
  padding: 0;
  cursor: pointer;
  text-align: left;
  transition: color 0.15s ease;
}

.site-footer__links a:hover,
.site-footer__link-btn:hover {
  color: #000000;
  text-decoration: underline;
}

.site-footer__bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  padding-top: 2rem;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  font-family: var(--font-mono), 'Space Mono', monospace;
  font-size: 0.72rem;
  color: #666666;
}

.site-footer__legal {
  display: flex;
  align-items: center;
  gap: 8px;
}

.site-footer__legal a {
  color: #666666;
  text-decoration: none;
}

.site-footer__legal a:hover {
  color: #000000;
}

.site-footer__sep {
  opacity: 0.5;
}

@media (max-width: 820px) {
  .site-footer__top {
    grid-template-columns: 1fr;
    gap: 2.5rem;
  }

  .site-footer__columns {
    grid-template-columns: repeat(2, 1fr);
    gap: 2rem;
  }

  .site-footer__bottom {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
}
</style>
