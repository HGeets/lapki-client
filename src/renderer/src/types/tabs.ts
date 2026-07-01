export type Language = 'xml' | 'json' | 'txt' | 'cpp';

export interface EditorTab {
  canvasId: string;
  type: 'editor';
  name: string;
}

export interface CodeTab {
  type: 'code' | 'transition' | 'state';
  name: string;
  language: Language;
  code: string;
}

export interface SerialMonitorTab {
  type: 'serialMonitor';
  name: string;
  isOpen: boolean;
}

export interface ManagerMSTab {
  type: 'managerMS';
  name: string;
}

export interface StateEditorTab {
  type: 'stateEditor';
  name: string;
  canvasId: string;
  smId: string;
  stateId: string;
}

export type Tab = EditorTab | CodeTab | SerialMonitorTab | ManagerMSTab | StateEditorTab;