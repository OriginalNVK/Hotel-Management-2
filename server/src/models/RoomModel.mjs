import prisma from "../database/ConnectSQL.mjs";

//Room: {RoomId, Type, IsAvailable, Description}

export default class RoomModel {
  static async getAllRooms() {
    const rooms = await prisma.room.findMany({
      select: {
        roomId: true,
        type: true,
        isAvailable: true,
        description: true,
        imgUrl: true,
      },
    });
    return rooms.map(r => ({
      Number: r.roomId,
      Type: r.type,
      IsAvailable: r.isAvailable,
      Description: r.description,
      ImgUrl: r.imgUrl,
    }));
  }

  static async getRoomById(id) {
    const roomIdInt = Number.parseInt(id, 10);
    if (Number.isNaN(roomIdInt)) {
      return null;
    }
    const room = await prisma.room.findUnique({
      where: { roomId: roomIdInt },
      select: {
        roomId: true,
        type: true,
        isAvailable: true,
        description: true,
        imgUrl: true,
      },
    });
    return room ? {
      Number: room.roomId,
      Type: room.type,
      IsAvailable: room.isAvailable,
      Description: room.description,
      ImgUrl: room.imgUrl,
    } : null;
  }

  static async getRoomByType(Type) {
    const rooms = await prisma.room.findMany({
      where: { type: Type },
    });
    return rooms;
  }

  static async getRoomByStatus(IsAvailable) {
    const rooms = await prisma.room.findMany({
      where: { isAvailable: IsAvailable },
      include: {
        roomType: {
          select: {
            type: true,
            maxOccupancy: true,
            minCustomerForSurcharge: true,
            price: true,
            surchargeRate: true,
          },
        },
      },
    });
    return rooms.map(r => ({
      Number: r.roomId,
      Type: r.type,
      MaxOccupancy: r.roomType.maxOccupancy,
      BaseCustomers: r.roomType.minCustomerForSurcharge,
      Price: r.roomType.price,
      ImgUrl: r.imgUrl,
      SurchargeRate: r.roomType.surchargeRate,
    }));
  }

  static async getRoomByTypeAndStatus(Type, IsAvailable) {
    const rooms = await prisma.room.findMany({
      where: {
        type: Type,
        isAvailable: IsAvailable,
      },
    });
    return rooms;
  }

  static async createRoom(
    RoomId,
    Type,
    IsAvailable = true,
    Description = null,
    ImgUrl = null
  ) {
    try {
      const roomIdInt = Number.parseInt(RoomId, 10);
      if (Number.isNaN(roomIdInt)) {
        throw new TypeError('RoomId must be a valid number');
      }
      await prisma.room.create({
        data: {
          roomId: roomIdInt,
          type: Type,
          isAvailable: IsAvailable,
          description: Description,
          imgUrl: ImgUrl,
        },
      });
      return {
        message: 'Room created successfully',
        rowsAffected: [1],
      };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  static async updateRoom(
    RoomId,
    Type = null,
    IsAvailable = null,
    Description = null,
    ImgUrl = null
  ) {
    try {
      const roomIdInt = Number.parseInt(RoomId, 10);
      if (RoomId == null || Number.isNaN(roomIdInt)) {
        return {
          message: 'RoomId is required and must be a valid number',
          code: 400,
        };
      }
      const updateData = {};
      if (Type !== null) {
        updateData.type = Type;
      }
      if (IsAvailable !== null) {
        updateData.isAvailable = IsAvailable;
      }
      if (Description !== null) {
        updateData.description = Description;
      }
      if (ImgUrl !== null) {
        updateData.imgUrl = ImgUrl;
      }

      await prisma.room.update({
        where: { roomId: roomIdInt },
        data: updateData,
      });

      return {
        message: 'Room updated successfully',
        code: 200,
      };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  static async deleteRoom(RoomId) {
    try {
      const roomIdInt = Number.parseInt(RoomId, 10);
      if (Number.isNaN(roomIdInt)) {
        throw new TypeError('RoomId must be a valid number');
      }
      await prisma.room.delete({
        where: { roomId: roomIdInt },
      });
      return {
        message: 'Room deleted successfully',
        rowsAffected: [1],
      };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  static async getTypeInfoOfRoom(RoomId) {
    // Convert RoomId to integer since it comes as a query parameter string
    const roomIdInt = Number.parseInt(RoomId, 10);
    if (Number.isNaN(roomIdInt)) {
      return [];
    }
    const room = await prisma.room.findUnique({
      where: { roomId: roomIdInt },
      include: { roomType: true },
    });
    if (!room?.roomType) return [];
    const rt = room.roomType;
    return [
      {
        Type: rt.type,
        Price: rt.price,
        Max_Occupancy: rt.maxOccupancy,
        Min_Customer_for_Surcharge: rt.minCustomerForSurcharge,
        Surcharge_Rate: rt.surchargeRate,
      },
    ];
  }
}
