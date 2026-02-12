const GOOGLE_FORM_URL =
  "https://docs.google.com/forms/d/e/YOUR_FORM_ID/formResponse";

const form = document.getElementById("form");
const status = document.getElementById("status");

form.onsubmit = e => {
  e.preventDefault();

  const data = new FormData();
  data.append("entry.111111", form.name.value);
  data.append("entry.222222", form.title.value);
  data.append("entry.333333", form.url.value);
  data.append("entry.444444", form.hour.value);

  fetch(GOOGLE_FORM_URL, {
    method: "POST",
    mode: "no-cors",
    body: data
  });

  status.textContent = "✔ Submitted. Thanks!";
  form.reset();
};