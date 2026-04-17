import prisma from '../database/ConnectSQL.mjs';

// CustomerType: {Type, Name, Coefficient}

export default class CustomerTypeModel {
  static async getAllCustomerTypes() {
    const customerTypes = await prisma.customerType.findMany();
    return customerTypes.map((ct) => ({
      Type: ct.type,
      Name: ct.name,
      Coefficient: ct.coefficient,
    }));
  }

  static async getCustomerTypeInfo(Type) {
    const customerType = await prisma.customerType.findUnique({
      where: { type: Type },
    });
    return customerType;
  }

  static async CreateCustomerType(Name, Coefficient) {
    await prisma.customerType.create({
      data: {
        name: Name,
        coefficient: Coefficient,
      },
    });
    return {
      message: 'CustomerType created successfully',
    };
  }

  static async UpdateCustomerType(Type, Name = null, Coefficient = null) {
    try {
      const updateData = {};
      if (Name !== null) {
        updateData.name = Name;
      }
      if (Coefficient !== null) {
        updateData.coefficient = Coefficient;
      }
      if (Object.keys(updateData).length === 0) {
        throw new Error('No fields to update');
      }

      await prisma.customerType.update({
        where: { type: Type },
        data: updateData,
      });
      return {
        message: 'CustomerType updated successfully',
      };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  static async DeleteCustomerType(Type) {
    await prisma.customerType.delete({
      where: { type: Type },
    });
    return {
      message: 'CustomerType deleted successfully',
    };
  }
}
