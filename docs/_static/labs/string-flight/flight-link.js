// Select only complete statements before the first unfilled slot.
export function filledPrefix(lines, pattern, tokens, requestedKey) {
  const groups = lines.map((line, index) => [...line.matchAll(pattern)]
    .map(([, key]) => ({ key, line: index + 1 }))).flat();
  const missing = groups.find(item => !Object.hasOwn(tokens, item.key));
  const requested = groups.find(item => item.key === requestedKey);
  const next = requested && groups.find(item => item.line > requested.line);
  const limit = Math.min(missing ? missing.line - 1 : lines.length,
    next ? next.line - 1 : lines.length);
  const finished = groups.filter(item => item.line <= limit);
  const stage = finished.at(-1);
  return {
    lines: lines.slice(0, limit),
    partial: limit < lines.length,
    stage: stage && { ...stage, number: groups.indexOf(stage) + 1 },
    blocked: requested && requested.line > limit,
  };
}

// Successful formatting or text-only checks release the next training pad.
// These are navigation gates, separate from the lesson's mission waypoints.
export function inspectionMove(number) {
  const pads = [[-8, 7], [0, 12], [8, 7], [13, 0], [8, -7],
    [0, -12], [-8, -7], [-13, 0], [-5, 4], [5, 4]];
  const [x, y] = pads[number - 1];
  return { action: "move", x, y, speed: 8, label: "飞往校验点 " + number };
}

export function newCommands(previous, next) {
  let index = 0;
  while (index < previous.length && index < next.length
    && JSON.stringify(previous[index]) === JSON.stringify(next[index])) index++;
  return next.slice(index);
}

export function flightEvidence(ui, stage, label, value, explanation, state = "ready") {
  const panel = ui["flight-link"];
  panel.dataset.state = state;
  ui["link-step"].textContent = stage ? "第 " + stage.number + " 空 · " + label : label;
  ui["link-value"].textContent = value;
  ui["link-value"].hidden = !value;
  ui["link-effect"].textContent = explanation;
  for (const row of ui.editor.querySelectorAll(".linked-line")) row.classList.remove("linked-line");
  if (stage) ui.editor.querySelector('[data-line="' + stage.line + '"]')?.classList.add("linked-line");
}
