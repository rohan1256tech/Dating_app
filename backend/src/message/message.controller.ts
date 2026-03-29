import { Body, Controller, DefaultValuePipe, Get, Param, ParseIntPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SendMessageDto } from './dto/send-message.dto';
import { MessageService } from './message.service';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class MessageController {
    constructor(private readonly messageService: MessageService) { }

    @Get('health')
    getHealth() {
        return { status: 'ok', version: '1.0.1' };
    }

    @Get(':matchId')
    async getMessages(
        @Req() req: any,
        @Param('matchId') matchId: string,
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
    ) {
        const userId = req.user.userId;
        return this.messageService.getMessages(userId, matchId, page, limit);
    }

    @Post('send')
    async sendMessage(@Req() req: any, @Body() sendMessageDto: SendMessageDto) {
        const userId = req.user.userId;
        return this.messageService.sendMessage(userId, sendMessageDto);
    }

    @Patch('read/:matchId')
    async markAsRead(@Req() req: any, @Param('matchId') matchId: string) {
        const userId = req.user.userId;
        return this.messageService.markMessagesAsRead(userId, matchId);
    }

    @Get('unread/count')
    async getUnreadCount(@Req() req: any) {
        const userId = req.user.userId;
        return this.messageService.getUnreadCount(userId);
    }
}
