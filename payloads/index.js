onerror = alert;


const uiTemplate = `
`;
// if (chrome.fileManagerPrivate) {
  // chrome.fileManagerPrivate.openURL();
// }
const managementTemplate = `
<div id="chrome_management_disable_ext">
<h1> chrome.management Disable Extensions </h1>
<p> Note that this only works on extensions installed by your administrator </p>
<ol class="extlist">
  
</ol><br/>
<input type="text" class="extnum" /><button disabled id="toggler">Toggle extension</button>
</div>
`; // TODO: Add CSS for this
let savedExtList = [];

class DefaultExtensionCapabilities {
  static template = `<div id="default_extension_capabilities">
    <h1> Default Extension Capabilities </h1>

    <h2>Evaluate code</h1>
    <input type="text" id="code_input"/><button id="code_evaluate">Evaluate</button>
  </div>
  `; // TODO: Fix Navigator (For now I removed it)
  updateTabList(tablist, isTabTitleQueryable, tabStatus) {
    if (this.disarmed) {
      return;
    }

    if (this.tabListInProgress) {
      console.log("In progress tablist building!");
      // setTimeout(this.updateTabList.bind(this, tablist, isTabTitleQueryable, tabStatus));
      return;
    }
    this.tabListInProgress = true;
    tablist.innerHTML = "";
    const thiz = this;
    chrome.windows.getAll(function (win) {
      win.forEach(function (v) {
        chrome.tabs.query({windowId: v.id}, function (tabInfos) {
          tabInfos.forEach(function (info) {
            const listItem = document.createElement("li");
            listItem.textContent = isTabTitleQueryable
              ? `${info.title} (${info.url})`
              : "(not available)";
            const button = document.createElement("button");
            button.innerHTML = "Preview";
            button.onclick = () => {
              thiz.disarm = true;

              thiz.previewing = true;

              chrome.windows.update(info.windowId, {
                focused: true
              }, function () {
                chrome.tabs.update(info.id, { active: true });
               
              });
              window.currentTimeout = setTimeout(function m() {
                clearTimeout(window.currentTimeout);
                
                chrome.tabs.getCurrent(function (tab) {
                  chrome.windows.update(tab.windowId, {
                    focused: true
                  }, function () {
                    chrome.tabs.update(tab.id, { active: true });
                    thiz.disarm = false;
                    thiz.previewing = false;
                  });
                  
                });
              }, 100);
            };
            tablist.appendChild(listItem);
            tablist.appendChild(button);
          });
          thiz.tabListInProgress = false;
          if (isTabTitleQueryable) {
            tabStatus.style.display = "none";
          } else {
            tabStatus.textContent =
              "(Some data might not be available, because the extension doesn't have the 'tabs' permission)";
          }
        });
      })
    });
  }
  activate() {
    document.write(DefaultExtensionCapabilities.template);
    // document.close();
     document.body.querySelectorAll("#code_evaluate").forEach(function (btn) {
       // alert("prepping button " + btn.id);
      btn.addEventListener("click", this.onBtnClick_.bind(this, btn));
     }, this);
    
  }
  static getFS() {
    return new Promise(function (resolve) {
      webkitRequestFileSystem(TEMPORARY, 2 * 1024 * 1024, resolve);
    });
  }
  /**
   * @param {HTMLButtonElement} b
   */
  async onBtnClick_(b) {
    switch (b.id) {
      case "code_evaluate": {
        console.log("Evaluating code!");
        const x = document.querySelector("#code_input").value;
        const fs = await DefaultExtensionCapabilities.getFS();
        function writeFile(file, data) {
          return new Promise((resolve, reject) => {
            fs.root.getFile(file, { create: true }, function (entry) {
              entry.remove(function () {
                fs.root.getFile(file, { create: true }, function (entry) {
                  entry.createWriter(function (writer) {
                    writer.write(new Blob([data]));
                    writer.onwriteend = resolve.bind(null, entry.toURL());
                  });
                });
              });
            });
          });
        }

        const url = await writeFile("src.js", x);
        let script =
          document.body.querySelector("#evaluate_elem") ??
          document.createElement("script");
        script.remove();
        script = document.createElement("script");
        script.id = "evaluate_elem";
        script.src = url;
        document.body.appendChild(script);
      }
    }
  }
}
class HostPermissions {
  activate() {}
}
function updateExtensionStatus(extlist_element) {
  return new Promise(function (resolve, reject) {
    extlist_element.innerHTML = "";
    chrome.management.getAll(function (extlist) {
      const ordlist = [];
      let e = 0;
      extlist.forEach(function (e) {
        if (e.id === new URL(new URL(location.href).origin).host) {
          return;
        }
        ordlist.push(e);
        const itemElement = document.createElement("li");
        itemElement.textContent = `${e.name} (${e.id}) `;
        const aElem = document.createElement('a');
        aElem.href = "javascript:void(0)";
        aElem.innerText = `${e.enabled ? "enabled" : "disabled"}`;
        aElem.onclick = function () {
          // alert(e.enabled);
          chrome.management.setEnabled(e.id, !e.enabled);
          setTimeout(function () {
            updateExtensionStatus(extlist_element);
          }, 200);
        }
        // e++;
        itemElement.appendChild(aElem);
        extlist_element.appendChild(itemElement);
        resolve();
      });
      savedExtList = ordlist;
    });
  });
}
const fileManagerPrivateTemplate = `
  <div id="fileManagerPrivate_cap">
    <div id="FMP_openURL">
      <button id="btn_FMP_openURL">Open URL in Skiovox window</button>
    </div>
  </div>

`
onload = async function x() {
  let foundNothing = true;
  document.open();
  if (chrome.fileManagerPrivate) {
    // alert(1);
    chrome.fileManagerPrivate.openURL("data:text/html,<h1>Hello</h1>");
    document.write(fileManagerPrivateTemplate);
    document.body.querySelector('#btn_FMP_openURL').onclick = function (ev) {
    };
  }
  if (chrome.management.setEnabled) {
    
    this.document.write(managementTemplate);
    const extlist_element = document.querySelector(".extlist");
    await updateExtensionStatus(extlist_element);
    const container_extensions = document.body.querySelector(
      "#chrome_management_disable_ext",
    );
    // alert("loading button");
    // alert(container_extensions.querySelector("button"));
    container_extensions.querySelector("#toggler").onclick = async function dx(e) {
      // open();
      container_extensions.querySelector("#toggler").disabled = true;
      
      let id = container_extensions.querySelector(".extnum").value;
      container_extensions.querySelector(".extnum").value = "";
      try {
        id = parseInt(id);
      } catch {
        return;
      }
      if (!savedExtList[id - 1]) {
        alert("Select extension from list!");
        container_extensions.querySelector("#toggler").disabled = false;
        return;
      }
      await new Promise(function (resolve) {
        chrome.management.setEnabled(
          savedExtList[id - 1].id,
          !savedExtList[id - 1].enabled,
          resolve,
        );
      });

      container_extensions.querySelector("#toggler").disabled = false;
      await updateExtensionStatus(extlist_element);
    };
    container_extensions.querySelector("#toggler").disabled = false;
  }
  const otherFeatures = window.chrome.runtime.getManifest();
  const permissions = otherFeatures.permissions;
  
  new DefaultExtensionCapabilities().activate();
};
