import prisma from "../database/ConnectSQL.mjs";

export default class ReportModel {
  static async getAllReportOverview() {
    const reports = await prisma.revenueReport.findMany({
      include: {
        revenueReportHasRoomTypes: true,
      },
    });

    // Combine with occupancy data
    const occupancies = await prisma.occupancy.findMany();

    return reports.map(report => {
      const occupancy = occupancies.find(
        o => o.month === report.month && o.year === report.year
      );
      return {
        Month: report.month,
        Year: report.year,
        TotalRevenue: report.totalRevenue,
        TotalRentalDay: occupancy?.totalRentalDay || 0,
      };
    });
  }

  static async getRevenueReport(month, year) {
    // Convert month and year to integers
    const monthInt = Number.parseInt(month, 10);
    const yearInt = Number.parseInt(year, 10);
    
    if (Number.isNaN(monthInt) || Number.isNaN(yearInt)) {
      return {
        TotalRevenue: 0,
        Details: [],
      };
    }
    
    const revenueReport = await prisma.revenueReport.findUnique({
      where: {
        month_year: {
          month: monthInt,
          year: yearInt,
        },
      },
      include: {
        revenueReportHasRoomTypes: true,
      },
    });

    return {
      TotalRevenue: revenueReport?.totalRevenue || 0,
      Details: (revenueReport?.revenueReportHasRoomTypes || []).map((item) => ({
        Type: item.type,
        Revenue: item.revenue,
      })),
    };
  }

  static async getOccupancyReport(month, year) {
    // Convert month and year to integers
    const monthInt = Number.parseInt(month, 10);
    const yearInt = Number.parseInt(year, 10);
    
    if (Number.isNaN(monthInt) || Number.isNaN(yearInt)) {
      return {
        TotalRentalDay: 0,
        Details: [],
      };
    }
    
    const occupancy = await prisma.occupancy.findUnique({
      where: {
        month_year: {
          month: monthInt,
          year: yearInt,
        },
      },
      include: {
        occupancyHasRooms: true,
      },
    });

    return {
      TotalRentalDay: occupancy?.totalRentalDay || 0,
      Details: (occupancy?.occupancyHasRooms || []).map((item) => ({
        RoomID: item.roomId,
        RentalDays: item.rentalDays,
      })),
    };
  }
}