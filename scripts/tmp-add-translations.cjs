/* Temporary script: adds missing i18n keys to locale translation.json files without reformatting whole files.
 * Safe to delete after running.
 */

const fs = require("fs");
const path = require("path");

const TARGET_KEYS_BY_LOCALE = {
  ar: {
    "Tiles this bitmap as the desktop background.": "يُكرّر هذه الصورة النقطية كخلفية لسطح المكتب.",
    "Centers this bitmap as the desktop background.": "يُوسّط هذه الصورة النقطية كخلفية لسطح المكتب.",
    "Shows or hides the AI assistant panel.": "يُظهر أو يُخفي لوحة مساعد الذكاء الاصطناعي.",
    Transparent: "شفاف",
    Opaque: "معتم",
  },
  cs: {
    "Tiles this bitmap as the desktop background.": "Nastaví tento bitmapový obrázek dlaždicově jako pozadí plochy.",
    "Centers this bitmap as the desktop background.": "Nastaví tento bitmapový obrázek jako pozadí plochy na střed.",
    "Shows or hides the AI assistant panel.": "Zobrazí nebo skryje panel asistenta AI.",
    Transparent: "Průhledný",
    Opaque: "Neprůhledný",
  },
  da: {
    "Tiles this bitmap as the desktop background.": "Fliselægger denne bitmap som skrivebordsbaggrund.",
    "Centers this bitmap as the desktop background.": "Centrerer denne bitmap som skrivebordsbaggrund.",
    "Shows or hides the AI assistant panel.": "Viser eller skjuler AI-assistentpanelet.",
    Transparent: "Gennemsigtig",
    Opaque: "Uigennemsigtig",
  },
  de: {
    "Tiles this bitmap as the desktop background.": "Kachelt dieses Bitmap als Desktop-Hintergrund.",
    "Centers this bitmap as the desktop background.": "Zentriert dieses Bitmap als Desktop-Hintergrund.",
    "Shows or hides the AI assistant panel.": "Blendet das KI-Assistenten-Panel ein oder aus.",
    Transparent: "Transparent",
    Opaque: "Deckend",
  },
  el: {
    "Tiles this bitmap as the desktop background.": "Τοποθετεί αυτό το bitmap σε πλακίδια ως φόντο επιφάνειας εργασίας.",
    "Centers this bitmap as the desktop background.": "Κεντράρει αυτό το bitmap ως φόντο επιφάνειας εργασίας.",
    "Shows or hides the AI assistant panel.": "Εμφανίζει ή αποκρύπτει το πλαίσιο βοηθού AI.",
    Transparent: "Διαφανές",
    Opaque: "Αδιαφανές",
  },
  es: {
    "Tiles this bitmap as the desktop background.": "Coloca este mapa de bits en mosaico como fondo del escritorio.",
    "Centers this bitmap as the desktop background.": "Centra este mapa de bits como fondo del escritorio.",
    "Shows or hides the AI assistant panel.": "Muestra u oculta el panel del asistente de IA.",
    Transparent: "Transparente",
    Opaque: "Opaco",
  },
  fi: {
    "Tiles this bitmap as the desktop background.": "Ruutuaa tämän bittikartan työpöydän taustakuvaksi.",
    "Centers this bitmap as the desktop background.": "Keskitttää tämän bittikartan työpöydän taustakuvaksi.",
    "Shows or hides the AI assistant panel.": "Näyttää tai piilottaa AI-avustajapaneelin.",
    Transparent: "Läpinäkyvä",
    Opaque: "Peittävä",
  },
  fr: {
    "Tiles this bitmap as the desktop background.": "Mosaïque ce bitmap comme arrière-plan du bureau.",
    "Centers this bitmap as the desktop background.": "Centre ce bitmap comme arrière-plan du bureau.",
    "Shows or hides the AI assistant panel.": "Affiche ou masque le panneau de l’assistant IA.",
  },
  he: {
    "Tiles this bitmap as the desktop background.": "פורס את מפת הסיביות הזו כאריחים כרקע שולחן העבודה.",
    "Centers this bitmap as the desktop background.": "ממרכז את מפת הסיביות הזו כרקע שולחן העבודה.",
    "Shows or hides the AI assistant panel.": "מציג או מסתיר את לוח העוזר מבוסס ה‑AI.",
    Transparent: "שקוף",
    Opaque: "אטום",
  },
  hu: {
    "Tiles this bitmap as the desktop background.": "Csempézi ezt a bitképet az asztal háttereként.",
    "Centers this bitmap as the desktop background.": "Középre igazítja ezt a bitképet az asztal háttereként.",
    "Shows or hides the AI assistant panel.": "Megjeleníti vagy elrejti az MI-asszisztens panelt.",
    Transparent: "Átlátszó",
    Opaque: "Átlátszatlan",
  },
  it: {
    "Tiles this bitmap as the desktop background.": "Dispone questo bitmap in mosaico come sfondo del desktop.",
    "Centers this bitmap as the desktop background.": "Centra questo bitmap come sfondo del desktop.",
    "Shows or hides the AI assistant panel.": "Mostra o nasconde il pannello dell'assistente IA.",
    Transparent: "Trasparente",
    Opaque: "Opaco",
  },
  ja: {
    "Tiles this bitmap as the desktop background.": "このビットマップをデスクトップの背景に並べて表示します。",
    "Centers this bitmap as the desktop background.": "このビットマップをデスクトップの背景に中央配置します。",
    "Shows or hides the AI assistant panel.": "AI アシスタント パネルを表示または非表示にします。",
    Transparent: "透明",
    Opaque: "不透明",
  },
  ko: {
    "Tiles this bitmap as the desktop background.": "이 비트맵을 바탕 화면 배경으로 바둑판식으로 배치합니다.",
    "Centers this bitmap as the desktop background.": "이 비트맵을 바탕 화면 배경으로 가운데에 배치합니다.",
    "Shows or hides the AI assistant panel.": "AI 도우미 패널을 표시하거나 숨깁니다.",
    Transparent: "투명",
    Opaque: "불투명",
  },
  nl: {
    "Tiles this bitmap as the desktop background.": "Tegelt deze bitmap als bureaubladachtergrond.",
    "Centers this bitmap as the desktop background.": "Centreert deze bitmap als bureaubladachtergrond.",
    "Shows or hides the AI assistant panel.": "Toont of verbergt het AI-assistentpaneel.",
    Transparent: "Transparant",
    Opaque: "Dekkend",
  },
  no: {
    "Tiles this bitmap as the desktop background.": "Flislegger denne bitmappen som skrivebordsbakgrunn.",
    "Centers this bitmap as the desktop background.": "Sentrerer denne bitmappen som skrivebordsbakgrunn.",
    "Shows or hides the AI assistant panel.": "Viser eller skjuler AI-assistentpanelet.",
    Transparent: "Gjennomsiktig",
    Opaque: "Ugjennomsiktig",
  },
  pl: {
    "Tiles this bitmap as the desktop background.": "Kafelkowuje tę mapę bitową jako tło pulpitu.",
    "Centers this bitmap as the desktop background.": "Wyśrodkowuje tę mapę bitową jako tło pulpitu.",
    "Shows or hides the AI assistant panel.": "Pokazuje lub ukrywa panel asystenta SI.",
    Transparent: "Przezroczysty",
    Opaque: "Nieprzezroczysty",
  },
  pt: {
    "Tiles this bitmap as the desktop background.": "Coloca este bitmap em mosaico como plano de fundo da área de trabalho.",
    "Centers this bitmap as the desktop background.": "Centraliza este bitmap como plano de fundo da área de trabalho.",
    "Shows or hides the AI assistant panel.": "Mostra ou oculta o painel do assistente de IA.",
    Transparent: "Transparente",
    Opaque: "Opaco",
  },
  "pt-br": {
    "Tiles this bitmap as the desktop background.": "Coloca este bitmap em mosaico como plano de fundo da área de trabalho.",
    "Centers this bitmap as the desktop background.": "Centraliza este bitmap como plano de fundo da área de trabalho.",
    "Shows or hides the AI assistant panel.": "Mostra ou oculta o painel do assistente de IA.",
    Transparent: "Transparente",
    Opaque: "Opaco",
  },
  ru: {
    "Tiles this bitmap as the desktop background.": "Размещает это изображение мозаикой в качестве фона рабочего стола.",
    "Centers this bitmap as the desktop background.": "Размещает это изображение по центру в качестве фона рабочего стола.",
    "Shows or hides the AI assistant panel.": "Показывает или скрывает панель помощника ИИ.",
    Transparent: "Прозрачный",
    Opaque: "Непрозрачный",
  },
  sk: {
    "Tiles this bitmap as the desktop background.": "Nastaví tento bitmapový obrázok ako pozadie pracovnej plochy (dlaždice).",
    "Centers this bitmap as the desktop background.": "Vystredí tento bitmapový obrázok ako pozadie pracovnej plochy.",
    "Shows or hides the AI assistant panel.": "Zobrazí alebo skryje panel asistenta AI.",
    Transparent: "Priehľadný",
    Opaque: "Nepriehľadný",
  },
  sl: {
    "Tiles this bitmap as the desktop background.": "Postavi to bitno sliko kot ozadje namizja (ploščice).",
    "Centers this bitmap as the desktop background.": "Postavi to bitno sliko kot ozadje namizja (na sredino).",
    "Shows or hides the AI assistant panel.": "Pokaže ali skrije ploščo pomočnika UI.",
    Transparent: "Prozorno",
    Opaque: "Neprozorno",
  },
  sv: {
    "Tiles this bitmap as the desktop background.": "Placerar den här bitmappen sida vid sida som skrivbordsbakgrund.",
    "Centers this bitmap as the desktop background.": "Centrerar den här bitmappen som skrivbordsbakgrund.",
    "Shows or hides the AI assistant panel.": "Visar eller döljer AI-assistentpanelen.",
    Transparent: "Genomskinlig",
    Opaque: "Ogenomskinlig",
  },
  tr: {
    "Tiles this bitmap as the desktop background.": "Bu bitmap'i masaüstü arka planı olarak döşer.",
    "Centers this bitmap as the desktop background.": "Bu bitmap'i masaüstü arka planı olarak ortalar.",
    "Shows or hides the AI assistant panel.": "Yapay zeka asistanı panelini gösterir veya gizler.",
    Transparent: "Saydam",
    Opaque: "Opak",
  },
  zh: {
    "Tiles this bitmap as the desktop background.": "將此點陣圖平鋪為桌面背景。",
    "Centers this bitmap as the desktop background.": "將此點陣圖置中為桌面背景。",
    "Shows or hides the AI assistant panel.": "顯示或隱藏 AI 助手面板。",
    Transparent: "透明",
    Opaque: "不透明",
  },
  "zh-simplified": {
    "Tiles this bitmap as the desktop background.": "将此位图平铺为桌面背景。",
    "Centers this bitmap as the desktop background.": "将此位图居中为桌面背景。",
    "Shows or hides the AI assistant panel.": "显示或隐藏 AI 助手面板。",
    Transparent: "透明",
    Opaque: "不透明",
  },
};

