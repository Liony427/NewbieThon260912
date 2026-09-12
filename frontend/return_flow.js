"use strict";
// UI sample data only. No location, lock, payment, or discount API is called.
const choices = [
  {reward: "+173원", distance: "420m", time: "2분"},
  {reward: "+378원", distance: "650m", time: "3분"},
  {reward: "+594원", distance: "1.5km", time: "10분"}
];
const rawChoice = new URLSearchParams(location.search).get("choice");
const choice = /^[0-2]$/.test(rawChoice || "") ? Number(rawChoice) : null;
if (choice !== null) {
  document.querySelectorAll("[data-value]").forEach(element => {
    element.textContent = choices[choice][element.dataset.value];
  });
  const link = document.getElementById("confirm-link");
  if (link) link.href = `return_route.html?choice=${choice}`;
}
