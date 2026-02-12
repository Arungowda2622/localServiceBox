import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { sendDriverNotification } from "./utils/sendDriverNotification";
import "./firebase";

/*********************************
 🚕 RIDE BOOKINGS
**********************************/
export const notifyDriversOnRideBooking = onDocumentCreated(
  "bookings/{bookingId}",
  async (event) => {
    const booking = event.data?.data();
    if (!booking) return;

    await sendDriverNotification(
      "🚕 New Ride Booking",
      "A new ride is waiting for drivers",
      {
        type: "booking",
        bookingId: event.params.bookingId,
      }
    );
  }
);


/*********************************
 📦 BOX DELIVERY
**********************************/
export const notifyDriversOnBoxDelivery = onDocumentCreated(
  "boxDelivery/{boxId}",
  async (event) => {
    if (!event.data) return;

    await sendDriverNotification(
      "📦 New Box Delivery",
      "A new box delivery request is available",
      {
        type: "box",
        boxId: event.params.boxId,
      }
    );
  }
);


/*********************************
 🛒 ORDERS
**********************************/
export const notifyDriversOnOrder = onDocumentCreated(
  "orders/{orderId}",
  async (event) => {
    const order = event.data?.data();
    if (!order) return;

    await sendDriverNotification(
      "🛒 New Order Available",
      `Order worth ₹${order.total}`,
      {
        type: "order",
        orderId: event.params.orderId,
      }
    );
  }
);
