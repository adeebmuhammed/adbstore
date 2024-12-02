const Order = require("../../models/orderSchema")

const getSalesReport = async (req, res) => {
    try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1); 
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0); 

        const query = { createdOn: { $gte: startOfMonth, $lte: endOfMonth } };

        const orders = await Order.find(query).populate("user", "name").populate("orderedItems.product", "name").exec();

        if (orders.length > 0) {
            const overallSalesCount = orders.length;
            const overallOrderAmount = orders.reduce((total, order) => total + order.totalprice, 0);
            const overallDiscount = orders.reduce((total, order) => total + order.discount, 0);

            res.render("salesReportDownload", {
                overallSalesCount,
                overallOrderAmount,
                overallDiscount,
                orders,
                startDate: startOfMonth.toISOString().split("T")[0], 
                endDate: endOfMonth.toISOString().split("T")[0],
                filter:null
            });
        } else {
            console.log("No orders found for the current month.");

            res.render("salesReportDownload", {
                overallSalesCount: 0,
                overallOrderAmount: 0,
                overallDiscount: 0,
                orders: [],
                startDate: startOfMonth.toISOString().split("T")[0],
                endDate: endOfMonth.toISOString().split("T")[0],
                filter:null
            });
        }
    } catch (error) {
        console.error(error);
        res.redirect("/admin/pageerror");
    }
};

const generateSalesReport = async (req, res) => {
    try {
        const { startDate, endDate, filter } = req.body;

        let query = {};
        const now = new Date();

        if (filter) {
            let filterDate;
            switch (filter) {
                case '1 Day':
                    filterDate = new Date(now);
                    filterDate.setDate(now.getDate() - 1);
                    break;
                case '1 Week':
                    filterDate = new Date(now);
                    filterDate.setDate(now.getDate() - 7);
                    break;
                case '1 Month':
                    filterDate = new Date(now);
                    filterDate.setMonth(now.getMonth() - 1);
                    break;
                case '1 Year':
                    filterDate = new Date(now);
                    filterDate.setFullYear(now.getFullYear() - 1);
                    break;
                default:
                    return res.status(400).json({ error: 'Invalid filter' });
            }
            query.createdOn = { $gte: filterDate };
        } else if (startDate && endDate) {
            query.createdOn = {
                $gte: new Date(startDate),
                $lte: new Date(endDate),
            };
        } else {
            return res.status(400).json({ error: 'Please provide either a filter or a valid date range' });
        }

        const orders = await Order.find(query).populate("user", "name").populate("orderedItems.product", "name").exec();

        if (orders.length > 0) {
            const overallSalesCount = orders.length;
            const overallOrderAmount = orders.reduce((total, order) => total + order.totalprice, 0);
            const overallDiscount = orders.reduce((total, order) => total + order.discount, 0);
            const finalAmount = orders.reduce((total, order) => total + order.finalAmount, 0);
            const couponDeductions = orders.filter(order => order.couponApplied).length;

            req.session.salesReportData = {
                overallSalesCount,
                overallOrderAmount,
                overallDiscount,
                orders,
                filter: filter || null, // Store filter
                startDate: startDate || null, // Store startDate
                endDate: endDate || null // Store endDate
            };

            return res.json({
                redirectUrl: '/admin/salesReportDownload',
                overallSalesCount,
                overallOrderAmount,
                overallDiscount,
                orders
            });
        } else {
            console.log("No orders found for the given criteria.");

            req.session.salesReportData = {
                overallSalesCount: 0,
                overallOrderAmount: 0,
                overallDiscount: 0,
                orders: [],
                filter: filter || null, // Store filter
                startDate: startDate || null, // Store startDate
                endDate: endDate || null // Store endDate
            };

            return res.json({
                redirectUrl: '/admin/salesReportDownload'
            });
        }
    } catch (error) {
        console.error("Error generating sales report:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};


const salesReportDownload = async (req, res) => {
    try {
        const { overallSalesCount, overallOrderAmount, overallDiscount, orders, filter, startDate, endDate } =
            req.session.salesReportData || {};

        if (!orders || overallSalesCount === undefined || overallOrderAmount === undefined || overallDiscount === undefined) {
            return res.redirect('/admin/pageerror');
        }

        res.render("salesReportDownload", {
            overallSalesCount,
            overallOrderAmount,
            overallDiscount,
            orders,
            filter,
            startDate,
            endDate
        });
    } catch (error) {
        console.error("Internal server error", error);
        res.redirect("/admin/pageerror");
    }
};


module.exports = {
    getSalesReport,
    generateSalesReport,
    salesReportDownload
}