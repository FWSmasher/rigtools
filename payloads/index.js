const managementTemplate = `
<div id="chrome_management_disable_ext">
<h1> chrome.management Disable Extensions </h1>
<p> Note that this only works on extensions installed by your administrator </p>
<ol class="extlist">
  
</ol><br/>
<input type="text" class="extnum"><button disabled>Toggle extension</button>
</div>
`;
let savedExtList = [];
function updateExtensionStatus(extlist_element) {
  return new Promise(function (resolve, reject) {
    extlist_element.innerHTML = "";
    chrome.management.getAll(function (extlist) {
      const ordlist = [];
      extlist.forEach(function (e) {
        if (e.id === new URL(new URL(location.href).origin).host) {
          return;
        }
        ordlist.push(e);
        const itemElement = document.createElement("li");
        itemElement.textContent = `${e.name} (${e.id}) (${e.enabled ? "enabled" : "disabled"})`;
        extlist_element.appendChild(itemElement);
        resolve();
      });
      savedExtList = ordlist;
    });
  });
}
onload = async function x() {
  if (chrome.management.setEnabled) {
    window.document.body.innerHTML += managementTemplate;
    const extlist_element = document.querySelector(".extlist");
    await updateExtensionStatus(extlist_element);
    const container_extensions = this.document.querySelector(
      "#chrome_management_disable_ext",
    );
    container_extensions.querySelector("button").onclick = async function (e) {
      container_extensions.querySelector("button").disabled = true;
      let id = container_extensions.querySelector(".extnum").value;
      container_extensions.querySelector(".extnum").value = "";
      try {
        id = parseInt(id);
      } catch {
        return;
      }
      if (!savedExtList[id - 1]) {
        alert("Select extension from list!");
        container_extensions.querySelector("button").disabled = false;
        return;
      }
      await new Promise(function (resolve) {
        chrome.management.setEnabled(
          savedExtList[id - 1].id,
          !savedExtList[id - 1].enabled,
          resolve,
        );
      });

      container_extensions.querySelector("button").disabled = false;
      await updateExtensionStatus(extlist_element);
    };
    container_extensions.querySelector("button").disabled = false;
  }
};
