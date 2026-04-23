import { Injectable } from '@nestjs/common';
import { find as findTimezone } from 'geo-tz';

@Injectable()
export class GeoService {
  resolveTimezone(lat: number, lng: number): { timezone: string | null } {
    const zones = findTimezone(lat, lng);
    return { timezone: zones[0] ?? null };
  }
}
