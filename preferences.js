'use strict';

const electron = require('electron');
const { Menu } = electron;
const path = require('path');
const os = require('os');
const ElectronPreferences = require('electron-preferences');

const preferences = new ElectronPreferences({
    dataStore: path.resolve(__dirname, 'preferences.json'),
    defaults: {
        settings: {
            protocol: 'https:',
            port: '27124',
            authentication: '',
            templateFolderName: 'TPL',
        },
    },
    // debug: true, // True will open the dev tools
    webPreferences: {
        webSecurity: true,
    },
    menuBar: Menu.buildFromTemplate(
        [{
            label: 'Window',
            role: 'window',
            submenu: [{
                label: 'Close',
                accelerator: 'CmdOrCtrl+W',
                role: 'close',
            },],
        },],
    ),
    browserWindowOverrides: {
        title: 'Obsidian Tasks Badge Count',
        modal: true,
    },
    sections: [{
        id: 'settings',
        label: 'Settings',
        icon: 'settings-gear-63',
        form: {
            groups: [{
                label: 'Settings',
                id: 'settings',
                fields: [
                    {
                        heading: 'Last Message',
                        key: 'lastError',
                        type: 'message',
                        content: 'Please Set Authentication',
                    },
                    {
                        label: 'Protocol',
                        key: 'protocol',
                        type: 'dropdown',
                        options: [
                            { label: 'http', value: 'http:' },
                            { label: 'https', value: 'https:' },
                        ],
                        help: 'What protocol is your plugin listening on?  **Note I have had the best when switched to http but that must be changed in the plugin also',
                    },
                    {
                        label: 'Port',
                        key: 'port',
                        type: 'text',
                        inputType: 'number',
                        help: 'What port number is your plugin listening on?'
                    },
                    {
                        label: 'Authentication Key',
                        key: 'authentication',
                        type: 'secret',
                        help: 'What is the secret your plugin is using?'
                    },
                    {
                        label: 'Folder Name Where Templates are Stored (NOT PATH, Just Name)',
                        key: 'templateFolderName',
                        type: 'text',
                        help: 'What folder do you want excluded from the query, change this to some random letters if their are none'
                    },
                    {
                        label: 'Save Settings',
                        key: 'saveSettings',
                        type: 'button',
                    },
                ],
            },],
        },
    }, {
        id: 'about',
        label: 'About',
        icon: 'single-01',
        form: {
            groups: [{
                label: 'About This App',
                id: 'about',
                fields: [
                    {
                        type: 'message',
                        content: `<h1 id="obsidian-task-badge-count">Obsidian Task Badge Count</h1>
                        <p>This project is to work around the lack of badge counts in Obsidian.  If you work for obsidian, all you need to do to retire this app is to allow plugins to set badge counts.</p>
                        <p>All it does is look using the <a href="https://github.com/coddingtonbear/obsidian-local-rest-api">Local Rest API</a> plugin it pulls the tasks in your vault that are not completed.</p>
                        <p>This has only been used on MacOS but it SHOULD work on Windows and some Linux flavors.  </p>
                        <p>Please feel free to contribute if you want to make this better.</p>
                        <h2 id="requirements">Requirements</h2>
                        <ul>
                        <li><a href="https://obsidian.md/">Obsidian.md</a></li>
                        <li><a href="https://github.com/coddingtonbear/obsidian-local-rest-api">Obsidan Local Rest API Plugin</a></li>
                        </ul>
                        <h2 id="authors">Authors</h2>
                        <ul>
                        <li><a href="https://www.github.com/cwhittl">@cwhittl</a></li>
                        </ul>
                        <h2 id="installation">Installation</h2>
                        <p>Grab the appropriate release and put it in your computers appropriate location.</p>
                        <h2 id="license">License</h2>
                        <p><a href="https://choosealicense.com/licenses/mit/">MIT</a></p>
                        <h2 id="tech-stack">Tech Stack</h2>
                        <p><strong>Client:</strong> ElectronJS</p>
                        `,
                    },
                ]
            }]
        }
    }
    ],
});
preferences.setLastMessage = errorMessage => {
    //FYI this is garbage, but I was tring to use a shortcut and it didn't offer me a way to set or refresh the message.. So this is it.
    var lastErrorObj = preferences.options.sections.find(s => s.id === "settings")?.form.groups.find(g => g.label === "Settings")?.fields.find(f => f.key === "lastError");
    if (lastErrorObj.content != errorMessage && !(lastErrorObj.content == "OK" || errorMessage == "")) {
        lastErrorObj.content = errorMessage;
        preferences.close()
        setTimeout(() => { preferences.show() }, 500);
    }
}

module.exports = preferences;