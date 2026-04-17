import prisma from '../database/ConnectSQL.mjs';

// Booking: {BookingId, BookingDate, RoomId, InvoiceId, Cost}

export default class BookingModel {
  static async getAllBookings() {
    const bookings = await prisma.booking.findMany();
    return bookings;
  }

  static async getBookingInfo(BookingId) {
    const booking = await prisma.booking.findUnique({
      where: { bookingId: BookingId },
    });
    return booking;
  }

  static async createBooking(BookingDate, RoomId) {
    try {
      await prisma.booking.create({
        data: {
          bookingDate: new Date(BookingDate),
          roomId: RoomId,
        },
      });

      return {
        message: 'Booking created successfully',
      };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  static async updateBooking(
    BookingId,
    BookingDate = null,
    RoomId = null,
    InvoiceId = null,
    Cost = null
  ) {
    try {
      const updateData = {};
      if (BookingDate !== null) {
        updateData.bookingDate = new Date(BookingDate);
      }
      if (RoomId !== null) {
        updateData.roomId = RoomId;
      }
      if (InvoiceId !== null) {
        updateData.invoiceId = InvoiceId;
      }
      if (Cost !== null) {
        updateData.cost = Cost;
      }
      
      await prisma.booking.update({
        where: { bookingId: BookingId },
        data: updateData,
      });
      
      return {
        message: 'Booking updated successfully',
        rowsAffected: [1],
      };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  static async DeleteBooking(BookingId) {
    try {
      await prisma.booking.delete({
        where: { bookingId: BookingId },
      });
      return {
        message: 'Booking deleted successfully',
      };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  static async getTheNewestBookingId() {
    const booking = await prisma.booking.findFirst({
      orderBy: { bookingId: 'desc' },
      select: { bookingId: true },
    });
    return booking ? [booking] : [];
  }

  static async getAllBookingUnpaid() {
    const bookings = await prisma.booking.findMany({
      where: { cost: null },
      include: {
        room: {
          include: {
            roomType: {
              select: { price: true },
            },
          },
        },
      },
    });

    return bookings.map(b => ({
      BookingId: b.bookingId,
      RoomNumber: b.roomId,
      BookingDate: b.bookingDate,
      Nights: Math.max(
        1,
        Math.floor((Date.now() - b.bookingDate.getTime()) / (1000 * 60 * 60 * 24))
      ),
      Price: b.room.roomType.price,
    }));
  }

  static async CalcCost(bookingId) {
    const bookingIdInt = Number.parseInt(bookingId, 10);
    if (Number.isNaN(bookingIdInt)) return 0;

    try {
      const rows = await prisma.$queryRaw`
        SELECT calc_cost_of_booking(${bookingIdInt}) AS cost
      `;
      const dbCost = Number(rows?.[0]?.cost ?? 0);
      if (!Number.isNaN(dbCost)) {
        return dbCost;
      }
    } catch {
      // Fallback to application-level calculation if DB function is not installed yet.
    }

    const booking = await prisma.booking.findUnique({
      where: { bookingId: bookingIdInt },
      include: {
        room: {
          include: {
            roomType: true,
          },
        },
        bookingCustomers: {
          include: {
            customer: {
              include: {
                customerType: true,
              },
            },
          },
        },
      },
    });

    if (!booking) return 0;

    const nights = Math.max(
      1,
      Math.floor((Date.now() - booking.bookingDate.getTime()) / (1000 * 60 * 60 * 24))
    );

    const numberCustomer = booking.bookingCustomers.length;
    const maxCoefficient = Math.max(
      ...booking.bookingCustomers.map((bc) => Number(bc.customer?.customerType?.coefficient ?? 1)),
      1
    );

    const minCustomerForSurcharge = Number(booking.room.roomType.minCustomerForSurcharge ?? 0);
    const price = Number(booking.room.roomType.price ?? 0);
    const surchargeRate = Number(booking.room.roomType.surchargeRate ?? 0);

    let cost = price * nights * maxCoefficient;
    const extraCustomers = numberCustomer - minCustomerForSurcharge;
    if (extraCustomers > 0) {
      cost = cost * (1 + surchargeRate * extraCustomers);
    }

    return cost;
  }
}
