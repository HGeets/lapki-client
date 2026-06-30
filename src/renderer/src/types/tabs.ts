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

// --- Новая структура для вкладки редактора состояний ---
export interface StateEditorTab {
  type: 'state_editor';
  name: string;
  canvasId: string; // ID диаграммы (для получения ModelController)
  nodeId: string;   // ID конкретного узла состояния на холсте
}

// Добавляем StateEditorTab в общее объединение (union type)
export type Tab = 
  | EditorTab 
  | CodeTab 
  | SerialMonitorTab 
  | ManagerMSTab 
  | StateEditorTab;