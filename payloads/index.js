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

class DefaultExtensionCapabilities {
  static template = `
  <div id="default_ext_capabilities">
    <div id="extension_eval_cap">
      <h1>Evaluate code within extension</h1>
      <input type="text" /><button id="code_evaluate">Evaluate</button>
    </div>
    <div id="tab_cap">
        <h1> chrome.tabs.update Navigate Websites </h1>
        <p class="tab_load_status">Loading...</p>
        <ol class="tablist">
          
        </ol>
        
    </div>
    <div id="window_cap">
  </div>
  
  `;
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
    document.body.innerHTML += DefaultExtensionCapabilities.template;
    document.body.querySelectorAll("button").forEach(function (btn) {
      btn.onclick = this.onBtnClick_.bind(this, btn);
    }, this);
    const tabCapabilityElem = document.body.querySelector("#tab_cap");
    const tablist = tabCapabilityElem.querySelector(".tablist");
    const tabStatus = tabCapabilityElem.querySelector(".tab_load_status");
    const isTabTitleQueryable = chrome.runtime
      .getManifest()
      .permissions.includes("tabs");
    const updateCallback = this.updateTabList.bind(
      this,
      tablist,
      isTabTitleQueryable,
      tabStatus,
    );
    for (const ev in chrome.tabs) {
      if (ev.startsWith("on")) {
        chrome.tabs[ev].addListener(updateCallback);
      }
    }
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
        const x = b.parentElement.querySelector("input").value;
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
  let foundNothing = true;
  if (chrome.management.setEnabled) {
    if (foundNothing) {
      foundNothing = false;
      window.document.body.innerHTML = "";
    }
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
  const otherFeatures = window.chrome.runtime.getManifest();
  const permissions = otherFeatures.permissions;
  if (foundNothing) {
    foundNothing = false;
    window.document.body.innerHTML = "";
  }
  new DefaultExtensionCapabilities().activate();
};
