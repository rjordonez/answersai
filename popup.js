document.getElementById("butler-chatgpt-save").addEventListener("click", () => {
  const apiKey = document.getElementById("butler-chatgpt-api-key").value;
  const selectedModel = document.getElementById("model-selector").value;
  const extraData = "butler:Some extra information;"; // Example data

  const newData = { apiKey, selectedModel, extra: extraData };

  chrome.storage.sync.set({ "butler-chatgpt-apikey": apiKey, "butler-chatgpt-model": selectedModel }, () => {
      document.getElementById("butler-chatgpt-success").textContent = "Settings are saved!";
      sendMessage(newData);
  });
});

document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.sync.get(["butler-chatgpt-apikey", "butler-chatgpt-model"], (val) => {
      const apiKey = val["butler-chatgpt-apikey"];
      const selectedModel = val["butler-chatgpt-model"] || "gpt-3.5-turbo";

      if (apiKey) {
          document.getElementById("butler-chatgpt-api-key").value = apiKey;
          document.getElementById("butler-chatgpt-success").textContent = "Settings are saved!";
      }
      document.getElementById("model-selector").value = selectedModel;
  });

  document.getElementById('disable-extension-toggle').addEventListener('change', function () {
      chrome.storage.sync.set({ 'disable-extension': this.checked });
  });
});

function sendMessage(data) {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (tabs[0] && tabs[0].id) {
          chrome.tabs.sendMessage(tabs[0].id, data, function (response) {
              if (chrome.runtime.lastError) {
                  console.error('Error:', chrome.runtime.lastError.message);
              } else {
                  console.log(response);
              }
          });
      } else {
          console.error("Tab data error: unable to access the active tab.");
      }
  });
}
