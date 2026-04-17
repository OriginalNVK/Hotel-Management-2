import prisma from '../database/ConnectSQL.mjs';

// RoomType: {Type, Price, Max_Customer, Min_Customer_for_Surcharge, Surcharge}

export default class RoomTypeModel {
  static async getAllRoomTypes() {
    const roomTypes = await prisma.roomType.findMany();
    return roomTypes.map((rt) => ({
      Type: rt.type,
      Price: rt.price,
      Max_Occupancy: rt.maxOccupancy,
      Min_Customer_for_Surcharge: rt.minCustomerForSurcharge,
      Surcharge_Rate: rt.surchargeRate,
    }));
  }

  static async getRoomTypeInfo(Type) {
    const roomType = await prisma.roomType.findUnique({
      where: { type: Type },
    });
    return roomType;
  }

  //if you want to use this method, you need passing an object as an argument
  // ex {"Type": 'A', "Price": 100, "Max_Customer": 3, "Min_Customer_for_Surcharge": 3, "Surcharge": 0.25}
  static async CreateRoomType(
    Type,
    Price,
    Max_Customer = 3,
    Min_Customer_for_Surcharge = 3,
    Surcharge = 0.25
  ) {
    try {
      await prisma.roomType.create({
        data: {
          type: Type,
          price: Price,
          maxOccupancy: Max_Customer,
          minCustomerForSurcharge: Min_Customer_for_Surcharge,
          surchargeRate: Surcharge,
        },
      });
      return {
        message: 'RoomType created successfully',
      };
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  static async UpdateRoomType(
    Type,
    Price = null,
    Max_Customer = null,
    Min_Customer_for_Surcharge = null,
    Surcharge = null
  ) {
    try {
      const updateData = {};
      if (Price !== null) {
        updateData.price = Price;
      }
      if (Max_Customer !== null) {
        updateData.maxOccupancy = Max_Customer;
      }
      if (Min_Customer_for_Surcharge !== null) {
        updateData.minCustomerForSurcharge = Min_Customer_for_Surcharge;
      }
      if (Surcharge !== null) {
        updateData.surchargeRate = Surcharge;
      }
      if (Object.keys(updateData).length === 0) {
        throw new Error('No fields to update');
      }

      await prisma.roomType.update({
        where: { type: Type },
        data: updateData,
      });
      return {
        message: 'Update success',
      };
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  static async DeleteRoomType(Type) {
    try {
      await prisma.roomType.delete({
        where: { type: Type },
      });
      return {
        message: 'Delete success',
      };
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
}
