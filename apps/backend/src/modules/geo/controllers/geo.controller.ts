import { Controller, Get, Query } from '@nestjs/common';
import { GeoService } from '../services/geo.service';
import { ResolveTimezoneDto } from '../dto/resolve-timezone.dto';

@Controller('geo')
export class GeoController {
  constructor(private readonly geo: GeoService) {}

  @Get('timezone')
  resolveTimezone(@Query() query: ResolveTimezoneDto) {
    return this.geo.resolveTimezone(query.lat, query.lng);
  }
}
