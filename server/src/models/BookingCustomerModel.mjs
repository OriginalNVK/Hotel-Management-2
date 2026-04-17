import prisma from '../database/ConnectSQL.mjs';

// BookingCustomers: {BookingId, CustomerId}

export default class BookingCustomerModel {
  static async getAllBookingCustomers() {
    const bookingCustomers = await prisma.bookingCustomer.findMany();
    return bookingCustomers;
  }

  static async CreateBookingCustomer(BookingId, CustomerId) {
    await prisma.bookingCustomer.create({
      data: {
        bookingId: BookingId,
        customerId: CustomerId,
      },
    });
    return {
      message: 'BookingCustomer created successfully',
    };
  }

  static async UpdateBookingCustomer(
    BookingId,
    CustomerId,
    NewBookingId = null,
    NewCustomerId = null
  ) {
    try {
      const updateData = {};
      if (NewBookingId !== null) {
        updateData.bookingId = NewBookingId;
      }
      if (NewCustomerId !== null) {
        updateData.customerId = NewCustomerId;
      }
      if (Object.keys(updateData).length === 0) {
        throw new Error('No fields to update');
      }

      await prisma.bookingCustomer.update({
        where: {
          bookingId_customerId: {
            bookingId: BookingId,
            customerId: CustomerId,
          },
        },
        data: updateData,
      });
      
      return await prisma.bookingCustomer.findUnique({
        where: {
          bookingId_customerId: {
            bookingId: NewBookingId ?? BookingId,
            customerId: NewCustomerId ?? CustomerId,
          },
        },
      });
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  static async DeleteBookingCustomer(BookingId, CustomerId) {
    await prisma.bookingCustomer.delete({
      where: {
        bookingId_customerId: {
          bookingId: BookingId,
          customerId: CustomerId,
        },
      },
    });
    return { message: 'BookingCustomer deleted successfully' };
  }

  static async getCustomersInBooking(BookingId) {
    // Convert BookingId to integer since it comes as a query parameter string
    const bookingIdInt = Number.parseInt(BookingId, 10);
    if (Number.isNaN(bookingIdInt)) {
      return [];
    }
    const customers = await prisma.bookingCustomer.findMany({
      where: { bookingId: bookingIdInt },
      include: { customer: true },
    });
    return customers.map((bc) => ({
      CustomerId: bc.customer.customerId,
      Name: bc.customer.name,
      Address: bc.customer.address,
      IdentityCard: bc.customer.identityCard,
      Type: bc.customer.type,
    }));
  }
}
