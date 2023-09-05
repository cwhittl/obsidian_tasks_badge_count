const { app, BrowserWindow, Menu, ipcRenderer } = require('electron');
const isWindows = process.platform === 'win32';
const preferences = require('./preferences');

preferences.on('save', preferences => {
    getTasks();
});

preferences.on('click', (key) => {
    if (key === 'saveSettings') {
        getTasks();
    }
});

//How often do you want to update
const interval = 30000

function init() {
    //We just want to open obsidan
    openObsidian()
    //Get the tasks and start the watch
    getTasks();
    setInterval(getTasks, interval);
}

function openObsidian() {
    // require('electron').shell.openExternal("obsidian://");
}


app.whenReady().then(() => {
    setMainMenu();
    if (process.platform === 'darwin') {
        app.dock.setMenu(dockMenu)
    }
    app.on('did-become-active', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            openObsidian()
        }
    })
    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') {
            app.quit()
        }
    })
    init()
})

function getTasks() {
    const rawAuth = preferences.value('settings.authentication');
    if (!rawAuth || rawAuth.length < 0) {
        preferences.setLastMessage('Please Set Authentication');
        openSettingsWindow();
    } else {
        preferences.setLastMessage('');
        //Where are your templates stored so we can ignore those
        const templateFolder = preferences.value('settings.templateFolderName');

        //Get this from the plugin settings
        const port = preferences.value('settings.port')
        const protocol = preferences.value('settings.protocol')
        const hostname = preferences.value('settings.hostName');
        const authorization = preferences.decrypt(rawAuth);

        //Make sure these are set in your Plugin
        const contentType = 'application/vnd.olrapi.dataview.dql+txt'
        const accept = 'application/json';


        const taskQuery = `TABLE WITHOUT ID Tasks.text AS Task, 
choice(Tasks.completed, "completed", "incompleted") AS Status, Tasks.completion AS "Completion Date", 
Tasks.due AS "Due Date", Tasks.created AS "Created Date", Tasks.priority AS "Priority",  Tasks.path AS "Path", file.link AS "File",
regexreplace(Tasks.subtasks.text, "\[.*$", "") AS Subtasks, 
choice(Tasks.subtasks.completed, "completed", "incompleted") AS "Subtasks status"
WHERE file.tasks
FLATTEN file.tasks AS Tasks
WHERE Tasks.text != "" AND !contains(Tasks.path, "${templateFolder}") AND !Tasks.completed AND (Tasks.due = null OR date(Tasks.due) < date("tomorrow"))
SORT Tasks.due DESC, Tasks.created DESC`
        const { net } = require('electron');
        const request = net.request({
            method: 'POST',
            protocol,
            hostname,
            path: '/search',
            port
        });
        request.on('response', (response) => {
            response.on('data', (chunk) => {
                try {
                    app.setBadgeCount(JSON.parse(chunk).length)
                    preferences.setLastMessage("OK")
                } catch (error) {
                    const errorText = JSON.stringify(error);
                    if (errorText != '{}') {
                        preferences.setLastMessage(`${JSON.stringify(error)}`)
                    }
                }
            });
        });
        request.on('error', (error) => {
            const errorText = error.toString();
            if (errorText.indexOf('net::ERR_CERT_AUTHORITY_INVALID') > -1) {
                preferences.setLastMessage(`It looks like your setup won't handle https, in the plugin settings please change it to run in non-encrypted and update the port and protocol in this apps settings`)
            } else {
                preferences.setLastMessage(`There is an error with the server setup in your Local API plugin or it is not running.  Please make sure that is running and the plugin settings match what you have in this apps settings. `)
            }
        });
        request.setHeader('Content-Type', contentType);
        request.setHeader('accept', accept);
        request.setHeader('Authorization', 'Bearer ' + authorization);
        request.end(taskQuery);
    }
}

function openSettingsWindow() {
    preferences.show();
}

const dockMenu = Menu.buildFromTemplate([
    {
        label: 'Settings',
        click() {
            openSettingsWindow()
        }
    }
])

function setMainMenu() {
    const template = [
        {
            label: isWindows ? 'File' : app.getName(),
            submenu: [
                {
                    label: 'Open Obsidian',
                    click() {
                        openObsidian()
                    }
                },
                {
                    label: 'Settings',
                    click() {
                        openSettingsWindow()
                    }
                },
                {
                    label: isWindows ? 'Exit' : `Quit ${app.getName()}`,
                    accelerator: isWindows ? null : 'CmdOrCtrl+Q',
                    click() {
                        app.quit();
                    }
                }
            ]
        }, {
            label: "Edit",
            submenu: [
                { label: "Undo", accelerator: "CmdOrCtrl+Z", selector: "undo:" },
                { label: "Redo", accelerator: "Shift+CmdOrCtrl+Z", selector: "redo:" },
                { type: "separator" },
                { label: "Cut", accelerator: "CmdOrCtrl+X", selector: "cut:" },
                { label: "Copy", accelerator: "CmdOrCtrl+C", selector: "copy:" },
                { label: "Paste", accelerator: "CmdOrCtrl+V", selector: "paste:" },
                { label: "Select All", accelerator: "CmdOrCtrl+A", selector: "selectAll:" }
            ]
        }
    ];
    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}