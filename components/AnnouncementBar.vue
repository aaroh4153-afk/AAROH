<template>
  <div class="announce">
    <p>
      <span class="announce__dot" aria-hidden="true" />
      <span>Complimentary shipping on every order</span>
      <span class="announce__dot" aria-hidden="true" />
    </p>
  </div>
</template>

<style scoped>
.announce {
  background: var(--blue);
  color: #fff;
}

.announce p {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 11px;
  padding: 7px var(--gutter) 8px;
  font-size: 0.62rem;
  font-weight: 600;
  line-height: 1.2;
  letter-spacing: 0.14em;
  text-align: center;
  text-transform: uppercase;
}

.announce__dot {
  width: 4px;
  height: 4px;
  flex: none;
  border-radius: 50%;
  background: var(--sky);
}

@media (max-width: 560px) {
  .announce p {
    gap: 8px;
    padding-block: 6px 7px;
    font-size: 0.55rem;
    letter-spacing: 0.08em;
  }
}
</style>
