(() => {
  const form = document.querySelector("#contact-form");

  if (!form) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!form.reportValidity()) return;

    const data = new FormData(form);
    const lines = [
      `Ich bin: ${data.get("role") || "–"}`,
      `Name: ${data.get("name") || "–"}`,
      `Fahrschule / Unternehmen: ${data.get("school") || "–"}`,
      `E-Mail-Adresse: ${data.get("email") || "–"}`,
      `Telefonnummer: ${data.get("phone") || "–"}`,
      `Thema: ${data.get("topic") || "–"}`,
      "",
      "Nachricht:",
      data.get("message") || "–",
    ];

    const subject = `LANE SWITCH Anfrage – ${data.get("topic") || "Kontakt"}`;
    const mailto = new URL("mailto:Steven.Dragojevic@signal-iduna.net");
    mailto.searchParams.set("subject", subject);
    mailto.searchParams.set("body", lines.join("\n"));

    window.location.href = mailto.toString();
  });
})();
