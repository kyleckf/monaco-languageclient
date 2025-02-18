/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as vscode from 'vscode';
import getKeybindingsServiceOverride from '@codingame/monaco-vscode-keybindings-service-override';
import {
    RegisteredFileSystemProvider,
    RegisteredMemoryFile,
    registerFileSystemOverlay
} from '@codingame/monaco-vscode-files-service-override';
// this is required syntax highlighting
import '@codingame/monaco-vscode-java-default-extension';
import {MonacoEditorLanguageClientWrapper, type WrapperConfig} from 'monaco-editor-wrapper';
import {LogLevel} from '@codingame/monaco-vscode-api';
import {eclipseJdtLsConfig} from '../config.js';
import helloJavaCode
    from '../../../resources/eclipse.jdt.ls/workspace/myProject/src/main/java/com/example/Hello.java?raw';
import {configureMonacoWorkers} from '../../common/client/utils.js';
import * as monaco from 'monaco-editor';
import './styles.css';

export const runEclipseJdtLsClient = () => {
    const helloJavaUri = vscode.Uri.file(`${eclipseJdtLsConfig.basePath}/workspace/myProject/src/main/java/com/example/Hello.java`);
    const fileSystemProvider = new RegisteredFileSystemProvider(false);
    fileSystemProvider.registerFile(new RegisteredMemoryFile(helloJavaUri, helloJavaCode));
    registerFileSystemOverlay(1, fileSystemProvider);

    const wrapperConfig: WrapperConfig = {
        $type: 'extended',
        htmlContainer: document.getElementById('monaco-editor-root')!,
        logLevel: LogLevel.Debug,
        vscodeApiConfig: {
            serviceOverrides: {
                ...getKeybindingsServiceOverride(),
            },
            userConfiguration: {
                json: JSON.stringify({
                    'workbench.colorTheme': 'Default Dark Modern',
                    'editor.guides.bracketPairsHorizontal': 'active',
                    'editor.wordBasedSuggestions': 'off',
                    'editor.experimental.asyncTokenization': true,
                    'editor.folding': true,
                    'editor.foldingStrategy': 'auto',
                    'editor.showFoldingControls': 'always',
                    'editor.minimap.enabled': false, // Hide minimap
                    'editor.fontSize': 14,
                    // 'editor.readOnly': true,
                })
            }
        },
        editorAppConfig: {
            codeResources: {
                // original: {
                //     text: helloJavaCode,
                //     uri: `${eclipseJdtLsConfig.basePath}/workspace/hello.java`
                // },
                modified: {
                    text: helloJavaCode,
                    uri: `${eclipseJdtLsConfig.basePath}/workspace/myProject/src/main/java/com/example/Hello.java`
                }
            },
            monacoWorkerFactory: configureMonacoWorkers,
            // This is the enable diff viewer
            // useDiffEditor: true,
            // diffEditorOptions: {
            //     renderSideBySide: true
            // }
        },
        languageClientConfigs: {
            java: {
                connection: {
                    options: {
                        $type: 'WebSocketUrl',
                        url: 'ws://127.0.0.1:30003/jdtls'
                    }
                },
                clientOptions: {
                    documentSelector: ['java'],
                    workspaceFolder: {
                        index: 0,
                        name: 'myProject',
                        uri: vscode.Uri.parse(`${eclipseJdtLsConfig.basePath}/workspace/myProject`)
                    },
                }
            }
        }
    };

    const wrapper = new MonacoEditorLanguageClientWrapper();

    const hideLines = async (editor: monaco.editor.IStandaloneCodeEditor, startLine: number, endLine: number) => {
        editor.setSelection(new monaco.Selection(startLine, 1, endLine, 1));

        await editor.getAction('editor.createFoldingRangeFromSelection')?.run();
    }


    try {
        document.querySelector('#button-start')?.addEventListener('click', async () => {
            await wrapper.init(wrapperConfig);

            // open files, so the LS can pick it up
            await vscode.workspace.openTextDocument(helloJavaUri);

            await wrapper.start();

            const editor = wrapper.getEditor();
            if (editor) {
                setTimeout(async () => {
                    // @ts-ignore
                    await hideLines(editor, 1, 19);
                    // @ts-ignore
                    await hideLines(editor, 23, editor.getModel()?.getLineCount());
                }, 100)
            }

        });
        document.querySelector('#button-dispose')?.addEventListener('click', async () => {
            await wrapper.dispose();
        });
    } catch (e) {
        console.error(e);
    }
};
