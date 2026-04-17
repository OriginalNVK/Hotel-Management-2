import prisma from '../database/ConnectSQL.mjs';
import BookingModel from './BookingModel.mjs';

// Invoice: {InvoiceId, InvoiceDate, Amount, representative} (representative is the InvoiceId of the Customer)

export default class InvoiceModel {
  static async getAllInvoices() {
    const invoices = await prisma.invoice.findMany();
    return invoices;
  }

  static async getInvoiceInfo(InvoiceId) {
    const invoiceIdInt = Number.parseInt(InvoiceId, 10);
    if (Number.isNaN(invoiceIdInt)) {
      return null;
    }

    const invoice = await prisma.invoice.findUnique({
      where: { invoiceId: invoiceIdInt },
      include: {
        representative: {
          select: { name: true, address: true },
        },
        bookings: {
          include: {
            room: {
              include: {
                roomType: {
                  select: {
                    price: true,
                    surchargeRate: true,
                    minCustomerForSurcharge: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!invoice) return null;

    return {
      InvoiceDate: invoice.invoiceDate,
      Representative: {
        Name: invoice.representative?.name || '',
        Address: invoice.representative?.address || '',
      },
      Bookings: invoice.bookings.map(b => ({
        RoomNumber: b.roomId,
        Nights: Math.max(
          1,
          Math.floor(
            (invoice.invoiceDate.getTime() - b.bookingDate.getTime()) / (1000 * 60 * 60 * 24)
          )
        ),
        Price: b.room.roomType.price,
        SurchargeRate: b.room.roomType.surchargeRate,
        Amount: b.cost,
        Coefficient: 1, // You may need to calculate this from customer types
        ExtraCustomers: 0, // You may need to calculate this
      })),
      Amount: invoice.amount,
    };
  }

  static async CreateInvoice(bookings, representativeId) {
    let Amount = 0;
    const bookingCosts = [];
    for (const booking of bookings) {
      const bookingIdInt = Number.parseInt(booking, 10);
      if (Number.isNaN(bookingIdInt)) continue;
      const cost = await BookingModel.CalcCost(bookingIdInt);
      bookingCosts.push({ bookingId: bookingIdInt, cost });
      Amount += cost;
    }

    // Get current date
    const getCheckOutDate = () => {
      const now = new Date();
      const year = now.getUTCFullYear();
      const month = String(now.getUTCMonth() + 1).padStart(2, '0');
      const day = String(now.getUTCDate()).padStart(2, '0');

      return new Date(`${year}-${month}-${day}`);
    };

    const InvoiceDate = getCheckOutDate();
    
    const createdInvoice = await prisma.invoice.create({
      data: {
        invoiceDate: InvoiceDate,
        amount: Amount,
        representativeId: Number.parseInt(representativeId, 10),
      },
    });

    const invoiceId = createdInvoice.invoiceId;
    
    // Update bookings with invoice and calculated cost
    for (const booking of bookingCosts) {
      await BookingModel.updateBooking(
        booking.bookingId,
        null,
        null,
        invoiceId,
        booking.cost
      );
    }

    // Update report tables using migrated PostgreSQL functions.
    // Cast explicitly to INT to avoid bigint/int function signature mismatch.
    try {
      await prisma.$executeRaw`SELECT public.update_all_reports(${Number.parseInt(invoiceId, 10)}::int)`;
    } catch (error) {
      // Do not fail invoice creation if report refresh fails.
      console.error('Failed to update reports after invoice creation:', error);
    }
    
    return invoiceId;
  }

  static async DeleteInvoice(InvoiceId) {
    await prisma.invoice.delete({
      where: { invoiceId: InvoiceId },
    });
    return { message: 'Invoice deleted successfully' };
  }
}