function detectIndentation(text) {
  // Most files use tabs, but we detect anyway.
  const m = text.match(/\n(\s+)"/);
  return m ? m[1] : "\t";
}

function appendMissingKeysPreserveFormatting(filePath, additions) {
  const originalText = fs.readFileSync(filePath, "utf8");
  const json = JSON.parse(originalText);

  const missing = Object.keys(additions).filter((k) => json[k] == null);
  if (missing.length === 0) return false;

  const indent = detectIndentation(originalText);
  const eol = originalText.includes("\r\n") ? "\r\n" : "\n";

  // Insert before final closing brace.
  const endIndex = originalText.lastIndexOf("}");
  if (endIndex === -1) throw new Error(`No closing brace in ${filePath}`);

  // Find the character before the closing brace, skipping whitespace.
  let i = endIndex - 1;
  while (i >= 0 && /\s/.test(originalText[i])) i--;
  if (i < 0) throw new Error(`Unexpected file format in ${filePath}`);

  const needsComma = originalText[i] !== ",";

  const lines = [];
  for (const key of missing) {
    const value = additions[key];
    if (value == null) continue;
    // JSON string escaping
    const safeKey = JSON.stringify(key);
    const safeVal = JSON.stringify(value);
    lines.push(`${indent}${safeKey}: ${safeVal}`);
  }

  const insertion = (needsComma ? "," : "") + eol + lines.join("," + eol) + eol;
  const updatedText = originalText.slice(0, endIndex) + insertion + originalText.slice(endIndex);

  // Validate JSON after edit.
  JSON.parse(updatedText);
  fs.writeFileSync(filePath, updatedText, "utf8");
  return true;
}

function main() {
  const localesDir = path.join(process.cwd(), "public", "locales");
  const locales = fs
    .readdirSync(localesDir)
    .filter((d) => fs.existsSync(path.join(localesDir, d, "translation.json")));

  let changed = 0;
  for (const locale of locales) {
    const additions = TARGET_KEYS_BY_LOCALE[locale];
    if (!additions) continue;
    const filePath = path.join(localesDir, locale, "translation.json");
    if (appendMissingKeysPreserveFormatting(filePath, additions)) {
      changed++;
      console.log(`Updated ${locale}`);
    }
  }
  console.log(`Done. Updated ${changed} locale file(s).`);
}

main();
