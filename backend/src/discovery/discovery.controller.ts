import { Body, Controller, Get, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DiscoveryService } from './discovery.service';
import { CreateSwipeDto } from './dto/create-swipe.dto';
import { UpdateMapLocationDto } from './dto/update-map-location.dto';
import { SwipeLimitGuard } from './guards/swipe-limit.guard';

@Controller('discovery')
@UseGuards(JwtAuthGuard)
export class DiscoveryController {
    constructor(private readonly discoveryService: DiscoveryService) { }

    @Get('cards')
    async getCards(@Req() req: any) {
        const userId = req.user.userId;
        return this.discoveryService.getPotentialMatches(userId);
    }

    // SwipeLimitGuard applied AFTER JwtAuthGuard — enforces daily limit for FREE users
    @Post('swipe')
    @UseGuards(SwipeLimitGuard)
    async swipe(@Req() req: any, @Body() createSwipeDto: CreateSwipeDto) {
        const userId = req.user.userId;
        return this.discoveryService.swipe(userId, createSwipeDto);
    }

    @Get('nearby')
    async getNearbyUsers(
        @Req() req: any,
        @Query('maxDistance') maxDistance?: string
    ) {
        const userId = req.user.userId;
        const requestedDistance = maxDistance ? parseInt(maxDistance, 10) : 5000;
        return this.discoveryService.getNearbyUsers(userId, requestedDistance);
    }

    @Patch('map-location')
    async updateMapLocation(
        @Req() req: any,
        @Body() updateMapLocationDto: UpdateMapLocationDto
    ) {
        const userId = req.user.userId;
        return this.discoveryService.updateMapLocation(
            userId,
            updateMapLocationDto.latitude,
            updateMapLocationDto.longitude,
            updateMapLocationDto.showOnMap ?? false
        );
    }
}
