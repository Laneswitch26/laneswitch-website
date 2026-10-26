/* Public Navigator availability only. No credentials, tracking or editor links. */
(() => {
  const script = document.currentScript;
  const school = script && script.dataset.school;
  if (!["a1", "emre"].includes(school)) return;
  const main = document.querySelector("main.partner-main");
  if (!main || document.getElementById("fahrschul-navigator")) return;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  fetch("https://laneswitch.de/api/navigator?action=public&school=" + school, {
    credentials: "omit", cache: "no-store", referrerPolicy: "no-referrer", signal: controller.signal
  }).then(response => response.ok ? response.json() : null).then(result => {
    if (!result || result.school !== school || result.listed !== true) return;
    const section = document.createElement("section");
    section.id = "fahrschul-navigator";
    section.className = "partner-section partner-card";
    const title = document.createElement("h2");
    title.id = "fahrschul-navigator-title";
    title.textContent = "Fahrschul-Navigator";
    section.setAttribute("aria-labelledby", title.id);
    const text = document.createElement("p");
    text.textContent = "Die veröffentlichten Informationen deiner Fahrschule zu Anmeldung, Ausbildung und Preisen. Auch als PDF verfügbar.";
    const link = document.createElement("a");
    link.className = "partner-button primary";
    link.href = "https://laneswitch.de/navigator/" + school;
    link.textContent = "Fahrschul-Navigator öffnen";
    section.append(title, text, link);
    main.append(section);
  }).catch(() => {}).finally(() => clearTimeout(timeout));
})();
