import { Ticket, TicketHistory, User } from './src/models/index.js';
import { sequelize } from './src/config/database.js';
import fs from 'fs';

async function debug() {
    let log = '\n--- Ticket History Trace ---\n\n';
    try {
        const ticket = await Ticket.findOne({
            where: { ticketNumber: 'T-20260302-0001' },
            include: ['queue', 'step']
        });

        if (!ticket) {
            log += 'Ticket not found!\n';
        } else {
            log += `Ticket: ${ticket.ticketNumber}\n`;
            log += `ID: ${ticket.ticketId}\n`;
            log += `Status: ${ticket.status}\n`;
            log += `Queue: ${ticket.queue?.name}\n`;
            log += `Step: ${ticket.step?.name}\n\n`;

            const history = await TicketHistory.findAll({
                where: { ticketId: ticket.ticketId },
                include: [{ model: User, as: 'actor', attributes: ['username'] }],
                order: [['occurredAt', 'ASC']]
            });

            log += 'HISTORY:\n';
            history.forEach(h => {
                log += `  - [${h.occurredAt.toISOString()}] EVENT: ${h.event}\n`;
                log += `    Status: ${h.fromStatus} -> ${h.toStatus}\n`;
                log += `    Actor: ${h.actor?.username || 'SYSTEM'}\n`;
                log += `    Details: ${h.details || 'None'}\n`;
                log += '    ----------------\n';
            });
        }
    } catch (error) {
        log += `ERROR: ${error.message}\n`;
    } finally {
        fs.writeFileSync('ticket_trace.log', log);
        await sequelize.close();
        process.exit(0);
    }
}

debug();
