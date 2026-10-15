const eventLabels: Record<string, string> = {
  PROJECT_CREATED: 'Проект создан',
  CLIENT_JOINED_PROJECT: 'Клиент подключён к проекту',

  REQUEST_CREATED: 'Создан запрос',
  REQUEST_UPDATED: 'Запрос обновлён',

  TASK_CREATED: 'Создана задача',
  TASK_UPDATED: 'Задача обновлена',
  TASK_COMPLETED: 'Задача завершена',

  MATERIAL_ADDED: 'Добавлен материал',
  MATERIAL_SHARED: 'Материал опубликован',

  VERSION_CREATED: 'Создана новая версия',

  COMMENT_ADDED: 'Добавлен комментарий',

  MESSAGE_SENT: 'Отправлено сообщение',

  APPROVAL_REQUESTED: 'Запрошено согласование',
  APPROVED: 'Материал согласован',
  CHANGES_REQUESTED: 'Запрошены изменения',

  DECISION_CREATED: 'Принято решение',
  SELECTION_CREATED: 'Сделан выбор',

  NOTIFICATION_SENT: 'Отправлено уведомление',
};

export function getEventLabel(eventType: string): string {
  return eventLabels[eventType] ?? eventType;
}

export function getVisibilityLabel(visibility: string): string {
  switch (visibility) {
    case 'CLIENT':
      return 'Для клиента';

    case 'INTERNAL':
      return 'Внутреннее';

    default:
      return visibility;
  }
}
