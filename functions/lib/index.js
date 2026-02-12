"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.notifyDriversOnOrder = exports.notifyDriversOnBoxDelivery = exports.notifyDriversOnRideBooking = void 0;
const firestore_1 = require("firebase-functions/v2/firestore");
const admin = __importStar(require("firebase-admin"));
const sendDriverNotification_1 = require("./utils/sendDriverNotification");
require("./firebase");
admin.initializeApp();
/*********************************
 🚕 RIDE BOOKINGS
**********************************/
exports.notifyDriversOnRideBooking = (0, firestore_1.onDocumentCreated)("bookings/{bookingId}", async (event) => {
    const booking = event.data?.data();
    if (!booking)
        return;
    await (0, sendDriverNotification_1.sendDriverNotification)("🚕 New Ride Booking", "A new ride is waiting for drivers", {
        type: "booking",
        bookingId: event.params.bookingId,
    });
});
/*********************************
 📦 BOX DELIVERY
**********************************/
exports.notifyDriversOnBoxDelivery = (0, firestore_1.onDocumentCreated)("boxDelivery/{boxId}", async (event) => {
    if (!event.data)
        return;
    await (0, sendDriverNotification_1.sendDriverNotification)("📦 New Box Delivery", "A new box delivery request is available", {
        type: "box",
        boxId: event.params.boxId,
    });
});
/*********************************
 🛒 ORDERS
**********************************/
exports.notifyDriversOnOrder = (0, firestore_1.onDocumentCreated)("orders/{orderId}", async (event) => {
    const order = event.data?.data();
    if (!order)
        return;
    await (0, sendDriverNotification_1.sendDriverNotification)("🛒 New Order Available", `Order worth ₹${order.total}`, {
        type: "order",
        orderId: event.params.orderId,
    });
});
