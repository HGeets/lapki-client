import React, { useMemo, useState } from 'react';

import { toast } from 'sonner';

import { PlatformManager } from '@renderer/lib/data/PlatformManager';
import { useModelContext } from '@renderer/store/ModelContext';
import { EventData } from '@renderer/types/diagram';

import { Actions, Trigger, Condition, Event as EventPicto } from './components';
import { useTrigger, useActions, useCondition } from './hooks';

interface StateModalProps {
  canvasId: string;
  smId: string;
  stateId: string;
}

// EditEventModal но без модалки
export const StateModal: React.FC<StateModalProps> = ({ canvasId, smId, stateId }) => {
  const modelController = useModelContext();
  const controller = modelController.controllers[canvasId] ?? modelController.controllers[''];
  const controllerFound = Boolean(modelController.controllers[canvasId]);

  modelController.model.useData(smId, 'elements.states');

  const [currentEventIndex, setCurrentEventIndex] = useState<number | undefined>(undefined);

  const state = controller ? controller.states.get(stateId) : null;
  const platforms = (controller?.useData('platform') ?? {}) as { [id: string]: PlatformManager };
  const platform = platforms[smId];

  const currentEvent =
    state && currentEventIndex !== undefined ? state.data.events[currentEventIndex] : null;

  // хуки формы с EditEventModal опять да
  const trigger = useTrigger(smId, controller, true, currentEvent?.trigger);
  const condition = useCondition(smId, controller, currentEvent?.condition);
  const actions = useActions(smId, controller, currentEvent?.do ?? null);

  const showCondition = useMemo(
    () => trigger.selectedComponent !== 'System',
    [trigger.selectedComponent]
  );

  if (!controllerFound) {
    return (
      <div className="flex h-full w-full items-center justify-center text-text-inactive">
        Контроллер диаграммы не найден.
      </div>
    );
  }

  if (!state) {
    return (
      <div className="flex h-full w-full items-center justify-center text-text-inactive">
        Состояние не найдено (возможно, оно было удалено).
      </div>
    );
  }

  const selectEvent = (index: number) => {
    // сброс формы
    trigger.clear();
    actions.clear();
    condition.clear();
    setCurrentEventIndex(index);
  };

  const closeForm = () => {
    trigger.clear();
    actions.clear();
    condition.clear();
    setCurrentEventIndex(undefined);
  };

  const addEvent = () => {
    const newIndex = state.data.events.length;
    modelController.changeState({
      smId,
      id: state.id,
      events: [
        ...state.data.events,
        { trigger: { component: 'System', method: 'onEnter' }, do: [] },
      ],
    });
    setCurrentEventIndex(newIndex);
  };

  const removeEvent = () => {
    if (currentEventIndex === undefined) return;

    const newEvents =
      state.data.events.length === 1
        ? []
        : [
            ...state.data.events.slice(0, currentEventIndex),
            ...state.data.events.slice(currentEventIndex + 1),
          ];

    modelController.changeState({ smId, id: state.id, events: newEvents }, true);
    closeForm();
  };

  // handleSubmit из EditEventModal
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentEventIndex === undefined) return;

    const { selectedComponent, selectedMethod } = trigger;

    const getCondition = () => {
      const {
        show,
        isParamOneInput1,
        selectedComponentParam1,
        selectedMethodParam1,
        isParamOneInput2,
        selectedComponentParam2,
        selectedMethodParam2,
        argsParam1,
        argsParam2,
        conditionOperator,
        isElse,
      } = condition;

      if (!show || !showCondition) return undefined;
      if (isElse) return 'else';
      if (condition.tabValue === 0) {
        return {
          type: conditionOperator as string,
          value: [
            {
              type: isParamOneInput1 ? 'component' : 'value',
              value: isParamOneInput1
                ? {
                    component: selectedComponentParam1 as string,
                    method: selectedMethodParam1 as string,
                    args: {},
                  }
                : (argsParam1 as string),
            },
            {
              type: isParamOneInput2 ? 'component' : 'value',
              value: isParamOneInput2
                ? {
                    component: selectedComponentParam2 as string,
                    method: selectedMethodParam2 as string,
                    args: {},
                  }
                : (argsParam2 as string),
            },
          ],
        };
      }

      return condition.text.trim() || undefined;
    };

    const getTrigger = () => {
      if (trigger.tabValue === 0)
        return { component: selectedComponent as string, method: selectedMethod as string };
      return trigger.text.trim();
    };

    const getActions = () => {
      return actions.tabValue === 0 ? actions.actions : actions.text.trim();
    };

    const newEvent: EventData = {
      trigger: getTrigger(),
      condition: getCondition(),
      do: getActions(),
    };

    const newEvents =
      currentEventIndex >= state.data.events.length
        ? [...state.data.events, newEvent]
        : state.data.events.map((ev, i) => (i === currentEventIndex ? newEvent : ev));

    modelController.changeState({ smId, id: state.id, events: newEvents });
    toast.success('Событие сохранено!');
    closeForm();
  };

  return (
    <div className="flex h-full w-full">
      {/* слева список событий */}
      <div className="flex w-1/3 min-w-[240px] flex-col border-r border-border-primary">
        <div className="flex items-center justify-between gap-2 border-b border-border-primary bg-bg-secondary p-3">
          <h2 className="truncate text-lg font-bold">{state.data.name}</h2>
          <div className="flex gap-1">
            <button type="button" className="btn-secondary px-2 py-1 text-sm" onClick={addEvent}>
              + добавить
            </button>
            <button
              type="button"
              className="btn-secondary px-2 py-1 text-sm"
              onClick={removeEvent}
              disabled={currentEventIndex === undefined}
            >
              удалить
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-bg-secondary">
          {state.data.events.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-text-inactive">
              нет событий
            </div>
          ) : (
            state.data.events.map((event, i) => (
              <EventPicto
                key={i}
                smId={smId}
                event={event.trigger}
                isSelected={i === currentEventIndex}
                platform={platform}
                condition={event.condition}
                onClick={() => selectEvent(i)}
                onDoubleClick={() => selectEvent(i)}
              />
            ))
          )}
        </div>
      </div>

      {/* Trigger Condition Actions что и в EditEventModal */}
      <div className="flex-1 overflow-y-auto p-4">
        {currentEventIndex === undefined ? (
          <div className="flex h-full items-center justify-center text-text-inactive">
            выберите событие слева или нажмите «+ добавить»
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <Trigger event={currentEvent} {...trigger} />
            {showCondition && <Condition {...condition} />}
            <Actions event={currentEvent} {...actions} />
            <div className="flex justify-end gap-2 border-t border-border-primary pt-3">
              <button type="button" className="btn-secondary" onClick={closeForm}>
                Отмена
              </button>
              <button type="submit" className="btn-primary">
                Сохранить
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
