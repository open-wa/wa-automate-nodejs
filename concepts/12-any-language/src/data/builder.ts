// Request-builder data. Only POST /api/messages/sendText has a documented
// route (BRIEF §11), so the HTTP jobs use it in every language with the fact
// pack's JSON shape {to, content, options}. Other jobs show the fact pack's
// JavaScript and point at /api-docs/ on the running instance.
import { f, job, restricted } from "./facts";

export const URL_SEND = "http://localhost:8080/api/messages/sendText";
const KEY = "your-secure-key";
const TO = "447700900123@c.us";

export type Lang = "curl" | "php" | "python" | "node" | "n8n";
export const langs: { id: Lang; label: string; shiki: string }[] = [
  { id: "curl", label: "curl", shiki: "bash" },
  { id: "php", label: "PHP", shiki: "php" },
  { id: "python", label: "Python", shiki: "python" },
  { id: "node", label: "Node.js", shiki: "js" },
  { id: "n8n", label: "n8n", shiki: "json" },
];

type Msg = { literal: string; php: string; python: string; node: string; n8n: string; setup?: Partial<Record<Lang, string>> };

const booking: Msg = {
  literal: "Hi Sam, your cut with Rosa is booked for Friday at 13:30. Reply here if you need to move it.",
  php: "'Hi Sam, your cut with Rosa is booked for Friday at 13:30. Reply here if you need to move it.'",
  python: '"Hi Sam, your cut with Rosa is booked for Friday at 13:30. Reply here if you need to move it."',
  node: "'Hi Sam, your cut with Rosa is booked for Friday at 13:30. Reply here if you need to move it.'",
  n8n: "Hi {{ $json.name }}, your cut with Rosa is booked for {{ $json.slot }}. Reply here if you need to move it.",
};
const otp: Msg = {
  literal: "Your Acme code is 482913. It expires in 10 minutes.",
  php: '"Your Acme code is {$code}. It expires in 10 minutes."',
  python: 'f"Your Acme code is {code}. It expires in 10 minutes."',
  node: "`Your Acme code is ${code}. It expires in 10 minutes.`",
  n8n: "Your Acme code is {{ $json.code }}. It expires in 10 minutes.",
  setup: {
    php: "$code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);\n\n",
    python: "code = f\"{secrets.randbelow(1_000_000):06d}\"\n\n",
    node: "import { randomInt } from 'node:crypto';\n\nconst code = String(randomInt(0, 1_000_000)).padStart(6, '0');\n\n",
  },
};

function http(lang: Lang, m: Msg): string {
  switch (lang) {
    case "curl":
      return `curl -X POST ${URL_SEND} \\\n  -H "Content-Type: application/json" \\\n  -H "X-API-Key: ${KEY}" \\\n  -d '{"to":"${TO}","content":"${m.literal}","options":{}}'`;
    case "php":
      return `<?php\n${m.setup?.php ?? ""}$ch = curl_init('${URL_SEND}');\ncurl_setopt_array($ch, [\n    CURLOPT_POST => true,\n    CURLOPT_RETURNTRANSFER => true,\n    CURLOPT_HTTPHEADER => [\n        'Content-Type: application/json',\n        'X-API-Key: ${KEY}',\n    ],\n    CURLOPT_POSTFIELDS => json_encode([\n        'to' => '${TO}',\n        'content' => ${m.php},\n        'options' => new stdClass(),\n    ]),\n]);\n$result = json_decode(curl_exec($ch), true);`;
    case "python":
      return `import requests${m.setup?.python ? ", secrets" : ""}\n\n${m.setup?.python ?? ""}response = requests.post(\n    "${URL_SEND}",\n    headers={"X-API-Key": "${KEY}"},\n    json={\n        "to": "${TO}",\n        "content": ${m.python},\n        "options": {},\n    },\n)\nprint(response.json())`;
    case "node":
      return `${m.setup?.node ?? ""}const response = await fetch('${URL_SEND}', {\n  method: 'POST',\n  headers: {\n    'Content-Type': 'application/json',\n    'X-API-Key': '${KEY}',\n  },\n  body: JSON.stringify({\n    to: '${TO}',\n    content: ${m.node},\n    options: {},\n  }),\n});\nconsole.log(await response.json());`;
    case "n8n":
      return `{\n  "to": "{{ $json.phone }}@c.us",\n  "content": "${m.n8n}",\n  "options": {}\n}`;
  }
}

const hotelSnippet = job("hotel-notifications").snippet.split("\n");
const pdfJs =
  "// client: your connected open-wa client (see Quick start)\n" +
  "const guest = '447700900123@c.us';\n\n" +
  hotelSnippet.slice(2).join("\n");
const callJs = job("pbx-calls").snippet;

export type BJob = {
  id: string;
  who: string;      // example business (always labelled Example)
  label: string;    // what the developer is doing
  method: string;
  http: boolean;
  recipe: string;
  licence: string;
  licenceTone: "free" | "paid";
  code: Record<Lang, string>;
  js?: string;
};

export const bjobs: BJob[] = [
  {
    id: "booking", who: "Rosa's Salon", label: "Send a booking confirmation", method: "sendText", http: true, recipe: "salon-bookings",
    licence: "No key when the customer messaged you first. A first message to a new number needs Restricted, " + restricted.prices.month + " a month.",
    licenceTone: "free",
    code: Object.fromEntries(langs.map((l) => [l.id, http(l.id, booking)])) as Record<Lang, string>,
  },
  {
    id: "otp", who: "Acme", label: "Send a one-time code", method: "sendText", http: true, recipe: "otp",
    licence: "Needs Restricted, " + restricted.prices.month + " a month: codes go to numbers that haven't messaged you.",
    licenceTone: "paid",
    code: Object.fromEntries(langs.map((l) => [l.id, http(l.id, otp)])) as Record<Lang, string>,
  },
  {
    id: "pdf", who: "Harbour House", label: "Send a booking PDF", method: "sendFile", http: false, recipe: "hotel-notifications",
    licence: "sendFile needs no key. A first message to a guest who hasn't messaged you needs Restricted, " + restricted.prices.month + " a month.",
    licenceTone: "free",
    code: {} as Record<Lang, string>, js: pdfJs,
  },
  {
    id: "call", who: "Rosa's Salon", label: "Answer a call", method: "onIncomingCall", http: false, recipe: "pbx-calls",
    licence: "Licensed preview: needs a calling-enabled key. Audio only.",
    licenceTone: "paid",
    code: {} as Record<Lang, string>, js: callJs,
  },
];

export const responseJson = `{\n  "success": true,\n  "data": { }\n}`;
export const sendTextRoute = f.http.sendTextRoute;

/** The documented sendText route in every language, for a fixed message (no apostrophes). */
export function sendTextAll(literal: string) {
  const m: Msg = { literal, php: `'${literal}'`, python: `"${literal}"`, node: `'${literal}'`, n8n: literal };
  return langs.map((l) => ({ id: l.id, label: l.label, shiki: l.id === "n8n" ? "json" : l.shiki, code: http(l.id, m), title: l.id === "n8n" ? "n8n HTTP Request node, JSON body" : `${l.label}: sendText` }));
}
export const otpAll = langs.map((l) => ({ id: l.id, label: l.label, shiki: l.id === "n8n" ? "json" : l.shiki, code: http(l.id, otp), title: l.id === "n8n" ? "n8n HTTP Request node, JSON body" : `${l.label}: send a code` }));
