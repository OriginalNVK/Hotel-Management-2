import prisma from '../database/ConnectSQL.mjs';

// Customer: {CustomerId, Name, IdentityCard, Address, Type}

export default class CustomerModel {
  static async getAllCustomers() {
    const customers = await prisma.customer.findMany();
    return customers;
  }

  static async getCustomerInfo(CustomerId) {
    const customer = await prisma.customer.findUnique({
      where: { customerId: CustomerId },
    });
    return customer;
  }

  static async CreateCustomer(Name, IdentityCard, Address, Type = 1) {
    // Convert Type to integer since it comes from form data as a string
    const typeInt = Number.isNaN(Number.parseInt(Type, 10)) ? 1 : Number.parseInt(Type, 10);
    await prisma.customer.create({
      data: {
        name: Name,
        identityCard: IdentityCard,
        address: Address,
        type: typeInt,
      },
    });
    return {
      message: 'Customer created successfully',
    };
  }

  static async UpdateCustomer(
    CustomerId,
    Name = null,
    IdentityCard = null,
    Address = null,
    Type = null
  ) {
    try {
      const updateData = {};
      if (Name !== null) {
        updateData.name = Name;
      }
      if (IdentityCard !== null) {
        updateData.identityCard = IdentityCard;
      }
      if (Address !== null) {
        updateData.address = Address;
      }
      if (Type !== null) {
        updateData.type = Type;
      }
      if (Object.keys(updateData).length === 0) {
        throw new Error('No fields to update');
      }

      await prisma.customer.update({
        where: { customerId: CustomerId },
        data: updateData,
      });
      
      return await prisma.customer.findUnique({
        where: { customerId: CustomerId },
      });
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  static async DeleteCustomer(CustomerId) {
    await prisma.customer.delete({
      where: { customerId: CustomerId },
    });
    return { message: 'Customer deleted successfully' };
  }

  static async getCustomerIdByIdentityCard(IdentityCard) {
    const customer = await prisma.customer.findFirst({
      where: { identityCard: IdentityCard },
      select: { customerId: true },
    });
    return customer ? [customer] : [];
  }
}
