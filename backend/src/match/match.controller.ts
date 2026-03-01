import { Controller, Delete, Get, Param, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MatchService } from './match.service';

@Controller('matches')
@UseGuards(JwtAuthGuard)
export class MatchController {
    constructor(private readonly matchService: MatchService) { }

    @Get()
    async getMyMatches(@Req() req: any) {
        const userId = req.user.userId;
        return this.matchService.getUserMatches(userId);
    }

    @Delete(':matchId')
    async deleteMatch(@Req() req: any, @Param('matchId') matchId: string) {
        const userId = req.user.userId;
        return this.matchService.deleteMatch(userId, matchId);
    }
}
