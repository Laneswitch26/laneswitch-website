/* Public Navigator availability only. No credentials, tracking or editor links. */
(() => {
  const script = document.currentScript;
  const school = script && script.dataset.school;
  if (!["a1", "emre"].includes(school)) return;
  const main = document.querySelector("main.partner-main");
  if (!main || document.getElementById("fahrschul-navigator")) return;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  const origin = location.hostname === "laneswitch.online" ? "" : "https://laneswitch.online";
  fetch(origin + "/api/navigator?action=public&school=" + school, {
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
    link.href = origin + "/navigator/" + school;
    link.textContent = "Fahrschul-Navigator öffnen";
    // Direkter PDF-Download der veröffentlichten Ausgabe, benannt nach der Fahrschule.
    const name = result.data && typeof result.data.name === "string" ? result.data.name.trim().slice(0, 80) : "";
    const download = document.createElement("a");
    download.className = "partner-button";
    download.href = origin + "/navigator/" + school + "?download=pdf";
    download.textContent = name ? "Navigator der " + name + " herunterladen (PDF)" : "Navigator als PDF herunterladen";
    const actions = document.createElement("div");
    actions.className = "partner-actions";
    actions.append(link, download);
    section.append(title, text, actions);
    main.append(section);
  }).catch(() => {}).finally(() => clearTimeout(timeout));
})();
