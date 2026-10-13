// Cached Intl formatters for high-performance rendering without GC pressure
const ptBrWeekdayFormatter = new Intl.DateTimeFormat('pt-BR', { weekday: 'short' });
const ptBrMonthFormatter = new Intl.DateTimeFormat('pt-BR', { month: 'short' });
const ptBrTimeFormatter = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' });

export function formatWeekdayShort(dateInput: string | Date): string {
  try {
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    return ptBrWeekdayFormatter.format(d).replace('.', '');
  } catch {
    return '';
  }
}

export function formatMonthShort(dateInput: string | Date): string {
  try {
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    return ptBrMonthFormatter.format(d).replace('.', '');
  } catch {
    return '';
  }
}

export function formatTimeShort(dateInput: string | Date): string {
  try {
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    return ptBrTimeFormatter.format(d);
  } catch {
    return '';
  }
}

export function getDayOfMonth(dateInput: string | Date): number {
  try {
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    return d.getDate();
  } catch {
    return 1;
  }
}
