// Prompt parsing is independent of the compose window so it can be tested directly.
// This binding is module-local, never a legacy chrome-window global.
let nextPlanId = 0;

export class PromptCancelled extends Error {
  constructor() {
    super("Prompt insertion cancelled");
    this.name = "PromptCancelled";
  }
}

export function parsePrompt(source, start = 0) {
  let position = start + "%prompt(".length;
  const args = [];
  const fail = () => {
    throw new SyntaxError("Invalid %prompt()% arguments at position " + start);
  };
  if (!source.startsWith("%prompt(", start)) {
    fail();
  }
  while (position < source.length) {
    while (/\s/.test(source[position] || "")) {
      position++;
    }
    const quoted = source[position] === '"';
    let value = "";
    const choices = [""];
    if (quoted) {
      position++;
      while (position < source.length && source[position] !== '"') {
        let character = source[position++];
        let escaped = false;
        if (character === "\\") {
          character = source[position++];
          if (!['"', "\\", ","].includes(character)) {
            fail();
          }
          escaped = true;
        }
        value += character;
        if (character === "," && !escaped) {
          choices.push("");
        } else {
          choices[choices.length - 1] += character;
        }
      }
      if (source[position++] !== '"') {
        fail();
      }
    } else {
      const match = source.slice(position).match(/^[a-z]+/);
      if (!match) {
        fail();
      }
      value = match[0];
      position += value.length;
    }
    args.push({ value, quoted, choices });
    while (/\s/.test(source[position] || "")) {
      position++;
    }
    if (source.startsWith(")%", position)) {
      position += 2;
      break;
    }
    if (source[position++] !== ",") {
      fail();
    }
  }
  if (!source.slice(start, position).endsWith(")%")) {
    fail();
  }
  const toClipboard = args.at(-1)?.value === "toclipboard" && !args.at(-1).quoted;
  if (toClipboard) {
    args.pop();
  }
  if (
    !args.length ||
    args.length > 3 ||
    !args[0].quoted ||
    (args[1] && !args[1].quoted && args[1].value !== "clipboard") ||
    (args[2] && !args[2].quoted)
  ) {
    fail();
  }
  const choices = args[2]?.value ? args[2].choices : [];
  if (choices.some((choice) => !choice.length)) {
    fail();
  }
  return {
    start,
    end: position,
    explanation: args[0].value,
    defaultValue: args[1]?.value || "",
    fromClipboard: args[1]?.value === "clipboard" && !args[1].quoted,
    choices,
    toClipboard,
  };
}

// Validate every source before opening the first dialog. Clipboard writes are staged.
export async function preparePrompts(sources, { ask, readClipboard, allowFeature }) {
  const parsed = sources.map((source) => {
    const tokens = [];
    const matcher = /%prompt(?=\(|%|\s)|%clipboard%/g;
    let match;
    while ((match = matcher.exec(source))) {
      const token =
        match[0] === "%clipboard%"
          ? { start: match.index, end: matcher.lastIndex, clipboard: true }
          : parsePrompt(source, match.index);
      tokens.push(token);
      matcher.lastIndex = token.end;
    }
    return tokens;
  });
  // Check prompting and clipboard entitlements before asking or reading any data.
  for (const tokens of parsed) {
    for (const token of tokens) {
      if (!token.clipboard && !allowFeature("prompt")) {
        throw new PromptCancelled();
      }
      if ((token.fromClipboard || token.clipboard) && !allowFeature("clipboard")) {
        throw new PromptCancelled();
      }
      if (token.toClipboard && !allowFeature("toclipboard")) {
        throw new PromptCancelled();
      }
    }
  }
  let prefix;
  do {
    prefix = "\uE000ST443_" + ++nextPlanId + "_";
  } while (sources.some((source) => source.includes(prefix)));
  const literals = [];
  const protect = (value) => {
    const marker = prefix + literals.length + "\uE001";
    literals.push({ marker, value });
    return marker;
  };
  let clipboard;
  let writeClipboard = false;
  const texts = [];
  for (let index = 0; index < sources.length; index++) {
    const source = sources[index];
    let position = 0;
    let text = "";
    for (const token of parsed[index]) {
      text += source.slice(position, token.start);
      if (token.clipboard) {
        if (clipboard === undefined) {
          clipboard = await readClipboard();
        }
        text += protect(clipboard);
      } else {
        if (token.fromClipboard && clipboard === undefined) {
          clipboard = await readClipboard();
        }
        const answer = await ask({
          explanation: token.explanation,
          defaultValue: token.fromClipboard ? clipboard : token.defaultValue,
          choices: token.choices,
        });
        if (answer === null) {
          throw new PromptCancelled();
        }
        if (typeof answer !== "string" || !answer.length) {
          throw new Error("A prompt requires a nonempty text answer");
        }
        if (token.choices.length && !token.choices.includes(answer)) {
          throw new Error("A prompt answer must be one of its supplied choices");
        }
        if (token.toClipboard) {
          clipboard = answer;
          writeClipboard = true;
        } else {
          text += protect(answer);
        }
      }
      position = token.end;
    }
    texts.push(text + source.slice(position));
  }
  return {
    texts,
    clipboard,
    writeClipboard,
    restore(text) {
      // getProcessedText returns markup even for a plain-text compose editor.
      // Encode '%' as well so a containing %file()% parse cannot evaluate answers.
      const entities = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
        "%": "&#37;",
      };
      for (const { marker, value } of literals) {
        text = text.replaceAll(marker, () =>
          value.replace(/[&<>"'%]/g, (character) => entities[character])
        );
      }
      return text;
    },
  };
}
