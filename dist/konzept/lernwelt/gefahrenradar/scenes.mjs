import { MORE_SCENES } from './more-scenes.mjs?v=5';
// Original LANE SWITCH scenarios. Content and timing are independent of the engine.
export const RULES = Object.freeze({ detected: 6, early: 2, correct: 12, misclick: 1, maxPenalty: 4, cooldownMs: 650, earlyMs: 3000 });
export const BADGES = [
  { id: 'profi', name: 'Gefahrenprofi', minDetected: 5, minCorrect: 5, minPoints: 85 },
  { id: 'aufmerksam', name: 'Aufmerksam unterwegs', minDetected: 4, minCorrect: 4, minPoints: 65 },
  { id: 'entdecker', name: 'Gefahrenentdecker:in', minDetected: 3, minCorrect: 3, minPoints: 45 }
];
const option = (id, text, correct = false) => ({ id, text, correct });
export const SCENES = [
  {
    id: 'ball', title: 'Im Wohngebiet', category: 'Verdeckte Gefahren',
    intro: 'Du fährst geradeaus durch ein Wohngebiet mit parkenden Autos.',
    description: 'Links stehen zwei parkende Autos. Aus der Lücke rollt ein orangefarbener Ball auf die Fahrbahn. Rechts sind ein Gehweg und Häuser zu sehen.',
    cueMs: 2600, durationMs: 11000, motionMs: 6500,
    hazard: { from: [257, 369], to: [367, 391], rx: 70, ry: 66 },
    question: 'Ein Ball rollt zwischen den Autos hervor. Wie reagierst du?',
    options: [option('steady', 'Geschwindigkeit beibehalten.'), option('prepare', 'Langsamer werden und bremsbereit sein.', true), option('accelerate', 'Beschleunigen, bevor jemand folgt.')],
    feedback: 'Dem Ball könnte ein Kind folgen. Verringere deine Geschwindigkeit und sei bremsbereit. Beobachte auch die Lücke zwischen den Autos.',
    principle: 'Ein kleiner Hinweis kann eine größere Gefahr ankündigen.',
    source: { label: 'StVO § 3 Abs. 1 und 2a', url: 'https://www.gesetze-im-internet.de/stvo_2013/__3.html' }
  },
  {
    id: 'door', title: 'An parkenden Autos vorbei', category: 'Seitlicher Raum',
    intro: 'Du fährst geradeaus. Am rechten Fahrbahnrand stehen Fahrzeuge.',
    description: 'Rechts steht ein türkisfarbenes Auto. Im linken Seitenfenster ist eine Person erkennbar; die fahrbahnseitige Tür beginnt sich zu öffnen. Links ist die Gegenfahrbahn.',
    cueMs: 2900, durationMs: 11000, motionMs: 6500,
    hazard: { from: [545, 380], to: [509, 379], rx: 77, ry: 80 },
    question: 'Die fahrbahnseitige Autotür öffnet sich. Was ist jetzt sinnvoll?',
    options: [option('horn', 'Hupen und unverändert weiterfahren.'), option('swerve', 'Sofort auf die Gegenfahrbahn ausweichen.'), option('space', 'Tempo verringern, Abstand halten und bei Bedarf anhalten.', true)],
    feedback: 'Die Tür kann weiter in deinen Fahrweg ragen. Halte ausreichend seitlichen Abstand und bremse nötigenfalls bis zum Stillstand. Weiche nicht unkontrolliert in den Gegenverkehr aus.',
    principle: 'Plane Platz für unerwartete Bewegungen ein, auch wenn andere sorgfältig handeln müssten.',
    source: { label: 'StVO § 14 Abs. 1 (Aussteigen); § 3 (angepasstes Tempo)', url: 'https://www.gesetze-im-internet.de/stvo_2013/__14.html' }
  },
  {
    id: 'cycle', title: 'Rechts abbiegen', category: 'Kreuzende Wege',
    intro: 'Du möchtest rechts abbiegen. Dein rechter Blinker ist eingeschaltet.',
    description: 'Eine Straße zweigt rechts ab. Rechts neben deiner Fahrbahn fährt eine Person auf einem Fahrrad in gleicher Richtung geradeaus. Euer möglicher Fahrweg kreuzt sich beim Abbiegen.',
    cueMs: 2400, durationMs: 11000, motionMs: 6500,
    hazard: { from: [649, 409], to: [557, 320], rx: 77, ry: 91 },
    question: 'Die Person auf dem Fahrrad fährt neben dir geradeaus. Wie biegst du ab?',
    options: [option('wait', 'Radverkehr durchfahren lassen und erst bei freiem Weg abbiegen.', true), option('first', 'Vor dem Fahrrad schnell abbiegen.'), option('signal', 'Abbiegen, weil dein Blinker eingeschaltet ist.')],
    feedback: 'Beim Abbiegen musst du Radverkehr in gleicher Richtung auf oder neben der Fahrbahn durchfahren lassen. Prüfe Spiegel und den Bereich neben dir mit einem Schulterblick. Blinken verschafft keinen Vorrang.',
    principle: 'Denke den Weg anderer mit, bevor sich eure Wege kreuzen.',
    source: { label: 'StVO § 9 Abs. 1 und 3', url: 'https://www.gesetze-im-internet.de/stvo_2013/__9.html' }
  },
  {
    id: 'junction', title: 'In den Nebenstraßen', category: 'Eingeschränkte Sicht',
    intro: 'Du näherst dich einer Kreuzung gleichrangiger Straßen, ohne Ampeln oder Vorfahrtzeichen. Es gibt keine abgesenkten Bordsteine.',
    description: 'Rechts verdeckt eine Hecke die Sicht in die Seitenstraße. Dahinter kommt ein blaues Auto von rechts auf die Kreuzung zu. Links ist die andere Seitenstraße frei.',
    cueMs: 2800, durationMs: 11000, motionMs: 6500,
    hazard: { from: [656, 297], to: [531, 297], rx: 80, ry: 68 },
    question: 'Von rechts nähert sich ein Auto. Die Sicht ist eingeschränkt. Was tust du?',
    options: [option('size', 'Weiterfahren, weil deine Straße breiter wirkt.'), option('yield', 'Langsam heranfahren, Vorfahrt gewähren und bei Bedarf vorsichtig zur Sichtlinie tasten.', true), option('follow', 'Darauf vertrauen, dass das andere Auto anhält.')],
    feedback: 'Hier gilt rechts vor links. Zeige frühzeitig, dass du wartest. Reicht die Sicht nicht, taste dich vorsichtig vor, bis du überblicken kannst, ob du ohne Gefährdung oder wesentliche Behinderung weiterfahren kannst.',
    principle: 'Fehlende Sicht ist ein Grund für mehr Vorsicht.',
    source: { label: 'StVO § 8 Abs. 1 und 2', url: 'https://www.gesetze-im-internet.de/stvo_2013/__8.html' }
  },
  {
    id: 'crossing', title: 'Am Zebrastreifen', category: 'Absichten erkennen',
    intro: 'Du fährst auf einen Zebrastreifen zu. Beobachte beide Gehwege.',
    description: 'Vor dir liegt ein Zebrastreifen. Eine Person geht auf dem rechten Gehweg zum Fahrbahnrand und wendet sich dem Überweg zu. Sie möchte erkennbar die Straße überqueren.',
    cueMs: 2300, durationMs: 11000, motionMs: 6500,
    hazard: { from: [657, 309], to: [587, 309], rx: 75, ry: 84 },
    question: 'Die Person möchte erkennbar den Zebrastreifen benutzen. Wie verhältst du dich?',
    options: [option('later', 'Erst reagieren, wenn sie auf der Fahrbahn steht.'), option('pass', 'Noch schnell vor der Person vorbeifahren.'), option('stop', 'Mit mäßiger Geschwindigkeit heranfahren und nötigenfalls warten.', true)],
    feedback: 'Ermögliche der Person das Überqueren, sobald sie den Überweg erkennbar benutzen möchte. Fahre mit mäßiger Geschwindigkeit heran und warte, wenn nötig. Du musst nicht erst auf den ersten Schritt auf die Fahrbahn warten.',
    principle: 'Erkenne die Absicht, bevor daraus ein Konflikt wird.',
    source: { label: 'StVO § 26 Abs. 1', url: 'https://www.gesetze-im-internet.de/stvo_2013/__26.html' }
  }
,
  ...MORE_SCENES
];
