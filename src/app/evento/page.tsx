'use client';

import { ThemeProvider } from '../../contexts/ThemeContext';
import { EventEnrollmentPage } from '../../screens/EventEnrollmentPage';

export default function EventoRoute() {
  return (
    <ThemeProvider>
      <EventEnrollmentPage />
    </ThemeProvider>
  );
}
