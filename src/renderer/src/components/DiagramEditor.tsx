import { useEffect, useRef, useState } from 'react';
import { useTabs } from '@renderer/store/useTabs';
import {
  NoteEdit,
  StateNameEdit,
  ActionsModal,
  ActionsModalData,
  StateModal,
  TransitionModal,
  StateMachineNameEdit,
  EditEventModal,
} from '@renderer/components';
import { useEditEventModal, useSettings } from '@renderer/hooks';
import { useModal } from '@renderer/hooks/useModal';
import { CanvasEditor } from '@renderer/lib/CanvasEditor';
import { CanvasController } from '@renderer/lib/data/ModelController/CanvasController';
import { EventSelection, State } from '@renderer/lib/drawable';
import { Point } from '@renderer/lib/types';
import { useModelContext } from '@renderer/store/ModelContext';
import { getColor } from '@renderer/theme';
import { Event } from '@renderer/types/diagram';
interface DiagramEditorProps {
  editor: CanvasEditor;
  controller: CanvasController;
}

export const DiagramEditor: React.FC<DiagramEditorProps> = (props: DiagramEditorProps) => {
  const editor = props.editor;
  const controller = props.controller;
  const [canvasSettings] = useSettings('canvas');
  const modelController = useModelContext();
  const stateMachines = Object.keys(controller.stateMachinesSub);
  const [smId, setSmId] = useState<string>(stateMachines[0]); // TODO(L140-beep): Как понять с какой именно МС мы работаем в данный момент?
  const isMounted = controller.useData('isMounted');
  const containerRef = useRef<HTMLDivElement>(null);

  const eventModal = useEditEventModal();
  const [isActionsModalOpen, openActionsModal, closeActionsModal] = useModal(false);
  const [actionsModalData, setActionsModalData] = useState<ActionsModalData>();
  // Дополнительные данные о родителе события
  const [actionsModalParentData, setActionsModalParentData] = useState<{
    state: State;
    eventSelection: EventSelection;
  }>();

  const style = {
    backgroundColor: getColor('bg-primary'),
  };

  useEffect(() => {
    if (!containerRef.current || controller.id === '') return;
    editor.mount(containerRef.current);

    const handleDblclick = (position: Point) => {
      if (controller.type === 'scheme') return;
      modelController.createState({
        smId: smId,
        name: 'Состояние',
        events: [],
        dimensions: { width: 450, height: 100 },
        position,
        placeInCenter: true,
      });
    };

    // НАШ НОВЫЙ ОБРАБОТЧИК ДЛЯ ВКЛАДОК
    const handleChangeState = (state: State) => {
      if (controller.type === 'scheme') return;
      
      const tabName = `State: ${state.data.name ?? 'Без названия'}`;
      
      // Передаем modelController первым аргументом, а объект вкладки — вторым
      useTabs.getState().openTab(modelController, {
        type: 'state_editor',    // Ваш кастомный тип вкладки для редактора состояний
        name: tabName,
        canvasId: controller.id,
        nodeId: state.id,        // Передаем ID конкретного состояния
      } as any);                 // as any спасет от ругани TS, если в типе Tab жесткий enum типов
      
      setSmId(state.smId);
    };

    const handleChangeEvent = (data: {
      state: State;
      eventSelection: EventSelection;
      event: Event;
      isEditingEvent: boolean;
    }) => {
      if (controller.type === 'scheme') return;
      const { state, eventSelection, event, isEditingEvent } = data;

      if (eventSelection.actionIdx !== null) {
        setActionsModalParentData({ state, eventSelection });
        setActionsModalData({ smId: state.smId, action: event, isEditingEvent });
        openActionsModal();
      } else {
        eventModal.setState(state);
        eventModal.setCurrentEventIdx(eventSelection.eventIdx);
        eventModal.setCurrentEvent(state.data.events[eventSelection.eventIdx]);
        eventModal.openEditEventModal();
      }
      setSmId(state.smId);
    };

    // Подписываемся на события
    editor.view.on('dblclick', handleDblclick);
    editor.controller.states.on('changeEvent', handleChangeEvent);
    editor.controller.states.on('changeState', handleChangeState); // ПОДПИСКА ТУТ

    //! Не забывать удалять слушатели
    return () => {
      editor.view.off('dblclick', handleDblclick);
      editor.controller.states.off('changeEvent', handleChangeEvent);
      editor.controller.states.off('changeState', handleChangeState); // ОЧИСТКА ТУТ
      editor.unmount();
    };
  }, [editor, eventModal.openEditEventModal, openActionsModal, controller, modelController, smId]); 
  // Обновили зависимости useEffect, чтобы ts не ругался
  useEffect(() => {
    if (!canvasSettings) return;
    editor.setSettings(canvasSettings);
  }, [canvasSettings, editor]);

  const handleActionsModalSubmit = (data: Event) => {
    if (!actionsModalParentData) return;

    modelController.changeEvent({
      smId: actionsModalParentData.state.smId,
      stateId: actionsModalParentData.state.id,
      event: actionsModalParentData.eventSelection,
      newValue: data,
    });

    closeActionsModal();
  };

  return (
    <>
      <div style={style} className="relative h-full overflow-hidden" ref={containerRef}></div>

      {isMounted && (
        <>
          <StateNameEdit smId={smId} controller={controller} />
          <NoteEdit smId={smId} controller={controller} />
          <StateMachineNameEdit controller={controller} />
          {/* 
            Здесь находятся модалки, которые вызываются через взаимодействие с канвасом. 
            Модалки могут дублироваться по кодовой базе, если они вызываются другим способом.
          */}
          <EditEventModal
            close={eventModal.closeEditEventModal}
            event={eventModal.currentEvent}
            state={eventModal.state}
            currentEventIndex={eventModal.currentEventIdx}
            isOpen={eventModal.props.isEditEventModalOpen}
            smId={smId}
            controller={controller}
          />
          <TransitionModal controller={controller} smId={smId} />
          <ActionsModal
            idx={actionsModalParentData?.eventSelection.actionIdx ?? null}
            controller={controller}
            smId={smId}
            initialData={actionsModalData}
            onSubmit={handleActionsModalSubmit}
            isOpen={isActionsModalOpen}
            onClose={closeActionsModal}
          />
        </>
      )}
    </>
  );
};
