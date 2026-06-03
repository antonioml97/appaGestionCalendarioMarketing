import { getOrganizationBundle } from '../../db/repository';
import {
  addDays,
  addMonths,
  eventsForDate,
  eventsForWeek,
  getMonthMatrix,
  groupEventsByDay,
  isSameDay,
  parseDateParam,
  startOfWeek,
} from '../../lib/calendar';
import { applyEventFilters, getWeeklyWorkload, resolveEvents } from '../../lib/planner';
import { buildHref } from '../../lib/url';
import type { CalendarView, EventStatus, PlannerUser } from '../../types/planner';

export const getCalendarPageData = async (url: URL, currentUser: PlannerUser) => {
  const dataset = await getOrganizationBundle(currentUser);
  const resolvedEvents = resolveEvents(dataset);
  const searchParams = url.searchParams;

  const validViews: CalendarView[] = ['month', 'week', 'day', 'agenda'];
  const view = validViews.includes(searchParams.get('view') as CalendarView)
    ? (searchParams.get('view') as CalendarView)
    : 'month';
  const focusDate = parseDateParam(searchParams.get('date'));
  const selectedClientIds = searchParams.getAll('client');
  const selectedTypeIds = searchParams.getAll('type');
  const selectedStatuses = searchParams.getAll('status') as EventStatus[];
  const search = searchParams.get('search') ?? '';
  const modal = searchParams.get('modal');
  const mobileScope = searchParams.get('scope') ?? 'month';
  const draftAtParam = searchParams.get('draftAt');

  const filteredEvents = applyEventFilters(resolvedEvents, {
    clientIds: selectedClientIds,
    typeIds: selectedTypeIds,
    statuses: selectedStatuses,
    search,
  });

  const selectedEventId = searchParams.get('event') ?? undefined;
  const selectedEvent =
    filteredEvents.find((event) => event.id === selectedEventId) ??
    resolvedEvents.find((event) => event.id === selectedEventId);

  const monthMatrix = getMonthMatrix(focusDate);
  const eventsByDay = new Map(
    monthMatrix.flat().map((day) => [day.key, eventsForDate(filteredEvents, day.date)]),
  );
  const weekItems = eventsForWeek(filteredEvents, focusDate);
  const dayEvents = eventsForDate(filteredEvents, focusDate);

  const agendaEvents = filteredEvents.filter((event) => {
    const eventDate = new Date(event.startsAt);

    if (mobileScope === 'day') return isSameDay(eventDate, focusDate);

    if (mobileScope === 'week') {
      const weekStart = startOfWeek(focusDate);
      const weekEnd = addDays(weekStart, 7);
      return eventDate >= weekStart && eventDate < weekEnd;
    }

    return (
      eventDate.getFullYear() === focusDate.getFullYear() &&
      eventDate.getMonth() === focusDate.getMonth()
    );
  });

  const agendaGroups = groupEventsByDay(agendaEvents);
  const desktopAgendaGroups = groupEventsByDay(filteredEvents);
  const workload = getWeeklyWorkload(filteredEvents, startOfWeek(focusDate));

  const previousDate =
    view === 'month'
      ? addMonths(focusDate, -1)
      : view === 'week'
        ? addDays(focusDate, -7)
        : addDays(focusDate, -1);
  const nextDate =
    view === 'month'
      ? addMonths(focusDate, 1)
      : view === 'week'
        ? addDays(focusDate, 7)
        : addDays(focusDate, 1);

  const clearEventHref = buildHref('/calendar', searchParams, { event: null, modal: null });
  const closeModalHref = buildHref('/calendar', searchParams, { modal: null, draftAt: null });
  const eventEditHref = selectedEvent
    ? buildHref('/calendar', searchParams, { modal: 'edit-event', event: selectedEvent.id })
    : '#';
  const redirectTo = buildHref('/calendar', searchParams, { modal: null, draftAt: null });
  const showEventModal =
    modal === 'new-event' || (modal === 'edit-event' && Boolean(selectedEvent));
  const modalEvent = modal === 'edit-event' ? selectedEvent : undefined;
  const draftStartsAt = (() => {
    if (modalEvent || !draftAtParam) {
      return undefined;
    }

    const parsed = new Date(draftAtParam);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
  })();

  return {
    dataset,
    resolvedEvents,
    searchParams,
    view,
    focusDate,
    selectedClientIds,
    selectedTypeIds,
    selectedStatuses,
    search,
    mobileScope,
    selectedEvent,
    monthMatrix,
    eventsByDay,
    weekItems,
    dayEvents,
    agendaGroups,
    desktopAgendaGroups,
    filteredEvents,
    workload,
    previousDate,
    nextDate,
    clearEventHref,
    closeModalHref,
    eventEditHref,
    redirectTo,
    showEventModal,
    modalEvent,
    draftStartsAt,
  };
};
