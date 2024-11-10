const Order = require("../../models/orderSchema")

const getSalesReport = async (req, res) => {
    try {

        res.render("salesReport", {
             overallSalesCount : 0 ,
             overallOrderAmount : 0,
             overallDiscount : 0
            });
    } catch (error) {
        console.error(error);
        res.redirect("/admin/pageerror");
    }
};

const generateSalesReport = async (req, res) => {
    console.log("req received");

    try {
        const { startDate, endDate, filter } = req.body;
        console.log("Received Dates:", startDate, endDate, filter);

        let query = {};
        const now = new Date();

        if (filter) {
            let filterDate;
            switch (filter) {
                case '1 Day':
                    filterDate = new Date(now.setDate(now.getDate() - 1));
                    break;
                case '1 Week':
                    filterDate = new Date(now.setDate(now.getDate() - 7));
                    break;
                case '1 Month':
                    filterDate = new Date(now.setMonth(now.getMonth() - 1));
                    break;
                case '1 Year':
                    filterDate = new Date(now.setFullYear(now.getFullYear() - 1));
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

        console.log("Query Object:", query);

        const orders = await Order.find(query)
            .populate("user", "name")
            .populate("orderedItems.product", "name")
            .exec();
        console.log("Orders Retrieved:", orders);

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
                orders
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
                orders: []
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
        const { overallSalesCount, overallOrderAmount, overallDiscount, orders } = req.session.salesReportData || {};

        if (overallSalesCount === undefined || overallOrderAmount === undefined || overallDiscount === undefined || orders === undefined) {
            return res.redirect('/admin/pageerror');
        }

        res.render("salesReportDownload", {
            overallSalesCount,
            overallOrderAmount,
            overallDiscount,
            orders
        });
    } catch (error) {
        res.redirect("/admin/pageerror");
        console.error("Internal server error", error);
    }
};

module.exports = {
    getSalesReport,
    generateSalesReport,
    salesReportDownload
}