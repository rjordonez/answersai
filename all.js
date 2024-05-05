function validateButlerText(text) {
  const regex = /^helpme:.*;$/;
  return regex.test(text);
}

function findByText() {
  chrome.storage.sync.get("disable-extension", (val) => {
    if (val["disable-extension"]) {
      return;
    }

    const inputs = document.querySelectorAll('input[type="text"], input[type="email"], input[type="password"], input[type="search"], input[type="url"], input[type="tel"], input[type="number"]');
    const textboxes = document.querySelectorAll('[role="textbox"]');
    const comboboxes = document.querySelectorAll('[role="combobox"]');
    const textAreas = document.querySelectorAll("textarea");
    const codeMirror = document.querySelectorAll(".CodeMirror-code");
    const editableContents = document.querySelectorAll('[contenteditable="true"]');

    searchAndUpdate([
      { el: inputs, isInputType: true },
      { el: textboxes, isInputType: false },
      { el: comboboxes, isInputType: false },
      { el: textAreas, isInputType: true },
      { el: codeMirror, isInputType: false },
      { el: editableContents, isInputType: false },
    ]);
  });
}

function searchAndUpdate(nodesArray) {
  nodesArray.forEach(({ el, isInputType }) => {
    el.forEach(node => {
      const val = getTextContentFromNode(node, isInputType);

      if (validateButlerText(val)) {
        makeChatGPTCall(val, node).then((responseText) => {
          update(node, responseText, isInputType);
        });
      }
    });
  });
}

function getTextContentFromNode(node, isInputType) {
  return isInputType ? node.value : node.innerText;
}

function update(node, text, isInputType = false) {
  if (isInputType) {
    node.value = text;
  } else {
    node.innerText = text;
  }
}

const experimentalToggle = document.getElementById('experimental-feature-toggle');
experimentalToggle.addEventListener('change', () => {
  if (experimentalToggle.checked) {
    findByText();
  }
});

function toggleAdvancedSettings() {
  const advancedSettings = document.getElementById('advanced-settings');
  if (advancedSettings.style.display === 'none' || !advancedSettings.style.display) {
    advancedSettings.style.display = 'block';
  } else {
    advancedSettings.style.display = 'none';
  }
}

document.getElementById('advanced-settings-link').addEventListener('click', toggleAdvancedSettings);
