// Footer year
document.getElementById("year").textContent = new Date().getFullYear();

// Level = average of all stats (study will drags it down, as it should)
const values = [...document.querySelectorAll(".stats b")].map((b) => Number(b.textContent));
document.getElementById("level").textContent = Math.round(values.reduce((a, b) => a + b, 0) / values.length);

// Fill the stat bars when the card scrolls into view
const card = document.querySelector(".stat-card");
new IntersectionObserver((entries, obs) => {
  if (entries[0].isIntersecting) {
    card.classList.add("on");
    obs.disconnect();
  }
}, { threshold: 0.3 }).observe(card);

// Side quest buttons show a short line about each interest
const msg = document.getElementById("interest-msg");
document.querySelectorAll(".interest").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".interest").forEach((b) => b.classList.remove("picked"));
    btn.classList.add("picked");
    msg.textContent = btn.dataset.msg;
  });
});
