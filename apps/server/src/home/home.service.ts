import { HomeResponseSchema, type HomeResponse } from "@guoxue/contracts";
import type { AppConfig } from "../config/env.js";
import type { CalendarService } from "../calendar/calendar.service.js";
import type { GuidanceService } from "../guidance/guidance.service.js";

export class HomeService {
  constructor(
    private readonly config: AppConfig,
    private readonly calendarService: CalendarService,
    private readonly guidanceService: GuidanceService,
  ) {}

  getForDate(date: string): HomeResponse {
    const calendar = this.calendarService.getForDate(date);
    const guidance = this.guidanceService.getOrCreateForDate(date);

    return HomeResponseSchema.parse({
      date,
      weekday: calendar.weekday,
      calendar: calendar.calendar,
      guidance: guidance.guidance,
      links: this.config.links,
    });
  }
}
